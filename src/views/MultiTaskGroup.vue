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
                <button class="mission-btn mission-btn-secondary" @click="handlePauseMultiTask">暂停</button>
                <button class="mission-btn mission-btn-primary" @click="handleCreateTaskGroup">添加多任务组</button>
                <button class="mission-btn mission-btn-stop" @click="handleDeleteTaskGroup">删除多任务组</button>
                <button class="mission-btn mission-btn-primary" @click="handleAddTaskGroup">添加任务组</button>
              </div>

              <label class="mission-toolbar-label" style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" v-model="exceptionStart" />
                异常时原地启动
              </label>
            </div>
            <div class="file-table file-table-adaptive">
              <div class="file-table-header">
                <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">序号</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">地图</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">轨迹</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">任务组</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">圈数</div>
                <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center; display: flex; align-items: center; justify-content: center;">避障模式</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">原点发布</div>
                <div class="file-table-cell file-table-action" style="min-width: 360px; width: 360px; text-align: center; display: flex; align-items: center; justify-content: center;">操作</div>
              </div>
              <div class="file-table-body">
                <div v-if="loading" class="mission-loading">
                  加载中...
                </div>
                <div v-else-if="multiTaskList.length === 0" class="mission-empty">
                  暂无任务组数据
                </div>
                <template v-else>
                <div class="file-table-row" v-for="(task, index) in currentTaskGroupList" :key="index">
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">{{ index + 1 }}</div>
                  <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.map_name }}</div>
                  <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.task_type === 'task' ? '发布点任务' : task.task_name }}</div>
                  <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.task_pointname }}</div>
                  <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.circle }}</div>
                  <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.obs_mode }}</div>
                  <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">{{ task.is_origin_publish === 1 ? '是' : '否' }}</div>
                  <div class="file-table-cell file-table-action" style="min-width: 360px; width: 360px; text-align: center; display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="action-btn action-btn-edit" @click="handleEditTaskGroup(task)">
                      <img :src="editIcon" alt="编辑" />
                      编辑
                    </button>
                    <button class="action-btn action-btn-delete" @click="handleDeleteTask(task)">
                      <img :src="deleteIcon" alt="删除" />
                      删除
                    </button>
                    <button class="action-btn action-btn-secondary" style="padding: 0 8px; color: #67d5fd;" @click="handleMoveTask(task, 'up')">
                      <img :src="upIcon" alt="上移" style="width: 14px; height: 14px;" />
                      上移
                    </button>
                    <button class="action-btn action-btn-secondary" style="padding: 0 8px; color: #67d5fd;" @click="handleMoveTask(task, 'down')">
                      <img :src="downIcon" alt="下移" style="width: 14px; height: 14px;" />
                      下移
                    </button>
                  </div>
                </div>
              </template>
              <!-- 始终显示固定的空行以保持表格边框（补足到10行） -->
              <div class="file-table-row" v-for="i in Math.max(0, 10 - currentTaskGroupList.length)" :key="'empty-' + i">
                <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;">&nbsp;</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center;">&nbsp;</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center;">&nbsp;</div>
                <div class="file-table-cell" style="min-width: 100px; flex: 1; text-align: center;">&nbsp;</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;">&nbsp;</div>
                <div class="file-table-cell" style="min-width: 160px; width: 160px; text-align: center;">&nbsp;</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;">&nbsp;</div>
                <div class="file-table-cell file-table-action" style="min-width: 360px; width: 360px; text-align: center;">&nbsp;</div>
              </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <!-- Create Multi Task Group Modal -->
    <div v-if="createGroupDialog.visible" class="custom-dialog-mask">
      <div class="simple-modal-card" style="width: 420px; margin-top: 100px; background: linear-gradient(135deg, #102a43 0%, #172a3a 100%); border: 1px solid rgba(103, 213, 253, 0.3); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); border-radius: 12px;">
        <div class="simple-modal-header" style="position: relative; height: 50px; display: flex; align-items: center; justify-content: center; background: linear-gradient(to right, rgba(103, 213, 253, 0.1), transparent); border-bottom: 1px solid rgba(103, 213, 253, 0.15);">
          <span style="color: #fff; font-size: 18px; font-weight: 600; text-shadow: 0 0 10px rgba(103, 213, 253, 0.3);">创建多任务组</span>
          <span class="simple-close-icon" @click="closeCreateGroupDialog" style="position: absolute; right: 20px; color: rgba(255, 255, 255, 0.6); font-size: 24px; cursor: pointer; transition: color 0.3s; line-height: 1;">×</span>
        </div>
        <div class="simple-modal-body" style="padding: 35px 35px 0px;">
          <div style="margin-bottom: 0;">
             <input type="text" 
                    v-model="createGroupDialog.name" 
                    class="dialog-input" 
                    placeholder="请输入多任务组名称" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="mission-btn mission-btn-primary" style="height: 40px; min-width: 120px;" @click="confirmCreateGroup">确定</button>
          <button class="mission-btn" style="height: 40px; min-width: 120px; background-color: rgba(100, 100, 100, 0.6); border: 1px solid rgba(150, 150, 150, 0.5); color: #ddd;" @click="closeCreateGroupDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- Delete Multi Task Group Modal -->
    <div v-if="deleteGroupDialog.visible" class="custom-dialog-mask">
      <div class="simple-modal-card" style="width: 420px; margin-top: 100px; background: linear-gradient(135deg, #102a43 0%, #172a3a 100%); border: 1px solid rgba(103, 213, 253, 0.3); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); border-radius: 12px;">
        <div class="simple-modal-header" style="position: relative; height: 50px; display: flex; align-items: center; justify-content: center; background: linear-gradient(to right, rgba(103, 213, 253, 0.1), transparent); border-bottom: 1px solid rgba(103, 213, 253, 0.15);">
          <span style="color: #fff; font-size: 18px; font-weight: 600; text-shadow: 0 0 10px rgba(103, 213, 253, 0.3);">删除多任务组</span>
          <span class="simple-close-icon" @click="closeDeleteGroupDialog" style="position: absolute; right: 20px; color: rgba(255, 255, 255, 0.6); font-size: 24px; cursor: pointer; transition: color 0.3s; line-height: 1;">×</span>
        </div>
        <div class="simple-modal-body" style="padding: 35px 35px 0px; text-align: center;">
          <div style="color: #fff; font-size: 16px; margin-bottom: 15px;">确定要删除该任务组吗？</div>
          <div style="color: rgba(255, 255, 255, 0.6); font-size: 14px;">{{ deleteGroupDialog.name }}</div>
        </div>
        <div class="dialog-footer">
          <button class="mission-btn mission-btn-primary" style="height: 40px; min-width: 120px;" @click="confirmDeleteGroup">确定</button>
          <button class="mission-btn" style="height: 40px; min-width: 120px; background-color: rgba(100, 100, 100, 0.6); border: 1px solid rgba(150, 150, 150, 0.5); color: #ddd;" @click="closeDeleteGroupDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- Add Task Group Modal -->
    <div v-if="addTaskGroupDialog.visible" class="custom-dialog-mask">
      <div class="simple-modal-card" style="width: 480px; margin-top: 20px; background: linear-gradient(135deg, #102a43 0%, #172a3a 100%); border: 1px solid rgba(103, 213, 253, 0.3); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); border-radius: 12px;">
        <div class="simple-modal-header" style="position: relative; height: 50px; display: flex; align-items: center; justify-content: center; background: linear-gradient(to right, rgba(103, 213, 253, 0.1), transparent); border-bottom: 1px solid rgba(103, 213, 253, 0.15);">
          <span style="color: #fff; font-size: 18px; font-weight: 600; text-shadow: 0 0 10px rgba(103, 213, 253, 0.3);">{{ addTaskGroupDialog.isEdit ? '编辑任务组' : '添加任务组' }}</span>
          <span class="simple-close-icon" @click="closeAddTaskGroupDialog" style="position: absolute; right: 20px; color: rgba(255, 255, 255, 0.6); font-size: 24px; cursor: pointer; transition: color 0.3s; line-height: 1;">×</span>
        </div>
        <div class="simple-modal-body" style="padding: 24px 24px 0px; max-height: 65vh; overflow-y: auto;">
          <!-- 启动模式 -->
          <div class="task-form-row">
            <label class="task-form-label">启动模式</label>
            <div class="task-form-radio-group">
              <label class="task-form-radio">
                <input type="radio" v-model="addTaskGroupDialog.form.startMode" value="nav" />
                <span>导航</span>
              </label>
              <label class="task-form-radio">
                <input type="radio" v-model="addTaskGroupDialog.form.startMode" value="ins" />
                <span>INS</span>
              </label>
              <label class="task-form-radio">
                <input type="radio" v-model="addTaskGroupDialog.form.startMode" value="msf" />
                <span>MSF</span>
              </label>
            </div>
          </div>

          <!-- 任务组模式 -->
          <div class="task-form-row">
            <label class="task-form-label">任务组模式</label>
            <div class="task-form-radio-group">
              <label class="task-form-radio">
                <input type="radio" v-model="addTaskGroupDialog.form.taskMode" value="track" />
                <span>循迹模式</span>
              </label>
              <label class="task-form-radio">
                <input type="radio" v-model="addTaskGroupDialog.form.taskMode" value="publish" />
                <span>发布点模式</span>
              </label>
            </div>
          </div>

          <!-- 地图 -->
          <div class="task-form-row">
            <label class="task-form-label">地图</label>
            <select v-model="addTaskGroupDialog.form.mapName" class="task-form-select">
              <option v-for="map in mapList" :key="map" :value="map">{{ map }}</option>
            </select>
          </div>

          <!-- 轨迹 -->
          <div class="task-form-row" v-if="addTaskGroupDialog.form.taskMode === 'track'">
            <label class="task-form-label">轨迹</label>
            <select v-model="addTaskGroupDialog.form.trackName" class="task-form-select">
              <option v-for="track in filteredTrackList" :key="track" :value="track">{{ track }}</option>
            </select>
          </div>

          <!-- 任务组 -->
          <div class="task-form-row">
            <label class="task-form-label">任务组</label>
            <select v-model="addTaskGroupDialog.form.taskGroup" class="task-form-select">
              <option v-for="group in taskGroupOptions" :key="group" :value="group">{{ group }}</option>
            </select>
          </div>

          <!-- 圈数 -->
          <div class="task-form-row">
            <label class="task-form-label">圈数</label>
            <input v-model="addTaskGroupDialog.form.circle" type="number" class="task-form-input" placeholder="请输入圈数" />
          </div>

          <!-- 避障模式 -->
          <div class="task-form-row" v-if="addTaskGroupDialog.form.taskMode === 'track'">
            <label class="task-form-label">避障模式</label>
            <select v-model="addTaskGroupDialog.form.obsMode" class="task-form-select">
              <option value="近障模式">近障模式</option>
              <option value="停障模式">停障模式</option>
              <option value="绕障模式">绕障模式</option>
            </select>
          </div>

          <!-- 步态切换 -->
          <div class="task-form-row">
            <label class="task-form-label">步态切换</label>
            <select v-model="addTaskGroupDialog.form.gait" class="task-form-select">
              <option value="行走步态">行走步态</option>
              <option value="斜坡步态">斜坡步态</option>
              <option value="越障步态">越障步态</option>
              <option value="楼梯步态">楼梯步态</option>
              <option value="帧楼梯步态">帧楼梯步态</option>
              <option value="帧45°楼梯步态">帧45°楼梯步态</option>
              <option value="L行走步态">L行走步态</option>
              <option value="山地步态">山地步态</option>
              <option value="静音步态">静音步态</option>
            </select>
          </div>

          <!-- 地形图设置 -->
          <div class="task-form-row">
            <label class="task-form-label">地形图设置</label>
            <select v-model="addTaskGroupDialog.form.ground" class="task-form-select">
              <option value="实心地面">实心地面</option>
              <option value="镂空地面">镂空地面</option>
              <option value="无踢面地面">无踢面地面</option>
              <option value="累积帧模式">累积帧模式</option>
            </select>
          </div>

          <!-- 原点发布 -->
          <div class="task-form-row" v-if="addTaskGroupDialog.form.taskMode === 'track'">
            <label class="task-form-label">原点发布</label>
            <div class="task-form-switch-wrapper">
              <div class="task-form-switch" @click="addTaskGroupDialog.form.originPublish = !addTaskGroupDialog.form.originPublish" :class="{active: addTaskGroupDialog.form.originPublish}">
                <div class="task-form-switch-dot"></div>
              </div>
              <img :src="addTaskGroupDialog.form.originPublish ? unlockIcon : lockIcon" style="width: 20px; height: 20px; margin-left: 10px;" />
            </div>
          </div>
        </div>
        <div class="dialog-footer" style="padding: 24px;">
          <button class="mission-btn mission-btn-primary" style="height: 40px; min-width: 120px;" @click="confirmAddTaskGroup">确定</button>
          <button class="mission-btn" style="height: 40px; min-width: 120px; background-color: rgba(100, 100, 100, 0.6); border: 1px solid rgba(150, 150, 150, 0.5); color: #ddd;" @click="closeAddTaskGroupDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- Global Messages -->
    <SuccessMessage 
      :show="successMessage.visible" 
      :message="successMessage.text" 
      @close="successMessage.visible = false" 
    />
    <ErrorMessage 
      :show="errorMessage.visible" 
      :message="errorMessage.text" 
      @close="errorMessage.visible = false" 
    />
    
    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      v-if="deleteConfirmDialog"
      :show="deleteConfirmDialog.visible"
      :title="deleteConfirmDialog.title"
      :message="deleteConfirmDialog.message"
      type="warning"
      confirmText="确认删除"
      cancelText="取消"
      @confirm="confirmDeleteTask"
      @cancel="closeDeleteConfirmDialog"
      @close="closeDeleteConfirmDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { navigationApi } from '@/api/services'
