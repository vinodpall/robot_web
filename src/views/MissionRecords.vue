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
              <span class="mission-top-title">发布点任务</span>
              <div class="mission-top-data">
                <span class="mission-data-item">X坐标: <span class="mission-data-value">{{ currentPosition.x ?? '-' }}</span></span>
                <span class="mission-data-item">Y坐标: <span class="mission-data-value">{{ currentPosition.y ?? '-' }}</span></span>
                <span class="mission-data-item">Z坐标: <span class="mission-data-value">{{ currentPosition.z ?? '-' }}</span></span>
                <span class="mission-data-item">角度: <span class="mission-data-value">{{ currentPosition.angle ?? '-' }}</span></span>
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
                <button
                  class="mission-btn"
                  :class="isPointTaskRunning ? 'mission-btn-stop' : 'mission-btn-primary'"
                  :disabled="((!canStartPointTask || filteredPointTaskList.length === 0 || !selectedPointTaskId) && !isPointTaskRunning) || (runningTaskType != null && runningTaskType !== 'point')"
                  v-permission-click-dialog="'task-tasklist-execute'"
                  @click="handleStartTask"
                >
                  {{ isPointTaskRunning ? '关闭' : '开始' }}
                </button>
                <button class="mission-btn" :class="isNavPaused ? 'mission-btn-stop' : 'mission-btn-secondary'" :disabled="!isNavigationEnabled" v-permission-click-dialog="'task-tasklist-pause'" @click="handleStopTask">
                  {{ isNavPaused ? '恢复' : '暂停' }}
                </button>
                <button class="mission-btn mission-btn-primary" v-permission-click-dialog="'task-tasklist-create'" @click="handleOpenCreateTaskGroupDialog">添加任务组</button>
                <button class="mission-btn mission-btn-stop" :disabled="filteredPointTaskList.length === 0 || !selectedPointTaskId" v-permission-click-dialog="'task-tasklist-delete'" @click="handleDeleteTaskGroup">删除任务组</button>
                <button class="mission-btn mission-btn-primary" :disabled="filteredPointTaskList.length === 0 || !selectedPointTaskId" v-permission-click-dialog="'task-tasklist-create'" @click="handleAddTask">添加任务</button>
                <button class="mission-btn mission-btn-secondary" :disabled="filteredPointTaskList.length === 0 || !selectedPointTaskId" v-permission-click-dialog="'task-tasklist-show'" @click="openPreviewDialog">预览</button>
              </div>
            </div>
            <div class="file-table file-table-adaptive">
              <div class="file-table-header">
                <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center; display: flex; align-items: center; justify-content: center;">序号</div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center; display: flex; align-items: center; justify-content: center;">任务类型</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">X坐标</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">Y坐标</div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center; display: flex; align-items: center; justify-content: center;">Z坐标</div>
                <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center; display: flex; align-items: center; justify-content: center;">角度</div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center; display: flex; align-items: center; justify-content: center;">预置点</div>
                <div class="file-table-cell" style="flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">描述</div>
                <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center; display: flex; align-items: center; justify-content: center;">操作</div>
              </div>
              <!-- 显示实际数据行 -->
              <div class="file-table-body">
              <template v-if="waypointsData.length > 0">
                <div class="file-table-row" v-for="waypoint in waypointsData" :key="waypoint.index">
                  <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center;">
                    <span class="ms-seq-num">{{ waypoint.index + 1 }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;">
                    <span v-if="waypoint.type" class="ms-type-tag">{{ waypoint.type }}</span>
                    <span v-else class="ms-empty">-</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;">
                    <span class="ms-coord-val">{{ waypoint.coordinates?.x ?? '-' }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;">
                    <span class="ms-coord-val">{{ waypoint.coordinates?.y ?? '-' }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;">
                    <span class="ms-coord-val">{{ waypoint.coordinates?.z ?? '-' }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">
                    <span class="ms-coord-val">{{ waypoint.angle ?? '-' }}</span>
                  </div>
                  <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;">
                    <span v-if="waypoint.preset" class="ms-preset-tag">{{ waypoint.preset }}</span>
                    <span v-else class="ms-empty">-</span>
                  </div>
                  <div class="file-table-cell file-table-name" style="flex: 1; text-align: center;">
                    <span v-if="waypoint.description" class="ms-desc-text">{{ waypoint.description }}</span>
                    <span v-else class="ms-empty">-</span>
                  </div>
                  <div class="file-table-cell file-table-action" style="min-width: 280px; width: 280px; text-align: center; display: flex; gap: 12px; justify-content: center; align-items: center;">
                    <button class="action-btn action-btn-edit" v-permission-click-dialog="'task-tasklist-edit'" @click="handleEditTask(waypoint)">
                      <img :src="editIcon" alt="编辑" />
                      编辑
                    </button>
                    <button class="action-btn action-btn-delete" v-permission-click-dialog="'task-tasklist-delete'" @click="handleDeleteTask(waypoint)">
                      <img :src="deleteIcon" alt="删除" />
                      删除
                    </button>
                    <button class="action-btn action-btn-arrive" v-permission-click-dialog="'task-tasklist-execute'" @click="handleArriveTask(waypoint)">
                      <img :src="arriveIcon" alt="到点" />
                      到点
                    </button>
                  </div>
                </div>
              </template>
              <!-- 始终显示固定的空行以保持表格边框（补足到10行） -->
              <div class="file-table-row" v-for="i in missionRecordsEmptyRowCount" :key="'empty-' + i">
                <div class="file-table-cell" style="min-width: 80px; width: 80px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 180px; width: 180px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;"></div>
                <div class="file-table-cell" style="min-width: 140px; width: 140px; text-align: center;"></div>
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
        <div class="simple-modal-card add-task-modal-card">
          <!-- Header -->
          <div class="simple-modal-header">
            <span>添加任务</span>
            <span class="simple-close-icon" @click="cancelAddTask">×</span>
          </div>
          
          <!-- Body -->
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
                 <input v-model="addTaskDialog.form.angle" class="simple-input">
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
               <div class="simple-flex-row" style="justify-content: space-between;">
                  <span style="color: #fff;">{{ extraConfigDisplayValue || '未配置' }}</span>
                  <button class="mission-btn mission-btn-primary" style="height: 34px; padding: 0 15px; display: flex; align-items: center; justify-content: center;" @click="openExtraConfigDialog">配置</button>
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
            </div>

          </div>

          <!-- Footer -->
          <div class="simple-modal-footer">
             <button class="mission-btn mission-btn-primary" style="width: 100px;" v-permission-click-dialog="['task-tasklist-create', 'task-tasklist-edit']" @click="confirmAddTask">确定</button>
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
                        <div class="custom-select-wrapper" style="position: relative;" tabindex="0" @blur="isPresetDropdownOpen = false">
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

    <!-- 添加任务组弹窗 -->
    <div v-if="showCreateTaskGroupDialog" class="custom-dialog-mask" @click="closeCreateTaskGroupDialog">
      <div class="simple-modal-card task-group-modal" @click.stop>
        <div class="simple-modal-header">
          <span>添加任务组</span>
          <span class="simple-close-icon" @click="closeCreateTaskGroupDialog">×</span>
        </div>
        <div class="simple-modal-body" style="padding: 35px 40px;">
          <div style="display: flex; justify-content: center; align-items: center;">
            <span v-if="selectedMap" class="map-name-prefix">{{ selectedMap }}_</span>
            <input
              v-model="createTaskGroupForm.keypoint_name"
              type="text"
              class="task-form-input task-group-input"
              :placeholder="selectedMap ? '请输入任务组名称' : '请输入任务组名称（未选择地图）'"
            />
          </div>
        </div>
        <div class="simple-modal-footer">
          <button class="mission-btn mission-btn-primary" v-permission-click-dialog="'task-tasklist-create'" @click="handleCreateTaskGroup">确定</button>
          <button class="mission-btn mission-btn-secondary" @click="closeCreateTaskGroupDialog">取消</button>
        </div>
      </div>
    </div>

    <div v-if="taskInitDialog.visible" class="custom-dialog-mask task-init-mask">
      <div class="track-init-dialog" @click.stop>
        <div class="track-init-spinner"></div>
        <span class="track-init-text">{{ taskInitDialog.text }}</span>
      </div>
    </div>

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

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      type="warning"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.show = false"
      @close="confirmDialog.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
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
import { waylineApi, navigationApi, dogApi } from '../api/services'
import { getErrorMessage } from '@/utils/errorCodes'
import { mediaApi } from '../api/services'
import SuccessMessage from '@/components/SuccessMessage.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ThreePointCloudPreview from '@/components/ThreePointCloudPreview.vue'
import { usePointCloudRenderer } from '@/composables/usePointCloudRenderer'
import { load3MF } from '@/utils/threemfParser'
import { useTaskExecutionStore } from '@/stores/taskExecution'
import { useRobotStore } from '@/stores/robot'
import { usePermissionStore } from '@/stores/permission'
import { getRobotContextCacheKeys } from '@/utils/robotBootstrap'

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()
const taskExecutionStore = useTaskExecutionStore()
const robotStore = useRobotStore()
const {
  isPointTaskRunning,
  canStartPointTask,
  runningTaskType,
  isNavigationEnabled,
  navPaused: isNavPaused
} = storeToRefs(taskExecutionStore)

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
const pendingRunningPointTaskName = ref('')

const getSelectedPointTaskCacheKey = () => {
  const robotId = localStorage.getItem('selected_robot_id') || ''
  return robotId ? `selected_point_task_id_${robotId}` : 'selected_point_task_id'
}

const getCurrentRobotContextKeys = () => {
  const robotId = localStorage.getItem('selected_robot_id') || ''
  return robotId ? getRobotContextCacheKeys(robotId) : null
}

const getCachedSelectedPointTaskId = () => {
  const key = getSelectedPointTaskCacheKey()
  return localStorage.getItem(key) || localStorage.getItem('selected_point_task_id') || ''
}

const persistSelectedPointTaskId = (taskId: string) => {
  const key = getSelectedPointTaskCacheKey()
  if (taskId) {
    localStorage.setItem(key, taskId)
    localStorage.setItem('selected_point_task_id', taskId)
    return
  }
  localStorage.removeItem(key)
  localStorage.removeItem('selected_point_task_id')
}

const pickValidPointTaskSelection = (list: PointTask[]) => {
  const mapName = selectedMap.value
  if (!mapName) {
    selectedPointTaskId.value = ''
    return
  }

  const visibleList = list.filter(task => String(task.task_name || '').startsWith(mapName + '_'))
  if (visibleList.length === 0) {
    selectedPointTaskId.value = ''
    return
  }

  if (visibleList.some(task => task.task_id === selectedPointTaskId.value)) return
  const cachedSelectedId = getCachedSelectedPointTaskId()
  const cachedInCurrentList = cachedSelectedId && visibleList.some(task => task.task_id === cachedSelectedId)
  selectedPointTaskId.value = cachedInCurrentList ? cachedSelectedId : visibleList[0].task_id
}

const applyPendingRunningPointTaskSelection = () => {
  const pendingName = String(pendingRunningPointTaskName.value || '').trim()
  if (!pendingName) return false
  const matched = filteredPointTaskList.value.find(t => String(t.task_name || '').trim() === pendingName)
  if (!matched) return false
  selectedPointTaskId.value = matched.task_id
  pendingRunningPointTaskName.value = ''
  return true
}

// 获取发布点任务列表
const fetchPointTaskList = async (forceRefresh = false) => {
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    console.warn('未选择机器人，尝试从缓存加载发布点任务列表')
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_point_task_list')
    if (cached) {
      pointTaskList.value = JSON.parse(cached)
      pickValidPointTaskSelection(pointTaskList.value)
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
      const contextKeys = getCurrentRobotContextKeys()
      if (contextKeys) {
        localStorage.setItem(contextKeys.pointTaskListKey, JSON.stringify(pointTaskList.value))
      }
      localStorage.setItem('cached_point_task_list', JSON.stringify(pointTaskList.value))

      if (!applyPendingRunningPointTaskSelection()) {
        pickValidPointTaskSelection(pointTaskList.value)
      }
    }
  } catch (error) {
    console.error('获取发布点任务列表失败:', error)
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_point_task_list')
    if (cached) {
      pointTaskList.value = JSON.parse(cached)
      if (!applyPendingRunningPointTaskSelection()) {
        pickValidPointTaskSelection(pointTaskList.value)
      }
    }
  }
}

// selectedMap 从 store 读取，实现多页面同步
const selectedMap = computed(() => taskExecutionStore.selectedMapName)

// 过滤后的发布点任务列表（根据缓存的地图筛选）
const filteredPointTaskList = computed(() => {
  // 未选择地图时不展示历史任务组，避免出现跨地图残留数据
  if (!selectedMap.value) return []
  
  // 根据地图名称筛选：task_name 以 "地图名称_" 开头
  return pointTaskList.value.filter(task => {
    return task.task_name.startsWith(selectedMap.value + '_')
  })
})

// 监听筛选后的发布点任务列表变化，自动选择第一个
watch(filteredPointTaskList, (newList) => {
  if (applyPendingRunningPointTaskSelection()) return
  if (newList.length === 0) {
    selectedPointTaskId.value = ''
    return
  }

  // 优先保留当前选择；当前无效时尝试恢复缓存；都无效再选第一个
  if (newList.some(task => task.task_id === selectedPointTaskId.value)) return
  const cachedSelectedId = getCachedSelectedPointTaskId()
  const cachedInCurrentList = cachedSelectedId && newList.some(task => task.task_id === cachedSelectedId)
  selectedPointTaskId.value = cachedInCurrentList ? cachedSelectedId : newList[0].task_id
}, { immediate: true })

watch(selectedPointTaskId, (newVal) => {
  persistSelectedPointTaskId(newVal || '')
})

// 监听 WebSocket task_status，运行中时自动选中对应任务
watch(() => robotStore.taskStatus, (ts) => {
  if (!ts?.is_running || !ts.task_name) return
  pendingRunningPointTaskName.value = String(ts.task_name || '').trim()
  if (applyPendingRunningPointTaskSelection()) return
  void fetchPointTaskList(true)
}, { deep: true })

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
    type: item.type_text || item.type,
    coordinates: {
      x: item.x,
      y: item.y,
      z: item.z
    },
    angle: item.theta,
    preset: item.preset || item.presetID,
    description: item.remark,
    time: item.time,
    extra: item.extra,
    gait: item.gait,
    ground: item.ground,
    no_switch: item.no_switch,
    rawData: item
  }))
})

