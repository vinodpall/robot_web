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
            <div class="mission-top-header">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">循迹任务</span>
              <div class="mission-top-data">
                <span class="mission-data-item">X坐标: <span class="mission-data-value">{{ currentPosition.x ?? '-' }}</span></span>
                <span class="mission-data-item">Y坐标: <span class="mission-data-value">{{ currentPosition.y ?? '-' }}</span></span>
                <span class="mission-data-item">Z坐标: <span class="mission-data-value">{{ currentPosition.z ?? '-' }}</span></span>
                <span class="mission-data-item">角度: <span class="mission-data-value">{{ currentPosition.angle ?? '-' }}</span></span>
                <span class="mission-data-item">任务ID: <span class="mission-data-value">{{ currentTaskId || '-' }}</span></span>
              </div>
            </div>
          </div>
          <div class="mission-content-wrapper">
            <div class="mission-toolbar">
              <!-- 任务组选择 -->
              <span class="mission-toolbar-label" style="margin-right: -8px;">路线名称：</span>
              <select v-model="selectedRouteName" class="mission-toolbar-select" style="min-width: 180px;" :disabled="isTrackTaskRunning">
                <option v-if="filteredRouteList.length === 0" value="">暂无路线</option>
                <option v-for="route in filteredRouteList" :key="route" :value="route">{{ route }}</option>
              </select>
              
              <!-- 关键点选择 -->
              <span class="mission-toolbar-label" style="margin-left: 20px; margin-right: -8px;">任务组名称：</span>
              <select v-model="selectedTaskGroupName" class="mission-toolbar-select" style="min-width: 180px;">
                <option v-if="taskGroupList.length === 0" value="">暂无任务组</option>
                <option v-for="group in taskGroupList" :key="group" :value="group">{{ group }}</option>
              </select>
              
              <!-- 操作按钮组 -->
              <div style="display: flex; gap: 12px; margin-left: 8px;">
                <button
                  class="mission-btn"
                  :class="isTrackTaskRunning ? 'mission-btn-stop' : 'mission-btn-primary'"
                  :disabled="((!canStartTrackTask || !hasNavInsMsfEnabled || filteredRouteList.length === 0 || taskGroupList.length === 0 || !selectedRouteName || !selectedTaskGroupName) && !isTrackTaskRunning) || (runningTaskType != null && runningTaskType !== 'track')"
                  v-permission-click-dialog="'task-tracklist-execute'"
                  @click="handleStartTrack"
                >
                  {{ isTrackTaskRunning ? '关闭' : '开始' }}
                </button>
                <button class="mission-btn" :class="isNavPaused ? 'mission-btn-stop' : 'mission-btn-secondary'" :disabled="!isNavigationEnabled" v-permission-click-dialog="'task-tracklist-pause'" @click="handlePauseTrack">
                  {{ isNavPaused ? '恢复' : '暂停' }}
                </button>
                <button class="mission-btn mission-btn-primary" :disabled="isTrackTaskRunning" v-permission-click-dialog="'task-tracklist-create'" @click="handleOpenCreateTaskGroupDialog">添加任务组</button>
                <button class="mission-btn mission-btn-stop" :disabled="isTrackTaskRunning || taskGroupList.length === 0 || !selectedRouteName || !selectedTaskGroupName" v-permission-click-dialog="'task-tracklist-delete'" @click="handleDeleteTaskGroup">删除任务组</button>
                <button class="mission-btn mission-btn-primary" :disabled="taskGroupList.length === 0 || !selectedRouteName || !selectedTaskGroupName" v-permission-click-dialog="'task-tracklist-create'" @click="handleAddTask">添加任务</button>
                <button class="mission-btn mission-btn-secondary" v-permission-click-dialog="'task-tracklist-show'" @click="openPreviewDialog">预览</button>
              </div>
            </div>
            <div class="file-table file-table-adaptive">
              <div class="file-table-header">
                <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center; display: flex; align-items: center; justify-content: center;">序号</div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center; display: flex; align-items: center; justify-content: center;">任务类型</div>
                <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">X坐标</div>
                <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">Y坐标</div>
                <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">Z坐标</div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center; display: flex; align-items: center; justify-content: center;">角度</div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center; display: flex; align-items: center; justify-content: center;">预置点</div>
                <div class="file-table-cell" style="min-width: 200px; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">描述</div>
                <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center; display: flex; align-items: center; justify-content: center;">操作</div>
              </div>
              <div class="file-table-body">
                <!-- 显示实际数据行 -->
                <template v-if="waypointsData.length > 0">
                <div class="file-table-row" :class="{ 'task-last-row-active': isLastTaskRow(waypoint) }" v-for="waypoint in waypointsData" :key="waypoint.index">
                  <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center;">
                    <span class="ms-seq-num">{{ waypoint.index + 1 }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;">
                    <span v-if="waypoint.type" class="ms-type-tag">{{ waypoint.type }}</span>
                    <span v-else class="ms-empty">-</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;">
                    <span class="ms-coord-val">{{ waypoint.coordinates?.x ?? '-' }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;">
                    <span class="ms-coord-val">{{ waypoint.coordinates?.y ?? '-' }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;">
                    <span class="ms-coord-val">{{ waypoint.coordinates?.z ?? '-' }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">
                    <span class="ms-coord-val">{{ waypoint.angle ?? '-' }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;">
                    <span v-if="waypoint.preset" class="ms-preset-tag">{{ waypoint.preset }}</span>
                    <span v-else class="ms-empty">-</span>
                  </div>
                  <div class="file-table-cell file-table-name" style="min-width: 200px; flex: 1; text-align: center;">
                    <span v-if="waypoint.description" class="ms-desc-text">{{ waypoint.description }}</span>
                    <span v-else class="ms-empty">-</span>
                  </div>
                  <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center; display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="action-btn action-btn-edit" v-permission-click-dialog="'task-tracklist-edit'" @click="handleEditTask(waypoint)">
                      <img :src="editIcon" alt="编辑" />
                      编辑
                    </button>
                    <button class="action-btn action-btn-delete" v-permission-click-dialog="'task-tracklist-delete'" @click="handleDeleteTask(waypoint)">
                      <img :src="deleteIcon" alt="删除" />
                      删除
                    </button>
                    <button class="action-btn action-btn-arrive" v-permission-click-dialog="'task-tracklist-execute'" @click="handleArriveTask(waypoint)">
                      <img :src="arriveIcon" alt="到点" />
                      到点
                    </button>
                  </div>
                </div>
              </template>
                <!-- 始终显示固定的空行以保持表格边框（补足到10行） -->
                <div class="file-table-row" v-for="i in missionEmptyRowCount" :key="'empty-' + i">
                  <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 200px; flex: 1; text-align: center;"></div>
                  <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center;"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
    <!-- 弹窗等 -->
    <ConfirmDialog
      :show="confirmDialog.visible"
      title="操作确认"
      :message="confirmDialog.message"
      type="warning"
      confirm-text="确认"
      cancel-text="取消"
      @confirm="onConfirmDialogOk"
      @cancel="onConfirmDialogCancel"
      @close="onConfirmDialogCancel"
    />
    <div v-if="previewDialog.visible" class="custom-dialog-mask preview-dialog-mask" @click="closePreviewDialog">
      <div class="preview-modal" @click.stop>
        <div class="preview-modal-header">
          <span>运行预览</span>
          <span class="simple-close-icon" @click="closePreviewDialog">×</span>
        </div>
        <div class="preview-modal-body">
          <div class="preview-map-wrap">
            <ThreePointCloudPreview
              :points="previewPointCloudData"
              :loading="previewDialog.loading"
              :error="previewDialog.error"
              :normalization-params="previewPointCloudNormalization"
              :robot-pose="robotStore.pose"
              :robot-mesh="previewPc.robotMesh.value"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="uploadDialog.visible" class="custom-dialog-mask">
      <div class="dispatch-task-modal upload-task-modal">
        <div class="dispatch-task-modal-content">
          <div class="dispatch-task-title">上传航线文件</div>
          <div class="dispatch-task-form">
            <!-- 文件上传区域 -->
            <div class="dispatch-task-row">
              <label>航线文件：</label>
              <div class="upload-file-wrapper">
                <label class="upload-file-btn">
                  <input
                    type="file"
                    accept=".kmz"
                    @change="onFileChange"
                    ref="fileInputRef"
                    class="upload-file-input"
                  />
                  选择文件
                </label>
                <span class="upload-file-tip">仅支持 .kmz 格式文件</span>
              </div>
            </div>
            
            <!-- 文件名称显示 -->
            <div v-if="uploadDialog.fileName" class="dispatch-task-row">
              <label>已选文件：</label>
              <div class="upload-file-name">
                <svg class="upload-file-icon" viewBox="0 0 20 20" width="18" height="18">
                  <path fill="#67d5fd" d="M4 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.83A2 2 0 0 0 17.41 7l-4.42-4.42A2 2 0 0 0 11.17 2H4zm6 1.5V8a1 1 0 0 0 1 1h4.5L10 3.5z"></path>
                </svg>
                {{ uploadDialog.fileName }}
              </div>
            </div>
            
            <!-- 航线名称输入框 -->
            <div class="dispatch-task-row">
              <label>航线名称：</label>
              <input 
                v-model="uploadDialog.waylineName" 
                class="dispatch-task-input" 
                placeholder="选择文件后自动填充，可手动修改"
                maxlength="50"
              />
            </div>
            
            <!-- 无人机型号显示 -->
            <div class="dispatch-task-row">
              <label>无人机型号：</label>
              <input 
                :value="uploadDialog.droneModel || '未知型号'" 
                class="dispatch-task-input" 
                disabled
              />
            </div>
          </div>
          <div class="dispatch-task-actions">
            <button class="mission-btn mission-btn-cancel" @click="onUploadCancel">取消</button>
            <button class="mission-btn mission-btn-pause" :disabled="!uploadDialog.file" @click="onUploadConfirm">上传</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="dispatchTaskDialog.visible" class="custom-dialog-mask">
      <div class="dispatch-task-modal">
        <div class="dispatch-task-modal-content">
          <div class="dispatch-task-title">下发任务</div>
          <div class="dispatch-task-form">
            <div class="dispatch-task-row">
              <label>任务名称：</label>
              <input 
                v-model="dispatchTaskDialog.form.name" 
                class="dispatch-task-input" 
                placeholder="请输入任务名称"
              />
            </div>
            <div class="dispatch-task-row">
              <label>设备序列号：</label>
              <input 
                v-model="dispatchTaskDialog.form.dock_sn" 
                class="dispatch-task-input" 
                disabled
              />
            </div>
            <div class="dispatch-task-row">
              <label>航线文件ID：</label>
              <input 
                v-model="dispatchTaskDialog.form.file_id" 
                class="dispatch-task-input" 
                disabled
              />
            </div>
            <div class="dispatch-task-row">
              <label>任务类型：</label>
              <div class="custom-select-wrapper">
                <select v-model="dispatchTaskDialog.form.task_type" class="mission-select">
                  <option :value="0">立即任务</option>
                  <option :value="1">定时任务</option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#fff"/>
                  </svg>
                </span>
              </div>
            </div>
            <div v-if="dispatchTaskDialog.form.task_type === 1" class="dispatch-task-row">
              <label>开始时间：</label>
              <input 
                v-model="dispatchTaskDialog.form.begin_time" 
                type="datetime-local" 
                class="dispatch-task-input"
                :min="getMinLocalDateTime()"
              />
              <div v-if="dispatchTaskDialog.form.task_type === 1" class="time-tip">提示：定时任务的开始时间必须在当前时间4分钟及以后</div>
            </div>
            <div v-if="dispatchTaskDialog.form.task_type === 1" class="dispatch-task-row">
              <label>周期任务：</label>
              <div class="dispatch-switch-wrapper">
                <div
                  class="switch-container"
                  :class="{ active: dispatchTaskDialog.form.enable_recurrence }"
                  @click="dispatchTaskDialog.form.enable_recurrence = !dispatchTaskDialog.form.enable_recurrence"
                >
                  <div class="switch-toggle"></div>
                </div>
                <span class="dispatch-switch-label">{{ dispatchTaskDialog.form.enable_recurrence ? '开启' : '关闭' }}</span>
              </div>
            </div>
            <div v-if="dispatchTaskDialog.form.task_type === 1 && dispatchTaskDialog.form.enable_recurrence" class="dispatch-task-row">
              <label>开始日期：</label>
              <input 
                v-model="dispatchTaskDialog.form.recurrence_start_date" 
                type="date" 
                class="dispatch-task-input"
                :min="getTodayDate()"
              />
            </div>
            <div v-if="dispatchTaskDialog.form.task_type === 1 && dispatchTaskDialog.form.enable_recurrence" class="dispatch-task-row">
              <label>结束日期：</label>
              <input 
                v-model="dispatchTaskDialog.form.recurrence_end_date" 
                type="date" 
                class="dispatch-task-input"
                :min="getTodayDate()"
              />
            </div>
            <div class="dispatch-task-row">
              <label>返航高度：</label>
              <input 
                v-model="dispatchTaskDialog.form.rth_altitude" 
                type="number" 
                class="dispatch-task-input" 
                placeholder="100"
              />
              <span class="unit-label">米</span>
            </div>
            <div class="dispatch-task-row">
              <label>算法开关：</label>
              <div class="dispatch-switch-wrapper">
                <div
                  class="switch-container"
                  :class="{ active: dispatchTaskDialog.form.enable_vision }"
                  @click="dispatchTaskDialog.form.enable_vision = !dispatchTaskDialog.form.enable_vision"
                >
                  <div class="switch-toggle"></div>
                </div>
                <span class="dispatch-switch-label">{{ dispatchTaskDialog.form.enable_vision ? '开启' : '关闭' }}</span>
              </div>
            </div>
            <div class="dispatch-task-row">
              <label>算法选择：</label>
              <div class="dispatch-algorithm-options">
                <label v-for="(name, id) in algorithmOptions" :key="id" class="dispatch-algorithm-option">
                  <input 
                    type="checkbox" 
                    :value="id" 
                    v-model="dispatchTaskDialog.form.vision_algorithms"
                    class="dispatch-algorithm-checkbox"
                    :disabled="!dispatchTaskDialog.form.enable_vision"
                  />
                  <span class="dispatch-algorithm-label" :class="{ 'disabled': !dispatchTaskDialog.form.enable_vision }">{{ name }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="dispatch-task-actions">
            <button class="mission-btn mission-btn-cancel" @click="onDispatchTaskCancel">取消</button>
            <button class="mission-btn mission-btn-pause" v-permission-click-dialog="'task-tracklist-execute'" @click="onDispatchTaskConfirm">确定</button>
          </div>
        </div>
      </div>
    </div>
    <!-- 添加任务组弹窗 -->
    <div v-if="showCreateTaskGroupDialog" class="custom-dialog-mask" @click="closeCreateTaskGroupDialog">
      <div class="simple-modal-card task-group-modal" @click.stop>
        <div class="simple-modal-header">
          <span>添加任务组</span>
          <span class="simple-close-icon" @click="closeCreateTaskGroupDialog">×</span>
        </div>
        <div class="simple-modal-body" style="padding: 35px 40px;">
          <div style="display: flex; justify-content: center;">
            <input
              v-model="createTaskGroupForm.keypoint_name"
              type="text"
              class="task-form-input task-group-input"
              placeholder="请输入任务组名称"
            />
          </div>
        </div>
        <div class="simple-modal-footer">
          <button class="mission-btn mission-btn-primary" v-permission-click-dialog="'task-tracklist-create'" @click="handleCreateTaskGroup">确定</button>
          <button class="mission-btn mission-btn-secondary" @click="closeCreateTaskGroupDialog">取消</button>
        </div>
      </div>
    </div>
    <!-- 循迹任务启动弹窗 -->
    <div v-if="trackStartDialog.visible" class="custom-dialog-mask">
      <div class="dispatch-task-modal track-start-modal">
        <div class="dispatch-task-modal-content">
          <div class="dispatch-task-title">启动循迹任务</div>
          <div class="dispatch-task-form">
            <div class="dispatch-task-row">
              <label>循迹任务：</label>
              <input 
                v-model="trackStartDialog.form.track_name" 
                class="dispatch-task-input" 
                disabled
              />
            </div>
            <div class="dispatch-task-row">
              <label>关键点文件：</label>
              <div class="custom-select-wrapper">
                <select 
                  v-model="trackStartDialog.form.taskpoint_name"
                  class="mission-select"
                  :disabled="taskGroupList.length === 0 || trackStartDialog.loading"
                >
                  <option v-if="taskGroupList.length === 0" value="">暂无关键点文件</option>
                  <option 
                    v-for="taskGroup in taskGroupList"
                    :key="taskGroup"
                    :value="taskGroup"
                  >
                    {{ taskGroup }}
                  </option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#67d5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
            <div v-if="taskGroupList.length === 0" class="dispatch-task-row">
              <label></label>
              <div class="time-tip" style="color: #ff6b6b;">提示：当前循迹任务没有关键点文件，请先创建</div>
            </div>
            <div class="dispatch-task-row">
              <label>避障模式：</label>
              <div class="custom-select-wrapper">
                <select v-model="trackStartDialog.form.obs_mode" class="mission-select" :disabled="trackStartDialog.loading">
                  <option :value="0">无避障</option>
                  <option :value="1">近障模式</option>
                  <option :value="2">绕障模式</option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#67d5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
            <div class="dispatch-task-row">
              <label>步态选择：</label>
              <div class="custom-select-wrapper">
                <select v-model="trackStartDialog.form.gait_type" class="mission-select" :disabled="trackStartDialog.loading">
                  <option :value="0">行走步态</option>
                  <option :value="1">斜坡步态</option>
                  <option :value="2">越障步态</option>
                  <option :value="3">楼梯步态</option>
                  <option :value="4">帧楼梯步态</option>
                  <option :value="5">帧45°楼梯步态</option>
                  <option :value="6">L行走步态</option>
                  <option :value="7">山地步态</option>
                  <option :value="8">静音步态</option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#67d5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div class="dispatch-task-actions">
            <button 
              class="mission-btn mission-btn-pause" 
              :class="{ disabled: taskGroupList.length === 0 || !trackStartDialog.form.taskpoint_name || trackStartDialog.loading }"
              :disabled="trackStartDialog.loading || taskGroupList.length === 0 || !trackStartDialog.form.taskpoint_name"
              v-permission-click-dialog="'task-tracklist-execute'" 
              @click="onTrackStartConfirm"
            >
              {{ trackStartDialog.loading ? '启动中...' : '确定' }}
            </button>
            <button class="mission-btn mission-btn-cancel" :disabled="trackStartDialog.loading" @click="onTrackStartCancel">取消</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="trackInitDialog.visible" class="custom-dialog-mask track-init-mask">
      <div class="track-init-modal">
        <span class="track-init-spinner"></span>
        <span class="track-init-text">{{ trackInitDialog.text }}</span>
      </div>
    </div>
    <div v-if="dispatchTaskDialog.visible" class="dispatch-task-modal-wrapper">
       <!-- (Existing dispatch dialog exists in file, I won't touch it, just appending new one) -->
    </div>
    <!-- Add Task Modal -->
    <Teleport to="body">
      <div v-if="addTaskDialog.visible" class="custom-dialog-mask">
        <div class="simple-modal-card add-task-modal-card">
          <div class="simple-modal-header">
            <span>{{ isEditMode ? '编辑任务' : '添加任务' }}</span>
            <span class="simple-close-icon" @click="cancelAddTask">×</span>
          </div>
          
          <div class="simple-modal-body add-task-modal-body">
            <!-- 任务类型 -->
            <div class="simple-form-item">
              <div class="simple-flex-row" style="margin-bottom: 8px;">
                 <label class="simple-label" style="margin-bottom: 0; margin-right: 15px;"><span class="required-star">*</span>任务类型</label>
                 <label class="simple-radio"><input type="radio" v-model="addTaskDialog.form.isMulti" value="0"> <span>单选</span></label>
                 <label class="simple-radio"><input type="radio" v-model="addTaskDialog.form.isMulti" value="1"> <span>多选</span></label>
              </div>
              <div class="simple-flex-row">
                 <input v-model="addTaskDialog.form.typeInput" :class="['simple-input', { 'input-error-border': !!addTaskFieldErrors.taskType }]" style="flex: 2;" readonly>
                 <div :class="['custom-select-wrapper', { 'input-error-border': !!addTaskFieldErrors.taskType }]" style="flex: 1; position: relative;" @click.stop="showTypeDropdown = !showTypeDropdown">
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
              <div v-if="addTaskFieldErrors.taskType" class="input-error-text">{{ addTaskFieldErrors.taskType }}</div>
            </div>

            <!-- 坐标 XYZ -->
            <div class="simple-form-grid">
              <div class="simple-form-item">
                 <label class="simple-label">X坐标</label>
                 <input v-model="addTaskDialog.form.x" :class="['simple-input', { 'input-error-border': !!addTaskFieldErrors.x }]">
                 <div v-if="addTaskFieldErrors.x" class="input-error-text">{{ addTaskFieldErrors.x }}</div>
              </div>
              <div class="simple-form-item">
                 <label class="simple-label">Y坐标</label>
                 <input v-model="addTaskDialog.form.y" :class="['simple-input', { 'input-error-border': !!addTaskFieldErrors.y }]">
                 <div v-if="addTaskFieldErrors.y" class="input-error-text">{{ addTaskFieldErrors.y }}</div>
              </div>
            </div>
            <div class="simple-form-grid">
              <div class="simple-form-item">
                 <label class="simple-label">Z坐标</label>
                 <input v-model="addTaskDialog.form.z" :class="['simple-input', { 'input-error-border': !!addTaskFieldErrors.z }]">
                 <div v-if="addTaskFieldErrors.z" class="input-error-text">{{ addTaskFieldErrors.z }}</div>
              </div>
              <div class="simple-form-item">
                 <label class="simple-label">角度</label>
                 <input v-model="addTaskDialog.form.angle" :class="['simple-input', { 'input-error-border': !!addTaskFieldErrors.angle }]">
                 <div v-if="addTaskFieldErrors.angle" class="input-error-text">{{ addTaskFieldErrors.angle }}</div>
              </div>
            </div>

            <!-- 预置点 -->
             <div class="simple-form-item">
               <label class="simple-label">预置点</label>
               <div class="simple-flex-row">
                  <input v-model="addTaskDialog.form.preset" class="simple-input" style="flex: 1;">
                 <button class="mission-btn mission-btn-primary" style="height: 34px; padding: 0 15px; display: flex; align-items: center; justify-content: center;" @click="openPresetDialog">选择</button>
               </div>
            </div>

            <!-- 额外事务 -->
             <div class="simple-form-item">
               <label class="simple-label">额外事务</label>
               <div class="simple-flex-row extra-config-display-row">
                  <span
                    class="extra-config-display-text"
                    :title="extraConfigDisplayValue || '未配置'"
                  >
                    {{ extraConfigDisplayValue || '未配置' }}
                  </span>
                  <button class="mission-btn mission-btn-primary extra-config-display-btn" style="height: 34px; padding: 0 15px; display: flex; align-items: center; justify-content: center;" @click="openExtraConfigDialog">配置</button>
               </div>
            </div>

            <!-- 描述 -->
             <div class="simple-form-item">
               <label class="simple-label">描述</label>
               <input v-model="addTaskDialog.form.description" class="simple-input">
            </div>

            <!-- 步态 & 地形 -->
             <div class="simple-form-grid">
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
            </div>

             <div class="simple-form-grid">
               <div class="simple-form-item stop-switch-item">
                 <label class="simple-label">到点停止运动</label>
                 <div class="simple-flex-row stop-switch-row">
                   <div class="simple-switch" @click="addTaskDialog.form.stopAtPoint = !addTaskDialog.form.stopAtPoint" :class="{active: addTaskDialog.form.stopAtPoint}">
                      <div class="simple-switch-dot"></div>
                   </div>
                   <img :src="addTaskDialog.form.stopAtPoint ? unlockIcon : lockIcon" style="width: 20px; height: 20px; margin-left: 10px;" />
                 </div>
              </div>
               <div class="simple-form-item">
                 <label class="simple-label">避障模式</label>
                  <select v-model="addTaskDialog.form.obsMode" class="simple-select">
                    <option value="无避障">无避障</option>
                    <option value="近障模式">近障模式</option>
                    <option value="绕障模式">绕障模式</option>
                  </select>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="simple-modal-footer">
             <button
               class="mission-btn mission-btn-primary"
               style="width: 120px; display: flex; align-items: center; justify-content: center; gap: 8px;"
               :disabled="addTaskSubmitting"
               v-permission-click-dialog="['task-tracklist-create', 'task-tracklist-edit']"
               @click="confirmAddTask"
             >
               <span v-if="addTaskSubmitting" class="btn-spinner"></span>
               <span>{{ addTaskSubmitting ? '提交中...' : '确定' }}</span>
             </button>
             <button
               class="mission-btn"
               style="width: 100px; background: transparent; border: 1px solid #606266; color: #fff;"
               :disabled="addTaskSubmitting"
               @click="cancelAddTask"
             >取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Preset Selection Modal -->
   <Teleport to="body">
      <div v-if="presetDialog.visible" class="custom-dialog-mask">
         <div class="simple-modal-card" style="width: 1160px; max-width: 95vw; height: 610px;">
            <div class="simple-modal-header">
               <span>设置预置点</span>
               <span class="simple-close-icon" @click="closePresetDialog">×</span>
            </div>
            <div class="simple-modal-body" style="display: flex; gap: 20px; padding: 20px; overflow: hidden; height: 100%;">
               <!-- Left Video -->
               <div ref="presetVideoWrapper" class="video-only-wrapper" style="flex: 0 0 800px; height: 450px; border: 1px solid #244f78; border-radius: 0;">
                   <video 
                     ref="videoElement"
                     :class="['video-only-element', { 'video-hidden': !isPlaying }]"
                     :controls="isPlaying"
                     controlsList="noremoteplayback nodownload"
                     disablePictureInPicture
                     muted
                     autoplay
                     playsinline
                     webkit-playsinline
                     style="width: 100%; height: 100%; border-radius: 0;"
                   >
                     您的浏览器不支持视频播放
                   </video>
                   <div v-if="!isPlaying" class="video-empty-state">Visible Light Stream</div>
                   <div class="video-action-group">
                     <button
                       class="video-action-btn stream-mode-btn"
                       :disabled="isPresetStreamSwitching || !canSwitchPresetVideoStream"
                       :title="`切换到${presetVideoStreamModeLabel === '主' ? '子码流' : '主码流'}`"
                       @click.stop="handleTogglePresetVideoStream"
                     >
                       {{ isPresetStreamSwitching ? '...' : presetVideoStreamModeLabel }}
                     </button>
                     <button class="video-action-btn icon-only" title="手动重连" @click.stop="handlePresetManualReconnect">
                       <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <path d="M20 12A8 8 0 1 1 17.66 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                         <path d="M20 4V9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                       </svg>
                     </button>
                     <button class="video-action-btn icon-only" title="全屏" @click.stop="togglePresetVideoPanelFullscreen">
                       <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <path d="M8 3H3V8M16 3H21V8M8 21H3V16M16 21H21V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                       </svg>
                     </button>
                   </div>
               </div>
               
               <!-- Right Controls -->
                <div style="flex: 0 0 300px; display: flex; flex-direction: column; gap: 10px; padding-top: 10px;">
                   <!-- PTZ -->
                   <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        <button class="ptz-btn" @mousedown="ptzMove('up')" @mouseup="ptzStop">▲</button>
                        <div style="display: flex; gap: 12px;">
                             <button class="ptz-btn" @mousedown="ptzMove('left')" @mouseup="ptzStop">◀</button>
                             <button class="ptz-btn" @click="ptzStop">↺</button>
                             <button class="ptz-btn" @mousedown="ptzMove('right')" @mouseup="ptzStop">▶</button>
                        </div>
                        <button class="ptz-btn" @mousedown="ptzMove('down')" @mouseup="ptzStop">▼</button>
                   </div>

                   <!-- Actions -->
                   <div style="display: flex; gap: 12px; justify-content: center; margin-top: 8px;">
                        <button class="mission-btn-blue" style="width: 50px; font-weight: bold; font-size: 24px;" @click="ptzZoom(true)">+</button>
                        <button class="mission-btn-blue" style="width: 50px; font-weight: bold; font-size: 24px;" @click="ptzZoom(false)">-</button>
                        <button class="mission-btn-blue" style="width: 50px;" @click="ptzFocus(true)">
                           <div style="border: 1px dashed #fff; width: 14px; height: 14px;"></div>
                        </button>
                        <button class="mission-btn-blue" style="width: 50px;" @click="ptzFocus(false)">
                           <div style="border: 1px solid #fff; width: 14px; height: 14px;"></div>
                        </button>
                   </div>
                   
                   <div class="simple-form-item" style="margin-top: 8px; margin-bottom: 8px;">
                       <label class="simple-label">设置预置点：</label>
                        <div class="custom-select-wrapper" ref="presetDropdownRef" style="position: relative;" tabindex="0" @blur="isPresetDropdownOpen = false">
                             <div class="simple-select" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;" @click="isPresetDropdownOpen = !isPresetDropdownOpen">
                                 <span>{{ presetDialog.form.name || '请选择预置点' }}</span>
                                 <span style="font-size:12px; transform: scaleY(0.6);">▼</span>
                             </div>
                             <div v-show="isPresetDropdownOpen" class="custom-select-dropdown" style="max-height: 340px; background: #102a43; border: 1px solid #244f78;">
                                  <div 
                                    v-for="p in presetList" 
                                    :key="p.id" 
                                    class="custom-select-option" 
                                    :class="{ selected: presetDialog.form.id === p.id }"
                                    @mousedown.prevent="selectPreset(p)"
                                  >
                                     {{ p.name }}
                                  </div>
                             </div>
                        </div>
                   </div>
                   
                    <div style="display: flex; gap: 5px;">
                        <button class="mission-btn mission-btn-primary" style="flex:1; padding: 0; font-size: 13px; min-width: 0;" @click="handleSetPreset">设置预置点</button>
                        <button class="mission-btn mission-btn-primary" style="flex:1; padding: 0; font-size: 13px; min-width: 0;" @click="handleGotoPreset">转到预置点</button>
                        <button class="mission-btn mission-btn-primary" style="flex:1; padding: 0; font-size: 13px; min-width: 0;">转速</button>
                   </div>
                   
                   <div class="simple-form-item">
                       <label class="simple-label">预置点名称：</label>
                       <input v-model="presetDialog.form.name" class="simple-input" />
                   </div>
               </div>
            </div>
            <div class="simple-modal-footer">
               <button class="mission-btn mission-btn-primary" style="width: 100px;" @click="confirmPresetChoice">确定</button>
               <button class="mission-btn" style="width: 100px; background: transparent; border: 1px solid #606266; color: #fff;" @click="closePresetDialog">取消</button>
            </div>
         </div>
      </div>
   </Teleport>

    <!-- 额外配置弹窗 -->
    <Teleport to="body">
      <div v-if="extraConfigDialog.visible" class="custom-dialog-mask" style="z-index: 10001;">
        <div class="simple-modal-card" style="width: 500px; max-width: 95vw;" @click.stop>
          <div class="simple-modal-header">
            <span>参数配置</span>
            <span class="simple-close-icon" @click="closeExtraConfigDialog">×</span>
          </div>
          <div class="simple-modal-body" style="padding: 30px;">
            <div v-if="activeExtraConfigFields.length === 0" class="simple-form-item">
              <label class="simple-label">额外事务</label>
              <input
                v-model="extraConfigDialog.rawExtra"
                class="simple-input extra-config-input"
                placeholder="请输入额外事务"
              />
            </div>
            <div v-for="field in activeExtraConfigFields" :key="field.field" class="simple-form-item">
              <label class="simple-label">
                <span v-if="field.required" class="required-star">*</span>{{ field.title }}
              </label>
              <input
                v-model="extraConfigDialog.formValues[field.field]"
                class="simple-input extra-config-input"
                :class="{ 'input-error-border': !!extraConfigDialog.errors[field.field] }"
                :placeholder="field.default !== undefined && field.default !== null ? `默认值：${field.default}` : '请输入'"
              />
              <div v-if="extraConfigDialog.errors[field.field]" class="input-error-text">{{ extraConfigDialog.errors[field.field] }}</div>
            </div>
          </div>
          <div class="simple-modal-footer">
            <button class="mission-btn mission-btn-primary" style="width: 100px;" @click="confirmExtraConfig">确定</button>
            <button class="mission-btn mission-btn-secondary" style="width: 100px;" @click="closeExtraConfigDialog">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

  <!-- 成功/错误提示（挂载到 body，避免被弹窗遮挡） -->
  <Teleport to="body">
    <SuccessMessage 
      :show="successMessage.show" 
      :message="successMessage.text"
      @close="successMessage.show = false"
    />
    <ErrorMessage 
      :show="errorMessage.show" 
      :message="errorMessage.text"
      @close="errorMessage.show = false"
    />
  </Teleport>

  <ConfirmDialog
    :show="deleteTaskGroupDialog.show"
    :title="deleteTaskGroupDialog.title"
    :message="deleteTaskGroupDialog.message"
    type="warning"
    confirm-text="删除"
    cancel-text="取消"
    @confirm="deleteTaskGroupDialog.onConfirm"
    @cancel="deleteTaskGroupDialog.show = false"
    @close="deleteTaskGroupDialog.show = false"
  />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import trackListIcon from '@/assets/source_data/svg_data/track_list.svg'
import taskAutoIcon from '@/assets/source_data/svg_data/robot_source/task_auto.svg'
import taskTimeIcon from '@/assets/source_data/svg_data/robot_source/task_time.svg'
import taskMultiIcon from '@/assets/source_data/svg_data/robot_source/task_multi.svg'
import { useWaylineJobs, useDevices } from '../composables/useApi'
import { waylineApi, navigationApi, dogApi, cameraApi } from '@/api/services'
import { useDeviceStatus } from '../composables/useDeviceStatus'
import icon360Photo from '@/assets/source_data/svg_data/task_line_svg/360_photo.svg'
import iconAbsPhoto from '@/assets/source_data/svg_data/task_line_svg/abs_photo.svg'
import iconBigger from '@/assets/source_data/svg_data/task_line_svg/bigger.svg'
import iconHover from '@/assets/source_data/svg_data/task_line_svg/hover.svg'
import iconIntervalDistance from '@/assets/source_data/svg_data/task_line_svg/interval_distance.svg'
import iconIntervalStop from '@/assets/source_data/svg_data/task_line_svg/interval_stop.svg'
import iconIntervalTime from '@/assets/source_data/svg_data/task_line_svg/interval_time.svg'
import iconLeftRight from '@/assets/source_data/svg_data/task_line_svg/left_right.svg'
import iconRightDown from '@/assets/source_data/svg_data/task_line_svg/right_down.svg'
import iconStartVideo from '@/assets/source_data/svg_data/task_line_svg/start_video.svg'
import iconStopVideo from '@/assets/source_data/svg_data/task_line_svg/stop_video.svg'
import iconTakePhoto from '@/assets/source_data/svg_data/task_line_svg/take_photo.svg'
import lockIcon from '@/assets/source_data/svg_data/robot_source/lock.png'
import unlockIcon from '@/assets/source_data/svg_data/robot_source/unlock.png'
import SuccessMessage from '@/components/SuccessMessage.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import editIcon from '@/assets/source_data/svg_data/robot_source/edit.png'
import deleteIcon from '@/assets/source_data/svg_data/robot_source/delete.png'
import arriveIcon from '@/assets/source_data/svg_data/robot_source/arrive.png'
import { useTaskExecutionStore } from '@/stores/taskExecution'
import { useRobotStore } from '@/stores/robot'
import { usePointCloudRenderer } from '@/composables/usePointCloudRenderer'
import ThreePointCloudPreview from '@/components/ThreePointCloudPreview.vue'
import { getTrajectoryFile } from '@/utils/trajectoryDB'
import { load3MF } from '@/utils/threemfParser'
import { usePermissionStore } from '@/stores/permission'
import { getRobotMapCacheKeys, getRobotContextCacheKeys } from '@/utils/robotBootstrap'
import { getVideoStream, getVideoStreams, setVideoStreams } from '@/utils/videoCache'
import type { VideoStream } from '@/utils/videoCache'

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()

// 使用航线文件API
const { waylineFiles, waylineDetail, fetchWaylineFiles, fetchWaylineDetail, createJob, executeJob } = useWaylineJobs()
const { getCachedWorkspaceId, getCachedDeviceSns, getCachedDeviceBySn } = useDevices()
const { droneStatus, fetchMainDeviceStatus, fetchDroneStatus } = useDeviceStatus()
const taskExecutionStore = useTaskExecutionStore()
const {
  isTrackTaskRunning,
  canStartTrackTask,
  runningTaskType,
  isNavigationEnabled,
  navPaused: isNavPaused
} = storeToRefs(taskExecutionStore)
const robotStore = useRobotStore()
const hasNavInsMsfEnabled = computed(() => {
  const cmdStatus = robotStore.cmdStatus
  return cmdStatus?.nav === 1 || cmdStatus?.ins === 1 || cmdStatus?.msf === 1
})

// 航线文件相关
const selectedTrack = ref('')
const trackFileLoading = ref(false)

// 当前位置和任务信息
const currentPosition = ref<{
  x: number | null
  y: number | null
  z: number | null
  angle: number | null
}>({
  x: null,
  y: null,
  z: null,
  angle: null
})
const currentTaskId = ref('')

const syncCurrentPositionFromPose = (pose: { x: number; y: number; z: number; theta: number } | null) => {
  if (!pose) return
  currentPosition.value = {
    x: Number(pose.x.toFixed(3)),
    y: Number(pose.y.toFixed(3)),
    z: Number(pose.z.toFixed(3)),
    // 与首页机器人状态保持一致：显示 pose_update.theta 原始值
    angle: Number(pose.theta.toFixed(3))
  }
}

watch(
  () => robotStore.pose,
  (pose) => {
    syncCurrentPositionFromPose(pose)
  },
  { immediate: true, deep: true }
)

// 循迹任务 - 路线与任务组
const routeList = ref<string[]>([])
const selectedRouteName = ref('')
const taskGroupList = ref<string[]>([])
const selectedTaskGroupName = ref('')
let taskGroupRequestToken = 0

const clearRouteAndTaskGroupState = (clearRoutes = true) => {
  // 递增 token 使进行中的任务组请求结果失效，避免旧数据回填
  taskGroupRequestToken++
  if (clearRoutes) {
    routeList.value = []
  }
  selectedRouteName.value = ''
  taskGroupList.value = []
  selectedTaskGroupName.value = ''
}

// 预览弹窗点云
const previewDialog = ref({
  visible: false,
  loading: false,
  error: ''
})
const previewPc = usePointCloudRenderer({ initialScale: 1, initialPointSize: 0.5 })
const previewPointCloudCanvas = previewPc.canvasRef
const previewPointCloudData = previewPc.data
const previewBasePointCloudData = previewPc.baseData
const previewPointCloudNormalization = previewPc.normalizationParams
const previewOverlayTrajectory = ref<Array<{ x: number; y: number; z: number }>>([])
const previewOverlayTaskPoints = ref<Array<{ x: number; y: number; z: number; name: string }>>([])
let previewCanvasEventController: AbortController | null = null
let previewResizeObserver: ResizeObserver | null = null

const MAP_DB_NAME = 'MapFilesDB'
const MAP_STORE_NAME = 'mapFiles'

// 添加任务组弹窗
const showCreateTaskGroupDialog = ref(false)
const createTaskGroupForm = ref({
  keypoint_name: ''
})

// 成功/失败提示
const successMessage = ref({
  show: false,
  text: ''
})
const errorMessage = ref({
  show: false,
  text: ''
})
const deleteTaskGroupDialog = ref({
  show: false,
  title: '删除任务组',
  message: '',
  onConfirm: async () => {}
})

const showMissionSuccess = (text: string, duration = 2500) => {
  successMessage.value = { show: true, text }
  window.setTimeout(() => {
    successMessage.value.show = false
  }, duration)
}

const showMissionError = (text: string, duration = 3000) => {
  errorMessage.value = { show: true, text }
  window.setTimeout(() => {
    errorMessage.value.show = false
  }, duration)
}

const parseMissionErrorMessage = (error: any) => {
  const message = error?.detail
    || error?.response?.detail
    || error?.response?.data?.detail
    || error?.data?.detail
    || error?.response?._data?.detail
    || error?.response?.data?.message
    || error?.response?.data?.msg?.error_msg
    || error?.data?.message
    || error?.message
    || error?.msg
  if (typeof message === 'string' && message.trim()) return message.trim()
  // 某些请求库会把响应对象直接挂到 error 上
  if (error && typeof error === 'object') {
    try {
      const raw = JSON.stringify(error)
      if (raw && raw !== '{}') return raw
    } catch {}
  }
  return '未知错误'
}

const normalizeTrackName = (raw: string) => {
  const name = (raw || '').trim()
  const atIndex = name.indexOf('@')
  return atIndex > -1 ? name.slice(0, atIndex) : name
}

const normalizeTaskPointName = (raw: string) => {
  const name = (raw || '').trim()
  const atIndex = name.indexOf('@')
  return atIndex > -1 ? name.slice(0, atIndex) : name
}

const runningTrackName = computed(() => normalizeTrackName(robotStore.cmdStatus?.track_info?.track_name || ''))
const runningTaskGroupName = computed(() => normalizeTaskPointName(robotStore.cmdStatus?.track_info?.taskpoint_name || ''))

const getCurrentRobotContextKeys = () => {
  const robotId = localStorage.getItem('selected_robot_id') || ''
  return robotId ? getRobotContextCacheKeys(robotId) : null
}

const getAllTrackTaskListCacheRaw = () => {
  const contextKeys = getCurrentRobotContextKeys()
  return (contextKeys ? localStorage.getItem(contextKeys.allTrackTaskListKey) : null)
    || localStorage.getItem('all_track_task_list')
}

const setAllTrackTaskListCache = (taskList: any[]) => {
  const normalizedTaskList = extractTrackTaskList(taskList)
  const serialized = JSON.stringify(normalizedTaskList)
  const contextKeys = getCurrentRobotContextKeys()
  if (contextKeys) {
    localStorage.setItem(contextKeys.allTrackTaskListKey, serialized)
  }
  localStorage.setItem('all_track_task_list', serialized)

  const robotId = localStorage.getItem('selected_robot_id') || ''
  window.dispatchEvent(new CustomEvent('track-task-list-updated', {
    detail: { robotId }
  }))
}

const extractTrackTaskList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.response?.data)) return payload.response.data
  return []
}

const getTaskGroupListFromCache = (trackName: string): string[] => {
  const normalizedTrack = normalizeTrackName(trackName)
  const groupSet = new Set<string>()

  const contextKeys = getCurrentRobotContextKeys()
  const cachedGroupMapRaw = contextKeys
    ? localStorage.getItem(contextKeys.taskpointGroupMapKey) || localStorage.getItem('cached_taskpoint_group_map')
    : localStorage.getItem('cached_taskpoint_group_map')
  if (cachedGroupMapRaw) {
    try {
      const groupMap = JSON.parse(cachedGroupMapRaw) as Record<string, string[]>
      const groups = groupMap[normalizedTrack] || groupMap[trackName] || []
      groups.forEach(group => {
        const normalizedGroup = normalizeTaskPointName(String(group || ''))
        if (normalizedGroup) groupSet.add(normalizedGroup)
      })
    } catch (err) {
      console.warn('读取任务组缓存失败:', err)
    }
  }

  if (groupSet.size === 0) {
    const cachedData = localStorage.getItem('all_track_task_list')
    if (cachedData) {
      try {
        const allTaskList = extractTrackTaskList(JSON.parse(cachedData))
        allTaskList.forEach((task: any) => {
          const taskTrack = normalizeTrackName(String(task.track_name || ''))
          if (taskTrack !== normalizedTrack) return
          const taskGroup = normalizeTaskPointName(String(task.track_point_name || task.taskpoint_name || task.task_point_name || ''))
          if (taskGroup) groupSet.add(taskGroup)
        })
      } catch (err) {
        console.warn('从任务点缓存推导任务组失败:', err)
      }
    }
  }

  return Array.from(groupSet)
}

const setTaskGroupCache = (trackName: string, groups: string[]) => {
  const normalizedTrack = normalizeTrackName(trackName)
  if (!normalizedTrack) return

  const normalizedGroups = Array.from(
    new Set((groups || []).map(group => normalizeTaskPointName(String(group || ''))).filter(Boolean))
  )
  const contextKeys = getCurrentRobotContextKeys()
  const cachedGroupMapRaw = contextKeys
    ? localStorage.getItem(contextKeys.taskpointGroupMapKey) || localStorage.getItem('cached_taskpoint_group_map')
    : localStorage.getItem('cached_taskpoint_group_map')
  const groupMap = cachedGroupMapRaw ? JSON.parse(cachedGroupMapRaw) : {}
  groupMap[normalizedTrack] = normalizedGroups
  if (contextKeys) {
    localStorage.setItem(contextKeys.taskpointGroupMapKey, JSON.stringify(groupMap))
  }
  localStorage.setItem('cached_taskpoint_group_map', JSON.stringify(groupMap))
}

const applyTaskGroupSelection = (groups: string[]) => {
  taskGroupList.value = groups
  if (isTrackTaskRunning.value && runningTaskGroupName.value) {
    const normalizedRunningGroup = normalizeTaskPointName(runningTaskGroupName.value)
    const matchedGroup = groups.find(group => normalizeTaskPointName(group) === normalizedRunningGroup)
    if (matchedGroup) {
      selectedTaskGroupName.value = matchedGroup
    } else if (groups.length > 0) {
      selectedTaskGroupName.value = groups[0]
    } else {
      selectedTaskGroupName.value = ''
    }
  } else if (groups.length > 0) {
    selectedTaskGroupName.value = groups[0]
  } else {
    selectedTaskGroupName.value = ''
  }
}

const fetchTaskGroupListByRoute = async (routeName: string) => {
  const normalizedRouteName = normalizeTrackName(routeName)
  if (!normalizedRouteName) {
    applyTaskGroupSelection([])
    return
  }

  const cachedGroups = getTaskGroupListFromCache(normalizedRouteName)
  applyTaskGroupSelection(cachedGroups)

  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    await refreshAllTrackTaskListCache()
    return
  }

  const requestToken = ++taskGroupRequestToken
  try {
    const response = await navigationApi.getTaskpointList(robotId, normalizedRouteName)
    if (requestToken !== taskGroupRequestToken) return
    if (normalizeTrackName(selectedRouteName.value) !== normalizedRouteName) return

    const remoteGroups = Array.isArray(response?.msg?.result)
      ? response.msg.result.map((group: string) => normalizeTaskPointName(group)).filter(Boolean)
      : []

    setTaskGroupCache(normalizedRouteName, remoteGroups)
    applyTaskGroupSelection(remoteGroups)
  } catch (err) {
    if (requestToken !== taskGroupRequestToken) return
    if (normalizeTrackName(selectedRouteName.value) !== normalizedRouteName) return
    console.warn('获取任务组列表失败:', err)
  }

  await refreshAllTrackTaskListCache()
}

// 仅从本地缓存刷新全量任务点列表依赖
const refreshAllTrackTaskListCache = async () => {
  try {
    const cachedData = getAllTrackTaskListCacheRaw()
    const taskList = cachedData ? extractTrackTaskList(JSON.parse(cachedData)) : []
    setAllTrackTaskListCache(taskList)
    taskListRefreshKey.value++
  } catch (err) {
    console.error('刷新循迹任务点缓存失败:', err)
  }
}

const refreshTrackTaskListFromApi = async (robotId: string) => {
  try {
    const response = await navigationApi.getAllTrackTaskList(robotId)
    const taskList = extractTrackTaskList(response?.data)
    setAllTrackTaskListCache(taskList)
    taskListRefreshKey.value++
  } catch (err) {
    console.warn('从接口刷新循迹任务列表失败:', err)
  }
}

// 获取路线列表
const loadRouteList = async () => {
  try {
    // 地图为空时，禁止继续使用历史路线/任务组缓存
    if (!selectedMap.value) {
      clearRouteAndTaskGroupState(true)
      return
    }

    const contextKeys = getCurrentRobotContextKeys()
    const cachedTrackListRaw =
      (contextKeys ? localStorage.getItem(contextKeys.trackListKey) : null)
      || localStorage.getItem('cached_track_list')
    let rawList: string[] = cachedTrackListRaw ? JSON.parse(cachedTrackListRaw) : []
    if (rawList.length === 0) {
      const cachedTaskListRaw =
        (contextKeys ? localStorage.getItem(contextKeys.allTrackTaskListKey) : null)
        || localStorage.getItem('all_track_task_list')
      if (cachedTaskListRaw) {
        const allTaskList = extractTrackTaskList(JSON.parse(cachedTaskListRaw))
        rawList = allTaskList.map((task: any) => String(task.track_name || '')).filter(Boolean)
      }
    }
    const processedSet = new Set<string>()
    rawList.forEach(item => {
      const name = normalizeTrackName(String(item || ''))
      if (name) processedSet.add(name)
    })
    routeList.value = Array.from(processedSet)

    if (routeList.value.length > 0) {
      selectedRouteName.value = routeList.value[0]
    } else {
      clearRouteAndTaskGroupState(false)
    }
  } catch (err) {
    console.error('读取路线缓存失败:', err)
    clearRouteAndTaskGroupState(true)
  }
}

// 打开添加任务组弹窗
const handleOpenCreateTaskGroupDialog = () => {
  showCreateTaskGroupDialog.value = true
  // 重置表单
  createTaskGroupForm.value.keypoint_name = ''
}

// 关闭添加任务组弹窗
const closeCreateTaskGroupDialog = () => {
  showCreateTaskGroupDialog.value = false
  createTaskGroupForm.value.keypoint_name = ''
}

// 创建任务组
const handleCreateTaskGroup = async () => {
  // 验证表单
  if (!selectedRouteName.value) {
    errorMessage.value = { show: true, text: '请先选择路线名称' }
    return
  }
  if (!createTaskGroupForm.value.keypoint_name) {
    errorMessage.value = { show: true, text: '请输入任务组名称' }
    return
  }

  const normalizedNewGroup = normalizeTaskPointName(createTaskGroupForm.value.keypoint_name)
  if (!normalizedNewGroup) {
    errorMessage.value = { show: true, text: '请输入有效的任务组名称' }
    return
  }

  const normalizedTrackName = normalizeTrackName(selectedRouteName.value)
  const toComparable = (name: string) => {
    const normalized = normalizeTaskPointName(name).trim()
    if (!normalized) return ''
    // 统一去掉“路线名_”前缀后比较，兼容输入 006 或 MAPRTK02_006 两种形式
    if (normalizedTrackName && normalized.startsWith(`${normalizedTrackName}_`)) {
      return normalized.slice(normalizedTrackName.length + 1).toLowerCase()
    }
    return normalized.toLowerCase()
  }
  const inputComparable = toComparable(normalizedNewGroup)
  const hasDuplicate = taskGroupList.value.some(group => toComparable(group) === inputComparable)
  if (hasDuplicate) {
    errorMessage.value = { show: true, text: '任务组名称已存在' }
    return
  }
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    errorMessage.value = { show: true, text: '未选择机器人' }
    return
  }
  
  try {
    const response = await navigationApi.createTaskpointFile(robotId, {
      track_name: selectedRouteName.value,
      keypoint_name: normalizedNewGroup
    })
    
    console.log('创建任务组返回:', response)
    
    successMessage.value = { show: true, text: '添加任务组成功' }
    setTimeout(() => {
      successMessage.value.show = false
    }, 2000)

    closeCreateTaskGroupDialog()

    // 从接口刷新任务组列表
    try {
      const res = await navigationApi.getTaskpointList(robotId, selectedRouteName.value)
      const freshGroups = Array.isArray(res?.msg?.result) ? res.msg.result.map((g: string) => normalizeTaskPointName(g)).filter(Boolean) : []
      if (freshGroups.length > 0) {
        taskGroupList.value = freshGroups
        setTaskGroupCache(selectedRouteName.value, freshGroups)
      } else {
        const mergedGroups = Array.from(new Set([...taskGroupList.value, normalizedNewGroup].filter(Boolean)))
        taskGroupList.value = mergedGroups
        setTaskGroupCache(selectedRouteName.value, mergedGroups)
      }
    } catch {
      const mergedGroups = Array.from(new Set([...taskGroupList.value, normalizedNewGroup].filter(Boolean)))
      taskGroupList.value = mergedGroups
      setTaskGroupCache(selectedRouteName.value, mergedGroups)
    }
    selectedTaskGroupName.value = taskGroupList.value.length > 0 ? taskGroupList.value[0] : ''

    window.dispatchEvent(new CustomEvent('track-task-group-updated', {
      detail: {
        robotId,
        trackName: normalizeTrackName(selectedRouteName.value)
      }
    }))
  } catch (error: any) {
    console.error('创建任务组失败:', error)
    errorMessage.value = { show: true, text: `创建失败: ${error.message || '网络错误'}` }
  }
}

// selectedMap 从 store 读取，实现多页面同步
const selectedMap = computed(() => taskExecutionStore.selectedMapName)

const syncSelectedMapWithCache = () => {
  const robotId = localStorage.getItem('selected_robot_id') || ''
  const mapKeys = robotId ? getRobotMapCacheKeys(robotId) : null
  const cachedMapListRaw =
    (mapKeys ? localStorage.getItem(mapKeys.mapListKey) : null)
    || localStorage.getItem('cached_map_list')

  let cachedMapList: string[] = []
  if (cachedMapListRaw) {
    try {
      const parsed = JSON.parse(cachedMapListRaw)
      if (Array.isArray(parsed)) {
        cachedMapList = parsed.map(item => String(item || '').trim()).filter(Boolean)
      }
    } catch {
      cachedMapList = []
    }
  }

  if (cachedMapList.length === 0) {
    if (taskExecutionStore.selectedMapName) {
      taskExecutionStore.setSelectedMapName('')
    }
    return
  }

  if (!cachedMapList.includes(taskExecutionStore.selectedMapName)) {
    taskExecutionStore.setSelectedMapName(cachedMapList[0])
  }
}

// 过滤后的路线列表（根据缓存的地图筛选）
const filteredRouteList = computed(() => {
  if (!selectedMap.value) return []
  
  // 根据地图名称筛选：路线名 以 "地图名称_" 开头
  return routeList.value.filter(route => {
    return route.startsWith(selectedMap.value + '_')
  })
})

const pendingRunningRouteName = ref('')
const applyPendingRunningRouteSelection = () => {
  const pendingName = normalizeTrackName(pendingRunningRouteName.value || '')
  if (!pendingName) return false
  const matched = filteredRouteList.value.find(item => normalizeTrackName(item) === pendingName)
  if (!matched) return false
  selectedRouteName.value = matched
  pendingRunningRouteName.value = ''
  return true
}

// 监听筛选后的路线列表变化，自动选择第一个
watch(filteredRouteList, (newList) => {
  if (applyPendingRunningRouteSelection()) return
  if (isTrackTaskRunning.value && runningTrackName.value) {
    const normalizedRunningTrack = normalizeTrackName(runningTrackName.value)
    const matched = newList.find(item => normalizeTrackName(item) === normalizedRunningTrack)
    if (matched) {
      selectedRouteName.value = matched
      return
    }
  }
  if (newList.length > 0) {
    selectedRouteName.value = newList[0]
  } else {
    clearRouteAndTaskGroupState(false)
  }
}, { immediate: true })

// 监听路线选择变化
watch(selectedRouteName, async (newVal) => {
  if (!newVal) {
    applyTaskGroupSelection([])
    return
  }
  await fetchTaskGroupListByRoute(newVal)
})

watch(
  [isTrackTaskRunning, runningTrackName, runningTaskGroupName],
  async ([running]) => {
    if (!running) return
    const normalizedTrack = normalizeTrackName(runningTrackName.value)
    if (!normalizedTrack) return

    pendingRunningRouteName.value = normalizedTrack
    const robotId = localStorage.getItem('selected_robot_id') || ''
    if (robotId) {
      await refreshTrackTaskListFromApi(robotId)
      await loadRouteList()
    }
    applyPendingRunningRouteSelection()

    if (!routeList.value.some(item => normalizeTrackName(item) === normalizedTrack)) {
      routeList.value = [...routeList.value, normalizedTrack]
    }
    selectedRouteName.value = routeList.value.find(item => normalizeTrackName(item) === normalizedTrack) || normalizedTrack

    const groups = getTaskGroupListFromCache(selectedRouteName.value)
    taskGroupList.value = groups
    const normalizedGroup = normalizeTaskPointName(runningTaskGroupName.value || '')
    if (normalizedGroup) {
      if (!groups.some(item => normalizeTaskPointName(item) === normalizedGroup)) {
        taskGroupList.value = [...groups, normalizedGroup]
      }
      selectedTaskGroupName.value = taskGroupList.value.find(item => normalizeTaskPointName(item) === normalizedGroup) || normalizedGroup
    } else if (taskGroupList.value.length > 0) {
      selectedTaskGroupName.value = taskGroupList.value[0]
    } else {
      selectedTaskGroupName.value = ''
    }
    await refreshAllTrackTaskListCache()
  },
  { immediate: true }
)

watch(selectedTaskGroupName, (newVal) => {
  if (!isTrackTaskRunning.value || !runningTaskGroupName.value) return
  const normalizedSelected = normalizeTaskPointName(newVal || '')
  const normalizedRunning = normalizeTaskPointName(runningTaskGroupName.value || '')
  if (normalizedSelected !== normalizedRunning) {
    const matched = taskGroupList.value.find(item => normalizeTaskPointName(item) === normalizedRunning)
    selectedTaskGroupName.value = matched || normalizedRunning
  }
})

// 循迹任务启动弹窗
const trackStartDialog = ref({
  visible: false,
  loading: false,
  statusText: '',
  statusType: 'idle' as 'idle' | 'running' | 'success' | 'error',
  stepLogs: [] as string[],
  form: {
    action: 1, // 固定为1，表示启动
    wait: 0, // 0=立即启动, 1=不立即启动
    obs_mode: 1, // 0=无避障, 1=近障模式, 2=绕障模式
    track_name: '',
    taskpoint_name: '',
    gait_type: 0 // 0=行走步态, 1=斜坡步态, 2=越障步态, 3=楼梯步态, 4=帧楼梯步态, 5=帧45°楼梯步态, 6=L行走步态, 7=山地步态, 8=静音步态
  }
})

const trackInitDialog = ref({
  visible: false,
  text: '机器狗初始化中...'
})

// 启动循迹任务
const handleCloseTrack = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return
  const runningTrackName = robotStore.cmdStatus?.track_info?.track_name || selectedRouteName.value
  const runningTaskpoint = robotStore.cmdStatus?.track_info?.taskpoint_name || selectedTaskGroupName.value
  if (!runningTrackName || !runningTaskpoint) {
    showMissionError('未找到运行中的循迹任务参数')
    return
  }

  showConfirmDialog('确定要关闭当前循迹任务吗？', async () => {
    try {
      await navigationApi.cancelTrack(robotId, {
        action: 0,
        wait: 0,
        obs_mode: 1,
        track_name: runningTrackName,
        taskpoint_name: runningTaskpoint
      })
      showMissionSuccess('关闭指令已发送')
    } catch (err) {
      console.error('关闭循迹任务失败', err)
      showMissionError('关闭失败')
    }
  })
}

const handleStartTrack = async () => {
  if (isNavPaused.value) {
    showMissionError('请先关闭导航暂停')
    return
  }
  if (isTrackTaskRunning.value) {
    await handleCloseTrack()
    return
  }
  if (!canStartTrackTask.value) {
    showMissionError('当前有其他任务正在运行')
    return
  }
  // 必须开启导航、INS或MSF中的至少一个
  const cmdStatus = robotStore.cmdStatus
  const hasNavEnabled = cmdStatus?.nav === 1 || cmdStatus?.ins === 1 || cmdStatus?.msf === 1
  if (!hasNavEnabled) {
    showMissionError('请先开启导航、INS或MSF')
    return
  }
  if (!selectedRouteName.value) {
    showMissionError('请先选择路线')
    return
  }
  if (!selectedTaskGroupName.value) {
    showMissionError('请先选择任务组')
    return
  }

  trackStartDialog.value.form.track_name = selectedRouteName.value
  trackStartDialog.value.form.taskpoint_name = selectedTaskGroupName.value
  trackStartDialog.value.form.obs_mode = 1
  trackStartDialog.value.form.gait_type = 0
  trackStartDialog.value.form.wait = 0
  trackStartDialog.value.loading = false
  trackStartDialog.value.statusText = ''
  trackStartDialog.value.statusType = 'idle'
  trackStartDialog.value.stepLogs = []
  trackStartDialog.value.visible = true
}

const resetTrackStartProgress = () => {
  trackStartDialog.value.statusText = ''
  trackStartDialog.value.statusType = 'idle'
  trackStartDialog.value.stepLogs = []
}

const pushTrackStartStep = (message: string, statusType: 'running' | 'success' | 'error' = 'running') => {
  trackStartDialog.value.statusText = message
  trackStartDialog.value.statusType = statusType
  trackStartDialog.value.stepLogs = [...trackStartDialog.value.stepLogs, message]
}

const missionTrackGaitConfigMap: Record<number, { command: string; label: string }> = {
  0: { command: 'foot_walk', label: '行走步态' },
  1: { command: 'foot_climb', label: '斜坡步态' },
  2: { command: 'foot_obs', label: '越障步态' },
  3: { command: 'foot_stair', label: '楼梯步态' },
  4: { command: 'foot_stair2', label: '楼梯步态（累积帧模式）' },
  5: { command: 'foot_stair3', label: '45°楼梯步态（累积帧模式）' },
  6: { command: 'foot_l', label: 'L行走步态' },
  7: { command: 'foot_mountain', label: '山地步态' },
  8: { command: 'foot_silent', label: '静音步态' }
}

const waitForMissionRobotState = async (
  condition: () => boolean,
  timeoutMs: number,
  errorMessage: string
) => {
  if (condition()) return

  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      if (condition()) {
        window.clearInterval(timer)
        resolve()
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer)
        reject(new Error(errorMessage))
      }
    }, 100)
  })
}

