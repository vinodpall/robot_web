<template>
  <div class="drone-control-main">
    <!-- 侧边栏菜单 -->
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: currentTab === tab.key }]"
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
          <!-- 展厅管理内容 -->
          <template v-if="currentTab === 'hall'">
          <div class="mission-top-card card">
            <div class="mission-top-header">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">展厅管理</span>
            </div>
            <div class="hall-toolbar">
              <div class="hall-toolbar-row">
                <div class="hall-actions">
                  <button
                    class="mission-btn mission-btn-pause hall-btn"
                    @click="isRecording ? stopHallRecording() : startHallRecording()"
                  >
                    {{ isRecording ? '停止地图录制' : '展厅地图录制' }}
                  </button>
                  <button
                    class="mission-btn mission-btn-pause hall-btn"
                    :disabled="isGenerateMapDisabled"
                    @click="handleGenerateMapClick()"
                  >
                    {{ generateMapButtonText }}
                  </button>
                </div>
                <div class="map-progress">
                  <div class="map-progress-track">
                    <div class="map-progress-fill" :style="{ width: mapGenProgress + '%' }"></div>
                  </div>
                  <span class="map-progress-text">{{ mapGenProgress }}%</span>
                </div>
              </div>
            </div>
            </div>
          <div class="hall-grid-card">
            <div class="hall-grid-header">
              <div class="grid-toolbar-compact">
                <div class="toolbar-left">
                  <span class="toolbar-label">展厅列表</span>
                  <div class="hall-select-container">
                    <select 
                      v-model="selectedHall" 
                      class="toolbar-select"
                      :disabled="isNavEnabled"
                    >
                      <option v-for="h in hallOptions" :key="h.id" :value="h.id">{{ h.name }}</option>
                    </select>
                    <button 
                      class="hall-delete-btn-inline"
                      :disabled="isNavEnabled || !selectedHall"
                      @click="deleteSelectedHall"
                      title="删除选中的展厅"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div class="toolbar-right">
                  <button class="toolbar-btn" :class="{ active: isEditMode }" @click="toggleEditMode" title="栅格图编辑">
                    <img :src="mapEditIcon" alt="编辑" class="btn-icon-img" />
                  </button>
                  <button class="toolbar-btn" :class="{ active: isRelocMode }" :disabled="!isNavEnabled" @click="toggleRelocMode" title="重定位">
                    <img :src="positionIcon" alt="重定位" class="btn-icon-img" />
                  </button>
                  <button class="toolbar-btn" @click="onUploadGrid" title="上传">
                    <img :src="mapUploadIcon" alt="上传" class="btn-icon-img" />
                  </button>
                </div>
              </div>
            </div>
            <div class="hall-grid-main">
              <div class="gridmap-container">
                <canvas ref="hallGridCanvas" class="grid-canvas"></canvas>
                <div v-show="isEditMode" class="edit-panel-right">
                  <div class="panel-tools">
                    <!-- 1. 拖动模式 -->
                    <div class="navigation-tools">
                      <div class="nav-item" :class="{ active: navMode === 'pan' }" @click="setNavMode('pan')" title="拖动模式">
                        <img :src="mapMoveIcon" alt="拖动模式" class="nav-icon-img" />
                      </div>
                    </div>
                    <!-- 2. 放大 -->
                    <div class="navigation-tools">
                      <div class="nav-item" @click="zoomIn" title="放大">
                        <img :src="mapMagnifyIcon" alt="放大" class="nav-icon-img" />
                      </div>
                    </div>
                    <!-- 3. 缩小 -->
                    <div class="navigation-tools">
                      <div class="nav-item" @click="zoomOut" title="缩小">
                        <img :src="mapReduceIcon" alt="缩小" class="nav-icon-img" />
                      </div>
                    </div>
                    <!-- 4. 画笔 -->
                    <div class="tool-group">
                      <div class="tool-item" :class="{ active: activeTool === 'pen' && navMode === 'edit' }" @click="setTool('pen')" title="画笔">
                        <img :src="mapPenIcon" alt="画笔" class="tool-icon-img" />
                      </div>
                    </div>
                    <!-- 5. 橡皮擦 -->
                    <div class="tool-group">
                      <div class="tool-item" :class="{ active: activeTool === 'eraser' && navMode === 'edit' }" @click="setTool('eraser')" title="橡皮擦">
                        <img :src="mapEraserIcon" alt="橡皮擦" class="tool-icon-img" />
                      </div>
                    </div>
                    <!-- 6. 撤销 -->
                    <div class="tool-actions">
                      <button class="action-btn" @click="undoEdit" :disabled="!canUndo" title="撤回">
                        <img :src="mapRollbackIcon" alt="撤回" class="action-icon-img" />
                      </button>
                    </div>
                    <!-- 7. 初始化 -->
                    <div class="tool-actions">
                      <button class="action-btn" @click="clearGridEdit" title="初始化">
                        <img :src="mapInitIcon" alt="重置" class="action-icon-img" />
                      </button>
                    </div>
                    <!-- 8. 大小滚动条 -->
                    <div class="tool-settings">
                      <div class="setting-item">
                        <label>大小</label>
                        <input type="range" min="1" max="20" v-model.number="brushSize" class="size-slider" />
                        <span class="size-value">{{ brushSize }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </template>

          <!-- 展区管理内容 -->
          <template v-if="currentTab === 'area'">
            <div class="mission-top-card card area-top-card">
              <div class="mission-top-header">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="mission-top-title">展区管理</span>
              </div>
              <div class="area-top-row">
                <div class="area-filter-section">
                  <span class="area-filter-label">所有展区</span>
                  <div class="custom-select-wrapper">
                    <select v-model="selectedAreaId" class="area-select">
                      <option v-for="area in areaList" :key="area.id" :value="area.id">
                        {{ area.name }}
                      </option>
                    </select>
                    <span class="custom-select-arrow">
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <div class="area-action-buttons">
                  <button 
                    class="mission-btn mission-btn-pause" 
                    @click="handleAddArea"
                  >新增展区</button>
                  <button 
                    class="mission-btn mission-btn-stop" 
                    @click="handleDeleteArea"
                    :disabled="!selectedAreaId"
                  >删除展区</button>
                  <button 
                    class="mission-btn mission-btn-normal" 
                    @click="handleAddTaskPoint"
                    :disabled="!selectedAreaId"
                  >新增任务点</button>
                </div>
              </div>
            </div>
            <div class="mission-table-card card">
              <div class="mission-table-header">
                <div class="mission-th">序号</div>
                <div class="mission-th">任务点名称</div>
                <div class="mission-th">讲解点位</div>
                <div class="mission-th">坐标X</div>
                <div class="mission-th">坐标Y</div>
                <div class="mission-th">角度</div>
                <div class="mission-th">点位类型</div>
                <div class="mission-th">机器人动作</div>
                <div class="mission-th">机器人朝向</div>
                <div class="mission-th">操作</div>
              </div>
              <div class="mission-table-body">
                <div v-if="!selectedAreaId || selectedAreaId === ''" class="empty-state">
                  <span>请选择展区查看任务点</span>
                </div>
                <div v-else-if="currentTaskPoints.length === 0" class="empty-state">
                  <span>当前展区暂无任务点</span>
                </div>
                <div v-else class="mission-tr" v-for="(point, idx) in currentTaskPoints" :key="point.id">
                  <div class="mission-td">{{ idx + 1 }}</div>
                  <div class="mission-td task-point-name-cell" :title="point.name">{{ point.name }}</div>
                  <div class="mission-td">{{ getPointNameByPointId(point.id) }}</div>
                  <div class="mission-td">{{ point.x }}</div>
                  <div class="mission-td">{{ point.y }}</div>
                  <div class="mission-td">{{ point.angle }}</div>
                  <div class="mission-td">{{ point.pointType }}</div>
                  <div class="mission-td">{{ point.robotAction }}</div>
                  <div class="mission-td">{{ point.robotDirection }}</div>
                  <div class="mission-td">
                    <div class="user-action-btns">
                      <button 
                        class="icon-btn move-btn" 
                        title="上移" 
                        @click="onClickMoveTaskPointUp(point)"
                        :disabled="idx === 0"
                      >
                        <img :src="upIcon" />
                      </button>
                      <button 
                        class="icon-btn move-btn" 
                        title="下移" 
                        @click="onClickMoveTaskPointDown(point)"
                        :disabled="idx === currentTaskPoints.length - 1"
                      >
                        <img :src="downIcon" />
                      </button>
                      <button class="icon-btn" title="编辑" @click="onClickEditTaskPoint(point)">
                        <img :src="editIcon" />
                      </button>
                      <button class="icon-btn" title="删除" @click="onClickDeleteTaskPoint(point)">
                        <img :src="deleteIcon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 展厅任务内容 -->
          <template v-if="currentTab === 'multitask'">
            <div class="mission-top-card card area-top-card">
              <div class="mission-top-header">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="mission-top-title">展厅任务</span>
              </div>
              <div class="area-top-row">
                <div class="area-left-section">
                  <div class="area-filter-section">
                    <span class="area-filter-label">展厅任务列表</span>
                    <div class="custom-select-wrapper">
                      <select v-model="selectedHallTaskList" class="area-select">
                        <option v-for="preset in hallTourPresets" :key="preset.id" :value="preset.id.toString()">
                          {{ preset.name }}
                        </option>
                      </select>
                      <span class="custom-select-arrow">
                        <svg width="12" height="12" viewBox="0 0 12 12">
                          <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div class="task-control-buttons">
                    <button 
                      class="mission-btn"
                      :class="isTaskExecuting ? 'mission-btn-stop' : 'mission-btn-pause'"
                      @click="handleTaskControlClick"
                      :disabled="!isTaskExecuting && (!selectedHallTaskList || !isNavEnabled)"
                    >
                      {{ isTaskExecuting ? '停止任务' : '开始任务' }}
                    </button>
                    <button 
                      class="mission-btn mission-btn-stop"
                      @click="handlePauseTask"
                      :disabled="!isTaskExecuting"
                    >
                      {{ isTaskPaused ? '恢复' : '暂停' }}
                    </button>
                  </div>
                </div>
                <div class="area-action-buttons">
                  <button 
                    class="mission-btn mission-btn-pause"
                    @click="handleAddHallTask"
                  >新增展厅任务</button>
                  <button 
                    class="mission-btn mission-btn-stop"
                    @click="handleDeleteHallTask"
                    :disabled="!selectedHallTaskList"
                  >删除展厅任务</button>
                  <button 
                    class="mission-btn mission-btn-pause"
                    @click="handleAddAreaTask"
                  >添加展区任务</button>
                </div>
              </div>
            </div>
            <div class="mission-table-card card">
              <div class="mission-table-header">
                <div class="mission-th" style="flex: 0 0 80px;">序号</div>
                <div class="mission-th" style="flex: 1;">展区名称</div>
                <div class="mission-th" style="flex: 0 0 120px;">任务点数量</div>
                <div class="mission-th" style="flex: 3;">任务点详情</div>
                <div class="mission-th" style="flex: 0 0 120px;">操作</div>
              </div>
              <div class="mission-table-body">
                <div v-if="!selectedHallTaskList" class="empty-state">
                  <span>请选择展厅任务查看详情</span>
                </div>
                <div v-else-if="tourStore.isLoadingItems" class="empty-state">
                  <span>加载中...</span>
                </div>
                <div v-else-if="currentMultiTasks.length === 0" class="empty-state">
                  <span>该任务暂无展区数据</span>
                </div>
                <div v-else class="mission-tr" v-for="(task, idx) in currentMultiTasks" :key="task.id">
                  <div class="mission-td" style="flex: 0 0 80px;">{{ task.seq }}</div>
                  <div class="mission-td" style="flex: 1;">{{ task.zoneName }}</div>
                  <div class="mission-td" style="flex: 0 0 120px;">{{ task.pointsCount }}</div>
                  <div class="mission-td points-detail-cell" style="flex: 3;">
                    <div class="points-visual-display">
                      <span 
                        v-for="(point, pIdx) in task.points.slice(0, 10)" 
                        :key="point.id" 
                        class="point-name-tag"
                        :class="getPointTypeClass(point)"
                      >
                        {{ getPointDisplayName(point) }}
                      </span>
                      <span v-if="task.points.length > 10" class="more-points-indicator">
                        +
                      </span>
                    </div>
                  </div>
                  <div class="mission-td" style="flex: 0 0 120px;">
                    <div class="user-action-btns">
                      <button 
                        class="icon-btn move-btn" 
                        title="上移" 
                        @click="onClickMoveTaskPresetUp(task)"
                        :disabled="idx === 0"
                      >
                        <img :src="upIcon" />
                      </button>
                      <button 
                        class="icon-btn move-btn" 
                        title="下移" 
                        @click="onClickMoveTaskPresetDown(task)"
                        :disabled="idx === currentMultiTasks.length - 1"
                      >
                        <img :src="downIcon" />
                      </button>
                      <button class="icon-btn" title="删除" @click="onClickDeleteTaskPreset(task)">
                        <img :src="deleteIcon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>
      </div>
    </main>
    <!-- 展区管理弹窗 -->
    <!-- 新增展区弹窗 -->
    <div v-if="showAddAreaDialog" class="custom-dialog-mask">
      <div class="custom-dialog">
        <div class="custom-dialog-title">{{ editingArea ? '编辑展区' : '新增展区' }}</div>
        <div class="custom-dialog-content">
          <div class="add-user-form">
            <div class="add-user-form-row">
              <label>展区名称：</label>
              <input 
                v-model="addAreaForm.name" 
                class="user-input" 
                placeholder="请输入展区名称" 
              />
            </div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-cancel" @click="handleCancelAddArea">取消</button>
          <button class="mission-btn mission-btn-pause" @click="handleConfirmAddArea">确定</button>
        </div>
      </div>
    </div>

    <!-- 新增任务点弹窗 -->
    <div v-if="showAddTaskPointDialog" class="custom-dialog-mask">
      <div class="custom-dialog">
        <div class="custom-dialog-title">{{ editingTaskPoint ? '编辑任务点' : '新增任务点' }}</div>
        <div class="custom-dialog-content">
          <div class="add-user-form">
            <div class="add-user-form-row">
              <label><span style="color: red;">*</span>任务点名称：</label>
              <input 
                v-model="addTaskPointForm.name" 
                class="user-input" 
                placeholder="请输入任务点名称"
                maxlength="20"
              />
            </div>
            <div class="add-user-form-row">
              <label>点位类型：</label>
              <div class="custom-select-wrapper">
                <select v-model="addTaskPointForm.pointType" class="user-select">
                  <option value="讲解点">讲解点</option>
                  <option value="辅助点">辅助点</option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                  </svg>
                </span>
              </div>
            </div>
            <div v-if="addTaskPointForm.pointType === '讲解点'" class="add-user-form-row">
              <label>讲解点位：</label>
              <div class="custom-select-wrapper">
                <select v-model="addTaskPointForm.pointNameId" class="user-select">
                  <option v-for="pointName in guideStore.pointNames" :key="pointName.id" :value="pointName.id">
                    {{ pointName.name }}
                  </option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                  </svg>
                </span>
              </div>
            </div>
            <div class="coordinates-with-refresh">
              <div class="coordinates-rows">
                <div class="add-user-form-row">
                  <label>X坐标：</label>
                  <input v-model.number="addTaskPointForm.x" type="number" step="0.01" class="user-input no-spinners" placeholder="请输入X坐标" />
                </div>
                <div class="add-user-form-row">
                  <label>Y坐标：</label>
                  <input v-model.number="addTaskPointForm.y" type="number" step="0.01" class="user-input no-spinners" placeholder="请输入Y坐标" />
                </div>
                <div class="add-user-form-row">
                  <label>角度：</label>
                  <input v-model.number="addTaskPointForm.angle" type="number" step="0.001" class="user-input no-spinners" placeholder="请输入角度(弧度值)" />
                </div>
              </div>
              <button 
                v-if="editingTaskPoint" 
                class="refresh-position-btn-slim" 
                @click="refreshPosition"
                title="刷新位置"
              >
                刷新位置
              </button>
            </div>
            <div class="add-user-form-row">
              <label>机器人动作：</label>
              <div class="custom-select-wrapper">
                <select v-model="addTaskPointForm.robotAction" class="user-select robot-action-select" :disabled="loadingRobotActions">
                  <option value="none">无</option>
                  <option 
                    v-for="action in robotActions" 
                    :key="action.id" 
                    :value="action.code"
                  >
                    {{ action.name }}
                  </option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                  </svg>
                </span>
              </div>
            </div>
            <div v-if="shouldShowHoldTime" class="add-user-form-row">
              <label>动作持续：</label>
              <div class="input-with-unit">
                <input 
                  v-model.number="addTaskPointForm.holdTime" 
                  type="number" 
                  step="0.1" 
                  min="0"
                  class="user-input no-spinners" 
                  placeholder="请输入持续时长"
                />
                <span class="input-unit">秒</span>
              </div>
            </div>
            <div class="add-user-form-row">
              <label>机器人朝向：</label>
              <div class="radio-group">
                <label class="radio-item">
                  <input type="radio" v-model="addTaskPointForm.robotDirection" value="前进" />
                  <span class="radio-label">前进</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="addTaskPointForm.robotDirection" value="后退" />
                  <span class="radio-label">后退</span>
                </label>
              </div>
            </div>
            <div class="add-user-form-row">
              <label>任务等待：</label>
              <div class="input-with-unit">
                <input 
                  v-model.number="addTaskPointForm.waitTime" 
                  type="number" 
                  step="1" 
                  min="0"
                  class="user-input no-spinners" 
                  placeholder="请输入等待时长"
                />
                <span class="input-unit">秒</span>
              </div>
            </div>
            <div class="add-user-form-row">
              <label>视频选择：</label>
              <div class="custom-select-wrapper">
                <select v-model="addTaskPointForm.videoId" class="user-select" :disabled="loadingVideos">
                  <option value="">无</option>
                  <option 
                    v-for="video in videoList" 
                    :key="video.id" 
                    :value="video.id.toString()"
                  >
                    {{ video.label }}
                  </option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                  </svg>
                </span>
              </div>
            </div>
            <div class="add-user-form-row">
              <label>到点不停：</label>
              <span 
                class="switch-container" 
                :class="{ active: addTaskPointForm.noWait }" 
                @click="addTaskPointForm.noWait = !addTaskPointForm.noWait"
              >
                <span class="switch-toggle"></span>
              </span>
            </div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-cancel" @click="handleCancelAddTaskPoint">取消</button>
          <button class="mission-btn mission-btn-pause" @click="handleConfirmAddTaskPoint">确定</button>
        </div>
      </div>
    </div>

    <!-- 访客类型选择弹窗 -->
    <div v-if="showVisitorTypeDialog" class="custom-dialog-mask">
      <div class="custom-dialog" data-dialog="start-task">
        <div class="custom-dialog-title">开始任务</div>
        <div class="custom-dialog-content">
          <div class="add-user-form">
            <div class="add-user-form-row">
              <label>讲解对象：</label>
              <div class="custom-select-wrapper">
                <select v-model="selectedVisitorType" class="user-select">
                  <option v-for="audience in availableAudiences" :key="audience.id" :value="audience.id.toString()">
                    {{ audience.name }}
                  </option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-cancel" @click="handleCancelStartTask">取消</button>
          <button class="mission-btn mission-btn-pause" @click="handleConfirmStartTask">确定</button>
        </div>
      </div>
    </div>

    <!-- 新增展厅任务弹窗 -->
    <div v-if="showAddHallTaskDialog" class="custom-dialog-mask">
      <div class="custom-dialog">
        <div class="custom-dialog-title">新增展厅任务</div>
        <div class="custom-dialog-content">
          <div class="add-user-form">
            <div class="add-user-form-row">
              <label>展厅任务名称：</label>
              <input v-model="addHallTaskForm.name" class="user-input" placeholder="请输入展厅任务名称" />
            </div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-cancel" @click="handleCancelAddHallTask">取消</button>
          <button class="mission-btn mission-btn-pause" @click="handleConfirmAddHallTask">确定</button>
        </div>
      </div>
    </div>

    <!-- 添加展区任务弹窗 -->
    <div v-if="showAddAreaTaskDialog" class="custom-dialog-mask add-area-task-dialog">
      <div class="custom-dialog">
        <div class="custom-dialog-title">添加展区任务</div>
        <div class="custom-dialog-content">
          <div class="add-user-form">
            <div class="add-user-form-row">
              <label>当前展厅：</label>
              <div class="current-hall-display">
                {{ getCurrentHallName() }}
              </div>
            </div>
            <div class="add-user-form-row">
              <label>展区：</label>
              <div class="custom-select-wrapper">
                <select v-model="selectedAreaForTask" class="user-select">
                  <option v-for="area in currentHallZones" :key="area.id" :value="area.id.toString()">
                    {{ area.name }}
                  </option>
                </select>
                <span class="custom-select-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-cancel" @click="handleCancelAddAreaTask">取消</button>
          <button class="mission-btn mission-btn-pause" @click="handleConfirmAddAreaTask">确定</button>
        </div>
      </div>
    </div>

    <!-- 地图录制弹窗 -->
    <div v-if="showRecordingDialog" class="custom-dialog-mask">
      <div class="custom-dialog">
        <div class="custom-dialog-title">展厅地图录制</div>
        <div class="custom-dialog-content">
          <div class="add-user-form">
            <div class="add-user-form-row">
              <label>展厅数据包名称：</label>
              <input 
                v-model="recordingForm.dataName" 
                type="text" 
                class="user-input" 
                placeholder="请输入数据包名称"
                maxlength="50"
              />
            </div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-cancel" @click="handleCancelRecording">取消</button>
          <button class="mission-btn mission-btn-pause" @click="handleConfirmStartRecording">开始录制</button>
        </div>
      </div>
    </div>

    <!-- 生成地图弹窗 -->
    <div v-if="showGenerateMapDialog" class="custom-dialog-mask" @click="isDataPackageSelectActive = false">
      <div class="custom-dialog" @click.stop>
        <div class="custom-dialog-title">生成展厅地图</div>
        <div class="custom-dialog-content">
          <div class="add-user-form">
            <div class="add-user-form-row data-package-row">
              <label>展厅数据包：</label>
              <div class="data-package-wrapper">
                <div class="custom-select-component">
                  <div class="custom-select-trigger" 
                       :class="{ 'is-active': isDataPackageSelectActive }"
                       @click.stop="toggleDataPackageSelect">
                    <span class="custom-select-value">
                      {{ generateMapForm.dataName ? processDataPackageName(generateMapForm.dataName) : '请选择数据包' }}
                    </span>
                    <span class="custom-select-arrow">
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                      </svg>
                    </span>
                  </div>
                  <div v-show="isDataPackageSelectActive" class="custom-select-dropdown" @click.stop>
                    <div class="custom-select-dropdown-list">
                      <div 
                        v-for="packageName in rawDataPackages" 
                        :key="packageName"
                        class="custom-select-dropdown-item"
                        :class="{ 'is-selected': generateMapForm.dataName === packageName }"
                        @click="selectDataPackage(packageName)">
                        {{ processDataPackageName(packageName) }}
                      </div>
                      <div v-if="rawDataPackages.length === 0" class="custom-select-dropdown-item is-disabled">
                        暂无数据包
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  class="mission-btn-delete-package icon-btn" 
                  @click="handleDeleteDataPackage"
                  :disabled="!generateMapForm.dataName"
                  title="删除选中的数据包">
                  <img :src="deleteIcon" />
                </button>
              </div>
            </div>
            <div class="add-user-form-row">
              <label>地图名称：</label>
              <input 
                v-model="generateMapForm.mapName" 
                type="text" 
                class="user-input" 
                placeholder="请输入地图名称"
                maxlength="50"
              />
            </div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-cancel" @click="handleCancelGenerateMap">取消</button>
          <button class="mission-btn mission-btn-pause" @click="handleConfirmGenerateMap">开始生成</button>
        </div>
      </div>
    </div>

    <!-- 删除数据包确认弹窗 -->
    <div v-if="showDeleteDataPackageDialog" class="custom-dialog-mask">
      <div class="custom-dialog delete-confirm-dialog">
        <div class="custom-dialog-title">删除确认</div>
        <div class="custom-dialog-content">
          <div class="delete-confirm-message">
            <div class="delete-icon">⚠️</div>
            <div class="delete-text">
              确定要删除数据包"{{ processDataPackageName(dataPackageToDelete) }}"吗？删除后无法恢复，请谨慎操作。
            </div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-stop" @click="confirmDeleteDataPackage">确认删除</button>
          <button class="mission-btn mission-btn-cancel" @click="showDeleteDataPackageDialog = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 停止录制成功提示弹窗 -->
    <div v-if="showStopRecordingSuccessDialog" class="custom-dialog-mask">
      <div class="custom-dialog stop-recording-success-dialog">
        <div class="custom-dialog-title">操作成功</div>
        <div class="custom-dialog-content">
          <div class="success-message">
            <div class="success-icon">✅</div>
            <div class="success-text">地图录制已停止</div>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-primary" @click="showStopRecordingSuccessDialog = false">确定</button>
        </div>
      </div>
    </div>

    <!-- 地图录制loading遮罩 -->
    <div v-if="recordingLoading" class="recording-loading-overlay">
      <div class="recording-loading-content">
        <div class="recording-loading-spinner"></div>
        <div class="recording-loading-text">{{ recordingLoadingText }}</div>
      </div>
    </div>

    <!-- 地图生成loading遮罩 -->
    <div v-if="generateMapLoading" class="generate-map-loading-overlay">
      <div class="generate-map-loading-content">
        <div class="generate-map-loading-spinner"></div>
        <div class="generate-map-loading-text">{{ generateMapLoadingText }}</div>
      </div>
    </div>

    <!-- 地图生成完成提示弹窗 -->
    <div v-if="showMapCompletionDialog" class="custom-dialog-mask">
      <div class="custom-dialog completion-dialog-compact">
        <div class="custom-dialog-content">
          <div class="completion-message-inline">
            <svg width="24" height="24" viewBox="0 0 24 24" class="completion-check-icon">
              <circle cx="12" cy="12" r="11" fill="#4CAF50"/>
              <path d="M7 12 L10 15 L17 8" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="completion-text-inline">地图生成完成，请等待栅格图生成...</span>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-pause" @click="closeMapCompletionDialog">确定</button>
        </div>
      </div>
    </div>

    <!-- 栅格图生成完成提示弹窗 -->
    <div v-if="showGridMapCompletionDialog" class="custom-dialog-mask">
      <div class="custom-dialog completion-dialog-compact">
        <div class="custom-dialog-content">
          <div class="completion-message-inline">
            <svg width="24" height="24" viewBox="0 0 24 24" class="completion-check-icon">
              <circle cx="12" cy="12" r="11" fill="#4CAF50"/>
              <path d="M7 12 L10 15 L17 8" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="completion-text-inline">栅格图生成完成</span>
          </div>
        </div>
        <div class="custom-dialog-actions">
          <button class="mission-btn mission-btn-pause" @click="closeGridMapCompletionDialog">确定</button>
        </div>
      </div>
    </div>

    <!-- 通用确认弹窗 -->
    <ConfirmDialog
      :show="confirmDialogState.show"
      :title="confirmDialogState.title"
      :message="confirmDialogState.message"
      @confirm="closeConfirmDialog(true)"
      @cancel="closeConfirmDialog(false)"
    />

    <!-- 通用结果弹窗 -->
    <ResultDialog
      :show="resultDialogState.show"
      :type="resultDialogState.type"
      :title="resultDialogState.title"
      :message="resultDialogState.message"
      :details="resultDialogState.details"
      @close="closeResultDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHallStore } from '../stores/hall'
import { useZoneStore } from '../stores/zone'
import { usePointStore } from '../stores/point'
import { useGuideStore } from '../stores/guide'
import { useTourStore } from '../stores/tour'
import { useUserStore } from '../stores/user'
import { useRobotStore } from '../stores/robot'
import { useWebSocketData } from '@/composables/useWebSocketData'
import { useWebSocketDataStore } from '@/stores/websocketData'
import { navigationApi, tourApi, getRobotActions } from '@/api/services'
import { API_BASE_URL } from '@/api/config'
import { downloadAndCacheMap, mapCache, getMapOriginInfo, worldToPixel, type MapOriginInfo } from '@/utils/mapCache'
import type { Zone, TourPreset } from '@/types'
import trackListIcon from '@/assets/source_data/svg_data/track_list.svg'
import taskAutoIcon from '@/assets/source_data/svg_data/robot_source/task_auto.svg'
import taskTimeIcon from '@/assets/source_data/svg_data/robot_source/task_time.svg'
import taskMultiIcon from '@/assets/source_data/svg_data/robot_source/task_multi.svg'
import areaIcon from '@/assets/source_data/robot_source/area.svg'
import hallIcon from '@/assets/source_data/robot_source/hall.svg'
import multiTaskIcon from '@/assets/source_data/robot_source/multi_task.svg'
import editIcon from '@/assets/source_data/svg_data/edit.svg'
import deleteIcon from '@/assets/source_data/svg_data/delete.svg'
import arrowUpIcon from '@/assets/source_data/control_data/arrow_up.svg'
import arrowDownIcon from '@/assets/source_data/control_data/arrow_down.svg'
import upIcon from '@/assets/source_data/control_data/up.svg'
import downIcon from '@/assets/source_data/control_data/down.svg'
// 导入地图编辑工具图标
import mapEditIcon from '@/assets/source_data/robot_source/map_edit.svg'
import mapUploadIcon from '@/assets/source_data/robot_source/map_upload.svg'
import mapPenIcon from '@/assets/source_data/robot_source/map_pen.svg'
import mapEraserIcon from '@/assets/source_data/robot_source/map_eraser.svg'
import mapMoveIcon from '@/assets/source_data/robot_source/map_move.svg'
import mapMagnifyIcon from '@/assets/source_data/robot_source/map_magnify.svg'
import mapReduceIcon from '@/assets/source_data/robot_source/map_reduce.svg'
import mapInitIcon from '@/assets/source_data/robot_source/map_init.svg'
import mapRollbackIcon from '@/assets/source_data/robot_source/map_rollback.svg'
import positionIcon from '@/assets/source_data/robot_source/position.svg'
// import { useWaylineJobs, useDevices } from '../composables/useApi'
// import { waylineApi } from '@/api/services'
// import { useDeviceStatus } from '../composables/useDeviceStatus'
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
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ResultDialog from '@/components/ResultDialog.vue'

const router = useRouter()
const route = useRoute()
const hallStore = useHallStore()
const zoneStore = useZoneStore()
const pointStore = usePointStore()
const guideStore = useGuideStore()
const tourStore = useTourStore()
const userStore = useUserStore()
const robotStore = useRobotStore()
const websocketDataStore = useWebSocketDataStore()

// 先从缓存恢复机器人数据，确保WebSocket连接使用正确的SN
robotStore.hydrateFromCache()
robotStore.initSelectedRobot()

// WebSocket数据获取
const getWebSocketSn = () => {
  const selectedRobot = robotStore.selectedRobot
  if (selectedRobot && selectedRobot.sn && selectedRobot.sn.trim()) {
    // console.log('Mission页面使用选中机器人的SN:', selectedRobot.sn)
    return selectedRobot.sn
  }
  // console.log('Mission页面使用broadcast SN')
  return 'broadcast'
}

const { getRobotCmdStatus, getRobotSlamProgress, getRobotPose, getRobotCurrentMap, getTourRunEvents, getRobotTourEvents, activeTourRuns } = useWebSocketData(
  {
    sn: getWebSocketSn(),
    kinds: ['cmd_status', 'pose', 'current_map', 'tour']
  },
  true,
  userStore.token || ''
)

// 当前选中的标签页
const currentTab = ref('hall')

// 展厅管理相关状态
const isRecording = ref(false)

// 进度条状态管理：确保进度只能增长，不会因多线程数据导致回退
const maxProgress = ref(0) // 记录已达到的最大进度
const lastResetTime = ref(0) // 记录上次重置时间，用于检测新的生成任务
const isMapGenerationActive = ref(false) // 标记是否正在生成地图

// 计算属性：展示的进度值，应用严格的只增不减防呆逻辑
const mapGenProgress = computed(() => {
  const currentSn = getWebSocketSn()
  let progress = getRobotSlamProgress(currentSn)
  
  // 如果当前SN没有数据，尝试使用broadcast
  if (progress === undefined && currentSn !== 'broadcast') {
    progress = getRobotSlamProgress('broadcast')
  }
  
  const currentProgress = progress || 0
  
  // 检测是否是新的生成任务（进度从较高值突然变为0或很低的值）
  if (currentProgress === 0 && maxProgress.value > 50 && !isMapGenerationActive.value) {
    // 任务已完成或重置，清空历史最大值
    maxProgress.value = 0
    hasShownCompletionDialog.value = false // 重置弹窗标记
    lastResetTime.value = Date.now()
    console.log('✓ 地图生成任务已完成或重置，清空进度')
    return 0
  }
  
  // 【核心防呆逻辑】使用 Math.max 确保进度永远只增不减
  const newMaxProgress = Math.max(maxProgress.value, currentProgress)
  
  // 更新最大进度并记录日志
  if (newMaxProgress > maxProgress.value) {
    console.log(`📈 进度更新: ${maxProgress.value}% → ${newMaxProgress}%`)
    maxProgress.value = newMaxProgress
  } else if (currentProgress < maxProgress.value) {
    console.log(`🛡️ 防呆生效: 收到 ${currentProgress}%，保持显示 ${maxProgress.value}%`)
  }
  
  // 限制在100%以内
  const finalProgress = Math.min(maxProgress.value, 100)
  maxProgress.value = finalProgress
  
  return finalProgress
})

// 计算属性：检查导航状态是否启用
const isNavEnabled = computed(() => {
  const currentSn = getWebSocketSn()
  let cmdStatus = getRobotCmdStatus(currentSn)
  
  // 如果当前SN没有数据，尝试使用broadcast
  if (!cmdStatus && currentSn !== 'broadcast') {
    cmdStatus = getRobotCmdStatus('broadcast')
  }
  
  return cmdStatus?.nav === 1
})

// 计算属性：获取当前地图名称
const currentMapName = computed(() => {
  const currentSn = getWebSocketSn()
  let currentMap = getRobotCurrentMap(currentSn)
  
  // 如果当前SN没有数据，尝试使用broadcast
  if (!currentMap && currentSn !== 'broadcast') {
    currentMap = getRobotCurrentMap('broadcast')
  }
  
  return currentMap?.map_name || ''
})

// 地图录制加载状态
const recordingLoading = ref(false)
const recordingLoadingText = ref('')

// 地图生成加载状态
const generateMapLoading = ref(false)
const generateMapLoadingText = ref('')

// 地图生成完成弹窗状态
const showMapCompletionDialog = ref(false)
const hasShownCompletionDialog = ref(false) // 标记是否已显示过完成弹窗（避免重复显示）

// 栅格图生成完成弹窗状态
const showGridMapCompletionDialog = ref(false)
const hasShownGridMapCompletionDialog = ref(false) // 标记是否已显示过栅格图完成弹窗

// 弹窗自动关闭定时器
let mapCompletionTimer: ReturnType<typeof setTimeout> | null = null
let gridMapCompletionTimer: ReturnType<typeof setTimeout> | null = null

// 通用确认弹窗状态
const confirmDialogState = ref({
  show: false,
  title: '',
  message: '',
  resolve: null as ((value: boolean) => void) | null
})

// 通用结果弹窗状态
const resultDialogState = ref({
  show: false,
  type: 'info' as 'success' | 'error' | 'info',
  title: '',
  message: '',
  details: '' as string | null
})

// 地图录制弹窗相关状态
const showRecordingDialog = ref(false)
const recordingForm = ref({
  dataName: ''
})
// 保存当前录制的数据包名称（用于停止录制时传递）
const currentRecordingDataName = ref('')

// 生成地图弹窗相关状态
const showGenerateMapDialog = ref(false)
const isGeneratingMap = ref(false)
const generateMapForm = ref({
  dataName: '',
  mapName: ''
})
const isDataPackageSelectActive = ref(false)

// 删除数据包确认弹窗状态
const showDeleteDataPackageDialog = ref(false)
const dataPackageToDelete = ref('')

// 停止录制成功提示弹窗状态
const showStopRecordingSuccessDialog = ref(false)

// 用户是否已提交生成请求（用于区分用户操作和系统状态）
const hasSubmittedGeneration = ref(false)

// 计算属性：按钮文字显示逻辑
const generateMapButtonText = computed(() => {
  const currentSn = getWebSocketSn()
  let cmdStatus = getRobotCmdStatus(currentSn)
  
  // 如果当前SN没有数据，尝试使用broadcast
  if (!cmdStatus && currentSn !== 'broadcast') {
    cmdStatus = getRobotCmdStatus('broadcast')
  }
  
  const slam = cmdStatus?.slam
  
  // 当slam=1时，显示"停止生成地图"
  if (slam === 1) {
    return '停止生成地图'
  }
  
  // 当slam=0或未定义时，显示"生成展厅地图"
  return '生成展厅地图'
})

// 计算属性：根据change_pcd状态决定生成地图按钮是否可用
const isGenerateMapDisabled = computed(() => {
  const currentSn = getWebSocketSn()
  let cmdStatus = getRobotCmdStatus(currentSn)
  
  // 如果当前SN没有数据，尝试使用broadcast
  if (!cmdStatus && currentSn !== 'broadcast') {
    cmdStatus = getRobotCmdStatus('broadcast')
  }
  
  const changePcd = cmdStatus?.change_pcd
  
  // console.log(`生成地图按钮状态 [${currentSn}]: change_pcd=${changePcd}, isRecording=${isRecording.value}`)
  
  // 如果change_pcd是1，按钮禁用（置灰）
  // 如果正在录制，按钮也禁用
  // change_pcd=0时按钮高亮（可用）
  return changePcd === 1 || isRecording.value
})

// 监听change_pcd状态变化
watch(() => {
  const currentSn = getWebSocketSn()
  let cmdStatus = getRobotCmdStatus(currentSn)
  if (!cmdStatus && currentSn !== 'broadcast') {
    cmdStatus = getRobotCmdStatus('broadcast')
  }
  return cmdStatus?.change_pcd
}, (newValue, oldValue) => {
  console.log(`change_pcd状态变化: ${oldValue} -> ${newValue}`)
  // 当change_pcd从0变成1时，重置提交状态
  if (oldValue === 0 && newValue === 1) {
    hasSubmittedGeneration.value = false
    console.log('检测到change_pcd变为1，重置hasSubmittedGeneration为false')
  }
  
  // 当change_pcd从1变成0时，调用同步接口并弹出栅格图完成提示
  if (oldValue === 1 && newValue === 0) {
    console.log('检测到change_pcd从1变为0，开始执行同步操作')
    handleSyncAfterPcdComplete()
    
    // 弹出栅格图生成完成提示
    if (!hasShownGridMapCompletionDialog.value) {
      console.log('🎉 栅格图生成完成，显示完成提示')
      hasShownGridMapCompletionDialog.value = true
      showGridMapCompletionDialog.value = true
      
      // 清除之前的定时器（如果存在）
      if (gridMapCompletionTimer) {
        clearTimeout(gridMapCompletionTimer)
      }
      // 设置5秒后自动关闭
      gridMapCompletionTimer = setTimeout(() => {
        console.log('栅格图完成弹窗5秒后自动关闭')
        closeGridMapCompletionDialog()
      }, 5000)
    }
  }
})

// 监听slam状态变化
watch(() => {
  const currentSn = getWebSocketSn()
  let cmdStatus = getRobotCmdStatus(currentSn)
  if (!cmdStatus && currentSn !== 'broadcast') {
    cmdStatus = getRobotCmdStatus('broadcast')
  }
  return cmdStatus?.slam
}, (newValue, oldValue) => {
  console.log(`slam状态变化: ${oldValue} -> ${newValue}`)
  // 当slam状态变化时，可以在这里添加额外的逻辑
  if (newValue === 0 && oldValue === 1) {
    console.log('🔴 地图生成已停止')
    isMapGenerationActive.value = false
    // 任务停止时不立即清空进度，保持最后的显示值
    
    // 弹出地图生成完成提示（等待栅格图生成）
    if (!hasShownCompletionDialog.value) {
      console.log('🎉 地图生成完成，等待栅格图生成')
      hasShownCompletionDialog.value = true
      showMapCompletionDialog.value = true
      
      // 清除之前的定时器（如果存在）
      if (mapCompletionTimer) {
        clearTimeout(mapCompletionTimer)
      }
      // 设置5秒后自动关闭
      mapCompletionTimer = setTimeout(() => {
        console.log('地图完成弹窗5秒后自动关闭')
        closeMapCompletionDialog()
      }, 5000)
    }
  } else if (newValue === 1 && oldValue === 0) {
    console.log('🟢 地图生成已开始')
    isMapGenerationActive.value = true
    // 重置进度条状态和弹窗标记
    maxProgress.value = 0
    lastResetTime.value = Date.now()
    hasShownCompletionDialog.value = false
    hasShownGridMapCompletionDialog.value = false
  }
})


// 可用的数据包列表（从API获取）
const availableDataPackages = ref<string[]>([])
const rawDataPackages = ref<string[]>([])

// 处理数据包名称，去掉@符号后面的时间戳和.bag后缀
const processDataPackageName = (packageName: string): string => {
  // 先去掉@符号后面的时间戳
  const atIndex = packageName.indexOf('@')
  let name = atIndex !== -1 ? packageName.substring(0, atIndex) : packageName
  
  // 再去掉.bag后缀
  if (name.endsWith('.bag')) {
    name = name.substring(0, name.length - 4)
  }
  
  return name
}

// 格式化后的数据包选项
const formattedDataPackages = computed(() => 
  rawDataPackages.value.map(packageName => processDataPackageName(packageName))
)

// 使用computed从hallStore获取展厅列表
const hallOptions = computed(() => 
  hallStore.halls.map(hall => ({
    id: hall.id.toString(),
    name: hall.nav_name, // 使用nav_name作为显示名称
    gridUrl: undefined // 可以后续添加网格图URL
  }))
)


// 使用全局展厅选择状态
const selectedHall = computed({
  get: () => hallStore.selectedHallId,
  set: (value) => hallStore.setSelectedHall(value)
})
const currentGridUrl = computed(() => hallOptions.value.find(h => h.id === selectedHall.value)?.gridUrl || '')

// 监听nav状态和当前地图变化，自动选择对应的展厅
watch([isNavEnabled, currentMapName, hallOptions], ([navEnabled, mapName, halls]) => {
  console.log(`nav状态变化: navEnabled=${navEnabled}, currentMapName=${mapName}`)
  
  if (navEnabled && mapName) {
    // 当导航启用且有当前地图时，查找对应的展厅
    const matchingHall = halls.find(hall => hall.name === mapName)
    if (matchingHall && selectedHall.value !== matchingHall.id) {
      console.log(`自动选择展厅: ${matchingHall.name} (${matchingHall.id})`)
      selectedHall.value = matchingHall.id
    }
  }
}, { immediate: true })

// 获取当前选中的展厅名称
const currentSelectedHallName = computed(() => {
  const hall = hallOptions.value.find(h => h.id === selectedHall.value)
  return hall ? hall.name : '未选择展厅'
})

// 获取当前展厅名称的函数（用于添加展区任务弹窗）
const getCurrentHallName = () => {
  return currentSelectedHallName.value
}

// 获取当前选中展厅的前缀（直接使用完整展厅名称）
const currentHallPrefix = computed(() => {
  const hall = hallOptions.value.find(h => h.id === selectedHall.value)
  return hall ? hall.name : ''
})

// 获取当前地图名称（用于下载地图）
const getCurrentMapName = () => {
  const hall = hallOptions.value.find(h => h.id === selectedHall.value)
  return hall ? hall.name : ''
}

// 下载并更新栅格地图
const downloadAndUpdateGridMap = async () => {
  const mapName = getCurrentMapName()
  if (!mapName) {
    console.warn('未找到当前展厅地图名称')
    return
  }

  try {
    console.log(`展厅切换，准备更新地图: ${mapName}`)
    
    // 检查缓存
    if (mapCache.isMapCached(mapName)) {
      console.log(`地图 ${mapName} 已在缓存中，直接渲染`)
    } else {
      console.log(`地图 ${mapName} 不在缓存中，将下载`)
    }
    
    // 重新渲染栅格图（会自动处理下载和缓存）
    await loadAndRenderHallPGM()
  } catch (error) {
    console.error('更新栅格地图失败:', error)
  }
}

// 监听展厅选择变化，处理相关数据更新
watch(() => hallStore.selectedHallId, async (newHallId) => {
  if (newHallId) {
    // 当展厅切换时，重新获取展区数据
    await fetchCurrentHallZones()
    
    // 重置展区选择为新展厅的第一个展区
    if (areaList.value.length > 0) {
      selectedAreaId.value = areaList.value[0].id
      console.log('展厅切换，重新选择展区:', selectedAreaId.value)
    } else {
      selectedAreaId.value = ''
    }
    
    // 重置展厅任务列表选择
    if (hallTourPresets.value.length > 0) {
      selectedHallTaskList.value = hallTourPresets.value[0].id.toString()
      console.log('展厅切换，重新选择展厅任务:', selectedHallTaskList.value)
    } else {
      selectedHallTaskList.value = ''
    }
    
    // 下载并更新栅格地图
    await downloadAndUpdateGridMap()
  }
}, { immediate: false })

// 栅格编辑相关
const isEditMode = ref(false)
const activeTool = ref<'pen' | 'eraser'>('pen')
const brushSize = ref(5)
const brushColor = ref('#000000') // 黑色表示障碍物
const navMode = ref<'edit' | 'pan'>('pan') // 导航模式：编辑或拖动，默认为拖动模式

// 重定位模式相关
const isRelocMode = ref(false)
const relocStartPoint = ref<{ x: number, y: number } | null>(null)
const relocCurrentMouse = ref<{ x: number, y: number } | null>(null)
const relocResult = ref<{ x: number, y: number, worldX: number, worldY: number, angle: number } | null>(null)

// 展区管理相关状态
interface Area {
  id: string
  name: string
  description: string
  createdTime: string
}

interface TaskPoint {
  id: string
  areaId: string
  name: string
  x: number
  y: number
  angle: number
  pointType: string // 点位类型：讲解点/辅助点
  robotAction: string // 机器人动作
  robotDirection: string // 机器人朝向：前进/后退
  commentary: string // 讲解词
  createdTime: string
}

interface MultiTask {
  id: string
  name: string
  taskType: string
  areaId: string
  areaName: string
  hallName: string
  status: 'waiting' | 'running' | 'completed' | 'failed'
  createdTime: string
  executeTime?: string
}

// 展厅任务详情表格的数据接口
interface TaskPresetDisplay {
  id: string
  seq: number
  zoneName: string
  hallName: string
  pointsCount: number
  enabledPointsCount: number
  zoneEnabled: boolean
  points: any[]
  createdTime: string
  status: string
}

// 当前展厅的展区数据状态
const currentHallZones = ref<Zone[]>([])
const loadingZones = ref(false)

// 获取当前选中展厅的展区数据
const fetchCurrentHallZones = async () => {
  if (!selectedHall.value) {
    currentHallZones.value = []
    return
  }
  
  try {
    loadingZones.value = true
  const hallId = typeof selectedHall.value === 'string' ? parseInt(selectedHall.value) : selectedHall.value
  
    console.log('获取展厅展区数据，展厅ID:', hallId)
    const zones = await zoneStore.fetchZones(false, hallId)
    currentHallZones.value = zones || []
    
    // 如果当前选中的展区不在新的展区列表中，重置选择
    if (selectedAreaId.value && !currentHallZones.value.find(z => z.id.toString() === selectedAreaId.value)) {
      selectedAreaId.value = currentHallZones.value.length > 0 ? currentHallZones.value[0].id.toString() : ''
    }
  } catch (error) {
    console.error('获取展区数据失败:', error)
    currentHallZones.value = []
  } finally {
    loadingZones.value = false
  }
}

// 从当前展厅的展区数据转换为Area格式以兼容现有UI
const areaList = computed(() => {
  return currentHallZones.value.map(zone => ({
    id: zone.id.toString(),
    name: zone.name,
    description: '', // API中没有description字段，暂时设为空
    createdTime: '' // API中没有createdTime字段，暂时设为空
  }))
})

// 从action_params中解析nav_mode获取机器人朝向
const parseRobotDirection = (actionParams: string | null): string => {
  if (!actionParams) return '前进' // 默认值
  
  try {
    const params = JSON.parse(actionParams)
    return params.nav_mode === -1 ? '后退' : '前进'
  } catch (error) {
    console.warn('解析action_params失败:', error)
    return '前进' // 解析失败时使用默认值
  }
}

// 从action_params中解析任务等待时间
const parseWaitTime = (actionParams: string | null): number => {
  if (!actionParams) return 0 // 默认值
  
  try {
    const params = JSON.parse(actionParams)
    return params.wait_time || 0
  } catch (error) {
    console.warn('解析任务等待时间失败:', error)
    return 0 // 解析失败时使用默认值
  }
}

// 从action_params中解析动作持续时间
const parseHoldTime = (actionParams: string | null): number => {
  if (!actionParams) return 1.5 // 默认值
  
  try {
    const params = JSON.parse(actionParams)
    return params.hold || 1.5
  } catch (error) {
    console.warn('解析动作持续时间失败:', error)
    return 1.5 // 解析失败时使用默认值
  }
}

// 从Point对象中获取视频ID
const getVideoIdFromPoint = (screenVideoId: number | null | undefined): string => {
  if (!screenVideoId) return '' // 默认值
  return screenVideoId.toString()
}

// 从API获取的任务点列表，根据当前选中的展区筛选
const selectedAreaId = ref<string>('') // 默认选择第一个展区
const currentTaskPoints = computed(() => {
  if (!selectedAreaId.value) return []
  
  // 将selectedAreaId从string转换为number（因为API使用数字ID）
  const zoneId = parseInt(selectedAreaId.value)
  
  // 根据当前选中的展区获取任务点列表
  const points = pointStore.getPointsByZoneId(zoneId)
  
  // 按seq从小到大排序，然后转换为TaskPoint格式以兼容现有UI
  return points
    .sort((a, b) => a.seq - b.seq)
    .map(point => {
      const pointName = guideStore.getPointNameById(point.point_name_id)
      
      return {
        id: point.id.toString(),
        areaId: point.zone_id.toString(),
        name: point.custom_name || pointName?.name || '未知点位', // 优先显示custom_name
        x: point.pose_x,
        y: point.pose_y,
        angle: point.pose_theta, // 直接使用theta原始值
        pointType: point.type === 'explain' ? '讲解点' : '辅助点',
        robotAction: getRobotActionName(point.action_code || undefined), // 获取动作中文名称
        robotDirection: parseRobotDirection(point.action_params), // 从action_params解析机器人朝向
        commentary: `点位${point.id}`, // API中没有此字段，使用默认值
        createdTime: '' // API中没有此字段，暂时设为空
      }
    })
})

// 弹窗状态
const showAddAreaDialog = ref(false)
const showAddTaskPointDialog = ref(false)
const editingArea = ref<Area | null>(null)
const editingTaskPoint = ref<TaskPoint | null>(null)

// 表单数据
const addAreaForm = ref({
  name: ''
})

// 视频字典数据接口
interface VideoDict {
  category: string
  code: string
  label: string
  value: string
  description: string
  sort: number
  is_active: boolean
  id: number
  created_at: string
}

// 视频列表状态
const videoList = ref<VideoDict[]>([])
const loadingVideos = ref(false)

const addTaskPointForm = ref({
  name: '', // 任务点名称
  pointNameId: '', // 讲解点位ID
  x: 0,
  y: 0,
  angle: 0,
  pointType: '讲解点',
  robotAction: 'none', // 默认为"无"
  holdTime: 1.5, // 动作持续，默认1.5秒
  robotDirection: '前进',
  waitTime: 0, // 任务等待，默认0秒
  videoId: '', // 视频选择，默认为空（无）
  noWait: false // 到点不停，默认关闭
})

// 机器人动作列表
const robotActions = ref<Array<{
  code: string
  name: string
  id: number
  recommended: boolean
}>>([])

const loadingRobotActions = ref(false)

// 获取机器人动作列表
const fetchRobotActions = async (showError: boolean = true) => {
  if (loadingRobotActions.value) return
  
  try {
    loadingRobotActions.value = true
    const token = userStore.token
    if (!token) {
      throw new Error('用户未登录')
    }
    
    const actions = await getRobotActions(token)
    robotActions.value = actions
    
    // 设置默认选择推荐的第一个动作
    const defaultAction = actions.find((action: any) => action.recommended)
    if (defaultAction && !addTaskPointForm.value.robotAction) {
      addTaskPointForm.value.robotAction = defaultAction.code
    }
    
    console.log('✅ 获取机器人动作列表成功:', actions)
  } catch (error) {
    console.error('❌ 获取机器人动作列表失败:', error)
    // 只有在明确要求显示错误时才弹窗
    if (showError) {
      console.warn('获取机器人动作列表失败，将使用默认动作')
    }
    // 不再抛出错误，允许继续执行
  } finally {
    loadingRobotActions.value = false
  }
}

// 根据动作 code 获取中文名称
const getRobotActionName = (actionCode?: string): string => {
  if (!actionCode || actionCode === 'none') return '无'
  
  const action = robotActions.value.find(a => a.code === actionCode)
  return action?.name || actionCode // 如果找不到名称，返回code
}

// 判断是否需要显示动作持续时间输入框
// 只有选择了特定的讲解姿势时才显示
const shouldShowHoldTime = computed(() => {
  if (!addTaskPointForm.value.robotAction || addTaskPointForm.value.robotAction === 'none') {
    return false
  }
  
  const action = robotActions.value.find(a => a.code === addTaskPointForm.value.robotAction)
  if (!action) return false
  
  // 只有这四种讲解姿势才显示动作持续时间
  const allowedActions = ['左侧讲解姿势', '右侧讲解姿势', '左下讲解姿势', '右下讲解姿势']
  return allowedActions.includes(action.name)
})

// 获取视频字典列表
const fetchVideoList = async () => {
  if (loadingVideos.value) return
  
  try {
    loadingVideos.value = true
    const token = userStore.token
    if (!token) {
      throw new Error('用户未登录')
    }
    
    const baseUrl = API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`
    const response = await fetch(`${baseUrl}/guide/dicts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`获取视频列表失败: ${response.status}`)
    }
    
    const data = await response.json()
    // 只保留category为video的数据
    videoList.value = data.filter((item: VideoDict) => item.category === 'video' && item.is_active)
    
    console.log('✅ 获取视频列表成功:', videoList.value)
  } catch (error) {
    console.error('❌ 获取视频列表失败:', error)
  } finally {
    loadingVideos.value = false
  }
}

