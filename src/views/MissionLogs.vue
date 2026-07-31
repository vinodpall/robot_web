<template>
  <div class="drone-control-main">
    <!-- 侧边栏菜单 -->
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: route.path === tab.path }]"
          v-permission-click-dialog="tab.permission"
          @click="handleTabClick(tab)"
        >
          <img :src="tab.icon" :alt="tab.label" />
        </div>
      </div>
    </aside>
    <!-- 主体内容区 -->
    <main class="main-content">
      <div class="main-flex">
        <section class="right-panel">
          <div class="mission-top-card card">
            <div class="mission-top-header mission-top-header-left">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">定时循迹任务</span>
            </div>
          </div>
          <div class="mission-content-wrapper">
            <div class="mission-toolbar">
              <button class="mission-btn mission-btn-primary" v-permission-click-dialog="'task-plantracklist-create'" @click="handleOpenCreateDialog">新增定时任务</button>

              <span class="mission-toolbar-label" style="margin-left: 20px; margin-right: -8px;">循迹任务名称：</span>
              <select v-model="selectedTrackName" class="mission-toolbar-select" style="min-width: 180px;">
                <option value="">{{ filteredTrackList.length === 0 ? '暂无循迹任务' : '全部' }}</option>
                <option v-for="track in filteredTrackList" :key="track" :value="track">{{ track }}</option>
              </select>

              <span class="mission-toolbar-label" style="margin-left: 20px; margin-right: -8px;">任务组名称：</span>
              <select v-model="selectedTaskPointName" class="mission-toolbar-select" style="min-width: 180px;">
                <option value="">全部</option>
                <option v-for="group in taskGroupList" :key="group" :value="group">{{ group }}</option>
              </select>
            </div>
            <div class="file-table file-table-adaptive">
              <div class="file-table-header">
                <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">序号</div>
                <div class="file-table-cell" style="min-width: 160px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">循迹任务名称</div>
                <div class="file-table-cell" style="min-width: 160px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">任务组名称</div>
                <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center; display: flex; align-items: center; justify-content: center;">开始时间</div>
                <div class="file-table-cell file-table-action" style="min-width: 160px; width: 160px; text-align: center; display: flex; align-items: center; justify-content: center;">操作</div>
              </div>
              <div class="file-table-body">
                <template v-if="alerts.length > 0">
                <div class="file-table-row" v-for="(alert, idx) in alerts" :key="alert.id">
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">
                    <span class="ms-seq-num">{{ idx + 1 }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 160px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">
                    <span v-if="alert.track_name" class="ms-type-tag">{{ alert.track_name }}</span>
                    <span v-else class="ms-empty">-</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 160px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">
                    <span v-if="alert.track_point_name" class="ms-group-tag">{{ alert.track_point_name }}</span>
                    <span v-else class="ms-empty">-</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center; display: flex; align-items: center; justify-content: center;">
                    <span class="ms-time-val">{{ alert.start_time || '-' }}</span>
                  </div>
                  <div class="file-table-cell file-table-action" style="min-width: 160px; width: 160px; text-align: center; display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="action-btn action-btn-delete" v-permission-click-dialog="'task-plantracklist-delete'" @click="handleDeleteScheduledTask(alert)">
                      <img :src="deleteIcon" />
                      删除
                    </button>
                  </div>
                </div>
              </template>
                <!-- 始终显示固定的空行以保持表格边框（补足到10行） -->
                <div class="file-table-row" v-for="i in Math.max(0, 10 - alerts.length)" :key="'empty-' + i">
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;">&nbsp;</div>
                  <div class="file-table-cell" style="min-width: 160px; flex: 1; text-align: center;">&nbsp;</div>
                  <div class="file-table-cell" style="min-width: 160px; flex: 1; text-align: center;">&nbsp;</div>
                  <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center;">&nbsp;</div>
                  <div class="file-table-cell file-table-action" style="min-width: 160px; width: 160px; text-align: center;">&nbsp;</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 新增定时任务弹窗 -->
    <div v-if="showCreateDialog" class="custom-dialog-mask" @click="closeCreateDialog">
      <div class="simple-modal-card" style="width: 500px;" @click.stop>
        <div class="simple-modal-header">
          <span>新增定时任务</span>
          <span class="simple-close-icon" @click="closeCreateDialog">×</span>
        </div>
        <div class="simple-modal-body">
          <div class="task-form-row">
            <label class="task-form-label">循迹任务：</label>
            <select v-model="createForm.track_name" class="task-form-select">
              <option v-if="filteredTrackList.length === 0" value="">暂无循迹任务</option>
              <option v-for="track in filteredTrackList" :key="track" :value="track">{{ track }}</option>
            </select>
          </div>
          <div class="task-form-row">
            <label class="task-form-label">任务组：</label>
            <select v-model="createForm.track_point_name" class="task-form-select" :disabled="!createForm.track_name">
              <option v-for="group in createTaskGroupList" :key="group" :value="group">{{ group }}</option>
            </select>
          </div>
          <div class="task-form-row">
            <label class="task-form-label">开始时间：</label>
            <div class="custom-time-picker-container">
              <div 
                class="custom-time-input" 
                :class="{ 'is-error': createFormErrors.start_time, 'active': showTimePicker }"
                @click.stop="toggleCustomTimePicker"
              >
                <span v-if="createForm.start_time" class="time-val-text">{{ createForm.start_time }}</span>
                <span v-else class="time-placeholder-text">HH:MM</span>
                <svg class="time-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#67d5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 6V12L16 14" stroke="#67d5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- 科技感时间选择弹窗浮层 -->
              <div v-if="showTimePicker" class="custom-time-picker-popover" @click.stop>
                <div class="time-picker-header">
                  <span class="time-picker-title">选择时间</span>
                </div>
                <div class="time-picker-columns">
                  <!-- 小时列 -->
                  <div class="time-picker-column">
                    <div class="column-title">时</div>
                    <div class="column-list" ref="hourListRef">
                      <div 
                        v-for="h in hourOptions" 
                        :key="h" 
                        class="column-item"
                        :class="{ 'selected': h === pickerHour }"
                        @click="selectHour(h)"
                      >
                        {{ h }}
                      </div>
                    </div>
                  </div>
                  <!-- 分钟列 -->
                  <div class="time-picker-column">
                    <div class="column-title">分</div>
                    <div class="column-list" ref="minuteListRef">
                      <div 
                        v-for="m in minuteOptions" 
                        :key="m" 
                        class="column-item"
                        :class="{ 'selected': m === pickerMinute }"
                        @click="selectMinute(m)"
                      >
                        {{ m }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="createFormErrors.start_time" class="task-form-error-tip">请选择开始时间</div>
        </div>
        <div class="simple-modal-footer">
          <button class="mission-btn mission-btn-primary" v-permission-click-dialog="'task-plantracklist-create'" @click="handleCreateScheduledTask">确定</button>
          <button class="mission-btn mission-btn-secondary" @click="closeCreateDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- 大图预览弹窗 -->
    <div v-if="showBigImage" class="big-image-mask" @click="closeBigImage">
      <div class="big-image-content" @click.stop>
        <img v-if="bigImageUrl" :src="bigImageUrl" class="big-image" @load="handleBigImageLoaded" @error="handleBigImageErrored" />
        <div v-if="bigImageLoading" class="big-image-loading">
          <div class="spinner"></div>
          <div class="loading-text">图片加载中...</div>
        </div>
        <div v-if="bigImageError" class="big-image-error">{{ bigImageError }}</div>
      </div>
    </div>

    <!-- 位置预览弹窗 -->
    <div v-if="showLocationModal" class="location-modal-mask" @click="closeLocationModal">
      <div class="location-modal-content" @click.stop>
        <div class="location-modal-header">
          <h3>位置预览</h3>
          <button class="location-modal-close" @click="closeLocationModal">×</button>
        </div>
        <div class="location-modal-body">
          <div id="location-map-container" class="location-map-container"></div>
          <div class="location-map-watermark">
            <div>经度：{{ selectedAlert?.longitude?.toFixed(6) }}　纬度：{{ selectedAlert?.latitude?.toFixed(6) }}</div>
            <div v-if="selectedAlert?.altitude">高度：{{ selectedAlert.altitude.toFixed(2) }} 米</div>
            <div>检测时间：{{ selectedAlert?.detection_time ? formatTime(selectedAlert.detection_time) : '--' }}</div>
            <div>位置：<span style="word-break: break-all;">{{ selectedAddress || '地址查询中...' }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态处理弹窗 -->
    <div v-if="showStatusDialog" class="status-dialog-mask">
      <div class="status-dialog-content">
        <div class="status-dialog-header">
          <h3>处理告警</h3>
          <button class="status-dialog-close" @click="closeStatusDialog">×</button>
        </div>
        <div class="status-dialog-body">
          <div class="status-form">
            <div class="form-row">
              <label>处理方式：</label>
              <div class="radio-group">
                <label class="radio-item">
                  <input 
                    type="radio" 
                    v-model="statusForm.handleType" 
                    value="false_alarm" 
                    name="handleType"
                  />
                  <span>误报</span>
                </label>
                <label class="radio-item">
                  <input 
                    type="radio" 
                    v-model="statusForm.handleType" 
                    value="real_alarm" 
                    name="handleType"
                  />
                  <span>非误报</span>
                </label>
              </div>
            </div>
            <div class="form-row">
              <label>处理描述：</label>
              <textarea 
                v-model="statusForm.handleNote" 
                class="handle-note-input"
                placeholder="请输入处理描述"
                :class="{ 'required': statusForm.handleType === 'real_alarm' }"
              ></textarea>
            </div>
          </div>
          <div class="status-dialog-actions">
            <button class="status-btn status-btn-cancel" @click="closeStatusDialog">取消</button>
            <button 
              class="status-btn status-btn-submit" 
              @click="submitStatus"
              :disabled="!canSubmit"
            >
              提交
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailDialog" class="detail-dialog-mask">
      <div class="detail-dialog-content">
        <div class="detail-dialog-header">
          <h3>处理详情</h3>
          <button class="detail-dialog-close" @click="closeDetailDialog">×</button>
        </div>
        <div class="detail-dialog-body">
          <div class="detail-info">
            <div class="detail-row">
              <span class="detail-label">处理结果：</span>
              <span class="detail-value" :class="selectedAlert?.status ? getStatusColorClass(selectedAlert.status) : ''">
                {{ selectedAlert?.status ? getStatusText(selectedAlert.status) : '--' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">处理内容：</span>
              <span class="detail-value">{{ selectedAlert?.handle_note || '--' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">处理人：</span>
              <span class="detail-value">{{ selectedAlert?.handler_name || '--' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">处理时间：</span>
              <span class="detail-value">{{ selectedAlert?.handle_time ? formatTime(selectedAlert.handle_time) : '--' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <SuccessMessage 
      :show="successMessage.show" 
      :message="successMessage.text"
      @close="successMessage.show = false"
    />

    <!-- 错误提示 -->
    <ErrorMessage 
      :show="errorMessage.show" 
      :message="errorMessage.text"
      @close="errorMessage.show = false"
    />

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="删除定时任务"
      :message="`确定要删除定时任务「${taskToDelete?.track_name}」吗？`"
      type="warning"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="confirmDeleteScheduledTask"
      @cancel="cancelDeleteScheduledTask"
      @close="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { visionApi, navigationApi } from '@/api/services'
import { API_BASE_URL } from '@/api/config'
import AMapLoader from '@amap/amap-jsapi-loader'
import deleteIcon from '@/assets/source_data/svg_data/robot_source/delete.png'
import SuccessMessage from '@/components/SuccessMessage.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useTaskExecutionStore } from '@/stores/taskExecution'
import type { VisionAlert } from '@/types'
import trackListIcon from '@/assets/source_data/svg_data/track_list.svg'
import taskAutoIcon from '@/assets/source_data/svg_data/robot_source/task_auto.svg'
import taskTimeIcon from '@/assets/source_data/svg_data/robot_source/task_time.svg'
import taskMultiIcon from '@/assets/source_data/svg_data/robot_source/task_multi.svg'

// 统一构建图片请求URL，避免本地出现 /api/v1/api/v1 的重复
const buildImageFetchUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  if (path.startsWith('/api/')) {
    return path
  }
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`
  }
  return `${API_BASE_URL}/${path}`
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const taskExecutionStore = useTaskExecutionStore()

const sidebarTabs = [
  { key: 'list', label: '循迹任务', icon: trackListIcon, path: '/dashboard/mission', permission: 'task-tracklist-show' },
  { key: 'records', label: '发布点任务', icon: taskAutoIcon, path: '/dashboard/mission-records', permission: 'task-tasklist-show' },
  { key: 'logs', label: '定时循迹任务', icon: taskTimeIcon, path: '/dashboard/mission-logs', permission: 'task-plantracklist-show' },
  { key: 'multi', label: '多任务组任务', icon: taskMultiIcon, path: '/dashboard/multi-task-group', permission: 'task-multitasklist-show' }
]

const emitPermissionDenied = (permission: string) => {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('permission-denied', {
      detail: { permission }
    }))
  }
}

const handleTabClick = (tab: any) => {
  if (tab.permission && !permissionStore.hasPermission(tab.permission)) {
    emitPermissionDenied(tab.permission)
    return
  }
  if (route.path !== tab.path) {
    router.push(tab.path)
  }
}

// 分页参数
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const pageInput = ref('')

// 数据列表（定时任务列表）
const alerts = ref<any[]>([])

// 循迹任务名称和任务组
const trackList = ref<string[]>([])
const selectedTrackName = ref('')
const taskGroupList = ref<string[]>([])
const selectedTaskPointName = ref('')

// 新增定时任务弹窗
const showCreateDialog = ref(false)
const createForm = ref({
  track_name: '',
  track_point_name: '',
  start_time: ''
})
const createFormErrors = ref({
  start_time: false
})
const createTaskGroupList = ref<string[]>([])

// 科技感时间选择器组件状态
const showTimePicker = ref(false)
const pickerHour = ref('12')
const pickerMinute = ref('00')
const hourListRef = ref<HTMLElement | null>(null)
const minuteListRef = ref<HTMLElement | null>(null)

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const scrollToSelected = () => {
  nextTick(() => {
    if (hourListRef.value) {
      const hIndex = hourOptions.indexOf(pickerHour.value)
      if (hIndex > -1) {
        hourListRef.value.scrollTop = hIndex * 28 - 56
      }
    }
    if (minuteListRef.value) {
      const mIndex = minuteOptions.indexOf(pickerMinute.value)
      if (mIndex > -1) {
        minuteListRef.value.scrollTop = mIndex * 28 - 56
      }
    }
  })
}

const toggleCustomTimePicker = () => {
  showTimePicker.value = !showTimePicker.value
  if (showTimePicker.value) {
    if (createForm.value.start_time && createForm.value.start_time.includes(':')) {
      const parts = createForm.value.start_time.split(':')
      pickerHour.value = parts[0].padStart(2, '0')
      pickerMinute.value = parts[1].padStart(2, '0')
    } else {
      const now = new Date()
      pickerHour.value = String(now.getHours()).padStart(2, '0')
      pickerMinute.value = String(now.getMinutes()).padStart(2, '0')
      createForm.value.start_time = `${pickerHour.value}:${pickerMinute.value}`
    }
    scrollToSelected()
  }
}

const selectHour = (h: string) => {
  pickerHour.value = h
  createForm.value.start_time = `${pickerHour.value}:${pickerMinute.value}`
}

const selectMinute = (m: string) => {
  pickerMinute.value = m
  createForm.value.start_time = `${pickerHour.value}:${pickerMinute.value}`
  showTimePicker.value = false
}

const setCurrentTime = () => {
  const now = new Date()
  pickerHour.value = String(now.getHours()).padStart(2, '0')
  pickerMinute.value = String(now.getMinutes()).padStart(2, '0')
  createForm.value.start_time = `${pickerHour.value}:${pickerMinute.value}`
  scrollToSelected()
}

const confirmCustomTime = () => {
  if (!createForm.value.start_time) {
    createForm.value.start_time = `${pickerHour.value}:${pickerMinute.value}`
  }
  showTimePicker.value = false
}

const handleDocumentClickClosePicker = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (showTimePicker.value && !target.closest('.custom-time-picker-container')) {
    showTimePicker.value = false
  }
}

// 时间输入框引用
const timeInputRef = ref<HTMLInputElement | null>(null)

// 成功/失败提示
const successMessage = ref({
  show: false,
  text: ''
})
const errorMessage = ref({
  show: false,
  text: ''
})

// 删除确认对话框
const showDeleteConfirm = ref(false)
const taskToDelete = ref<any>(null)

// 从缓存读取选中的地图名称
const selectedMap = computed(() => {
  return taskExecutionStore.selectedMapName
})

// 过滤后的轨迹列表（根据缓存的地图筛选）
const filteredTrackList = computed(() => {
  if (!selectedMap.value) return []
  return trackList.value.filter(track => track.startsWith(selectedMap.value + '_'))
})

// 获取轨迹列表
const loadTrackList = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return
  
  try {
    const response = await navigationApi.getTrackList(robotId)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      const rawList: string[] = response.msg.result
      // 处理：移除 @ 及后缀，并去重
      const processedSet = new Set<string>()
      rawList.forEach(item => {
        const atIndex = item.indexOf('@')
        const name = atIndex > -1 ? item.substring(0, atIndex) : item
        processedSet.add(name)
      })
      trackList.value = Array.from(processedSet)
    }
  } catch (err) {
    console.error('获取轨迹列表失败:', err)
  }
}

// 已移除设备和任务筛选

// 获取workspaceId
const getWorkspaceId = () => {
  if (userStore.user?.workspace_id) {
    return userStore.user.workspace_id
  }
  return '123456'
}

// 加载定时任务列表
const loadScheduledTasks = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return
  
  try {
    const params: any = {}
    if (selectedTrackName.value) {
      params.track_name = selectedTrackName.value
    }
    if (selectedTaskPointName.value) {
      params.track_point_name = selectedTaskPointName.value
    }
    
    const response = await navigationApi.getScheduledTasks(robotId, params)
    
    if (response && response.data && Array.isArray(response.data)) {
      alerts.value = response.data.reverse()
      total.value = response.data.length
    } else {
      alerts.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载定时任务列表失败:', error)
    alerts.value = []
    total.value = 0
  }
}

// 监听新增弹窗中的轨迹选择变化
watch(() => createForm.value.track_name, async (newVal) => {
  createForm.value.track_point_name = ''
  createTaskGroupList.value = []
  
  if (!newVal) return
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return
  
  try {
    const response = await navigationApi.getTaskpointList(robotId, newVal)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      createTaskGroupList.value = response.msg.result
      if (createTaskGroupList.value.length > 0) {
        createForm.value.track_point_name = createTaskGroupList.value[0]
      }
    }
  } catch (err) {
    console.error('获取任务组列表失败:', err)
  }
})

watch(() => createForm.value.start_time, (newVal) => {
  if (newVal) {
    createFormErrors.value.start_time = false
  }
})

// 打开新增弹窗
const handleOpenCreateDialog = () => {
  showCreateDialog.value = true
  createFormErrors.value.start_time = false
  if (filteredTrackList.value.length > 0) {
    createForm.value.track_name = filteredTrackList.value[0]
  }
}

// 聚焦时间输入框
const focusTimeInput = () => {
  if (timeInputRef.value) {
    timeInputRef.value.showPicker?.()
  }
}

// 关闭新增弹窗
const closeCreateDialog = () => {
  showCreateDialog.value = false
  showTimePicker.value = false
  createForm.value = {
    track_name: '',
    track_point_name: '',
    start_time: ''
  }
  createFormErrors.value.start_time = false
  createTaskGroupList.value = []
}

// 新增定时任务
const handleCreateScheduledTask = async () => {
  if (!createForm.value.track_name) {
    errorMessage.value = { show: true, text: '请选择循迹任务' }
    return
  }
  if (!createForm.value.track_point_name) {
    errorMessage.value = { show: true, text: '请选择任务组' }
    return
  }
  if (!createForm.value.start_time) {
    createFormErrors.value.start_time = true
    return
  }
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    errorMessage.value = { show: true, text: '未选择机器人' }
    return
  }
  
  try {
    const response = await navigationApi.createScheduledTask(robotId, {
      track_name: createForm.value.track_name,
      track_point_name: createForm.value.track_point_name,
      start_time: createForm.value.start_time
    })
    
    if (response && response.response && response.response.msg && response.response.msg.error_code === 0) {
      successMessage.value = { show: true, text: '新增定时任务成功' }
      setTimeout(() => {
        successMessage.value.show = false
      }, 2000)
      closeCreateDialog()
      await loadScheduledTasks()
    } else {
      const errorMsg = response?.response?.msg?.error_msg || '未知错误'
      errorMessage.value = { show: true, text: `新增失败: ${errorMsg}` }
    }
  } catch (error: any) {
    console.error('新增定时任务失败:', error)
    errorMessage.value = { show: true, text: `新增失败: ${error.message || '网络错误'}` }
  }
}

// 删除定时任务（显示确认弹窗）
const handleDeleteScheduledTask = (task: any) => {
  taskToDelete.value = task
  showDeleteConfirm.value = true
}

// 确认删除定时任务
const confirmDeleteScheduledTask = async () => {
  showDeleteConfirm.value = false
  
  if (!taskToDelete.value) return
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    errorMessage.value = { show: true, text: '未选择机器人' }
    return
  }
  
  try {
    const response = await navigationApi.deleteScheduledTask(robotId, taskToDelete.value.id)
    successMessage.value = { show: true, text: '删除定时任务成功' }
    setTimeout(() => {
      successMessage.value.show = false
    }, 2000)
    await loadScheduledTasks()
  } catch (error: any) {
    console.error('删除定时任务失败:', error)
    errorMessage.value = { show: true, text: `删除失败: ${error.message || '网络错误'}` }
  } finally {
    taskToDelete.value = null
  }
}

// 取消删除
const cancelDeleteScheduledTask = () => {
  showDeleteConfirm.value = false
  taskToDelete.value = null
}

// 切换页面
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    pageInput.value = page.toString()
  }
}

// 跳转到指定页面
const jumpToPage = () => {
  const page = parseInt(pageInput.value)
  if (page && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = currentPage.value.toString()
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING': return '待处理'
    case 'HANDLED': return '已处理'
    case 'IGNORED': return '已忽略'
    default: return status
  }
}

const getStatusColorClass = (status: string) => {
  switch (status) {
    case 'PENDING': return 'status-pending'
    case 'HANDLED': return 'status-handled'
    case 'IGNORED': return 'status-ignored'
    default: return 'status-default'
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 图片缓存
const imageCache = ref<Record<string, string>>({})

const downloadAndCacheImage = async (imagePath: string) => {
  if (imageCache.value[imagePath]) return
  try {
    const token = userStore.token
    const response = await fetch(buildImageFetchUrl(imagePath), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*'
      }
    })
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    imageCache.value[imagePath] = url
  } catch (error) {
    console.error('Failed to load image:', error)
  }
}

const clearImageCache = () => {
  Object.values(imageCache.value).forEach(url => {
    URL.revokeObjectURL(url)
  })
  imageCache.value = {}
}

// 大图弹窗相关
const bigImageUrl = ref('')
const showBigImage = ref(false)
const bigImageLoading = ref(false)
const bigImageError = ref('')

const handleImageClick = async (markedUrl: string) => {
  if (!markedUrl) return
  showBigImage.value = true
  bigImageLoading.value = true
  bigImageError.value = ''
  bigImageUrl.value = ''
  try {
    const token = userStore.token
    const response = await fetch(buildImageFetchUrl(markedUrl), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*'
      }
    })
    if (!response.ok) throw new Error('图片下载失败')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    bigImageUrl.value = url
  } catch (e) {
    bigImageUrl.value = ''
    bigImageLoading.value = false
    bigImageError.value = '图片加载失败，请稍后重试'
  }
}

const handleBigImageLoaded = () => {
  bigImageLoading.value = false
}

const handleBigImageErrored = () => {
  bigImageLoading.value = false
  bigImageError.value = '图片加载失败，请稍后重试'
}
const closeBigImage = () => {
  if (bigImageUrl.value) URL.revokeObjectURL(bigImageUrl.value)
  showBigImage.value = false
  bigImageUrl.value = ''
  bigImageLoading.value = false
  bigImageError.value = ''
}

const thumbCache = ref<Record<string, string>>({})
const thumbLoading = ref<Record<string, boolean>>({})
const thumbError = ref<Record<string, boolean>>({})

const getThumbnailUrl = async (thumbPath: string) => {
  if (!thumbPath) return ''
  if (thumbCache.value[thumbPath]) return thumbCache.value[thumbPath]
  if (thumbLoading.value[thumbPath]) return ''
  thumbLoading.value[thumbPath] = true
  try {
    const token = userStore.token
    const response = await fetch(buildImageFetchUrl(thumbPath), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*'
      }
    })
    if (!response.ok) throw new Error('缩略图下载失败')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    thumbCache.value[thumbPath] = url
    thumbError.value[thumbPath] = false
    return url
  } catch {
    thumbError.value[thumbPath] = true
    return ''
  } finally {
    thumbLoading.value[thumbPath] = false
  }
}

// 位置预览相关
const showLocationModal = ref(false)
const selectedAlert = ref<VisionAlert | null>(null)
const selectedAddress = ref<string>('')
let locationMapInstance: any = null

// 状态管理相关
const showStatusDialog = ref(false)
const showDetailDialog = ref(false)
const statusForm = ref({
  handleType: 'false_alarm',
  handleNote: ''
})

const canSubmit = computed(() => {
  if (statusForm.value.handleType === 'real_alarm') {
    return statusForm.value.handleNote.trim().length > 0
  }
  return true
})

const closeStatusDialog = () => {
  showStatusDialog.value = false
  selectedAlert.value = null
  statusForm.value.handleType = 'false_alarm'
  statusForm.value.handleNote = ''
}

const closeDetailDialog = () => {
  showDetailDialog.value = false
  selectedAlert.value = null
}

const submitStatus = async () => {
  if (!selectedAlert.value) return
  try {
    const workspaceId = getWorkspaceId()
    const alertId = selectedAlert.value.id
    let status: 'HANDLED' | 'IGNORED' = statusForm.value.handleType === 'false_alarm' ? 'IGNORED' : 'HANDLED'
    const requestData = {
      status: status,
      handle_note: statusForm.value.handleNote
    }
    await visionApi.updateAlertStatus(workspaceId, alertId, requestData)
    closeStatusDialog()
    alert('状态更新成功')
  } catch (error) {
    console.error('更新状态失败:', error)
    alert('状态更新失败，请重试')
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadTrackList()
  loadScheduledTasks()
  pageInput.value = currentPage.value.toString()
  window.addEventListener('openBigImageFromMap', async (e: any) => {
    const url = e?.detail?.url as string
    if (url) {
      await handleImageClick(url)
    }
  })
  document.addEventListener('click', handleDocumentClickClosePicker)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClickClosePicker)
})

watch(() => userStore.token, (newToken, oldToken) => {
  if (newToken !== oldToken) {
    clearImageCache()
  }
})

watch(alerts, (newAlerts: VisionAlert[]) => {
  newAlerts.forEach((alert: VisionAlert) => {
    if (alert.thumbnail_image_url) getThumbnailUrl(alert.thumbnail_image_url)
  })
}, { immediate: true })

// 关闭位置预览
const closeLocationModal = () => {
  showLocationModal.value = false
  selectedAlert.value = null
  selectedAddress.value = ''
  if (locationMapInstance) {
    locationMapInstance.destroy()
    locationMapInstance = null
  }
}

// 初始化位置地图
const initLocationMap = async () => {
  if (!selectedAlert.value?.latitude || !selectedAlert.value?.longitude) return
  
  try {
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
    
    const AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.MapType', 'AMap.Geocoder']
    })
    
    const wgsLongitude = selectedAlert.value.longitude
    const wgsLatitude = selectedAlert.value.latitude
    const gcjCoords = transformWGS84ToGCJ02(wgsLongitude, wgsLatitude)
    
    locationMapInstance = new AMap.Map('location-map-container', {
      zoom: 16,
      center: [gcjCoords.longitude, gcjCoords.latitude],
      logoEnable: false,
      copyrightEnable: false,
      mapStyle: 'amap://styles/satellite',
      layers: [
        new AMap.TileLayer.Satellite(),
        new AMap.TileLayer.RoadNet()
      ]
    })
    
    const marker = new AMap.Marker({
      position: [gcjCoords.longitude, gcjCoords.latitude],
      title: `检测位置`,
      icon: new AMap.Icon({
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="#ff4d4f" stroke="#ffffff" stroke-width="2" />
          </svg>
        `),
        imageSize: new AMap.Size(20, 20),
        size: new AMap.Size(20, 20)
      }),
      anchor: 'center',
      offset: new AMap.Pixel(0, 0)
    })

    marker.setLabel({
      direction: 'right',
      offset: new AMap.Pixel(6, 0),
      content: `
        <div style="
          background: rgba(255,255,255,0.9);
          color: #ff4d4f;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
        ">检测点</div>
      `
    })

    locationMapInstance.add(marker)

    try {
      const thumbPath = selectedAlert.value?.thumbnail_image_url as string | undefined
      if (thumbPath) {
        const thumbUrl = await getThumbnailUrl(thumbPath)
        if (thumbUrl) {
          const imageMarker = new AMap.Marker({
            position: [gcjCoords.longitude, gcjCoords.latitude],
            content: `
              <div style="
                width: 40px;
                height: 40px;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                border: 2px solid rgba(255,255,255,0.85);
                background: rgba(0,0,0,0.2);
              ">
                <img src="${thumbUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block; cursor: zoom-in;" alt="报警图片" onclick="window.dispatchEvent(new CustomEvent('openBigImageFromMap',{ detail: { url: '${selectedAlert.value?.marked_image_url || ''}' } }))"/>
              </div>
            `,
            anchor: 'bottom-center',
            offset: new AMap.Pixel(0, -26)
          })
          locationMapInstance.add(imageMarker)
        }
      }
    } catch {}

    try {
      const geocoder = new AMap.Geocoder({})
      geocoder.getAddress([gcjCoords.longitude, gcjCoords.latitude], (status: string, result: any) => {
        if (status === 'complete' && result?.regeocode?.formattedAddress) {
          const addr = result.regeocode.formattedAddress as string
          selectedAddress.value = addr
          marker.setTitle(addr)
        }
      })
    } catch {}
    
  } catch (error) {
    console.error('初始化位置地图失败:', error)
  }
}

// WGS84坐标转GCJ-02坐标系
const transformWGS84ToGCJ02 = (wgsLng: number, wgsLat: number) => {
  const PI = Math.PI
  const ee = 0.00669342162296594323
  const a = 6378245.0
  
  if (outOfChina(wgsLng, wgsLat)) {
    return { longitude: wgsLng, latitude: wgsLat }
  }
  
  let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0)
  let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0)
  
  const radLat = wgsLat / 180.0 * PI
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI)
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI)
  
  const mgLat = wgsLat + dLat
  const mgLng = wgsLng + dLng
  
  return { longitude: mgLng, latitude: mgLat }
}