const sendMissionDogCommand = async (robotId: string, commandName: string) => {
  await dogApi.sendCommand(robotId, { command_name: commandName })
}

// 暂停循迹任务
const handlePauseTrack = async () => {
  if (!isNavigationEnabled.value) return
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    showMissionError('未找到机器人ID')
    return
  }

  const nextPaused = !isNavPaused.value
  const actionText = nextPaused ? '暂停' : '恢复'
  const confirmText = nextPaused ? '确定要暂停导航吗' : '确定要恢复导航吗'
  showConfirmDialog(confirmText, async () => {
    try {
      await navigationApi.pauseNavigation(robotId, { action: nextPaused ? 1 : 0 })
      taskExecutionStore.setNavPaused(nextPaused)
      showMissionSuccess(nextPaused ? '暂停指令已发送' : '恢复指令已发送')
    } catch (err) {
      console.error('暂停失败', err)
      showMissionError(`${actionText}失败`)
    }
  })
}

// 删除任务组
const handleDeleteTaskGroup = () => {
  if (!selectedRouteName.value) {
    errorMessage.value = { show: true, text: '请先选择路线' }
    setTimeout(() => { errorMessage.value.show = false }, 2000)
    return
  }
  if (!selectedTaskGroupName.value) {
    errorMessage.value = { show: true, text: '请先选择任务组' }
    setTimeout(() => { errorMessage.value.show = false }, 2000)
    return
  }

  deleteTaskGroupDialog.value = {
    show: true,
    title: '删除任务组',
    message: `确定要删除任务组「${selectedTaskGroupName.value}」吗？`,
    onConfirm: async () => {
      const robotId = localStorage.getItem('selected_robot_id')
      if (!robotId) return

      const deletingTaskGroupName = selectedTaskGroupName.value

      try {
        await navigationApi.deleteTaskpointFile(robotId, {
          action: 1,
          track_name: selectedRouteName.value,
          taskpoint_name: deletingTaskGroupName
        })

        // 从任务组列表中移除
        taskGroupList.value = taskGroupList.value.filter(
          group => group !== deletingTaskGroupName
        )

        // 清空当前选择
        if (taskGroupList.value.length > 0) {
          selectedTaskGroupName.value = taskGroupList.value[0]
        } else {
          selectedTaskGroupName.value = ''
        }

        // 从缓存中删除该任务组的所有任务
        const cachedData = getAllTrackTaskListCacheRaw()
        if (cachedData) {
          let allTaskList = JSON.parse(cachedData)
          const selectedTrack = normalizeTrackName(selectedRouteName.value)
          const selectedGroup = normalizeTaskPointName(deletingTaskGroupName)
          allTaskList = allTaskList.filter((task: any) =>
            !(
              normalizeTrackName(String(task.track_name || '')) === selectedTrack &&
              normalizeTaskPointName(String(task.track_point_name || task.taskpoint_name || task.task_point_name || '')) === selectedGroup
            )
          )
          setAllTrackTaskListCache(allTaskList)
        }

        // 同步更新任务组缓存映射
        setTaskGroupCache(selectedRouteName.value, taskGroupList.value)

        window.dispatchEvent(new CustomEvent('track-task-group-updated', {
          detail: {
            robotId,
            trackName: normalizeTrackName(selectedRouteName.value)
          }
        }))

        // 触发列表刷新
        taskListRefreshKey.value++

        successMessage.value = { show: true, text: '删除任务组成功' }
        setTimeout(() => {
          successMessage.value.show = false
        }, 2000)
      } catch (err) {
        console.error('删除任务组失败', err)
        errorMessage.value = { show: true, text: '删除任务组失败' }
        setTimeout(() => {
          errorMessage.value.show = false
        }, 2000)
      } finally {
        deleteTaskGroupDialog.value.show = false
      }
    }
  }
}

