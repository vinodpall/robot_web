<template>
  <div class="drone-control-main">
    <!-- 侧边栏菜单 -->
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: route.path === tab.path }]"
          :title="tab.label"
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
          <!-- 顶部卡片 -->
          <div class="mission-top-card card">
            <div class="mission-top-header mission-top-header-left">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">操作日志</span>
            </div>
          </div>

          <!-- 内容主体包装 -->
          <div class="mission-content-wrapper">
            <!-- 过滤工具栏 -->
            <div class="mission-toolbar track-toolbar-row">
              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">操作用户：</span>
                <select v-model="filter.userId" class="mission-toolbar-select track-filter-input">
                  <option value="">全部</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
                </select>
              </div>

              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">关联设备：</span>
                <select v-model="filter.robotId" class="mission-toolbar-select track-filter-input">
                  <option value="">全部</option>
                  <option v-for="r in robots" :key="r.robot_id" :value="r.robot_id">{{ r.robot_id }}</option>
                </select>
              </div>

              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">操作类型：</span>
                <input
                  v-model.trim="filter.operationType"
                  type="text"
                  class="track-filter-input"
                  placeholder="搜索操作类型"
                />
              </div>

              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">开始时间：</span>
                <div class="track-time-picker-wrap">
                  <button class="track-time-trigger" type="button" @click.stop="openTimePicker('start')">
                    <span class="track-time-trigger-text">{{ formatToolbarTime(filter.startTime) }}</span>
                    <span class="track-time-trigger-icon">🗓</span>
                  </button>
                  <div v-if="activeTimePicker === 'start'" class="track-time-popover" @click.stop>
                    <div class="track-time-popover-title">选择开始时间</div>
                    <div class="track-time-calendar-head">
                      <button class="track-time-nav-btn" type="button" @click="shiftDisplayMonth(-1)">‹</button>
                      <div class="track-time-calendar-title">
                        <select v-model.number="displayYear" class="track-time-mini-select">
                          <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}年</option>
                        </select>
                        <select v-model.number="displayMonth" class="track-time-mini-select">
                          <option v-for="month in monthOptions" :key="month" :value="month">{{ month }}月</option>
                        </select>
                      </div>
                      <button class="track-time-nav-btn" type="button" @click="shiftDisplayMonth(1)">›</button>
                    </div>
                    <div class="track-time-week-row">
                      <span v-for="w in weekLabels" :key="`sw-${w}`">{{ w }}</span>
                    </div>
                    <div class="track-time-day-grid">
                      <button
                        v-for="cell in calendarCells"
                        :key="`sd-${cell.year}-${cell.month}-${cell.day}`"
                        type="button"
                        class="track-time-day-cell"
                        :class="{
                          'is-muted': !cell.inCurrentMonth,
                          'is-today': cell.isToday,
                          'is-active': cell.isSelected
                        }"
                        @click="selectCalendarDay(cell)"
                      >
                        {{ cell.day }}
                      </button>
                    </div>
                    <div class="track-time-hm-row">
                      <label>时间</label>
                      <select v-model.number="pickerHour" class="track-time-mini-select hm">
                        <option v-for="h in hourOptions" :key="`sh-${h}`" :value="h">{{ String(h).padStart(2, '0') }} 时</option>
                      </select>
                      <select v-model.number="pickerMinute" class="track-time-mini-select hm">
                        <option v-for="m in minuteOptions" :key="`sm-${m}`" :value="m">{{ String(m).padStart(2, '0') }} 分</option>
                      </select>
                    </div>
                    <div class="track-time-popover-actions">
                      <button class="track-time-btn ghost" type="button" @click="clearTimePicker('start')">清空</button>
                      <button class="track-time-btn ghost" type="button" @click="setTimeNow('start')">现在</button>
                      <button class="track-time-btn ghost" type="button" @click="cancelTimePicker">取消</button>
                      <button class="track-time-btn" type="button" @click="confirmTimePicker('start')">确定</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">结束时间：</span>
                <div class="track-time-picker-wrap">
                  <button class="track-time-trigger" type="button" @click.stop="openTimePicker('end')">
                    <span class="track-time-trigger-text">{{ formatToolbarTime(filter.endTime) }}</span>
                    <span class="track-time-trigger-icon">🗓</span>
                  </button>
                  <div v-if="activeTimePicker === 'end'" class="track-time-popover" @click.stop>
                    <div class="track-time-popover-title">选择结束时间</div>
                    <div class="track-time-calendar-head">
                      <button class="track-time-nav-btn" type="button" @click="shiftDisplayMonth(-1)">‹</button>
                      <div class="track-time-calendar-title">
                        <select v-model.number="displayYear" class="track-time-mini-select">
                          <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}年</option>
                        </select>
                        <select v-model.number="displayMonth" class="track-time-mini-select">
                          <option v-for="month in monthOptions" :key="month" :value="month">{{ month }}月</option>
                        </select>
                      </div>
                      <button class="track-time-nav-btn" type="button" @click="shiftDisplayMonth(1)">›</button>
                    </div>
                    <div class="track-time-week-row">
                      <span v-for="w in weekLabels" :key="`ew-${w}`">{{ w }}</span>
                    </div>
                    <div class="track-time-day-grid">
                      <button
                        v-for="cell in calendarCells"
                        :key="`ed-${cell.year}-${cell.month}-${cell.day}`"
                        type="button"
                        class="track-time-day-cell"
                        :class="{
                          'is-muted': !cell.inCurrentMonth,
                          'is-today': cell.isToday,
                          'is-active': cell.isSelected
                        }"
                        @click="selectCalendarDay(cell)"
                      >
                        {{ cell.day }}
                      </button>
                    </div>
                    <div class="track-time-hm-row">
                      <label>时间</label>
                      <select v-model.number="pickerHour" class="track-time-mini-select hm">
                        <option v-for="h in hourOptions" :key="`eh-${h}`" :value="h">{{ String(h).padStart(2, '0') }} 时</option>
                      </select>
                      <select v-model.number="pickerMinute" class="track-time-mini-select hm">
                        <option v-for="m in minuteOptions" :key="`em-${m}`" :value="m">{{ String(m).padStart(2, '0') }} 分</option>
                      </select>
                    </div>
                    <div class="track-time-popover-actions">
                      <button class="track-time-btn ghost" type="button" @click="clearTimePicker('end')">清空</button>
                      <button class="track-time-btn ghost" type="button" @click="setTimeNow('end')">现在</button>
                      <button class="track-time-btn ghost" type="button" @click="cancelTimePicker">取消</button>
                      <button class="track-time-btn" type="button" @click="confirmTimePicker('end')">确定</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="track-toolbar-actions track-toolbar-actions-right" style="margin-left: auto;">
                <button class="mission-btn mission-btn-primary" @click="handleSearch">查询</button>
                <button class="mission-btn mission-btn-secondary" @click="handleReset">重置</button>
              </div>
            </div>

            <!-- 操作日志表格 -->
            <div class="file-table file-table-adaptive trc-table" style="margin-top: 16px;">
              <div class="file-table-header">
                <div class="file-table-cell opl-id">ID</div>
                <div class="file-table-cell opl-user">操作用户</div>
                <div class="file-table-cell opl-ip">IP地址</div>
                <div class="file-table-cell opl-robot">关联设备</div>
                <div class="file-table-cell opl-type">操作类型</div>
                <div class="file-table-cell opl-desc">操作描述</div>
                <div class="file-table-cell opl-time">操作时间</div>
                <div class="file-table-cell opl-actions">操作内容</div>
              </div>
              
              <div class="file-table-body">
                <div v-if="loading" class="mission-loading">加载中...</div>
                <div v-else-if="errorMsg" class="mission-error">{{ errorMsg }}</div>
                <template v-else>
                  <div class="file-table-row" v-for="row in logList" :key="row.id">
                    <div class="file-table-cell opl-id" :title="String(row.id)">{{ row.id }}</div>
                    <div class="file-table-cell opl-user" :title="row.username || '-'">
                      <span v-if="row.username" class="opl-user-tag">{{ row.username }}</span>
                      <span v-else class="trc-empty">-</span>
                    </div>
                    <div class="file-table-cell opl-ip" :title="row.ip_address || '-'">
                      <span v-if="row.ip_address" class="opl-ip-val">{{ row.ip_address }}</span>
                      <span v-else class="trc-empty">-</span>
                    </div>
                    <div class="file-table-cell opl-robot" :title="row.robot_id || '-'">
                      <span v-if="row.robot_id" class="opl-robot-tag">{{ row.robot_id }}</span>
                      <span v-else class="trc-empty">-</span>
                    </div>
                    <div class="file-table-cell opl-type" :title="row.operation_type || '-'">
                      <span v-if="row.operation_type" class="op-type-tag" :class="getOpTypeClass(row.operation_type)">
                        {{ row.operation_type }}
                      </span>
                      <span v-else class="trc-empty">-</span>
                    </div>
                    <div class="file-table-cell opl-desc" :title="row.operation_desc || '-'">
                      <span class="opl-desc-text">{{ row.operation_desc || '-' }}</span>
                    </div>
                    <div class="file-table-cell opl-time" :title="formatTime(row.created_at)">
                      <span class="opl-time-val">{{ formatTime(row.created_at) }}</span>
                    </div>
                    
                    <div class="file-table-cell opl-actions">
                      <button
                        v-if="row.request_data"
                        class="opl-action-btn"
                        @click="showJsonDetail('请求数据详情', row.request_data)"
                      >
                        查看详情
                      </button>

                      <button
                        v-if="row.response_data"
                        class="opl-action-btn"
                        @click="showJsonDetail('响应数据详情', row.response_data)"
                      >
                        响应数据
                      </button>
                      <span v-if="!row.request_data && !row.response_data" class="trc-empty">-</span>
                    </div>
                  </div>
                  <div v-if="logList.length === 0" class="mission-empty">暂无记录</div>
                </template>
              </div>
            </div>

            <!-- 分页 -->
            <div class="track-pagination" style="margin-top: 16px;">
              <span class="track-pagination-info">共 {{ pagination.total }} 条</span>
              <div class="track-pagination-center">
                <button
                  class="track-pg-btn"
                  :disabled="pagination.currentPage <= 1"
                  @click="goPage(1)"
                >首页</button>
                <button
                  class="track-pg-btn"
                  :disabled="pagination.currentPage <= 1"
                  @click="goPage(pagination.currentPage - 1)"
                >上一页</button>
                <span class="track-pg-page-indicator">
                  <span class="track-pg-current">{{ pagination.currentPage }}</span>
                  <span class="track-pg-sep">/</span>
                  <span class="track-pg-total">{{ pagination.lastPage }}</span>
                </span>
                <button
                  class="track-pg-btn"
                  :disabled="pagination.currentPage >= pagination.lastPage"
                  @click="goPage(pagination.currentPage + 1)"
                >下一页</button>
                <button
                  class="track-pg-btn"
                  :disabled="pagination.currentPage >= pagination.lastPage"
                  @click="goPage(pagination.lastPage)"
                >尾页</button>
              </div>
              <span class="track-pagination-jump">
                跳转到
                <input
                  v-model.number="jumpPage"
                  type="number"
                  min="1"
                  :max="pagination.lastPage"
                  class="track-pg-jump-input"
                  @keyup.enter="handleJump"
                />
                页
                <button class="track-pg-btn" @click="handleJump">确定</button>
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- JSON 详情预览弹窗 -->
    <Teleport to="body">
      <div v-if="jsonModal.visible" class="detail-dialog-mask" @click="jsonModal.visible = false">
        <div class="detail-dialog-card" style="width: 720px; max-height: 80vh;" @click.stop>
          <div class="detail-dialog-header" style="padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #164159;">
            <span class="detail-dialog-title" style="font-size: 15px; color: #67d5fd; font-weight: bold;">{{ jsonModal.title }}</span>
            <button class="detail-dialog-close-btn" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;" @click="jsonModal.visible = false">×</button>
          </div>
          <div class="detail-dialog-body" style="padding: 20px; overflow-y: auto; flex: 1; background: #07141e;">
            <pre class="json-pre"><code>{{ jsonModal.content }}</code></pre>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { usePermissionStore } from '@/stores/permission'