const outOfChina = (lng: number, lat: number) => {
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
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0
  return ret
}
</script>

<style scoped>
@import './mission-common.css';

/* 定时循迹任务标题左对齐 */
.mission-top-header.mission-top-header-left {
  justify-content: flex-start !important;
}

/* 覆盖公共 grid 列模板，适配本页 5 列布局 */
.file-table-header,
.file-table-row {
  grid-template-columns: 120px 1fr 1fr 160px 160px;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.pagination-info {
  color: #67d5fd;
  font-size: 14px;
  font-weight: 400;
}

.action-btn-delete {
  color: #ff4d4f;
}

.action-btn-delete img {
  filter: drop-shadow(0 0 4px rgba(255, 77, 79, 0.4));
}

/* ---- 列表单元格样式 ---- */
.file-table-row:hover {
  background: rgba(103, 213, 253, 0.05);
}
.ms-seq-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(103, 213, 253, 0.08);
  border: 1px solid rgba(103, 213, 253, 0.2);
  color: #8cd6f5;
  font-size: 12px;
  font-weight: 600;
}
.ms-type-tag {
  display: inline-block;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(103, 213, 253, 0.08);
  color: #67d5fd;
  border: 1px solid rgba(103, 213, 253, 0.22);
  border-radius: 3px;
  padding: 2px 8px;
  font-size: 12px;
}
.ms-group-tag {
  display: inline-block;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(86, 211, 148, 0.08);
  color: #56d394;
  border: 1px solid rgba(86, 211, 148, 0.22);
  border-radius: 3px;
  padding: 2px 8px;
  font-size: 12px;
}
.ms-time-val {
  font-family: 'Consolas', 'Courier New', monospace;
  color: #67d5fd;
  font-size: 12px;
  letter-spacing: 0.2px;
}
.ms-empty {
  color: rgba(255, 255, 255, 0.2);
}

