import { ref, reactive, readonly } from 'vue'
import { authApi, userApi, dockApi, droneApi, missionApi, alertApi, systemApi, deviceApi, roleApi, hmsApi, livestreamApi, waylineApi, permissionApi } from '../api/services'
import { apiClient } from '../api/config'
import { config, refreshEnvironmentConfig } from '../config/environment'
import type { User, Dock, Drone, Mission, Alert, Device, Role, HmsAlert, Permission } from '../types'
import { useDeviceStore } from '../stores/device'
import { setVideoStreams, setDefaultVideoType, cleanupOldVideoCache } from '../utils/videoCache'
import { clearLogoutSessionMemory } from '../utils/logoutSessionMemory'

// 通用 API 访问与设备能力处理
const VIDEO_CACHE_KEY = 'video_devices_cache'
// const VIDEO_CACHE_VERSION_KEY = 'video_cache_version'

interface VideoDeviceInfo {
  deviceSn: string
  deviceType: 'dock' | 'drone_visible' | 'drone_infrared'
  cameraIndex: string
  videoIndex: string
  videoId: string
  switchableVideoTypes: string[]
  lastUpdate: number
}

interface VideoCacheData {
  version: string
  devices: VideoDeviceInfo[]
  lastUpdate: number
}

const cacheVideoDevices = (capacityData: any, dockSns: string[], droneSns: string[]) => {
  const videoDevices: VideoDeviceInfo[] = []
  const now = Date.now()
  
  if (capacityData.available_devices) {
    for (const device of capacityData.available_devices) {
      if (device.camera_list && device.camera_list.length > 0) {
        for (const camera of device.camera_list) {
          if (camera.video_list && camera.video_list.length > 0) {
            for (const video of camera.video_list) {
              const videoId = `${device.sn}/${camera.camera_index}/${video.video_index}`
              const switchableTypes = video.switchable_video_types || []
              
              let deviceType: 'dock' | 'drone_visible' | 'drone_infrared'
              if (dockSns.includes(device.sn)) {
                deviceType = 'dock'
              } else if (droneSns.includes(device.sn)) {
                deviceType = switchableTypes.length > 2 ? 'drone_visible' : 'drone_infrared'
              } else {
                continue
              }
              
              videoDevices.push({
                deviceSn: device.sn,
                deviceType,
                cameraIndex: camera.camera_index,
                videoIndex: video.video_index,
                videoId,
                switchableVideoTypes: switchableTypes,
                lastUpdate: now
              })
              
            }
          }
        }
      }
    }
  }
  
  const cacheData: VideoCacheData = {
    version: '1.0',
    devices: videoDevices,
    lastUpdate: now
  }
  
  localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cacheData))
  console.log("Video devices cached: " + videoDevices.length)
  
  return videoDevices
}

const getCachedVideoDevices = (): VideoDeviceInfo[] => {
  const cacheStr = localStorage.getItem(VIDEO_CACHE_KEY)
  if (!cacheStr) {
    return []
  }
  
  try {
    const cacheData: VideoCacheData = JSON.parse(cacheStr)
    return cacheData.devices || []
  } catch (error) {
    console.error('读取视频缓存失败:', error)
    return []
  }
}

const shouldUpdateVideoCache = (capacityData: any): boolean => {
  const cacheStr = localStorage.getItem(VIDEO_CACHE_KEY)
  if (!cacheStr) {
    console.log('No video cache found, refresh required')
    return true
  }
  
  try {
    const cacheData: VideoCacheData = JSON.parse(cacheStr)
    const cacheDeviceCount = cacheData.devices.length
    
    let currentDeviceCount = 0
    if (capacityData.available_devices) {
      for (const device of capacityData.available_devices) {
        if (device.camera_list) {
          for (const camera of device.camera_list) {
            if (camera.video_list) {
              currentDeviceCount += camera.video_list.length
            }
          }
        }
      }
    }
    
    if (cacheDeviceCount !== currentDeviceCount) {
      console.log("Video device count changed: cache=" + cacheDeviceCount + ", current=" + currentDeviceCount)
      return true
    }
    
    const thirtyMinutes = 30 * 60 * 1000
    if (Date.now() - cacheData.lastUpdate > thirtyMinutes) {
      console.log('Video cache expired, refresh required')
      return true
    }
    
    console.log('Video cache is valid')
    return false
  } catch (error) {
    console.error('检查视频缓存是否需要刷新失败:', error)
    return true
  }
}