import { userApi, operationLogApi } from '@/api/services'
import trackRecordIcon from '@/assets/source_data/svg_data/robot_source/track_record.svg'
import operationIcon from '@/assets/source_data/svg_data/robot_source/operation.svg'

const route = useRoute()
const router = useRouter()
const deviceStore = useDeviceStore()
const permissionStore = usePermissionStore()

// 侧边栏子页面标签
const sidebarTabs = [
  { key: 'track-record', label: '循迹记录', icon: trackRecordIcon, path: '/dashboard/alarm-log', permission: 'log-tracklog-show' },
  { key: 'operation-log', label: '操作日志', icon: operationIcon, path: '/dashboard/operation-log', permission: 'log-show' }
]

const emitPermissionDenied = (permission: string) => {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('permission-denied', {
      detail: { permission }
    }))
  }
}

const handleTabClick = (tab: { path: string; permission?: string }) => {
  if (tab.permission && !permissionStore.hasPermission(tab.permission)) {
    emitPermissionDenied(tab.permission)
    return
  }
  if (route.path !== tab.path) router.push(tab.path)
}

// 筛选字段
const filter = ref({
  userId: '',
  robotId: '',
  operationType: '',
  startTime: '',
  endTime: ''
})

const activeTimePicker = ref<'start' | 'end' | null>(null)
const displayYear = ref(new Date().getFullYear())
const displayMonth = ref(new Date().getMonth() + 1)
const pickerYear = ref(new Date().getFullYear())
const pickerMonth = ref(new Date().getMonth() + 1)
const pickerDay = ref(new Date().getDate())
const pickerHour = ref(new Date().getHours())
const pickerMinute = ref(new Date().getMinutes())
const weekLabels = ['一', '二', '三', '四', '五', '六', '日']
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 10
  const endYear = currentYear + 10
  const years: number[] = []
  for (let y = startYear; y <= endYear; y += 1) years.push(y)
  return years
})
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
const hourOptions = Array.from({ length: 24 }, (_, i) => i)
const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

