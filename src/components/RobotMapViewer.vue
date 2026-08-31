<template>
  <div class="robot-map-viewer pointcloud-wrapper" :class="{ 'pointcloud-fullscreen': isFullscreen }">
    <!-- 1. 点云图视图 (Three.js 3D) -->
    <div class="pointcloud-view" v-show="currentViewType === 'pointcloud'">
      <ThreePointCloudPreview
        ref="threePointCloudRef"
        :points="pointCloudData"
        :loading="pointCloudLoading"
        :loading-text="pointCloudLoadingText"
        :error="pointCloudError"
        :auto-fit-on-data-change="false"
        :normalization-params="pointCloudNormalizationParams"
        :navigation-origin="pointCloudNavigationOrigin"
        :robot-pose="effectiveRobotPose"
        :robot-mesh="arrowMesh"
        :robot-type="robotType"
        :feature-areas="featureAreas3D"
        :show-feature-areas="showFeatureAreas"
        :density-mode="selectedPcdDensity"
        :color-mode="selectedPcdColorMode"
        :point-opacity="selectedPcdOpacity"
        @switch-density="switchPcdDensity"
        @color-mode-change="selectedPcdColorMode = $event"
      />
    </div>

    <!-- 2. 2D 栅格图视图 (Canvas) -->
    <div class="pointcloud-view grid-view" v-show="currentViewType === 'grid'">
      <div class="grid-map-container" ref="gridMapContainerRef">
        <canvas
          ref="gridMapCanvasRef"
          class="grid-map-canvas"
          @wheel="handleGridMapWheel"
          @mousedown="handleGridMapMouseDown"
          @mousemove="handleGridMapMouseMove"
          @mouseup="handleGridMapMouseUp"
          @mouseleave="handleGridMapMouseLeave"
          @contextmenu.prevent
          style="cursor: grab;"
        ></canvas>
        <div v-if="gridMapLoading" class="grid-map-overlay">栅格地图加载中...</div>
        <div v-else-if="gridMapError" class="grid-map-overlay error">{{ gridMapError }}</div>

        <!-- 区域图例 Legend Overlay -->
        <div v-if="showFeatureAreas && featureAreas3D.length > 0" class="home-grid-legend">
          <div class="legend-list">
            <div v-for="type in featureAreaTypes" :key="type.value" class="legend-item">
              <svg class="legend-item-icon" width="20" height="10" viewBox="0 0 20 10">
                <defs>
                  <pattern :id="`map-viewer-pattern-${type.value}`" width="5" height="5" patternUnits="userSpaceOnUse">
                    <path v-if="type.value === 'forbidden'" d="M0,5 L5,0" stroke="#ef4444" stroke-width="1" fill="none" />
                    <path v-else-if="type.value === 'stairs'" d="M0,2.5 H5" stroke="#f59e0b" stroke-width="1" fill="none" />
                    <path v-else-if="type.value === 'slope'" d="M2.5,0 V5" stroke="#8b5cf6" stroke-width="1" fill="none" />
                    <path v-else-if="type.value === 'narrow'" d="M0,2.5 H5 M2.5,0 V5" stroke="#06b6d4" stroke-width="0.9" fill="none" />
                    <path v-else-if="type.value === 'grass'" d="M0,0 L5,5 M0,5 L5,0" stroke="#22c55e" stroke-width="0.9" fill="none" />
                  </pattern>
                </defs>
                <rect width="20" height="10" rx="2" ry="2" :class="[`feature-area-${type.value}`]" fill-opacity="0.15" stroke="none" />
                <rect width="20" height="10" rx="2" ry="2" :class="['feature-area-shape', `feature-area-${type.value}`]" :style="{ fill: `url(#map-viewer-pattern-${type.value})` }" stroke-width="1.5" />
              </svg>
              <span class="legend-item-label">{{ type.label }}</span>
            </div>
          </div>
        </div>

        <!-- 实时点云开关按钮 -->
        <button
          v-if="showRealtimeScanBtn && !gridMapLoading && !gridMapError"
          class="grid-map-realtime-btn"
          :class="{ active: showRealtimeScan }"
          @click.stop="showRealtimeScan = !showRealtimeScan"
          title="实时点云开关"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3L4 7.5v9L12 21l8-4.5v-9L12 3z" stroke-dasharray="2 2"/>
            <path d="M12 3v18" stroke-dasharray="2 2"/>
            <path d="M12 12L4 7.5" stroke-dasharray="2 2"/>
            <path d="M12 12l8-4.5" stroke-dasharray="2 2"/>
            <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="20" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="20" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="21" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </button>

        <!-- 任务点悬停提示 -->
        <div
          v-if="gridMapTooltip.show"
          class="grid-map-tooltip"
          :style="{ left: gridMapTooltip.x + 'px', top: gridMapTooltip.y + 'px' }"
        >
          <div
            v-for="(item, idx) in gridMapTooltip.content"
            :key="idx"
            class="grid-map-tooltip-item"
          >
            {{ item.index }}: {{ item.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 高德标准/卫星地图视图 -->
    <div class="pointcloud-view map-view" v-show="currentViewType === 'map'">
      <div ref="mapContainer" style="width: 100%; height: 100%;"></div>

      <!-- 地图图层切换器 -->
      <div class="map-layer-switcher">
        <button class="layer-switch-trigger" @click.stop="showLayerMenu = !showLayerMenu">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>图层</span>
        </button>
        <transition name="layer-menu-fade">
          <div v-show="showLayerMenu" class="layer-menu-dropdown">
            <div class="layer-option" :class="{ active: currentMapType === 'standard' }" @click.stop="setMapType('standard')">
              <span class="option-icon standard-icon"></span>
              <span>标准地图</span>
            </div>
            <div class="layer-option" :class="{ active: currentMapType === 'satellite' }" @click.stop="setMapType('satellite')">
              <span class="option-icon satellite-icon"></span>
              <span>卫星地图</span>
            </div>
            <div class="layer-divider"></div>
            <div class="layer-option" :class="{ active: showTraffic }" @click.stop="toggleTraffic">
              <span class="option-checkbox" :class="{ checked: showTraffic }"></span>
              <span>实时路况</span>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 视图模式切换组 (靠左侧) -->
    <div v-if="showViewSwitcher" class="map-view-switcher-group">
      <button
        class="view-switch-btn"
        :class="{ active: currentViewType === 'pointcloud' }"
        @click.stop="setViewType('pointcloud')"
        title="点云图"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3L4 7.5v9L12 21l8-4.5v-9L12 3z" stroke-dasharray="2 2"/>
          <path d="M12 3v18" stroke-dasharray="2 2"/>
          <path d="M12 12L4 7.5" stroke-dasharray="2 2"/>
          <path d="M12 12l8-4.5" stroke-dasharray="2 2"/>
          <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="20" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="20" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="21" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      </button>
      <button
        class="view-switch-btn"
        :class="{ active: currentViewType === 'grid' }"
        @click.stop="setViewType('grid')"
        title="栅格图"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="1.5"/>
          <path d="M9 3v18"/>
          <path d="M15 3v18"/>
          <path d="M3 9h18"/>
          <path d="M3 15h18"/>
          <rect x="3.5" y="3.5" width="5" height="5" fill="currentColor" stroke="none"/>
          <rect x="15.5" y="9.5" width="5" height="5" fill="currentColor" stroke="none"/>
          <rect x="9.5" y="15.5" width="5" height="5" fill="currentColor" stroke="none"/>
        </svg>
      </button>
      <button
        v-if="hasRobotRtk"
        class="view-switch-btn"
        :class="{ active: currentViewType === 'map' }"
        @click.stop="setViewType('map')"
        title="卫星图"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
          <rect x="2" y="10" width="4" height="4" rx="0.5"/>
          <rect x="18" y="10" width="4" height="4" rx="0.5"/>
          <line x1="6" y1="12" x2="9" y2="12"/>
          <line x1="15" y1="12" x2="18" y2="12"/>
          <path d="M12 15v3"/>
          <path d="M9 18h6"/>
        </svg>
      </button>
    </div>

    <!-- 工具按钮组 (靠右下角: 功能区、定位机器人、全屏) -->
    <div v-if="showToolbar" class="pcd-btn-group">
      <button
        class="pcd-tool-btn"
        :class="{ active: showFeatureAreas }"
        @click.stop="showFeatureAreas = !showFeatureAreas"
        title="功能区开关"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </button>
      <button class="pcd-tool-btn" @click.stop="centerToRobot" title="定位机器人">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="pcd-tool-btn" @click.stop="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏显示'">
        <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8V3H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 8V3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 16V21H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 16V21H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3V8H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 3V8H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 21V16H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 21V16H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, watch, onMounted, onUnmounted, nextTick } from 'vue'
import ThreePointCloudPreview from './ThreePointCloudPreview.vue'
import type { NormalizationParams, PointCloudPoint, RobotPose } from '@/composables/usePointCloudRenderer'
import { load3MF } from '@/utils/threemfParser'
import type { MeshData } from '@/utils/threemfParser'
import { getMapFile, saveMapFile } from '@/utils/mapDB'
import { mapFileApi, navigationApi } from '@/api/services'
import { useRobotStore } from '@/stores/robot'
import { useDeviceStore } from '@/stores/device'
import { getTrajectoryFile, saveTrajectoryFile } from '@/utils/trajectoryDB'
import { resolveEffectiveGnssOrigin } from '@/utils/insOrigin'
import { getRobotContextCacheKeys } from '@/utils/robotBootstrap'
import AMapLoader from '@amap/amap-jsapi-loader'
import droneArrowIcon from '@/assets/source_data/svg_data/drone_control_svg/drone_arrow.svg'

export type ViewType = 'pointcloud' | 'grid' | 'map'
export type PcdDensityKey = 'sparse' | 'fine'

export interface TaskPointItem {
  x: number
  y: number
  z?: number
  name?: string
  displayIndex?: number
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    mapName?: string
    robotPose?: RobotPose | { x: number; y: number; z?: number; theta?: number } | null
    robotType?: string
    hasRobotRtk?: boolean
    activeTrackName?: string
    trajectoryPoints?: Array<{ x: number; y: number; z?: number }>
    taskPoints?: TaskPointItem[]
    realtimeScan?: { data?: Array<[number, number]> } | null
    initialViewType?: ViewType
    showViewSwitcher?: boolean
    showToolbar?: boolean
    showRealtimeScanBtn?: boolean
    autoSyncTracking?: boolean
  }>(),
  {
    mapName: '',
    robotType: 'four_wheel',
    hasRobotRtk: true,
    initialViewType: 'pointcloud',
    showViewSwitcher: true,
    showToolbar: true,
    showRealtimeScanBtn: true,
    autoSyncTracking: true,
  }
)

