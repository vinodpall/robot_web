/**
 * 视频流缓存管理工具
 * 统一管理所有视频相关的缓存操作
 */

export interface VideoStream {
  type: 'dock' | 'drone_visible' | 'drone_infrared'
  url: string
  switchable_video_types: string[]
  device_sn: string
  camera_index: string
  video_index: string
  ai_enabled?: boolean
  use_sub_stream?: boolean
}

/**
 * 获取所有视频流信息
 */
/**
 * 根据当前浏览器访问地址动态替换视频流 URL 中的主机 IP
 * 例如访问 172.16.10.249:5173 时，将 webrtc://172.16.1.251:51985/live/... 替换为 webrtc://172.16.10.249:51985/live/...
 */
export const adaptStreamUrl = (rawUrl: string): string => {
  if (!rawUrl || typeof window === 'undefined') return rawUrl
  const currentHost = window.location.hostname
  if (!currentHost || currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return rawUrl
  }
  return rawUrl.replace(/^(webrtc:\/\/)([^/:]+)(:\d+)?(\/.*)?$/i, `$1${currentHost}$3$4`)
}

/**
 * 当通过映射 IP 访问时，确保 SRS 返回的 SDP answer 中包含当前访问主机 IP 的 ICE candidate
 */
export const adaptSdpToCurrentHost = (sdp: string): string => {
  if (!sdp || typeof window === 'undefined') return sdp
  const currentHost = window.location.hostname
  if (!currentHost || currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return sdp
  }
  if (sdp.includes(` ${currentHost} `)) return sdp
  const eol = sdp.includes("\r\n") ? "\r\n" : "\n"
  const lines = sdp.split(/\r?\n/)
  const result: string[] = []
  for (const line of lines) {
    result.push(line)
    const match = line.match(/^(a=candidate:\S+\s+\d+\s+\S+\s+\d+\s+)(\d+\.\d+\.\d+\.\d+)(\s+\d+\s+typ\s+host.*)$/i)
    if (match && match[2] !== currentHost) {
      result.push(`${match[1]}${currentHost}${match[3]}`)
    }
  }
  return result.join(eol)
}

export const getVideoStreams = (): VideoStream[] => {
  try {
    const videoStreamsStr = localStorage.getItem('video_streams')
    if (videoStreamsStr) {
      const parsed = JSON.parse(videoStreamsStr) as VideoStream[]
      return Array.isArray(parsed) ? parsed.map(item => ({ ...item, url: adaptStreamUrl(item.url) })) : []
    }
  } catch (error) {
    console.error('解析video_streams缓存失败:', error)
  }
  return []
}

/**
 * 设置视频流信息
 */
export const setVideoStreams = (streams: VideoStream[]): void => {
  const adapted = Array.isArray(streams) ? streams.map(item => ({ ...item, url: adaptStreamUrl(item.url) })) : []
  localStorage.setItem('video_streams', JSON.stringify(adapted))
}

/**
 * 获取指定类型的视频流
 */
export const getVideoStream = (type: VideoStream['type']): VideoStream | null => {
  const streams = getVideoStreams()
  return streams.find(stream => stream.type === type) || null
}

/**
 * 获取指定类型的视频流URL
 */
export const getVideoStreamUrl = (type: VideoStream['type']): string | null => {
  const stream = getVideoStream(type)
  return stream?.url || null
}

/**
 * 更新指定类型的视频流
 */
export const updateVideoStream = (type: VideoStream['type'], updates: Partial<VideoStream>): void => {
  const streams = getVideoStreams()
  const index = streams.findIndex(stream => stream.type === type)
  
  if (index >= 0) {
    streams[index] = { ...streams[index], ...updates }
  } else {
    streams.push({ ...updates, type } as VideoStream)
  }
  
  setVideoStreams(streams)
}

/**
 * 获取默认视频类型
 */
export const getDefaultVideoType = (): VideoStream['type'] | null => {
  return localStorage.getItem('default_video_type') as VideoStream['type'] | null
}

/**
 * 设置默认视频类型
 */
export const setDefaultVideoType = (type: VideoStream['type']): void => {
  localStorage.setItem('default_video_type', type)
}

/**
 * 清理旧的重复缓存字段
 */
export const cleanupOldVideoCache = (): void => {
  const oldFields = [
    'video_stream_url',
    'drone_video_stream_url', 
    'dock_video_stream_url',
    'current_video_type'
  ]
  
  oldFields.forEach(field => {
    if (localStorage.getItem(field)) {
      localStorage.removeItem(field)
      console.log(`已清理旧缓存字段: ${field}`)
    }
  })
}

/**
 * 检查是否有可用的视频流
 */
export const hasVideoStreams = (): boolean => {
  const streams = getVideoStreams()
  return streams.length > 0
}

/**
 * 获取可用的视频类型列表
 */
export const getAvailableVideoTypes = (): VideoStream['type'][] => {
  const streams = getVideoStreams()
  return streams.map(stream => stream.type)
}

 