const onTrackStartConfirm = async () => {
  const form = trackStartDialog.value.form
  
  if (!form.track_name || form.track_name.trim() === '') {
    showMissionError('循迹任务名称不能为空')
    return
  }
  if (!form.taskpoint_name || form.taskpoint_name.trim() === '') {
    showMissionError('请选择关键点文件')
    return
  }
  if (taskGroupList.value.length === 0) {
    showMissionError('当前循迹任务没有可用的关键点文件，请先创建关键点文件')
    return
  }
  if (form.obs_mode === null || form.obs_mode === undefined) {
    showMissionError('请选择避障模式')
    return
  }

  const gaitConfig = missionTrackGaitConfigMap[form.gait_type]
  if (!gaitConfig) {
    showMissionError('请选择有效的步态')
    return
  }

  if (trackStartDialog.value.loading) return
  trackStartDialog.value.loading = true
  selectedTaskGroupName.value = form.taskpoint_name
  trackStartDialog.value.visible = false
  trackInitDialog.value.text = '机器狗初始化中...'
  trackInitDialog.value.visible = true

  try {
    const robotId = localStorage.getItem('selected_robot_id')
    if (!robotId) {
      showMissionError('未找到机器人ID')
      return
    }

    resetTrackStartProgress()
    pushTrackStartStep('开始准备循迹任务启动流程')

    if (robotStore.robotStatusText === 'RL状态') {
      pushTrackStartStep('检测到 RL状态，先切换到行走步态')
      await sendMissionDogCommand(robotId, 'foot_walk')
    }

    pushTrackStartStep('发送非手动模式指令')
    await sendMissionDogCommand(robotId, 'mode_auto')
    pushTrackStartStep('设置地形为实心地面')
    await sendMissionDogCommand(robotId, 'ground_1')

    pushTrackStartStep('等待机器人进入非手动模式')
    await waitForMissionRobotState(
      () => Array.isArray(robotStore.rcsData?.rcs_state) && robotStore.rcsData.rcs_state[0] === 1,
      8000,
      '等待机器人切换到非手动模式超时'
    )

    pushTrackStartStep('发送导航模块非手动模式指令')
    await sendMissionDogCommand(robotId, 'mode_auto_2')

    if (robotStore.motionState?.basic_state !== 4) {
      pushTrackStartStep('机器人当前未处于踏步状态，发送踏步指令')
      await sendMissionDogCommand(robotId, 'action')
      pushTrackStartStep('等待机器人进入踏步状态')
      await waitForMissionRobotState(
        () => robotStore.motionState?.basic_state === 4,
        10000,
        '等待机器人进入踏步状态超时'
      )
    }

    pushTrackStartStep(`切换目标步态为${gaitConfig.label}`)
    await sendMissionDogCommand(robotId, gaitConfig.command)
    pushTrackStartStep(`等待机器人切换到${gaitConfig.label}`)
    await waitForMissionRobotState(
      () => robotStore.gaitText === gaitConfig.label,
      10000,
      `等待机器人切换到${gaitConfig.label}超时`
    )

    pushTrackStartStep('发送循迹任务启动指令')
    // 调用启动循迹任务API
    const response = await navigationApi.startTrack(robotId, {
      obs_mode: form.obs_mode,
      track_name: form.track_name,
      taskpoint_name: form.taskpoint_name,
      gait_name: gaitConfig.command,
      ground: ''
    })
    
    console.log('启动循迹任务响应:', response)
    
    // 根据返回结果判断是否成功
    if (response && (response as any).response && (response as any).response.msg) {
      const { error_code, error_msg } = (response as any).response.msg
      if (error_code === 0) {
        pushTrackStartStep((response as any).message || '循迹任务启动成功', 'success')
        showMissionSuccess((response as any).message || '循迹任务启动成功')
      } else {
        pushTrackStartStep(`启动失败: ${error_msg || '未知错误'}`, 'error')
        showMissionError(`启动失败: ${error_msg || '未知错误'}`)
      }
    } else {
      pushTrackStartStep('循迹任务启动成功', 'success')
      showMissionSuccess('循迹任务启动成功')
    }
  } catch (error) {
    console.error('启动循迹任务失败:', error)
    const errorMessage = parseMissionErrorMessage(error)
    pushTrackStartStep(errorMessage, 'error')
    showMissionError(errorMessage)
  } finally {
    trackInitDialog.value.visible = false
    trackStartDialog.value.loading = false
  }
}

