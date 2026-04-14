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
          v-permission-click-dialog="tab.permission"
          @click="handleTabClick(tab)"
        >
          <img :src="tab.icon" :alt="tab.label" />
        </div>
      </div>
    </aside>
    <!-- 主体内容区 -->
    <main class="main-content" :class="{ 'page-buttons-locked': isPageButtonsLocked }">
      <div class="main-flex">
        <section class="right-panel">
          <!-- 录包建图 -->
          <template v-if="currentTab === 'map_record'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="nav-top-title">录包建图</span>
              </div>
            </div>
            <div class="nav-content-wrapper track-record-content">
              <!-- 采集地图数据 -->
              <div class="map-section">
                <div class="map-section-title">采集地图数据</div>
                <div class="map-section-buttons">
                  <button 
                    class="map-btn map-btn-primary" 
                    :disabled="isRecording"
                    v-permission-click-dialog="'nav-lbjt-startrecord'"
                    @click="handleStartRecording"
                  >
                    开始录包
                  </button>
                  <button 
                    class="map-btn"
                    :class="isRecording ? 'map-btn-danger' : 'map-btn-secondary'"
                    :disabled="!isRecording"
                    v-permission-click-dialog="'nav-lbjt-finishrecord'"
                    @click="handleStopRecording"
                  >
                    完成录制
                  </button>
                </div>
              </div>

              <!-- 创建二维地图 -->
              <div class="map-section">
                <div class="map-section-title">创建二维地图</div>
                <div class="map-section-buttons">
                  <button class="map-btn map-btn-primary" :disabled="isRecording || !canGenerateMap" v-permission-click-dialog="'nav-lbjt-slam'" @click="handleGenerateMap">生成地图</button>
                  <button class="map-btn map-btn-primary" :disabled="isRecording || mappingStopLoading" v-permission-click-dialog="'nav-lbjt-changepcd'" @click="handleGenerateGridMap">生成栅格地图</button>
                  <button class="map-btn map-btn-primary" :disabled="isRecording || !hasRobotRtk" v-permission-click-dialog="'nav-lbjt-msfrecord'" @click="handleCreateFusionMap">新建融合地图</button>
                </div>
              </div>

              <!-- 建图进度 -->
              <div class="map-section">
                <div class="map-progress-header">
                  <div class="map-section-title">建图进度: <span class="map-progress-percent">{{ mapProgress }}%</span></div>
                </div>
                <div class="map-progress-wrapper">
                  <div class="map-progress-bar">
                    <div 
                      class="map-progress-fill" 
                      :style="{ width: mapProgress + '%' }"
                    ></div>
                  </div>
                  <button 
                    class="map-btn map-btn-stop" 
                    :disabled="mapProgress === 0"
                    v-permission-click-dialog="'nav-lbjt-stopslam'"
                    @click="handleStopMapping"
                  >
                    终止
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 导航 -->
          <template v-else-if="currentTab === 'nav'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="nav-top-title">导航</span>
              </div>
            </div>
            <div class="nav-content-wrapper nav-page-content">
              <!-- 顶部按钮区 -->
              <div class="map-section">
                <div class="nav-button-group">
                  <button 
                    class="map-btn" 
                    :class="[navigationEnabled ? 'map-btn-danger' : 'map-btn-primary', { loading: navigationLoading }]"
                    :disabled="navMapList.length === 0 || insEnabled || msfEnabled || navigationLoading"
                    v-permission-click-dialog="'nav-navmanage-startnav'"
                    @click="handleStartNav"
                  >
                    {{ navigationEnabled ? '关闭导航' : '开始导航' }}
                  </button>
                  <button class="map-btn" :class="appNavPauseEnabled ? 'map-btn-danger' : 'map-btn-secondary'" :disabled="navMapList.length === 0" v-permission-click-dialog="'nav-navmanage-pausenav'" @click="handlePauseNav">
                    {{ appNavPauseEnabled ? '恢复导航' : '暂停导航' }}
                  </button>
                  <button class="map-btn" :class="appNavNavtrackEnabled ? 'map-btn-danger' : 'map-btn-secondary'" :disabled="navMapList.length === 0" v-permission-click-dialog="'nav-navmanage-resumenav'" @click="handleToggleNavStop">
                    {{ appNavNavtrackEnabled ? '恢复停障' : '暂停停障' }}
                  </button>
                  <button 
                    class="map-btn" 
                    :class="insEnabled ? 'map-btn-danger' : 'map-btn-primary'"
                    :disabled="navigationEnabled || msfEnabled || !hasRobotRtk"
                    v-permission-click-dialog="'nav-navmanage-startnav'"
                    @click="handleStartINS"
                  >
                    {{ insEnabled ? '关闭INS' : '开始INS' }}
                  </button>
                  <button class="map-btn map-btn-primary" :disabled="navigationEnabled || msfEnabled || !hasRobotRtk" v-permission-click-dialog="'nav-navmanage-startnav'" @click="handleInitINS">INS初始化</button>
                  <button 
                    class="map-btn" 
                    :class="msfEnabled ? 'map-btn-danger' : 'map-btn-primary'"
                    :disabled="navigationEnabled || insEnabled || !hasRobotRtk"
                    v-permission-click-dialog="'nav-navmanage-startnav'"
                    @click="handleStartMSF"
                  >
                    {{ msfEnabled ? '关闭MSF' : '开始MSF' }}
                  </button>
                  <button class="map-btn" :class="isTrackTaskRunning ? 'map-btn-primary' : 'map-btn-secondary'" :disabled="!isTrackTaskRunning" v-permission-click-dialog="'nav-navmanage-pausenav'" @click="handleCircleMode">循迹避障模式</button>
                  <button class="map-btn map-btn-secondary" v-permission-click-dialog="'nav-navmanage-startnav'" @click="handleCloseGPS">{{ gpsEnabled ? '关闭GPS' : '开启GPS' }}</button>
                  <button class="map-btn map-btn-secondary" :disabled="!navigationEnabled" v-permission-click-dialog="'nav-navmanage-startnav'" @click="handleSetOrigin">原点设置</button>
                </div>
              </div>

              <!-- 主体内容区 -->
              <div class="nav-main-content">
                <!-- 左侧信息面板 -->
                <div class="nav-info-panel">
                  <!-- 地图选择 -->
                  <div class="nav-info-item">
                    <label class="nav-label">地图：</label>
                    <select v-model="selectedNavMap" class="nav-select" :disabled="isMapSelectionLocked">
                      <option v-if="navMapList.length === 0" value="">暂无地图</option>
                      <option v-for="map in navMapList" :key="map" :value="map">{{ map }}</option>
                    </select>
                  </div>

                  <!-- 任务速度设置 -->
                  <div class="nav-info-item">
                    <label class="nav-label">任务速度设置：</label>
                    <div class="nav-speed-control">
                      <button class="nav-speed-btn" @click="decreaseSpeed">-</button>
                      <input v-model="taskSpeed" class="nav-speed-input" readonly />
                      <button class="nav-speed-btn" @click="increaseSpeed">+</button>
                    </div>
                  </div>

                  <div class="nav-info-card">
                    <div class="nav-info-card-title">速度</div>
                    <div class="nav-info-row">
                      <div class="nav-info-col">
                        <span class="nav-info-label">W:</span>
                        <span class="nav-info-value">{{ navData.w }} rad/s</span>
                      </div>
                      <div class="nav-info-col">
                        <span class="nav-info-label">V:</span>
                        <span class="nav-info-value">{{ navData.v }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="nav-info-card">
                    <div class="nav-info-card-title">位姿</div>
                    <div class="nav-info-row">
                      <div class="nav-info-col">
                        <span class="nav-info-label">X:</span>
                        <span class="nav-info-value">{{ navData.x }}</span>
                      </div>
                      <div class="nav-info-col">
                        <span class="nav-info-label">Y:</span>
                        <span class="nav-info-value">{{ navData.y }}</span>
                      </div>
                    </div>
                    <div class="nav-info-row">
                      <div class="nav-info-col">
                        <span class="nav-info-label">Z:</span>
                        <span class="nav-info-value">{{ navData.z }}</span>
                      </div>
                      <div class="nav-info-col">
                        <span class="nav-info-label">theta:</span>
                        <span class="nav-info-value">{{ navData.theta }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="nav-info-card">
                    <div class="nav-info-card-title">传感器状态</div>
                    <div class="nav-status-row">
                      <span class="nav-info-label">激光雷达数据</span>
                      <span class="nav-status-badge" :class="sensorBadgeClass(navData.lidar)">{{ navData.lidar }}</span>
                    </div>
                    <div class="nav-status-row">
                      <span class="nav-info-label">IMU数据</span>
                      <span class="nav-status-badge" :class="sensorBadgeClass(navData.imu)">{{ navData.imu }}</span>
                    </div>
                    <div class="nav-status-row">
                      <span class="nav-info-label">卫星数据</span>
                      <span class="nav-status-badge" :class="sensorBadgeClass(hasRobotRtk ? navData.satellite : '未配置')">{{ hasRobotRtk ? navData.satellite : '未配置' }}</span>
                    </div>
                  </div>

                  <div class="nav-info-card">
                    <div class="nav-info-card-title">系统状态</div>
                    <div class="nav-status-row">
                      <span class="nav-info-label">MSF状态</span>
                      <span class="nav-status-badge" :class="systemBadgeClass(hasRobotRtk ? navData.msfStatus : '未配置')">{{ hasRobotRtk ? navData.msfStatus : '未配置' }}</span>
                    </div>
                    <div class="nav-status-row">
                      <span class="nav-info-label">定位状态</span>
                      <span class="nav-status-badge" :class="systemBadgeClass(localizationStatusText)">{{ localizationStatusText }}</span>
                    </div>
                  </div>
                </div>

                <!-- 右侧地图可视化区域 -->
                <div class="nav-map-container">
                  <div class="nav-map-canvas">
                    <div class="pointcloud-wrapper">
                      <div class="pointcloud-view">
                      <ThreePointCloudPreview
                          :points="navPointCloudData"
                          :loading="navPointCloudLoading"
                          :error="navPointCloudError"
                          :normalization-params="navPointCloudNormalizationParams"
                          :navigation-origin="navPointCloudNavigationOrigin"
                          :robot-pose="robotStore.pose"
                          :robot-mesh="arrowMesh"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 地图编辑 -->
          <template v-else-if="currentTab === 'map_edit'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="nav-top-title">地图编辑</span>
              </div>
            </div>
            <div class="map-edit-grid-card">
              <div class="map-edit-grid-header">
                <div class="map-edit-toolbar-compact">
                  <div class="toolbar-left">
                    <span class="toolbar-label">地图：</span>
                    <select v-model="selectedEditMap" class="map-edit-select">
                      <option v-if="editMapList.length === 0" value="">暂无地图</option>
                      <option v-for="map in editMapList" :key="map" :value="map">{{ map }}</option>
                    </select>
                  </div>
                  <div class="toolbar-right">
                    <button class="toolbar-btn" :class="{ active: isEditMode }" v-permission-click-dialog="'nav-mapedit-edit'" @click="toggleEditMode" title="栅格图编辑">
                      编辑
                    </button>
                  </div>
                </div>
              </div>
              <div class="map-edit-grid-main">
                <div ref="gridmapContainerEl" class="gridmap-container">
                  <canvas ref="gridMapCanvas" class="grid-canvas"></canvas>
                  <div
                    v-if="eraserPreview.visible"
                    :class="['eraser-range-preview', `tool-${eraserPreview.tool}`]"
                    :style="{
                      left: `${eraserPreview.left}px`,
                      top: `${eraserPreview.top}px`,
                      width: `${eraserPreview.diameter}px`,
                      height: `${eraserPreview.diameter}px`
                    }"
                  >
                    <span class="eraser-range-preview-label">{{ eraserPreview.label }}</span>
                  </div>
                  <div v-if="gridMapLoading" class="map-overlay loading">地图加载中...</div>
                  <div v-else-if="gridMapError" :class="['map-overlay', isGridMapEmptyState ? 'empty' : 'error']">{{ gridMapError }}</div>
                  <div v-show="isEditMode" class="edit-panel-right">
                    <div class="panel-tools">
                      <!-- 拖动模式 -->
                      <button class="tool-button" :class="{ active: navMode === 'pan' }" @click="setNavMode('pan')" title="拖动模式">
                        <img :src="mapMoveIcon" class="tool-icon-img" alt="拖动模式" />
                      </button>
                      <!-- 放大 -->
                      <button class="tool-button" @click="zoomIn" title="放大">
                        <img :src="mapMagnifyIcon" class="tool-icon-img" alt="放大" />
                      </button>
                      <!-- 缩小 -->
                      <button class="tool-button" @click="zoomOut" title="缩小">
                        <img :src="mapReduceIcon" class="tool-icon-img" alt="缩小" />
                      </button>
                      <!-- 画笔 -->
                      <button class="tool-button" :class="{ active: activeTool === 'pen' && navMode === 'edit' }" v-permission-click-dialog="'nav-mapedit-edit'" @click="setTool('pen')" title="画笔">
                        <img :src="mapPenIcon" class="tool-icon-img" alt="画笔" />
                      </button>
                      <!-- 橡皮擦 -->
                      <button class="tool-button" :class="{ active: activeTool === 'eraser' && navMode === 'edit' }" v-permission-click-dialog="'nav-mapedit-edit'" @click="setTool('eraser')" title="橡皮擦">
                        <img :src="mapEraserIcon" class="tool-icon-img" alt="橡皮擦" />
                      </button>
                      <!-- 撤销 -->
                      <button class="tool-button" :class="{ disabled: !canUndo }" v-permission-click-dialog="'nav-mapedit-edit'" @click="canUndo && undoEdit()" title="撤回">
                        <img :src="mapRollbackIcon" class="tool-icon-img" alt="撤回" />
                      </button>
                      <!-- 初始化 -->
                      <button class="tool-button" v-permission-click-dialog="'nav-mapedit-delete'" @click="clearGridEdit" title="初始化">
                        <img :src="mapInitIcon" class="tool-icon-img" alt="初始化" />
                      </button>
                      <!-- 大小滚动条 -->
                      <div class="tool-slider">
                        <div class="slider-label">大小</div>
                        <input type="range" min="1" max="20" v-model.number="brushSize" class="size-slider-vertical" />
                        <div class="slider-value">{{ brushSize }}</div>
                      </div>
                      <!-- 保存 -->
                      <button class="tool-button" :class="{ disabled: !gridImageData, 'upload-ready': !!gridImageData }" v-permission-click-dialog="'nav-mapedit-publish'" @click="gridImageData && handleSaveGridMap()" title="保存地图">
                        <img :src="mapUploadIcon" class="tool-icon-img" alt="保存地图" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 路线录制 -->
          <template v-else-if="currentTab === 'track_record'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="nav-top-title">路线录制</span>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="track-record-toolbar">
                <div class="track-toolbar-group">
                  <span class="track-label">地图:</span>
                  <div class="track-select-wrapper">
                    <select v-model="trackRecordMap" class="track-select" :disabled="isMapSelectionLocked">
                      <option v-if="trackMapList.length === 0" value="">暂无地图</option>
                      <option v-for="map in trackMapList" :key="map" :value="map">{{ map }}</option>
                    </select>
                    <span class="track-select-arrow">
                      <svg width="10" height="10" viewBox="0 0 12 12">
                        <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <button 
                  class="map-btn map-btn-secondary track-btn" 
                  :class="{'map-btn-danger': isTrackRecording}"
                  :disabled="isTrackRunning || !navigationEnabled"
                  v-permission-click-dialog="'nav-trackrecord-create'"
                  @click="handleTrackRecord"
                >
                  {{ isTrackRecording ? '停止录制' : '录制路线' }}
                </button>
                <div class="track-toolbar-group">
                  <span class="track-label">路线:</span>
                  <div class="track-select-wrapper">
                    <select v-model="trackRecordLine" class="track-select">
                      <option v-if="trackLineList.length === 0" value="">暂无路线</option>
                      <option v-for="line in trackLineList" :key="line" :value="line">{{ line }}</option>
                    </select>
                    <span class="track-select-arrow">
                      <svg width="10" height="10" viewBox="0 0 12 12">
                        <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <div class="track-toolbar-group">
                  <span class="track-label">任务组:</span>
                  <div class="track-select-wrapper">
                    <select v-model="trackRecordTask" class="track-select">
                      <option v-if="trackTaskList.length === 0" value="">暂无任务组</option>
                      <option v-for="task in trackTaskList" :key="task" :value="task">{{ task }}</option>
                    </select>
                    <span class="track-select-arrow">
                      <svg width="10" height="10" viewBox="0 0 12 12">
                        <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <div class="track-toolbar-actions">
                  <button
                    class="map-btn track-btn track-btn-danger"
                    :disabled="isTrackRunning || trackLineList.length === 0 || !trackRecordLine"
                    v-permission-click-dialog="'nav-trackrecord-delete'"
                    @click="handleTrackDelete"
                  >
                    删除路线
                  </button>
                  <button
                    class="map-btn map-btn-primary track-btn"
                    :disabled="trackLineList.length === 0 || !trackRecordLine"
                    v-permission-click-dialog="'nav-trackrecord-preview'"
                    @click="handleTrackPreview"
                  >
                    预览路线
                  </button>
                  <button
                    class="map-btn map-btn-primary track-btn"
                    :disabled="isTrackRunning || trackLineList.length === 0 || !trackRecordLine"
                    v-permission-click-dialog="'nav-trackrecord-edit'"
                    @click="handleTrackSmooth"
                  >
                    轨迹平滑
                  </button>
                </div>
              </div>
              <div class="track-record-map">
                <div class="nav-map-canvas">
                  <div class="pointcloud-wrapper">
                    <div class="pointcloud-view">
                      <ThreePointCloudPreview
                        :points="navPointCloudData"
                        :loading="navPointCloudLoading"
                        :error="navPointCloudError"
                        :normalization-params="navPointCloudNormalizationParams"
                        :navigation-origin="navPointCloudNavigationOrigin"
                        :robot-pose="robotStore.pose"
                        :robot-mesh="arrowMesh"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 文件管理 -->
          <template v-else-if="currentTab === 'file_manage'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="nav-top-title">文件管理</span>
              </div>
            </div>
            <div class="mission-content-wrapper">
              <div class="mission-toolbar">
                <span class="mission-toolbar-label">地图:</span>
                <select v-model="fileManageMap" class="mission-toolbar-select" style="min-width: 220px;">
                  <option v-if="fileMapList.length === 0" value="">暂无地图</option>
                  <option v-for="map in fileMapList" :key="map" :value="map">{{ map }}</option>
                </select>
                <button
                  class="mission-btn mission-btn-stop"
                  :disabled="fileMapList.length === 0 || !fileManageMap || navigationEnabled"
                  v-permission-click-dialog="'nav-file-delete'"
                  @click="handleDeleteMap"
                >
                  删除地图
                </button>
                <span class="mission-toolbar-label" style="margin-left: 20px;">数据包:</span>
                <select v-model="fileManagePackage" class="mission-toolbar-select" style="min-width: 220px;">
                  <option v-if="dataPackageList.length === 0" value="">暂无数据包</option>
                  <option v-for="pkg in dataPackageList" :key="pkg" :value="pkg">{{ pkg }}</option>
                </select>
                <button
                  class="mission-btn mission-btn-stop"
                  :disabled="dataPackageList.length === 0 || !fileManagePackage"
                  v-permission-click-dialog="'nav-file-delete'"
                  @click="handleDeletePackage"
                >
                  删除数据包
                </button>
              </div>
              <div class="file-card-board">
                <template v-if="fileManageRouteCardList.length > 0 || fileManageOtherFileList.length > 0">
                  <div
                    v-for="group in fileManageRouteCardList"
                    :key="`route-group-${group.routeKey}`"
                    class="file-group-card"
                  >
                    <div class="file-group-card-header">
                      <div class="file-group-card-title">
                        <span class="file-group-dot"></span>
                        <span class="file-group-title-text">
                          {{ getFileManageGroupTitle(group) }}：<span class="file-group-route-name">{{ group.routeName }}</span>
                        </span>
                        <button
                          v-if="group.routeItem"
                          class="action-btn action-btn-delete file-group-delete-btn"
                          :disabled="navigationEnabled"
                          v-permission-click-dialog="'nav-file-delete'"
                          @click="handleDelete(group.routeItem)"
                        >
                          <img :src="deleteIcon" alt="删除" />
                          删除
                        </button>
                      </div>
                      <div class="file-group-card-meta">
                        <span>{{ group.displayItems.length }} 个文件</span>
                        <span v-if="group.latestCreateTime">最近：{{ group.latestCreateTime }}</span>
                      </div>
                    </div>
                    <div class="file-group-card-body">
                      <div class="file-group-item" v-for="(item, itemIndex) in group.displayItems" :key="`${getFileManageItemKey(item)}-${itemIndex}`">
                        <div class="file-group-item-main">
                          <span
                            class="file-group-item-type"
                            :class="getFileManageTypeClass(item)"
                          >{{ getFileManageTypeLabel(item) }}</span>
                          <span class="file-group-item-name" :title="item.name">{{ item.name }}</span>
                        </div>
                        <div class="file-group-item-side">
                          <span class="file-group-item-time">{{ item.createTime }}</span>
                          <button
                            class="action-btn action-btn-delete"
                            :disabled="navigationEnabled"
                            v-permission-click-dialog="'nav-file-delete'"
                            @click="handleDelete(item)"
                          >
                            <img :src="deleteIcon" alt="删除" />
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="fileManageOtherFileList.length > 0" class="file-group-card file-group-card-other">
                    <div class="file-group-card-header">
                      <div class="file-group-card-title">
                        <span class="file-group-dot"></span>
                        <span>其他文件</span>
                      </div>
                      <div class="file-group-card-meta">
                        <span>{{ fileManageOtherFileList.length }} 个文件</span>
                      </div>
                    </div>
                    <div class="file-group-card-body">
                      <div class="file-group-item" v-for="(item, itemIndex) in fileManageOtherFileList" :key="`${getFileManageItemKey(item)}-other-${itemIndex}`">
                        <div class="file-group-item-main">
                          <span
                            class="file-group-item-type"
                            :class="getFileManageTypeClass(item)"
                          >{{ getFileManageTypeLabel(item) }}</span>
                          <span class="file-group-item-name" :title="item.name">{{ item.name }}</span>
                        </div>
                        <div class="file-group-item-side">
                          <span class="file-group-item-time">{{ item.createTime }}</span>
                          <button
                            class="action-btn action-btn-delete"
                            :disabled="navigationEnabled"
                            v-permission-click-dialog="'nav-file-delete'"
                            @click="handleDelete(item)"
                          >
                            <img :src="deleteIcon" alt="删除" />
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <div v-else class="file-card-empty">暂无文件</div>
              </div>
            </div>
          </template>

        </section>
      </div>
    </main>

    <!-- 录包名称输入对话框 -->
    <div v-if="recordingDialogVisible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card">
        <div class="recording-dialog-header">开始录包 - 输入数据包名称</div>
        <div class="recording-dialog-body">
          <input
            v-model="recordingName"
            placeholder="请输入数据包名称"
            class="recording-input"
            @input="handleRecordingNameInput"
          />
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn map-btn-primary" v-permission-click-dialog="'nav-lbjt-startrecord'" @click="confirmStartRecording" :disabled="recordingLoading">
            {{ recordingLoading ? '提交中...' : '开始录包' }}
          </button>
          <button class="map-btn" @click="cancelStartRecording">取消</button>
        </div>
      </div>
    </div>

    <!-- 生成地图对话框 -->
    <div v-if="generateMapDialogVisible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card">
        <div class="recording-dialog-header">
          生成地图
          <button class="dialog-close-btn" @click="cancelGenerateMap">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="recording-dialog-body">
          <div class="form-item">
            <label class="form-label">选择数据包：</label>
            <select v-model="selectedDataPackage" class="recording-input">
              <option v-for="pkg in dataPackageList" :key="pkg" :value="pkg">
                {{ pkg }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">地图名称：</label>
            <input v-model="newMapName" placeholder="请输入地图名称" class="recording-input" />
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn map-btn-primary" v-permission-click-dialog="'nav-lbjt-slam'" @click="confirmGenerateMap" :disabled="generateMapLoading">
            {{ generateMapLoading ? '生成中...' : '确定' }}
          </button>
          <button class="map-btn" @click="cancelGenerateMap">取消</button>
        </div>
      </div>
    </div>

    <!-- 生成栅格地图对话框 -->
    <div v-if="generateGridMapDialogVisible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card">
        <div class="recording-dialog-header">
          生成栅格地图
          <button class="dialog-close-btn" @click="cancelGenerateGridMap">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="recording-dialog-body">
          <div class="form-item">
            <label class="form-label">选择地图：</label>
            <select v-model="selectedMapForGrid" class="recording-input">
              <option v-if="gridMapList.length === 0" value="">暂无地图</option>
              <option v-for="map in gridMapList" :key="map" :value="map">
                {{ normalizeMapName(map) }}
              </option>
            </select>
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn map-btn-primary" v-permission-click-dialog="'nav-lbjt-changepcd'" @click="confirmGenerateGridMap" :disabled="generateGridMapLoading">
            {{ generateGridMapLoading ? '生成中...' : '确定' }}
          </button>
          <button class="map-btn" @click="cancelGenerateGridMap">取消</button>
        </div>
      </div>
    </div>

    <!-- 新建融合地图对话框 -->
    <div v-if="createFusionMapDialogVisible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card">
        <div class="recording-dialog-header">
          新建融合地图
          <button class="dialog-close-btn" @click="cancelCreateFusionMap">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="recording-dialog-body">
          <div class="form-item">
            <label class="form-label">融合地图名称：</label>
            <input v-model="fusionMapName" placeholder="请输入融合地图名称" class="recording-input" />
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn map-btn-primary" v-permission-click-dialog="'nav-lbjt-msfrecord'" @click="confirmCreateFusionMap" :disabled="createFusionMapLoading">
            {{ createFusionMapLoading ? '创建中...' : '确定' }}
          </button>
          <button class="map-btn" @click="cancelCreateFusionMap">取消</button>
        </div>
      </div>
    </div>

    <!-- 循迹避障模式选择对话框 -->
    <div v-if="obsHandleDialogVisible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card">
        <div class="recording-dialog-header">循迹避障模式设置</div>
        <div class="recording-dialog-body">
          <div class="obs-mode-options">
            <label 
              class="obs-mode-option" 
              :class="{ 'active': selectedObsMode === 1 }"
              @click="selectedObsMode = 1"
            >
              <input type="radio" name="obs_mode" :value="1" v-model="selectedObsMode" />
              <span>近障模式</span>
            </label>
            <label 
              class="obs-mode-option" 
              :class="{ 'active': selectedObsMode === 0 }"
              @click="selectedObsMode = 0"
            >
              <input type="radio" name="obs_mode" :value="0" v-model="selectedObsMode" />
              <span>无避障</span>
            </label>
            <label 
              class="obs-mode-option" 
              :class="{ 'active': selectedObsMode === 2 }"
              @click="selectedObsMode = 2"
            >
              <input type="radio" name="obs_mode" :value="2" v-model="selectedObsMode" />
              <span>绕障模式</span>
            </label>
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn map-btn-primary" v-permission-click-dialog="'nav-navmanage-pausenav'" @click="confirmObsHandleDialog" :disabled="obsHandleLoading">
            {{ obsHandleLoading ? '提交中...' : '确认' }}
          </button>
          <button class="map-btn" @click="cancelObsHandleDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- 路线录制命名弹窗 -->
    <div v-if="trackRecordDialog.visible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card">
        <div class="recording-dialog-header">录制路线</div>
        <div class="recording-dialog-body">
          <div style="display: flex; align-items: center; width: 100%; border: 1px solid #1fa3d3; border-radius: 4px; background: rgba(5, 26, 48, 0.6); overflow: hidden;">
            <span style="color: #67d5fd; font-size: 14px; padding: 0 12px; background: rgba(31, 163, 211, 0.15); height: 40px; line-height: 40px; border-right: 1px solid #1fa3d3; white-space: nowrap;">{{ trackRecordMap }}_</span>
            <input 
              v-model="trackRecordDialog.trackName" 
              placeholder="输入路线名称" 
              style="flex: 1; min-width: 0; background: transparent; border: none; color: #fff; padding: 0 12px; height: 40px; outline: none; font-size: 14px;" 
            />
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn map-btn-primary" v-permission-click-dialog="'nav-trackrecord-create'" @click="confirmTrackRecord" :disabled="trackRecordDialog.loading">
            {{ trackRecordDialog.loading ? '提交中...' : '开始录制' }}
          </button>
          <button class="map-btn" @click="cancelTrackRecord">取消</button>
        </div>
      </div>
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      :type="confirmDialog.type"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.onCancel"
      @close="closeConfirmDialog"
    />

    <!-- 成功提示 -->
    <SuccessMessage
      :show="successMessage.show"
      :message="successMessage.message"
      @close="closeSuccessMessage"
    />

    <!-- 错误提示 -->
    <ErrorMessage
      :show="errorMessage.show"
      :message="errorMessage.message"
      @close="closeErrorMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onUnmounted, nextTick, watch, computed, shallowRef } from 'vue'
import { usePointCloudRenderer } from '../composables/usePointCloudRenderer'
import ThreePointCloudPreview from '../components/ThreePointCloudPreview.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SuccessMessage from '@/components/SuccessMessage.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import rubbishIcon from '@/assets/source_data/svg_data/rubbish.svg'
import mapRecordIcon from '@/assets/source_data/svg_data/map_record.svg'
import navIcon from '@/assets/source_data/svg_data/nav.svg'
import mapEditIcon from '@/assets/source_data/svg_data/map_edit.svg'
import trackRecordIcon from '@/assets/source_data/svg_data/track_record.svg'
import packageManageIcon from '@/assets/source_data/svg_data/package_manage.svg'
import mapMoveIcon from '@/assets/source_data/svg_data/robot_source/map_move.svg'
import mapMagnifyIcon from '@/assets/source_data/svg_data/robot_source/map_magnify.svg'
import mapReduceIcon from '@/assets/source_data/svg_data/robot_source/map_reduce.svg'
import mapPenIcon from '@/assets/source_data/svg_data/robot_source/map_pen.svg'
import mapEraserIcon from '@/assets/source_data/svg_data/robot_source/map_eraser.svg'
import mapRollbackIcon from '@/assets/source_data/svg_data/robot_source/map_rollback.svg'
import mapInitIcon from '@/assets/source_data/svg_data/robot_source/map_init.svg'
import mapUploadIcon from '@/assets/source_data/svg_data/robot_source/map_upload.svg'
import { saveTrajectoryFile, getTrajectoryFile } from '@/utils/trajectoryDB'
import deleteIcon from '@/assets/source_data/svg_data/robot_source/delete.png'
import { load3MF } from '../utils/threemfParser'
import type { MeshData } from '../utils/threemfParser'
import { useRobotStore } from '../stores/robot'
import { navigationApi, mapFileApi } from '../api/services'
import { useDeviceStore } from '../stores/device'
import { useTaskExecutionStore } from '../stores/taskExecution'
import { usePermissionStore } from '@/stores/permission'
import { getRobotMapCacheKeys, getRobotContextCacheKeys, refreshMapCache, refreshRobotRelatedCache } from '@/utils/robotBootstrap'

const deviceStore = useDeviceStore()
const robotStore = useRobotStore()
const taskExecutionStore = useTaskExecutionStore()
const permissionStore = usePermissionStore()

const getCurrentRobotMapKeys = () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  return robotId ? getRobotMapCacheKeys(robotId) : null
}

const getCurrentRobotContextKeys = () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  return robotId ? getRobotContextCacheKeys(robotId) : null
}