interface CalendarCell {
  year: number
  month: number
  day: number
  inCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

const splitDateTimeLocal = (value: string) => {
  if (!value) return { date: '', time: '' }
  const [datePart, timePart = ''] = value.split('T')
  return { date: datePart || '', time: (timePart || '').slice(0, 5) }
}

const formatToolbarTime = (value: string) => {
  if (!value) return '年 / 月 / 日  --:--'
  const { date, time } = splitDateTimeLocal(value)
  if (!date) return '年 / 月 / 日  --:--'
  const [y, m, d] = date.split('-')
  if (!y || !m || !d) return value
  return `${y}/${m}/${d}  ${time || '--:--'}`
}

const parseDateTimeLocalValue = (value: string) => {
  const now = new Date()
  if (!value) {
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes()
    }
  }
  const [datePart = '', timePart = ''] = value.split('T')
  const [y, m, d] = datePart.split('-').map(v => Number(v))
  const [h, mm] = timePart.split(':').map(v => Number(v))
  if (!y || !m || !d) {
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes()
    }
  }
  return {
    year: y,
    month: m,
    day: d,
    hour: Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 0,
    minute: Number.isFinite(mm) ? Math.max(0, Math.min(59, mm)) : 0
  }
}

const daysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate()
}

const normalizeDayByMonth = () => {
  const maxDay = daysInMonth(pickerYear.value, pickerMonth.value)
  if (pickerDay.value > maxDay) pickerDay.value = maxDay
}