const emit = defineEmits<{
  (e: 'update:viewType', type: ViewType): void
  (e: 'view-type-change', type: ViewType): void
}>()

const robotStore = useRobotStore()
const deviceStore = useDeviceStore()

const effectiveRobotPose = computed<RobotPose | null>(() => {
  const p = props.robotPose || robotStore.pose
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null
  return {
    x: p.x,
    y: p.y,
    z: typeof p.z === 'number' ? p.z : 0,
    theta: typeof p.theta === 'number' ? p.theta : 0,
  }
})

// 视图类型状态
const currentViewType = ref<ViewType>(props.initialViewType)

watch(
  () => props.initialViewType,
  (val) => {
    if (val && val !== currentViewType.value) {
      currentViewType.value = val
    }
  }
)

const setViewType = (type: ViewType) => {
  currentViewType.value = type
  emit('update:viewType', type)
  emit('view-type-change', type)
  nextTick(() => {
    if (type === 'pointcloud') {
      threePointCloudRef.value?.fitCameraToScene?.()
    } else if (type === 'grid') {
      drawGridMapCanvas()
    } else if (type === 'map') {
      if (!amapInstance) {
        initAMap()
      } else {
        updateRobotMapMarker(true)
      }
    }
  })
}

// ----------------- 3D 点云状态与加载 -----------------
const threePointCloudRef = ref<InstanceType<typeof ThreePointCloudPreview> | null>(null)
const pointCloudData = shallowRef<PointCloudPoint[]>([])
const basePointCloudData = shallowRef<PointCloudPoint[]>([])
const arrowMesh = shallowRef<MeshData | null>(null)
const pointCloudNormalizationParams = ref<NormalizationParams>({ centerX: 0, centerY: 0, centerZ: 0, maxRange: 0 })
const pointCloudNavigationOrigin = ref<{ x: number; y: number; z: number } | null>(null)
const pointCloudLoading = ref(false)
const pointCloudLoadingText = ref('点云加载中...')
const pointCloudError = ref('')
const selectedPcdDensity = ref<PcdDensityKey>('sparse')
const selectedPcdColorMode = ref<'gradient' | 'classic'>(
  (localStorage.getItem('pcd_color_mode') as 'gradient' | 'classic') || 'classic'
)
const selectedPcdOpacity = ref<number>(
  Number(localStorage.getItem('pcd_point_opacity')) || 1.0
)

watch(selectedPcdColorMode, (val) => {
  if (val) localStorage.setItem('pcd_color_mode', val)
})

// 内部轨迹与任务点坐标集合（供 3D 点云、2D 栅格图及卫星图共享渲染）
const currentTrajectoryPoints = shallowRef<Array<{ x: number; y: number; z?: number }>>([])
const currentTaskPoints = shallowRef<Array<{ x: number; y: number; z?: number; name: string }>>([])
const lastOverlayTrackKey = ref('')

// Web Worker 解析 PCD
const parsePcdBufferInWorker = (buffer: ArrayBuffer): Promise<{ points: PointCloudPoint[]; normParams: NormalizationParams }> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/pcdParser.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      worker.terminate()
      if (e.data.ok) {
        resolve({ points: e.data.points, normParams: e.data.normParams })
      } else {
        reject(new Error(e.data.error))
      }
    }
    worker.onerror = (err) => {
      worker.terminate()
      reject(err)
    }
    worker.postMessage({ buffer }, [buffer])
  })
}

const parseNavigationOriginFromOdomKeyFrames = (text: string): { x: number; y: number; z: number } | null => {
  if (!text) return null
  const firstLine = text.split(/\r?\n/).find(line => String(line || '').trim())
  if (!firstLine) return null
  const tokens = firstLine.trim().split(/[\s,]+/).filter(Boolean)
  if (tokens.length < 12) return null
  const x = Number(tokens[3])
  const y = Number(tokens[7])
  const z = Number(tokens[11])
  if (![x, y, z].every(Number.isFinite)) return null
  return { x, y, z }
}

const loadNavigationOrigin = async (mapName: string) => {
  if (!mapName) {
    pointCloudNavigationOrigin.value = null
    return
  }
  try {
    let blob = await getMapFile(mapName, 'odom_key_frames.txt')
    if (!blob || blob.size === 0) {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        blob = await mapFileApi.downloadMapFile(robotId, mapName, 'odom_key_frames.txt', true)
        if (blob) {
          await saveMapFile(mapName, 'odom_key_frames.txt', blob)
        }
      }
    }
    if (blob) {
      const text = await blob.text()
      pointCloudNavigationOrigin.value = parseNavigationOriginFromOdomKeyFrames(text)
    }
  } catch (e) {
    console.warn('[地图组件] 读取导航原点失败:', e)
  }
}

const loadPointCloudData = async (mapName: string, density: PcdDensityKey = selectedPcdDensity.value) => {
  if (!mapName) {
    pointCloudData.value = []
    basePointCloudData.value = []
    return
  }
  const fileName = density === 'fine' ? 'finalCloud.pcd' : 'tinyMap.pcd'
  pointCloudLoading.value = true
  pointCloudLoadingText.value = `正在加载${density === 'fine' ? '精细' : '稀疏'}点云地图...`
  pointCloudError.value = ''

  try {
    let pcdBlob = await getMapFile(mapName, fileName)
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''

    if (!pcdBlob || pcdBlob.size === 0) {
      if (robotId) {
        pcdBlob = await mapFileApi.downloadMapFile(robotId, mapName, fileName, true)
        if (pcdBlob && pcdBlob.size > 0) {
          await saveMapFile(mapName, fileName, pcdBlob)
        }
      }
    }

    if (!pcdBlob || pcdBlob.size === 0) {
      pointCloudError.value = `未找到点云地图文件(${fileName})`
      pointCloudLoading.value = false
      return
    }

    const arrayBuffer = await pcdBlob.arrayBuffer()
    const result = await parsePcdBufferInWorker(arrayBuffer)
    basePointCloudData.value = result.points
    pointCloudNormalizationParams.value = result.normParams
    pointCloudLoading.value = false

    // 如果当前有激活的循迹任务，应用轨迹叠加
    await syncRuntimeTrajectoryOverlay()

    nextTick(() => {
      threePointCloudRef.value?.fitCameraToScene?.()
    })
  } catch (err: any) {
    console.error('[地图组件] 加载点云失败:', err)
    pointCloudError.value = '点云地图解析失败'
    pointCloudLoading.value = false
  }
}

const switchPcdDensity = async (densityKey: PcdDensityKey) => {
  if (!props.mapName) return
  selectedPcdDensity.value = densityKey
  await loadPointCloudData(props.mapName, densityKey)
}

// ----------------- 循迹轨迹与任务点逻辑 -----------------
const normalizeTrackName = (rawTrackName: string) => {
  const trimmed = (rawTrackName || '').trim()
  if (!trimmed) return ''
  const atIndex = trimmed.indexOf('@')
  return atIndex > -1 ? trimmed.substring(0, atIndex) : trimmed
}

const normalizeTaskPointName = (rawTaskPointName: string) => {
  const trimmed = (rawTaskPointName || '').trim()
  if (!trimmed) return ''
  const atIndex = trimmed.indexOf('@')
  return atIndex > -1 ? trimmed.substring(0, atIndex) : trimmed
}

const extractTrackTaskList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.msg?.result)) return payload.msg.result
  if (Array.isArray(payload?.msg?.data)) return payload.msg.data
  if (Array.isArray(payload?.response?.data)) return payload.response.data
  if (Array.isArray(payload?.response?.msg?.result)) return payload.response.msg.result
  return []
}

const getTrackTaskGroupName = (task: any) => (
  task?.track_point_name
  || task?.track_pointname
  || task?.taskpoint_name
  || task?.task_point_name
  || task?.task_pointname
  || ''
)

const getCachedTrackTaskListForCurrentRobot = (): any[] => {
  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    const contextKeys = robotId ? getRobotContextCacheKeys(robotId) : null
    const cachedData = contextKeys
      ? localStorage.getItem(contextKeys.allTrackTaskListKey) || localStorage.getItem('all_track_task_list')
      : localStorage.getItem('all_track_task_list')
    if (!cachedData) return []
    return extractTrackTaskList(JSON.parse(cachedData))
  } catch (err) {
    console.warn('[地图组件] 读取缓存任务点列表失败:', err)
    return []
  }
}

