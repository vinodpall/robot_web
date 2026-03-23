import { ref, onUnmounted } from 'vue'
import { config } from '../config/environment'
import { useRobotStore } from '../stores/robot'
import { useDeviceStore } from '../stores/device'

// ===== WebSocket 娑堟伅绫诲瀷瀹氫箟 =====

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
  ins_origin: number   // INS 鍒濆鍖栫姸鎬侊紙0:鏈垵濮嬪寲, 1:鍒濆鍖栦腑/宸插垵濮嬪寲锛?
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
  status: number        // 0:鍒濆鍖栦腑, 1:姝ｅ父, 2:閿欒
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

export interface TaskProgressData {
  total_points: number
  finished_points: number
  task_complete: number
  task_name: string
  task_type: number
  last_task: string
  timestamp: string
}

/** 0x1008 杩愯鐘舵€佷腑鐨勯敊璇綅 */
export interface RcsErrorState {
  imu_error: boolean
  wifi_error: boolean
  driver_heat_warn: boolean
  driver_error: boolean
  motor_heat_warn: boolean
  battery_low_warn: boolean
}

/** 0x1008 杩愯鐘舵€佽В鏋愮粨鏋?*/
export interface RcsData {
  robot_name: string
  current_mileage: number
  total_mileage: number
  current_run_time: number
  total_run_time: number
  current_motion_time: number
  total_motion_time: number
  joystick: number[]
  /** rcs_state[0]=is_nav_mode(0鎵嬪姩/1闈炴墜鍔?, rcs_state[1..9]=棰勭暀 */
  rcs_state: number[]
  error_state: RcsErrorState
}

/** 0x1009 杩愬姩鐘舵€佽В鏋愮粨鏋?*/
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

/** 0x21050f0a 鐢垫睜鏁版嵁瑙ｆ瀽缁撴灉 */
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

/** 0x100a IMU 鏁版嵁 */
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

/** 0x100a 浼犳劅鍣ㄥ抚锛圛MU + 鍏宠妭锛?*/
export interface SensorData {
  imu_data: ImuData
  joint_pos: Record<string, number>
  joint_vel: Record<string, number>
  joint_tau: Record<string, number>
}

/** 0x100b 鐢垫満/椹卞姩鍣?CPU 淇℃伅 */
export interface SystemTelemetryData {
  motor_temperature: number[]
  driver_temperature: number[]
  cpu_info: {
    temperature: number
    frequency: number
  }
}

/** 0x3100EE01 鍦板舰妯″紡 */
export interface TerrainModeData {
  instruction_code: string
  instruction_type: number
  raw_value: number
  terrain_mode: string
}

/** 0x11050f08 鏈鸿韩楂樺害/濮挎€?*/
export interface BodyHeightStateData {
  instruction_code: string
  instruction_type: number
  raw_value: number
  state: string
}

/** dog_udp_message 閫氱敤缁撴瀯 */
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

