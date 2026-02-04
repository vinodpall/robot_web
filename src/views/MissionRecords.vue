<template>
  <div class="drone-control-main" @click="closeDropdown">
    <!-- 侧边栏菜单 -->
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: route.path === tab.path }]"
          :title="tab.label"
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
            <div class="mission-top-header">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">发布点任务</span>
              <div class="mission-top-data">
                <span class="mission-data-item">X坐标: <span class="mission-data-value">{{ currentPosition.x || '-' }}</span></span>
                <span class="mission-data-item">Y坐标: <span class="mission-data-value">{{ currentPosition.y || '-' }}</span></span>
                <span class="mission-data-item">Z坐标: <span class="mission-data-value">{{ currentPosition.z || '-' }}</span></span>
                <span class="mission-data-item">角度: <span class="mission-data-value">{{ currentPosition.angle || '-' }}</span></span>
              </div>
            </div>
          </div>
          <div class="mission-content-wrapper">
            <div class="mission-toolbar">
              <!-- 任务组选择 -->
              <span class="mission-toolbar-label" style="margin-right: -8px;">任务组名称：</span>
              <select v-model="selectedPointTaskId" class="mission-toolbar-select" style="min-width: 180px;">
                <option v-if="filteredPointTaskList.length === 0" value="">暂无任务组</option>
                <option v-for="task in filteredPointTaskList" :key="task.task_id" :value="task.task_id">{{ task.task_name }}</option>
              </select>
              
              <!-- 操作按钮组 -->
              <div style="display: flex; gap: 12px; margin-left: 8px;">
                <button class="mission-btn mission-btn-primary" @click="handleStartTask">开始</button>
                <button class="mission-btn mission-btn-secondary" @click="handleStopTask">暂停</button>
                <button class="mission-btn mission-btn-primary">添加任务组</button>
                <button class="mission-btn mission-btn-stop">删除任务组</button>
                <button class="mission-btn mission-btn-primary" @click="handleAddTask">添加任务</button>
              </div>
            </div>
            <div class="file-table" style="min-height: 600px;">
              <div class="file-table-header" style="height: 50px !important; min-height: 44px !important; align-items: center;">
                <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center; display: flex; align-items: center; justify-content: center;">序号</div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center; display: flex; align-items: center; justify-content: center;">任务类型</div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center; display: flex; align-items: center; justify-content: center;">X坐标</div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center; display: flex; align-items: center; justify-content: center;">Y坐标</div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center; display: flex; align-items: center; justify-content: center;">Z坐标</div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center; display: flex; align-items: center; justify-content: center;">角度</div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center; display: flex; align-items: center; justify-content: center;">预置点</div>
                <div class="file-table-cell" style="flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">描述</div>
                <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center; display: flex; align-items: center; justify-content: center;">操作</div>
              </div>
              <!-- 显示实际数据行 -->
              <template v-if="waypointsData.length > 0">
                <div class="file-table-row" v-for="waypoint in waypointsData" :key="waypoint.index" style="min-height: 60px;">
                  <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center;">{{ waypoint.index + 1 }}</div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;">{{ waypoint.type || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ waypoint.coordinates?.x || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ waypoint.coordinates?.y || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ waypoint.coordinates?.z || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ waypoint.angle || '-' }}</div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;">{{ waypoint.preset || '-' }}</div>
                  <div class="file-table-cell file-table-name" style="flex: 1; text-align: center;">{{ waypoint.description || '-' }}</div>
                  <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center; display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="action-btn action-btn-edit">
                      <img :src="editIcon" alt="编辑" />
                      编辑
                    </button>
                    <button class="action-btn action-btn-delete">
                      <img :src="deleteIcon" alt="删除" />
                      删除
                    </button>
                    <button class="action-btn action-btn-arrive">
                      <img :src="arriveIcon" alt="到点" />
                      到点
                    </button>
                  </div>
                </div>
              </template>
              <!-- 始终显示固定的空行以保持表格边框（补足到10行） -->
              <div class="file-table-row" v-for="i in (10 - waypointsData.length)" :key="'empty-' + i" style="min-height: 60px;">
                <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;"></div>
                <div class="file-table-cell" style="flex: 1; text-align: center;"></div>
                <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center;"></div>
              </div>
            </div>
            <!-- 分页组件 -->
            <div class="pagination-wrapper" v-if="total > 0">
              <div class="pagination-info">
                共 {{ total }} 条记录，当前第 {{ currentPage }} 页
              </div>
              <div class="pagination-controls">
                <button 
                  class="pagination-btn pagination-btn-icon" 
                  :disabled="currentPage <= 1"
                  @click="changePage(currentPage - 1)"
                  title="上一页"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#67d5fd" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                
                <div class="pagination-page-input">
                  <input 
                    v-model="pageInput" 
                    type="text" 
                    class="page-input"
                    @keyup.enter="jumpToPage"
                    @blur="jumpToPage"
                  />
                  <span class="page-separator">/</span>
                  <span class="total-pages">{{ totalPages }}</span>
                </div>
                
                <button 
                  class="pagination-btn pagination-btn-icon" 
                  :disabled="currentPage >= totalPages"
                  @click="changePage(currentPage + 1)"
                  title="下一页"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#67d5fd" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
                
                <button 
                  class="pagination-btn pagination-btn-jump" 
                  @click="jumpToPage"
                  title="跳转到指定页码"
                >
                  跳转
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
    <div v-if="showMediaModal" class="media-modal-mask" @click="closeMediaModal">
      <div class="media-modal" @click.stop>
        <div class="media-modal-header">
          <div class="media-modal-title">媒体文件列表</div>
          <button class="media-modal-close" @click="closeMediaModal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="media-modal-content">
          <div v-if="mediaLoading" class="media-loading">
            加载中...
          </div>
          <div v-else-if="mediaError" class="media-error">
            {{ mediaError }}
          </div>
          <div v-else-if="mediaFiles.length === 0" class="media-empty">
            暂无媒体文件
          </div>
          <div v-else class="media-files-list">
            <div 
              v-for="file in mediaFiles" 
              :key="file.file_id" 
              class="media-file-item"
            >
              <div class="media-file-info">
                <div class="media-file-name">
                  {{ file.file_name }}
                  <span 
                    v-if="getFileTypeLabel(file.file_name)" 
                    class="file-type-tag"
                    :style="{ 
                      backgroundColor: getFileTypeLabel(file.file_name)?.color + '20',
                      color: getFileTypeLabel(file.file_name)?.color,
                      borderColor: getFileTypeLabel(file.file_name)?.color
                    }"
                  >
                    {{ getFileTypeLabel(file.file_name)?.label }}
                  </span>
                  <!-- 下载进度条 -->
                  <div v-if="downloadingFiles.includes(file.file_id)" class="download-progress-inline">
                    <div class="download-progress-bar-inline">
                      <div 
                        class="download-progress-fill-inline" 
                        :style="{ width: (downloadProgress[file.file_id] || 0) + '%' }"
                      ></div>
                    </div>
                    <span class="download-progress-text-inline">
                      {{ downloadProgress[file.file_id] || 0 }}%
                    </span>
                  </div>
                </div>
                <div class="media-file-meta">
                  <span class="media-file-time">{{ formatMediaTime(file.create_time) }}</span>
                  <span class="media-file-type">{{ getFileTypeText(file) }}</span>
                </div>
              </div>
              <div class="media-file-actions">
                <button 
                  class="media-preview-btn"
                  @click="previewMediaFile(file)"
                  :disabled="!canPreview(file)"
                  :title="getPreviewButtonTitle(file)"
                >
                  {{ getPreviewButtonText(file) }}
                </button>
                <button 
                  class="media-download-btn"
                  @click="downloadMediaFile(file.file_id, file.file_name)"
                  :disabled="downloadingFiles.includes(file.file_id)"
                >
                  {{ downloadingFiles.includes(file.file_id) ? '下载中...' : '下载' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div v-if="showImagePreview" class="preview-modal-mask" @click="closeImagePreview">
      <div class="preview-modal" @click.stop>
        <div class="preview-modal-header">
          <div class="preview-modal-title">图片预览</div>
          <button class="preview-modal-close" @click="closeImagePreview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="preview-modal-content">
          <div v-if="imagePreviewLoading" class="preview-loading">
            加载中...
          </div>
          <div v-else-if="imagePreviewError" class="preview-error">
            {{ imagePreviewError }}
          </div>
          <div v-else class="image-preview-container">
            <img 
              :src="imagePreviewUrl" 
              :alt="currentPreviewFile?.file_name || '图片预览'"
              class="image-preview"
              @error="handleImagePreviewError"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 视频预览弹窗 -->
    <div v-if="showVideoPreview" class="preview-modal-mask" @click="closeVideoPreview">
      <div class="preview-modal video-preview-modal" @click.stop>
        <div class="preview-modal-header">
          <div class="preview-modal-title">视频预览</div>
          <button class="preview-modal-close" @click="closeVideoPreview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="preview-modal-content">
          <div v-if="videoPreviewLoading" class="preview-loading">
            加载中...
          </div>
          <div v-else-if="videoPreviewError" class="preview-error">
            {{ videoPreviewError }}
          </div>
          <div v-else class="video-preview-container">
            <video 
              :src="videoPreviewUrl" 
              controls 
              class="video-preview"
            ></video>
          </div>
        </div>
      </div>
    </div>


    <!-- 添加任务弹窗 -->
    <Teleport to="body">
      <div v-if="addTaskDialog.visible" class="custom-dialog-mask">
        <div class="simple-modal-card">
          <!-- Header -->
          <div class="simple-modal-header">
            <span>添加任务</span>
            <span class="simple-close-icon" @click="cancelAddTask">×</span>
          </div>
          
          <!-- Body -->
          <div class="simple-modal-body">
            <!-- 任务类型 -->
            <div class="simple-form-item">
              <div class="simple-flex-row" style="margin-bottom: 8px;">
                 <label class="simple-label" style="margin-bottom: 0; margin-right: 15px;"><span class="required-star">*</span>任务类型</label>
                 <label class="simple-radio"><input type="radio" v-model="addTaskDialog.form.isMulti" value="0"> <span>单选</span></label>
                 <label class="simple-radio"><input type="radio" v-model="addTaskDialog.form.isMulti" value="1"> <span>多选</span></label>
              </div>
              <div class="simple-flex-row">
                 <input v-model="addTaskDialog.form.typeInput" class="simple-input" style="flex: 2;">
                 <div class="custom-select-wrapper" style="flex: 1; position: relative;" @click.stop="showTypeDropdown = !showTypeDropdown">
                    <div class="simple-select" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                      <span>{{ addTaskDialog.form.actionType || '请选择' }}</span>
                      <span :style="{transform: showTypeDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', fontSize: '12px', opacity: 0.7}">▼</span>
                    </div>
                    <div v-show="showTypeDropdown" class="custom-select-dropdown">
                      <div v-for="item in filteredTaskTypes" :key="item.type" :class="['custom-select-option', { 'selected': isSelected(item) }]" @click.stop="selectTaskType(item)">
                        {{ item.cn_name }}
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            <!-- 坐标 XYZ -->
            <div class="simple-form-item">
               <label class="simple-label">X坐标</label>
               <input v-model="addTaskDialog.form.x" class="simple-input">
            </div>
            <div class="simple-form-item">
               <label class="simple-label">Y坐标</label>
               <input v-model="addTaskDialog.form.y" class="simple-input">
            </div>
            <div class="simple-form-item">
               <label class="simple-label">Z坐标</label>
               <input v-model="addTaskDialog.form.z" class="simple-input">
            </div>
            <div class="simple-form-item">
               <label class="simple-label">角度</label>
               <input v-model="addTaskDialog.form.angle" class="simple-input">
            </div>

            <!-- 预置点 -->
             <div class="simple-form-item">
               <label class="simple-label">预置点</label>
               <div class="simple-flex-row">
                  <input v-model="addTaskDialog.form.preset" class="simple-input" style="flex: 1;">
                 <button class="mission-btn mission-btn-primary" style="height: 34px; padding: 0 15px; display: flex; align-items: center; justify-content: center;">选择</button>
               </div>
            </div>

            <!-- 额外事务 -->
             <div class="simple-form-item">
               <label class="simple-label">额外事务</label>
               <div class="simple-flex-row" style="justify-content: space-between;">
                  <span style="color: #fff;">{{ addTaskDialog.form.extraConfig || '未配置' }}</span>
                  <button class="mission-btn mission-btn-primary" style="height: 34px; padding: 0 15px; display: flex; align-items: center; justify-content: center;">配置</button>
               </div>
            </div>

            <!-- 描述 -->
             <div class="simple-form-item">
               <label class="simple-label">描述</label>
               <input v-model="addTaskDialog.form.description" class="simple-input">
            </div>

            <!-- 步态 & 地形 -->
             <div class="simple-form-item">
               <label class="simple-label">步态切换</label>
                <select v-model="addTaskDialog.form.gait" class="simple-select">
                  <option value="1">行走步态</option>
                  <option value="2">斜坡步态</option>
                  <option value="3">越障步态</option>
                  <option value="4">楼梯步态</option>
                  <option value="5">帧楼梯步态</option>
                  <option value="6">帧45°楼梯步态</option>
                  <option value="7">L行走步态</option>
                  <option value="8">山地步态</option>
                  <option value="9">静音步态</option>
                </select>
            </div>
             <div class="simple-form-item">
               <label class="simple-label">地形图设置</label>
                <select v-model="addTaskDialog.form.ground" class="simple-select">
                  <option value="1">实心地面</option>
                  <option value="2">镂空地面</option>
                  <option value="3">无踢面地面</option>
                  <option value="4">累积帧模式</option>
                </select>
            </div>

             <!-- Switch -->
             <div class="simple-form-item">
               <label class="simple-label">到点停止运动</label>
               <div class="simple-flex-row" style="justify-content: flex-start;">
                 <div class="simple-switch" @click="addTaskDialog.form.stopAtPoint = !addTaskDialog.form.stopAtPoint" :class="{active: addTaskDialog.form.stopAtPoint}">
                    <div class="simple-switch-dot"></div>
                 </div>
                 <img :src="addTaskDialog.form.stopAtPoint ? unlockIcon : lockIcon" style="width: 20px; height: 20px; margin-left: 10px;" />
               </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="simple-modal-footer">
             <button class="mission-btn mission-btn-primary" style="width: 100px;" @click="confirmAddTask">确定</button>
             <button class="mission-btn" style="width: 100px; background: transparent; border: 1px solid #606266; color: #fff;" @click="cancelAddTask">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import trackListIcon from '@/assets/source_data/svg_data/track_list.svg'
import taskAutoIcon from '@/assets/source_data/svg_data/robot_source/task_auto.svg'
import taskTimeIcon from '@/assets/source_data/svg_data/robot_source/task_time.svg'
import taskMultiIcon from '@/assets/source_data/svg_data/robot_source/task_multi.svg'
import lockIcon from '@/assets/source_data/svg_data/robot_source/lock.png'
import unlockIcon from '@/assets/source_data/svg_data/robot_source/unlock.png'
import editIcon from '@/assets/source_data/svg_data/robot_source/edit.png'
import deleteIcon from '@/assets/source_data/svg_data/robot_source/delete.png'
import arriveIcon from '@/assets/source_data/svg_data/robot_source/arrive.png'
import { useWaylineJobs, useDevices } from '../composables/useApi'
import { waylineApi, navigationApi } from '../api/services'
import { getErrorMessage } from '@/utils/errorCodes'
import { mediaApi } from '../api/services'

const router = useRouter()
const route = useRoute()

// 使用任务记录API
const { jobs, loading, error, pagination, fetchJobs, clearJobs } = useWaylineJobs()
const { getCachedWorkspaceId } = useDevices()

// 发布点任务列表
interface PointTask {
  isStart: boolean
  task_id: string
  task_name: string
  taskcontent: any[]
}

const pointTaskList = ref<PointTask[]>([])
const selectedPointTaskId = ref('')

// 获取发布点任务列表
const fetchPointTaskList = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    console.warn('未选择机器人，尝试从缓存加载发布点任务列表')
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_point_task_list')
    if (cached) {
      pointTaskList.value = JSON.parse(cached)
      if (pointTaskList.value.length > 0 && !selectedPointTaskId.value) {
        selectedPointTaskId.value = pointTaskList.value[0].task_id
      }
    }
    return
  }
  
  try {
    const response = await navigationApi.getPointTaskList(robotId)
    if (response && response.data) {
      pointTaskList.value = response.data.map(task => ({
        ...task,
        task_id: String(task.task_id) // 统一转为字符串存储，方便比较
      }))
      // 缓存发布点任务列表
      localStorage.setItem('cached_point_task_list', JSON.stringify(pointTaskList.value))
      
      // 默认选择第一个
      if (pointTaskList.value.length > 0 && !selectedPointTaskId.value) {
        selectedPointTaskId.value = pointTaskList.value[0].task_id
      }
    }
  } catch (error) {
    console.error('获取发布点任务列表失败:', error)
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_point_task_list')
    if (cached) {
      pointTaskList.value = JSON.parse(cached)
      if (pointTaskList.value.length > 0 && !selectedPointTaskId.value) {
        selectedPointTaskId.value = pointTaskList.value[0].task_id
      }
    }
  }
}

