import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PoseUpdateData,
  CmdStatusData,
  TrackInfoData,
  AlertData,
  MappingProgressData,
  MsfStatusData,
  TaskStatusData,
  DogUdpData,
  RcsData,
  MotionStateData,
  BatteryData,
  TerrainModeData,
  BodyHeightStateData,
} from '../composables/useRobotWebSocket'

export const useRobotStore = defineStore('robot', () => {
  // ===== 在线状态 =====
  const isOnline = ref(false)

  // ===== 位姿 =====
  const pose = ref<PoseUpdateData | null>(null)

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

  // ===== task_status 发布点任务运行状态 =====
  const taskStatus = ref<TaskStatusData | null>(null)

  // ===== mutations =====

  const setOnlineStatus = (online: boolean) => {
    isOnline.value = online
  }

  const setPose = (data: PoseUpdateData) => {
    pose.value = data
  }

  const setCmdStatus = (data: CmdStatusData) => {
    cmdStatus.value = data
  }

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

  const setDogUdpMessage = (data: DogUdpData) => {
    latestDogUdpMessage.value = data
  }

  const setRcsData = (data: RcsData) => {
    rcsData.value = data
  }

  const setMotionState = (data: MotionStateData) => {
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

  const setTaskStatus = (data: TaskStatusData) => {
    taskStatus.value = data
  }

  // ===== computed =====

  /** 地形模式文本（来自 0x3100EE01 terrain_mode 字段） */
  const terrainModeText = computed(() => terrainMode.value?.terrain_mode ?? '--')

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
  const voltage = computed(() => {
    if (batteryData.value?.voltage == null) return null
    return batteryData.value.voltage / 100
  })

  /** 电流（单位 A，原始值为 10mA 单位，需 /100） */
  const current = computed(() => {
    if (batteryData.value?.current == null) return null
    return batteryData.value.current / 100
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
      1: '行走步态',
      2: '斜坡步态',
      3: '越障步态',
      4: '楼梯步态',
      5: '帧楼梯步态',
      6: '帧45°步态',
      7: 'L行走步态',
      8: '山地步态',
      9: '静音步态',
    }
    return map[g] ?? '--'
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

  return {
    // state
    isOnline,
    pose,
    cmdStatus,
    trackInfo,
    alerts,
    mappingProgress,
    msfStatus,
    latestDogUdpMessage,
    rcsData,
    motionState,
    batteryData,
    terrainMode,
    bodyHeightState,
    taskStatus,
    // mutations
    setOnlineStatus,
    setPose,
    setCmdStatus,
    setTrackInfo,
    pushAlert,
    setMappingProgress,
    setMsfStatus,
    setDogUdpMessage,
    setRcsData,
    setMotionState,
    setBatteryData,
    setTerrainMode,
    setBodyHeightState,
    setTaskStatus,
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
  }
})