// 导航点云图相关变量（需要在前面声明，因为在cleanupNavPointCloud中使用）
let navPointCloudInitialized = false
let navResizeObserver: ResizeObserver | null = null
let navCanvasEventController: AbortController | null = null

// 对话框和消息提示状态
interface ConfirmDialogState {
  show: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  type: 'warning' | 'info' | 'success' | 'error'
  onConfirm: () => void
  onCancel: () => void
}

const confirmDialog = ref<ConfirmDialogState>({
  show: false,
  title: '',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  type: 'warning',
  onConfirm: () => {},
  onCancel: () => {}
})

const successMessage = ref({
  show: false,
  message: ''
})

const errorMessage = ref({
  show: false,
  message: ''
})

// 显示确认对话框
const showConfirmDialog = (options: Partial<ConfirmDialogState>) => {
  confirmDialog.value = {
    show: true,
    title: options.title || '确认操作',
    message: options.message || '您确定要执行此操作吗?',
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText || '取消',
    type: options.type || 'warning',
    onConfirm: options.onConfirm || (() => {}),
    onCancel: options.onCancel || (() => {})
  }
}

const closeConfirmDialog = () => {
  confirmDialog.value.show = false
}

// 显示成功消息
const showSuccessMessage = (message: string) => {
  successMessage.value = {
    show: true,
    message
  }
  setTimeout(() => {
    closeSuccessMessage()
  }, 3000)
}

const closeSuccessMessage = () => {
  successMessage.value.show = false
}

// 显示错误消息
const showErrorMessage = (message: string) => {
  errorMessage.value = {
    show: true,
    message
  }
  setTimeout(() => {
    closeErrorMessage()
  }, 3000)
}

const closeErrorMessage = () => {
  errorMessage.value.show = false
}


// 侧边栏菜单配置
const sidebarTabs = [
  { key: 'map_record', label: '录包建图', icon: mapRecordIcon, permission: 'nav-lbjt-show' },
  { key: 'nav', label: '导航', icon: navIcon, permission: 'nav-navmanage-show' },
  { key: 'map_edit', label: '地图编辑', icon: mapEditIcon, permission: 'nav-mapedit-show' },
  { key: 'track_record', label: '路线录制', icon: trackRecordIcon, permission: 'nav-trackrecord-show' },
  { key: 'file_manage', label: '文件管理', icon: packageManageIcon, permission: 'nav-file-show' }
]

const NAV_MANAGE_TAB_STORAGE_KEY = 'navigation_manage_current_tab'
const getDefaultNavManageTab = () => {
  const storedTab = localStorage.getItem(NAV_MANAGE_TAB_STORAGE_KEY) || ''
  const storedTabConfig = sidebarTabs.find(tab => tab.key === storedTab)
  if (storedTabConfig && (!storedTabConfig.permission || permissionStore.hasPermission(storedTabConfig.permission))) {
    return storedTabConfig.key
  }

  const firstAllowedTab = sidebarTabs.find(tab => !tab.permission || permissionStore.hasPermission(tab.permission))
  return firstAllowedTab?.key || 'map_record'
}

const currentTab = ref(getDefaultNavManageTab())
const mapRefreshTabs = new Set(['nav', 'map_edit', 'track_record', 'file_manage'])

watch(currentTab, (tabKey) => {
  localStorage.setItem(NAV_MANAGE_TAB_STORAGE_KEY, tabKey)
})

const emitPermissionDenied = (permission: string) => {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('permission-denied', {
      detail: { permission }
    }))
  }
}

const handleTabClick = async (tab: { key: string; permission?: string }) => {
  const key = tab.key
  if (tab.permission && !permissionStore.hasPermission(tab.permission)) {
    emitPermissionDenied(tab.permission)
    return
  }
  const previousTab = currentTab.value
  currentTab.value = key
  
  // 如果离开导航/路线录制标签，清理点云图状态
  if ((previousTab === 'nav' || previousTab === 'track_record') && key !== 'nav' && key !== 'track_record') {
    cleanupNavPointCloud()
  }

  if (mapRefreshTabs.has(key)) {
    await refreshMapListCache()
  }
  
  // 当切换到导航标签时，初始化点云图并获取GPS状态和地图列表
  if (key === 'nav') {
    nextTick(() => {
      fetchMapList() // 获取地图列表
      initNavPointCloud()
      fetchGpsStatus() // 获取GPS状态
      fetchCurrentTaskSpeed() // 获取当前任务速度
    })
  } else if (key === 'track_record') {
    nextTick(async () => {
      initNavPointCloud()
      fetchTrackMapList() // 获取路线录制页面的地图列表
      await fetchAllTrackList() // 获取所有循迹任务列表

      // 地图已选中但路线未选中时，自动选第一条路线（watcher 不会重新触发）
      if (trackRecordMap.value && !trackRecordLine.value && trackLineList.value.length > 0) {
        trackRecordLine.value = trackLineList.value[0]
        // trackRecordLine 的 watcher 会自动加载任务组并选第一个
      }
    })
  } else if (key === 'map_edit') {
    // 切换到地图编辑标签时获取地图列表
    fetchEditMapList()
    // 如果已有选中的地图，手动加载一次（因为如果值没变，watcher不会触发）
    if (selectedEditMap.value) {
      nextTick(() => {
        loadGridMap(selectedEditMap.value)
      })
    } else {
      nextTick(() => {
        clearGridMapDisplay()
      })
    }
  } else if (key === 'file_manage') {
    // 切换到文件管理标签时获取地图列表和数据包列表
    fetchFileMapList()
    fetchDataPackageList()
    // 如果已有选中的地图，获取文件列表
    if (fileManageMap.value) {
      fetchNavigationList()
    }
  }
}

// 清理导航点云图状态
const cleanupNavPointCloud = () => {
  console.log('清理点云图状态')
  navPointCloudInitialized = false
  stopNavPointCloudDragging()
  if (navCanvasEventController) {
    navCanvasEventController.abort()
    navCanvasEventController = null
  }
  if (navResizeObserver) {
    (navResizeObserver as ResizeObserver | null)?.disconnect()
    navResizeObserver = null
  }
}

// 路线录制相关状态
// trackRecordMap 与导航/地图编辑共用 taskExecutionStore.selectedMapName，实现多页面同步
const trackRecordMap = computed({
  get: () => taskExecutionStore.selectedMapName,
  set: (v: string) => taskExecutionStore.setSelectedMapName(v)
})
const trackMapList = ref<string[]>([]) // 路线录制页面的地图列表
const trackRecordLine = ref('')
const trackRecordTask = ref('')

// 所有循迹任务列表（从API获取）
const allTrackList = ref<string[]>([])

// 获取所有循迹任务列表
const fetchAllTrackList = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  const contextKeys = robotId ? getRobotContextCacheKeys(robotId) : null
  const readCachedTrackList = () => {
    const scoped = contextKeys ? localStorage.getItem(contextKeys.trackListKey) : null
    if (scoped) return scoped
    return localStorage.getItem('cached_track_list')
  }

  if (!robotId) {
    console.warn('未选择机器人，无法获取循迹任务列表')
    // 尝试从缓存加载
    const cached = readCachedTrackList()
    if (cached) {
      allTrackList.value = JSON.parse(cached)
      console.log('从缓存加载循迹任务列表:', allTrackList.value)
    }
    return
  }
  
  try {
    const response = await navigationApi.getTrackList(robotId)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      allTrackList.value = response.msg.result
      // 缓存到localStorage
      if (contextKeys) {
        localStorage.setItem(contextKeys.trackListKey, JSON.stringify(allTrackList.value))
      }
      localStorage.setItem('cached_track_list', JSON.stringify(allTrackList.value))
      console.log('获取到所有循迹任务列表:', allTrackList.value)
      window.dispatchEvent(new CustomEvent('robot-track-list-ready', {
        detail: { robotId }
      }))
    } else {
      console.warn('循迹任务列表返回格式异常')
      // 尝试从缓存加载
      const cached = readCachedTrackList()
      if (cached) {
        allTrackList.value = JSON.parse(cached)
      }
    }
  } catch (error) {
    console.error('获取循迹任务列表失败:', error)
    // 尝试从缓存加载
    const cached = readCachedTrackList()
    if (cached) {
      allTrackList.value = JSON.parse(cached)
      console.log('从缓存加载循迹任务列表:', allTrackList.value)
    }
  }
}

// 过滤后的路线列表（根据选中的地图）
const trackLineList = computed(() => {
  if (!trackRecordMap.value) return []
  
  // 过滤出属于当前地图的循迹任务
  // 循迹任务格式：{地图名}_{路线名}@{更新时间}
  return allTrackList.value
    .filter(track => track.startsWith(trackRecordMap.value + '_'))
    .map(track => {
      // 移除 @ 后面的更新时间
      const atIndex = track.indexOf('@')
      return atIndex > -1 ? track.substring(0, atIndex) : track
    })
})

// 路线列表变化时兜底：若当前未选中或选中项已失效，自动选第一条
watch(trackLineList, (newLines) => {
  if (currentTab.value !== 'track_record') return

  if (newLines.length === 0) {
    trackRecordLine.value = ''
    return
  }

  if (!trackRecordLine.value || !newLines.includes(trackRecordLine.value)) {
    trackRecordLine.value = newLines[0]
  }
})

// 任务组列表
const trackTaskList = ref<string[]>([])

const clearTrackPreviewFromPointCloud = async () => {
  if (!isNavPreviewMode.value) return

  isNavPreviewMode.value = false
  lastNavTrackOverlayKey.value = ''

  const trackNameFromStatus = normalizeTrackName(robotStore.cmdStatus?.track_info?.track_name || '')
  if (robotStore.cmdStatus?.track === 1 && trackNameFromStatus) {
    activeNavOverlayTrackName.value = trackNameFromStatus
    activeNavTrackInfo.value = {
      track_name: trackNameFromStatus,
      taskpoint_name:
        robotStore.cmdStatus?.track_info?.taskpoint_name ||
        activeNavTrackInfo.value.taskpoint_name ||
        ''
    }
    await overlayNavTrackTrajectory(trackNameFromStatus)
    return
  }

  navPointCloudData.value = baseNavPointCloudData.value.length > 0
    ? [...baseNavPointCloudData.value]
    : []
  await nextTick()
  scheduleNavPointCloudRender()
}

// 监听路线录制地图选择变化 - 同步更新路线和任务组列表
watch(trackRecordMap, async (newMap) => {
  if (currentTab.value !== 'track_record') return

  if (newMap) {
    // 加载该地图的点云图
    refreshNavPointCloud(newMap)
    
    // 重新加载循迹任务列表（从缓存或API）
    await fetchAllTrackList()
    
    // 清空选中的路线
    trackRecordLine.value = ''
    
    // 自动选择第一个路线
    if (trackLineList.value.length > 0) {
      trackRecordLine.value = trackLineList.value[0]
    }
  } else {
    // 如果没有选中地图，清空选择
    trackRecordLine.value = ''
    trackRecordTask.value = ''
    trackTaskList.value = []
  }
})

// 监听路线选择变化 - 获取该路线的任务组列表（关键点文件列表）
watch(trackRecordLine, async (newLine) => {
  // 路线切换时清理预览轨迹，恢复点云基线（或实时循迹叠加）
  await clearTrackPreviewFromPointCloud()
  // 清空任务组选择
  trackRecordTask.value = ''
  trackTaskList.value = []
  
  if (!newLine) {
    return
  }
  
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    console.warn('未选择机器人，无法获取任务组')
    return
  }
  
  try {
    console.log('获取路线的任务组列表:', newLine)
    const response = await navigationApi.getTaskpointList(robotId, newLine)
    
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      trackTaskList.value = response.msg.result
      console.log(`路线 ${newLine} 的任务组列表:`, trackTaskList.value)
      
      // 自动选择第一个任务组
      if (trackTaskList.value.length > 0) {
        trackRecordTask.value = trackTaskList.value[0]
        console.log('自动选择第一个任务组:', trackRecordTask.value)
      }
    } else {
      console.warn('任务组列表返回格式异常:', response)
      trackTaskList.value = []
    }
  } catch (error) {
    console.error('获取任务组列表失败:', error)
    trackTaskList.value = []
  }
  
  // 下载轨迹文件到本地
  try {
    console.log('准备下载轨迹文件:', newLine)

    // 检查缓存中是否已有轨迹文件
    const cachedBlob = await getTrajectoryFile(newLine)
    if (cachedBlob) {
      console.log('? 轨迹文件已在缓存中:', newLine)
      // 缓存命中：若当前正在循迹且地图已加载，立即叠加渲染
      if (robotStore.cmdStatus?.track === 1 && baseNavPointCloudData.value.length > 0) {
        overlayNavTrackTrajectory(newLine)
      }
      return
    }
    
    // 从服务器下载轨迹文件
    const blob = await mapFileApi.downloadTrajectoryFile(robotId, newLine)
    
    if (blob) {
      const text = await blob.text()
      console.log('DEBUG: 下载的轨迹文件内容预览:', text.substring(0, 200))
      console.log('DEBUG: 下载的轨迹文件大小:', blob.size)
      
      if (text.trim().startsWith('<') || text.includes('error_code')) {
        console.error('DEBUG: 下载的内容看起来像是HTML错误页面或JSON错误信息')
        return
      }

      // 保存到IndexedDB
      await saveTrajectoryFile(newLine, blob)
      console.log('? 轨迹文件下载并保存成功:', newLine)
      
      // 下载完成：若当前正在循迹且地图已加载，立即叠加渲染（解决竞态问题）
      if (robotStore.cmdStatus?.track === 1 && baseNavPointCloudData.value.length > 0) {
        overlayNavTrackTrajectory(newLine)
      }
    } else {
      console.warn('? 轨迹文件下载失败:', newLine)
    }
  } catch (error) {
    console.error('下载轨迹文件失败:', error)
  }
})

// 路线录制状态
const isTrackRecording = ref(false)
watch(() => robotStore.cmdStatus?.track_record, (val) => {
  isTrackRecording.value = Number(val) === 1
}, { immediate: true })
const isTrackRunning = computed(() => Number(robotStore.cmdStatus?.track ?? 0) === 1)
const trackRecordDialog = ref({
  visible: false,
  trackName: '',
  loading: false
})

const handleTrackRecord = () => {
  if (isTrackRunning.value || !navigationEnabled.value) {
    return
  }

  if (isTrackRecording.value) {
    // 正在录制 -> 停止录制
    stopTrackRecord()
  } else {
    // 未录制 -> 打开弹窗开始录制
    if (!trackRecordMap.value) {
      showErrorMessage('请先选择地图')
      return
    }
    trackRecordDialog.value.trackName = ''
    trackRecordDialog.value.visible = true
  }
}

// 停止录制逻辑
const stopTrackRecordRequest = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    showErrorMessage('未选择机器人')
    return
  }

  try {
    // action 0 是停止
    await navigationApi.trackRecord(robotId, {
      action: 0,
      track_name: '' 
    })
    
    isTrackRecording.value = false
    showSuccessMessage('录制完成')
    
    // 刷新列表
    await fetchAllTrackList()
    
  } catch(error: any) {
    console.error('停止录制失败:', error)
    showErrorMessage(`停止录制失败: ${error.message || '未知错误'}`)
  }
}

const stopTrackRecord = () => {
  showConfirmDialog({
    title: '完成录制',
    message: '确定要完成录制吗？',
    confirmText: '确定',
    cancelText: '取消',
    type: 'warning',
    onConfirm: () => {
      closeConfirmDialog()
      void stopTrackRecordRequest()
    },
    onCancel: () => {
      closeConfirmDialog()
    }
  })
}

// 确认开始录制
const confirmTrackRecord = async () => {
  if (isTrackRunning.value) {
    showErrorMessage('当前正在循迹，无法录制路线')
    return
  }

  const inputName = trackRecordDialog.value.trackName.trim()
  if (!inputName) {
    showErrorMessage('请输入路线名称')
    return
  }

  const fullTrackName = `${trackRecordMap.value}_${inputName}`
  const normalizedExistingNames = new Set(
    trackLineList.value.map(item => normalizeTrackName(String(item || '')))
  )
  if (normalizedExistingNames.has(normalizeTrackName(fullTrackName))) {
    showErrorMessage(`路线名称已存在：${fullTrackName}`)
    return
  }
  
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    showErrorMessage('未选择机器人')
    return
  }

  trackRecordDialog.value.loading = true
  try {
    await navigationApi.trackRecord(robotId, {
      action: 1, // 开始
      track_name: fullTrackName
    })
    
    isTrackRecording.value = true
    trackRecordDialog.value.visible = false
    showSuccessMessage('开始录制路线')
  } catch (error: any) {
    console.error('开始录制失败:', error)
    showErrorMessage(`开始录制失败: ${error.message || '未知错误'}`)
  } finally {
    trackRecordDialog.value.loading = false
  }
}

const cancelTrackRecord = () => {
  trackRecordDialog.value.visible = false
}