// 监听点位类型变化，当选择辅助点时清空讲解点位选择
watch(() => addTaskPointForm.value.pointType, (newPointType) => {
  if (newPointType === '辅助点') {
    // 选择辅助点时，清空讲解点位选择
    addTaskPointForm.value.pointNameId = ''
  } else if (newPointType === '讲解点' && !addTaskPointForm.value.pointNameId) {
    // 选择讲解点且当前没有选择讲解点位时，自动选择第一个
    if (guideStore.pointNames.length > 0) {
      addTaskPointForm.value.pointNameId = guideStore.pointNames[0].id.toString()
    }
  }
})

// 监听讲解点位变化，智能同步任务点名称
watch(() => addTaskPointForm.value.pointNameId, (newPointNameId, oldPointNameId) => {
  // 只在点位类型为讲解点时处理
  if (addTaskPointForm.value.pointType !== '讲解点' || !newPointNameId) {
    return
  }
  
  // 获取旧的讲解点位名称
  let oldPointName = ''
  if (oldPointNameId) {
    const oldPoint = guideStore.getPointNameById(parseInt(oldPointNameId))
    oldPointName = oldPoint?.name || ''
  }
  
  // 获取新的讲解点位名称
  const newPoint = guideStore.getPointNameById(parseInt(newPointNameId))
  const newPointName = newPoint?.name || ''
  
  // 如果当前任务点名称为空，或者与旧的讲解点位名称一致，则自动同步新的讲解点位名称
  if (!addTaskPointForm.value.name || addTaskPointForm.value.name === oldPointName) {
    addTaskPointForm.value.name = newPointName
  }
  // 否则说明用户自定义了名称，不自动修改
})

