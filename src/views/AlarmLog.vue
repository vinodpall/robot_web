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
          @click="handleTabClick(tab.path)"
        >
          <img :src="tab.icon" :alt="tab.label" />
        </div>
      </div>
    </aside>
    <!-- 主体内容区 -->
    <main class="main-content">
      <div class="main-flex">
        <section class="right-panel">
          <!-- 标题区 -->
          <div class="mission-top-card card">
            <div class="mission-top-header mission-top-header-left">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">循迹记录</span>
            </div>
          </div>
          <!-- 列表区 -->
          <div class="mission-content-wrapper">
            <!-- 工具栏第一行 -->
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
                <input
                  v-model="startTime"
                  type="datetime-local"
                  class="mission-toolbar-select track-time-input"
                  ref="startTimeInput"
                  @click="openStartTimePicker"
                />
              </div>
              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">结束时间：</span>
                <input
                  v-model="endTime"
                  type="datetime-local"
                  class="mission-toolbar-select track-time-input"
                  ref="endTimeInput"
                  @click="openEndTimePicker"
                />
              </div>
              <div class="track-toolbar-actions track-toolbar-actions-right">
                <button class="mission-btn mission-btn-primary" @click="handleSearch">查询</button>
                <button class="mission-btn mission-btn-secondary" @click="handleReset">重置</button>
                <button class="mission-btn mission-btn-stop" @click="handleDelete">删除</button>
                <button class="mission-btn mission-btn-export" @click="handleExport">导出</button>
              </div>
            </div>
            <!-- 工具栏第二行 -->
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

            <!-- 表格 -->
            <div class="file-table file-table-adaptive trc-table">
              <div class="file-table-header">
                <div class="file-table-cell trc-id">id</div>
                <div class="file-table-cell trc-time">时间</div>
                <div class="file-table-cell trc-map">地图</div>
                <div class="file-table-cell trc-task">任务表</div>
                <div class="file-table-cell trc-point">任务点</div>
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
                    <div class="file-table-cell trc-id">{{ row.id }}</div>
                    <div class="file-table-cell trc-time">{{ formatTime(row.create_time) }}</div>
                    <div class="file-table-cell trc-map">{{ row.map_name || '-' }}</div>
                    <div class="file-table-cell trc-task">{{ row.task_id || '-' }}</div>
                    <div class="file-table-cell trc-point">{{ row.task_point || '-' }}</div>
                    <div class="file-table-cell trc-coord">{{ formatCoord(row.x, row.y) }}</div>
                    <div class="file-table-cell trc-item">{{ row.content || '-' }}</div>
                    <div class="file-table-cell trc-result">{{ row.results || '-' }}</div>
                    <div class="file-table-cell trc-desc">{{ row.description || '-' }}</div>
                    <div class="file-table-cell trc-pic">
                      <button
                        v-if="getImage(row)"
                        class="mission-btn mission-btn-secondary trc-pic-btn"
                        @click="openImagePreview(getImage(row)!, row.id)"
                      >查看</button>
                      <span v-else>-</span>
                    </div>
                  </div>
                  <div v-if="recordList.length === 0" class="mission-empty">暂无记录</div>
                </template>
              </div>
            </div>

            <!-- 分页栏 -->
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

    <!-- 图片预览弹窗 -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentEnvironment } from '@/config/environment'
import trackRecordIcon from '@/assets/source_data/svg_data/robot_source/track_record.svg'

const router = useRouter()
const route = useRoute()

const dxrBaseUrl = getCurrentEnvironment() === 'internet'
  ? 'http://10.10.1.3:81'
  : 'http://172.16.88.152:81'

// ---- 侧边栏 ----
const sidebarTabs = [
  { key: 'track-record', label: '循迹记录', icon: trackRecordIcon, path: '/dashboard/alarm-log' }
]
const handleTabClick = (path: string) => {
  if (route.path !== path) router.push(path)
}

// ---- 地图列表（从 localStorage 缓存读取） ----
const mapList = computed<string[]>(() => {
  try {
    const cached = localStorage.getItem('cached_map_list')
    return cached ? JSON.parse(cached) : []
  } catch {
    return []
  }
})

// ---- 路线列表 ----
const routeList = ref<string[]>([])
const taskGroupList = ref<string[]>([])
const contentList = ref<string[]>([])

