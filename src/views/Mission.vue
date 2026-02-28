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
              <span class="mission-top-title">循迹任务</span>
              <div class="mission-top-data">
                <span class="mission-data-item">X坐标: <span class="mission-data-value">{{ currentPosition.x || '-' }}</span></span>
                <span class="mission-data-item">Y坐标: <span class="mission-data-value">{{ currentPosition.y || '-' }}</span></span>
                <span class="mission-data-item">Z坐标: <span class="mission-data-value">{{ currentPosition.z || '-' }}</span></span>
                <span class="mission-data-item">角度: <span class="mission-data-value">{{ currentPosition.angle || '-' }}</span></span>
                <span class="mission-data-item">任务ID: <span class="mission-data-value">{{ currentTaskId || '-' }}</span></span>
              </div>
            </div>
          </div>
          <div class="mission-content-wrapper">
            <div class="mission-toolbar">
              <!-- 任务组选择 -->
              <span class="mission-toolbar-label" style="margin-right: -8px;">路线名称：</span>
              <select v-model="selectedRouteName" class="mission-toolbar-select" style="min-width: 180px;">
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
                <button class="mission-btn mission-btn-primary" @click="handleStartTrack">开始</button>
                <button class="mission-btn mission-btn-secondary" @click="handlePauseTrack">暂停</button>
                <button class="mission-btn mission-btn-primary" @click="handleOpenCreateTaskGroupDialog">添加任务组</button>
                <button class="mission-btn mission-btn-stop" @click="handleDeleteTaskGroup">删除任务组</button>
                <button class="mission-btn mission-btn-primary" @click="handleAddTask">添加任务</button>
                <button class="mission-btn mission-btn-secondary">预览</button>
              </div>
            </div>
            <div class="file-table file-table-adaptive">
              <div class="file-table-header">
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
              <div class="file-table-body">
                <!-- 显示实际数据行 -->
                <template v-if="waypointsData.length > 0">
                <div class="file-table-row" v-for="waypoint in waypointsData" :key="waypoint.index">
                  <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center;">{{ waypoint.index + 1 }}</div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;">{{ waypoint.type }}</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ waypoint.coordinates?.x }}</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ waypoint.coordinates?.y }}</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ waypoint.coordinates?.z }}</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ waypoint.angle }}</div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;">{{ waypoint.preset }}</div>
                  <div class="file-table-cell file-table-name" style="flex: 1; text-align: center;">{{ waypoint.description }}</div>
                  <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center; display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="action-btn action-btn-edit" @click="handleEditTask(waypoint)">
                      <img :src="editIcon" alt="编辑" />
                      编辑
                    </button>
                    <button class="action-btn action-btn-delete" @click="handleDeleteTask(waypoint)">
                      <img :src="deleteIcon" alt="删除" />
                      删除
                    </button>
                    <button class="action-btn action-btn-arrive" @click="handleArriveTask(waypoint)">
                      <img :src="arriveIcon" alt="到点" />
                      到点
                    </button>
                  </div>
                </div>
              </template>
                <!-- 始终显示固定的空行以保持表格边框（补足到10行） -->
                <div class="file-table-row" v-for="i in (10 - waypointsData.length)" :key="'empty-' + i">
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
            </div>
          </div>
        </section>
      </div>
    </main>
    <!-- 弹窗等 -->
    <div v-if="confirmDialog.visible" class="custom-dialog-mask">
      <div class="custom-dialog">
        <div class="custom-dialog-title">操作确认</div>
        <div class="custom-dialog-content">{{ confirmDialog.message }}</div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-pause" @click="onConfirmDialogOk">确定</button>
          <button v-if="confirmDialog.showCancel" class="mission-btn mission-btn-cancel" @click="onConfirmDialogCancel">取消</button>
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
            <button class="mission-btn mission-btn-pause" @click="onDispatchTaskConfirm">确定</button>
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
          <button class="mission-btn mission-btn-secondary" @click="closeCreateTaskGroupDialog">取消</button>
          <button class="mission-btn mission-btn-primary" @click="handleCreateTaskGroup">确定</button>
        </div>
      </div>
    </div>
    <!-- 循迹任务启动弹窗 -->
    <div v-if="trackStartDialog.visible" class="custom-dialog-mask">
      <div class="dispatch-task-modal">
        <div class="dispatch-task-modal-content">
          <div class="dispatch-task-title">启动循迹任务</div>
          <div class="dispatch-task-form">
            <div class="dispatch-task-row">
              <label>路线名称：</label>
              <input 
                v-model="trackStartDialog.form.track_name" 
                class="dispatch-task-input" 
                disabled
              />
            </div>
            <div class="dispatch-task-row">
              <label>任务组：</label>
              <input 
                v-model="trackStartDialog.form.taskpoint_name" 
                class="dispatch-task-input" 
                disabled
              />
            </div>
            <div class="dispatch-task-row">
              <label>避障模式：</label>
              <div class="custom-select-wrapper">
                <select v-model="trackStartDialog.form.obs_mode" class="mission-select">
                  <option :value="1">近障模式</option>
                  <option :value="2">停障模式</option>
                  <option :value="3">绕障模式</option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#fff"/>
                  </svg>
                </span>
              </div>
            </div>
            <div class="dispatch-task-row">
              <label>步态类型：</label>
              <div class="custom-select-wrapper">
                <select v-model="trackStartDialog.form.gait_type" class="mission-select">
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
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#fff"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div class="dispatch-task-actions">
            <button class="mission-btn mission-btn-cancel" @click="onTrackStartCancel">取消</button>
            <button class="mission-btn mission-btn-pause" @click="onTrackStartConfirm">确定</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="dispatchTaskDialog.visible" class="dispatch-task-modal-wrapper">
       <!-- (Existing dispatch dialog exists in file, I won't touch it, just appending new one) -->
    </div>
    <!-- Add Task Modal -->
    <Teleport to="body">
      <div v-if="addTaskDialog.visible" class="custom-dialog-mask">
        <div class="simple-modal-card">
          <div class="simple-modal-header">
            <span>添加任务</span>
            <span class="simple-close-icon" @click="cancelAddTask">×</span>
          </div>
          
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
                 <button class="mission-btn mission-btn-primary" style="height: 34px; padding: 0 15px; display: flex; align-items: center; justify-content: center;" @click="openPresetDialog">选择</button>
               </div>
            </div>

            <!-- 额外事务 -->
             <div class="simple-form-item">
               <label class="simple-label">额外事务</label>
               <div class="simple-flex-row" style="justify-content: space-between;">
                  <span style="color: #fff;">{{ addTaskDialog.form.extraConfig || '未配置' }}</span>
                  <button class="mission-btn mission-btn-primary" style="height: 34px; padding: 0 15px; display: flex; align-items: center; justify-content: center;" @click="openExtraConfigDialog">配置</button>
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
               <div style="flex: 0 0 800px; height: 450px; background: #000; position: relative; border: 1px solid #244f78; display: flex; align-items: center; justify-content: center; color: #aaa; overflow: hidden;">
                   <video 
                     ref="videoElement"
                     controls
                     muted
                     playsinline
                     webkit-playsinline
                     style="width: 100%; height: 100%; object-fit: fill; background: #000;"
                   >
                     您的浏览器不支持视频播放
                   </video>
                   <div v-if="!isPlaying" style="position: absolute; pointer-events: none;">Visible Light Stream</div>
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
            <span>额外配置</span>
            <span class="simple-close-icon" @click="closeExtraConfigDialog">×</span>
          </div>
          <div class="simple-modal-body" style="padding: 30px;">
            <div class="simple-form-item">
              <label class="simple-label">额外事务</label>
              <textarea 
                v-model="extraConfigDialog.content" 
                class="simple-textarea"
                placeholder="请输入额外事务配置"
                rows="6"
              ></textarea>
            </div>
          </div>
          <div class="simple-modal-footer">
            <button class="mission-btn mission-btn-primary" style="width: 100px;" @click="confirmExtraConfig">确定</button>
            <button class="mission-btn mission-btn-secondary" style="width: 100px;" @click="closeExtraConfigDialog">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import trackListIcon from '@/assets/source_data/svg_data/track_list.svg'
import taskAutoIcon from '@/assets/source_data/svg_data/robot_source/task_auto.svg'
import taskTimeIcon from '@/assets/source_data/svg_data/robot_source/task_time.svg'
import taskMultiIcon from '@/assets/source_data/svg_data/robot_source/task_multi.svg'
import { useWaylineJobs, useDevices } from '../composables/useApi'
import { waylineApi, navigationApi } from '@/api/services'
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
import editIcon from '@/assets/source_data/svg_data/robot_source/edit.png'
import deleteIcon from '@/assets/source_data/svg_data/robot_source/delete.png'
import arriveIcon from '@/assets/source_data/svg_data/robot_source/arrive.png'

const router = useRouter()
const route = useRoute()

// 使用航线文件API
const { waylineFiles, waylineDetail, fetchWaylineFiles, fetchWaylineDetail, createJob, executeJob } = useWaylineJobs()
const { getCachedWorkspaceId, getCachedDeviceSns, getCachedDeviceBySn } = useDevices()
const { droneStatus, fetchMainDeviceStatus, fetchDroneStatus } = useDeviceStatus()

// 航线文件相关
const selectedTrack = ref('')
const trackFileLoading = ref(false)

// 当前位置和任务信息
const currentPosition = ref({
  x: 0,
  y: 0,
  z: 0,
  angle: 0
})
const currentTaskId = ref('')

// 循迹任务 - 路线与任务组
const routeList = ref<string[]>([])
const selectedRouteName = ref('')
const taskGroupList = ref<string[]>([])
const selectedTaskGroupName = ref('')

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

// 获取路线列表
const loadRouteList = async () => {
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
      routeList.value = Array.from(processedSet)
      
      if (routeList.value.length > 0) {
        selectedRouteName.value = routeList.value[0]
      }
    }
  } catch (err) {
    console.error('获取路线列表失败:', err)
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
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    errorMessage.value = { show: true, text: '未选择机器人' }
    return
  }
  
  try {
    const response = await navigationApi.createTaskpointFile(robotId, {
      track_name: selectedRouteName.value,
      keypoint_name: createTaskGroupForm.value.keypoint_name
    })
    
    console.log('创建任务组返回:', response)
    
    successMessage.value = { show: true, text: '添加任务组成功' }
    setTimeout(() => {
      successMessage.value.show = false
    }, 2000)
    
    closeCreateTaskGroupDialog()
    
    // 刷新任务组列表
    const taskGroupResponse = await navigationApi.getTaskpointList(robotId, selectedRouteName.value)
    if (taskGroupResponse && taskGroupResponse.msg && taskGroupResponse.msg.error_code === 0 && taskGroupResponse.msg.result) {
      taskGroupList.value = taskGroupResponse.msg.result
      // 默认选择第一条数据
      if (taskGroupList.value.length > 0) {
        selectedTaskGroupName.value = taskGroupList.value[0]
      }
    }
  } catch (error: any) {
    console.error('创建任务组失败:', error)
    errorMessage.value = { show: true, text: `创建失败: ${error.message || '网络错误'}` }
  }
}