const handleTrackDelete = () => {
  if (isTrackRunning.value) {
    return
  }

  if (!trackRecordLine.value) {
    showErrorMessage('请先选择要删除的路线')
    return
  }
  
  showConfirmDialog({
    title: '删除路线',
    message: `确定要删除路线 "${trackRecordLine.value}" 吗？`,
    type: 'warning',
    confirmText: '确认',
    onConfirm: async () => {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (!robotId) return
      
      try {
        await navigationApi.deleteTrack(robotId, {
          track_name: trackRecordLine.value
        })
        showSuccessMessage('删除成功')
        // 刷新列表
        await fetchAllTrackList()
        if (trackLineList.value.length > 0) {
          trackRecordLine.value = trackLineList.value[0]
        } else {
          trackRecordLine.value = ''
        }
      } catch (error: any) {
        console.error('删除路线失败:', error)
        showErrorMessage(`删除失败: ${error.message || '未知错误'}`)
      }
    }
  })
}

const handleTrackDownload = () => {
  console.log('下载路线')
}


const previewTrackRoute = async (options?: { silentSuccess?: boolean }) => {
  const silentSuccess = !!options?.silentSuccess
  console.log('预览路线')
  
  if (!trackRecordLine.value) {
    showErrorMessage('请先选择路线')
    return
  }
  
  try {
    const blob = await getTrajectoryFile(trackRecordLine.value)
    if (!blob) {
      showErrorMessage('未找到轨迹文件，请确认路线是否存在')
      return
    }

    const text = await blob.text()
    const lines = text.trim().split('\n')
    const pointDataLines = lines
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))

    const trajectoryPoints: Array<{ x: number; y: number; z: number }> = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const parts = trimmed.includes(',') ? trimmed.split(',') : trimmed.split(/\s+/)
      if (parts.length === 6) {
        const x = parseFloat(parts[1]), y = parseFloat(parts[2]), z = parseFloat(parts[3])
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          trajectoryPoints.push({ x, y, z })
          continue
        }
      }
      if (parts.length === 5) {
        const x = parseFloat(parts[1]), y = parseFloat(parts[2])
        if (!isNaN(x) && !isNaN(y)) trajectoryPoints.push({ x, y, z: 0 })
      }
    }

    if (trajectoryPoints.length === 0) {
      if (pointDataLines.length === 0) {
        showErrorMessage('轨迹文件内部无点位数据')
      } else {
        showErrorMessage('轨迹文件格式无法识别')
      }
      return
    }

    const { centerX, centerY, centerZ, maxRange } = navPointCloudNormalizationParams.value
    const normalizedTrajectoryPoints = trajectoryPoints.map(p => ({
      x: (p.x - centerX) / maxRange,
      y: (p.y - centerY) / maxRange,
      z: (p.z - centerZ) / maxRange,
      intensity: 2.0
    }))

    const previewTaskPoints: Array<{ x: number; y: number; z: number; name: string; intensity: number }> = []
    try {
      const cachedData = localStorage.getItem('all_track_task_list')
      if (cachedData) {
        const allTaskList = extractTrackTaskList(JSON.parse(cachedData))
        const previewTrackName = normalizeTrackName(trackRecordLine.value)
        allTaskList
          .filter((task: any) => normalizeTrackName(String(task.track_name || '')) === previewTrackName)
          .forEach((task: any, idx: number) => {
            const tx = parseFloat(task.x), ty = parseFloat(task.y), tz = parseFloat(task.z ?? '0')
            if (!isNaN(tx) && !isNaN(ty) && !isNaN(tz)) {
              previewTaskPoints.push({
                x: (tx - centerX) / maxRange,
                y: (ty - centerY) / maxRange,
                z: (tz - centerZ) / maxRange,
                intensity: 3.0,
                name: task.type_text || task.preset || `任务点${idx + 1}`
              })
            }
          })
      }
    } catch (e) {
      console.warn('加载预览任务点失败:', e)
    }

    const base = baseNavPointCloudData.value.length > 0 ? baseNavPointCloudData.value : []
    navPointCloudData.value = [...base, ...normalizedTrajectoryPoints, ...previewTaskPoints]
    lastNavTrackOverlayKey.value = ''
    isNavPreviewMode.value = true
    await nextTick()
    scheduleNavPointCloudRender()

    if (!silentSuccess) {
      showSuccessMessage(`轨迹预览加载成功 (${trajectoryPoints.length} 个点，${previewTaskPoints.length} 个任务点)`)
    }
  } catch (error) {
    console.error('预览路线失败:', error)
    showErrorMessage('预览路线失败: ' + (error as Error).message)
  }
}

const handleTrackPreview = async () => {
  await previewTrackRoute()
}


const handleTrackSmooth = async () => {
  if (isTrackRunning.value) {
    return
  }

  if (!trackRecordLine.value) {
    showErrorMessage('请先选择要平滑的路线')
    return
  }
  
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    showErrorMessage('未选择机器人')
    return
  }

  try {
    await navigationApi.trajectorySmooth(robotId, {
      track_name: trackRecordLine.value
    })

    // 平滑成功后，强制重新下载当前路线轨迹文件并覆盖本地缓存
    const blob = await mapFileApi.downloadTrajectoryFile(robotId, trackRecordLine.value, true)
    if (!blob) {
      showErrorMessage('轨迹平滑成功，但重新下载轨迹文件失败')
      return
    }

    const text = await blob.text()
    if (text.trim().startsWith('<') || text.includes('error_code')) {
      showErrorMessage('轨迹平滑成功，但下载到的轨迹文件内容异常')
      return
    }

    await saveTrajectoryFile(trackRecordLine.value, blob)

    // 平滑完成后立即用最新轨迹文件刷新点云预览
    await previewTrackRoute({ silentSuccess: true })
    showSuccessMessage('轨迹平滑处理成功，已更新并重新加载当前路线轨迹文件')
  } catch (error: any) {
    console.error('轨迹平滑失败:', error)
    showErrorMessage(`轨迹平滑失败: ${error.message || '未知错误'}`)
  }
}

// 导航相关状态
// selectedNavMap 与路线录制/地图编辑共用 taskExecutionStore.selectedMapName
const selectedNavMap = computed({
  get: () => taskExecutionStore.selectedMapName,
  set: (v: string) => taskExecutionStore.setSelectedMapName(v)
})
const navMapList = ref<string[]>([]) // 地图列表

const MIN_TASK_SPEED = 0.3
const MAX_TASK_SPEED = 1.2
const taskSpeed = ref(1.0)
const setSpeedLoading = ref(false)
const navData = ref({
  w: 0,
  v: '0, 0',
  x: 0,
  y: 0,
  z: 0,
  theta: 0,
  brake: 0,
  lidar: '未收到',
  imu: '未收到',
  satellite: '未收到',
  msfStatus: '未开启',
  insOrigin: '未初始化'
})

const formatSensorMessageStatus = (value: string | number | null | undefined) => {
  if (value == null || value === '') return '未收到'
  return String(value) === '1' ? '收到' : '未收到'
}

const brakeStatusText = computed(() => {
  return Number(navData.value.brake) === 1 ? '已触发' : '未触发'
})

const syncNavPoseData = (pose: { x: number; y: number; z: number; theta: number } | null) => {
  if (!pose) return
  navData.value.x = Number(pose.x.toFixed(3))
  navData.value.y = Number(pose.y.toFixed(3))
  navData.value.z = Number(pose.z.toFixed(3))
  // 与首页机器人状态保持一致：theta 显示 pose_update 原始值
  navData.value.theta = Number(pose.theta.toFixed(3))
}

watch(
  () => robotStore.pose,
  (pose) => {
    syncNavPoseData(pose)
  },
  { immediate: true, deep: true }
)

const navigationEnabled = computed(() => robotStore.cmdStatus?.nav === 1)
const isTrackTaskRunning = computed(() => taskExecutionStore.isTrackTaskRunning)
const insEnabled = computed(() => robotStore.cmdStatus?.ins === 1)
const msfEnabled = computed(() => robotStore.cmdStatus?.msf === 1)
const hasRobotRtk = computed(() => {
  const robot = deviceStore.selectedRobot as any
  const extraRaw = robot?.extra ?? robot?.extra_data ?? null
  if (extraRaw == null) return false

  let extraObj: any = extraRaw
  if (typeof extraRaw === 'string') {
    const trimmed = extraRaw.trim()
    if (!trimmed) return false
    try {
      extraObj = JSON.parse(trimmed)
    } catch {
      return false
    }
  }

  if (!extraObj || typeof extraObj !== 'object' || Array.isArray(extraObj)) {
    return false
  }

  return extraObj.rtk === true
})
const appNavPauseEnabled = computed(() => Number((robotStore.cmdStatus as any)?.app_nav_pause?.result ?? 0) === 1)
const appNavNavtrackEnabled = computed(() => Number((robotStore.cmdStatus as any)?.app_stop_navtrack?.result ?? 0) === 1)
/** INS 初始化状态（1=已初始化） */
const insOriginEnabled = computed(() => robotStore.cmdStatus?.ins_origin === 1)

const localizationStatusText = computed(() => {
  const loc = robotStore.locStatus
  if (!loc) return '未收到'
  return Number(loc.result) === 1 ? '正常' : '异常'
})

const sensorBadgeClass = (value: string | number | null | undefined) => {
  const text = String(value ?? '')
  return text.includes('收到') && !text.includes('未') ? 'is-on' : 'is-off'
}

const systemBadgeClass = (value: string | number | null | undefined) => {
  const text = String(value ?? '').trim()
  if (!text) return 'is-off'
  if (text.includes('异常')) return 'is-error'
  if (text.includes('未') || text.includes('关闭') || text.includes('异常')) return 'is-off'
  return 'is-on'
}

// 对接 WebSocket 实时 MSF 状态（msf_status 消息）
watch(() => robotStore.msfStatus, (msfData) => {
  navData.value.msfStatus = msfData?.status_text ?? '未开启'
}, { immediate: true })

// 对接 ins_origin 实时状态
watch(() => robotStore.cmdStatus?.ins_origin, (val) => {
  navData.value.insOrigin = val === 1 ? '已初始化' : '未初始化'
}, { immediate: true })

watch(() => robotStore.sensorStatus, (status) => {
  navData.value.lidar = formatSensorMessageStatus(status?.lidar_msg)
  navData.value.imu = formatSensorMessageStatus(status?.imu_msg)
  navData.value.satellite = formatSensorMessageStatus(status?.gps_msg)
}, { immediate: true, deep: true })

const navigationLoading = ref(false)
// isMapSelectionLocked 改为使用 taskExecutionStore 统一计算（nav/ins/msf 任一开启则锁定）
const isMapSelectionLocked = computed(() => taskExecutionStore.isMapSelectionLocked)

watch(navigationEnabled, (newVal, oldVal) => {
  if (newVal !== oldVal && navigationLoading.value) {
    navigationLoading.value = false
  }
})

// GPS状态
const gpsEnabled = ref(false)

// 循迹避障模式对话框状态
const obsHandleDialogVisible = ref(false)
const selectedObsMode = ref(1) // 0: 无避障, 1: 近障模式, 2: 绕障模式
const obsHandleLoading = ref(false)
const resolveCurrentObsMode = () => {
  const rawMode = (robotStore.cmdStatus as any)?.track_info?.obs_mode
  const mode = Number(rawMode)
  return [0, 1, 2].includes(mode) ? mode : 1
}


// 导航相关方法
const handleStartNav = () => {
  if (insEnabled.value || msfEnabled.value) {
    showErrorMessage('请先关闭INS或MSF')
    return
  }

  if (!selectedNavMap.value) {
    showErrorMessage('请先选择地图')
    return
  }

  const action = navigationEnabled.value ? '关闭' : '开启'
  showConfirmDialog({
    title: `${action}导航`,
    message: `确定要${action}导航吗？`,
    onConfirm: async () => {
      navigationLoading.value = true
      try {
        const robotId = deviceStore.selectedRobotId
        if (!robotId) {
          showErrorMessage('未选择机器人')
          navigationLoading.value = false
          return
        }

        await navigationApi.controlNavigation(robotId, {
          action: navigationEnabled.value ? 0 : 1,
          map_name: selectedNavMap.value
        })
      } catch (err) {
        console.error(`${action}导航失败:`, err)
        showErrorMessage(`${action}导航失败`)
        navigationLoading.value = false
      }
    }
  })
}

const handlePauseNav = async () => {
  const nextPauseState = !appNavPauseEnabled.value
  console.log(nextPauseState ? '暂停导航' : '恢复导航')
  try {
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }
    await navigationApi.pauseNavigation(robotId, { action: nextPauseState ? 1 : 0 })
    showSuccessMessage(nextPauseState ? '暂停指令已发送' : '恢复指令已发送')
  } catch (err) {
    console.error(`${nextPauseState ? '暂停导航' : '恢复导航'}失败:`, err)
    showErrorMessage(`${nextPauseState ? '暂停导航' : '恢复导航'}失败`)
  }
}

const handleToggleNavStop = async () => {
  const nextPauseState = !appNavNavtrackEnabled.value
  console.log(nextPauseState ? '暂停停障' : '恢复停障')
  try {
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }
    await navigationApi.stopNavStop(robotId, { action: nextPauseState ? 1 : 0 })
    showSuccessMessage(nextPauseState ? '暂停停障指令已发送' : '恢复停障指令已发送')
  } catch (err) {
    console.error(`${nextPauseState ? '暂停停障' : '恢复停障'}失败:`, err)
    showErrorMessage(`${nextPauseState ? '暂停停障' : '恢复停障'}失败`)
  }
}

const handleStartINS = () => {
  if (navigationEnabled.value || msfEnabled.value) {
    showErrorMessage('请先关闭导航或MSF')
    return
  }

  const action = insEnabled.value ? '关闭' : '开启'
  showConfirmDialog({
    title: `${action}INS`,
    message: `确定要${action}INS吗？`,
    onConfirm: async () => {
      try {
        const robotId = deviceStore.selectedRobotId
        if (!robotId) {
          showErrorMessage('未选择机器人')
          return
        }

        await navigationApi.insControl(robotId, {
          action: insEnabled.value ? 0 : 1
        })
        showSuccessMessage(`${action}INS成功`)
      } catch (err) {
        console.error(`${action}INS失败:`, err)
        showErrorMessage(`${action}INS失败`)
      }
    }
  })
}

const handleInitINS = () => {
  showConfirmDialog({
    title: 'INS初始化',
    message: '确定要进行INS初始化吗？',
    onConfirm: async () => {
      try {
        const robotId = deviceStore.selectedRobotId
        if (!robotId) {
          showErrorMessage('未选择机器人')
          return
        }

        await navigationApi.initINS(robotId, {
          action: 1
        })
        
        showSuccessMessage('INS初始化指令已发送')
      } catch (err) {
        console.error('INS初始化失败:', err)
        showErrorMessage('INS初始化失败')
      }
    }
  })
}

const handleStartMSF = () => {
  if (navigationEnabled.value || insEnabled.value) {
    showErrorMessage('请先关闭导航或INS')
    return
  }

  if (!selectedNavMap.value) {
    showErrorMessage('请先选择地图')
    return
  }

  const action = msfEnabled.value ? '关闭' : '开启'
  showConfirmDialog({
    title: `${action}MSF`,
    message: `确定要${action}MSF吗？`,
    onConfirm: async () => {
      try {
        const robotId = deviceStore.selectedRobotId
        if (!robotId) {
          showErrorMessage('未选择机器人')
          return
        }

        await navigationApi.msfControl(robotId, {
          action: msfEnabled.value ? 0 : 1,
          mode: 3,
          session: selectedNavMap.value
        })
        showSuccessMessage(`${action}MSF成功`)
      } catch (err) {
        console.error(`${action}MSF失败:`, err)
        showErrorMessage(`${action}MSF失败`)
      }
    }
  })
}

const handleCircleMode = () => {
  if (!isTrackTaskRunning.value) {
    showErrorMessage('请先启动循迹任务')
    return
  }
  if (!navigationEnabled.value) {
    showErrorMessage('请先开启导航')
    return
  }
  // 显示循迹避障模式选择对话框
  selectedObsMode.value = resolveCurrentObsMode()
  obsHandleDialogVisible.value = true
}

// 取消循迹避障模式对话框
const cancelObsHandleDialog = () => {
  obsHandleDialogVisible.value = false
  selectedObsMode.value = resolveCurrentObsMode()
}

// 确认循迹避障模式设置
const confirmObsHandleDialog = async () => {
  try {
    obsHandleLoading.value = true
    
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showErrorMessage('未选择机器人')
      obsHandleLoading.value = false
      return
    }

    await navigationApi.setObsHandle(robotId, {
      action: selectedObsMode.value
    })

    const modeNames = ['无避障', '近障模式', '绕障模式']
    showSuccessMessage(`已设置为${modeNames[selectedObsMode.value]}`)
    obsHandleDialogVisible.value = false
  } catch (err) {
    console.error('设置避障模式失败:', err)
    showErrorMessage('设置避障模式失败')
  } finally {
    obsHandleLoading.value = false
  }
}

// 获取GPS状态
const fetchGpsStatus = async () => {
  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      console.warn('未选择机器人，无法获取GPS状态')
      return
    }

    const response = await navigationApi.getGpsStatus(robotId)
    if (response.msg && response.msg.error_code === 0) {
      // result为1表示GPS开启，0表示GPS关闭
      gpsEnabled.value = response.msg.result === 1
    }
  } catch (err) {
    console.error('获取GPS状态失败:', err)
  }
}

// 获取地图列表（从缓存读取，不需要robotId，但为了保持一致性保留检查逻辑如果后续需要API）
// 获取地图列表（从缓存读取，不需要robotId，但为了保持一致性保留检查逻辑如果后续需要API）
const fetchMapList = () => {
  try {
    const keys = getCurrentRobotMapKeys()
    const cached = keys ? localStorage.getItem(keys.mapListKey) : null
    if (cached) {
      const parsed = JSON.parse(cached)
      navMapList.value = Array.isArray(parsed) ? parsed : []
      
      // 尝试恢复选中的地图（store 已持久化，直接读取）
      const storedMapName = taskExecutionStore.selectedMapName
      if (storedMapName && navMapList.value.includes(storedMapName)) {
        taskExecutionStore.setSelectedMapName(storedMapName)
      } else if (navMapList.value.length > 0 && !taskExecutionStore.selectedMapName) {
        taskExecutionStore.setSelectedMapName(navMapList.value[0])
      } else if (navMapList.value.length === 0) {
        taskExecutionStore.setSelectedMapName('')
      }
    } else {
      navMapList.value = []
      taskExecutionStore.setSelectedMapName('')
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
    navMapList.value = []
    taskExecutionStore.setSelectedMapName('')
    console.error('读取地图列表缓存失败:', err)
  }
}

// 从API刷新地图列表缓存
const refreshMapListCache = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  try {
    await refreshMapCache(robotId, { forceResetMapSelection: true })
  } catch (err) {
    console.error('刷新地图列表缓存失败:', err)
  }
}

// 获取地图编辑页面的地图列表（从缓存读取）
const fetchEditMapList = () => {
  try {
    const keys = getCurrentRobotMapKeys()
    const cached = keys ? localStorage.getItem(keys.mapListKey) : null
    if (cached) {
      const parsed = JSON.parse(cached)
      editMapList.value = Array.isArray(parsed) ? parsed : []
      
      const storedMapName = taskExecutionStore.selectedMapName
      if (storedMapName && editMapList.value.includes(storedMapName)) {
        taskExecutionStore.setSelectedMapName(storedMapName)
      } else if (editMapList.value.length > 0 && !taskExecutionStore.selectedMapName) {
        taskExecutionStore.setSelectedMapName(editMapList.value[0])
      } else if (editMapList.value.length === 0) {
        taskExecutionStore.setSelectedMapName('')
      }
    } else {
      editMapList.value = []
      taskExecutionStore.setSelectedMapName('')
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
    editMapList.value = []
    taskExecutionStore.setSelectedMapName('')
    console.error('读取地图编辑列表缓存失败:', err)
  }
}

// 获取路线录制页面的地图列表（从缓存读取）
const fetchTrackMapList = () => {
  try {
    const keys = getCurrentRobotMapKeys()
    const cached = keys ? localStorage.getItem(keys.mapListKey) : null
    if (cached) {
      const parsedList = JSON.parse(cached)
      trackMapList.value = Array.isArray(parsedList) ? parsedList : []

      if (trackMapList.value.length === 0) {
        taskExecutionStore.setSelectedMapName('')
        trackRecordLine.value = ''
        trackRecordTask.value = ''
        trackTaskList.value = []
        return
      }

      const storedMapName = taskExecutionStore.selectedMapName
      if (storedMapName && trackMapList.value.includes(storedMapName)) {
        taskExecutionStore.setSelectedMapName(storedMapName)
      } else if (trackMapList.value.length > 0) {
        taskExecutionStore.setSelectedMapName(trackMapList.value[0])
      }
    } else {
      trackMapList.value = []
      taskExecutionStore.setSelectedMapName('')
      trackRecordLine.value = ''
      trackRecordTask.value = ''
      trackTaskList.value = []
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
    trackMapList.value = []
    taskExecutionStore.setSelectedMapName('')
    trackRecordLine.value = ''
    trackRecordTask.value = ''
    trackTaskList.value = []
    console.error('读取路线录制地图列表缓存失败:', err)
  }
}

// 获取文件管理页面的地图列表（从缓存读取）
const fetchFileMapList = () => {
  try {
    const keys = getCurrentRobotMapKeys()
    const cached = keys ? localStorage.getItem(keys.mapListKey) : null
    if (cached) {
      const rawList: string[] = JSON.parse(cached)
      // 处理地图名称：移除 @ 及后面的内容
      fileMapList.value = rawList.map(mapName => {
        const atIndex = mapName.indexOf('@')
        return atIndex > -1 ? mapName.substring(0, atIndex) : mapName
      })
      
      // 尝试恢复选中的地图
      const cachedMapName = taskExecutionStore.selectedMapName
      // 对于文件管理，如果处理后的列表中包含缓存的名字
      if (cachedMapName && fileMapList.value.includes(cachedMapName)) {
        fileManageMap.value = cachedMapName
      } else if (fileMapList.value.length > 0) {
        fileManageMap.value = fileMapList.value[0]
      } else {
        fileManageMap.value = ''
      }
    } else {
      fileMapList.value = []
      fileManageMap.value = ''
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
    fileMapList.value = []
    fileManageMap.value = ''
    console.error('读取文件管理地图列表缓存失败:', err)
  }
}

// 数据包列表
const dataPackageList = ref<string[]>([])

// 获取数据包列表
const fetchDataPackageList = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    console.warn('未选择机器人，无法获取数据包列表')
    return
  }
  
  try {
    const response = await navigationApi.getDataList(robotId)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      // 处理数据包名称：移除 .bag 及后面的内容
      dataPackageList.value = response.msg.result.map(item => {
        const bagIndex = item.indexOf('.bag')
        if (bagIndex !== -1) {
          return item.substring(0, bagIndex)
        }
        // 如果没有 .bag，尝试移除 @ 及后面的内容
        const atIndex = item.indexOf('@')
        return atIndex !== -1 ? item.substring(0, atIndex) : item
      })
      
      // 如果有数据包且当前未选择，默认选择第一个
      if (dataPackageList.value.length > 0) {
        // 总是选择第一个，或者仅当未选择时选择第一个？
        // 用户说"有数据时默认显示第一个"，通常意味着每次刷新都重置，或者仅初始化时重置。
        // 为了稳妥，如果当前选中的不在列表中，或者当前为空，就选择第一个。
        if (!fileManagePackage.value || !dataPackageList.value.includes(fileManagePackage.value)) {
          fileManagePackage.value = dataPackageList.value[0]
        }
      } else {
        fileManagePackage.value = ''
      }
    } else {
      console.warn('获取数据包列表失败或格式错误')
      dataPackageList.value = []
      fileManagePackage.value = ''
    }
  } catch (error) {
    console.error('获取数据包列表失败:', error)
    dataPackageList.value = []
    fileManagePackage.value = ''
  }
}

const handleCloseGPS = () => {
  const action = gpsEnabled.value ? '关闭' : '开启'
  showConfirmDialog({
    title: `${action}GPS`,
    message: `确定要${action}GPS吗？`,
    onConfirm: async () => {
      try {
        const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
        if (!robotId) {
          showErrorMessage('未选择机器人')
          return
        }

        await navigationApi.useGps(robotId, {
          action: gpsEnabled.value ? 0 : 1
        })
        
        gpsEnabled.value = !gpsEnabled.value
        showSuccessMessage(`${action}GPS成功`)
      } catch (err) {
        console.error(`${action}GPS失败:`, err)
        showErrorMessage(`${action}GPS失败`)
      }
    }
  })
}