const getBestVideoDevice = (deviceType: 'dock' | 'drone_visible' | 'drone_infrared'): VideoDeviceInfo | null => {
  const cachedDevices = getCachedVideoDevices()
  const devices = cachedDevices.filter(device => device.deviceType === deviceType)
  
  if (devices.length === 0) {
    console.warn("No video device found for type: " + deviceType)
    return null
  }
  
  devices.sort((a, b) => b.switchableVideoTypes.length - a.switchableVideoTypes.length)
  
  console.log("Selected best " + deviceType + " video device:", devices[0])
  return devices[0]
}
export function useAuth() {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const initAuth = () => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    
    if (savedUser && savedToken) {
      user.value = JSON.parse(savedUser)
      token.value = savedToken
      apiClient.setAuthToken(savedToken)
    }
  }

  const normalizeLoginErrorMessage = (err: any): string => {
    const raw = String(err?.message || '')
    const lower = raw.toLowerCase()

    if (
      lower.includes('failed to fetch') ||
      lower.includes('networkerror') ||
      lower.includes('err_connection_reset') ||
      lower.includes('err_connection_refused') ||
      lower.includes('err_name_not_resolved') ||
      lower.includes('load failed')
    ) {
      return '网络连接失败，请检查网络或服务器状态后重试'
    }

    if (lower.includes('http error! status: 401')) {
      return '账号或密码错误'
    }
    if (lower.includes('http error! status: 403')) {
      return '当前账号无登录权限'
    }

    return raw || '登录失败，请稍后重试'
  }



  const login = async (loginData: { username: string; password: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const currentConfig = refreshEnvironmentConfig()
      console.log('登录环境信息:')
      console.log('- 环境:', import.meta.env.VITE_APP_ENVIRONMENT)
      console.log('- WebRTC域名:', currentConfig.video.webrtcDomain)
      
      const response = await authApi.login(loginData.username, loginData.password)
      const { access_token, token_type } = response

      apiClient.setAuthToken(access_token)
      
      const userResponse = await authApi.getCurrentUser()
      
      let userData: any
      if (userResponse.data) {
        userData = userResponse.data
      } else {
        userData = userResponse
      }

      user.value = userData
      token.value = access_token

      // 登录成功后先清理上一会话的临时缓存，避免旧用户缓存串入当前账号
      clearLogoutSessionMemory({ keepRememberLogin: true })
      
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', access_token)
      
      return { user: userData, token: access_token }
    } catch (err: any) {
      const message = normalizeLoginErrorMessage(err)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error('退出登录失败:', err)
    } finally {
      user.value = null
      token.value = null
      apiClient.clearAuthToken()
      
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('workspace_id')
      clearLogoutSessionMemory()
    }
  }

  const getCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      user.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch current user'
      throw err
    }
  }

  return {
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    error: readonly(error),
    login,
    logout,
    getCurrentUser,
    initAuth
  }
}