/* 新增定时任务弹窗样式 */
.custom-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.simple-modal-card {
  background: #102a43;
  border: 1px solid #244f78;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: visible;
}

.simple-modal-header {
  height: 50px;
  background: #163654;
  border-bottom: 1px solid #244f78;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  flex-shrink: 0;
}

.simple-close-icon {
  cursor: pointer;
  font-size: 20px;
  color: #909399;
  transition: color 0.3s;
}

.simple-close-icon:hover {
  color: #fff;
}

.simple-modal-body {
  padding: 24px 40px;
  overflow: visible;
  flex: 1;
}

.simple-modal-body::-webkit-scrollbar {
  display: none;
  width: 0;
}

.simple-modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.simple-modal-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.simple-modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.simple-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #244f78;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-shrink: 0;
}

.simple-modal-card .task-form-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.simple-modal-card .task-form-row:last-child {
  margin-bottom: 0;
}

.simple-modal-card .task-form-label {
  min-width: 90px;
  color: #b8c7d9;
  font-size: 14px;
  text-align: right;
  margin-right: 16px;
  white-space: nowrap;
}

.simple-modal-card .task-form-select,
.simple-modal-card .task-form-input {
  flex: 1;
  height: 36px;
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.4);
  border-radius: 6px;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  transition: all 0.2s;
}

