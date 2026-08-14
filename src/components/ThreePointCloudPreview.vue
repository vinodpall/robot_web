<template>
  <div class="three-pointcloud-shell">
    <div ref="containerRef" class="three-pointcloud-canvas"></div>
    <div v-if="loading" class="three-pointcloud-overlay">{{ loadingText || '点云加载中...' }}</div>
    <div v-else-if="error" class="three-pointcloud-overlay error">{{ error }}</div>
    <div v-else-if="!hasDisplayData" class="three-pointcloud-overlay">暂无点云数据</div>
    
    <!-- 点云地图清晰度/配色设置按钮组 (靠左上角) -->
    <div v-if="showSettingsButton" class="pcd-density-switcher" @click.stop>
      <button 
        class="pcd-tool-btn pcd-settings-btn" 
        :class="{ active: showSettingsDropdown }" 
        @click.stop="showSettingsDropdown = !showSettingsDropdown" 
        title="地图清晰度与配色设置"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
      <transition name="layer-menu-fade">
        <div v-show="showSettingsDropdown" class="pcd-density-menu-dropdown" @click.stop>
          <div class="pcd-density-menu-title">地图清晰度</div>
          <div 
            class="pcd-density-option" 
            :class="{ active: activeDensityMode === 'sparse' }" 
            @click.stop="selectDensityMode('sparse')"
          >
            <span class="pcd-option-radio" :class="{ checked: activeDensityMode === 'sparse' }"></span>
            <span class="pcd-option-text">稀疏</span>
          </div>
          <div 
            class="pcd-density-option" 
            :class="{ active: activeDensityMode === 'fine' }" 
            @click.stop="selectDensityMode('fine')"
          >
            <span class="pcd-option-radio" :class="{ checked: activeDensityMode === 'fine' }"></span>
            <span class="pcd-option-text">精细</span>
          </div>

          <div class="pcd-density-menu-divider"></div>

          <div class="pcd-density-menu-title">配色方案</div>
          <div 
            class="pcd-density-option" 
            :class="{ active: activeColorMode === 'classic' }" 
            @click.stop="selectColorMode('classic')"
          >
            <span class="pcd-option-radio" :class="{ checked: activeColorMode === 'classic' }"></span>
            <span class="pcd-option-text">科技经典蓝</span>
          </div>
          <div 
            class="pcd-density-option" 
            :class="{ active: activeColorMode === 'gradient' }" 
            @click.stop="selectColorMode('gradient')"
          >
            <span class="pcd-option-radio" :class="{ checked: activeColorMode === 'gradient' }"></span>
            <span class="pcd-option-text">高程彩虹</span>
          </div>
        </div>
      </transition>
    </div>

    <!-- Hover Tooltip -->
    <div 
      v-show="tooltip.visible" 
      class="pcd-hover-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-title">{{ tooltip.name }}</div>
      <div class="tooltip-type" :class="'type-' + tooltip.type">{{ tooltip.typeLabel }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type {
  NormalizationParams,
  PointCloudPoint,
  RobotPose,
} from '@/composables/usePointCloudRenderer'
import type { MeshData } from '@/utils/threemfParser'
import { isVehicleType } from '@/utils/robotImage'

const props = withDefaults(
  defineProps<{
    points: PointCloudPoint[]
    loading?: boolean
    loadingText?: string
    error?: string
    autoFitOnDataChange?: boolean
    normalizationParams: NormalizationParams
    navigationOrigin?: { x: number; y: number; z: number } | null
    robotPose?: RobotPose | null
    robotMesh?: MeshData | null
    interactionMode?: 'view' | 'pick' | 'draw'
    interactionPlaneZ?: number
    trajectoryPoints?: PointCloudPoint[]
    selectedTrajectoryRange?: { start: number; end: number } | null
    draftPoints?: PointCloudPoint[]
    drawPointMarkers?: PointCloudPoint[]
    trajectoryBreaks?: number[]
    snapToTrajectory?: boolean
    snapPixelRadius?: number
    snapPriorityIndex?: number | null
    robotType?: string
    featureAreas?: Array<{
      name: string
      type: string
      geometry: string
      coordinates: Array<[number, number]>
    }>
    showFeatureAreas?: boolean
    densityMode?: 'sparse' | 'standard' | 'fine'
    colorMode?: 'gradient' | 'classic'
    pointOpacity?: number
    showSettingsButton?: boolean
  }>(),
  {
    showSettingsButton: true,
    autoFitOnDataChange: true,
  }
)

const emit = defineEmits<{
  (e: 'trajectory-point-click', payload: { index: number; point: PointCloudPoint }): void
  (e: 'plane-click', payload: {
    x: number
    y: number
    z: number
    normalized: { x: number; y: number; z: number }
    snappedIndex?: number
  }): void
  (e: 'switch-density', densityKey: 'sparse' | 'fine'): void
  (e: 'color-mode-change', colorMode: 'gradient' | 'classic'): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)

const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)
const sceneRef = shallowRef<THREE.Scene | null>(null)
const cameraRef = shallowRef<THREE.PerspectiveCamera | null>(null)
const controlsRef = shallowRef<OrbitControls | null>(null)
const dynamicGroupRef = shallowRef<THREE.Group | null>(null)
const robotGroupRef = shallowRef<THREE.Group | null>(null)
let resizeObserver: ResizeObserver | null = null

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  type: '',
  typeLabel: '',
})

// 内置左上角齿轮设置下拉菜单状态管理
const showSettingsDropdown = ref(false)
const internalDensityMode = ref<'sparse' | 'standard' | 'fine'>(props.densityMode || 'sparse')
const internalColorMode = ref<'gradient' | 'classic'>(
  props.colorMode || (localStorage.getItem('pcd_color_mode') as 'gradient' | 'classic') || 'classic'
)

const activeDensityMode = computed(() => internalDensityMode.value)
const activeColorMode = computed(() => internalColorMode.value)

watch(() => props.densityMode, (val) => {
  if (val) internalDensityMode.value = val
})

watch(() => props.colorMode, (val) => {
  if (val) internalColorMode.value = val
})

watch(internalColorMode, (newVal) => {
  if (newVal) {
    localStorage.setItem('pcd_color_mode', newVal)
    rebuildSceneContent()
  }
})

const selectDensityMode = (mode: 'sparse' | 'fine') => {
  internalDensityMode.value = mode
  showSettingsDropdown.value = false
  emit('switch-density', mode)
}

const selectColorMode = (mode: 'gradient' | 'classic') => {
  internalColorMode.value = mode
  showSettingsDropdown.value = false
  emit('color-mode-change', mode)
  rebuildSceneContent()
}

const handleOutsideClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (showSettingsDropdown.value && !target.closest('.pcd-density-switcher')) {
    showSettingsDropdown.value = false
  }
}
let animationFrameId = 0
let renderLoopStarted = false
let pendingStartTimer = 0
let contextLostHandler: ((event: Event) => void) | null = null
let contextRestoredHandler: (() => void) | null = null
const SCREEN_POINT_SIZE = 1
const ROBOT_ICON_SCALE = 0.14
const labelSprites: THREE.Sprite[] = []
const lastFitSceneKey = ref<string>('')
const hasUserInteracted = ref(false)
const baseFitDistanceRef = ref(1)
const hasDisplayData = computed(() =>
  props.points.length > 0 ||
  (props.trajectoryPoints?.length ?? 0) > 0 ||
  (props.draftPoints?.length ?? 0) > 0 ||
  (props.drawPointMarkers?.length ?? 0) > 0
)

const WORLD_UP = new THREE.Vector3(0, 1, 0)
const LABEL_TEXTURE_SCALE = Math.min(4, Math.max(2, window.devicePixelRatio || 1))
const UNIFIED_LABEL_HEIGHT_PX = 14
const UNIFIED_LABEL_FONT_PX = 11
const UNIFIED_LABEL_PADDING_X = 3
const UNIFIED_LABEL_PADDING_Y = 1
const MARKER_SPRITE_SCALE = 0.011