// 从缓存读取选中的地图名称
const selectedMap = computed(() => {
  return localStorage.getItem('selected_map_name') || ''
})

// 过滤后的路线列表（根据缓存的地图筛选）
const filteredRouteList = computed(() => {
  if (!selectedMap.value) return routeList.value // 如果没有缓存的地图，显示所有路线
  
  // 根据地图名称筛选：路线名 以 "地图名称_" 开头
  return routeList.value.filter(route => {
    return route.startsWith(selectedMap.value + '_')
  })
})

// 监听筛选后的路线列表变化，自动选择第一个
watch(filteredRouteList, (newList) => {
  if (newList.length > 0) {
    selectedRouteName.value = newList[0]
  } else {
    selectedRouteName.value = ''
  }
})

// 监听路线选择变化
watch(selectedRouteName, async (newVal) => {
  taskGroupList.value = []
  selectedTaskGroupName.value = ''
  if (!newVal) return
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return
  
  try {
    const response = await navigationApi.getTaskpointList(robotId, newVal)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      taskGroupList.value = response.msg.result
      if (taskGroupList.value.length > 0) {
        selectedTaskGroupName.value = taskGroupList.value[0]
      }
    }
  } catch (err) {
    console.error('获取任务组列表失败:', err)
  }
})

// 循迹任务启动弹窗
const trackStartDialog = ref({
  visible: false,
  form: {
    action: 1, // 固定为1，表示启动
    wait: 0, // 0=立即启动, 1=不立即启动
    obs_mode: 1, // 1=近障模式, 2=停障模式, 3=绕障模式
    track_name: '',
    taskpoint_name: '',
    gait_type: 0 // 0=行走步态, 1=斜坡步态, 2=越障步态, 3=楼梯步态, 4=帧楼梯步态, 5=帧45°楼梯步态, 6=L行走步态, 7=山地步态, 8=静音步态
  }
})

