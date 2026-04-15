<template>
  <div class="drone-control-main">
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
    <main class="main-content">
      <div class="main-flex">
        <section class="right-panel">
          <div class="mission-top-card card">
            <div class="mission-top-header mission-top-header-left">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">循迹记录</span>
            </div>
          </div>
          <div class="mission-content-wrapper">
            <div class="mission-toolbar track-toolbar-row">
              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">地图名称：</span>
                <select v-model="filterMapName" class="mission-toolbar-select track-filter-input">
                  <option value="">全部</option>
                  <option v-for="m in mapList" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">识别项目：</span>
                <select v-model="filterContent" class="mission-toolbar-select track-filter-input">
                  <option value="">全部</option>
                  <option v-for="c in contentList" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">开始时间：</span>
                <div class="track-time-picker-wrap">
                  <button class="track-time-trigger" type="button" @click.stop="openTimePicker('start')">
                    <span class="track-time-trigger-text">{{ formatToolbarTime(startTime) }}</span>
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
                    <span class="track-time-trigger-text">{{ formatToolbarTime(endTime) }}</span>
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
              <div class="track-toolbar-actions track-toolbar-actions-right">
                <button class="mission-btn mission-btn-primary" v-permission-click-dialog="'log-tracklog-query'" @click="handleSearch">查询</button>
                <button class="mission-btn mission-btn-secondary" v-permission-click-dialog="'log-tracklog-query'" @click="handleReset">重置</button>
                <button class="mission-btn mission-btn-stop" v-permission-click-dialog="'log-tracklog-query'" @click="handleDelete">删除</button>
                <button class="mission-btn mission-btn-export" v-permission-click-dialog="'log-tracklog-export'" @click="handleExport">导出</button>
              </div>
            </div>
            <div class="mission-toolbar track-toolbar-row track-toolbar-row-bottom">
              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">循迹路线：</span>
                <select v-model="filterTrackRoute" class="mission-toolbar-select track-filter-input">
                  <option value="">全部</option>
                  <option v-for="r in filteredRouteList" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">任务组：</span>
                <select v-model="filterTaskGroup" class="mission-toolbar-select track-filter-input">
                  <option value="">全部</option>
                  <option v-for="g in taskGroupList" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
            </div>

            <div class="file-table file-table-adaptive trc-table">
              <div class="file-table-header">
                <div class="file-table-cell trc-id">id</div>
                <div class="file-table-cell trc-time">时间</div>
                <div class="file-table-cell trc-map">地图</div>
                <div class="file-table-cell trc-task">任务名称</div>
                <div class="file-table-cell trc-point">任务组</div>
                <div class="file-table-cell trc-coord">实时坐标</div>
                <div class="file-table-cell trc-item">识别项目</div>
                <div class="file-table-cell trc-result">识别结果</div>
                <div class="file-table-cell trc-desc">描述</div>
                <div class="file-table-cell trc-pic">图片</div>
              </div>
              <div class="file-table-body">
                <div v-if="loading" class="mission-loading">加载中...</div>
                <div v-else-if="errorMsg" class="mission-error">{{ errorMsg }}</div>
                <template v-else>
                  <div class="file-table-row" v-for="row in recordList" :key="row.id">
                    <div class="file-table-cell trc-id" :title="String(row.id)">{{ row.id }}</div>
                    <div class="file-table-cell trc-time" :title="formatTime(row.create_time)">
                      <span class="trc-date-part">{{ formatDatePart(row.create_time) }}</span>
                      <span class="trc-clock-part">{{ formatClockPart(row.create_time) }}</span>
                    </div>
                    <div class="file-table-cell trc-map" :title="row.map_name || '-'">
                      <span class="trc-map-text">{{ row.map_name || '-' }}</span>
                    </div>
                    <div class="file-table-cell trc-task" :title="row.tracking_route || '-'">
                      <div class="trc-task-inner">
                        <span v-if="row.tracking_route" class="trc-route-tag">{{ row.tracking_route }}</span>
                        <span v-else>-</span>
                      </div>
                    </div>
                    <div class="file-table-cell trc-point" :title="row.task_group || '-'">
                      <div class="trc-task-inner">
                        <span v-if="row.task_group" class="trc-group-tag">{{ row.task_group }}</span>
                        <span v-else>-</span>
                      </div>
                    </div>
                    <div class="file-table-cell trc-coord" :title="formatCoord(row.x, row.y, row.z)">
                      <span class="trc-coord-val">{{ formatCoord(row.x, row.y, row.z) }}</span>
                    </div>
                    <div class="file-table-cell trc-item" :title="row.content || '-'">
                      <span v-if="row.content" class="trc-item-tag">{{ row.content }}</span>
                      <span v-else>-</span>
                    </div>
                    <div class="file-table-cell trc-result" :title="getOutMessage(row).message || row.results || '-'">
                      <span v-if="getOutMessage(row).message" class="trc-result-badge">{{ getOutMessage(row).message }}</span>
                      <span v-else-if="row.results" class="trc-result-badge">{{ row.results }}</span>
                      <span v-else class="trc-empty">-</span>
                    </div>
                    <div class="file-table-cell trc-desc" :title="row.remark || '-'">{{ row.remark || '-' }}</div>
                    <div class="file-table-cell trc-pic">
                      <span v-if="!getImage(row)" class="no-image">-</span>
                      <img
                        v-else
                        :src="getThumbImage(row)!"
                        alt="识别图片"
                        class="trc-thumb-img"
                        @click="openImagePreview(getImage(row)!, row.id)"
                        @error="($event.target as HTMLImageElement).src = getImage(row)!"
                        style="cursor:pointer;"
                      />
                    </div>
                  </div>
                  <div v-if="recordList.length === 0" class="mission-empty">暂无记录</div>
                </template>
              </div>
            </div>

            <div class="track-pagination">
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

    <Teleport to="body">
      <div v-if="imgModal.visible" class="trc-img-mask" @click="closeImagePreview">
        <div class="trc-img-modal" @click.stop>
          <div class="trc-img-modal-header">
            <span>图片预览 - ID: {{ imgModal.recordId }}</span>
            <button class="trc-img-close-btn" @click="closeImagePreview">×</button>
          </div>
          <div class="trc-img-modal-body">
            <img
              v-if="!imgModal.error"
              :src="imgModal.url"
              alt="图片预览"
              class="trc-img-preview"
              @error="imgModal.error = true"
            />
            <div v-if="imgModal.error" class="trc-img-error">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="8" fill="rgba(255,107,107,0.08)"/>
                <path d="M14 34l8-10 5 6 3-4 8 8H14z" fill="rgba(255,107,107,0.25)" stroke="#ff6b6b" stroke-width="1.5" stroke-linejoin="round"/>
                <circle cx="32" cy="18" r="3" fill="rgba(255,107,107,0.4)" stroke="#ff6b6b" stroke-width="1.5"/>
                <rect x="8" y="8" width="32" height="32" rx="4" stroke="#ff6b6b" stroke-width="1.5" stroke-dasharray="4 2"/>
              </svg>
              <span>图片加载失败</span>
              <span class="trc-img-error-url">{{ imgModal.url }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <ErrorMessage
      :show="exportErrorMessage.show"
      :message="exportErrorMessage.text"
      @close="exportErrorMessage.show = false"
    />

    <ConfirmDialog
      :show="deleteConfirmDialog.show"
      title="确认删除"
      :message="deleteConfirmDialog.message"
      type="warning"
      confirm-text="确认"
      cancel-text="取消"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
      @close="deleteConfirmDialog.show = false"
    />

    <Teleport to="body">
      <div v-if="exportGenerating.show" class="export-generating-mask">
        <div class="export-generating-card">
          <span class="export-generating-spinner" />
          <span class="export-generating-text">{{ exportGenerating.text }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { usePermissionStore } from '@/stores/permission'
import { navigationApi, visionApi } from '@/api/services'
import { buildRobotHttpAssetUrl } from '@/utils/robotHttpProxy'
import ErrorMessage from '@/components/ErrorMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import trackRecordIcon from '@/assets/source_data/svg_data/robot_source/track_record.svg'

const router = useRouter()
const route = useRoute()
const deviceStore = useDeviceStore()
const permissionStore = usePermissionStore()

const getDxrBaseUrl = () => {
  const ip = deviceStore.selectedRobot?.ip_address
  return ip ? `http://${ip}:81` : ''
}

const sidebarTabs = [
  { key: 'track-record', label: '循迹记录', icon: trackRecordIcon, path: '/dashboard/alarm-log', permission: 'log-tracklog-show' }
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

const mapListTrigger = ref(0)
const mapList = computed<string[]>(() => {
  mapListTrigger.value
  try {
    const cached = localStorage.getItem('cached_map_list')
    return cached ? JSON.parse(cached) : []
  } catch {
    return []
  }
})

const routeList = ref<string[]>([])
const taskGroupList = ref<string[]>([])
const contentList = ref<string[]>([])

const filteredRouteList = computed(() => {
  if (!filterMapName.value) return routeList.value
  return routeList.value.filter(r => r.startsWith(filterMapName.value + '_'))
})

const loadFilterOptions = async () => {
  try {
    const robotIp = deviceStore.selectedRobot?.ip_address
    if (!robotIp) return
    const res = await fetch(`/api/dxr_api/get_lists?robot_ip=${encodeURIComponent(robotIp)}&field_array=content,task_group,tracking_route`)
    if (!res.ok) return
    const json = await res.json()
    const payload = json.data || {}
    const clean = (arr: string[]) => (arr || []).filter((v: string) => v !== '鍏ㄩ儴' && v !== '全部' && v !== '')
    contentList.value = clean(payload.content || [])
    routeList.value = clean(payload.tracking_route || [])
    taskGroupList.value = clean(payload.task_group || [])
  } catch (err) {
    console.error('鑾峰彇绛涢€夐」澶辫触:', err)
  }
}

const filterMapName = ref('')
const filterContent = ref('')
const filterTrackRoute = ref('')
const filterTaskGroup = ref('')
const startTime = ref('')
const endTime = ref('')
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
  const source = type === 'start' ? startTime.value : endTime.value
  assignPickerParts(source)
  activeTimePicker.value = type
}

const cancelTimePicker = () => {
  activeTimePicker.value = null
}

const clearTimePicker = (type: 'start' | 'end') => {
  if (type === 'start') {
    startTime.value = ''
  } else {
    endTime.value = ''
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
  if (type === 'start') startTime.value = finalValue
  else endTime.value = finalValue
}

const confirmTimePicker = (type: 'start' | 'end') => {
  normalizeDayByMonth()
  const finalValue = composePickerDateTime()
  if (type === 'start') startTime.value = finalValue
  else endTime.value = finalValue
  activeTimePicker.value = null
}

const handleGlobalMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return
  if (!target.closest('.track-time-picker-wrap')) {
    activeTimePicker.value = null
  }
}

watch(filterTrackRoute, () => {
  filterTaskGroup.value = ''
})

watch(filterMapName, () => {
  filterTrackRoute.value = ''
  filterTaskGroup.value = ''
})

const recordList = ref<any[]>([])
const loading = ref(false)
const errorMsg = ref('')

const pagination = ref({
  total: 0,
  perPage: 9,
  currentPage: 1,
  lastPage: 1
})
const jumpPage = ref(1)
const exportErrorMessage = ref({
  show: false,
  text: ''
})
const deleteConfirmDialog = ref({
  show: false,
  message: '',
  startTime: '',
  endTime: ''
})
const exportGenerating = ref({
  show: false,
  text: '正在生成下载文件，请稍候...'
})

const pageList = computed(() => {
  const { currentPage, lastPage } = pagination.value
  const maxShow = 5
  let start = Math.max(1, currentPage - Math.floor(maxShow / 2))
  let end = Math.min(lastPage, start + maxShow - 1)
  if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const fetchRecords = async (page = 1) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pagination.value.perPage),
      type: 'track'
    })
    if (filterMapName.value) params.append('map_name', filterMapName.value)
    if (filterContent.value) params.append('content', filterContent.value)
    if (filterTrackRoute.value) params.append('tracking_route', filterTrackRoute.value)
    if (filterTaskGroup.value) params.append('task_group', filterTaskGroup.value)
    if (startTime.value) params.append('start_create_time', String(new Date(startTime.value).getTime() / 1000))
    if (endTime.value) params.append('end_create_time', String(new Date(endTime.value).getTime() / 1000))
    const robotIp = deviceStore.selectedRobot?.ip_address
    if (robotIp) params.append('robot_ip', robotIp)

    const res = await fetch(`/api/dxr_api/getLog?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const data = json.data || {}
    recordList.value = data.data || []
    pagination.value = {
      total: data.total ?? 0,
      perPage: data.page_size ?? 9,
      currentPage: data.current_page ?? 1,
      lastPage: data.last_page ?? 1
    }
    jumpPage.value = pagination.value.currentPage
  } catch (e: any) {
    errorMsg.value = `加载失败：${e?.message || '未知错误'}`
    recordList.value = []
  } finally {
    loading.value = false
  }
}

const goPage = (page: number) => {
  if (page < 1 || page > pagination.value.lastPage) return
  fetchRecords(page)
}
const handleJump = () => {
  const p = Number(jumpPage.value)
  if (!isNaN(p) && p >= 1 && p <= pagination.value.lastPage) goPage(p)
}

const handleSearch = () => fetchRecords(1)
const handleReset = () => {
  filterMapName.value = ''
  filterContent.value = ''
  filterTrackRoute.value = ''
  filterTaskGroup.value = ''
  startTime.value = ''
  endTime.value = ''
  fetchRecords(1)
}
const handleDelete = () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    exportErrorMessage.value = { show: true, text: '删除失败：未选择机器人' }
    return
  }

  const deleteStartTime = toExportDateTime(startTime.value)
  const deleteEndTime = toExportDateTime(endTime.value)
  if (!deleteStartTime || !deleteEndTime) {
    exportErrorMessage.value = { show: true, text: '请先选择开始时间和结束时间' }
    return
  }

  deleteConfirmDialog.value = {
    show: true,
    message: `确定删除 ${deleteStartTime} 至 ${deleteEndTime} 的日志吗？`,
    startTime: deleteStartTime,
    endTime: deleteEndTime
  }
}

const confirmDelete = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    exportErrorMessage.value = { show: true, text: '删除失败：未选择机器人' }
    return
  }

  const deleteStartTime = deleteConfirmDialog.value.startTime
  const deleteEndTime = deleteConfirmDialog.value.endTime
  if (!deleteStartTime || !deleteEndTime) {
    exportErrorMessage.value = { show: true, text: '请先选择开始时间和结束时间' }
    return
  }

  deleteConfirmDialog.value.show = false
  try {
    await visionApi.deleteLogs(robotId, {
      start_time: deleteStartTime,
      end_time: deleteEndTime,
      type: 'all'
    })
    await fetchRecords(1)
  } catch (e: any) {
    const msg =
      e?.detail ||
      e?.response?.data?.message ||
      e?.response?.data?.detail ||
      e?.response?.data?.msg?.error_msg ||
      e?.msg?.error_msg ||
      e?.message ||
      '未知错误'
    exportErrorMessage.value = { show: true, text: `删除失败：${String(msg)}` }
  }
}

const cancelDelete = () => {
  deleteConfirmDialog.value.show = false
}

const resolveExportUrls = (payload: any): string[] => {
  if (!payload) return []
  if (typeof payload === 'string') return [payload]
  return [
    payload?.download_url,
    payload?.response?.data?.download_url,
    payload?.data?.url,
    payload?.data?.download_url,
    payload?.data?.file_url,
    payload?.excel_path,
    payload?.response?.data?.excel_path,
    payload?.url,
    payload?.file_url,
    payload?.msg?.result,
    payload?.response?.msg?.result
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
}

const normalizeExportUrl = (rawUrl: string): string => {
  if (!rawUrl) return ''
  const value = rawUrl.trim()
  if (!value) return ''
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return value
  return buildRobotHttpAssetUrl(robotId, 81, value)
}

const appendTokenToDownloadUrl = (downloadUrl: string): string => {
  if (!downloadUrl) return ''
  const token = localStorage.getItem('token') || ''
  if (!token) return downloadUrl

  try {
    const url = new URL(downloadUrl, window.location.origin)
    url.searchParams.set('token', token)
    return url.toString()
  } catch {
    return downloadUrl
  }
}

const triggerDownloadByUrl = (downloadUrl: string) => {
  const fileName = downloadUrl.split('?')[0].split('/').pop() || 'track_log.xlsx'
  const a = document.createElement('a')
  a.href = downloadUrl
  a.setAttribute('download', fileName)
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const showExportError = (text: string) => {
  exportErrorMessage.value = {
    show: true,
    text
  }
}

const toExportDateTime = (value: string): string => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const handleExport = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    showExportError('导出失败：未选择机器人')
    return
  }

  exportGenerating.value.show = true
  try {
    const payload = {
      map_name: filterMapName.value || '',
      content: filterContent.value || '',
      task_group: filterTaskGroup.value || '',
      tracking_route: filterTrackRoute.value || '',
      start_time: toExportDateTime(startTime.value),
      stoptime: toExportDateTime(endTime.value),
      relinfo: '',
      page_size: 100,
      page: 1
    }

    const response = await navigationApi.exportTrackLog(robotId, payload)
    const candidateUrls = resolveExportUrls(response)
      .map(normalizeExportUrl)
      .map(appendTokenToDownloadUrl)
      .filter((u, idx, arr) => !!u && arr.indexOf(u) === idx)

    if (candidateUrls.length === 0) {
      throw new Error('接口未返回下载地址')
    }

    exportGenerating.value.show = false
    let lastError: any = null
    for (const url of candidateUrls) {
      try {
        triggerDownloadByUrl(url)
        return
      } catch (err) {
        lastError = err
      }
    }
    throw lastError || new Error('下载失败')
  } catch (e: any) {
    const rawMsg =
      e?.detail ||
      e?.response?.data?.message ||
      e?.response?.data?.detail ||
      e?.response?.data?.msg?.error_msg ||
      e?.msg?.error_msg ||
      e?.message ||
      '未知错误'
    const msg = String(rawMsg)
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_CONNECTION')) {
      showExportError('导出失败：下载链接不可访问，请检查设备网络或导出服务地址')
      return
    }
    showExportError(`导出失败：${msg}`)
  } finally {
    exportGenerating.value.show = false
  }
}

const formatTime = (timestamp: number | null): string => {
  if (!timestamp) return '-'
  const ms = timestamp > 1e10 ? timestamp : timestamp * 1000
  const d = new Date(ms)
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const formatDatePart = (timestamp: number | null): string => {
  if (!timestamp) return '-'
  const ms = timestamp > 1e10 ? timestamp : timestamp * 1000
  const d = new Date(ms)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
const formatClockPart = (timestamp: number | null): string => {
  if (!timestamp) return ''
  const ms = timestamp > 1e10 ? timestamp : timestamp * 1000
  const d = new Date(ms)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatCoord = (x: number | null, y: number | null, z: number | null): string => {
  if (x == null && y == null && z == null) return '-'
  const fx = x != null ? Number(x).toFixed(2) : '-'
  const fy = y != null ? Number(y).toFixed(2) : '-'
  const fz = z != null ? Number(z).toFixed(2) : '-'
  return `${fx}, ${fy}, ${fz}`
}

const getOutMessage = (row: any): Record<string, any> => {
  const om = row?.outmessage
  if (!om) return {}
  if (typeof om === 'string') {
    try { return JSON.parse(om) } catch { return {} }
  }
  return om
}

const getImage = (row: any): string | null => {
  const img = getOutMessage(row)?.out_image
  if (!img) return null
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return null
  return buildRobotHttpAssetUrl(robotId, 81, img)
}
const getThumbImage = (row: any): string | null => {
  const original = getImage(row)
  if (!original) return null
  return original.replace(/\.(jpg|jpeg|png)(\?|$)/i, '_thumb.jpg$2')
}
const imgModal = ref({ visible: false, url: '', recordId: 0, error: false })
const openImagePreview = (url: string, id: number) => {
  imgModal.value = { visible: true, url, recordId: id, error: false }
}
const closeImagePreview = () => {
  imgModal.value.visible = false
}

const handleRobotContextRefreshed = () => {
  mapListTrigger.value++
  loadFilterOptions()
  fetchRecords(1)
}

onMounted(() => {
  loadFilterOptions()
  fetchRecords(1)
  window.addEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  document.addEventListener('mousedown', handleGlobalMouseDown)
})

onUnmounted(() => {
  window.removeEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  document.removeEventListener('mousedown', handleGlobalMouseDown)
})
</script>

<style scoped>
@import './mission-common.css';

.mission-top-header.mission-top-header-left {
  justify-content: flex-start !important;
}

.track-toolbar-row {
  flex-wrap: nowrap;
  column-gap: 12px;
  row-gap: 8px;
  padding: 4px 0;
  margin-bottom: 4px;
}

.track-toolbar-row-bottom {
  margin-top: 0;
}

.track-toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.track-toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.track-toolbar-group .mission-toolbar-label {
  width: 80px;
  min-width: 80px;
  text-align: right;
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.track-toolbar-actions-left {
  margin-left: 0;
}

.track-toolbar-actions-right {
  margin-left: auto;
}

.track-toolbar-end-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.track-toolbar-row .mission-toolbar-select {
  height: 32px;
  line-height: 32px;
  padding: 0 10px;
  font-size: 13px;
}

.track-toolbar-row .mission-btn {
  height: 32px;
  line-height: 32px;
  min-width: 72px;
  padding: 0 14px;
  font-size: 13px;
  white-space: nowrap;
}

.mission-btn-export {
  background: #2a7bd1;
  border: 1px solid #2a7bd1;
  color: #ffffff;
}

.mission-btn-export:hover {
  filter: brightness(1.05);
}

.track-time-input {
  width: 200px !important;
  min-width: 190px !important;
  max-width: 200px !important;
  height: 32px !important;
  line-height: 32px !important;
  padding: 0 34px 0 10px !important;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid rgba(103, 213, 253, 0.35) !important;
  border-radius: 6px !important;
  background: linear-gradient(180deg, rgba(12, 48, 76, 0.9) 0%, rgba(10, 38, 62, 0.92) 100%) !important;
  color: #dff5ff !important;
  box-shadow: inset 0 0 0 1px rgba(25, 103, 143, 0.25);
  color-scheme: dark;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.track-time-input:hover {
  border-color: rgba(103, 213, 253, 0.55) !important;
}

.track-time-input:focus {
  outline: none;
  border-color: #67d5fd !important;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.18), inset 0 0 0 1px rgba(25, 103, 143, 0.3);
}

.track-time-input::-webkit-datetime-edit {
  color: #dff5ff;
}

.track-time-input::-webkit-datetime-edit-fields-wrapper {
  color: #dff5ff;
}

.track-time-input::-webkit-datetime-edit-text {
  color: rgba(170, 220, 245, 0.75);
}

.track-time-input::-webkit-calendar-picker-indicator {
  opacity: 0.9;
  cursor: pointer;
  filter: brightness(1.2) saturate(0.8) hue-rotate(165deg);
  margin-right: -4px;
}

.track-time-input::-webkit-clear-button,
.track-time-input::-webkit-inner-spin-button {
  display: none;
}

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

.alarm-input {
  height: 32px;
  border-radius: 4px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
}
.alarm-input:focus {
  outline: none;
  border: 1.5px solid #16bbf2;
  box-shadow: 0 0 0 2px rgba(22,187,242,0.15);
}
.custom-select-wrapper {
  position: relative;
  display: inline-block;
  min-width: 140px;
  max-width: 180px;
  width: 100%;
  vertical-align: middle;
  flex-shrink: 0;
}
.custom-select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 2;
}
.mission-select {
  background: transparent !important;
  background-color: transparent !important;
  width: 100%;
  min-width: 140px;
  max-width: 180px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #164159;
  color: #fff;
  font-size: 14px;
  padding: 0 12px;
  padding-right: 30px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-sizing: border-box;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
}
.mission-select:focus {
  outline: none;
  border: 1.5px solid #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}
.mission-select::-ms-expand {
  display: none;
}
.mission-select::-webkit-select-placeholder {
  display: none;
}
.mission-select::-moz-select-placeholder {
  display: none;
}
.mission-select::-webkit-inner-spin-button,
.mission-select::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.mission-select::-webkit-calendar-picker-indicator {
  display: none;
}
.mission-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
.custom-select-wrapper::after {
  display: none !important;
}
.mission-select option {
  background: #172233;
  color: #fff;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-right: 24px;
}
.filter-label {
  color: #b8c7d9;
  font-size: 14px;
  min-width: 64px;
  white-space: nowrap;
  flex-shrink: 0;
}
.mission-btn {
  min-width: 72px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  margin-left: 12px;
}
.mission-top-row {
  gap: 24px;
}
.mission-th:last-child,
.mission-td:last-child {
  min-width: 220px;
  max-width: 320px;
  text-align: center;
  padding-left: 16px;
  padding-right: 16px;
}

.level-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.level-0 {
  background: rgba(103, 213, 253, 0.15);
  color: #67d5fd;
  border: 1px solid rgba(103, 213, 253, 0.3);
}
.level-1 {
  background: rgba(250, 173, 20, 0.18);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.35);
}
.level-2 {
  background: rgba(255, 107, 107, 0.22);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.35);
}

.mission-btn-reset {
  background: #232b3a;
  color: #fff;
  border: 1px solid #232b3a;
}
.mission-btn-reset:hover {
  background: #2d3648;
  color: #fff;
}

.track-records-table-wrap {
  overflow-x: auto;
  min-width: 0;
  width: 100%;
}
.trc-table .file-table-header,
.trc-table .file-table-row {
  display: flex !important;
  flex-wrap: nowrap !important;
  grid-template-columns: unset !important;
  width: 100%;
  min-width: 900px;
  box-sizing: border-box;
}
.trc-table .file-table-body {
  overflow-x: hidden;
  overflow-y: auto;
}
.trc-table.file-table-adaptive .file-table-row {
  flex: 0 0 calc(100% / 9) !important;
  height: auto;
  min-height: 36px;
}

.trc-id        { flex: 0 0 65px;  min-width: 65px;  text-align: center; }
.trc-time      { flex: 0.7 1 0;   min-width: 110px; text-align: center; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 1px; }
.trc-map       { flex: 1 1 0;     min-width: 80px;  text-align: center; }
.trc-task      { flex: 1.8 1 0;   min-width: 120px; text-align: center; display: flex !important; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
.trc-point     { flex: 1 1 0;     min-width: 80px;  text-align: center; }
.trc-coord     { flex: 1 1 0;     min-width: 90px;  text-align: center; }
.trc-item      { flex: 1 1 0;     min-width: 80px;  text-align: center; }
.trc-result    { flex: 0.8 1 0;   min-width: 70px;  text-align: center; }
.trc-desc      { flex: 2 1 0;     min-width: 100px; text-align: center; }
.trc-pic       { flex: 0 0 80px;  min-width: 80px;  padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: visible; }
.file-table-row .trc-pic {
  justify-content: center !important;
  padding: 0 !important;
}
.trc-thumb-img {
  max-width: 48px;
  max-height: 34px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
  border: 1px solid #164159;
  display: block;
  margin: 0 auto;
}
.trc-thumb-img:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(103, 213, 253, 0.3);
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
.trc-map-text {
  color: #9ec8e0;
  font-size: 12px;
}
.trc-task-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
}
.trc-route-tag {
  display: inline-block;
  max-width: 95%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(103, 213, 253, 0.08);
  color: #67d5fd;
  border: 1px solid rgba(103, 213, 253, 0.22);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 11px;
  line-height: 1.5;
}
.trc-group-tag {
  display: inline-block;
  max-width: 95%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(86, 211, 148, 0.08);
  color: #56d394;
  border: 1px solid rgba(86, 211, 148, 0.22);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 11px;
  line-height: 1.5;
}
.trc-point-tag {
  display: inline-block;
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.28);
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 12px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trc-coord-val {
  font-family: 'Consolas', 'Courier New', monospace;
  color: #8cd6a8;
  font-size: 12px;
  letter-spacing: 0.2px;
}
.trc-item-tag {
  display: inline-block;
  color: #9ec3f0;
  font-size: 12px;
  background: rgba(100, 160, 240, 0.08);
  border: 1px solid rgba(100, 160, 240, 0.2);
  border-radius: 3px;
  padding: 1px 6px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trc-result-badge {
  display: inline-block;
  background: rgba(255, 143, 100, 0.12);
  color: #ff9f6b;
  border: 1px solid rgba(255, 143, 100, 0.28);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 11px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trc-empty {
  color: rgba(255,255,255,0.2);
}

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

.trc-img-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.72);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trc-img-modal {
  background: #132030;
  border: 1px solid #1e3a4f;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.trc-img-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #1e3a4f;
  color: #e0f0ff;
  font-size: 14px;
}
.trc-img-close-btn {
  background: none;
  border: none;
  color: #b8c7d9;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}
.trc-img-close-btn:hover { color: #fff; }
.trc-img-modal-body {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.trc-img-preview {
  max-width: 80vw;
  max-height: 70vh;
  border-radius: 4px;
}
.trc-img-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #ff6b6b;
  font-size: 14px;
  padding: 24px;
}
.trc-img-error-url {
  font-size: 11px;
  color: rgba(255,107,107,0.55);
  word-break: break-all;
  max-width: 360px;
  text-align: center;
}

.export-generating-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-generating-card {
  min-width: 280px;
  max-width: 420px;
  padding: 18px 22px;
  border-radius: 10px;
  border: 1px solid rgba(103, 213, 253, 0.32);
  background: #132030;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  gap: 10px;
}

.export-generating-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(103, 213, 253, 0.3);
  border-top-color: #67d5fd;
  animation: export-spin 0.8s linear infinite;
  flex: 0 0 auto;
}

.export-generating-text {
  color: #e9f7ff;
  font-size: 14px;
  line-height: 1.4;
}

@keyframes export-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