// 多任务管理相关数据
const multiTaskList = ref<MultiTask[]>([
  { id: '1', name: '巡检任务A', taskType: '巡检', areaId: '1', areaName: 'abc_23', hallName: '展厅ABC', status: 'completed', createdTime: '2024-01-15 09:00:00', executeTime: '2024-01-15 09:30:00' },
  { id: '2', name: '讲解任务B', taskType: '讲解', areaId: '2', areaName: 'abc_45', hallName: '展厅ABC', status: 'running', createdTime: '2024-01-16 10:00:00', executeTime: '2024-01-16 10:15:00' },
  { id: '3', name: '拍照任务C', taskType: '拍照', areaId: '3', areaName: 'def_12', hallName: '展厅DEF', status: 'waiting', createdTime: '2024-01-17 11:00:00' },
  { id: '4', name: '清洁任务D', taskType: '清洁', areaId: '4', areaName: 'ghi_89', hallName: '展厅GHI', status: 'failed', createdTime: '2024-01-18 14:00:00', executeTime: '2024-01-18 14:20:00' }
])

// 根据当前选中展厅获取展厅任务预设列表
const hallTourPresets = computed(() => {
  if (!selectedHall.value) return []
  
  const hallId = typeof selectedHall.value === 'string' ? parseInt(selectedHall.value) : selectedHall.value
  return tourStore.getTourPresetsByHallId(hallId)
})

const selectedHallTaskList = ref<string>('') // 默认选择第一个任务列表

// 监听展厅任务预设列表变化，自动选中第一个
watch(hallTourPresets, (newPresets) => {
  // 如果列表有值且当前没有选中任务，自动选中第一个
  if (newPresets && newPresets.length > 0 && !selectedHallTaskList.value) {
    selectedHallTaskList.value = newPresets[0].id.toString()
    console.log('自动选中第一个展厅任务:', newPresets[0].name)
  }
  // 如果当前选中的任务已被删除（不在列表中），则清空选择或选中第一个
  else if (selectedHallTaskList.value && newPresets && newPresets.length > 0) {
    const currentExists = newPresets.some(p => p.id.toString() === selectedHallTaskList.value)
    if (!currentExists) {
      selectedHallTaskList.value = newPresets[0].id.toString()
      console.log('当前任务已删除，自动选中第一个:', newPresets[0].name)
    }
  }
  // 如果列表为空，清空选择
  else if (!newPresets || newPresets.length === 0) {
    selectedHallTaskList.value = ''
  }
}, { immediate: true })

// 当选中的展厅任务改变时，获取任务详情
watch(selectedHallTaskList, async (newTaskId) => {
  if (newTaskId) {
    try {
      console.log('展厅任务选择改变，获取任务详情:', newTaskId)
      await tourStore.fetchTourPresetItems(parseInt(newTaskId))
    } catch (error) {
      console.error('获取展厅任务详情失败:', error)
    }
  } else {
    // 清空任务详情
    tourStore.clearPresetItems()
  }
}, { immediate: false })

// 将任务预设详情转换为表格显示格式
const currentMultiTasks = computed((): TaskPresetDisplay[] => {
  if (!tourStore.currentPresetItems || tourStore.currentPresetItems.length === 0) {
    return []
  }
  
  // 按seq从小到大排序，然后序号从1开始显示
  return tourStore.currentPresetItems
    .sort((a, b) => a.seq - b.seq)
    .map((item, index) => ({
      id: item.id.toString(),
      seq: index + 1, // 显示序号从1开始
      zoneName: item.zone_name,
      hallName: item.hall_alias || item.hall_nav_name,
      pointsCount: item.points_count,
      enabledPointsCount: item.enabled_points_count,
      zoneEnabled: item.zone_enabled,
      points: item.points,
      createdTime: '', // API没有提供此字段
      status: item.zone_enabled ? 'enabled' : 'disabled'
    }))
})

// 任务控制相关数据
const taskRunning = ref<boolean>(false)
const showVisitorTypeDialog = ref<boolean>(false)
const selectedVisitorType = ref<string>('')

// 使用computed从guideStore获取讲解对象列表
const availableAudiences = computed(() => 
  guideStore.audiences.map(audience => ({
    id: audience.id,
    name: audience.name
  }))
)

// 新增展厅任务相关数据
const showAddHallTaskDialog = ref<boolean>(false)
const addHallTaskForm = ref({
  name: ''
})

// 添加展区任务相关数据
const showAddAreaTaskDialog = ref<boolean>(false)
const selectedAreaForTask = ref<string>('')

const toggleEditMode = () => { 
  isEditMode.value = !isEditMode.value
  // 切换到编辑模式时，关闭重定位模式
  if (isEditMode.value && isRelocMode.value) {
    isRelocMode.value = false
    resetRelocState()
  }
  setupCanvasEditEvents()
}

// 切换重定位模式
const toggleRelocMode = () => {
  // 检查导航是否开启
  if (!isNavEnabled.value) {
    showErrorMessage('请先开启导航后再使用重定位功能')
    return
  }
  
  isRelocMode.value = !isRelocMode.value
  // 切换到重定位模式时，关闭编辑模式
  if (isRelocMode.value && isEditMode.value) {
    isEditMode.value = false
  }
  
  // 开启重定位模式时显示操作提示
  if (isRelocMode.value) {
    resultDialogState.value = {
      show: true,
      type: 'info',
      title: '重定位操作说明',
      message: '',
      details: '请按照以下步骤进行重定位操作：\n\n1. 请在开启导航的情况下操作\n\n2. 在地图上单击机器人当前的实际位置\n\n3. 然后朝一个方向移动鼠标\n\n4. 再次点击完成操作'
    }
  }
  
  resetRelocState()
  setupCanvasEditEvents()
}

// 重置重定位状态
const resetRelocState = () => {
  relocStartPoint.value = null
  relocCurrentMouse.value = null
  // 重新渲染以清除箭头（只在有数据的情况下）
  if (missionGridImageData && hallGridCanvas.value) {
    drawMissionRobotPosition()
  }
}

// 展厅选择处理函数
const selectHall = (hallId: string) => {
  hallStore.setSelectedHall(hallId)
}

// 删除选中的展厅处理函数
const deleteSelectedHall = async () => {
  if (!selectedHall.value) {
    showErrorMessage('请先选择要删除的展厅')
    return
  }
  
  const selectedHallInfo = hallOptions.value.find(h => h.id === selectedHall.value)
  if (!selectedHallInfo) {
    showErrorMessage('未找到选中的展厅信息')
    return
  }
  
  const confirmed = await showConfirmDialog('删除确认', `确定要删除展厅"${selectedHallInfo.name}"吗？此操作将删除该展厅的地图数据，无法恢复。`)
  if (!confirmed) {
    return
  }
  
  try {
    const token = userStore.token
    if (!token) {
      showErrorMessage('未找到认证token')
      return
    }
    
    // 获取当前机器人SN
    const currentSn = getWebSocketSn()
    
    // 调用删除地图API
    await navigationApi.deleteMap(token, {
      sn: currentSn,
      map_name: selectedHallInfo.name,
      timeout: 10
    })
    
    // 删除成功后，调用同步接口
    try {
      await navigationApi.syncFromNav(token, {
        sn: currentSn,
        timeout: 10
      })
      console.log('展厅同步成功')
    } catch (syncError) {
      console.warn('展厅同步失败，但删除操作已成功:', syncError)
      // 同步失败不影响删除成功的提示
    }
    
    // 重新加载展厅列表（强制刷新）
    await hallStore.fetchHalls(true)
    
    // 重新选择第一个展厅
    if (hallOptions.value.length > 0) {
      hallStore.setSelectedHall(hallOptions.value[0].id)
    } else {
      hallStore.setSelectedHall('')
    }
    
    showSuccessMessage(`展厅"${selectedHallInfo.name}"删除成功`)
    console.log('展厅删除成功:', selectedHallInfo.name)
  } catch (error) {
    console.error('删除展厅失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '删除展厅失败')
  }
}

// 处理change_pcd完成后的同步操作
const handleSyncAfterPcdComplete = async () => {
  try {
    const token = userStore.token
    if (!token) {
      console.warn('未找到认证token，无法执行同步操作')
      return
    }
    
    // 获取当前机器人SN
    const currentSn = getWebSocketSn()
    
    console.log('开始执行展厅同步操作...')
    
    // 调用同步接口，参考删除按钮的逻辑
    await navigationApi.syncFromNav(token, {
      sn: currentSn,
      timeout: 10
    })
    
    console.log('展厅同步成功')
    
    // 重新加载展厅列表（强制刷新），触发展厅列表刷新
    await hallStore.fetchHalls(true)
    console.log('展厅列表刷新完成')
    
  } catch (error) {
    console.error('change_pcd完成后同步操作失败:', error)
    // 同步失败不需要弹出错误提示，只记录日志
  }
}

// 删除展厅处理函数（保留用于向后兼容）
const deleteHall = async (hall: { id: string, name: string }) => {
  const confirmed = await showConfirmDialog('删除确认', `确定要删除展厅"${hall.name}"吗？此操作将删除该展厅的地图数据，无法恢复。`)
  if (!confirmed) {
    return
  }
  
  try {
    const token = userStore.token
    if (!token) {
      showErrorMessage('未找到认证token')
      return
    }
    
    // 获取当前机器人SN
    const currentSn = getWebSocketSn()
    
    // 调用删除地图API
    await navigationApi.deleteMap(token, {
      sn: currentSn,
      map_name: hall.name,
      timeout: 10
    })
    
    // 删除成功后，调用同步接口
    try {
      await navigationApi.syncFromNav(token, {
        sn: currentSn,
        timeout: 10
      })
      console.log('展厅同步成功')
    } catch (syncError) {
      console.warn('展厅同步失败，但删除操作已成功:', syncError)
      // 同步失败不影响删除成功的提示
    }
    
    // 重新加载展厅列表（强制刷新）
    await hallStore.fetchHalls(true)
    
    // 如果删除的是当前选中的展厅，重新选择第一个展厅
    if (selectedHall.value === hall.id) {
      if (hallOptions.value.length > 0) {
        hallStore.setSelectedHall(hallOptions.value[0].id)
      } else {
        hallStore.setSelectedHall('')
      }
    }
    
    showSuccessMessage(`展厅"${hall.name}"删除成功`)
    console.log('展厅删除成功:', hall.name)
  } catch (error) {
    console.error('删除展厅失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '删除展厅失败')
  }
}
const setTool = (tool: 'pen' | 'eraser') => { 
  activeTool.value = tool
  navMode.value = 'edit'
}

const setNavMode = (mode: 'edit' | 'pan') => { 
  navMode.value = mode
  // 切换到拖动模式时，取消工具选中状态的视觉反馈
  if (mode === 'pan') {
    // 工具按钮不会显示为选中状态，但保持内部状态
  }
}

// 缩放和导航方法
let currentScale = 1
let currentOffsetX = 0
let currentOffsetY = 0

const zoomIn = () => {
  const canvas = hallGridCanvas.value
  if (!canvas) return
  currentScale = Math.min(5, currentScale * 1.2)
  applyTransform()
}

const zoomOut = () => {
  const canvas = hallGridCanvas.value
  if (!canvas) return
  currentScale = Math.max(0.2, currentScale / 1.2)
  applyTransform()
}

const resetZoom = () => {
  const canvas = hallGridCanvas.value
  if (!canvas) return
  currentScale = 1
  currentOffsetX = 0
  currentOffsetY = 0
  applyTransform()
}

const applyTransform = () => {
  const canvas = hallGridCanvas.value
  if (!canvas) return
  const parent = canvas.parentElement as HTMLElement
  if (!parent) return
  
  const sw = parent.clientWidth
  const sh = parent.clientHeight
  const baseScale = Math.min(sw / canvas.width, sh / canvas.height)
  const finalScale = baseScale * currentScale
  
  canvas.style.width = `${Math.floor(canvas.width * finalScale)}px`
  canvas.style.height = `${Math.floor(canvas.height * finalScale)}px`
  
  const centerX = (sw - canvas.width * finalScale) / 2 + currentOffsetX
  const centerY = (sh - canvas.height * finalScale) / 2 + currentOffsetY
  
  canvas.style.transform = `translate(${centerX}px, ${centerY}px)`
}
const onUploadGrid = async () => {
  // 二次确认提示
  const shouldUpload = await showConfirmDialog(
    '确认上传', 
    '确认要将当前编辑后的栅格图上传到服务器吗？\n\n上传后将覆盖服务器上的原始栅格图文件。'
  )
  if (!shouldUpload) return
  
  try {
    // 获取当前编辑后的栅格图数据
    const canvas = hallGridCanvas.value
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      showErrorMessage('无法获取栅格图数据')
      return
    }
    
    // 使用保存的ImageData而不是从canvas读取，避免将机器人图标当作障碍物
    const imageDataToUpload = gridImageData || missionGridImageData
    if (!imageDataToUpload) {
      showErrorMessage('无法获取栅格图数据')
      return
    }
    
    // 将ImageData转换为PGM格式的二进制数据
    const pgmData = await canvasToPGM(canvas, imageDataToUpload)
    console.log('PGM数据生成完成，大小:', pgmData.length)
    
    try {
      // 上传到指定路径
      await uploadGridToServer(pgmData)
      showSuccessMessage('栅格图上传成功！')
      
      // 上传成功后的清理工作，即使失败也不影响上传成功的提示
      try {
        // 清空编辑历史
        editHistory.value.length = 0
        
        // 直接用上传的数据更新本地缓存（而不是清除后重新下载）
        const mapName = getCurrentMapName()
        if (mapName) {
          // 将Uint8Array转换为ArrayBuffer
          const arrayBuffer = pgmData.buffer.slice(pgmData.byteOffset, pgmData.byteOffset + pgmData.byteLength)
          
          // 更新缓存
          const cacheSuccess = mapCache.cacheMap(mapName, arrayBuffer)
          if (cacheSuccess) {
            console.log('✅ 本地缓存已更新为上传的栅格图')
          } else {
            console.warn('⚠️ 更新本地缓存失败，但文件已上传成功')
          }
        }
        
        // 退出编辑模式
        isEditMode.value = false
        
        // 重新加载栅格图（从刚更新的缓存中加载）
        setTimeout(() => {
          loadAndRenderHallPGM()
        }, 100)
      } catch (cleanupError) {
        console.warn('上传成功，但清理操作失败:', cleanupError)
      }
      
    } catch (uploadError) {
      console.error('上传失败:', uploadError)
      showErrorMessage('栅格图上传失败，请重试')
    }
    
  } catch (error) {
    console.error('处理失败:', error)
    showErrorMessage('栅格图处理失败，请重试')
  }
}

// 将ImageData转换为PGM格式的二进制数据
const canvasToPGM = async (canvas: HTMLCanvasElement, imageData: ImageData): Promise<Uint8Array> => {
  const width = canvas.width
  const height = canvas.height
  
  // PGM文件头
  const header = `P5\n${width} ${height}\n255\n`
  const headerBytes = new TextEncoder().encode(header)
  
  // 像素数据（灰度值）
  const pixelData = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = imageData.data[i * 4]
    const g = imageData.data[i * 4 + 1] 
    const b = imageData.data[i * 4 + 2]
    // 转换为灰度值
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    pixelData[i] = gray
  }
  
  // 合并头部和像素数据
  const pgmData = new Uint8Array(headerBytes.length + pixelData.length)
  pgmData.set(headerBytes, 0)
  pgmData.set(pixelData, headerBytes.length)
  
  return pgmData
}

