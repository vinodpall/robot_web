<template>
  <div class="drone-control-main">
    <!-- 侧边栏菜单 -->
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: currentTab === tab.key }]"
          :title="tab.label"
          @click="handleTabClick(tab.key)"
        >
          <img :src="tab.icon" :alt="tab.label" />
        </div>
      </div>
    </aside>
    <!-- 主体内容区 -->
    <main class="main-content">
      <div class="main-flex">
        <section class="right-panel">
          <!-- 录包建图 -->
          <template v-if="currentTab === 'map_record'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">录包建图</span>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <!-- 采集地图数据 -->
              <div class="map-section">
                <div class="map-section-title">采集地图数据</div>
                <div class="map-section-buttons">
                  <button 
                    class="map-btn map-btn-primary" 
                    :disabled="isRecording"
                    @click="handleStartRecording"
                  >
                    开始录包
                  </button>
                  <button 
                    class="map-btn map-btn-secondary" 
                    :disabled="!isRecording"
                    @click="handleStopRecording"
                  >
                    完成录制
                  </button>
                </div>
              </div>

              <!-- 创建二维地图 -->
              <div class="map-section">
                <div class="map-section-title">创建二维地图</div>
                <div class="map-section-buttons">
                  <button class="map-btn map-btn-primary" @click="handleGenerateMap">生成地图</button>
                  <button class="map-btn map-btn-primary" @click="handleGenerateGridMap">生成栅格地图</button>
                  <button class="map-btn map-btn-primary" @click="handleCreateFusionMap">新建融合地图</button>
                </div>
              </div>

              <!-- 建图进度 -->
              <div class="map-section">
                <div class="map-progress-header">
                  <div class="map-section-title">建图进度: <span class="map-progress-percent">{{ mapProgress }}%</span></div>
                </div>
                <div class="map-progress-wrapper">
                  <div class="map-progress-bar">
                    <div 
                      class="map-progress-fill" 
                      :style="{ width: mapProgress + '%' }"
                    ></div>
                  </div>
                  <button 
                    class="map-btn map-btn-stop" 
                    :disabled="mapProgress === 0"
                    @click="handleStopMapping"
                  >
                    终止
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 导航 -->
          <template v-else-if="currentTab === 'nav'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">导航</span>
              </div>
            </div>
            <div class="nav-content-wrapper nav-page-content">
              <!-- 顶部按钮区 -->
              <div class="map-section">
                <div class="nav-button-group">
                  <button class="map-btn map-btn-primary" @click="handleStartNav">开始导航</button>
                  <button class="map-btn map-btn-secondary" @click="handlePauseNav">暂停导航</button>
                  <button class="map-btn map-btn-secondary" @click="handleResumeNav">暂停恢复</button>
                  <button class="map-btn map-btn-primary" @click="handleStartINS">开始INS</button>
                  <button class="map-btn map-btn-primary" @click="handleInitINS">INS初始化</button>
                  <button class="map-btn map-btn-primary" @click="handleStartMSF">开始MSF</button>
                  <button class="map-btn map-btn-secondary" @click="handleCircleMode">循迹随停循</button>
                  <button class="map-btn map-btn-secondary" @click="handleCloseGPS">关闭GPS</button>
                  <button class="map-btn map-btn-secondary" @click="handleSetOrigin">原点设置</button>
                </div>
              </div>

              <!-- 主体内容区 -->
              <div class="nav-main-content">
                <!-- 左侧信息面板 -->
                <div class="nav-info-panel">
                  <!-- 地图选择 -->
                  <div class="nav-info-item">
                    <label class="nav-label">地图：</label>
                    <select v-model="selectedNavMap" class="nav-select">
                      <option value="电厂巡检地图">电厂巡检地图</option>
                      <option value="仓库地图">仓库地图</option>
                      <option value="园区地图">园区地图</option>
                    </select>
                  </div>

                  <!-- 任务速度设置 -->
                  <div class="nav-info-item">
                    <label class="nav-label">任务速度设置：</label>
                    <div class="nav-speed-control">
                      <button class="nav-speed-btn" @click="decreaseSpeed">-</button>
                      <input v-model="taskSpeed" class="nav-speed-input" readonly />
                      <button class="nav-speed-btn" @click="increaseSpeed">+</button>
                    </div>
                  </div>

                  <!-- 速度信息 -->
                  <div class="nav-info-row">
                    <div class="nav-info-col">
                      <span class="nav-info-label">W:</span>
                      <span class="nav-info-value">{{ navData.w }} rad/s</span>
                    </div>
                    <div class="nav-info-col">
                      <span class="nav-info-label">V:</span>
                      <span class="nav-info-value">{{ navData.v }}</span>
                    </div>
                  </div>

                  <!-- 位置信息 -->
                  <div class="nav-info-row">
                    <div class="nav-info-col">
                      <span class="nav-info-label">X:</span>
                      <span class="nav-info-value">{{ navData.x }}</span>
                    </div>
                    <div class="nav-info-col">
                      <span class="nav-info-label">Y:</span>
                      <span class="nav-info-value">{{ navData.y }}</span>
                    </div>
                  </div>

                  <!-- 其他状态信息 -->
                  <div class="nav-info-item">
                    <span class="nav-info-label">theta:</span>
                    <span class="nav-info-value">{{ navData.theta }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">抱闸:</span>
                    <span class="nav-info-value">{{ navData.brake }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">激光雷达数据:</span>
                    <span class="nav-info-value">{{ navData.lidar }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">IMU数据:</span>
                    <span class="nav-info-value">{{ navData.imu }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">卫星数据:</span>
                    <span class="nav-info-value">{{ navData.satellite }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">MSF状态:</span>
                    <span class="nav-info-value">{{ navData.msfStatus }}</span>
                  </div>
                </div>

                <!-- 右侧地图可视化区域 -->
                <div class="nav-map-container">
                  <div class="nav-map-canvas">
                    <div class="pointcloud-wrapper">
                      <div class="pointcloud-view">
                        <canvas
                          ref="navPointCloudCanvas"
                          class="pointcloud-canvas"
                          tabindex="0"
                          @wheel.prevent="handleNavPointCloudWheel"
                          @pointerdown="handleNavPointCloudPointerDown"
                          @keydown="handleNavPointCloudKeydown"
                          @contextmenu.prevent
                        ></canvas>
                        <div v-if="navPointCloudLoading" class="pcd-overlay loading">点云加载中...</div>
                        <div v-else-if="navPointCloudError" class="pcd-overlay error">{{ navPointCloudError }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 地图编辑 -->
          <template v-else-if="currentTab === 'map_edit'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">地图编辑</span>
              </div>
            </div>
            <div class="map-edit-grid-card">
              <div class="map-edit-grid-header">
                <div class="map-edit-toolbar-compact">
                  <div class="toolbar-left">
                    <span class="toolbar-label">地图：</span>
                    <select v-model="selectedEditMap" class="map-edit-select">
                      <option value="FA0625">FA0625</option>
                      <option value="电厂巡检地图">电厂巡检地图</option>
                      <option value="仓库地图">仓库地图</option>
                      <option value="园区地图">园区地图</option>
                    </select>
                  </div>
                  <div class="toolbar-right">
                    <button class="toolbar-btn" :class="{ active: isEditMode }" @click="toggleEditMode" title="栅格图编辑">
                      编辑
                    </button>
                  </div>
                </div>
              </div>
              <div class="map-edit-grid-main">
                <div class="gridmap-container">
                  <canvas ref="gridMapCanvas" class="grid-canvas"></canvas>
                  <div v-if="gridMapLoading" class="map-overlay loading">地图加载中...</div>
                  <div v-else-if="gridMapError" class="map-overlay error">{{ gridMapError }}</div>
                  <div v-show="isEditMode" class="edit-panel-right">
                    <div class="panel-tools">
                      <!-- 拖动模式 -->
                      <div class="navigation-tools">
                        <div class="nav-item" :class="{ active: navMode === 'pan' }" @click="setNavMode('pan')" title="拖动模式">
                          <span class="nav-icon">✋</span>
                        </div>
                      </div>
                      <!-- 放大 -->
                      <div class="navigation-tools">
                        <div class="nav-item" @click="zoomIn" title="放大">
                          <span class="nav-icon">+</span>
                        </div>
                      </div>
                      <!-- 缩小 -->
                      <div class="navigation-tools">
                        <div class="nav-item" @click="zoomOut" title="缩小">
                          <span class="nav-icon">-</span>
                        </div>
                      </div>
                      <!-- 画笔 -->
                      <div class="tool-group">
                        <div class="tool-item" :class="{ active: activeTool === 'pen' && navMode === 'edit' }" @click="setTool('pen')" title="画笔">
                          <span class="tool-icon">✏️</span>
                        </div>
                      </div>
                      <!-- 橡皮擦 -->
                      <div class="tool-group">
                        <div class="tool-item" :class="{ active: activeTool === 'eraser' && navMode === 'edit' }" @click="setTool('eraser')" title="橡皮擦">
                          <span class="tool-icon">🧹</span>
                        </div>
                      </div>
                      <!-- 撤销 -->
                      <div class="tool-actions">
                        <button class="action-btn" @click="undoEdit" :disabled="!canUndo" title="撤回">
                          <span class="action-icon">↶</span>
                        </button>
                      </div>
                      <!-- 初始化 -->
                      <div class="tool-actions">
                        <button class="action-btn" @click="clearGridEdit" title="初始化">
                          <span class="action-icon">⟲</span>
                        </button>
                      </div>
                      <!-- 保存 -->
                      <div class="tool-actions">
                        <button class="action-btn action-btn-save" @click="handleSaveGridMap" :disabled="!gridImageData" title="保存地图">
                          <span class="action-icon">💾</span>
                        </button>
                      </div>
                      <!-- 大小滚动条 -->
                      <div class="tool-settings">
                        <div class="setting-item">
                          <label>大小</label>
                          <input type="range" min="1" max="20" v-model.number="brushSize" class="size-slider" />
                          <span class="size-value">{{ brushSize }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 路线录制 -->
          <template v-else-if="currentTab === 'track_record'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">路线录制</span>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="settings-content">
                <p style="color: #b8c7d9; font-size: 14px;">路线录制功能开发中...</p>
              </div>
            </div>
          </template>

          <!-- 文件管理 -->
          <template v-else-if="currentTab === 'file_manage'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">文件管理</span>
              </div>
              <div class="nav-top-row">
                <input v-model="filter.keyword" class="nav-input" placeholder="请输入关键字搜索" />
                <button class="nav-btn" @click="handleSearch">查询</button>
                <button class="nav-btn nav-btn-add" @click="handleAdd">上传文件</button>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="nav-card-list">
                <div class="nav-card" v-for="(item, idx) in fileList" :key="idx">
                  <div class="nav-card-header">
                    <span class="nav-card-title">{{ item.name || '-' }}</span>
                    <span class="nav-card-delete" @click="handleDelete(item.id)">
                      <img :src="rubbishIcon" alt="删除" />
                    </span>
                  </div>
                  <div class="nav-card-body">
                    <div class="nav-card-info">
                      <div class="info-row"><span class="info-label">文件类型：</span><span class="info-value">{{ item.type || '-' }}</span></div>
                      <div class="info-row"><span class="info-label">文件大小：</span><span class="info-value">{{ item.size || '-' }}</span></div>
                      <div class="info-row"><span class="info-label">创建时间：</span><span class="info-value">{{ item.createTime || '-' }}</span></div>
                      <div class="info-row"><span class="info-label">状态：</span><span class="info-value">{{ item.status || '正常' }}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 数据包管理 -->
          <template v-else-if="currentTab === 'package_manage'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">数据包管理</span>
              </div>
              <div class="nav-top-row">
                <input v-model="filter.keyword" class="nav-input" placeholder="请输入关键字搜索" />
                <button class="nav-btn" @click="handleSearch">查询</button>
                <button class="nav-btn nav-btn-add" @click="handleAdd">新建数据包</button>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="settings-content">
                <p style="color: #b8c7d9; font-size: 14px;">数据包管理功能开发中...</p>
              </div>
            </div>
          </template>
        </section>
      </div>
    </main>

    <!-- 确认对话框 -->
    <ConfirmDialog
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      :type="confirmDialog.type"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.onCancel"
      @close="closeConfirmDialog"
    />

    <!-- 成功提示 -->
    <SuccessMessage
      :show="successMessage.show"
      :message="successMessage.message"
      @close="closeSuccessMessage"
    />

    <!-- 错误提示 -->
    <ErrorMessage
      :show="errorMessage.show"
      :message="errorMessage.message"
      @close="closeErrorMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SuccessMessage from '@/components/SuccessMessage.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import rubbishIcon from '@/assets/source_data/svg_data/rubbish.svg'
import mapRecordIcon from '@/assets/source_data/svg_data/map_record.svg'
import navIcon from '@/assets/source_data/svg_data/nav.svg'
import mapEditIcon from '@/assets/source_data/svg_data/map_edit.svg'
import trackRecordIcon from '@/assets/source_data/svg_data/track_record.svg'
import fileManageIcon from '@/assets/source_data/svg_data/file_manage.svg'
import packageManageIcon from '@/assets/source_data/svg_data/package_manage.svg'

// 导航点云图相关变量（需要在前面声明，因为在cleanupNavPointCloud中使用）
let navPointCloudInitialized = false
let navResizeObserver: ResizeObserver | null = null

// 对话框和消息提示状态
interface ConfirmDialogState {
  show: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  type: 'warning' | 'info' | 'success' | 'error'
  onConfirm: () => void
  onCancel: () => void
}

const confirmDialog = ref<ConfirmDialogState>({
  show: false,
  title: '',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  type: 'warning',
  onConfirm: () => {},
  onCancel: () => {}
})

const successMessage = ref({
  show: false,
  message: ''
})

const errorMessage = ref({
  show: false,
  message: ''
})

// 显示确认对话框
const showConfirmDialog = (options: Partial<ConfirmDialogState>) => {
  confirmDialog.value = {
    show: true,
    title: options.title || '确认操作',
    message: options.message || '您确定要执行此操作吗?',
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText || '取消',
    type: options.type || 'warning',
    onConfirm: options.onConfirm || (() => {}),
    onCancel: options.onCancel || (() => {})
  }
}

const closeConfirmDialog = () => {
  confirmDialog.value.show = false
}

// 显示成功消息
const showSuccessMessage = (message: string) => {
  successMessage.value = {
    show: true,
    message
  }
  setTimeout(() => {
    closeSuccessMessage()
  }, 3000)
}

const closeSuccessMessage = () => {
  successMessage.value.show = false
}

// 显示错误消息
const showErrorMessage = (message: string) => {
  errorMessage.value = {
    show: true,
    message
  }
  setTimeout(() => {
    closeErrorMessage()
  }, 3000)
}

const closeErrorMessage = () => {
  errorMessage.value.show = false
}


// 侧边栏菜单配置
const sidebarTabs = [
  { key: 'map_record', label: '录包建图', icon: mapRecordIcon },
  { key: 'nav', label: '导航', icon: navIcon },
  { key: 'map_edit', label: '地图编辑', icon: mapEditIcon },
  { key: 'track_record', label: '路线录制', icon: trackRecordIcon },
  { key: 'file_manage', label: '文件管理', icon: fileManageIcon },
  { key: 'package_manage', label: '数据包管理', icon: packageManageIcon }
]

const currentTab = ref('map_record')

const handleTabClick = (key: string) => {
  const previousTab = currentTab.value
  currentTab.value = key
  
  // 如果离开导航标签，清理点云图状态
  if (previousTab === 'nav' && key !== 'nav') {
    cleanupNavPointCloud()
  }
  
  // 当切换到导航标签时，初始化点云图
  if (key === 'nav') {
    nextTick(() => {
      initNavPointCloud()
    })
  }
}

// 清理导航点云图状态
const cleanupNavPointCloud = () => {
  console.log('清理点云图状态')
  navPointCloudInitialized = false
  if (navResizeObserver) {
    navResizeObserver.disconnect()
    navResizeObserver = null
  }
}

// 筛选
const filter = ref<{ keyword: string }>({ keyword: '' })

const handleSearch = () => {
  console.log('搜索:', filter.value.keyword)
  // TODO: 实现搜索逻辑
}

// 导航相关状态
const selectedNavMap = ref('电厂巡检地图')
const taskSpeed = ref(1.0)
const navData = ref({
  w: 0,
  v: '0, 0',
  x: 0,
  y: 0,
  theta: 0,
  brake: 0,
  lidar: '未收到',
  imu: '未收到',
  satellite: '未收到',
  msfStatus: '未开启'
})

// 导航相关方法
const handleStartNav = () => {
  console.log('开始导航')
  // TODO: 调用开始导航API
}

const handlePauseNav = () => {
  console.log('暂停导航')
  // TODO: 调用暂停导航API
}

const handleResumeNav = () => {
  console.log('暂停恢复')
  // TODO: 调用恢复导航API
}

const handleStartINS = () => {
  console.log('开始INS')
  // TODO: 调用开始INS API
}

const handleInitINS = () => {
  console.log('INS初始化')
  // TODO: 调用INS初始化API
}

const handleStartMSF = () => {
  console.log('开始MSF')
  // TODO: 调用开始MSF API
}

const handleCircleMode = () => {
  console.log('循迹随停循')
  // TODO: 调用循迹模式API
}

const handleCloseGPS = () => {
  console.log('关闭GPS')
  // TODO: 调用关闭GPS API
}

const handleSetOrigin = () => {
  console.log('原点设置')
  // TODO: 调用原点设置API
}

const decreaseSpeed = () => {
  if (taskSpeed.value > 0.1) {
    taskSpeed.value = Math.round((taskSpeed.value - 0.1) * 10) / 10
  }
}

const increaseSpeed = () => {
  if (taskSpeed.value < 5.0) {
    taskSpeed.value = Math.round((taskSpeed.value + 0.1) * 10) / 10
  }
}

// 导航点云图相关
type PointCloudPoint = { x: number; y: number; z: number; intensity: number }
type RawPointCloudPoint = { x: number; y: number; z?: number; intensityValue?: number }
type PcdHeaderInfo = {
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

const tinymapPcdUrl = new URL('../../tinyMap.pcd', import.meta.url).href
const navPointCloudCanvas = ref<HTMLCanvasElement | null>(null)
const navPointCloudData = ref<PointCloudPoint[]>([])
const navPointCloudLoading = ref(false)
const navPointCloudError = ref('')
const navPointCloudScale = ref(1.5)
const navPointCloudRotationX = ref(-(20 * Math.PI) / 180)
const navPointCloudRotationY = ref(0)
const navPointCloudPanX = ref(0)
const navPointCloudPanY = ref(0)
let navPointCloudFrameRequested = false
let isNavPointCloudDragging = false
let lastNavPointerX = 0
let lastNavPointerY = 0
let navPointCloudDragMode: 'rotate' | 'pan' | null = null

const scheduleNavPointCloudRender = () => {
  if (navPointCloudFrameRequested) return
  navPointCloudFrameRequested = true
  requestAnimationFrame(() => {
    navPointCloudFrameRequested = false
    drawNavPointCloud()
  })
}

const drawNavPointCloud = () => {
  const canvas = navPointCloudCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  
  // 如果容器尺寸过小，说明还没有完全渲染，延迟绘制
  if (rect.width < 100 || rect.height < 100) {
    console.log('容器尺寸过小，延迟渲染:', rect.width, rect.height)
    return
  }

  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  if ((ctx as any).resetTransform) {
    ;(ctx as any).resetTransform()
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#020915'
  ctx.fillRect(0, 0, rect.width, rect.height)

  const yaw = navPointCloudRotationY.value
  const pitch = navPointCloudRotationX.value
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const cosPitch = Math.cos(pitch)
  const sinPitch = Math.sin(pitch)
  const baseScale = Math.min(rect.width, rect.height) * 0.8 * navPointCloudScale.value
  const panOffsetX = navPointCloudPanX.value * rect.width
  const panOffsetY = navPointCloudPanY.value * rect.height
  const cameraDistance = 2.2
  const depthScale = 1.4

  navPointCloudData.value.forEach(point => {
    const centeredX = point.x
    const centeredY = -point.z
    const centeredZ = point.y

    const xzRotatedX = centeredX * cosYaw + centeredZ * sinYaw
    const xzRotatedZ = -centeredX * sinYaw + centeredZ * cosYaw

    const yRotatedY = centeredY * cosPitch - xzRotatedZ * sinPitch
    const yRotatedZ = centeredY * sinPitch + xzRotatedZ * cosPitch

    const perspectiveZ = yRotatedZ * depthScale
    const perspective = cameraDistance / (cameraDistance - perspectiveZ)
    const projectedX = xzRotatedX * baseScale * perspective + rect.width / 2 + panOffsetX
    const projectedY = yRotatedY * baseScale * perspective + rect.height / 2 + panOffsetY

    if (projectedX < -100 || projectedX > rect.width + 100 || projectedY < -100 || projectedY > rect.height + 100) {
      return
    }

    const radius = (1.2 + point.intensity * 2) * perspective * 0.5
    const red = Math.floor(40 + point.intensity * 200)
    const green = Math.floor(120 + point.intensity * 100)
    const blue = 255
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.35 + point.intensity * 0.4})`
    ctx.beginPath()
    ctx.arc(projectedX, projectedY, radius, 0, Math.PI * 2)
    ctx.fill()
  })
}

const handleNavPointCloudWheel = (e: WheelEvent) => {
  const direction = e.deltaY < 0 ? 1 : -1
  const MIN_SCALE = 0.01
  const MAX_SCALE = 50
  navPointCloudScale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, navPointCloudScale.value + direction * 0.1))
  scheduleNavPointCloudRender()
}

const handleNavPointCloudPointerDown = (e: PointerEvent) => {
  e.preventDefault()
  if (isNavPointCloudDragging) return
  
  isNavPointCloudDragging = true
  lastNavPointerX = e.clientX
  lastNavPointerY = e.clientY
  
  const shouldPan = e.button === 2 || (e.button === 0 && e.ctrlKey)
  navPointCloudDragMode = shouldPan ? 'pan' : 'rotate'

  const handlePointerMove = (e: PointerEvent) => {
    if (!isNavPointCloudDragging) return
    
    const deltaX = e.clientX - lastNavPointerX
    const deltaY = e.clientY - lastNavPointerY
    lastNavPointerX = e.clientX
    lastNavPointerY = e.clientY

    if (navPointCloudDragMode === 'pan') {
      const canvas = navPointCloudCanvas.value
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      navPointCloudPanX.value += deltaX / rect.width
      navPointCloudPanY.value += deltaY / rect.height
    } else {
      navPointCloudRotationY.value += deltaX * 0.005
      const nextPitch = navPointCloudRotationX.value - deltaY * 0.005
      const clampPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, nextPitch))
      navPointCloudRotationX.value = clampPitch
    }
    scheduleNavPointCloudRender()
  }

  const handlePointerUp = () => {
    isNavPointCloudDragging = false
    navPointCloudDragMode = null
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerUp)
  }

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointercancel', handlePointerUp)
}

const handleNavPointCloudKeydown = (e: KeyboardEvent) => {
  if (e.key === 'r' || e.key === 'R') {
    navPointCloudScale.value = 1
    navPointCloudRotationX.value = -(20 * Math.PI) / 180
    navPointCloudRotationY.value = 0
    navPointCloudPanX.value = 0
    navPointCloudPanY.value = 0
    scheduleNavPointCloudRender()
  }
}

// 生成模拟点云数据
const generateMockNavPointCloud = (count = 800): PointCloudPoint[] => {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    intensity: Math.random()
  }))
}

// 点云数据归一化
const normalizeNavPointCloud = (rawPoints: RawPointCloudPoint[]): PointCloudPoint[] => {
  if (!rawPoints.length) return []

  const xs = rawPoints.map(p => p.x)
  const ys = rawPoints.map(p => p.y)
  const zs = rawPoints.map(p => p.z ?? 0)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  const rangeX = maxX - minX
  const rangeY = maxY - minY
  const rangeZ = maxZ - minZ
  const maxRange = Math.max(rangeX, rangeY, rangeZ, 1e-6)

  const centerX = (maxX + minX) / 2
  const centerY = (maxY + minY) / 2
  const centerZ = (maxZ + minZ) / 2

  const intensityValues = rawPoints
    .map(p => (p.intensityValue !== undefined && Number.isFinite(p.intensityValue) ? p.intensityValue : undefined))
    .filter((val): val is number => typeof val === 'number')
  const minIntensity = intensityValues.length ? Math.min(...intensityValues) : 0
  const maxIntensity = intensityValues.length ? Math.max(...intensityValues) : 1
  const intensityRange = maxIntensity - minIntensity || 1

  return rawPoints.map(point => {
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
}

// 解析PCD文件
const parseNavPcdBuffer = (buffer: ArrayBuffer): PointCloudPoint[] => {
  const decoder = new TextDecoder('utf-8')
  let headerEndIndex = 0
  const maxHeaderSize = Math.min(2048, buffer.byteLength)
  const headerChunk = decoder.decode(buffer.slice(0, maxHeaderSize))
  const headerEndMarker = '\nDATA '
  const headerEndPos = headerChunk.indexOf(headerEndMarker)

  if (headerEndPos === -1) {
    console.warn('未找到PCD头部结束标记，尝试解析前1024字节作为header')
    headerEndIndex = 1024
  } else {
    const dataLineStart = headerEndPos + headerEndMarker.length
    const dataLineEnd = headerChunk.indexOf('\n', dataLineStart)
    headerEndIndex = dataLineEnd !== -1 ? dataLineEnd + 1 : dataLineStart + 10
  }

  const headerBytes = buffer.slice(0, headerEndIndex)
  const headerText = decoder.decode(headerBytes)
  const lines = headerText.split('\n').map(l => l.trim()).filter(Boolean)

  const headerInfo: PcdHeaderInfo = {
    fields: [],
    size: [],
    type: [],
    count: [],
    points: 0,
    width: 0,
    height: 0,
    dataType: 'ascii',
    dataStartIndex: headerEndIndex
  }

  for (const line of lines) {
    const [key, ...values] = line.split(/\s+/)
    if (key === 'FIELDS') headerInfo.fields = values
    else if (key === 'SIZE') headerInfo.size = values.map(Number)
    else if (key === 'TYPE') headerInfo.type = values
    else if (key === 'COUNT') headerInfo.count = values.map(Number)
    else if (key === 'POINTS') headerInfo.points = parseInt(values[0], 10) || 0
    else if (key === 'WIDTH') headerInfo.width = parseInt(values[0], 10) || 0
    else if (key === 'HEIGHT') headerInfo.height = parseInt(values[0], 10) || 0
    else if (key === 'DATA') headerInfo.dataType = values[0]?.toLowerCase() || 'ascii'
  }

  if (headerInfo.dataType === 'ascii') {
    const dataText = decoder.decode(buffer.slice(headerEndIndex))
    const dataLines = dataText.split('\n').map(l => l.trim()).filter(Boolean)
    const rawPoints: RawPointCloudPoint[] = []

    for (const line of dataLines) {
      const vals = line.split(/\s+/).map(Number)
      if (vals.length < headerInfo.fields.length) continue
      const point: RawPointCloudPoint = { x: 0, y: 0 }
      headerInfo.fields.forEach((field, i) => {
        const val = vals[i]
        if (!Number.isFinite(val)) return
        if (field === 'x') point.x = val
        else if (field === 'y') point.y = val
        else if (field === 'z') point.z = val
        else if (field === 'intensity') point.intensityValue = val
      })
      rawPoints.push(point)
    }
    return normalizeNavPointCloud(rawPoints)
  }

  const counts = headerInfo.count.length ? headerInfo.count : headerInfo.fields.map(() => 1)
  const stride = headerInfo.size.reduce((sum, size, i) => sum + size * counts[i], 0)
  const bytesAvailable = buffer.byteLength - headerInfo.dataStartIndex
  const pointsToRead = Math.min(headerInfo.points || 0, Math.floor(bytesAvailable / stride))

  const readBinaryValue = (view: DataView, offset: number, type: string, size: number): number => {
    if (type === 'F') return size === 4 ? view.getFloat32(offset, true) : view.getFloat64(offset, true)
    if (type === 'I') {
      if (size === 1) return view.getInt8(offset)
      if (size === 2) return view.getInt16(offset, true)
      if (size === 4) return view.getInt32(offset, true)
    }
    if (type === 'U') {
      if (size === 1) return view.getUint8(offset)
      if (size === 2) return view.getUint16(offset, true)
      if (size === 4) return view.getUint32(offset, true)
    }
    return 0
  }

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
        if (valueOffset + size > bytesAvailable) {
          truncated = true
          break
        }

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

  return normalizeNavPointCloud(rawPoints)
}

// 刷新点云数据
const refreshNavPointCloud = async () => {
  navPointCloudLoading.value = true
  navPointCloudError.value = ''
  console.log('开始加载导航点云数据，URL:', tinymapPcdUrl)
  try {
    const response = await fetch(tinymapPcdUrl)
    if (!response.ok) {
      throw new Error('PCD 文件加载失败')
    }
    const buffer = await response.arrayBuffer()
    console.log('PCD文件已加载，大小:', buffer.byteLength, 'bytes')
    const parsedPoints = parseNavPcdBuffer(buffer)
    console.log('解析点云数据，点数:', parsedPoints.length)
    
    if (parsedPoints.length > 0) {
      navPointCloudData.value = parsedPoints
    } else {
      console.warn('未解析到点云数据，使用模拟数据')
      navPointCloudData.value = generateMockNavPointCloud()
    }
    
    // 等待数据设置完成后渲染
    await nextTick()
    scheduleNavPointCloudRender()
  } catch (error) {
    console.error('点云数据加载失败:', error)
    navPointCloudError.value = '点云数据加载失败'
    navPointCloudData.value = generateMockNavPointCloud()
    await nextTick()
    scheduleNavPointCloudRender()
  } finally {
    navPointCloudLoading.value = false
  }
}

// 初始化导航点云图
const initNavPointCloud = async () => {
  // 如果已经初始化且 Canvas 仍然存在，只需要重新渲染
  if (navPointCloudInitialized && navPointCloudCanvas.value && navResizeObserver) {
    console.log('点云图已初始化，重新渲染')
    forceInitialRender()
    return
  }
  
  if (!navPointCloudCanvas.value) {
    console.warn('导航点云图Canvas未找到')
    return
  }
  
  console.log('导航点云图Canvas已就绪，开始初始化')
  
  // 清理旧的 ResizeObserver
  if (navResizeObserver) {
    navResizeObserver.disconnect()
    navResizeObserver = null
  }
  
  navPointCloudInitialized = true
  
  // 先加载数据（如果还没有数据）
  if (navPointCloudData.value.length === 0) {
    await refreshNavPointCloud()
  }
  
  // 使用 ResizeObserver 监听容器尺寸变化，确保在容器尺寸稳定后渲染
  // 这样可以解决初始加载时容器尺寸为0或很小的问题
  if (navResizeObserver) {
    navResizeObserver.disconnect()
  }
  
  navResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      // 只有当容器有足够大的尺寸时才进行渲染
      if (width > 100 && height > 100) {
        console.log('容器尺寸变化，触发渲染:', width, height)
        scheduleNavPointCloudRender()
      }
    }
  })
  
  navResizeObserver.observe(navPointCloudCanvas.value)
  
  // 强制触发一次布局检查和渲染
  forceInitialRender()
}

// 强制初始渲染，等待容器尺寸稳定
const forceInitialRender = () => {
  let attempts = 0
  const maxAttempts = 10
  
  const tryRender = () => {
    const canvas = navPointCloudCanvas.value
    if (!canvas) return
    
    const parent = canvas.parentElement
    const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect()
    attempts++
    
    if (rect.width > 100 && rect.height > 100) {
      console.log('初始渲染成功，容器尺寸:', rect.width, rect.height)
      scheduleNavPointCloudRender()
    } else if (attempts < maxAttempts) {
      // 容器尺寸还不够，继续等待
      requestAnimationFrame(tryRender)
    } else {
      console.warn('初始渲染尝试次数已达上限，强制渲染')
      scheduleNavPointCloudRender()
    }
  }
  
  requestAnimationFrame(tryRender)
}

onMounted(async () => {
  await nextTick()
  
  // 如果默认就是导航标签，则初始化
  if (currentTab.value === 'nav') {
    await nextTick()
    initNavPointCloud()
  }
})

// 录包建图相关状态
const isRecording = ref(false)
const mapProgress = ref(0)

// 录包建图相关方法
const handleStartRecording = () => {
  isRecording.value = true
  console.log('开始录包')
  // TODO: 调用开始录包API
}

const handleStopRecording = () => {
  isRecording.value = false
  console.log('完成录制')
  // TODO: 调用完成录制API
}

const handleGenerateMap = () => {
  console.log('生成地图')
  // TODO: 调用生成地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleGenerateGridMap = () => {
  console.log('生成栅格地图')
  // TODO: 调用生成栅格地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleCreateFusionMap = () => {
  console.log('新建融合地图')
  // TODO: 调用新建融合地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleStopMapping = () => {
  console.log('终止建图')
  mapProgress.value = 0
  // TODO: 调用终止建图API
}

// 地图编辑相关状态
const selectedEditMap = ref('FA0625')
const gridMapCanvas = ref<HTMLCanvasElement | null>(null)
const gridMapLoading = ref(false)
const gridMapError = ref('')
const isEditMode = ref(false)
const navMode = ref<'pan' | 'edit'>('pan')
const activeTool = ref<'pen' | 'eraser'>('pen')
const brushSize = ref(5)
const editHistory = ref<ImageData[]>([])
const canUndo = computed(() => editHistory.value.length > 0)

let gridImageData: ImageData | null = null
let missionGridImageData: ImageData | null = null
let currentScale = 1
let currentOffsetX = 0
let currentOffsetY = 0
let isDragging = false
let lastX = 0
let lastY = 0
let drawing = false
let editLastX = 0
let editLastY = 0

// 编辑模式切换
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    navMode.value = 'pan'
  }
  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = isEditMode.value ? 'crosshair' : 'grab'
  }
}

// 获取橡皮擦光标样式
const getEraserCursor = () => {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23ff6b6b' stroke='%23333' stroke-width='1.5' d='M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0'/%3E%3Cpath fill='white' stroke='%23333' stroke-width='1' d='M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-6.36-6.36z'/%3E%3C/svg%3E") 12 12, auto`
}

// 设置导航模式
const setNavMode = (mode: 'pan' | 'edit') => {
  navMode.value = mode
  const canvas = gridMapCanvas.value
  if (canvas) {
    if (mode === 'pan') {
      canvas.style.cursor = 'grab'
    } else {
      // 编辑模式下根据当前工具设置光标
      canvas.style.cursor = activeTool.value === 'pen' ? 'crosshair' : getEraserCursor()
    }
  }
}

// 设置工具
const setTool = (tool: 'pen' | 'eraser') => {
  activeTool.value = tool
  navMode.value = 'edit'
  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = tool === 'pen' ? 'crosshair' : getEraserCursor()
  }
}

// 缩放和导航方法
const zoomIn = () => {
  currentScale = Math.min(5, currentScale * 1.2)
  applyTransform()
}

const zoomOut = () => {
  currentScale = Math.max(0.2, currentScale / 1.2)
  applyTransform()
}

const resetZoom = () => {
  currentScale = 1
  currentOffsetX = 0
  currentOffsetY = 0
  applyTransform()
}

const applyTransform = () => {
  const canvas = gridMapCanvas.value
  if (!canvas) return
  const parent = canvas.parentElement as HTMLElement
  if (!parent) return
  
  const sw = parent.clientWidth
  const sh = parent.clientHeight
  const baseScale = Math.min(sw / canvas.width, sh / canvas.height)
  const finalScale = baseScale * currentScale
  
  canvas.style.width = `${Math.floor(canvas.width * finalScale)}px`
  canvas.style.height = `${Math.floor(canvas.height * finalScale)}px`
  
  const centerX = (sw - canvas.width * finalScale) / 2 + currentOffsetX
  const centerY = (sh - canvas.height * finalScale) / 2 + currentOffsetY
  
  canvas.style.transform = `translate(${centerX}px, ${centerY}px)`
}

// 获取canvas坐标
const getCanvasCoords = (e: MouseEvent) => {
  const canvas = gridMapCanvas.value
  if (!canvas) return { x: 0, y: 0 }
  
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  return {
    x: Math.floor((e.clientX - rect.left) * scaleX),
    y: Math.floor((e.clientY - rect.top) * scaleY)
  }
}

// 编辑像素
const editGridPixel = (x: number, y: number) => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  
  if (!gridImageData) {
    if (missionGridImageData) {
      gridImageData = ctx.createImageData(missionGridImageData.width, missionGridImageData.height)
      gridImageData.data.set(missionGridImageData.data)
    } else {
      gridImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }
  }
  
  const radius = Math.floor(brushSize.value / 2)
  const color = activeTool.value === 'pen' ? [0, 0, 0, 255] : [255, 255, 255, 255]
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = x + dx
      const py = y + dy
      
      if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= radius) {
          const index = (py * canvas.width + px) * 4
          gridImageData.data[index] = color[0]
          gridImageData.data[index + 1] = color[1]
          gridImageData.data[index + 2] = color[2]
          gridImageData.data[index + 3] = color[3]
        }
      }
    }
  }
  
  ctx.putImageData(gridImageData, 0, 0)
}

// 画线
const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  
  let x = x0
  let y = y0
  
  while (true) {
    editGridPixel(x, y)
    
    if (x === x1 && y === y1) break
    
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
}

// 保存历史记录
const saveToHistory = () => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  
  const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  editHistory.value.push(currentData)
  
  // 限制历史记录数量
  if (editHistory.value.length > 20) {
    editHistory.value.shift()
  }
}

// 撤销编辑
const undoEdit = () => {
  if (editHistory.value.length === 0) return
  
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  
  const lastState = editHistory.value.pop()
  if (lastState) {
    ctx.putImageData(lastState, 0, 0)
    gridImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }
}

// 清除编辑
const clearGridEdit = () => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !missionGridImageData) return
  
  ctx.putImageData(missionGridImageData, 0, 0)
  gridImageData = null
  editHistory.value = []
}

