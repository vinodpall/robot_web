import { ref, readonly, computed } from 'vue'
import { useDeviceStatus } from './useDeviceStatus'
import { useWaylineJobs, useHmsAlerts } from './useApi'
import { useAlertNotificationStore } from '../stores/alertNotification'

let globalPollingInstance: ReturnType<typeof createPollingInstance> | null = null

function createPollingInstance() {
  const {
    fetchMainDeviceStatus,
    fetchDroneStatus,
    position,
    environment,
    dockStatus,
    droneStatus,
    gpsStatus,
    osdData
  } = useDeviceStatus()

  const { fetchWaylineProgress } = useWaylineJobs()
  const { fetchDeviceHms } = useHmsAlerts()
  const alertNotificationStore = useAlertNotificationStore()

  const isPolling = ref(false)
  const lastPollTime = ref<number>(0)

  const pollingCache = ref({
    deviceStatus: null as any,
    droneStatus: null as any,
    waylineProgress: null as any,
    hmsAlerts: [] as any[],
    lastUpdate: 0
  })

  const getCachedDeviceSns = () => {
    try {
      const dockSns = JSON.parse(localStorage.getItem('cached_dock_sns') || '[]')
      const droneSns = JSON.parse(localStorage.getItem('cached_drone_sns') || '[]')
      return { dockSns, droneSns }
    } catch (error) {
      console.error('获取缓存设备信息失败:', error)
      return { dockSns: [], droneSns: [] }
    }
  }

  const getCachedWorkspaceId = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.workspace_id
      }
    } catch (error) {
      console.error('获取缓存workspaceId失败:', error)
    }
    return null
  }

  const fetchAllDeviceStatus = async () => {
    isPolling.value = true

    try {
      const [deviceStatus, droneStatusResult] = await Promise.allSettled([
        fetchMainDeviceStatus(),
        fetchDroneStatus()
      ])

      pollingCache.value.deviceStatus =
        deviceStatus.status === 'fulfilled' ? deviceStatus.value : null
      pollingCache.value.droneStatus =
        droneStatusResult.status === 'fulfilled' ? droneStatusResult.value : null
      pollingCache.value.lastUpdate = Date.now()
      lastPollTime.value = pollingCache.value.lastUpdate

      return {
        deviceStatus: pollingCache.value.deviceStatus,
        droneStatus: pollingCache.value.droneStatus,
        waylineProgress: pollingCache.value.waylineProgress,
        success: true
      }
    } catch (error) {
      console.error('统一状态获取失败:', error)
      return {
        deviceStatus: null,
        droneStatus: null,
        waylineProgress: null,
        success: false,
        error
      }
    } finally {
      isPolling.value = false
    }
  }

  const refreshAlerts = async () => {
    const { dockSns, droneSns } = getCachedDeviceSns()
    const targets = [...dockSns, ...droneSns]

    if (!targets.length) {
      pollingCache.value.hmsAlerts = []
      return
    }

    const currentTime = Date.now()
    const timeThreshold = 15000
    const newAlerts: any[] = []

    for (const deviceSn of targets) {
      try {
        const alerts = await fetchDeviceHms(deviceSn)
        if (!alerts?.length) continue

        const filtered = alerts
          .filter(alert => currentTime - alert.create_time <= timeThreshold && alert.level === 2)
          .map(alert => ({
            ...alert,
            deviceType: dockSns.includes(deviceSn) ? '机场' : '无人机'
          }))

        newAlerts.push(...filtered)
      } catch (error) {
        console.error(`获取设备 ${deviceSn} HMS报警失败:`, error)
      }
    }

    if (newAlerts.length) {
      const latestWarningAlert = newAlerts.sort(
        (a, b) => (b.create_time || 0) - (a.create_time || 0)
      )[0]
      alertNotificationStore.triggerAlertDialog(latestWarningAlert)
    }

    pollingCache.value.hmsAlerts = newAlerts
  }

  const refreshWaylineProgress = async () => {
    try {
      const workspaceId = getCachedWorkspaceId()
      const { dockSns } = getCachedDeviceSns()

      if (!workspaceId || dockSns.length === 0) {
        console.error('无法刷新航线进度：缺少workspace_id或dock_sn')
        return null
      }

      const dockSn = dockSns[0]
      const progress = await fetchWaylineProgress(workspaceId, dockSn)
      pollingCache.value.waylineProgress = progress
      return progress
    } catch (error) {
      console.error('刷新航线进度失败:', error)
      return null
    }
  }

  const startUnifiedPolling = async () => {
    await fetchAllDeviceStatus()
    await refreshWaylineProgress()
    await refreshAlerts()
  }

  const stopUnifiedPolling = () => {
    isPolling.value = false
  }

  const refreshStatus = async () => {
    return await fetchAllDeviceStatus()
  }

  const getPollingStatus = () => ({
    isPolling: isPolling.value,
    lastPollTime: lastPollTime.value,
    cache: pollingCache.value
  })

  const waylineProgressState = computed(() => pollingCache.value.waylineProgress)

  return {
    isPolling: readonly(isPolling),
    lastPollTime: readonly(lastPollTime),
    pollingCache: readonly(pollingCache),
    waylineProgress: waylineProgressState,
    startUnifiedPolling,
    stopUnifiedPolling,
    refreshStatus,
    refreshWaylineProgress,
    getPollingStatus,
    position,
    environment,
    dockStatus,
    droneStatus,
    gpsStatus,
    osdData
  }
}

export function useDevicePolling() {
  if (!globalPollingInstance) {
    globalPollingInstance = createPollingInstance()
    console.log('🌐 创建全局轮询实例')
  } else {
    console.log('🌐 使用现有全局轮询实例')
  }

  return globalPollingInstance
}
