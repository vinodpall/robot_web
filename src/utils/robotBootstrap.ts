import { cameraApi, navigationApi } from '../api/services'

const normalizeTrackName = (raw: string) => {
  const name = (raw || '').trim()
  const atIndex = name.indexOf('@')
  return atIndex > -1 ? name.slice(0, atIndex) : name
}

const normalizeTaskGroupName = (raw: string) => {
  const name = (raw || '').trim()
  const atIndex = name.indexOf('@')
  return atIndex > -1 ? name.slice(0, atIndex) : name
}

const extractTrackTaskList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.response?.data)) return payload.response.data
  return []
}

interface RefreshRobotCacheOptions {
  forceResetMapSelection?: boolean
  skipMapRefresh?: boolean
}

const isAbortError = (e: any) => e?.name === 'AbortError' || e?.message === 'canceled'

const shouldSyncLegacyCache = (robotId: string) => {
  if (typeof window === 'undefined') return false
  const currentRobotId = localStorage.getItem('selected_robot_id') || ''
  return !currentRobotId || currentRobotId === robotId
}

export const getRobotMapCacheKeys = (robotId: string) => ({
  mapListKey: `cached_map_list_${robotId}`,
  mapUpdateTimeKey: `cached_map_update_time_map_${robotId}`,
  selectedMapKey: `selected_map_name_${robotId}`,
})

export const getRobotContextCacheKeys = (robotId: string) => ({
  allTrackTaskListKey: `all_track_task_list_${robotId}`,
  trackListKey: `cached_track_list_${robotId}`,
  taskpointGroupMapKey: `cached_taskpoint_group_map_${robotId}`,
  pointTaskListKey: `cached_point_task_list_${robotId}`,
  multiTaskListKey: `cached_multi_task_list_${robotId}`,
})

// 绗竴闃舵锛氫粎鑾峰彇鎽勫儚澶村垪琛ㄥ苟鍐欏叆缂撳瓨锛屼緵涓荤晫闈㈠敖蹇惎鍔ㄨ棰戞祦
export const refreshCameraCache = async (robotId: string, signal?: AbortSignal) => {
  if (!robotId) return
  try {
    const cameraResponse = await cameraApi.getCameraList(robotId, signal)
    if (signal?.aborted) return
    if (cameraResponse && cameraResponse.data) {
      localStorage.setItem(`camera_list_${robotId}`, JSON.stringify(cameraResponse.data))
      if (shouldSyncLegacyCache(robotId)) {
        localStorage.setItem('camera_list', JSON.stringify(cameraResponse.data))
      }
    }
  } catch (cameraErr) {
    if (isAbortError(cameraErr)) return
    console.error('鑾峰彇鎽勫儚澶村垪琛ㄥけ璐?', cameraErr)
  }
}

export const refreshMapCache = async (
  robotId: string,
  options: RefreshRobotCacheOptions = {},
  signal?: AbortSignal
) => {
  if (!robotId) return

  try {
    const mapListResponse = await navigationApi.getMapList(robotId, signal)
    if (signal?.aborted) return
    const mapList: string[] = []
    const mapUpdateTimeMap: Record<string, string> = {}
    const rawList = mapListResponse?.msg?.result || []

    rawList.forEach((item: string) => {
      const atIndex = item.indexOf('@')
      if (atIndex !== -1) {
        const mapName = item.substring(0, atIndex)
        const updateTime = item.substring(atIndex + 1)
        mapList.push(mapName)
        mapUpdateTimeMap[mapName] = updateTime
      } else {
        mapList.push(item)
        mapUpdateTimeMap[item] = ''
      }
    })

    const { mapListKey, mapUpdateTimeKey, selectedMapKey } = getRobotMapCacheKeys(robotId)
    localStorage.setItem(mapListKey, JSON.stringify(mapList))
    localStorage.setItem(mapUpdateTimeKey, JSON.stringify(mapUpdateTimeMap))
    if (shouldSyncLegacyCache(robotId)) {
      localStorage.setItem('cached_map_list', JSON.stringify(mapList))
      localStorage.setItem('cached_map_update_time_map', JSON.stringify(mapUpdateTimeMap))
    }

    const currentSelectedMap =
      localStorage.getItem(selectedMapKey)
      || localStorage.getItem('selected_map_name')
      || ''
    const isCurrentMapValid = currentSelectedMap && mapList.includes(currentSelectedMap)
    // nav_confirmed_map 由 syncMapFromNavigation 写入，表示 WebSocket 确认的地图，优先级最高
    const navConfirmedMap = localStorage.getItem('nav_confirmed_map') || ''

    if (mapList.length > 0) {
      if (navConfirmedMap && mapList.includes(navConfirmedMap)) {
        localStorage.setItem(selectedMapKey, navConfirmedMap)
        if (shouldSyncLegacyCache(robotId)) {
          localStorage.setItem('selected_map_name', navConfirmedMap)
        }
      } else if (options.forceResetMapSelection || !isCurrentMapValid) {
        localStorage.setItem(selectedMapKey, mapList[0])
        if (shouldSyncLegacyCache(robotId)) {
          localStorage.setItem('selected_map_name', mapList[0])
        }
      }
    } else {
      localStorage.removeItem(selectedMapKey)
      if (shouldSyncLegacyCache(robotId)) {
        localStorage.removeItem('selected_map_name')
      }
    }
  } catch (mapErr) {
    if (isAbortError(mapErr)) return
    console.error('鑾峰彇鍦板浘鍒楄〃澶辫触:', mapErr)
  }
}