const handleSetOrigin = () => {
  if (!navigationEnabled.value) {
    return
  }

  if (!selectedNavMap.value) {
    showErrorMessage('请先选择地图')
    return
  }

  showConfirmDialog({
    title: '原点设置',
    message: '确定将当前位置设置为原点吗',
    onConfirm: async () => {
      try {
        const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
        if (!robotId) {
          showErrorMessage('未选择机器人')
          return
        }

        await navigationApi.setOriginPoint(robotId, {
          map_name: selectedNavMap.value
        })

        showSuccessMessage('原点设置成功')
      } catch (err) {
        console.error('原点设置失败:', err)
        showErrorMessage('原点设置失败')
      }
    }
  })
}

const normalizeTaskSpeed = (speed: number) => {
  const rounded = Math.round(speed * 10) / 10
  return Math.min(MAX_TASK_SPEED, Math.max(MIN_TASK_SPEED, rounded))
}

const fetchCurrentTaskSpeed = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  try {
    const response: any = await navigationApi.getCurrentSpeed(robotId)
    const rawSpeed = response?.msg?.get_speed

    const speed = parseFloat(String(rawSpeed))
    if (Number.isNaN(speed)) {
      console.warn('获取当前任务速度成功，但返回速度值无效:', response)
      return
    }

    taskSpeed.value = normalizeTaskSpeed(speed)
  } catch (error) {
    console.error('获取当前任务速度失败:', error)
  }
}

const submitTaskSpeed = async (previousSpeed: number) => {
  if (setSpeedLoading.value) return

  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    taskSpeed.value = previousSpeed
    showErrorMessage('未选择机器人')
    return
  }

  const speed = parseFloat(String(taskSpeed.value))
  if (Number.isNaN(speed)) {
    taskSpeed.value = previousSpeed
    showErrorMessage('速度值无效')
    return
  }

  try {
    setSpeedLoading.value = true
    await navigationApi.setSpeed(robotId, { speed })
  } catch (error) {
    console.error('设置任务速度失败:', error)
    taskSpeed.value = previousSpeed
    showErrorMessage('设置任务速度失败')
  } finally {
    setSpeedLoading.value = false
  }
}

const decreaseSpeed = async () => {
  if (setSpeedLoading.value) return
  if (taskSpeed.value > MIN_TASK_SPEED) {
    const previousSpeed = taskSpeed.value
    const nextSpeed = Math.round((taskSpeed.value - 0.1) * 10) / 10
    taskSpeed.value = Math.max(nextSpeed, MIN_TASK_SPEED)
    await submitTaskSpeed(previousSpeed)
  }
}

const refreshRelatedTaskListsAfterDelete = async (robotId?: string) => {
  const selectedRobotId = robotId || deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!selectedRobotId) return

  try {
    // 删除地图/文件后同步刷新：循迹路线列表、循迹任务组列表、发布点任务组列表
    await refreshRobotRelatedCache(selectedRobotId, { skipMapRefresh: true })

    const contextKeys = getRobotContextCacheKeys(selectedRobotId)
    const cachedTrackList =
      localStorage.getItem(contextKeys.trackListKey) ||
      localStorage.getItem('cached_track_list')
    if (cachedTrackList) {
      allTrackList.value = JSON.parse(cachedTrackList)
    } else {
      allTrackList.value = []
    }

    window.dispatchEvent(new CustomEvent('robot-track-list-ready', {
      detail: { robotId: selectedRobotId }
    }))
    window.dispatchEvent(new CustomEvent('robot-context-refreshed', {
      detail: { robotId: selectedRobotId }
    }))
  } catch (err) {
    console.error('刷新循迹/任务组相关缓存失败:', err)
  }
}

const increaseSpeed = async () => {
  if (setSpeedLoading.value) return
  if (taskSpeed.value < MAX_TASK_SPEED) {
    const previousSpeed = taskSpeed.value
    const nextSpeed = Math.round((taskSpeed.value + 0.1) * 10) / 10
    taskSpeed.value = Math.min(nextSpeed, MAX_TASK_SPEED)
    await submitTaskSpeed(previousSpeed)
  }
}

// 导航点云图相关
// ===================== 点云图（复用 composable）=====================
const navPc = usePointCloudRenderer({ initialScale: 1, initialPointSize: 0.5 })
const navPointCloudCanvas = navPc.canvasRef
const navPointCloudData = navPc.data
const baseNavPointCloudData = navPc.baseData
const navPointCloudNormalizationParams = navPc.normalizationParams
const navPointCloudScale = navPc.scale
const navPointCloudRotationX = navPc.rotationX
const navPointCloudRotationY = navPc.rotationY
const navPointCloudPanX = navPc.panX
const navPointCloudPanY = navPc.panY
const navPointCloudPointSize = navPc.pointSize
const generateMockNavPointCloud = navPc.generateMockData
const navPointCloudLoading = ref(false)
const navPointCloudError = ref('')
const navPointCloudNavigationOrigin = ref<{ x: number; y: number; z: number } | null>(null)
const arrowMesh = ref<MeshData | null>(null)

const parseNavigationOriginFromOdomKeyFrames = (text: string): { x: number; y: number; z: number } | null => {
  if (!text) return null
  const firstLine = text.split(/\r?\n/).find(line => String(line || '').trim())
  if (!firstLine) return null

  const tokens = firstLine.trim().split(/[\s,]+/).filter(Boolean)
  if (tokens.length < 12) return null

  const x = Number(tokens[3])
  const y = Number(tokens[7])
  const z = Number(tokens[11])
  if (![x, y, z].every(Number.isFinite)) return null

  return { x, y, z }
}

const loadNavMapNavigationOrigin = async (mapName: string): Promise<{ x: number; y: number; z: number } | null> => {
  try {
    const originBlob = await getMapFile(mapName, 'odom_key_frames.txt')
    if (!originBlob || originBlob.size === 0) return null
    const text = await originBlob.text()
    return parseNavigationOriginFromOdomKeyFrames(text)
  } catch (error) {
    console.warn('[导航点云] 读取导航原点失败:', error)
    return null
  }
}

// 用 Web Worker 解析 PCD，避免大文件在主线程解析失败
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

let navPointCloudFrameRequested = false
const scheduleNavPointCloudRender = () => {
  if (navPointCloudFrameRequested) return
  navPointCloudFrameRequested = true
  requestAnimationFrame(() => {
    navPointCloudFrameRequested = false
    drawNavPointCloud()
  })
}

const clampNavPointCloudScale = (value: number) => {
  const MIN_SCALE = 0.01
  const MAX_SCALE = 50
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

const clampNavPointCloudPointSize = (value: number) => {
  const MIN_SIZE = 0.5
  const MAX_SIZE = 3
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, value))
}

const handleNavPointCloudWheel = (event: WheelEvent) => {
  const direction = event.deltaY < 0 ? 1 : -1
  navPointCloudScale.value = clampNavPointCloudScale(navPointCloudScale.value + direction * 0.1)
  scheduleNavPointCloudRender()
}

const handleNavPointCloudKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const tagName = target?.tagName
  const isTypingElement = tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable
  if (isTypingElement || event.ctrlKey || event.metaKey || event.altKey) {
    return
  }

  if (event.key === '+' || event.key === '=') {
    navPointCloudPointSize.value = clampNavPointCloudPointSize(navPointCloudPointSize.value + 0.1)
    scheduleNavPointCloudRender()
    event.preventDefault()
  } else if (event.key === '-' || event.key === '_') {
    navPointCloudPointSize.value = clampNavPointCloudPointSize(navPointCloudPointSize.value - 0.1)
    scheduleNavPointCloudRender()
    event.preventDefault()
  }
}

const isNavPointCloudDragging = ref(false)
let navLastPointerX = 0
let navLastPointerY = 0
let navActivePointerId: number | null = null
let navPointCloudDragMode: 'rotate' | 'pan' | null = null

const handleNavPointCloudPointerMove = (event: PointerEvent) => {
  if (!isNavPointCloudDragging.value || (navActivePointerId !== null && event.pointerId !== navActivePointerId)) return
  const deltaX = event.clientX - navLastPointerX
  const deltaY = event.clientY - navLastPointerY
  navLastPointerX = event.clientX
  navLastPointerY = event.clientY
  if (navPointCloudDragMode === 'pan') {
    const canvas = navPointCloudCanvas.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    navPointCloudPanX.value += deltaX / rect.width
    navPointCloudPanY.value += deltaY / rect.height
  } else {
    navPointCloudRotationY.value += deltaX * 0.005
    const nextPitch = navPointCloudRotationX.value - deltaY * 0.005
    const clampPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, nextPitch))
    navPointCloudRotationX.value = clampPitch
  }
  scheduleNavPointCloudRender()
}

const stopNavPointCloudDragging = () => {
  if (!isNavPointCloudDragging.value) return
  isNavPointCloudDragging.value = false
  navActivePointerId = null
  navPointCloudDragMode = null
  window.removeEventListener('pointermove', handleNavPointCloudPointerMove)
  window.removeEventListener('pointerup', stopNavPointCloudDragging)
  window.removeEventListener('pointercancel', stopNavPointCloudDragging)
}

const handleNavPointCloudPointerDown = (event: PointerEvent) => {
  event.preventDefault()
  if (isNavPointCloudDragging.value) return
  navLastPointerX = event.clientX
  navLastPointerY = event.clientY
  isNavPointCloudDragging.value = true
  navActivePointerId = event.pointerId
  const shouldPan = event.button === 2 || (event.button === 0 && event.ctrlKey)
  navPointCloudDragMode = shouldPan ? 'pan' : 'rotate'
  window.addEventListener('pointermove', handleNavPointCloudPointerMove)
  window.addEventListener('pointerup', stopNavPointCloudDragging)
  window.addEventListener('pointercancel', stopNavPointCloudDragging)
}

const drawNavPointCloud = () => {
  const canvas = navPointCloudCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  const dpr = window.devicePixelRatio || 1
  const w = Math.floor(rect.width * dpr)
  const h = Math.floor(rect.height * dpr)
  canvas.width = w
  canvas.height = h

  const imageData = ctx.createImageData(w, h)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 2
    data[i + 1] = 9
    data[i + 2] = 21
    data[i + 3] = 255
  }

  const yaw = navPointCloudRotationY.value
  const pitch = navPointCloudRotationX.value
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const cosPitch = Math.cos(pitch)
  const sinPitch = Math.sin(pitch)
  const baseScale = Math.min(rect.width, rect.height) * 0.8 * navPointCloudScale.value
  const panOffsetX = navPointCloudPanX.value * rect.width
  const panOffsetY = navPointCloudPanY.value * rect.height
  const cameraDistance = 2.2
  const depthScale = 1.4
  const halfW = rect.width / 2
  const halfH = rect.height / 2
  const ptSize = Math.max(1, Math.round(navPointCloudPointSize.value * dpr))

  const writePixel = (px: number, py: number, r: number, g: number, b: number, a: number) => {
    const ix = Math.round(px * dpr)
    const iy = Math.round(py * dpr)
    for (let dy = 0; dy < ptSize; dy++) {
      for (let dx = 0; dx < ptSize; dx++) {
        const nx = ix + dx
        const ny = iy + dy
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
        const idx = (ny * w + nx) * 4
        const alpha = a / 255
        data[idx] = Math.round(data[idx] * (1 - alpha) + r * alpha)
        data[idx + 1] = Math.round(data[idx + 1] * (1 - alpha) + g * alpha)
        data[idx + 2] = Math.round(data[idx + 2] * (1 - alpha) + b * alpha)
        data[idx + 3] = 255
      }
    }
  }

  const taskPoints: Array<{x: number, y: number, name?: string}> = []

  navPointCloudData.value.forEach(point => {
    const centeredX = -point.x
    const centeredY = -point.z
    const centeredZ = point.y

    const xzRotatedX = centeredX * cosYaw + centeredZ * sinYaw
    const xzRotatedZ = -centeredX * sinYaw + centeredZ * cosYaw

    const yRotatedY = centeredY * cosPitch - xzRotatedZ * sinPitch
    const yRotatedZ = centeredY * sinPitch + xzRotatedZ * cosPitch

    const perspectiveZ = yRotatedZ * depthScale
    const perspective = cameraDistance / (cameraDistance - perspectiveZ)
    const projectedX = xzRotatedX * baseScale * perspective + halfW + panOffsetX
    const projectedY = yRotatedY * baseScale * perspective + halfH + panOffsetY

    if (projectedX < -10 || projectedX > rect.width + 10 || projectedY < -10 || projectedY > rect.height + 10) return

    if (point.intensity >= 2.5 && point.intensity < 3.5) {
      taskPoints.push({
        x: projectedX,
        y: projectedY,
        name: (point as any).name
      })
    } else if (point.intensity >= 1.9) {
      writePixel(projectedX, projectedY, 0, 255, 0, 230)
    } else {
      const t = point.intensity
      const r = Math.floor(40 + t * 200)
      const g = Math.floor(120 + t * 100)
      const b = 255
      const a = Math.floor((0.35 + t * 0.4) * 255)
      writePixel(projectedX, projectedY, r, g, b, a)
    }
  })

  ctx.putImageData(imageData, 0, 0)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // 任务点绘制在最上层，并展示名称
  taskPoints.forEach(tp => {
    ctx.beginPath()
    ctx.arc(tp.x, tp.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 216, 0, 0.92)'
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.stroke()

    if (tp.name) {
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textW = ctx.measureText(tp.name).width
      const padX = 4, padY = 2
      const tagW = textW + padX * 2
      const tagH = 12 + padY * 2
      const tagX = tp.x - tagW / 2
      const tagY = tp.y - 18 - tagH / 2
      const r = 3
      ctx.beginPath()
      ctx.moveTo(tagX + r, tagY)
      ctx.lineTo(tagX + tagW - r, tagY)
      ctx.quadraticCurveTo(tagX + tagW, tagY, tagX + tagW, tagY + r)
      ctx.lineTo(tagX + tagW, tagY + tagH - r)
      ctx.quadraticCurveTo(tagX + tagW, tagY + tagH, tagX + tagW - r, tagY + tagH)
      ctx.lineTo(tagX + r, tagY + tagH)
      ctx.quadraticCurveTo(tagX, tagY + tagH, tagX, tagY + tagH - r)
      ctx.lineTo(tagX, tagY + r)
      ctx.quadraticCurveTo(tagX, tagY, tagX + r, tagY)
      ctx.closePath()
      ctx.fillStyle = 'rgba(5, 15, 35, 0.50)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 216, 0, 0.55)'
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.fillStyle = '#FFD800'
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.fillText(tp.name, tp.x, tagY + tagH / 2)
    }
  })

  const { centerX, centerY, centerZ, maxRange } = navPointCloudNormalizationParams.value
  if (maxRange > 1e-6) {
    const originNormX = (0 - centerX) / maxRange
    const originNormY = (0 - centerY) / maxRange
    const originNormZ = (0 - centerZ) / maxRange

    const oCenteredX = -originNormX
    const oCenteredY = -originNormZ
    const oCenteredZ = originNormY

    const oXzRotatedX = oCenteredX * cosYaw + oCenteredZ * sinYaw
    const oXzRotatedZ = -oCenteredX * sinYaw + oCenteredZ * cosYaw

    const oYRotatedY = oCenteredY * cosPitch - oXzRotatedZ * sinPitch
    const oYRotatedZ = oCenteredY * sinPitch + oXzRotatedZ * cosPitch

    const oPerspectiveZ = oYRotatedZ * depthScale
    const oPerspective = cameraDistance / (cameraDistance - oPerspectiveZ)
    const oProjX = oXzRotatedX * baseScale * oPerspective + halfW + panOffsetX
    const oProjY = oYRotatedY * baseScale * oPerspective + halfH + panOffsetY

    ctx.beginPath()
    ctx.arc(oProjX, oProjY, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#FF0000'
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ;{
      const lbl = '原点'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const tw = ctx.measureText(lbl).width
      const padX = 4, tagH = 14, rr = 3, tagW = tw + padX * 2
      const tx = oProjX - tagW / 2, ty = oProjY - 10 - tagH
      ctx.beginPath()
      ctx.moveTo(tx + rr, ty); ctx.lineTo(tx + tagW - rr, ty)
      ctx.quadraticCurveTo(tx + tagW, ty, tx + tagW, ty + rr)
      ctx.lineTo(tx + tagW, ty + tagH - rr)
      ctx.quadraticCurveTo(tx + tagW, ty + tagH, tx + tagW - rr, ty + tagH)
      ctx.lineTo(tx + rr, ty + tagH)
      ctx.quadraticCurveTo(tx, ty + tagH, tx, ty + tagH - rr)
      ctx.lineTo(tx, ty + rr)
      ctx.quadraticCurveTo(tx, ty, tx + rr, ty)
      ctx.closePath()
      ctx.fillStyle = 'rgba(5, 15, 35, 0.50)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 68, 68, 0.55)'
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.fillStyle = '#FF5555'
      ctx.shadowBlur = 0
      ctx.fillText(lbl, oProjX, ty + tagH / 2)
    }
  }

  // ===== 绘制机器狗实时位置（和首页一致）=====
  const pose = robotStore.pose
  if (pose && maxRange > 1e-6) {
    const robotNormX = (pose.x - centerX) / maxRange
    const robotNormY = (pose.y - centerY) / maxRange
    const robotNormZ = (pose.z - centerZ) / maxRange

    const projectNorm = (nx: number, ny: number, nz: number) => {
      const cx2 = -nx, cy2 = -nz, cz2 = ny
      const rx = cx2 * cosYaw + cz2 * sinYaw
      const rz = -cx2 * sinYaw + cz2 * cosYaw
      const ry = cy2 * cosPitch - rz * sinPitch
      const rzF = cy2 * sinPitch + rz * cosPitch
      const persp = cameraDistance / (cameraDistance - rzF * depthScale)
      return {
        px: rx * baseScale * persp + halfW + panOffsetX,
        py: ry * baseScale * persp + halfH + panOffsetY,
      }
    }

    const { px: rProjX, py: rProjY } = projectNorm(robotNormX, robotNormY, robotNormZ)
    const mesh = arrowMesh.value
    if (mesh) {
      const baseArrowScale = 0.004
      const minArrowPx = 8
      const maxArrowPx = 24
      const arrowScale = Math.min(
        Math.max(
          baseArrowScale * navPointCloudScale.value,
          minArrowPx / (baseScale || 1)
        ),
        maxArrowPx / (baseScale || 1)
      )
      // 3MF 模型尖端朝向 +Y 轴，theta=0 时前进方向为 +X，需预减 π/2 对齐
      const cosT = Math.cos(pose.theta - Math.PI / 2)
      const sinT = Math.sin(pose.theta - Math.PI / 2)

      // 与首页 Three.js 一致：将模型头部尖端（min.x）作为机器人坐标锚点。
      const tipAnchorX = mesh.vertices.reduce((minX, v) => Math.min(minX, v.x), Number.POSITIVE_INFINITY)
      const safeTipAnchorX = Number.isFinite(tipAnchorX) ? tipAnchorX : 0
      const projVerts: Array<{ px: number; py: number }> = mesh.vertices.map(v => {
        const sx = (v.x - safeTipAnchorX) * arrowScale
        const sy = v.y * arrowScale
        const sz = v.z * arrowScale
        const rx = sx * cosT - sy * sinT
        const ry = sx * sinT + sy * cosT
        const rz = sz
        return projectNorm(robotNormX + rx, robotNormY + ry, robotNormZ + rz)
      })

      const faces: Array<{ avgPy: number; i0: number; i1: number; i2: number }> = []
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const i0 = mesh.indices[i], i1 = mesh.indices[i + 1], i2 = mesh.indices[i + 2]
        faces.push({
          avgPy: (projVerts[i0].py + projVerts[i1].py + projVerts[i2].py) / 3,
          i0, i1, i2
        })
      }
      faces.sort((a, b) => b.avgPy - a.avgPy)

      ctx.save()
      ctx.shadowColor = '#00ff88'
      ctx.shadowBlur = 0
      for (const face of faces) {
        const p0 = projVerts[face.i0]
        const p1 = projVerts[face.i1]
        const p2 = projVerts[face.i2]
        ctx.beginPath()
        ctx.moveTo(p0.px, p0.py)
        ctx.lineTo(p1.px, p1.py)
        ctx.lineTo(p2.px, p2.py)
        ctx.closePath()
        ctx.fillStyle = 'rgba(255, 0, 255, 0.85)'
        ctx.fill()
        ctx.strokeStyle = '#FFB6FF'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
      ctx.shadowBlur = 0
      ctx.restore()
    } else {
      const tipDist = 0.06
      const { px: tProjX, py: tProjY } = projectNorm(
        robotNormX + Math.cos(pose.theta) * tipDist,
        robotNormY + Math.sin(pose.theta) * tipDist,
        robotNormZ
      )
      const screenAngle = Math.atan2(tProjY - rProjY, tProjX - rProjX)
      const arrowSize = 14
      ctx.save()
      ctx.translate(rProjX, rProjY)
      ctx.rotate(screenAngle + Math.PI / 2)
      ctx.beginPath()
      // 兜底三角形也使用“尖端为坐标锚点”。
      ctx.moveTo(0, 0)
      ctx.lineTo(-arrowSize * 0.55, arrowSize * 1.6)
      ctx.lineTo(arrowSize * 0.55, arrowSize * 1.6)
      ctx.closePath()
      ctx.shadowColor = '#00ff88'
      ctx.shadowBlur = 12
      ctx.fillStyle = 'rgba(255, 0, 255, 0.88)'
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
    }

    ;{
      const lbl = '机器狗'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const tw = ctx.measureText(lbl).width
      const padX = 4, tagH = 14, rr = 3, tagW = tw + padX * 2
      const tx = rProjX - tagW / 2, ty = rProjY - 18 - tagH
      ctx.beginPath()
      ctx.moveTo(tx + rr, ty); ctx.lineTo(tx + tagW - rr, ty)
      ctx.quadraticCurveTo(tx + tagW, ty, tx + tagW, ty + rr)
      ctx.lineTo(tx + tagW, ty + tagH - rr)
      ctx.quadraticCurveTo(tx + tagW, ty + tagH, tx + tagW - rr, ty + tagH)
      ctx.lineTo(tx + rr, ty + tagH)
      ctx.quadraticCurveTo(tx, ty + tagH, tx, ty + tagH - rr)
      ctx.lineTo(tx, ty + rr)
      ctx.quadraticCurveTo(tx, ty, tx + rr, ty)
      ctx.closePath()
      ctx.fillStyle = 'rgba(5, 15, 35, 0.50)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 150, 255, 0.55)'
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.fillStyle = '#FF88FF'
      ctx.shadowBlur = 0
      ctx.fillText(lbl, rProjX, ty + tagH / 2)
    }
  }
}