const missionRecordsEmptyRowCount = computed(() => Math.max(0, 10 - waypointsData.value.length))

const MAP_DB_NAME = 'MapFilesDB'
const MAP_STORE_NAME = 'mapFiles'

const previewDialog = ref({
  visible: false,
  loading: false,
  error: ''
})
const previewPc = usePointCloudRenderer({ initialScale: 1, initialPointSize: 0.5 })
const previewPointCloudData = previewPc.data
const previewBasePointCloudData = previewPc.baseData
const previewPointCloudNormalization = previewPc.normalizationParams
const previewOverlayTaskPoints = ref<Array<{ x: number; y: number; z: number; name: string }>>([])
const previewPointCloudCanvas = previewPc.canvasRef
let previewCanvasEventController: AbortController | null = null
let previewResizeObserver: ResizeObserver | null = null

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

const resolvePreviewMapName = () => {
  if (selectedMap.value) return selectedMap.value
  const taskName = String(selectedTaskDetail.value?.task_name || '')
  if (!taskName.includes('_')) return ''
  return taskName.split('_')[0] || ''
}

const getPreviewTaskPoints = () => {
  const taskPoints: Array<{ x: number; y: number; z: number; name: string }> = []
  const taskContent = selectedTaskDetail.value?.taskcontent || []
  taskContent.forEach((task: any, idx: number) => {
    const x = Number(task.x)
    const y = Number(task.y)
    const z = Number(task.z ?? 0)
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      const name = String(task.type_text || task.preset || task.remark || task.task_id || `任务点${idx + 1}`)
      taskPoints.push({ x, y, z, name })
    }
  })
  return taskPoints
}

