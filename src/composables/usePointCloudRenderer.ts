/**
 * usePointCloudRenderer
 * 点云图渲染 Composable，供 Home.vue / NavigationManage.vue 等页面复用
 *
 * 功能：
 *  - 点云数据归一化（含保存归一化参数）
 *  - PCD 文件解析（ASCII / Binary）
 *  - Canvas 3D 投影渲染（带轨迹叠加 intensity≥1.9 显示为绿色、原点标记）
 *  - 交互：旋转、平移、缩放（滚轮/指针/键盘）
 */

import { ref, shallowRef } from 'vue'

// ==================== Types ====================

export interface PointCloudPoint {
  x: number
  y: number
  z: number
  intensity: number
}

interface RawPointCloudPoint {
  x: number
  y: number
  z?: number
  intensityValue?: number
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

export interface NormalizationParams {
  centerX: number
  centerY: number
  centerZ: number
  maxRange: number
}

// ==================== Options ====================

export interface UsePointCloudRendererOptions {
  /** 初始缩放比例（默认 1） */
  initialScale?: number
  /** 初始点大小系数（默认 0.5） */
  initialPointSize?: number
}

// ==================== Composable ====================

export function usePointCloudRenderer(options: UsePointCloudRendererOptions = {}) {
  const { initialScale = 1, initialPointSize = 0.5 } = options

  // --- canvas ref（由页面绑定到 <canvas :ref="...">） ---
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  // --- 视图交互状态 ---
  const scale = ref(initialScale)
  const rotationX = ref(-(20 * Math.PI) / 180)
  const rotationY = ref(0)
  const panX = ref(0)
  const panY = ref(0)
  const pointSize = ref(initialPointSize)

  // --- 数据 ---
  const data = shallowRef<PointCloudPoint[]>([])
  /** 备份基础地图点云，叠加轨迹时保留原始数据 */
  const baseData = shallowRef<PointCloudPoint[]>([])
  /** 归一化参数，由 normalizePointCloud 写入，drawFrame 读取用于原点投影 */
  const normalizationParams = ref<NormalizationParams>({ centerX: 0, centerY: 0, centerZ: 0, maxRange: 1 })

  // --- 渲染调度 ---
  let _frameRequested = false
  const schedule = () => {
    if (_frameRequested) return
    _frameRequested = true
    requestAnimationFrame(() => {
      _frameRequested = false
      drawFrame()
    })
  }

  // ==================== 归一化 ====================

  const normalizePointCloud = (rawPoints: RawPointCloudPoint[]): PointCloudPoint[] => {
    if (!rawPoints.length) return []

    const xs = rawPoints.map(p => p.x)
    const ys = rawPoints.map(p => p.y)
    const zs = rawPoints.map(p => p.z ?? 0)

    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const minZ = Math.min(...zs), maxZ = Math.max(...zs)

    const rangeX = maxX - minX
    const rangeY = maxY - minY
    const rangeZ = maxZ - minZ
    const maxRange = Math.max(rangeX, rangeY, rangeZ, 1e-6)

    const centerX = (maxX + minX) / 2
    const centerY = (maxY + minY) / 2
    const centerZ = (maxZ + minZ) / 2

    // 保存归一化参数，供 drawFrame 绘制原点使用
    normalizationParams.value = { centerX, centerY, centerZ, maxRange }

    const intensityValues = rawPoints
      .map(p => (p.intensityValue !== undefined && Number.isFinite(p.intensityValue) ? p.intensityValue : undefined))
      .filter((v): v is number => typeof v === 'number')
    const minInt = intensityValues.length ? Math.min(...intensityValues) : 0
    const maxInt = intensityValues.length ? Math.max(...intensityValues) : 1
    const intRange = maxInt - minInt || 1

    return rawPoints.map(p => {
      const cz = p.z ?? centerZ
      let ni: number
      if (p.intensityValue !== undefined && Number.isFinite(p.intensityValue)) {
        ni = (p.intensityValue - minInt) / intRange
      } else if (p.z !== undefined && Number.isFinite(p.z)) {
        ni = (p.z - minZ) / (rangeZ || 1)
      } else {
        ni = 0.5
      }
      return {
        x: (p.x - centerX) / maxRange,
        y: (p.y - centerY) / maxRange,
        z: (cz - centerZ) / maxRange,
        intensity: Math.min(1, Math.max(0, ni))
      }
    })
  }

  // ==================== PCD 解析 ====================

  const _readBinaryValue = (view: DataView, offset: number, type: string, size: number): number => {
    if (type === 'F') return size === 8 ? view.getFloat64(offset, true) : view.getFloat32(offset, true)
    if (type === 'I') {
      if (size === 1) return view.getInt8(offset)
      if (size === 2) return view.getInt16(offset, true)
      return view.getInt32(offset, true)
    }
    if (type === 'U') {
      if (size === 1) return view.getUint8(offset)
      if (size === 2) return view.getUint16(offset, true)
      return view.getUint32(offset, true)
    }
    return view.getFloat32(offset, true)
  }

  const _extractHeader = (buffer: ArrayBuffer): PcdHeaderInfo => {
    const bytes = new Uint8Array(buffer)
    const decoder = new TextDecoder('utf-8')
    let lineStart = 0
    const info: PcdHeaderInfo = {
      fields: [], size: [], type: [], count: [],
      points: 0, width: 0, height: 0,
      dataType: 'ascii', dataStartIndex: buffer.byteLength
    }
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] !== 0x0a) continue
      const line = decoder.decode(bytes.slice(lineStart, i)).replace(/\r/g, '').trim()
      const lower = line.toLowerCase()
      const parts = line.split(/\s+/)
      if (lower.startsWith('fields')) info.fields = parts.slice(1)
      else if (lower.startsWith('size')) info.size = parts.slice(1).map(Number)
      else if (lower.startsWith('type')) info.type = parts.slice(1).map(v => v.toUpperCase())
      else if (lower.startsWith('count')) info.count = parts.slice(1).map(Number)
      else if (lower.startsWith('points')) info.points = Number(parts[1]) || 0
      else if (lower.startsWith('width')) info.width = Number(parts[1]) || 0
      else if (lower.startsWith('height')) info.height = Number(parts[1]) || 0
      else if (lower.startsWith('data')) {
        info.dataType = parts[1]?.toLowerCase() || 'ascii'
        info.dataStartIndex = i + 1
        break
      }
      lineStart = i + 1
    }
    if (!info.count.length && info.fields.length) info.count = info.fields.map(() => 1)
    return info
  }

  const _parseAscii = (content: string): PointCloudPoint[] => {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    const dataIdx = lines.findIndex(l => l.toLowerCase().startsWith('data'))
    if (dataIdx === -1) return []
    const header = lines.slice(0, dataIdx)
    const dataLines = lines.slice(dataIdx + 1)
    const fieldsLine = header.find(l => l.toLowerCase().startsWith('fields'))
    const fields = fieldsLine ? fieldsLine.split(/\s+/).slice(1) : []
    const xi = fields.indexOf('x'), yi = fields.indexOf('y'), zi = fields.indexOf('z')
    const ii = fields.findIndex(f => f === 'intensity' || f === 'rgb')
    if (xi === -1 || yi === -1) return []
    const raw = dataLines
      .map(l => l.split(/\s+/))
      .filter(p => p.length > Math.max(xi, yi))
      .map(p => ({
        x: parseFloat(p[xi]),
        y: parseFloat(p[yi]),
        z: zi !== -1 ? parseFloat(p[zi]) : 0,
        intensityValue: ii !== -1 && p[ii] !== undefined ? parseFloat(p[ii]) : undefined
      }))
      .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
    return normalizePointCloud(raw)
  }

  const _parseBinary = (buffer: ArrayBuffer, info: PcdHeaderInfo): PointCloudPoint[] => {
    const counts = info.count.length ? info.count : info.fields.map(() => 1)
    const stride = info.fields.reduce((s, _, i) => s + (info.size[i] || 0) * (counts[i] || 1), 0)
    if (!stride) return []
    const avail = buffer.byteLength - info.dataStartIndex
    if (avail <= 0) return []
    const total = info.points || info.width * info.height || 0
    const toRead = total > 0 ? Math.min(total, Math.floor(avail / stride)) : Math.floor(avail / stride)
    const view = new DataView(buffer, info.dataStartIndex)
    const raw: RawPointCloudPoint[] = []
    for (let pi = 0; pi < toRead; pi++) {
      const base = pi * stride
      let fOff = 0, truncated = false
      const pt: RawPointCloudPoint = { x: 0, y: 0, z: 0 }
      for (let fi = 0; fi < info.fields.length; fi++) {
        const field = info.fields[fi]
        const sz = info.size[fi] || 0
        const rep = counts[fi] || 1
        const type = info.type[fi] || 'F'
        for (let ri = 0; ri < rep; ri++) {
          const vOff = base + fOff + ri * sz
          if (vOff + sz > avail) { truncated = true; break }
          if (field === 'rgb') {
            const rgb = view.getUint32(vOff, true)
            pt.intensityValue = (0.299 * (rgb & 0xff) + 0.587 * ((rgb >> 8) & 0xff) + 0.114 * ((rgb >> 16) & 0xff)) / 255
          } else {
            const v = _readBinaryValue(view, vOff, type, sz)
            if (field === 'x') pt.x = v
            else if (field === 'y') pt.y = v
            else if (field === 'z') pt.z = v
            else if (field === 'intensity') pt.intensityValue = v
          }
        }
        if (truncated) break
        fOff += sz * rep
      }
      if (truncated) break
      if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) raw.push(pt)
    }
    return normalizePointCloud(raw)
  }

  /**
   * 解析 PCD 文件 ArrayBuffer，返回归一化后的点云数据
   * 同时会更新 normalizationParams
   */
  const parsePcdBuffer = (buffer: ArrayBuffer): PointCloudPoint[] => {
    const info = _extractHeader(buffer)
    if (!info.fields.length) return []
    if (info.dataType === 'binary') return _parseBinary(buffer, info)
    if (info.dataType === 'binary_compressed') {
      console.warn('[usePointCloudRenderer] 暂不支持 binary_compressed PCD')
      return []
    }
    return _parseAscii(new TextDecoder('utf-8').decode(buffer))
  }

  // ==================== 绘制 ====================

  /** 将归一化 3D 坐标通过当前视图变换投影到 2D 屏幕坐标 */
  const _project = (
    nx: number, ny: number, nz: number,
    cosYaw: number, sinYaw: number, cosPitch: number, sinPitch: number,
    baseScale: number, panOX: number, panOY: number,
    rectW: number, rectH: number
  ) => {
    const cx = nx, cy = -nz, cz = ny
    const xzRX = cx * cosYaw + cz * sinYaw
    const xzRZ = -cx * sinYaw + cz * cosYaw
    const yRY = cy * cosPitch - xzRZ * sinPitch
    const yRZ = cy * sinPitch + xzRZ * cosPitch
    const CAMERA = 2.2, DEPTH = 1.4
    const pz = yRZ * DEPTH
    const persp = CAMERA / (CAMERA - pz)
    return {
      px: xzRX * baseScale * persp + rectW / 2 + panOX,
      py: yRY * baseScale * persp + rectH / 2 + panOY,
      persp
    }
  }

  const drawFrame = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    if (rect.width < 50 || rect.height < 50) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ;(ctx as any).resetTransform ? (ctx as any).resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#020915'
    ctx.fillRect(0, 0, rect.width, rect.height)

    const yaw = rotationY.value, pitch = rotationX.value
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw)
    const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch)
    const bs = Math.min(rect.width, rect.height) * 0.8 * scale.value
    const panOX = panX.value * rect.width
    const panOY = panY.value * rect.height

    // — 绘制点云 —
    data.value.forEach(point => {
      const { px, py, persp } = _project(
        point.x, point.y, point.z,
        cosYaw, sinYaw, cosPitch, sinPitch,
        bs, panOX, panOY, rect.width, rect.height
      )
      if (px < -100 || px > rect.width + 100 || py < -100 || py > rect.height + 100) return

      // intensity区分：轨迹绿色、任务点黄色、机器人品红色
      if (point.intensity >= 1.9) {
        // 轨迹点 → 绿色
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)'
        ctx.beginPath()
        ctx.arc(px, py, 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else if (point.intensity >= 1.7) {
        // 任务点 → 黄色
        ctx.fillStyle = 'rgba(255, 220, 0, 0.95)'
        ctx.beginPath()
        ctx.arc(px, py, 2.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#FFF6B6'
        ctx.lineWidth = 1.1
        ctx.stroke()
      } else {
        // 普通点云 →蓝色渐变
        const r = (1.2 + point.intensity * 2) * persp * pointSize.value
        ctx.fillStyle = `rgba(${Math.floor(40 + point.intensity * 200)}, ${Math.floor(120 + point.intensity * 100)}, 255, ${0.35 + point.intensity * 0.4})`
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // — 绘制原点 (0,0,0) —
    const { centerX, centerY, centerZ, maxRange } = normalizationParams.value
    if (maxRange > 1e-6) {
      const onx = (0 - centerX) / maxRange
      const ony = (0 - centerY) / maxRange
      const onz = (0 - centerZ) / maxRange
      const { px: opx, py: opy } = _project(
        onx, ony, onz,
        cosYaw, sinYaw, cosPitch, sinPitch,
        bs, panOX, panOY, rect.width, rect.height
      )
      ctx.beginPath()
      ctx.arc(opx, opy, 3 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = '#FF0000'
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1.5 * dpr
      ctx.stroke()
      ctx.fillStyle = '#FF0000'
      ctx.font = `bold ${12 * dpr}px Arial`
      ctx.fillText('原点', opx + 6 * dpr, opy - 6 * dpr)
    }

      // ====== 绘制机器人实时位置（同步首页样式） ======
      if (typeof robotPose !== 'undefined' && robotPose && maxRange > 1e-6) {
        const pose = robotPose
        // 归一化到点云空间
        const robotNormX = (pose.x - centerX) / maxRange
        const robotNormY = (pose.y - centerY) / maxRange
        const robotNormZ = (pose.z - centerZ) / maxRange
        // 投影
        const projectNorm = (nx: number, ny: number, nz: number) => {
          const cx2 = nx, cy2 = -nz, cz2 = ny
          const rx = cx2 * cosYaw + cz2 * sinYaw
          const rz = -cx2 * sinYaw + cz2 * cosYaw
          const ry = cy2 * cosPitch - rz * sinPitch
          const rzF = cy2 * sinPitch + rz * cosPitch
          const persp = 2.2 / (2.2 - rzF * 1.4)
          return {
            px: rx * bs * persp + rect.width / 2 + panOX,
            py: ry * bs * persp + rect.height / 2 + panOY,
          }
        }
        // 机器人中心点
        const { px: rProjX, py: rProjY } = projectNorm(robotNormX, robotNormY, robotNormZ)
        // 机器人箭头（3MF模型可扩展）
        // 动态缩放：基础比例0.004，最小宽度8px
        const baseArrowScale = 0.004
        const minArrowPx = 8
        const arrowScale = Math.max(baseArrowScale * scale.value, minArrowPx / (bs || 1))
        const cosT = Math.cos(pose.theta)
        const sinT = Math.sin(pose.theta)
        // 简单三角箭头
        const tipDist = 0.06
        const { px: tProjX, py: tProjY } = projectNorm(
          robotNormX + Math.cos(pose.theta) * tipDist,
          robotNormY + Math.sin(pose.theta) * tipDist,
          robotNormZ
        )
        const screenAngle = Math.atan2(tProjY - rProjY, tProjX - rProjX)
        const arrowSize = 14 * dpr
        ctx.save()
        ctx.translate(rProjX, rProjY)
        ctx.rotate(screenAngle + Math.PI / 2)
        ctx.beginPath()
        ctx.moveTo(0, -arrowSize)
        ctx.lineTo(-arrowSize * 0.55, arrowSize * 0.65)
        ctx.lineTo(arrowSize * 0.55, arrowSize * 0.65)
        ctx.closePath()
        ctx.shadowColor = '#00ff88'
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(255, 0, 255, 0.88)'
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.strokeStyle = '#FFB6FF'
        ctx.lineWidth = 1.5 * dpr
        ctx.stroke()
        ctx.restore()
        // 标注文字
        ctx.fillStyle = '#FF0000'
        ctx.font = `bold ${11 * dpr}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.shadowColor = 'rgba(0,0,0,0.85)'
        ctx.shadowBlur = 4
        ctx.fillText('机器狗', rProjX, rProjY + 18 * dpr)
        ctx.shadowBlur = 0
      }
  }

  // ==================== 交互事件 ====================

  const onWheel = (e: WheelEvent) => {
    const dir = e.deltaY < 0 ? 1 : -1
    scale.value = Math.min(50, Math.max(0.01, scale.value + dir * 0.1))
    schedule()
  }

  let _dragging = false
  let _lastX = 0, _lastY = 0
  let _dragMode: 'rotate' | 'pan' | null = null
  let _activePointerId: number | null = null

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    if (_dragging) return
    _dragging = true
    _lastX = e.clientX
    _lastY = e.clientY
    _activePointerId = e.pointerId
    _dragMode = (e.button === 2 || (e.button === 0 && e.ctrlKey)) ? 'pan' : 'rotate'

    const onMove = (ev: PointerEvent) => {
      if (!_dragging || (_activePointerId !== null && ev.pointerId !== _activePointerId)) return
      const dx = ev.clientX - _lastX
      const dy = ev.clientY - _lastY
      _lastX = ev.clientX
      _lastY = ev.clientY
      if (_dragMode === 'pan') {
        const canvas = canvasRef.value
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        panX.value += dx / rect.width
        panY.value += dy / rect.height
      } else {
        rotationY.value += dx * 0.005
        rotationX.value = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationX.value - dy * 0.005))
      }
      schedule()
    }
    const onUp = () => {
      _dragging = false
      _activePointerId = null
      _dragMode = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const onKeydown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === '+' || e.key === '=') {
      pointSize.value = Math.min(3, Math.max(0.5, pointSize.value + 0.1))
      schedule()
      e.preventDefault()
    } else if (e.key === '-' || e.key === '_') {
      pointSize.value = Math.min(3, Math.max(0.5, pointSize.value - 0.1))
      schedule()
      e.preventDefault()
    } else if (e.key === 'r' || e.key === 'R') {
      resetView()
      e.preventDefault()
    }
  }

  /** 重置视图到初始状态 */
  const resetView = () => {
    scale.value = initialScale
    rotationX.value = -(20 * Math.PI) / 180
    rotationY.value = 0
    panX.value = 0
    panY.value = 0
    schedule()
  }

  // ==================== 模拟数据 ====================

  const generateMockData = (count = 800): PointCloudPoint[] =>
    Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(), z: Math.random(), intensity: Math.random()
    }))

  // ==================== Return ====================

  return {
    // canvas
    canvasRef,
    // 视图状态
    scale, rotationX, rotationY, panX, panY, pointSize,
    // 数据
    data, baseData, normalizationParams,
    // 方法
    normalizePointCloud,
    parsePcdBuffer,
    schedule,
    drawFrame,
    resetView,
    generateMockData,
    // 事件处理器（直接绑定到 canvas 元素）
    onWheel,
    onPointerDown,
    onKeydown,
  }
}