const toWorldPosition = (x: number, y: number, z: number) => new THREE.Vector3(x, z, -y)

const createLabelSprite = (text: string, options: {
  textColor: string
  borderColor: string
  backgroundColor: string
  heightPx?: number
  fontPx?: number
  paddingX?: number
  paddingY?: number
  strokeColor?: string
  strokeWidth?: number
}) => {
  const canvas = document.createElement('canvas')
  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')
  const fontPx = options.fontPx ?? 18
  const paddingX = options.paddingX ?? 6
  const paddingY = options.paddingY ?? 3
  if (!measureCtx) return null
  measureCtx.font = `bold ${fontPx}px Arial`
  const textWidth = measureCtx.measureText(text).width
  const logicalWidth = Math.max(48, Math.ceil(textWidth + paddingX * 2 + 6))
  const logicalHeight = Math.max(24, Math.ceil(fontPx + paddingY * 2 + 6))
  canvas.width = Math.ceil(logicalWidth * LABEL_TEXTURE_SCALE)
  canvas.height = Math.ceil(logicalHeight * LABEL_TEXTURE_SCALE)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.scale(LABEL_TEXTURE_SCALE, LABEL_TEXTURE_SCALE)

  const radius = 6
  const width = logicalWidth - 6
  const height = logicalHeight - 6
  const x = 3
  const y = 3

  ctx.clearRect(0, 0, logicalWidth, logicalHeight)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.fillStyle = options.backgroundColor
  ctx.fill()
  ctx.strokeStyle = options.borderColor
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = options.textColor
  ctx.font = `bold ${fontPx}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = options.strokeColor ?? 'rgba(8, 12, 20, 0.9)'
  ctx.lineWidth = options.strokeWidth ?? Math.max(1.2, Math.floor(fontPx * 0.12))
  ctx.strokeText(text, logicalWidth / 2, logicalHeight / 2)
  ctx.fillText(text, logicalWidth / 2, logicalHeight / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  // Always render labels above point cloud primitives.
  sprite.renderOrder = 1000
  sprite.userData.aspect = logicalWidth / logicalHeight
  sprite.userData.heightPx = options.heightPx ?? 18
  sprite.userData.minHeightPx = options.heightPx ?? 18
  sprite.scale.set(0.12, 0.034, 1)
  labelSprites.push(sprite)
  return sprite
}

/**
 * RViz 标准建图高程彩虹渐变色算法 (RViz Z-Axis Rainbow Colormap)
 * t: [0, 1] 归一化高程 (0.0 为最低高程地面，1.0 为最高高程)
 * 0.00 - 0.25: 蓝 (0,0,1) -> 青 (0,1,1)
 * 0.25 - 0.50: 青 (0,1,1) -> 绿 (0,1,0)
 * 0.50 - 0.75: 绿 (0,1,0) -> 黄 (1,1,0)
 * 0.75 - 1.00: 黄 (1,1,0) -> 红 (1,0,0)
 */
const getRvizRainbowColor = (t: number, target: THREE.Color) => {
  const v = Math.min(1, Math.max(0, t))
  let r = 0, g = 0, b = 0

  if (v < 0.25) {
    const k = v / 0.25
    r = 0
    g = k
    b = 1
  } else if (v < 0.5) {
    const k = (v - 0.25) / 0.25
    r = 0
    g = 1
    b = 1 - k
  } else if (v < 0.75) {
    const k = (v - 0.5) / 0.25
    r = k
    g = 1
    b = 0
  } else {
    const k = (v - 0.75) / 0.25
    r = 1
    g = 1 - k
    b = 0
  }

  target.setRGB(r, g, b)
  return target
}

const createPointsObject = (
  points: PointCloudPoint[],
  filter: (point: PointCloudPoint) => boolean,
  size: number,
  colorOverride?: string
) => {
  const selected = points.filter(filter)
  if (!selected.length) return null

  // 使用 1% - 99% 百分位数剔除极低/极高离群噪点，精准定位真实地面 Z_min 与最高点 Z_max
  const zList: number[] = []
  for (let index = 0; index < selected.length; index++) {
    zList.push(selected[index].z)
  }
  zList.sort((a, b) => a - b)
  const p1Idx = Math.floor(zList.length * 0.01)
  const p99Idx = Math.min(zList.length - 1, Math.floor(zList.length * 0.99))
  const minZ = zList[p1Idx] ?? zList[0] ?? 0
  const maxZ = zList[p99Idx] ?? zList[zList.length - 1] ?? 1
  const rangeZ = (maxZ - minZ) || 1e-5

  const positions = new Float32Array(selected.length * 3)
  const colors = new Float32Array(selected.length * 3)
  const overrideColor = colorOverride ? new THREE.Color(colorOverride) : null
  const isGradient = activeColorMode.value !== 'classic'

  for (let index = 0; index < selected.length; index++) {
    const point = selected[index]
    const base = index * 3
    const world = toWorldPosition(point.x, point.y, point.z)
    positions[base] = world.x
    positions[base + 1] = world.y
    positions[base + 2] = world.z

    const color = new THREE.Color()
    if (overrideColor) {
      color.copy(overrideColor)
    } else if (point.intensity >= 1.9) {
      color.setRGB(0.08, 1, 0.28)
    } else if (point.intensity >= 1.7) {
      color.setRGB(1, 0.86, 0.15)
    } else if (isGradient) {
      // RViz Z 轴高程彩虹渐变：使用 1%-99% 归一化比例，地面纯蓝(#0000FF)，顶部纯红(#FF0000)
      const normHeight = Math.min(1, Math.max(0, (point.z - minZ) / rangeZ))
      getRvizRainbowColor(normHeight, color)
    } else {
      color.setHSL(0.59 - point.intensity * 0.1, 0.9, 0.48 + point.intensity * 0.18)
    }
    colors[base] = color.r
    colors[base + 1] = color.g
    colors[base + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()

  // 透明度与点大小设置：默认使用 0.60 透明度
  const opacity = props.pointOpacity !== undefined ? props.pointOpacity : 0.60
  const calculatedSize = activeDensityMode.value === 'fine' ? size * 1.1 : size

  const material = new THREE.PointsMaterial({
    size: calculatedSize,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity,
  })

  return new THREE.Points(geometry, material)
}

const createTrajectoryLineObject = (points: PointCloudPoint[], color = '#2bff6d', opacity = 0.85) => {
  if (points.length < 2) return null

  const positions = new Float32Array(points.length * 3)
  for (let index = 0; index < points.length; index++) {
    const point = points[index]
    const base = index * 3
    const world = toWorldPosition(point.x, point.y, point.z)
    positions[base] = world.x
    positions[base + 1] = world.y
    positions[base + 2] = world.z
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  })

  return new THREE.Line(geometry, material)
}

const splitPointsByBreaks = (points: PointCloudPoint[], breaks: number[] | undefined) => {
  if (points.length < 2) return []
  const breakSet = new Set((breaks || []).filter(index => Number.isInteger(index) && index >= 0 && index < points.length - 1))
  const segments: PointCloudPoint[][] = []
  let segment: PointCloudPoint[] = [points[0]]

  for (let index = 0; index < points.length - 1; index++) {
    if (breakSet.has(index)) {
      if (segment.length >= 2) segments.push(segment)
      segment = [points[index + 1]]
      continue
    }
    segment.push(points[index + 1])
  }

  if (segment.length >= 2) segments.push(segment)
  return segments
}

const getTrajectoryPoints = () => (
  props.trajectoryPoints ?? props.points.filter(point => point.intensity >= 1.9 && point.intensity < 3)
)

const createBullseyeMarkerSprite = (
  innerColor: string,
  options?: { scale?: number; depthTest?: boolean }
) => {
  const markerCanvas = document.createElement('canvas')
  markerCanvas.width = 64
  markerCanvas.height = 64
  const markerCtx = markerCanvas.getContext('2d')
  if (markerCtx) {
    markerCtx.clearRect(0, 0, 64, 64)
    markerCtx.beginPath()
    markerCtx.arc(32, 32, 14, 0, Math.PI * 2)
    markerCtx.fillStyle = '#ffffff'
    markerCtx.fill()
    markerCtx.beginPath()
    markerCtx.arc(32, 32, 10, 0, Math.PI * 2)
    markerCtx.fillStyle = innerColor
    markerCtx.fill()
  }
  const markerTexture = new THREE.CanvasTexture(markerCanvas)
  markerTexture.needsUpdate = true
  markerTexture.colorSpace = THREE.SRGBColorSpace
  const markerMaterial = new THREE.SpriteMaterial({
    map: markerTexture,
    transparent: true,
    depthTest: options?.depthTest ?? true,
    depthWrite: false,
  })
  const marker = new THREE.Sprite(markerMaterial)
  const scale = options?.scale ?? MARKER_SPRITE_SCALE
  marker.scale.set(scale, scale, 1)
  return marker
}

const createSelectedTrajectoryMarkerGroup = (selectedPoints: PointCloudPoint[]) => {
  if (!selectedPoints.length) return null

  const group = new THREE.Group()
  const addMarker = (point: PointCloudPoint, innerColor: string) => {
    const world = toWorldPosition(point.x, point.y, point.z)
    const marker = createBullseyeMarkerSprite(innerColor, {
      scale: MARKER_SPRITE_SCALE * 0.48,
      depthTest: false,
    })
    marker.position.copy(world)
    marker.renderOrder = 60
    group.add(marker)
  }

  if (selectedPoints.length === 1) {
    addMarker(selectedPoints[0], '#ff4c4c')
    return group
  }

  addMarker(selectedPoints[0], '#ff4c4c')
  addMarker(selectedPoints[selectedPoints.length - 1], '#ffb13b')
  return group
}

const createDrawPointMarkerSprite = (isLatest: boolean) => {
  const markerCanvas = document.createElement('canvas')
  markerCanvas.width = 64
  markerCanvas.height = 64
  const markerCtx = markerCanvas.getContext('2d')
  if (markerCtx) {
    markerCtx.clearRect(0, 0, 64, 64)

    const glowRadius = isLatest ? 15 : 13
    const ringRadius = isLatest ? 8.5 : 7.5
    const coreRadius = isLatest ? 3 : 2.6
    const gradient = markerCtx.createRadialGradient(32, 32, 2, 32, 32, glowRadius)
    gradient.addColorStop(0, isLatest ? 'rgba(255, 241, 190, 0.88)' : 'rgba(255, 217, 145, 0.76)')
    gradient.addColorStop(0.5, isLatest ? 'rgba(255, 177, 59, 0.34)' : 'rgba(255, 177, 59, 0.24)')
    gradient.addColorStop(1, 'rgba(255, 177, 59, 0)')
    markerCtx.fillStyle = gradient
    markerCtx.beginPath()
    markerCtx.arc(32, 32, glowRadius, 0, Math.PI * 2)
    markerCtx.fill()

    markerCtx.strokeStyle = isLatest ? 'rgba(255, 232, 154, 0.95)' : 'rgba(255, 185, 72, 0.86)'
    markerCtx.lineWidth = isLatest ? 2.2 : 1.8
    markerCtx.beginPath()
    markerCtx.arc(32, 32, ringRadius, 0, Math.PI * 2)
    markerCtx.stroke()

    markerCtx.fillStyle = isLatest ? '#fff0b0' : '#ffb13b'
    markerCtx.beginPath()
    markerCtx.arc(32, 32, coreRadius, 0, Math.PI * 2)
    markerCtx.fill()
  }

  const markerTexture = new THREE.CanvasTexture(markerCanvas)
  markerTexture.needsUpdate = true
  markerTexture.colorSpace = THREE.SRGBColorSpace
  const markerMaterial = new THREE.SpriteMaterial({
    map: markerTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
  const marker = new THREE.Sprite(markerMaterial)
  const scale = MARKER_SPRITE_SCALE * (isLatest ? 0.68 : 0.58)
  marker.scale.set(scale, scale, 1)
  marker.renderOrder = isLatest ? 52 : 51
  return marker
}

const createDrawPointMarkerGroup = (points: PointCloudPoint[]) => {
  if (!points.length) return null

  const group = new THREE.Group()
  points.forEach((point, index) => {
    const marker = createDrawPointMarkerSprite(index === points.length - 1)
    marker.position.copy(toWorldPosition(point.x, point.y, point.z))
    group.add(marker)
  })
  return group
}

const createOriginMarker = () => {
  const { centerX, centerY, centerZ, maxRange } = props.normalizationParams
  if (maxRange <= 1e-6) return null

  const navOrigin = props.navigationOrigin
  const ox = Number.isFinite(navOrigin?.x as number) ? (navOrigin as { x: number }).x : 0
  const oy = Number.isFinite(navOrigin?.y as number) ? (navOrigin as { y: number }).y : 0
  const oz = Number.isFinite(navOrigin?.z as number) ? (navOrigin as { z: number }).z : 0

  const origin = toWorldPosition(
    (ox - centerX) / maxRange,
    (oy - centerY) / maxRange,
    (oz - centerZ) / maxRange
  )

  const group = new THREE.Group()
  const marker = createBullseyeMarkerSprite('#ff2f2f')
  marker.position.copy(origin)
  group.add(marker)

  const label = createLabelSprite('原点', {
    textColor: '#ff6767',
    borderColor: 'rgba(255, 84, 84, 0.7)',
    backgroundColor: 'rgba(5, 15, 35, 0.5)',
    heightPx: UNIFIED_LABEL_HEIGHT_PX,
    fontPx: UNIFIED_LABEL_FONT_PX,
    paddingX: UNIFIED_LABEL_PADDING_X,
    paddingY: UNIFIED_LABEL_PADDING_Y,
    strokeColor: 'rgba(5, 15, 35, 0.7)',
    strokeWidth: 1.2,
  })
  if (label) {
    label.position.copy(origin.clone().add(new THREE.Vector3(0, 0.02, 0)))
    group.add(label)
  }

  return group
}

const createTaskMarkers = () => {
  const taskPoints = props.points.filter(point => point.intensity >= 1.7 && point.name)
  if (!taskPoints.length) return null

  const group = new THREE.Group()
  for (const point of taskPoints) {
    const world = toWorldPosition(point.x, point.y, point.z)
    const marker = createBullseyeMarkerSprite('#ffd21f')
    marker.position.copy(world)
    group.add(marker)

    const label = createLabelSprite(point.name!, {
      textColor: '#FFD800',
      borderColor: 'rgba(255, 216, 0, 0.55)',
      backgroundColor: 'rgba(5, 15, 35, 0.5)',
      heightPx: UNIFIED_LABEL_HEIGHT_PX,
      fontPx: UNIFIED_LABEL_FONT_PX,
      paddingX: UNIFIED_LABEL_PADDING_X,
      paddingY: UNIFIED_LABEL_PADDING_Y,
      strokeColor: 'rgba(5, 15, 35, 0.7)',
      strokeWidth: 1.2,
    })
    if (label) {
      label.position.copy(world.clone().add(new THREE.Vector3(0, 0.02, 0)))
      group.add(label)
    }
  }

  return group
}

const updateRobotPose = (group: THREE.Group | null, pose: RobotPose | null | undefined) => {
  if (!group) return
  const { centerX, centerY, centerZ, maxRange } = props.normalizationParams
  if (!pose || maxRange <= 1e-6) {
    group.visible = false
    return
  }

  group.visible = true
  const normalized = {
    x: (pose.x - centerX) / maxRange,
    y: (pose.y - centerY) / maxRange,
    z: (pose.z - centerZ) / maxRange,
  }
  const world = toWorldPosition(normalized.x, normalized.y, normalized.z)
  group.position.copy(world)

  const headingOffset = (group.userData.headingOffset as number | undefined) ?? 0
  const previousWorld = group.userData.previousWorld as THREE.Vector3 | undefined
  const hasPoseTheta = typeof pose.theta === 'number' && Number.isFinite(pose.theta)
  let baseHeading = hasPoseTheta
    ? pose.theta
    : ((group.userData.lastBaseHeading as number | undefined) ?? 0)

  // Use movement tangent only as fallback when theta is unavailable.
  // Otherwise tiny positional jitter can make the icon lean sideways.
  if (!hasPoseTheta && previousWorld) {
    const dx = world.x - previousWorld.x
    const dz = world.z - previousWorld.z
    const movementSq = dx * dx + dz * dz
    if (movementSq > 1e-8) {
      baseHeading = Math.atan2(dz, dx)
    } else if (typeof group.userData.lastBaseHeading === 'number') {
      baseHeading = group.userData.lastBaseHeading as number
    }
  }

  group.userData.previousWorld = world.clone()
  group.userData.lastBaseHeading = baseHeading

  const heading = baseHeading + headingOffset
  const headingAxis = group.userData.headingAxis as 'y' | 'z' | undefined
  const headingTargets = group.userData.headingTargets as THREE.Object3D[] | undefined
  if (!headingAxis || !headingTargets?.length) return
  for (const target of headingTargets) {
    if (headingAxis === 'y') {
      target.rotation.y = heading
    } else {
      target.rotation.z = heading
    }
  }
}

const createRobotObject = () => {
  const group = new THREE.Group()
  group.visible = false
  let labelAnchorOffsetX = 0

  if (props.robotMesh?.vertices?.length && props.robotMesh.indices?.length) {
    const positions = new Float32Array(props.robotMesh.vertices.length * 3)
    for (let index = 0; index < props.robotMesh.vertices.length; index++) {
      const vertex = props.robotMesh.vertices[index]
      const base = index * 3
      positions[base] = vertex.x
      positions[base + 1] = vertex.z
      positions[base + 2] = -vertex.y
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(props.robotMesh.indices)
    geometry.computeVertexNormals()
    // jiantou.3mf local forward is opposite to runtime heading; add 180deg compensation.
    const headingOffset = -Math.PI / 2

    const material = new THREE.MeshStandardMaterial({
      color: '#ff00ff',
      emissive: '#ff00ff',
      emissiveIntensity: 0.22,
      metalness: 0.04,
      roughness: 0.4,
    })

    // Compute model local forward from heading compensation, then anchor tip along that axis.
    const localForward = new THREE.Vector3(1, 0, 0).applyAxisAngle(WORLD_UP, -headingOffset).normalize()
    let maxForwardProjection = -Infinity
    for (let index = 0; index < props.robotMesh.vertices.length; index++) {
      const base = index * 3
      const vx = positions[base]
      const vy = positions[base + 1]
      const vz = positions[base + 2]
      const projection = vx * localForward.x + vy * localForward.y + vz * localForward.z
      if (projection > maxForwardProjection) maxForwardProjection = projection
    }
    if (Number.isFinite(maxForwardProjection)) {
      geometry.translate(
        -localForward.x * maxForwardProjection,
        -localForward.y * maxForwardProjection,
        -localForward.z * maxForwardProjection
      )
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.scale.setScalar(0.026 * ROBOT_ICON_SCALE)
    mesh.position.x = 0
    labelAnchorOffsetX = 0.006
    group.add(mesh)

    const edgeGeometry = new THREE.EdgesGeometry(geometry)
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: '#FFB6FF',
      transparent: true,
      opacity: 0.95,
    })
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    edges.scale.copy(mesh.scale)
    edges.position.x = mesh.position.x
    group.add(edges)

    group.userData.headingAxis = 'y'
    group.userData.headingOffset = headingOffset
    group.userData.headingTargets = [mesh, edges]
  } else {
    const coneHeight = 0.078 * ROBOT_ICON_SCALE
    const geometry = new THREE.ConeGeometry(0.026 * ROBOT_ICON_SCALE, coneHeight, 3)
    // Bake cone orientation (+X forward) and tip anchor (x=0) into geometry.
    geometry.rotateZ(-Math.PI / 2)
    geometry.translate(-(coneHeight / 2), 0, 0)
    const material = new THREE.MeshStandardMaterial({
      color: '#ff00ff',
      emissive: '#ff00ff',
      emissiveIntensity: 0.22,
    })
    const cone = new THREE.Mesh(geometry, material)
    cone.position.x = 0
    labelAnchorOffsetX = 0.006
    group.add(cone)

    const edgeGeometry = new THREE.EdgesGeometry(geometry)
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: '#FFB6FF',
      transparent: true,
      opacity: 0.95,
    })
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    edges.rotation.copy(cone.rotation)
    edges.position.copy(cone.position)
    group.add(edges)

    group.userData.headingAxis = 'y'
    // Fallback cone geometry is baked to +X forward with tip at local origin.
    group.userData.headingOffset = 0
    group.userData.headingTargets = [cone, edges]
  }

  const labelText = isVehicleType(props.robotType) ? '无人车' : '机器狗'
  const label = createLabelSprite(labelText, {
    textColor: '#FF88FF',
    borderColor: 'rgba(255, 150, 255, 0.55)',
    backgroundColor: 'rgba(5, 15, 35, 0.5)',
    heightPx: UNIFIED_LABEL_HEIGHT_PX,
    fontPx: UNIFIED_LABEL_FONT_PX,
    paddingX: UNIFIED_LABEL_PADDING_X,
    paddingY: UNIFIED_LABEL_PADDING_Y,
    strokeColor: 'rgba(5, 15, 35, 0.7)',
    strokeWidth: 1.2,
  })
  if (label) {
    label.position.set(labelAnchorOffsetX, 0.035, 0)
    group.add(label)
  }

  updateRobotPose(group, props.robotPose ?? null)
  return group
}

const removeLabelSpritesInGroup = (group: THREE.Group) => {
  const removed = new Set<THREE.Sprite>()
  group.traverse((object) => {
    if (object instanceof THREE.Sprite) {
      removed.add(object)
    }
  })
  if (!removed.size) return
  for (let index = labelSprites.length - 1; index >= 0; index--) {
    if (removed.has(labelSprites[index])) {
      labelSprites.splice(index, 1)
    }
  }
}

const disposeGroupResources = (group: THREE.Group) => {
  group.traverse(object => {
    const mesh = object as THREE.Mesh
    const sprite = object as THREE.Sprite
    const points = object as THREE.Points

    if (points.geometry) points.geometry.dispose()
    if (mesh.geometry) mesh.geometry.dispose()

    const material = (points.material || mesh.material || sprite.material) as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) {
      material.forEach(item => item.dispose())
    } else {
      material?.dispose()
    }

    const spriteMaterial = sprite.material as THREE.SpriteMaterial | undefined
    spriteMaterial?.map?.dispose()

    const meshMaterial = mesh.material as THREE.MeshBasicMaterial | undefined
    meshMaterial?.map?.dispose()
  })
}

const clearDynamicGroup = () => {
  const scene = sceneRef.value
  const dynamicGroup = dynamicGroupRef.value
  if (!scene || !dynamicGroup) return

  scene.remove(dynamicGroup)
  removeLabelSpritesInGroup(dynamicGroup)
  disposeGroupResources(dynamicGroup)
  dynamicGroupRef.value = null
}

const clearRobotGroup = () => {
  const scene = sceneRef.value
  const robotGroup = robotGroupRef.value
  if (!scene || !robotGroup) return

  scene.remove(robotGroup)
  removeLabelSpritesInGroup(robotGroup)
  disposeGroupResources(robotGroup)
  robotGroupRef.value = null
}

const rebuildRobotObject = () => {
  const scene = sceneRef.value
  if (!scene) return
  clearRobotGroup()
  const robot = createRobotObject()
  scene.add(robot)
  robotGroupRef.value = robot
}

const updateLabelScale = () => {
  const camera = cameraRef.value
  const renderer = rendererRef.value
  const controls = controlsRef.value
  if (!camera || !labelSprites.length) return

  const viewportHeight = renderer?.domElement.clientHeight || containerRef.value?.clientHeight || 1
  const fov = THREE.MathUtils.degToRad(camera.fov)
  const currentViewDistance = controls
    ? camera.position.distanceTo(controls.target)
    : 1
  const baseFitDistance = baseFitDistanceRef.value || currentViewDistance || 1
  const zoomRatio = Math.max(1, baseFitDistance / Math.max(currentViewDistance, 1e-4))
  const zoomBoost = Math.min(1.9, 1 + Math.log2(zoomRatio + 1) * 0.38)

  for (const sprite of labelSprites) {
    const worldPosition = new THREE.Vector3()
    sprite.getWorldPosition(worldPosition)
    const distance = camera.position.distanceTo(worldPosition)
    const desiredHeightPx = sprite.userData.heightPx || 18
    const minHeightPx = sprite.userData.minHeightPx || desiredHeightPx
    const aspect = sprite.userData.aspect || 3
    const boostedHeightPx = desiredHeightPx * zoomBoost
    const boostedMinHeightPx = Math.max(minHeightPx, minHeightPx * Math.min(1.6, zoomBoost))
    const effectiveHeightPx = Math.max(boostedMinHeightPx, boostedHeightPx)
    const worldHeight = 2 * distance * Math.tan(fov / 2) * (effectiveHeightPx / viewportHeight)
    const minWorldHeight = 2 * distance * Math.tan(fov / 2) * (boostedMinHeightPx / viewportHeight)
    const clampedHeight = Math.min(0.085, Math.max(minWorldHeight, worldHeight))
    sprite.scale.set(clampedHeight * aspect, clampedHeight, 1)
  }
}

const createPatternTexture = (type: string, maxRange: number) => {
  const canvas = document.createElement('canvas')
  const size = 64
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, size, size)

  let strokeColor = '#ffffff'
  let fillColor = 'rgba(255, 255, 255, 0.22)'
  let drawPattern = (c: CanvasRenderingContext2D) => {}

  if (type === 'forbidden') {
    strokeColor = '#ef4444'
    fillColor = 'rgba(239, 68, 68, 0.22)'
    drawPattern = (c) => {
      c.beginPath()
      c.moveTo(0, size); c.lineTo(size, 0)
      c.stroke()
    }
  } else if (type === 'stairs') {
    strokeColor = '#f59e0b'
    fillColor = 'rgba(245, 158, 11, 0.22)'
    drawPattern = (c) => {
      c.beginPath()
      c.moveTo(0, size / 2); c.lineTo(size, size / 2)
      c.stroke()
    }
  } else if (type === 'slope') {
    strokeColor = '#8b5cf6'
    fillColor = 'rgba(139, 92, 246, 0.22)'
    drawPattern = (c) => {
      c.beginPath()
      c.moveTo(size / 2, 0); c.lineTo(size / 2, size)
      c.stroke()
    }
  } else if (type === 'narrow') {
    strokeColor = '#06b6d4'
    fillColor = 'rgba(6, 182, 212, 0.22)'
    drawPattern = (c) => {
      c.beginPath()
      c.moveTo(0, size / 2); c.lineTo(size, size / 2)
      c.moveTo(size / 2, 0); c.lineTo(size / 2, size)
      c.stroke()
    }
  } else if (type === 'grass') {
    strokeColor = '#22c55e'
    fillColor = 'rgba(34, 197, 94, 0.22)'
    drawPattern = (c) => {
      c.beginPath()
      c.moveTo(0, 0); c.lineTo(size, size)
      c.moveTo(0, size); c.lineTo(size, 0)
      c.stroke()
    }
  } else {
    return null
  }

  ctx.fillStyle = fillColor
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 4
  drawPattern(ctx)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  const density = 0.55
  texture.repeat.set(maxRange * density, maxRange * density)
  texture.needsUpdate = true
  
  return texture
}

const createFeatureAreasGroup = () => {
  if (!props.featureAreas || !props.featureAreas.length) return null

  const group = new THREE.Group()
  const { centerX, centerY, centerZ, maxRange } = props.normalizationParams
  if (maxRange <= 1e-6) return null

  const oz = props.navigationOrigin ? (props.navigationOrigin.z || 0) : 0
  const normZ = (oz - centerZ) / maxRange + 0.002 / maxRange

  const colorMap: Record<string, string> = {
    forbidden: '#ef4444',
    stairs: '#f59e0b',
    slope: '#8b5cf6',
    narrow: '#06b6d4',
    grass: '#22c55e',
  }

  const textColorMap: Record<string, string> = {
    forbidden: '#ff6767',
    stairs: '#ffb834',
    slope: '#b18cff',
    narrow: '#3be5ff',
    grass: '#5ef093',
  }

  const borderColorMap: Record<string, string> = {
    forbidden: 'rgba(255, 84, 84, 0.7)',
    stairs: 'rgba(255, 184, 52, 0.7)',
    slope: 'rgba(177, 140, 255, 0.7)',
    narrow: 'rgba(59, 229, 255, 0.7)',
    grass: 'rgba(94, 240, 147, 0.7)',
  }

  props.featureAreas.forEach((area) => {
    if (!area.coordinates || area.coordinates.length < 2) return

    const color = colorMap[area.type] || '#ffffff'
    const textColor = textColorMap[area.type] || '#ffffff'
    const borderColor = borderColorMap[area.type] || 'rgba(255,255,255,0.7)'

    const points3D: THREE.Vector3[] = area.coordinates.map(([x, y]) => {
      const normX = (x - centerX) / maxRange
      const normY = (y - centerY) / maxRange
      return toWorldPosition(normX, normY, normZ)
    })

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points3D)
    const lineMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
    })

    const typeLabelMap: Record<string, string> = {
      forbidden: '禁行区',
      stairs: '楼梯',
      slope: '斜坡',
      narrow: '窄通道',
      grass: '草地',
    }

    let line: THREE.Line | THREE.LineLoop
    if (area.geometry === 'area' && area.coordinates.length >= 3) {
      line = new THREE.LineLoop(lineGeometry, lineMaterial)
    } else {
      line = new THREE.Line(lineGeometry, lineMaterial)
    }
    line.renderOrder = 40
    line.userData = {
      isFeatureArea: true,
      name: area.name,
      type: area.type,
      typeLabel: typeLabelMap[area.type] || area.type,
    }
    group.add(line)

    if (area.geometry === 'area' && area.coordinates.length >= 3) {
      const shape = new THREE.Shape()
      area.coordinates.forEach(([x, y], idx) => {
        const normX = (x - centerX) / maxRange
        const normY = (y - centerY) / maxRange
        if (idx === 0) {
          shape.moveTo(normX, normY)
        } else {
          shape.lineTo(normX, normY)
        }
      })
      shape.closePath()

      const shapeGeometry = new THREE.ShapeGeometry(shape)
      const texture = createPatternTexture(area.type, maxRange)
      let shapeMaterial: THREE.Material
      if (texture) {
        shapeMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      } else {
        shapeMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      }
      const mesh = new THREE.Mesh(shapeGeometry, shapeMaterial)
      mesh.position.set(0, normZ + 0.0005, 0)
      mesh.rotation.x = -Math.PI / 2
      mesh.renderOrder = 39
      mesh.userData = {
        isFeatureArea: true,
        name: area.name,
        type: area.type,
        typeLabel: typeLabelMap[area.type] || area.type,
      }
      group.add(mesh)
    }

    if (area.name) {
      let sumX = 0
      let sumY = 0
      area.coordinates.forEach(([x, y]) => {
        sumX += x
        sumY += y
      })
      const centX = sumX / area.coordinates.length
      const centY = sumY / area.coordinates.length

      const normCentX = (centX - centerX) / maxRange
      const normCentY = (centY - centerY) / maxRange
      const labelPos = toWorldPosition(normCentX, normCentY, normZ)
      labelPos.y += 0.015

      const label = createLabelSprite(area.name, {
        textColor,
        borderColor,
        backgroundColor: 'rgba(5, 15, 35, 0.65)',
        heightPx: UNIFIED_LABEL_HEIGHT_PX,
        fontPx: UNIFIED_LABEL_FONT_PX,
        paddingX: UNIFIED_LABEL_PADDING_X,
        paddingY: UNIFIED_LABEL_PADDING_Y,
        strokeColor: 'rgba(5, 15, 35, 0.8)',
        strokeWidth: 1.2,
      })

      if (label) {
        label.position.copy(labelPos)
        group.add(label)
      }
    }
  })

  return group
}

const rebuildSceneContent = () => {
  const scene = sceneRef.value
  if (!scene) return

  clearDynamicGroup()

  const group = new THREE.Group()
  const pointSize = SCREEN_POINT_SIZE

  const cloud = createPointsObject(props.points, point => point.intensity < 1.7, pointSize)
  if (cloud) group.add(cloud)

  const trajectoryPoints = getTrajectoryPoints()
  const trajectorySegments = splitPointsByBreaks(trajectoryPoints, props.trajectoryBreaks)
  for (const segment of trajectorySegments) {
    const trajectoryLine = createTrajectoryLineObject(segment)
    if (trajectoryLine) group.add(trajectoryLine)
  }

  const trajectory = createPointsObject(trajectoryPoints, () => true, 0.8)
  if (trajectory) group.add(trajectory)

  const selectedRange = props.selectedTrajectoryRange
  if (selectedRange && trajectoryPoints.length > 0) {
    const start = Math.max(0, Math.min(selectedRange.start, selectedRange.end, trajectoryPoints.length - 1))
    const end = Math.max(0, Math.min(Math.max(selectedRange.start, selectedRange.end), trajectoryPoints.length - 1))
    const selectedPoints = start <= end ? trajectoryPoints.slice(start, end + 1) : []
    const selectedBreaks = (props.trajectoryBreaks || [])
      .filter(index => index >= start && index < end)
      .map(index => index - start)
    for (const segment of splitPointsByBreaks(selectedPoints, selectedBreaks)) {
      const selectedLine = createTrajectoryLineObject(segment, '#ff5f5f', 0.98)
      if (selectedLine) {
        selectedLine.renderOrder = 20
        group.add(selectedLine)
      }
    }
    const selectedMarkers = createPointsObject(selectedPoints, () => true, 0.5, '#ff5f5f')
    if (selectedMarkers) {
      selectedMarkers.renderOrder = 21
      group.add(selectedMarkers)
    }
    const selectedEndpointMarkers = createSelectedTrajectoryMarkerGroup(selectedPoints)
    if (selectedEndpointMarkers) group.add(selectedEndpointMarkers)
  }

  const draftPoints = props.draftPoints || []
  const draftLine = createTrajectoryLineObject(draftPoints, '#ffb13b', 0.95)
  if (draftLine) {
    draftLine.renderOrder = 30
    group.add(draftLine)
  }
  const draftMarkers = createPointsObject(draftPoints, () => true, 1.15, '#ffb13b')
  if (draftMarkers) {
    draftMarkers.renderOrder = 31
    group.add(draftMarkers)
  }

  const drawPointMarkers = createDrawPointMarkerGroup(props.drawPointMarkers || [])
  if (drawPointMarkers) group.add(drawPointMarkers)

  const taskPoints = createTaskMarkers()
  if (taskPoints) group.add(taskPoints)

  const origin = createOriginMarker()
  if (origin) group.add(origin)

  if (props.showFeatureAreas && props.featureAreas?.length) {
    const featureAreasGroup = createFeatureAreasGroup()
    if (featureAreasGroup) group.add(featureAreasGroup)
  }

  scene.add(group)
  dynamicGroupRef.value = group
}

const fitCameraToScene = () => {
  const controls = controlsRef.value
  const camera = cameraRef.value
  const group = dynamicGroupRef.value
  if (!controls || !camera || !group) return

  const box = new THREE.Box3().setFromObject(group)
  if (box.isEmpty()) return

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const radius = Math.max(size.length() * 0.22, 0.22)
  const cameraOffset = new THREE.Vector3(radius * 1.3, radius * 1.0, radius * 1.5)

  controls.target.copy(center)
  camera.position.copy(center.clone().add(cameraOffset))
  camera.near = Math.max(radius / 100, 0.01)
  camera.far = Math.max(radius * 30, 12)
  camera.updateProjectionMatrix()
  baseFitDistanceRef.value = cameraOffset.length()
  controls.update()
}

const getPointSignature = (points: PointCloudPoint[]) => {
  if (!points.length) return 'empty'

  const pick = (index: number) => points[Math.max(0, Math.min(points.length - 1, index))]
  const samples = [
    pick(0),
    pick(Math.floor(points.length * 0.25)),
    pick(Math.floor(points.length * 0.5)),
    pick(Math.floor(points.length * 0.75)),
    pick(points.length - 1),
  ]

  return samples
    .map(point => `${point.x.toFixed(4)},${point.y.toFixed(4)},${point.z.toFixed(4)},${point.intensity.toFixed(2)}`)
    .join('|')
}

const getSceneFitKey = () => {
  const { centerX, centerY, centerZ, maxRange } = props.normalizationParams
  return [
    hasDisplayData.value ? 'ready' : 'empty',
    centerX.toFixed(6),
    centerY.toFixed(6),
    centerZ.toFixed(6),
    maxRange.toFixed(6),
    getPointSignature(props.points),
    getPointSignature(getTrajectoryPoints()),
    getPointSignature(props.drawPointMarkers || []),
  ].join('|')
}

const centerToRobot = () => {
  const controls = controlsRef.value
  const camera = cameraRef.value
  const pose = props.robotPose
  const { centerX, centerY, centerZ, maxRange } = props.normalizationParams
  if (!controls || !camera || !pose || maxRange <= 1e-6) return

  const target = toWorldPosition(
    (pose.x - centerX) / maxRange,
    (pose.y - centerY) / maxRange,
    (pose.z - centerZ) / maxRange
  )
  const offset = camera.position.clone().sub(controls.target)
  controls.target.copy(target)
  camera.position.copy(target.clone().add(offset))
  controls.update()
}

const toRawPosition = (normalized: { x: number; y: number; z: number }) => {
  const { centerX, centerY, centerZ, maxRange } = props.normalizationParams
  return {
    x: normalized.x * maxRange + centerX,
    y: normalized.y * maxRange + centerY,
    z: normalized.z * maxRange + centerZ,
  }
}

const pickTrajectoryPoint = (clientX: number, clientY: number, maxDistance = 20) => {
  const camera = cameraRef.value
  const renderer = rendererRef.value
  if (!camera || !renderer) return null

  const rect = renderer.domElement.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  const trajectoryPoints = getTrajectoryPoints()
  if (!trajectoryPoints.length) return null

  const measurePointDistance = (point: PointCloudPoint) => {
    const projected = new THREE.Vector3()
    projected.copy(toWorldPosition(point.x, point.y, point.z)).project(camera)
    if (projected.z < -1 || projected.z > 1) return Number.POSITIVE_INFINITY
    const sx = (projected.x * 0.5 + 0.5) * rect.width + rect.left
    const sy = (-projected.y * 0.5 + 0.5) * rect.height + rect.top
    return Math.hypot(clientX - sx, clientY - sy)
  }

  const priorityIndex = Number(props.snapPriorityIndex)
  if (Number.isInteger(priorityIndex) && priorityIndex >= 0 && priorityIndex < trajectoryPoints.length) {
    const priorityPoint = trajectoryPoints[priorityIndex]
    const priorityDistance = measurePointDistance(priorityPoint)
    if (priorityDistance <= maxDistance) {
      return { index: priorityIndex, point: priorityPoint, distance: priorityDistance }
    }
  }

  let best: { index: number; point: PointCloudPoint; distance: number } | null = null
  for (let index = 0; index < trajectoryPoints.length; index++) {
    const point = trajectoryPoints[index]
    const distance = measurePointDistance(point)
    if (!Number.isFinite(distance)) continue
    if (!best || distance < best.distance) {
      best = { index, point, distance }
    }
  }

  return best && best.distance <= maxDistance ? best : null
}

const projectPlaneClick = (clientX: number, clientY: number) => {
  const camera = cameraRef.value
  const renderer = rendererRef.value
  if (!camera || !renderer) return null

  const rect = renderer.domElement.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -(((clientY - rect.top) / rect.height) * 2 - 1)
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)
  const planeY = Number.isFinite(props.interactionPlaneZ as number) ? Number(props.interactionPlaneZ) : 0
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY)
  const world = new THREE.Vector3()
  const hit = raycaster.ray.intersectPlane(plane, world)
  if (!hit) return null

  const normalized = {
    x: world.x,
    y: -world.z,
    z: world.y,
  }
  return {
    normalized,
    raw: toRawPosition(normalized),
  }
}

const handlePointerMove = (event: PointerEvent) => {
  if (!props.showFeatureAreas || !props.featureAreas?.length) {
    tooltip.value.visible = false
    return
  }

  const camera = cameraRef.value
  const renderer = rendererRef.value
  const scene = sceneRef.value
  if (!camera || !renderer || !scene) {
    tooltip.value.visible = false
    return
  }

  const rect = renderer.domElement.getBoundingClientRect()
  if (!rect.width || !rect.height) {
    tooltip.value.visible = false
    return
  }

  const ndc = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -(((event.clientY - rect.top) / rect.height) * 2 - 1)
  )

  const raycaster = new THREE.Raycaster()
  raycaster.params.Line = { threshold: 0.02 }
  raycaster.setFromCamera(ndc, camera)

  const dynamicGroup = dynamicGroupRef.value
  if (!dynamicGroup) {
    tooltip.value.visible = false
    return
  }

  const candidates: THREE.Object3D[] = []
  dynamicGroup.traverse((object) => {
    if (
      (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineLoop) &&
      object.userData?.isFeatureArea
    ) {
      candidates.push(object)
    }
  })

  if (candidates.length === 0) {
    tooltip.value.visible = false
    return
  }

  const intersects = raycaster.intersectObjects(candidates, true)
  if (intersects.length > 0) {
    const hitObj = intersects[0].object
    const data = hitObj.userData
    
    let x = event.clientX - rect.left + 15
    let y = event.clientY - rect.top + 15
    
    const tooltipWidth = 140
    const tooltipHeight = 55
    if (x + tooltipWidth > rect.width) {
      x = event.clientX - rect.left - tooltipWidth - 10
    }
    if (y + tooltipHeight > rect.height) {
      y = event.clientY - rect.top - tooltipHeight - 10
    }
    
    tooltip.value.x = x
    tooltip.value.y = y
    tooltip.value.name = data.name
    tooltip.value.type = data.type
    tooltip.value.typeLabel = data.typeLabel
    tooltip.value.visible = true
  } else {
    tooltip.value.visible = false
  }
}

let interactionPointerDown: { x: number; y: number } | null = null

const handleInteractionPointerDown = (event: PointerEvent) => {
  const mode = props.interactionMode || 'view'
  if (mode === 'view') return
  interactionPointerDown = { x: event.clientX, y: event.clientY }
}

const handleInteractionPointerUp = (event: PointerEvent) => {
  const mode = props.interactionMode || 'view'
  if (mode === 'view' || !interactionPointerDown) return

  const moved = Math.hypot(event.clientX - interactionPointerDown.x, event.clientY - interactionPointerDown.y)
  interactionPointerDown = null
  if (moved > 6) return

  event.preventDefault()

  if (mode === 'pick') {
    const picked = pickTrajectoryPoint(event.clientX, event.clientY, 20)
    if (picked) {
      emit('trajectory-point-click', { index: picked.index, point: picked.point })
    }
    return
  }

  if (mode === 'draw') {
    if (props.snapToTrajectory) {
      const picked = pickTrajectoryPoint(event.clientX, event.clientY, props.snapPixelRadius ?? 14)
      if (picked) {
        const raw = toRawPosition(picked.point)
        emit('plane-click', {
          x: raw.x,
          y: raw.y,
          z: raw.z,
          normalized: { x: picked.point.x, y: picked.point.y, z: picked.point.z },
          snappedIndex: picked.index,
        })
        return
      }
    }

    const projected = projectPlaneClick(event.clientX, event.clientY)
    if (projected) {
      emit('plane-click', {
        x: projected.raw.x,
        y: projected.raw.y,
        z: projected.raw.z,
        normalized: projected.normalized,
      })
    }
  }
}

const syncInteractionState = () => {
  const mode = props.interactionMode || 'view'
  const controls = controlsRef.value
  const renderer = rendererRef.value
  if (controls) {
    controls.enabled = true
  }
  if (renderer) {
    renderer.domElement.style.cursor = mode === 'draw' ? 'crosshair' : mode === 'pick' ? 'pointer' : 'grab'
  }
}

const resizeRenderer = () => {
  const container = containerRef.value
  const renderer = rendererRef.value
  const camera = cameraRef.value
  if (!container || !renderer || !camera) return false

  const width = container.clientWidth
  const height = container.clientHeight
  if (!width || !height) return false

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  // Keep CSS display size in sync with container; otherwise high-DPI screens
  // can show a clipped, bottom-right shifted view when DPR > 1.
  renderer.setSize(width, height, true)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  return true
}

const startRenderLoop = () => {
  if (renderLoopStarted) return
  const renderer = rendererRef.value
  const scene = sceneRef.value
  const camera = cameraRef.value
  const controls = controlsRef.value
  if (!renderer || !scene || !camera || !controls) return

  renderLoopStarted = true
  const render = () => {
    controls.update()
    updateLabelScale()
    renderer.render(scene, camera)
    animationFrameId = window.requestAnimationFrame(render)
  }

  render()
}

const ensureRendererReady = (retryCount = 16) => {
  const resized = resizeRenderer()
  if (resized) {
    startRenderLoop()
    // 尺寸恢复后的第一帧重新拟合，避免偶发视角跑飞导致“全黑”。
    if (hasDisplayData.value) {
      fitCameraToScene()
    }
    return
  }

  if (retryCount <= 0) return
  if (pendingStartTimer) {
    window.clearTimeout(pendingStartTimer)
  }
  pendingStartTimer = window.setTimeout(() => {
    window.addEventListener('resize', resizeRenderer)
    ensureRendererReady(retryCount - 1)
  }, 80)
}

watch(
  () => [props.points, props.trajectoryPoints, props.normalizationParams, props.selectedTrajectoryRange, props.draftPoints, props.drawPointMarkers, props.trajectoryBreaks, props.featureAreas, props.showFeatureAreas, props.densityMode, props.colorMode, props.pointOpacity] as const,
  () => {
    rebuildSceneContent()
    rebuildRobotObject()
    const sceneKey = getSceneFitKey()
    const shouldAutoFit = props.autoFitOnDataChange !== false
    if (shouldAutoFit && sceneKey !== lastFitSceneKey.value) {
      fitCameraToScene()
      lastFitSceneKey.value = sceneKey
      hasUserInteracted.value = false
    } else if (shouldAutoFit && !hasUserInteracted.value && hasDisplayData.value) {
      // 首次加载期间若点云数据更新但 key 未变化，仍做一次保守拟合，避免偶发黑屏。
      fitCameraToScene()
    } else {
      lastFitSceneKey.value = sceneKey
    }
    if (!renderLoopStarted) {
      ensureRendererReady()
    }
  },
  { deep: true }
)

watch(
  () => props.interactionMode,
  () => {
    syncInteractionState()
  }
)

watch(
  () => props.robotPose,
  () => {
    updateRobotPose(robotGroupRef.value, props.robotPose ?? null)
  },
  { deep: true }
)

watch(
  () => props.robotMesh,
  () => {
    rebuildRobotObject()
  },
  { deep: true }
)

watch(
  () => props.robotType,
  () => {
    rebuildRobotObject()
  }
)

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#020915')
  scene.fog = new THREE.Fog('#020915', 1.8, 5.2)

  const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 100)
  camera.position.set(0.7, 0.6, 0.9)
  camera.up.copy(WORLD_UP)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor('#020915', 1)
  renderer.sortObjects = true
  container.appendChild(renderer.domElement)
  renderer.domElement.addEventListener('pointerdown', handleInteractionPointerDown, false)
  renderer.domElement.addEventListener('pointerup', handleInteractionPointerUp, false)
  renderer.domElement.addEventListener('pointermove', handlePointerMove, false)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.screenSpacePanning = true
  controls.minDistance = 0.005
  controls.maxDistance = 4
  controls.addEventListener('start', () => {
    hasUserInteracted.value = true
  })

  scene.add(new THREE.AmbientLight('#bddcff', 1.15))

  const directional = new THREE.DirectionalLight('#ffffff', 1.45)
  directional.position.set(1.5, 2, 1.2)
  scene.add(directional)

  sceneRef.value = scene
  cameraRef.value = camera
  rendererRef.value = renderer
  controlsRef.value = controls
  syncInteractionState()

  const hasValidSize = resizeRenderer()
  rebuildSceneContent()
  rebuildRobotObject()
  fitCameraToScene()
  if (hasValidSize) {
    startRenderLoop()
  } else {
    ensureRendererReady()
  }

  contextLostHandler = (event: Event) => {
    event.preventDefault()
    renderLoopStarted = false
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = 0
    }
  }
  contextRestoredHandler = () => {
    renderLoopStarted = false
    rebuildSceneContent()
    rebuildRobotObject()
    fitCameraToScene()
    ensureRendererReady()
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLostHandler, false)
  renderer.domElement.addEventListener('webglcontextrestored', contextRestoredHandler, false)

  resizeObserver = new ResizeObserver(() => {
    const resized = resizeRenderer()
    if (!resized) return
    // 容器从隐藏切回可见时，先矫正视角再开始渲染，避免首帧偏移到左下角。
    if (!renderLoopStarted) {
      fitCameraToScene()
      startRenderLoop()
    }
  })
  resizeObserver.observe(container)
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
  }
  renderLoopStarted = false
  if (pendingStartTimer) {
    window.clearTimeout(pendingStartTimer)
    pendingStartTimer = 0
  }

  resizeObserver?.disconnect()
  resizeObserver = null

  clearDynamicGroup()
  clearRobotGroup()
  controlsRef.value?.dispose()
  const renderer = rendererRef.value
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', handleInteractionPointerDown, false)
    renderer.domElement.removeEventListener('pointerup', handleInteractionPointerUp, false)
    renderer.domElement.removeEventListener('pointermove', handlePointerMove, false)
  }
  if (renderer && contextLostHandler) {
    renderer.domElement.removeEventListener('webglcontextlost', contextLostHandler, false)
  }
  if (renderer && contextRestoredHandler) {
    renderer.domElement.removeEventListener('webglcontextrestored', contextRestoredHandler, false)
  }
  contextLostHandler = null
  contextRestoredHandler = null
  rendererRef.value?.dispose()

  const container = containerRef.value
  const canvas = rendererRef.value?.domElement
  if (container && canvas && container.contains(canvas)) {
    container.removeChild(canvas)
  }
})

defineExpose({
  centerToRobot,
  fitCameraToScene,
})
</script>

<style scoped>
.three-pointcloud-shell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 18%, rgba(68, 174, 255, 0.2), transparent 42%),
    radial-gradient(circle at 80% 10%, rgba(255, 176, 69, 0.16), transparent 38%),
    linear-gradient(180deg, rgba(3, 15, 28, 0.98), rgba(1, 8, 18, 1));
}

.three-pointcloud-canvas {
  width: 100%;
  height: 100%;
}

.three-pointcloud-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d7efff;
  background: rgba(2, 9, 21, 0.62);
  backdrop-filter: blur(4px);
  font-size: 14px;
  letter-spacing: 0.08em;
  z-index: 2;
}

.three-pointcloud-overlay.error {
  color: #ff8585;
  background: rgba(94, 17, 17, 0.45);
}

.pcd-hover-tooltip {
  position: absolute;
  pointer-events: none;
  background: rgba(5, 15, 35, 0.88);
  border: 1px solid rgba(89, 192, 252, 0.45);
  border-radius: 4px;
  padding: 6px 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tooltip-title {
  font-weight: 600;
  color: #d7efff;
}
.tooltip-type {
  font-size: 11px;
}
.tooltip-type.type-forbidden { color: #ef4444; }
.tooltip-type.type-stairs { color: #f59e0b; }
.tooltip-type.type-slope { color: #8b5cf6; }
.tooltip-type.type-narrow { color: #06b6d4; }
.tooltip-type.type-grass { color: #22c55e; }

/* 左上角点云地图清晰度/配色设置按钮组 */
.pcd-density-switcher {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.pcd-tool-btn {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  background: rgba(10, 30, 45, 0.75);
  border: 1px solid #164159;
  color: #9adfff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
}

.pcd-tool-btn svg {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}

.pcd-tool-btn:hover,
.pcd-tool-btn.active {
  background: rgba(0, 225, 255, 0.2);
  color: #00e1ff;
  border-color: #00e1ff;
  box-shadow: 0 0 10px rgba(0, 225, 255, 0.4);
}

.pcd-tool-btn.active svg {
  transform: rotate(60deg);
}

.pcd-density-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 145px;
  background: rgba(10, 30, 45, 0.92);
  border: 1px solid #164159;
  border-radius: 6px;
  padding: 8px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 225, 255, 0.1);
  backdrop-filter: blur(8px);
  z-index: 11;
}

.pcd-density-menu-divider {
  height: 1px;
  background: rgba(22, 65, 89, 0.6);
  margin: 6px 0;
}

.pcd-density-menu-title {
  padding: 4px 12px 6px 12px;
  font-size: 11px;
  color: #8ab4f8;
  border-bottom: 1px solid rgba(22, 65, 89, 0.6);
  margin-bottom: 4px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.pcd-density-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  font-size: 12px;
  color: #d1e9fa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pcd-density-option:hover {
  background: rgba(0, 225, 255, 0.12);
  color: #00e1ff;
}

.pcd-density-option.active {
  color: #00e1ff;
  font-weight: bold;
  background: rgba(0, 225, 255, 0.08);
}

.pcd-option-radio {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid #164159;
  position: relative;
  transition: all 0.2s ease;
}

.pcd-option-radio.checked {
  border-color: #00e1ff;
  box-shadow: 0 0 6px rgba(0, 225, 255, 0.4);
}

.pcd-option-radio.checked::after {
  content: '';
  position: absolute;
  top: 2.5px;
  left: 2.5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #00e1ff;
}

.pcd-option-text {
  user-select: none;
}
</style>