const onTrackStartCancel = () => {
  if (trackStartDialog.value.loading) return
  trackStartDialog.value.visible = false
}

const openMapDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MAP_DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(MAP_STORE_NAME)) {
        db.createObjectStore(MAP_STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

const getMapFile = async (mapName: string, fileName: string): Promise<Blob | null> => {
  try {
    const db = await openMapDB()
    return new Promise((resolve) => {
      const tx = db.transaction([MAP_STORE_NAME], 'readonly')
      const request = tx.objectStore(MAP_STORE_NAME).get(`${mapName}/${fileName}`)
      request.onsuccess = () => resolve(request.result?.blob || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

const parseTrajectoryPoints = (text: string): Array<{ x: number; y: number; z: number }> => {
  const lines = text.trim().split('\n')
  const points: Array<{ x: number; y: number; z: number }> = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const parts = trimmed.includes(',') ? trimmed.split(',') : trimmed.split(/\s+/)
    if (parts.length === 6) {
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      const z = parseFloat(parts[3])
      if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
        points.push({ x, y, z })
        continue
      }
    }
    if (parts.length === 5) {
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        points.push({ x, y, z: 0 })
      }
    }
  }
  return points
}

const parsePcdBufferInWorker = (
  buffer: ArrayBuffer
): Promise<{
  points: Array<{ x: number; y: number; z: number; intensity: number }>
  normParams: { centerX: number; centerY: number; centerZ: number; maxRange: number }
}> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/pcdParser.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      worker.terminate()
      if (e.data?.ok) {
        resolve({ points: e.data.points, normParams: e.data.normParams })
      } else {
        reject(new Error(e.data?.error || 'PCD 解析失败'))
      }
    }
    worker.onerror = (err) => {
      worker.terminate()
      reject(err)
    }
    worker.postMessage({ buffer }, [buffer])
  })
}

const resolvePreviewTrackName = () => normalizeTrackName(selectedRouteName.value || '')
const resolvePreviewTaskGroupName = () => normalizeTaskPointName(selectedTaskGroupName.value || '')

const resolvePreviewMapName = (trackName: string): string => {
  const selectedMapName = taskExecutionStore.selectedMapName
  if (selectedMapName) return selectedMapName
  if (!trackName.includes('_')) return ''
  return trackName.split('_')[0] || ''
}

const getPreviewTaskPoints = (trackName: string, taskGroupName: string) => {
  const taskPoints: Array<{ x: number; y: number; z: number; name: string }> = []
  const cachedData = getAllTrackTaskListCacheRaw()
  if (!cachedData) return taskPoints
  try {
    const allTaskList = extractTrackTaskList(JSON.parse(cachedData))
    const normalizedTrack = normalizeTrackName(trackName)
    const normalizedGroup = normalizeTaskPointName(taskGroupName)
    if (!normalizedTrack || !normalizedGroup) return taskPoints

    const filteredTasks = allTaskList.filter((task: any) => {
      const taskTrack = normalizeTrackName(String(task.track_name || ''))
      const taskPoint = normalizeTaskPointName(
        String(
          task.track_point_name ||
          task.taskpoint_name ||
          task.task_point_name ||
          task.keypoint_name ||
          task.group_name ||
          ''
        )
      )
      return taskTrack === normalizedTrack && taskPoint === normalizedGroup
    })
    filteredTasks.forEach((task: any) => {
      const x = Number(task.x)
      const y = Number(task.y)
      const z = Number(task.z ?? 0)
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        const name = String(task.type_text || task.preset || task.remark || task.task_id || '任务点')
        taskPoints.push({ x, y, z, name })
      }
    })
  } catch (err) {
    console.warn('[Mission 预览] 任务点读取失败:', err)
  }
  return taskPoints
}

const applyPreviewOverlay = async () => {
  if (!previewBasePointCloudData.value.length) return
  const { centerX, centerY, centerZ, maxRange } = previewPointCloudNormalization.value
  if (!maxRange || maxRange <= 1e-6) return

  const normalizedTrajectory = previewOverlayTrajectory.value.map(point => ({
    x: (point.x - centerX) / maxRange,
    y: (point.y - centerY) / maxRange,
    z: (point.z - centerZ) / maxRange,
    intensity: 1.95
  }))
  const normalizedTaskPoints = previewOverlayTaskPoints.value.map(point => ({
    x: (point.x - centerX) / maxRange,
    y: (point.y - centerY) / maxRange,
    z: (point.z - centerZ) / maxRange,
    intensity: 1.75,
    name: point.name
  }))

  previewPointCloudData.value = [
    ...previewBasePointCloudData.value,
    ...normalizedTrajectory,
    ...normalizedTaskPoints
  ]
  await nextTick()
  previewPc.schedule()
}

const setupPreviewCanvasEvents = () => {
  const canvas = previewPointCloudCanvas.value
  if (!canvas) return

  if (previewCanvasEventController) {
    previewCanvasEventController.abort()
    previewCanvasEventController = null
  }
  previewCanvasEventController = new AbortController()
  const signal = previewCanvasEventController.signal

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault()
    previewPc.onWheel(event)
  }, { passive: false, signal })
  canvas.addEventListener('pointerdown', previewPc.onPointerDown, { signal })
  canvas.addEventListener('contextmenu', (event) => event.preventDefault(), { signal })
  window.addEventListener('keydown', previewPc.onKeydown, { signal })

  if (previewResizeObserver) {
    previewResizeObserver.disconnect()
    previewResizeObserver = null
  }
  previewResizeObserver = new ResizeObserver(() => {
    previewPc.schedule()
  })
  const parent = canvas.parentElement || canvas
  previewResizeObserver.observe(parent)
}

const destroyPreviewCanvasEvents = () => {
  if (previewCanvasEventController) {
    previewCanvasEventController.abort()
    previewCanvasEventController = null
  }
  if (previewResizeObserver) {
    previewResizeObserver.disconnect()
    previewResizeObserver = null
  }
}

const loadPreviewData = async () => {
  previewDialog.value.loading = true
  previewDialog.value.error = ''
  try {
    const trackName = resolvePreviewTrackName()
    if (!trackName) {
      previewDialog.value.error = '请先选择路线'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTrajectory.value = []
      previewOverlayTaskPoints.value = []
      return
    }
    const taskGroupName = resolvePreviewTaskGroupName()
    if (!taskGroupName) {
      previewDialog.value.error = '请先选择任务组'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTrajectory.value = []
      previewOverlayTaskPoints.value = []
      return
    }
    const mapName = resolvePreviewMapName(trackName)
    if (!mapName) {
      previewDialog.value.error = '未找到地图，请先在首页选择地图'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTrajectory.value = []
      previewOverlayTaskPoints.value = []
      return
    }

    const pcdBlob = await getMapFile(mapName, 'tinyMap.pcd')
    if (!pcdBlob || pcdBlob.size === 0) {
      previewDialog.value.error = '点云文件不存在'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTrajectory.value = []
      previewOverlayTaskPoints.value = []
      return
    }
    const { points: pcdPoints, normParams } = await parsePcdBufferInWorker(await pcdBlob.arrayBuffer())
    if (!pcdPoints.length) {
      previewDialog.value.error = '点云数据为空'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTrajectory.value = []
      previewOverlayTaskPoints.value = []
      return
    }
    previewPointCloudNormalization.value = normParams
    previewBasePointCloudData.value = pcdPoints

    const trajectoryBlob = await getTrajectoryFile(trackName)
    previewOverlayTrajectory.value = trajectoryBlob ? parseTrajectoryPoints(await trajectoryBlob.text()) : []
    previewOverlayTaskPoints.value = getPreviewTaskPoints(trackName, taskGroupName)
    await applyPreviewOverlay()
  } catch (err) {
    console.error('[Mission 预览] 加载失败:', err)
    previewDialog.value.error = '预览加载失败'
    previewPointCloudData.value = []
    previewBasePointCloudData.value = []
    previewOverlayTrajectory.value = []
    previewOverlayTaskPoints.value = []
  } finally {
    previewDialog.value.loading = false
  }
}

const openPreviewDialog = async () => {
  previewDialog.value.visible = true
  await nextTick()
  setupPreviewCanvasEvents()
  await loadPreviewData()
}

const closePreviewDialog = () => {
  previewDialog.value.visible = false
  destroyPreviewCanvasEvents()
}

watch(
  [selectedRouteName, selectedTaskGroupName, isNavigationEnabled],
  async () => {
    if (!previewDialog.value.visible) return
    await loadPreviewData()
  }
)

onMounted(() => {
  loadWaylineFiles()
  loadRouteList()
  refreshAllTrackTaskListCache()
  load3MF('/jiantou.3mf').then(mesh => {
    if (mesh) previewPc.robotMesh.value = mesh
  })
})

// 加载航线文件列表
const loadWaylineFiles = async () => {
  const workspaceId = getCachedWorkspaceId()
  if (!workspaceId) {
    console.error('未找到workspace_id，无法加载航线文件')
    return
  }
  
  trackFileLoading.value = true
  try {
    await fetchWaylineFiles(workspaceId, {
      page: 1,
      page_size: 100
    })
    // 默认选择第一条数据
    if (waylineFiles.value && waylineFiles.value.length > 0) {
      selectedTrack.value = waylineFiles.value[0].wayline_id
      console.log('默认选择第一个航线:', selectedTrack.value)
      // 立即加载第一个航线的详情
      await loadWaylineDetail(selectedTrack.value)
    }
  } catch (err) {
    console.error('加载航线文件失败:', err)
  } finally {
    trackFileLoading.value = false
  }
}

// 加载航线详情
const loadWaylineDetail = async (waylineId: string) => {
  const workspaceId = getCachedWorkspaceId()
  if (!workspaceId || !waylineId) {
    console.error('加载航线详情失败: workspaceId 或 waylineId 为空', { workspaceId, waylineId })
    return
  }
  
  try {
    await fetchWaylineDetail(workspaceId, waylineId)
    console.log('航线详情加载成功')
  } catch (err) {
    console.error('加载航线详情失败:', err)
  }
}