const overlayNavTrackTrajectory = async (trackName: string) => {
  const normalizedTrackName = normalizeTrackName(trackName)
  if (!normalizedTrackName || baseNavPointCloudData.value.length === 0) return

  try {
    const currentTaskPointName = normalizeTaskPointName(activeNavTrackInfo.value.taskpoint_name)
    const overlayKey = `${normalizedTrackName}::${currentTaskPointName}`
    if (
      lastNavTrackOverlayKey.value === overlayKey &&
      navPointCloudData.value.length > baseNavPointCloudData.value.length
    ) {
      return
    }

    let blob = await getTrajectoryFile(normalizedTrackName)

    // 缓存未命中：尝试即时下载
    if (!blob) {
      console.log('[轨迹叠加] 缓存未命中，尝试下载:', normalizedTrackName)
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (!robotId) return
      const downloaded = await mapFileApi.downloadTrajectoryFile(robotId, normalizedTrackName)
      if (downloaded) {
        const text = await downloaded.text()
        if (!text.trim().startsWith('<') && !text.includes('error_code')) {
          await saveTrajectoryFile(normalizedTrackName, downloaded)
          blob = downloaded
          console.log('[轨迹叠加] 下载并缓存成功:', normalizedTrackName)
        } else {
          console.warn('[轨迹叠加] 下载内容无效，跳过:', normalizedTrackName)
        }
      }
    }

    const trajectoryPoints: Array<{ x: number; y: number; z: number }> = []

    if (blob) {
      const text = await blob.text()
      const lines = text.trim().split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const parts = trimmed.includes(',') ? trimmed.split(',') : trimmed.split(/\s+/)
        const len = parts.length
        // 仅支持两种格式：
        // 6列：index, x, y, z, ... 取实际 z
        // 5列：index, x, y, ...    无 z，默认 0
        if (len === 6) {
          const x = parseFloat(parts[1]), y = parseFloat(parts[2]), z = parseFloat(parts[3])
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) { trajectoryPoints.push({ x, y, z }); continue }
        }
        // 5列：index, x, y, ... z 置为 0
        if (len === 5) {
          const x = parseFloat(parts[1]), y = parseFloat(parts[2])
          if (!isNaN(x) && !isNaN(y)) { trajectoryPoints.push({ x, y, z: 0 }); continue }
        }
        // 其他列数按无效行跳过
      }
    }

    const taskPointsData: Array<{ x: number; y: number; z: number; name: string }> = []
    const cachedData = localStorage.getItem('all_track_task_list')
    if (cachedData) {
      const parsed = JSON.parse(cachedData)
      const allTaskList = extractTrackTaskList(parsed)
      let filteredTasks = allTaskList.filter((task: any) => {
        const taskTrackName = normalizeTrackName(String(task.track_name || ''))
        const taskPointName = normalizeTaskPointName(String(task.track_point_name || task.taskpoint_name || task.task_point_name || ''))
        return taskTrackName === normalizedTrackName && taskPointName === currentTaskPointName
      })

      if (!currentTaskPointName || filteredTasks.length === 0) {
        filteredTasks = allTaskList.filter((task: any) => {
          const taskTrackName = normalizeTrackName(String(task.track_name || ''))
          return taskTrackName === normalizedTrackName
        })
      }

      filteredTasks.forEach((task: any, idx: number) => {
        const tx = parseFloat(task.x), ty = parseFloat(task.y), tz = parseFloat(task.z ?? '0')
        if (!isNaN(tx) && !isNaN(ty) && !isNaN(tz)) {
          taskPointsData.push({
            x: tx,
            y: ty,
            z: tz,
            name: task.type_text || task.preset || `任务点${idx}`
          })
        }
      })
    }

    const { centerX, centerY, centerZ, maxRange } = navPointCloudNormalizationParams.value
    const normalizedTrajectory = trajectoryPoints.map(p => ({
      x: (p.x - centerX) / maxRange,
      y: (p.y - centerY) / maxRange,
      z: (p.z - centerZ) / maxRange,
      intensity: 2.0
    }))
    const normalizedTaskPoints = taskPointsData.map(p => ({
      x: (p.x - centerX) / maxRange,
      y: (p.y - centerY) / maxRange,
      z: (p.z - centerZ) / maxRange,
      intensity: 3.0,
      name: p.name
    }))

    navPointCloudData.value = [
      ...baseNavPointCloudData.value,
      ...normalizedTrajectory,
      ...normalizedTaskPoints
    ]
    lastNavTrackOverlayKey.value = overlayKey
    await nextTick()
    scheduleNavPointCloudRender()
  } catch (err) {
    console.error('[导航点云] 叠加轨迹失败:', err)
  }
}

const normalizeTrackName = (rawTrackName: string) => {
  const trimmed = (rawTrackName || '').trim()
  if (!trimmed) return ''
  const atIndex = trimmed.indexOf('@')
  return atIndex > -1 ? trimmed.substring(0, atIndex) : trimmed
}

const normalizeTaskPointName = (rawTaskPointName: string) => {
  const trimmed = (rawTaskPointName || '').trim()
  if (!trimmed) return ''
  const atIndex = trimmed.indexOf('@')
  return atIndex > -1 ? trimmed.substring(0, atIndex) : trimmed
}

const normalizeMapName = (rawMapName: string) => {
  const trimmed = (rawMapName || '').trim()
  if (!trimmed) return ''
  const atIndex = trimmed.indexOf('@')
  return atIndex > -1 ? trimmed.substring(0, atIndex) : trimmed
}

const extractTrackTaskList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.response?.data)) return payload.response.data
  return []
}

interface NavPointTask {
  task_id: string
  task_name: string
  taskcontent: any[]
}

const navPointTaskList = ref<NavPointTask[]>([])
const selectedNavPointTaskId = ref('')
const pendingRunningNavPointTaskName = ref('')
const activeNavOverlayPointTaskId = ref('')
const lastNavPointTaskOverlayKey = ref('')
let navPointTaskRequestToken = 0

const filteredNavPointTaskList = computed(() => {
  const mapName = normalizeMapName(selectedNavMap.value || '')
  if (!mapName) return []
  return navPointTaskList.value.filter(task => String(task.task_name || '').startsWith(`${mapName}_`))
})

const resolveNavPointTaskCurrentIndex = (taskName: string, totalCount: number) => {
  if (totalCount <= 0) return -1
  const progress = robotStore.taskProgress
  if (!progress) return 0
  const progressTaskName = String(progress.task_name || '').trim()
  if (!progressTaskName || progressTaskName !== String(taskName || '').trim()) {
    return 0
  }
  const finished = Math.max(0, Math.floor(Number(progress.finished_points ?? 0)))
  return Math.min(finished, totalCount - 1)
}

const overlayNavPointTaskWaypoints = async (taskId: string, taskName?: string) => {
  if (!taskId || baseNavPointCloudData.value.length === 0) return

  const targetTask = navPointTaskList.value.find(task => String(task.task_id) === String(taskId))
  if (!targetTask) return

  const taskContent = Array.isArray(targetTask.taskcontent) ? targetTask.taskcontent : []
  if (taskContent.length === 0) {
    navPointCloudData.value = [...baseNavPointCloudData.value]
    scheduleNavPointCloudRender()
    return
  }

  const currentTaskIndex = resolveNavPointTaskCurrentIndex(taskName || targetTask.task_name, taskContent.length)
  const overlayKey = `${String(taskId)}::${currentTaskIndex}`
  if (
    lastNavPointTaskOverlayKey.value === overlayKey &&
    navPointCloudData.value.length > baseNavPointCloudData.value.length
  ) {
    return
  }

  const { centerX, centerY, centerZ, maxRange } = navPointCloudNormalizationParams.value
  if (!maxRange || !Number.isFinite(maxRange)) return

  const normalizedTaskPoints = taskContent
    .map((task: any, idx: number) => {
      const tx = parseFloat(task?.x)
      const ty = parseFloat(task?.y)
      const tz = parseFloat(task?.z ?? '0')
      if (!Number.isFinite(tx) || !Number.isFinite(ty) || !Number.isFinite(tz)) return null

      const isCurrent = idx === currentTaskIndex
      return {
        x: (tx - centerX) / maxRange,
        y: (ty - centerY) / maxRange,
        z: (tz - centerZ) / maxRange,
        intensity: isCurrent ? 2.2 : 1.8,
        name: isCurrent
          ? `当前任务点${idx + 1}`
          : (task?.type_text || task?.preset || `任务点${idx + 1}`)
      }
    })
    .filter(Boolean) as any[]

  navPointCloudData.value = [
    ...baseNavPointCloudData.value,
    ...normalizedTaskPoints
  ]
  lastNavPointTaskOverlayKey.value = overlayKey
  scheduleNavPointCloudRender()
}

const applyPendingRunningNavPointTaskName = () => {
  const pendingName = String(pendingRunningNavPointTaskName.value || '').trim()
  if (!pendingName) return false
  const matched = filteredNavPointTaskList.value.find(t => String(t.task_name || '').trim() === pendingName)
  if (!matched) return false
  selectedNavPointTaskId.value = matched.task_id
  activeNavOverlayPointTaskId.value = matched.task_id
  void overlayNavPointTaskWaypoints(matched.task_id, matched.task_name)
  pendingRunningNavPointTaskName.value = ''
  return true
}

const fetchNavPointTaskList = async (forceRefresh = false) => {
  const contextKeys = getCurrentRobotContextKeys()
  const cached = !forceRefresh && contextKeys ? localStorage.getItem(contextKeys.pointTaskListKey) : null
  if (cached) {
    try {
      navPointTaskList.value = JSON.parse(cached).map((task: any) => ({
        ...task,
        task_id: String(task.task_id)
      }))
      return
    } catch (_) {}
  }

  const fallbackCached = !forceRefresh ? localStorage.getItem('cached_point_task_list') : null
  if (fallbackCached) {
    try {
      navPointTaskList.value = JSON.parse(fallbackCached).map((task: any) => ({
        ...task,
        task_id: String(task.task_id)
      }))
      return
    } catch (_) {}
  }

  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  const requestToken = ++navPointTaskRequestToken
  try {
    const response = await navigationApi.getPointTaskList(robotId)
    if (requestToken !== navPointTaskRequestToken || robotId !== (deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || '')) {
      return
    }
    if (response && Array.isArray(response.data)) {
      navPointTaskList.value = response.data.map((task: any) => ({
        ...task,
        task_id: String(task.task_id)
      }))
      if (contextKeys) {
        localStorage.setItem(contextKeys.pointTaskListKey, JSON.stringify(navPointTaskList.value))
      }
      localStorage.setItem('cached_point_task_list', JSON.stringify(navPointTaskList.value))
    }
  } catch (_) {
    navPointTaskList.value = []
  }
}

const activeNavTrackInfo = ref({ track_name: '', taskpoint_name: '' })
const activeNavOverlayTrackName = ref('')
const lastNavTrackOverlayKey = ref('')
// 预览锁：用户点击预览路线时为 true，阻止 WebSocket 任务状态更新覆盖预览画面
const isNavPreviewMode = ref(false)


// 刷新点云数据
const refreshNavPointCloud = async (mapName?: string, options?: { silent?: boolean }) => {
  const targetMap = mapName || selectedNavMap.value
  if (!targetMap) {
    console.warn('未选择地图，无法加载点云数据')
    return
  }

  const hasExistingPointCloud = navPointCloudData.value.length > 0 || baseNavPointCloudData.value.length > 0
  const silentRefresh = !!options?.silent && hasExistingPointCloud
  if (!silentRefresh) {
    navPointCloudLoading.value = true
  } else {
    navPointCloudLoading.value = false
  }
  navPointCloudError.value = ''
  console.log('开始加载导航点云数据，地图:', targetMap)
  
  try {
    // 1. 尝试从 IndexedDB 获取
    let blob = await getMapFile(targetMap, 'tinyMap.pcd')
    
    // 2. 如果缓存中没有，尝试下载
    if (!blob) {
      try {
        console.log('本地缓存未找到点云文件，尝试下载...')
        await downloadMapFiles(targetMap)
        blob = await getMapFile(targetMap, 'tinyMap.pcd')
      } catch (downloadErr) {
        console.error('下载地图文件失败:', downloadErr)
      }
    }
    
    if (!blob || blob.size === 0) {
      throw new Error('点云文件不存在')
    }

    console.log('从缓存加载点云文件')
    const buffer = await blob.arrayBuffer()
    
    console.log('PCD文件已加载，大小:', buffer.byteLength, 'bytes')
    const { points: parsedPoints, normParams } = await parsePcdBufferInWorker(buffer)
    console.log('解析点云数据，点数:', parsedPoints.length)
    
    if (parsedPoints.length > 0) {
      navPointCloudNormalizationParams.value = normParams
      navPointCloudNavigationOrigin.value = await loadNavMapNavigationOrigin(targetMap)
      navPointCloudData.value = parsedPoints
      // 保存原始地图数据，用于叠加轨迹
      baseNavPointCloudData.value = parsedPoints
      lastNavTrackOverlayKey.value = ''
    } else {
      console.warn('未解析到点云数据，使用模拟数据')
      navPointCloudNavigationOrigin.value = null
      navPointCloudData.value = generateMockNavPointCloud()
      lastNavTrackOverlayKey.value = ''
    }
    
    const trackNameFromStatus = normalizeTrackName(robotStore.cmdStatus?.track_info?.track_name || '')
    const shouldOverlayTrack = robotStore.cmdStatus?.track === 1 && !!trackNameFromStatus
    if (shouldOverlayTrack) {
      activeNavOverlayTrackName.value = trackNameFromStatus
      activeNavTrackInfo.value = {
        track_name: trackNameFromStatus,
        taskpoint_name:
          robotStore.cmdStatus?.track_info?.taskpoint_name ||
          activeNavTrackInfo.value.taskpoint_name ||
          ''
      }
      await overlayNavTrackTrajectory(trackNameFromStatus)
    } else if (robotStore.isPointTaskRunning) {
      await fetchNavPointTaskList()
      const runningPointTaskName = String(robotStore.taskStatus?.task_name || '').trim()
      let matched = filteredNavPointTaskList.value.find(task => String(task.task_name || '').trim() === runningPointTaskName)
      if (!matched && activeNavOverlayPointTaskId.value) {
        matched = navPointTaskList.value.find(task => String(task.task_id) === String(activeNavOverlayPointTaskId.value))
      }
      if (matched) {
        selectedNavPointTaskId.value = matched.task_id
        activeNavOverlayPointTaskId.value = matched.task_id
        await overlayNavPointTaskWaypoints(matched.task_id, matched.task_name)
      } else {
        await nextTick()
        scheduleNavPointCloudRender()
      }
    } else {
      // 等待数据设置完成后渲染
      await nextTick()
      scheduleNavPointCloudRender()
    }
  } catch (error) {
    console.error('点云数据加载失败:', error)
    navPointCloudError.value = '点云数据加载失败'
    navPointCloudNavigationOrigin.value = null
    navPointCloudData.value = generateMockNavPointCloud()
    lastNavTrackOverlayKey.value = ''
    await nextTick()
    scheduleNavPointCloudRender()
  } finally {
    if (!silentRefresh) {
      navPointCloudLoading.value = false
    }
  }
}

// 监听导航地图选择变化
watch(() => taskExecutionStore.selectedMapName, (newMap) => {
  if ((currentTab.value === 'nav' || currentTab.value === 'track_record') && newMap) {
    refreshNavPointCloud(newMap)
  }
}, { immediate: true })

// 初始化导航点云图
const initNavPointCloud = async () => {
  navPointCloudInitialized = true
  const targetMap = selectedNavMap.value
  if (targetMap) {
    await refreshNavPointCloud(targetMap, { silent: true })
  }
}

watch(navPointCloudData, () => {
  scheduleNavPointCloudRender()
})

watch(navPointCloudCanvas, (canvas) => {
  if (canvas && navPointCloudData.value.length > 0) {
    scheduleNavPointCloudRender()
  }
})

watch(() => robotStore.pose, () => {
  if (navPointCloudData.value.length > 0) {
    scheduleNavPointCloudRender()
  }
}, { deep: true })

watch(() => robotStore.cmdStatus?.track, (val) => {
  // 预览模式下不响应任务状态变化，保持用户预览的轨迹
  if (isNavPreviewMode.value) return
  if (val === 1) {
    const trackNameFromStatus = normalizeTrackName(robotStore.cmdStatus?.track_info?.track_name || '')
    const trackName = trackNameFromStatus || activeNavOverlayTrackName.value
    if (trackName) {
      activeNavOverlayTrackName.value = trackName
      overlayNavTrackTrajectory(trackName)
    }
  } else if (val === 0) {
    lastNavTrackOverlayKey.value = ''
    activeNavOverlayTrackName.value = ''
    if (baseNavPointCloudData.value.length > 0) {
      navPointCloudData.value = [...baseNavPointCloudData.value]
      scheduleNavPointCloudRender()
    }
  }
})

watch(() => robotStore.cmdStatus?.track_info, (info) => {
  if (!info) return
  // 预览模式下不响应任务信息变化，保持用户预览的轨迹
  if (isNavPreviewMode.value) return
  if (robotStore.cmdStatus?.track === 1 && info.track_name) {
    const normalizedTrackName = normalizeTrackName(info.track_name)
    activeNavTrackInfo.value = {
      track_name: normalizedTrackName,
      taskpoint_name:
        info.taskpoint_name ||
        activeNavTrackInfo.value.taskpoint_name ||
        ''
    }
    activeNavOverlayTrackName.value = normalizedTrackName
    overlayNavTrackTrajectory(normalizedTrackName)
  }
}, { deep: true })

watch(filteredNavPointTaskList, (newList) => {
  if (applyPendingRunningNavPointTaskName()) return
  if (newList.length === 0) {
    selectedNavPointTaskId.value = ''
    return
  }
  if (!newList.some(task => String(task.task_id) === String(selectedNavPointTaskId.value))) {
    selectedNavPointTaskId.value = String(newList[0].task_id)
  }
})

watch(() => robotStore.taskStatus, (ts) => {
  if (isNavPreviewMode.value) return
  if (!ts?.is_running || !ts.task_name || !robotStore.isPointTaskRunning) {
    activeNavOverlayPointTaskId.value = ''
    lastNavPointTaskOverlayKey.value = ''
    if (!robotStore.isTracking && baseNavPointCloudData.value.length > 0) {
      navPointCloudData.value = [...baseNavPointCloudData.value]
      scheduleNavPointCloudRender()
    }
    return
  }
  if (!selectedNavMap.value || robotStore.isTracking) return
  pendingRunningNavPointTaskName.value = String(ts.task_name || '').trim()
  if (applyPendingRunningNavPointTaskName()) return
  void fetchNavPointTaskList(true)
}, { deep: true })

watch(() => selectedNavPointTaskId.value, (taskId) => {
  if (isNavPreviewMode.value) return
  if (!robotStore.isPointTaskRunning || robotStore.isTracking || !taskId) return
  const matched = navPointTaskList.value.find(task => String(task.task_id) === String(taskId))
  if (!matched) return
  activeNavOverlayPointTaskId.value = matched.task_id
  void overlayNavPointTaskWaypoints(matched.task_id, matched.task_name)
})

onMounted(async () => {
  load3MF('/jiantou.3mf').then(mesh => {
    if (mesh) {
      arrowMesh.value = mesh
      scheduleNavPointCloudRender()
    }
  })

  await nextTick()

  // 根据恢复的子标签执行初始化逻辑
  const restoredTab = sidebarTabs.find(tab => tab.key === currentTab.value)
  if (restoredTab && currentTab.value !== 'map_record') {
    handleTabClick(restoredTab)
  }

  // 监听机器人切换事件，刷新各 tab 的列表
  window.addEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  await fetchNavPointTaskList()
})

onActivated(async () => {
  if (!mapRefreshTabs.has(currentTab.value)) return

  await refreshMapListCache()
  if (currentTab.value === 'nav') {
    fetchMapList()
  } else if (currentTab.value === 'map_edit') {
    fetchEditMapList()
  } else if (currentTab.value === 'track_record') {
    fetchTrackMapList()
  } else if (currentTab.value === 'file_manage') {
    fetchFileMapList()
  }
})

const handleRobotContextRefreshed = () => {
  fetchMapList()
  fetchEditMapList()
  if (currentTab.value === 'map_edit' && !selectedEditMap.value) {
    clearGridMapDisplay()
  }
  fetchTrackMapList()
  fetchFileMapList()
  // 循迹列表从已更新的缓存中加载
  const cached = localStorage.getItem('cached_track_list')
  if (cached) {
    allTrackList.value = JSON.parse(cached)
  }
  void fetchNavPointTaskList(true)
}

onUnmounted(() => {
  window.removeEventListener('robot-context-refreshed', handleRobotContextRefreshed)
})

// 录包建图相关状态
const isRecording = computed(() => robotStore.cmdStatus?.data_record === 1)
const canGenerateMap = computed(() => robotStore.cmdStatus?.slam === 0)
const isPageButtonsLocked = computed(() => {
  const cmdStatus = robotStore.cmdStatus
  const hasNavStateLock = cmdStatus?.nav === 1 || cmdStatus?.ins === 1 || cmdStatus?.msf === 1
  return currentTab.value === 'map_record' && hasNavStateLock
})
const mapProgress = ref(0)
const mappingStopLoading = ref(false)
const mappingAutoStopTriggered = ref(false)
const MAPPING_AUTO_STOP_OWNER_KEY = 'nav_mapping_auto_stop_owner'

const hasMappingAutoStopOwnership = () => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(MAPPING_AUTO_STOP_OWNER_KEY) === '1'
}

const setMappingAutoStopOwnership = (owned: boolean) => {
  if (typeof window === 'undefined') return
  if (owned) {
    sessionStorage.setItem(MAPPING_AUTO_STOP_OWNER_KEY, '1')
  } else {
    sessionStorage.removeItem(MAPPING_AUTO_STOP_OWNER_KEY)
  }
}

// 对接 WebSocket 实时建图进度（mapping_progress 消息）
watch(() => robotStore.mappingProgress?.progress, (progress) => {
  if (progress != null) {
    const normalizedProgress = Math.min(100, Math.max(0, Number(progress) || 0))
    mapProgress.value = normalizedProgress
    if (normalizedProgress >= 100) {
      if (!hasMappingAutoStopOwnership()) return
      void handleStopMapping(true)
    }
  }
})
const recordingDialogVisible = ref(false)
const recordingName = ref('')
const recordingLoading = ref(false)
// 生成地图对话框相关状态
const generateMapDialogVisible = ref(false)
const selectedDataPackage = ref('')
const newMapName = ref('')
const generateMapLoading = ref(false)
// 当前建图的参数（用于终止建图）
const currentMappingDataName = ref('')
const currentMappingMapName = ref('')
// 生成栅格地图对话框相关状态
const generateGridMapDialogVisible = ref(false)
const selectedMapForGrid = ref('')
const gridMapList = ref<string[]>([])
const generateGridMapLoading = ref(false)
// 新建融合地图对话框相关状态
const createFusionMapDialogVisible = ref(false)
const fusionMapName = ref('')
const createFusionMapLoading = ref(false)

// 录包建图相关方法
const ensureNavigationClosedForMapping = () => {
  if (!navigationEnabled.value) return true
  showConfirmDialog({
    title: '操作提示',
    message: '请先关闭导航，再执行该操作。',
    confirmText: '我知道了',
    cancelText: '取消',
    type: 'warning',
    onConfirm: () => {},
    onCancel: () => {}
  })
  return false
}

const ensureNotRecordingForMapActions = () => {
  if (!isRecording.value) return true
  showConfirmDialog({
    title: '操作提示',
    message: '正在录包中，请先完成录制，再执行该操作。',
    confirmText: '我知道了',
    cancelText: '取消',
    type: 'warning',
    onConfirm: () => {},
    onCancel: () => {}
  })
  return false
}

const handleStartRecording = () => {
  if (!ensureNavigationClosedForMapping()) return
  // 弹出输入对话框，输入数据包名称
  recordingName.value = ''
  recordingDialogVisible.value = true
}

const handleRecordingNameInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  const sanitized = (target.value || '').replace(/\s+/g, '')
  if (sanitized !== target.value) {
    target.value = sanitized
  }
  recordingName.value = sanitized
}

const confirmStartRecording = async () => {
  if (/\s/.test(recordingName.value)) {
    showErrorMessage('数据包名称不能包含空格')
    return
  }
  const name = recordingName.value.trim()
  if (!name) {
    showErrorMessage('请输入数据包名称')
    return
  }

  if (recordingLoading.value) return
  recordingLoading.value = true

  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }

    // 调用开始录包接口：action=1
    await navigationApi.dataRecord(robotId, {
      action: 1,
      data_name: name
    })

    // 保存当前录制名称，以便停止时使用
    recordingName.value = name
    recordingDialogVisible.value = false
    showSuccessMessage('开始录包指令已发送')
  } catch (err) {
    console.error('开始录包失败:', err)
    showErrorMessage('开始录包失败')
  } finally {
    recordingLoading.value = false
  }
}

const cancelStartRecording = () => {
  recordingDialogVisible.value = false
}

const stopRecordingRequest = async () => {
  if (!isRecording.value) return
  if (recordingLoading.value) return

  recordingLoading.value = true
  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }

    const nameToSend = recordingName.value.trim()

    // 调用停止录包接口：action=0
    await navigationApi.dataRecord(robotId, {
      action: 0,
      data_name: nameToSend
    })

    await fetchDataPackageList()
    if (nameToSend && dataPackageList.value.includes(nameToSend)) {
      selectedDataPackage.value = nameToSend
    } else if (dataPackageList.value.length > 0) {
      selectedDataPackage.value = dataPackageList.value[0]
    } else {
      selectedDataPackage.value = ''
    }

    showSuccessMessage('停止录包指令已发送')
    // 可选：清空录制名称
    // recordingName.value = ''
  } catch (err) {
    console.error('停止录包失败:', err)
    showErrorMessage('停止录包失败')
  } finally {
    recordingLoading.value = false
  }
}

