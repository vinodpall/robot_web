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

export const refreshRobotRelatedCache = async (robotId: string) => {
  if (!robotId) return

  try {
    const cameraResponse = await cameraApi.getCameraList(robotId)
    if (cameraResponse && cameraResponse.data) {
      localStorage.setItem('camera_list', JSON.stringify(cameraResponse.data))
      const cameraList = cameraResponse.data || []
      for (let i = 0; i < 2; i++) {
        if (cameraList[i]) {
          try {
            await cameraApi.startCameraStream(robotId, cameraList[i].CamKey, false)
          } catch (_e) {
            // ignore per-camera failures
          }
        }
      }
    }
  } catch (cameraErr) {
    console.error('获取摄像头列表失败:', cameraErr)
  }

  try {
    const trackTaskResponse = await navigationApi.getAllTrackTaskList(robotId)
    const allTrackTaskList = extractTrackTaskList(trackTaskResponse)
    localStorage.setItem('all_track_task_list', JSON.stringify(allTrackTaskList))
  } catch (trackErr) {
    console.error('获取循迹任务点列表失败:', trackErr)
  }

  try {
    const mapListResponse = await navigationApi.getMapList(robotId)
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

    localStorage.setItem('cached_map_list', JSON.stringify(mapList))
    localStorage.setItem('cached_map_update_time_map', JSON.stringify(mapUpdateTimeMap))

    if (!localStorage.getItem('selected_map_name') && mapList.length > 0) {
      localStorage.setItem('selected_map_name', mapList[0])
    }
  } catch (mapErr) {
    console.error('获取地图列表失败:', mapErr)
  }

  try {
    const trackListResponse = await navigationApi.getTrackList(robotId)
    const rawTrackList = trackListResponse?.msg?.result || []
    localStorage.setItem('cached_track_list', JSON.stringify(rawTrackList))
  } catch (trackListErr) {
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
      try {
        const resp = await navigationApi.getTaskpointList(robotId, trackName)
        const groups = Array.isArray(resp?.msg?.result) ? resp.msg.result : []
        taskGroupMap[trackName] = Array.from(new Set(groups.map((g: string) => normalizeTaskGroupName(g)).filter(Boolean)))
      } catch (err) {
        console.error(`获取任务组列表失败: ${trackName}`, err)
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
    console.error('构建任务组缓存失败:', taskGroupErr)
  }
}