// 从缓存读取选中的地图名称
const selectedMap = computed(() => {
  return localStorage.getItem('selected_map_name') || ''
})

// 过滤后的发布点任务列表（根据缓存的地图筛选）
const filteredPointTaskList = computed(() => {
  if (!selectedMap.value) return pointTaskList.value // 如果没有缓存的地图，显示所有任务组
  
  // 根据地图名称筛选：task_name 以 "地图名称_" 开头
  return pointTaskList.value.filter(task => {
    return task.task_name.startsWith(selectedMap.value + '_')
  })
})

// 监听筛选后的发布点任务列表变化，自动选择第一个
watch(filteredPointTaskList, (newList) => {
  if (newList.length > 0) {
    selectedPointTaskId.value = newList[0].task_id
  } else {
    selectedPointTaskId.value = ''
  }
})

// 根据选中的任务组ID获取任务详情
const selectedTaskDetail = computed(() => {
  if (!selectedPointTaskId.value) return null
  return pointTaskList.value.find(task => task.task_id === selectedPointTaskId.value)
})

// 航点数据 - 从选中的任务组的taskcontent获取
const waypointsData = computed(() => {
  if (!selectedTaskDetail.value || !selectedTaskDetail.value.taskcontent) {
    return []
  }
  
  // 转换为表格需要的格式
  return selectedTaskDetail.value.taskcontent.map((item: any, index: number) => ({
    index: index,
    type: item.type_text || item.type || '-',
    coordinates: {
      x: item.x || '-',
      y: item.y || '-',
      z: item.z || '-'
    },
    angle: item.theta || '-',
    preset: item.preset || item.presetID || '-',
    description: item.remark || '-'
  }))
})