import SuccessMessage from '@/components/SuccessMessage.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import trackListIcon from '@/assets/source_data/svg_data/track_list.svg'
import taskAutoIcon from '@/assets/source_data/svg_data/robot_source/task_auto.svg'
import taskTimeIcon from '@/assets/source_data/svg_data/robot_source/task_time.svg'
import taskMultiIcon from '@/assets/source_data/svg_data/robot_source/task_multi.svg'
import editIcon from '@/assets/source_data/svg_data/robot_source/edit.png'
import deleteIcon from '@/assets/source_data/svg_data/robot_source/delete.png'
import upIcon from '@/assets/source_data/svg_data/robot_source/up.png'
import downIcon from '@/assets/source_data/svg_data/robot_source/down.png'
import lockIcon from '@/assets/source_data/svg_data/robot_source/lock.png'
import unlockIcon from '@/assets/source_data/svg_data/robot_source/unlock.png'

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

// Global Message State
const successMessage = ref({ visible: false, text: '' })
const errorMessage = ref({ visible: false, text: '' })

const deleteConfirmDialog = ref({
  visible: false,
  title: '确认删除',
  message: '',
  taskToDelete: null as any
})

const showSuccessMessage = (text: string) => {
  successMessage.value = { visible: true, text }
  setTimeout(() => {
    successMessage.value.visible = false
  }, 2000)
}