// 监听选中的航线变化
watch(selectedTrack, (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) {
    console.log('航线选择变化，加载详情:', newValue)
    loadWaylineDetail(newValue)
  }
}, { immediate: false })

// 响应式刷新标志，用于触发列表更新
const taskListRefreshKey = ref(0)

// 计算属性：获取航点数据（从缓存的循迹任务点列表中筛选）
const waypointsData = computed(() => {
  // 使用刷新标志作为依赖，确保响应式更新
  taskListRefreshKey.value
  
  // 从 localStorage 获取所有循迹任务点列表
  const cachedData = getAllTrackTaskListCacheRaw()
  if (!cachedData) {
    return []
  }
  
  try {
    const parsed = JSON.parse(cachedData)
    const allTaskList = extractTrackTaskList(parsed)
    
    // 如果没有选择路线或任务组，返回空数组
    if (!selectedRouteName.value || !selectedTaskGroupName.value) {
      return []
    }
    
    // 根据 track_name 和 track_point_name 筛选
    const selectedTrack = normalizeTrackName(selectedRouteName.value)
    const selectedTaskPoint = normalizeTaskPointName(String(selectedTaskGroupName.value || ''))
    const filteredTasks = allTaskList.filter((task: any) => {
      const taskTrack = normalizeTrackName(String(task.track_name || ''))
      const taskPointRaw = String(task.track_point_name || task.taskpoint_name || task.task_point_name || '')
      const taskPoint = normalizeTaskPointName(taskPointRaw)
      return taskTrack === selectedTrack && taskPoint === selectedTaskPoint
    })
    
    // 转换为表格需要的格式
    return filteredTasks.map((task: any, index: number) => {
      return {
        index: index,
        type: task.type_text || task.type,
        coordinates: {
          x: task.x,
          y: task.y,
          z: task.z
        },
        angle: task.theta,
        preset: task.preset || '',  // 只显示 preset 信息，不组合序号
        description: task.remark,
        extra: task.extra,
        gait: task.gait,
        ground: task.ground,
        nostop: task.nostop ?? task.no_switch,
        // 保留原始数据以备后用
        rawData: task
      }
    })
  } catch (err) {
    console.error('解析循迹任务点列表失败:', err)
    return []
  }
})

const missionEmptyRowCount = computed(() => Math.max(0, 10 - waypointsData.value.length))

const getTaskProgressLastTask = computed<Record<string, any> | null>(() => {
  const raw = (robotStore.taskProgress as any)?.last_task
  if (!raw) return null
  if (typeof raw === 'object' && raw !== null) return raw as Record<string, any>

  const text = String(raw).trim()
  if (!text || text === '[object Object]') return null
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, any>
    }
  } catch {}
  return null
})

const normalizeCompareValue = (value: unknown) => String(value ?? '').trim()

const isSameNumericValue = (a: unknown, b: unknown) => {
  const na = Number(a)
  const nb = Number(b)
  if (Number.isFinite(na) && Number.isFinite(nb)) {
    return Math.abs(na - nb) < 1e-6
  }
  return normalizeCompareValue(a) === normalizeCompareValue(b)
}

const isLastTaskRow = (waypoint: any) => {
  if (!isTrackTaskRunning.value) return false

  const lastTask = getTaskProgressLastTask.value
  const rowTask = waypoint?.rawData
  if (!lastTask || !rowTask) return false

  const lastTaskId = normalizeCompareValue(lastTask.task_id)
  const rowTaskId = normalizeCompareValue(rowTask.task_id)
  if (lastTaskId && rowTaskId) {
    return lastTaskId === rowTaskId
  }

  const sameX = isSameNumericValue(lastTask.x, rowTask.x)
  const sameY = isSameNumericValue(lastTask.y, rowTask.y)
  const sameTheta = isSameNumericValue(lastTask.theta, rowTask.theta)
  const sameType =
    normalizeCompareValue(lastTask.type_text || lastTask.type) ===
    normalizeCompareValue(rowTask.type_text || rowTask.type)
  const sameCreateTime =
    normalizeCompareValue(lastTask.createtime) &&
    normalizeCompareValue(rowTask.createtime) &&
    normalizeCompareValue(lastTask.createtime) === normalizeCompareValue(rowTask.createtime)

  return (sameX && sameY && sameTheta && sameType) || (sameCreateTime && sameX && sameY)
}

// 获取当前航线名称
const getCurrentWaylineName = () => {
  const currentWayline = waylineFiles.value.find(f => f.wayline_id === selectedTrack.value)
  return currentWayline ? currentWayline.name : '未知航线'
}

// 格式化坐标显示
const formatCoordinates = (coordinates: [number, number]) => {
  if (!coordinates || coordinates.length !== 2) {
    return '-'
  }
  const [lng, lat] = coordinates
  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
}

// 获取动作图标
const getActionIcon = (actionType: string) => {
  const iconMap: { [key: string]: string } = {
    'rotateYaw': iconLeftRight,
    'gimbalRotate': iconHover,
    'zoom': iconBigger,
    'startRecord': iconStartVideo,
    'stopRecord': iconStopVideo,
    'takePhoto': iconTakePhoto,
    'focus': iconAbsPhoto
  }
  return iconMap[actionType] || iconTakePhoto
}

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

const trackSelectRef = ref<HTMLSelectElement | null>(null)
const isTrackSelectOpen = ref(false)
function openTrackSelect() {
  if (trackSelectRef.value) {
    trackSelectRef.value.focus()
    trackSelectRef.value.click && trackSelectRef.value.click()
    isTrackSelectOpen.value = true
  }
}
function onTrackSelectBlur() {
  isTrackSelectOpen.value = false
}
function onTrackSelectFocus() {
  isTrackSelectOpen.value = true
}
function onTrackSelectChange() {
  isTrackSelectOpen.value = false
  console.log('下拉选择框变化事件触发')
}
function onTrackSelectMousedown() {
  isTrackSelectOpen.value = true
}
function onTrackSelectKeydown(e: KeyboardEvent) {
  if ([" ", "Enter", "ArrowDown"].includes(e.key)) {
    isTrackSelectOpen.value = true
  }
  if (["Escape", "Esc"].includes(e.key)) {
    isTrackSelectOpen.value = false
  }
}

const confirmDialog = ref({
  visible: false,
  message: '',
  onOk: () => {},
  showCancel: true
})
function showConfirmDialog(message: string, onOk: () => void, showCancel = true) {
  confirmDialog.value.visible = true
  confirmDialog.value.message = message
  confirmDialog.value.onOk = onOk
  confirmDialog.value.showCancel = showCancel
}
function onConfirmDialogOk() {
  confirmDialog.value.visible = false
  confirmDialog.value.onOk && confirmDialog.value.onOk()
}
function onConfirmDialogCancel() {
  confirmDialog.value.visible = false
}
async function handleDeleteTrack() {
  const current = waylineFiles.value.find(f => f.wayline_id === selectedTrack.value)
  const trackName = current?.name || '未知航线'
  if (!current) {
    alert('请先选择要删除的航线')
    return
  }
  showConfirmDialog(`确定要删除航线'${trackName}'吗？`, async () => {
    try {
      const workspaceId = getCachedWorkspaceId()
      if (!workspaceId) {
        alert('未找到workspace_id')
        return
      }
      await waylineApi.deleteWaylineFile(workspaceId, current.wayline_id)
      alert('删除成功')
      // 刷新列表并重置选择
      await fetchWaylineFiles(workspaceId, { page: 1, page_size: 100 })
      if (waylineFiles.value.length > 0) {
        selectedTrack.value = waylineFiles.value[0].wayline_id
        await loadWaylineDetail(selectedTrack.value)
      } else {
        selectedTrack.value = ''
      }
    } catch (err) {
      console.error('删除航线失败:', err)
      let message = '删除失败，请重试'
      if (typeof err === 'string') {
        message = err
      } else if (err && typeof err === 'object') {
        const anyErr = err as any
        if (typeof anyErr.detail === 'string' && anyErr.detail) {
          message = anyErr.detail
        } else if (typeof anyErr.message === 'string' && anyErr.message) {
          message = anyErr.message
        }
      }
      alert(message)
    }
  })
}
const uploadDialog = ref({
  visible: false,
  file: null as File | null,
  fileName: '',
  waylineName: '',
  droneModel: ''
})

// 算法选项
const algorithmOptions = {
  49: "常熟1号线路灯",
  50: "常熟2号线路灯", 
  51: "常熟3号线路灯",
  52: "常熟楼宇亮化",
  9: "人车检测"
}

// 下发任务弹窗
const dispatchTaskDialog = ref({
  visible: false,
  form: {
    name: '',
    dock_sn: '',
    file_id: '',
    task_type: 0,
    out_of_control_action: 0,
    rth_altitude: 100,
    rth_mode: 1,
    exit_wayline_when_rc_lost: 0,
    wayline_precision_type: 1,
    begin_time: null as string | null,
    end_time: null as string | null,
    execute_time: null as string | null,
    enable_vision: false, // 新增算法开关
    vision_algorithms: [] as number[], // 新增算法选择
    vision_threshold: 0.5, // 新增算法阈值
    // 周期任务相关
    enable_recurrence: false,
    recurrence_start_date: '' as string,
    recurrence_end_date: '' as string
  }
})

const fileInputRef = ref<HTMLInputElement | null>(null)

// 返回当前本地时间+4分钟（到分钟）的最小值，供 datetime-local 作为最小值
const getMinLocalDateTime = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 4)
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const m = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const hh = pad(now.getHours())
  const mm = pad(now.getMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

// 返回今天的日期，格式为 YYYY-MM-DD
const getTodayDate = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const m = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  return `${y}-${m}-${d}`
}