// 当前位置和任务信息
const currentPosition = ref({
  x: 0,
  y: 0,
  z: 0,
  angle: 0
})

// 航线文件筛选已移除
// 筛选：任务状态与任务类型
const selectedStatus = ref<string | number>('')
const selectedTaskType = ref<string | number>('')

// 分页参数
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const pageInput = ref('')

// 失败信息气泡相关
const openErrorTooltipJobId = ref<string | null>(null)
const closeErrorTooltip = () => { openErrorTooltipJobId.value = null }
const toggleErrorTooltip = (job: any) => {
  openErrorTooltipJobId.value = openErrorTooltipJobId.value === job.job_id ? null : job.job_id
}

// 媒体文件弹窗相关
const showMediaModal = ref(false)
const mediaFiles = ref<any[]>([])
const mediaLoading = ref(false)
const mediaError = ref<string | null>(null)
const downloadingFiles = ref<string[]>([])

// 预览相关状态
const showImagePreview = ref(false)
const showVideoPreview = ref(false)
const imagePreviewUrl = ref('')
const videoPreviewUrl = ref('')
const imagePreviewLoading = ref(false)
const videoPreviewLoading = ref(false)
const imagePreviewError = ref<string | null>(null)
const videoPreviewError = ref<string | null>(null)
const currentPreviewFile = ref<any>(null)
const currentBlobUrls = ref<string[]>([])
const getJobErrorMessage = (job: any) => {
  if (!job || job.status !== 6) return ''
  const code = job.error_code ?? job.error?.code ?? job.errorCode
  if (!code && job.error?.message) return job.error.message
  return getErrorMessage(code, undefined, { fallback: '执行失败，具体原因未知' })
}