const showErrorMessage = (text: string) => {
  errorMessage.value = { visible: true, text }
}

const closeDeleteConfirmDialog = () => {
  deleteConfirmDialog.value.visible = false
  deleteConfirmDialog.value.taskToDelete = null
}

const createGroupDialog = ref({
  visible: false,
  name: ''
})

const deleteGroupDialog = ref({
  visible: false,
  name: '',
  id: ''
})

const addTaskGroupDialog = ref({
  visible: false,
  isEdit: false,
  editTaskId: '',
  editChildId: '',
  editIndex: '',
  form: {
    startMode: 'nav',
    taskMode: 'track',
    mapName: '',
    trackName: '',
    taskGroup: '',
    circle: 1,
    obsMode: '近障模式',
    gait: '行走步态',
    ground: '实心地面',
    originPublish: false
  }
})

const mapList = ref<string[]>([])
const trackList = ref<string[]>([])
const trackListFull = ref<string[]>([]) // 保存完整的轨迹列表（带@后缀）
const taskGroupOptions = ref<string[]>([])
const pointTaskListFull = ref<any[]>([]) // 保存完整的发布点任务列表

// 根据选择的地图筛选轨迹列表
const filteredTrackList = computed(() => {
  if (!addTaskGroupDialog.value.form.mapName) {
    return trackList.value
  }
  
  const mapName = addTaskGroupDialog.value.form.mapName
  return trackList.value.filter(track => {
    // 从完整列表中找到对应的原始名称
    const fullTrack = trackListFull.value.find(fullItem => {
      const atIndex = fullItem.indexOf('@')
      const name = atIndex > -1 ? fullItem.substring(0, atIndex) : fullItem
      return name === track
    })
    
    if (fullTrack) {
      return fullTrack.startsWith(mapName + '_')
    }
    return false
  })
})

