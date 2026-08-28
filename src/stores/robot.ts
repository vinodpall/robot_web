import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  PoseUpdateData,
  CmdStatusData,
  TrackInfoData,
  AlertData,
  MappingProgressData,
  MsfStatusData,
  LocStatusData,
  MultiTaskStatusData,
  TaskStatusData,
  TaskProgressData,
  DogUdpData,
  RcsData,
  MotionStateData,
  BatteryData,
  SensorStatusData,
  SensorData,
  SystemTelemetryData,
  TerrainModeData,
  BodyHeightStateData,
  SystemStatusData,
  SpeedStatusData,
  LatencyStatusData,
  GpsMessageData,
  StopStateData,
  CarTemperatureData,
  CarMotorInfoData,
  SlamGridMapData,
} from '../composables/useRobotWebSocket'
import {
  type InsOriginCoordinates,
  checkAndFetchInsOrigin,
  getInsOriginFromCache,
  setInsOriginToCache,
  clearInsOriginCache
} from '../utils/insOrigin'

export const useRobotStore = defineStore('robot', () => {
  // ===== 在线状态 =====
  const isOnline = ref(false)

  // ===== 位姿 =====
  const pose = ref<PoseUpdateData | null>(null)

  // ===== INS 原点坐标缓存 =====
  const insOriginCoordinates = ref<InsOriginCoordinates | null>(null)

  // ===== 任务状态 =====
  const cmdStatus = ref<CmdStatusData | null>(null)

  // ===== 循迹状态 =====
  const trackInfo = ref<TrackInfoData | null>(null)

  // ===== 报警队列（最多保留50条） =====
  const alerts = ref<AlertData[]>([])

  // ===== 建图进度 =====
  const mappingProgress = ref<MappingProgressData | null>(null)

  // ===== 融合定位状态 =====
  const msfStatus = ref<MsfStatusData | null>(null)
  const locStatus = ref<LocStatusData | null>(null)
  const sensorStatus = ref<SensorStatusData | null>(null)

  // ===== 传感器最后收到有效数据的时间戳（毫秒），用于防抖与超时保持 =====
  const lastLidarActiveTime = ref(0)
  const lastImuActiveTime = ref(0)
  const lastGpsActiveTime = ref(0)

  // ===== 机器狗 UDP 原始消息（最新一条） =====
  const latestDogUdpMessage = ref<DogUdpData | null>(null)

  // ===== 0x1008 运行状态 =====
  const rcsData = ref<RcsData | null>(null)

  // ===== 0x1009 运动状态 =====
  const motionState = ref<MotionStateData | null>(null)

  // ===== 0x21050f0a 电池数据 =====
  const batteryData = ref<BatteryData | null>(null)

  // ===== 0x3100EE01 地形模式 =====
  const terrainMode = ref<TerrainModeData | null>(null)

  // ===== 0x11050f08 机身高度/姿态 =====
  const bodyHeightState = ref<BodyHeightStateData | null>(null)

  // ===== 0x100a 传感器帧（IMU + 关节） =====
  const sensorData = ref<SensorData | null>(null)
  const systemTelemetry = ref<SystemTelemetryData | null>(null)
  const systemStatus = ref<SystemStatusData | null>(null)
  const speedStatus = ref<SpeedStatusData | null>(null)
  const latencyStatus = ref<LatencyStatusData | null>(null)
  const gpsMessage = ref<GpsMessageData | null>(null)
  const stopState = ref<StopStateData | null>(null)
  const carTemperature = ref<CarTemperatureData | null>(null)
  const carMotorInfo = ref<CarMotorInfoData | null>(null)

  // ===== task_status 发布点任务运行状态 =====
  const taskStatus = ref<TaskStatusData | null>(null)
  const taskProgress = ref<TaskProgressData | null>(null)

  // ===== multitask_status 多任务组运行状态 =====
  const multitaskStatus = ref<MultiTaskStatusData | null>(null)

  // ===== 实时2D激光雷达扫描数据 =====
  const currentScan = ref<{ timestamp: number; data: [number, number][] } | null>(null)

  // ===== 实时建图2D栅格图数据 =====
  const slamGridMapData = ref<SlamGridMapData | null>(null)

  // ===== 实时建图机器人位姿（slam_pose_update） =====
  const slamPoseData = ref<{ x: number; y: number; z?: number; theta: number; frame_id?: string; timestamp?: number } | null>(null)

  // ===== 停障避障报警（遇到障碍物连续5次） =====
  const globalObstacleAlertActive = ref(false)
  let consecutiveObstacleCount = 0


  // ===== 实时传感器数据 =====
  const realtimeSensorValues = ref<Record<string, number>>({})
  const realtimeSensorUnits = ref<Record<string, string>>({})

  // ===== 算法画框实时数据（vision_real_time） =====
  const visionRealTimeMap = ref<Record<string, { cam_key: string; robot_id: string; filtered?: boolean; data: any; timestamp: number }>>({})

  // ===== mutations =====

  const setVisionRealTimeData = (payload: any) => {
    if (!payload || !payload.cam_key) return
    const camKey = String(payload.cam_key).trim()
    visionRealTimeMap.value[camKey] = {
      cam_key: camKey,
      robot_id: String(payload.robot_id || ''),
      filtered: Boolean(payload.filtered),
      data: payload.data || {},
      timestamp: Date.now()
    }
  }

  const setOnlineStatus = (online: boolean) => {
    isOnline.value = online
  }

  const setPose = (data: PoseUpdateData) => {
    if (!data) return
    // 如果 INS 处于启动状态且 gpsMessage 中包含有效的 heading，优先使用 gpsMessage 的 heading
    const isIns = cmdStatus.value?.ins === 1
    const gpsHeading = gpsMessage.value?.heading
    if (isIns && gpsHeading !== undefined && gpsHeading !== null && gpsHeading !== '') {
      const h = Number(gpsHeading)
      if (Number.isFinite(h)) {
        pose.value = { ...data, theta: h }
        return
      }
    }
    pose.value = data
  }

  const setCmdStatus = (data: CmdStatusData) => {
    if (!cmdStatus.value) {
      cmdStatus.value = data
    } else {
      cmdStatus.value = { ...cmdStatus.value, ...Object.fromEntries(Object.entries(data as Record<string, any>).filter(([, v]) => v !== undefined)) } as CmdStatusData
    }

    // 检查是否遇到障碍物（app_nav_stop 的 result 连续5次为 1）
    if (data.app_nav_stop !== undefined && data.app_nav_stop !== null) {
      const resultVal = Number(data.app_nav_stop.result)
      if (resultVal === 1) {
        consecutiveObstacleCount++
        if (consecutiveObstacleCount >= 5) {
          globalObstacleAlertActive.value = true
        }
      } else {
        consecutiveObstacleCount = 0
        globalObstacleAlertActive.value = false
      }
    }

    // 如果 INS 处于启动状态，且缓存中没有原点坐标，则触发获取 INS 原点接口
    if (data.ins === 1) {
      const robotId = localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        void syncInsOrigin(robotId)
      }
    }
  }

  const syncInsOrigin = async (robotId?: string) => {
    const currentRobotId = robotId || localStorage.getItem('selected_robot_id') || ''
    if (!currentRobotId) return null
    const cached = getInsOriginFromCache(currentRobotId)
    if (cached) {
      insOriginCoordinates.value = cached
      return cached
    }
    if (cmdStatus.value?.ins === 1) {
      const coords = await checkAndFetchInsOrigin(currentRobotId)
      if (coords) {
        insOriginCoordinates.value = coords
      }
      return coords
    }
    return null
  }

  // 监听 INS 启动状态，若启动且无缓存则静默请求原点
  watch(
    () => cmdStatus.value?.ins === 1,
    (running) => {
      if (running) {
        const robotId = localStorage.getItem('selected_robot_id') || ''
        if (robotId) {
          void syncInsOrigin(robotId)
        }
      }
    },
    { immediate: true }
  )

  const setTrackInfo = (data: TrackInfoData) => {
    trackInfo.value = data
  }

  const pushAlert = (data: AlertData) => {
    alerts.value.unshift(data)
    if (alerts.value.length > 50) {
      alerts.value = alerts.value.slice(0, 50)
    }
  }

  const setMappingProgress = (data: MappingProgressData) => {
    mappingProgress.value = data
  }

  const setMsfStatus = (data: MsfStatusData) => {
    msfStatus.value = data
  }

  const setLocStatus = (data: LocStatusData) => {
    locStatus.value = data
  }

  const normalizeSensorFlag = (val: any): string => {
    if (val === true || val === 1 || val === '1' || val === 'true' || val === 'ok' || val === 'normal' || val === 'received' || val === '收到') {
      return '1'
    }
    return '0'
  }

  const setSensorStatus = (data: Partial<SensorStatusData> | any) => {
    if (!data) return
    let payload = data
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload)
      } catch {
        return
      }
    }
    if (typeof payload !== 'object') return

    const lidarVal = payload.lidar_msg ?? payload.lidar ?? payload.lidar_status ?? payload.laser_msg ?? payload.laser
    const imuVal = payload.imu_msg ?? payload.imu ?? payload.imu_status
    const gpsVal = payload.gps_msg ?? payload.gps ?? payload.gps_status ?? payload.satellite
    const chargeVal = payload.charge_msg ?? payload.charge ?? payload.charge_status

    const prev = sensorStatus.value || {
      charge_msg: '0',
      lidar_msg: '0',
      imu_msg: '0',
      gps_msg: '0'
    }

    const nextLidar = lidarVal !== undefined ? normalizeSensorFlag(lidarVal) : prev.lidar_msg
    const nextImu = imuVal !== undefined ? normalizeSensorFlag(imuVal) : prev.imu_msg
    const nextGps = gpsVal !== undefined ? normalizeSensorFlag(gpsVal) : prev.gps_msg
    const nextCharge = chargeVal !== undefined ? normalizeSensorFlag(chargeVal) : prev.charge_msg

    if (nextLidar === '1') {
      lastLidarActiveTime.value = Date.now()
    }
    if (nextImu === '1') {
      lastImuActiveTime.value = Date.now()
    }
    if (nextGps === '1') {
      lastGpsActiveTime.value = Date.now()
    }

    sensorStatus.value = {
      charge_msg: nextCharge,
      lidar_msg: nextLidar,
      imu_msg: nextImu,
      gps_msg: nextGps
    }
  }

  const setDogUdpMessage = (data: DogUdpData) => {
    latestDogUdpMessage.value = data
  }

  const setRcsData = (data: RcsData) => {
    rcsData.value = data
  }

  const setMotionState = (data: MotionStateData) => {
    if (!data) return
    motionState.value = data
  }

  const setBatteryData = (data: BatteryData) => {
    batteryData.value = data
  }

  const setTerrainMode = (data: TerrainModeData) => {
    terrainMode.value = data
  }

  const setBodyHeightState = (data: BodyHeightStateData) => {
    bodyHeightState.value = data
  }

  const setSensorData = (data: SensorData) => {
    if (!data?.imu_data) return
    sensorData.value = data
    lastImuActiveTime.value = Date.now()
  }

  const setSystemTelemetry = (data: SystemTelemetryData) => {
    if (!data) return
    systemTelemetry.value = data
  }

  const setSystemStatus = (data: SystemStatusData) => {
    if (!data) return
    systemStatus.value = data
  }

  const setSpeedStatus = (data: SpeedStatusData) => {
    if (!data) return
    speedStatus.value = data
  }

  const setLatencyStatus = (data: LatencyStatusData) => {
    if (!data) return
    latencyStatus.value = data
  }

  const setGpsMessage = (data: GpsMessageData) => {
    if (!data) return
    const normalized: GpsMessageData = (data && typeof data === 'object' && (data as any).msg) 
      ? { ...data, ...(data as any).msg } 
      : data
    gpsMessage.value = normalized
    lastGpsActiveTime.value = Date.now()

    // 如果包含 heading 字段（INS 下 GPS 坐标提供的朝向角度），同步设定无人车头部朝向角度
    if (normalized.heading !== undefined && normalized.heading !== null && normalized.heading !== '') {
      const h = Number(normalized.heading)
      if (Number.isFinite(h)) {
        if (!pose.value) {
          pose.value = { x: 0, y: 0, z: 0, theta: h }
        } else {
          pose.value = { ...pose.value, theta: h }
        }
      }
    }
  }

  const setStopState = (data: StopStateData) => {
    if (!data) return
    stopState.value = data
  }

  const setCarTemperature = (data: CarTemperatureData) => {
    if (!data) return
    carTemperature.value = data
  }

  const setCarMotorInfo = (data: CarMotorInfoData) => {
    if (!data) return
    carMotorInfo.value = data
  }

  const setTaskStatus = (data: TaskStatusData) => {
    taskStatus.value = data
  }

  const setTaskProgress = (data: TaskProgressData | null) => {
    taskProgress.value = data
  }

  const setMultitaskStatus = (data: MultiTaskStatusData) => {
    multitaskStatus.value = data
  }

  const setCurrentScan = (data: { timestamp: number; data: [number, number][] } | any) => {
    currentScan.value = data
    if (data && (Array.isArray(data.data) ? data.data.length > 0 : true)) {
      lastLidarActiveTime.value = Date.now()
    }
  }

  const setSlamGridMap = (data: SlamGridMapData) => {
    slamGridMapData.value = data
  }

  const clearSlamGridMap = () => {
    slamGridMapData.value = null
    slamPoseData.value = null
  }

  const setSlamPoseData = (data: { x: number; y: number; z?: number; theta: number; frame_id?: string; timestamp?: number }) => {
    slamPoseData.value = data
  }

  const setRealtimeSensorData = (payload: any) => {
    if (!payload || typeof payload !== 'object') return
    Object.keys(payload).forEach(key => {
      const item = payload[key]
      if (item && typeof item.value === 'number') {
        const lowerKey = key.toLowerCase()
        realtimeSensorValues.value[lowerKey] = item.value
        if (item.unit) {
          realtimeSensorUnits.value[lowerKey] = String(item.unit)
        }
      }
    })
  }

  const resetRuntimeState = () => {
    isOnline.value = false
    pose.value = null
    cmdStatus.value = null
    trackInfo.value = null
    alerts.value = []
    mappingProgress.value = null
    msfStatus.value = null
    locStatus.value = null
    sensorStatus.value = null
    lastLidarActiveTime.value = 0
    lastImuActiveTime.value = 0
    lastGpsActiveTime.value = 0
    latestDogUdpMessage.value = null
    rcsData.value = null
    motionState.value = null
    batteryData.value = null
    terrainMode.value = null
    bodyHeightState.value = null
    sensorData.value = null
    systemTelemetry.value = null
    taskStatus.value = null
    taskProgress.value = null
    multitaskStatus.value = null
    currentScan.value = null
    slamGridMapData.value = null
    slamPoseData.value = null
    realtimeSensorValues.value = {}
    realtimeSensorUnits.value = {}
    visionRealTimeMap.value = {}
    gpsMessage.value = null
    stopState.value = null
    carTemperature.value = null
    carMotorInfo.value = null
    insOriginCoordinates.value = null
    globalObstacleAlertActive.value = false
    consecutiveObstacleCount = 0
  }

  // ===== computed =====

  /** IMU Roll 角（度） */
  const imuRoll = computed(() => {
    const r = sensorData.value?.imu_data?.roll
    return r != null ? (r * 180 / Math.PI) : null
  })

  /** IMU Pitch 角（度） */
  const imuPitch = computed(() => {
    const p = sensorData.value?.imu_data?.pitch
    return p != null ? (p * 180 / Math.PI) : null
  })

  /** IMU Yaw 角（度），当 pose 不可用时作为角度回退来源 */
  const imuYaw = computed(() => {
    const y = sensorData.value?.imu_data?.yaw
    return y != null ? (y * 180 / Math.PI) : null
  })

  /** 地面加速度模长（去重力），可用于诊断时 */
  const imuHorizAccel = computed(() => {
    const d = sensorData.value?.imu_data
    if (!d) return null
    return Math.sqrt(d.acc_x ** 2 + d.acc_y ** 2)
  })

  const terrainModeLabelMap: Record<number, string> = {
    3: '实心地面',
    4: '镂空地面',
    5: '无踢面楼梯',
    18: '累积帧准备状态',
    20: '累积帧',
  }

  /** 地形模式文本（来自 0x3100EE01 terrain_mode 字段，缺失时回退 raw_value） */
  const terrainModeText = computed(() => {
    const state = terrainMode.value
    if (!state) return '--'

    const text = state.terrain_mode?.trim()
    if (text && text !== '--' && text !== '未知') {
      return text
    }

    return terrainModeLabelMap[state.raw_value] ?? '--'
  })

  /** 姿态文本（来自 0x11050f08 state 字段：正常/匍匐/未知） */
  const postureText = computed(() => bodyHeightState.value?.state ?? '--')

  /**
   * 当前速度（来自 0x1009 leg_odom_vel 三轴速度模长，单位 m/s）
   * leg_odom_vel = [vx, vy, vz]
   */
  const currentSpeed = computed(() => {
    const vel = motionState.value?.leg_odom_vel
    if (!vel || vel.length < 2) return null
    return Math.sqrt(vel[0] ** 2 + vel[1] ** 2 + (vel[2] ?? 0) ** 2)
  })

  /** 本次行走里程（来自 0x1008 current_mileage，单位 mm → m） */
  const currentMileage = computed(() => {
    if (rcsData.value?.current_mileage == null) return null
    return rcsData.value.current_mileage / 1000
  })

  /** 累计行走里程（来自 0x1008 total_mileage，单位 mm → m） */
  const totalMileage = computed(() => {
    if (rcsData.value?.total_mileage == null) return null
    return rcsData.value.total_mileage / 1000
  })

  /** 电量百分比（0x21050f0a battery_level 字段） */
  const batteryLevel = computed(() => batteryData.value?.battery_level ?? null)

  /** 电压（单位 V，原始值为 10mV 单位，需 /100） */
  const voltage = computed(() => batteryData.value?.voltage ?? null)

  /** 电流（返回原始数值，直接显示，单位A。即返回什么显示什么） */
  const current = computed(() => {
    if (batteryData.value?.current == null) return null
    return batteryData.value.current
  })

  /**
   * 机器狗基础状态文本（来自 0x1009 basic_state）
   * 与 Home.vue 中 robotStatusMap 保持一致
   */
  const robotStatusText = computed(() => {
    const s = motionState.value?.basic_state
    if (s == null) return '--'
    const map: Record<number, string> = {
      0: '趴下状态',
      1: '正在起立状态',
      2: '初始站立状态',
      3: '力控站立状态',
      4: '踏步状态',
      5: '正在趴下状态',
      6: '软急停/摔倒状态',
      16: 'RL状态',
    }
    return map[s] ?? '--'
  })

  /** 步态文本（来自 0x1009 gait_state） */
  const gaitText = computed(() => {
    const g = motionState.value?.gait_state
    if (g == null) return '--'
    const map: Record<number, string> = {
      0: '行走步态',
      1: '越障步态',
      2: '斜坡步态',
      3: '跑步步态',
      6: '楼梯步态',
      7: '楼梯步态（累积帧模式）',
      8: '45°楼梯步态（累积帧模式）',
      32: 'L行走步态',
      33: '山地步态',
      34: '静音步态',
    }
    return map[g] ?? `步态${g}`
  })

  /** 姿态文本（来自 0x1008 rcs_state，暂无具体含义，展示站立/匍匐需依赖其他字段） */
  const navModeText = computed(() => {
    const state = rcsData.value?.rcs_state
    if (!state) return '--'
    return state[0] === 1 ? '非手动模式' : '手动模式'
  })

  /** WiFi 故障告警（来自 0x1008 error_state.wifi_error） */
  const wifiError = computed(() => rcsData.value?.error_state.wifi_error ?? false)

  /** IMU 故障告警 */
  const imuError = computed(() => rcsData.value?.error_state.imu_error ?? false)

  /** 驱动器过热告警 */
  const driverHeatWarn = computed(() => rcsData.value?.error_state.driver_heat_warn ?? false)

  /** 电机过热告警 */
  const motorHeatWarn = computed(() => rcsData.value?.error_state.motor_heat_warn ?? false)

  /** 低电量告警 */
  const batteryLowWarn = computed(() => rcsData.value?.error_state.battery_low_warn ?? false)

  /** MSF 状态文本（来自 msf_status） */
  const msfStatusText = computed(() => msfStatus.value?.status_text ?? '--')

  /** MSF 是否正常（status===1） */
  const msfNormal = computed(() => msfStatus.value?.status === 1)

  /** 发布点任务是否运行中（来自 task_status.is_running） */
  const isPointTaskRunning = computed(() => taskStatus.value?.is_running === true)

  /** 循迹是否运行中（来自 cmd_status.track） */
  const isTracking = computed(() => cmdStatus.value?.track === 1)

  /** 导航是否运行中（来自 cmd_status.nav） */
  const isNavigating = computed(() => cmdStatus.value?.nav === 1)

  /** MSF 是否运行中（来自 cmd_status.msf） */
  const isMsfRunning = computed(() => cmdStatus.value?.msf === 1)

  /** INS 是否运行中（来自 cmd_status.ins） */
  const isInsRunning = computed(() => cmdStatus.value?.ins === 1)

  /** 充电是否运行中（来自 cmd_status.charge） */
  const isCharging = computed(() => cmdStatus.value?.charge === 1)

  /** 建图是否运行中（来自 cmd_status.slam） */
  const isSlam = computed(() => cmdStatus.value?.slam === 1)

  /** 当前有效的机器人头部朝向弧度（INS 模式下优先使用 gpsMessage.heading，否则使用 pose.theta） */
  const effectiveTheta = computed(() => {
    const isIns = cmdStatus.value?.ins === 1
    const gpsHeading = gpsMessage.value?.heading
    if (isIns && gpsHeading !== undefined && gpsHeading !== null && gpsHeading !== '') {
      const h = Number(gpsHeading)
      if (Number.isFinite(h)) return h
    }
    if (pose.value?.theta !== undefined && Number.isFinite(pose.value.theta)) {
      return pose.value.theta
    }
    if (gpsHeading !== undefined && gpsHeading !== null && gpsHeading !== '') {
      const h = Number(gpsHeading)
      if (Number.isFinite(h)) return h
    }
    return 0
  })

  /** 当前机器人头部朝向角度（度数） */
  const headingAngle = computed(() => {
    return effectiveTheta.value * (180 / Math.PI)
  })

  return {
    // state
    isOnline,
    pose,
    cmdStatus,
    trackInfo,
    alerts,
    mappingProgress,
    msfStatus,
    locStatus,
    sensorStatus,
    lastLidarActiveTime,
    lastImuActiveTime,
    lastGpsActiveTime,
    latestDogUdpMessage,
    rcsData,
    motionState,
    batteryData,
    terrainMode,
    bodyHeightState,
    sensorData,
    systemTelemetry,
    systemStatus,
    speedStatus,
    latencyStatus,
    gpsMessage,
    stopState,
    carTemperature,
    carMotorInfo,
    taskStatus,
    taskProgress,
    multitaskStatus,
    globalObstacleAlertActive,
    currentScan,
    slamGridMapData,
    slamPoseData,
    // mutations
    setOnlineStatus,
    setPose,
    setCmdStatus,
    setTrackInfo,
    pushAlert,
    setMappingProgress,
    setMsfStatus,
    setLocStatus,
    setSensorStatus,
    setDogUdpMessage,
    setRcsData,
    setMotionState,
    setBatteryData,
    setTerrainMode,
    setBodyHeightState,
    setSensorData,
    setSystemTelemetry,
    setSystemStatus,
    setSpeedStatus,
    setLatencyStatus,
    setGpsMessage,
    setStopState,
    setCarTemperature,
    setCarMotorInfo,
    setTaskStatus,
    setTaskProgress,
    setMultitaskStatus,
    setRealtimeSensorData,
    setCurrentScan,
    setSlamGridMap,
    setSlamPoseData,
    clearSlamGridMap,
    resetRuntimeState,
    insOriginCoordinates,
    syncInsOrigin,
    // computed
    batteryLevel,
    voltage,
    current,
    robotStatusText,
    gaitText,
    navModeText,
    terrainModeText,
    postureText,
    currentSpeed,
    currentMileage,
    totalMileage,
    imuRoll,
    imuPitch,
    imuYaw,
    imuHorizAccel,
    wifiError,
    imuError,
    driverHeatWarn,
    motorHeatWarn,
    batteryLowWarn,
    msfStatusText,
    msfNormal,
    isTracking,
    isPointTaskRunning,
    isNavigating,
    isMsfRunning,
    isInsRunning,
    isCharging,
    isSlam,
    effectiveTheta,
    headingAngle,
    realtimeSensorValues,
    realtimeSensorUnits,
    visionRealTimeMap,
    setVisionRealTimeData,
  }
})
