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
              <select class="mission-toolbar-select" style="min-width: 180px;">
                <option value="">多任务组-001</option>
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
            <div class="file-table">
              <div class="file-table-header">
                <div class="file-table-cell" style="width: 80px;">序号</div>
                <div class="file-table-cell">地图</div>
                <div class="file-table-cell">轨迹</div>
                <div class="file-table-cell">任务组</div>
                <div class="file-table-cell">圈数</div>
                <div class="file-table-cell">避障模式</div>
                <div class="file-table-cell">原点发布</div>
                <div class="file-table-cell file-table-action" style="width: 240px;">操作</div>
              </div>
              <div v-if="loading" class="mission-loading">
                加载中...
              </div>
              <div v-else-if="taskGroups.length === 0" class="mission-empty">
                暂无任务组数据
              </div>
              <template v-else>
                <div class="file-table-row" v-for="taskGroup in taskGroups" :key="taskGroup.id">
                  <div class="file-table-cell" style="width: 80px;">{{ taskGroup.index ?? taskGroup.id ?? '-' }}</div>
                  <div class="file-table-cell">{{ taskGroup.mapName || '-' }}</div>
                  <div class="file-table-cell">{{ taskGroup.trackName || '-' }}</div>
                  <div class="file-table-cell">{{ taskGroup.groupName || taskGroup.name || '-' }}</div>
                  <div class="file-table-cell">{{ taskGroup.laps || '-' }}</div>
                  <div class="file-table-cell">{{ taskGroup.obstacleMode || '-' }}</div>
                  <div class="file-table-cell">{{ taskGroup.originPublish || '-' }}</div>
                  <div class="file-table-cell file-table-action" style="width: 240px;">
                    <button class="mission-btn mission-btn-secondary" @click="handleEditTaskGroup(taskGroup)">编辑</button>
                    <button class="mission-btn mission-btn-secondary" @click="handleDeleteTaskGroup">删除</button>
                    <button class="mission-btn mission-btn-secondary">上移</button>
                    <button class="mission-btn mission-btn-secondary">下移</button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import trackListIcon from '@/assets/source_data/svg_data/track_list.svg'
import taskAutoIcon from '@/assets/source_data/svg_data/robot_source/task_auto.svg'
import taskTimeIcon from '@/assets/source_data/svg_data/robot_source/task_time.svg'
import taskMultiIcon from '@/assets/source_data/svg_data/robot_source/task_multi.svg'

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
const taskGroups = ref<any[]>([])
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
  setTimeout(() => {
    // 模拟数据加载
    taskGroups.value = []
    loading.value = false
  }, 500)
})
</script>

<style>
@import './mission-common.css';

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
</style>