// 格式化本地日期时间为 YYYY-MM-DDTHH:mm:ss 格式
const formatLocalDateTime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`
}

function showUploadDialog() {
  uploadDialog.value.visible = true
  uploadDialog.value.file = null
  uploadDialog.value.fileName = ''
  uploadDialog.value.waylineName = ''
  
  // 获取无人机型号信息
  const { droneSns } = getCachedDeviceSns()
  if (droneSns && droneSns.length > 0) {
    // 从缓存中获取无人机设备信息
    const droneDevice = getCachedDeviceBySn(droneSns[0])
    
    if (droneDevice && droneDevice.device_type_info) {
      const { domain, device_type, sub_type } = droneDevice.device_type_info
      const droneModelKey = `${domain}-${device_type}-${sub_type}`
      uploadDialog.value.droneModel = droneModelKey
      console.log('无人机型号组合:', droneModelKey, '设备信息:', droneDevice.device_type_info)
    } else {
      uploadDialog.value.droneModel = '未知型号'
      console.log('未找到无人机设备信息')
    }
  } else {
    uploadDialog.value.droneModel = '未知型号'
    console.log('未找到无人机设备SN')
  }
  
  setTimeout(() => {
    if (fileInputRef.value) fileInputRef.value.value = ''
  }, 0)
}
function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.endsWith('.kmz')) {
      uploadDialog.value.file = file
      uploadDialog.value.fileName = file.name
      
      // 自动提取文件名（去掉.kmz扩展名）并填充到航线名称
      const fileNameWithoutExtension = file.name.replace(/\.kmz$/i, '')
      uploadDialog.value.waylineName = fileNameWithoutExtension
    } else {
      uploadDialog.value.file = null
      uploadDialog.value.fileName = ''
      uploadDialog.value.waylineName = '' // 清空航线名称
      alert('请选择.kmz格式的文件')
      if (fileInputRef.value) fileInputRef.value.value = ''
    }
  }
}
async function onUploadConfirm() {
  if (uploadDialog.value.file) {
    try {
      const workspaceId = getCachedWorkspaceId()
      if (!workspaceId) {
        alert('未找到workspace_id')
        return
      }
      
      // 获取token
      const token = localStorage.getItem('token')
      if (!token) {
        alert('未找到认证token，请重新登录')
        return
      }
      
      // 如果没有航线名称，使用文件名作为默认名称
      const waylineName = uploadDialog.value.waylineName.trim() || 
        uploadDialog.value.fileName.replace(/\.kmz$/i, '')
      
      // 创建FormData对象
      const formData = new FormData()
      formData.append('name', waylineName)
      formData.append('drone_model_key', uploadDialog.value.droneModel)
      formData.append('file', uploadDialog.value.file)
      
      console.log('上传参数:', {
        name: waylineName,
        drone_model_key: uploadDialog.value.droneModel,
        file: uploadDialog.value.file.name
      })
      
      // 调用上传接口，添加认证头
      const response = await fetch(`/api/v1/wayline/workspaces/${workspaceId}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('文件上传成功:', result)
        alert('航线文件上传成功')
        uploadDialog.value.visible = false
        
        // 刷新航线文件列表
        const workspaceId = getCachedWorkspaceId()
        if (workspaceId) {
          await fetchWaylineFiles(workspaceId, {
            page: 1,
            page_size: 100
          })
        }
      } else {
        const errorData = await response.json()
        console.error('文件上传失败:', errorData)
        alert(`文件上传失败: ${errorData.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      alert('文件上传失败，请检查网络连接')
    }
  } else {
    alert('请先选择航线文件')
  }
}
function onUploadCancel() {
  uploadDialog.value.visible = false
}
function handleAddTrack() {
  // 直接弹出上传文件弹窗
  showUploadDialog()
}
async function handleDispatchTask() {
  // 获取当前选中的航线信息
  const currentWayline = waylineFiles.value.find(f => f.wayline_id === selectedTrack.value)
  if (!currentWayline) {
    alert('请先选择一个航线')
    return
  }
  
  // 获取缓存的设备序列号
  const deviceSns = getCachedDeviceSns()
  if (!deviceSns.dockSns || deviceSns.dockSns.length === 0) {
    alert('未找到可用的设备')
    return
  }
  
  // 刷新一次设备/无人机状态以获取最新电量
  try {
    await Promise.all([fetchMainDeviceStatus(), fetchDroneStatus()])
  } catch (e) {
    // 静默处理
  }

  // 低电量提示（小于30%时给予二次确认）
  const currentBatteryPercent = typeof droneStatus.value?.batteryPercent === 'number'
    ? Math.round(droneStatus.value.batteryPercent as number)
    : null
  if (currentBatteryPercent !== null && currentBatteryPercent < 30) {
    const confirmContinue = window.confirm(`当前电量为${currentBatteryPercent}%，低于30%，不建议飞行。是否继续下发任务？`)
    if (!confirmContinue) {
      return
    }
  }
  
  // 初始化弹窗数据
  dispatchTaskDialog.value.form = {
    name: `航线任务_${Date.now()}`,
    dock_sn: deviceSns.dockSns[0], // 使用第一个机场设备
    file_id: currentWayline.wayline_id,
    task_type: 0,
    out_of_control_action: 0,
    rth_altitude: 100,
    rth_mode: 1,
    exit_wayline_when_rc_lost: 0,
    wayline_precision_type: 1,
    begin_time: null,
    end_time: null,
    execute_time: null,
    enable_vision: false, // 新增算法开关
    vision_algorithms: [] as number[], // 新增算法选择
    vision_threshold: 0.5, // 新增算法阈值
    enable_recurrence: false,
    recurrence_start_date: '',
    recurrence_end_date: ''
  }
  
  dispatchTaskDialog.value.visible = true
}

async function onDispatchTaskConfirm() {
  const form = dispatchTaskDialog.value.form
  
  // 验证必填字段
  if (!form.name.trim()) {
    alert('请输入任务名称')
    return
  }
  
  if (form.task_type === 1 && !form.begin_time) {
    alert('定时任务需要设置开始时间')
    return
  }
  
  // 验证定时任务的时间（必须在当前时间4分钟及以后）
  if (form.task_type === 1 && form.begin_time) {
    const selectedTime = new Date(form.begin_time)
    const currentTime = new Date()
    const minTime = new Date(currentTime.getTime() + 4 * 60 * 1000)
    if (selectedTime < minTime) {
      alert('定时任务的开始时间必须在当前时间4分钟及以后')
      return
    }
  }
  
  // 验证周期任务的日期
  if (form.task_type === 1 && form.enable_recurrence) {
    if (!form.recurrence_start_date || !form.recurrence_end_date) {
      alert('周期任务需要设置开始日期和结束日期')
      return
    }
    
    const startDate = new Date(form.recurrence_start_date)
    const endDate = new Date(form.recurrence_end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (startDate < today || endDate < today) {
      alert('周期任务的开始日期和结束日期不能早于今天')
      return
    }
    
    if (startDate > endDate) {
      alert('开始日期不能晚于结束日期')
      return
    }
  }
  
  // 执行下发任务逻辑
  console.log('下发任务参数:', form)
  
  try {
    const workspaceId = getCachedWorkspaceId()
    if (!workspaceId) {
      alert('未找到workspace_id')
      return
    }
    
    // 构建任务数据
    const taskData: any = {
      ...form,
      // 保留隐藏的字段（使用默认值）
      rth_mode: form.rth_mode || 1,
      out_of_control_action: form.out_of_control_action || 0,
      exit_wayline_when_rc_lost: form.exit_wayline_when_rc_lost || 0,
      wayline_precision_type: form.wayline_precision_type || 1
    }
    
    // 如果选择了周期任务，将task_type改为3
    if (form.task_type === 1 && form.enable_recurrence) {
      taskData.task_type = 3
      // 添加周期配置
      taskData.recurrence_config = {
        recurrence_type: 'date_range',
        start_date: form.recurrence_start_date,
        end_date: form.recurrence_end_date
      }
    }
    
    // 根据任务类型设置execute_time
    if (form.task_type === 0) {
      // 立即任务：设置当前时间作为execute_time
      taskData.execute_time = formatLocalDateTime(new Date())
    } else if (form.task_type === 1 && form.begin_time) {
      // 定时任务：使用begin_time作为execute_time
      taskData.execute_time = formatLocalDateTime(new Date(form.begin_time))
    }
    
    // 创建任务
    const response = await createJob(workspaceId, taskData)
    console.log('任务创建成功:', response)
    
    if (response && response.job_id) {
      // 立即任务需要调用execute接口
      if (form.task_type === 0) {
        try {
          await executeJob(workspaceId, response.job_id, {
            enable_vision: form.enable_vision,
            vision_algorithms: form.vision_algorithms,
            vision_threshold: form.vision_threshold
          })
          alert('立即任务创建并执行成功')
        } catch (executeErr) {
          console.error('任务执行失败:', executeErr)
          alert('立即任务创建成功，但执行失败')
        }
      } else {
        // 定时任务不调用execute接口
        alert('定时任务创建成功')
      }
    } else {
      alert('任务创建成功，但未获取到任务ID')
    }
    
    dispatchTaskDialog.value.visible = false
  } catch (err) {
    console.error('任务下发失败:', err)
    alert('任务下发失败')
  }
}

function onDispatchTaskCancel() {
  dispatchTaskDialog.value.visible = false
}

// 切换机器人后刷新循迹路线列表
const handleRobotContextRefreshed = async () => {
  syncSelectedMapWithCache()
  await loadRouteList()  // 刷新路线列表并更新 selectedRouteName
  // 强制刷新任务组列表：即使 selectedRouteName 没有改变（watch 不会触发），
  // 也要在切换机器人后主动请求当前路线的任务组
  if (selectedRouteName.value) {
    await fetchTaskGroupListByRoute(selectedRouteName.value)
  } else {
    applyTaskGroupSelection([])
  }
}

const refreshTrackTaskPageListOnEnter = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (robotId) {
    await refreshTrackTaskListFromApi(robotId)
  }
  syncSelectedMapWithCache()
  await loadRouteList()
  if (selectedRouteName.value) {
    await fetchTaskGroupListByRoute(selectedRouteName.value)
  } else {
    applyTaskGroupSelection([])
  }
}

// 页面加载时获取数据
// 页面加载时获取数据
onMounted(async () => {
  await loadWaylineFiles()
  await refreshTrackTaskPageListOnEnter()
  await fetchTaskTypeList()
  window.addEventListener('click', closeDropdown)
  window.addEventListener('robot-context-refreshed', handleRobotContextRefreshed)
})

let trackTaskPageMounted = false
onMounted(() => {
  trackTaskPageMounted = true
})

onActivated(async () => {
  if (!trackTaskPageMounted) return
  await refreshTrackTaskPageListOnEnter()
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdown)
  window.removeEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  destroyPreviewCanvasEvents()
})

/* Add Task Logic Copied from MissionRecords.vue */
const addTaskDialog = ref({
  visible: false,
  form: {
    isMulti: '0',
    typeInput: '',
    actionType: '',
    x: '',
    y: '',
    z: '',
    angle: '',
    preset: '',
    extraConfig: '',
    description: '',
    obsMode: '近障模式',
    gait: '1',
    ground: '1',
    stopAtPoint: false
  }
})
const addTaskFieldErrors = ref({
  taskType: '',
  x: '',
  y: '',
  z: '',
  angle: ''
})
const resetAddTaskFieldErrors = () => {
  addTaskFieldErrors.value = {
    taskType: '',
    x: '',
    y: '',
    z: '',
    angle: ''
  }
}

const normalizeTrackTaskObsModeText = (rawValue: any) => {
  const text = String(rawValue ?? '').trim()
  if (!text) return '近障模式'
  if (text === '0') return '无避障'
  if (text === '1') return '近障模式'
  if (text === '2') return '绕障模式'
  if (text === '无障碍') return '无避障'
  if (text === '无避障' || text === '近障模式' || text === '绕障模式') return text
  return text
}
const validateAddTaskRequiredFields = () => {
  resetAddTaskFieldErrors()

  const taskTypeText = String(addTaskDialog.value.form.typeInput || '').trim()
  const xText = String(addTaskDialog.value.form.x || '').trim()
  const yText = String(addTaskDialog.value.form.y || '').trim()
  const zText = String(addTaskDialog.value.form.z || '').trim()
  const angleText = String(addTaskDialog.value.form.angle || '').trim()

  if (!taskTypeText) addTaskFieldErrors.value.taskType = '任务类型不能为空'
  if (!xText) addTaskFieldErrors.value.x = 'X坐标不能为空'
  if (!yText) addTaskFieldErrors.value.y = 'Y坐标不能为空'
  if (!zText) addTaskFieldErrors.value.z = 'Z坐标不能为空'
  if (!angleText) addTaskFieldErrors.value.angle = '角度不能为空'

  return !addTaskFieldErrors.value.taskType
    && !addTaskFieldErrors.value.x
    && !addTaskFieldErrors.value.y
    && !addTaskFieldErrors.value.z
    && !addTaskFieldErrors.value.angle
}
const isEditMode = ref(false)
const editingTaskItem = ref<any>(null)
const addTaskSubmitting = ref(false)

const showTypeDropdown = ref(false)
const closeDropdown = () => { showTypeDropdown.value = false }

const splitTaskTypeNames = (value: unknown): string[] => {
  return String(value ?? '')
    .split(/[，,]/)
    .map(item => item.trim())
    .filter(Boolean)
}

const buildTaskTypeCacheKey = (robotId: string) => `cached_task_type_list_${robotId}`

const findTaskTypeMeta = (rawName: unknown) => {
  const name = String(rawName ?? '').trim()
  if (!name) return null
  return taskTypeList.value.find(item => {
    const cnName = String(item?.cn_name ?? '').trim()
    const typeText = String(item?.type_text ?? '').trim()
    const type = String(item?.type ?? '').trim()
    const enName = String(item?.en_name ?? '').trim()
    return [cnName, typeText, type, enName].includes(name)
  }) || null
}

const normalizeTaskTypeNameToCn = (rawName: unknown) => {
  const meta = findTaskTypeMeta(rawName)
  return String(meta?.cn_name ?? rawName ?? '').trim()
}

const resolveTaskTypeSubmitPayload = (rawValue: unknown) => {
  const names = splitTaskTypeNames(rawValue)
  const metas = names.map(name => findTaskTypeMeta(name)).filter(Boolean)
  const resolvedTypeNames = metas
    .map(item => String((item as any)?.type ?? (item as any)?.en_name ?? '').trim())
    .filter(Boolean)
  const resolvedTypeIds = metas
    .map(item => (item as any)?.iType)
    .filter(item => item !== undefined && item !== null && String(item).trim() !== '')

  const typeText = names.join(',')
  const type = resolvedTypeNames.length > 0 ? resolvedTypeNames.join(',') : typeText

  let typeId = ''
  if (resolvedTypeIds.length === 1) {
    typeId = String(resolvedTypeIds[0])
  } else if (resolvedTypeIds.length > 1) {
    typeId = resolvedTypeIds.map(item => String(item)).join(',')
  }

  return {
    type,
    type_text: typeText,
    type_id: typeId
  }
}

const selectTaskType = (item: any) => {
  addTaskDialog.value.form.actionType = item.cn_name
  
  const isMulti = addTaskDialog.value.form.isMulti === '1'
  if (isMulti) {
    let list = splitTaskTypeNames(addTaskDialog.value.form.typeInput)
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
  const list = splitTaskTypeNames(current)
  return list.includes(item.cn_name)
}

const taskTypeList = ref<any[]>([])
let skipNextIsMultiReset = false
let suppressExtraConfigReset = false

const filteredTaskTypes = computed(() => {
  const isSingle = addTaskDialog.value.form.isMulti === '0'
  return taskTypeList.value.filter(item => item.single === isSingle)
})

const fetchTaskTypeList = async () => {
  const robotId = localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  const cacheKey = buildTaskTypeCacheKey(robotId)
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) {
        taskTypeList.value = parsed
        return
      }
    } catch (e) {
      console.error('解析任务类型缓存失败', e)
      localStorage.removeItem(cacheKey)
    }
  }

  try {
    const res = await navigationApi.getTaskTypeList(robotId)
    if (res && Array.isArray(res.data)) {
      taskTypeList.value = res.data
      localStorage.setItem(cacheKey, JSON.stringify(res.data))
    }
  } catch (err) {
    console.error('获取任务类型列表失败', err)
  }
}

watch(() => addTaskDialog.value.form.isMulti, () => {
  if (skipNextIsMultiReset) {
    skipNextIsMultiReset = false
    return
  }
  addTaskDialog.value.form.typeInput = ''
})
watch(() => addTaskDialog.value.form.typeInput, (val) => {
  if (String(val || '').trim()) addTaskFieldErrors.value.taskType = ''
})
watch(() => addTaskDialog.value.form.actionType, (val, oldVal) => {
  if (String(val || '').trim()) addTaskFieldErrors.value.taskType = ''
  const nextType = String(val || '').trim()
  const prevType = String(oldVal || '').trim()
  if (nextType !== prevType && !suppressExtraConfigReset) {
    addTaskDialog.value.form.extraConfig = ''
  }
})
const sanitizeNumericInput = (value: unknown): string => {
  const raw = String(value ?? '')
  if (!raw) return ''
  let next = raw.replace(/[^\d.-]/g, '')
  next = next.replace(/(?!^)-/g, '')
  const dotIndex = next.indexOf('.')
  if (dotIndex !== -1) {
    next = next.slice(0, dotIndex + 1) + next.slice(dotIndex + 1).replace(/\./g, '')
  }
  if (next.startsWith('.')) next = `0${next}`
  if (next.startsWith('-.')) next = `-0${next.slice(1)}`
  return next
}
watch(() => addTaskDialog.value.form.x, (val) => {
  const sanitized = sanitizeNumericInput(val)
  if (sanitized !== String(val ?? '')) {
    addTaskDialog.value.form.x = sanitized
    return
  }
  if (String(sanitized || '').trim()) addTaskFieldErrors.value.x = ''
})
watch(() => addTaskDialog.value.form.y, (val) => {
  const sanitized = sanitizeNumericInput(val)
  if (sanitized !== String(val ?? '')) {
    addTaskDialog.value.form.y = sanitized
    return
  }
  if (String(sanitized || '').trim()) addTaskFieldErrors.value.y = ''
})
watch(() => addTaskDialog.value.form.z, (val) => {
  const sanitized = sanitizeNumericInput(val)
  if (sanitized !== String(val ?? '')) {
    addTaskDialog.value.form.z = sanitized
    return
  }
  if (String(sanitized || '').trim()) addTaskFieldErrors.value.z = ''
})
watch(() => addTaskDialog.value.form.angle, (val) => {
  const sanitized = sanitizeNumericInput(val)
  if (sanitized !== String(val ?? '')) {
    addTaskDialog.value.form.angle = sanitized
    return
  }
  if (String(sanitized || '').trim()) addTaskFieldErrors.value.angle = ''
})

watch(filteredTaskTypes, (list) => {
  if (!list || list.length === 0) {
    addTaskDialog.value.form.actionType = ''
    return
  }

  const currentAction = String(addTaskDialog.value.form.actionType || '').trim()
  if (currentAction && list.some(item => item.cn_name === currentAction)) {
    return
  }

  addTaskDialog.value.form.actionType = list[0].cn_name
}, { immediate: true })

const handleAddTask = () => {
  resetAddTaskFieldErrors()
  const cmdStatus = robotStore.cmdStatus
  const canPrefillPose =
    Number(cmdStatus?.nav ?? 0) === 1 ||
    Number(cmdStatus?.ins ?? 0) === 1 ||
    Number(cmdStatus?.msf ?? 0) === 1
  const prefillX = canPrefillPose && currentPosition.value.x != null ? String(currentPosition.value.x) : ''
  const prefillY = canPrefillPose && currentPosition.value.y != null ? String(currentPosition.value.y) : ''
  const prefillZ = canPrefillPose && currentPosition.value.z != null ? String(currentPosition.value.z) : ''
  const prefillAngle = canPrefillPose && currentPosition.value.angle != null ? String(currentPosition.value.angle) : ''
  // 重置表单
  addTaskDialog.value.form.typeInput = ''
  addTaskDialog.value.form.actionType = ''
  addTaskDialog.value.form.x = prefillX
  addTaskDialog.value.form.y = prefillY
  addTaskDialog.value.form.z = prefillZ
  addTaskDialog.value.form.angle = prefillAngle
  addTaskDialog.value.form.preset = ''
  addTaskDialog.value.form.description = ''
  addTaskDialog.value.form.extraConfig = ''
  addTaskDialog.value.form.obsMode = '近障模式'
  addTaskDialog.value.form.gait = '1'
  addTaskDialog.value.form.ground = '1'
  addTaskDialog.value.form.stopAtPoint = false
  addTaskDialog.value.form.isMulti = '0'

  isEditMode.value = false
  editingTaskItem.value = null
  addTaskDialog.value.visible = true
  fetchTaskTypeList()
}

const parseBooleanLike = (value: unknown): boolean | null => {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return null
}

const resolveStopAtPointFromTask = (task: any): boolean => {
  // 循迹任务接口返回值与UI开关语义保持一致：false=关闭，true=开启
  const noStop = parseBooleanLike(task?.nostop ?? task?.no_stop)
  if (noStop !== null) return noStop

  const noSwitch = parseBooleanLike(task?.no_switch ?? task?.noSwitch)
  if (noSwitch !== null) return noSwitch

  const stopAtPoint = parseBooleanLike(task?.stopAtPoint ?? task?.stop_at_point)
  if (stopAtPoint !== null) return stopAtPoint

  return false
}

const handleEditTask = async (waypoint: any) => {
  resetAddTaskFieldErrors()
  // Find the original item from key data if needed, or use waypoint if it has all data
  // waypoint here is the computed object for table display. We might need the raw object.
  // Assuming waypoint (from waypointsData) has necessary fields or we can find it.
  // Actually, we should try to find the full object from `taskGroups` or wherever `waypointsData` is derived.
  // For now, let's map what we have and assume standard fields.
  
  // Need to find the original raw item. 
  // Since waypointsData is computed from selectedTaskGroupName's group list?
  // Let's assume we can reconstruct or simple map. 
  // Ideally, waypointsData should include the full raw object. I'll check/hope 'waypoint' has it or I can find it.
  // Looking at the view_file (which I missed definition of waypointsData), usually it maps.
  // Let's implement assuming waypoint contains `raw` or we map available fields.
  
  // Wait, I need access to the raw list to get `task_id`. 
  // If `waypointsData` generation didn't include `task_id`, I'm in trouble.
  // However, `mission-common` usually puts task_id in table... no the table doesn't show ID.
  // Let's assume `waypointsData` items have `...rawItem` spread or similar.
  // I will check if `waypoint` has `task_id` or `id`.
  
  // Let's try to pass `waypoint` properties to form.
  
  isEditMode.value = true
  editingTaskItem.value = waypoint // This might be partial. 
  suppressExtraConfigReset = true
  
  // 处理预置点信息：从 preset 和 presetID 组合回原始格式
  let presetDisplay = ''
  const rawPreset = waypoint.rawData?.preset || waypoint.preset || ''
  const rawPresetID = waypoint.rawData?.presetID || ''
  if (rawPreset && rawPresetID) {
    // presetID 格式为 "预置点4"，提取数字
    const match = rawPresetID.match(/预置点(\d+)/)
    if (match) {
      presetDisplay = `${match[1]}.${rawPreset}`  // 组合成 "4.测试点123"
    } else {
      presetDisplay = rawPreset
    }
  } else if (rawPreset) {
    presetDisplay = rawPreset
  }

  try {
    await fetchTaskTypeList()

    const rawTypeText = waypoint.rawData?.type_text || waypoint.rawData?.type || waypoint.type || ''
    const typeNames = splitTaskTypeNames(rawTypeText).map(normalizeTaskTypeNameToCn)
    const normalizedTypeText = typeNames.join(',')
    const matchedTypeMeta = taskTypeList.value.filter(item => typeNames.includes(String(item?.cn_name || '')))
    const hasSingleType = matchedTypeMeta.some(item => item?.single === true)
    const hasMultiType = matchedTypeMeta.some(item => item?.single === false)

    let targetIsMulti: '0' | '1'
    if (hasSingleType && !hasMultiType) {
      targetIsMulti = '0'
    } else if (!hasSingleType && hasMultiType) {
      targetIsMulti = '1'
    } else {
      targetIsMulti = typeNames.length > 1 ? '1' : '0'
    }

    skipNextIsMultiReset = true
    addTaskDialog.value.form.isMulti = targetIsMulti
    addTaskDialog.value.form.typeInput = normalizedTypeText
    addTaskDialog.value.form.actionType = typeNames[0] || ''

    addTaskDialog.value.form.x = (waypoint.coordinates?.x || '0').toString()
    addTaskDialog.value.form.y = (waypoint.coordinates?.y || '0').toString()
    addTaskDialog.value.form.z = (waypoint.coordinates?.z || '0').toString()
    addTaskDialog.value.form.angle = (waypoint.angle || '0').toString()
    addTaskDialog.value.form.preset = presetDisplay
    addTaskDialog.value.form.description = waypoint.description || ''
    addTaskDialog.value.form.extraConfig = waypoint.extra || waypoint.rawData?.extra || ''
    addTaskDialog.value.form.obsMode = normalizeTrackTaskObsModeText(waypoint.rawData?.obs_mode)
    addTaskDialog.value.form.gait = waypoint.gait || waypoint.rawData?.gait || '1'
    addTaskDialog.value.form.ground = waypoint.ground || waypoint.rawData?.ground || '1'
    addTaskDialog.value.form.stopAtPoint = resolveStopAtPointFromTask(waypoint.rawData || waypoint)

    addTaskDialog.value.visible = true
    await nextTick()
  } finally {
    suppressExtraConfigReset = false
  }
}

const cancelAddTask = () => {
  resetAddTaskFieldErrors()
  addTaskDialog.value.visible = false
}

const confirmAddTask = async () => {
  if (addTaskSubmitting.value) return
  if (!validateAddTaskRequiredFields()) return

  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return

  if (!selectedRouteName.value || !selectedTaskGroupName.value) {
    console.warn('请先选择路线和任务组')
    return
  }

  const form = addTaskDialog.value.form
  const now = Math.floor(Date.now() / 1000)
  const timestamp = now.toString()
  const nextTimeValue = isEditMode.value
    ? Number(editingTaskItem.value?.rawData?.time ?? 0)
    : waypointsData.value.length

  // 处理预置点信息：格式如 "4.测试点123"
  let presetValue = ''
  let presetIDValue = ''
  if (form.preset) {
    const match = form.preset.match(/^(\d+)\.(.+)$/)
    if (match) {
      const [, number, name] = match
      presetValue = name  // "测试点123"
      presetIDValue = `预置点${number}`  // "预置点4"
    } else {
      // 如果格式不匹配，使用原值
      presetValue = form.preset
      presetIDValue = form.preset
    }
  }

  const taskData: any = {
    task_id: isEditMode.value ? (editingTaskItem.value?.rawData?.task_id || `track_${timestamp}`) : `track_${timestamp}`,
    ...resolveTaskTypeSubmitPayload(form.typeInput || ''),
    x: parseFloat(form.x) || 0,
    y: parseFloat(form.y) || 0,
    z: parseFloat(form.z) || 0,
    theta: parseFloat(form.angle) || 0,
    preset: presetValue,
    presetID: presetIDValue,
    remark: form.description || '',
    time: Number.isFinite(nextTimeValue) ? nextTimeValue : 0,
    cam_key: 'cam_rtsp_left',
    track_name: selectedRouteName.value,
    track_point_name: selectedTaskGroupName.value,
    extra: form.extraConfig || '',
    obs_mode: form.obsMode || '近障模式',
    nostop: form.stopAtPoint,
    gait: form.gait,
    ground: form.ground,
    createtime: isEditMode.value ? (editingTaskItem.value?.rawData?.createtime || timestamp) : timestamp
  }

  addTaskSubmitting.value = true
  try {
    let response: any
    
    if (isEditMode.value) {
      // 编辑模式：调用更新接口
      response = await navigationApi.updateTaskPoint(robotId, taskData)
    } else {
      // 添加模式：调用添加接口
      response = await navigationApi.addTrackPoint(robotId, taskData)
    }

    const effectiveMsg = response?.msg ?? response?.response?.msg ?? null
    const isAddPointSuccess = Number(effectiveMsg?.error_code ?? -1) === 0
    const shouldRefreshListFromApi =
      !isEditMode.value &&
      !isAddPointSuccess &&
      (!effectiveMsg || response?.response === null)

    if (shouldRefreshListFromApi) {
      await refreshTrackTaskListFromApi(robotId)
      addTaskDialog.value.visible = false
      isEditMode.value = false
      editingTaskItem.value = null
      errorMessage.value = { show: true, text: '任务点添加失败' }
      setTimeout(() => {
        errorMessage.value.show = false
      }, 2000)
      return
    } else {
      // 重新获取任务列表更新缓存
      const cachedData = getAllTrackTaskListCacheRaw()
      let allTaskList = cachedData ? JSON.parse(cachedData) : []

      if (isEditMode.value && editingTaskItem.value?.rawData) {
        // 编辑模式：查找并更新本地缓存
        const index = allTaskList.findIndex((task: any) => 
          task.task_id === editingTaskItem.value.rawData.task_id &&
          task.track_name === selectedRouteName.value &&
          task.track_point_name === selectedTaskGroupName.value
        )
        if (index !== -1) {
          allTaskList[index] = taskData
        }
      } else {
        // 添加模式：追加到本地缓存
        allTaskList.push(taskData)
      }

      setAllTrackTaskListCache(allTaskList)
    
      // 触发列表刷新
      taskListRefreshKey.value++
      if (isEditMode.value) {
        await refreshTrackTaskListFromApi(robotId)
      }
    }
    
    successMessage.value = { show: true, text: isEditMode.value ? '编辑成功' : '添加成功' }
    setTimeout(() => {
      successMessage.value.show = false
    }, 2000)
    
    addTaskDialog.value.visible = false
    isEditMode.value = false
    editingTaskItem.value = null
  } catch (err: any) {
    console.error('操作失败', err)
    errorMessage.value = { show: true, text: `操作失败: ${parseMissionErrorMessage(err)}` }
    setTimeout(() => {
      errorMessage.value.show = false
    }, 2000)
  } finally {
    addTaskSubmitting.value = false
  }
}

const handleDeleteTask = (waypoint: any) => {
  showConfirmDialog('确定要删除该任务点吗？', async () => {
    const robotId = localStorage.getItem('selected_robot_id')
    if (!robotId) return

    if (!selectedRouteName.value || !selectedTaskGroupName.value) return

    const rawData = waypoint.rawData || {}
    
    try {
      // 调用删除接口，传递完整的任务数据
      const deleteResponse: any = await navigationApi.deleteTrackPoint(robotId, {
        task_id: rawData.task_id || '',
        createtime: String(rawData.createtime ?? rawData.create_time ?? ''),
        type: rawData.type || rawData.type_text || '',
        type_text: rawData.type_text || rawData.type || '',
        x: parseFloat(rawData.x) || 0,
        y: parseFloat(rawData.y) || 0,
        z: parseFloat(rawData.z) || 0,
        theta: parseFloat(rawData.theta) || 0,
        preset: rawData.preset || '',
        presetID: rawData.presetID || '',
        remark: rawData.remark || '',
        time: Number(rawData.time ?? 0),
        cam_key: rawData.cam_key || 'cam_rtsp_left',
        track_name: selectedRouteName.value,
        track_point_name: selectedTaskGroupName.value
      })

      // 删除接口成功后优先使用返回的全量循迹任务列表，避免再请求 alltask_list
      const responseTaskListRaw = deleteResponse?.response?.msg?.result
      let allTaskList: any[] = []
      if (Array.isArray(responseTaskListRaw)) {
        allTaskList = responseTaskListRaw
      } else {
        // 兜底：若接口未返回列表，仍按本地缓存删除指定任务
        const cachedData = getAllTrackTaskListCacheRaw()
        allTaskList = cachedData ? JSON.parse(cachedData) : []
        allTaskList = allTaskList.filter((task: any) =>
          !(task.task_id === rawData.task_id &&
            task.track_name === selectedRouteName.value &&
            task.track_point_name === selectedTaskGroupName.value)
        )
      }

      setAllTrackTaskListCache(allTaskList)
      
      // 触发列表刷新
      taskListRefreshKey.value++
      
      successMessage.value = { show: true, text: '删除成功' }
      setTimeout(() => {
        successMessage.value.show = false
      }, 2000)
    } catch (err) {
      console.error('删除异常', err)
      errorMessage.value = { show: true, text: `删除失败: ${parseMissionErrorMessage(err)}` }
      setTimeout(() => {
        errorMessage.value.show = false
      }, 2000)
    }
  })
}

const handleArriveTask = async (waypoint: any) => {
  if (!isTrackTaskRunning.value) {
    showMissionError('需要先启动循迹任务')
    return
  }
  showConfirmDialog('确定要执行到点任务吗？', async () => {
    const robotId = localStorage.getItem('selected_robot_id')
    if (!robotId) return

    const chargeIndex = Number(waypoint?.rawData?.time ?? waypoint?.time)
    if (!Number.isFinite(chargeIndex)) {
      errorMessage.value = { show: true, text: '当前任务点缺少有效的 time 字段' }
      setTimeout(() => {
        errorMessage.value.show = false
      }, 2000)
      return
    }
    
    successMessage.value = { show: true, text: '到点指令已发送' }
    setTimeout(() => {
      successMessage.value.show = false
    }, 2000)

    navigationApi.oneKeyRecharge(robotId, { chargeIndex }).catch((err) => {
      console.error('到点指令发送失败', err)
    })
  })
}

/* Preset Dialog Logic */
const presetDialog = ref({
  visible: false,
  form: {
    id: '',
    name: ''
  }
})

// Mock preset list for UI layout - replace with API call later if needed
const presetList = ref<{id: string, name: string}[]>(
  Array.from({ length: 300 }, (_, i) => ({
    id: String(i + 1),
    name: `${i + 1}.预置点${i + 1}`
  }))
)
const isPresetDropdownOpen = ref(false)
const presetDropdownRef = ref<HTMLElement | null>(null)

const selectPreset = (p: {id: string, name: string}) => {
    presetDialog.value.form.id = p.id
    presetDialog.value.form.name = p.name
    isPresetDropdownOpen.value = false
}

// 监听预置点下拉列表打开，自动滚动到选中项
watch(isPresetDropdownOpen, (isOpen) => {
  if (isOpen && presetDialog.value.form.id) {
    nextTick(() => {
      const index = presetList.value.findIndex(p => p.id === presetDialog.value.form.id)
      if (index !== -1 && presetDropdownRef.value) {
        const dropdown = presetDropdownRef.value.querySelector('.custom-select-dropdown')
        if (dropdown) {
          // 获取实际的选项高度
          const firstOption = dropdown.querySelector('.custom-select-option')
          const optionHeight = firstOption ? firstOption.getBoundingClientRect().height : 40
          
          // 滚动到选中项，使其在可视区域顶部显示，留一些间距
          const scrollTop = index * optionHeight
          dropdown.scrollTop = Math.max(0, scrollTop)
        }
      }
    })
  }
})

// Video Playback Logic
const videoElement = ref<HTMLVideoElement | null>(null)
const presetVideoWrapper = ref<HTMLElement | null>(null)
let pc: RTCPeerConnection | null = null
const isPlaying = ref(false)
const videoStreamUrl = ref('')
const isPresetStreamSwitching = ref(false)

const getRobotCameraListCacheKey = (robotId: string) => `camera_list_${robotId}`
const getRobotVideoStreamsCacheKey = (robotId: string) => `video_streams_${robotId}`

const getRobotVideoStreams = (robotId: string): VideoStream[] => {
  try {
    const cached = localStorage.getItem(getRobotVideoStreamsCacheKey(robotId))
    if (cached) return JSON.parse(cached)
  } catch {}
  return getVideoStreams()
}

const getRobotVideoStreamByType = (robotId: string, type: VideoStream['type']): VideoStream | null => {
  const streams = getRobotVideoStreams(robotId)
  return streams.find(stream => stream.type === type) || null
}

const setRobotVideoStreams = (robotId: string, streams: VideoStream[]) => {
  localStorage.setItem(getRobotVideoStreamsCacheKey(robotId), JSON.stringify(streams))
  setVideoStreams(streams)
}

const getPresetVisibleStream = (): VideoStream | null => {
  const robotId = localStorage.getItem('selected_robot_id') || ''
  if (robotId) {
    return getRobotVideoStreamByType(robotId, 'drone_visible')
  }
  return getVideoStream('drone_visible')
}

const hasSubStreamFromCameraCache = (stream: VideoStream): boolean => {
  const robotId = localStorage.getItem('selected_robot_id') || ''
  try {
    const raw = robotId
      ? (localStorage.getItem(getRobotCameraListCacheKey(robotId)) || localStorage.getItem('camera_list'))
      : localStorage.getItem('camera_list')
    if (!raw) return false
    const cameras = JSON.parse(raw) as any[]
    const camera = cameras.find(item => String(item?.CamKey) === String(stream.camera_index))
    return !!(camera?.MainUrl && camera?.SubUrl)
  } catch {
    return false
  }
}

const canSwitchPresetVideoStream = computed(() => {
  const stream = getPresetVisibleStream()
  if (!stream) return false
  const fromStream = (stream.switchable_video_types?.length ?? 0) > 0
  return !!stream.camera_index && (fromStream || hasSubStreamFromCameraCache(stream))
})

const presetVideoStreamModeLabel = computed(() => {
  const stream = getPresetVisibleStream()
  return stream?.use_sub_stream ? '子' : '主'
})

const handleTogglePresetVideoStream = async () => {
  const stream = getPresetVisibleStream()
  if (!stream) {
    showMissionError('未找到视频流缓存信息')
    return
  }
  if (!canSwitchPresetVideoStream.value) {
    showMissionError('当前视频不支持主/子码流切换')
    return
  }
  if (isPresetStreamSwitching.value) return

  isPresetStreamSwitching.value = true
  const robotId = localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    isPresetStreamSwitching.value = false
    showMissionError('未选择机器人，无法切换码流')
    return
  }

  const nextUseSubStream = !(stream.use_sub_stream === true)

  try {
    try {
      await cameraApi.stopCameraStream(robotId, stream.camera_index)
    } catch (stopError) {
      console.warn('切换码流前停止旧流失败，继续尝试启动新流:', stopError)
    }

    const response = await cameraApi.startCameraStream(robotId, stream.camera_index, nextUseSubStream)
    if (!response?.stream_url) {
      throw new Error('切换后未返回有效视频地址')
    }

    const updatedStream: VideoStream = {
      ...stream,
      url: response.stream_url,
      switchable_video_types: (stream.switchable_video_types?.length ?? 0) > 0 ? stream.switchable_video_types : ['main', 'sub'],
      use_sub_stream: nextUseSubStream,
    }

    const streams = getRobotVideoStreams(robotId)
    const updated = streams.map(item =>
      item.type === updatedStream.type ? { ...item, ...updatedStream } : item
    )
    setRobotVideoStreams(robotId, updated)

    await startWebRTCPlayback(response.stream_url)
    showMissionSuccess(`已切换到${nextUseSubStream ? '子码流' : '主码流'}`)
  } catch (error) {
    showMissionError(`码流切换失败: ${parseMissionErrorMessage(error)}`)
  } finally {
    isPresetStreamSwitching.value = false
  }
}

const handlePresetManualReconnect = async () => {
  if (!videoStreamUrl.value) return
  await startWebRTCPlayback(videoStreamUrl.value)
}

const togglePresetVideoPanelFullscreen = async () => {
  const wrapper = presetVideoWrapper.value
  if (!wrapper) return

  try {
    if (document.fullscreenElement === wrapper) {
      await document.exitFullscreen()
      return
    }
    await wrapper.requestFullscreen()
  } catch (error) {
    console.error('预置点视频全屏切换失败:', error)
  }
}

const buildApiUrl = (webrtcUrl: string) => {
  try {
    // 通过 nginx 代理，解决 CORS 问题
    const url = new URL(webrtcUrl)
    return `/rtc-proxy/${url.hostname}`
  } catch (error) {
    const match = webrtcUrl.replace('webrtc://', '').split('/')[0].split(':')[0]
    return `/rtc-proxy/${match}`
  }
}

const startWebRTCPlayback = async (url: string) => {
  if (pc) {
    pc.close()
    pc = null
  }
  
  videoStreamUrl.value = url
  
  try {
    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    
    pc.ontrack = (e) => {
      if (videoElement.value && e.streams && e.streams[0]) {
        videoElement.value.srcObject = e.streams[0]
        videoElement.value.play().then(() => {
          isPlaying.value = true
        }).catch(e => console.error('Video play failed', e))
      }
    }
    
    // ICE连接状态监听
    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc?.iceConnectionState)
      if (pc?.iceConnectionState === 'connected') {
        isPlaying.value = true
      }
    }

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })
    
    await pc.setLocalDescription(offer)
    
    const apiUrl = buildApiUrl(url)
    console.log('Requesting stream from:', apiUrl)
    
    const response = await fetch(`${apiUrl}/rtc/v1/play/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: offer.sdp, streamurl: url })
    })
    
    if (!response.ok) {
        throw new Error(`Server response error: ${response.status}`)
    }

    const data = await response.json()
    if (data.code === 0 && data.sdp) {
       await pc.setRemoteDescription({
         type: 'answer',
         sdp: data.sdp
       })
    } else {
        console.error('SRS Error:', data)
    }
  } catch (e) {
    console.error('WebRTC setup error', e)
    isPlaying.value = false
  }
}

