<template>
  <div class="drone-control-main">
    <!-- 侧边栏菜单 -->
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: route.path === tab.path }]"
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
              <span class="mission-top-title">多任务组任务</span>
            </div>
          </div>
          <div class="mission-content-wrapper">
            <div class="mission-toolbar">
              <span class="mission-toolbar-label" style="margin-right: -8px;">多任务组名称：</span>
              <select v-model="selectedMultiTaskName" class="mission-toolbar-select" style="min-width: 180px;">
                <option v-if="multiTaskList.length === 0" value="">暂无任务组</option>
                <option v-for="group in multiTaskList" :key="group.multitask_id" :value="group.multitask_name">
                  {{ group.multitask_name }}
                </option>
              </select>

              <div style="display: flex; gap: 12px; margin-left: 8px;">
                <button class="mission-btn mission-btn-primary" @click="handleExecuteTaskGroup">开始</button>
                <button class="mission-btn mission-btn-secondary">暂停</button>
                <button class="mission-btn mission-btn-primary" @click="handleCreateTaskGroup">添加多任务组</button>
                <button class="mission-btn mission-btn-stop" @click="handleDeleteTaskGroup">删除多任务组</button>
                <button class="mission-btn mission-btn-primary">添加任务组</button>
              </div>

              <label class="mission-toolbar-label" style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" v-model="exceptionStart" />
                异常时原地启动
              </label>
            </div>
            <div class="file-table" style="min-height: 600px;">
              <div class="file-table-header" style="height: 50px !important; min-height: 44px !important; align-items: center; display: flex;">
                <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">序号</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">地图</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">轨迹</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">任务组</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">圈数</div>
                <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center; display: flex; align-items: center; justify-content: center;">避障模式</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">原点发布</div>
                <div class="file-table-cell file-table-action" style="min-width: 360px; width: 360px; text-align: center; display: flex; align-items: center; justify-content: center;">操作</div>
              </div>
              <div v-if="loading" class="mission-loading">
                加载中...
              </div>
              <div v-else-if="taskGroups.length === 0" class="mission-empty">
                暂无任务组数据
              </div>
              <template v-else>
                <div class="file-table-row" v-for="(task, index) in currentTaskGroupList" :key="index" style="min-height: 60px; display: flex;">
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">{{ index + 1 }}</div>
                  <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.map_name || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.task_name || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.task_pointname || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.circle || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.obs_mode || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.is_origin_publish === 1 ? '是' : '否' }}</div>
                  <div class="file-table-cell file-table-action" style="min-width: 360px; width: 360px; text-align: center; display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="action-btn action-btn-edit" @click="handleEditTaskGroup(task)">
                      <img :src="editIcon" alt="编辑" />
                      编辑
                    </button>
                    <button class="action-btn action-btn-delete" @click="handleDeleteTaskGroup">
                      <img :src="deleteIcon" alt="删除" />
                      删除
                    </button>
                    <button class="action-btn action-btn-secondary" style="padding: 0 8px; color: #67d5fd;">
                      <img :src="upIcon" alt="上移" style="width: 14px; height: 14px;" />
                      上移
                    </button>
                    <button class="action-btn action-btn-secondary" style="padding: 0 8px; color: #67d5fd;">
                      <img :src="downIcon" alt="下移" style="width: 14px; height: 14px;" />
                      下移
                    </button>
                  </div>
                </div>
              </template>
              <!-- 始终显示固定的空行以保持表格边框（补足到10行） -->
              <div class="file-table-row" v-for="i in Math.max(0, 10 - currentTaskGroupList.length)" :key="'empty-' + i" style="min-height: 60px; display: flex;">
                <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;"></div>
                <div class="file-table-cell file-table-action" style="min-width: 360px; width: 360px; text-align: center;"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import trackListIcon from '@/assets/source_data/svg_data/track_list.svg'
import taskAutoIcon from '@/assets/source_data/svg_data/robot_source/task_auto.svg'
import taskTimeIcon from '@/assets/source_data/svg_data/robot_source/task_time.svg'
import taskMultiIcon from '@/assets/source_data/svg_data/robot_source/task_multi.svg'
import editIcon from '@/assets/source_data/svg_data/robot_source/edit.png'
import deleteIcon from '@/assets/source_data/svg_data/robot_source/delete.png'
import upIcon from '@/assets/source_data/svg_data/robot_source/up.png'
import downIcon from '@/assets/source_data/svg_data/robot_source/down.png'