// 显示媒体文件弹窗
const showMediaFiles = async (job: any) => {
  if (!job.media_count || job.media_count === 0) {
    alert('该任务暂无媒体文件')
    return
  }
  
  showMediaModal.value = true
  mediaLoading.value = true
  mediaError.value = null
  mediaFiles.value = []
  
  try {
    const response = await mediaApi.getMediaFiles({ 
      job_id: job.job_id,
      page_size: 100
    })
    mediaFiles.value = response.items || []
  } catch (err: any) {
    mediaError.value = err.message || '获取媒体文件失败'
    console.error('获取媒体文件失败:', err)
  } finally {
    mediaLoading.value = false
  }
}

// 关闭媒体文件弹窗
const closeMediaModal = () => {
  showMediaModal.value = false
  mediaFiles.value = []
  mediaError.value = null
}

// 预览相关函数
const canPreview = (file: any) => {
  if (!file || !file.file_name) return false
  const fileName = file.file_name.toLowerCase()
  return fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || 
         fileName.endsWith('.mp4') || fileName.endsWith('.mov')
}

const getPreviewButtonText = (file: any) => {
  if (!file || !file.file_name) return '预览'
  const fileName = file.file_name.toLowerCase()
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
    return '图片预览'
  } else if (fileName.endsWith('.mp4') || fileName.endsWith('.mov')) {
    return '视频预览'
  }
  return '预览'
}

const getPreviewButtonTitle = (file: any) => {
  if (!file || !file.file_name) return '无法预览此文件'
  const fileName = file.file_name.toLowerCase()
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
    return '点击预览图片'
  } else if (fileName.endsWith('.mp4') || fileName.endsWith('.mov')) {
    return '点击预览视频'
  }
  return '无法预览此文件'
}

const previewMediaFile = async (file: any) => {
  if (!canPreview(file)) {
    alert('无法预览此文件类型')
    return
  }

  currentPreviewFile.value = file
  const fileName = file.file_name.toLowerCase()
  
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
    // 图片预览
    showImagePreview.value = true
    imagePreviewLoading.value = true
    imagePreviewError.value = null
    
    try {
      // 使用下载接口获取图片内容，然后转换为blob URL进行预览
      const response = await mediaApi.downloadMediaFile(file.file_id)
      const blob = new Blob([response as BlobPart], { type: 'image/jpeg' })
      const imageUrl = URL.createObjectURL(blob)
      imagePreviewUrl.value = imageUrl
      currentBlobUrls.value.push(imageUrl)
      imagePreviewLoading.value = false
    } catch (err: any) {
      imagePreviewError.value = err.message || '图片加载失败'
      imagePreviewLoading.value = false
    }
  } else if (fileName.endsWith('.mp4') || fileName.endsWith('.mov')) {
    // 视频预览 - 使用支持range请求的预览接口
    showVideoPreview.value = true
    videoPreviewLoading.value = true
    videoPreviewError.value = null
    
    try {
      // 使用预览接口，支持range请求
      const videoUrl = `/api/v1/media/preview/${file.file_id}`
      videoPreviewUrl.value = videoUrl
      videoPreviewLoading.value = false
    } catch (err: any) {
      videoPreviewError.value = err.message || '视频加载失败'
      videoPreviewLoading.value = false
    }
  }
}