const handleStopRecording = () => {
  if (!isRecording.value) return
  showConfirmDialog({
    title: '完成录制',
    message: '确定要完成录制吗？',
    confirmText: '确定',
    cancelText: '取消',
    type: 'warning',
    onConfirm: () => {
      closeConfirmDialog()
      void stopRecordingRequest()
    },
    onCancel: () => {
      closeConfirmDialog()
    }
  })
}

const handleGenerateMap = async () => {
  if (!ensureNotRecordingForMapActions()) return
  if (!ensureNavigationClosedForMapping()) return
  // 弹出对话框，选择数据包和输入地图名称
  newMapName.value = ''
  generateMapDialogVisible.value = true
  
  // 使用现有的获取数据包列表的方法
  await fetchDataPackageList()
  
  // 有数据时默认选择第一个
  if (dataPackageList.value.length > 0) {
    selectedDataPackage.value = dataPackageList.value[0]
  } else {
    selectedDataPackage.value = ''
  }
}

const confirmGenerateMap = async () => {
  if (!ensureNotRecordingForMapActions()) return
  if (!ensureNavigationClosedForMapping()) return
  const dataName = selectedDataPackage.value.trim()
  const mapName = newMapName.value.trim()
  
  if (!dataName) {
    showErrorMessage('请选择数据包')
    return
  }
  
  if (!mapName) {
    showErrorMessage('请输入地图名称')
    return
  }
  
  if (generateMapLoading.value) return
  generateMapLoading.value = true
  
  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }
    
    // 调用 slam 接口
    await navigationApi.slam(robotId, {
      action: 1,
      data_name: dataName,
      map_name: mapName
    })
    
    // 保存当前建图参数，用于终止
    currentMappingDataName.value = dataName
    currentMappingMapName.value = mapName
    mappingAutoStopTriggered.value = false
    setMappingAutoStopOwnership(true)
    
    generateMapDialogVisible.value = false
    showSuccessMessage('生成地图指令已发送')
    mapProgress.value = 0
  } catch (err) {
    console.error('生成地图失败:', err)
    showErrorMessage('生成地图失败')
  } finally {
    generateMapLoading.value = false
  }
}

const cancelGenerateMap = () => {
  generateMapDialogVisible.value = false
}

const handleGenerateGridMap = () => {
  if (!ensureNotRecordingForMapActions()) return
  if (!ensureNavigationClosedForMapping()) return
  // 弹出对话框，选择地图
  generateGridMapDialogVisible.value = true
  
  // 从缓存中获取地图列表
  try {
    const keys = getCurrentRobotMapKeys()
    const cached = keys ? localStorage.getItem(keys.mapListKey) : null
    if (cached) {
      gridMapList.value = JSON.parse(cached)
      
      // 有数据时默认选择第一个
      if (gridMapList.value.length > 0) {
        selectedMapForGrid.value = gridMapList.value[0]
      } else {
        selectedMapForGrid.value = ''
      }
    } else {
      gridMapList.value = []
      selectedMapForGrid.value = ''
    }
  } catch (err) {
    console.error('读取地图列表失败:', err)
    gridMapList.value = []
    selectedMapForGrid.value = ''
  }
}

const confirmGenerateGridMap = async () => {
  if (!ensureNotRecordingForMapActions()) return
  if (!ensureNavigationClosedForMapping()) return
  const mapName = normalizeMapName(selectedMapForGrid.value).trim()
  
  if (!mapName) {
    showErrorMessage('请选择地图')
    return
  }
  
  if (generateGridMapLoading.value) return
  generateGridMapLoading.value = true
  
  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }
    
    // 调用 change_pcd 接口
    await navigationApi.changePcd(robotId, {
      action: 1,
      map_name: mapName
    })
    
    generateGridMapDialogVisible.value = false
    showSuccessMessage('栅格地图生成完成！')
    mappingAutoStopTriggered.value = false
    mapProgress.value = 0
  } catch (err) {
    console.error('生成栅格地图失败:', err)
    showErrorMessage('生成栅格地图失败')
  } finally {
    generateGridMapLoading.value = false
  }
}

const cancelGenerateGridMap = () => {
  generateGridMapDialogVisible.value = false
}

const handleCreateFusionMap = () => {
  if (!ensureNotRecordingForMapActions()) return
  if (!ensureNavigationClosedForMapping()) return
  if (!hasRobotRtk.value) return
  // 弹出对话框，输入融合地图名称
  fusionMapName.value = ''
  createFusionMapDialogVisible.value = true
}

const confirmCreateFusionMap = async () => {
  if (!ensureNotRecordingForMapActions()) return
  if (!ensureNavigationClosedForMapping()) return
  const mapName = fusionMapName.value.trim()
  
  if (!mapName) {
    showErrorMessage('请输入融合地图名称')
    return
  }
  
  if (createFusionMapLoading.value) return
  createFusionMapLoading.value = true
  
  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }
    
    // 调用 create_msf_data 接口
    await navigationApi.createMsfData(robotId, {
      session: mapName
    })
    
    createFusionMapDialogVisible.value = false
    showSuccessMessage('新建融合地图指令已发送')
    mappingAutoStopTriggered.value = false
    mapProgress.value = 0
  } catch (err) {
    console.error('新建融合地图失败:', err)
    showErrorMessage('新建融合地图失败')
  } finally {
    createFusionMapLoading.value = false
  }
}

const cancelCreateFusionMap = () => {
  createFusionMapDialogVisible.value = false
}

const handleStopMapping = async (autoTriggeredOrEvent: boolean | MouseEvent = false) => {
  const autoTriggered = autoTriggeredOrEvent === true
  if (mapProgress.value === 0) return
  if (mappingStopLoading.value) return
  if (autoTriggered && mappingAutoStopTriggered.value) return
  if (!currentMappingMapName.value && !currentMappingDataName.value) return

  if (autoTriggered) {
    mappingAutoStopTriggered.value = true
  }
  mappingStopLoading.value = true
  
  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }
    
    // 调用 slam 接口，action 为 0 表示终止
    await navigationApi.slam(robotId, {
      action: 0,
      data_name: currentMappingDataName.value,
      map_name: currentMappingMapName.value
    })

    await refreshMapListCache()
    fetchMapList()
    fetchEditMapList()
    fetchTrackMapList()
    fetchFileMapList()
    window.dispatchEvent(new CustomEvent('robot-map-list-ready', { detail: { robotId } }))
    
    mapProgress.value = 0
    if (autoTriggered) {
      showSuccessMessage('建图完成')
    } else {
      showSuccessMessage('终止建图指令已发送')
    }
    
    // 清空保存的参数
    currentMappingDataName.value = ''
    currentMappingMapName.value = ''
    setMappingAutoStopOwnership(false)
  } catch (err) {
    if (autoTriggered) {
      mappingAutoStopTriggered.value = false
    }
    console.error('终止建图失败:', err)
    showErrorMessage('终止建图失败')
  } finally {
    mappingStopLoading.value = false
  }
}

// 地图编辑相关状态
const gridmapContainerEl = ref<HTMLElement | null>(null)
// selectedEditMap 与导航/路线录制共用 taskExecutionStore.selectedMapName，实现跨页面同步
const selectedEditMap = computed({
  get: () => taskExecutionStore.selectedMapName,
  set: (v: string) => taskExecutionStore.setSelectedMapName(v)
})
const editMapList = ref<string[]>([]) // 地图编辑页面的地图列表
const gridMapCanvas = ref<HTMLCanvasElement | null>(null)
const gridMapLoading = ref(false)
const gridMapError = ref('')
const isGridMapEmptyState = computed(() => gridMapError.value === '暂无栅格图')
const isEditMode = ref(false)
const navMode = ref<'pan' | 'edit'>('pan')
const activeTool = ref<'pen' | 'eraser'>('pen')
const brushSize = ref(5)
const editHistory = ref<ImageData[]>([])
const canUndo = computed(() => editHistory.value.length > 0)

let gridImageData: ImageData | null = null
let missionGridImageData: ImageData | null = null
let currentScale = 1
let currentOffsetX = 0
let currentOffsetY = 0

// IndexedDB 相关
const MAP_DB_NAME = 'MapFilesDB'
const MAP_STORE_NAME = 'mapFiles'

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

const normalizeMapCacheFileName = (fileName: string) => {
  const text = String(fileName || '').trim()
  if (!text) return ''
  const segments = text.split('/').filter(Boolean)
  return segments.length > 0 ? segments[segments.length - 1] : text
}

const buildMapCacheKey = (mapName: string, fileName: string) => {
  return `${mapName}/${normalizeMapCacheFileName(fileName)}`
}

const getMapFile = async (mapName: string, fileName: string): Promise<Blob | null> => {
  try {
    const db = await openMapDB()
    return new Promise((resolve) => {
      const tx = db.transaction([MAP_STORE_NAME], 'readonly')
      const normalizedKey = buildMapCacheKey(mapName, fileName)
      const legacyKey = `${mapName}/${fileName}`
      const store = tx.objectStore(MAP_STORE_NAME)
      const request = store.get(normalizedKey)
      request.onsuccess = () => {
        const blob = request.result?.blob || null
        if (blob) {
          resolve(blob)
          return
        }
        if (legacyKey !== normalizedKey) {
          const fallbackRequest = store.get(legacyKey)
          fallbackRequest.onsuccess = () => resolve(fallbackRequest.result?.blob || null)
          fallbackRequest.onerror = () => resolve(null)
          return
        }
        resolve(null)
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

// 保存地图文件
const saveMapFile = async (mapName: string, fileName: string, blob: Blob): Promise<void> => {
  const db = await openMapDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MAP_STORE_NAME], 'readwrite')
    const store = tx.objectStore(MAP_STORE_NAME)
    store.put({ id: buildMapCacheKey(mapName, fileName), blob })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// 下载地图文件
const mapDownloadInFlight = new Map<string, Promise<void>>()

const downloadMapFiles = async (mapName: string) => {
  const existing = mapDownloadInFlight.get(mapName)
  if (existing) {
    await existing
    return
  }

  const task = (async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    throw new Error('未选择机器人，无法下载地图')
  }
  // 下载文件
  const files = await mapFileApi.downloadAllMapFiles(robotId, mapName)
  
  // 保存文件到 IndexedDB
  for (const [fileName, blob] of files) {
    await saveMapFile(mapName, fileName, blob)
  }
  })()

  mapDownloadInFlight.set(mapName, task)
  try {
    await task
  } finally {
    mapDownloadInFlight.delete(mapName)
  }
}

// 加载栅格地图
const loadGridMap = async (mapName: string) => {
  if (!mapName) return
  
  try {
    gridMapLoading.value = true
    gridMapError.value = ''
    
    await nextTick()
    
    const canvas = gridMapCanvas.value
    if (!canvas) {
      gridMapLoading.value = false
      return
    }
    
    // 从IndexedDB获取地图文件
    let blob = await getMapFile(mapName, 'gridMap.pgm')
    
    // 如果缓存中没有，尝试下载
    if (!blob) {
      try {
        showSuccessMessage('正在下载地图文件...')
        await downloadMapFiles(mapName)
        // 下载完成后再次尝试获取
        blob = await getMapFile(mapName, 'gridMap.pgm')
      } catch (downloadErr) {
        console.error('下载地图失败:', downloadErr)
        // 如果下载失败，继续执行，后面会处理 blob 为空的情况
      }
    }

    if (!blob) {
      gridMapError.value = '未找到地图文件，且下载失败'
      gridMapLoading.value = false
      return
    }
    
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // 解析PGM头部
    // 重新定位数据开始位置，更健壮的方式
    let ptr = 0
    let tokenCount = 0
    let inComment = false
    let headerTokens: string[] = []
    
    // 读取头部 tokens (magic, width, height, maxVal)
    while (ptr < bytes.length && tokenCount < 4) {
        const char = String.fromCharCode(bytes[ptr])
        if (inComment) {
            if (char === '\n') inComment = false
            ptr++
            continue
        }
        if (char === '#') {
            inComment = true
            ptr++
            continue
        }
        if (/\s/.test(char)) {
            ptr++
            continue
        }
        // 找到token
        let tokenStart = ptr
        while (ptr < bytes.length && !/\s/.test(String.fromCharCode(bytes[ptr]))) {
            ptr++
        }
        let token = String.fromCharCode(...bytes.subarray(tokenStart, ptr))
        headerTokens.push(token)
        tokenCount++
    }
    
    // 跳过最后一个token后的空白字符
    if (ptr < bytes.length && /\s/.test(String.fromCharCode(bytes[ptr]))) {
        ptr++
    }
    let dataStart = ptr
    
    const magic = headerTokens[0]
    const width = parseInt(headerTokens[1])
    const height = parseInt(headerTokens[2])
    const maxVal = parseInt(headerTokens[3]) || 255
    
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.createImageData(width, height)
    
    // 解析图像数据
    if (magic === 'P5') {
      // 二进制格式
      let p = dataStart
      for (let idx = 0; idx < width * height; idx++) {
        if (p >= bytes.length) break
        const v = bytes[p++]
        // 简单的灰度映射
        const c = v
        const off = idx * 4
        imageData.data[off] = c
        imageData.data[off + 1] = c
        imageData.data[off + 2] = c
        imageData.data[off + 3] = 255
      }
    } else if (magic === 'P2') {
      // ASCII格式
      // 将剩余的字节转换为字符串
      const textDecoder = new TextDecoder()
      const asciiData = textDecoder.decode(bytes.subarray(dataStart))
      // 使用正则分割空白字符
      const tokens = asciiData.trim().split(/\s+/)
      
      for (let idx = 0; idx < width * height; idx++) {
        if (idx >= tokens.length) break
        const v = parseInt(tokens[idx], 10)
        // 归一化到 0-255
        const c = Math.floor((v / maxVal) * 255)
        const off = idx * 4
        imageData.data[off] = c
        imageData.data[off + 1] = c
        imageData.data[off + 2] = c
        imageData.data[off + 3] = 255
      }
    } else {
      throw new Error('不支持的PGM格式: ' + magic)
    }
    
    // 黑白映射优化显示
    for (let k = 0; k < imageData.data.length; k += 4) {
      const g = imageData.data[k]
      // 205是未知区域，显示为灰色
      // 0是障碍，显示为黑色
      // 254/255是空闲，显示为白色
      if (g === 205) {
        imageData.data[k] = 205
        imageData.data[k + 1] = 205
        imageData.data[k + 2] = 205
      } else if (g < 128) {
        imageData.data[k] = 0
        imageData.data[k + 1] = 0
        imageData.data[k + 2] = 0
      } else {
        imageData.data[k] = 255
        imageData.data[k + 1] = 255
        imageData.data[k + 2] = 255
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    missionGridImageData = imageData
    gridImageData = null // 清除编辑缓存
    editHistory.value = [] // 清除历史记录
    
    // 重置缩放
    resetZoom()
    
    // 绑定事件
    setupCanvasEvents()
    
  } catch (err) {
    console.error('加载地图失败:', err)
    gridMapError.value = '加载地图失败: ' + (err as Error).message
  } finally {
    gridMapLoading.value = false
  }
}

const clearGridMapDisplay = (message = '暂无栅格图') => {
  gridMapLoading.value = false
  gridMapError.value = message
  missionGridImageData = null
  gridImageData = null
  editHistory.value = []
  if (canvasEventsController) {
    canvasEventsController.abort()
    canvasEventsController = null
  }

  const canvas = gridMapCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  canvas.width = 0
  canvas.height = 0
  canvas.style.width = ''
  canvas.style.height = ''
  canvas.style.transform = ''
  lastPointerCanvasCoords = null
  hideEraserPreview()
}

// 监听地图编辑选择变化（store setter 已持久化，无需手动写 localStorage）
watch(selectedEditMap, (newMap) => {
  if (newMap) {
    loadGridMap(newMap)
  } else {
    clearGridMapDisplay()
  }
})

watch(brushSize, () => {
  refreshEraserPreview()
})

watch([isEditMode, navMode, activeTool, gridMapLoading, gridMapError], () => {
  refreshEraserPreview()
})



let isDragging = false
let lastX = 0
let lastY = 0
let drawing = false
let editLastX = 0
let editLastY = 0
let canvasEventsController: AbortController | null = null
let lastPointerCanvasCoords: { x: number; y: number } | null = null
let lastPointerClientPos: { x: number; y: number } | null = null

const eraserPreview = ref({
  visible: false,
  left: 0,
  top: 0,
  diameter: 0,
  label: '',
  tool: 'eraser',
})

const shouldShowEraserPreview = () => {
  return Boolean(
    isEditMode.value
      && navMode.value === 'edit'
      && !gridMapLoading.value
      && gridMapCanvas.value
  )
}

const hideEraserPreview = () => {
  eraserPreview.value.visible = false
}

const updateEraserPreviewAtCanvasCoords = (
  coords: { x: number; y: number },
  clientPos?: { x: number; y: number } | null
) => {
  const canvas = gridMapCanvas.value
  const container = gridmapContainerEl.value
  if (!canvas || !container || !shouldShowEraserPreview()) {
    hideEraserPreview()
    return
  }

  const canvasRect = canvas.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  if (canvasRect.width <= 0 || canvasRect.height <= 0) {
    hideEraserPreview()
    return
  }

  const pixelToScreenX = canvasRect.width / canvas.width
  const pixelToScreenY = canvasRect.height / canvas.height
  const fallbackCenterClientX = canvasRect.left + (coords.x + 0.5) * pixelToScreenX
  const fallbackCenterClientY = canvasRect.top + (coords.y + 0.5) * pixelToScreenY
  const centerClientX = clientPos?.x ?? fallbackCenterClientX
  const centerClientY = clientPos?.y ?? fallbackCenterClientY

  const radiusPx = Math.max(1, Math.floor(brushSize.value / 2))
  const radiusScreen = Math.max(4, radiusPx * Math.max(pixelToScreenX, pixelToScreenY))
  const diameter = radiusScreen * 2
  const half = diameter / 2
  const rawLeft = centerClientX - containerRect.left
  const rawTop = centerClientY - containerRect.top
  const clampedLeft = Math.max(half + 2, Math.min(containerRect.width - half - 2, rawLeft))
  const clampedTop = Math.max(half + 2, Math.min(containerRect.height - half - 2, rawTop))

  eraserPreview.value = {
    visible: true,
    left: clampedLeft,
    top: clampedTop,
    diameter,
    label: activeTool.value === 'pen' ? '画笔' : '橡皮擦',
    tool: activeTool.value,
  }
}

const refreshEraserPreview = () => {
  if (!lastPointerCanvasCoords || !shouldShowEraserPreview()) {
    hideEraserPreview()
    return
  }
  updateEraserPreviewAtCanvasCoords(lastPointerCanvasCoords, lastPointerClientPos)
}

// 编辑模式切换
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    navMode.value = 'pan'
  }
  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = getCanvasCursor()
  }
  refreshEraserPreview()
}

// 获取橡皮擦光标样式
const getEraserCursor = () => {
  return 'none'
}

const getCanvasCursor = () => {
  if (!isEditMode.value || navMode.value === 'pan') {
    return 'grab'
  }
  return getEraserCursor()
}

// 设置导航模式
const setNavMode = (mode: 'pan' | 'edit') => {
  navMode.value = mode
  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = getCanvasCursor()
  }
  refreshEraserPreview()
}

// 设置工具
const setTool = (tool: 'pen' | 'eraser') => {
  activeTool.value = tool
  navMode.value = 'edit'
  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = getCanvasCursor()
  }
  refreshEraserPreview()
}

// 缩放和导航方法
const zoomIn = () => {
  currentScale = Math.min(5, currentScale * 1.2)
  applyTransform()
}

const zoomOut = () => {
  currentScale = Math.max(0.2, currentScale / 1.2)
  applyTransform()
}

const resetZoom = () => {
  currentScale = 1
  currentOffsetX = 0
  currentOffsetY = 0
  applyTransform()
}

const applyTransform = () => {
  const canvas = gridMapCanvas.value
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
  refreshEraserPreview()
}

// 获取canvas坐标
const getCanvasCoords = (e: MouseEvent) => {
  const canvas = gridMapCanvas.value
  if (!canvas) return { x: 0, y: 0 }
  
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  return {
    x: Math.floor((e.clientX - rect.left) * scaleX),
    y: Math.floor((e.clientY - rect.top) * scaleY)
  }
}

// 编辑像素
const editGridPixel = (x: number, y: number) => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  
  if (!gridImageData) {
    if (missionGridImageData) {
      gridImageData = ctx.createImageData(missionGridImageData.width, missionGridImageData.height)
      gridImageData.data.set(missionGridImageData.data)
    } else {
      gridImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }
  }
  
  const radius = Math.floor(brushSize.value / 2)
  const color = activeTool.value === 'pen' ? [0, 0, 0, 255] : [255, 255, 255, 255]
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = x + dx
      const py = y + dy
      
      if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= radius) {
          const index = (py * canvas.width + px) * 4
          gridImageData.data[index] = color[0]
          gridImageData.data[index + 1] = color[1]
          gridImageData.data[index + 2] = color[2]
          gridImageData.data[index + 3] = color[3]
        }
      }
    }
  }
  
  ctx.putImageData(gridImageData, 0, 0)
}

// 画线
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

// 保存历史记录
const saveToHistory = () => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  
  const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  editHistory.value.push(currentData)
  
  // 限制历史记录数量
  if (editHistory.value.length > 20) {
    editHistory.value.shift()
  }
}

// 撤销编辑
const undoEdit = () => {
  if (editHistory.value.length === 0) return
  
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  
  const lastState = editHistory.value.pop()
  if (lastState) {
    ctx.putImageData(lastState, 0, 0)
    gridImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }
}

// 将ImageData转换为PGM格式
const convertImageDataToPGM = (imageData: ImageData) => {
  const width = imageData.width
  const height = imageData.height
  
  // 构建PGM文件头 (P5格式 = 二进制)
  const header = `P5\n${width} ${height}\n255\n`
  const headerBytes = new TextEncoder().encode(header)
  
  // 创建像素数据数组（灰度值）
  const pixels = new Uint8Array(width * height)
  
  // 从ImageData提取灰度值
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    // 使用R通道的值（因为是黑白图，RGB值相同）
    pixels[i] = imageData.data[idx]
  }
  
  // 合并头部和像素数据
  const pgmData = new Uint8Array(headerBytes.length + pixels.length)
  pgmData.set(headerBytes, 0)
  pgmData.set(pixels, headerBytes.length)
  
  return pgmData
}

// 清除编辑
const clearGridEdit = () => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !missionGridImageData) return
  
  // 恢复原始地图数据
  ctx.putImageData(missionGridImageData, 0, 0)
  gridImageData = null
  editHistory.value = []
  refreshEraserPreview()
}

