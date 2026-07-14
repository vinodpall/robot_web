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
                <input
                  v-model="filter.startTime"
                  type="datetime-local"
                  class="track-filter-input"
                  style="min-width: 200px;"
                />
              </div>

              <div class="track-toolbar-group">
                <span class="mission-toolbar-label">结束时间：</span>
                <input
                  v-model="filter.endTime"
                  type="datetime-local"
                  class="track-filter-input"
                  style="min-width: 200px;"
                />
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
                    <div class="file-table-cell opl-user" :title="row.username || '-'">{{ row.username || '-' }}</div>
                    <div class="file-table-cell opl-ip" :title="row.ip_address || '-'">{{ row.ip_address || '-' }}</div>
                    <div class="file-table-cell opl-robot" :title="row.robot_id || '-'">{{ row.robot_id || '-' }}</div>
                    <div class="file-table-cell opl-type" :title="row.operation_type || '-'">{{ row.operation_type || '-' }}</div>
                    <div class="file-table-cell opl-desc" :title="row.operation_desc || '-'">{{ row.operation_desc || '-' }}</div>
                    <div class="file-table-cell opl-time" :title="formatTime(row.created_at)">{{ formatTime(row.created_at) }}</div>
                    
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
import { ref, computed, onMounted } from 'vue'
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
</style>