const applyPreviewOverlay = async () => {
  if (!previewBasePointCloudData.value.length) return
  const { centerX, centerY, centerZ, maxRange } = previewPointCloudNormalization.value
  if (!maxRange || maxRange <= 1e-6) return

  const normalizedTaskPoints = previewOverlayTaskPoints.value.map(point => ({
    x: (point.x - centerX) / maxRange,
    y: (point.y - centerY) / maxRange,
    z: (point.z - centerZ) / maxRange,
    intensity: 1.75,
    name: point.name
  }))

  previewPointCloudData.value = [
    ...previewBasePointCloudData.value,
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
    if (!selectedPointTaskId.value || !selectedTaskDetail.value) {
      previewDialog.value.error = '请先选择任务组'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTaskPoints.value = []
      return
    }

    const mapName = resolvePreviewMapName()
    if (!mapName) {
      previewDialog.value.error = '未找到地图，请先在首页选择地图'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTaskPoints.value = []
      return
    }

    const pcdBlob = await getMapFile(mapName, 'tinyMap.pcd')
    if (!pcdBlob || pcdBlob.size === 0) {
      previewDialog.value.error = '点云文件不存在'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTaskPoints.value = []
      return
    }

    const { points: pcdPoints, normParams } = await parsePcdBufferInWorker(await pcdBlob.arrayBuffer())
    if (!pcdPoints.length) {
      previewDialog.value.error = '点云数据为空'
      previewPointCloudData.value = []
      previewBasePointCloudData.value = []
      previewOverlayTaskPoints.value = []
      return
    }

    previewPointCloudNormalization.value = normParams
    previewBasePointCloudData.value = pcdPoints
    previewOverlayTaskPoints.value = getPreviewTaskPoints()
    await applyPreviewOverlay()
  } catch (err) {
    console.error('[MissionRecords 预览] 加载失败:', err)
    previewDialog.value.error = '预览加载失败'
    previewPointCloudData.value = []
    previewBasePointCloudData.value = []
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

const parseErrorMessage = (error: any): string => {
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
  return '未知错误'
}

const trackGaitConfigMap: Record<number, { command: string; label: string }> = {
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

const waitForRobotState = async (
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

const sendDogCommand = async (robotId: string, commandName: string) => {
  await dogApi.sendCommand(robotId, { command_name: commandName })
}

const prepareRobotForTaskStart = async (
  robotId: string,
  options?: { gaitConfig?: { command: string; label: string } }
) => {
  if (robotStore.robotStatusText === 'RL状态') {
    await sendDogCommand(robotId, 'foot_walk')
  }

  await sendDogCommand(robotId, 'mode_auto')
  await sendDogCommand(robotId, 'ground_1')

  await waitForRobotState(
    () => Array.isArray(robotStore.rcsData?.rcs_state) && robotStore.rcsData.rcs_state[0] === 1,
    8000,
    '等待机器人切换到非手动模式超时'
  )

  await sendDogCommand(robotId, 'mode_auto_2')

  if (robotStore.motionState?.basic_state !== 4) {
    await sendDogCommand(robotId, 'action')
    await waitForRobotState(
      () => robotStore.motionState?.basic_state === 4,
      10000,
      '等待机器人进入踏步状态超时'
    )
  }

  if (options?.gaitConfig) {
    await sendDogCommand(robotId, options.gaitConfig.command)
    await waitForRobotState(
      () => robotStore.gaitText === options.gaitConfig?.label,
      10000,
      `等待机器人切换到${options.gaitConfig.label}超时`
    )
  }
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
  // 航线筛选已移除
  
  // 先清空现有数据
  clearJobs()
  
  if (!workspaceId) {
    console.error('未找到workspace_id，无法加载任务记录')
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
  if (isNavPaused.value) {
    errorMessage.value = { show: true, text: '请先关闭导航暂停' }
    setTimeout(() => {
      errorMessage.value.show = false
    }, 2000)
    return
  }
  if (isPointTaskRunning.value) {
    const robotId = localStorage.getItem('selected_robot_id')
    if (!robotId) {
      errorMessage.value = { show: true, text: '未找到机器人ID' }
      return
    }
    if (!selectedPointTaskId.value) {
      errorMessage.value = { show: true, text: '请先选择任务组' }
      return
    }
    try {
      await navigationApi.stopPointTask(robotId, {
        id: selectedPointTaskId.value,
        sn: robotId
      })
      successMessage.value = { show: true, text: '关闭指令已发送' }
      setTimeout(() => {
        successMessage.value.show = false
      }, 2000)
    } catch (error: any) {
      console.error('关闭任务失败:', error)
      errorMessage.value = { show: true, text: `关闭任务失败: ${error.message || '未知错误'}` }
    }
    return
  }
  if (!canStartPointTask.value) {
    errorMessage.value = { show: true, text: '当前有其他任务正在运行' }
    return
  }
  // 必须开启导航、INS或MSF中的至少一个
  const cmdStatus = robotStore.cmdStatus
  const hasNavEnabled = cmdStatus?.nav === 1 || cmdStatus?.ins === 1 || cmdStatus?.msf === 1
  if (!hasNavEnabled) {
    errorMessage.value = { show: true, text: '请先开启导航、INS或MSF' }
    return
  }
  if (!selectedPointTaskId.value) {
    errorMessage.value = { show: true, text: '请先选择任务组' }
    return
  }
  
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    errorMessage.value = { show: true, text: '未找到机器人ID' }
    return
  }
  
  try {
    taskInitDialog.value.text = '任务初始化中...'
    taskInitDialog.value.visible = true

    await prepareRobotForTaskStart(robotId, {
      gaitConfig: trackGaitConfigMap[0]
    })

    const response = await navigationApi.startPointTask(robotId, {
      id: selectedPointTaskId.value,
      // 与Home.vue保持一致，sn参数传入robotId
      sn: robotId
    })

    if (response && (response as any).msg) {
      const { error_code, error_msg } = (response as any).msg
      if (error_code !== 0) {
        errorMessage.value = { show: true, text: `启动失败: ${error_msg || '未知错误'}` }
        setTimeout(() => {
          errorMessage.value.show = false
        }, 2000)
        return
      }
    }

    taskExecutionStore.markMultiTaskStopped()
    successMessage.value = { show: true, text: '发布点任务启动成功' }
    setTimeout(() => {
      successMessage.value.show = false
    }, 2000)
    console.log('启动任务响应:', response)
  } catch (error: any) {
    console.error('启动任务失败:', error)
    errorMessage.value = { show: true, text: parseErrorMessage(error) || '启动发布点任务失败，请稍后重试' }
    setTimeout(() => {
      errorMessage.value.show = false
    }, 2000)
  } finally {
    taskInitDialog.value.visible = false
  }
}

// 暂停发布点任务
const handleStopTask = async () => {
  if (!isNavigationEnabled.value) return
  const robotId = localStorage.getItem('selected_robot_id')
  if (!robotId) {
    errorMessage.value = { show: true, text: '未找到机器人ID' }
    setTimeout(() => {
      errorMessage.value.show = false
    }, 2000)
    return
  }
  const nextPaused = !isNavPaused.value
  const actionText = nextPaused ? '暂停' : '恢复'
  confirmDialog.value = {
    show: true,
    title: `${actionText}任务`,
    message: nextPaused ? '确定要暂停导航吗' : '确定要恢复导航吗',
    onConfirm: async () => {
      confirmDialog.value.show = false
      try {
        await navigationApi.pauseNavigation(robotId, { action: nextPaused ? 1 : 0 })
        taskExecutionStore.setNavPaused(nextPaused)
        successMessage.value = { show: true, text: nextPaused ? '暂停指令已发送' : '恢复指令已发送' }
        setTimeout(() => {
          successMessage.value.show = false
        }, 2000)
      } catch (err: any) {
        console.error('暂停失败', err)
        errorMessage.value = { show: true, text: `${actionText}失败: ${err?.message || '未知错误'}` }
        setTimeout(() => {
          errorMessage.value.show = false
        }, 2000)
      }
    }
  }
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
    obsMode: '近障模式',
    gait: '1', // 行走步态
    ground: '1', // 实心地面
    stopAtPoint: false,
    remark: '' // 备注
  }
})

const addTaskFieldErrors = ref({
  taskType: '',
  x: '',
  y: '',
  z: ''
})

const resetAddTaskFieldErrors = () => {
  addTaskFieldErrors.value = {
    taskType: '',
    x: '',
    y: '',
    z: ''
  }
}

const validateAddTaskRequiredFields = () => {
  resetAddTaskFieldErrors()

  const taskTypeText = String(addTaskDialog.value.form.typeInput || '').trim()
  const xText = String(addTaskDialog.value.form.x || '').trim()
  const yText = String(addTaskDialog.value.form.y || '').trim()
  const zText = String(addTaskDialog.value.form.z || '').trim()

  if (!taskTypeText) addTaskFieldErrors.value.taskType = '任务类型不能为空'
  if (!xText) addTaskFieldErrors.value.x = 'X坐标不能为空'
  if (!yText) addTaskFieldErrors.value.y = 'Y坐标不能为空'
  if (!zText) addTaskFieldErrors.value.z = 'Z坐标不能为空'

  return !(addTaskFieldErrors.value.taskType || addTaskFieldErrors.value.x || addTaskFieldErrors.value.y || addTaskFieldErrors.value.z)
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

const showTypeDropdown = ref(false)
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

const closeDropdown = () => {
  showTypeDropdown.value = false
}

const taskTypeList = ref<any[]>([])
let skipNextIsMultiReset = false

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
  // 切换单/多选时，直接清空输入框
  addTaskDialog.value.form.typeInput = ''
  addTaskFieldErrors.value.taskType = ''
})

watch(() => addTaskDialog.value.form.typeInput, (val, oldVal) => {
  if (String(val || '').trim()) addTaskFieldErrors.value.taskType = ''
  const nextTypeInput = String(val || '').trim()
  const prevTypeInput = String(oldVal || '').trim()
  if (nextTypeInput !== prevTypeInput) {
    addTaskDialog.value.form.extraConfig = ''
  }
})
watch(() => addTaskDialog.value.form.actionType, (val, oldVal) => {
  if (String(val || '').trim()) addTaskFieldErrors.value.taskType = ''
  const nextType = String(val || '').trim()
  const prevType = String(oldVal || '').trim()
  if (nextType !== prevType) {
    addTaskDialog.value.form.extraConfig = ''
  }
})
watch(() => addTaskDialog.value.form.x, (val) => {
  if (String(val || '').trim()) addTaskFieldErrors.value.x = ''
})
watch(() => addTaskDialog.value.form.y, (val) => {
  if (String(val || '').trim()) addTaskFieldErrors.value.y = ''
})
watch(() => addTaskDialog.value.form.z, (val) => {
  if (String(val || '').trim()) addTaskFieldErrors.value.z = ''
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
  if (!selectedPointTaskId.value) {
    errorMessage.value = { show: true, text: '请先选择任务组' }
    return
  }
  const cmdStatus = robotStore.cmdStatus
  const canPrefillPose =
    Number(cmdStatus?.nav ?? 0) === 1 ||
    Number(cmdStatus?.ins ?? 0) === 1 ||
    Number(cmdStatus?.msf ?? 0) === 1
  const prefillX = canPrefillPose && currentPosition.value.x != null ? String(currentPosition.value.x) : ''
  const prefillY = canPrefillPose && currentPosition.value.y != null ? String(currentPosition.value.y) : ''
  const prefillZ = canPrefillPose && currentPosition.value.z != null ? String(currentPosition.value.z) : ''
  const prefillAngle = canPrefillPose && currentPosition.value.angle != null ? String(currentPosition.value.angle) : ''
  // 重置表单为添加模式
  editingTaskIndex.value = -1
  // 重置表单数据
  addTaskDialog.value.form = {
    isMulti: '0',
    typeInput: '',
    actionType: '',
    x: prefillX,
    y: prefillY,
    z: prefillZ,
    angle: prefillAngle,
    preset: '',
    extraConfig: '',
    description: '',
    obsMode: '近障模式',
    gait: '1',
    ground: '1',
    stopAtPoint: false,
    remark: ''
  }
  resetAddTaskFieldErrors()
  addTaskDialog.value.visible = true
  fetchTaskTypeList()
}

const cancelAddTask = () => {
  addTaskDialog.value.visible = false
  editingTaskIndex.value = -1
  resetAddTaskFieldErrors()
}

const confirmAddTask = async () => {
  if (!selectedPointTaskId.value) {
    errorMessage.value = { show: true, text: '请先选择任务组' }
    return
  }

  if (!validateAddTaskRequiredFields()) {
    return
  }

  const taskTypeText = String(addTaskDialog.value.form.typeInput || addTaskDialog.value.form.actionType || '').trim()
  const xText = String(addTaskDialog.value.form.x || '').trim()
  const yText = String(addTaskDialog.value.form.y || '').trim()
  const zText = String(addTaskDialog.value.form.z || '').trim()
  const taskTypePayload = resolveTaskTypeSubmitPayload(taskTypeText)
  
  console.log('表单数据:', {
    description: addTaskDialog.value.form.description,
    extraConfig: addTaskDialog.value.form.extraConfig
  })
  
  // 构建任务数据
  const taskData = {
    task_id: editingTaskIndex.value >= 0 
      ? (selectedTaskDetail.value?.taskcontent[editingTaskIndex.value] as any)?.task_id || `task_${Date.now()}`
      : `task_${Date.now()}`,
    ...taskTypePayload,
    x: String(parseFloat(xText) || 0),
    y: String(parseFloat(yText) || 0),
    z: String(parseFloat(zText) || 0),
    theta: String(parseFloat(addTaskDialog.value.form.angle) || 0),
    preset: addTaskDialog.value.form.preset,
    presetID: addTaskDialog.value.form.preset,
    remark: addTaskDialog.value.form.description || '',
    extra: addTaskDialog.value.form.extraConfig || '',
    obs_mode: 2,
    gait: addTaskDialog.value.form.gait || '1',
    ground: addTaskDialog.value.form.ground || '1',
    no_switch: !addTaskDialog.value.form.stopAtPoint
  }
  
  console.log('准备提交的 taskData:', taskData)
  
  const taskGroup = pointTaskList.value.find(task => task.task_id === selectedPointTaskId.value)
  if (!taskGroup) {
    errorMessage.value = { show: true, text: '未找到任务组' }
    return
  }
  
  if (editingTaskIndex.value >= 0) {
    // 编辑模式
    taskGroup.taskcontent[editingTaskIndex.value] = taskData
    successMessage.value = { show: true, text: '编辑任务成功' }
  } else {
    // 添加模式
    if (!taskGroup.taskcontent) {
      taskGroup.taskcontent = []
    }
    taskGroup.taskcontent.push(taskData)
    successMessage.value = { show: true, text: '添加任务成功' }
  }
  
  // 更新缓存
  await updateCache()
  
  setTimeout(() => {
    successMessage.value.show = false
  }, 2000)
  
  addTaskDialog.value.visible = false
  editingTaskIndex.value = -1
  resetAddTaskFieldErrors()
}

// 编辑任务索引
const editingTaskIndex = ref(-1)

// 编辑任务
const handleEditTask = async (waypoint: any) => {
  if (!selectedTaskDetail.value || !selectedTaskDetail.value.taskcontent) return
  
  editingTaskIndex.value = waypoint.index
  const taskData = selectedTaskDetail.value.taskcontent[waypoint.index]
  await fetchTaskTypeList()

  const typeNames = splitTaskTypeNames(taskData.type_text || taskData.type || '').map(normalizeTaskTypeNameToCn)
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
  
  // 填充表单数据
  skipNextIsMultiReset = true
  addTaskDialog.value.form = {
    isMulti: targetIsMulti,
    typeInput: normalizedTypeText,
    actionType: typeNames[0] || taskData.type || '',
    x: String(taskData.x || 0),
    y: String(taskData.y || 0),
    z: String(taskData.z || 0),
    angle: String(taskData.theta || 0),
    preset: taskData.preset || taskData.presetID || '',
    remark: taskData.remark || '',
    extraConfig: taskData.extra || '',
    description: taskData.remark || '',
    obsMode: normalizeTrackTaskObsModeText(taskData.obs_mode),
    gait: taskData.gait || '1',
    ground: taskData.ground || '1',
    stopAtPoint: !(taskData.no_switch === 'true' || taskData.no_switch === true)
  }
  
  addTaskDialog.value.visible = true
}

// 删除任务
const handleDeleteTask = (waypoint: any) => {
  confirmDialog.value = {
    show: true,
    title: '删除任务',
    message: `确定要删除第 ${waypoint.index + 1} 个任务吗？`,
    onConfirm: async () => {
      const taskGroup = pointTaskList.value.find(task => task.task_id === selectedPointTaskId.value)
      if (!taskGroup || !taskGroup.taskcontent) return
      
      taskGroup.taskcontent.splice(waypoint.index, 1)
      await updateCache()
      
      successMessage.value = { show: true, text: '删除任务成功' }
      setTimeout(() => {
        successMessage.value.show = false
      }, 2000)
      
      confirmDialog.value.show = false
    }
  }
}

const handleArriveTask = async (waypoint: any) => {
  if (!isPointTaskRunning.value) {
    errorMessage.value = { show: true, text: '需要先启动发布点任务' }
    setTimeout(() => {
      errorMessage.value.show = false
    }, 2000)
    return
  }

  confirmDialog.value = {
    show: true,
    title: '到点任务',
    message: '确定要执行到点任务吗？',
    onConfirm: async () => {
      confirmDialog.value.show = false
      const robotId = localStorage.getItem('selected_robot_id')
      if (!robotId) return

      const chargeIndex = Number(waypoint?.rawData?.time ?? waypoint?.time ?? waypoint?.index)
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
    }
  }
}

// ========== 预置点选择相关 ==========
const presetDialog = ref({
  visible: false,
  form: {
    id: '',
    name: ''
  }
})

const presetList = ref<{id: string, name: string}[]>(
  Array.from({ length: 300 }, (_, i) => ({
    id: String(i + 1),
    name: `${i + 1}.预置点${i + 1}`
  }))
)

const isPresetDropdownOpen = ref(false)

const selectPreset = (p: {id: string, name: string}) => {
    presetDialog.value.form.id = p.id
    presetDialog.value.form.name = p.name
    isPresetDropdownOpen.value = false
}

// Video Playback Logic
const videoElement = ref<HTMLVideoElement | null>(null)
let pc: RTCPeerConnection | null = null
const isPlaying = ref(false)
const videoStreamUrl = ref('')

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
  
  const robotId = localStorage.getItem('selected_robot_id')
  const cameraListStr = localStorage.getItem('camera_list')
  
  if (robotId && cameraListStr) {
    try {
      const cameraList = JSON.parse(cameraListStr)
      if (cameraList && cameraList.length > 0) {
        const ptzName = cameraList[0].PtzName
        if (ptzName) {
           console.log('Fetching presets for:', ptzName)
           try {
             const res = await navigationApi.getPresets(robotId, ptzName)
             if (res && res.code === 200 && Array.isArray(res.list)) {
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

  if (presetList.value.length > 0) {
      presetDialog.value.form.id = presetList.value[0].id
      presetDialog.value.form.name = presetList.value[0].name
  }
  
  nextTick(() => {
      try {
        const streamsStr = localStorage.getItem('video_streams')
        if (streamsStr) {
            const streams = JSON.parse(streamsStr)
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

const ptzMove = (direction: string) => {
  console.log('PTZ Move:', direction)
}

const ptzStop = () => {
    console.log('PTZ Stop')
}

const ptzZoom = (zoomIn: boolean) => {
    console.log('Zoom:', zoomIn ? 'In' : 'Out')
}

const ptzFocus = (focusIn: boolean) => {
    console.log('Focus:', focusIn ? 'In' : 'Out')
}

const handleSetPreset = () => { 
  console.log('Set Preset') 
}

const handleGotoPreset = () => { 
  console.log('Goto Preset') 
}
// ========== 预置点选择相关结束 ==========

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

const closeExtraConfigDialog = () => {
  extraConfigDialog.value.visible = false
}
// ========== 额外配置相关结束 ==========

// 添加任务组弹窗
const showCreateTaskGroupDialog = ref(false)
const createTaskGroupForm = ref({
  keypoint_name: ''
})

// 打开添加任务组弹窗
const handleOpenCreateTaskGroupDialog = () => {
  showCreateTaskGroupDialog.value = true
  createTaskGroupForm.value.keypoint_name = ''
}

// 关闭添加任务组弹窗
const closeCreateTaskGroupDialog = () => {
  showCreateTaskGroupDialog.value = false
  createTaskGroupForm.value.keypoint_name = ''
}

// 创建任务组
const handleCreateTaskGroup = async () => {
  const rawInput = (createTaskGroupForm.value.keypoint_name || '').trim()
  if (!rawInput) {
    errorMessage.value = { show: true, text: '请输入任务组名称' }
    return
  }
  
  const mapName = selectedMap.value
  const taskName = mapName 
    ? `${mapName}_${rawInput}`
    : rawInput

  // 判重：按“前缀+输入值”组合后的完整任务组名，与当前下拉列表内容比较
  const visibleTaskGroups = selectedMap.value ? filteredPointTaskList.value : pointTaskList.value
  const duplicated = visibleTaskGroups.some(task => String(task.task_name || '').trim().toLowerCase() === taskName.trim().toLowerCase())
  if (duplicated) {
    errorMessage.value = { show: true, text: '任务组名称已存在' }
    return
  }
  
  const newTaskGroup: PointTask = {
    isStart: false,
    task_id: String(Date.now()),
    task_name: taskName,
    taskcontent: []
  }
  
  pointTaskList.value.push(newTaskGroup)
  await updateCache()
  
  successMessage.value = { show: true, text: '添加任务组成功' }
  setTimeout(() => {
    successMessage.value.show = false
  }, 2000)
  
  // 选择新创建的任务组
  selectedPointTaskId.value = newTaskGroup.task_id
  
  closeCreateTaskGroupDialog()
}

// 删除任务组
const handleDeleteTaskGroup = () => {
  if (!selectedPointTaskId.value) {
    errorMessage.value = { show: true, text: '请先选择要删除的任务组' }
    return
  }
  
  const taskGroup = pointTaskList.value.find(task => task.task_id === selectedPointTaskId.value)
  if (!taskGroup) return
  
  confirmDialog.value = {
    show: true,
    title: '删除任务组',
    message: `确定要删除任务组「${taskGroup.task_name}」吗？`,
    onConfirm: async () => {
      const index = pointTaskList.value.findIndex(task => task.task_id === selectedPointTaskId.value)
      if (index > -1) {
        pointTaskList.value.splice(index, 1)
        await updateCache()
        
        // 选择过滤列表中的第一个任务组
        if (filteredPointTaskList.value.length > 0) {
          selectedPointTaskId.value = filteredPointTaskList.value[0].task_id
        } else {
          selectedPointTaskId.value = ''
        }
        
        successMessage.value = { show: true, text: '删除任务组成功' }
        setTimeout(() => {
          successMessage.value.show = false
        }, 2000)
      }
      confirmDialog.value.show = false
    }
  }
}

// 成功/失败提示
const successMessage = ref({
  show: false,
  text: ''
})
const errorMessage = ref({
  show: false,
  text: ''
})

// 确认对话框
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {}
})
const taskInitDialog = ref({
  visible: false,
  text: '任务初始化中...'
})

// 更新缓存并同步到服务器
const updateCache = async () => {
  try {
    // 1. 更新本地缓存
    const contextKeys = getCurrentRobotContextKeys()
    if (contextKeys) {
      localStorage.setItem(contextKeys.pointTaskListKey, JSON.stringify(pointTaskList.value))
    }
    localStorage.setItem('cached_point_task_list', JSON.stringify(pointTaskList.value))
    
    // 2. 获取 robotId
    const robotId = localStorage.getItem('selected_robot_id')
    if (!robotId) {
      console.error('未找到机器人ID')
      return
    }
    
    // 3. POST 提交数据到服务器，接口返回完整列表
    const response = await navigationApi.updatePointTaskList(robotId, { data: pointTaskList.value })
    
    // 4. 使用返回的数据更新列表
    if (response.response?.data) {
      pointTaskList.value = response.response.data
      // 5. 更新缓存
      if (contextKeys) {
        localStorage.setItem(contextKeys.pointTaskListKey, JSON.stringify(pointTaskList.value))
      }
      localStorage.setItem('cached_point_task_list', JSON.stringify(pointTaskList.value))
    }

    window.dispatchEvent(new CustomEvent('point-task-list-updated', {
      detail: { robotId }
    }))
  } catch (error) {
    console.error('更新缓存失败:', error)
    errorMessage.value = { show: true, text: '同步数据失败，请重试' }
  }
}

// 页面加载时获取数据
// 切换机器人后刷新发布点任务列表
const handleRobotContextRefreshed = () => {
  fetchPointTaskList()
}

const refreshPointTaskPageListOnEnter = async () => {
  await fetchPointTaskList()
}

watch(
  [selectedPointTaskId, selectedMap, isNavigationEnabled],
  async () => {
    if (!previewDialog.value.visible) return
    await loadPreviewData()
  }
)

onMounted(async () => {
  await refreshPointTaskPageListOnEnter()
  // 初始化分页输入框
  pageInput.value = currentPage.value.toString()
  
  // 获取发布点任务列表
  await fetchTaskTypeList()
  
  await loadJobRecords()
  // 点击页面空白关闭
  window.addEventListener('click', closeErrorTooltip)
  window.addEventListener('click', closeDropdown)
  window.addEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  load3MF('/jiantou.3mf').then(mesh => {
    if (mesh) previewPc.robotMesh.value = mesh
  })
})

let pointTaskPageMounted = false
onMounted(() => {
  pointTaskPageMounted = true
})

onActivated(async () => {
  if (!pointTaskPageMounted) return
  await refreshPointTaskPageListOnEnter()
})

// 离开时移除监听
onUnmounted(() => {
  window.removeEventListener('click', closeErrorTooltip)
  window.removeEventListener('click', closeDropdown)
  window.removeEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  destroyPreviewCanvasEvents()
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

.preview-dialog-mask {
  z-index: 1101;
}

.preview-modal-body {
  height: calc(100% - 45px);
  padding: 0;
}

.preview-map-wrap {
  width: 100%;
  height: 100%;
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
.task-init-mask {
  z-index: 10040;
}
.track-init-dialog {
  min-width: 280px;
  max-width: 420px;
  padding: 26px 24px;
  border-radius: 14px;
  border: 1px solid rgba(103, 213, 253, 0.35);
  background: linear-gradient(135deg, #102a43 70%, #0d2036 100%);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.track-init-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(103, 213, 253, 0.25);
  border-top-color: #67d5fd;
  animation: track-init-spin 0.9s linear infinite;
}
.track-init-text {
  color: #d7f2ff;
  font-size: 15px;
  line-height: 1.4;
}
@keyframes track-init-spin {
  to {
    transform: rotate(360deg);
  }
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
.add-task-modal-card {
  width: 760px;
  max-width: calc(100vw - 40px);
  max-height: none;
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
.add-task-modal-body {
  padding: 18px 24px 14px;
  overflow-y: visible;
}
.add-task-modal-body .simple-form-item {
  margin-bottom: 12px;
}
.simple-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
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

.input-error-border {
  border-color: #ff6b6b !important;
  box-shadow: 0 0 0 1px rgba(255, 107, 107, 0.28);
}

.input-error-text {
  margin-top: 6px;
  color: #ff8a8a;
  font-size: 12px;
  line-height: 1.4;
}

.stop-switch-item .simple-label {
  margin-bottom: 2px;
}

.stop-switch-row {
  height: 34px;
  justify-content: flex-start;
  align-items: center;
}

@media (max-width: 900px) {
  .add-task-modal-card {
    width: calc(100vw - 20px);
    max-height: 90vh;
  }
  .add-task-modal-body {
    overflow-y: auto;
  }
  .simple-form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

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

/* 任务组模态框样式 */
.task-group-modal .modal-content {
  width: 500px;
  padding: 0;
}

.task-group-modal .simple-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-group-modal .simple-modal-body {
  padding: 24px;
}

.task-group-modal .simple-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  gap: 12px;
}

.task-form-input {
  width: 100%;
  height: 40px;
  padding: 0 15px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.task-form-input:focus {
  outline: none;
  border-color: #3b9cff;
  background: rgba(255, 255, 255, 0.08);
}

.task-form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
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

.map-name-prefix {
  color: rgba(103, 213, 253, 0.85);
  font-size: 14px;
  font-weight: 400;
  margin-right: 0;
  white-space: nowrap;
  padding: 0 8px;
}

.simple-modal-footer button {
  min-width: 80px;
}

.simple-close-icon {
  cursor: pointer;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s;
}

.simple-close-icon:hover {
  color: #fff;
}

/* PTZ控制按钮样式 */
.ptz-btn {
  width: 50px;
  height: 50px;
  background: #0099ff;
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  transition: 0.2s;
}

.ptz-btn:hover {
  background: #0077cc;
}

.ptz-btn:active {
  background: #0055aa;
}

.mission-btn-blue {
  background: #0099ff;
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
  padding: 8px 12px;
  transition: 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mission-btn-blue:hover {
  background: #0077cc;
}

.mission-btn-blue:active {
  background: #0055aa;
}
</style>