export const refreshRobotRelatedCache = async (
  robotId: string,
  options: RefreshRobotCacheOptions = {},
  signal?: AbortSignal
) => {
  if (!robotId) return
  const contextKeys = getRobotContextCacheKeys(robotId)

  // 鎽勫儚澶村垪琛ㄥ凡鐢?refreshCameraCache 鍗曠嫭澶勭悊锛屾澶勪笉閲嶅璇锋眰
  if (!options.skipMapRefresh) {
    await refreshMapCache(robotId, options, signal)
    if (signal?.aborted) return
  }

  try {
    const trackTaskResponse = await navigationApi.getAllTrackTaskList(robotId, signal)
    if (signal?.aborted) return
    const allTrackTaskList = extractTrackTaskList(trackTaskResponse)
    localStorage.setItem(contextKeys.allTrackTaskListKey, JSON.stringify(allTrackTaskList))
    if (shouldSyncLegacyCache(robotId)) {
      localStorage.setItem('all_track_task_list', JSON.stringify(allTrackTaskList))
    }
  } catch (trackErr) {
    if (isAbortError(trackErr)) return
    console.error('鑾峰彇寰抗浠诲姟鐐瑰垪琛ㄥけ璐?', trackErr)
  }

  try {
    const trackListResponse = await navigationApi.getTrackList(robotId, signal)
    if (signal?.aborted) return
    const rawTrackList = trackListResponse?.msg?.result || []
    localStorage.setItem(contextKeys.trackListKey, JSON.stringify(rawTrackList))
    if (shouldSyncLegacyCache(robotId)) {
      localStorage.setItem('cached_track_list', JSON.stringify(rawTrackList))
    }
  } catch (trackListErr) {
    if (isAbortError(trackListErr)) return
    console.error('鑾峰彇寰抗鍒楄〃澶辫触:', trackListErr)
  }

  try {
    const cachedTrackListRaw = localStorage.getItem(contextKeys.trackListKey)
    const currentTrackList = cachedTrackListRaw ? JSON.parse(cachedTrackListRaw) : []
    if (!Array.isArray(currentTrackList) || currentTrackList.length === 0) {
      const cachedAllTaskListRaw = localStorage.getItem(contextKeys.allTrackTaskListKey)
      const allTaskList = cachedAllTaskListRaw ? extractTrackTaskList(JSON.parse(cachedAllTaskListRaw)) : []
      const derivedTracks = Array.from(
        new Set(allTaskList.map((task: any) => String(task.track_name || '').trim()).filter(Boolean))
      )
      localStorage.setItem(contextKeys.trackListKey, JSON.stringify(derivedTracks))
      if (shouldSyncLegacyCache(robotId)) {
        localStorage.setItem('cached_track_list', JSON.stringify(derivedTracks))
      }
    }
  } catch (deriveTrackErr) {
    console.error('浠庝换鍔＄偣缂撳瓨鎺ㄥ寰抗鍒楄〃澶辫触:', deriveTrackErr)
  }

  try {
    const taskGroupMap: Record<string, string[]> = {}

    const cachedAllTaskListRaw = localStorage.getItem(contextKeys.allTrackTaskListKey)
    if (cachedAllTaskListRaw) {
      const allTaskList = extractTrackTaskList(JSON.parse(cachedAllTaskListRaw))
      allTaskList.forEach((task: any) => {
        const trackName = normalizeTrackName(String(task.track_name || ''))
        const groupName = normalizeTaskGroupName(String(task.track_point_name || task.taskpoint_name || task.task_point_name || ''))
        if (!trackName || !groupName) return
        if (!taskGroupMap[trackName]) taskGroupMap[trackName] = []
        if (!taskGroupMap[trackName].includes(groupName)) {
          taskGroupMap[trackName].push(groupName)
        }
      })
    }

    localStorage.setItem(contextKeys.taskpointGroupMapKey, JSON.stringify(taskGroupMap))
    if (shouldSyncLegacyCache(robotId)) {
      localStorage.setItem('cached_taskpoint_group_map', JSON.stringify(taskGroupMap))
    }
  } catch (taskGroupErr) {
    if (isAbortError(taskGroupErr)) return
    console.error('鏋勫缓浠诲姟缁勭紦瀛樺け璐?', taskGroupErr)
  }

  try {
    const pointTaskResponse = await navigationApi.getPointTaskList(robotId, signal)
    if (signal?.aborted) return
    const pointTaskList = Array.isArray(pointTaskResponse?.data) ? pointTaskResponse.data : []
    localStorage.setItem(contextKeys.pointTaskListKey, JSON.stringify(pointTaskList))
    if (shouldSyncLegacyCache(robotId)) {
      localStorage.setItem('cached_point_task_list', JSON.stringify(pointTaskList))
    }
  } catch (pointTaskErr) {
    if (isAbortError(pointTaskErr)) return
    console.error('鑾峰彇鍙戝竷鐐逛换鍔″垪琛ㄥけ璐?', pointTaskErr)
  }

  try {
    const multiTaskResponse = await navigationApi.getMultiTaskList(robotId, signal)
    if (signal?.aborted) return
    const multiTaskList = Array.isArray(multiTaskResponse?.msg) ? multiTaskResponse.msg : []
    localStorage.setItem(contextKeys.multiTaskListKey, JSON.stringify(multiTaskList))
    if (shouldSyncLegacyCache(robotId)) {
      localStorage.setItem('cached_multi_task_list', JSON.stringify(multiTaskList))
    }
  } catch (multiTaskErr) {
    if (isAbortError(multiTaskErr)) return
    console.error('鑾峰彇澶氫换鍔＄粍鍒楄〃澶辫触:', multiTaskErr)
  }
}