.simple-modal-card .task-form-select:focus,
.simple-modal-card .task-form-input:focus {
  outline: none;
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.1);
}

.simple-modal-card .task-form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.simple-modal-card .task-form-select option {
  background: #0c3c56;
  color: #fff;
}

/* 自定义科技感时间选择器样式 */
.custom-time-picker-container {
  flex: 1;
  position: relative;
  width: 100%;
}

.custom-time-input {
  height: 36px;
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.4);
  border-radius: 6px;
  color: #fff;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.custom-time-input:hover,
.custom-time-input.active {
  border-color: #67d5fd;
  box-shadow: 0 0 8px rgba(103, 213, 253, 0.3);
}

.custom-time-input.is-error {
  border-color: #ff6b6b !important;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.15) !important;
}

.time-val-text {
  color: #67d5fd;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
}

.time-placeholder-text {
  color: rgba(255, 255, 255, 0.35);
  font-size: 14px;
}

.time-icon {
  opacity: 0.85;
  transition: transform 0.2s;
}

.custom-time-input:hover .time-icon {
  opacity: 1;
  transform: scale(1.1);
}

.custom-time-picker-popover {
  position: absolute;
  top: 42px;
  left: 0;
  width: 220px;
  background: linear-gradient(135deg, #0e273f 0%, #10324e 100%);
  border: 1px solid rgba(103, 213, 253, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7), inset 0 0 12px rgba(103, 213, 253, 0.08);
  border-radius: 8px;
  z-index: 10050;
  padding: 12px;
  animation: popover-fade-in 0.15s ease-out;
}

@keyframes popover-fade-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.time-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(103, 213, 253, 0.15);
}