const closeImagePreview = () => {
  showImagePreview.value = false
  // 清理blob URL
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    currentBlobUrls.value = currentBlobUrls.value.filter(url => url !== imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }
  imagePreviewError.value = null
  currentPreviewFile.value = null
}

const closeVideoPreview = () => {
  showVideoPreview.value = false
  videoPreviewUrl.value = ''
  videoPreviewError.value = null
  currentPreviewFile.value = null
}

// 清理所有blob URL
const cleanupBlobUrls = () => {
  currentBlobUrls.value.forEach(url => {
    URL.revokeObjectURL(url)
  })
  currentBlobUrls.value = []
}

const handleImagePreviewError = () => {
  imagePreviewError.value = '图片加载失败，请检查文件是否存在'
  imagePreviewLoading.value = false
}

// 格式化媒体文件时间
const formatMediaTime = (timestamp: number) => {
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

// 获取文件类型标签
const getFileTypeLabel = (fileName: string) => {
  if (fileName.endsWith('_T.jpeg') || fileName.endsWith('_T.jpg') || fileName.endsWith('_T.mp4') || fileName.endsWith('_T.mov')) {
    return { type: 'infrared', label: '红外', color: '#ff6b35' }
  } else if (fileName.endsWith('_V.jpeg') || fileName.endsWith('_V.jpg') || fileName.endsWith('_V.mp4') || fileName.endsWith('_V.mov')) {
    return { type: 'visible', label: '可见光', color: '#4ecdc4' }
  }
  return null
}

// 获取文件类型文本（原图/原始视频/缩略图）
const getFileTypeText = (file: any) => {
  if (!file.is_original) {
    return '缩略图'
  }
  
  // 判断是否为视频文件
  const isVideo = file.file_name.endsWith('.mp4') || file.file_name.endsWith('.mov')
  
  return isVideo ? '原始视频' : '原图'
}

// 下载进度状态
const downloadProgress = ref<{ [fileId: string]: number }>({})

// 下载媒体文件
const downloadMediaFile = async (fileId: string, fileName: string) => {
  if (downloadingFiles.value.includes(fileId)) return
  
  downloadingFiles.value.push(fileId)
  downloadProgress.value[fileId] = 0
  
  try {
    // 走浏览器原生下载（后端已移除认证）
    const downloadUrl = `/api/v1/media/download/${fileId}`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName || ''
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // 设置为完成，浏览器接手下载过程
    downloadProgress.value[fileId] = 100
    console.log('文件下载已由浏览器处理:', fileName)
  } catch (err: any) {
    console.error('文件下载失败:', err)
    alert('文件下载失败: ' + (err.message || '未知错误'))
  } finally {
    downloadingFiles.value = downloadingFiles.value.filter(id => id !== fileId)
    delete downloadProgress.value[fileId]
  }
}

// 航线文件加载逻辑已移除

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

// 格式化时间戳
const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '-'
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

// 获取任务状态文本
const getStatusText = (status: number) => {
  const statusMap: { [key: number]: string } = {
    [-1]: '未知状态',
    [0]: '待执行',
    [1]: '已发送',
    [2]: '执行中',
    [3]: '已暂停',
    [4]: '已取消',
    [5]: '执行成功',
    [6]: '执行失败',
    [7]: '准备执行'
  }
  return statusMap[status] || '未知'
}

// 获取任务状态样式
const getStatusClass = (status: number) => {
  const statusClassMap: { [key: number]: string } = {
    [-1]: 'status-unknown',
    [0]: 'status-pending',
    [1]: 'status-sent',
    [2]: 'status-running',
    [3]: 'status-paused',
    [4]: 'status-cancelled',
    [5]: 'status-success',
    [6]: 'status-failed',
    [7]: 'status-pending'
  }
  return statusClassMap[status] || 'status-unknown'
}

// 获取任务类型文本
const getTaskTypeText = (taskType: number) => {
  const taskTypeMap: { [key: number]: string } = {
    [0]: '立即任务',
    [1]: '定时任务',
    [2]: '条件任务'
  }
  return taskTypeMap[taskType] || '未知'
}

// 获取上传进度百分比
const getUploadProgress = (job: any) => {
  if (!job.media_count || job.media_count === 0) return 0
  if (!job.uploaded_count) return 0
  const progress = (job.uploaded_count / job.media_count) * 100
  return Math.min(100, Math.max(0, progress))
}

// 加载任务记录数据
const loadJobRecords = async () => {
  const workspaceId = getCachedWorkspaceId()
  console.log('获取到的workspace_id:', workspaceId)
  console.log('localStorage中的workspace_id:', localStorage.getItem('workspace_id'))
  console.log('localStorage中的user:', localStorage.getItem('user'))
  // 航线筛选已移除
  
  // 先清空现有数据
  clearJobs()
  
  if (!workspaceId) {
    console.error('未找到workspace_id，无法加载任务记录')
    // 尝试从用户信息中获取
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        console.log('从localStorage解析的用户数据:', userData)
        if (userData.workspace_id) {
          console.log('从用户数据中找到workspace_id:', userData.workspace_id)
          await fetchJobs(userData.workspace_id, {
            page: currentPage.value,
            page_size: pageSize.value,
            status: selectedStatus.value === '' ? undefined : Number(selectedStatus.value),
            task_type: selectedTaskType.value === '' ? undefined : Number(selectedTaskType.value)
          })
          // 更新总数
          if (pagination.value) {
            total.value = pagination.value.total || 0
          }
          return
        }
      } catch (err) {
        console.error('解析用户数据失败:', err)
      }
    }
    return
  }
  
  await fetchJobs(workspaceId, {
    page: currentPage.value,
    page_size: pageSize.value,
    status: selectedStatus.value === '' ? undefined : Number(selectedStatus.value),
    task_type: selectedTaskType.value === '' ? undefined : Number(selectedTaskType.value)
  })
  
  // 更新总数
  if (pagination.value) {
    total.value = pagination.value.total || 0
  }
  
  // 同步分页输入框
  pageInput.value = currentPage.value.toString()
}