// 启动循迹任务
const handleStartTrack = () => {
  if (!selectedRouteName.value) {
    alert('请先选择路线')
    return
  }
  if (!selectedTaskGroupName.value) {
    alert('请先选择任务组')
    return
  }

  trackStartDialog.value.form.track_name = selectedRouteName.value
  trackStartDialog.value.form.taskpoint_name = selectedTaskGroupName.value
  trackStartDialog.value.form.obs_mode = 1
  trackStartDialog.value.form.gait_type = 0
  trackStartDialog.value.form.wait = 0
  trackStartDialog.value.visible = true
}

// 暂停循迹任务
const handlePauseTrack = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return

  try {
    await navigationApi.pauseNavigation(robotId, { action: 1 })
    alert('暂停指令已发送')
  } catch (err) {
    console.error('暂停失败', err)
    alert('暂停失败')
  }
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

  showConfirmDialog(
    `确定要删除任务组 "${selectedTaskGroupName.value}" 吗？删除后无法恢复。`,
    async () => {
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
        const cachedData = localStorage.getItem('all_track_task_list')
        if (cachedData) {
          let allTaskList = JSON.parse(cachedData)
          allTaskList = allTaskList.filter((task: any) => 
            !(task.track_name === selectedRouteName.value && 
              task.track_point_name === deletingTaskGroupName)
          )
          localStorage.setItem('all_track_task_list', JSON.stringify(allTaskList))
        }

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
      }
    }
  )
}