const calendarCells = computed<CalendarCell[]>(() => {
  const first = new Date(displayYear.value, displayMonth.value - 1, 1)
  const firstWeekDay = (first.getDay() + 6) % 7
  const startDate = new Date(displayYear.value, displayMonth.value - 1, 1 - firstWeekDay)
  const today = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()
  const cells: CalendarCell[] = []

  for (let i = 0; i < 42; i += 1) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    cells.push({
      year,
      month,
      day,
      inCurrentMonth: year === displayYear.value && month === displayMonth.value,
      isToday: year === todayY && month === todayM && day === todayD,
      isSelected: year === pickerYear.value && month === pickerMonth.value && day === pickerDay.value
    })
  }
  return cells
})

const assignPickerParts = (value: string) => {
  const parsed = parseDateTimeLocalValue(value)
  pickerYear.value = parsed.year
  pickerMonth.value = parsed.month
  pickerDay.value = parsed.day
  pickerHour.value = parsed.hour
  pickerMinute.value = parsed.minute
  displayYear.value = parsed.year
  displayMonth.value = parsed.month
}

const shiftDisplayMonth = (offset: number) => {
  const base = new Date(displayYear.value, displayMonth.value - 1 + offset, 1)
  displayYear.value = base.getFullYear()
  displayMonth.value = base.getMonth() + 1
}