const stopWebRTCPlayback = () => {
  if (pc) {
    pc.close()
    pc = null
  }
  if (videoElement.value) {
    videoElement.value.srcObject = null
  }
  isPlaying.value = false
}

const openPresetDialog = async () => {
  presetDialog.value.visible = true
  
  // 获取当前表单中的预置点值
  const currentPreset = addTaskDialog.value.form.preset
  
  // Get robot ID and camera list
  const robotId = localStorage.getItem('selected_robot_id')
  const cameraListStr = localStorage.getItem('camera_list')
  
  if (robotId && cameraListStr) {
    try {
      const cameraList = JSON.parse(cameraListStr)
      if (cameraList && cameraList.length > 0) {
        // Use the first camera's PtzName
        const ptzName = cameraList[0].PtzName
        if (ptzName) {
           console.log('Fetching presets for:', ptzName)
           try {
             // Re-initialize preset list to default 1-300 if needed, or keep existing map
             // We want to overwrite names where ID matches
             const res = await navigationApi.getPresets(robotId, ptzName)
             if (res && res.code === 200 && Array.isArray(res.list)) {
                // Update presetList with fetched names
                res.list.forEach((item: any) => {
                    const idStr = String(item.id)
                    const existingIndex = presetList.value.findIndex(p => p.id === idStr)
                    if (existingIndex !== -1) {
                        presetList.value[existingIndex].name = `${idStr}.${item.presetName}`
                    }
                })
                console.log('Presets updated with API data')
             }
           } catch (err) {
             console.error('Failed to get presets API:', err)
           }
        }
      }
    } catch (e) {
      console.error('Error parsing camera_list or fetching presets:', e)
    }
  }

  // 根据当前选中的预置点设置选中项
  if (currentPreset) {
    // 从当前值中提取预置点名称（格式可能是 "4.测试点123"）
    const match = currentPreset.match(/^(\d+)\.(.+)$/)
    let targetPreset = null
    
    if (match) {
      const [, number, name] = match
      // 在 presetList 中查找匹配的项
      targetPreset = presetList.value.find(p => {
        const pMatch = p.name.match(/^(\d+)\.(.+)$/)
        return pMatch && pMatch[1] === number
      })
    }
    
    if (targetPreset) {
      presetDialog.value.form.id = targetPreset.id
      presetDialog.value.form.name = targetPreset.name
    } else if (presetList.value.length > 0) {
      presetDialog.value.form.id = presetList.value[0].id
      presetDialog.value.form.name = presetList.value[0].name
    }
  } else if (presetList.value.length > 0) {
    presetDialog.value.form.id = presetList.value[0].id
    presetDialog.value.form.name = presetList.value[0].name
  }
  
  // Start Video
  nextTick(() => {
      try {
        const visibleStream = getPresetVisibleStream()
        if (visibleStream && visibleStream.url) {
          console.log('Starting video stream:', visibleStream.url)
          startWebRTCPlayback(visibleStream.url)
        } else {
          console.warn('No suitable video stream found')
        }
      } catch (e) {
          console.error('Failed to load video streams', e)
      }
  })
}

const closePresetDialog = () => {
  presetDialog.value.visible = false
  stopWebRTCPlayback()
}

const confirmPresetChoice = () => {
  addTaskDialog.value.form.preset = presetDialog.value.form.name
  closePresetDialog()
}

// PTZ Control Placeholders
const ptzMove = (direction: string) => {
  console.log('PTZ Move:', direction)
  // Call API
}
const ptzStop = () => {
    console.log('PTZ Stop') // Usually needed for mouseup
}

const ptzZoom = (zoomIn: boolean) => {
    console.log('Zoom:', zoomIn ? 'In' : 'Out')
}
const ptzFocus = (focusIn: boolean) => {
    console.log('Focus:', focusIn ? 'In' : 'Out')
}

const handleSetPreset = () => { console.log('Set Preset') }
const handleGotoPreset = () => { console.log('Goto Preset') }
// const handleSpeed = () => { console.log('Set Speed') }

// ========== 额外配置相关 ==========
interface ExtraConfigFieldDef {
  type?: string
  title: string
  field: string
  required?: boolean
  default?: string | number | boolean | null
}

const extraConfigDialog = ref({
  visible: false,
  rawExtra: '',
  formValues: {} as Record<string, string>,
  errors: {} as Record<string, string>
})

const parseTaskTypeFieldname = (raw: unknown): ExtraConfigFieldDef[] => {
  if (!raw) return []
  const text = String(raw).trim()
  if (!text || text === '[]') return []
  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(item => ({
        type: String(item?.type ?? ''),
        title: String(item?.title ?? item?.field ?? ''),
        field: String(item?.field ?? ''),
        required: Boolean(item?.required),
        default: item?.default
      }))
      .filter(item => !!item.field && !!item.title)
  } catch (_) {
    return []
  }
}

const currentActionTypeMeta = computed(() => {
  const actionType = String(addTaskDialog.value.form.actionType || addTaskDialog.value.form.typeInput || '').trim()
  return findTaskTypeMeta(actionType)
})

const activeExtraConfigFields = computed<ExtraConfigFieldDef[]>(() => {
  return parseTaskTypeFieldname(currentActionTypeMeta.value?.fieldname)
})

const isChargeTargetTaskType = computed(() => {
  const candidates = [
    addTaskDialog.value.form.actionType,
    currentActionTypeMeta.value?.cn_name,
    currentActionTypeMeta.value?.type_text,
    currentActionTypeMeta.value?.type,
    currentActionTypeMeta.value?.en_name
  ]
    .map(item => String(item ?? '').trim())
    .filter(Boolean)

  return candidates.some(name => name === '回充' || name === '充电结束任务')
})

const isTargetBatteryField = (field: ExtraConfigFieldDef) => {
  const title = String(field.title || '').trim()
  const fieldName = String(field.field || '').trim()
  return title.includes('目标电量')
    || /target.*(battery|power)|battery|target_power|power_target/i.test(fieldName)
}

const parseExtraConfigPayload = (rawValue: string): Record<string, string> => {
  if (!rawValue) return {}

  try {
    const parsed = JSON.parse(rawValue)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const result: Record<string, string> = {}
      Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
        result[key] = value == null ? '' : String(value)
      })
      return result
    }
  } catch (_) {}

  return {}
}

const extraConfigDisplayValue = computed(() => {
  const fields = activeExtraConfigFields.value
  const raw = addTaskDialog.value.form.extraConfig || ''
  if (!raw) return ''
  if (fields.length === 0) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'extra' in parsed) {
        return String((parsed as Record<string, unknown>).extra ?? '')
      }
    } catch (_) {}
    return raw
  }

  const payload = parseExtraConfigPayload(raw)
  return fields
    .map(field => {
      const value = payload[field.field]
      const resolved = value !== undefined && value !== '' ? value : (field.default ?? '')
      return `${field.title}: ${resolved}`
    })
    .join('，')
})

const openExtraConfigDialog = () => {
  const fields = activeExtraConfigFields.value
  if (fields.length === 0) {
    const raw = addTaskDialog.value.form.extraConfig || ''
    let rawExtra = ''
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'extra' in parsed) {
          rawExtra = String((parsed as Record<string, unknown>).extra ?? '')
        } else {
          rawExtra = raw
        }
      } catch (_) {
        rawExtra = raw
      }
    }
    extraConfigDialog.value.rawExtra = rawExtra
    extraConfigDialog.value.formValues = {}
    extraConfigDialog.value.errors = {}
    extraConfigDialog.value.visible = true
    return
  }

  const existingPayload = parseExtraConfigPayload(addTaskDialog.value.form.extraConfig || '')
  const nextFormValues: Record<string, string> = {}
  const nextErrors: Record<string, string> = {}

  fields.forEach(field => {
    const existingValue = existingPayload[field.field]
    if (existingValue !== undefined) {
      nextFormValues[field.field] = existingValue
    } else if (field.default !== undefined && field.default !== null) {
      nextFormValues[field.field] = String(field.default)
    } else {
      nextFormValues[field.field] = ''
    }
    nextErrors[field.field] = ''
  })

  extraConfigDialog.value.formValues = nextFormValues
  extraConfigDialog.value.errors = nextErrors
  extraConfigDialog.value.visible = true
}

const closeExtraConfigDialog = () => {
  extraConfigDialog.value.visible = false
}