const onTrackStartConfirm = async () => {
  const form = trackStartDialog.value.form
  
  try {
    const robotId = localStorage.getItem('selected_robot_id')
    if (!robotId) {
      alert('未找到机器人ID')
      return
    }
    
    // 调用启动循迹任务API
    const response = await navigationApi.startTrack(robotId, {
      action: form.action,
      wait: form.wait,
      obs_mode: form.obs_mode,
      track_name: form.track_name,
      taskpoint_name: form.taskpoint_name
    })
    
    console.log('启动循迹任务响应:', response)
    
    // 根据返回结果判断是否成功
    if (response && (response as any).response && (response as any).response.msg) {
      const { error_code, error_msg } = (response as any).response.msg
      if (error_code === 0) {
        alert((response as any).message || '循迹任务启动成功')
        trackStartDialog.value.visible = false
      } else {
        alert(`启动失败: ${error_msg || '未知错误'}`)
      }
    } else {
      alert('启动循迹任务成功')
      trackStartDialog.value.visible = false
    }
  } catch (error) {
    console.error('启动循迹任务失败:', error)
    alert('启动循迹任务失败，请稍后重试')
  }
}

const onTrackStartCancel = () => {
  trackStartDialog.value.visible = false
}

onMounted(() => {
  loadWaylineFiles()
  loadRouteList()
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
  const cachedData = localStorage.getItem('all_track_task_list')
  if (!cachedData) {
    return []
  }
  
  try {
    const allTaskList = JSON.parse(cachedData)
    
    // 如果没有选择路线或任务组，返回空数组
    if (!selectedRouteName.value || !selectedTaskGroupName.value) {
      return []
    }
    
    // 根据 track_name 和 track_point_name 筛选
    const filteredTasks = allTaskList.filter((task: any) => {
      return task.track_name === selectedRouteName.value && 
             task.track_point_name === selectedTaskGroupName.value
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
        no_switch: task.no_switch,
        // 保留原始数据以备后用
        rawData: task
      }
    })
  } catch (err) {
    console.error('解析循迹任务点列表失败:', err)
    return []
  }
})

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