const fetchTrackTaskListForCurrentRobot = async (): Promise<any[]> => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return []
  try {
    const response = await navigationApi.getAllTrackTaskList(robotId)
    const allTaskList = extractTrackTaskList(response)
    const serialized = JSON.stringify(allTaskList)
    const contextKeys = getRobotContextCacheKeys(robotId)
    if (contextKeys) {
      localStorage.setItem(contextKeys.allTrackTaskListKey, serialized)
    }
    localStorage.setItem('all_track_task_list', serialized)
    return allTaskList
  } catch (err) {
    console.warn('[地图组件] 刷新任务点列表失败:', err)
    return []
  }
}

const overlayTrackTrajectory = async (trackName: string) => {
  const normalizedTrackName = normalizeTrackName(trackName)
  if (!normalizedTrackName) return

  const currentTaskPointName = normalizeTaskPointName(robotStore.cmdStatus?.track_info?.taskpoint_name || '')
  const overlayKey = `${normalizedTrackName}::${currentTaskPointName}`

  try {
    // 1. 读取轨迹路线数据
    let blob = await getTrajectoryFile(normalizedTrackName)
    if (!blob) {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        try {
          blob = await mapFileApi.downloadTrajectoryFile(robotId, normalizedTrackName)
          if (blob) {
            await saveTrajectoryFile(normalizedTrackName, blob)
          }
        } catch (downloadErr) {
          console.warn('[地图组件] 动态下载轨迹文件失败:', downloadErr)
        }
      }
    }

    const trajectoryPoints: Array<{ x: number; y: number; z: number }> = []

    if (blob) {
      const text = await blob.text()
      const lines = text.trim().split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const parts = trimmed.includes(',') ? trimmed.split(',') : trimmed.split(/\s+/)
        const len = parts.length
        if (len === 6) {
          const x = parseFloat(parts[1]), y = parseFloat(parts[2]), z = parseFloat(parts[3])
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            trajectoryPoints.push({ x, y, z })
            continue
          }
        }
        if (len === 5) {
          const x = parseFloat(parts[1]), y = parseFloat(parts[2])
          if (!isNaN(x) && !isNaN(y)) {
            trajectoryPoints.push({ x, y, z: 0 })
            continue
          }
        }
      }
    }

    // 2. 读取任务点数据
    const taskPointsData: Array<{ x: number; y: number; z: number; name: string }> = []
    const collectTaskPoints = (allTaskList: any[]) => {
      let filteredTasks = allTaskList.filter((task: any) => {
        const taskTrackName = normalizeTrackName(String(task.track_name || ''))
        const taskPointName = normalizeTaskPointName(String(getTrackTaskGroupName(task)))
        return taskTrackName === normalizedTrackName && (!currentTaskPointName || taskPointName === currentTaskPointName)
      })

      if (filteredTasks.length === 0) {
        filteredTasks = allTaskList.filter((task: any) => {
          const taskTrackName = normalizeTrackName(String(task.track_name || ''))
          return taskTrackName === normalizedTrackName
        })
      }

      filteredTasks.forEach((task: any, idx: number) => {
        const tx = parseFloat(task.x), ty = parseFloat(task.y), tz = parseFloat(task.z ?? '0')
        if (!isNaN(tx) && !isNaN(ty) && !isNaN(tz)) {
          const taskName = task.type_text || task.preset || `任务点${idx + 1}`
          taskPointsData.push({ x: tx, y: ty, z: tz, name: taskName })
        }
      })
    }

    const cachedTaskList = getCachedTrackTaskListForCurrentRobot()
    if (cachedTaskList.length > 0) {
      collectTaskPoints(cachedTaskList)
    }
    if (taskPointsData.length === 0) {
      const freshTaskList = await fetchTrackTaskListForCurrentRobot()
      if (freshTaskList.length > 0) {
        collectTaskPoints(freshTaskList)
      }
    }

    // 3. 叠加到 3D 点云
    if (basePointCloudData.value.length > 0 && pointCloudNormalizationParams.value && pointCloudNormalizationParams.value.maxRange > 0) {
      const { centerX, centerY, centerZ, maxRange } = pointCloudNormalizationParams.value
      const normalizedTrajectory = trajectoryPoints.map(p => ({
        x: (p.x - centerX) / maxRange,
        y: (p.y - centerY) / maxRange,
        z: (p.z - centerZ) / maxRange,
        intensity: 2.0 // 特殊值：轨迹线
      }))

      const normalizedTaskPoints = taskPointsData.map(p => ({
        x: (p.x - centerX) / maxRange,
        y: (p.y - centerY) / maxRange,
        z: (p.z - centerZ) / maxRange,
        intensity: 3.0, // 特殊值：任务点
        name: p.name
      }))

      pointCloudData.value = [
        ...basePointCloudData.value,
        ...normalizedTrajectory,
        ...normalizedTaskPoints
      ]
    }

    // 4. 保存到全局 ref
    currentTrajectoryPoints.value = trajectoryPoints
    currentTaskPoints.value = taskPointsData

    if (currentViewType.value === 'grid') {
      drawGridMapCanvas()
    }

    // 5. 叠加到高德地图
    if (amapInstance && amapApiRef && props.mapName) {
      clearMapTrajectoryAndMarkers()
      const AMap = amapApiRef
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      const gnssOrigin = await resolveEffectiveGnssOrigin(props.mapName, robotId, {
        isInsRunning: robotStore.cmdStatus?.ins === 1 || robotStore.isInsRunning,
        isTracking: robotStore.cmdStatus?.track === 1 || robotStore.isTracking,
        loadMapGnssOrigin: loadGnssOrigin
      })

      const mapPath: [number, number][] = []
      trajectoryPoints.forEach(p => {
        const gps = convertLocalToGps(p.x, p.y, gnssOrigin)
        if (gps) {
          const gcjCoords = transformWGS84ToGCJ02(gps.longitude, gps.latitude)
          mapPath.push([gcjCoords.longitude, gcjCoords.latitude])
        }
      })

      if (mapPath.length > 1) {
        trajectoryPolyline = new AMap.Polyline({
          path: mapPath,
          strokeColor: '#30b85b',
          strokeWeight: 8,
          strokeOpacity: 0.95,
          strokeStyle: 'solid',
          lineJoin: 'round',
          lineCap: 'round',
          isOutline: true,
          outlineColor: '#135336',
          borderWeight: 2,
          showDir: true,
          zIndex: 105
        })
        amapInstance.add(trajectoryPolyline)
      }

      const markers: any[] = []
      taskPointsData.forEach((p) => {
        const gps = convertLocalToGps(p.x, p.y, gnssOrigin)
        if (gps) {
          const gcjCoords = transformWGS84ToGCJ02(gps.longitude, gps.latitude)
          const marker = new AMap.Marker({
            position: [gcjCoords.longitude, gcjCoords.latitude],
            offset: new AMap.Pixel(0, 0),
            anchor: 'center',
            content: `
              <div class="robot-map-taskpoint" title="${p.name}">
                <div class="taskpoint-label">${p.name}</div>
                <div class="taskpoint-dot"></div>
              </div>
            `
          })
          amapInstance.add(marker)
          markers.push(marker)
        }
      })
      taskpointMarkers = markers
    }

    lastOverlayTrackKey.value = overlayKey
  } catch (err) {
    console.warn('[地图组件] 叠加循迹轨迹失败:', err)
  }
}

const clearTrackOverlay = () => {
  lastOverlayTrackKey.value = ''
  currentTrajectoryPoints.value = []
  currentTaskPoints.value = []
  if (basePointCloudData.value.length > 0) {
    pointCloudData.value = [...basePointCloudData.value]
  }
  clearMapTrajectoryAndMarkers()
  if (currentViewType.value === 'grid') {
    drawGridMapCanvas()
  }
}

const clearMapTrajectoryAndMarkers = () => {
  if (amapInstance) {
    if (trajectoryPolyline) {
      amapInstance.remove(trajectoryPolyline)
      trajectoryPolyline = null
    }
    if (taskpointMarkers && taskpointMarkers.length > 0) {
      amapInstance.remove(taskpointMarkers)
      taskpointMarkers = []
    }
  }
}

const syncRuntimeTrajectoryOverlay = async () => {
  if (!props.autoSyncTracking) return
  const isTracking = robotStore.cmdStatus?.track === 1 || robotStore.isTracking
  const runningTrackName = normalizeTrackName(
    robotStore.cmdStatus?.track_info?.track_name
    || (isTracking ? props.activeTrackName : '')
    || ''
  )

  if (isTracking && runningTrackName) {
    await overlayTrackTrajectory(runningTrackName)
  } else if (props.trajectoryPoints && props.trajectoryPoints.length > 0) {
    currentTrajectoryPoints.value = props.trajectoryPoints
    currentTaskPoints.value = (props.taskPoints as any) || []
    if (currentViewType.value === 'grid') {
      drawGridMapCanvas()
    }
  } else {
    clearTrackOverlay()
  }
}