const handleCreateTaskGroup = () => {
  createGroupDialog.value.name = ''
  createGroupDialog.value.visible = true
}

const closeCreateGroupDialog = () => {
  createGroupDialog.value.visible = false
}

const closeDeleteGroupDialog = () => {
  deleteGroupDialog.value.visible = false
  deleteGroupDialog.value.id = ''
  deleteGroupDialog.value.name = ''
}

const confirmCreateGroup = async () => {
  if (!createGroupDialog.value.name) {
    showErrorMessage('请输入多任务组名称')
    return
  }
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return

  try {
     const res: any = await navigationApi.createMultiTaskGroup(robotId, { multitask_name: createGroupDialog.value.name })
     console.log('创建多任务组返回:', res)
     // Based on user feedback: response.msg.result === 1 means success
     if (res && res.response && res.response.msg && res.response.msg.result === 1) {
        showSuccessMessage('创建成功')
        closeCreateGroupDialog()
        fetchMultiTaskList()
     } else {
        console.error('创建失败，返回数据异常', res)
        showErrorMessage('创建失败')
     }
  } catch (e) {
     console.error('创建任务组失败', e)
     showErrorMessage('创建失败')
  }
}

const fetchMultiTaskList = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return

  try {
    const res = await navigationApi.getMultiTaskList(robotId)
    if (res && res.msg) {
        multiTaskList.value = res.msg
        localStorage.setItem('cached_multi_task_list', JSON.stringify(res.msg))
        
        // If newly created group exists, select it
        if (createGroupDialog.value.name) {
           const newGroup = multiTaskList.value.find(item => item.multitask_name === createGroupDialog.value.name)
           if (newGroup) {
               selectedMultiTaskName.value = newGroup.multitask_name
           }
        }
        // If empty selection but list not empty, select first
        if (!selectedMultiTaskName.value && multiTaskList.value.length > 0) {
             selectedMultiTaskName.value = multiTaskList.value[0].multitask_name
        }
    }
  } catch (e) {
    console.error('获取多任务组列表失败', e)
  }
}

const handleDeleteTaskGroup = async () => {
  if (!selectedMultiTaskName.value) {
    showErrorMessage('请先选择要删除的任务组')
    return
  }

  const selectedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
  if (!selectedGroup || !selectedGroup.multitask_id) {
    showErrorMessage('无效的任务组')
    return
  }

  deleteGroupDialog.value.name = selectedMultiTaskName.value
  deleteGroupDialog.value.id = selectedGroup.multitask_id
  deleteGroupDialog.value.visible = true
}

const confirmDeleteGroup = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId || !deleteGroupDialog.value.id) return

  try {
    const res: any = await navigationApi.deleteMultiTaskGroup(robotId, { multitask_id: deleteGroupDialog.value.id })
    // Check for success logic compatible with other APIs in this module
    if ((res && (res.code === 200 || res.error_code === 0)) || (res.response && res.response.msg && res.response.msg.result === 1)) {
      showSuccessMessage('删除成功')
      // Reset selection
      selectedMultiTaskName.value = ''
      currentTaskGroupList.value = []
      closeDeleteGroupDialog()
      // Refresh list
      fetchMultiTaskList()
    } else {
      console.error('删除任务组失败，返回:', res)
      showErrorMessage('删除失败')
      closeDeleteGroupDialog()
    }
  } catch (e) {
    console.error('删除任务组失败', e)
    showErrorMessage('删除失败')
    closeDeleteGroupDialog()
  }
}