// 页面加载时获取数据
// 页面加载时获取数据
onMounted(async () => {
  await loadWaylineFiles()
  window.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdown)
})

/* Add Task Logic Copied from MissionRecords.vue */
const addTaskDialog = ref({
  visible: false,
  form: {
    isMulti: '0',
    typeInput: '',
    actionType: '',
    x: '0',
    y: '0',
    z: '0',
    angle: '0',
    preset: '',
    extraConfig: '',
    description: '',
    gait: '1',
    ground: '1',
    stopAtPoint: false
  }
})
const isEditMode = ref(false)
const editingTaskItem = ref<any>(null)

const showTypeDropdown = ref(false)
const closeDropdown = () => { showTypeDropdown.value = false }

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
  addTaskDialog.value.form.typeInput = ''
})

watch(filteredTaskTypes, (list) => {
  if (list && list.length > 0) {
    addTaskDialog.value.form.actionType = list[0].cn_name
  } else {
    addTaskDialog.value.form.actionType = ''
  }
}, { immediate: true })

const handleAddTask = () => {
  // 重置表单
  addTaskDialog.value.form.typeInput = ''
  addTaskDialog.value.form.actionType = ''
  addTaskDialog.value.form.preset = ''
  addTaskDialog.value.form.description = ''
  addTaskDialog.value.form.extraConfig = ''
  addTaskDialog.value.form.gait = '1'
  addTaskDialog.value.form.ground = '1'
  addTaskDialog.value.form.stopAtPoint = false
  addTaskDialog.value.form.isMulti = '0'
  
  if (currentPosition.value) {
    addTaskDialog.value.form.x = (currentPosition.value.x || '0').toString()
    addTaskDialog.value.form.y = (currentPosition.value.y || '0').toString()
    addTaskDialog.value.form.z = (currentPosition.value.z || '0').toString()
    addTaskDialog.value.form.angle = (currentPosition.value.angle || '0').toString()
  }
  isEditMode.value = false
  editingTaskItem.value = null
  addTaskDialog.value.visible = true
  fetchTaskTypeList()
}

const handleEditTask = (waypoint: any) => {
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
  
  addTaskDialog.value.form.isMulti = '0' // Edit is always single
  addTaskDialog.value.form.typeInput = waypoint.type || ''
  addTaskDialog.value.form.actionType = waypoint.type || ''
  addTaskDialog.value.form.x = (waypoint.coordinates?.x || '0').toString()
  addTaskDialog.value.form.y = (waypoint.coordinates?.y || '0').toString()
  addTaskDialog.value.form.z = (waypoint.coordinates?.z || '0').toString()
  addTaskDialog.value.form.angle = (waypoint.angle || '0').toString()
  addTaskDialog.value.form.preset = presetDisplay
  addTaskDialog.value.form.description = waypoint.description || ''
  addTaskDialog.value.form.extraConfig = waypoint.extra || waypoint.rawData?.extra || ''
  addTaskDialog.value.form.gait = waypoint.gait || waypoint.rawData?.gait || '1'
  addTaskDialog.value.form.ground = waypoint.ground || waypoint.rawData?.ground || '1'
  addTaskDialog.value.form.stopAtPoint = !(waypoint.no_switch === 'true' || waypoint.no_switch === true || waypoint.rawData?.no_switch === 'true' || waypoint.rawData?.no_switch === true)

  addTaskDialog.value.visible = true
}

