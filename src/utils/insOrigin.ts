import { navigationApi } from '../api/services'

export interface InsOriginCoordinates {
  latitude?: number
  longitude?: number
  altitude?: number
}

const IN_FLIGHT_REQUESTS = new Set<string>()

export const getInsOriginCacheKey = (robotId: string) => `cached_ins_origin_${robotId}`

export const getInsOriginFromCache = (robotId: string): InsOriginCoordinates | null => {
  if (!robotId || typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getInsOriginCacheKey(robotId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed.latitude !== undefined || parsed.longitude !== undefined || parsed.altitude !== undefined)
    ) {
      return parsed as InsOriginCoordinates
    }
  } catch (err) {
    console.error('[INS Origin] 读取缓存失败:', err)
  }
  return null
}

export const setInsOriginToCache = (robotId: string, coords: InsOriginCoordinates): void => {
  if (!robotId || typeof window === 'undefined') return
  try {
    localStorage.setItem(getInsOriginCacheKey(robotId), JSON.stringify(coords))
  } catch (err) {
    console.error('[INS Origin] 写入缓存失败:', err)
  }
}

export const clearInsOriginCache = (robotId?: string): void => {
  if (typeof window === 'undefined') return
  try {
    if (robotId) {
      localStorage.removeItem(getInsOriginCacheKey(robotId))
      return
    }
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key === 'cached_ins_origin' ||
          key === 'ins_origin_coordinates' ||
          key.startsWith('cached_ins_origin_') ||
          key.startsWith('ins_origin_coordinates_'))
      ) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch (err) {
    console.error('[INS Origin] 清除缓存失败:', err)
  }
}

/**
 * 检查并按需获取 INS 原点：
 * 如果缓存中已有 ins 原点坐标，直接返回缓存，不触发接口；
 * 如果缓存中没有，则调用 /v1/navigation/{robot_id}/ins_origin 获取并写入缓存；
 * 静默执行，不做弹窗提示。
 */
export const checkAndFetchInsOrigin = async (
  robotId: string,
  signal?: AbortSignal
): Promise<InsOriginCoordinates | null> => {
  if (!robotId) return null

  // 1. 检查缓存中是否有 ins 原点坐标
  const cached = getInsOriginFromCache(robotId)
  if (cached) {
    return cached
  }

  // 2. 防止同一个 robotId 重复并发请求
  if (IN_FLIGHT_REQUESTS.has(robotId)) {
    return null
  }

  IN_FLIGHT_REQUESTS.add(robotId)
  try {
    const res: any = await navigationApi.getInsOrigin(robotId, { signal })
    const payload = res?.response || res
    const msg = payload?.msg || res?.msg

    // 返回数据结构: msg: { latitude, longitude, altitude, result (1成功/0失败), error_code, error_msg }
    if (msg && typeof msg === 'object' && Number(msg.result) === 1) {
      const coords: InsOriginCoordinates = {
        latitude: typeof msg.latitude === 'number' ? msg.latitude : (msg.latitude ? Number(msg.latitude) : undefined),
        longitude: typeof msg.longitude === 'number' ? msg.longitude : (msg.longitude ? Number(msg.longitude) : undefined),
        altitude: typeof msg.altitude === 'number' ? msg.altitude : (msg.altitude ? Number(msg.altitude) : undefined)
      }
      setInsOriginToCache(robotId, coords)
      return coords
    }
    return null
  } catch (err) {
    // 静默处理，不做弹窗提示
    console.warn('[INS Origin] 获取INS原点坐标失败(静默):', err)
    return null
  } finally {
    IN_FLIGHT_REQUESTS.delete(robotId)
  }
}

/**
 * 解析当前有效原点：
 * 当 INS 开启且循迹开启时，优先使用 INS 原点坐标；
 * 其余情况使用地图的 gnss_origin 原点。
 */
export const resolveEffectiveGnssOrigin = async (
  mapName: string,
  robotId: string,
  options?: {
    isInsRunning?: boolean;
    isTracking?: boolean;
    loadMapGnssOrigin?: (mapName: string) => Promise<{ latitude: number; longitude: number } | null>;
  }
): Promise<{ latitude: number; longitude: number } | null> => {
  const isIns = options?.isInsRunning ?? false
  const isTrack = options?.isTracking ?? false

  if (isIns && isTrack && robotId) {
    let insOrigin = getInsOriginFromCache(robotId)
    if (!insOrigin) {
      insOrigin = await checkAndFetchInsOrigin(robotId)
    }
    if (
      insOrigin &&
      typeof insOrigin.latitude === 'number' &&
      typeof insOrigin.longitude === 'number' &&
      insOrigin.latitude !== 0 &&
      insOrigin.longitude !== 0
    ) {
      return { latitude: insOrigin.latitude, longitude: insOrigin.longitude }
    }
  }

  if (options?.loadMapGnssOrigin && mapName) {
    return await options.loadMapGnssOrigin(mapName)
  }
  return null
}