// 根据选中地图名称过滤路线（路线名格式：{地图名}_{路线名}）
const filteredRouteList = computed(() => {
  if (!filterMapName.value) return routeList.value
  return routeList.value.filter(r => r.startsWith(filterMapName.value + '_'))
})

const loadFilterOptions = async () => {
  try {
    const res = await fetch('/api/dxr_api/get_lists')
    if (!res.ok) return
    const data = await res.json()
    const clean = (arr: string[]) => (arr || []).filter((v: string) => v !== '全部')
    contentList.value = clean(data.content || [])
    routeList.value = clean(data.tracking_route || [])
    taskGroupList.value = clean(data.task_group || [])
  } catch (err) {
    console.error('获取筛选项失败:', err)
  }
}

// ---- 筛选条件 ----
const filterMapName = ref('')
const filterContent = ref('')
const filterTrackRoute = ref('')
const filterTaskGroup = ref('')
const startTime = ref('')
const endTime = ref('')
const startTimeInput = ref<HTMLInputElement | null>(null)
const endTimeInput = ref<HTMLInputElement | null>(null)
const openStartTimePicker = () => { startTimeInput.value?.showPicker?.(); startTimeInput.value?.focus() }
const openEndTimePicker = () => { endTimeInput.value?.showPicker?.(); endTimeInput.value?.focus() }

// 路线变化时重置任务组选择
watch(filterTrackRoute, () => {
  filterTaskGroup.value = ''
})

// 地图变化时重置路线和任务组
watch(filterMapName, () => {
  filterTrackRoute.value = ''
  filterTaskGroup.value = ''
})

// ---- 列表数据 ----
const recordList = ref<any[]>([])
const loading = ref(false)
const errorMsg = ref('')

// ---- 分页状态 ----
const pagination = ref({
  total: 0,
  perPage: 9,
  currentPage: 1,
  lastPage: 1
})
const jumpPage = ref(1)

// 生成页码列表（最多显示5个）
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

// ---- 获取列表 ----
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

// ---- 分页操作 ----
const goPage = (page: number) => {
  if (page < 1 || page > pagination.value.lastPage) return
  fetchRecords(page)
}
const handleJump = () => {
  const p = Number(jumpPage.value)
  if (!isNaN(p) && p >= 1 && p <= pagination.value.lastPage) goPage(p)
}

// ---- 工具栏操作 ----
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
const handleDelete = () => console.log('删除')
const handleExport = () => console.log('导出')

// ---- 辅助函数 ----
const formatTime = (timestamp: number | null): string => {
  if (!timestamp) return '-'
  const ms = timestamp > 1e10 ? timestamp : timestamp * 1000
  const d = new Date(ms)
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const formatCoord = (x: number | null, y: number | null): string => {
  if (x == null && y == null) return '-'
  return `(${x ?? '-'}, ${y ?? '-'})`
}

const getImage = (row: any): string | null => {
  const img = row?.outmessage?.out_image
  if (!img) return null
  // 已是完整URL则直接返回
  if (img.startsWith('http://') || img.startsWith('https://')) return img
  return dxrBaseUrl + (img.startsWith('/') ? img : '/' + img)
}

// ---- 图片预览 ----
const imgModal = ref({ visible: false, url: '', recordId: 0, error: false })
const openImagePreview = (url: string, id: number) => {
  imgModal.value = { visible: true, url, recordId: id, error: false }
}
const closeImagePreview = () => {
  imgModal.value.visible = false
}

onMounted(() => {
  loadFilterOptions()
  fetchRecords(1)
})
</script>

<style scoped>
@import './mission-common.css';

/* 循迹记录标题左对齐 */
.mission-top-header.mission-top-header-left {
  justify-content: flex-start !important;
}

/* 工具栏布局优化 */
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
  width: 165px !important;
  min-width: 150px !important;
  max-width: 165px !important;
  padding-right: 18px;
  box-sizing: border-box;
}

.track-time-input::-webkit-calendar-picker-indicator {
  opacity: 0;
  cursor: pointer;
  position: absolute;
  right: 8px;
}

