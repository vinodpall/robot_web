const decodeSafely = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const encodePath = (path: string): string => {
  return String(path || '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map(seg => encodeURIComponent(decodeSafely(seg)))
    .join('/')
}

const getSelectedRobotIp = (robotId: string): string => {
  try {
    const raw = localStorage.getItem('selected_robot_info')
    if (!raw) return ''
    const selected = JSON.parse(raw) as { robot_id?: string; ip_address?: string }
    if (String(selected?.robot_id || '') !== String(robotId || '')) return ''
    return String(selected?.ip_address || '').trim()
  } catch {
    return ''
  }
}

export const buildRobotHttpAssetUrl = (
  robotId: string,
  port: number,
  rawPathOrUrl: string,
  options?: {
    preferDirectForPort81?: boolean
  }
): string => {
  const value = String(rawPathOrUrl || '').trim()
  if (!value) return ''
  if (value.startsWith('/v1/robots/')) return value

  let path = value
  let search = ''

  if (value.startsWith('//')) {
    return buildRobotHttpAssetUrl(robotId, port, `${window.location.protocol}${value}`)
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      path = parsed.pathname
      search = parsed.search
    } catch {
      return value
    }
  } else {
    const qIdx = value.indexOf('?')
    if (qIdx >= 0) {
      path = value.slice(0, qIdx)
      search = value.slice(qIdx)
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const encodedPath = encodePath(normalizedPath)

  // 端口 81 的静态资源（图片等）用于 <img src>，浏览器不会带 Authorization 头。
  // 因此优先直连机器人 81 端口，避免走 /v1 鉴权链路导致 401 循环请求。
  const preferDirectForPort81 = options?.preferDirectForPort81 !== false
  if (port === 81 && preferDirectForPort81) {
    const robotIp = getSelectedRobotIp(robotId)
    if (robotIp) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
      return `${protocol}//${robotIp}:${port}/${encodedPath}${search}`
    }
  }

  return `/v1/robots/${encodeURIComponent(robotId)}/http/${port}/${encodedPath}${search}`
}
