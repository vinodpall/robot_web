<template>
  <div class="three-pointcloud-shell">
    <div ref="containerRef" class="three-pointcloud-canvas"></div>
    <div v-if="loading" class="three-pointcloud-overlay">点云加载中...</div>
    <div v-else-if="error" class="three-pointcloud-overlay error">{{ error }}</div>
    <div v-else-if="!points.length" class="three-pointcloud-overlay">暂无点云数据</div>
    <div class="three-pointcloud-hud">
      <span>Three.js 预览</span>
      <span>{{ points.length.toLocaleString() }} points</span>
      <span>左键旋转 / 右键平移 / 滚轮缩放</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { PointCloudPoint } from '@/composables/usePointCloudRenderer'

const props = defineProps<{
  points: PointCloudPoint[]
  loading?: boolean
  error?: string
}>()

const containerRef = ref<HTMLDivElement | null>(null)

const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)
const sceneRef = shallowRef<THREE.Scene | null>(null)
const cameraRef = shallowRef<THREE.PerspectiveCamera | null>(null)
const controlsRef = shallowRef<OrbitControls | null>(null)
const pointsObjectRef = shallowRef<THREE.Points | null>(null)
let resizeObserver: ResizeObserver | null = null
let animationFrameId = 0

const getPointSize = (count: number) => {
  if (count <= 40000) return 0.016
  if (count <= 80000) return 0.013
  if (count <= 140000) return 0.01
  return 0.008
}

const disposePointsObject = () => {
  const scene = sceneRef.value
  const pointObject = pointsObjectRef.value
  if (!scene || !pointObject) return

  scene.remove(pointObject)
  pointObject.geometry.dispose()
  ;(pointObject.material as THREE.Material).dispose()
  pointsObjectRef.value = null
}

const rebuildPointCloud = () => {
  const scene = sceneRef.value
  if (!scene) return

  disposePointsObject()

  if (!props.points.length) return

  const positions = new Float32Array(props.points.length * 3)
  const colors = new Float32Array(props.points.length * 3)

  for (let index = 0; index < props.points.length; index++) {
    const point = props.points[index]
    const base = index * 3
    positions[base] = point.x
    positions[base + 1] = point.z
    positions[base + 2] = -point.y

    const color = new THREE.Color()
    if (point.intensity >= 1.9) {
      color.setRGB(0.15, 1, 0.35)
    } else if (point.intensity >= 1.7) {
      color.setRGB(1, 0.86, 0.15)
    } else {
      color.setHSL(0.58 - point.intensity * 0.1, 0.9, 0.48 + point.intensity * 0.18)
    }
    colors[base] = color.r
    colors[base + 1] = color.g
    colors[base + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()

  const material = new THREE.PointsMaterial({
    size: getPointSize(props.points.length),
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95
  })

  const pointCloud = new THREE.Points(geometry, material)
  scene.add(pointCloud)
  pointsObjectRef.value = pointCloud

  const bounds = geometry.boundingSphere
  const camera = cameraRef.value
  const controls = controlsRef.value
  if (bounds && camera && controls) {
    controls.target.set(bounds.center.x, bounds.center.y, bounds.center.z)
    camera.position.set(bounds.center.x + bounds.radius * 1.6, bounds.center.y + bounds.radius * 1.1, bounds.center.z + bounds.radius * 1.8)
    camera.near = Math.max(bounds.radius / 100, 0.01)
    camera.far = Math.max(bounds.radius * 20, 10)
    camera.updateProjectionMatrix()
    controls.update()
  }
}

const resizeRenderer = () => {
  const container = containerRef.value
  const renderer = rendererRef.value
  const camera = cameraRef.value
  if (!container || !renderer || !camera) return

  const width = container.clientWidth
  const height = container.clientHeight
  if (!width || !height) return

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

const startRenderLoop = () => {
  const renderer = rendererRef.value
  const scene = sceneRef.value
  const camera = cameraRef.value
  const controls = controlsRef.value
  if (!renderer || !scene || !camera || !controls) return

  const render = () => {
    controls.update()
    renderer.render(scene, camera)
    animationFrameId = window.requestAnimationFrame(render)
  }

  render()
}

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#020915')
  scene.fog = new THREE.Fog('#020915', 1.8, 4.5)

  const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 100)
  camera.position.set(1.3, 1.1, 1.6)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor('#020915', 1)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.screenSpacePanning = true
  controls.minDistance = 0.15
  controls.maxDistance = 8

  scene.add(new THREE.GridHelper(1.6, 12, '#3aa4e6', '#153247'))
  scene.add(new THREE.AxesHelper(0.35))

  const ambient = new THREE.AmbientLight('#b7d7ff', 1.1)
  scene.add(ambient)

  const directional = new THREE.DirectionalLight('#ffffff', 1.4)
  directional.position.set(1.5, 2, 1)
  scene.add(directional)

  sceneRef.value = scene
  cameraRef.value = camera
  rendererRef.value = renderer
  controlsRef.value = controls

  resizeRenderer()
  rebuildPointCloud()
  startRenderLoop()

  resizeObserver = new ResizeObserver(() => {
    resizeRenderer()
  })
  resizeObserver.observe(container)
})

watch(() => props.points, () => {
  rebuildPointCloud()
}, { deep: false })

onBeforeUnmount(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
  }
  resizeObserver?.disconnect()
  resizeObserver = null

  disposePointsObject()
  controlsRef.value?.dispose()
  rendererRef.value?.dispose()

  const container = containerRef.value
  const canvas = rendererRef.value?.domElement
  if (container && canvas && container.contains(canvas)) {
    container.removeChild(canvas)
  }
})
</script>

<style scoped>
.three-pointcloud-shell {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
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

.three-pointcloud-hud {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border: 1px solid rgba(91, 205, 255, 0.2);
  border-radius: 999px;
  background: rgba(3, 12, 24, 0.72);
  color: rgba(220, 242, 255, 0.92);
  font-size: 12px;
  line-height: 1;
  z-index: 2;
}
</style>