// 保存编辑后的地图
const handleSaveGridMap = async () => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) {
    console.error('Canvas未找到')
    return
  }
  
  // 获取当前编辑后的图像数据
  const currentImageData = gridImageData || missionGridImageData
  if (!currentImageData) {
    console.error('没有可保存的地图数据')
    showErrorMessage('没有可保存的地图数据')
    return
  }
  
  // 使用自定义对话框进行二次确认
  showConfirmDialog({
    title: '确认保存地图',
    message: `确认要保存编辑后的地图吗？\n\n地图名称：${selectedEditMap.value}\n\n保存后将覆盖服务器上的原始地图文件。`,
    confirmText: '确认保存',
    cancelText: '取消',
    type: 'warning',
    onConfirm: async () => {
      try {
        // 将ImageData转换为PGM格式
        const pgmData = convertImageDataToPGM(currentImageData)
        
        // 创建Blob对象
        const blob = new Blob([pgmData], { type: 'application/octet-stream' })
        
        const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
        if (!robotId) {
          throw new Error('未选择机器人，无法上传地图')
        }
        const mapName = selectedEditMap.value
        const fileName = 'gridMap.pgm'
        
        console.log('准备上传PGM文件:', {
          mapName,
          fileName,
          dataSize: pgmData.length,
          width: currentImageData.width,
          height: currentImageData.height
        })
        
        // 步骤1: 上传到服务器
        showSuccessMessage('正在上传到服务器...')
        const uploadSuccess = await mapFileApi.uploadMapFile(robotId, mapName, fileName, blob)
        
        if (!uploadSuccess) {
          throw new Error('上传到服务器失败')
        }
        console.log('? 服务器上传成功')
        
        // 步骤2: 从服务器下载验证
        showSuccessMessage('正在从服务器下载验证...')
        const downloadedBlob = await mapFileApi.downloadMapFile(robotId, mapName, fileName)
        
        if (!downloadedBlob) {
          throw new Error('从服务器下载验证失败')
        }
        
        // 服务端可能会对PGM做规范化处理，大小变化不代表失败
        if (downloadedBlob.size !== blob.size) {
          console.warn(`? 文件大小不一致（可能被服务端规范化）: 原始=${blob.size}, 下载=${downloadedBlob.size}`)
        } else {
          console.log('? 服务器下载验证成功，文件大小一致:', downloadedBlob.size)
        }
        
        // 步骤3: 更新IndexedDB中的缓存（以服务端版本为准）
        await saveMapFile(mapName, fileName, downloadedBlob)
        console.log('? IndexedDB缓存已更新')

        // 上传成功后，更新“初始化”基准为当前已保存版本
        // 否则 clearGridEdit 仍会回到编辑前的旧 missionGridImageData
        const savedSnapshot = ctx.createImageData(currentImageData.width, currentImageData.height)
        savedSnapshot.data.set(currentImageData.data)
        missionGridImageData = savedSnapshot
        gridImageData = null
        editHistory.value = []
        refreshEraserPreview()
        
        showSuccessMessage('地图保存成功！')
        
      } catch (error) {
        console.error('保存地图失败:', error)
        showErrorMessage('保存地图失败: ' + (error as Error).message)
      }
    },
    onCancel: () => {
      console.log('用户取消保存')
    }
  })
}

// 加载并渲染PGM文件
const loadAndRenderGridMap = async () => {
  try {
    gridMapLoading.value = true
    gridMapError.value = ''
    
    await nextTick()
    
    const canvas = gridMapCanvas.value
    if (!canvas) {
      console.warn('Canvas element not found')
      gridMapLoading.value = false
      return
    }
    
    // 加载PGM文件
    const url = new URL('../../public/gridMap.pgm', import.meta.url).href
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('无法加载地图文件')
    }
    
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // 解析PGM头部
    let header = ''
    let i = 0
    let newlines = 0
    while (i < bytes.length && newlines < 3) {
      const ch = String.fromCharCode(bytes[i++])
      header += ch
      if (ch === '\n') newlines++
    }
    
    const headerClean = header.split('\n').filter(l => l.trim() && !l.startsWith('#')).join('\n')
    const parts = headerClean.split(/\s+/).filter(Boolean)
    const magic = parts[0]
    const width = parseInt(parts[1])
    const height = parseInt(parts[2])
    const maxVal = parseInt(parts[3]) || 255
    const pixelStart = i
    
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.createImageData(width, height)
    
    // 解析图像数据
    if (magic === 'P5') {
      // 二进制格式
      const bytesPerSample = maxVal > 255 ? 2 : 1
      let p = pixelStart
      for (let idx = 0; idx < width * height; idx++) {
        let v = 0
        if (bytesPerSample === 1) {
          v = bytes[p++]
        } else {
          v = (bytes[p] << 8) | bytes[p + 1]
          p += 2
        }
        const c = Math.max(0, Math.min(255, Math.round((v / maxVal) * 255)))
        const off = idx * 4
        imageData.data[off] = c
        imageData.data[off + 1] = c
        imageData.data[off + 2] = c
        imageData.data[off + 3] = 255
      }
    } else {
      // ASCII格式
      const text = new TextDecoder().decode(bytes)
      const tokens = text.replace(/#.*\n/g, '').trim().split(/\s+/)
      const pixelTokens = tokens.slice(4)
      for (let idx = 0; idx < width * height; idx++) {
        const v = parseInt(pixelTokens[idx] || `${maxVal}`)
        const c = Math.max(0, Math.min(255, Math.round((v / maxVal) * 255)))
        const off = idx * 4
        imageData.data[off] = c
        imageData.data[off + 1] = c
        imageData.data[off + 2] = c
        imageData.data[off + 3] = 255
      }
    }
    
    // 黑白映射
    for (let k = 0; k < imageData.data.length; k += 4) {
      const g = imageData.data[k]
      if (g < 128) {
        imageData.data[k] = 0
        imageData.data[k + 1] = 0
        imageData.data[k + 2] = 0
      } else {
        imageData.data[k] = 255
        imageData.data[k + 1] = 255
        imageData.data[k + 2] = 255
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    // 保存原始图像数据
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
    
    // 添加鼠标事件监听
    setupCanvasEvents()
    
    gridMapLoading.value = false
  } catch (error) {
    console.error('加载地图失败:', error)
    gridMapError.value = '加载地图失败，请检查文件是否存在'
    gridMapLoading.value = false
  }
}

// 设置Canvas事件
const setupCanvasEvents = () => {
  const canvas = gridMapCanvas.value
  if (!canvas) return

  // 先清理旧的事件监听器，避免重复绑定
  if (canvasEventsController) {
    canvasEventsController.abort()
  }
  canvasEventsController = new AbortController()
  const signal = canvasEventsController.signal
  
  // 鼠标滚轮事件
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    currentScale = Math.max(0.2, Math.min(5, currentScale * delta))
    applyTransform()
  }
  
  // 鼠标按下事件
  const onMouseDown = (e: MouseEvent) => {
    lastPointerClientPos = { x: e.clientX, y: e.clientY }

    const coords = getCanvasCoords(e)
    lastPointerCanvasCoords = coords

    // 编辑模式下且为编辑导航模式的左键编辑
    if (isEditMode.value && navMode.value === 'edit' && e.button === 0 && !e.ctrlKey) {
      if (!drawing) {
        saveToHistory()
      }
      drawing = true
      editLastX = coords.x
      editLastY = coords.y
      if (shouldShowEraserPreview()) {
        updateEraserPreviewAtCanvasCoords(coords, lastPointerClientPos)
      } else {
        hideEraserPreview()
      }
      editGridPixel(coords.x, coords.y)
      e.preventDefault()
      return
    }
    
    // 拖动：拖动模式、右键、Ctrl+左键、或非编辑模式的左键
    if (navMode.value === 'pan' || e.button === 2 || e.ctrlKey || !isEditMode.value) {
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
      canvas.style.cursor = 'grabbing'
      e.preventDefault()
    }
  }
  
  // 鼠标移动事件
  const onMouseMove = (e: MouseEvent) => {
    lastPointerClientPos = { x: e.clientX, y: e.clientY }

    const coords = getCanvasCoords(e)
    lastPointerCanvasCoords = coords

    // 处理编辑绘制
    if (drawing && isEditMode.value) {
      if (shouldShowEraserPreview()) {
        updateEraserPreviewAtCanvasCoords(coords, lastPointerClientPos)
      }
      drawLine(editLastX, editLastY, coords.x, coords.y)
      editLastX = coords.x
      editLastY = coords.y
      return
    }

    if (shouldShowEraserPreview()) {
      updateEraserPreviewAtCanvasCoords(coords, lastPointerClientPos)
    }
    
    // 处理拖动
    if (isDragging) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      currentOffsetX += dx
      currentOffsetY += dy
      applyTransform()
      lastX = e.clientX
      lastY = e.clientY
      if (shouldShowEraserPreview()) {
        const movedCoords = getCanvasCoords(e)
        lastPointerCanvasCoords = movedCoords
        updateEraserPreviewAtCanvasCoords(movedCoords, lastPointerClientPos)
      }
    }
  }
  
  // 鼠标松开事件
  const endDrag = () => {
    isDragging = false
    drawing = false
    canvas.style.cursor = getCanvasCursor()
    refreshEraserPreview()
  }

  const onMouseLeave = () => {
    hideEraserPreview()
    endDrag()
  }

  const onMouseEnter = (e: MouseEvent) => {
    const coords = getCanvasCoords(e)
    lastPointerCanvasCoords = coords
    lastPointerClientPos = { x: e.clientX, y: e.clientY }
    canvas.style.cursor = getCanvasCursor()
    if (shouldShowEraserPreview()) {
      updateEraserPreviewAtCanvasCoords(coords, lastPointerClientPos)
    }
  }
  
  // 添加事件监听：wheel 绑定在容器上，确保鼠标在空白区域也能缩放
  const container = gridmapContainerEl.value ?? canvas
  container.addEventListener('wheel', onWheel, { passive: false, signal })
  canvas.addEventListener('mousedown', onMouseDown, { signal })
  canvas.addEventListener('mouseenter', onMouseEnter, { signal })
  canvas.addEventListener('mousemove', onMouseMove, { signal })
  canvas.addEventListener('mouseup', endDrag, { signal })
  canvas.addEventListener('mouseleave', onMouseLeave, { signal })
  canvas.addEventListener('contextmenu', (e) => e.preventDefault(), { signal })
}

// 监听tab切换，加载地图
watch(currentTab, async (newTab) => {
  if (newTab === 'map_edit') {
    await nextTick()
    // 如果已经选中了地图，加载该地图；否则清空画布并显示提示
    if (selectedEditMap.value) {
      loadGridMap(selectedEditMap.value)
    } else {
      clearGridMapDisplay()
    }
  }
})

// 文件管理示例数据
const fileList = ref([
  {
    id: 'F001',
    name: '地图文件_001.map',
    type: 'MAP',
    size: '15.6 MB',
    createTime: '2024-12-20 10:30:00',
    status: '正常'
  },
  {
    id: 'F002',
    name: '路径数据_002.path',
    type: 'PATH',
    size: '2.3 MB',
    createTime: '2024-12-21 14:20:00',
    status: '正常'
  },
  {
    id: 'F003',
    name: '配置文件_003.cfg',
    type: 'CONFIG',
    size: '128 KB',
    createTime: '2024-12-22 09:15:00',
    status: '正常'
  },
  {
    id: 'F004',
    name: '日志文件_004.log',
    type: 'LOG',
    size: '5.8 MB',
    createTime: '2024-12-23 16:45:00',
    status: '正常'
  }
])

// 文件管理（路线/任务组）列表
const fileManageMap = ref('')
const fileMapList = ref<string[]>([]) // 文件管理页面的地图列表
const fileManagePackage = ref('')
const fileManageList = ref<any[]>([])

const normalizeFileManageName = (rawName: string) => {
  const source = String(rawName || '').trim()
  if (!source) return ''

  // 去除前缀符号（如 “|- ”、“||- ”）
  const withoutPrefix = source.replace(/^[|\-_\s]+/, '')
  const baseName = withoutPrefix.split('/').pop() || withoutPrefix

  // 去扩展名（.txt/.json/.csv 等），统一比较“主名”
  return baseName.replace(/\.[^.]+$/, '').trim()
}

const getFileManageRouteFamilyKey = (rawName: string) => {
  const normalized = normalizeFileManageName(rawName)
  if (!normalized) return ''
  return normalized.endsWith('_origin')
    ? normalized.slice(0, -'_origin'.length)
    : normalized
}

const extractLastPathSegment = (rawPath: string) => {
  const source = String(rawPath || '').trim().replace(/\\/g, '/')
  if (!source) return ''
  const segments = source.split('/').filter(Boolean)
  return segments.length > 0 ? segments[segments.length - 1] : ''
}

const extractParentPathSegment = (rawPath: string) => {
  const source = String(rawPath || '').trim().replace(/\\/g, '/')
  if (!source) return ''
  const segments = source.split('/').filter(Boolean)
  return segments.length > 1 ? segments[segments.length - 2] : ''
}

const getFileManageRouteKeyByPath = (item: any) => {
  const rawType = String(item?.type || '').trim()
  const pwd = String(item?.pwd || '')
  const isFile = Number(item?.is_file ?? 0) === 1

  if (!pwd) return ''
  if (rawType.includes('循迹路线') || (!isFile && rawType.includes('循迹任务组') === false)) {
    return extractLastPathSegment(pwd)
  }
  return extractParentPathSegment(pwd)
}

const trackBaseNameSet = computed(() => {
  const set = new Set<string>()
  allTrackList.value.forEach((track) => {
    const normalizedTrackName = normalizeTrackName(String(track || ''))
    if (normalizedTrackName) {
      set.add(normalizedTrackName)
    }
  })
  return set
})

const getFileManageTypeLabel = (item: any) => {
  const rawType = String(item?.type || '').trim()
  if (rawType !== '循迹任务组') return rawType

  const normalizedName = normalizeFileManageName(item?.name ?? '')
  if (!normalizedName) return rawType

  // 优先按当前文件所属路线目录（pwd）判定：
  // 名称与路线名一致，或 名称=路线名_origin，都视为循迹路线文件
  const routeKeyByPath = getFileManageRouteKeyByPath(item)
  if (routeKeyByPath && (normalizedName === routeKeyByPath || normalizedName === `${routeKeyByPath}_origin`)) {
    return '循迹路线文件'
  }

  for (const trackName of trackBaseNameSet.value) {
    if (normalizedName === trackName || normalizedName === `${trackName}_origin`) {
      return '循迹路线文件'
    }
  }

  return rawType
}

const getFileManageTypeClass = (item: any) => {
  const typeLabel = getFileManageTypeLabel(item)
  if (typeLabel === '循迹路线') return 'is-route'
  if (typeLabel === '循迹路线文件') return 'is-route-file'
  if (typeLabel === '发布点任务组') return 'is-publish-group'
  if (typeLabel === '循迹任务组') return 'is-task-group'
  return 'is-other'
}

const getFileManageGroupTitle = (group: any) => {
  const rootType = String(group?.rootType || '').trim()
  if (rootType) return rootType
  return '文件组'
}

const getFileManageItemKey = (item: any) => {
  const id = String(item?.id ?? '')
  if (id) return id
  return `${String(item?.name ?? '')}__${String(item?.createTime ?? '')}`
}

const getFileManageCreateTimeTs = (item: any) => {
  const raw = String(item?.createTime ?? '').trim()
  if (!raw) return 0
  const normalized = raw.replace(' ', 'T')
  const time = new Date(normalized).getTime()
  return Number.isFinite(time) ? time : 0
}

const compareFileManageByCreateTimeDesc = (a: any, b: any) => {
  return getFileManageCreateTimeTs(b) - getFileManageCreateTimeTs(a)
}

const fileManageRouteCardList = computed(() => {
  const source = Array.isArray(fileManageList.value) ? fileManageList.value : []
  if (source.length === 0) return [] as Array<{
    routeKey: string
    routeName: string
    rootType: string
    items: any[]
    displayItems: any[]
    routeItem: any | null
    latestCreateTime: string
    latestCreateTimeTs: number
  }>

  const routeGroups = new Map<string, { routeKey: string; routeName: string; rootType: string; items: any[] }>()

  // 先根据顶层目录建立分组（is_file=0），例如循迹路线、发布点任务组
  source.forEach((item) => {
    const isFile = Number(item?.is_file ?? 0) === 1
    if (isFile) return
    const routeKey = getFileManageRouteKeyByPath(item)
    if (!routeKey) return
    const rootType = getFileManageTypeLabel(item) || String(item?.type || '').trim() || '文件组'
    const routeName = String(item?.name || '').trim() || routeKey
    if (!routeGroups.has(routeKey)) {
      routeGroups.set(routeKey, { routeKey, routeName, rootType, items: [] })
    }
  })

  // 再把同一路径归属（pwd 的父目录是路线名）的文件挂到对应分组
  source.forEach((item) => {
    const routeKey = getFileManageRouteKeyByPath(item)
    if (!routeKey || !routeGroups.has(routeKey)) return
    routeGroups.get(routeKey)!.items.push(item)
  })

  return Array.from(routeGroups.values())
    .map((group) => {
      const routeItem = group.items.find((item: any) => Number(item?.is_file ?? 0) === 0) || null
      const routeItemKey = routeItem ? getFileManageItemKey(routeItem) : ''
      const displayItems = (routeItemKey
        ? group.items.filter((item: any) => getFileManageItemKey(item) !== routeItemKey)
        : [...group.items])
        .sort(compareFileManageByCreateTimeDesc)
      const latestCreateTime = group.items.reduce((latest, item) => {
        const current = String(item?.createTime ?? '')
        return current > latest ? current : latest
      }, '')
      return {
        ...group,
        routeItem,
        displayItems,
        latestCreateTime,
        latestCreateTimeTs: Math.max(...group.items.map(getFileManageCreateTimeTs), 0),
      }
    })
    .filter(group => group.routeItem || group.displayItems.length > 0)
    .sort((a, b) => b.latestCreateTimeTs - a.latestCreateTimeTs)
})

const fileManageGroupedItemKeySet = computed(() => {
  const set = new Set<string>()
  fileManageRouteCardList.value.forEach(group => {
    group.items.forEach(item => set.add(getFileManageItemKey(item)))
  })
  return set
})

const fileManageOtherFileList = computed(() => {
  const source = Array.isArray(fileManageList.value) ? fileManageList.value : []
  if (source.length === 0) return []
  return source
    .filter(item => !fileManageGroupedItemKeySet.value.has(getFileManageItemKey(item)))
    .sort(compareFileManageByCreateTimeDesc)
})

// 获取文件列表
const fetchNavigationList = async () => {
  if (!fileManageMap.value) {
    fileManageList.value = []
    return
  }
  
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  try {
    let response = await navigationApi.getNavigationList(
      robotId,
      fileManageMap.value
    )
    
    // 如果是字符串，尝试解析
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response)
      } catch (e) {
        console.error('JSON解析失败:', e)
      }
    }
    
    if (response && response.code === 200 && response.data) {
      fileManageList.value = response.data.map((item: any) => ({
        ...item, // 保留所有原始字段（包括可能存在的path）
        id: item.name + item.time, // 生成唯一ID
        name: item.name, // 仅显示原始名称，不拼接前缀
        createTime: item.time,
      }))
    } else {
      console.warn('Invalid response format:', response)
      fileManageList.value = []
    }
  } catch (error) {
    console.error('获取文件列表失败:', error)
    fileManageList.value = []
  }
}

// 监听地图选择变化
watch(fileManageMap, () => {
  fetchNavigationList()
})

watch(fileManageMap, (newMap) => {
  if (newMap) taskExecutionStore.setSelectedMapName(newMap)
})



const handleDeleteMap = () => {
  if (!fileManageMap.value) {
    showErrorMessage('请先选择要删除的地图')
    return
  }
  
  showConfirmDialog({
    title: '删除地图',
    message: `确定要删除地图 "${fileManageMap.value}" 吗？此操作不可恢复。`,
    type: 'warning',
    onConfirm: async () => {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (!robotId) {
        showErrorMessage('未选择机器人')
        return
      }
      
      try {
        await navigationApi.deleteMap(robotId, fileManageMap.value)
        showSuccessMessage('删除地图成功')
        
        // 清空当前选择
        fileManageMap.value = ''
        
        // 刷新地图列表缓存（从API获取最新列表并更新缓存）
        await refreshMapListCache()
        // 更新文件管理页面的地图列表（从缓存读取）
        fetchFileMapList()
        fetchTrackMapList()
        await refreshRelatedTaskListsAfterDelete(robotId)
        window.dispatchEvent(new CustomEvent('robot-map-list-ready', {
          detail: { robotId }
        }))
      } catch (error) {
        console.error('删除地图失败:', error)
        showErrorMessage('删除地图失败')
      }
    }
  })
}

const handleDeletePackage = () => {
  if (!fileManagePackage.value) {
    showErrorMessage('请先选择要删除的数据包')
    return
  }
  
  showConfirmDialog({
    title: '删除数据包',
    message: `确定要删除数据包 "${fileManagePackage.value}" 吗？此操作不可恢复。`,
    type: 'warning',
    onConfirm: async () => {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (!robotId) {
        showErrorMessage('未选择机器人')
        return
      }
      
      try {
        await navigationApi.deleteDataPackage(robotId, fileManagePackage.value)
        showSuccessMessage('删除数据包成功')
        
        // 清空当前选择
        fileManagePackage.value = ''
        
        // 刷新列表
        await fetchDataPackageList()
      } catch (error) {
        console.error('删除数据包失败:', error)
        showErrorMessage('删除数据包失败')
      }
    }
  })
}

const handleAdd = () => {
  console.log('添加操作')
  // TODO: 根据currentTab实现对应的添加逻辑
}

const handleDelete = (item: any) => {
  showConfirmDialog({
    title: '删除文件',
    message: `确定要删除 "${item.name}" 吗？此操作不可恢复。`,
    type: 'warning',
    onConfirm: async () => {
      try {
        const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
        if (!robotId) {
          showErrorMessage('未选择机器人')
          return
        }
        await navigationApi.deleteNavigationData(robotId, {
          map_name: fileManageMap.value,
          type: item.type,
          pwd: item.pwd,
          is_file: item.is_file,
          path: '/root/dxr_data/map'
        })
        showSuccessMessage('删除成功')
        fetchNavigationList()
        fetchTrackMapList()
        await refreshRelatedTaskListsAfterDelete()
      } catch (error) {
        console.error('删除失败:', error)
        showErrorMessage('删除失败')
      }
    }
  })
}
</script>

<style scoped>
@import './mission-common.css';

.main-content.page-buttons-locked button {
  pointer-events: none !important;
  cursor: not-allowed !important;
  opacity: 0.4 !important;
  filter: grayscale(0.55);
  box-shadow: none !important;
  transform: none !important;
}

.nav-top-card {
  margin-bottom: 4px;
  background: linear-gradient(135deg, #0a2a3a 80%, #0a0f1c 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px #0003;
  padding: 18px 24px 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-top-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 10px;
}

.nav-top-title {
  font-size: 16px;
  color: #67d5fd;
  font-weight: 600;
}

.nav-top-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 4px;
  flex-wrap: wrap;
  overflow-x: visible;
}

.nav-input {
  height: 32px;
  border-radius: 4px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
  min-width: 120px;
  max-width: 180px;
  flex-shrink: 0;
}

.nav-input:focus {
  outline: none;
  border: 1.5px solid #16bbf2;
  box-shadow: 0 0 0 2px rgba(22,187,242,0.15);
}

.nav-btn {
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  padding: 4px 18px;
  cursor: pointer;
  border: none;
  transition: background 0.2s, color 0.2s, border 0.2s;
  height: 32px;
  margin-left: 4px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  background: #0c3c56;
  color: #67d5fd;
  border: 1px solid rgba(38, 131, 182, 0.8);
}

.nav-btn:hover {
  background: #0c4666;
  color: #67d5fd;
}

.nav-btn-add {
  margin-left: 4px;
}

.nav-content-wrapper {
  background: linear-gradient(135deg, #0a2a3a 80%, #0a0f1c 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px #0003;
  padding: 16px 32px 24px 32px;
  margin-bottom: 20px;
  min-height: 520px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.file-manage-package-group {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 18px;
}

.file-manage-toolbar .map-edit-select {
  height: 40px;
  min-width: 220px;
}

/* 文件管理表格列定义见底部非 scoped style 块 */

.file-table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: rgba(184, 220, 245, 0.4);
  font-size: 14px;
}

.file-check-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  display: inline-block;
}

.nav-page-content {
  padding-right: 20px;
  align-items: stretch;
}

.nav-card-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  margin-top: 0;
}

.nav-card {
  width: 100%;
  max-width: 400px;
  background: rgba(128, 128, 128, 0.12);
  border-radius: 8px;
  box-shadow: 0 2px 8px #0003;
  padding: 0 0 14px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: box-shadow 0.2s;
  justify-self: center;
}

.nav-card:hover {
  box-shadow: 0 4px 12px rgba(103, 213, 253, 0.2);
}

.nav-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  padding: 0 20px 0 24px;
  min-height: 38px;
  background: rgba(217, 217, 217, 0.10);
  border-radius: 8px 8px 0 0;
  height: 44px;
}

.nav-card-title {
  color: #FFF;
  font-family: Inter, 'Microsoft YaHei', Arial, sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  letter-spacing: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-card-delete {
  color: #ff4d4f;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  transition: filter 0.2s;
  height: 44px;
  padding-left: 12px;
}

.nav-card-delete img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: none;
  transition: filter 0.2s;
  display: block;
  margin: auto 0;
  color: #ff4d4f;
}