// 将ImageData转换为PGM格式
const convertImageDataToPGM = (imageData: ImageData): Uint8Array => {
  const width = imageData.width
  const height = imageData.height
  
  // 构建PGM文件头
  const header = `P5\n${width} ${height}\n255\n`
  const headerBytes = new TextEncoder().encode(header)
  
  // 创建像素数据数组（灰度值）
  const pixels = new Uint8Array(width * height)
  
  // 从ImageData提取灰度值
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    // 使用R通道的值（因为是黑白图，RGB值相同）
    pixels[i] = imageData.data[idx]
  }
  
  // 合并头部和像素数据
  const pgmData = new Uint8Array(headerBytes.length + pixels.length)
  pgmData.set(headerBytes, 0)
  pgmData.set(pixels, headerBytes.length)
  
  return pgmData
}

// 保存编辑后的地图
const handleSaveGridMap = async () => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) {
    console.error('Canvas未找到')
    return
  }
  
  // 获取当前编辑后的图像数据
  const currentImageData = gridImageData || missionGridImageData
  if (!currentImageData) {
    console.error('没有可保存的地图数据')
    showErrorMessage('没有可保存的地图数据')
    return
  }
  
  // 使用自定义对话框进行二次确认
  showConfirmDialog({
    title: '确认保存地图',
    message: `确认要保存编辑后的地图吗？\n\n地图名称：${selectedEditMap.value}\n\n保存后将覆盖服务器上的原始地图文件。`,
    confirmText: '确认保存',
    cancelText: '取消',
    type: 'warning',
    onConfirm: async () => {
      try {
        // 将ImageData转换为PGM格式
        const pgmData = convertImageDataToPGM(currentImageData)
        
        // TODO: 这里对接上传接口
        console.log('准备上传PGM文件:', {
          mapName: selectedEditMap.value,
          dataSize: pgmData.length,
          width: currentImageData.width,
          height: currentImageData.height
        })
        
        // 示例：上传到服务器
        // const formData = new FormData()
        // const blob = new Blob([pgmData], { type: 'application/octet-stream' })
        // formData.append('file', blob, `${selectedEditMap.value}.pgm`)
        // formData.append('mapName', selectedEditMap.value)
        
        // const response = await fetch('/api/upload-map', {
        //   method: 'POST',
        //   body: formData
        // })
        
        // if (response.ok) {
        //   showSuccessMessage('地图保存成功！')
        //   console.log('地图上传成功')
        // } else {
        //   throw new Error('上传失败')
        // }
        
        // 临时提示（等接口对接后删除）
        showSuccessMessage('地图数据已准备好，等待接口对接后上传')
        console.log('PGM数据已生成，大小:', pgmData.length, 'bytes')
        
      } catch (error) {
        console.error('保存地图失败:', error)
        showErrorMessage('保存地图失败，请重试')
      }
    },
    onCancel: () => {
      console.log('用户取消保存')
    }
  })
}