const handleExecuteTaskGroup = async () => {
  if (!selectedMultiTaskName.value) {
    showErrorMessage('请先选择多任务组')
    return
  }
  
  const selectedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
  if (!selectedGroup || !selectedGroup.multitask_id) {
    showErrorMessage('无效的多任务组')
    return
  }
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    showErrorMessage('未找到机器人ID')
    return
  }
  
  try {
    const res: any = await navigationApi.startMultiTaskGroup(robotId, {
      multitask_name: selectedGroup.multitask_name,
      multitask_id: selectedGroup.multitask_id,
      middle_start: exceptionStart.value ? 1 : 0,
      action: 0
    })
    
    console.log('开始多任务组返回:', res)
    
    if (res && ((res.code === 200 || res.error_code === 0) || (res.response && res.response.msg && res.response.msg.result === 1))) {
      showSuccessMessage('开始执行多任务组成功')
    } else {
      console.error('开始执行多任务组失败，返回数据:', res)
      showErrorMessage(res?.msg || res?.error_msg || '开始执行多任务组失败')
    }
  } catch (e: any) {
    console.error('开始执行多任务组失败', e)
    showErrorMessage(e?.message || '开始执行多任务组失败')
  }
}

const handlePauseMultiTask = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    showErrorMessage('未找到机器人ID')
    return
  }

  try {
    await navigationApi.pauseNavigation(robotId, { action: 1 })
    showSuccessMessage('暂停指令已发送')
  } catch (err) {
    console.error('暂停失败', err)
    showErrorMessage('暂停失败')
  }
}

const handleAddTaskGroup = () => {
  // Reset form
  addTaskGroupDialog.value.isEdit = false
  addTaskGroupDialog.value.editTaskId = ''
  addTaskGroupDialog.value.editChildId = ''
  addTaskGroupDialog.value.editIndex = ''
  addTaskGroupDialog.value.form = {
    startMode: 'nav',
    taskMode: 'track',
    mapName: '',
    trackName: '',
    taskGroup: '',
    circle: 1,
    obsMode: '近障模式',
    gait: '行走步态',
    ground: '实心地面',
    originPublish: false
  }
  
  // Load data from cache
  loadMapListFromCache()
  loadTrackListFromCache()
  loadPointTaskListFromCache()
  
  addTaskGroupDialog.value.visible = true
}

const closeAddTaskGroupDialog = () => {
  addTaskGroupDialog.value.visible = false
}

const confirmAddTaskGroup = async () => {
  const form = addTaskGroupDialog.value.form
  
  // Validate required fields
  if (!form.mapName) {
    showErrorMessage('请选择地图')
    return
  }
  
  // 循迹模式需要轨迹
  if (form.taskMode === 'track' && !form.trackName) {
    showErrorMessage('请选择轨迹')
    return
  }
  
  if (!form.taskGroup) {
    showErrorMessage('请选择任务组')
    return
  }
  if (!form.circle || form.circle < 1) {
    showErrorMessage('圈数必须大于0')
    return
  }
  
  if (!selectedMultiTaskName.value) {
    showErrorMessage('请先选择多任务组')
    return
  }
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    showErrorMessage('未找到机器人ID')
    return
  }
  
  // 获取当前选择的多任务组ID
  const selectedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
  if (!selectedGroup || !selectedGroup.multitask_id) {
    showErrorMessage('无效的多任务组')
    return
  }
  
  try {
    // 组装task_data
    const taskData: any = {
      map_name: form.mapName,
      task_name: form.taskMode === 'track' ? form.trackName : '',
      task_pointname: form.taskGroup,
      task_type: form.taskMode === 'track' ? 'track' : 'task',
      circle: parseInt(form.circle.toString()),
      task_id: addTaskGroupDialog.value.editTaskId || '',
      obs_mode: form.obsMode,
      is_origin_publish: form.originPublish ? 1 : 0,
      start_mode: form.startMode,
      gait: form.gait,
      ground: form.ground
    }
    
    // 编辑模式时添加child_id和index
    if (addTaskGroupDialog.value.isEdit) {
      if (addTaskGroupDialog.value.editChildId) {
        taskData.child_id = addTaskGroupDialog.value.editChildId
      }
      if (addTaskGroupDialog.value.editIndex) {
        taskData.index = addTaskGroupDialog.value.editIndex
      }
    }
    
    const requestData = {
      multitask_id: selectedGroup.multitask_id,
      task_data: taskData
    }
    
    // 根据是否编辑模式调用不同接口
    const res: any = addTaskGroupDialog.value.isEdit
      ? await navigationApi.updateTaskInMultiTaskGroup(robotId, requestData)
      : await navigationApi.addTaskToMultiTaskGroup(robotId, requestData)
    
    console.log(addTaskGroupDialog.value.isEdit ? '编辑任务组返回:' : '添加任务组返回:', res)
    
    // 检查返回结果
    if (res && ((res.code === 200 || res.error_code === 0) || (res.response && res.response.msg && res.response.msg.result === 1))) {
      showSuccessMessage(addTaskGroupDialog.value.isEdit ? '编辑任务组成功' : '添加任务组成功')
      closeAddTaskGroupDialog()
      // Refresh task group list
      await fetchMultiTaskList()
      // 手动更新当前任务组列表
      const selectedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
      if (selectedGroup && selectedGroup.multitask_list) {
        currentTaskGroupList.value = selectedGroup.multitask_list
      }
    } else {
      console.error('操作失败，返回数据:', res)
      showErrorMessage(res?.msg || res?.error_msg || '操作失败')
    }
  } catch (e: any) {
    console.error('操作失败', e)
    showErrorMessage(e?.message || '操作失败')
  }
}