// ----------------- 功能区 (Feature Areas) 逻辑 -----------------
const FEATURE_AREA_FILE_NAME = 'task.json'
const featureAreaTypes = [
  { value: 'forbidden', label: '禁行区' },
  { value: 'stairs', label: '楼梯' },
  { value: 'slope', label: '斜坡' },
  { value: 'narrow', label: '窄通道' },
  { value: 'grass', label: '草地' },
]
const featureAreaTypeCodeMap: Record<string, number> = {
  forbidden: 0,
  stairs: 1,
  slope: 2,
  narrow: 3,
  grass: 4,
}
const featureAreaTypeByCode = new Map<number, string>(
  Object.entries(featureAreaTypeCodeMap).map(([type, code]) => [code, type])
)

const featureAreas3D = ref<Array<{
  name: string
  type: string
  geometry: string
  coordinates: Array<[number, number]>
}>>([])

const showFeatureAreas = ref(localStorage.getItem('show_feature_areas') !== 'false')
watch(showFeatureAreas, (val) => {
  localStorage.setItem('show_feature_areas', String(val))
  if (currentViewType.value === 'grid') {
    drawGridMapCanvas()
  }
})

const parseTaskJsonCoordinates = (rawCoordinates: unknown): Array<[number, number]> => {
  if (!Array.isArray(rawCoordinates)) return []
  return rawCoordinates
    .map((point: any) => {
      if (!Array.isArray(point) || point.length < 2) return null
      const x = Number(point[0])
      const y = Number(point[1])
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
      return [x, y] as [number, number]
    })
    .filter((point): point is [number, number] => !!point)
}

const normalizeTaskShape = (shape: unknown): 'area' | 'line' => {
  return String(shape || '').toLowerCase() === 'polyline' ? 'line' : 'area'
}

const loadFeatureAreasForMap = async (mapName: string) => {
  if (!mapName) {
    featureAreas3D.value = []
    return
  }

  try {
    let blob = await getMapFile(mapName, FEATURE_AREA_FILE_NAME)
    if (!blob || blob.size === 0) {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        const downloadedBlob = await mapFileApi.downloadMapFile(robotId, mapName, FEATURE_AREA_FILE_NAME, true)
        if (downloadedBlob) {
          await saveMapFile(mapName, FEATURE_AREA_FILE_NAME, downloadedBlob)
          blob = downloadedBlob
        }
      }
    }

    if (!blob || blob.size === 0) {
      featureAreas3D.value = []
      return
    }

    const text = await blob.text()
    if (!text || text.trim() === '') {
      featureAreas3D.value = []
      return
    }
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      featureAreas3D.value = []
      return
    }

    const areas: Array<{
      name: string
      type: string
      geometry: string
      coordinates: Array<[number, number]>
    }> = []

    const typeLabelMap: Record<string, string> = {
      forbidden: '禁行区',
      stairs: '楼梯',
      slope: '斜坡',
      narrow: '窄通道',
      grass: '草地',
    }

    Object.entries(parsed).forEach(([name, entry]: [string, any], index) => {
      const code = Number(entry?.type)
      const type = featureAreaTypeByCode.get(code) || 'forbidden'
      const geometry = normalizeTaskShape(entry?.area?.shape)
      const coordinates = parseTaskJsonCoordinates(entry?.area?.coordinates)
      if (coordinates.length < 2) return

      const defaultName = `${geometry === 'line' ? '线段' : '区域'}-${typeLabelMap[type] || type} ${index + 1}`
      areas.push({
        name: String(name || defaultName),
        type,
        geometry,
        coordinates,
      })
    })

    featureAreas3D.value = areas
    if (currentViewType.value === 'grid') {
      drawGridMapCanvas()
    }
  } catch (error) {
    console.error('[地图组件] 加载功能区失败:', error)
    featureAreas3D.value = []
  }
}

// ----------------- 2D 栅格图逻辑 -----------------
interface GridMapMeta {
  resolution: number
  originX: number
  originY: number
}

const gridMapCanvasRef = ref<HTMLCanvasElement | null>(null)
const gridMapContainerRef = ref<HTMLDivElement | null>(null)
const gridMapLoading = ref(false)
const gridMapError = ref('')
const gridMapMeta = ref<GridMapMeta | null>(null)
const showRealtimeScan = ref(false)
const gridMapWidth = ref(0)
const gridMapHeight = ref(0)
const gridMapOffscreenCanvas = shallowRef<HTMLCanvasElement | null>(null)
const gridMapZoom = ref(1.0)
const gridMapPanX = ref(0)
const gridMapPanY = ref(0)

const gridMapTooltip = ref<{
  show: boolean
  x: number
  y: number
  content: Array<{ index: number; name: string }>
}>({
  show: false,
  x: 0,
  y: 0,
  content: []
})

interface GroupedTaskItem {
  index: number
  name: string
}

interface GroupedTask {
  x: number
  y: number
  items: GroupedTaskItem[]
  displayIndex: number
}

const getGroupedTaskPoints = (points: Array<{ x: number; y: number; z?: number; name: string }>) => {
  const groups: GroupedTask[] = []
  points.forEach((p, index) => {
    const group = groups.find(g => Math.abs(g.x - p.x) < 0.01 && Math.abs(g.y - p.y) < 0.01)
    if (group) {
      group.items.push({
        index: index + 1,
        name: p.name
      })
    } else {
      groups.push({
        x: p.x,
        y: p.y,
        items: [{
          index: index + 1,
          name: p.name
        }],
        displayIndex: index + 1
      })
    }
  })
  return groups
}

const getProjectedCoords = (
  x: number,
  y: number,
  meta: any,
  mapH: number,
  baseScale: number,
  baseOffsetX: number,
  baseOffsetY: number,
  containerWidth: number,
  containerHeight: number,
  zoom: number,
  panX: number,
  panY: number
) => {
  const px = (x - meta.originX) / meta.resolution
  const py = mapH - (y - meta.originY) / meta.resolution
  let cx = baseOffsetX + px * baseScale
  let cy = baseOffsetY + py * baseScale
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  cx = (cx - centerX) * zoom + centerX
  cy = (cy - centerY) * zoom + centerY
  cx += panX
  cy += panY
  return { x: cx, y: cy }
}

const parseGridMapYaml = (text: string): GridMapMeta | null => {
  const resolutionMatch = text.match(/^\s*resolution\s*:\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*$/im)
  const originMatch = text.match(/^\s*origin\s*:\s*\[\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*,\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*(?:,\s*[-+]?\d*\.?\d+(?:e[-+]?\d+)?\s*)?\]\s*$/im)
  const resolution = Number(resolutionMatch?.[1])
  const originX = Number(originMatch?.[1])
  const originY = Number(originMatch?.[2])
  if (!Number.isFinite(resolution) || resolution <= 0 || !Number.isFinite(originX) || !Number.isFinite(originY)) {
    return null
  }
  return { resolution, originX, originY }
}

const gridPatternCache: Record<string, CanvasPattern | null> = {}

const getGridPattern = (ctx: CanvasRenderingContext2D, type: string): CanvasPattern | null => {
  if (gridPatternCache[type]) return gridPatternCache[type]
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 8
  const pCtx = canvas.getContext('2d')
  if (!pCtx) return null

  if (type === 'forbidden') {
    pCtx.strokeStyle = '#ef4444'
    pCtx.lineWidth = 1.2
    pCtx.beginPath()
    pCtx.moveTo(0, 8); pCtx.lineTo(8, 0)
    pCtx.stroke()
  } else if (type === 'stairs') {
    pCtx.strokeStyle = '#f59e0b'
    pCtx.lineWidth = 1.2
    pCtx.beginPath()
    pCtx.moveTo(0, 4); pCtx.lineTo(8, 4)
    pCtx.stroke()
  } else if (type === 'slope') {
    pCtx.strokeStyle = '#8b5cf6'
    pCtx.lineWidth = 1.2
    pCtx.beginPath()
    pCtx.moveTo(4, 0); pCtx.lineTo(4, 8)
    pCtx.stroke()
  } else if (type === 'narrow') {
    pCtx.strokeStyle = '#06b6d4'
    pCtx.lineWidth = 1.0
    pCtx.beginPath()
    pCtx.moveTo(0, 4); pCtx.lineTo(8, 4)
    pCtx.moveTo(4, 0); pCtx.lineTo(4, 8)
    pCtx.stroke()
  } else if (type === 'grass') {
    pCtx.strokeStyle = '#22c55e'
    pCtx.lineWidth = 1.0
    pCtx.beginPath()
    pCtx.moveTo(0, 0); pCtx.lineTo(8, 8)
    pCtx.moveTo(0, 8); pCtx.lineTo(8, 0)
    pCtx.stroke()
  }

  const pattern = ctx.createPattern(canvas, 'repeat')
  gridPatternCache[type] = pattern
  return pattern
}

const mapCoordinateToCanvasPoint = (mx: number, my: number): { x: number; y: number } => {
  const meta = gridMapMeta.value
  const mapH = gridMapHeight.value
  if (!meta || mapH <= 0) return { x: mx, y: my }
  return {
    x: (mx - meta.originX) / meta.resolution,
    y: mapH - (my - meta.originY) / meta.resolution,
  }
}