.track-time-input {
  -webkit-appearance: none;
  appearance: none;
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
/* 隐藏所有浏览器的默认下拉箭头 */
.mission-select::-ms-expand {
  display: none;
}
.mission-select::-webkit-select-placeholder {
  display: none;
}
.mission-select::-moz-select-placeholder {
  display: none;
}
/* 针对不同浏览器的额外隐藏规则 */
.mission-select::-webkit-inner-spin-button,
.mission-select::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.mission-select::-webkit-calendar-picker-indicator {
  display: none;
}
/* 确保在Safari中也不显示默认箭头 */
.mission-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
/* 覆盖mission-common.css中的::after伪元素，移除重复箭头 */
.custom-select-wrapper::after {
  display: none !important;
}
/* 保证下拉菜单（option）背景色不变 */
.mission-select option {
  background: #172233;
  color: #fff;
}
/* 筛选项布局 */
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-right: 24px; /* 增加右侧间距，从16px改为24px */
}
.filter-label {
  color: #b8c7d9;
  font-size: 14px;
  min-width: 64px;
  white-space: nowrap;
  flex-shrink: 0;
}
/* 按钮样式优化 */
.mission-btn {
  min-width: 72px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  margin-left: 12px; /* 增加左侧间距，从8px改为12px */
}
/* 调整mission-top-row的间距 */
.mission-top-row {
  gap: 24px; /* 增加整体间距，从20px改为24px */
}
/* 其余 alarm-xxx 样式已移除，统一复用 mission-common.css */
.mission-th:last-child,
.mission-td:last-child {
  min-width: 220px;
  max-width: 320px;
  text-align: center;
  padding-left: 16px;
  padding-right: 16px;
}

/* 等级徽章样式 */
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

/* 重置按钮样式 */
.mission-btn-reset {
  background: #232b3a;
  color: #fff;
  border: 1px solid #232b3a;
}
.mission-btn-reset:hover {
  background: #2d3648;
  color: #fff;
}

/* ---- 循迹记录表格列宽：覆盖 mission-common.css 中的 grid 布局，改为 flex 均等分布 ---- */
.track-records-table-wrap {
  overflow-x: auto;
  min-width: 0;
  width: 100%;
}
/* 强制覆盖 mission-common.css 中 .file-table-header / .file-table-row 的 grid */
.trc-table .file-table-header,
.trc-table .file-table-row {
  display: flex !important;
  flex-wrap: nowrap !important;
  grid-template-columns: unset !important;
  width: 100%;
  min-width: 900px;
  box-sizing: border-box;
}
/* body 允许横向滚动，纵向由 file-table-adaptive 控制 */
.trc-table .file-table-body {
  overflow-x: hidden;
  overflow-y: auto;
}
/* 覆盖为 9 行自适应：每行占表体 1/9 高度 */
.trc-table.file-table-adaptive .file-table-row {
  flex: 0 0 calc(100% / 9) !important;
  height: auto;
  min-height: 36px;
}

/* id列固定窄宽，其余列均等 flex:1 */
.trc-id        { flex: 0 0 55px;  min-width: 55px;  text-align: center; }
.trc-time      { flex: 1 1 0;     min-width: 120px; text-align: center; }
.trc-map       { flex: 1 1 0;     min-width: 80px;  text-align: center; }
.trc-task      { flex: 1.2 1 0;   min-width: 100px; text-align: center; }
.trc-point     { flex: 1 1 0;     min-width: 80px;  text-align: center; }
.trc-coord     { flex: 1 1 0;     min-width: 90px;  text-align: center; }
.trc-item      { flex: 1 1 0;     min-width: 80px;  text-align: center; }
.trc-result    { flex: 1 1 0;     min-width: 80px;  text-align: center; }
.trc-desc      { flex: 2 1 0;     min-width: 100px; text-align: center; }
.trc-pic       { flex: 0 0 80px;  min-width: 80px;  padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: visible; }
/* 数据行的图片列：居中对齐 */
.file-table-row .trc-pic {
  justify-content: center !important;
  padding: 0 !important;
}
/* 查看按钮向左偏移 */
.trc-pic-btn {
  margin-right: 18px !important;
}



/* 图片查看按钮 */
.trc-pic-btn {
  min-width: 52px !important;
  width: 52px !important;
  padding: 0 !important;
  height: 26px !important;
  font-size: 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
  flex-shrink: 0;
}

/* 筛选输入框 */
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
/* select 专属：隐藏原生箭头，添加自定义箭头 */
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

/* ---- 分页栏 ---- */
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

/* ---- 图片预览弹窗 ---- */
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
</style>
