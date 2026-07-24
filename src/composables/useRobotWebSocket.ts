import { ref, onUnmounted } from 'vue'
import { config } from '../config/environment'
import { useRobotStore } from '../stores/robot'
import { useDeviceStore } from '../stores/device'

// ===== WebSocket 消息类型定义 =====

export interface PoseUpdateData {
  x: number
  y: number
  z: number
  theta: number
}

export interface CmdStatusTrackInfo {
  taskpoint_name: string
  obs_mode: number
  track_name: string
  result: number
  error_code: number
  error_msg: string
}

export interface CmdStatusActionResult {
  error_code: number
  error_msg: string
  result: string
}

export interface CmdStatusData {
  ins: number
  ins_origin: number   // INS 初始化状态（0: 未初始化, 1: 初始化中/已初始化）
  track: number
  charge: number
  track_record: number
  nav: number
  change_pcd: number
  data_record: number
  slam: number
  msf: number
  slam_online?: number
  app_nav_pause?: CmdStatusActionResult
  app_stop_navtrack?: CmdStatusActionResult
  app_nav_stop?: CmdStatusActionResult
  map_name: string
  track_info: CmdStatusTrackInfo
}

export interface RobotStatusData {
  status: 'online' | 'offline'
}

export interface HeartbeatData {
  status: 'online' | 'offline'
  timestamp?: string
}

export interface TrackInfoData {
  taskpoint_name: string
  obs_mode: string
  track_name: string
  result: number
  error_code: number
  error_msg: string
  timestamp: string
}

export interface AlertData {
  alert_id: number
  type: 'fire' | 'smoke' | 'intrusion' | 'helmet' | 'other'
  severity: 'high' | 'medium' | 'low'
  detected_at: string
}

export interface MappingProgressData {
  progress: number
  timestamp: string
}

export interface SlamGridMapData {
  timestamp: number
  frame_id: string
  resolution: number
  width: number
  height: number
  origin: {
    x: number
    y: number
    z: number
  }
  occupied_cells: [number, number][]   // 占用格（有障碍）
  free_cells?: [number, number][]      // 空闲格（已探测、无障碍）
  pose?: [number, number, number]      // [x, y, theta] 无人车实时位置
}

export interface MsfStatusData {
  status: number        // 0: 初始化中, 1: 正常, 2: 错误
  status_text: string
  error_code: number
  error_msg: string
  timestamp: string
}

export interface LocStatusData {
  result: number
  status_text: string
  error_code: number
  error_msg: string
  timestamp: string
}

export interface MultiTaskStatusData {
  status: boolean
  current_task_name: string
  current_group_name?: string
}

export interface TaskStatusData {
  is_running: boolean
  task_name: string
  progress: number
  timestamp: string
}

export interface TaskProgressData {
  total_points: number
  finished_points: number
  task_complete: number
  task_name: string
  task_type: number
  last_task: string
  track_start_time?: string
  timestamp: string
}

export interface SensorStatusData {
  charge_msg: string
  lidar_msg: string
  imu_msg: string
  gps_msg: string
}

/** 0x1008 运行状态中的错误位 */
export interface RcsErrorState {
  imu_error: boolean
  wifi_error: boolean
  driver_heat_warn: boolean
  driver_error: boolean
  motor_heat_warn: boolean
  battery_low_warn: boolean
}

/** 0x1008 运行状态解析结果 */
export interface RcsData {
  robot_name: string
  current_mileage: number
  total_mileage: number
  current_run_time: number
  total_run_time: number
  current_motion_time: number
  total_motion_time: number
  joystick: number[]
  /** rcs_state[0]=is_nav_mode(0手动/1自动), rcs_state[1..9]=预留 */
  rcs_state: number[]
  error_state: RcsErrorState
}

/** 0x1009 运动状态解析结果 */
export interface MotionStateData {
  basic_state: number
  gait_state: number
  max_forward_vel: number
  max_backward_vel: number
  leg_odom_pos: number[]
  leg_odom_vel: number[]
  robot_distance: number
  touch_state: number
  control_state: {
    narrow_walk: boolean
    pose_safe_flag: boolean
    joint_limit_flag: boolean
  }
  task_state: number[]
}

/** 0x21050f0a 电池数据解析结果 */
export interface BatteryData {
  voltage: number
  current: number
  remaining_capacity: number
  nominal_capacity: number
  cycles: number
  production_date: number
  balanced_low: number
  balanced_high: number
  protected_state: number
  software_version: number
  battery_level: number
  mos_state: number
  battery_quantity: number
  battery_ntc: number
  battery_temperature: number[]
}