const loadMapList = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return
  
  try {
    const response = await navigationApi.getMapList(robotId)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      // 处理地图列表，只保留@符号前面的内容并去重
      const rawList: string[] = response.msg.result
      const processedSet = new Set<string>()
      rawList.forEach(item => {
        const atIndex = item.indexOf('@')
        const name = atIndex > -1 ? item.substring(0, atIndex) : item
        processedSet.add(name)
      })
      mapList.value = Array.from(processedSet)
      
      // 默认选择第一个
      if (mapList.value.length > 0 && !addTaskGroupDialog.value.form.mapName) {
        addTaskGroupDialog.value.form.mapName = mapList.value[0]
      }
    }
  } catch (err) {
    console.error('获取地图列表失败:', err)
  }
}

const loadMapListFromCache = () => {
  try {
    const cached = localStorage.getItem('cached_map_list')
    if (cached) {
      const rawList: string[] = JSON.parse(cached)
      // 处理地图列表，只保留@符号前面的内容并去重
      const processedSet = new Set<string>()
      rawList.forEach(item => {
        const atIndex = item.indexOf('@')
        const name = atIndex > -1 ? item.substring(0, atIndex) : item
        processedSet.add(name)
      })
      mapList.value = Array.from(processedSet)
      
      // 默认选择第一个
      if (mapList.value.length > 0 && !addTaskGroupDialog.value.form.mapName) {
        addTaskGroupDialog.value.form.mapName = mapList.value[0]
      }
    }
  } catch (err) {
    console.error('读取缓存地图列表失败:', err)
  }
}

const loadTrackList = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return
  
  try {
    const response = await navigationApi.getTrackList(robotId)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      // 保存完整的轨迹列表
      trackListFull.value = response.msg.result
      
      // 处理轨迹列表，只保留@符号前面的内容并去重
      const rawList: string[] = response.msg.result
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

const loadTrackListFromCache = () => {
  try {
    const cached = localStorage.getItem('cached_track_list')
    if (cached) {
      const rawList = JSON.parse(cached)
      // 保存完整的轨迹列表
      trackListFull.value = rawList.map((item: any) => item.track_name || item)
      
      // 处理轨迹列表，只保留@符号前面的内容并去重
      const processedSet = new Set<string>()
      trackListFull.value.forEach(item => {
        const atIndex = item.indexOf('@')
        const name = atIndex > -1 ? item.substring(0, atIndex) : item
        processedSet.add(name)
      })
      trackList.value = Array.from(processedSet)
    }
  } catch (err) {
    console.error('读取缓存轨迹列表失败:', err)
  }
}

const loadTaskGroupList = async (trackName: string) => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId || !trackName) return
  
  try {
    const response = await navigationApi.getTaskpointList(robotId, trackName)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      taskGroupOptions.value = response.msg.result
      
      // 默认选择第一个
      if (taskGroupOptions.value.length > 0 && !addTaskGroupDialog.value.form.taskGroup) {
        addTaskGroupDialog.value.form.taskGroup = taskGroupOptions.value[0]
      }
    }
  } catch (err) {
    console.error('获取任务组列表失败:', err)
  }
}

const loadPointTaskList = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return
  
  try {
    const response = await navigationApi.getPointTaskList(robotId)
    if (response && response.data) {
      pointTaskListFull.value = response.data
      
      // 根据地图名称筛选发布点任务
      const mapName = addTaskGroupDialog.value.form.mapName
      if (mapName) {
        const filtered = response.data
          .filter((task: any) => task.task_name && task.task_name.startsWith(mapName + '_'))
          .map((task: any) => task.task_name)
        
        taskGroupOptions.value = filtered
        
        // 默认选择第一个
        if (taskGroupOptions.value.length > 0 && !addTaskGroupDialog.value.form.taskGroup) {
          addTaskGroupDialog.value.form.taskGroup = taskGroupOptions.value[0]
        }
      }
    }
  } catch (err) {
    console.error('获取发布点任务列表失败:', err)
  }
}