// 上传栅格图到服务器
const uploadGridToServer = async (pgmData: Uint8Array) => {
  // 获取必要参数
  const sn = getWebSocketSn()
  const mapName = getCurrentMapName()
  const token = userStore.token || localStorage.getItem('token') || ''
  
  if (!sn) {
    throw new Error('无法获取设备SN')
  }
  
  if (!mapName) {
    throw new Error('无法获取当前地图名称')
  }
  
  if (!token) {
    throw new Error('未登录或token已过期，请重新登录')
  }
  
  // 创建FormData用于文件上传
  const formData = new FormData()
  const blob = new Blob([pgmData], { type: 'application/octet-stream' })
  const filename = 'gridMap.pgm'
  formData.append('file_obj', blob, filename)
  
  // 构建完整的API URL
  const baseUrl = API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`
  const params = new URLSearchParams({
    sn: sn,
    map_name: mapName,
    dest_file: 'gridMap.pgm',
    backup: 'true'
  })
  
  const uploadUrl = `${baseUrl}/navigation/maps/upload?${params.toString()}`
  
  console.log('栅格图上传URL:', uploadUrl)
  console.log('上传参数 - sn:', sn, 'map_name:', mapName)
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  console.log('栅格图上传响应状态:', response.status)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('栅格图上传失败:', errorData)
    throw new Error(`上传失败: ${response.status} ${response.statusText}`)
  }
  
  // 尝试解析JSON响应
  let result = null
  try {
    const text = await response.text()
    console.log('栅格图上传响应原始内容:', text)
    
    if (text && text.trim()) {
      result = JSON.parse(text)
      console.log('栅格图上传成功，响应数据:', result)
      
      // 检查响应中的saved字段
      if (result.saved === true) {
        console.log('✅ 服务器确认文件已保存:', result.path)
      }
    } else {
      console.log('栅格图上传成功（无响应内容）')
    }
  } catch (parseError) {
    console.warn('响应解析失败，但HTTP状态码表示成功:', parseError)
    console.log('原始响应可能不是JSON格式')
  }
  
  return result
}

// 下载PGM文件到本地
const downloadPGMToLocal = (pgmData: Uint8Array) => {
  try {
    console.log('开始下载PGM文件，数据大小:', pgmData.length, '字节')
    
    // 尝试多种MIME类型，提高兼容性
    const blob = new Blob([pgmData], { type: 'application/octet-stream' })
    
    // 检查浏览器是否支持下载（IE浏览器）
    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      // IE浏览器
      (window.navigator as any).msSaveOrOpenBlob(blob, 'gridMap.pgm')
      console.log('使用IE下载方式')
      return
    }
    
    const url = URL.createObjectURL(blob)
    console.log('创建下载链接:', url)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'gridMap.pgm'
    link.style.display = 'none'
    link.target = '_blank'
    
    // 添加到DOM
    document.body.appendChild(link)
    
    // 模拟用户点击
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    
    console.log('准备触发下载...')
    link.dispatchEvent(clickEvent)
    
    // 延迟清理
  setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(url)
      console.log('下载链接已清理')
  }, 1000)
    
    console.log('下载已触发')
    
  } catch (error) {
    console.error('下载失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    showErrorMessage('文件下载失败: ' + errorMessage)
  }
}

// 地图录制相关函数
const startHallRecording = () => {
  // 打开输入弹窗
  recordingForm.value.dataName = ''
  showRecordingDialog.value = true
}

const stopHallRecording = async () => {
  // 如果正在加载中，阻止重复点击
  if (recordingLoading.value) {
    return
  }

  try {
    const token = userStore.token
    if (!token) {
      showErrorMessage('未找到认证token')
      return
    }

    // 设置加载状态
    recordingLoadingText.value = '地图录制停止中...'
    recordingLoading.value = true

    // 停止录包
    const slamData = {
      sn: getWebSocketSn(),
      map_name: '',
      action: 0,
      data_name: currentRecordingDataName.value,
      timeout: 10  // 添加timeout参数，默认10秒
    }

    const response = await navigationApi.slamControl(token, slamData)
    
    // 检查返回值的error_code
    if (response.error_code !== 0) {
      const errorMsg = response.error_msg || '停止录制失败'
      showErrorMessage(errorMsg)
      return
    }
    
    isRecording.value = false
    // 清空保存的数据包名称
    currentRecordingDataName.value = ''
    // 显示停止录制成功弹窗
    showStopRecordingSuccessDialog.value = true
  } catch (error) {
    console.error('停止地图录制失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '停止地图录制失败')
  } finally {
    // 确保加载状态被清除
    recordingLoading.value = false
  }
}

// 确认开始录制
const handleConfirmStartRecording = async () => {
  if (!recordingForm.value.dataName.trim()) {
    showErrorMessage('请输入展厅数据包名称')
    return
  }

  // 如果正在加载中，阻止重复点击
  if (recordingLoading.value) {
    return
  }

  try {
    const token = userStore.token
    if (!token) {
      showErrorMessage('未找到认证token')
      return
    }

    // 设置加载状态
    recordingLoadingText.value = '地图录制启动中...'
    recordingLoading.value = true

    // 开始录包
    const slamData = {
      sn: getWebSocketSn(),
      map_name: '',
      action: 1,
      data_name: recordingForm.value.dataName.trim(),
      timeout: 10  // 添加timeout参数，默认10秒
    }

    const response = await navigationApi.slamControl(token, slamData)
    
    // 检查返回值的error_code
    if (response.error_code !== 0) {
      // 错误消息翻译映射
      const errorMessageMap: Record<string, string> = {
        'Directory with the same name already exists.': '数据包名称已存在，请使用其他名称',
        'Recording is already in progress.': '录制已在进行中',
        'Invalid data name.': '数据包名称无效'
      }
      
      const errorMsg = errorMessageMap[response.error_msg] || response.error_msg || '地图录制失败'
      showErrorMessage(errorMsg)
      return
    }
    
    isRecording.value = true
    // 保存当前录制的数据包名称
    currentRecordingDataName.value = recordingForm.value.dataName.trim()
    showRecordingDialog.value = false
    showSuccessMessage(`地图录制已开始\n数据包名称：${recordingForm.value.dataName}`)
  } catch (error) {
    console.error('开始地图录制失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '开始地图录制失败')
  } finally {
    // 确保加载状态被清除
    recordingLoading.value = false
  }
}

// 取消录制
const handleCancelRecording = () => {
  showRecordingDialog.value = false
  recordingForm.value.dataName = ''
}
// 生成地图相关函数
// 处理生成地图按钮点击
const handleGenerateMapClick = async () => {
  const currentSn = getWebSocketSn()
  let cmdStatus = getRobotCmdStatus(currentSn)
  
  // 如果当前SN没有数据，尝试使用broadcast
  if (!cmdStatus && currentSn !== 'broadcast') {
    cmdStatus = getRobotCmdStatus('broadcast')
  }
  
  const slam = cmdStatus?.slam
  
  if (slam === 1) {
    // 如果slam=1，表示正在生成地图，执行停止操作
    await stopGenerateHallMap()
  } else {
    // 如果slam=0或未定义，启动生成流程
    await startGenerateHallMap()
  }
}

const startGenerateHallMap = async () => {
  // 先加载数据包列表
  await loadDataPackages()
  
  // 打开生成地图弹窗，默认选择第一个数据包
  generateMapForm.value.dataName = rawDataPackages.value.length > 0 ? rawDataPackages.value[0] : ''
  generateMapForm.value.mapName = ''
  showGenerateMapDialog.value = true
}

const stopGenerateHallMap = async () => {
  // 如果正在加载中，阻止重复点击
  if (generateMapLoading.value) {
    return
  }

  try {
    const token = userStore.token
    if (!token) {
      showErrorMessage('未找到认证token')
      return
    }

    // 设置加载状态
    generateMapLoadingText.value = '地图生成停止中...'
    generateMapLoading.value = true

    // 停止生成地图
    const mapData = {
      sn: getWebSocketSn(),
      map_name: '',
      action: 0,
      data_name: ''
    }

    const response = await navigationApi.generateMap(token, mapData)
    
    // 检查返回值的error_code
    if (response.error_code !== 0) {
      const errorMsg = response.error_msg || '停止生成地图失败'
      showErrorMessage(errorMsg)
      return
    }
    
    hasSubmittedGeneration.value = false
    isMapGenerationActive.value = false // 主动标记生成已停止
    showSuccessMessage('地图生成已停止')
    console.log('手动停止地图生成，重置hasSubmittedGeneration为false')
  } catch (error) {
    console.error('停止地图生成失败:', error)
    alert(error instanceof Error ? error.message : '停止地图生成失败')
  } finally {
    // 确保加载状态被清除
    generateMapLoading.value = false
  }
}

// 确认开始生成地图
const handleConfirmGenerateMap = async () => {
  if (!generateMapForm.value.dataName.trim()) {
    showErrorMessage('暂无可用的展厅数据包')
    return
  }
  
  if (!generateMapForm.value.mapName.trim()) {
    showErrorMessage('请输入地图名称')
    return
  }

  // 如果正在加载中，阻止重复点击
  if (generateMapLoading.value) {
    return
  }

  try {
    const token = userStore.token
    if (!token) {
      showErrorMessage('未找到认证token')
      return
    }

    // 设置加载状态
    generateMapLoadingText.value = '地图生成启动中...'
    generateMapLoading.value = true

    // 开始生成地图
    const mapData = {
      sn: getWebSocketSn(),
      map_name: generateMapForm.value.mapName.trim(),
      action: 1,
      data_name: processDataPackageName(generateMapForm.value.dataName.trim())
    }

    const response = await navigationApi.generateMap(token, mapData)
    
    // 检查返回值的error_code
    if (response.error_code !== 0) {
      // 错误消息翻译映射
      const errorMessageMap: Record<string, string> = {
        'Directory with the same name already exists.': '地图名称已存在，请使用其他名称',
        'Data package not found.': '数据包不存在',
        'Invalid map name.': '地图名称无效'
      }
      
      const errorMsg = errorMessageMap[response.error_msg] || response.error_msg || '地图生成失败'
      showErrorMessage(errorMsg)
      return
    }
    
    hasSubmittedGeneration.value = true
    isMapGenerationActive.value = true // 主动标记生成已开始
    maxProgress.value = 0 // 重置进度
    hasShownCompletionDialog.value = false // 重置完成弹窗标记
    hasShownGridMapCompletionDialog.value = false // 重置栅格图完成弹窗标记
    showGenerateMapDialog.value = false
    showSuccessMessage(`地图生成已开始\n数据包：${processDataPackageName(generateMapForm.value.dataName)}\n地图名称：${generateMapForm.value.mapName}`)
    console.log('生成地图请求已提交，设置hasSubmittedGeneration为true')
  } catch (error) {
    console.error('开始地图生成失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '开始地图生成失败')
  } finally {
    // 确保加载状态被清除
    generateMapLoading.value = false
  }
}

// 取消生成地图
const handleCancelGenerateMap = () => {
  showGenerateMapDialog.value = false
  generateMapForm.value.dataName = ''
  generateMapForm.value.mapName = ''
  isDataPackageSelectActive.value = false
}

// 数据包下拉框处理函数
const toggleDataPackageSelect = () => {
  isDataPackageSelectActive.value = !isDataPackageSelectActive.value
}

const selectDataPackage = (packageName: string) => {
  generateMapForm.value.dataName = packageName
  isDataPackageSelectActive.value = false
}

// 删除数据包
const handleDeleteDataPackage = () => {
  if (!generateMapForm.value.dataName) {
    showErrorMessage('请先选择要删除的数据包')
    return
  }

  // 保存要删除的数据包名称并显示确认弹窗
  dataPackageToDelete.value = generateMapForm.value.dataName
  showDeleteDataPackageDialog.value = true
}

// 确认删除数据包
const confirmDeleteDataPackage = async () => {
  try {
    const token = userStore.token
    if (!token) {
      showErrorMessage('未找到认证token')
      showDeleteDataPackageDialog.value = false
      return
    }

    // 关闭确认弹窗
    showDeleteDataPackageDialog.value = false
    
    // 显示发送请求提示
    showSuccessMessage('已发送删除请求，请稍等...')

    // 调用删除接口
    const response = await navigationApi.deleteDataPackage(token, {
      sn: getWebSocketSn(),
      data_name: processDataPackageName(dataPackageToDelete.value),
      timeout: 30
    })

    if (response.error_code === 0) {
      showSuccessMessage('数据包删除成功')
      // 清空选中的数据包
      generateMapForm.value.dataName = ''
      // 重新加载数据包列表
      await loadDataPackages()
    } else {
      showErrorMessage(response.error_msg || '删除数据包失败')
    }
  } catch (error) {
    console.error('删除数据包失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '删除数据包失败')
  } finally {
    dataPackageToDelete.value = ''
  }
}

// 关闭地图生成完成提示弹窗
const closeMapCompletionDialog = () => {
  showMapCompletionDialog.value = false
  // 清除定时器
  if (mapCompletionTimer) {
    clearTimeout(mapCompletionTimer)
    mapCompletionTimer = null
  }
  console.log('关闭地图生成完成提示弹窗')
}

// 关闭栅格图生成完成提示弹窗
const closeGridMapCompletionDialog = () => {
  showGridMapCompletionDialog.value = false
  // 清除定时器
  if (gridMapCompletionTimer) {
    clearTimeout(gridMapCompletionTimer)
    gridMapCompletionTimer = null
  }
  console.log('关闭栅格图生成完成提示弹窗')
}

// 加载数据包列表
const loadDataPackages = async () => {
  try {
    const token = userStore.token
    if (!token) {
      console.warn('未找到认证token')
      return
    }

    const response = await navigationApi.getDataPackages(token, { sn: getWebSocketSn() })
    
    if (response.error_code === 0 && Array.isArray(response.result)) {
      rawDataPackages.value = response.result
      console.log('数据包列表加载成功:', response.result)
    } else {
      console.error('获取数据包列表失败:', response.error_msg || '未知错误')
      rawDataPackages.value = []
    }
  } catch (error) {
    console.error('加载数据包列表失败:', error)
    rawDataPackages.value = []
  }
}
const generateHallGrid = () => { /* TODO: 生成栅格图并更新对应hall的gridUrl */ }

// 进度条默认值展示（后续可对接真实进度）

// 航线相关功能已移除

// 航线详情相关逻辑已移除

// 航线选择监听已移除

// 航点数据已移除

// 航线名称获取已移除

// 坐标格式化已移除

// 动作图标映射已移除

const sidebarTabs = [
  { key: 'hall', label: '展厅管理', icon: hallIcon, path: '/dashboard/mission' },
  { key: 'area', label: '展区管理', icon: areaIcon, path: '/dashboard/mission' },
  { key: 'multitask', label: '展厅任务', icon: multiTaskIcon, path: '/dashboard/mission' }
]

const handleTabClick = async (tab: any) => {
  currentTab.value = tab.key
  
  // 当切换到展厅任务标签页时，确保展厅任务预设数据已加载
  if (tab.key === 'multitask' && !tourStore.isLoaded) {
    try {
      console.log('=== 切换到展厅任务标签页，开始加载数据 ===')
      await tourStore.fetchTourPresets()
      console.log('展厅任务预设数据加载完成')
    } catch (err) {
      console.warn('切换到展厅任务时获取预设数据失败:', err)
    }
  }
}

// 旧航线选择交互已移除

// 旧确认弹窗已移除
// 旧删除航线函数已移除
// 旧上传对话框状态已移除

// 算法选项
const algorithmOptions = {
  49: "常熟1号线路灯",
  50: "常熟2号线路灯", 
  51: "常熟3号线路灯",
  52: "常熟楼宇亮化",
  9: "人车检测"
}

// 旧任务下发弹窗已移除

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

// 旧上传入口已移除
// 旧上传事件已移除
// 旧上传确认/取消已移除
/* 旧任务下发逻辑已移除
  // 获取当前选中的航线信息
  const currentWayline = waylineFiles.value.find(f => f.wayline_id === selectedTrack.value)
  if (!currentWayline) {
    showErrorMessage('请先选择一个航线')
    return
  }
  
  // 获取缓存的设备序列号
  const deviceSns = getCachedDeviceSns()
  if (!deviceSns.dockSns || deviceSns.dockSns.length === 0) {
    showErrorMessage('未找到可用的设备')
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
    const confirmContinue = await showConfirmDialog('电量警告', `当前电量为${currentBatteryPercent}%，低于30%，不建议飞行。是否继续下发任务？`)
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
*/

/* 旧任务下发逻辑已移除
  const form = dispatchTaskDialog.value.form
  
  // 验证必填字段
  if (!form.name.trim()) {
    showErrorMessage('请输入任务名称')
    return
  }
  
  if (form.task_type === 1 && !form.begin_time) {
    showErrorMessage('定时任务需要设置开始时间')
    return
  }
  
  // 验证定时任务的时间（必须在当前时间4分钟及以后）
  if (form.task_type === 1 && form.begin_time) {
    const selectedTime = new Date(form.begin_time)
    const currentTime = new Date()
    const minTime = new Date(currentTime.getTime() + 4 * 60 * 1000)
    if (selectedTime < minTime) {
      showErrorMessage('定时任务的开始时间必须在当前时间4分钟及以后')
      return
    }
  }
  
  // 验证周期任务的日期
  if (form.task_type === 1 && form.enable_recurrence) {
    if (!form.recurrence_start_date || !form.recurrence_end_date) {
      showErrorMessage('周期任务需要设置开始日期和结束日期')
      return
    }
    
    const startDate = new Date(form.recurrence_start_date)
    const endDate = new Date(form.recurrence_end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (startDate < today || endDate < today) {
      showErrorMessage('周期任务的开始日期和结束日期不能早于今天')
      return
    }
    
    if (startDate > endDate) {
      showErrorMessage('开始日期不能晚于结束日期')
      return
    }
  }
  
  // 执行下发任务逻辑
  console.log('下发任务参数:', form)
  
  try {
    const workspaceId = getCachedWorkspaceId()
    if (!workspaceId) {
      showErrorMessage('未找到workspace_id')
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
          showErrorMessage('立即任务创建并执行成功')
        } catch (executeErr) {
          console.error('任务执行失败:', executeErr)
          showErrorMessage('立即任务创建成功，但执行失败')
        }
      } else {
        // 定时任务不调用execute接口
        showErrorMessage('定时任务创建成功')
      }
    } else {
      showErrorMessage('任务创建成功，但未获取到任务ID')
    }
    
    dispatchTaskDialog.value.visible = false
  } catch (err) {
    console.error('任务下发失败:', err)
    showErrorMessage('任务下发失败')
  }
*/

// 旧任务下发取消已移除

// 页面加载时获取数据
onMounted(async () => {
  // 确保展厅数据已加载
  if (!hallStore.isLoaded) {
    try {
      await hallStore.fetchHalls()
      console.log('展厅数据补充加载完成')
    } catch (err) {
      console.warn('获取展厅数据失败:', err)
    }
  }
  
  // 展区数据现在按展厅动态加载，不需要全局预加载
  
  // 确保任务点数据已加载
  if (!pointStore.isLoaded) {
    try {
      await pointStore.fetchPoints()
      console.log('任务点数据补充加载完成')
    } catch (err) {
      console.warn('获取任务点数据失败:', err)
    }
  }
  
  // 确保讲解相关数据已加载（任务点需要点位名称）
  if (!guideStore.isPointNamesLoaded) {
    try {
      await guideStore.fetchPointNames()
      console.log('点位名称数据补充加载完成')
    } catch (err) {
      console.warn('获取点位名称数据失败:', err)
    }
  }
  
  // 预加载机器人动作列表（静默加载，失败不影响页面）
  try {
    await fetchRobotActions(false) // 不显示错误弹窗
    console.log('机器人动作列表预加载完成')
  } catch (err) {
    console.warn('预加载机器人动作列表失败，将在需要时重试:', err)
  }
  
  // 确保展厅任务预设数据已加载
  console.log('=== 检查展厅任务预设数据加载状态 ===')
  console.log('tourStore.isLoaded:', tourStore.isLoaded)
  if (!tourStore.isLoaded) {
    try {
      console.log('=== 开始加载展厅任务预设数据 ===')
      await tourStore.fetchTourPresets()
      console.log('展厅任务预设数据补充加载完成')
    } catch (err) {
      console.warn('获取展厅任务预设数据失败:', err)
    }
  } else {
    console.log('展厅任务预设数据已加载，跳过')
  }
  
  // 初始化展厅选择状态
  hallStore.initSelectedHall()
  console.log('页面加载，当前选中展厅:', hallStore.selectedHallId)
  
  // 获取当前选中展厅的展区数据
  await fetchCurrentHallZones()
  
  // 设置默认选中的展区（当前选中展厅的第一个展区）
  if (areaList.value.length > 0) {
    selectedAreaId.value = areaList.value[0].id
    console.log('默认选中展区:', selectedAreaId.value)
  }
  
  // 设置默认选中的展厅任务（当前选中展厅的第一个任务预设）
  if (hallTourPresets.value.length > 0) {
    selectedHallTaskList.value = hallTourPresets.value[0].id.toString()
    console.log('默认选中展厅任务:', selectedHallTaskList.value)
  }
})

// 栅格图渲染（参考首页实现，简化版）
const hallGridCanvas = ref<HTMLCanvasElement | null>(null)
let hallGridCleanup: (() => void) | null = null
let currentMapOriginInfo: MapOriginInfo | null = null
let missionGridImageData: ImageData | null = null
// 重试与清理控制，避免断开后无限重试
let missionPgmRetryTimer: number | null = null
let missionPgmRetryCount = 0
const MISSION_PGM_MAX_RETRIES = 100
let isMissionUnmountedFlag = false

const loadAndRenderHallPGM = async () => {
  try {
    // 清空编辑历史记录
    editHistory.value.length = 0
    // 等待 DOM 更新完成
    await nextTick()
    
  const canvas = hallGridCanvas.value
  if (!canvas) {
    console.warn('Canvas element not found, retrying...')
    if (isMissionUnmountedFlag) return
    if (missionPgmRetryCount >= MISSION_PGM_MAX_RETRIES) {
      console.warn('Mission Canvas 重试次数达到上限，停止重试')
      return
    }
    if (missionPgmRetryTimer != null) return
    missionPgmRetryTimer = window.setTimeout(() => {
      missionPgmRetryTimer = null
      missionPgmRetryCount++
      loadAndRenderHallPGM()
    }, 100)
    return
  }
    
  // 检查 canvas 是否在 DOM 中且可见
  if (!canvas.isConnected || !canvas.offsetParent) {
    console.warn('Canvas not visible, retrying...')
    if (isMissionUnmountedFlag) return
    if (missionPgmRetryCount >= MISSION_PGM_MAX_RETRIES) {
      console.warn('Mission Canvas 可见性重试达到上限，停止重试')
      return
    }
    if (missionPgmRetryTimer != null) return
    missionPgmRetryTimer = window.setTimeout(() => {
      missionPgmRetryTimer = null
      missionPgmRetryCount++
      loadAndRenderHallPGM()
    }, 100)
    return
  }

  // 一旦可见，重置计数器
  missionPgmRetryCount = 0

    // 获取当前选中展厅的地图名称
    const currentMapName = getCurrentMapName()
    let buffer: ArrayBuffer

    if (currentMapName) {
      // 尝试从缓存获取或下载地图
      try {
        const currentSn = getWebSocketSn()
        buffer = await downloadAndCacheMap(currentSn, currentMapName, 'gridMap.pgm')
        console.log(`使用展厅地图: ${currentMapName}`)
        
        // 同时下载YAML文件获取原点信息
        try {
          currentMapOriginInfo = await getMapOriginInfo(currentSn, currentMapName)
          console.log('Mission页面地图原点信息:', currentMapOriginInfo)
        } catch (error) {
          console.warn('获取地图原点信息失败:', error)
          currentMapOriginInfo = null
        }
      } catch (error) {
        console.warn(`下载展厅地图失败，使用默认地图:`, error)
        // 回退到默认地图
        const url = new URL('../assets/source_data/pgm_data/gridMap.pgm', import.meta.url).href
        const response = await fetch(url)
        buffer = await response.arrayBuffer()
        currentMapOriginInfo = null
      }
    } else {
      // 使用默认地图
      const url = new URL('../assets/source_data/pgm_data/gridMap.pgm', import.meta.url).href
      const response = await fetch(url)
      buffer = await response.arrayBuffer()
      currentMapOriginInfo = null
    }

    const bytes = new Uint8Array(buffer)
    // 解析头
    let header = ''
    let i = 0, newlines = 0
    while (i < bytes.length && newlines < 3) {
      const ch = String.fromCharCode(bytes[i++])
      header += ch
      if (ch === '\n') newlines++
    }
    const headerClean = header.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n')
    const parts = headerClean.split(/\s+/).filter(Boolean)
    const magic = parts[0]
    const width = parseInt(parts[1]); const height = parseInt(parts[2])
    const maxVal = parseInt(parts[3]) || 255
    const pixelStart = i
    canvas.width = width; canvas.height = height
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const imageData = ctx.createImageData(width, height)
    if (magic === 'P5') {
      const bytesPerSample = maxVal > 255 ? 2 : 1
      let p = pixelStart
      for (let idx = 0; idx < width * height; idx++) {
        let v = 0
        if (bytesPerSample === 1) v = bytes[p++]
        else { v = (bytes[p] << 8) | bytes[p + 1]; p += 2 }
        const c = Math.max(0, Math.min(255, Math.round((v / maxVal) * 255)))
        const off = idx * 4
        imageData.data[off] = c; imageData.data[off + 1] = c; imageData.data[off + 2] = c; imageData.data[off + 3] = 255
      }
    } else {
      const text = new TextDecoder().decode(bytes)
      const tokens = text.replace(/#.*\n/g, '').trim().split(/\s+/)
      const pixelTokens = tokens.slice(4)
      for (let idx = 0; idx < width * height; idx++) {
        const v = parseInt(pixelTokens[idx] || `${maxVal}`)
        const c = Math.max(0, Math.min(255, Math.round((v / maxVal) * 255)))
        const off = idx * 4
        imageData.data[off] = c; imageData.data[off + 1] = c; imageData.data[off + 2] = c; imageData.data[off + 3] = 255
      }
    }
    // 黑白映射
    for (let k = 0; k < imageData.data.length; k += 4) {
      const g = imageData.data[k]
      if (g < 128) {
        imageData.data[k] = 0; imageData.data[k + 1] = 0; imageData.data[k + 2] = 0
      } else {
        imageData.data[k] = 255; imageData.data[k + 1] = 255; imageData.data[k + 2] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)
    
    // 保存原始栅格图数据（必须在绘制到canvas之后立即保存，避免残留上一张图）
    missionGridImageData = ctx.createImageData(width, height)
    missionGridImageData.data.set(imageData.data)
    
    // 重置编辑数据
    gridImageData = null
    
    // 重置缩放和偏移
    currentScale = 1
    currentOffsetX = 0
    currentOffsetY = 0
    
    // 应用居中变换
    applyTransform()

    // 编辑相关函数
    const getCanvasCoords = (e: MouseEvent) => {
      if (!canvas) return { x: 0, y: 0 }
      
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      
      return {
        x: Math.floor((e.clientX - rect.left) * scaleX),
        y: Math.floor((e.clientY - rect.top) * scaleY)
      }
    }

    const editGridPixel = (x: number, y: number) => {
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      
      if (!gridImageData) {
        // 从原始数据复制，而不是从canvas获取，避免将机器人图标保存到编辑数据中
        if (missionGridImageData) {
          // 创建新的ImageData并复制数据
          gridImageData = ctx.createImageData(missionGridImageData.width, missionGridImageData.height)
          gridImageData.data.set(missionGridImageData.data)
        } else {
          // 如果原始数据不存在，才从canvas获取
          gridImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        }
      }
      
      const radius = Math.floor(brushSize.value / 2)
      const color = activeTool.value === 'pen' ? [0, 0, 0, 255] : [255, 255, 255, 255] // 黑色障碍物，白色空地
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = x + dx
          const py = y + dy
          
          if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance <= radius) {
              const index = (py * canvas.width + px) * 4
              gridImageData.data[index] = color[0]     // R
              gridImageData.data[index + 1] = color[1] // G
              gridImageData.data[index + 2] = color[2] // B
              gridImageData.data[index + 3] = color[3] // A
            }
          }
        }
      }
      
      ctx.putImageData(gridImageData, 0, 0)
    }

    const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
      const dx = Math.abs(x1 - x0)
      const dy = Math.abs(y1 - y0)
      const sx = x0 < x1 ? 1 : -1
      const sy = y0 < y1 ? 1 : -1
      let err = dx - dy
      
      let x = x0
      let y = y0
      
      while (true) {
        editGridPixel(x, y)
        
        if (x === x1 && y === y1) break
        
        const e2 = 2 * err
        if (e2 > -dy) {
          err -= dy
          x += sx
        }
        if (e2 < dx) {
          err += dx
          y += sy
        }
      }
    }

    // 交互
    let scale = 1, offsetX = 0, offsetY = 0
    let isDragging = false, lastX = 0, lastY = 0

    const resize = () => {
      // 使用统一的applyTransform函数来处理缩放和居中
      applyTransform()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      currentScale = Math.max(0.2, Math.min(5, currentScale * delta))
      applyTransform()
    }
    const onMouseDown = (e: MouseEvent) => {
      // 重定位模式下的右键点击：取消操作
      if (isRelocMode.value && e.button === 2) {
        if (relocStartPoint.value) {
          // 已经设置了起点，取消操作
          resetRelocState()
        }
        e.preventDefault()
        return
      }
      
      // 重定位模式下的左键点击
      if (isRelocMode.value && e.button === 0 && !e.ctrlKey) {
        const coords = getCanvasCoords(e)
        
        if (!relocStartPoint.value) {
          // 第一次点击：设置起点
          relocStartPoint.value = { x: coords.x, y: coords.y }
          e.preventDefault()
          return
        } else {
          // 第二次点击：确认并调用重定位接口
          const angle = calculateAngle(relocStartPoint.value.x, relocStartPoint.value.y, coords.x, coords.y)
          
          // 将像素坐标转换为世界坐标
          const worldPos = pixelToWorld(relocStartPoint.value.x, relocStartPoint.value.y)
          
          // 保存结果
          relocResult.value = {
            x: relocStartPoint.value.x,
            y: relocStartPoint.value.y,
            worldX: worldPos.x,
            worldY: worldPos.y,
            angle: angle
          }
          
          // 调用重定位接口
          callReloposeApi(worldPos.x, worldPos.y, angle)
          
          // 重置重定位状态
          resetRelocState()
          e.preventDefault()
          return
        }
      }
      
      // 编辑模式下且为编辑导航模式的左键编辑
      if (isEditMode.value && navMode.value === 'edit' && e.button === 0 && !e.ctrlKey) {
        // 开始编辑前保存当前状态到历史记录（仅在新的编辑操作开始时保存）
        if (!drawing) {
          saveToHistory()
        }
        drawing = true
        const coords = getCanvasCoords(e)
        editLastX = coords.x
        editLastY = coords.y
        editGridPixel(coords.x, coords.y)
        e.preventDefault()
        return
      }
      
      // 拖动：拖动模式、右键、Ctrl+左键、或非编辑和非重定位模式的左键
      if (navMode.value === 'pan' || e.button === 2 || e.ctrlKey || (!isEditMode.value && !isRelocMode.value)) {
        isDragging = true; 
        lastX = e.clientX; 
        lastY = e.clientY
        canvas.style.cursor = 'grabbing'
        e.preventDefault()
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      // 重定位模式下鼠标移动时显示箭头
      if (isRelocMode.value && relocStartPoint.value) {
        const coords = getCanvasCoords(e)
        relocCurrentMouse.value = { x: coords.x, y: coords.y }
        // 重新绘制以显示箭头
        drawMissionRobotPosition()
        return
      }
      
      // 处理编辑绘制
      if (drawing && isEditMode.value) {
        const coords = getCanvasCoords(e)
        drawLine(editLastX, editLastY, coords.x, coords.y)
        editLastX = coords.x
        editLastY = coords.y
        return
      }
      
      // 处理拖动
      if (isDragging) {
        const dx = e.clientX - lastX; const dy = e.clientY - lastY
        currentOffsetX += dx; currentOffsetY += dy
        applyTransform()
        lastX = e.clientX; lastY = e.clientY
      }
    }
    const endDrag = () => { 
      isDragging = false
      drawing = false
      if (isRelocMode.value) {
        canvas.style.cursor = 'crosshair'
      } else if (isEditMode.value) {
        canvas.style.cursor = activeTool.value === 'pen' ? 'crosshair' : 'pointer'
      } else {
        canvas.style.cursor = 'grab'
      }
    }

    // 触摸事件处理（用于平板设备）
    let lastTouchDistance = 0
    let isTouching = false
    
    const getTouchCanvasCoords = (touch: Touch) => {
      if (!canvas) return { x: 0, y: 0 }
      
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      
      return {
        x: Math.floor((touch.clientX - rect.left) * scaleX),
        y: Math.floor((touch.clientY - rect.top) * scaleY)
      }
    }

    // 计算两个触点之间的距离
    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    // 获取触点中心位置
    const getTouchCenter = (touches: TouchList) => {
      if (touches.length === 1) {
        return { x: touches[0].clientX, y: touches[0].clientY }
      }
      const x = (touches[0].clientX + touches[1].clientX) / 2
      const y = (touches[0].clientY + touches[1].clientY) / 2
      return { x, y }
    }

    const onTouchStart = (e: TouchEvent) => {
      isTouching = true
      
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        
        // 重定位模式下的触摸点击
        if (isRelocMode.value) {
          const coords = getTouchCanvasCoords(touch)
          
          if (!relocStartPoint.value) {
            // 第一次点击：设置起点
            relocStartPoint.value = { x: coords.x, y: coords.y }
            e.preventDefault()
            return
          } else {
            // 第二次点击：确认并调用重定位接口
            const angle = calculateAngle(relocStartPoint.value.x, relocStartPoint.value.y, coords.x, coords.y)
            
            // 将像素坐标转换为世界坐标
            const worldPos = pixelToWorld(relocStartPoint.value.x, relocStartPoint.value.y)
            
            // 保存结果
            relocResult.value = {
              x: relocStartPoint.value.x,
              y: relocStartPoint.value.y,
              worldX: worldPos.x,
              worldY: worldPos.y,
              angle: angle
            }
            
            // 调用重定位接口
            callReloposeApi(worldPos.x, worldPos.y, angle)
            
            // 重置重定位状态
            resetRelocState()
            e.preventDefault()
            return
          }
        }
        
        // 编辑模式下且为编辑导航模式
        if (isEditMode.value && navMode.value === 'edit') {
          if (!drawing) {
            saveToHistory()
          }
          drawing = true
          const coords = getTouchCanvasCoords(touch)
          editLastX = coords.x
          editLastY = coords.y
          editGridPixel(coords.x, coords.y)
          e.preventDefault() // 阻止页面滚动
          return
        }
        
        // 拖动模式（不在重定位模式和编辑模式下）
        if (navMode.value === 'pan' || (!isEditMode.value && !isRelocMode.value)) {
          isDragging = true
          lastX = touch.clientX
          lastY = touch.clientY
          canvas.style.cursor = 'grabbing'
          e.preventDefault() // 阻止页面滚动
        }
      } else if (e.touches.length === 2) {
        // 双指缩放
        isDragging = false
        drawing = false
        lastTouchDistance = getTouchDistance(e.touches)
        const center = getTouchCenter(e.touches)
        lastX = center.x
        lastY = center.y
        e.preventDefault()
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching) return
      
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        
        // 重定位模式下触摸移动时显示箭头
        if (isRelocMode.value && relocStartPoint.value) {
          const coords = getTouchCanvasCoords(touch)
          relocCurrentMouse.value = { x: coords.x, y: coords.y }
          // 重新绘制以显示箭头
          drawMissionRobotPosition()
          e.preventDefault()
          return
        }
        
        // 处理编辑绘制
        if (drawing && isEditMode.value) {
          const coords = getTouchCanvasCoords(touch)
          drawLine(editLastX, editLastY, coords.x, coords.y)
          editLastX = coords.x
          editLastY = coords.y
          e.preventDefault() // 阻止页面滚动
          return
        }
        
        // 处理拖动
        if (isDragging) {
          const dx = touch.clientX - lastX
          const dy = touch.clientY - lastY
          currentOffsetX += dx
          currentOffsetY += dy
          applyTransform()
          lastX = touch.clientX
          lastY = touch.clientY
          e.preventDefault() // 阻止页面滚动
        }
      } else if (e.touches.length === 2) {
        // 双指缩放
        const newDistance = getTouchDistance(e.touches)
        const center = getTouchCenter(e.touches)
        
        if (lastTouchDistance > 0) {
          // 计算缩放比例
          const scaleDelta = newDistance / lastTouchDistance
          const newScale = Math.max(0.2, Math.min(5, currentScale * scaleDelta))
          
          // 以触点中心为基准进行缩放（保持触点中心位置不变）
          // 注意：这里需要考虑当前的 baseScale，所以偏移量的计算要更复杂一些
          const scaleChange = newScale / currentScale
          
          // 由于 applyTransform 会应用 baseScale，我们需要计算相对于屏幕的偏移
          const parent = canvas.parentElement
          if (parent) {
            const containerWidth = parent.clientWidth
            const containerHeight = parent.clientHeight
            const baseScale = Math.min(containerWidth / canvas.width, containerHeight / canvas.height)
            
            // 计算中心点相对于容器的位置
            const containerCenterX = center.x - parent.getBoundingClientRect().left
            const containerCenterY = center.y - parent.getBoundingClientRect().top
            
            // 调整偏移量
            currentOffsetX = containerCenterX - (containerCenterX - currentOffsetX) * scaleChange
            currentOffsetY = containerCenterY - (containerCenterY - currentOffsetY) * scaleChange
          }
          
          currentScale = newScale
          applyTransform()
        }
        
        lastTouchDistance = newDistance
        lastX = center.x
        lastY = center.y
        e.preventDefault()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isTouching = false
        isDragging = false
        drawing = false
        lastTouchDistance = 0
        endDrag()
      } else if (e.touches.length === 1) {
        // 从双指变为单指，重置为拖动模式
        lastTouchDistance = 0
        if (navMode.value === 'pan' || (!isEditMode.value && !isRelocMode.value)) {
          isDragging = true
          lastX = e.touches[0].clientX
          lastY = e.touches[0].clientY
        }
      }
      e.preventDefault() // 阻止页面滚动
    }

    const onContextMenu = (e: Event) => {
      e.preventDefault() // 禁用右键菜单
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', endDrag)
    canvas.addEventListener('mouseleave', endDrag)
    canvas.addEventListener('contextmenu', onContextMenu) // 禁用右键菜单
    // 添加触摸事件监听（用于平板设备）
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })

    if (hallGridCleanup) hallGridCleanup()
    hallGridCleanup = () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('wheel', onWheel as any)
      canvas.removeEventListener('mousedown', onMouseDown as any)
      canvas.removeEventListener('mousemove', onMouseMove as any)
      canvas.removeEventListener('mouseup', endDrag as any)
      canvas.removeEventListener('mouseleave', endDrag as any)
      canvas.removeEventListener('contextmenu', onContextMenu as any)
      // 移除触摸事件监听
      canvas.removeEventListener('touchstart', onTouchStart as any)
      canvas.removeEventListener('touchmove', onTouchMove as any)
      canvas.removeEventListener('touchend', onTouchEnd as any)
      canvas.removeEventListener('touchcancel', onTouchEnd as any)
    }

    // 注意：原始栅格图数据已在前面保存（第3040行之后），这里不再重复保存
    
    // 绘制机器人位置
    drawMissionRobotPosition()
  } catch (e) {
    // 忽略
  }
}

// 绘制高清机器人图标 - 实心圆 + 三角箭头方向指示
const drawMissionRobotSVGIcon = async (ctx: CanvasRenderingContext2D, x: number, y: number, theta: number, canvas: HTMLCanvasElement) => {
  ctx.save()
  
  // 移动到机器人位置
  ctx.translate(x, y)
  
  // 启用抗锯齿以获得更平滑的渲染
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // 获取当前缩放比例
  const currentScale = canvas.clientWidth / canvas.width
  
  // 固定屏幕视觉大小（像素），图标在屏幕上看起来的大小
  const visualSize = 24
  // 转换为canvas像素大小，设置最小值确保放大时也清晰
  const iconSize = Math.max(12, visualSize / currentScale)
  
  // 计算圆的半径
  const circleRadius = iconSize * 0.4
  
  // 添加阴影效果（根据缩放调整）
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = Math.max(2, 3 / currentScale)
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = Math.max(0.5, 1 / currentScale)
  
  // 绘制主体红色实心圆
  ctx.fillStyle = '#FF4444'
  ctx.beginPath()
  ctx.arc(0, 0, circleRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 清除阴影设置
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  
  // 绘制方向指示三角箭头（在圆的外部）
  ctx.save()
  
  // 箭头图形默认朝向 +X（屏幕右侧），补一个固定偏移让尖端与路线方向对齐
  const robotHeadingOffset = Math.PI / 2
  ctx.rotate((-theta || 0) + robotHeadingOffset)
  
  // 计算三角形的位置和大小
  const arrowHeight = circleRadius * 1.3 // 箭头高度
  // 尖角60度：底部半宽 = 高度 * tan(30°)
  const halfBaseWidth = arrowHeight * Math.tan(30 * Math.PI / 180)
  const arrowAngle = Math.asin(halfBaseWidth / circleRadius) // 计算箭头在圆上的角度
  
  // 绘制与圆形贴合的三角箭头
  ctx.fillStyle = '#FF4444' // 红色
  
  // 添加阴影效果
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = Math.max(1.5, 2 / currentScale)
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = Math.max(0.5, 1 / currentScale)
  
  ctx.beginPath()
  // 顶点（指向方向）
  ctx.moveTo(circleRadius + arrowHeight, 0)
  
  // 右侧边线（从顶点到圆形边缘）
  ctx.lineTo(
    circleRadius * Math.cos(-arrowAngle),
    circleRadius * Math.sin(-arrowAngle)
  )
  
  // 底部凹进去的弧线（沿着圆形边缘，顺时针方向）
  ctx.arc(0, 0, circleRadius, -arrowAngle, arrowAngle, false)
  
  // 左侧边线（从圆形边缘回到顶点）
  ctx.lineTo(circleRadius + arrowHeight, 0)
  
  ctx.closePath()
  ctx.fill()
  
  // 清除阴影设置
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  
  ctx.restore()
  
  // 给圆形描白色边框（在箭头绘制完成后，确保可见）
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = Math.max(1.5, 2.5 / currentScale)
  ctx.beginPath()
  ctx.arc(0, 0, circleRadius, 0, Math.PI * 2)
  ctx.stroke()
  
  ctx.restore()
}

// 判断是否为当前执行的任务点（与首页一致）
const isMissionCurrentTaskPoint = (index: number): boolean => {
  // 如果有实时任务进度数据，根据当前进度判断高亮哪个点位
  if (websocketDataStore.currentTaskProgress) {
    const { current } = websocketDataStore.currentTaskProgress
    // current 表示当前正在执行的点位序号（从1开始），转换为数组索引（从0开始）
    const actualIndex = current - 1
    return index === actualIndex
  }
  
  // 如果没有实时进度数据，回退到根据status判断
  const points = websocketDataStore.tourRunPoints
  if (!points || points.length === 0) return false
  
  // 找到第一个状态为'arriving'的点位
  const arrivingIndex = points.findIndex(p => p.status === 'arriving')
  return index === arrivingIndex
}

// 绘制Mission页面机器人位置
const drawMissionRobotPosition = async () => {
  const canvas = hallGridCanvas.value
  if (!canvas || !missionGridImageData || !currentMapOriginInfo) {
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 优先使用编辑后的数据，如果没有编辑数据则使用原始数据
  // 退出编辑模式时保留编辑内容，不要恢复原始地图
  if (gridImageData) {
    // 有编辑数据，使用编辑后的数据
    ctx.putImageData(gridImageData, 0, 0)
  } else {
    // 没有编辑数据，使用原始数据
    ctx.putImageData(missionGridImageData, 0, 0)
  }

  // 获取当前机器人位置
  const robotPose = getRobotPose(getWebSocketSn())
  if (!robotPose || typeof robotPose.x !== 'number' || typeof robotPose.y !== 'number') {
    return
  }

  // console.log('Mission页面绘制机器人位置:', robotPose)

  // 转换世界坐标到像素坐标
  const pixelPos = worldToPixel(
    robotPose.x,
    robotPose.y,
    currentMapOriginInfo,
    canvas.width,
    canvas.height
  )

  // 检查是否在画布范围内
  if (pixelPos.x < 0 || pixelPos.x >= canvas.width || pixelPos.y < 0 || pixelPos.y >= canvas.height) {
    console.warn('机器人位置超出栅格图范围:', pixelPos)
    return
  }

  // 绘制机器人位置 - 使用高清SVG图标（与首页一致）
  await drawMissionRobotSVGIcon(ctx, pixelPos.x, pixelPos.y, robotPose.theta, canvas)
  
  // 绘制已走过的路径连线（在任务点之前绘制，这样点会在线的上面）
  // await drawMissionTaskPathLines(ctx, canvas)
  
  // 绘制任务点位
  await drawMissionTaskPoints(ctx, canvas)
  
  // 绘制重定位箭头（如果在重定位模式）
  if (isRelocMode.value && relocStartPoint.value && relocCurrentMouse.value) {
    drawRelocArrow(ctx, relocStartPoint.value, relocCurrentMouse.value, canvas)
  }
}

// 绘制Mission页面已走过的路径连线
const drawMissionTaskPathLines = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  // 只有当前任务存在且状态为running时，才绘制路径
  if (!websocketDataStore.currentTourRun || websocketDataStore.currentTourRun.status !== 'running') {
    return
  }
  
  // 获取任务点数据
  const taskPoints = websocketDataStore.tourRunPoints
  if (!taskPoints || taskPoints.length === 0 || !currentMapOriginInfo) {
    return
  }

  // 获取当前执行的任务点索引
  let currentIndex = -1
  if (websocketDataStore.currentTaskProgress) {
    currentIndex = websocketDataStore.currentTaskProgress.current - 1
  } else {
    // 如果没有实时进度数据，通过status判断
    currentIndex = taskPoints.findIndex(p => p.status === 'arriving')
  }

  // 如果没有当前执行的任务点，不需要绘制路径
  if (currentIndex < 0) {
    return
  }

  // 获取当前缩放比例
  const currentScale = canvas.clientWidth / canvas.width

  ctx.save()
  
  // 启用抗锯齿
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // 设置路径线样式
  ctx.strokeStyle = '#00BCD4' // 青色路径线
  ctx.lineWidth = Math.max(2, 2.5 / currentScale) // 更粗的线条，更清晰
  ctx.lineCap = 'round' // 圆形线帽
  ctx.lineJoin = 'round' // 圆形连接
  
  // 添加发光效果
  ctx.shadowColor = 'rgba(0, 188, 212, 0.7)'
  ctx.shadowBlur = Math.max(3, 5 / currentScale)

  // 收集所有有效的已走过的点位（从第一个到当前点，包括当前点）
  const validPoints: Array<{x: number, y: number}> = []
  
  for (let i = 0; i <= currentIndex; i++) {
    const point = taskPoints[i]
    // 检查点位是否有有效的坐标
    if (typeof point.x !== 'number' || typeof point.y !== 'number') {
      continue
    }

    // 转换世界坐标到像素坐标
    const pixelPos = worldToPixel(
      point.x,
      point.y,
      currentMapOriginInfo!,
      canvas.width,
      canvas.height
    )

    // 检查是否在画布范围内
    if (pixelPos.x >= 0 && pixelPos.x < canvas.width && pixelPos.y >= 0 && pixelPos.y < canvas.height) {
      validPoints.push(pixelPos)
    }
  }

  // 绘制连线
  if (validPoints.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(validPoints[0].x, validPoints[0].y)
    
    for (let i = 1; i < validPoints.length; i++) {
      ctx.lineTo(validPoints[i].x, validPoints[i].y)
    }
    
    ctx.stroke()
  }

  // 清除阴影设置
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  ctx.restore()
}

// 绘制Mission页面任务点位
const drawMissionTaskPoints = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  // 只有当前任务存在且状态为running时，才绘制任务点
  if (!websocketDataStore.currentTourRun || websocketDataStore.currentTourRun.status !== 'running') {
    return
  }
  
  // 获取任务点数据
  const taskPoints = websocketDataStore.tourRunPoints
  if (!taskPoints || taskPoints.length === 0 || !currentMapOriginInfo) {
    return
  }

  // 获取当前缩放比例
  const currentScale = canvas.clientWidth / canvas.width
  
  // 固定屏幕视觉大小（像素）
  const visualSize = 10 // 任务点大小
  // 转换为canvas像素半径，设置最小值确保清晰
  const pointRadius = Math.max(4, (visualSize / currentScale) * 0.5)

  ctx.save()
  
  // 启用抗锯齿
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  taskPoints.forEach((point, index) => {
    // 检查点位是否有效的坐标
    if (typeof point.x !== 'number' || typeof point.y !== 'number') {
      return
    }

    // 转换世界坐标到像素坐标
    const pixelPos = worldToPixel(
      point.x,
      point.y,
      currentMapOriginInfo!,
      canvas.width,
      canvas.height
    )

    // 检查是否在画布范围内
    if (pixelPos.x < 0 || pixelPos.x >= canvas.width || pixelPos.y < 0 || pixelPos.y >= canvas.height) {
      return
    }

    // 根据任务点状态选择颜色
    let fillColor = '#4CAF50' // 绿色 - 待执行
    let strokeColor = '#FFFFFF'
    
    if (point.status === 'done') {
      fillColor = '#2196F3' // 蓝色 - 已完成
    } else if (point.status === 'arriving' || isMissionCurrentTaskPoint(index)) {
      fillColor = '#FF9800' // 橙色 - 正在执行
    }

    // 绘制任务点（带阴影效果）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = Math.max(2, 3 / currentScale)
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = Math.max(0.8, 1.5 / currentScale)

    ctx.fillStyle = fillColor
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = Math.max(0.8, 1 / currentScale) // 细一点的白色边框

    ctx.beginPath()
    ctx.arc(pixelPos.x, pixelPos.y, pointRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 清除阴影设置
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  })

  ctx.restore()
}

// 监听机器人位置变化，实时更新显示（编辑模式下暂停更新以避免干扰编辑）
watch(() => getRobotPose(getWebSocketSn()), (newPose) => {
  if (newPose && missionGridImageData && currentMapOriginInfo && !isEditMode.value) {
    // 当机器人位置更新时，重新绘制（仅在非编辑模式下）
    drawMissionRobotPosition()
  }
}, { immediate: false, deep: true })

// 监听任务状态变化，实时更新任务点显示
watch(() => websocketDataStore.currentTourRun, (newTourRun) => {
  if (missionGridImageData && currentMapOriginInfo && !isEditMode.value) {
    // 当任务状态更新时，重新绘制（仅在非编辑模式下）
    drawMissionRobotPosition()
  }
}, { deep: true })

// Mission页面机器人位置更新定时器
let missionRobotPositionUpdateTimer: number | null = null

const startMissionRobotPositionUpdate = () => {
  if (missionRobotPositionUpdateTimer) {
    clearInterval(missionRobotPositionUpdateTimer)
  }
  
  missionRobotPositionUpdateTimer = setInterval(() => {
    if (missionGridImageData && currentMapOriginInfo) {
      drawMissionRobotPosition()
    }
  }, 500) // 每500ms更新一次
}

const stopMissionRobotPositionUpdate = () => {
  if (missionRobotPositionUpdateTimer) {
    clearInterval(missionRobotPositionUpdateTimer)
    missionRobotPositionUpdateTimer = null
  }
}

watch(selectedHall, () => {
  // 切换展厅时重载（未来可切换不同PGM来源）
  loadAndRenderHallPGM()
})

// 监听标签页切换，当切换到展厅管理时重新渲染栅格图
watch(currentTab, async (newTab) => {
  if (newTab === 'hall') {
    console.log('Switched to hall tab, reloading grid...')
    // 延迟一点时间确保标签页内容已经显示
    setTimeout(() => {
      loadAndRenderHallPGM()
    }, 100)
  } else if (newTab === 'multitask') {
    console.log('Switched to multitask tab, refreshing task details...')
    // 切换到展厅任务页面时，如果有选中的任务，重新获取任务详情以刷新任务点数据
    if (selectedHallTaskList.value) {
      try {
        await tourStore.fetchTourPresetItems(parseInt(selectedHallTaskList.value))
        console.log('展厅任务详情已刷新')
      } catch (error) {
        console.error('刷新展厅任务详情失败:', error)
      }
    }
  }
})

onMounted(() => {
  // 初次渲染
  // 等 DOM 就绪后加载
  setTimeout(() => loadAndRenderHallPGM(), 0)
  
  // 启动机器人位置更新
  startMissionRobotPositionUpdate()
})

// 页面激活时重新渲染栅格图（用于处理页面切换后的空白问题）
onActivated(async () => {
  console.log('Mission page activated, reloading hall grid...')
  
  // 页面激活时强制刷新展厅列表数据
  try {
    await hallStore.fetchHalls(true)
    console.log('✅ Mission页面激活时刷新展厅列表成功')
  } catch (error) {
    console.warn('❌ Mission页面激活时刷新展厅列表失败:', error)
  }
  
  // 页面激活时刷新任务状态
  const token = userStore.token || localStorage.getItem('token') || ''
  if (token) {
    try {
      await websocketDataStore.fetchTourRuns(token)
      console.log('✅ Mission页面激活时刷新任务状态成功')
    } catch (error) {
      console.warn('❌ Mission页面激活时刷新任务状态失败:', error)
    }
  }
  
  // 延迟一点时间确保 DOM 完全渲染
  setTimeout(() => {
    loadAndRenderHallPGM()
  }, 50)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  isMissionUnmountedFlag = true
  if (missionPgmRetryTimer) {
    clearTimeout(missionPgmRetryTimer)
    missionPgmRetryTimer = null
  }
  
  // 清理弹窗自动关闭定时器
  if (mapCompletionTimer) {
    clearTimeout(mapCompletionTimer)
    mapCompletionTimer = null
  }
  if (gridMapCompletionTimer) {
    clearTimeout(gridMapCompletionTimer)
    gridMapCompletionTimer = null
  }
  
  // 停止机器人位置更新
  stopMissionRobotPositionUpdate()
  
  // 清理栅格图相关资源
  if (hallGridCleanup) {
    hallGridCleanup()
  }
})

// 直接编辑栅格图像素数据
let drawing = false
let editLastX = 0, editLastY = 0
let gridImageData: ImageData | null = null
const editHistory = ref<ImageData[]>([]) // 编辑历史记录
const canUndo = computed(() => editHistory.value.length > 0)

// 计算两点之间的角度（弧度）
const calculateAngle = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  // 使用atan2计算角度，返回范围为 -π 到 π
  return Math.atan2(dy, dx)
}

// 将像素坐标转换为世界坐标
const pixelToWorld = (pixelX: number, pixelY: number): { x: number, y: number } => {
  if (!currentMapOriginInfo) {
    return { x: 0, y: 0 }
  }
  
  const canvas = hallGridCanvas.value
  if (!canvas) {
    return { x: 0, y: 0 }
  }
  
  const { origin, resolution } = currentMapOriginInfo
  const height = canvas.height
  
  // PGM图像坐标系转换为世界坐标系
  const worldX = pixelX * resolution + origin[0]
  const worldY = (height - pixelY) * resolution + origin[1]
  
  return { x: worldX, y: worldY }
}

// 绘制重定位箭头
const drawRelocArrow = (
  ctx: CanvasRenderingContext2D, 
  start: { x: number, y: number }, 
  end: { x: number, y: number },
  canvas: HTMLCanvasElement
) => {
  const currentScale = canvas.clientWidth / canvas.width
  
  ctx.save()
  
  // 绘制箭头线
  ctx.strokeStyle = '#FF9800' // 橙色
  ctx.lineWidth = Math.max(2, 3 / currentScale)
  ctx.lineCap = 'round'
  
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()
  
  // 绘制箭头头部
  const angle = calculateAngle(start.x, start.y, end.x, end.y)
  const arrowLength = Math.max(10, 15 / currentScale)
  const arrowAngle = Math.PI / 6 // 30度
  
  ctx.fillStyle = '#FF9800'
  ctx.beginPath()
  ctx.moveTo(end.x, end.y)
  ctx.lineTo(
    end.x - arrowLength * Math.cos(angle - arrowAngle),
    end.y - arrowLength * Math.sin(angle - arrowAngle)
  )
  ctx.lineTo(
    end.x - arrowLength * Math.cos(angle + arrowAngle),
    end.y - arrowLength * Math.sin(angle + arrowAngle)
  )
  ctx.closePath()
  ctx.fill()
  
  // 绘制起点标记
  ctx.fillStyle = '#4CAF50' // 绿色
  ctx.beginPath()
  ctx.arc(start.x, start.y, Math.max(4, 6 / currentScale), 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
}

const setupCanvasEditEvents = () => {
  const canvas = hallGridCanvas.value
  if (!canvas) return
  
  // 更新光标样式
  if (isRelocMode.value) {
    canvas.style.cursor = 'crosshair'
  } else if (isEditMode.value) {
    if (navMode.value === 'pan') {
      canvas.style.cursor = 'grab'
    } else {
      canvas.style.cursor = activeTool.value === 'pen' ? 'crosshair' : 'pointer'
    }
  } else {
    canvas.style.cursor = 'grab'
  }
}



const saveToHistory = () => {
  const canvas = hallGridCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  
  // 优先从gridImageData保存，如果不存在则从missionGridImageData保存
  // 避免保存包含机器人图标和任务点的canvas内容
  let sourceData: ImageData | null = null
  if (gridImageData) {
    sourceData = gridImageData
  } else if (missionGridImageData) {
    sourceData = missionGridImageData
  } else {
    // 如果都不存在，才从canvas获取
    sourceData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }
  
  const historyData = new ImageData(
    new Uint8ClampedArray(sourceData.data),
    sourceData.width,
    sourceData.height
  )
  
  editHistory.value.push(historyData)
  console.log('保存历史记录，当前历史记录数量:', editHistory.value.length)
  // 限制历史记录数量，避免内存占用过多
  if (editHistory.value.length > 20) {
    editHistory.value.shift()
  }
}

const undoEdit = () => {
  if (editHistory.value.length === 0) return
  
  const canvas = hallGridCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  
  const previousState = editHistory.value.pop()
  if (previousState) {
    // 恢复历史记录的状态
    ctx.putImageData(previousState, 0, 0)
    // 复制数据到gridImageData，避免直接引用
    gridImageData = ctx.createImageData(previousState.width, previousState.height)
    gridImageData.data.set(previousState.data)
  }
}

const clearGridEdit = () => {
  // 清空历史记录
  editHistory.value.length = 0
  // 重新加载原始栅格图
  loadAndRenderHallPGM()
}

watch(activeTool, () => {
  setupCanvasEditEvents()
})

watch(isEditMode, (newValue, oldValue) => {
  setupCanvasEditEvents()
  // 当退出编辑模式时，重新绘制机器人位置
  if (oldValue && !newValue) {
    // 注意：不需要在这里保存canvas内容到gridImageData
    // 因为在编辑过程中，gridImageData已经被editGridPixel函数实时更新了
    // 如果从canvas获取数据，可能会包含一些临时绘制的内容
    console.log('退出编辑模式，重新绘制机器人位置')
    
    setTimeout(() => {
      drawMissionRobotPosition()
    }, 0)
  }
})

watch(navMode, () => {
  setupCanvasEditEvents()
})

// 确认对话框（使用自定义弹窗）
const showConfirmDialog = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    confirmDialogState.value = {
      show: true,
      title,
      message,
      resolve
    }
  })
}

// 关闭确认弹窗
const closeConfirmDialog = (confirmed: boolean) => {
  if (confirmDialogState.value.resolve) {
    confirmDialogState.value.resolve(confirmed)
  }
  confirmDialogState.value = {
    show: false,
    title: '',
    message: '',
    resolve: null
  }
}

// 成功消息提示（使用自定义弹窗）
const showSuccessMessage = (message: string) => {
  resultDialogState.value = {
    show: true,
    type: 'success',
    title: '操作成功',
    message,
    details: null
  }
  // 2秒后自动关闭
  setTimeout(() => {
    resultDialogState.value.show = false
  }, 2000)
}

// 调用重定位接口
const callReloposeApi = (poseX: number, poseY: number, theta: number) => {
  const token = userStore.token
  if (!token) {
    showErrorMessage('未找到认证token，请重新登录')
    return
  }
  
  // 获取当前机器人SN
  const currentSn = getWebSocketSn()
  if (!currentSn || currentSn === 'broadcast') {
    showErrorMessage('未找到有效的机器人SN')
    return
  }
  
  console.log('调用重定位接口:', { sn: currentSn, pos_x: poseX, pos_y: poseY, theta })
  
  // 立即显示成功提示
  showSuccessMessage('重定位成功')
  
  // 退出重定位模式
  isRelocMode.value = false
  setupCanvasEditEvents()
  
  // 在后台调用API，不等待结果
  navigationApi.setRelopose(token, {
    sn: currentSn,
    pos_x: poseX,
    pos_y: poseY,
    theta: theta,
    timeout: 10
  }).then(() => {
    console.log('重定位接口调用成功')
  }).catch(error => {
    console.error('重定位接口调用失败（后台）:', error)
    // 不再显示错误提示，因为用户已经看到成功提示了
  })
}

// 保存当前栅格图（下载到本地）
const saveCurrentGrid = async (): Promise<void> => {
  return new Promise((resolve) => {
    const canvas = hallGridCanvas.value
    if (!canvas) {
      resolve()
      return
    }
    
    try {
      // 创建下载链接
      const link = document.createElement('a')
      link.download = `gridMap_${selectedHall.value}_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.png`
      
      // 将canvas转换为PNG格式并下载
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          link.href = url
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          console.log('栅格图已下载，文件名:', link.download)
        }
        resolve()
      }, 'image/png')
    } catch (error) {
      console.error('下载栅格图失败:', error)
      resolve()
    }
  })
}


// 展区管理相关方法
// 新增展区
const handleAddArea = () => {
  editingArea.value = null
  addAreaForm.value = { name: '' }
  showAddAreaDialog.value = true
}

// 删除展区
const handleDeleteArea = async () => {
  if (!selectedAreaId.value) return
  
  const area = areaList.value.find(a => a.id === selectedAreaId.value)
  if (!area) return
  
  const confirmed = await showConfirmDialog('删除确认', `确定要删除展区"${area.name}"吗？删除后该展区下的所有任务点也将被删除。`)
  if (confirmed) {
    try {
      const zoneId = parseInt(selectedAreaId.value)
      console.log('删除展区:', area.name, 'ID:', zoneId)
      
      // 调用API删除展区
      await zoneStore.deleteZone(zoneId)
      
      // 删除成功后，重新获取当前展厅的展区列表
      await fetchCurrentHallZones()
      
      // 重新获取任务点列表（因为展区删除后，相关任务点也被删除）
      await pointStore.fetchPoints(undefined, true) // 强制刷新所有任务点
      console.log('✅ 任务点列表已更新')
      
      // 重置选中的展区
      if (areaList.value.length > 0) {
        selectedAreaId.value = areaList.value[0].id
        console.log('删除展区后，重新选择第一个展区:', selectedAreaId.value)
      } else {
        selectedAreaId.value = ''
        console.log('删除展区后，没有可选展区了')
      }
      
      showSuccessMessage(`展区"${area.name}"删除成功`)
    } catch (error) {
      console.error('❌ 删除展区失败:', error)
      showErrorMessage(error instanceof Error ? error.message : '删除展区失败')
    }
  }
}

// 新增任务点
const handleAddTaskPoint = async () => {
  if (!selectedAreaId.value) return
  
  // 获取当前机器人的位置数据
  const currentSn = getWebSocketSn()
  let robotPose = getRobotPose(currentSn)
  
  // 如果当前SN没有数据，尝试使用broadcast
  if (!robotPose && currentSn !== 'broadcast') {
    robotPose = getRobotPose('broadcast')
  }
  
  // 从机器人位置数据中提取xytheta，如果没有数据则使用默认值
  const defaultX = robotPose?.x || 0
  const defaultY = robotPose?.y || 0
  const defaultAngle = robotPose?.theta || 0 // 直接使用theta原始值
  
  console.log('新增任务点使用机器人当前位置:', { 
    sn: currentSn, 
    x: defaultX, 
    y: defaultY, 
    angle: defaultAngle,
    rawPose: robotPose 
  })
  
  // 获取机器人动作列表（如果还没有获取过）
  if (robotActions.value.length === 0) {
    try {
      await fetchRobotActions(false) // 不显示错误提示
    } catch (error) {
      console.warn('获取机器人动作列表失败，将使用空列表')
    }
  }
  
  // 每次打开对话框时都刷新视频列表
  try {
    await fetchVideoList()
  } catch (error) {
    console.warn('获取视频列表失败，将使用空列表')
  }
  
  // 选择默认动作 - 默认为"无"
  const defaultAction = robotActions.value.find(action => action.recommended)
  
  editingTaskPoint.value = null
  
  // 如果有讲解点位，自动使用第一个点位的名称作为任务点名称
  const defaultPointNameId = guideStore.pointNames.length > 0 ? guideStore.pointNames[0].id.toString() : ''
  const defaultPointName = defaultPointNameId && guideStore.pointNames.length > 0 ? guideStore.pointNames[0].name : ''
  
  addTaskPointForm.value = {
    name: defaultPointName, // 自动填充第一个讲解点位的名称
    pointNameId: defaultPointNameId,
    x: defaultX, 
    y: defaultY, 
    angle: defaultAngle, 
    pointType: '讲解点', 
    robotAction: 'none', // 默认为"无"
    holdTime: 1.5, // 动作持续，默认1.5秒
    robotDirection: '前进',
    waitTime: 0, // 任务等待，默认0秒
    videoId: '', // 视频选择，默认为空（无）
    noWait: false // 到点不停，默认关闭
  }
  showAddTaskPointDialog.value = true
}

// 确认新增展区
const handleConfirmAddArea = async () => {
  if (!addAreaForm.value.name.trim()) {
    showErrorMessage('请输入展区名称')
    return
  }
  
  // 获取当前选中的展厅ID
  if (!selectedHall.value) {
    showErrorMessage('未选择有效的展厅')
    return
  }
  
  // 将selectedHall转换为数字格式（因为API需要数字类型的hall_id）
  const hallId = typeof selectedHall.value === 'string' ? parseInt(selectedHall.value) : selectedHall.value
  
  if (editingArea.value) {
    // 编辑模式 - 暂时不支持，因为没有提供更新接口
    showErrorMessage('暂不支持编辑展区')
    return
  } else {
    // 新增模式 - 调用API创建展区
    try {
      console.log('创建展区:', addAreaForm.value.name.trim(), '展厅ID:', hallId)
      const newZone = await zoneStore.createZone(addAreaForm.value.name.trim(), hallId)
      
      // 创建成功后，重新获取当前展厅的展区列表
      await fetchCurrentHallZones()
      
      // 自动选中新创建的展区
      selectedAreaId.value = newZone.id.toString()
      
      showSuccessMessage(`展区添加成功：${newZone.name}`)
    } catch (error) {
      console.error('创建展区失败:', error)
      showErrorMessage(error instanceof Error ? error.message : '创建展区失败')
      return
    }
  }
  
  showAddAreaDialog.value = false
}

// 取消新增展区
const handleCancelAddArea = () => {
  showAddAreaDialog.value = false
  editingArea.value = null
}

// 确认新增任务点
const handleConfirmAddTaskPoint = async () => {
  // 验证必填字段
  if (!addTaskPointForm.value.name || !addTaskPointForm.value.name.trim()) {
    showErrorMessage('请输入任务点名称')
    return
  }
  
  // 只有选择讲解点时才需要验证讲解点位
  if (addTaskPointForm.value.pointType === '讲解点' && !addTaskPointForm.value.pointNameId) {
    showErrorMessage('请选择讲解点位')
    return
  }
  
  // 移除角度范围限制，因为现在使用弧度值
  // if (addTaskPointForm.value.angle < 0 || addTaskPointForm.value.angle > 360) {
  //   alert('角度必须在0-360之间')
  //   return
  // }
  
  if (!selectedAreaId.value) {
    showErrorMessage('未选择展区')
    return
  }
  
  if (editingTaskPoint.value) {
    // 编辑模式 - 调用API更新任务点
    try {
      // 获取当前机器人的SN
      const currentSn = getWebSocketSn()
      
      // 根据机器人朝向、动作持续和任务等待生成 action_params
      const navMode = addTaskPointForm.value.robotDirection === '前进' ? 1 : -1
      const actionParams = JSON.stringify({
        hold: addTaskPointForm.value.holdTime || 1.5,
        auto_release: true,
        nav_mode: navMode,
        wait_time: addTaskPointForm.value.waitTime || 0 // 添加任务等待时间
      })
      
      // 构建基本的pointData
      const pointData: any = {
        type: addTaskPointForm.value.pointType === '讲解点' ? 'explain' as const : 'action' as const,
        point_name_id: addTaskPointForm.value.pointType === '讲解点' && addTaskPointForm.value.pointNameId 
          ? parseInt(addTaskPointForm.value.pointNameId) 
          : (guideStore.pointNames.length > 0 ? guideStore.pointNames[0].id : 1), // 辅助点使用第一个点位ID作为默认值
        custom_name: addTaskPointForm.value.name, // 添加custom_name字段
        pose_x: addTaskPointForm.value.x,
        pose_y: addTaskPointForm.value.y,
        pose_theta: addTaskPointForm.value.angle, // 直接使用原始值
        action_code: addTaskPointForm.value.robotAction === 'none' ? '' : addTaskPointForm.value.robotAction, // 如果选择"无"，则保存为空字符串
        action_params: actionParams,
        robot_sn: currentSn, // 使用当前机器人的SN
        no_wait: addTaskPointForm.value.noWait === true
      }
      
      // 如果选择了视频（不是"无"），添加screen_video_id字段
      const selectedVideoId = addTaskPointForm.value.videoId
      if (selectedVideoId && selectedVideoId !== '') {
        const videoIdNum = parseInt(selectedVideoId)
        if (!isNaN(videoIdNum)) {
          pointData.screen_video_id = videoIdNum
        }
      } else {
        pointData.screen_video_id = null
      }
      const updatedPoint = await pointStore.updatePoint(parseInt(editingTaskPoint.value.id), pointData)
      
      // 如果有选中的展厅任务，刷新任务详情以更新任务点列表
      if (selectedHallTaskList.value) {
        try {
          await tourStore.fetchTourPresetItems(parseInt(selectedHallTaskList.value))
          console.log('任务点更新后已刷新展厅任务详情')
        } catch (error) {
          console.warn('刷新展厅任务详情失败:', error)
        }
      }
      
      showSuccessMessage(`任务点更新成功：${addTaskPointForm.value.name} - ${guideStore.getPointNameById(updatedPoint.point_name_id)?.name || '未知点位'}`)
    } catch (error) {
      console.error('更新任务点失败:', error)
      showErrorMessage(error instanceof Error ? error.message : '更新任务点失败')
      return
    }
  } else {
    // 新增模式 - 调用API创建任务点
    try {
      // 获取当前机器人的SN
      const currentSn = getWebSocketSn()
      
      // 根据机器人朝向、动作持续和任务等待生成 action_params
      const navMode = addTaskPointForm.value.robotDirection === '前进' ? 1 : -1
      const actionParams = JSON.stringify({
        hold: addTaskPointForm.value.holdTime || 1.5,
        auto_release: true,
        nav_mode: navMode,
        wait_time: addTaskPointForm.value.waitTime || 0 // 添加任务等待时间
      })
      
      // 构建基本的pointData
      const pointData: any = {
        zone_id: parseInt(selectedAreaId.value),
        type: addTaskPointForm.value.pointType === '讲解点' ? 'explain' as const : 'action' as const,
        point_name_id: addTaskPointForm.value.pointType === '讲解点' && addTaskPointForm.value.pointNameId 
          ? parseInt(addTaskPointForm.value.pointNameId) 
          : (guideStore.pointNames.length > 0 ? guideStore.pointNames[0].id : 1), // 辅助点使用第一个点位ID作为默认值
        custom_name: addTaskPointForm.value.name, // 添加custom_name字段
        pose_x: addTaskPointForm.value.x,
        pose_y: addTaskPointForm.value.y,
        pose_theta: addTaskPointForm.value.angle, // 直接使用原始值
        action_code: addTaskPointForm.value.robotAction === 'none' ? '' : addTaskPointForm.value.robotAction, // 如果选择"无"，则保存为空字符串
        action_params: actionParams,
        robot_sn: currentSn, // 使用当前机器人的SN
        no_wait: addTaskPointForm.value.noWait === true
      }
      
      // 如果选择了视频（不是"无"），添加screen_video_id字段
      const selectedVideoId = addTaskPointForm.value.videoId
      if (selectedVideoId && selectedVideoId !== '') {
        const videoIdNum = parseInt(selectedVideoId)
        if (!isNaN(videoIdNum)) {
          pointData.screen_video_id = videoIdNum
        }
      } else {
        pointData.screen_video_id = null
      }
      const newPoint = await pointStore.createPoint(pointData)
      
      // 如果有选中的展厅任务，刷新任务详情以更新任务点列表
      if (selectedHallTaskList.value) {
        try {
          await tourStore.fetchTourPresetItems(parseInt(selectedHallTaskList.value))
          console.log('任务点创建后已刷新展厅任务详情')
        } catch (error) {
          console.warn('刷新展厅任务详情失败:', error)
        }
      }
      
      showSuccessMessage(`任务点创建成功：${addTaskPointForm.value.name} - ${guideStore.getPointNameById(newPoint.point_name_id)?.name || '未知点位'}`)
    } catch (error) {
      console.error('创建任务点失败:', error)
      showErrorMessage(error instanceof Error ? error.message : '创建任务点失败')
      return
    }
  }
  
  showAddTaskPointDialog.value = false
}

// 取消新增任务点
const handleCancelAddTaskPoint = () => {
  showAddTaskPointDialog.value = false
  editingTaskPoint.value = null
}

// 刷新位置 - 获取机器人当前位置并填充到表单
const refreshPosition = () => {
  // 获取当前机器人的位置数据
  const currentSn = getWebSocketSn()
  let robotPose = getRobotPose(currentSn)
  
  // 如果当前SN没有数据，尝试使用broadcast
  if (!robotPose && currentSn !== 'broadcast') {
    robotPose = getRobotPose('broadcast')
  }
  
  if (robotPose && typeof robotPose.x === 'number' && typeof robotPose.y === 'number' && typeof robotPose.theta === 'number') {
    // 更新表单中的坐标信息
    addTaskPointForm.value.x = robotPose.x
    addTaskPointForm.value.y = robotPose.y
    addTaskPointForm.value.angle = robotPose.theta
    
    console.log('刷新位置成功:', { 
      sn: currentSn, 
      x: robotPose.x, 
      y: robotPose.y, 
      theta: robotPose.theta 
    })
    
    showSuccessMessage('位置信息已更新')
  } else {
    console.warn('无法获取机器人位置数据:', { sn: currentSn, robotPose })
    showErrorMessage('无法获取机器人位置，请确保机器人已连接')
  }
}

// 编辑任务点
const onClickEditTaskPoint = async (point: TaskPoint) => {
  // 每次打开编辑对话框时都刷新视频列表
  try {
    await fetchVideoList()
  } catch (error) {
    console.warn('获取视频列表失败，将使用空列表')
  }
  
  editingTaskPoint.value = point
  // 从point的实际数据中获取原始Point数据
  const originalPoint = pointStore.getPointById(parseInt(point.id))
  
  addTaskPointForm.value = {
    name: originalPoint?.custom_name || point.name, // 优先使用custom_name
    pointNameId: originalPoint?.point_name_id?.toString() || '',
    x: point.x,
    y: point.y,
    angle: point.angle,
    pointType: point.pointType,
    robotAction: originalPoint?.action_code ? originalPoint.action_code : 'none', // 使用原始的 action_code，如果为空则为"无"
    holdTime: parseHoldTime(originalPoint?.action_params || null), // 从action_params解析动作持续时间
    robotDirection: parseRobotDirection(originalPoint?.action_params || null), // 从action_params解析机器人朝向
    waitTime: parseWaitTime(originalPoint?.action_params || null), // 从action_params解析任务等待时间
    videoId: getVideoIdFromPoint((originalPoint as any)?.screen_video_id), // 直接从Point对象获取视频ID
    noWait: (originalPoint as any)?.no_wait === true
  }
  showAddTaskPointDialog.value = true
}

// 删除任务点
const onClickDeleteTaskPoint = async (point: TaskPoint) => {
  const confirmed = await showConfirmDialog('删除确认', `确定要删除任务点"${point.name}"吗？`)
  if (confirmed) {
    try {
      console.log('删除任务点:', point.id)
      await pointStore.deletePoint(parseInt(point.id))
      
      // 如果有选中的展厅任务，刷新任务详情以更新任务点列表
      if (selectedHallTaskList.value) {
        try {
          await tourStore.fetchTourPresetItems(parseInt(selectedHallTaskList.value))
          console.log('任务点删除后已刷新展厅任务详情')
        } catch (error) {
          console.warn('刷新展厅任务详情失败:', error)
        }
      }
      
      showSuccessMessage(`任务点删除成功：${point.name}`)
    } catch (error) {
      console.error('删除任务点失败:', error)
      showErrorMessage(error instanceof Error ? error.message : '删除任务点失败')
    }
  }
}

// 任务点上移
const onClickMoveTaskPointUp = async (point: TaskPoint) => {
  try {
    console.log('任务点上移:', point.id)
    await pointStore.movePointUp(parseInt(point.id))
    showSuccessMessage(`任务点上移成功：${point.name}`)
  } catch (error) {
    console.error('任务点上移失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '任务点上移失败')
  }
}

// 任务点下移
const onClickMoveTaskPointDown = async (point: TaskPoint) => {
  try {
    console.log('任务点下移:', point.id)
    await pointStore.movePointDown(parseInt(point.id))
    showSuccessMessage(`任务点下移成功：${point.name}`)
  } catch (error) {
    console.error('任务点下移失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '任务点下移失败')
  }
}

// 时间格式化
const formatTime = (time: string) => {
  return time
}

// 获取任务点的显示名称
const getPointDisplayName = (point: any) => {
  if (point.custom_name) {
    return point.custom_name
  }
  
  // 如果有point_name_id，尝试从guideStore获取点位名称
  if (point.point_name_id) {
    const pointName = guideStore.getPointNameById(point.point_name_id)
    if (pointName) {
      return pointName.name
    }
  }
  
  // 默认显示类型
  return point.type === 'explain' ? '讲解点' : '辅助点'
}

// 获取任务点类型的CSS类名
const getPointTypeClass = (point: any) => {
  const baseClass = point.type === 'explain' ? 'point-explain' : 'point-action'
  const statusClass = point.is_enabled ? 'point-enabled' : 'point-disabled'
  return `${baseClass} ${statusClass}`
}

// 格式化任务点数据为字符串显示（保留备用）
const formatPointsData = (points: any[]) => {
  if (!points || points.length === 0) {
    return '暂无任务点'
  }
  
  // 只取前10个点位
  const displayPoints = points.slice(0, 10)
  const pointNames = displayPoints.map(point => getPointDisplayName(point))
  
  // 如果超过10个，添加加号提示
  if (points.length > 10) {
    pointNames.push('+')
  }
  
  return pointNames.join(' | ')
}

// 根据任务点ID获取对应的讲解点位名称
const getPointNameByPointId = (taskPointId: string) => {
  const originalPoint = pointStore.getPointById(parseInt(taskPointId))
  if (!originalPoint) return '未知点位'
  
  const pointName = guideStore.getPointNameById(originalPoint.point_name_id)
  return pointName?.name || '未知点位'
}

// 多任务管理相关方法
const getTaskStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    waiting: '等待中',
    running: '执行中', 
    completed: '已完成',
    failed: '已失败'
  }
  return statusMap[status] || status
}

const handleAddHallTask = () => {
  addHallTaskForm.value = {
    name: ''
  }
  showAddHallTaskDialog.value = true
}

const handleDeleteHallTask = async () => {
  if (!selectedHallTaskList.value) {
    return
  }
  
  // 获取选中的任务预设信息
  const presetId = parseInt(selectedHallTaskList.value)
  const preset = tourStore.getTourPresetById(presetId)
  const presetName = preset ? preset.name : '未知任务'
  
  const confirmed = await showConfirmDialog('删除确认', `确定要删除展厅任务"${presetName}"吗？`)
  if (confirmed) {
    try {
      // 调用删除 API
      await tourStore.deleteTourPreset(presetId)
      
      // 删除成功后，watch 会自动处理选中第一个任务的逻辑
      showSuccessMessage('展厅任务删除成功')
    } catch (error) {
      console.error('删除展厅任务失败:', error)
      showErrorMessage('删除展厅任务失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }
}

const handleAddAreaTask = () => {
  // 默认选择第一个展区
  if (currentHallZones.value.length > 0) {
    selectedAreaForTask.value = currentHallZones.value[0].id.toString()
  } else {
  selectedAreaForTask.value = ''
  }
  showAddAreaTaskDialog.value = true
}

// 任务执行状态计算属性
const isTaskExecuting = computed(() => {
  // 直接基于当前任务的状态，只有running才算执行中
  return websocketDataStore.currentTourRun?.status === 'running'
})

// 导航暂停状态 - 从cmd_status中获取nav_paused字段
const isTaskPaused = computed(() => {
  const currentSn = getWebSocketSn()
  const cmdStatus = getRobotCmdStatus(currentSn)
  
  // 如果没有nav_paused字段，返回false（不更新按钮状态）
  if (cmdStatus && typeof cmdStatus.nav_paused === 'number') {
    return cmdStatus.nav_paused === 1
  }
  
  return false
})

// 任务控制相关方法
// 处理任务控制按钮点击（开始/停止）
const handleTaskControlClick = async () => {
  if (isTaskExecuting.value) {
    // 如果正在执行任务，则停止任务
    try {
      const token = userStore.token || localStorage.getItem('token') || ''
      await websocketDataStore.stopCurrentTourRun(token)
      
      // 任务停止成功后，刷新任务运行列表状态
      try {
        await websocketDataStore.fetchTourRuns(token)
        console.log('✅ 任务停止后刷新任务列表成功')
      } catch (error) {
        console.warn('❌ 刷新任务列表失败:', error)
      }
      
      // 重置任务运行状态
      taskRunning.value = false
      showSuccessMessage('任务已停止')
    } catch (error) {
      console.error('❌ 停止任务失败:', error)
      showErrorMessage('停止任务失败，请重试')
    }
  } else {
    // 如果没有执行任务，则开始任务
    await handleStartTask()
  }
}

const handleStartTask = async () => {
  // 检查导航是否开启
  if (!isNavEnabled.value) {
    showErrorMessage('请先开启导航后再执行任务')
    return
  }
  
  if (!selectedHallTaskList.value) {
    return
  }
  
  // 先获取讲解对象数据
  try {
    console.log('获取讲解对象数据...')
    await guideStore.fetchAudiences()
    console.log('讲解对象数据加载完成')
  } catch (error) {
    console.error('获取讲解对象数据失败:', error)
    showErrorMessage('获取讲解对象数据失败，请稍后重试')
    return
  }
  
  // 检查是否有讲解对象
  if (!availableAudiences.value.length) {
    showErrorMessage('暂无可用的讲解对象')
    return
  }
  
  // 默认选择第一个讲解对象
  selectedVisitorType.value = availableAudiences.value[0].id.toString()
  
  // 显示讲解对象选择弹窗
  showVisitorTypeDialog.value = true
}

// 暂停/恢复任务执行
const handlePauseTask = async () => {
  // 检查导航是否启动
  if (!isNavEnabled.value) {
    console.warn('⚠️ 导航未启动，无法操作任务')
    return
  }
  
  // 检查是否有正在执行的任务
  if (!isTaskExecuting.value) {
    console.log('ℹ️ 当前没有正在执行的任务')
    return
  }
  
  try {
    const token = userStore.token || localStorage.getItem('token') || ''
    if (!token) {
      console.error('❌ 未登录或token已过期')
      return
    }
    
    const currentSn = getWebSocketSn()
    if (!currentSn || currentSn === 'broadcast') {
      console.error('❌ 无法获取有效的设备SN')
      return
    }
    
    // 根据当前暂停状态决定操作：当前暂停则恢复(0)，当前未暂停则暂停(1)
    const action = isTaskPaused.value ? 0 : 1 // 1=暂停导航，0=恢复导航
    
    console.log(`${action === 1 ? '⏸️ 发送暂停' : '▶️ 发送恢复'}导航指令`)
    
    await navigationApi.pauseResumeNav(token, {
      sn: currentSn,
      action: action,
      timeout: 10
    })
    
    console.log(`✅ ${action === 1 ? '暂停' : '恢复'}导航指令已发送，等待WebSocket状态更新`)
    
    // 不需要手动更新状态，等待WebSocket的cmd_status.nav_paused字段更新
    
  } catch (error) {
    console.error('❌ 暂停/恢复导航失败:', error)
    showErrorMessage('操作失败，请重试')
  }
}

const handleCancelStartTask = () => {
  showVisitorTypeDialog.value = false
  selectedVisitorType.value = ''
}

const handleConfirmStartTask = async () => {
  if (!selectedVisitorType.value) {
    showErrorMessage('暂无可用的讲解对象')
    return
  }
  
  if (!selectedHallTaskList.value) {
    showErrorMessage('请选择展厅任务')
    return
  }
  
  try {
    const presetId = parseInt(selectedHallTaskList.value)
    const audienceId = parseInt(selectedVisitorType.value)
    
    // 获取选中的讲解对象名称
    const selectedAudience = availableAudiences.value.find(audience => audience.id === audienceId)
    const audienceName = selectedAudience ? selectedAudience.name : '未知'
    
    // 获取当前机器人的SN
    const currentSn = getWebSocketSn()
    
    // 调用开始任务接口（使用 tourStore，与首页保持一致）
    await tourStore.startTourPreset(presetId, {
      audience_id: audienceId,
      robot_sn: currentSn,
      prefer_current_pose: true
    })
    
    // 任务开始成功后，刷新任务运行列表状态
    const token = userStore.token || localStorage.getItem('token') || ''
    if (token) {
      try {
        await websocketDataStore.fetchTourRuns(token)
        console.log('✅ 任务开始后刷新任务列表成功')
      } catch (error) {
        console.warn('❌ 刷新任务列表失败:', error)
      }
    }
    
    // 开始任务成功
    taskRunning.value = true
    showVisitorTypeDialog.value = false
    
    showSuccessMessage(`任务已开始\n讲解对象：${audienceName}\n任务ID：${presetId}`)
  } catch (error) {
    console.error('开始展厅任务失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '开始展厅任务失败')
  }
}

// 新增展厅任务相关方法
const handleCancelAddHallTask = () => {
  showAddHallTaskDialog.value = false
  addHallTaskForm.value = {
    name: ''
  }
}

const handleConfirmAddHallTask = async () => {
  if (!addHallTaskForm.value.name.trim()) {
    showErrorMessage('请输入展厅任务名称')
    return
  }
  
  // 获取当前选中的展厅ID
  if (!selectedHall.value) {
    showErrorMessage('未选择有效的展厅')
    return
  }
  
  // 将selectedHall转换为数字格式
  const hallId = typeof selectedHall.value === 'string' ? parseInt(selectedHall.value) : selectedHall.value
  
  try {
    console.log('创建展厅任务:', addHallTaskForm.value.name.trim(), '展厅ID:', hallId)
    const newTourPreset = await tourStore.createTourPreset(
      addHallTaskForm.value.name.trim(),
      null, // 不再传递描述
      hallId
    )
    
    // 创建成功后，重新获取展厅任务预设数据
    await tourStore.fetchTourPresets(true) // 强制刷新
    
    // 自动选中新创建的任务预设
    selectedHallTaskList.value = newTourPreset.id.toString()
    
    showSuccessMessage(`展厅任务创建成功：${newTourPreset.name}`)
  } catch (error) {
    console.error('创建展厅任务失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '创建展厅任务失败')
    return
  }
  
  showAddHallTaskDialog.value = false
  addHallTaskForm.value = {
    name: ''
  }
}

// 添加展区任务相关方法
const handleCancelAddAreaTask = () => {
  showAddAreaTaskDialog.value = false
  selectedAreaForTask.value = ''
}

const handleConfirmAddAreaTask = async () => {
  if (!selectedAreaForTask.value) {
    showErrorMessage('请选择展区')
    return
  }
  
  if (!selectedHallTaskList.value) {
    showErrorMessage('请先选择展厅任务')
    return
  }
  
  try {
    const presetId = parseInt(selectedHallTaskList.value)
    const zoneId = parseInt(selectedAreaForTask.value)
    
    console.log('添加展区任务 - 预设ID:', presetId, '展区ID:', zoneId)
    
    // 调用API添加任务预设项
    await tourStore.addTourPresetItem(presetId, zoneId)
    
    const hallName = getCurrentHallName()
    const areaName = currentHallZones.value.find(area => area.id.toString() === selectedAreaForTask.value)?.name || ''
    
    showSuccessMessage(`展区任务添加成功\n展厅：${hallName}\n展区：${areaName}`)
  
  showAddAreaTaskDialog.value = false
  selectedAreaForTask.value = ''
  } catch (error) {
    console.error('添加展区任务失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '添加展区任务失败')
  }
}

const onClickExecuteTask = async (task: MultiTask) => {
  const confirmed = await showConfirmDialog('确认执行', `确定要执行任务"${task.name}"吗？`)
  if (confirmed) {
    task.status = 'running'
    task.executeTime = new Date().toLocaleString()
    showSuccessMessage('任务开始执行')
  }
}

const onClickViewTaskDetails = (task: TaskPresetDisplay) => {
  // 显示任务详情，可以在这里打开一个详情弹窗
  const pointDetails = task.points.map((point: any) => {
    return `${getPointDisplayName(point)} (${point.type === 'explain' ? '讲解点' : '辅助点'})`
  }).join(', ')
  
  resultDialogState.value = {
    show: true,
    type: 'info',
    title: '任务详情',
    message: `展区：${task.zoneName}`,
    details: `任务点总数：${task.pointsCount}\n启用点数：${task.enabledPointsCount}\n任务点详情：${pointDetails}`
  }
}

const onClickEditMultiTask = (task: TaskPresetDisplay) => {
  // 这里可以实现编辑功能，目前显示详情
  onClickViewTaskDetails(task)
}

const onClickDeleteTaskPreset = async (task: TaskPresetDisplay) => {
  const confirmed = await showConfirmDialog('删除确认', `确定要删除展区"${task.zoneName}"的任务吗？`)
  if (confirmed) {
    try {
      const token = userStore.token
      if (!token) {
        showErrorMessage('用户未登录，请先登录')
        return
      }

      if (!selectedHallTaskList.value) {
        showErrorMessage('未选择展厅任务')
        return
      }

      const presetId = parseInt(selectedHallTaskList.value)
      const itemId = parseInt(task.id)

      console.log('删除展厅任务项:', { presetId, itemId, zoneName: task.zoneName })

      // 调用API删除任务预设项
      await tourApi.deleteTourPresetItem(token, presetId, itemId)

      showSuccessMessage(`删除任务成功：${task.zoneName}`)

      // 刷新展厅任务列表
      await tourStore.fetchTourPresetItems(presetId)
    } catch (error) {
      console.error('删除展厅任务项失败:', error)
      showErrorMessage(error instanceof Error ? error.message : '删除任务失败，请重试')
    }
  }
}

// 展厅任务预设项上移
const onClickMoveTaskPresetUp = async (task: TaskPresetDisplay) => {
  try {
    if (!selectedHallTaskList.value) {
      showErrorMessage('未选择展厅任务')
      return
    }

    const presetId = parseInt(selectedHallTaskList.value)
    const itemId = parseInt(task.id)

    console.log('展厅任务项上移:', { presetId, itemId, zoneName: task.zoneName })

    await tourStore.moveTourPresetItemUp(presetId, itemId)
    showSuccessMessage(`任务上移成功：${task.zoneName}`)
  } catch (error) {
    console.error('展厅任务项上移失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '任务上移失败，请重试')
  }
}

// 展厅任务预设项下移
const onClickMoveTaskPresetDown = async (task: TaskPresetDisplay) => {
  try {
    if (!selectedHallTaskList.value) {
      showErrorMessage('未选择展厅任务')
      return
    }

    const presetId = parseInt(selectedHallTaskList.value)
    const itemId = parseInt(task.id)

    console.log('展厅任务项下移:', { presetId, itemId, zoneName: task.zoneName })

    await tourStore.moveTourPresetItemDown(presetId, itemId)
    showSuccessMessage(`任务下移成功：${task.zoneName}`)
  } catch (error) {
    console.error('展厅任务项下移失败:', error)
    showErrorMessage(error instanceof Error ? error.message : '任务下移失败，请重试')
  }
}

const onClickDeleteMultiTask = async (task: MultiTask) => {
  const confirmed = await showConfirmDialog('删除确认', `确定要删除任务"${task.name}"吗？`)
  if (confirmed) {
    const index = multiTaskList.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      multiTaskList.value.splice(index, 1)
      showSuccessMessage('任务删除成功')
    }
  }
}

// 上移和下移方法
const onClickMoveUp = (task: TaskPresetDisplay, index: number) => {
  // 任务排序功能，这里可以调用API来更新任务顺序
  showSuccessMessage(`上移任务：${task.zoneName}`)
}

const onClickMoveDown = (task: TaskPresetDisplay, index: number) => {
  // 任务排序功能，这里可以调用API来更新任务顺序
  showSuccessMessage(`下移任务：${task.zoneName}`)
}

// 错误消息提示（使用自定义弹窗）
const showErrorMessage = (message: string) => {
  resultDialogState.value = {
    show: true,
    type: 'error',
    title: '操作失败',
    message,
    details: null
  }
  // 3秒后自动关闭
  setTimeout(() => {
    resultDialogState.value.show = false
  }, 3000)
}

// 关闭结果弹窗
const closeResultDialog = () => {
  resultDialogState.value.show = false
}
</script>

<style scoped>
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

/* 全屏模式下修复日期选择器和下拉框定位问题（iPad等设备） */
:fullscreen .dispatch-task-input[type="date"],
:fullscreen .dispatch-task-input[type="datetime-local"],
:fullscreen select,
:fullscreen .mission-select,
:-webkit-full-screen .dispatch-task-input[type="date"],
:-webkit-full-screen .dispatch-task-input[type="datetime-local"],
:-webkit-full-screen select,
:-webkit-full-screen .mission-select,
:-moz-full-screen .dispatch-task-input[type="date"],
:-moz-full-screen .dispatch-task-input[type="datetime-local"],
:-moz-full-screen select,
:-moz-full-screen .mission-select {
  position: relative;
  z-index: 9999;
}

/* 全屏模式下确保对话框容器有正确的层叠上下文 */
:fullscreen .custom-dialog,
:-webkit-full-screen .custom-dialog,
:-moz-full-screen .custom-dialog {
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
}

/* 全屏模式下修复下拉选项列表的定位 */
:fullscreen .custom-select-wrapper,
:-webkit-full-screen .custom-select-wrapper,
:-moz-full-screen .custom-select-wrapper {
  position: relative;
  z-index: 9999;
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

.dispatch-algorithm-option:hover {
  /* 移除动态效果 */
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

/* 展厅栅格图卡片 */
.hall-grid-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #172233;
  border: 1px solid #164159;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

/* 顶部工具栏区域 */
.hall-grid-header {
  background: rgba(22, 65, 89, 0.8);
  border-bottom: 1px solid #164159;
  padding: 0;
  backdrop-filter: blur(4px);
}

/* 展厅选择容器 */
.hall-select-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;
}

/* 内联删除按钮 */
.hall-delete-btn-inline {
  padding: 6px 12px;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.hall-delete-btn-inline:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.hall-delete-btn-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #6c757d;
  transform: none;
  box-shadow: none;
}

/* 主要内容区域 */
.hall-grid-main {
  flex: 1;
  display: flex;
  position: relative;
  min-height: 400px;
}

/* 栅格图容器 */
.gridmap-container { 
  position: relative; 
  flex: 1; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  overflow: hidden; 
  background: #fff; 
}
.grid-canvas { 
  position: absolute;
  top: 0;
  left: 0;
  background: #fff; 
  cursor: grab; 
  user-select: none; 
  transform-origin: 0 0; 
  touch-action: none; /* 禁用浏览器默认的触摸行为，防止页面滚动 */
  -webkit-user-select: none; /* Safari */
  -webkit-touch-callout: none; /* iOS Safari - 禁用长按弹出菜单 */
}
.grid-canvas:active { cursor: grabbing; }

/* 展厅管理标题栏间距优化 */
.mission-top-card {
  gap: 6px !important; /* 减少标题和内容之间的间距 */
}
.mission-top-header {
  margin-bottom: 2px !important; /* 减少标题底部间距 */
}

/* 展厅管理工具栏与进度条 */
.hall-toolbar { display: flex; flex-direction: column; gap: 10px; margin-top: 0px; }
.hall-toolbar-row { display: flex; align-items: center; gap: 12px; min-height: 40px; }
.hall-actions { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; }
.hall-btn { height: 32px; padding: 0 14px; border-radius: 6px; }
.hall-select { display: flex; align-items: center; gap: 8px; }
.map-progress { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 420px; }
.map-progress-track { width: 100%; height: 12px; background: linear-gradient(180deg, rgba(103,213,253,.18), rgba(103,213,253,.08)); border: 1px solid rgba(103,213,253,.35); border-radius: 999px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,.28), 0 0 10px rgba(22,187,242,.18); }
.map-progress-fill { position: relative; height: 100%; background: linear-gradient(90deg, #2ed1ff 0%, #59c0fc 35%, #16bbf2 65%, #00e0ff 100%); transition: width .25s ease; box-shadow: 0 0 10px rgba(22,187,242,.6); }
.map-progress-fill::after { content: ""; position: absolute; top: 0; bottom: 0; left: -40%; width: 40%; background: linear-gradient(90deg, rgba(255,255,255,.0) 0%, rgba(255,255,255,.35) 50%, rgba(255,255,255,.0) 100%); filter: blur(1px); animation: progress-shimmer 2.2s linear infinite; }
.map-progress-text { color: #cfe9f3; font-size: 12px; min-width: 40px; text-align: right; opacity: .9; }
@keyframes progress-shimmer { 0% { transform: translateX(0); } 100% { transform: translateX(260%); } }
.map-progress-text { color: #cfe9f3; font-size: 12px; min-width: 40px; text-align: right; opacity: .9; }

/* 紧凑型工具栏 */
.grid-toolbar-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(22, 65, 89, 0.8);
  border-bottom: 1px solid #164159;
  backdrop-filter: blur(4px);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  color: #67d5fd;
  font-size: 14px;
  font-weight: 500;
}

.toolbar-select {
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.8);
  color: #67d5fd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  min-width: 120px;
  transition: all 0.2s;
}

.toolbar-select:hover {
  background: #0c4666;
  border-color: rgba(38, 131, 182, 1);
}

.toolbar-select:focus {
  outline: none;
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  color: #67d5fd;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: rgba(103, 213, 253, 0.5);
}

.toolbar-btn.active {
  background: #67d5fd;
  border-color: #67d5fd;
  color: #172233;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.4);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(103, 213, 253, 0.05);
  border-color: rgba(103, 213, 253, 0.15);
}

.toolbar-btn:disabled:hover {
  background: rgba(103, 213, 253, 0.05);
  border-color: rgba(103, 213, 253, 0.15);
}

.btn-icon {
  font-size: 12px;
}

/* 右侧编辑面板 */
.edit-panel-right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: rgba(22, 65, 89, 0.9);
  border-left: 1px solid #164159;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(4px);
}

.panel-tools {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;
  gap: 8px;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-item {
  width: 44px;
  height: 44px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-item:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: rgba(103, 213, 253, 0.5);
}

.tool-item.active {
  background: #67d5fd;
  border-color: #67d5fd;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.4);
}

.tool-icon {
  font-size: 18px;
  color: #67d5fd;
}

.tool-item.active .tool-icon {
  color: #172233;
}

.tool-settings {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.setting-item label {
  color: #b8c7d9;
  font-size: 10px;
  text-transform: uppercase;
}

.size-slider {
  width: 40px;
  height: 80px;
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
}

.size-value {
  color: #67d5fd;
  font-size: 10px;
  background: rgba(22, 65, 89, 0.6);
  border: 1px solid #164159;
  padding: 2px 4px;
  border-radius: 2px;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.tool-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  width: 44px;
  height: 32px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  color: #67d5fd;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: rgba(103, 213, 253, 0.5);
}

.action-btn:disabled {
  background: rgba(22, 65, 89, 0.3);
  border-color: rgba(22, 65, 89, 0.5);
  color: #6b7a8c;
  cursor: not-allowed;
}

.action-btn:disabled:hover {
  background: rgba(22, 65, 89, 0.3);
  border-color: rgba(22, 65, 89, 0.5);
}

/* 导航工具 */
.navigation-tools {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.nav-item {
  width: 44px;
  height: 36px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: rgba(103, 213, 253, 0.5);
}

.nav-item.active {
  background: #67d5fd;
  border-color: #67d5fd;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.4);
}

.nav-icon {
  font-size: 14px;
  color: #67d5fd;
}

.nav-item.active .nav-icon {
  color: #172233;
}

/* 图片按钮样式 */
.btn-icon-img {
  width: 16px;
  height: 16px;
  filter: brightness(0) saturate(100%) invert(74%) sepia(37%) saturate(1756%) hue-rotate(174deg) brightness(95%) contrast(101%);
}

.toolbar-btn.active .btn-icon-img {
  filter: brightness(0) saturate(100%) invert(15%) sepia(12%) saturate(1278%) hue-rotate(181deg) brightness(95%) contrast(87%);
}

.tool-icon-img {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%) invert(74%) sepia(37%) saturate(1756%) hue-rotate(174deg) brightness(95%) contrast(101%);
}

.tool-item.active .tool-icon-img {
  filter: brightness(0) saturate(100%) invert(15%) sepia(12%) saturate(1278%) hue-rotate(181deg) brightness(95%) contrast(87%);
}

.nav-icon-img {
  width: 18px;
  height: 18px;
  filter: brightness(0) saturate(100%) invert(74%) sepia(37%) saturate(1756%) hue-rotate(174deg) brightness(95%) contrast(101%);
}

.nav-item.active .nav-icon-img {
  filter: brightness(0) saturate(100%) invert(15%) sepia(12%) saturate(1278%) hue-rotate(181deg) brightness(95%) contrast(87%);
}

.action-icon-img {
  width: 16px;
  height: 16px;
  filter: brightness(0) saturate(100%) invert(74%) sepia(37%) saturate(1756%) hue-rotate(174deg) brightness(95%) contrast(101%);
}

.action-btn:disabled .action-icon-img {
  filter: brightness(0) saturate(100%) invert(39%) sepia(8%) saturate(1077%) hue-rotate(181deg) brightness(95%) contrast(89%);
}

/* 展区管理样式 */
.area-top-card {
  margin-bottom: 4px;
}

.area-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 8px;
  flex-wrap: nowrap;
  min-height: 40px;
}

/* 左侧区域容器 */
.area-left-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.area-filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.area-filter-label {
  color: #67d5fd;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.area-select {
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.8);
  color: #67d5fd;
  padding: 6px 12px;
  padding-right: 30px;
  border-radius: 4px;
  font-size: 13px;
  min-width: 180px;
  transition: all 0.2s;
  /* 隐藏默认下拉箭头 */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: none;
  -webkit-background-image: none;
  -moz-background-image: none;
}

/* 隐藏所有浏览器的默认下拉箭头 */
.area-select::-ms-expand {
  display: none;
}

.area-select::-webkit-select-placeholder {
  display: none;
}

.area-select::-moz-select-placeholder {
  display: none;
}

/* 针对不同浏览器的额外隐藏规则 */
.area-select::-webkit-inner-spin-button,
.area-select::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.area-select::-webkit-calendar-picker-indicator {
  display: none;
}

.area-select:hover {
  background: #0c4666;
  border-color: rgba(38, 131, 182, 1);
}

.area-select:focus {
  outline: none;
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.area-action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 添加展区任务弹窗美化样式 */
.add-area-task-dialog .custom-dialog {
  min-width: 420px;
  max-width: 460px;
}

.add-area-task-dialog .add-user-form {
  padding: 8px 0;
  gap: 12px;
}

.add-area-task-dialog .add-user-form-row {
  min-height: 36px;
  gap: 12px;
}

.add-area-task-dialog .add-user-form label {
  min-width: 90px;
  font-size: 14px;
  font-weight: 500;
}

.add-area-task-dialog .custom-select-wrapper {
  flex: 1;
  min-width: 180px;
}

.add-area-task-dialog .current-hall-display {
  flex: 1;
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.6);
  border-radius: 4px;
  color: #fff;
  padding: 8px 12px;
  font-size: 14px;
  min-height: 36px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  opacity: 0.8;
}

.add-area-task-dialog .user-select {
  width: 100%;
  padding: 8px 36px 8px 12px;
  font-size: 14px;
  min-height: 36px;
  border-radius: 4px;
  border: 1px solid rgba(38, 131, 182, 0.6);
  background: #0a2d3f;
  transition: all 0.3s ease;
}

.add-area-task-dialog .user-select:focus {
  border-color: #67d5fd;
  background: #0c3c56;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.2);
}

.add-area-task-dialog .user-select:disabled {
  background: #1a2b3d;
  color: rgba(255, 255, 255, 0.5);
  border-color: rgba(38, 131, 182, 0.3);
  cursor: not-allowed;
}

.add-area-task-dialog .custom-select-arrow {
  right: 10px;
  pointer-events: none;
}

.add-area-task-dialog .custom-select-arrow svg {
  width: 12px;
  height: 12px;
}

.add-area-task-dialog .custom-dialog-actions {
  padding-top: 16px;
  gap: 12px;
}

.add-area-task-dialog .mission-btn {
  min-width: 90px;
  height: 36px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.add-area-task-dialog .custom-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #67d5fd;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(103, 213, 253, 0.2);
  margin-bottom: 12px;
}

.add-area-task-dialog .custom-dialog-content {
  padding: 0 20px;
}

/* 添加一些悬停效果 */
.add-area-task-dialog .user-select:not(:disabled):hover {
  border-color: rgba(103, 213, 253, 0.8);
  background: #0c3c56;
}

.add-area-task-dialog .mission-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.custom-select-wrapper {
  position: relative;
  display: inline-block;
}

.custom-select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* 自定义下拉组件样式 */
.custom-select-component {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.custom-select-trigger {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 30px 0 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  box-shadow: 0 0 0 1px #164159 inset;
  box-sizing: border-box;
}

.custom-select-trigger:hover {
  border-color: rgba(103, 213, 253, 0.5);
  background: rgba(103, 213, 253, 0.05);
}

.custom-select-trigger.is-active {
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.custom-select-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
  text-align: left;
}

.custom-select-trigger .custom-select-arrow {
  position: static;
  transform: none;
  margin-left: 8px;
  flex-shrink: 0;
  pointer-events: none;
}

.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 200px;
  background: #0a2a3a;
  border: 1px solid #164159;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.custom-select-dropdown-list {
  padding: 4px 0;
  width: 100%;
  box-sizing: border-box;
}

.custom-select-dropdown-item {
  padding: 8px 12px;
  font-size: 14px;
  color: #b8c7d9;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  box-sizing: border-box;
}

.custom-select-dropdown-item:hover {
  background: rgba(103, 213, 253, 0.1);
  color: #67d5fd;
}

.custom-select-dropdown-item.is-selected {
  background: rgba(103, 213, 253, 0.15);
  color: #67d5fd;
  font-weight: 500;
}

.custom-select-dropdown-item.is-disabled {
  color: rgba(184, 199, 217, 0.5);
  cursor: not-allowed;
}

.custom-select-dropdown-item.is-disabled:hover {
  background: transparent;
  color: rgba(184, 199, 217, 0.5);
}

/* 下拉框滚动条样式 */
.custom-select-dropdown::-webkit-scrollbar {
  width: 6px;
}

.custom-select-dropdown::-webkit-scrollbar-track {
  background: rgba(22, 65, 89, 0.3);
  border-radius: 3px;
}

.custom-select-dropdown::-webkit-scrollbar-thumb {
  background: rgba(103, 213, 253, 0.3);
  border-radius: 3px;
}

.custom-select-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(103, 213, 253, 0.5);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #6b7a8c;
  font-size: 14px;
}

.user-textarea {
  width: 100%;
  min-height: 80px;
  border-radius: 6px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 8px 12px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  transition: border 0.2s, box-shadow 0.2s;
}

.user-textarea:focus {
  outline: none;
  border: 1.5px solid #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.user-textarea::placeholder {
  color: #6b7a8c;
}

/* 按钮禁用状态 */
.mission-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mission-btn-stop:disabled {
  background: #561c1c;
  color: #fd6767;
  opacity: 0.5;
}

.mission-btn-normal:disabled {
  background: #1a3a4a;
  color: #fff;
  opacity: 0.5;
}


/* 表单样式 */
.add-user-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.add-user-form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
}

.add-user-form label {
  min-width: 90px;
  color: #67d5fd;
  font-size: 14px;
  text-align: right;
  flex-shrink: 0;
}

.add-user-form .user-input,
.add-user-form .user-select {
  flex: 1;
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.6);
  border-radius: 4px;
  color: #fff;
  padding: 8px 12px;
  font-size: 14px;
  min-height: 36px;
  box-sizing: border-box;
}

.add-user-form .user-input:focus,
.add-user-form .user-select:focus {
  outline: none;
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.add-user-form .user-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* 隐藏数字输入框的上下按钮 */
.add-user-form .user-input.no-spinners {
  appearance: textfield;
  -moz-appearance: textfield;
}

.add-user-form .user-input.no-spinners::-webkit-outer-spin-button,
.add-user-form .user-input.no-spinners::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* textarea样式 */
.add-user-form textarea.user-input {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.4;
}

/* 带单位的输入框样式 */
.add-user-form .input-with-unit {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-user-form .input-with-unit .user-input {
  flex: 1;
}

.add-user-form .input-with-unit .input-unit {
  color: #67d5fd;
  font-size: 14px;
  flex-shrink: 0;
  min-width: fit-content;
}

/* 带刷新按钮的坐标组合样式 */
.add-user-form .coordinates-with-refresh {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.add-user-form .coordinates-rows {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 细长型竖向刷新位置按钮 */
.add-user-form .refresh-position-btn-slim {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  background: linear-gradient(180deg, #1a5a7a 0%, #0c3c56 100%);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 4px;
  color: #67d5fd;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  width: 36px;
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 3px;
}

.add-user-form .refresh-position-btn-slim:hover {
  background: linear-gradient(180deg, #2a6a8a 0%, #1c4c66 100%);
  border-color: rgba(103, 213, 253, 0.6);
  box-shadow: 0 0 8px rgba(103, 213, 253, 0.3);
  transform: translateX(2px);
}

.add-user-form .refresh-position-btn-slim:active {
  transform: translateX(0);
  box-shadow: 0 0 4px rgba(103, 213, 253, 0.2);
}

/* 展区名称输入组合样式 */
.area-name-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid rgba(38, 131, 182, 0.6);
  border-radius: 4px;
  overflow: hidden;
  background: #0c3c56;
}

.area-name-prefix {
  background: rgba(38, 131, 182, 0.3);
  color: #67d5fd;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  min-height: 36px;
  min-width: 100px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border-right: 1px solid rgba(38, 131, 182, 0.6);
  white-space: nowrap;
  flex-shrink: 0;
}

.area-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  padding: 8px 12px;
  font-size: 14px;
  min-height: 36px;
  box-sizing: border-box;
  outline: none;
}

.area-name-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.area-name-input-group:focus-within {
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.add-user-form .custom-select-wrapper {
  position: relative;
  flex: 1;
}

.add-user-form .custom-select-wrapper .user-select {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: none;
  padding-right: 32px;
}

.add-user-form .custom-select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #67d5fd;
}

.add-user-form .custom-select-arrow svg {
  width: 12px;
  height: 12px;
}

/* 机器人动作选择器特殊样式 */
.add-user-form .robot-action-select {
  max-height: 200px;
  overflow-y: auto;
}

/* 为机器人动作选择器的下拉选项设置样式 */
.add-user-form .robot-action-select option {
  padding: 8px 12px;
  line-height: 1.4;
}

/* 讲解对象选择弹窗的特殊样式 */
.custom-dialog[data-dialog="start-task"] .add-user-form .custom-select-wrapper {
  min-width: 210px;
}

.custom-dialog[data-dialog="start-task"] .add-user-form .user-select {
  min-width: 210px;
}

.add-user-form .custom-select-arrow svg polygon {
  fill: #67d5fd;
}

/* Radio 组件样式 */
.radio-group {
  display: flex;
  gap: 20px;
  flex: 1;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #67d5fd;
  font-size: 14px;
}

.radio-item input[type="radio"] {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(38, 131, 182, 0.6);
  border-radius: 50%;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  position: relative;
  margin: 0;
}

.radio-item input[type="radio"]:checked {
  border-color: #67d5fd;
  background: #67d5fd;
}

.radio-item input[type="radio"]:checked::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #0c3c56;
  border-radius: 50%;
}

.radio-item input[type="radio"]:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.radio-item:hover input[type="radio"] {
  border-color: #67d5fd;
}

.radio-label {
  user-select: none;
}

/* 操作按钮组样式 */
.user-action-btns {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

/* 图标按钮样式 */
.icon-btn {
  background: transparent;
  border: none;
  padding: 0 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: #223a5e44;
  border-radius: 4px;
}

.icon-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

/* 移动按钮特殊样式 - 蓝色主题 */
.icon-btn.move-btn img {
  /* 蓝色滤镜，和编辑按钮颜色一致 */
  filter: brightness(0) saturate(100%) invert(56%) sepia(89%) saturate(1475%) hue-rotate(166deg) brightness(103%) contrast(101%);
}

.icon-btn.move-btn:hover {
  background: rgba(34, 187, 242, 0.15);
}

.icon-btn.move-btn:hover:not(:disabled) img {
  filter: brightness(0) saturate(100%) invert(71%) sepia(56%) saturate(2717%) hue-rotate(166deg) brightness(104%) contrast(98%);
}

.icon-btn.move-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.icon-btn.move-btn:disabled:hover {
  background: transparent;
}

.icon-btn.move-btn:disabled img {
  filter: brightness(0) saturate(100%) invert(56%) sepia(89%) saturate(1475%) hue-rotate(166deg) brightness(103%) contrast(101%) opacity(0.4);
}


/* 任务状态样式 */
.task-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.task-status.waiting {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.task-status.running {
  background: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.task-status.completed {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.task-status.failed {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

/* 任务控制按钮样式 */
.task-control-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.task-control-buttons .mission-btn {
  min-width: 80px;
  height: 32px;
  padding: 6px 12px;
  font-size: 13px;
  white-space: nowrap;
}

/* 任务点详情显示样式 */
.points-detail-cell {
  text-align: center;
}

.points-visual-display {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 4px;
  max-height: 60px;
  overflow: hidden;
}

.point-name-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid;
  transition: all 0.2s ease;
  position: relative;
}

/* 讲解点样式 */
.point-name-tag.point-explain.point-enabled {
  background: linear-gradient(135deg, rgba(103, 213, 253, 0.15), rgba(103, 213, 253, 0.25));
  color: #67d5fd;
  border-color: rgba(103, 213, 253, 0.4);
  box-shadow: 0 1px 3px rgba(103, 213, 253, 0.1);
}

.point-name-tag.point-explain.point-disabled {
  background: rgba(103, 213, 253, 0.08);
  color: rgba(103, 213, 253, 0.6);
  border-color: rgba(103, 213, 253, 0.2);
}

/* 辅助点样式 */
.point-name-tag.point-action.point-enabled {
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.15), rgba(255, 165, 0, 0.25));
  color: #ffa500;
  border-color: rgba(255, 165, 0, 0.4);
  box-shadow: 0 1px 3px rgba(255, 165, 0, 0.1);
}

.point-name-tag.point-action.point-disabled {
  background: rgba(255, 165, 0, 0.08);
  color: rgba(255, 165, 0, 0.6);
  border-color: rgba(255, 165, 0, 0.2);
}

/* hover效果 */
.point-name-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* 更多点位指示器 */
.more-points-indicator {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(182, 182, 182, 0.15);
  color: #b6b6b6;
  border: 1px solid rgba(182, 182, 182, 0.3);
  font-style: italic;
}

/* 状态样式 */
.status-enabled {
  color: #52c41a;
  font-weight: 500;
}

.status-disabled {
  color: #ff4d4f;
  font-weight: 500;
}

/* 地图录制loading遮罩样式 */
.recording-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.recording-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: rgba(22, 34, 51, 0.95);
  border-radius: 12px;
  border: 1px solid #164159;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.recording-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-top: 3px solid #67D5FD;
  border-radius: 50%;
  animation: recording-spin 1s linear infinite;
  margin-bottom: 16px;
}

.recording-loading-text {
  color: #67D5FD;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

@keyframes recording-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 地图生成loading遮罩样式 */
.generate-map-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.generate-map-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: rgba(22, 34, 51, 0.95);
  border-radius: 12px;
  border: 1px solid #164159;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.generate-map-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-top: 3px solid #67D5FD;
  border-radius: 50%;
  animation: generate-map-spin 1s linear infinite;
  margin-bottom: 16px;
}

.generate-map-loading-text {
  color: #67D5FD;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

@keyframes generate-map-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 地图生成完成弹窗样式 */
.completion-dialog {
  min-width: 400px;
  max-width: 500px;
}

/* 紧凑型完成弹窗 */
.completion-dialog-compact {
  min-width: 360px;
  max-width: 450px;
}

.completion-message-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
}

.completion-check-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3));
  animation: check-pop 0.4s ease-out;
}

.completion-text-inline {
  color: #67D5FD;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}

@keyframes check-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 保留旧样式以兼容其他地方可能的使用 */
.completion-message {
  text-align: center;
  padding: 20px 0;
}

.completion-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.completion-text {
  color: #67D5FD;
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 8px 0;
  line-height: 1.5;
}

.completion-hint {
  color: #b8c7d9;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* 任务点名称单元格样式 - 文本截断 */
.task-point-name-cell {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹窗按钮统一宽度 */
.custom-dialog-actions .mission-btn {
  min-width: 100px;
}

/* 删除确认弹窗样式 */
.delete-confirm-dialog {
  min-width: 380px;
  max-width: 420px;
}

.delete-confirm-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
}

.delete-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.delete-text {
  color: #b6b6b6;
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
}

/* 停止录制成功弹窗样式 */
.stop-recording-success-dialog {
  min-width: 360px;
  max-width: 400px;
}

.success-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
}

.success-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.success-text {
  color: #b6b6b6;
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
}

/* 数据包行布局 */
.data-package-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px; /* 减小间距，让下拉框更宽 */
}

.data-package-wrapper .custom-select-component {
  flex: 1;
  min-width: 0; /* 确保flex能正常工作 */
}

.data-package-wrapper .mission-btn-delete-package {
  flex-shrink: 0;
  margin-left: 4px; /* 增加一点额外间距 */
}

/* 删除数据包按钮样式 */
.mission-btn-delete-package {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid rgba(255, 77, 79, 0.3);
  background: rgba(255, 77, 79, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mission-btn-delete-package img {
  width: 16px;
  height: 16px;
  filter: brightness(0) saturate(100%) invert(42%) sepia(95%) saturate(3000%) hue-rotate(340deg) brightness(100%) contrast(105%);
}

.mission-btn-delete-package:hover:not(:disabled) {
  background: rgba(255, 77, 79, 0.2);
  border-color: rgba(255, 77, 79, 0.5);
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.2);
}

.mission-btn-delete-package:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 77, 79, 0.05);
  border-color: rgba(255, 77, 79, 0.1);
}

.mission-btn-delete-package:disabled img {
  filter: brightness(0) saturate(100%) invert(42%) sepia(95%) saturate(3000%) hue-rotate(340deg) brightness(100%) contrast(105%) opacity(50%);
}

</style>