/** 0x100a IMU 数据 */
export interface ImuData {
  timestamp: number
  roll: number
  pitch: number
  yaw: number
  omega_x: number
  omega_y: number
  omega_z: number
  acc_x: number
  acc_y: number
  acc_z: number
}

/** 0x100a 传感器帧（IMU + 关节）*/
export interface SensorData {
  imu_data: ImuData
  joint_pos: Record<string, number>
  joint_vel: Record<string, number>
  joint_tau: Record<string, number>
}

/** 0x100b 电机/驱动器/CPU 信息 */
export interface SystemTelemetryData {
  motor_temperature: number[]
  driver_temperature: number[]
  cpu_info: {
    temperature: number
    frequency: number
  }
}

/** system_status 系统状态信息 */
export interface SystemStatusData {
  cpu_percent: number
  memory_percent: number
  disk_percent: number
  latency_ms: number
  reachable: boolean
  soc: number
  timestamp: string
}

/** speed_status 速度状态信息 */
export interface SpeedStatusData {
  v: number
  w: number
  timestamp: string
}

/** latency 延迟状态信息 */
export interface LatencyStatusData {
  latency_ms: number
  reachable: boolean
  timestamp: string
}

/** gps_message GPS/RTK 定位消息 */
export interface GpsMessageData {
  latitude: string | number
  longitude: string | number
  altitude: string | number
  status: number
  status_text: string
  sat_num: number
  timestamp: string
}

/** stop_state 无人车急停状态消息 */
export interface StopStateData {
  state: number
  button: number
  collision: number
  sonic: number
  soft: number
  timestamp: string
}

/** temperature 无人车温度上报 */
export interface CarTemperatureItem {
  name: string
  value: number
}

export interface CarTemperatureData {
  temperature: CarTemperatureItem[]
  timestamp: string
}

/** motor_info 无人车电机信息 */
export interface CarMotorInfoData {
  rpm: number[]
  current: number[]
  state: number[]
  timestamp: string
}


/** 0x3100EE01 地形模式 */
export interface TerrainModeData {
  instruction_code: string
  instruction_type: number
  raw_value: number
  terrain_mode: string
}

/** 0x11050f08 机身高度/姿态 */
export interface BodyHeightStateData {
  instruction_code: string
  instruction_type: number
  raw_value: number
  state: string
}

/** dog_udp_message 通用结构 */
export interface DogUdpData {
  code: number
  code_hex: string
  parsed?: RcsData | MotionStateData | BatteryData | SensorData | SystemTelemetryData | TerrainModeData | BodyHeightStateData | Record<string, any>
  timestamp: string
}

export interface WsMessage {
  type: string
  robot_id: string
  data: any
}

// ===== composable =====

const RECONNECT_INIT_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000

