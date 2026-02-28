import { ref, onUnmounted } from 'vue'
import { config } from '../config/environment'
import { useRobotStore } from '../stores/robot'

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

export interface CmdStatusData {
  ins: number
  track: number
  charge: number
  track_record: number
  nav: number
  change_pcd: number
  data_record: number
  slam: number
  msf: number
  map_name: string
  track_info: CmdStatusTrackInfo
}

export interface RobotStatusData {
  status: 'online' | 'offline'
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

export interface MsfStatusData {
  status: number        // 0:初始化中, 1:正常, 2:错误
  status_text: string
  error_code: number
  error_msg: string
  timestamp: string
}

export interface TaskStatusData {
  is_running: boolean
  task_name: string
  progress: number
  timestamp: string
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
  /** rcs_state[0]=is_nav_mode(0手动/1非手动), rcs_state[1..9]=预留 */
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
  parsed?: RcsData | MotionStateData | BatteryData | TerrainModeData | BodyHeightStateData | Record<string, any>
  timestamp: string
}

export interface WsMessage {
  type: string
  robot_id: string
  data: any
}

// ===== composable =====

const HEARTBEAT_TIMEOUT_MS = 3000   // 3秒无 0x1008 消息则离线
const RECONNECT_INIT_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000

export function useRobotWebSocket() {
  const robotStore = useRobotStore()

  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref<string>('')

  let reconnectDelay = RECONNECT_INIT_DELAY
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  let shouldReconnect = true

  // ===== 心跳超时（wifi_error 方案B） =====
  const resetHeartbeatTimer = () => {
    if (heartbeatTimer) clearTimeout(heartbeatTimer)
    heartbeatTimer = setTimeout(() => {
      // 3秒内未收到 0x1008，判定机器狗离线
      robotStore.setOnlineStatus(false)
    }, HEARTBEAT_TIMEOUT_MS)
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

    switch (type) {
      // ---- 位姿 ----
      case 'pose_update':
        robotStore.setPose(data as PoseUpdateData)
        break

      // ---- 任务状态 ----
      case 'cmd_status':
        robotStore.setCmdStatus(data as CmdStatusData)
        break

      // ---- 机器人上下线 ----
      case 'robot_status': {
        const s = (data as RobotStatusData).status
        robotStore.setOnlineStatus(s === 'online')
        break
      }

      // ---- 循迹状态 ----
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

      // ---- 机器狗 UDP 数据（含心跳） ----
      case 'dog_udp_message': {
        const udpData = data as DogUdpData
        robotStore.setDogUdpMessage(udpData)

        const hexCode = udpData.code_hex?.toLowerCase()

        // 0x1008：运行状态，含 wifi_error 心跳判据
        if (hexCode === '0x1008') {
          const parsed = udpData.parsed as RcsData | undefined
          if (parsed?.error_state) {
            const wifiOk = !parsed.error_state.wifi_error
            if (wifiOk) {
              // wifi_error=false，机器狗在线，重置超时计时器
              robotStore.setOnlineStatus(true)
              resetHeartbeatTimer()
            } else {
              // wifi_error=true，WiFi 故障，标记离线
              robotStore.setOnlineStatus(false)
              if (heartbeatTimer) {
                clearTimeout(heartbeatTimer)
                heartbeatTimer = null
              }
            }
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

        // 0x3100ee01：地形模式
        if (hexCode === '0x3100ee01') {
          robotStore.setTerrainMode(udpData.parsed as TerrainModeData)
        }

        // 0x11050f08：机身高度/姿态
        if (hexCode === '0x11050f08') {
          robotStore.setBodyHeightState(udpData.parsed as BodyHeightStateData)
        }

        break
      }

      // ---- task_status （发布点任务运行状态） ----
      case 'task_status':
        robotStore.setTaskStatus(data as TaskStatusData)
        break

      // ---- task_update（暂保留兼容） ----
      case 'task_update':
        break

      default:
        break
    }
  }

  // ===== 连接 =====
  const connect = (robotId?: string) => {
    if (isConnecting.value || isConnected.value) return

    isConnecting.value = true
    connectionError.value = ''

    // WebSocket 地址与其他接口用同一套 IP 逻辑
    const wsHost = config.websocket.host
    const wsPort = config.websocket.port
    const robotParam = robotId ? `?robot_id=${encodeURIComponent(robotId)}` : ''
    const url = `ws://${wsHost}:${wsPort}/v1/ws${robotParam}`

    console.log(`[RobotWS] 连接: ${url}`)

    const socket = new WebSocket(url)
    ws.value = socket

    socket.onopen = () => {
      isConnected.value = true
      isConnecting.value = false
      reconnectDelay = RECONNECT_INIT_DELAY
      connectionError.value = ''
      console.log('[RobotWS] 已连接')
      // 连接建立时重置心跳计时器，等待第一条 0x1008
      resetHeartbeatTimer()
    }

    socket.onmessage = (event) => {
      handleMessage(event.data)
    }

    socket.onerror = () => {
      connectionError.value = 'WebSocket 连接错误'
      console.error('[RobotWS] 错误')
    }

    socket.onclose = () => {
      isConnected.value = false
      isConnecting.value = false
      robotStore.setOnlineStatus(false)
      ws.value = null
      console.log('[RobotWS] 连接关闭')

      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer)
        heartbeatTimer = null
      }

      if (shouldReconnect) {
        scheduleReconnect(robotId)
      }
    }
  }

  // ===== 重连（指数退避） =====
  const scheduleReconnect = (robotId?: string) => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    console.log(`[RobotWS] ${reconnectDelay}ms 后重连...`)
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY)
      connect(robotId)
    }, reconnectDelay)
  }

  // ===== 断开 =====
  const disconnect = () => {
    shouldReconnect = false
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (heartbeatTimer) clearTimeout(heartbeatTimer)
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
    isConnecting.value = false
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