.nav-card-delete:hover img {
  filter: drop-shadow(0 0 4px #ff4d4f);
}

.nav-card-body {
  display: flex;
  align-items: center;
  padding: 20px 24px;
}

.nav-card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #d4edfd;
  font-size: 12px;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.info-row {
  display: flex;
  gap: 8px;
  align-items: center;
  line-height: 1.7;
}

.info-label {
  color: #b8c7d9;
  min-width: 80px;
  font-weight: 500;
  text-align: right;
  font-size: 12px;
  line-height: 1.7;
}

.info-value {
  color: #fff;
  font-weight: 400;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.7;
}

.settings-content {
  padding: 40px 20px;
  text-align: center;
}

/* 录包建图样式 */
.map-section {
  background: rgba(10, 42, 58, 0.6);
  border-radius: 8px;
  padding: 0 20px 5px;
  margin-bottom: 16px;
}

.nav-content-wrapper.track-record-content .map-section {
  padding: 20px 22px 22px 19px !important;
  margin-bottom: 52px;
  background: rgba(10, 42, 58, 0.6) !important;
}

/* 导航页的按钮区不需要背景和内边距 */
.nav-content-wrapper > .map-section {
  background: transparent;
  padding: 0;
  margin-bottom: 12px;
}

.map-section-title {
  font-size: 16px;
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 20px;
}

.track-record-content .map-section-title {
  margin-bottom: 26px;
}

.map-section-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.track-record-content .map-section-buttons {
  gap: 24px;
  margin-bottom: 6px;
}

.track-record-content .map-progress-wrapper {
  margin-top: 12px;
}

.map-btn {
  padding: 0 36px;
  height: 40px;
  line-height: 40px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid rgba(38, 131, 182, 0.4);
  transition: all 0.3s;
  min-width: 140px;
  text-align: center;
  white-space: nowrap;
  font-weight: 500;
}

.map-btn.loading {
  pointer-events: none;
  color: transparent;
  position: relative;
  opacity: 0.85;
}

.map-btn.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(103, 213, 253, 0.25);
  border-top-color: #67d5fd;
  border-radius: 50%;
  animation: map-btn-spin 0.7s linear infinite;
}

.map-btn.map-btn-danger.loading::after {
  border-color: rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
}

.map-btn-primary {
  background: #0c3c56;
  color: #67d5fd;
}

.map-btn-primary:hover:not(:disabled) {
  background: #0c4666;
  border-color: rgba(103, 213, 253, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(103, 213, 253, 0.2);
}

.map-btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.map-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-btn-secondary {
  background: #0c3c56;
  color: #67d5fd;
  border-color: rgba(38, 131, 182, 0.4);
}

.map-btn-secondary:hover:not(:disabled) {
  background: #0c4666;
  border-color: rgba(103, 213, 253, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(103, 213, 253, 0.2);
}

.map-btn-secondary:active:not(:disabled) {
  transform: translateY(0);
}

.map-btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  filter: grayscale(0.45);
}

.action-btn img {
  width: 14px;
  height: 14px;
}

.action-btn-delete {
  color: #ff4d4f;
}

.action-btn-delete img {
  filter: drop-shadow(0 0 4px rgba(255, 77, 79, 0.4));
}

.map-btn-stop {
  background: #561c1c;
  border: 1px solid rgba(182, 38, 38, 0.4);
  color: #fd6767;
  min-width: 80px;
}

.map-btn-stop:hover:not(:disabled) {
  background: #6c2323;
  border-color: rgba(253, 103, 103, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(253, 103, 103, 0.2);
}

.map-btn-stop:active:not(:disabled) {
  transform: translateY(0);
}

.map-btn-stop:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-btn-danger {
  background: #561c1c;
  border: 1px solid rgba(182, 38, 38, 0.4);
  color: #fd6767;
}

.map-btn-danger:hover:not(:disabled) {
  background: #662626;
  border-color: rgba(182, 38, 38, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(253, 103, 103, 0.2);
}

.map-btn-danger:active:not(:disabled) {
  transform: translateY(0);
}

.map-btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes map-btn-spin {
  to {
    transform: rotate(360deg);
  }
}

.map-progress-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.track-record-content .map-progress-header {
  margin-top: 12px;
}

.map-progress-header .map-section-title {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-progress-percent {
  font-size: 18px;
  color: #67d5fd;
  font-weight: 600;
  font-family: 'Arial', sans-serif;
  letter-spacing: 1px;
}

.map-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.map-progress-bar {
  flex: 1;
  height: 20px;
  background: rgba(12, 60, 86, 0.3);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(103, 213, 253, 0.2);
  min-width: 600px;
}

.map-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a6b9e 0%, #67d5fd 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.5);
}

/* 导航页样式 */
.nav-button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-main-content {
  display: flex;
  gap: 16px;
  margin-top: 0;
  width: 100%;
  min-width: 0;
  height: calc(100vh - 260px);
  min-height: 500px;
}

.nav-info-panel {
  width: 260px;
  background: rgba(10, 42, 58, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  overflow-y: hidden;
  /* 高度和点云图一致 */
  height: calc(100vh - 280px);
  min-height: 400px;
  box-sizing: border-box;
}

.nav-info-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-info-card {
  background: rgba(12, 60, 86, 0.5);
  border: 1px solid rgba(38, 131, 182, 0.4);
  border-radius: 8px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-info-card:last-of-type {
  margin-top: 0;
}

.nav-info-card-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 600;
  line-height: 1.2;
}

.nav-info-item.rtk-disabled {
  opacity: 0.52;
  filter: saturate(0.35);
  pointer-events: none;
}

.nav-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

.nav-select {
  width: 100%;
  height: 36px;
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.4);
  border-radius: 4px;
  color: #67d5fd;
  font-size: 14px;
  padding: 0 12px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s;
}

.nav-select:hover {
  border-color: rgba(103, 213, 253, 0.8);
}

.nav-select option {
  background: #0c3c56;
  color: #67d5fd;
}

.nav-select:disabled {
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%);
  border-color: rgba(103, 213, 253, 0.3);
  color: rgba(180, 205, 220, 0.62);
  cursor: not-allowed;
  box-shadow:
    inset 0 0 0 1px rgba(103, 213, 253, 0.08);
  filter: saturate(0.72) grayscale(0.22);
  opacity: 1;
}

.nav-select:disabled:hover,
.nav-select:disabled:focus {
  border-color: rgba(103, 213, 253, 0.3);
  box-shadow:
    inset 0 0 0 1px rgba(103, 213, 253, 0.08);
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%);
}

.nav-speed-control {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
}

.nav-speed-btn {
  width: 36px;
  min-width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #0c3c56 0%, #0a2f44 100%);
  border: 1px solid rgba(38, 131, 182, 0.6);
  border-radius: 6px;
  color: #67d5fd;
  font-size: 21px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.nav-speed-btn:hover {
  background: linear-gradient(135deg, #0c4666 0%, #0c3856 100%);
  border-color: rgba(103, 213, 253, 0.9);
  box-shadow: 0 4px 12px rgba(103, 213, 253, 0.3);
  transform: translateY(-1px);
}

.nav-speed-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.nav-speed-input {
  flex: 1;
  width: auto;
  min-width: 0;
  height: 36px;
  background: rgba(12, 60, 86, 0.5);
  border: 1px solid rgba(38, 131, 182, 0.4);
  border-radius: 6px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  outline: none;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.nav-info-row {
  display: flex;
  gap: 12px;
}

.nav-info-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
  line-height: 1.35;
}

.nav-info-item.rtk-disabled .nav-info-label {
  color: rgba(255, 255, 255, 0.54);
}

.nav-info-value {
  font-size: 12px;
  color: #67d5fd;
  font-weight: 500;
  line-height: 1.35;
}

.nav-info-item.rtk-disabled .nav-info-value {
  color: rgba(174, 194, 210, 0.58);
}

.nav-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.nav-status-row.rtk-disabled {
  opacity: 0.52;
  filter: saturate(0.35);
  pointer-events: none;
}

.nav-status-badge {
  min-width: 52px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid rgba(38, 131, 182, 0.4);
  background: rgba(12, 60, 86, 0.5);
  color: #67d5fd;
  font-size: 12px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.nav-status-badge.is-on {
  color: #67d5fd;
  border-color: rgba(103, 213, 253, 0.85);
  background: rgba(12, 70, 102, 0.55);
}

.nav-status-badge.is-off {
  color: rgba(180, 205, 220, 0.62);
  border-color: rgba(103, 213, 253, 0.3);
  background: linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%);
}

.nav-status-badge.is-error {
  color: #ff8f8f;
  border-color: rgba(255, 95, 95, 0.55);
  background: rgba(88, 20, 20, 0.45);
}

.nav-map-container {
  flex: 1;
  min-width: 0;
  background: rgba(10, 42, 58, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 固定高度，避免缩放动画 */
  height: calc(100vh - 280px);
  min-height: 400px;
}

.nav-map-canvas {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
}

/* 路线录制工具栏 */
.track-record-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 4px 0 8px;
  background: transparent;
  border: none;
  border-radius: 0;
  margin-bottom: 8px;
}

.track-record-content {
  padding: 24px 20px 28px 20px;
}

.track-toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.track-label {
  color: #b8dcf5;
  font-size: 14px;
  min-width: 40px;
  line-height: 40px;
  display: inline-flex;
  align-items: center;
}

.track-select-wrapper {
  position: relative;
}

.track-select {
  height: 40px;
  background: #0c3c56;
  color: #67d5fd;
  border: 1px solid rgba(38, 131, 182, 0.8);
  border-radius: 4px;
  padding: 0 30px 0 12px;
  font-size: 13px;
  min-width: 200px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-appearance: none;
  appearance: none;
}

.track-select:focus {
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.track-select:hover {
  background: #0c4666;
  border-color: rgba(38, 131, 182, 1);
}

.track-select:disabled {
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%);
  border-color: rgba(103, 213, 253, 0.3);
  color: rgba(180, 205, 220, 0.62);
  cursor: not-allowed;
  box-shadow:
    inset 0 0 0 1px rgba(103, 213, 253, 0.08);
  filter: saturate(0.72) grayscale(0.22);
  opacity: 1;
}

.track-select:disabled:hover,
.track-select:disabled:focus {
  border-color: rgba(103, 213, 253, 0.3);
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(103, 213, 253, 0.08);
}

.track-select:disabled + .track-select-arrow svg polygon {
  fill: rgba(168, 192, 210, 0.5);
}

.track-select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.track-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-wrap: wrap;
}

.track-btn {
  max-width: 140px;
  flex-shrink: 0;
}

.track-btn-danger {
  background: #561c1c;
  border: 1px solid rgba(182, 38, 38, 0.4);
  color: #fd6767;
}

.track-btn-danger:hover {
  border-color: rgba(182, 38, 38, 0.8);
  background: #662626;
}

.track-btn-danger:disabled {
  background: rgba(120, 132, 146, 0.35);
  border-color: rgba(147, 160, 176, 0.35);
  color: rgba(192, 202, 214, 0.8);
  box-shadow: none;
}

.track-record-map {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  background: rgba(10, 42, 58, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  overflow: hidden;
  height: calc(100vh - 300px);
  min-height: 420px;
}

/* 点云图样式 */
.pointcloud-wrapper {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
}

.pointcloud-view {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  background: radial-gradient(circle at 20% 20%, rgba(89, 192, 252, 0.2), transparent 45%),
              radial-gradient(circle at 80% 10%, rgba(255, 128, 0, 0.12), transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(0, 225, 255, 0.2), transparent 50%),
              #020915;
  overflow: hidden;
  box-sizing: border-box;
  touch-action: none;
  overscroll-behavior: contain;
}

.pointcloud-view > * {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.pointcloud-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  overscroll-behavior: contain;
}

.pcd-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 9, 21, 0.6);
  color: #fff;
  font-size: 14px;
  letter-spacing: 1px;
}

.pcd-overlay.error {
  background: rgba(255, 77, 79, 0.2);
  color: #ff6b6b;
}

.pcd-overlay.loading {
  color: #67d5fd;
}

/* 地图编辑样式 */
.map-edit-grid-card {
  background: linear-gradient(135deg, #0a2a3a 80%, #0a0f1c 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 0;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
  overflow: hidden;
}

.map-edit-grid-header {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(38, 131, 182, 0.2);
  background: rgba(12, 60, 86, 0.2);
}

.map-edit-toolbar-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  white-space: nowrap;
}

.map-edit-select {
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.8);
  color: #67d5fd;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
  min-width: 140px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.map-edit-select:hover {
  background: #0c4666;
  border-color: rgba(38, 131, 182, 1);
}

.map-edit-select:focus {
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.map-edit-select:disabled {
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%);
  border-color: rgba(103, 213, 253, 0.3);
  color: rgba(180, 205, 220, 0.62);
  cursor: not-allowed;
  box-shadow:
    inset 0 0 0 1px rgba(103, 213, 253, 0.08);
  filter: saturate(0.72) grayscale(0.22);
  opacity: 1;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  color: #67d5fd;
  padding: 6px 16px;
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
  color: #0a1929;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.4);
  font-weight: 600;
}

.map-edit-grid-main {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gridmap-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(38, 131, 182, 0.3);
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  background: #fff;
  cursor: grab;
  user-select: none;
  transform-origin: 0 0;
  touch-action: none;
  image-rendering: pixelated;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.grid-canvas:active {
  cursor: grabbing;
}

.map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 25, 41, 0.8);
  color: #fff;
  font-size: 16px;
  letter-spacing: 1px;
  z-index: 10;
}

.eraser-range-preview {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1.5px dashed rgba(255, 104, 104, 0.95);
  background: rgba(255, 104, 104, 0.18);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.22) inset;
  pointer-events: none;
  z-index: 9;
}

.eraser-range-preview.tool-pen {
  border: 2px solid rgb(34, 197, 126);
  background: rgb(34, 197, 126);
  box-shadow: 0 0 0 1px rgba(147, 247, 206, 0.2) inset;
  opacity: 0.8;
}

.eraser-range-preview.tool-eraser {
  border: 2px solid rgb(239, 68, 68);
  background: rgb(239, 68, 68);
  box-shadow: 0 0 0 1px rgba(255, 176, 176, 0.2) inset;
  opacity: 0.8;
}

.eraser-range-preview-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 125, 125, 0.65);
  background: rgba(10, 25, 41, 0.88);
  color: #ffc2c2;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

.eraser-range-preview.tool-pen .eraser-range-preview-label {
  border-color: rgba(88, 224, 166, 0.8);
  color: #bfffe4;
}

.eraser-range-preview.tool-eraser .eraser-range-preview-label {
  border-color: rgba(255, 120, 120, 0.75);
  color: #ffd3d3;
}

.map-overlay.error {
  background: rgba(255, 77, 79, 0.2);
  color: #ff6b6b;
}

.map-overlay.loading {
  color: #67d5fd;
}

.map-overlay.empty {
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #5f7890;
  font-size: 14px;
  letter-spacing: 0.5px;
}

/* 右侧编辑面板 */
.edit-panel-right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 66px;
  background: linear-gradient(180deg, #244e63 0%, #1c4156 100%);
  border-left: 1px solid rgba(73, 146, 176, 0.5);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(4px);
  overflow: hidden;
  z-index: 100;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.panel-tools {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 8px 20px;
  gap: 10px;
  align-items: center;
  user-select: none;
  -webkit-user-select: none;
}

.tool-button {
  width: 48px;
  height: 48px;
  background: rgba(26, 80, 104, 0.8);
  border: 1px solid rgba(93, 160, 188, 0.28);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
}

.tool-button:hover:not(.disabled) {
  background: rgba(66, 149, 186, 0.7);
  border-color: rgba(126, 200, 230, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(10, 30, 45, 0.3);
}

.tool-button.active {
  background: #7fd3fb;
  border-color: #7fd3fb;
  box-shadow: 0 8px 16px rgba(73, 171, 212, 0.35);
}

.tool-button.upload-ready {
  background: #01314f;
  box-shadow: 0 0 12px #59c0fc33;
}

.tool-button.upload-ready:hover {
  background: #01314f;
}

.tool-button.upload-ready .tool-icon-img {
  filter: brightness(0) invert(1) drop-shadow(0 0 8px #67d5fd) drop-shadow(0 0 2px #67d5fd);
}

.tool-button.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.tool-icon-img {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%) invert(88%) sepia(9%) saturate(748%) hue-rotate(164deg);
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

.tool-button.active .tool-icon-img {
  filter: brightness(0) saturate(100%) invert(15%) sepia(16%) saturate(1035%) hue-rotate(166deg);
}

.tool-slider {
  margin-top: auto;
  width: 100%;
  padding-top: 14px;
  padding-bottom: 6px;
  border-top: 1px solid rgba(73, 146, 176, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.slider-label {
  color: #73d2f6;
  font-size: 12px;
  letter-spacing: 1px;
}

.size-slider-vertical {
  writing-mode: vertical-lr;
  direction: rtl;
  -webkit-appearance: none;
  appearance: none;
  width: 6px;
  height: 140px;
  background: rgba(40, 120, 150, 0.6);
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}

.size-slider-vertical::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #8bdcff;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(130, 220, 255, 0.55);
  cursor: pointer;
}

.size-slider-vertical::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #8bdcff;
  border-radius: 50%;
  border: none;
  box-shadow: 0 0 6px rgba(130, 220, 255, 0.55);
  cursor: pointer;
}

.slider-value {
  color: #73d2f6;
  font-size: 13px;
  font-weight: 600;
}

/* 录包对话框样式 */
.recording-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.recording-dialog-card {
  background: linear-gradient(135deg, #0a2a3a 0%, #0f1f2e 100%);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  min-width: 400px;
  max-width: 500px;
}

.recording-dialog-header {
  position: relative;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(103, 213, 253, 0.2);
  font-size: 16px;
  font-weight: 600;
  color: #67d5fd;
}

.dialog-close-btn {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #67d5fd;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  padding: 0;
}

.dialog-close-btn:hover {
  background: rgba(103, 213, 253, 0.1);
  color: #fff;
}

.dialog-close-btn:active {
  background: rgba(103, 213, 253, 0.2);
}

.recording-dialog-body {
  padding: 24px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #67d5fd;
  font-size: 14px;
  font-weight: 500;
}

.recording-input {
  width: 100%;
  height: 40px;
  background: #0c3c56;
  border: 1px solid rgba(38, 131, 182, 0.8);
  border-radius: 4px;
  padding: 0 12px;
  color: #67d5fd;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

select.recording-input {
  cursor: pointer;
}

select.recording-input option {
  background: #0c3c56;
  color: #67d5fd;
}

.recording-input:focus {
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.recording-input:disabled {
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%);
  border-color: rgba(103, 213, 253, 0.3);
  color: rgba(180, 205, 220, 0.62);
  cursor: not-allowed;
  box-shadow:
    inset 0 0 0 1px rgba(103, 213, 253, 0.08);
  filter: saturate(0.72) grayscale(0.22);
  opacity: 1;
}

.recording-dialog-actions {
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
  border-top: 1px solid rgba(103, 213, 253, 0.1);
}


/* 循迹避障模式选项样式 */
.obs-mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.obs-mode-option {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: rgba(12, 60, 86, 0.5);
  border: 2px solid rgba(38, 131, 182, 0.4);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.obs-mode-option:hover {
  background: rgba(12, 60, 86, 0.8);
  border-color: rgba(103, 213, 253, 0.6);
  transform: translateX(4px);
}

.obs-mode-option.active {
  background: rgba(103, 213, 253, 0.15);
  border-color: #67d5fd;
  box-shadow: 0 0 12px rgba(103, 213, 253, 0.3);
}

.obs-mode-option input[type="radio"] {
  margin-right: 12px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #67d5fd;
}

.obs-mode-option span {
  color: #b8dcf5;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.obs-mode-option.active span {
  color: #67d5fd;
}


/* 文件管理样式 */
.file-manage-content {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 260px);
  overflow: hidden;
}

.file-manage-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
}

.file-manage-label {
  color: #b8dcf5;
  font-size: 14px;
}

.file-manage-package-group {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.file-card-board {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(103, 213, 253, 0.5) transparent;
}

.file-card-board::-webkit-scrollbar {
  width: 4px;
}

.file-card-board::-webkit-scrollbar-track {
  background: transparent;
}

.file-card-board::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(103, 213, 253, 0.42), rgba(103, 213, 253, 0.68));
  border-radius: 999px;
}

.file-card-board::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(103, 213, 253, 0.56), rgba(103, 213, 253, 0.82));
}

.file-card-empty {
  height: 100%;
  min-height: 220px;
  border: 1px dashed rgba(103, 213, 253, 0.25);
  border-radius: 10px;
  background: rgba(10, 42, 58, 0.32);
  color: rgba(184, 220, 245, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-group-card {
  border: 1px solid rgba(103, 213, 253, 0.20);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(10, 42, 58, 0.60), rgba(8, 34, 52, 0.52));
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.14);
  overflow: visible;
}

.file-group-card-other {
  border-color: rgba(103, 213, 253, 0.16);
  background: linear-gradient(180deg, rgba(10, 42, 58, 0.42), rgba(12, 60, 86, 0.22));
}

.file-group-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px 9px;
  border-bottom: 1px solid rgba(103, 213, 253, 0.16);
}

.file-group-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #67d5fd;
  font-weight: 600;
}

.file-group-title-text {
  font-size: 13px;
  line-height: 1.25;
}

.file-group-route-name {
  color: #9fe4ff;
  font-size: 12px;
  font-weight: 600;
}

.file-group-delete-btn {
  margin-left: 8px;
  padding: 0 8px;
  height: 28px;
  font-size: 12px;
}

.file-group-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #67d5fd;
  box-shadow: 0 0 8px rgba(103, 213, 253, 0.8);
}

.file-group-card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(184, 220, 245, 0.78);
  font-size: 12px;
  white-space: nowrap;
}

.file-group-card-body {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  overflow: visible;
}

.file-group-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px 14px;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(5, 26, 48, 0.42);
  border: 1px solid rgba(103, 213, 253, 0.12);
  min-height: 44px;
}

.file-group-item-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-group-item-type {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  color: #67d5fd;
  background: rgba(103, 213, 253, 0.14);
  border: 1px solid rgba(103, 213, 253, 0.3);
  font-size: 12px;
}

.file-group-item-type.is-route {
  color: #75e0ff;
  background: rgba(103, 213, 253, 0.18);
  border-color: rgba(103, 213, 253, 0.34);
}

.file-group-item-type.is-route-file {
  color: #83f3d2;
  background: rgba(67, 203, 165, 0.16);
  border-color: rgba(67, 203, 165, 0.36);
}

.file-group-item-type.is-task-group {
  color: #ffd18b;
  background: rgba(255, 172, 70, 0.16);
  border-color: rgba(255, 172, 70, 0.34);
}

.file-group-item-type.is-publish-group {
  color: #f4b6ff;
  background: rgba(193, 108, 255, 0.16);
  border-color: rgba(193, 108, 255, 0.34);
}

.file-group-item-type.is-other {
  color: #b8cfe6;
  background: rgba(126, 160, 196, 0.16);
  border-color: rgba(126, 160, 196, 0.32);
}

.file-group-item-name {
  color: #d9ecff;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.file-group-item-side {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.file-group-item-time {
  color: rgba(184, 220, 245, 0.78);
  font-size: 12px;
}

@media (max-width: 1500px) {
  .file-group-item {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .file-group-item-side {
    width: 100%;
    justify-content: flex-end;
  }
}

.file-table {
  flex: 1;
  background: rgba(10, 42, 58, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-table-header {
  flex-shrink: 0;
}

.file-table-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(103, 213, 253, 0.5) transparent;
}

/* 滚动条样式 */
.file-table-body::-webkit-scrollbar {
  width: 4px;
}

.file-table-body::-webkit-scrollbar-track {
  background: transparent;
}

.file-table-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(103, 213, 253, 0.42), rgba(103, 213, 253, 0.68));
  border-radius: 999px;
}

.file-table-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(103, 213, 253, 0.56), rgba(103, 213, 253, 0.82));
}

.file-table-row {
  border-bottom: 1px solid rgba(103, 213, 253, 0.1);
  color: #b8dcf5;
  transition: background 0.2s;
}

.file-table-row:hover {
  background: rgba(12, 60, 86, 0.3);
}

.file-table-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-table-check {
  flex: 0 0 60px;
  text-align: center;
}

.file-table-name {
  flex: 2;
}

.file-table-action {
  flex: 0 0 100px;
  display: flex;
  justify-content: center;
}

.file-delete-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #fd6767;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.file-delete-btn:hover {
  background: rgba(253, 103, 103, 0.1);
}

.file-delete-btn img {
  width: 16px;
  height: 16px;
}


</style>