const confirmExtraConfig = () => {
  const fields = activeExtraConfigFields.value
  if (fields.length === 0) {
    addTaskDialog.value.form.extraConfig = JSON.stringify({
      extra: String(extraConfigDialog.value.rawExtra ?? '')
    })
    closeExtraConfigDialog()
    return
  }

  const payload: Record<string, string> = {}
  const nextErrors: Record<string, string> = {}

  for (const field of fields) {
    const rawValue = extraConfigDialog.value.formValues[field.field]
    const inputValue = String(rawValue ?? '').trim()
    const hasDefault = field.default !== undefined && field.default !== null
    const finalValue = inputValue || (hasDefault ? String(field.default) : '')

    if (field.required && !finalValue) {
      nextErrors[field.field] = `${field.title}不能为空`
      continue
    }

    if (isChargeTargetTaskType.value && isTargetBatteryField(field)) {
      const numericValue = Number(finalValue)
      if (!finalValue || !Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100) {
        nextErrors[field.field] = `${field.title}只能输入0~100的数值`
        continue
      }
    }

    nextErrors[field.field] = ''
    payload[field.field] = finalValue
  }

  extraConfigDialog.value.errors = nextErrors
  if (Object.values(nextErrors).some(Boolean)) return

  addTaskDialog.value.form.extraConfig = JSON.stringify(payload)
  closeExtraConfigDialog()
}
// ========== 额外配置相关结束 ==========

</script>

<style>
@import './mission-common.css';

.extra-config-input {
  height: 34px;
  line-height: 34px;
}

.extra-config-display-row {
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.extra-config-display-text {
  color: #fff;
  font-size: 13px;
  line-height: 34px;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.extra-config-display-btn {
  flex-shrink: 0;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: btn-spin 0.8s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 下发任务弹窗样式 */
.dispatch-task-modal {
  display: flex;
  background: #172233;
  border-radius: 12px;
  box-shadow: 0 4px 24px #0008;
  overflow: hidden;
  width: 90%;
  max-width: 500px;
  margin: 2vh auto;
  position: relative;
  border: 1px solid #18344a;
  max-height: 85vh;
}

.dispatch-task-modal-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  background: #172233;
  overflow-y: auto;
}

.dispatch-task-title {
  font-size: 24px;
  font-weight: 600;
  color: #67d5fd;
  margin-bottom: 20px;
  text-align: center;
}

.dispatch-task-form {
  margin-bottom: 16px;
}

.dispatch-task-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.track-process-row {
  align-items: flex-start;
}

.track-process-panel {
  flex: 1;
  min-height: 88px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(10, 26, 40, 0.92);
  border: 1px solid rgba(103, 213, 253, 0.18);
  box-shadow: inset 0 0 0 1px rgba(103, 213, 253, 0.04);
}

.track-process-panel.running {
  border-color: rgba(103, 213, 253, 0.35);
}

.track-process-panel.success {
  border-color: rgba(53, 208, 127, 0.45);
}

.track-process-panel.error {
  border-color: rgba(255, 107, 107, 0.45);
}

.track-process-current {
  color: #d7f5ff;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}

.track-process-log {
  margin-top: 8px;
  max-height: 136px;
  overflow-y: auto;
  padding-right: 4px;
}

.track-process-log-item {
  color: rgba(215, 245, 255, 0.82);
  font-size: 12px;
  line-height: 1.5;
}

.track-init-mask {
  z-index: 10002;
}

.track-init-modal {
  min-width: 260px;
  max-width: 360px;
  padding: 24px 28px;
  border-radius: 10px;
  background: #172233;
  border: 1px solid #18344a;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.track-init-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(103, 213, 253, 0.3);
  border-top-color: #67d5fd;
  border-radius: 50%;
  animation: btn-spin 0.8s linear infinite;
}

.track-init-text {
  color: #d7f5ff;
  font-size: 16px;
  font-weight: 500;
}

.dispatch-task-row label {
  font-size: 14px;
  color: #b8c7d9;
  min-width: 100px;
  text-align: right;
}

.dispatch-task-input {
  flex: 1;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
}

.dispatch-task-input:focus {
  outline: none;
  border: 1.5px solid #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.dispatch-task-input:disabled {
  background: rgba(103, 213, 253, 0.1);
  color: #67d5fd;
  border-color: rgba(103, 213, 253, 0.3);
}

/* 启动循迹任务弹窗下拉框样式与多任务组弹窗保持一致 */
.track-start-modal .dispatch-task-row {
  display: grid !important;
  grid-template-columns: 88px 320px !important;
  column-gap: 12px !important;
  align-items: center !important;
  justify-content: center !important;
}

.track-start-modal .dispatch-task-row label {
  min-width: 0 !important;
  margin: 0 !important;
  text-align: right !important;
}

.track-start-modal .custom-select-wrapper {
  flex: none !important;
  min-width: 0 !important;
  width: 100% !important;
  display: block !important;
  max-width: none !important;
}

.track-start-modal .dispatch-task-input {
  width: 100% !important;
  max-width: none !important;
}

.track-start-modal .mission-select {
  width: 100% !important;
  display: block !important;
  max-width: none !important;
  height: 36px !important;
  border-radius: 6px !important;
  border: 1px solid rgba(38, 131, 182, 0.4) !important;
  background: #0c3c56 !important;
  color: #fff !important;
  box-shadow: none !important;
  transition: all 0.2s !important;
  padding: 0 34px 0 12px !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3e%3cpath fill='%2367d5fd' d='M6 8L0 0h12z'/%3e%3c/svg%3e") !important;
  background-repeat: no-repeat !important;
  background-position: right 12px center !important;
  background-size: 12px 8px !important;
}

.track-start-modal {
  max-width: 460px !important;
  width: 88% !important;
}

.track-start-modal .dispatch-task-modal-content {
  padding: 22px 26px !important;
}

.track-start-modal .mission-select:hover {
  border-color: #67d5fd !important;
}

.track-start-modal .mission-select:focus {
  outline: none !important;
  border-color: #67d5fd !important;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.1) !important;
}

.track-start-modal .mission-select:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.track-start-modal .mission-select option {
  background: #0c3c56 !important;
  color: #fff !important;
}

.track-start-modal .custom-select-wrapper::after {
  display: none !important;
}

.track-start-modal .custom-select-arrow {
  right: 12px;
  z-index: 2;
}

.custom-select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.mission-select {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 30px;
  cursor: pointer;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
  /* Firefox特定样式 */
  text-indent: 0.01px;
  text-overflow: '';
  /* 完全隐藏默认箭头 */
  background-image: none;
  -webkit-background-image: none;
  -moz-background-image: none;
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
  z-index: 1;
}

.custom-select-arrow svg {
  width: 100%;
  height: 100%;
}

.unit-label {
  margin-left: 8px;
  color: #b8c7d9;
  font-size: 14px;
}

.dispatch-task-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.dispatch-task-actions .mission-btn {
  min-width: 100px;
  height: 36px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.dispatch-task-actions .mission-btn-cancel {
  background: rgba(103, 213, 253, 0.1);
  color: #b8c7d9;
  border: 1px solid rgba(103, 213, 253, 0.2);
}

.dispatch-task-actions .mission-btn-cancel:hover {
  background: rgba(103, 213, 253, 0.2);
  color: #67d5fd;
}

.dispatch-task-actions .mission-btn-pause {
  background: #67d5fd;
  color: #fff;
}

.dispatch-task-actions .mission-btn-pause:hover {
  background: #50c7f7;
  box-shadow: 0 2px 8px rgba(103, 213, 253, 0.3);
}

/* 侧边栏底部 */
.sidebar-menu-bottom {
  margin-top: auto;
  padding-bottom: 20px;
}

.sidebar-menu-bottom img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  cursor: pointer;
}

/* 上传弹窗表单样式 */
.upload-form-row {
  margin-bottom: 16px;
}

.upload-form-label {
  display: block;
  color: #b8c7d9;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-form-input {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  box-shadow: 0 0 0 1px #164159 inset;
}

.upload-form-input:focus {
  outline: none;
  border: 1.5px solid #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.upload-form-input::placeholder {
  color: #6b7a8c;
}

.upload-form-display {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #164159;
  background: rgba(22, 65, 89, 0.3);
  color: #b8c7d9;
  padding: 0 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  box-shadow: 0 0 0 1px #164159 inset;
}

.sidebar-menu-bottom img:hover {
  filter: brightness(0) invert(1) drop-shadow(0 0 8px #67d5fd);
}

/* 新增算法开关样式 */
.dispatch-switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 200px;
}

.dispatch-switch-label {
  color: #b8c7d9;
  font-size: 14px;
  font-weight: 500;
}

/* 新增算法选择样式 */
.dispatch-algorithm-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 100px;
  overflow-y: auto;
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 1px solid rgba(103, 213, 253, 0.2);
  flex: 1;
  min-width: 200px;
}

.dispatch-algorithm-options::-webkit-scrollbar {
  width: 6px;
}

.dispatch-algorithm-options::-webkit-scrollbar-track {
  background: rgba(103, 213, 253, 0.1);
  border-radius: 3px;
}

.dispatch-algorithm-options::-webkit-scrollbar-thumb {
  background: rgba(103, 213, 253, 0.3);
  border-radius: 3px;
  transition: background 0.2s;
}

.dispatch-algorithm-options::-webkit-scrollbar-thumb:hover {
  background: rgba(103, 213, 253, 0.5);
}

.dispatch-algorithm-options {
  scrollbar-width: thin;
  scrollbar-color: rgba(103, 213, 253, 0.3) rgba(103, 213, 253, 0.1);
}

.dispatch-algorithm-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 2px 0;
  transition: all 0.2s;
}

.dispatch-algorithm-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #67D5FD;
  cursor: pointer;
}

.dispatch-algorithm-label {
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.dispatch-algorithm-label.disabled {
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

.dispatch-algorithm-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Switch开关样式 */
.switch-container {
  width: 40px;
  height: 20px;
  background: #B0B0B0;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  border: 1px solid #888;
  transition: background 0.3s, border 0.3s;
}

.switch-container.active {
  background: #16bbf2;
  border: 1px solid #16bbf2;
}

.switch-toggle {
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: left 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.switch-container.active .switch-toggle {
  left: 21px;
}

/* 文件上传相关样式 */
.upload-file-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.upload-file-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 6px;
  color: #67d5fd;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.upload-file-btn:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: rgba(103, 213, 253, 0.5);
}

.upload-file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-file-tip {
  font-size: 12px;
  color: #6b7a8c;
  margin-top: 4px;
}

.upload-file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 6px;
  color: #67d5fd;
  font-size: 14px;
}

.upload-file-icon {
  flex-shrink: 0;
}

/* 上传弹窗专用样式 */
.upload-task-modal {
  width: 80%;
  max-width: 400px;
}

.upload-task-modal .dispatch-task-row {
  align-items: flex-start;
}

.upload-task-modal .dispatch-task-row label {
  min-width: 80px;
  margin-top: 8px;
}

.upload-task-modal .upload-file-wrapper {
  flex: 1;
  min-width: 0;
}

.upload-task-modal .upload-file-btn {
  width: 100%;
  justify-content: center;
}

/* 时间提示样式 */
.time-tip {
  font-size: 12px;
  color: #ffa500;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 4px;
  line-height: 1.4;
}

/* 周期任务开关样式 */
.dispatch-switch-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.dispatch-switch-label {
  font-size: 14px;
  color: #b8c7d9;
  user-select: none;
}

/* Add Task Modal Styles */
.custom-dialog-mask { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; justify-content: center; align-items: center; }
.simple-modal-card { width: 440px; margin: auto; background: #102a43; border: 1px solid #244f78; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); display: flex; flex-direction: column; max-height: 85vh; overflow: hidden; }
.add-task-modal-card { width: 760px; max-width: calc(100vw - 40px); max-height: none; }
.simple-modal-header { height: 48px; background: #163654; border-bottom: 1px solid #244f78; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; color: #fff; font-size: 16px; font-weight: 500; flex-shrink: 0; }
.simple-close-icon { cursor: pointer; font-size: 20px; color: #909399; }
.simple-close-icon:hover { color: #fff; }
.simple-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
.add-task-modal-body { padding: 18px 24px 14px; overflow-y: visible; }
.add-task-modal-body .simple-form-item { margin-bottom: 12px; }
.simple-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.simple-modal-body::-webkit-scrollbar { width: 6px; }
.simple-modal-body::-webkit-scrollbar-track { background: transparent; }
.simple-modal-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
.simple-modal-body::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }
.simple-form-item { margin-bottom: 18px; }
.simple-label { display: block; margin-bottom: 8px; font-size: 13px; color: #b0d0ff; }
.required-star { color: #ff4d4f; margin-right: 4px; }
.simple-flex-row { display: flex; align-items: center; gap: 10px; }
.simple-radio { margin-right: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #fff; }
.simple-input, .simple-select { width: 100%; height: 34px; background: rgba(30, 60, 90, 0.5); border: 1px solid #244f78; border-radius: 2px; padding: 0 10px; color: #fff; outline: none; font-size: 13px; box-sizing: border-box; }
.simple-input:focus, .simple-select:focus { border-color: #409eff; background: rgba(30, 60, 90, 0.8); }
.input-error-border { border-color: #ff6b6b !important; box-shadow: 0 0 0 1px rgba(255, 107, 107, 0.28); }
.input-error-text { margin-top: 6px; color: #ff8a8a; font-size: 12px; line-height: 1.4; }
.stop-switch-item .simple-label { margin-bottom: 2px; }
.stop-switch-row { height: 34px; justify-content: flex-start; align-items: center; }
.simple-switch { width: 36px; height: 18px; background: #4c4d4f; border-radius: 10px; position: relative; cursor: pointer; transition: 0.3s; }
.simple-switch.active { background: #409eff; }
.simple-switch-dot { width: 14px; height: 14px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.3s; }
.simple-switch.active .simple-switch-dot { left: 20px; }
.simple-modal-footer { padding: 16px 20px; border-top: 1px solid #244f78; display: flex; justify-content: center; gap: 20px; background: #102a43; flex-shrink: 0; }
.custom-select-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #102a43; border: 1px solid #244f78; border-radius: 4px; max-height: 340px; overflow-y: auto; z-index: 10100; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
.custom-select-option { padding: 8px 12px; cursor: pointer; color: #fff; font-size: 13px; transition: background 0.2s; }
.custom-select-option:hover { background: #1e4b7a; }
.custom-select-option.selected { background: #1e4b7a; color: #409eff; font-weight: 500; }
.custom-select-dropdown::-webkit-scrollbar { width: 6px; background: transparent; }
.custom-select-dropdown::-webkit-scrollbar-track { background: transparent; }
.custom-select-dropdown::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
.custom-select-dropdown::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }

@media (max-width: 900px) {
  .add-task-modal-card { width: calc(100vw - 20px); max-height: 90vh; }
  .add-task-modal-body { overflow-y: auto; }
  .simple-form-grid { grid-template-columns: 1fr; gap: 0; }
}

/* PTZ Buttons */
.ptz-btn { width: 50px; height: 50px; background: #0099ff; border: none; color: #fff; cursor: pointer; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-size: 24px; transition: 0.2s; }
.ptz-btn:hover { background: #0077cc; }
.ptz-btn:active { background: #0055aa; }
.mission-btn-blue { background: #0099ff; color: #fff; border: none; height: 40px; border-radius: 4px; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.2s; }
.mission-btn-blue:hover { background: #0077cc; }

.video-only-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, #0e2b40 0%, #0b2235 100%);
  display: flex;
}

.video-only-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-hidden {
  display: none !important;
}

.video-empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(220, 236, 255, 0.7);
  font-size: 14px;
  pointer-events: none;
}

.video-action-group {
  position: absolute;
  right: 10px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 12;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.video-only-wrapper:hover .video-action-group {
  opacity: 1;
  pointer-events: auto;
}

.video-action-btn {
  height: 24px;
  min-width: 24px;
  padding: 0;
  border-radius: 4px;
  border: 1px solid rgba(129, 211, 242, 0.32);
  background: rgba(9, 34, 54, 0.62);
  color: #d7f1ff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-action-btn:hover {
  border-color: rgba(142, 227, 255, 0.56);
  background: rgba(14, 46, 70, 0.82);
}

.video-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.video-action-btn.icon-only svg {
  width: 13px;
  height: 13px;
}

.stream-mode-btn {
  min-width: 24px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 600;
}

.video-only-element::-webkit-media-controls-mute-button,
.video-only-element::-webkit-media-controls-volume-control-container,
.video-only-element::-webkit-media-controls-volume-slider,
.video-only-element::-webkit-media-controls-overflow-button,
.video-only-element::-webkit-media-controls-toggle-closed-captions-button,
.video-only-element::-webkit-media-controls-fullscreen-button {
  display: none !important;
  -webkit-appearance: none;
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

.action-btn-arrive {
  color: #67d5fd;
}

.action-btn-arrive img {
  filter: drop-shadow(0 0 4px rgba(103, 213, 253, 0.4));
}


/* ---- 任务列表单元格样式 ---- */
/* 行 hover 效果 */
.file-table-row:hover {
  background: rgba(103, 213, 253, 0.05);
}

.file-table-row.task-last-row-active {
  background: rgba(103, 213, 253, 0.14);
  box-shadow: inset 0 0 0 1px rgba(103, 213, 253, 0.85);
}

.file-table-row.task-last-row-active .ms-seq-num {
  border-color: rgba(103, 213, 253, 0.8);
  background: rgba(103, 213, 253, 0.22);
}
/* 序号圆圈 */
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
/* 任务类型标签 */
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
  line-height: 1.6;
}
/* 坐标/角度值 */
.ms-coord-val {
  font-family: 'Consolas', 'Courier New', monospace;
  color: #8cd6a8;
  font-size: 12px;
  letter-spacing: 0.3px;
}
/* 预置点标签 */
.ms-preset-tag {
  display: inline-block;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #9ec3f0;
  font-size: 12px;
  background: rgba(100, 160, 240, 0.08);
  border: 1px solid rgba(100, 160, 240, 0.2);
  border-radius: 3px;
  padding: 2px 8px;
}
/* 描述文字 */
.ms-desc-text {
  color: #b8c7d9;
  font-size: 12px;
}
/* 空值占位 */
.ms-empty {
  color: rgba(255, 255, 255, 0.2);
}

/* 添加任务组弹窗样式 */
.task-form-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.task-form-row:last-child {
  margin-bottom: 0;
}

.task-form-label {
  min-width: 100px;
  color: #b8c7d9;
  font-size: 14px;
  text-align: right;
  margin-right: 16px;
  white-space: nowrap;
}

.task-form-select,
.task-form-input {
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

.task-form-select:focus,
.task-form-input:focus {
  outline: none;
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.1);
}

.task-form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-form-select option {
  background: #0c3c56;
  color: #fff;
}

.simple-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #244f78;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-shrink: 0;
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
  overflow-y: auto;
  flex: 1;
}

/* 添加任务组弹窗样式 */
.task-group-modal {
  width: 420px !important;
}

.task-group-modal .simple-modal-body {
  padding: 35px 40px;
}

.task-group-modal .task-group-input {
  width: 280px;
  height: 40px;
  font-size: 15px;
  text-align: center;
}

/* textarea样式 */
.simple-textarea {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

.simple-textarea:focus {
  outline: none;
  border-color: #67d5fd;
  background: rgba(255, 255, 255, 0.08);
}

.simple-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.mission-toolbar-select:disabled {
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%) !important;
  border-color: rgba(103, 213, 253, 0.3) !important;
  color: rgba(180, 205, 220, 0.62) !important;
  cursor: not-allowed !important;
  box-shadow:
    inset 0 0 0 1px rgba(103, 213, 253, 0.08) !important;
  filter: saturate(0.72) grayscale(0.22);
  opacity: 1;
}

.preview-dialog-mask {
  z-index: 10020;
}

.preview-modal {
  width: min(1200px, 92vw);
  height: min(760px, 86vh);
  background: #102a43;
  border: 1px solid #244f78;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}

.preview-modal-header {
  height: 52px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #244f78;
  background: #163654;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.preview-modal-body {
  flex: 1;
  padding: 14px;
  min-height: 0;
}

.preview-map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 440px;
  border: 1px solid #214c72;
  border-radius: 8px;
  overflow: hidden;
  background: #020915;
}

.pointcloud-canvas {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
  cursor: grab;
  touch-action: none;
}

.pointcloud-canvas:active {
  cursor: grabbing;
}

.pcd-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.pcd-overlay.loading {
  color: #67d5fd;
  background: rgba(2, 9, 21, 0.45);
}

.pcd-overlay.error {
  color: #ff8f8f;
  background: rgba(50, 10, 10, 0.45);
}
</style>