// 启动发布点任务
const handleStartTask = async () => {
  if (!selectedPointTaskId.value) {
    alert('请先选择任务组')
    return
  }
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    alert('未找到机器人ID')
    return
  }
  
  try {
    const response = await navigationApi.startPointTask(robotId, {
      id: selectedPointTaskId.value,
      // 与Home.vue保持一致，sn参数传入robotId
      sn: robotId
    })
    
    // 检查响应 - 假设 API 返回成功会有正常的响应结构
    // 这里简单弹窗提示
    alert('任务启动指令已发送')
    console.log('启动任务响应:', response)
  } catch (error: any) {
    console.error('启动任务失败:', error)
    alert(`启动任务失败: ${error.message || '未知错误'}`)
  }
}

// 暂停发布点任务
const handleStopTask = () => {
  console.log('暂停发布点任务')
  // TODO: 调用暂停发布点任务API
}

// 添加任务弹窗
const addTaskDialog = ref({
  visible: false,
  form: {
    isMulti: '0', // '0' 单选, '1' 多选
    typeInput: '', // 任务类型输入框
    actionType: '回充', // 下拉默认值
    x: '10.55', // 示例默认值
    y: '44.88',
    z: '-13.52',
    angle: '1.55',
    preset: '',
    extraConfig: '', // 未配置
    description: '',
    gait: '1', // 行走步态
    ground: '1', // 实心地面
    stopAtPoint: false
  }
})

const showTypeDropdown = ref(false)
const selectTaskType = (item: any) => {
  addTaskDialog.value.form.actionType = item.cn_name
  
  const isMulti = addTaskDialog.value.form.isMulti === '1'
  if (isMulti) {
    let list = addTaskDialog.value.form.typeInput ? addTaskDialog.value.form.typeInput.split(',') : []
    // Remove if exists (toggle)
    if (list.includes(item.cn_name)) {
      list = list.filter((name: string) => name !== item.cn_name)
    } else {
      list.push(item.cn_name)
    }
    addTaskDialog.value.form.typeInput = list.join(',')
  } else {
    addTaskDialog.value.form.typeInput = item.cn_name
    showTypeDropdown.value = false
  }
}

const isSelected = (item: any) => {
  const current = addTaskDialog.value.form.typeInput
  if (!current) return false
  const list = current.split(',')
  return list.includes(item.cn_name)
}

const closeDropdown = () => {
  showTypeDropdown.value = false
}

const taskTypeList = ref<any[]>([])

const filteredTaskTypes = computed(() => {
  const isSingle = addTaskDialog.value.form.isMulti === '0'
  return taskTypeList.value.filter(item => item.single === isSingle)
})

const fetchTaskTypeList = async () => {
  const robotId = localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  const cached = localStorage.getItem('cached_task_type_list')
  if (cached) {
    try {
      taskTypeList.value = JSON.parse(cached)
    } catch (e) {
      console.error('解析任务类型缓存失败', e)
    }
  }

  try {
    const res = await navigationApi.getTaskTypeList(robotId)
    if (res && res.data) {
      taskTypeList.value = res.data
      localStorage.setItem('cached_task_type_list', JSON.stringify(res.data))
    }
  } catch (err) {
    console.error('获取任务类型列表失败', err)
  }
}

watch(() => addTaskDialog.value.form.isMulti, () => {
  // 切换单/多选时，直接清空输入框
  addTaskDialog.value.form.typeInput = ''
})

watch(filteredTaskTypes, (list) => {
  // 列表变化时（如下载完成或切换单多选），默认选中第一个
  if (list && list.length > 0) {
    addTaskDialog.value.form.actionType = list[0].cn_name
  } else {
    addTaskDialog.value.form.actionType = ''
  }
}, { immediate: true })

const handleAddTask = () => {
  addTaskDialog.value.visible = true
  fetchTaskTypeList()
}

const cancelAddTask = () => {
  addTaskDialog.value.visible = false
}

const confirmAddTask = () => {
  // TODO: Implement add task logic
  console.log('添加任务:', addTaskDialog.value.form)
  addTaskDialog.value.visible = false
}

// 页面加载时获取数据
onMounted(async () => {
  fetchPointTaskList()
  // 初始化分页输入框
  pageInput.value = currentPage.value.toString()
  
  // 获取发布点任务列表
  await fetchPointTaskList()
  
  await loadJobRecords()
  // 点击页面空白关闭
  window.addEventListener('click', closeErrorTooltip)
  window.addEventListener('click', closeDropdown)
})

// 离开时移除监听
onUnmounted(() => {
  window.removeEventListener('click', closeErrorTooltip)
  window.removeEventListener('click', closeDropdown)
  cleanupBlobUrls() // 清理所有blob URL
})

// 切换页面
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    pageInput.value = page.toString()
    loadJobRecords()
  }
}

// 跳转到指定页面
const jumpToPage = () => {
  const page = parseInt(pageInput.value)
  if (page && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadJobRecords()
  } else {
    pageInput.value = currentPage.value.toString()
  }
}

// 筛选条件变化
const onFilterChange = () => {
  currentPage.value = 1
  loadJobRecords()
}

// 删除任务记录
const handleDeleteJob = (job: any) => {
  if (!job || !job.job_id) return
  const ok = confirm(`确定要删除任务记录“${job.name || job.job_id}”吗？该操作不可恢复。`)
  if (!ok) return
  const workspaceId = getCachedWorkspaceId()
  if (!workspaceId) {
    alert('未找到工作空间ID，无法删除任务记录')
    return
  }
  waylineApi.deleteJob(workspaceId, job.job_id)
    .then(() => {
      // 删除后刷新列表
      loadJobRecords()
    })
    .catch((err: any) => {
      alert('删除失败：' + (err?.message || '未知错误'))
    })
}

// 航线下拉交互逻辑已移除
</script>