export function useDocks() {
  const docks = ref<Dock[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  const fetchDocks = async (params?: { page?: number; pageSize?: number; status?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await dockApi.getDocks(params)
      docks.value = response.data.items
      pagination.total = response.data.total
      pagination.page = response.data.page
      pagination.pageSize = response.data.pageSize
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update current user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchDock = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await dockApi.getDock(id)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch all users'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    docks: readonly(docks),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchDocks,
    fetchDock
  }
}

export function useDrones() {
  const drones = ref<Drone[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  const fetchDrones = async (params?: { page?: number; pageSize?: number; status?: string; dockId?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await droneApi.getDrones(params)
      drones.value = response.data.items
      pagination.total = response.data.total
      pagination.page = response.data.page
      pagination.pageSize = response.data.pageSize
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch data list'
      throw err
    } finally {
      loading.value = false
    }
  }

  const takeoff = async (droneId: string) => {
    try {
      const response = await droneApi.takeoff(droneId)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to create data'
      throw err
    }
  }

  const land = async (droneId: string) => {
    try {
      const response = await droneApi.land(droneId)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update data'
      throw err
    }
  }

  return {
    drones: readonly(drones),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchDrones,
    takeoff,
    land
  }
}

export function useMissions() {
  const missions = ref<Mission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  const fetchMissions = async (params?: { page?: number; pageSize?: number; status?: string; droneId?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await missionApi.getMissions(params)
      missions.value = response.data.items
      pagination.total = response.data.total
      pagination.page = response.data.page
      pagination.pageSize = response.data.pageSize
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch robots'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createMission = async (missionData: Partial<Mission>) => {
    try {
      const response = await missionApi.createMission(missionData)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to create robot'
      throw err
    }
  }

  const startMission = async (missionId: string) => {
    try {
      const response = await missionApi.startMission(missionId)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update robot'
      throw err
    }
  }

  return {
    missions: readonly(missions),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchMissions,
    createMission,
    startMission
  }
}

export function useAlerts() {
  const alerts = ref<Alert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const fetchAlerts = async (params?: { page?: number; pageSize?: number; status?: string; deviceType?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await alertApi.getAlerts(params)
      alerts.value = response.data.items
      pagination.total = response.data.total
      pagination.page = response.data.page
      pagination.pageSize = response.data.pageSize
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch tasks'
      throw err
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (alertId: string) => {
    try {
      const response = await alertApi.markAsRead(alertId)
      const alert = alerts.value.find(a => a.id === alertId)
      if (alert) {
        alert.status = 'read'
      }
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to create task'
      throw err
    }
  }

  return {
    alerts: readonly(alerts),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchAlerts,
    markAsRead
  }
}

export function useSystem() {
  const systemStatus = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSystemStatus = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await systemApi.getSystemStatus()
      systemStatus.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch task details'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    systemStatus: readonly(systemStatus),
    loading: readonly(loading),
    error: readonly(error),
    fetchSystemStatus
  }
} 

export function useDevices() {
  const devices = ref<Device[]>([])
  const docks = ref<Device[]>([])
  const drones = ref<Device[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const cacheDeviceSns = (deviceList: Device[]) => {
    const dockSns = deviceList.filter(device => {
      return device.device_type_info?.device_type === 3
    }).map(device => device.device_sn)
    
    const droneSns = deviceList.filter(device => {
      return device.device_type_info?.device_type === 100
    }).map(device => device.device_sn)
    
    const enhancedDeviceList = deviceList.map(device => {
      if (device.device_type_info?.device_type === 100) {
        return {
          ...device,
          zoom_factor: device.zoom_factor || 1
        }
      }
      return device
    })
    
    localStorage.setItem('cached_dock_sns', JSON.stringify(dockSns))
    localStorage.setItem('cached_drone_sns', JSON.stringify(droneSns))
    
    localStorage.setItem('cached_devices', JSON.stringify(enhancedDeviceList))
    
  }

  const updateDroneZoomFactor = (deviceSn: string, zoomFactor: number) => {
    const devices = getCachedDevices()
    const deviceIndex = devices.findIndex((device: Device) => device.device_sn === deviceSn)
    
    if (deviceIndex !== -1) {
      devices[deviceIndex] = {
        ...devices[deviceIndex],
        zoom_factor: zoomFactor
      }
      
      localStorage.setItem('cached_devices', JSON.stringify(devices))
      
      localStorage.setItem('camera_zoom_factor', zoomFactor.toString())
      
      console.log("Updated zoom_factor for " + deviceSn + ": " + zoomFactor)
      return true
    }
    
    console.warn("Device not found in cache: " + deviceSn)
    return false
  }

  const getDroneZoomFactor = (deviceSn: string): number => {
    const devices = getCachedDevices()
    const device = devices.find((device: Device) => device.device_sn === deviceSn)
    
    if (device && (device as any).zoom_factor) {
      return (device as any).zoom_factor
    }
    
    const cachedZoomFactor = localStorage.getItem('camera_zoom_factor')
    if (cachedZoomFactor) {
      const factor = parseInt(cachedZoomFactor, 10)
      return isNaN(factor) ? 1 : Math.max(1, Math.min(200, factor))
    }
    
    return 1
  }

  const testZoomFactorSync = () => {
    const devices = getCachedDevices()
    const droneDevices = devices.filter((device: Device) => 
      device.device_type_info?.device_type === 100
    )
    
    console.log('=== Zoom Factor Sync Check ===')
    console.log('Drone device count:', droneDevices.length)
    
    droneDevices.forEach((device: Device) => {
      const cachedZoomFactor = localStorage.getItem('camera_zoom_factor')
      const deviceZoomFactor = (device as any).zoom_factor || 1
      
      console.log("Device " + device.device_sn + ":")
      console.log("  - cached_devices zoom_factor: " + deviceZoomFactor)
      console.log("  - camera_zoom_factor: " + cachedZoomFactor)
      console.log("  - sync status: " + (deviceZoomFactor === parseInt(cachedZoomFactor || "1", 10) ? "OK" : "MISMATCH"))
    })
  }

  const getCachedDeviceSns = () => {
    const dockSns = JSON.parse(localStorage.getItem('cached_dock_sns') || '[]')
    const droneSns = JSON.parse(localStorage.getItem('cached_drone_sns') || '[]')
    return { dockSns, droneSns }
  }

  const getCachedDevices = () => {
    const devices = JSON.parse(localStorage.getItem('cached_devices') || '[]')
    return devices
  }

  const getCachedDeviceBySn = (deviceSn: string) => {
    const devices = getCachedDevices()
    return devices.find((device: Device) => device.device_sn === deviceSn)
  }

  const getCachedWorkspaceId = () => {
    // 兼容老逻辑：优先从当前用户对象读取，不再依赖独立 workspace_id 缓存键
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        if (userData?.workspace_id) {
          return String(userData.workspace_id)
        }
      }
    } catch {
      // ignore
    }
    return null
  }

  const fetchDevices = async (params?: { skip?: number; limit?: number; keyword?: string }) => {
    loading.value = true
    error.value = null
    
    console.log('useDevices - fetching device list')
    
    try {
      const response = await deviceApi.getDevices(params || { skip: 0, limit: 100 })
      console.log('useDevices - device response:', response)
      devices.value = response
      
      docks.value = response.filter(device => device.child_sn !== '')
      drones.value = response.filter(device => device.child_sn === '')
      
      console.log('useDevices - docks count:', docks.value.length)
      console.log('useDevices - drones count:', drones.value.length)
      
      cacheDeviceSns(response)
      
      return response
    } catch (err: any) {
      if (!(err instanceof TypeError && err.message.includes('Failed to fetch'))) {
        console.error('useDevices - fetch failed:', err)
      }
      error.value = err.message || 'Failed to fetch tracking records'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getDocks = () => {
    return docks.value
  }

  const getDrones = () => {
    return drones.value
  }

  const getDeviceBySn = (deviceSn: string) => {
    return devices.value.find(device => device.device_sn === deviceSn)
  }

  const setDevices = (deviceList: Device[]) => {
    devices.value = deviceList
  }

  return {
    devices: readonly(devices),
    loading: readonly(loading),
    error: readonly(error),
    fetchDevices,
    getDocks,
    getDrones,
    getDeviceBySn,
    setDevices,
    cacheDeviceSns,
    getCachedDeviceSns,
    getCachedDevices,
    getCachedDeviceBySn,
    getCachedWorkspaceId,
    updateDroneZoomFactor,
    getDroneZoomFactor,
    testZoomFactorSync
  }
} 

export function useUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (params?: { skip?: number; limit?: number; search?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.getUsers(params)
      users.value = response
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch role list'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData: { username: string; email?: string; full_name?: string; password: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.createUser(userData)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create role'
      throw err
    } finally {
      loading.value = false
    }
  }

  const assignUserRole = async (userId: number, roleId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.assignRole(userId, roleId)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update role'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeUserRole = async (userId: number, roleId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.removeRole(userId, roleId)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to delete role'
      throw err
    } finally {
      loading.value = false
    }
  }

  const syncUserRole = async (userId: number, roleIds: number[]) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.syncUserRole(userId, roleIds)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to configure role permissions'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (id: string | number, userData: { username?: string; email?: string; full_name?: string; password?: string; is_active?: boolean }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.updateUser(id, userData)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch permission list'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      await userApi.deleteUser(id)
    } catch (err: any) {
      error.value = err.message || 'Failed to add permission'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getUser = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.getUser(id)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update permission list'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ?????????
  const syncUserRobots = async (userId: number, robotIds: number[]) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.syncUserRobots(userId, robotIds)
      return response
    } catch (err: any) {
      error.value = err.message || '???????'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users: readonly(users),
    loading: readonly(loading),
    error: readonly(error),
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    assignUserRole,
    removeUserRole,
    syncUserRole,
    syncUserRobots
  }
} 

export function useRoles() {
  const roles = ref<Role[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchRoles = async (params?: { skip?: number; limit?: number; search?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await roleApi.getRoles(params)
      roles.value = response
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch user list'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createRole = async (roleData: { role_name: string; role_code: string; description: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await roleApi.createRole(roleData)
      await fetchRoles()
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateRole = async (id: string | number, roleData: { role_name: string; role_code: string; description: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await roleApi.updateRole(id, roleData)
      await fetchRoles()
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteRole = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      await roleApi.deleteRole(id)
      await fetchRoles()
    } catch (err: any) {
      error.value = err.message || 'Failed to delete user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getRole = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await roleApi.getRole(id)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to assign user roles'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateRolePermissions = async (id: number, permissionIds: number[]) => {
    loading.value = true
    error.value = null

    try {
      const response = await roleApi.updateRolePermissions(id, { permission_ids: permissionIds })
      await fetchRoles()
      return response
    } catch (err: any) {
      error.value = err.message || '????????'
      throw err
    } finally {
      loading.value = false
    }
  }


  return {
    roles: readonly(roles),
    loading: readonly(loading),
    error: readonly(error),
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    getRole,
    updateRolePermissions
  }
}

export function useHmsAlerts() {
  const hmsAlerts = ref<HmsAlert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDeviceHms = async (deviceSn: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await hmsApi.getDeviceHms(deviceSn)
      hmsAlerts.value = response
      return response
    } catch (err: any) {
      console.error('获取 HMS 告警失败:', err)
      error.value = err.message || 'Failed to fetch point tasks'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setAllAlerts = (alerts: HmsAlert[]) => {
    hmsAlerts.value = alerts
  }

  return {
    hmsAlerts: readonly(hmsAlerts),
    loading: readonly(loading),
    error: readonly(error),
    fetchDeviceHms,
    setAllAlerts
  }
}

export function usePermissions() {
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchAllPermissions = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await permissionApi.getAllPermissions()
      permissions.value = response
      return response
    } catch (err: any) {
      console.error('获取权限列表失败:', err)
      error.value = err.message || 'Failed to fetch wayline jobs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUserPermissions = async (userId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await permissionApi.getUserPermissions(userId)
      return response
    } catch (err: any) {
      console.error('获取用户权限失败:', err)
      error.value = err.message || 'Failed to fetch wayline files'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    permissions: readonly(permissions),
    loading: readonly(loading),
    error: readonly(error),
    fetchAllPermissions,
    fetchUserPermissions
  }
}

export function useWaylineJobs() {
  const jobs = ref<any[]>([])
  const waylineFiles = ref<any[]>([])
  const waylineDetail = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    page_size: 10,
    total: 0,
    pages: 0
  })

  const fetchJobs = async (workspaceId: string, params?: {
    page?: number
    page_size?: number
    status?: number
    task_type?: number
    wayline_type?: number
    file_id?: string
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.getJobs(workspaceId, params)
      jobs.value = response.data.data
      pagination.value = response.data.pagination
    } catch (err) {
      console.error('获取航线任务列表失败:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch wayline details'
    } finally {
      loading.value = false
    }
  }

  const fetchWaylineFiles = async (workspaceId: string, params?: {
    page?: number
    page_size?: number
    name?: string
  }) => {
    try {
      const response = await waylineApi.getWaylineFiles(workspaceId, params)
      waylineFiles.value = response.data.data
      return response.data.data
    } catch (err) {
      console.error('获取航线文件列表失败:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch wayline progress'
      throw err
    }
  }

  const fetchWaylineDetail = async (workspaceId: string, waylineId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.getWaylineDetail(workspaceId, waylineId)
      waylineDetail.value = response.data
      return response.data
    } catch (err) {
      console.error('获取航线任务详情失败:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch wayline job details'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearJobs = () => {
    jobs.value = []
  }

  const clearWaylineDetail = () => {
    waylineDetail.value = null
  }

  const createJob = async (workspaceId: string, data: {
    name: string
    dock_sn: string
    file_id: string
    task_type: number
    out_of_control_action: number
    rth_altitude: number
    rth_mode: number
    exit_wayline_when_rc_lost: number
    wayline_precision_type: number
    begin_time?: string | null
    end_time?: string | null
    execute_time?: string
    enable_vision?: boolean
    vision_algorithms?: number[]
    vision_threshold?: number
    recurrence_config?: {
      recurrence_type: string // 'date_range'
      start_date: string
      end_date: string
    }
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.createJob(workspaceId, data)
      return response.data
    } catch (err) {
      console.error('创建航线任务失败:', err)
      error.value = err instanceof Error ? err.message : 'Failed to create wayline job'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchWaylineProgress = async (workspaceId: string, dockSn: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.getWaylineProgress(workspaceId, dockSn)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear wayline jobs'
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchWaylineJobDetail = async (workspaceId: string, jobId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.getWaylineJobDetail(workspaceId, jobId)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear wayline details'
      return null
    } finally {
      loading.value = false
    }
  }

  const cancelReturnHome = async (workspaceId: string, dockSn: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.cancelReturnHome(workspaceId, dockSn)
      return response
    } catch (err) {
      console.error('取消返航失败:', err)
      error.value = err instanceof Error ? err.message : 'Failed to cancel return home'
      throw err
    } finally {
      loading.value = false
    }
  }

  const stopJob = async (workspaceId: string, jobId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.stopJob(workspaceId, jobId)
      return response
    } catch (err) {
      console.error('停止任务失败:', err)
      error.value = err instanceof Error ? err.message : 'Failed to stop job'
      throw err
    } finally {
      loading.value = false
    }
  }

  const pauseJob = async (workspaceId: string, jobId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.pauseJob(workspaceId, jobId)

      return response
    } catch (err) {
      console.error('暂停任务失败:', err)
      error.value = err instanceof Error ? err.message : 'Failed to pause job'
      throw err
    } finally {
      loading.value = false
    }
  }

  const resumeJob = async (workspaceId: string, jobId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.resumeJob(workspaceId, jobId)

      return response
    } catch (err) {
      console.error('继续任务失败:', err)
      error.value = err instanceof Error ? err.message : 'Failed to resume job'
      throw err
    } finally {
      loading.value = false
    }
  }

  const executeJob = async (workspaceId: string, jobId: string, algorithmData?: {
    enable_vision?: boolean
    vision_algorithms?: number[]
    vision_threshold?: number
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.executeJob(workspaceId, jobId, algorithmData)

      return response
    } catch (err) {
      console.error('执行任务失败:', err)
      error.value = err instanceof Error ? err.message : '执行任务失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    jobs: readonly(jobs),
    waylineFiles: readonly(waylineFiles),
    waylineDetail: readonly(waylineDetail),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchJobs,
    fetchWaylineFiles,
    fetchWaylineDetail,
    fetchWaylineProgress,
    fetchWaylineJobDetail,
    createJob,
    cancelReturnHome,
    stopJob,
    pauseJob,
    resumeJob,
    executeJob,
    clearJobs,
    clearWaylineDetail
  }
} 