const loadAndDrawGridMap = async (mapName: string) => {
  if (!mapName) {
    gridMapMeta.value = null
    gridMapOffscreenCanvas.value = null
    gridMapError.value = '未选择地图'
    return
  }

  gridMapLoading.value = true
  gridMapError.value = ''

  try {
    let yamlBlob = await getMapFile(mapName, 'gridMap.yaml')
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!yamlBlob && robotId) {
      yamlBlob = await mapFileApi.downloadMapFile(robotId, mapName, 'gridMap.yaml', true)
      if (yamlBlob) await saveMapFile(mapName, 'gridMap.yaml', yamlBlob)
    }

    if (yamlBlob) {
      gridMapMeta.value = parseGridMapYaml(await yamlBlob.text())
    }

    let pgmBlob = await getMapFile(mapName, 'gridMap.pgm')
    if (!pgmBlob && robotId) {
      pgmBlob = await mapFileApi.downloadMapFile(robotId, mapName, 'gridMap.pgm', true)
      if (pgmBlob) await saveMapFile(mapName, 'gridMap.pgm', pgmBlob)
    }

    if (!pgmBlob) {
      gridMapError.value = '未找到栅格地图文件'
      gridMapLoading.value = false
      return
    }

    const buffer = await pgmBlob.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // 解析 PGM 头部
    let ptr = 0
    let tokenCount = 0
    let inComment = false
    const headerTokens: string[] = []
    while (ptr < bytes.length && tokenCount < 4) {
      const char = String.fromCharCode(bytes[ptr])
      if (inComment) {
        if (char === '\n') inComment = false
        ptr++
        continue
      }
      if (char === '#') {
        inComment = true
        ptr++
        continue
      }
      if (/\s/.test(char)) {
        ptr++
        continue
      }
      const tokenStart = ptr
      while (ptr < bytes.length && !/\s/.test(String.fromCharCode(bytes[ptr]))) {
        ptr++
      }
      const token = String.fromCharCode(...bytes.subarray(tokenStart, ptr))
      headerTokens.push(token)
      tokenCount++
    }

    if (ptr < bytes.length && /\s/.test(String.fromCharCode(bytes[ptr]))) {
      ptr++
    }
    const dataStart = ptr
    const magic = headerTokens[0]
    const width = parseInt(headerTokens[1])
    const height = parseInt(headerTokens[2])

    gridMapWidth.value = width
    gridMapHeight.value = height

    const offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = height
    const offscreenCtx = offscreen.getContext('2d')
    if (!offscreenCtx) return

    const imageData = offscreenCtx.createImageData(width, height)
    if (magic === 'P5') {
      let p = dataStart
      for (let idx = 0; idx < width * height; idx++) {
        if (p >= bytes.length) break
        const v = bytes[p++]
        const off = idx * 4
        imageData.data[off] = v
        imageData.data[off + 1] = v
        imageData.data[off + 2] = v
        imageData.data[off + 3] = 255
      }
    } else if (magic === 'P2') {
      const textDecoder = new TextDecoder()
      const asciiData = textDecoder.decode(bytes.subarray(dataStart))
      const tokens = asciiData.trim().split(/\s+/)
      for (let idx = 0; idx < width * height; idx++) {
        if (idx >= tokens.length) break
        const v = parseInt(tokens[idx]) || 0
        const off = idx * 4
        imageData.data[off] = v
        imageData.data[off + 1] = v
        imageData.data[off + 2] = v
        imageData.data[off + 3] = 255
      }
    }

    offscreenCtx.putImageData(imageData, 0, 0)
    gridMapOffscreenCanvas.value = offscreen
    gridMapLoading.value = false

    gridMapZoom.value = 1.0
    gridMapPanX.value = 0
    gridMapPanY.value = 0
    drawGridMapCanvas()
  } catch (err) {
    console.error('[地图组件] 加载栅格图失败:', err)
    gridMapError.value = '加载栅格图失败'
    gridMapLoading.value = false
  }
}

