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

export const getRobotMapCacheKeys = (robotId: string) => ({
  mapListKey: `cached_map_list_${robotId}`,
  mapUpdateTimeKey: `cached_map_update_time_map_${robotId}`,
  selectedMapKey: `selected_map_name_${robotId}`,
})

// 第一阶段：仅获取摄像头列表并写入缓存，供主界面尽快启动视频流
export const refreshCameraCache = async (robotId: string, signal?: AbortSignal) => {
  if (!robotId) return
  try {
    const cameraResponse = await cameraApi.getCameraList(robotId, signal)
    if (signal?.aborted) return
    if (cameraResponse && cameraResponse.data) {
      localStorage.setItem('camera_list', JSON.stringify(cameraResponse.data))
    }
  } catch (cameraErr) {
    if (isAbortError(cameraErr)) return
    console.error('获取摄像头列表失败:', cameraErr)
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
    localStorage.setItem('cached_map_list', JSON.stringify(mapList))
    localStorage.setItem('cached_map_update_time_map', JSON.stringify(mapUpdateTimeMap))

    const currentSelectedMap =
      localStorage.getItem(selectedMapKey)
      || localStorage.getItem('selected_map_name')
      || ''
    const isCurrentMapValid = currentSelectedMap && mapList.includes(currentSelectedMap)
    // nav_confirmed_map 由 syncMapFromNavigation 写入，表示 WebSocket 已确认的地图，优先级最高
    const navConfirmedMap = localStorage.getItem('nav_confirmed_map') || ''

    if (mapList.length > 0) {
      if (navConfirmedMap && mapList.includes(navConfirmedMap)) {
        localStorage.setItem(selectedMapKey, navConfirmedMap)
        localStorage.setItem('selected_map_name', navConfirmedMap)
      } else if (options.forceResetMapSelection || !isCurrentMapValid) {
        localStorage.setItem(selectedMapKey, mapList[0])
        localStorage.setItem('selected_map_name', mapList[0])
      }
    } else {
      localStorage.removeItem(selectedMapKey)
      localStorage.removeItem('selected_map_name')
    }
  } catch (mapErr) {
    if (isAbortError(mapErr)) return
    console.error('获取地图列表失败:', mapErr)
  }
}

export const refreshRobotRelatedCache = async (
  robotId: string,
  options: RefreshRobotCacheOptions = {},
  signal?: AbortSignal
) => {
  if (!robotId) return

  // 摄像头列表已由 refreshCameraCache 单独处理，此处不重复请求
  if (!options.skipMapRefresh) {
    await refreshMapCache(robotId, options, signal)
    if (signal?.aborted) return
  }

  try {
    const trackTaskResponse = await navigationApi.getAllTrackTaskList(robotId, signal)
    if (signal?.aborted) return
    const allTrackTaskList = extractTrackTaskList(trackTaskResponse)
    localStorage.setItem('all_track_task_list', JSON.stringify(allTrackTaskList))
  } catch (trackErr) {
    if (isAbortError(trackErr)) return
    console.error('获取循迹任务点列表失败:', trackErr)
  }

  try {
    const trackListResponse = await navigationApi.getTrackList(robotId, signal)
    if (signal?.aborted) return
    const rawTrackList = trackListResponse?.msg?.result || []
    localStorage.setItem('cached_track_list', JSON.stringify(rawTrackList))
  } catch (trackListErr) {
    if (isAbortError(trackListErr)) return
    console.error('获取循迹列表失败:', trackListErr)
  }

  try {
    const cachedTrackListRaw = localStorage.getItem('cached_track_list')
    const currentTrackList = cachedTrackListRaw ? JSON.parse(cachedTrackListRaw) : []
    if (!Array.isArray(currentTrackList) || currentTrackList.length === 0) {
      const cachedAllTaskListRaw = localStorage.getItem('all_track_task_list')
      const allTaskList = cachedAllTaskListRaw ? extractTrackTaskList(JSON.parse(cachedAllTaskListRaw)) : []
      const derivedTracks = Array.from(
        new Set(allTaskList.map((task: any) => String(task.track_name || '').trim()).filter(Boolean))
      )
      localStorage.setItem('cached_track_list', JSON.stringify(derivedTracks))
    }
  } catch (deriveTrackErr) {
    console.error('从任务点缓存推导循迹列表失败:', deriveTrackErr)
  }

  try {
    const cachedTrackListRaw = localStorage.getItem('cached_track_list')
    const trackList: string[] = cachedTrackListRaw ? JSON.parse(cachedTrackListRaw) : []
    const trackSet = Array.from(new Set(trackList.map(item => normalizeTrackName(item)).filter(Boolean)))
    const taskGroupMap: Record<string, string[]> = {}

    for (const trackName of trackSet) {
      if (signal?.aborted) return
      try {
        const resp = await navigationApi.getTaskpointList(robotId, trackName, signal)
        if (signal?.aborted) return
        const groups = Array.isArray(resp?.msg?.result) ? resp.msg.result : []
        taskGroupMap[trackName] = Array.from(new Set(groups.map((g: string) => normalizeTaskGroupName(g)).filter(Boolean)))
      } catch (err) {
        if (isAbortError(err)) return
        console.error(`获取任务组列表失败 ${trackName}`, err)
        taskGroupMap[trackName] = []
      }
    }

    const cachedAllTaskListRaw = localStorage.getItem('all_track_task_list')
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

    localStorage.setItem('cached_taskpoint_group_map', JSON.stringify(taskGroupMap))
  } catch (taskGroupErr) {
    if (isAbortError(taskGroupErr)) return
    console.error('构建任务组缓存失败:', taskGroupErr)
  }

  try {
    const pointTaskResponse = await navigationApi.getPointTaskList(robotId, signal)
    if (signal?.aborted) return
    const pointTaskList = Array.isArray(pointTaskResponse?.data) ? pointTaskResponse.data : []
    localStorage.setItem('cached_point_task_list', JSON.stringify(pointTaskList))
  } catch (pointTaskErr) {
    if (isAbortError(pointTaskErr)) return
    console.error('获取发布点任务列表失败:', pointTaskErr)
  }

  try {
    const multiTaskResponse = await navigationApi.getMultiTaskList(robotId, signal)
    if (signal?.aborted) return
    const multiTaskList = Array.isArray(multiTaskResponse?.msg) ? multiTaskResponse.msg : []
    localStorage.setItem('cached_multi_task_list', JSON.stringify(multiTaskList))
  } catch (multiTaskErr) {
    if (isAbortError(multiTaskErr)) return
    console.error('获取多任务组列表失败:', multiTaskErr)
  }
}