const router = useRouter()
const route = useRoute()

const sidebarTabs = [
  { key: 'list', label: '循迹任务', icon: trackListIcon, path: '/dashboard/mission' },
  { key: 'records', label: '发布点任务', icon: taskAutoIcon, path: '/dashboard/mission-records' },
  { key: 'logs', label: '定时循迹任务', icon: taskTimeIcon, path: '/dashboard/mission-logs' },
  { key: 'multi', label: '多任务组任务', icon: taskMultiIcon, path: '/dashboard/multi-task-group' }
]

const handleTabClick = (tab: any) => {
  if (route.path !== tab.path) {
    router.push(tab.path)
  }
}

const loading = ref(false)
const multiTaskList = ref<any[]>([])
const selectedMultiTaskName = ref('')
const currentTaskGroupList = ref<any[]>([])

// Deprecated taskGroups ref, using computed or updated currentTaskGroupList
// const taskGroups = ref<any[]>([])
const taskGroups = computed(() => currentTaskGroupList.value) // For template compatibility logic check
const exceptionStart = ref(false)

const getStatusClass = (status: string) => {
  const statusMap: Record<string, string> = {
    '活跃': 'status-active',
    '已完成': 'status-success',
    '进行中': 'status-running',
    '暂停': 'status-paused',
    '失败': 'status-failed'
  }
  return statusMap[status] || 'status-inactive'
}

const handleCreateTaskGroup = () => {
  console.log('创建任务组')
  // TODO: 实现创建任务组逻辑
}

const handleDeleteTaskGroup = () => {
  console.log('删除任务组')
  // TODO: 实现删除任务组逻辑
}

const handleExecuteTaskGroup = () => {
  console.log('执行任务组')
  // TODO: 实现执行任务组逻辑
}

const handleEditTaskGroup = (taskGroup: any) => {
  console.log('编辑任务组', taskGroup)
  // TODO: 实现编辑任务组逻辑
}

onMounted(() => {
  // 初始化加载任务组数据
  loading.value = true
  
  try {
    const cachedData = localStorage.getItem('cached_multi_task_list')
    if (cachedData) {
      const parsedData = JSON.parse(cachedData)
      if (Array.isArray(parsedData)) {
        multiTaskList.value = parsedData
        // Default select first one
        if (multiTaskList.value.length > 0) {
          selectedMultiTaskName.value = multiTaskList.value[0].multitask_name
        }
      }
    }
  } catch (e) {
    console.error('加载缓存多任务组数据失败', e)
  } finally {
    loading.value = false
  }
})

watch(selectedMultiTaskName, (newVal) => {
  if (!newVal) {
    currentTaskGroupList.value = []
    return
  }
  const selectedGroup = multiTaskList.value.find(item => item.multitask_name === newVal)
  if (selectedGroup && selectedGroup.multitask_list) {
    currentTaskGroupList.value = selectedGroup.multitask_list
  } else {
    currentTaskGroupList.value = []
  }
}, { immediate: true })
</script>

<style>
@import './mission-common.css';

/* Fix potential whitespace issue */
.file-table-row {
  width: 100%;
}

/* 多任务组标题左对齐 */
.mission-top-header.mission-top-header-left {
  justify-content: flex-start !important;
}

/* 多任务组特定样式 */
.status-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.status-active {
  background: rgba(103, 213, 253, 0.2);
  color: #67d5fd;
  border: 1px solid rgba(103, 213, 253, 0.3);
}

.status-success {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.status-running {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
  border: 1px solid rgba(64, 158, 255, 0.3);
}

.status-paused {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
  border: 1px solid rgba(230, 162, 60, 0.3);
}

.status-failed {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.status-inactive {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
  border: 1px solid rgba(144, 147, 153, 0.3);
}

/* 列表操作按钮样式 */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding: 0 8px;
  min-width: auto;
}

.action-btn img {
  width: 14px;
  height: 14px;
}

.action-btn-edit {
  color: #67d5fd;
}

.action-btn-edit img {
  filter: drop-shadow(0 0 4px rgba(103, 213, 253, 0.4));
}

.action-btn-delete {
  color: #ff4d4f;
}

.action-btn-delete img {
  filter: drop-shadow(0 0 4px rgba(255, 77, 79, 0.4));
}

/* Override grid layout from mission-common.css */
.file-table-header,
.file-table-row {
  display: flex !important;
  width: 100%;
}
</style>