const loadPointTaskListFromCache = () => {
  try {
    const cached = localStorage.getItem('cached_point_task_list')
    if (cached) {
      const data = JSON.parse(cached)
      pointTaskListFull.value = data
      
      // 根据地图名称筛选发布点任务
      const mapName = addTaskGroupDialog.value.form.mapName
      if (mapName) {
        const filtered = data
          .filter((task: any) => task.task_name && task.task_name.startsWith(mapName + '_'))
          .map((task: any) => task.task_name)
        
        taskGroupOptions.value = filtered
        
        // 默认选择第一个
        if (taskGroupOptions.value.length > 0) {
          addTaskGroupDialog.value.form.taskGroup = taskGroupOptions.value[0]
        }
      } else {
        // 如果没有选择地图，显示所有发布点任务
        taskGroupOptions.value = data
          .filter((task: any) => task.task_name)
          .map((task: any) => task.task_name)
        
        // 默认选择第一个
        if (taskGroupOptions.value.length > 0) {
          addTaskGroupDialog.value.form.taskGroup = taskGroupOptions.value[0]
        }
      }
    }
  } catch (err) {
    console.error('读取缓存发布点任务列表失败:', err)
  }
}

// Watch for taskMode changes to load appropriate task list
watch(() => addTaskGroupDialog.value.form.taskMode, (newVal) => {
  // 切换任务组模式时，清空任务组选择
  addTaskGroupDialog.value.form.taskGroup = ''
  taskGroupOptions.value = []
  
  if (newVal === 'publish') {
    // 发布点模式：清空轨迹选择，加载发布点任务列表
    addTaskGroupDialog.value.form.trackName = ''
    // 使用 nextTick 确保数据更新后再加载
    setTimeout(() => {
      loadPointTaskListFromCache()
    }, 0)
  } else {
    // 循迹模式：如果有地图选择，自动选择第一个轨迹
    setTimeout(() => {
      if (addTaskGroupDialog.value.form.mapName && filteredTrackList.value.length > 0) {
        addTaskGroupDialog.value.form.trackName = filteredTrackList.value[0]
        // trackName 的 watch 会自动触发加载任务点列表
      } else if (addTaskGroupDialog.value.form.trackName) {
        // 如果已有选中的轨迹，加载对应的任务点列表
        loadTaskGroupList(addTaskGroupDialog.value.form.trackName)
      }
    }, 0)
  }
})

// Watch for mapName changes to clear track selection
watch(() => addTaskGroupDialog.value.form.mapName, (newVal) => {
  // 当地图改变时，清空轨迹和任务组选择
  addTaskGroupDialog.value.form.trackName = ''
  addTaskGroupDialog.value.form.taskGroup = ''
  taskGroupOptions.value = []
  
  if (addTaskGroupDialog.value.form.taskMode === 'publish') {
    // 发布点模式：重新加载发布点任务列表
    loadPointTaskListFromCache()
  } else {
    // 循迹模式：如果过滤后的轨迹列表有数据，自动选择第一个
    if (filteredTrackList.value.length > 0) {
      addTaskGroupDialog.value.form.trackName = filteredTrackList.value[0]
    }
  }
})

// Watch for trackName changes to load task groups
watch(() => addTaskGroupDialog.value.form.trackName, (newVal) => {
  if (newVal && addTaskGroupDialog.value.form.taskMode === 'track') {
    loadTaskGroupList(newVal)
  } else if (!newVal) {
    taskGroupOptions.value = []
  }
})

const handleEditTaskGroup = (task: any) => {
  console.log('编辑任务组', task)
  
  // Set edit mode
  addTaskGroupDialog.value.isEdit = true
  addTaskGroupDialog.value.editTaskId = task.task_id || ''
  addTaskGroupDialog.value.editChildId = task.child_id || ''
  addTaskGroupDialog.value.editIndex = task.index || ''
  
  // Fill form with task data
  addTaskGroupDialog.value.form = {
    startMode: task.start_mode || 'nav',
    taskMode: task.task_type === 'task' ? 'publish' : 'track',
    mapName: task.map_name || '',
    trackName: task.task_name || '',
    taskGroup: task.task_pointname || '',
    circle: task.circle || 1,
    obsMode: task.obs_mode || '近障模式',
    gait: task.gait || '行走步态',
    ground: task.ground || '实心地面',
    originPublish: task.is_origin_publish === 1
  }
  
  // Load data from cache
  loadMapListFromCache()
  loadTrackListFromCache()
  loadPointTaskListFromCache()
  
  // Open dialog
  addTaskGroupDialog.value.visible = true
}

const handleDeleteTask = (task: any) => {
  if (!task.child_id) {
    showErrorMessage('任务ID不存在')
    return
  }
  
  if (!selectedMultiTaskName.value) {
    showErrorMessage('请先选择多任务组')
    return
  }
  
  const selectedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
  if (!selectedGroup || !selectedGroup.multitask_id) {
    showErrorMessage('无效的多任务组')
    return
  }
  
  // 显示自定义确认弹窗
  deleteConfirmDialog.value.message = `确定要删除任务 "${task.task_pointname}" 吗？`
  deleteConfirmDialog.value.taskToDelete = task
  deleteConfirmDialog.value.visible = true
}