const drawGridMapCanvas = () => {
  const canvas = gridMapCanvasRef.value
  const container = gridMapContainerRef.value
  const offscreen = gridMapOffscreenCanvas.value
  if (!canvas || !container || !offscreen) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const containerWidth = container.clientWidth || 800
  const containerHeight = container.clientHeight || 500
  const dpr = window.devicePixelRatio || 1

  canvas.width = containerWidth * dpr
  canvas.height = containerHeight * dpr
  canvas.style.width = containerWidth + 'px'
  canvas.style.height = containerHeight + 'px'

  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, containerWidth, containerHeight)

  const mapW = gridMapWidth.value
  const mapH = gridMapHeight.value
  if (mapW <= 0 || mapH <= 0) return

  const scaleX = containerWidth / mapW
  const scaleY = containerHeight / mapH
  const baseScale = Math.min(scaleX, scaleY)
  const baseOffsetX = (containerWidth - mapW * baseScale) / 2
  const baseOffsetY = (containerHeight - mapH * baseScale) / 2

  const zoom = gridMapZoom.value
  const panX = gridMapPanX.value
  const panY = gridMapPanY.value

  ctx.save()
  ctx.translate(panX, panY)
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  ctx.translate(centerX, centerY)
  ctx.scale(zoom, zoom)
  ctx.translate(-centerX, -centerY)

  // 1. 绘制底图
  ctx.save()
  ctx.translate(baseOffsetX, baseOffsetY)
  ctx.scale(baseScale, baseScale)
  ctx.imageSmoothingEnabled = (baseScale * zoom) < 1.0
  ctx.drawImage(offscreen, 0, 0)
  ctx.restore()

  const meta = gridMapMeta.value
  if (!meta) {
    ctx.restore()
    return
  }

  // 2. 绘制循迹轨迹
  const trajectory = (props.trajectoryPoints && props.trajectoryPoints.length > 0) ? props.trajectoryPoints : currentTrajectoryPoints.value
  if (trajectory.length > 1) {
    ctx.save()
    ctx.beginPath()
    trajectory.forEach((p, index) => {
      const px = (p.x - meta.originX) / meta.resolution
      const py = mapH - (p.y - meta.originY) / meta.resolution
      const cx = baseOffsetX + px * baseScale
      const cy = baseOffsetY + py * baseScale
      if (index === 0) ctx.moveTo(cx, cy)
      else ctx.lineTo(cx, cy)
    })
    ctx.strokeStyle = '#39b54a'
    ctx.lineWidth = Math.max(1.0, 2.5 / zoom)
    ctx.stroke()
    ctx.restore()
  }

  // 2.5 绘制地图原点
  ctx.save()
  const navOriginX = pointCloudNavigationOrigin.value?.x ?? 0
  const navOriginY = pointCloudNavigationOrigin.value?.y ?? 0
  const ox = (navOriginX - meta.originX) / meta.resolution
  const oy = mapH - (navOriginY - meta.originY) / meta.resolution
  const rxOrigin = baseOffsetX + ox * baseScale
  const ryOrigin = baseOffsetY + oy * baseScale

  ctx.translate(rxOrigin, ryOrigin)
  ctx.scale(1 / zoom, 1 / zoom)

  ctx.beginPath()
  ctx.arc(0, 0, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#ff3b30'
  ctx.fill()

  ctx.font = 'bold 13px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.strokeText('原点', 0, 8)
  ctx.fillStyle = '#ff3b30'
  ctx.fillText('原点', 0, 8)
  ctx.restore()

  // 3. 绘制任务点
  const taskPts = (props.taskPoints && props.taskPoints.length > 0) ? props.taskPoints : currentTaskPoints.value
  if (taskPts.length > 0) {
    const groups = getGroupedTaskPoints(taskPts as any)
    groups.forEach((p) => {
      const px = (p.x - meta.originX) / meta.resolution
      const py = mapH - (p.y - meta.originY) / meta.resolution
      const tx = baseOffsetX + px * baseScale
      const ty = baseOffsetY + py * baseScale

      ctx.save()
      ctx.translate(tx, ty)
      ctx.scale(1 / zoom, 1 / zoom)

      ctx.beginPath()
      ctx.arc(0, 0, 9, 0, Math.PI * 2)
      ctx.fillStyle = '#ff9500'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(p.displayIndex), 0, 0)

      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      const displayName = p.items.length > 1 ? `${p.items[0].name}等(${p.items.length})` : p.items[0].name
      ctx.strokeText(displayName, 0, 11)
      ctx.fillStyle = '#ff9500'
      ctx.fillText(displayName, 0, 11)
      ctx.restore()
    })
  }

  // 4. 绘制机器人位置
  const pose = props.robotPose || robotStore.pose
  if (pose && Number.isFinite(pose.x) && Number.isFinite(pose.y)) {
    const px = (pose.x - meta.originX) / meta.resolution
    const py = mapH - (pose.y - meta.originY) / meta.resolution
    const rx = baseOffsetX + px * baseScale
    const ry = baseOffsetY + py * baseScale

    ctx.save()
    ctx.translate(rx, ry)
    ctx.scale(1 / zoom, 1 / zoom)

    ctx.save()
    const angle = typeof pose.theta === 'number' && Number.isFinite(pose.theta) ? pose.theta : 0
    ctx.rotate(-angle)

    ctx.beginPath()
    ctx.moveTo(15, 0)
    ctx.lineTo(6, -6)
    ctx.lineTo(6, 6)
    ctx.closePath()
    ctx.fillStyle = '#00a0e9'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 1
    ctx.fill()
    ctx.shadowColor = 'transparent'

    ctx.beginPath()
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2)
    ctx.fillStyle = '#00a0e9'
    ctx.fill()
    ctx.restore()

    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const labelText = props.robotType === 'four_wheel' ? '无人车' : '机器狗'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeText(labelText, 0, 16)
    ctx.fillStyle = '#00a0e9'
    ctx.fillText(labelText, 0, 16)
    ctx.restore()
  }

  // 5. 绘制实时激光雷达扫描数据
  const scan = props.realtimeScan || robotStore.currentScan
  if (showRealtimeScan.value && scan && scan.data) {
    const scanPoints = scan.data
    let isWorldCoords = false
    if (pose && Number.isFinite(pose.x) && Number.isFinite(pose.y) && scanPoints.length > 0) {
      const pt = scanPoints[0]
      const distToRobot = Math.sqrt((pt[0] - pose.x) ** 2 + (pt[1] - pose.y) ** 2)
      const distToOrigin = Math.sqrt(pt[0] ** 2 + pt[1] ** 2)
      if (distToOrigin > 15 && distToRobot < 15) {
        isWorldCoords = true
      }
    }

    ctx.save()
    ctx.fillStyle = '#ff0055'
    const angle = pose && typeof pose.theta === 'number' && Number.isFinite(pose.theta) ? pose.theta : 0
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)

    scanPoints.forEach(pt => {
      let wx = pt[0]
      let wy = pt[1]
      if (!isWorldCoords && pose && Number.isFinite(pose.x) && Number.isFinite(pose.y)) {
        wx = pose.x + pt[0] * cosA - pt[1] * sinA
        wy = pose.y + pt[0] * sinA + pt[1] * cosA
      }
      const px = (wx - meta.originX) / meta.resolution
      const py = mapH - (wy - meta.originY) / meta.resolution
      const cx = baseOffsetX + px * baseScale
      const cy = baseOffsetY + py * baseScale
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(0.6, 1.0 / zoom), 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()
  }

  // 6. 绘制功能区
  if (featureAreas3D.value.length > 0 && showFeatureAreas.value) {
    ctx.save()
    ctx.translate(baseOffsetX, baseOffsetY)
    ctx.scale(baseScale, baseScale)

    const colorMap: Record<string, string> = {
      forbidden: '#ef4444',
      stairs: '#f59e0b',
      slope: '#8b5cf6',
      narrow: '#06b6d4',
      grass: '#22c55e',
    }

    const bgMap: Record<string, string> = {
      forbidden: 'rgba(239, 68, 68, 0.15)',
      stairs: 'rgba(245, 158, 11, 0.15)',
      slope: 'rgba(139, 92, 246, 0.15)',
      narrow: 'rgba(6, 182, 212, 0.15)',
      grass: 'rgba(34, 197, 94, 0.15)',
    }

    featureAreas3D.value.forEach((area) => {
      if (!area.coordinates || area.coordinates.length < 2) return
      const pts = area.coordinates.map(([mx, my]) => mapCoordinateToCanvasPoint(mx, my))

      // a) 区域填充
      if (area.geometry === 'area' && pts.length >= 3) {
        ctx.save()
        ctx.beginPath()
        pts.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y)
          else ctx.lineTo(pt.x, pt.y)
        })
        ctx.closePath()
        ctx.fillStyle = bgMap[area.type] || 'rgba(0,0,0,0)'
        ctx.fill()

        const pattern = getGridPattern(ctx, area.type)
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fill()
        }
        ctx.restore()
      }

      // b) 轮廓边线
      ctx.save()
      ctx.beginPath()
      pts.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y)
        else ctx.lineTo(pt.x, pt.y)
      })
      if (area.geometry === 'area') {
        ctx.closePath()
      }
      ctx.strokeStyle = colorMap[area.type] || '#ffffff'
      ctx.lineWidth = 1.5 / (baseScale * zoom)
      ctx.stroke()
      ctx.restore()

      // c) 中心文字标签
      if (area.name) {
        let sumX = 0
        let sumY = 0
        pts.forEach((pt) => {
          sumX += pt.x
          sumY += pt.y
        })
        const centX = sumX / pts.length
        const centY = sumY / pts.length

        ctx.save()
        ctx.font = `bold ${Math.max(10, 11 / (baseScale * zoom))}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const textColor = colorMap[area.type] || '#ffffff'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3 / (baseScale * zoom)
        ctx.strokeText(area.name, centX, centY)
        ctx.fillStyle = textColor
        ctx.fillText(area.name, centX, centY)
        ctx.restore()
      }
    })

    ctx.restore()
  }

  ctx.restore()
}

// 栅格图平移与缩放事件
let isDraggingGrid = false
let startDragGridX = 0
let startDragGridY = 0

const handleGridMapWheel = (e: WheelEvent) => {
  e.preventDefault()
  const zoomFactor = 1.1
  let newZoom = gridMapZoom.value
  if (e.deltaY < 0) {
    newZoom = Math.min(10.0, newZoom * zoomFactor)
  } else {
    newZoom = Math.max(0.3, newZoom / zoomFactor)
  }
  gridMapZoom.value = newZoom
  drawGridMapCanvas()
}

const handleGridMapMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  isDraggingGrid = true
  startDragGridX = e.clientX - gridMapPanX.value
  startDragGridY = e.clientY - gridMapPanY.value
  if (gridMapCanvasRef.value) {
    gridMapCanvasRef.value.style.cursor = 'grabbing'
  }
}

const handleGridMapMouseMove = (e: MouseEvent) => {
  if (isDraggingGrid) {
    gridMapPanX.value = e.clientX - startDragGridX
    gridMapPanY.value = e.clientY - startDragGridY
    drawGridMapCanvas()
    gridMapTooltip.value.show = false
    return
  }

  // 悬停检测任务点
  const canvas = gridMapCanvasRef.value
  const container = gridMapContainerRef.value
  const meta = gridMapMeta.value
  const taskPts = (props.taskPoints && props.taskPoints.length > 0) ? props.taskPoints : currentTaskPoints.value
  if (!canvas || !container || !meta || taskPts.length === 0) {
    gridMapTooltip.value.show = false
    return
  }

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const mapW = gridMapWidth.value
  const mapH = gridMapHeight.value
  const scaleX = container.clientWidth / mapW
  const scaleY = container.clientHeight / mapH
  const baseScale = Math.min(scaleX, scaleY)
  const baseOffsetX = (container.clientWidth - mapW * baseScale) / 2
  const baseOffsetY = (container.clientHeight - mapH * baseScale) / 2

  const groups = getGroupedTaskPoints(taskPts as any)
  let foundGroup: any = null
  let foundCx = 0
  let foundCy = 0

  for (const p of groups) {
    const projected = getProjectedCoords(
      p.x,
      p.y,
      meta,
      mapH,
      baseScale,
      baseOffsetX,
      baseOffsetY,
      container.clientWidth,
      container.clientHeight,
      gridMapZoom.value,
      gridMapPanX.value,
      gridMapPanY.value
    )
    const dist = Math.hypot(mouseX - projected.x, mouseY - projected.y)
    if (dist < 12) {
      foundGroup = p
      foundCx = projected.x
      foundCy = projected.y
      break
    }
  }

  if (foundGroup) {
    gridMapTooltip.value = {
      show: true,
      x: foundCx,
      y: foundCy - 15,
      content: foundGroup.items
    }
  } else {
    gridMapTooltip.value.show = false
  }
}

const handleGridMapMouseUp = () => {
  if (!isDraggingGrid) return
  isDraggingGrid = false
  if (gridMapCanvasRef.value) {
    gridMapCanvasRef.value.style.cursor = 'grab'
  }
}

const handleGridMapMouseLeave = () => {
  handleGridMapMouseUp()
  gridMapTooltip.value.show = false
}

// ----------------- 高德卫星/标准地图逻辑 -----------------
const mapContainer = ref<HTMLElement | null>(null)
let amapInstance: any = null
let amapApiRef: any = null
let robotMapMarker: any = null
let originMapMarker: any = null
let trafficLayer: any = null
let trajectoryPolyline: any = null
let taskpointMarkers: any[] = []
const currentMapType = ref<'standard' | 'satellite'>('standard')
const showTraffic = ref(false)
const showLayerMenu = ref(false)
let isAMapLoading = false

const convertLocalToGps = (x: number, y: number, gnssOrigin: { latitude: number; longitude: number } | null) => {
  let lat0 = 0
  let lng0 = 0
  if (gnssOrigin) {
    lat0 = gnssOrigin.latitude
    lng0 = gnssOrigin.longitude
  } else {
    const gps = robotStore.gpsMessage
    const pose = props.robotPose || robotStore.pose
    if (gps && gps.longitude != null && gps.latitude != null && pose) {
      const glat = Number(gps.latitude)
      const glng = Number(gps.longitude)
      const rx = Number(pose.x)
      const ry = Number(pose.y)
      if (Number.isFinite(glat) && Number.isFinite(glng) && Number.isFinite(rx) && Number.isFinite(ry)) {
        lat0 = glat - ry / 111319.0
        lng0 = glng - rx / (111319.0 * Math.cos(glat * Math.PI / 180))
      }
    }
  }
  if (lat0 === 0 || lng0 === 0) return null
  const lat = lat0 + y / 111319.0
  const lng = lng0 + x / (111319.0 * Math.cos(lat0 * Math.PI / 180))
  return { latitude: lat, longitude: lng }
}

const isOutOfChina = (lng: number, lat: number) => {
  return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271)
}

const transformLat = (lng: number, lat: number) => {
  const PI = Math.PI
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
  return ret
}

const transformLng = (lng: number, lat: number) => {
  const PI = Math.PI
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

const transformWGS84ToGCJ02 = (wgsLng: number, wgsLat: number) => {
  const PI = Math.PI
  const ee = 0.00669342162296594323
  const a = 6378245.0

  if (isOutOfChina(wgsLng, wgsLat)) {
    return { longitude: wgsLng, latitude: wgsLat }
  }

  let dlat = transformLat(wgsLng - 105.0, wgsLat - 35.0)
  let dlng = transformLng(wgsLng - 105.0, wgsLat - 35.0)
  const radlat = wgsLat / 180.0 * PI
  let magic = Math.sin(radlat)
  magic = 1 - ee * magic * magic
  const sqrtmagic = Math.sqrt(magic)
  dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI)
  dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI)
  const mglat = wgsLat + dlat
  const mglng = wgsLng + dlng
  return { longitude: mglng, latitude: mglat }
}

const initAMap = () => {
  if (amapInstance || isAMapLoading || !mapContainer.value) return
  isAMapLoading = true

  // @ts-ignore
  const definedAmapKey = (typeof __AMAP_KEY__ !== 'undefined' ? __AMAP_KEY__ : '') as string
  // @ts-ignore
  const definedAmapSec = (typeof __AMAP_SECURITY__ !== 'undefined' ? __AMAP_SECURITY__ : '') as string
  const envAmapKey = (import.meta as any).env?.VITE_AMAP_KEY || ''
  const envAmapSec = (import.meta as any).env?.VITE_AMAP_SECURITY || ''
  const amapKey = definedAmapKey || envAmapKey || '6f9eaf51960441fa4f813ea2d7e7cfff'
  const amapSec = definedAmapSec || envAmapSec || ''

  if (amapSec) {
    ;(window as any)._AMapSecurityConfig = { securityJsCode: amapSec }
  }

  AMapLoader.load({
    key: amapKey,
    version: '2.0',
    plugins: ['AMap.ToolBar', 'AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.Scale']
  }).then((AMap) => {
    amapApiRef = AMap
    const initLayers = currentMapType.value === 'satellite'
      ? [new AMap.TileLayer.Satellite({ detectRetina: true }), new AMap.TileLayer.RoadNet({ detectRetina: true })]
      : [AMap.createDefaultLayer()]

    amapInstance = new AMap.Map(mapContainer.value, {
      zoom: 18,
      zooms: [2, 22],
      center: [116.397428, 39.90923],
      logoEnable: false,
      copyrightEnable: false,
      viewMode: '3D',
      layers: initLayers,
      mapStyle: 'amap://styles/normal'
    })

    const scale = new AMap.Scale({
      position: 'RB',
      offset: new AMap.Pixel(20, 20)
    })
    amapInstance.addControl(scale)

    amapInstance.on('complete', () => {
      updateRobotMapMarker(true)
      if (props.mapName) {
        loadGnssOrigin(props.mapName).then(gnssOrigin => {
          updateOriginMapMarker(gnssOrigin)
        })
      }
      syncRuntimeTrajectoryOverlay()
    })
    isAMapLoading = false
  }).catch((err) => {
    console.error('[地图组件] AMap load failed:', err)
    isAMapLoading = false
  })
}

const setMapType = (type: 'standard' | 'satellite') => {
  currentMapType.value = type
  showLayerMenu.value = false
  if (!amapInstance || !amapApiRef) return

  if (type === 'satellite') {
    const satelliteLayer = new amapApiRef.TileLayer.Satellite({ detectRetina: true })
    const roadNetLayer = new amapApiRef.TileLayer.RoadNet({ detectRetina: true })
    const layers = [satelliteLayer, roadNetLayer]
    if (showTraffic.value && trafficLayer) layers.push(trafficLayer)
    amapInstance.setLayers(layers)
  } else {
    const defaultLayer = amapApiRef.createDefaultLayer()
    const layers = [defaultLayer]
    if (showTraffic.value && trafficLayer) layers.push(trafficLayer)
    amapInstance.setLayers(layers)
  }
}

const toggleTraffic = () => {
  showTraffic.value = !showTraffic.value
  if (!amapInstance || !amapApiRef) return
  if (showTraffic.value) {
    if (!trafficLayer) {
      trafficLayer = new amapApiRef.TileLayer.Traffic({ zIndex: 10, opacity: 0.8 })
    }
    amapInstance.add(trafficLayer)
  } else if (trafficLayer) {
    amapInstance.remove(trafficLayer)
  }
}

const loadGnssOrigin = async (mapName: string): Promise<{ latitude: number; longitude: number } | null> => {
  if (!mapName) return null
  try {
    let blob = await getMapFile(mapName, 'gnss_origin.txt')
    if (!blob || blob.size === 0) {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        blob = await mapFileApi.downloadMapFile(robotId, mapName, 'gnss_origin.txt', true)
        if (blob) await saveMapFile(mapName, 'gnss_origin.txt', blob)
      }
    }
    if (!blob || blob.size === 0) return null
    const text = await blob.text()
    const parts = text.trim().split(/[\s,]+/)
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0])
      const lon = parseFloat(parts[1])
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { latitude: lat, longitude: lon }
      }
    }
    return null
  } catch {
    return null
  }
}

const updateOriginMapMarker = (gnssOrigin: { latitude: number; longitude: number } | null) => {
  if (!amapInstance || !amapApiRef) return
  if (!gnssOrigin) {
    if (originMapMarker) {
      amapInstance.remove(originMapMarker)
      originMapMarker = null
    }
    return
  }

  const content = `
    <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">
      <div style="width:12px;height:12px;border-radius:50%;background:#ff3b30;border:2px solid #ffffff;box-shadow:0 0 6px rgba(255,59,48,0.8);"></div>
      <div style="font-size:12px;color:#ff3b30;font-weight:bold;text-shadow:0 0 3px #fff,0 0 3px #fff;margin-top:2px;">原点</div>
    </div>
  `

  if (!originMapMarker) {
    originMapMarker = new amapApiRef.Marker({
      position: [gnssOrigin.longitude, gnssOrigin.latitude],
      offset: new amapApiRef.Pixel(-6, -6),
      content,
      zIndex: 120,
    })
    amapInstance.add(originMapMarker)
  } else {
    originMapMarker.setPosition([gnssOrigin.longitude, gnssOrigin.latitude])
    originMapMarker.setContent(content)
  }
}

const updateRobotMapMarker = (shouldCenter = false) => {
  if (!amapInstance || !amapApiRef) return
  const gps = robotStore.gpsMessage
  if (!gps || typeof gps.longitude !== 'number' || typeof gps.latitude !== 'number') {
    return
  }
  const pos = [gps.longitude, gps.latitude]
  const heading = gps.heading || 0
  const labelText = props.robotType === 'four_wheel' ? '无人车' : '机器狗'

  const markerContent = `
    <div class="robot-location-indicator" style="display:flex;justify-content:center;align-items:center;position:relative;width:44px;height:44px;">
      <img class="robot-nav-arrow" src="${droneArrowIcon}" style="transform: rotate(${heading}deg);width:32px;height:32px;" alt="robot" />
      <span style="position:absolute;bottom:-14px;white-space:nowrap;font-size:12px;font-weight:bold;color:#00a0e9;text-shadow:0 0 3px #fff,0 0 3px #fff;">${labelText}</span>
    </div>
  `

  if (!robotMapMarker) {
    robotMapMarker = new amapApiRef.Marker({
      position: pos,
      offset: new amapApiRef.Pixel(-22, -22),
      content: markerContent,
      zIndex: 130,
    })
    amapInstance.add(robotMapMarker)
  } else {
    robotMapMarker.setPosition(pos)
    robotMapMarker.setContent(markerContent)
  }

  if (shouldCenter) {
    amapInstance.setCenter(pos)
  }
}

// ----------------- 工具栏与居中全屏 -----------------
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    if (currentViewType.value === 'pointcloud') {
      threePointCloudRef.value?.fitCameraToScene?.()
    } else if (currentViewType.value === 'grid') {
      drawGridMapCanvas()
    }
  })
}

const handleEscKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27) {
    if (isFullscreen.value) {
      isFullscreen.value = false
      nextTick(() => {
        if (currentViewType.value === 'pointcloud') {
          threePointCloudRef.value?.fitCameraToScene?.()
        } else if (currentViewType.value === 'grid') {
          drawGridMapCanvas()
        }
      })
    }
  }
}

const centerToRobot = () => {
  if (currentViewType.value === 'map') {
    updateRobotMapMarker(true)
  } else if (currentViewType.value === 'pointcloud') {
    threePointCloudRef.value?.centerToRobot?.()
  } else if (currentViewType.value === 'grid') {
    const meta = gridMapMeta.value
    const container = gridMapContainerRef.value
    const pose = props.robotPose || robotStore.pose
    const mapW = gridMapWidth.value
    const mapH = gridMapHeight.value
    if (meta && container && pose && Number.isFinite(pose.x) && Number.isFinite(pose.y) && mapW > 0 && mapH > 0) {
      const containerWidth = container.clientWidth || 800
      const containerHeight = container.clientHeight || 500
      const scaleX = containerWidth / mapW
      const scaleY = containerHeight / mapH
      const baseScale = Math.min(scaleX, scaleY)
      const baseOffsetX = (containerWidth - mapW * baseScale) / 2
      const baseOffsetY = (containerHeight - mapH * baseScale) / 2

      const px = (pose.x - meta.originX) / meta.resolution
      const py = mapH - (pose.y - meta.originY) / meta.resolution
      const rx = baseOffsetX + px * baseScale
      const ry = baseOffsetY + py * baseScale
      const zoom = gridMapZoom.value
      gridMapPanX.value = (containerWidth / 2 - rx) * zoom
      gridMapPanY.value = (containerHeight / 2 - ry) * zoom
    }
    drawGridMapCanvas()
  }
}

// 刷新整个地图组件
const refresh = async () => {
  if (!props.mapName) return
  await Promise.all([
    loadPointCloudData(props.mapName),
    loadNavigationOrigin(props.mapName),
    loadFeatureAreasForMap(props.mapName),
    loadAndDrawGridMap(props.mapName),
  ])
  if (currentViewType.value === 'map') {
    loadGnssOrigin(props.mapName).then(gnssOrigin => {
      updateOriginMapMarker(gnssOrigin)
    })
  }
}

// 监听地图变更
watch(
  () => props.mapName,
  (newMap) => {
    if (newMap) {
      refresh()
    } else {
      pointCloudData.value = []
      basePointCloudData.value = []
      featureAreas3D.value = []
      gridMapMeta.value = null
      gridMapOffscreenCanvas.value = null
      currentTrajectoryPoints.value = []
      currentTaskPoints.value = []
      drawGridMapCanvas()
    }
  },
  { immediate: true }
)

// 监听位姿/实时扫描更新
watch(
  [
    () => props.robotPose,
    () => robotStore.pose,
    () => props.realtimeScan,
    () => robotStore.currentScan,
  ],
  () => {
    if (currentViewType.value === 'grid') {
      drawGridMapCanvas()
    } else if (currentViewType.value === 'map') {
      updateRobotMapMarker(false)
    }
  },
  { deep: true }
)

// 监听循迹/任务状态变化并自动同步
watch(
  [
    () => robotStore.cmdStatus?.track,
    () => robotStore.cmdStatus?.track_info,
    () => robotStore.isTracking,
    () => props.activeTrackName,
    () => props.trajectoryPoints,
    () => props.taskPoints,
  ],
  async () => {
    await syncRuntimeTrajectoryOverlay()
  },
  { deep: true, immediate: true }
)

// 监听 INS 状态变化
watch(
  [() => robotStore.cmdStatus?.ins, () => robotStore.insOriginCoordinates],
  async () => {
    if (robotStore.cmdStatus?.track === 1 || robotStore.isTracking) {
      await syncRuntimeTrajectoryOverlay()
    }
  }
)

onMounted(async () => {
  load3MF('/jiantou.3mf').then(mesh => {
    if (mesh) {
      arrowMesh.value = mesh
    }
  })
  window.addEventListener('keydown', handleEscKeydown)
  syncRuntimeTrajectoryOverlay()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKeydown)
  if (amapInstance) {
    try { amapInstance.destroy() } catch (_) {}
    amapInstance = null
  }
})

defineExpose({
  fitCameraToScene: () => threePointCloudRef.value?.fitCameraToScene?.(),
  centerToRobot,
  toggleFullscreen,
  refresh,
  setViewType,
  currentViewType,
  overlayTrackTrajectory,
  clearTrackOverlay,
})
</script>

<style scoped>
.robot-map-viewer {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
}

.pointcloud-view {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  background: radial-gradient(circle at 20% 20%, rgba(89, 192, 252, 0.2), transparent 45%),
              radial-gradient(circle at 80% 10%, rgba(255, 128, 0, 0.12), transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(0, 225, 255, 0.2), transparent 50%),
              #020915;
  overflow: hidden;
  box-sizing: border-box;
  touch-action: none;
}

.grid-map-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
}

.grid-map-canvas {
  display: block;
}

.grid-map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  color: #1a1a1a;
  font-size: 14px;
  letter-spacing: 1px;
}

.grid-map-overlay.error {
  background: rgba(255, 77, 79, 0.15);
  color: #ff4d4f;
}

.grid-map-realtime-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.grid-map-realtime-btn:hover {
  color: #0284c7;
  background: #f8fafc;
  border-color: #0284c7;
}

.grid-map-realtime-btn.active {
  color: #ffffff;
  background: #ff0055;
  border-color: #ff0055;
}

.grid-map-realtime-btn svg {
  width: 100%;
  height: 100%;
}

.grid-map-tooltip {
  position: absolute;
  background: rgba(0, 12, 23, 0.88);
  border: 1px solid rgba(89, 192, 252, 0.5);
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

/* 栅格图功能区图例 */
.home-grid-legend {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 6px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 90px;
  pointer-events: none;
  user-select: none;
}
.home-grid-legend .legend-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.home-grid-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.home-grid-legend .legend-item-icon {
  flex-shrink: 0;
  border-radius: 2px;
}
.home-grid-legend .legend-item-label {
  font-size: 10px;
  color: #334155 !important;
}

.home-grid-legend .feature-area-forbidden { stroke: #ef4444; fill: #ef4444; }
.home-grid-legend .feature-area-stairs { stroke: #f59e0b; fill: #f59e0b; }
.home-grid-legend .feature-area-slope { stroke: #8b5cf6; fill: #8b5cf6; }
.home-grid-legend .feature-area-narrow { stroke: #06b6d4; fill: #06b6d4; }
.home-grid-legend .feature-area-grass { stroke: #22c55e; fill: #22c55e; }

/* 视图模式切换组 (靠左侧) */
.map-view-switcher-group {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 6px;
  z-index: 100;
}
.view-switch-btn {
  width: 24px;
  height: 24px;
  padding: 4px;
  background: rgba(0, 12, 23, 0.75);
  border: 1px solid rgba(89, 192, 252, 0.35);
  backdrop-filter: blur(8px);
  border-radius: 4px;
  color: rgba(89, 192, 252, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.view-switch-btn:hover {
  color: #fff;
  background: rgba(89, 192, 252, 0.15);
  border-color: rgba(89, 192, 252, 0.75);
}
.view-switch-btn.active {
  color: #fff;
  background: rgba(89, 192, 252, 0.55);
  border-color: #59c0fc;
}
.view-switch-btn svg {
  width: 14px;
  height: 14px;
}

/* 点云与栅格图工具按钮组 (靠右下角) */
.pcd-btn-group {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 6px;
  z-index: 100;
}
.pcd-tool-btn {
  width: 24px;
  height: 24px;
  padding: 4px;
  background: rgba(0, 12, 23, 0.75);
  border: 1px solid rgba(89, 192, 252, 0.35);
  backdrop-filter: blur(8px);
  border-radius: 4px;
  color: rgba(89, 192, 252, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.pcd-tool-btn:hover {
  color: #fff;
  background: rgba(89, 192, 252, 0.15);
  border-color: rgba(89, 192, 252, 0.75);
}
.pcd-tool-btn.active {
  color: #fff;
  background: rgba(89, 192, 252, 0.55);
  border-color: #59c0fc;
}
.pcd-tool-btn svg {
  width: 14px;
  height: 14px;
}

/* 高德地图图层切换器 */
.map-layer-switcher {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.layer-switch-trigger {
  background: rgba(0, 12, 23, 0.75);
  border: 1px solid rgba(89, 192, 252, 0.45);
  backdrop-filter: blur(10px);
  border-radius: 4px;
  color: #59c0fc;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  transition: all 0.2s ease;
}
.layer-switch-trigger:hover {
  background: rgba(89, 192, 252, 0.15);
  color: #fff;
  border-color: rgba(89, 192, 252, 0.8);
}
.layer-switch-trigger svg {
  width: 14px;
  height: 14px;
}
.layer-menu-dropdown {
  margin-top: 6px;
  background: rgba(0, 12, 23, 0.85);
  border: 1px solid rgba(89, 192, 252, 0.35);
  backdrop-filter: blur(12px);
  border-radius: 4px;
  padding: 6px 0;
  width: 110px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
}
.layer-option {
  padding: 8px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
}
.layer-option:hover {
  background: rgba(89, 192, 252, 0.12);
  color: #fff;
}
.layer-option.active {
  color: #59c0fc;
  font-weight: bold;
  background: rgba(89, 192, 252, 0.08);
}
.layer-divider {
  height: 1px;
  background: rgba(89, 192, 252, 0.2);
  margin: 4px 0;
}
.option-checkbox {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(89, 192, 252, 0.5);
  border-radius: 2px;
  display: inline-block;
  position: relative;
  transition: all 0.15s;
}
.option-checkbox.checked {
  background: #59c0fc;
  border-color: #59c0fc;
}
.option-checkbox.checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 1px;
  width: 4px;
  height: 6px;
  border: solid #000;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
.layer-option .option-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  display: inline-block;
}
.layer-option.active .option-icon {
  background: #59c0fc;
  box-shadow: 0 0 6px #59c0fc;
}

/* 全屏模式 */
.pointcloud-fullscreen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0 !important;
  padding: 0 !important;
}
.pointcloud-fullscreen .pcd-btn-group {
  bottom: 16px;
  right: 16px;
  z-index: 10000;
}
.pointcloud-fullscreen .map-view-switcher-group {
  bottom: 16px;
  left: 16px;
  z-index: 10000;
}

.layer-menu-fade-enter-active,
.layer-menu-fade-leave-active {
  transition: all 0.2s ease;
}
.layer-menu-fade-enter-from,
.layer-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* 机器人地图任务点样式 */
:deep(.robot-map-taskpoint) {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
}
:deep(.robot-map-taskpoint) .taskpoint-dot {
  width: 14px;
  height: 14px;
  background: #ffd21f;
  border: 2.5px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 210, 31, 0.6), 0 2px 6px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}
:deep(.robot-map-taskpoint) .taskpoint-label {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  color: #FFD800;
  background: rgba(5, 15, 35, 0.48);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1.5px solid rgba(255, 216, 0, 0.85);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}
</style>