// 加载并渲染PGM文件
const loadAndRenderGridMap = async () => {
  try {
    gridMapLoading.value = true
    gridMapError.value = ''
    
    await nextTick()
    
    const canvas = gridMapCanvas.value
    if (!canvas) {
      console.warn('Canvas element not found')
      gridMapLoading.value = false
      return
    }
    
    // 加载PGM文件
    const url = new URL('../../public/gridMap.pgm', import.meta.url).href
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('无法加载地图文件')
    }
    
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // 解析PGM头部
    let header = ''
    let i = 0
    let newlines = 0
    while (i < bytes.length && newlines < 3) {
      const ch = String.fromCharCode(bytes[i++])
      header += ch
      if (ch === '\n') newlines++
    }
    
    const headerClean = header.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n')
    const parts = headerClean.split(/\s+/).filter(Boolean)
    const magic = parts[0]
    const width = parseInt(parts[1])
    const height = parseInt(parts[2])
    const maxVal = parseInt(parts[3]) || 255
    const pixelStart = i
    
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.createImageData(width, height)
    
    // 解析图像数据
    if (magic === 'P5') {
      // 二进制格式
      const bytesPerSample = maxVal > 255 ? 2 : 1
      let p = pixelStart
      for (let idx = 0; idx < width * height; idx++) {
        let v = 0
        if (bytesPerSample === 1) {
          v = bytes[p++]
        } else {
          v = (bytes[p] << 8) | bytes[p + 1]
          p += 2
        }
        const c = Math.max(0, Math.min(255, Math.round((v / maxVal) * 255)))
        const off = idx * 4
        imageData.data[off] = c
        imageData.data[off + 1] = c
        imageData.data[off + 2] = c
        imageData.data[off + 3] = 255
      }
    } else {
      // ASCII格式
      const text = new TextDecoder().decode(bytes)
      const tokens = text.replace(/#.*\n/g, '').trim().split(/\s+/)
      const pixelTokens = tokens.slice(4)
      for (let idx = 0; idx < width * height; idx++) {
        const v = parseInt(pixelTokens[idx] || `${maxVal}`)
        const c = Math.max(0, Math.min(255, Math.round((v / maxVal) * 255)))
        const off = idx * 4
        imageData.data[off] = c
        imageData.data[off + 1] = c
        imageData.data[off + 2] = c
        imageData.data[off + 3] = 255
      }
    }
    
    // 黑白映射
    for (let k = 0; k < imageData.data.length; k += 4) {
      const g = imageData.data[k]
      if (g < 128) {
        imageData.data[k] = 0
        imageData.data[k + 1] = 0
        imageData.data[k + 2] = 0
      } else {
        imageData.data[k] = 255
        imageData.data[k + 1] = 255
        imageData.data[k + 2] = 255
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    // 保存原始图像数据
    missionGridImageData = ctx.createImageData(width, height)
    missionGridImageData.data.set(imageData.data)
    
    // 重置编辑数据
    gridImageData = null
    
    // 重置缩放和偏移
    currentScale = 1
    currentOffsetX = 0
    currentOffsetY = 0
    
    // 应用居中变换
    applyTransform()
    
    // 添加鼠标事件监听
    setupCanvasEvents()
    
    gridMapLoading.value = false
  } catch (error) {
    console.error('加载地图失败:', error)
    gridMapError.value = '加载地图失败，请检查文件是否存在'
    gridMapLoading.value = false
  }
}

// 设置Canvas事件
const setupCanvasEvents = () => {
  const canvas = gridMapCanvas.value
  if (!canvas) return
  
  // 鼠标滚轮事件
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    currentScale = Math.max(0.2, Math.min(5, currentScale * delta))
    applyTransform()
  }
  
  // 鼠标按下事件
  const onMouseDown = (e: MouseEvent) => {
    // 编辑模式下且为编辑导航模式的左键编辑
    if (isEditMode.value && navMode.value === 'edit' && e.button === 0 && !e.ctrlKey) {
      if (!drawing) {
        saveToHistory()
      }
      drawing = true
      const coords = getCanvasCoords(e)
      editLastX = coords.x
      editLastY = coords.y
      editGridPixel(coords.x, coords.y)
      e.preventDefault()
      return
    }
    
    // 拖动：拖动模式、右键、Ctrl+左键、或非编辑模式的左键
    if (navMode.value === 'pan' || e.button === 2 || e.ctrlKey || !isEditMode.value) {
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
      canvas.style.cursor = 'grabbing'
      e.preventDefault()
    }
  }
  
  // 鼠标移动事件
  const onMouseMove = (e: MouseEvent) => {
    // 处理编辑绘制
    if (drawing && isEditMode.value) {
      const coords = getCanvasCoords(e)
      drawLine(editLastX, editLastY, coords.x, coords.y)
      editLastX = coords.x
      editLastY = coords.y
      return
    }
    
    // 处理拖动
    if (isDragging) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      currentOffsetX += dx
      currentOffsetY += dy
      applyTransform()
      lastX = e.clientX
      lastY = e.clientY
    }
  }
  
  // 鼠标松开事件
  const endDrag = () => {
    isDragging = false
    drawing = false
    if (isEditMode.value) {
      // 编辑模式下根据当前工具恢复光标
      canvas.style.cursor = activeTool.value === 'pen' ? 'crosshair' : getEraserCursor()
    } else {
      canvas.style.cursor = 'grab'
    }
  }
  
  // 添加事件监听
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', endDrag)
  canvas.addEventListener('mouseleave', endDrag)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault())
}