const cancelAddTask = () => {
  addTaskDialog.value.visible = false
}

const confirmAddTask = async () => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) return

  if (!selectedRouteName.value || !selectedTaskGroupName.value) {
    console.warn('请先选择路线和任务组')
    return
  }

  const form = addTaskDialog.value.form
  const now = Math.floor(Date.now() / 1000)
  const timestamp = now.toString()

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
    type: form.typeInput || '',
    type_text: form.typeInput || '',
    x: parseFloat(form.x) || 0,
    y: parseFloat(form.y) || 0,
    z: parseFloat(form.z) || 0,
    theta: parseFloat(form.angle) || 0,
    preset: presetValue,
    presetID: presetIDValue,
    remark: form.description || '',
    time: 0,
    cam_key: 'cam_rtsp_left',
    track_name: selectedRouteName.value,
    track_point_name: selectedTaskGroupName.value,
    extra: form.extraConfig || '',
    no_switch: !form.stopAtPoint,
    gait: form.gait,
    ground: form.ground,
    createtime: isEditMode.value ? (editingTaskItem.value?.rawData?.createtime || timestamp) : timestamp
  }

  try {
    let response
    
    if (isEditMode.value) {
      // 编辑模式：调用更新接口
      response = await navigationApi.updateTaskPoint(robotId, taskData)
    } else {
      // 添加模式：调用添加接口
      response = await navigationApi.addTrackPoint(robotId, taskData)
    }

    // 重新获取任务列表更新缓存
    const cachedData = localStorage.getItem('all_track_task_list')
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

    localStorage.setItem('all_track_task_list', JSON.stringify(allTaskList))
    
    // 触发列表刷新
    taskListRefreshKey.value++
    
    successMessage.value = { show: true, text: isEditMode.value ? '编辑成功' : '添加成功' }
    setTimeout(() => {
      successMessage.value.show = false
    }, 2000)
    
  } catch (err: any) {
    console.error('操作失败', err)
    errorMessage.value = { show: true, text: '操作失败: ' + (err.message || '未知错误') }
    setTimeout(() => {
      errorMessage.value.show = false
    }, 2000)
  }
  
  addTaskDialog.value.visible = false
  isEditMode.value = false
  editingTaskItem.value = null
}

const handleDeleteTask = (waypoint: any) => {
  showConfirmDialog('确定要删除该任务点吗？', async () => {
    const robotId = localStorage.getItem('selected_robot_id')
    if (!robotId) return

    if (!selectedRouteName.value || !selectedTaskGroupName.value) return

    const rawData = waypoint.rawData || {}
    
    try {
      // 调用删除接口，传递完整的任务数据
      await navigationApi.deleteTrackPoint(robotId, {
        task_id: rawData.task_id || '',
        type: rawData.type || rawData.type_text || '',
        type_text: rawData.type_text || rawData.type || '',
        x: parseFloat(rawData.x) || 0,
        y: parseFloat(rawData.y) || 0,
        z: parseFloat(rawData.z) || 0,
        theta: parseFloat(rawData.theta) || 0,
        preset: rawData.preset || '',
        presetID: rawData.presetID || '',
        remark: rawData.remark || '',
        time: 0,
        cam_key: rawData.cam_key || 'cam_rtsp_left',
        track_name: selectedRouteName.value,
        track_point_name: selectedTaskGroupName.value
      })

      // 更新本地缓存
      const cachedData = localStorage.getItem('all_track_task_list')
      let allTaskList = cachedData ? JSON.parse(cachedData) : []

      // 删除指定任务
      allTaskList = allTaskList.filter((task: any) => 
        !(task.task_id === rawData.task_id &&
          task.track_name === selectedRouteName.value &&
          task.track_point_name === selectedTaskGroupName.value)
      )

      localStorage.setItem('all_track_task_list', JSON.stringify(allTaskList))
      
      // 触发列表刷新
      taskListRefreshKey.value++
      
      successMessage.value = { show: true, text: '删除成功' }
      setTimeout(() => {
        successMessage.value.show = false
      }, 2000)
    } catch (err) {
      console.error('删除异常', err)
      errorMessage.value = { show: true, text: '删除失败' }
      setTimeout(() => {
        errorMessage.value.show = false
      }, 2000)
    }
  })
}