export function useRobotWebSocket() {
  const robotStore = useRobotStore()
  const deviceStore = useDeviceStore()

  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref<string>('')

  let reconnectDelay = RECONNECT_INIT_DELAY
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let shouldReconnect = true
  let subscribedRobotId = ''

  const syncRobotItemStatus = (robotId: string, status: 'online' | 'offline') => {
    if (!robotId) return
    const currentList = deviceStore.robots
    const idx = currentList.findIndex(item => String(item.robot_id) === String(robotId))
    if (idx < 0) return
    const next = [...currentList]
    next[idx] = { ...next[idx], status }
    deviceStore.setRobots(next as any)
  }

  // ===== 消息分发 =====
  const handleMessage = (raw: string) => {
    let msg: WsMessage
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }

    const { type, robot_id, data } = msg
    const selectedRobotId = deviceStore.selectedRobotId

    // 打印日志以确认收到的消息类型和 ID
    if (type === 'slam_pose_update' || type === 'slam_grid_map') {
      console.log(`[WS Debug] Received ${type}, robot_id: ${robot_id}, selectedRobotId: ${selectedRobotId}`)
    }

    // 辅助函数：灵活匹配 robot_id（兼容 "1", 1, "robot_001", "robot_1" 等不同格式）
    const isSameRobotId = (id1: any, id2: any) => {
      if (!id1 || !id2) return true
      const s1 = String(id1).trim()
      const s2 = String(id2).trim()
      if (s1 === s2) return true
      const c1 = s1.replace(/^robot_/, '').replace(/^0+/, '')
      const c2 = s2.replace(/^0+/, '').replace(/^robot_/, '').replace(/^0+/, '')
      if (c1 === c2) return true
      // 单机器人项目允许放行
      if (deviceStore.robots && deviceStore.robots.length <= 1) return true
      return false
    }

    if (selectedRobotId && robot_id && !isSameRobotId(robot_id, selectedRobotId)) {
      console.warn(`[WS Warning] Received ${type} with robot_id ${robot_id}, but selectedRobotId is ${selectedRobotId}`)
      return
    }
    if (subscribedRobotId && robot_id && !isSameRobotId(robot_id, subscribedRobotId)) {
      return
    }

    switch (type) {
      // ---- 位姿 ----
      case 'pose_update':
        robotStore.setPose(data as PoseUpdateData)
        break

      // ---- 任务状态 ----
      case 'cmd_status':
        robotStore.setCmdStatus(data as CmdStatusData)
        break

      case 'multitask_status':
        robotStore.setMultitaskStatus(data as MultiTaskStatusData)
        break

      // ---- 机器人上下线 ----
      case 'robot_status': {
        const s = (data as RobotStatusData).status
        robotStore.setOnlineStatus(s === 'online')
        syncRobotItemStatus(robot_id, s)
        break
      }

      // ---- 心跳 ----
      case 'heartbeat': {
        const s = (data as HeartbeatData)?.status
        if (s === 'online' || s === 'offline') {
          robotStore.setOnlineStatus(s === 'online')
          syncRobotItemStatus(robot_id, s)
        }
        break
      }

      // ---- 轨迹状态 ----
      case 'track_info':
        robotStore.setTrackInfo(data as TrackInfoData)
        break

      // ---- 报警 ----
      case 'alert':
        robotStore.pushAlert(data as AlertData)
        break

      // ---- 建图进度 ----
      case 'mapping_progress':
        robotStore.setMappingProgress(data as MappingProgressData)
        break

      // ---- 融合定位状态 ----
      case 'msf_status':
        robotStore.setMsfStatus(data as MsfStatusData)
        break

      // ---- 定位状态 ----
      case 'loc_status':
        robotStore.setLocStatus(data as LocStatusData)
        break

      // ---- 实时建图 2D 栅格数据 ----
      case 'slam_grid_map':
        if (typeof (robotStore as any).setSlamGridMap === 'function') {
          ;(robotStore as any).setSlamGridMap(data as SlamGridMapData)
        } else {
          ;(robotStore as any).slamGridMapData = data as SlamGridMapData
        }
        break

      // ---- 实时建图机器人位姿 ----
      case 'slam_pose_update':
      case 'slam_pose_message':
        console.log('[WS] Received slam_pose_update:', data)
        if (typeof (robotStore as any).setSlamPoseData === 'function') {
          ;(robotStore as any).setSlamPoseData(data as { x: number; y: number; z?: number; theta: number; frame_id?: string; timestamp?: number })
        }
        break

      // ---- 传感器状态（激光雷达/IMU/GPS） ----
      case 'sensor_status':
        robotStore.setSensorStatus(data as SensorStatusData)
        break

      // ---- 机器狗 UDP 数据（含心跳） ----
      case 'dog_udp_message': {
        const udpData = data as DogUdpData
        robotStore.setDogUdpMessage(udpData)

        const hexCode = udpData.code_hex?.toLowerCase()

        // 0x1008：运行状态
        if (hexCode === '0x1008') {
          const parsed = udpData.parsed as RcsData | undefined
          if (parsed) {
            // 无论是否带 error_state，都应同步最新 rcs_data（包含 rcs_state 模式位）
            robotStore.setRcsData(parsed)
          }
        }

        // 0x1009：运动状态
        if (hexCode === '0x1009') {
          robotStore.setMotionState(udpData.parsed as MotionStateData)
        }

        // 0x21050f0a：电池数据
        if (hexCode === '0x21050f0a') {
          robotStore.setBatteryData(udpData.parsed as BatteryData)
        }

        // 0x100a: sensor frame (IMU + joints)
        if (hexCode === '0x100a') {
          robotStore.setSensorData(udpData.parsed as SensorData)
        }

        // 0x100b：电机/驱动器/CPU 信息
        if (hexCode === '0x100b') {
          robotStore.setSystemTelemetry(udpData.parsed as SystemTelemetryData)
        }

        // 0x3100ee01: terrain mode
        if (hexCode === '0x3100ee01') {
          robotStore.setTerrainMode(udpData.parsed as TerrainModeData)
        }

        // 0x11050f08：机身高度/姿态
        if (hexCode === '0x11050f08') {
          robotStore.setBodyHeightState(udpData.parsed as BodyHeightStateData)
        }

        break
      }

      // ---- task_status（发布点任务运行状态） ----
      case 'task_status':
        robotStore.setTaskStatus(data as TaskStatusData)
        break
      case 'task_progress': {
        const taskProgressData = data as TaskProgressData
        const totalPoints = Number(taskProgressData?.total_points ?? 0)
        const finishedPoints = Number(taskProgressData?.finished_points ?? 0)
        const taskComplete = Number(taskProgressData?.task_complete ?? 0)
        const taskName = String(taskProgressData?.task_name || '').trim()
        const lastTask = String(taskProgressData?.last_task || '').trim()
        const isNotStartedPacket =
          totalPoints === 0 &&
          finishedPoints === 0 &&
          taskComplete === 0 &&
          !taskName &&
          !lastTask

        if (typeof (robotStore as any).setTaskProgress === 'function') {
          ;(robotStore as any).setTaskProgress(isNotStartedPacket ? null : taskProgressData)
        } else {
          ;(robotStore as any).taskProgress = isNotStartedPacket ? null : taskProgressData
        }
        break
      }

      // ---- 动态传感器数据 ----
      case 'sensor_data':
        if (typeof (robotStore as any).setRealtimeSensorData === 'function') {
          ;(robotStore as any).setRealtimeSensorData(data)
        }
        break

      // ---- 实时算法画框数据 ----
      case 'vision_real_time':
        if (typeof (robotStore as any).setVisionRealTimeData === 'function') {
          ;(robotStore as any).setVisionRealTimeData(msg)
        }
        break

      // ---- 电池状态 (用于无人车) ----
      case 'battery': {
        const rawData = data
        if (rawData) {
          const rawVol = Array.isArray(rawData.voltage) ? rawData.voltage[0] : (typeof rawData.voltage === 'number' ? rawData.voltage : 0)
          const rawCur = Array.isArray(rawData.current) ? rawData.current[0] : (typeof rawData.current === 'number' ? rawData.current : 0)
          
          // 根据 charging_state 处理正负电流以指示充电状态（0为放电，非0为充电）
          const isCharging = rawData.charging_state !== undefined && rawData.charging_state !== null
            ? rawData.charging_state !== 0
            : rawCur > 0
          const currentVal = isCharging ? Math.abs(rawCur) : -Math.abs(rawCur)

          const mappedBattery: BatteryData = {
            battery_level: typeof rawData.soc === 'number' ? rawData.soc : (rawData.now_percent || 0),
            voltage: rawVol / 10,  // 从 100mV 转换为 V
            current: currentVal / 10,  // 从 100mA 转换为 A
            remaining_capacity: rawData.now_capacity || 0,
            nominal_capacity: rawData.max_capacity || 0,
            cycles: 0,
            production_date: 0,
            balanced_low: 0,
            balanced_high: 0,
            protected_state: rawData.state || 0,
            software_version: 0,
            mos_state: 0,
            battery_quantity: 0,
            battery_ntc: 0,
            battery_temperature: typeof rawData.temperature === 'number' ? [rawData.temperature] : [],
          }
          robotStore.setBatteryData(mappedBattery)
        }
        break
      }

      // ---- 系统状态 ----
      case 'system_status':
        if (typeof (robotStore as any).setSystemStatus === 'function') {
          ;(robotStore as any).setSystemStatus(data as SystemStatusData)
        } else {
          ;(robotStore as any).systemStatus = data as SystemStatusData
        }
        break

      // ---- 速度状态 (用于无人车) ----
      case 'speed_status':
        if (typeof (robotStore as any).setSpeedStatus === 'function') {
          ;(robotStore as any).setSpeedStatus(data as SpeedStatusData)
        } else {
          ;(robotStore as any).speedStatus = data as SpeedStatusData
        }
        break

      // ---- 网络延迟 ----
      case 'latency':
        if (typeof (robotStore as any).setLatencyStatus === 'function') {
          ;(robotStore as any).setLatencyStatus(data as LatencyStatusData)
        } else {
          ;(robotStore as any).latencyStatus = data as LatencyStatusData
        }
        break

      // ---- GPS/RTK 定位消息 ----
      case 'gps_message':
        if (typeof (robotStore as any).setGpsMessage === 'function') {
          ;(robotStore as any).setGpsMessage(data as GpsMessageData)
        } else {
          ;(robotStore as any).gpsMessage = data as GpsMessageData
        }
        break

      // ---- 无人车急停状态 ----
      case 'stop_state':
        if (typeof (robotStore as any).setStopState === 'function') {
          ;(robotStore as any).setStopState(data as StopStateData)
        } else {
          ;(robotStore as any).stopState = data as StopStateData
        }
        break

      // ---- 无人车温度数据 ----
      case 'temperature':
        if (typeof (robotStore as any).setCarTemperature === 'function') {
          ;(robotStore as any).setCarTemperature(data as CarTemperatureData)
        } else {
          ;(robotStore as any).carTemperature = data as CarTemperatureData
        }
        break

      // ---- 无人车电机信息 ----
      case 'motor_info': {
        let motorData = data
        if (typeof motorData === 'string') {
          try {
            motorData = JSON.parse(motorData)
          } catch (e) {
            console.error('Failed to parse motor_info json string', e)
          }
        }
        if (motorData && motorData.msg) {
          const innerMsg = typeof motorData.msg === 'string' ? JSON.parse(motorData.msg) : motorData.msg
          motorData = { ...innerMsg, timestamp: motorData.timestamp }
        }
        if (typeof (robotStore as any).setCarMotorInfo === 'function') {
          ;(robotStore as any).setCarMotorInfo(motorData as CarMotorInfoData)
        } else {
          ;(robotStore as any).carMotorInfo = motorData as CarMotorInfoData
        }
        break
      }

      // ---- task_update（暂保留兼容） ----
      case 'task_update':
        break

      // ---- 实时2D雷达点云 ----
      case 'current_scan':
        if (typeof (robotStore as any).setCurrentScan === 'function') {
          ;(robotStore as any).setCurrentScan(data)
        } else {
          ;(robotStore as any).currentScan = data
        }
        break

      default:
        break
    }
  }

  // ===== 连接 =====
  const connect = (robotId?: string) => {
    if (isConnecting.value || isConnected.value) return

    shouldReconnect = true  // 每次主动 connect 都允许自动重连
    isConnecting.value = true
    connectionError.value = ''
    subscribedRobotId = robotId || ''

    // WebSocket 地址与其他接口用同一套 IP 逻辑：生产环境下通过当前 Web 端口 (window.location.host) 同源代理
    const wsProtocol = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss:' : 'ws:'
    const wsHostPort = (import.meta.env.PROD && typeof window !== 'undefined' && window.location.host)
      ? window.location.host
      : `${config.websocket.host}:${config.websocket.port || 8000}`
    const robotParam = robotId ? `?robot_id=${encodeURIComponent(robotId)}` : ''
    const url = `${wsProtocol}//${wsHostPort}/v1/ws${robotParam}`

    const socket = new WebSocket(url)
    ws.value = socket

    socket.onopen = () => {
      if (ws.value !== socket) return
      isConnected.value = true
      isConnecting.value = false
      reconnectDelay = RECONNECT_INIT_DELAY
      connectionError.value = ''
    }

    socket.onmessage = (event) => {
      if (ws.value !== socket) return
      handleMessage(event.data)
    }

    socket.onerror = () => {
      if (ws.value !== socket) return
      connectionError.value = 'WebSocket 连接错误'
      console.error('[RobotWS] 错误')
    }

    socket.onclose = () => {
      if (ws.value !== socket) return
      isConnected.value = false
      isConnecting.value = false
      robotStore.setOnlineStatus(false)
      ws.value = null

      if (shouldReconnect) {
        scheduleReconnect(robotId)
      }
    }
  }

  // ===== 重连（指数退避） =====
  const scheduleReconnect = (robotId?: string) => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY)
      connect(robotId)
    }, reconnectDelay)
  }

  // ===== 断开 =====
  const disconnect = () => {
    shouldReconnect = false
    if (reconnectTimer) clearTimeout(reconnectTimer)
    const currentSocket = ws.value
    ws.value = null
    if (currentSocket) {
      currentSocket.close()
    }
    isConnected.value = false
    isConnecting.value = false
    subscribedRobotId = ''
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
  }
}