// 监听tab切换，加载地图
watch(currentTab, async (newTab) => {
  if (newTab === 'map_edit') {
    await nextTick()
    loadAndRenderGridMap()
  }
})

// 文件管理示例数据
const fileList = ref([
  {
    id: 'F001',
    name: '地图文件_001.map',
    type: 'MAP',
    size: '15.6 MB',
    createTime: '2024-12-20 10:30:00',
    status: '正常'
  },
  {
    id: 'F002',
    name: '路径数据_002.path',
    type: 'PATH',
    size: '2.3 MB',
    createTime: '2024-12-21 14:20:00',
    status: '正常'
  },
  {
    id: 'F003',
    name: '配置文件_003.cfg',
    type: 'CONFIG',
    size: '128 KB',
    createTime: '2024-12-22 09:15:00',
    status: '正常'
  },
  {
    id: 'F004',
    name: '日志文件_004.log',
    type: 'LOG',
    size: '5.8 MB',
    createTime: '2024-12-23 16:45:00',
    status: '正常'
  }
])

const handleAdd = () => {
  console.log('添加操作')
  // TODO: 根据currentTab实现对应的添加逻辑
}

const handleDelete = (id: string) => {
  console.log('删除:', id)
  // TODO: 实现删除逻辑
}
</script>