const HEARTBEAT_TIMEOUT_MS = 3000   // 3绉掓棤 0x1008 娑堟伅鍒欑绾?
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
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  let shouldReconnect = true
  let subscribedRobotId = ''

  // ===== 蹇冭烦瓒呮椂锛坵ifi_error 鏂规B锛?=====
  const resetHeartbeatTimer = () => {
    if (heartbeatTimer) clearTimeout(heartbeatTimer)
    heartbeatTimer = setTimeout(() => {
      // 3绉掑唴鏈敹鍒?0x1008锛屽垽瀹氭満鍣ㄧ嫍绂荤嚎
      robotStore.setOnlineStatus(false)
    }, HEARTBEAT_TIMEOUT_MS)
  }

  // ===== 娑堟伅鍒嗗彂 =====
  const handleMessage = (raw: string) => {
    let msg: WsMessage
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }

    const { type, robot_id, data } = msg
    const selectedRobotId = deviceStore.selectedRobotId
    if (selectedRobotId && robot_id && robot_id !== selectedRobotId) {
      return
    }
    if (subscribedRobotId && robot_id && robot_id !== subscribedRobotId) {
      return
    }

    switch (type) {
      // ---- 浣嶅Э ----
      case 'pose_update':
        robotStore.setPose(data as PoseUpdateData)
        break

      // ---- 浠诲姟鐘舵€?----
      case 'cmd_status':
        robotStore.setCmdStatus(data as CmdStatusData)
        break

      // ---- 鏈哄櫒浜轰笂涓嬬嚎 ----
      case 'robot_status': {
        const s = (data as RobotStatusData).status
        robotStore.setOnlineStatus(s === 'online')
        break
      }

      // ---- 寰抗鐘舵€?----
      case 'track_info':
        robotStore.setTrackInfo(data as TrackInfoData)
        break

      // ---- 鎶ヨ ----
      case 'alert':
        robotStore.pushAlert(data as AlertData)
        break

      // ---- 寤哄浘杩涘害 ----
      case 'mapping_progress':
        robotStore.setMappingProgress(data as MappingProgressData)
        break

      // ---- 铻嶅悎瀹氫綅鐘舵€?----
      case 'msf_status':
        robotStore.setMsfStatus(data as MsfStatusData)
        break

      // ---- 鏈哄櫒鐙?UDP 鏁版嵁锛堝惈蹇冭烦锛?----
      case 'dog_udp_message': {
        const udpData = data as DogUdpData
        robotStore.setDogUdpMessage(udpData)

        const hexCode = udpData.code_hex?.toLowerCase()

        // 0x1008锛氳繍琛岀姸鎬侊紝鍚?wifi_error 蹇冭烦鍒ゆ嵁
        if (hexCode === '0x1008') {
          const parsed = udpData.parsed as RcsData | undefined
          if (parsed?.error_state) {
            const wifiOk = !parsed.error_state.wifi_error
            if (wifiOk) {
              // wifi_error=false锛屾満鍣ㄧ嫍鍦ㄧ嚎锛岄噸缃秴鏃惰鏃跺櫒
              robotStore.setOnlineStatus(true)
              resetHeartbeatTimer()
            } else {
              // wifi_error=true锛學iFi 鏁呴殰锛屾爣璁扮绾?
              robotStore.setOnlineStatus(false)
              if (heartbeatTimer) {
                clearTimeout(heartbeatTimer)
                heartbeatTimer = null
              }
            }
            robotStore.setRcsData(parsed)
          }
        }

        // 0x1009锛氳繍鍔ㄧ姸鎬?
        if (hexCode === '0x1009') {
          robotStore.setMotionState(udpData.parsed as MotionStateData)
        }

        // 0x21050f0a锛氱數姹犳暟鎹?
        if (hexCode === '0x21050f0a') {
          robotStore.setBatteryData(udpData.parsed as BatteryData)
        }

        // 0x100a: sensor frame (IMU + joints)
        if (hexCode === '0x100a') {
          robotStore.setSensorData(udpData.parsed as SensorData)
        }

        // 0x100b锛氱數鏈?椹卞姩鍣?CPU 淇℃伅
        if (hexCode === '0x100b') {
          robotStore.setSystemTelemetry(udpData.parsed as SystemTelemetryData)
        }

        // 0x3100ee01: terrain mode
        if (hexCode === '0x3100ee01') {
          robotStore.setTerrainMode(udpData.parsed as TerrainModeData)
        }

        // 0x11050f08锛氭満韬珮搴?濮挎€?
        if (hexCode === '0x11050f08') {
          robotStore.setBodyHeightState(udpData.parsed as BodyHeightStateData)
        }

        break
      }

      // ---- task_status 锛堝彂甯冪偣浠诲姟杩愯鐘舵€侊級 ----
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

      // ---- task_update锛堟殏淇濈暀鍏煎锛?----
      case 'task_update':
        break

      default:
        break
    }
  }

  // ===== 杩炴帴 =====
  const connect = (robotId?: string) => {
    if (isConnecting.value || isConnected.value) return

    shouldReconnect = true  // 姣忔涓诲姩 connect 閮藉厑璁歌嚜鍔ㄩ噸杩?
    isConnecting.value = true
    connectionError.value = ''
    subscribedRobotId = robotId || ''

    // WebSocket 鍦板潃涓庡叾浠栨帴鍙ｇ敤鍚屼竴濂?IP 閫昏緫
    const wsHost = config.websocket.host
    const wsPort = config.websocket.port
    const robotParam = robotId ? `?robot_id=${encodeURIComponent(robotId)}` : ''
    const url = `ws://${wsHost}:${wsPort}/v1/ws${robotParam}`

    const socket = new WebSocket(url)
    ws.value = socket

    socket.onopen = () => {
      if (ws.value !== socket) return
      isConnected.value = true
      isConnecting.value = false
      reconnectDelay = RECONNECT_INIT_DELAY
      connectionError.value = ''
      // 杩炴帴寤虹珛鏃堕噸缃績璺宠鏃跺櫒锛岀瓑寰呯涓€鏉?0x1008
      resetHeartbeatTimer()
    }

    socket.onmessage = (event) => {
      if (ws.value !== socket) return
      handleMessage(event.data)
    }

    socket.onerror = () => {
      if (ws.value !== socket) return
      connectionError.value = 'WebSocket 杩炴帴閿欒'
      console.error('[RobotWS] 閿欒')
    }

    socket.onclose = () => {
      if (ws.value !== socket) return
      isConnected.value = false
      isConnecting.value = false
      robotStore.setOnlineStatus(false)
      ws.value = null

      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer)
        heartbeatTimer = null
      }

      if (shouldReconnect) {
        scheduleReconnect(robotId)
      }
    }
  }

  // ===== 閲嶈繛锛堟寚鏁伴€€閬匡級 =====
  const scheduleReconnect = (robotId?: string) => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY)
      connect(robotId)
    }, reconnectDelay)
  }

  // ===== 鏂紑 =====
  const disconnect = () => {
    shouldReconnect = false
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (heartbeatTimer) clearTimeout(heartbeatTimer)
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