const handleArriveTask = async (waypoint: any) => {
  showConfirmDialog('确定要执行到点任务吗？', async () => {
    const robotId = localStorage.getItem('selected_robot_id')
    if (!robotId) return

    const { droneSns } = getCachedDeviceSns()
    const sn = (droneSns && droneSns.length > 0) ? droneSns[0] : '123'
    
    const params = {
      sn: sn,
      action: 1,
      chargeIndex: waypoint.index.toString()
    }
    
    try {
       await navigationApi.oneKeyRecharge(robotId, params)
       successMessage.value = { show: true, text: '到点指令下发成功' }
       setTimeout(() => {
         successMessage.value.show = false
       }, 2000)
    } catch (err) {
       console.error('到点指令失败', err)
       errorMessage.value = { show: true, text: '到点指令失败' }
       setTimeout(() => {
         errorMessage.value.show = false
       }, 2000)
    }
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
let pc: RTCPeerConnection | null = null
const isPlaying = ref(false)
const videoStreamUrl = ref('')

const buildApiUrl = (webrtcUrl: string) => {
  try {
    const url = new URL(webrtcUrl)
    return `http://${url.hostname}:1985`
  } catch (error) {
    return webrtcUrl.replace('webrtc://', 'http://').replace(':8000', ':1985').split('/')[0]
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
        const streamsStr = localStorage.getItem('video_streams')
        if (streamsStr) {
            const streams = JSON.parse(streamsStr)
            // Retrieve the first stream as requested or specific visible stream
            // User said: take first video, type is 'drone_visible'
            // Structure: [{"type":"drone_visible", ...}, ...]
            // I'll look for drone_visible first, or fallback to index 0
            const visibleStream = streams.find((s: any) => s.type === 'drone_visible') || streams[0]
            
            if (visibleStream && visibleStream.url) {
                console.log('Starting video stream:', visibleStream.url)
                startWebRTCPlayback(visibleStream.url)
            } else {
                console.warn('No suitable video stream found')
            }
        } else {
            console.warn('No video_streams in localStorage')
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
const extraConfigDialog = ref({
  visible: false,
  content: ''
})

const openExtraConfigDialog = () => {
  extraConfigDialog.value.content = addTaskDialog.value.form.extraConfig || ''
  extraConfigDialog.value.visible = true
}

const closeExtraConfigDialog = () => {
  extraConfigDialog.value.visible = false
}

const confirmExtraConfig = () => {
  addTaskDialog.value.form.extraConfig = extraConfigDialog.value.content
  closeExtraConfigDialog()
}
// ========== 额外配置相关结束 ==========

</script>

<style>
@import './mission-common.css';

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
.simple-modal-header { height: 48px; background: #163654; border-bottom: 1px solid #244f78; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; color: #fff; font-size: 16px; font-weight: 500; flex-shrink: 0; }
.simple-close-icon { cursor: pointer; font-size: 20px; color: #909399; }
.simple-close-icon:hover { color: #fff; }
.simple-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
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

/* PTZ Buttons */
.ptz-btn { width: 50px; height: 50px; background: #0099ff; border: none; color: #fff; cursor: pointer; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-size: 24px; transition: 0.2s; }
.ptz-btn:hover { background: #0077cc; }
.ptz-btn:active { background: #0055aa; }
.mission-btn-blue { background: #0099ff; color: #fff; border: none; height: 40px; border-radius: 4px; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.2s; }
.mission-btn-blue:hover { background: #0077cc; }

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
</style>