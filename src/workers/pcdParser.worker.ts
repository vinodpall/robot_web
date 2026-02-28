// PCD 文件解析 Web Worker
// 将重计算移出主线程，避免界面卡顿

interface RawPointCloudPoint {
  x: number
  y: number
  z?: number
  intensityValue?: number
}

interface PointCloudPoint {
  x: number
  y: number
  z: number
  intensity: number
}

interface PcdHeaderInfo {
  fields: string[]
  size: number[]
  type: string[]
  count: number[]
  points: number
  width: number
  height: number
  dataType: string
  dataStartIndex: number
}

interface NormalizationParams {
  centerX: number
  centerY: number
  centerZ: number
  maxRange: number
}

function readBinaryValue(view: DataView, offset: number, type: string, size: number): number {
  switch (type) {
    case 'F':
      if (size === 8) return view.getFloat64(offset, true)
      return view.getFloat32(offset, true)
    case 'I':
      if (size === 1) return view.getInt8(offset)
      if (size === 2) return view.getInt16(offset, true)
      return view.getInt32(offset, true)
    case 'U':
      if (size === 1) return view.getUint8(offset)
      if (size === 2) return view.getUint16(offset, true)
      return view.getUint32(offset, true)
    default:
      return view.getFloat32(offset, true)
  }
}

function extractPcdHeaderInfo(buffer: ArrayBuffer): PcdHeaderInfo {
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('utf-8')
  let lineStart = 0
  const headerInfo: PcdHeaderInfo = {
    fields: [],
    size: [],
    type: [],
    count: [],
    points: 0,
    width: 0,
    height: 0,
    dataType: 'ascii',
    dataStartIndex: buffer.byteLength
  }

  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0x0a) {
      const line = decoder.decode(bytes.slice(lineStart, i)).replace(/\r/g, '').trim()
      const lowerLine = line.toLowerCase()
      if (lowerLine.startsWith('fields')) {
        headerInfo.fields = line.split(/\s+/).slice(1)
      } else if (lowerLine.startsWith('size')) {
        headerInfo.size = line.split(/\s+/).slice(1).map(val => Number(val) || 0)
      } else if (lowerLine.startsWith('type')) {
        headerInfo.type = line.split(/\s+/).slice(1).map(val => val.toUpperCase())
      } else if (lowerLine.startsWith('count')) {
        headerInfo.count = line.split(/\s+/).slice(1).map(val => Number(val) || 1)
      } else if (lowerLine.startsWith('points')) {
        headerInfo.points = Number(line.split(/\s+/)[1]) || 0
      } else if (lowerLine.startsWith('width')) {
        headerInfo.width = Number(line.split(/\s+/)[1]) || 0
      } else if (lowerLine.startsWith('height')) {
        headerInfo.height = Number(line.split(/\s+/)[1]) || 0
      } else if (lowerLine.startsWith('data')) {
        headerInfo.dataType = line.split(/\s+/)[1]?.toLowerCase() || 'ascii'
        headerInfo.dataStartIndex = i + 1
        break
      }
      lineStart = i + 1
    }
  }

  if (!headerInfo.count.length && headerInfo.fields.length) {
    headerInfo.count = headerInfo.fields.map(() => 1)
  }
  return headerInfo
}

function normalizePointCloud(rawPoints: RawPointCloudPoint[]): { points: PointCloudPoint[], normParams: NormalizationParams } {
  if (!rawPoints.length) return {
    points: [],
    normParams: { centerX: 0, centerY: 0, centerZ: 0, maxRange: 1 }
  }

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity
  let minIntensity = Infinity, maxIntensity = -Infinity
  let hasIntensity = false

  for (const p of rawPoints) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
    const z = p.z ?? 0
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
    if (p.intensityValue !== undefined && Number.isFinite(p.intensityValue)) {
      hasIntensity = true
      if (p.intensityValue < minIntensity) minIntensity = p.intensityValue
      if (p.intensityValue > maxIntensity) maxIntensity = p.intensityValue
    }
  }

  if (!hasIntensity) { minIntensity = 0; maxIntensity = 1 }

  const rangeX = maxX - minX
  const rangeY = maxY - minY
  const rangeZ = maxZ - minZ
  const maxRange = Math.max(rangeX, rangeY, rangeZ, 1e-6)
  const centerX = (maxX + minX) / 2
  const centerY = (maxY + minY) / 2
  const centerZ = (maxZ + minZ) / 2
  const intensityRange = maxIntensity - minIntensity || 1

  const points: PointCloudPoint[] = rawPoints.map(point => {
    const centeredZ = point.z ?? centerZ
    let normalizedIntensity: number
    if (point.intensityValue !== undefined && Number.isFinite(point.intensityValue)) {
      normalizedIntensity = (point.intensityValue - minIntensity) / intensityRange
    } else if (point.z !== undefined && Number.isFinite(point.z)) {
      normalizedIntensity = (point.z - minZ) / (rangeZ || 1)
    } else {
      normalizedIntensity = 0.5
    }
    normalizedIntensity = Math.min(1, Math.max(0, normalizedIntensity))
    return {
      x: (point.x - centerX) / maxRange,
      y: (point.y - centerY) / maxRange,
      z: (centeredZ - centerZ) / maxRange,
      intensity: normalizedIntensity
    }
  })

  // 随机降采样，最多保留 80000 点，避免渲染卡顿
  const MAX_POINTS = 80000
  const sampled = points.length > MAX_POINTS
    ? points.filter(() => Math.random() < MAX_POINTS / points.length)
    : points

  return { points: sampled, normParams: { centerX, centerY, centerZ, maxRange } }
}