<style scoped>
@import './mission-common.css';

.nav-top-card {
  margin-bottom: 4px;
  background: linear-gradient(135deg, #0a2a3a 80%, #0a0f1c 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px #0003;
  padding: 18px 24px 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-top-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.nav-top-title {
  font-size: 16px;
  color: #67d5fd;
  font-weight: 600;
}

.nav-top-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 4px;
  flex-wrap: wrap;
  overflow-x: visible;
}

.nav-input {
  height: 32px;
  border-radius: 4px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
  min-width: 120px;
  max-width: 180px;
  flex-shrink: 0;
}

.nav-input:focus {
  outline: none;
  border: 1.5px solid #16bbf2;
  box-shadow: 0 0 0 2px rgba(22,187,242,0.15);
}

.nav-btn {
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  padding: 4px 18px;
  cursor: pointer;
  border: none;
  transition: background 0.2s, color 0.2s, border 0.2s;
  height: 32px;
  margin-left: 4px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  background: #0c3c56;
  color: #67d5fd;
  border: 1px solid rgba(38, 131, 182, 0.8);
}

.nav-btn:hover {
  background: #0c4666;
  color: #67d5fd;
}

.nav-btn-add {
  margin-left: 4px;
}

.nav-content-wrapper {
  background: linear-gradient(135deg, #0a2a3a 80%, #0a0f1c 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px #0003;
  padding: 16px 32px 24px 32px;
  margin-bottom: 20px;
  min-height: 520px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.nav-page-content {
  padding-right: 20px;
}

.nav-card-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  margin-top: 0;
}

.nav-card {
  width: 100%;
  max-width: 400px;
  background: rgba(128, 128, 128, 0.12);
  border-radius: 8px;
  box-shadow: 0 2px 8px #0003;
  padding: 0 0 14px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: box-shadow 0.2s;
  justify-self: center;
}

.nav-card:hover {
  box-shadow: 0 4px 12px rgba(103, 213, 253, 0.2);
}

.nav-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  padding: 0 20px 0 24px;
  min-height: 38px;
  background: rgba(217, 217, 217, 0.10);
  border-radius: 8px 8px 0 0;
  height: 44px;
}

.nav-card-title {
  color: #FFF;
  font-family: Inter, 'Microsoft YaHei', Arial, sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  letter-spacing: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-card-delete {
  color: #ff4d4f;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  transition: filter 0.2s;
  height: 44px;
  padding-left: 12px;
}

.nav-card-delete img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: none;
  transition: filter 0.2s;
  display: block;
  margin: auto 0;
  color: #ff4d4f;
}

.nav-card-delete:hover img {
  filter: drop-shadow(0 0 4px #ff4d4f);
}

.nav-card-body {
  display: flex;
  align-items: center;
  padding: 20px 24px;
}

.nav-card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #d4edfd;
  font-size: 12px;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.info-row {
  display: flex;
  gap: 8px;
  align-items: center;
  line-height: 1.7;
}

.info-label {
  color: #b8c7d9;
  min-width: 80px;
  font-weight: 500;
  text-align: right;
  font-size: 12px;
  line-height: 1.7;
}

.info-value {
  color: #fff;
  font-weight: 400;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.7;
}

.settings-content {
  padding: 40px 20px;
  text-align: center;
}

/* 录包建图样式 */
.map-section {
  background: rgba(10, 42, 58, 0.6);
  border-radius: 8px;
  padding: 0 20px 5px;
  margin-bottom: 16px;
}

/* 导航页的按钮区不需要背景和内边距 */
.nav-content-wrapper > .map-section {
  background: transparent;
  padding: 0;
  margin-bottom: 12px;
}

.map-section-title {
  font-size: 16px;
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 20px;
}

.map-section-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.map-btn {
  padding: 0 36px;
  height: 40px;
  line-height: 40px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid rgba(38, 131, 182, 0.4);
  transition: all 0.3s;
  min-width: 140px;
  text-align: center;
  white-space: nowrap;
  font-weight: 500;
}

.map-btn-primary {
  background: #0c3c56;
  color: #67d5fd;
}

.map-btn-primary:hover:not(:disabled) {
  background: #0c4666;
  border-color: rgba(103, 213, 253, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(103, 213, 253, 0.2);
}

.map-btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.map-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-btn-secondary {
  background: #0c3c56;
  color: #67d5fd;
  border-color: rgba(38, 131, 182, 0.4);
}

.map-btn-secondary:hover:not(:disabled) {
  background: #0c4666;
  border-color: rgba(103, 213, 253, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(103, 213, 253, 0.2);
}

.map-btn-secondary:active:not(:disabled) {
  transform: translateY(0);
}

.map-btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-btn-stop {
  background: #561c1c;
  border: 1px solid rgba(182, 38, 38, 0.4);
  color: #fd6767;
  min-width: 80px;
}

.map-btn-stop:hover:not(:disabled) {
  background: #6c2323;
  border-color: rgba(253, 103, 103, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(253, 103, 103, 0.2);
}

.map-btn-stop:active:not(:disabled) {
  transform: translateY(0);
}

.map-btn-stop:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-progress-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.map-progress-header .map-section-title {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-progress-percent {
  font-size: 24px;
  color: #67d5fd;
  font-weight: 600;
  font-family: 'Arial', sans-serif;
  letter-spacing: 1px;
}

.map-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.map-progress-bar {
  flex: 1;
  height: 20px;
  background: rgba(12, 60, 86, 0.3);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(103, 213, 253, 0.2);
  min-width: 600px;
}

.map-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a6b9e 0%, #67d5fd 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.5);
}

/* 导航页样式 */
.nav-button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-main-content {
  display: flex;
  gap: 16px;
  margin-top: 0;
  height: calc(100vh - 260px);
  min-height: 500px;
}

.nav-info-panel {
  width: 260px;
  background: rgba(10, 42, 58, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  overflow-y: auto;
  /* 高度和点云图一致 */
  height: calc(100vh - 280px);
  min-height: 400px;
  box-sizing: border-box;
}

.nav-info-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

.nav-select {
  width: 100%;
  height: 36px;
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.4);
  border-radius: 4px;
  color: #67d5fd;
  font-size: 14px;
  padding: 0 12px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s;
}

.nav-select:hover {
  border-color: rgba(103, 213, 253, 0.8);
}

.nav-select option {
  background: #0c3c56;
  color: #67d5fd;
}

.nav-speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-speed-btn {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #0c3c56 0%, #0a2f44 100%);
  border: 1px solid rgba(38, 131, 182, 0.6);
  border-radius: 6px;
  color: #67d5fd;
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.nav-speed-btn:hover {
  background: linear-gradient(135deg, #0c4666 0%, #0c3856 100%);
  border-color: rgba(103, 213, 253, 0.9);
  box-shadow: 0 4px 12px rgba(103, 213, 253, 0.3);
  transform: translateY(-1px);
}

.nav-speed-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.nav-speed-input {
  width: 110px;
  height: 40px;
  background: rgba(12, 60, 86, 0.5);
  border: 1px solid rgba(38, 131, 182, 0.4);
  border-radius: 6px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  outline: none;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.nav-info-row {
  display: flex;
  gap: 16px;
}

.nav-info-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-info-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
}

.nav-info-value {
  font-size: 14px;
  color: #67d5fd;
  font-weight: 500;
}

.nav-map-container {
  flex: 1;
  background: rgba(10, 42, 58, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 固定高度，避免缩放动画 */
  height: calc(100vh - 280px);
  min-height: 400px;
}

.nav-map-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* 点云图样式 */
.pointcloud-wrapper {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
}

.pointcloud-view {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(circle at 20% 20%, rgba(89, 192, 252, 0.2), transparent 45%),
              radial-gradient(circle at 80% 10%, rgba(255, 128, 0, 0.12), transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(0, 225, 255, 0.2), transparent 50%),
              #020915;
  overflow: hidden;
  box-sizing: border-box;
}

.pointcloud-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.pcd-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 9, 21, 0.6);
  color: #fff;
  font-size: 14px;
  letter-spacing: 1px;
}

.pcd-overlay.error {
  background: rgba(255, 77, 79, 0.2);
  color: #ff6b6b;
}

.pcd-overlay.loading {
  color: #67d5fd;
}

/* 地图编辑样式 */
.map-edit-grid-card {
  background: linear-gradient(135deg, #0a2a3a 80%, #0a0f1c 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 0;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
  overflow: hidden;
}

.map-edit-grid-header {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(38, 131, 182, 0.2);
  background: rgba(12, 60, 86, 0.2);
}

.map-edit-toolbar-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  color: #67d5fd;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.map-edit-select {
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.8);
  color: #67d5fd;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
  min-width: 140px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.map-edit-select:hover {
  background: #0c4666;
  border-color: rgba(38, 131, 182, 1);
}

.map-edit-select:focus {
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  color: #67d5fd;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: rgba(103, 213, 253, 0.5);
}

.toolbar-btn.active {
  background: #67d5fd;
  border-color: #67d5fd;
  color: #0a1929;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.4);
  font-weight: 600;
}

.map-edit-grid-main {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gridmap-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(38, 131, 182, 0.3);
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  background: #fff;
  cursor: grab;
  user-select: none;
  transform-origin: 0 0;
  touch-action: none;
  image-rendering: pixelated;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.grid-canvas:active {
  cursor: grabbing;
}

.map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 25, 41, 0.8);
  color: #fff;
  font-size: 16px;
  letter-spacing: 1px;
  z-index: 10;
}

.map-overlay.error {
  background: rgba(255, 77, 79, 0.2);
  color: #ff6b6b;
}

.map-overlay.loading {
  color: #67d5fd;
}

/* 右侧编辑面板 */
.edit-panel-right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: rgba(22, 65, 89, 0.95);
  border-left: 1px solid rgba(38, 131, 182, 0.4);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(4px);
  z-index: 100;
}

.panel-tools {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 8px;
  gap: 10px;
}

.navigation-tools,
.tool-group,
.tool-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item,
.tool-item {
  width: 44px;
  height: 44px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover,
.tool-item:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: rgba(103, 213, 253, 0.5);
  transform: translateY(-1px);
}

.nav-item.active,
.tool-item.active {
  background: #67d5fd;
  border-color: #67d5fd;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.4);
}

.nav-icon,
.tool-icon {
  font-size: 20px;
  color: #67d5fd;
}

.nav-item.active .nav-icon,
.tool-item.active .tool-icon {
  color: #0a1929;
}

.action-btn {
  width: 44px;
  height: 44px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(103, 213, 253, 0.2);
  border-color: rgba(103, 213, 253, 0.5);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-btn-save {
  background: rgba(76, 175, 80, 0.15);
  border-color: rgba(76, 175, 80, 0.4);
}

.action-btn-save:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.25);
  border-color: rgba(76, 175, 80, 0.6);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.action-btn-save:disabled {
  opacity: 0.25;
  cursor: not-allowed;
  background: rgba(76, 175, 80, 0.05);
  border-color: rgba(76, 175, 80, 0.2);
}

.action-btn-save .action-icon {
  font-size: 22px;
}

.action-icon {
  font-size: 20px;
  color: #67d5fd;
}

.tool-settings {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(38, 131, 182, 0.3);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-item label {
  color: #67d5fd;
  font-size: 11px;
  text-align: center;
}

.size-slider {
  width: 100%;
  height: 4px;
  background: rgba(103, 213, 253, 0.2);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #67d5fd;
  border-radius: 50%;
  cursor: pointer;
}

.size-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #67d5fd;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.size-value {
  color: #67d5fd;
  font-size: 12px;
  text-align: center;
  font-weight: 600;
}
</style>