.time-picker-title {
  color: #dff5ff;
  font-size: 12px;
  font-weight: 600;
}

.time-picker-now-btn {
  background: transparent;
  border: none;
  color: #67d5fd;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.2s;
}

.time-picker-now-btn:hover {
  background: rgba(103, 213, 253, 0.15);
}

.time-picker-columns {
  display: flex;
  gap: 10px;
  height: 150px;
}

.time-picker-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(5, 18, 31, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.15);
  border-radius: 6px;
  overflow: hidden;
}

.column-title {
  text-align: center;
  font-size: 12px;
  color: #67d5fd;
  background: rgba(103, 213, 253, 0.1);
  padding: 4px 0;
  font-weight: 500;
  border-bottom: 1px solid rgba(103, 213, 253, 0.1);
}

.column-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.column-list::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.column-item {
  height: 28px;
  line-height: 28px;
  text-align: center;
  font-size: 13px;
  color: #b0c4de;
  cursor: pointer;
  transition: all 0.15s;
}

.column-item:hover {
  background: rgba(103, 213, 253, 0.15);
  color: #fff;
}

.column-item.selected {
  background: rgba(103, 213, 253, 0.25);
  color: #67d5fd;
  font-weight: bold;
  border-left: 3px solid #67d5fd;
  text-shadow: 0 0 6px rgba(103, 213, 253, 0.5);
}

.time-picker-footer {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.time-picker-confirm {
  width: 100%;
  height: 30px;
  background: rgba(103, 213, 253, 0.15);
  border: 1px solid #67d5fd;
  color: #67d5fd;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.time-picker-confirm:hover {
  background: #67d5fd;
  color: #092a40;
  box-shadow: 0 0 8px rgba(103, 213, 253, 0.4);
}

.task-form-error-tip {
  margin: -8px 0 0 106px;
  color: #ff6b6b;
  font-size: 12px;
  line-height: 1.2;
}
</style>