const selectCalendarDay = (cell: CalendarCell) => {
  pickerYear.value = cell.year
  pickerMonth.value = cell.month
  pickerDay.value = cell.day
  if (cell.year !== displayYear.value || cell.month !== displayMonth.value) {
    displayYear.value = cell.year
    displayMonth.value = cell.month
  }
}

watch([displayYear, displayMonth], () => {
  pickerYear.value = displayYear.value
  pickerMonth.value = displayMonth.value
  normalizeDayByMonth()
})

watch([pickerYear, pickerMonth], () => {
  normalizeDayByMonth()
})

const composePickerDateTime = () => {
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${pickerYear.value}-${pad(pickerMonth.value)}-${pad(pickerDay.value)}T${pad(pickerHour.value)}:${pad(pickerMinute.value)}`
}

const openTimePicker = (type: 'start' | 'end') => {
  const source = type === 'start' ? filter.value.startTime : filter.value.endTime
  assignPickerParts(source)
  activeTimePicker.value = type
}

const cancelTimePicker = () => {
  activeTimePicker.value = null
}

const clearTimePicker = (type: 'start' | 'end') => {
  if (type === 'start') {
    filter.value.startTime = ''
  } else {
    filter.value.endTime = ''
  }
  activeTimePicker.value = null
}

const formatDateTimeLocal = (date: Date) => {
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const setTimeNow = (type: 'start' | 'end') => {
  const now = formatDateTimeLocal(new Date())
  assignPickerParts(now)
  const finalValue = composePickerDateTime()
  if (type === 'start') filter.value.startTime = finalValue
  else filter.value.endTime = finalValue
}

const confirmTimePicker = (type: 'start' | 'end') => {
  normalizeDayByMonth()
  const finalValue = composePickerDateTime()
  if (type === 'start') filter.value.startTime = finalValue
  else filter.value.endTime = finalValue
  activeTimePicker.value = null
}

const handleGlobalMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return
  if (!target.closest('.track-time-picker-wrap')) {
    activeTimePicker.value = null
  }
}

const users = ref<any[]>([])
const robots = computed(() => deviceStore.robots)

// 分页与数据列表
const logList = ref<any[]>([])
const loading = ref(false)
const errorMsg = ref('')
const jumpPage = ref(1)

const pagination = ref({
  total: 0,
  perPage: 10,
  currentPage: 1,
  lastPage: 1
})

// JSON 预览弹窗状态
const jsonModal = ref({
  visible: false,
  title: '数据详情',
  content: ''
})

// 加载过滤选项中的用户列表
const loadUsers = async () => {
  try {
    const res = await userApi.getUsers({ skip: 0, limit: 100 })
    users.value = res || []
  } catch (err) {
    console.error('获取用户列表失败:', err)
  }
}

// 获取操作日志列表
const fetchLogs = async (page = 1) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const params: {
      page: number
      page_size: number
      user_id?: number | string
      robot_id?: string
      operation_type?: string
      start_time?: string
      end_time?: string
    } = {
      page,
      page_size: pagination.value.perPage
    }

    if (filter.value.userId) params.user_id = Number(filter.value.userId)
    if (filter.value.robotId) params.robot_id = filter.value.robotId
    if (filter.value.operationType) params.operation_type = filter.value.operationType
    
    // 如果有时间参数，转换为后端所需的 ISO 字符串或按原样传递
    if (filter.value.startTime) {
      params.start_time = new Date(filter.value.startTime).toISOString()
    }
    if (filter.value.endTime) {
      params.end_time = new Date(filter.value.endTime).toISOString()
    }

    const res = await operationLogApi.getOperationLogs(params)
    const items = res?.items || []
    const total = res?.total || 0

    logList.value = items
    pagination.value = {
      total,
      perPage: pagination.value.perPage,
      currentPage: page,
      lastPage: Math.max(1, Math.ceil(total / pagination.value.perPage))
    }
    jumpPage.value = page
  } catch (e: any) {
    console.error('获取操作日志失败:', e)
    errorMsg.value = `加载失败：${e?.detail || e?.message || '未知错误'}`
    logList.value = []
  } finally {
    loading.value = false
  }
}

// 分页导航
const goPage = (page: number) => {
  if (page < 1 || page > pagination.value.lastPage) return
  fetchLogs(page)
}

const handleJump = () => {
  const p = Number(jumpPage.value)
  if (!isNaN(p) && p >= 1 && p <= pagination.value.lastPage) goPage(p)
}

const handleSearch = () => {
  fetchLogs(1)
}

const handleReset = () => {
  filter.value = {
    userId: '',
    robotId: '',
    operationType: '',
    startTime: '',
    endTime: ''
  }
  fetchLogs(1)
}

// 时间格式化
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  try {
    const d = new Date(timeStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch {
    return timeStr
  }
}

const formatDatePart = (timeStr: string): string => {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  } catch {
    return ''
  }
}

const formatClockPart = (timeStr: string): string => {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch {
    return ''
  }
}

const getOpTypeClass = (type: string): string => {
  if (!type) return 'op-type-default'
  if (type.includes('删') || type.toLowerCase().includes('delete') || type.toLowerCase().includes('remove')) {
    return 'op-type-danger'
  }
  if (type.includes('新') || type.includes('创') || type.includes('增') || type.includes('加') || type.toLowerCase().includes('add') || type.toLowerCase().includes('create')) {
    return 'op-type-success'
  }
  if (type.includes('改') || type.includes('更') || type.includes('修') || type.includes('编') || type.toLowerCase().includes('update') || type.toLowerCase().includes('edit') || type.toLowerCase().includes('modify')) {
    return 'op-type-warning'
  }
  return 'op-type-default'
}

// 格式化 JSON 数据展示
const showJsonDetail = (title: string, rawJsonStr: string) => {
  let content = rawJsonStr
  try {
    const parsed = JSON.parse(rawJsonStr)
    content = JSON.stringify(parsed, null, 2)
  } catch {
    // 无法解析为JSON则原样输出
  }
  jsonModal.value = {
    visible: true,
    title,
    content
  }
}

onMounted(() => {
  loadUsers()
  fetchLogs(1)
  document.addEventListener('mousedown', handleGlobalMouseDown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleGlobalMouseDown)
})
</script>

<style scoped>
@import './mission-common.css';

.mission-top-header.mission-top-header-left {
  justify-content: flex-start !important;
}

.track-toolbar-row {
  flex-wrap: wrap;
  column-gap: 12px;
  row-gap: 8px;
  padding: 4px 0;
  margin-bottom: 4px;
}

.track-toolbar-row-bottom {
  margin-top: 0;
}

.track-toolbar-group {
  display: flex;
  align-items: center;
}

.track-toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 覆盖样式，定义8列网格布局，使表格列宽更加均匀美观 */
.file-table-header,
.file-table-row {
  grid-template-columns: 80px 120px 160px 120px 1.2fr 1.5fr 180px 180px !important;
}

.opl-id,
.opl-user,
.opl-robot,
.opl-type,
.opl-desc,
.opl-ip,
.opl-time,
.opl-actions {
  justify-content: center;
  text-align: center;
}

.opl-actions {
  gap: 8px;
}
.opl-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(103, 213, 253, 0.08);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 4px;
  color: #67d5fd;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.opl-action-btn:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: #67d5fd;
  box-shadow: 0 0 8px rgba(103, 213, 253, 0.2);
}
.opl-action-btn:active {
  background: rgba(103, 213, 253, 0.3);
}

.detail-dialog-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.detail-dialog-card {
  background: #0f2434;
  border: 1px solid #164159;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.json-pre {
  background: #07141e;
  border: 1px solid #164159;
  color: #a5d6ff;
  padding: 14px;
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  overflow: auto;
  max-height: 480px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 复用循迹记录的筛选框样式 */
.track-filter-input {
  height: 32px;
  width: 160px;
  min-width: 100px;
  border-radius: 4px;
  border: 1px solid #164159;
  background-color: #0c2a3e;
  color: #fff;
  padding: 0 10px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.track-filter-input:focus {
  border-color: #16bbf2;
}
.track-filter-input::placeholder {
  color: rgba(255,255,255,0.35);
}
select.track-filter-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: #0c2a3e;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2367d5fd'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
  cursor: pointer;
}
select.track-filter-input option {
  background: #0c2a3e;
  color: #fff;
}
select.track-filter-input:hover {
  background-color: #0c4666;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2367d5fd'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

/* 复用循迹记录的分页样式 */
.track-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 4px 0;
  color: #b8c7d9;
  font-size: 13px;
  flex-shrink: 0;
}
.track-pagination-info {
  color: #b8c7d9;
  font-size: 13px;
  white-space: nowrap;
}
.track-pagination-center {
  display: flex;
  align-items: center;
  gap: 4px;
}
.track-pg-page-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-width: 70px;
  height: 28px;
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid rgba(103, 213, 253, 0.25);
  background: rgba(12, 42, 62, 0.6);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.track-pg-current {
  color: #67d5fd;
  font-weight: 600;
  min-width: 20px;
  text-align: right;
}
.track-pg-sep {
  color: rgba(103, 213, 253, 0.35);
  margin: 0 1px;
}
.track-pg-total {
  color: rgba(184, 199, 217, 0.6);
  min-width: 20px;
  text-align: left;
}
.track-pagination-pages {
  display: flex;
  gap: 4px;
}
.track-pg-btn {
  height: 28px;
  min-width: 36px;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid #164159;
  background: transparent;
  color: #b8c7d9;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.track-pg-btn:hover:not(:disabled) {
  border-color: #16bbf2;
  color: #16bbf2;
}
.track-pg-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.track-pg-btn-active {
  background: #16bbf2 !important;
  border-color: #16bbf2 !important;
  color: #fff !important;
}
.track-pagination-jump {
  display: flex;
  align-items: center;
  gap: 6px;
}
.track-pg-jump-input {
  width: 48px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 6px;
  font-size: 13px;
  text-align: center;
  outline: none;
}
.track-pg-jump-input:focus { border-color: #16bbf2; }
.track-pg-jump-input::-webkit-inner-spin-button,
.track-pg-jump-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

.track-time-picker-wrap {
  position: relative;
  width: 200px;
  min-width: 190px;
}

.track-time-trigger {
  width: 100%;
  height: 32px;
  border: 1px solid rgba(103, 213, 253, 0.35);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(12, 48, 76, 0.9) 0%, rgba(10, 38, 62, 0.92) 100%);
  color: #dff5ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(25, 103, 143, 0.25);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.track-time-trigger:hover {
  border-color: rgba(103, 213, 253, 0.55);
}

.track-time-trigger-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-time-trigger-icon {
  opacity: 0.85;
  font-size: 12px;
}

.track-time-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 1200;
  width: 332px;
  border: 1px solid rgba(103, 213, 253, 0.35);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(7, 37, 56, 0.98) 0%, rgba(8, 30, 48, 0.98) 100%);
  box-shadow: 0 14px 36px rgba(2, 10, 18, 0.6), inset 0 0 0 1px rgba(61, 135, 173, 0.16);
  padding: 12px;
}

.track-time-popover-title {
  color: #67d5fd;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.track-time-calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.track-time-calendar-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.track-time-nav-btn {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(103, 213, 253, 0.32);
  border-radius: 5px;
  background: rgba(13, 51, 74, 0.85);
  color: #bcecff;
  cursor: pointer;
  line-height: 1;
}

.track-time-mini-select {
  height: 28px;
  min-width: 82px;
  padding: 0 8px;
  border: 1px solid rgba(103, 213, 253, 0.35);
  border-radius: 6px;
  background: rgba(8, 39, 59, 0.9);
  color: #dff5ff;
  font-size: 12px;
  outline: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(103, 213, 253, 0.55) transparent;
}

.track-time-mini-select.hm {
  min-width: 94px;
}

.track-time-mini-select option {
  background: #0b2e47;
  color: #dff5ff;
}

.track-time-mini-select::-webkit-scrollbar {
  width: 8px;
}

.track-time-mini-select::-webkit-scrollbar-track {
  background: transparent;
}

.track-time-mini-select::-webkit-scrollbar-thumb {
  background: rgba(103, 213, 253, 0.55);
  border-radius: 8px;
}

.track-time-week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
  color: #95bbd1;
  font-size: 12px;
  text-align: center;
}

.track-time-day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.track-time-day-cell {
  height: 30px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: rgba(9, 41, 61, 0.78);
  color: #d7effd;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.track-time-day-cell:hover {
  border-color: rgba(103, 213, 253, 0.45);
  background: rgba(18, 67, 95, 0.88);
}

.track-time-day-cell.is-muted {
  color: rgba(162, 196, 218, 0.5);
}

.track-time-day-cell.is-today {
  border-color: rgba(106, 214, 255, 0.55);
}

.track-time-day-cell.is-active {
  border-color: rgba(131, 223, 255, 0.95);
  background: linear-gradient(180deg, rgba(60, 129, 170, 0.98) 0%, rgba(40, 101, 139, 0.98) 100%);
  color: #f2fbff;
  box-shadow: 0 0 0 1px rgba(183, 239, 255, 0.28) inset;
}

.track-time-hm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.track-time-hm-row label {
  width: 42px;
  color: #a8cde2;
  font-size: 12px;
}

.track-time-popover-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.track-time-btn {
  height: 28px;
  min-width: 54px;
  border: 1px solid rgba(103, 213, 253, 0.4);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(22, 109, 155, 0.95) 0%, rgba(17, 86, 124, 0.95) 100%);
  color: #eaf9ff;
  font-size: 12px;
  cursor: pointer;
}

.track-time-btn.ghost {
  background: rgba(12, 52, 78, 0.72);
  color: #b7d7ea;
  border-color: rgba(109, 169, 201, 0.35);
}

.opl-user-tag {
  display: inline-block;
  background: rgba(103, 213, 253, 0.08);
  color: #67d5fd;
  border: 1px solid rgba(103, 213, 253, 0.22);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
}

.opl-ip-val {
  font-family: 'Consolas', 'Courier New', monospace;
  color: #8cd6a8;
  font-size: 12px;
}

.opl-robot-tag {
  display: inline-block;
  background: rgba(250, 173, 20, 0.08);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.22);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
}

.op-type-tag {
  display: inline-block;
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
}

.op-type-default {
  background: rgba(103, 213, 253, 0.08);
  color: #67d5fd;
  border: 1px solid rgba(103, 213, 253, 0.22);
}

.op-type-danger {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.28);
}

.op-type-success {
  background: rgba(86, 211, 148, 0.08);
  color: #56d394;
  border: 1px solid rgba(86, 211, 148, 0.22);
}

.op-type-warning {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.28);
}

.opl-desc-text {
  color: #e2f1fa;
}

.trc-date-part {
  color: #7fa8c2;
  font-size: 11px;
  display: block;
  line-height: 1.4;
}

.trc-clock-part {
  color: #67d5fd;
  font-size: 13px;
  font-weight: 500;
  display: block;
  line-height: 1.4;
}

.trc-empty {
  color: rgba(255, 255, 255, 0.2);
}

.opl-time-val {
  color: #67d5fd;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}
</style>