<style>
@import './mission-common.css';

/* 任务状态样式 */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
  border: 1px solid rgba(144, 147, 153, 0.3);
}

.status-sent {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
  border: 1px solid rgba(64, 158, 255, 0.3);
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

.status-cancelled {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
  border: 1px solid rgba(144, 147, 153, 0.3);
}

.status-completed {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.status-success {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.status-failed {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.3);
}

/* 错误提示气泡 */
.error-tooltip-wrapper {
  position: relative;
  display: inline-block;
}
.error-tooltip-content {
  position: absolute;
  z-index: 10;
  left: 50%;
  top: calc(100% + 6px);
  min-width: 220px;
  max-width: 360px;
  background: #0a2a3a;
  border: 1px solid #164159;
  border-radius: 6px;
  padding: 10px 12px;
  color: #e6a23c;
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  transform: translateX(-50%);
}
.error-title {
  font-size: 12px;
  color: #67d5fd;
  margin-bottom: 6px;
}
.error-text {
  font-size: 12px;
  line-height: 1.5;
  color: #ffd8d8;
}
.error-code {
  margin-top: 8px;
  font-size: 12px;
  color: #67d5fd;
  opacity: 0.8;
}

.status-unknown {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
  border: 1px solid rgba(144, 147, 153, 0.3);
}

/* 加载和错误状态样式 */
.mission-loading,
.mission-error,
.mission-empty {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}

.mission-error {
  color: #f56c6c;
}

/* 分页组件样式 */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-top: none;
  background: transparent;
}

.pagination-info {
  color: #67d5fd;
  font-size: 14px;
  font-weight: 400;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  padding: 6px 12px;
  cursor: pointer;
  border: none;
  transition: background 0.2s, color 0.2s, border 0.2s;
}

.pagination-btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: #0c3c56;
  color: #67d5fd;
  border: 1px solid rgba(38, 131, 182, 0.8);
}

.pagination-btn-icon:hover:not(:disabled) {
  background: #0c4666;
  color: #67d5fd;
}

.pagination-btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page-input {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #0a2a3a;
  border-radius: 4px;
  padding: 0;
  border: 1px solid #164159;
  min-width: 80px;
  height: 36px;
}

.page-input {
  width: 35px;
  height: 36px;
  padding: 0 2px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 12px;
  color: #fff;
  font-weight: 400;
}

.page-input:focus {
  outline: none;
  background: #0c3c56;
  border-radius: 2px;
}

.page-input::placeholder {
  color: #67d5fd;
}

.page-separator {
  color: #67d5fd;
  font-size: 12px;
  font-weight: 400;
  line-height: 36px;
}

.total-pages {
  color: #67d5fd;
  font-size: 12px;
  font-weight: 400;
  min-width: 16px;
  line-height: 36px;
}

.pagination-btn-jump {
  background: #0c3c56;
  color: #67d5fd;
  border: 1px solid rgba(38, 131, 182, 0.8);
  padding: 6px 12px;
  height: 36px;
  border-radius: 4px;
  font-size: 13px;
}

.pagination-btn-jump:hover {
  background: #0c4666;
  color: #67d5fd;
}

/* 上传进度条样式 */
.upload-progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.upload-progress-container.clickable {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.upload-progress-container.clickable:hover {
  opacity: 0.8;
}

.upload-progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(103, 213, 253, 0.1);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(103, 213, 253, 0.2);
}

.upload-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #67d5fd, #00e1ff);
  border-radius: 3px;
  transition: width 0.3s ease;
  min-width: 0;
}

.upload-progress-text {
  color: #67d5fd;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 40px;
  text-align: right;
}

/* 媒体文件弹窗样式 */
.media-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.media-modal {
  background: #0a2a3a;
  border: 1px solid #164159;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.media-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #164159;
  background: #0c3c56;
}

.media-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #67d5fd;
}

.media-modal-close {
  background: none;
  border: none;
  color: #67d5fd;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.media-modal-close:hover {
  background: rgba(103, 213, 253, 0.1);
}

.media-modal-content {
  padding: 20px;
  max-height: calc(80vh - 120px);
  overflow-y: auto;
  
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #67d5fd #0c3c56;
}

/* Webkit浏览器滚动条样式 */
.media-modal-content::-webkit-scrollbar {
  width: 8px;
}

.media-modal-content::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.media-modal-content::-webkit-scrollbar-thumb {
  background: #67d5fd;
  border-radius: 4px;
  border: 1px solid #0c3c56;
}

.media-modal-content::-webkit-scrollbar-thumb:hover {
  background: #00e1ff;
}

.media-loading,
.media-error,
.media-empty {
  text-align: center;
  padding: 40px 20px;
  color: #67d5fd;
}

.media-error {
  color: #f56c6c;
}

.media-files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.media-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid #164159;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.media-file-item:hover {
  border-color: #67d5fd;
  background: rgba(103, 213, 253, 0.05);
}

.media-file-info {
  flex: 1;
  min-width: 0;
}

.media-file-name {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 4px;
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.file-type-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 内联下载进度条样式 */
.download-progress-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.download-progress-bar-inline {
  width: 40px;
  height: 4px;
  background: rgba(103, 213, 253, 0.1);
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(103, 213, 253, 0.2);
}

.download-progress-fill-inline {
  height: 100%;
  background: linear-gradient(90deg, #67d5fd, #00e1ff);
  border-radius: 1px;
  transition: width 0.3s ease;
  min-width: 0;
}

.download-progress-text-inline {
  color: #67d5fd;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 20px;
}

.media-file-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #67d5fd;
}

.media-file-actions {
  flex-shrink: 0;
  margin-left: 16px;
}

.media-preview-btn {
  background: #0c4666;
  color: #67d5fd;
  border: 1px solid #67d5fd;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 8px; /* Add some space between preview and download */
}

.media-preview-btn:hover:not(:disabled) {
  background: #67d5fd;
  color: #0a2a3a;
}

.media-preview-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.media-download-btn {
  background: #0c4666;
  color: #67d5fd;
  border: 1px solid #67d5fd;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.media-download-btn:hover:not(:disabled) {
  background: #67d5fd;
  color: #0a2a3a;
}

.media-download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 预览弹窗样式 */
.preview-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
  box-sizing: border-box;
}