function parseBinaryPcdContent(buffer: ArrayBuffer, headerInfo: PcdHeaderInfo) {
  const counts = headerInfo.count.length ? headerInfo.count : headerInfo.fields.map(() => 1)
  const stride = headerInfo.fields.reduce((sum, _, idx) => {
    return sum + (headerInfo.size[idx] || 0) * (counts[idx] || 1)
  }, 0)
  if (!stride) return normalizePointCloud([])

  const bytesAvailable = buffer.byteLength - headerInfo.dataStartIndex
  if (bytesAvailable <= 0) return normalizePointCloud([])

  const totalPoints = headerInfo.points || (headerInfo.width * headerInfo.height) || 0
  const maxReadablePoints = Math.floor(bytesAvailable / stride)
  const pointsToRead = totalPoints > 0 ? Math.min(totalPoints, maxReadablePoints) : maxReadablePoints

  const view = new DataView(buffer, headerInfo.dataStartIndex)
  const rawPoints: RawPointCloudPoint[] = []

  for (let pointIndex = 0; pointIndex < pointsToRead; pointIndex++) {
    const baseOffset = pointIndex * stride
    let fieldOffset = 0
    let truncated = false
    const point: RawPointCloudPoint = { x: 0, y: 0, z: 0 }

    for (let fieldIndex = 0; fieldIndex < headerInfo.fields.length; fieldIndex++) {
      const field = headerInfo.fields[fieldIndex]
      const size = headerInfo.size[fieldIndex] || 0
      const repeat = counts[fieldIndex] || 1
      const type = headerInfo.type[fieldIndex] || 'F'

      for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex++) {
        const valueOffset = baseOffset + fieldOffset + repeatIndex * size
        if (valueOffset + size > bytesAvailable) { truncated = true; break }

        if (field === 'rgb') {
          const rgbValue = view.getUint32(valueOffset, true)
          const r = rgbValue & 0xff
          const g = (rgbValue >> 8) & 0xff
          const b = (rgbValue >> 16) & 0xff
          point.intensityValue = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        } else {
          const value = readBinaryValue(view, valueOffset, type, size)
          if (field === 'x') point.x = value
          else if (field === 'y') point.y = value
          else if (field === 'z') point.z = value
          else if (field === 'intensity') point.intensityValue = value
        }
      }

      if (truncated) break
      fieldOffset += size * repeat
    }

    if (truncated) break
    if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
      rawPoints.push(point)
    }
  }

  return normalizePointCloud(rawPoints)
}

function parseAsciiPcdContent(content: string) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'))
  const dataIndex = lines.findIndex(l => l.toLowerCase().startsWith('data'))
  if (dataIndex === -1) return normalizePointCloud([])
  const headerLines = lines.slice(0, dataIndex)
  const dataLines = lines.slice(dataIndex + 1)
  const fieldsLine = headerLines.find(l => l.toLowerCase().startsWith('fields'))
  const fields = fieldsLine ? fieldsLine.split(/\s+/).slice(1) : []
  const xIndex = fields.indexOf('x')
  const yIndex = fields.indexOf('y')
  const zIndex = fields.indexOf('z')
  const intensityIndex = fields.findIndex(f => f === 'intensity' || f === 'rgb')
  if (xIndex === -1 || yIndex === -1) return normalizePointCloud([])

  const rawPoints = dataLines
    .map(line => line.split(/\s+/))
    .filter(parts => parts.length > Math.max(xIndex, yIndex))
    .map(parts => ({
      x: parseFloat(parts[xIndex]),
      y: parseFloat(parts[yIndex]),
      z: zIndex !== -1 ? parseFloat(parts[zIndex]) : 0,
      intensityValue: intensityIndex !== -1 ? parseFloat(parts[intensityIndex]) : undefined
    }))
    .filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y))

  return normalizePointCloud(rawPoints)
}

function parsePcdBuffer(buffer: ArrayBuffer) {
  const headerInfo = extractPcdHeaderInfo(buffer)
  if (!headerInfo.fields.length) return normalizePointCloud([])

  if (headerInfo.dataType === 'binary') {
    return parseBinaryPcdContent(buffer, headerInfo)
  }
  if (headerInfo.dataType === 'binary_compressed') {
    console.warn('暂不支持 binary_compressed PCD 数据')
    return normalizePointCloud([])
  }
  return parseAsciiPcdContent(new TextDecoder('utf-8').decode(buffer))
}

// Worker 消息处理
self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
  try {
    const result = parsePcdBuffer(e.data.buffer)
    self.postMessage({ ok: true, points: result.points, normParams: result.normParams })
  } catch (err: any) {
    self.postMessage({ ok: false, error: err?.message || String(err) })
  }
}
