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

export const buildRobotHttpAssetUrl = (
  robotId: string,
  port: number,
  rawPathOrUrl: string
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
  return `/v1/robots/${encodeURIComponent(robotId)}/http/${port}/${encodedPath}${search}`
}