.preview-modal {
  background: #0a2a3a;
  border: 1px solid #164159;
  border-radius: 8px;
  width: 1100px;
  height: 700px;
  max-width: 95vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  margin: auto;
}

.video-preview-modal {
  max-width: 95vw;
  width: 1100px;
  height: 700px;
  max-height: 80vh;
}

.preview-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #164159;
  background: #0c3c56;
  height: 45px;
  box-sizing: border-box;
}

.preview-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #67d5fd;
}

.preview-modal-close {
  background: none;
  border: none;
  color: #67d5fd;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.preview-modal-close:hover {
  background: rgba(103, 213, 253, 0.1);
}

.preview-modal-content {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  max-height: calc(100vh - 40px - 45px);
  overflow: hidden;
  height: calc(100% - 45px);
  box-sizing: border-box;
}

.preview-loading,
.preview-error {
  text-align: center;
  padding: 40px 20px;
  color: #67d5fd;
  font-size: 14px;
}

.preview-error {
  color: #f56c6c;
}

.image-preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 0;
  box-sizing: border-box;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0;
  box-shadow: none;
  max-width: 100%;
  max-height: 100%;
}

.video-preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 0;
  box-sizing: border-box;
}

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0;
  box-shadow: none;
  max-width: 100%;
  max-height: 100%;
}



/* Rewritten Simple Modal Styles - Dark Theme Balanced */
.custom-dialog-mask {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.6); z-index: 9999;
  display: flex; justify-content: center; align-items: center;
}
.simple-modal-card {
  width: 440px; margin: auto;
  background: #102a43; /* Slightly lighter deep blue */
  border: 1px solid #244f78;
  border-radius: 16px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  display: flex; flex-direction: column;
  max-height: 85vh;
  overflow: hidden;
}
.simple-modal-header {
  height: 48px; background: #163654; 
  border-bottom: 1px solid #244f78;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 20px; color: #fff; font-size: 16px; font-weight: 500;
  flex-shrink: 0;
}
.simple-close-icon { cursor: pointer; font-size: 20px; color: #909399; }
.simple-close-icon:hover { color: #fff; }

.simple-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
/* Custom Scrollbar for Webkit */
.simple-modal-body::-webkit-scrollbar { width: 6px; }
.simple-modal-body::-webkit-scrollbar-track { background: transparent; }
.simple-modal-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
.simple-modal-body::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }

.simple-form-item { margin-bottom: 18px; }
.simple-label { display: block; margin-bottom: 8px; font-size: 13px; color: #b0d0ff; } 
.required-star { color: #ff4d4f; margin-right: 4px; }
.simple-flex-row { display: flex; align-items: center; gap: 10px; }
.simple-radio { margin-right: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #fff; }

.simple-input, .simple-select {
  width: 100%; height: 34px;
  background: rgba(30, 60, 90, 0.5); 
  border: 1px solid #244f78;
  border-radius: 2px; padding: 0 10px; color: #fff; outline: none;
  font-size: 13px; box-sizing: border-box;
}
.simple-input:focus, .simple-select:focus { border-color: #409eff; background: rgba(30, 60, 90, 0.8); }
.simple-select option { background-color: #102a43; color: #fff; }

.simple-btn-blue {
  background: #409eff; border: none; color: #fff;
  border-radius: 2px; cursor: pointer; font-size: 13px;
  padding: 0 15px; height: 34px; white-space: nowrap;
}
.simple-btn-blue:hover { background: #66b1ff; }
.small-btn { height: 34px; line-height: 34px; padding: 0 15px; }

/* Switch */
.simple-switch {
  width: 36px; height: 18px; background: #4c4d4f; border-radius: 10px;
  position: relative; cursor: pointer; transition: 0.3s;
}
.simple-switch.active { background: #409eff; }
.simple-switch-dot {
  width: 14px; height: 14px; background: #fff; border-radius: 50%;
  position: absolute; top: 2px; left: 2px; transition: 0.3s;
}
.simple-switch.active .simple-switch-dot { left: 20px; }

.simple-modal-footer {
  padding: 16px 20px; border-top: 1px solid #244f78;
  display: flex; justify-content: center; gap: 20px;
  background: #102a43;
  flex-shrink: 0;
}
.simple-modal-btn {
  width: 100px; height: 34px; border-radius: 2px; border: none;
  font-size: 14px; cursor: pointer;
}
.simple-modal-btn.confirm { background: #409eff; color: #fff; }
.simple-modal-btn.confirm:hover { background: #66b1ff; }
.simple-modal-btn.cancel { background: transparent; color: #fff; border: 1px solid #4c4d4f; }
.simple-modal-btn.cancel:hover { border-color: #409eff; color: #409eff; }

/* Custom Select Dropdown */
.custom-select-dropdown {
  position: absolute;
  top: 100%; left: 0; right: 0;
  background: #102a43;
  border: 1px solid #244f78;
  border-radius: 4px;
  max-height: 200px; /* Reduced height as requested */
  overflow-y: auto;
  z-index: 10100;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.custom-select-option {
  padding: 8px 12px;
  cursor: pointer;
  color: #fff;
  font-size: 13px;
  transition: background 0.2s;
}
.custom-select-option:hover {
  background: #1e4b7a;
}
.custom-select-option.selected {
  background: #1e4b7a;
  color: #409eff;
  font-weight: 500;
}
/* Scrollbar for dropdown */
.custom-select-dropdown::-webkit-scrollbar { width: 6px; }
.custom-select-dropdown::-webkit-scrollbar-track { background: transparent; }
.custom-select-dropdown::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
.custom-select-dropdown::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }

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

.action-btn-arrive {
  color: #67d5fd;
}

.action-btn-arrive img {
  filter: drop-shadow(0 0 4px rgba(103, 213, 253, 0.4));
}
</style>