const confirmDeleteTask = async () => {
  const task = deleteConfirmDialog.value.taskToDelete
  if (!task) return
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    showErrorMessage('未找到机器人ID')
    return
  }
  
  const selectedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
  if (!selectedGroup || !selectedGroup.multitask_id) {
    showErrorMessage('无效的多任务组')
    return
  }
  
  try {
    const res: any = await navigationApi.deleteTaskFromMultiTaskGroup(robotId, {
      multitask_id: selectedGroup.multitask_id,
      child_id: task.child_id
    })
    
    console.log('删除任务返回:', res)
    
    if (res && ((res.code === 200 || res.error_code === 0) || (res.response && res.response.msg && res.response.msg.result === 1))) {
      showSuccessMessage('删除任务成功')
      // Refresh task group list
      await fetchMultiTaskList()
      // 手动更新当前任务组列表
      const updatedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
      if (updatedGroup && updatedGroup.multitask_list) {
        currentTaskGroupList.value = updatedGroup.multitask_list
      }
    } else {
      console.error('删除任务失败，返回数据:', res)
      showErrorMessage(res?.msg || res?.error_msg || '删除任务失败')
    }
  } catch (e: any) {
    console.error('删除任务失败', e)
    showErrorMessage(e?.message || '删除任务失败')
  }
}

const handleMoveTask = async (task: any, direction: 'up' | 'down') => {
  if (!task.child_id) {
    showErrorMessage('任务ID不存在')
    return
  }
  
  if (!selectedMultiTaskName.value) {
    showErrorMessage('请先选择多任务组')
    return
  }
  
  const selectedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
  if (!selectedGroup || !selectedGroup.multitask_id) {
    showErrorMessage('无效的多任务组')
    return
  }
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    showErrorMessage('未找到机器人ID')
    return
  }
  
  try {
    const res: any = await navigationApi.swapTaskOrder(robotId, {
      multitask_id: selectedGroup.multitask_id,
      child_id: task.child_id,
      order: direction
    })
    
    console.log(`${direction === 'up' ? '上移' : '下移'}任务返回:`, res)
    
    if (res && ((res.code === 200 || res.error_code === 0) || (res.response && res.response.msg && res.response.msg.result === 1))) {
      showSuccessMessage(`${direction === 'up' ? '上移' : '下移'}成功`)
      // Refresh task group list
      await fetchMultiTaskList()
      // 手动更新当前任务组列表
      const updatedGroup = multiTaskList.value.find(item => item.multitask_name === selectedMultiTaskName.value)
      if (updatedGroup && updatedGroup.multitask_list) {
        currentTaskGroupList.value = updatedGroup.multitask_list
      }
    } else {
      console.error(`${direction === 'up' ? '上移' : '下移'}任务失败，返回数据:`, res)
      showErrorMessage(res?.msg || res?.error_msg || `${direction === 'up' ? '上移' : '下移'}任务失败`)
    }
  } catch (e: any) {
    console.error(`${direction === 'up' ? '上移' : '下移'}任务失败`, e)
    showErrorMessage(e?.message || `${direction === 'up' ? '上移' : '下移'}任务失败`)
  }
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

<style scoped>
@import './mission-common.css';

/* 覆盖公共 grid 列模板，适配本页 8 列布局 */
.file-table-header,
.file-table-row {
  grid-template-columns: 120px 1fr 1fr 1fr 140px 160px 140px 360px;
}

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

/* Dialog Styles matching NavigationManage Recording Modal */
.dialog-input {
  width: 100%;
  height: 44px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 6px;
  padding: 0 16px;
  color: #fff;
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
  letter-spacing: 0.5px;
}

.dialog-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.dialog-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.dialog-footer {
  padding: 35px 35px 35px;
  display: flex;
  justify-content: center;
  gap: 32px;
}

/* Add Task Group Modal Styles */
.task-form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.simple-modal-card .task-form-label {
  color: #b0d0ff;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
  white-space: nowrap;
}

.simple-modal-card .task-form-radio-group {
  display: flex;
  gap: 20px;
}

.simple-modal-card .task-form-radio {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
}

.simple-modal-card .task-form-radio input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #409eff;
}

.simple-modal-card .task-form-select,
.simple-modal-card .task-form-input {
  width: 100%;
  height: 38px;
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.8);
  border-radius: 4px;
  padding: 0 12px;
  color: #67d5fd;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s;
}

.simple-modal-card .task-form-select:hover,
.simple-modal-card .task-form-input:hover {
  background: #0c4666;
  border-color: rgba(38, 131, 182, 1);
}

.simple-modal-card .task-form-select:focus,
.simple-modal-card .task-form-input:focus {
  border-color: #67d5fd;
  background: #0c4666;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.simple-modal-card .task-form-select option {
  background: #0c3c56;
  color: #67d5fd;
  padding: 8px 12px;
}

.simple-modal-card .task-form-input {
  cursor: text;
}

.simple-modal-card .task-form-input::placeholder {
  color: rgba(103, 213, 253, 0.4);
}

.simple-modal-card .task-form-switch-wrapper {
  display: flex;
  align-items: center;
}

.simple-modal-card .task-form-switch {
  width: 44px;
  height: 22px;
  background: #4c4d4f;
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.simple-modal-card .task-form-switch.active {
  background: #409eff;
}

.simple-modal-card .task-form-switch-dot {
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: left 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.simple-modal-card .task-form-switch.active .task-form-switch-dot {
  left: 24px;
}

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
  overflow: hidden;
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
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.simple-modal-body::-webkit-scrollbar {
  width: 6px;
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
</style>
