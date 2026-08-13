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
                  <button 
                    class="map-btn"
                    :class="[isSlamOnline ? 'map-btn-danger' : 'map-btn-primary', { loading: slamOnlineBtnLoading }]"
                    :disabled="slamOnlineBtnLoading"
                    v-permission-click-dialog="'nav-lbjt-slamonline'"
                    @click="handleSlamOnlineToggle"
                  >
                    {{ slamOnlineBtnLoading ? (isSlamOnline ? '关闭中...' : '开启中...') : (isSlamOnline ? '关闭建图' : '实时建图') }}
                  </button>
                  <button
                    v-if="isSlamOnline"
                    class="map-btn map-btn-secondary"
                    @click="slamOnlineMapDialogVisible = true"
                    style="margin-left: 8px;"
                  >
                    查看实时地图
                  </button>
                </div>
              </div>

              <!-- 创建二维地图 -->
              <div class="map-section">
                <div class="map-section-title">创建二维地图</div>
                <div class="map-section-buttons">
                  <button class="map-btn map-btn-primary" :disabled="isRecording || !canGenerateMap" v-permission-click-dialog="'nav-lbjt-slam'" @click="handleGenerateMap">生成地图</button>
                  <button class="map-btn map-btn-primary" :disabled="isRecording || mappingStopLoading" v-permission-click-dialog="'nav-lbjt-changepcd'" @click="handleGenerateGridMap">生成栅格地图</button>
                  <button class="map-btn" :class="hasRobotRtk ? 'map-btn-primary' : 'map-btn-disabled-visual'" :disabled="isRecording || !hasRobotRtk" v-permission-click-dialog="'nav-lbjt-msfrecord'" @click="handleCreateFusionMap">新建融合地图</button>
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
                    :class="!hasRobotRtk ? 'map-btn-disabled-visual' : (insEnabled ? 'map-btn-danger' : 'map-btn-primary')"
                    :disabled="navigationEnabled || msfEnabled || !hasRobotRtk"
                    v-permission-click-dialog="'nav-navmanage-startnav'"
                    @click="handleStartINS"
                  >
                    {{ insEnabled ? '关闭INS' : '开始INS' }}
                  </button>
                  <button class="map-btn" :class="hasRobotRtk ? 'map-btn-primary' : 'map-btn-disabled-visual'" :disabled="navigationEnabled || msfEnabled || !hasRobotRtk" v-permission-click-dialog="'nav-navmanage-startnav'" @click="handleInitINS">INS初始化</button>
                  <button 
                    class="map-btn" 
                    :class="!hasRobotRtk ? 'map-btn-disabled-visual' : (msfEnabled ? 'map-btn-danger' : 'map-btn-primary')"
                    :disabled="navigationEnabled || insEnabled || !hasRobotRtk"
                    v-permission-click-dialog="'nav-navmanage-startnav'"
                    @click="handleStartMSF"
                  >
                    {{ msfEnabled ? '关闭MSF' : '开始MSF' }}
                  </button>
                  <button class="map-btn" :class="isTrackTaskRunning ? 'map-btn-primary' : 'map-btn-secondary'" :disabled="!isTrackTaskRunning" v-permission-click-dialog="'nav-navmanage-pausenav'" @click="handleCircleMode">循迹避障模式</button>
                  <button class="map-btn map-btn-secondary" v-permission-click-dialog="'nav-navmanage-startnav'" @click="handleCloseGPS">{{ gpsEnabled ? '关闭GPS' : '开启GPS' }}</button>
                  <button class="map-btn map-btn-secondary" :disabled="!navigationEnabled" v-permission-click-dialog="'nav-navmanage-startnav'" @click="handleSetOrigin">原点设置</button>
                  <button class="map-btn map-btn-secondary" :disabled="!selectedNavMap" v-permission-click-dialog="'nav-navmanage-startnav'" @click="openReloModal">重定位</button>
                </div>
              </div>

              <!-- 主体内容区 -->
              <div class="nav-main-content">
                <!-- 左侧信息面板 -->
                <div class="nav-info-panel">
                  <!-- 地图选择 -->
                  <div class="nav-info-item">
                    <label class="nav-label">地图：</label>
                    <div class="custom-select-container" style="width: 100%;">
                      <div 
                        class="nav-select custom-select-trigger" 
                        :class="{ 'is-disabled': isMapSelectionLocked }"
                        @click="!isMapSelectionLocked && (activeDropdown = activeDropdown === 'navMap' ? null : 'navMap')"
                      >
                        <span class="custom-select-value">{{ selectedNavMap || (navMapList.length === 0 ? '暂无地图' : '请选择地图') }}</span>
                        <span class="nav-select-arrow" :style="{ transform: activeDropdown === 'navMap' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                          <svg width="10" height="10" viewBox="0 0 12 12">
                            <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                          </svg>
                        </span>
                      </div>
                      <div v-show="activeDropdown === 'navMap'" class="custom-select-dropdown">
                        <div v-if="navMapList.length === 0" class="custom-select-option is-empty">暂无地图</div>
                        <div 
                          v-for="map in navMapList" 
                          :key="map" 
                          class="custom-select-option" 
                          :class="{ 'is-selected': selectedNavMap === map }"
                          @click="selectedNavMap = map; activeDropdown = null"
                        >
                          {{ map }}
                        </div>
                      </div>
                    </div>
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
                      <!-- 1. 点云图视图 -->
                      <div class="pointcloud-view" v-show="navViewType === 'pointcloud'">
                        <ThreePointCloudPreview
                          ref="navPointCloudPreviewRef"
                          :points="navPointCloudData"
                          :loading="navPointCloudLoading"
                          :loading-text="navPointCloudLoadingText"
                          :error="navPointCloudError"
                          :auto-fit-on-data-change="false"
                          :normalization-params="navPointCloudNormalizationParams"
                          :navigation-origin="navPointCloudNavigationOrigin"
                          :robot-pose="robotStore.pose"
                          :robot-mesh="arrowMesh"
                          :robot-type="selectedVehicleType"
                          :density-mode="selectedNavPcdDensity"
                          :color-mode="selectedNavPcdColorMode"
                          @switch-density="switchNavPcdDensity"
                          @color-mode-change="selectedNavPcdColorMode = $event"
                        />
                      </div>

                      <!-- 2. 2D 栅格图视图 -->
                      <div class="pointcloud-view grid-view" v-show="navViewType === 'grid'">
                        <div class="grid-map-container" ref="navGridMapContainerRef">
                          <canvas 
                            ref="navGridMapCanvasRef" 
                            class="grid-map-canvas"
                            @wheel="handleNavGridMapWheel"
                            @mousedown="handleNavGridMapMouseDown"
                            @mousemove="handleNavGridMapMouseMove"
                            @mouseup="handleNavGridMapMouseUp"
                            @mouseleave="handleNavGridMapMouseUp"
                            style="cursor: grab;"
                          ></canvas>
                          <div v-if="navGridMapLoading" class="grid-map-overlay">栅格地图加载中...</div>
                          <div v-else-if="navGridMapError" class="grid-map-overlay error">{{ navGridMapError }}</div>
                          
                          <!-- 实时点云开关按钮 -->
                          <button 
                            v-if="!navGridMapLoading && !navGridMapError" 
                            class="grid-map-realtime-btn"
                            :class="{ active: showRealtimeScan }"
                            @click.stop="showRealtimeScan = !showRealtimeScan"
                            title="实时点云开关"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M12 3L4 7.5v9L12 21l8-4.5v-9L12 3z" stroke-dasharray="2 2"/>
                              <path d="M12 3v18" stroke-dasharray="2 2"/>
                              <path d="M12 12L4 7.5" stroke-dasharray="2 2"/>
                              <path d="M12 12l8-4.5" stroke-dasharray="2 2"/>
                              <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="4" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="20" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="4" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="20" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="12" cy="21" r="1.5" fill="currentColor" stroke="none"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- 3. 高德标准/卫星地图视图 -->
                      <div class="pointcloud-view map-view" v-show="navViewType === 'map'">
                        <div ref="navMapContainer" style="width: 100%; height: 100%;"></div>
                        
                        <!-- 地图图层切换器 -->
                        <div class="map-layer-switcher">
                          <button class="layer-switch-trigger" @click.stop="toggleNavLayerMenu">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>图层</span>
                          </button>
                          <transition name="layer-menu-fade">
                            <div v-show="navShowLayerMenu" class="layer-menu-dropdown">
                              <div class="layer-option" :class="{ active: navMapType === 'standard' }" @click.stop="setNavMapType('standard')">
                                <span class="option-icon standard-icon"></span>
                                <span>标准地图</span>
                              </div>
                              <div class="layer-option" :class="{ active: navMapType === 'satellite' }" @click.stop="setNavMapType('satellite')">
                                <span class="option-icon satellite-icon"></span>
                                <span>卫星地图</span>
                              </div>

                              <div class="layer-divider"></div>
                              <div class="layer-option" :class="{ active: navShowTraffic }" @click.stop="toggleNavTraffic">
                                <span class="option-checkbox" :class="{ checked: navShowTraffic }"></span>
                                <span>实时路况</span>
                              </div>
                            </div>
                          </transition>
                        </div>
                      </div>

                      <!-- 视图模式切换组 (靠左侧) -->
                      <div class="map-view-switcher-group">
                        <button 
                          class="view-switch-btn" 
                          :class="{ active: navViewType === 'pointcloud' }" 
                          @click.stop="navViewType = 'pointcloud'"
                          title="点云图"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 3L4 7.5v9L12 21l8-4.5v-9L12 3z" stroke-dasharray="2 2"/>
                            <path d="M12 3v18" stroke-dasharray="2 2"/>
                            <path d="M12 12L4 7.5" stroke-dasharray="2 2"/>
                            <path d="M12 12l8-4.5" stroke-dasharray="2 2"/>
                            <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"/>
                            <circle cx="4" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
                            <circle cx="20" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
                            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                            <circle cx="4" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
                            <circle cx="20" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
                            <circle cx="12" cy="21" r="1.5" fill="currentColor" stroke="none"/>
                          </svg>
                        </button>
                        <button 
                          class="view-switch-btn" 
                          :class="{ active: navViewType === 'grid' }" 
                          @click.stop="navViewType = 'grid'"
                          title="栅格图"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="1.5"/>
                            <path d="M9 3v18"/>
                            <path d="M15 3v18"/>
                            <path d="M3 9h18"/>
                            <path d="M3 15h18"/>
                            <rect x="3.5" y="3.5" width="5" height="5" fill="currentColor" stroke="none"/>
                            <rect x="15.5" y="9.5" width="5" height="5" fill="currentColor" stroke="none"/>
                            <rect x="9.5" y="15.5" width="5" height="5" fill="currentColor" stroke="none"/>
                          </svg>
                        </button>
                        <button 
                          v-if="hasRobotRtk"
                          class="view-switch-btn" 
                          :class="{ active: navViewType === 'map' }" 
                          @click.stop="navViewType = 'map'"
                          title="卫星图"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
                            <rect x="2" y="10" width="4" height="4" rx="0.5"/>
                            <rect x="18" y="10" width="4" height="4" rx="0.5"/>
                            <line x1="6" y1="12" x2="9" y2="12"/>
                            <line x1="15" y1="12" x2="18" y2="12"/>
                            <path d="M12 15v3"/>
                            <path d="M9 18h6"/>
                          </svg>
                        </button>
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
                    <div class="map-edit-select-wrapper custom-select-container" style="position: relative; display: inline-block;">
                      <div 
                        class="map-edit-select custom-select-trigger" 
                        @click="activeDropdown = activeDropdown === 'editMap' ? null : 'editMap'"
                      >
                        <span class="custom-select-value">{{ selectedEditMap || (editMapList.length === 0 ? '暂无地图' : '请选择地图') }}</span>
                        <span class="nav-select-arrow" :style="{ transform: activeDropdown === 'editMap' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                          <svg width="10" height="10" viewBox="0 0 12 12">
                            <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                          </svg>
                        </span>
                      </div>
                      <div v-show="activeDropdown === 'editMap'" class="custom-select-dropdown">
                        <div v-if="editMapList.length === 0" class="custom-select-option is-empty">暂无地图</div>
                        <div 
                          v-for="map in editMapList" 
                          :key="map" 
                          class="custom-select-option" 
                          :class="{ 'is-selected': selectedEditMap === map }"
                          @click="selectedEditMap = map; activeDropdown = null"
                        >
                          {{ map }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="toolbar-right">
                    <button class="toolbar-btn" :class="{ active: isFeatureAreaPanelOpen }" v-permission-click-dialog="'nav-mapedit-edit'" @click="toggleFeatureAreaPanel" title="功能区">
                      功能区
                    </button>
                    <button class="toolbar-btn" :class="{ active: isEditMode }" v-permission-click-dialog="'nav-mapedit-edit'" @click="toggleEditMode" title="栅格图编辑">
                      编辑
                    </button>
                  </div>
                </div>
              </div>
              <div class="map-edit-grid-main">
                <div ref="gridmapContainerEl" class="gridmap-container">
                  <!-- 区域图例 Legend Overlay -->
                  <div v-show="isFeatureAreaPanelOpen" class="feature-area-legend">
                    <div class="legend-title">区域图例</div>
                    <div class="legend-list">
                      <div v-for="type in featureAreaTypes" :key="type.value" class="legend-item">
                        <svg class="legend-item-icon" width="24" height="12" viewBox="0 0 24 12">
                          <defs>
                            <pattern :id="`pattern-legend-${type.value}`" width="5" height="5" patternUnits="userSpaceOnUse">
                              <path v-if="type.value === 'forbidden'" d="M0,5 L5,0" stroke="#ef4444" stroke-width="1" fill="none" />
                              <path v-else-if="type.value === 'stairs'" d="M0,2.5 H5" stroke="#f59e0b" stroke-width="1" fill="none" />
                              <path v-else-if="type.value === 'slope'" d="M2.5,0 V5" stroke="#8b5cf6" stroke-width="1" fill="none" />
                              <path v-else-if="type.value === 'narrow'" d="M0,2.5 H5 M2.5,0 V5" stroke="#06b6d4" stroke-width="0.9" fill="none" />
                              <path v-else-if="type.value === 'grass'" d="M0,0 L5,5 M0,5 L5,0" stroke="#22c55e" stroke-width="0.9" fill="none" />
                            </pattern>
                          </defs>
                          <rect width="24" height="12" rx="2" ry="2" :class="[`feature-area-${type.value}`]" fill-opacity="0.15" stroke="none" />
                          <rect width="24" height="12" rx="2" ry="2" :class="['feature-area-shape', `feature-area-${type.value}`]" :style="{ fill: `url(#pattern-legend-${type.value})` }" stroke-width="1.5" />
                        </svg>
                        <span class="legend-item-label">{{ type.label }}</span>
                      </div>
                    </div>
                  </div>
                  <canvas ref="gridMapCanvas" class="grid-canvas"></canvas>
                  <svg
                    v-if="shouldShowFeatureAreaOverlay"
                    class="feature-area-overlay"
                    :style="featureAreaOverlayStyle"
                    :viewBox="`0 0 ${featureAreaCanvasSize.width} ${featureAreaCanvasSize.height}`"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <!-- 禁行区 Pattern: red diagonal lines, 8×8 tile -->
                      <pattern id="pattern-forbidden" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M0,8 L8,0" stroke="#ef4444" stroke-width="1.5" fill="none" />
                      </pattern>
                      
                      <!-- 楼梯 Pattern: orange evenly-spaced horizontal lines, 8×8 tile -->
                      <pattern id="pattern-stairs" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M0,4 H8" stroke="#f59e0b" stroke-width="1.5" fill="none" />
                      </pattern>
                      
                      <!-- 斜坡 Pattern: purple evenly-spaced vertical lines, 8×8 tile -->
                      <pattern id="pattern-slope" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M4,0 V8" stroke="#8b5cf6" stroke-width="1.5" fill="none" />
                      </pattern>
                      
                      <!-- 窄通道 Pattern: cyan regular grid, 8×8 tile -->
                      <pattern id="pattern-narrow" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M0,4 H8 M4,0 V8" stroke="#06b6d4" stroke-width="1.2" fill="none" />
                      </pattern>
                      
                      <!-- 草地 Pattern: green crosshatch (X), 8×8 tile -->
                      <pattern id="pattern-grass" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M0,0 L8,8 M0,8 L8,0" stroke="#22c55e" stroke-width="1.2" fill="none" />
                      </pattern>
                    </defs>
                    <template v-for="area in visibleFeatureAreas" :key="area.id">
                      <polygon
                        v-if="area.geometry !== 'line' && area.points.length >= 3"
                        :points="pointsToSvg(area.points)"
                        :class="['feature-area-shape', `feature-area-${area.type}`]"
                        :style="{ fill: `url(#pattern-${area.type})` }"
                      />
                      <polyline
                        v-else-if="area.points.length >= 2"
                        :points="pointsToSvg(area.points)"
                        :class="['feature-area-line', `feature-area-${area.type}`]"
                      />

                      <!-- Name label in the center/centroid of the area -->
                      <text
                        v-if="area.name && area.points.length > 0"
                        :x="getAreaCenter(area.points).x"
                        :y="getAreaCenter(area.points).y"
                        :class="['feature-area-label', `feature-area-${area.type}`]"
                        text-anchor="middle"
                        dominant-baseline="central"
                      >
                        {{ area.name }}
                      </text>
                    </template>
                    <g v-if="featureAreaDraftPoints.length > 0">
                      <polygon
                        v-if="selectedFeatureAreaGeometry === 'area' && featureAreaDraftPoints.length >= 3"
                        :points="pointsToSvg(featureAreaDraftPoints)"
                        :class="['feature-area-shape', 'feature-area-draft', `feature-area-${selectedFeatureAreaType}`]"
                        :style="{ fill: `url(#pattern-${selectedFeatureAreaType})` }"
                      />
                      <polyline
                        v-else-if="featureAreaDraftPoints.length >= 2"
                        :points="pointsToSvg(featureAreaDraftPoints)"
                        :class="['feature-area-line', 'feature-area-draft', `feature-area-${selectedFeatureAreaType}`]"
                      />
                      <circle
                        v-for="(point, index) in featureAreaDraftPoints"
                        :key="`feature-draft-point-${index}`"
                        :cx="point.x"
                        :cy="point.y"
                        r="1.5"
                        :class="['feature-area-marker', 'feature-area-draft-marker', `feature-area-${selectedFeatureAreaType}`]"
                      />
                    </g>
                  </svg>
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
                  <div v-show="isFeatureAreaPanelOpen" class="feature-area-panel-right">
                    <div class="feature-area-panel-content">
                      <div class="feature-area-section">
                        <div class="feature-area-mode-switch" role="group" aria-label="功能区绘制类型">
                          <button
                            type="button"
                            :class="{ active: selectedFeatureAreaGeometry === 'area' }"
                            @click="setFeatureAreaGeometry('area')"
                          >
                            区域
                          </button>
                          <button
                            type="button"
                            :class="{ active: selectedFeatureAreaGeometry === 'line' }"
                            @click="setFeatureAreaGeometry('line')"
                          >
                            线段
                          </button>
                        </div>
                        <button class="feature-area-action-btn" :class="{ active: isFeatureAreaDrawing }" @click="startFeatureAreaDrawing">
                          添加
                        </button>
                        <button class="feature-area-action-btn" :disabled="!canUndoFeatureAreaStep" @click="undoFeatureAreaStep">
                          撤销
                        </button>
                        <div class="feature-area-type-list">
                          <label
                            v-for="type in featureAreaTypes"
                            :key="type.value"
                            class="feature-area-type-option"
                            :class="{ active: selectedFeatureAreaType === type.value }"
                          >
                            <input
                              v-model="selectedFeatureAreaType"
                              type="radio"
                              name="feature-area-type"
                              :value="type.value"
                            />
                             <!-- Preview icon showing the specific pattern style of the zone type -->
                             <svg class="feature-area-type-icon" width="20" height="12" viewBox="0 0 20 12">
                               <defs>
                                 <pattern :id="`pattern-sidebar-${type.value}`" width="5" height="5" patternUnits="userSpaceOnUse">
                                   <path v-if="type.value === 'forbidden'" d="M0,5 L5,0" stroke="#ef4444" stroke-width="1" fill="none" />
                                   <path v-else-if="type.value === 'stairs'" d="M0,2.5 H5" stroke="#f59e0b" stroke-width="1" fill="none" />
                                   <path v-else-if="type.value === 'slope'" d="M2.5,0 V5" stroke="#8b5cf6" stroke-width="1" fill="none" />
                                   <path v-else-if="type.value === 'narrow'" d="M0,2.5 H5 M2.5,0 V5" stroke="#06b6d4" stroke-width="0.9" fill="none" />
                                   <path v-else-if="type.value === 'grass'" d="M0,0 L5,5 M0,5 L5,0" stroke="#22c55e" stroke-width="0.9" fill="none" />
                                 </pattern>
                               </defs>
                               <rect width="20" height="12" rx="2" ry="2" :class="[`feature-area-${type.value}`]" fill-opacity="0.15" stroke="none" />
                               <rect width="20" height="12" rx="2" ry="2" :class="['feature-area-shape', `feature-area-${type.value}`]" :style="{ fill: `url(#pattern-sidebar-${type.value})` }" stroke-width="1.5" />
                             </svg>
                            <span>{{ type.label }}</span>
                          </label>
                        </div>
                      </div>
                      <div class="feature-area-section feature-area-section-middle">
                        <select v-model="selectedFeatureAreaId" class="feature-area-select">
                          <option value="">全部</option>
                          <option v-for="option in featureAreaSelectOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                        <button class="feature-area-delete-btn" :disabled="!canDeleteSelectedFeatureArea" @click="deleteSelectedFeatureArea">
                          删除
                        </button>
                        <button class="feature-area-action-btn" :class="{ active: featureAreaPreviewVisible }" @click="toggleFeatureAreaPreview">
                          预览
                        </button>
                      </div>
                      <div class="feature-area-section feature-area-section-submit">
                        <button class="feature-area-submit-btn" :disabled="!canSubmitFeatureArea" @click="submitFeatureArea">
                          提交
                        </button>
                      </div>
                    </div>
                  </div>
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
                  <div class="track-select-wrapper custom-select-container">
                    <div 
                      class="track-select custom-select-trigger" 
                      :class="{ 'is-disabled': isMapSelectionLocked }"
                      @click="!isMapSelectionLocked && (activeDropdown = activeDropdown === 'trackRecordMap' ? null : 'trackRecordMap')"
                    >
                      <span class="custom-select-value">{{ trackRecordMap || (trackMapList.length === 0 ? '暂无地图' : '请选择地图') }}</span>
                      <span class="track-select-arrow" :style="{ transform: activeDropdown === 'trackRecordMap' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                        <svg width="10" height="10" viewBox="0 0 12 12">
                          <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                        </svg>
                      </span>
                    </div>
                    <div v-show="activeDropdown === 'trackRecordMap'" class="custom-select-dropdown">
                      <div v-if="trackMapList.length === 0" class="custom-select-option is-empty">暂无地图</div>
                      <div 
                        v-for="map in trackMapList" 
                        :key="map" 
                        class="custom-select-option" 
                        :class="{ 'is-selected': trackRecordMap === map }"
                        @click="trackRecordMap = map; activeDropdown = null"
                      >
                        {{ map }}
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  class="map-btn track-btn" 
                  :class="[isTrackRecording ? 'map-btn-danger' : (!navigationEnabled || isTrackRunning ? 'map-btn-disabled-visual' : 'map-btn-secondary')]"
                  :disabled="isTrackRunning || !navigationEnabled"
                  v-permission-click-dialog="'nav-trackrecord-create'"
                  @click="handleTrackRecord"
                >
                  {{ isTrackRecording ? '停止录制' : '录制路线' }}
                </button>
                <div class="track-toolbar-group">
                  <span class="track-label">路线:</span>
                  <div class="track-select-wrapper custom-select-container">
                    <div 
                      class="track-select custom-select-trigger" 
                      @click="activeDropdown = activeDropdown === 'trackRecordLine' ? null : 'trackRecordLine'"
                    >
                      <span class="custom-select-value">{{ trackRecordLine || (trackLineList.length === 0 ? '暂无路线' : '请选择路线') }}</span>
                      <span class="track-select-arrow" :style="{ transform: activeDropdown === 'trackRecordLine' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                        <svg width="10" height="10" viewBox="0 0 12 12">
                          <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                        </svg>
                      </span>
                    </div>
                    <div v-show="activeDropdown === 'trackRecordLine'" class="custom-select-dropdown">
                      <div v-if="trackLineList.length === 0" class="custom-select-option is-empty">暂无路线</div>
                      <div 
                        v-for="line in trackLineList" 
                        :key="line" 
                        class="custom-select-option" 
                        :class="{ 'is-selected': trackRecordLine === line }"
                        @click="trackRecordLine = line; activeDropdown = null"
                      >
                        {{ line }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="track-toolbar-group">
                  <span class="track-label">任务组:</span>
                  <div class="track-select-wrapper custom-select-container">
                    <div 
                      class="track-select custom-select-trigger" 
                      :class="{ 'is-disabled': !trackRecordLine }"
                      @click="trackRecordLine && (activeDropdown = activeDropdown === 'trackRecordTask' ? null : 'trackRecordTask')"
                    >
                      <span class="custom-select-value">{{ trackRecordTask || (!trackRecordLine || trackTaskList.length === 0 ? '暂无任务组' : '请选择任务组') }}</span>
                      <span class="track-select-arrow" :style="{ transform: activeDropdown === 'trackRecordTask' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                        <svg width="10" height="10" viewBox="0 0 12 12">
                          <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                        </svg>
                      </span>
                    </div>
                    <div v-show="activeDropdown === 'trackRecordTask'" class="custom-select-dropdown">
                      <div v-if="!trackRecordLine || trackTaskList.length === 0" class="custom-select-option is-empty">暂无任务组</div>
                      <div 
                        v-for="task in trackTaskList" 
                        :key="task" 
                        class="custom-select-option" 
                        :class="{ 'is-selected': trackRecordTask === task }"
                        @click="trackRecordTask = task; activeDropdown = null"
                      >
                        {{ task }}
                      </div>
                    </div>
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
                        ref="navPointCloudPreviewRef"
                        :points="navPointCloudData"
                        :loading="navPointCloudLoading"
                        :loading-text="navPointCloudLoadingText"
                        :error="navPointCloudError"
                        :auto-fit-on-data-change="false"
                        :normalization-params="navPointCloudNormalizationParams"
                        :navigation-origin="navPointCloudNavigationOrigin"
                        :robot-pose="robotStore.pose"
                        :robot-mesh="arrowMesh"
                        :robot-type="selectedVehicleType"
                        :density-mode="selectedNavPcdDensity"
                        :color-mode="selectedNavPcdColorMode"
                        @switch-density="switchNavPcdDensity"
                        @color-mode-change="selectedNavPcdColorMode = $event"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 路线编辑 -->
          <template v-else-if="currentTab === 'track_edit'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="nav-top-title">路线编辑</span>
              </div>
            </div>
            <div class="nav-content-wrapper track-edit-content">
              <div class="track-record-toolbar track-edit-toolbar">
                <div class="track-toolbar-group">
                  <span class="track-label">地图:</span>
                  <div class="track-select-wrapper custom-select-container">
                    <div 
                      class="track-select custom-select-trigger" 
                      :class="{ 'is-disabled': isMapSelectionLocked || routeEditLoading || routeEditCreateMode }"
                      @click="!(isMapSelectionLocked || routeEditLoading || routeEditCreateMode) && (activeDropdown = activeDropdown === 'trackEditMap' ? null : 'trackEditMap')"
                    >
                      <span class="custom-select-value">{{ trackEditMap || (trackMapList.length === 0 ? '暂无地图' : '请选择地图') }}</span>
                      <span class="track-select-arrow" :style="{ transform: activeDropdown === 'trackEditMap' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                        <svg width="10" height="10" viewBox="0 0 12 12">
                          <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                        </svg>
                      </span>
                    </div>
                    <div v-show="activeDropdown === 'trackEditMap'" class="custom-select-dropdown">
                      <div v-if="trackMapList.length === 0" class="custom-select-option is-empty">暂无地图</div>
                      <div 
                        v-for="map in trackMapList" 
                        :key="map" 
                        class="custom-select-option" 
                        :class="{ 'is-selected': trackEditMap === map }"
                        @click="trackEditMap = map; activeDropdown = null"
                      >
                        {{ map }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="track-toolbar-group">
                  <span class="track-label">路线:</span>
                  <div class="track-select-wrapper custom-select-container">
                    <div 
                      class="track-select custom-select-trigger" 
                      :class="{ 'is-disabled': routeEditLoading || routeEditCreateMode }"
                      @click="!(routeEditLoading || routeEditCreateMode) && (activeDropdown = activeDropdown === 'trackEditLine' ? null : 'trackEditLine')"
                    >
                      <span class="custom-select-value">{{ trackEditLine || (trackEditLineList.length === 0 ? '暂无路线' : '请选择路线') }}</span>
                      <span class="track-select-arrow" :style="{ transform: activeDropdown === 'trackEditLine' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                        <svg width="10" height="10" viewBox="0 0 12 12">
                          <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                        </svg>
                      </span>
                    </div>
                    <div v-show="activeDropdown === 'trackEditLine'" class="custom-select-dropdown">
                      <div v-if="trackEditLineList.length === 0" class="custom-select-option is-empty">暂无路线</div>
                      <div 
                        v-for="line in trackEditLineList" 
                        :key="line" 
                        class="custom-select-option" 
                        :class="{ 'is-selected': trackEditLine === line }"
                        @click="trackEditLine = line; activeDropdown = null"
                      >
                        {{ line }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="track-toolbar-actions">
                  <button class="map-btn map-btn-primary track-btn" :class="{ active: routeEditCreateMode }" :disabled="routeEditLoading || !trackEditMap" v-permission-click-dialog="'nav-trackrecord-create'" @click="routeEditCreateMode ? cancelRouteEditCreate() : startRouteEditCreate()">
                    {{ routeEditCreateMode ? '新增中' : '新增路线' }}
                  </button>
                  <button class="map-btn map-btn-primary track-btn" :disabled="routeEditLoading || routeEditCreateMode || !trackEditLine" v-permission-click-dialog="'nav-trackrecord-preview'" @click="loadTrackEditRoute">
                    {{ routeEditLoading ? '加载中...' : '加载路线' }}
                  </button>
                </div>
              </div>

              <div class="track-edit-workspace">
                <div class="track-edit-map">
                  <div class="nav-map-canvas">
                    <div class="pointcloud-wrapper">
                      <!-- 栅格图视图 -->
                      <div class="pointcloud-view" v-show="navViewType === 'grid'">
                        <div class="grid-map-container" ref="navGridMapContainerRef">
                          <canvas
                            ref="navGridMapCanvasRef"
                            class="grid-map-canvas"
                            @wheel="handleNavGridMapWheel"
                            @mousedown="handleNavGridMapMouseDown"
                            @mousemove="handleNavGridMapMouseMove"
                            @mouseup="handleNavGridMapMouseUp"
                            @mouseleave="handleNavGridMapMouseUp"
                            style="cursor: grab;"
                          ></canvas>
                          <div v-if="navGridMapLoading" class="grid-map-overlay">栅格地图加载中...</div>
                          <div v-else-if="navGridMapError" class="grid-map-overlay error">{{ navGridMapError }}</div>
                          
                          <!-- 实时点云开关按钮 -->
                          <button 
                            v-if="!navGridMapLoading && !navGridMapError" 
                            class="grid-map-realtime-btn"
                            :class="{ active: showRealtimeScan }"
                            @click.stop="showRealtimeScan = !showRealtimeScan"
                            title="实时点云开关"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M12 3L4 7.5v9L12 21l8-4.5v-9L12 3z" stroke-dasharray="2 2"/>
                              <path d="M12 3v18" stroke-dasharray="2 2"/>
                              <path d="M12 12L4 7.5" stroke-dasharray="2 2"/>
                              <path d="M12 12l8-4.5" stroke-dasharray="2 2"/>
                              <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="4" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="20" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="4" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="20" cy="16.5" r="1.5" fill="currentColor" stroke="none"/>
                              <circle cx="12" cy="21" r="1.5" fill="currentColor" stroke="none"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- 卫星图视图 -->
                      <div class="pointcloud-view" v-show="navViewType === 'map'">
                        <div ref="navMapContainer" style="width: 100%; height: 100%;"></div>
                        <!-- 图层切换器（左上角，复用 map_record） -->
                        <div class="map-layer-switcher">
                          <button class="layer-switch-trigger" @click.stop="toggleNavLayerMenu">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>图层</span>
                          </button>
                          <transition name="layer-menu-fade">
                            <div v-show="navShowLayerMenu" class="layer-menu-dropdown">
                              <div class="layer-option" :class="{ active: navMapType === 'standard' }" @click.stop="setNavMapType('standard')">
                                <span class="option-icon standard-icon"></span>
                                <span>标准地图</span>
                              </div>
                              <div class="layer-option" :class="{ active: navMapType === 'satellite' }" @click.stop="setNavMapType('satellite')">
                                <span class="option-icon satellite-icon"></span>
                                <span>卫星地图</span>
                              </div>
                              <div class="layer-divider"></div>
                              <div class="layer-option" :class="{ active: navShowTraffic }" @click.stop="toggleNavTraffic">
                                <span class="layer-checkbox" :class="{ checked: navShowTraffic }"></span>
                                <span>实时路况</span>
                              </div>
                            </div>
                          </transition>
                        </div>
                      </div>

                      <!-- 左下角视图切换器（仅 2 个按钮） -->
                      <div class="map-view-switcher-group">
                        <button
                          class="view-switch-btn"
                          :class="{ active: navViewType === 'grid' }"
                          @click.stop="setRouteEditView('grid')"
                          title="栅格图"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="1.5"/>
                            <path d="M9 3v18"/>
                            <path d="M15 3v18"/>
                            <path d="M3 9h18"/>
                            <path d="M3 15h18"/>
                            <rect x="3.5" y="3.5" width="5" height="5" fill="currentColor" stroke="none"/>
                            <rect x="15.5" y="9.5" width="5" height="5" fill="currentColor" stroke="none"/>
                            <rect x="9.5" y="15.5" width="5" height="5" fill="currentColor" stroke="none"/>
                          </svg>
                        </button>
                        <button
                          v-if="hasRobotRtk"
                          class="view-switch-btn"
                          :class="{ active: navViewType === 'map' }"
                          @click.stop="setRouteEditView('map')"
                          title="卫星图"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
                            <rect x="2" y="10" width="4" height="4" rx="0.5"/>
                            <rect x="18" y="10" width="4" height="4" rx="0.5"/>
                            <line x1="6" y1="12" x2="9" y2="12"/>
                            <line x1="15" y1="12" x2="18" y2="12"/>
                            <path d="M12 15v3"/>
                            <path d="M9 18h6"/>
                          </svg>
                        </button>
                      </div>

                      <div v-if="routeEditMode !== 'view' && routeEditCanDraw" class="track-edit-mode-hint">
                        {{ routeEditMode === 'pick' ? '点击绿色路线点进行选择' : routeEditDrawHint }}
                      </div>
                    </div>
                  </div>
                </div>

                <aside class="track-edit-panel">
                  <div class="track-edit-panel-section">
                    <div class="track-edit-panel-heading">
                      <div class="track-edit-panel-title">编辑模式</div>
                    </div>
                    <div class="track-edit-action-grid">
                      <button class="track-edit-action" :class="{ active: routeEditMode === 'pick' }" :disabled="!routeEditHasRoute || routeEditCreateMode" @click="setRouteEditMode('pick')">
                        选段
                      </button>
                      <button class="track-edit-action" :class="{ active: routeEditMode === 'draw' }" :disabled="!routeEditCanDraw" @click="setRouteEditMode('draw')">
                        绘制
                      </button>
                    </div>

                    <!-- 绘制类型 (直线/曲线) -->
                    <div class="track-edit-action-grid" style="grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                      <button 
                        class="track-edit-action" 
                        :class="{ active: routeEditDrawType === 'line' }" 
                        :disabled="routeEditMode !== 'draw'"
                        @click="setRouteEditDrawType('line')"
                      >
                        直线
                      </button>
                      <button 
                        class="track-edit-action" 
                        :class="{ active: routeEditDrawType === 'curve' }" 
                        :disabled="routeEditMode !== 'draw'"
                        @click="setRouteEditDrawType('curve')"
                      >
                        曲线
                      </button>
                    </div>

                    <!-- 轨迹配置 (步长) -->
                    <div class="track-edit-range-row" style="margin-top: 8px;">
                      <label>步长</label>
                      <div class="track-edit-step-counter">
                        <button class="step-btn" @click="decreaseRouteEditStep" :disabled="routeEditMode !== 'draw' || routeEditStep <= 0.01">-</button>
                        <input
                          :value="routeEditStep.toFixed(2)"
                          type="text"
                          readonly
                          class="step-input"
                          :disabled="routeEditMode !== 'draw'"
                        />
                        <button class="step-btn" @click="increaseRouteEditStep" :disabled="routeEditMode !== 'draw' || routeEditStep >= 1.00">+</button>
                      </div>
                    </div>
                  </div>

                  <div class="track-edit-panel-section">
                    <div class="track-edit-panel-heading">
                      <div class="track-edit-panel-title">高度</div>
                    </div>
                    <div class="track-edit-range-row track-edit-z-row">
                      <label>Z 值</label>
                      <input
                        v-model.number="routeEditManualZ"
                        type="number"
                        step="0.01"
                        :disabled="!routeEditCanDraw"
                        @blur="normalizeRouteEditManualZInput"
                        @keyup.enter="normalizeRouteEditManualZInput"
                      />
                    </div>
                    <div class="track-edit-action-grid">
                      <button class="track-edit-action primary" :disabled="!routeEditHasRoute" v-permission-click-dialog="'nav-trackrecord-edit'" @click="confirmApplyRouteEditManualZToAll">全局应用</button>
                    </div>
                  </div>

                  <div class="track-edit-panel-section">
                    <div class="track-edit-panel-heading">
                      <div class="track-edit-panel-title">{{ routeEditCreateMode ? '新增绘制' : '路线编辑' }}</div>
                    </div>
                    <div v-if="routeEditCreateMode" class="track-edit-action-grid">
                      <button class="track-edit-action" :disabled="routeEditPoints.length === 0" @click="undoRouteEditCreatePoint">撤销点</button>
                      <button class="track-edit-action" :disabled="routeEditPoints.length === 0" @click="clearRouteEditCreatePoints">清空路线</button>
                      <button class="track-edit-action primary" :disabled="!canSubmitRouteEditCreate" v-permission-click-dialog="'nav-trackrecord-create'" @click="openRouteEditCreateDialog">
                        提交新增
                      </button>
                      <button class="track-edit-action" @click="cancelRouteEditCreate">取消新增</button>
                    </div>
                    <div v-else class="track-edit-action-grid">
                      <button class="track-edit-action" :disabled="!canUndoRouteEdit" @click="undoRouteEditOperation">撤销操作</button>
                      <button class="track-edit-action" :class="{ danger: routeEditHasDeletableSelection }" :disabled="!routeEditHasDeletableSelection" v-permission-click-dialog="'nav-trackrecord-edit'" @click="deleteRouteEditSelection">删除选段</button>
                      <button class="track-edit-action track-edit-action-full" :disabled="!routeEditHasRoute || routeEditCreateMode" @click="resetRouteEditRoute">重置路线</button>
                      <button class="track-edit-action primary track-edit-action-full" :disabled="routeEditUploading || !routeEditCanUpload" v-permission-click-dialog="'nav-trackrecord-edit'" @click="confirmUploadRouteEditRoute">
                        {{ routeEditUploading ? '上传中...' : '保存上传' }}
                      </button>
                    </div>
                  </div>
                </aside>
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
                <div class="file-manage-select-wrapper custom-select-container" style="position: relative; display: inline-block; min-width: 220px;">
                  <div 
                    class="mission-toolbar-select custom-select-trigger" 
                    :class="{ 'is-disabled': navigationEnabled }"
                    @click="!navigationEnabled && (activeDropdown = activeDropdown === 'fileManageMap' ? null : 'fileManageMap')"
                  >
                    <span class="custom-select-value">{{ fileManageMap || (fileMapList.length === 0 ? '暂无地图' : '请选择地图') }}</span>
                    <span class="nav-select-arrow" :style="{ transform: activeDropdown === 'fileManageMap' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                      <svg width="10" height="10" viewBox="0 0 12 12">
                        <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                      </svg>
                    </span>
                  </div>
                  <div v-show="activeDropdown === 'fileManageMap'" class="custom-select-dropdown">
                    <div v-if="fileMapList.length === 0" class="custom-select-option is-empty">暂无地图</div>
                    <div 
                      v-for="map in fileMapList" 
                      :key="map" 
                      class="custom-select-option" 
                      :class="{ 'is-selected': fileManageMap === map }"
                      @click="fileManageMap = map; activeDropdown = null"
                    >
                      {{ map }}
                    </div>
                  </div>
                </div>
                <button
                  class="mission-btn mission-btn-stop"
                  :disabled="fileMapList.length === 0 || !fileManageMap || navigationEnabled"
                  v-permission-click-dialog="'nav-file-delete'"
                  @click="handleDeleteMap"
                >
                  删除地图
                </button>
                <span class="mission-toolbar-label" style="margin-left: 20px;">数据包:</span>
                <div class="file-manage-select-wrapper custom-select-container" style="position: relative; display: inline-block; min-width: 220px;">
                  <div 
                    class="mission-toolbar-select custom-select-trigger" 
                    @click="activeDropdown = activeDropdown === 'fileManagePackage' ? null : 'fileManagePackage'"
                  >
                    <span class="custom-select-value">{{ fileManagePackage || (dataPackageList.length === 0 ? '暂无数据包' : '请选择数据包') }}</span>
                    <span class="nav-select-arrow" :style="{ transform: activeDropdown === 'fileManagePackage' ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }">
                      <svg width="10" height="10" viewBox="0 0 12 12">
                        <polygon points="2,4 6,8 10,4" fill="#9adfff"/>
                      </svg>
                    </span>
                  </div>
                  <div v-show="activeDropdown === 'fileManagePackage'" class="custom-select-dropdown">
                    <div v-if="dataPackageList.length === 0" class="custom-select-option is-empty">暂无数据包</div>
                    <div 
                      v-for="pkg in dataPackageList" 
                      :key="pkg" 
                      class="custom-select-option" 
                      :class="{ 'is-selected': fileManagePackage === pkg }"
                      @click="fileManagePackage = pkg; activeDropdown = null"
                    >
                      {{ pkg }}
                    </div>
                  </div>
                </div>
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

    <!-- 实时建图地图渲染弹窗 -->
    <div v-if="slamOnlineMapDialogVisible" class="recording-dialog-overlay slam-online-map-overlay">
      <div class="recording-dialog-card card slam-online-map-dialog">
        <div class="recording-dialog-header">
          实时建图 - 栅格地图
          <button class="dialog-close-btn" @click="slamOnlineMapDialogVisible = false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="recording-dialog-body" style="padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #07141e;">
          <!-- 实时绘制 Canvas -->
          <div class="realtime-map-canvas-container" style="position: relative; width: 100%; height: 640px; background: #3d5252; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <canvas 
              ref="slamOnlineCanvasRef" 
              style="max-width: 100%; max-height: 100%; object-fit: contain; cursor: grab;"
              @wheel.prevent="handleSlamOnlineWheel"
              @mousedown="handleSlamOnlineMouseDown"
              @mousemove="handleSlamOnlineMouseMove"
              @mouseup="handleSlamOnlineMouseUp"
              @mouseleave="handleSlamOnlineMouseUp"
            ></canvas>
            <div v-if="!hasSlamOnlineData" style="position: absolute; color: #ffffff; font-size: 14px;">
              等待实时栅格图数据 (slam_grid_map)...
            </div>
          </div>
          <!-- 底部状态与操作 -->
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 12px; color: #9adfff; font-size: 13px;">
            <div>
              <span style="opacity: 0.7;">分辨率: </span>
              <span style="font-weight: 600; color: #fff;">{{ slamGridMapMetaInfo.resolution }} m/cell</span>
              <span style="opacity: 0.7; margin-left: 15px;">地图尺寸: </span>
              <span style="font-weight: 600; color: #fff;">{{ slamGridMapMetaInfo.width }} x {{ slamGridMapMetaInfo.height }}</span>
              <span style="opacity: 0.7; margin-left: 15px;">车辆位姿: </span>
              <span style="font-weight: 600; color: #fff;">
                {{ robotStore.slamPoseData ? `x: ${robotStore.slamPoseData.x.toFixed(3)}, y: ${robotStore.slamPoseData.y.toFixed(3)}, θ: ${robotStore.slamPoseData.theta.toFixed(3)}` : '等待数据...' }}
              </span>
            </div>
            <div>
              <button class="map-btn map-btn-danger" :disabled="slamOnlineBtnLoading" @click="handleSlamOnlineToggle">
                {{ slamOnlineBtnLoading ? '关闭中...' : '关闭建图' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时建图地图名称输入对话框 -->
    <div v-if="slamOnlineDialogVisible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card">
        <div class="recording-dialog-header">
          开启实时建图
          <button class="dialog-close-btn" @click="cancelStartSlamOnline">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="recording-dialog-body">
          <input
            v-model="slamOnlineMapName"
            placeholder="请输入地图名称"
            class="recording-input"
            @input="handleSlamOnlineMapNameInput"
          />
          <div v-if="isSlamOnlineMapNameDuplicate" class="error-tip" style="color: #ff4d4f; font-size: 12px; margin-top: 4px; text-align: left;">
            地图名称已存在
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button 
            class="map-btn map-btn-primary" 
            v-permission-click-dialog="'nav-lbjt-slamonline'"
            @click="confirmStartSlamOnline" 
            :disabled="slamOnlineLoading || isSlamOnlineMapNameDuplicate || !slamOnlineMapName.trim()"
          >
            {{ slamOnlineLoading ? '提交中...' : '确定' }}
          </button>
          <button class="map-btn" @click="cancelStartSlamOnline">取消</button>
        </div>
      </div>
    </div>

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
              <span>停障模式</span>
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

    <!-- 手动新增路线命名弹窗 -->
    <div v-if="routeEditCreateDialog.visible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card route-create-dialog-card">
        <div class="recording-dialog-header">
          新增路线
          <button class="dialog-close-btn" @click="cancelRouteEditCreateDialog">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="recording-dialog-body">
          <div class="route-create-summary">
            已绘制 {{ routeEditPoints.length }} 个点{{ routeEditIsClosedLoop ? '，已闭环' : '' }}
          </div>
          <div class="route-create-name-row">
            <span>{{ trackEditMap }}_</span>
            <input
              v-model="routeEditCreateDialog.trackName"
              placeholder="输入路线名称"
              @input="routeEditCreateDialog.error = ''"
              @keyup.enter="confirmRouteEditCreate"
            />
          </div>
          <div v-if="routeEditCreateDialog.error" class="feature-area-name-error">
            {{ routeEditCreateDialog.error }}
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn map-btn-primary" v-permission-click-dialog="'nav-trackrecord-create'" @click="confirmRouteEditCreate">
            确定
          </button>
          <button class="map-btn" @click="cancelRouteEditCreateDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- 功能区命名弹窗 -->
    <div v-if="featureAreaNameDialog.visible" class="recording-dialog-overlay">
      <div class="recording-dialog-card card feature-area-name-dialog-card">
        <div class="recording-dialog-header">
          功能区命名
          <button class="dialog-close-btn" @click="cancelFeatureAreaNameDialog">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="recording-dialog-body">
          <div class="form-item">
            <label class="form-label">功能区名称：</label>
            <input
              ref="featureAreaNameInput"
              v-model="featureAreaNameDialog.name"
              class="recording-input"
              placeholder="请输入功能区名称"
              @input="featureAreaNameDialog.error = ''"
              @keyup.enter="confirmFeatureAreaNameDialog"
            />
          </div>
          <div v-if="featureAreaNameDialog.error" class="feature-area-name-error">
            {{ featureAreaNameDialog.error }}
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn map-btn-primary" @click="confirmFeatureAreaNameDialog">确定</button>
          <button class="map-btn" @click="cancelFeatureAreaNameDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- 重定位弹窗 -->
    <div v-if="reloModalVisible" class="recording-dialog-overlay" @contextmenu.prevent>
      <div class="recording-dialog-card card relo-dialog-card">
        <div class="recording-dialog-header">
          重定位
          <button class="dialog-close-btn" @click="closeReloModal">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="recording-dialog-body relo-dialog-body">
          <div class="relo-instructions">
            提示：左键拖动可平移地图，滚轮可缩放。<strong>鼠标右键点击并拖动</strong>会在地图上画出红色方向箭头，松开右键即自动提交重定位数据。
          </div>
          <div ref="reloContainer" class="relo-map-container" @wheel.prevent="onReloWheel">
            <canvas
              ref="reloCanvas"
              class="relo-canvas"
              @mousedown="onReloMouseDown"
              @mousemove="onReloMouseMove"
              @mouseup="onReloMouseUp"
              @mouseleave="onReloMouseLeave"
            ></canvas>
            <div v-if="reloMapLoading" class="map-overlay loading">地图加载中...</div>
            <div v-else-if="reloMapError" class="map-overlay error">{{ reloMapError }}</div>
          </div>
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

    <!-- MSF 定位模式选择弹窗 -->
    <Teleport to="body">
      <div v-if="msfModeDialogVisible" class="recording-dialog-overlay" @click="msfModeDialogVisible = false" style="z-index: 10000;">
        <div class="recording-dialog-card card msf-mode-dialog" @click.stop style="max-width: 320px; width: 90%;">
          <div class="recording-dialog-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span>选择 MSF 定位模式</span>
            <button class="dialog-close-btn" @click="msfModeDialogVisible = false">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="recording-dialog-body" style="padding: 16px 20px;">
            <div class="msf-mode-options" style="display: flex; flex-direction: column; gap: 10px;">
              <label 
                class="msf-mode-option-card"
                :class="{ active: selectedMsfMode === 3 }"
                style="display: flex; align-items: center; padding: 10px 14px; background: rgba(12, 42, 62, 0.6); border: 1px solid rgba(103, 213, 253, 0.25); border-radius: 6px; cursor: pointer; transition: all 0.2s ease;"
              >
                <input type="radio" v-model="selectedMsfMode" :value="3" style="margin-right: 10px; accent-color: #67d5fd;" />
                <span style="font-weight: 500; color: #ffffff; font-size: 14px;">融合定位</span>
              </label>

              <label 
                class="msf-mode-option-card"
                :class="{ active: selectedMsfMode === 2 }"
                style="display: flex; align-items: center; padding: 10px 14px; background: rgba(12, 42, 62, 0.6); border: 1px solid rgba(103, 213, 253, 0.25); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;"
              >
                <input type="radio" v-model="selectedMsfMode" :value="2" style="margin-right: 10px; accent-color: #67d5fd;" />
                <span style="font-weight: 500; color: #ffffff; font-size: 14px;">卫星定位</span>
              </label>
            </div>
          </div>
          <div class="recording-dialog-actions" style="padding: 12px 16px; display: flex; justify-content: center; gap: 16px; border-top: 1px solid rgba(103, 213, 253, 0.15);">
            <button class="map-btn map-btn-primary" :disabled="msfModeSubmitting" @click="confirmMsfModeDialog" style="min-width: 84px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              <svg v-if="msfModeSubmitting" class="msf-btn-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                <path d="M12 2 a 10 10 0 0 1 10 10"></path>
              </svg>
              <span>确定</span>
            </button>
            <button class="map-btn map-btn-secondary" :disabled="msfModeSubmitting" @click="msfModeDialogVisible = false" style="min-width: 84px;">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 错误提示 -->
    <ErrorMessage
      :show="errorMessage.show"
      :message="errorMessage.message"
      @close="closeErrorMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onDeactivated, onUnmounted, nextTick, watch, computed, shallowRef } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
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
import trackEditIcon from '@/assets/source_data/svg_data/edit.svg'
import packageManageIcon from '@/assets/source_data/svg_data/package_manage.svg'
import mapMoveIcon from '@/assets/source_data/svg_data/robot_source/map_move.svg'
import mapMagnifyIcon from '@/assets/source_data/svg_data/robot_source/map_magnify.svg'
import mapReduceIcon from '@/assets/source_data/svg_data/robot_source/map_reduce.svg'
import mapPenIcon from '@/assets/source_data/svg_data/robot_source/map_pen.svg'
import mapEraserIcon from '@/assets/source_data/svg_data/robot_source/map_eraser.svg'
import mapRollbackIcon from '@/assets/source_data/svg_data/robot_source/map_rollback.svg'
import mapInitIcon from '@/assets/source_data/svg_data/robot_source/map_init.svg'
import mapUploadIcon from '@/assets/source_data/svg_data/robot_source/map_upload.svg'
import { saveTrajectoryFile, getTrajectoryFile, deleteTrajectoryFile } from '@/utils/trajectoryDB'
import deleteIcon from '@/assets/source_data/svg_data/robot_source/delete.png'
import { load3MF } from '../utils/threemfParser'
import type { MeshData } from '../utils/threemfParser'
import { useRobotStore } from '../stores/robot'
import { navigationApi, mapFileApi } from '../api/services'
import { useDeviceStore } from '../stores/device'
import { useTaskExecutionStore } from '../stores/taskExecution'
import { usePermissionStore } from '@/stores/permission'
import { getRobotMapCacheKeys, getRobotContextCacheKeys, refreshMapCache, refreshRobotRelatedCache } from '@/utils/robotBootstrap'

// WGS84坐标转GCJ-02坐标的转换函数
const transformGCJ02ToWGS84 = (gcjLng: number, gcjLat: number) => {
  const PI = Math.PI
  const ee = 0.00669342162296594323
  const a = 6378245.0

  if (isOutOfChina(gcjLng, gcjLat)) {
    return { longitude: gcjLng, latitude: gcjLat }
  }

  // 迭代反推：WGS -> GCJ 已知，求 WGS 使 f(wgs) = gcj
  let wgsLng = gcjLng
  let wgsLat = gcjLat
  for (let i = 0; i < 5; i++) {
    const fwd = transformWGS84ToGCJ02(wgsLng, wgsLat)
    const dLng = fwd.longitude - gcjLng
    const dLat = fwd.latitude - gcjLat
    if (Math.abs(dLng) < 1e-9 && Math.abs(dLat) < 1e-9) break
    wgsLng -= dLng
    wgsLat -= dLat
  }
  return { longitude: wgsLng, latitude: wgsLat }
}

const transformWGS84ToGCJ02 = (wgsLng: number, wgsLat: number) => {
  const PI = Math.PI
  const ee = 0.00669342162296594323
  const a = 6378245.0

  if (isOutOfChina(wgsLng, wgsLat)) {
    return { longitude: wgsLng, latitude: wgsLat }
  }

  let dlat = transformLat(wgsLng - 105.0, wgsLat - 35.0)
  let dlng = transformLng(wgsLng - 105.0, wgsLat - 35.0)
  const radlat = wgsLat / 180.0 * PI
  let magic = Math.sin(radlat)
  magic = 1 - ee * magic * magic
  const sqrtmagic = Math.sqrt(magic)
  dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI)
  dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI)
  const mglat = wgsLat + dlat
  const mglng = wgsLng + dlng

  return { longitude: mglng, latitude: mglat }
}

const isOutOfChina = (lng: number, lat: number) => {
  return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271)
}

const transformLat = (lng: number, lat: number) => {
  const PI = Math.PI
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
  return ret
}

const transformLng = (lng: number, lat: number) => {
  const PI = Math.PI
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

const normalizeGpsCoordinate = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null || val === '') return 0
  let n = Number(val)
  if (isNaN(n)) return 0
  if (Math.abs(n) > 10000) {
    if (Math.abs(n) > 10000000) {
      n = n / 10000000.0
    } else {
      n = n / 1000000.0
    }
  }
  return n
}

const convertLocalToGps = (x: number, y: number, gnssOrigin: { latitude: number; longitude: number } | null) => {
  let lat0 = 0
  let lng0 = 0
  
  if (gnssOrigin) {
    lat0 = gnssOrigin.latitude
    lng0 = gnssOrigin.longitude
  } else {
    const gps = robotStore.gpsMessage
    const pose = robotStore.pose
    if (gps && gps.longitude && gps.latitude && pose) {
      const rlng = normalizeGpsCoordinate(gps.longitude)
      const rlat = normalizeGpsCoordinate(gps.latitude)
      const rx = pose.x
      const ry = pose.y
      if (rlng !== 0 && rlat !== 0 && !isNaN(rx) && !isNaN(ry)) {
        lat0 = rlat - ry / 111319.0
        lng0 = rlng - rx / (111319.0 * Math.cos(rlat * Math.PI / 180))
      }
    }
  }

  if (lat0 === 0 || lng0 === 0) {
    return null
  }

  const lat = lat0 + y / 111319.0
  const lng = lng0 + x / (111319.0 * Math.cos(lat0 * Math.PI / 180))
  return { longitude: lng, latitude: lat }
}

const convertGpsToLocal = (lng: number, lat: number, gnssOrigin: { latitude: number; longitude: number } | null) => {
  if (!gnssOrigin) return null
  const lat0 = gnssOrigin.latitude
  const lng0 = gnssOrigin.longitude
  if (lat0 === 0 || lng0 === 0) return null
  const y = (lat - lat0) * 111319.0
  const x = (lng - lng0) * 111319.0 * Math.cos(lat0 * Math.PI / 180)
  return { x, y }
}

const loadGnssOrigin = async (mapName: string): Promise<{ latitude: number; longitude: number } | null> => {
  if (!mapName) return null
  try {
    const blob = await getMapFile(mapName, 'gnss_origin.txt')
    if (!blob) return null
    const text = await blob.text()
    const parts = text.trim().split(/[\s,]+/)
    if (parts.length >= 2) {
      const p0 = parseFloat(parts[0])
      const p1 = parseFloat(parts[1])
      if (!isNaN(p0) && !isNaN(p1) && p0 !== 0 && p1 !== 0) {
        const lat = Math.min(Math.abs(p0), Math.abs(p1)) * (p0 < p1 ? Math.sign(p0) : Math.sign(p1))
        const lng = Math.max(Math.abs(p0), Math.abs(p1)) * (p0 > p1 ? Math.sign(p0) : Math.sign(p1))
        return { latitude: lat, longitude: lng }
      }
    }
  } catch (err) {
    console.error('Failed to load gnss_origin:', err)
  }
  return null
}

// 路线编辑在 AMap 上的轨迹 overlay
let routeEditMainPolylines: any[] = []
let routeEditDraftPolyline: any = null
let routeEditSelectionPolyline: any = null
let routeEditMainMarkers: any[] = []
let routeEditDraftMarkers: any[] = []
let routeEditSelectionMarkers: any[] = []

const splitRouteEditPointsByBreaks = (points: RouteEditPoint[], breaks: number[]): RouteEditPoint[][] => {
  if (points.length === 0) return []
  const segments: RouteEditPoint[][] = []
  let currentSegment: RouteEditPoint[] = [points[0]]
  
  for (let i = 1; i < points.length; i++) {
    if (breaks.includes(i - 1)) {
      segments.push(currentSegment)
      currentSegment = [points[i]]
    } else {
      currentSegment.push(points[i])
    }
  }
  segments.push(currentSegment)
  return segments
}

const clearRouteEditAMapOverlays = () => {
  if (!navAmapInstance) return
  const removeSafe = (obj: any) => {
    if (obj && typeof navAmapInstance.remove === 'function') {
      try { navAmapInstance.remove(obj) } catch {}
    }
  }
  routeEditMainPolylines.forEach(p => removeSafe(p))
  routeEditMainPolylines = []
  if (routeEditDraftPolyline) { removeSafe(routeEditDraftPolyline); routeEditDraftPolyline = null }
  if (routeEditSelectionPolyline) { removeSafe(routeEditSelectionPolyline); routeEditSelectionPolyline = null }
  routeEditMainMarkers.forEach(m => removeSafe(m))
  routeEditDraftMarkers.forEach(m => removeSafe(m))
  routeEditSelectionMarkers.forEach(m => removeSafe(m))
  routeEditMainMarkers = []
  routeEditDraftMarkers = []
  routeEditSelectionMarkers = []
}

const renderRouteEditOnAMap = async () => {
  if (!navAmapInstance || !navAmapApiRef) return
  if (!selectedNavMap.value) return
  const AMap = navAmapApiRef
  const gnssOrigin = await loadGnssOrigin(selectedNavMap.value)
  if (!gnssOrigin) return
  cachedLngLatOrigin = gnssOrigin
  cachedLngLatMapName = selectedNavMap.value

  if (navOriginMapMarker && typeof navAmapInstance.remove === 'function') {
    try { navAmapInstance.remove(navOriginMapMarker) } catch {}
  }

  clearRouteEditAMapOverlays()

  const localToLngLat = (p: { x: number; y: number }): [number, number] | null => {
    const gps = convertLocalToGps(p.x, p.y, gnssOrigin)
    if (!gps) return null
    const gcj = transformWGS84ToGCJ02(gps.longitude, gps.latitude)
    return [gcj.longitude, gcj.latitude]
  }

  const points = routeEditPoints.value
  const draft = routeEditDraftPoints.value

  // 主轨迹 (使用 breaks 拆分多段绘制以支持删除选段时的断开效果)
  const pointSegments = splitRouteEditPointsByBreaks(points, routeEditBreaks.value)
  pointSegments.forEach(seg => {
    const segPath: [number, number][] = []
    seg.forEach(p => {
      const c = localToLngLat(p)
      if (c) segPath.push(c)
    })
    if (segPath.length > 1) {
      const poly = new AMap.Polyline({
        path: segPath,
        strokeColor: '#39b54a',
        strokeWeight: 2,
        strokeOpacity: 0.85,
        strokeStyle: 'solid',
        lineJoin: 'round',
        showDir: true,
        zIndex: 105,
      })
      navAmapInstance.add(poly)
      routeEditMainPolylines.push(poly)
    }
  })

  // 主轨迹关键点 (仅在绘制或新增模式下画终点，且去掉起点的橙色标记点)
  if (AMap && (AMap as any).CircleMarker && points.length > 0 && (routeEditMode.value === 'draw' || routeEditCreateMode.value)) {
    const p = points[points.length - 1]
    const c = localToLngLat(p)
    if (c) {
      const marker = new (AMap as any).CircleMarker({
        center: c,
        radius: 4.5,
        strokeColor: '#ffffff',
        strokeWeight: 1.5,
        fillColor: '#ff9500',
        fillOpacity: 1,
        zIndex: 110,
      })
      navAmapInstance.add(marker)
      routeEditMainMarkers.push(marker)
    }
  }

  // draft 轨迹
  const draftPath: [number, number][] = []
  draft.forEach(p => {
    const c = localToLngLat(p)
    if (c) draftPath.push(c)
  })
  if (draftPath.length > 1) {
    routeEditDraftPolyline = new AMap.Polyline({
      path: draftPath,
      strokeColor: '#ff9500',
      strokeWeight: 2,
      strokeStyle: 'dashed',
      strokeOpacity: 0.9,
      lineJoin: 'round',
      zIndex: 106,
    })
    navAmapInstance.add(routeEditDraftPolyline)
  }
  if (draftPath.length > 0 && AMap && (AMap as any).CircleMarker) {
    const indices = draft.length === 1 ? [0] : [0, draft.length - 1]
    indices.forEach((idx) => {
      const p = draft[idx]
      const c = localToLngLat(p)
      if (!c) return
      const marker = new (AMap as any).CircleMarker({
        center: c,
        radius: 3.5,
        strokeColor: '#ffffff',
        strokeWeight: 1.5,
        fillColor: '#ff9500',
        fillOpacity: 1,
        zIndex: 111,
      })
      navAmapInstance.add(marker)
      routeEditDraftMarkers.push(marker)
    })
  }

  // 选段
  const range = getRouteEditSelectionRange()
  if (range && range.start !== range.end && points.length > range.end) {
    const segPath: [number, number][] = []
    for (let i = range.start; i <= range.end; i++) {
      const c = localToLngLat(points[i])
      if (c) segPath.push(c)
    }
    if (segPath.length > 1) {
      routeEditSelectionPolyline = new AMap.Polyline({
        path: segPath,
        strokeColor: '#ff3b30',
        strokeWeight: 3,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        lineJoin: 'round',
        zIndex: 108,
      })
      navAmapInstance.add(routeEditSelectionPolyline)
    }
  }

  // 选段模式下的点击位置标记 (AMap)
  if (routeEditMode.value === 'pick' && AMap && (AMap as any).CircleMarker) {
    [routeEditSelectionStart.value, routeEditSelectionEnd.value].forEach((i) => {
      if (isValidRouteEditIndex(i) && i < points.length) {
        const c = localToLngLat(points[i])
        if (!c) return
        const marker = new (AMap as any).CircleMarker({
          center: c,
          radius: 4.5,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          fillColor: '#ff9500',
          fillOpacity: 1,
          zIndex: 112,
        })
        navAmapInstance.add(marker)
        routeEditSelectionMarkers.push(marker)
      }
    })
  }
}

const handleNavMapClickForRouteEdit = (e: any) => {
  if (currentTab.value !== 'track_edit') return
  if (!routeEditCanDraw.value) return
  const mode = routeEditMode.value
  if (mode === 'view') return
  if (!e || !e.lnglat) return

  const lnglat = e.lnglat
  if (!selectedNavMap.value) return

  loadGnssOrigin(selectedNavMap.value).then(gnssOrigin => {
    if (!gnssOrigin) return
    const wgs = transformGCJ02ToWGS84(lnglat.lng, lnglat.lat)
    const local = convertGpsToLocal(wgs.longitude, wgs.latitude, gnssOrigin)
    if (!local) return
    const z = getRouteEditDrawPlaneRawZ()

    if (mode === 'pick') {
      // 拾取最近的主轨迹点（屏幕距离无法计算，用经纬度距离近似）
      const pts = routeEditPoints.value
      if (!pts.length) return
      let bestIdx = -1
      let bestDist = Infinity
      pts.forEach((p, i) => {
        const c = localToLngLatCached(p)
        if (!c) return
        const dLng = c[0] - lnglat.lng
        const dLat = c[1] - lnglat.lat
        const d = dLng * dLng + dLat * dLat
        if (d < bestDist) { bestDist = d; bestIdx = i }
      })
      if (bestIdx >= 0) {
        handleRouteEditTrajectoryPick({ index: bestIdx })
      }
      return
    }

    // draw 模式：先尝试吸附到最近的 routeEditPoints
    const snapRadius = routeEditSnapPixelRadius.value
    const pts = routeEditPoints.value
    let snappedIndex = -1
    let snappedDist = Infinity
    pts.forEach((p, i) => {
      const c = localToLngLatCached(p)
      if (!c) return
      const dLng = c[0] - lnglat.lng
      const dLat = c[1] - lnglat.lat
      const d = Math.hypot(dLng, dLat)
      // 阈值用度数近似：0.3 px / (zoom * cos(lat) * 111319) → 用固定度数阈值 1e-5 (约 1.1m)
      if (d < 1e-5 && d < snappedDist) {
        snappedDist = d
        snappedIndex = i
      }
    })

    if (snappedIndex >= 0) {
      handleRouteEditPlaneClick({
        x: pts[snappedIndex].x,
        y: pts[snappedIndex].y,
        z,
        snappedIndex,
      })
    } else {
      handleRouteEditPlaneClick({
        x: local.x,
        y: local.y,
        z,
      })
    }
  }).catch(err => {
    console.error('route edit AMap click failed:', err)
  })
}

// localToLngLatCached 缓存 gnssOrigin 避免重复读取（renderRouteEditOnAMap 已加载 origin，可缓存）
let cachedLngLatOrigin: { latitude: number; longitude: number } | null = null
let cachedLngLatMapName: string | null = null
const localToLngLatCached = (p: { x: number; y: number }): [number, number] | null => {
  if (!cachedLngLatMapName || cachedLngLatMapName !== selectedNavMap.value) {
    return null
  }
  if (!cachedLngLatOrigin) return null
  const gps = convertLocalToGps(p.x, p.y, cachedLngLatOrigin)
  if (!gps) return null
  const gcj = transformWGS84ToGCJ02(gps.longitude, gps.latitude)
  return [gcj.longitude, gcj.latitude]
}

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
  { key: 'track_edit', label: '路线编辑', icon: trackEditIcon, permission: 'nav-trackrecord-show' },
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
const mapRefreshTabs = new Set(['nav', 'map_edit', 'track_record', 'track_edit', 'file_manage'])
const pointCloudTabs = new Set(['nav', 'track_record'])

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

  // 离开 track_edit 时若有未保存修改，先弹确认
  if (previousTab === 'track_edit' && key !== 'track_edit' && routeEditDirty.value) {
    const ok = window.confirm(ROUTE_EDIT_DIRTY_CONFIRM_MESSAGE)
    if (!ok) {
      return
    }
    resetRouteEditWorkspace()
  }

  currentTab.value = key
  
  // 如果离开导航/路线录制标签，清理点云图状态
  if (pointCloudTabs.has(previousTab) && !pointCloudTabs.has(key)) {
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

      // v-else-if 会重建 DOM，AMap 旧实例绑定的容器节点已失效，需要销毁重建
      if (navAmapInstance) {
        try { navAmapInstance.off('click', handleNavMapClickForRouteEdit) } catch (_) {}
        try { navAmapInstance.destroy() } catch (_) {}
        navAmapInstance = null
        navAmapApiRef = null
        navRobotMarker = null
        navOriginMapMarker = null
        navTrafficLayer = null
        navRobotTrajectoryPolyline.value = null
        navRobotTaskpointMarkers.value = []
        isNavAmapLoading = false
      }
      if (navViewType.value === 'map') {
        nextTick(() => { initNavAMap() })
      } else if (navViewType.value === 'grid') {
        nextTick(() => { drawNavGridMapCanvas() })
      }
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
  } else if (key === 'track_edit') {
    // track_edit 只支持 grid + map，进入时若处于 pointcloud 则强制改为 grid
    if (navViewType.value === 'pointcloud') {
      navViewType.value = 'grid'
    }
    nextTick(async () => {
      fetchTrackMapList()
      await fetchAllTrackList()
      loadRouteEditLocalLineList()
      if (trackEditMap.value && trackEditLine.value) {
        await loadTrackEditRoute()
      }
      // 根据当前视图加载 2D 视图
      if (navViewType.value === 'grid' && trackEditMap.value) {
        if (selectedNavMap.value !== trackEditMap.value) {
          selectedNavMap.value = trackEditMap.value
        }
        await loadAndDrawNavGridMap(trackEditMap.value)
      } else if (navViewType.value === 'map') {
        if (selectedNavMap.value !== trackEditMap.value && trackEditMap.value) {
          selectedNavMap.value = trackEditMap.value
        }
        if (!navAmapInstance) {
          initNavAMap()
        } else {
          void renderRouteEditOnAMap()
        }
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
  navPointCloudData.value = []
  baseNavPointCloudData.value = []
  navPointCloudError.value = ''
  navPointCloudLoading.value = false
  lastLoadedNavPointCloudMap.value = ''
  if (navCanvasEventController) {
    navCanvasEventController.abort()
    navCanvasEventController = null
  }
  if (navResizeObserver) {
    (navResizeObserver as ResizeObserver | null)?.disconnect()
    navResizeObserver = null
  }
}

// 自定义下拉选择框的打开状态与全局点击监听
const activeDropdown = ref<string | null>(null)
const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.custom-select-container')) {
    activeDropdown.value = null
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
    trackRecordTask.value = ''
    trackTaskList.value = []
    return
  }

  if (!trackRecordLine.value || !newLines.includes(trackRecordLine.value)) {
    trackRecordLine.value = newLines[0]
  }
})

// 任务组列表
const trackTaskList = ref<string[]>([])
let trackTaskListRequestToken = 0

watch(trackTaskList, (newTasks) => {
  if (currentTab.value !== 'track_record') return

  if (!trackRecordLine.value || newTasks.length === 0) {
    trackRecordTask.value = ''
    return
  }

  if (!trackRecordTask.value || !newTasks.includes(trackRecordTask.value)) {
    trackRecordTask.value = newTasks[0]
  }
})

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
  const requestToken = ++trackTaskListRequestToken

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

    if (requestToken !== trackTaskListRequestToken || newLine !== trackRecordLine.value) {
      return
    }
    
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
    if (requestToken !== trackTaskListRequestToken || newLine !== trackRecordLine.value) {
      return
    }
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
        const deletedTrackName = trackRecordLine.value
        await navigationApi.deleteTrack(robotId, {
          track_name: deletedTrackName
        })
        showSuccessMessage('删除成功')
        // 同步删除 IndexedDB 中的轨迹缓存文件
        await deleteTrajectoryFile(deletedTrackName)
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

// 路线编辑相关状态
type RouteEditPoint = {
  x: number
  y: number
  z: number
  theta?: number
  snappedIndex?: number
}

type RouteEditSnapshot = {
  points: RouteEditPoint[]
  breaks: number[]
  draftPoints: RouteEditPoint[]
  mode: 'view' | 'pick' | 'draw'
}

type RouteEditFileFormat = {
  headerLines: string[]
  delimiter: 'comma' | 'space'
  columnCount: 5 | 6
  tailValues: string[]
}

const ROUTE_EDIT_DIRTY_CONFIRM_MESSAGE = '离开路线编辑将丢弃当前未保存的修改，是否继续？'

const setRouteEditView = async (newType: 'grid' | 'map') => {
  if (currentTab.value !== 'track_edit') return
  if (navViewType.value === newType) return
  if (routeEditDirty.value) {
    const ok = window.confirm('切换地图将清空当前未保存的操作，是否继续？')
    if (!ok) return
  }
  resetRouteEditWorkspace()
  navViewType.value = newType
  // 确保地图列表已加载（selectedNavMap 可能为空）
  if (!selectedNavMap.value) {
    await fetchMapList()
  }
  if (newType === 'grid') {
    await loadAndDrawNavGridMap(trackEditMap.value)
    await nextTick()
    drawNavGridMapCanvas()
  } else if (newType === 'map') {
    await nextTick()
    if (!navAmapInstance) {
      initNavAMap()
    } else {
      void renderRouteEditOnAMap()
    }
  }
}

const MANUAL_ROUTE_EDIT_STORAGE_PREFIX = 'manual_route_edit_tracks'
const trackEditMap = computed({
  get: () => taskExecutionStore.selectedMapName,
  set: (v: string) => taskExecutionStore.setSelectedMapName(v)
})
const trackEditLine = ref('')
const routeEditMode = ref<'view' | 'pick' | 'draw'>('view')
const routeEditCreateMode = ref(false)
const routeEditPoints = ref<RouteEditPoint[]>([])
const routeEditOriginalPoints = ref<RouteEditPoint[]>([])
const routeEditBreaks = ref<number[]>([])
const routeEditOriginalBreaks = ref<number[]>([])
const routeEditDraftPoints = ref<RouteEditPoint[]>([])
const routeEditSelectionStart = ref(-1)
const routeEditSelectionEnd = ref(-1)
const routeEditLoading = ref(false)
const routeEditError = ref('')
const routeEditDirty = ref(false)
const routeEditFileFormat = ref<RouteEditFileFormat | null>(null)
const routeEditHistory = ref<RouteEditSnapshot[]>([])
const routeEditLocalLineList = ref<string[]>([])
const routeEditManualZ = ref(0)
const routeEditStep = ref(0.04)
const decreaseRouteEditStep = () => {
  if (routeEditStep.value > 0.01) {
    routeEditStep.value = Number((routeEditStep.value - 0.01).toFixed(2))
  }
}
const increaseRouteEditStep = () => {
  if (routeEditStep.value < 1.0) {
    routeEditStep.value = Number((routeEditStep.value + 0.01).toFixed(2))
  }
}
const routeEditUploading = ref(false)
const routeEditDrawType = ref<'line' | 'curve'>('line')
const routeEditCurveState = ref<'idle' | 'middle'>('idle')
const routeEditClickHistory = ref<{ pointsLen: number; curveState: 'idle' | 'middle' }[]>([])
const routeEditDraftClickHistory = ref<{ pointsLen: number; curveState: 'idle' | 'middle' }[]>([])
const setRouteEditDrawType = (type: 'line' | 'curve') => {
  routeEditDrawType.value = type
  routeEditCurveState.value = 'idle'
}
const routeEditCreateDialog = ref({
  visible: false,
  trackName: '',
  error: '',
})
let suppressTrackEditLineReset = false

const normalizeRouteEditZValue = (value: unknown) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Number(numericValue.toFixed(6))
}

const setRouteEditManualZ = (value: unknown) => {
  routeEditManualZ.value = normalizeRouteEditZValue(value)
}

const normalizeRouteEditManualZInput = () => {
  setRouteEditManualZ(routeEditManualZ.value)
}

const getRouteEditLocalTrackListKey = (mapName = trackEditMap.value) => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || 'default'
  return `${MANUAL_ROUTE_EDIT_STORAGE_PREFIX}_${robotId}_${mapName || 'empty'}`
}

const readRouteEditLocalLineList = (mapName = trackEditMap.value) => {
  try {
    const raw = localStorage.getItem(getRouteEditLocalTrackListKey(mapName))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.map(item => String(item || '').trim()).filter(Boolean)
      : []
  } catch {
    return []
  }
}

const loadRouteEditLocalLineList = (mapName = trackEditMap.value) => {
  routeEditLocalLineList.value = readRouteEditLocalLineList(mapName)
}

const saveRouteEditLocalLineList = (list: string[], mapName = trackEditMap.value) => {
  const normalizedList = Array.from(new Set(list.map(item => String(item || '').trim()).filter(Boolean)))
  routeEditLocalLineList.value = normalizedList
  localStorage.setItem(getRouteEditLocalTrackListKey(mapName), JSON.stringify(normalizedList))
}

const trackEditLineList = computed(() => {
  if (!trackEditMap.value) return []

  const routeNames = allTrackList.value
    .filter(track => track.startsWith(trackEditMap.value + '_'))
    .map(track => normalizeTrackName(String(track || '')))
    .filter(Boolean)
  const localRouteNames = routeEditLocalLineList.value
    .filter(track => track.startsWith(trackEditMap.value + '_'))
    .map(track => normalizeTrackName(String(track || '')))
    .filter(Boolean)
  return Array.from(new Set([...routeNames, ...localRouteNames]))
})

const routeEditHasRoute = computed(() => routeEditPoints.value.length > 0)
const routeEditCanDraw = computed(() => routeEditHasRoute.value || routeEditCreateMode.value)
const canUndoRouteEdit = computed(() => routeEditHistory.value.length > 0 || routeEditDraftPoints.value.length > 0)
const routeEditIsClosedLoop = computed(() => {
  if (routeEditPoints.value.length < 3) return false
  const first = routeEditPoints.value[0]
  const last = routeEditPoints.value[routeEditPoints.value.length - 1]
  if (!first || !last) return false
  return Math.hypot(first.x - last.x, first.y - last.y, first.z - last.z) < 1e-5
})
const routeEditDrawHint = computed(() => {
  if (routeEditCreateMode.value) {
    return '点击栅格图地面按顺序绘制路线，靠近已绘制点时小范围吸附用于收尾闭环'
  }
  return '点击栅格图地面添加重绘点，靠近端点时小范围吸附'
})
const routeEditSnapPixelRadius = computed(() => routeEditCreateMode.value ? 16 : 14)
const routeEditSnapPriorityIndex = computed(() => (
  routeEditCreateMode.value && routeEditPoints.value.length >= 3 ? 0 : null
))
const canSubmitRouteEditCreate = computed(() => routeEditCreateMode.value && routeEditPoints.value.length >= 2)
const routeEditCanUpload = computed(() => (
  !routeEditCreateMode.value &&
  routeEditHasRoute.value &&
  !!trackEditMap.value &&
  !!trackEditLine.value &&
  routeEditBreaks.value.length === 0 &&
  routeEditDraftPoints.value.length === 0
))

const cloneRouteEditPoints = (points: RouteEditPoint[]) => points.map(point => ({ ...point }))
const cloneRouteEditPoint = (point: RouteEditPoint): RouteEditPoint => ({ ...point })
const cloneRouteEditBreaks = (breaks: number[]) => Array.from(new Set(breaks))
  .filter(index => Number.isInteger(index) && index >= 0)
  .sort((a, b) => a - b)

const isValidRouteEditIndex = (value: number) => (
  Number.isInteger(value) && value >= 0 && value < routeEditPoints.value.length
)

const getRouteEditSelectionRange = () => {
  if (!isValidRouteEditIndex(routeEditSelectionStart.value) || !isValidRouteEditIndex(routeEditSelectionEnd.value)) {
    return null
  }
  const start = Math.min(routeEditSelectionStart.value, routeEditSelectionEnd.value)
  const end = Math.max(routeEditSelectionStart.value, routeEditSelectionEnd.value)
  return { start, end }
}

const routeEditHasSelection = computed(() => !!getRouteEditSelectionRange())
const routeEditHasDeletableSelection = computed(() => {
  const range = getRouteEditSelectionRange()
  return !!range && range.start !== range.end
})
const routeEditSelectedRangeForPreview = computed(() => {
  const range = getRouteEditSelectionRange()
  if (range) return range
  if (isValidRouteEditIndex(routeEditSelectionStart.value)) {
    return { start: routeEditSelectionStart.value, end: routeEditSelectionStart.value }
  }
  return null
})

const getRouteEditFallbackDrawPlaneRawZ = () => {
  const range = getRouteEditSelectionRange()
  if (range) {
    const start = routeEditPoints.value[range.start]
    const end = routeEditPoints.value[range.end]
    return ((start?.z ?? 0) + (end?.z ?? 0)) / 2
  }
  const lastDraft = routeEditDraftPoints.value[routeEditDraftPoints.value.length - 1]
  if (lastDraft) return lastDraft.z
  const firstPoint = routeEditPoints.value[0]
  return firstPoint?.z ?? 0
}

const getRouteEditDrawPlaneRawZ = () => normalizeRouteEditZValue(routeEditManualZ.value)

const routeEditInteractionPlaneZ = computed(() => {
  const { centerZ, maxRange } = navPointCloudNormalizationParams.value
  if (!Number.isFinite(maxRange) || maxRange <= 1e-6) return 0
  return (getRouteEditDrawPlaneRawZ() - centerZ) / maxRange
})

const normalizeRouteEditPointsForPreview = (points: RouteEditPoint[], intensity: number) => {
  const { centerX, centerY, centerZ, maxRange } = navPointCloudNormalizationParams.value
  if (!Number.isFinite(maxRange) || maxRange <= 1e-6) return []
  return points.map(point => ({
    x: (point.x - centerX) / maxRange,
    y: (point.y - centerY) / maxRange,
    z: (point.z - centerZ) / maxRange,
    intensity
  }))
}

const routeEditPreviewPoints = computed(() => normalizeRouteEditPointsForPreview(routeEditPoints.value, 2.0))
const routeEditDraftPreviewPoints = computed(() => normalizeRouteEditPointsForPreview(routeEditDraftPoints.value, 2.2))
const routeEditDrawPointMarkers = computed(() => (
  routeEditCreateMode.value ? routeEditPreviewPoints.value : routeEditDraftPreviewPoints.value
))
const canApplyRouteEditDraft = computed(() => !routeEditCreateMode.value && routeEditHasRoute.value && routeEditDraftPoints.value.length >= 2)

// 监听 routeEdit 状态变化 → 触发栅格图 + AMap 重绘（仅在 track_edit tab 下）
// 监控点：routeEditPoints 数组（每次替换引用都会触发）、draft 数组、选段 index、breaks
// 不直接返回数组本身以避免在 watch 中序列化大对象
let lastRouteEditPointsLen = 0
let lastRouteEditPointsFirstLast = ''
let lastRouteEditDraftLen = 0
let lastRouteEditDraftFirstLast = ''
let routeEditRenderScheduled = false

const triggerRouteEditOverlayRender = () => {
  if (currentTab.value !== 'track_edit') return
  if (routeEditRenderScheduled) return
  routeEditRenderScheduled = true
  nextTick(() => {
    routeEditRenderScheduled = false
    if (navViewType.value === 'grid') {
      drawNavGridMapCanvas()
    } else if (navViewType.value === 'map') {
      void renderRouteEditOnAMap()
    }
  })
}

watch(
  () => routeEditPoints.value,
  (pts) => {
    if (!pts.length) {
      if (lastRouteEditPointsLen === 0) return
      lastRouteEditPointsLen = 0
      lastRouteEditPointsFirstLast = ''
      triggerRouteEditOverlayRender()
      return
    }
    const first = pts[0]
    const last = pts[pts.length - 1]
    const sig = `${pts.length}:${first.x.toFixed(4)},${first.y.toFixed(4)},${first.z.toFixed(4)}|${last.x.toFixed(4)},${last.y.toFixed(4)},${last.z.toFixed(4)}`
    if (sig === lastRouteEditPointsFirstLast) return
    lastRouteEditPointsLen = pts.length
    lastRouteEditPointsFirstLast = sig
    triggerRouteEditOverlayRender()
  }
)

watch(
  () => routeEditDraftPoints.value,
  (pts) => {
    if (!pts.length) {
      if (lastRouteEditDraftLen === 0) return
      lastRouteEditDraftLen = 0
      lastRouteEditDraftFirstLast = ''
      triggerRouteEditOverlayRender()
      return
    }
    const first = pts[0]
    const last = pts[pts.length - 1]
    const sig = `${pts.length}:${first.x.toFixed(4)},${first.y.toFixed(4)},${first.z.toFixed(4)}|${last.x.toFixed(4)},${last.y.toFixed(4)},${last.z.toFixed(4)}`
    if (sig === lastRouteEditDraftFirstLast) return
    lastRouteEditDraftLen = pts.length
    lastRouteEditDraftFirstLast = sig
    triggerRouteEditOverlayRender()
  }
)

watch(
  () => [routeEditSelectionStart.value, routeEditSelectionEnd.value, routeEditBreaks.value.length],
  () => {
    triggerRouteEditOverlayRender()
  }
)

const setRouteEditMode = (mode: 'view' | 'pick' | 'draw') => {
  if (routeEditCreateMode.value && mode !== 'draw') return
  routeEditMode.value = mode
}

const resetRouteEditWorkspace = () => {
  routeEditMode.value = 'view'
  routeEditCreateMode.value = false
  routeEditPoints.value = []
  routeEditOriginalPoints.value = []
  routeEditBreaks.value = []
  routeEditOriginalBreaks.value = []
  routeEditDraftPoints.value = []
  routeEditSelectionStart.value = -1
  routeEditSelectionEnd.value = -1
  routeEditError.value = ''
  routeEditDirty.value = false
  routeEditFileFormat.value = null
  routeEditHistory.value = []
  setRouteEditManualZ(0)
  routeEditCreateDialog.value.visible = false
  routeEditCreateDialog.value.error = ''
  routeEditDrawType.value = 'line'
  routeEditCurveState.value = 'idle'
  routeEditClickHistory.value = []
  routeEditDraftClickHistory.value = []
  if (baseNavPointCloudData.value.length > 0) {
    navPointCloudData.value = [...baseNavPointCloudData.value]
  }
}

const createDefaultRouteEditFileFormat = (): RouteEditFileFormat => ({
  headerLines: [],
  delimiter: 'space',
  columnCount: 6,
  tailValues: ['0'],
})

const parseEditableTrajectoryText = (text: string): { points: RouteEditPoint[]; format: RouteEditFileFormat } => {
  const lines = text.split(/\r?\n/)
  const points: RouteEditPoint[] = []
  const headerLines: string[] = []
  let format: RouteEditFileFormat | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) {
      headerLines.push(line)
      continue
    }

    const delimiter: 'comma' | 'space' = trimmed.includes(',') ? 'comma' : 'space'
    const parts = delimiter === 'comma' ? trimmed.split(',').map(part => part.trim()) : trimmed.split(/\s+/)
    const columnCount = parts.length === 6 ? 6 : parts.length === 5 ? 5 : 0
    if (!columnCount) {
      headerLines.push(line)
      continue
    }

    const x = Number(parts[1])
    const y = Number(parts[2])
    const z = columnCount === 6 ? Number(parts[3]) : 0
    const rawTheta = columnCount === 6 ? Number(parts[4]) : Number(parts[3])
    const theta = Number.isFinite(rawTheta) ? rawTheta : undefined

    if (![x, y, z].every(Number.isFinite)) {
      headerLines.push(line)
      continue
    }

    points.push({ x, y, z, theta })
    if (!format) {
      const tailSlice = columnCount === 6 ? parts.slice(5) : parts.slice(4)
      format = {
        headerLines,
        delimiter,
        columnCount,
        tailValues: tailSlice.length ? tailSlice : ['0'],
      }
    }
  }

  return {
    points,
    format: format || {
      headerLines,
      delimiter: 'space',
      columnCount: 6,
      tailValues: ['0'],
    }
  }
}

const formatRouteEditNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0'
  return Number(value.toFixed(6)).toString()
}

const generateCircularArcPoints = (
  p1: RouteEditPoint,
  p2: RouteEditPoint,
  p3: RouteEditPoint,
  step: number
): RouteEditPoint[] => {
  const x1 = p1.x, y1 = p1.y
  const x2 = p2.x, y2 = p2.y
  const x3 = p3.x, y3 = p3.y

  const a1 = 2 * (x2 - x1)
  const b1 = 2 * (y2 - y1)
  const c1 = (x2 * x2 + y2 * y2) - (x1 * x1 + y1 * y1)

  const a2 = 2 * (x3 - x2)
  const b2 = 2 * (y3 - y2)
  const c2 = (x3 * x3 + y3 * y3) - (x2 * x2 + y2 * y2)

  const det = a1 * b2 - a2 * b1

  if (Math.abs(det) < 1e-6) {
    return [p2]
  }

  const x0 = (c1 * b2 - c2 * b1) / det
  const y0 = (a1 * c2 - a2 * c1) / det
  const R = Math.hypot(x1 - x0, y1 - y0)

  const theta1 = Math.atan2(y1 - y0, x1 - x0)
  const theta2 = Math.atan2(y2 - y0, x2 - x0)
  const theta3 = Math.atan2(y3 - y0, x3 - x0)

  let diff2 = (theta2 - theta1) % (2 * Math.PI)
  if (diff2 < 0) diff2 += 2 * Math.PI

  let diff3 = (theta3 - theta1) % (2 * Math.PI)
  if (diff3 < 0) diff3 += 2 * Math.PI

  const isCCW = diff2 < diff3
  const deltaTheta = isCCW ? diff3 : (2 * Math.PI - diff3)

  const arcLength = R * deltaTheta

  if (arcLength <= 1e-6 || step <= 0) {
    return [p2]
  }

  const numSteps = Math.max(2, Math.ceil(arcLength / step))
  const result: RouteEditPoint[] = []

  for (let k = 1; k < numSteps; k++) {
    const ratio = k / numSteps
    const angle = isCCW
      ? theta1 + ratio * deltaTheta
      : theta1 - ratio * deltaTheta

    const px = x0 + R * Math.cos(angle)
    const py = y0 + R * Math.sin(angle)
    const pz = p1.z + ratio * (p3.z - p1.z)

    result.push({
      x: Number(px.toFixed(6)),
      y: Number(py.toFixed(6)),
      z: Number(pz.toFixed(6)),
    })
  }

  if (result.length === 0) {
    return [p2]
  }

  return result
}

const calculateRoutePointThetas = (points: RouteEditPoint[], breaks: number[] = []): RouteEditPoint[] => {
  if (points.length === 0) return []
  const breakSet = new Set(breaks)
  const result: RouteEditPoint[] = points.map(p => ({ ...p }))

  for (let i = 0; i < result.length; i++) {
    const isEndOfSegment = (i === result.length - 1) || breakSet.has(i)
    if (!isEndOfSegment) {
      const next = result[i + 1]
      const dx = next.x - result[i].x
      const dy = next.y - result[i].y
      if (Math.hypot(dx, dy) > 1e-6) {
        result[i].theta = Number(Math.atan2(dy, dx).toFixed(6))
      } else if (i > 0 && !breakSet.has(i - 1) && result[i - 1].theta !== undefined) {
        result[i].theta = result[i - 1].theta
      } else if (result[i].theta === undefined) {
        result[i].theta = 0
      }
    } else {
      if (i > 0 && !breakSet.has(i - 1) && result[i - 1].theta !== undefined) {
        result[i].theta = result[i - 1].theta
      } else if (result[i].theta === undefined) {
        result[i].theta = 0
      }
    }
  }

  return result
}

const interpolateRouteEditPointsList = (points: RouteEditPoint[], step: number): RouteEditPoint[] => {
  if (points.length < 2) return points
  const result: RouteEditPoint[] = []
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    // Add current point
    result.push({ ...p1 })
    
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const dz = p2.z - p1.z
    const dist = Math.hypot(dx, dy, dz)
    
    if (dist > step && step > 0) {
      const numSteps = Math.floor(dist / step)
      for (let j = 1; j <= numSteps; j++) {
        const curDist = j * step
        // Avoid adding a point extremely close to p2
        if (dist - curDist < 1e-4) {
          break
        }
        const ratio = curDist / dist
        
        let interpTheta = p1.theta
        if (p1.theta !== undefined && p2.theta !== undefined) {
          let diff = p2.theta - p1.theta
          while (diff > Math.PI) diff -= 2 * Math.PI
          while (diff < -Math.PI) diff += 2 * Math.PI
          interpTheta = Number((p1.theta + diff * ratio).toFixed(6))
        } else if (Math.hypot(dx, dy) > 1e-6) {
          interpTheta = Number(Math.atan2(dy, dx).toFixed(6))
        }

        result.push({
          x: p1.x + dx * ratio,
          y: p1.y + dy * ratio,
          z: p1.z + dz * ratio,
          theta: interpTheta,
        })
      }
    }
  }
  
  // Add the last point
  if (points.length > 0) {
    result.push({ ...points[points.length - 1] })
  }
  
  return result
}

const serializeRouteEditPoints = () => {
  const baseFormat = routeEditFileFormat.value || createDefaultRouteEditFileFormat()
  let interpolated = interpolateRouteEditPointsList(routeEditPoints.value, routeEditStep.value)
  interpolated = calculateRoutePointThetas(interpolated, routeEditBreaks.value)

  const shouldWriteZ = baseFormat.columnCount === 6 || interpolated.some(point => Math.abs(point.z) > 1e-9)
  const format = shouldWriteZ ? { ...baseFormat, columnCount: 6 as const } : baseFormat
  const separator = format.delimiter === 'comma' ? ',' : ' '
  const lines = [...format.headerLines]

  interpolated.forEach((point, index) => {
    const thetaStr = formatRouteEditNumber(point.theta ?? 0)
    const tailStr = format.tailValues.length ? format.tailValues : ['0']

    const core = format.columnCount === 6
      ? [String(index), formatRouteEditNumber(point.x), formatRouteEditNumber(point.y), formatRouteEditNumber(point.z), thetaStr, ...tailStr]
      : [String(index), formatRouteEditNumber(point.x), formatRouteEditNumber(point.y), thetaStr, ...tailStr]
    lines.push(core.join(separator))
  })
  return lines.join('\n') + '\n'
}

const applyRouteEditPreview = async () => {
  navPointCloudData.value = baseNavPointCloudData.value.length > 0 ? [...baseNavPointCloudData.value] : []
  isNavPreviewMode.value = true
  lastNavTrackOverlayKey.value = ''
  await nextTick()
  scheduleNavPointCloudRender()
}

const loadTrackEditRoute = async () => {
  if (!trackEditLine.value) {
    showErrorMessage('请先选择路线')
    return
  }
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    showErrorMessage('未选择机器人')
    return
  }

  routeEditLoading.value = true
  routeEditError.value = ''
  try {
    routeEditCreateMode.value = false
    routeEditCreateDialog.value.visible = false
    if (trackEditMap.value) {
      await refreshNavPointCloud(trackEditMap.value, { silent: true })
    }

    let blob = await getTrajectoryFile(trackEditLine.value)
    if (!blob) {
      blob = await mapFileApi.downloadTrajectoryFile(robotId, trackEditLine.value)
      if (blob) await saveTrajectoryFile(trackEditLine.value, blob)
    }
    if (!blob) throw new Error('未找到轨迹文件')

    const text = await blob.text()
    if (text.trim().startsWith('<') || text.includes('error_code')) {
      throw new Error('轨迹文件内容异常')
    }
    const parsed = parseEditableTrajectoryText(text)
    if (parsed.points.length < 2) {
      throw new Error('轨迹点数量不足，无法编辑')
    }

    routeEditPoints.value = cloneRouteEditPoints(parsed.points)
    routeEditOriginalPoints.value = cloneRouteEditPoints(parsed.points)
    routeEditBreaks.value = []
    routeEditOriginalBreaks.value = []
    routeEditFileFormat.value = parsed.format
    routeEditDraftPoints.value = []
    routeEditSelectionStart.value = -1
    routeEditSelectionEnd.value = -1
    routeEditHistory.value = []
    routeEditDirty.value = false
    routeEditMode.value = 'pick'
    setRouteEditManualZ(getRouteEditFallbackDrawPlaneRawZ())
    await applyRouteEditPreview()
    requestNavPointCloudRelayout()
    showSuccessMessage(`路线已加载：${parsed.points.length} 个轨迹点`)
  } catch (error) {
    console.error('加载可编辑路线失败:', error)
    routeEditError.value = (error as Error).message || '加载路线失败'
    showErrorMessage('加载路线失败: ' + routeEditError.value)
    resetRouteEditWorkspace()
  } finally {
    routeEditLoading.value = false
  }
}

const handleRouteEditTrajectoryPick = (payload: { index: number }) => {
  if (!routeEditHasRoute.value) return
  const index = payload.index
  if (!isValidRouteEditIndex(index)) return

  if (!isValidRouteEditIndex(routeEditSelectionStart.value) || isValidRouteEditIndex(routeEditSelectionEnd.value)) {
    routeEditSelectionStart.value = index
    routeEditSelectionEnd.value = -1
    return
  }

  routeEditSelectionEnd.value = index
}

const handleRouteEditPlaneClick = (payload: { x: number; y: number; z: number; snappedIndex?: number }) => {
  if (routeEditCreateMode.value) {
    const lastPointIndex = routeEditPoints.value.length - 1
    const lastPoint = routeEditPoints.value[lastPointIndex]
    if (
      Number.isInteger(payload.snappedIndex) &&
      Number.isInteger(lastPointIndex) &&
      payload.snappedIndex === lastPointIndex
    ) {
      return
    }
    if (
      lastPoint &&
      Math.hypot(lastPoint.x - payload.x, lastPoint.y - payload.y, lastPoint.z - payload.z) < 1e-6
    ) {
      return
    }

    routeEditClickHistory.value.push({
      pointsLen: routeEditPoints.value.length,
      curveState: routeEditCurveState.value
    })

    const newPt = {
      x: Number(payload.x.toFixed(6)),
      y: Number(payload.y.toFixed(6)),
      z: Number(payload.z.toFixed(6)),
      snappedIndex: payload.snappedIndex,
    }

    if (routeEditDrawType.value === 'curve' && routeEditPoints.value.length >= 2) {
      if (routeEditCurveState.value === 'idle') {
        routeEditPoints.value = [...routeEditPoints.value, newPt]
        routeEditCurveState.value = 'middle'
      } else {
        const p1 = routeEditPoints.value[routeEditPoints.value.length - 2]
        const p2 = routeEditPoints.value[routeEditPoints.value.length - 1]
        const p3 = newPt
        const arc = generateCircularArcPoints(p1, p2, p3, routeEditStep.value)
        routeEditPoints.value = [
          ...routeEditPoints.value.slice(0, -1),
          ...arc,
          p3
        ]
        routeEditCurveState.value = 'idle'
      }
    } else {
      routeEditPoints.value = [...routeEditPoints.value, newPt]
      routeEditCurveState.value = 'idle'
    }

    routeEditDirty.value = routeEditPoints.value.length > 0
    return
  }

  if (!routeEditHasRoute.value) return
  const lastDraft = routeEditDraftPoints.value[routeEditDraftPoints.value.length - 1]
  if (
    Number.isInteger(payload.snappedIndex) &&
    Number.isInteger(lastDraft?.snappedIndex) &&
    payload.snappedIndex === lastDraft?.snappedIndex
  ) {
    return
  }

  routeEditDraftClickHistory.value.push({
    pointsLen: routeEditDraftPoints.value.length,
    curveState: routeEditCurveState.value
  })

  const newPt = {
    x: Number(payload.x.toFixed(6)),
    y: Number(payload.y.toFixed(6)),
    z: Number(payload.z.toFixed(6)),
    snappedIndex: payload.snappedIndex,
  }

  if (routeEditDrawType.value === 'curve' && routeEditDraftPoints.value.length >= 2) {
    if (routeEditCurveState.value === 'idle') {
      routeEditDraftPoints.value = [...routeEditDraftPoints.value, newPt]
      routeEditCurveState.value = 'middle'
    } else {
      const p1 = routeEditDraftPoints.value[routeEditDraftPoints.value.length - 2]
      const p2 = routeEditDraftPoints.value[routeEditDraftPoints.value.length - 1]
      const p3 = newPt
      const arc = generateCircularArcPoints(p1, p2, p3, routeEditStep.value)
      routeEditDraftPoints.value = [
        ...routeEditDraftPoints.value.slice(0, -1),
        ...arc,
        p3
      ]
      routeEditCurveState.value = 'idle'
    }
  } else {
    routeEditDraftPoints.value = [...routeEditDraftPoints.value, newPt]
    routeEditCurveState.value = 'idle'
  }

  if (getRouteEditDraftSnappedEndpoints()) {
    void applyRouteEditDraft()
  }
}

const clearRouteEditSelection = () => {
  routeEditSelectionStart.value = -1
  routeEditSelectionEnd.value = -1
}

const pushRouteEditHistory = () => {
  routeEditHistory.value = [
    ...routeEditHistory.value.slice(-19),
    {
      points: cloneRouteEditPoints(routeEditPoints.value),
      breaks: cloneRouteEditBreaks(routeEditBreaks.value),
      draftPoints: cloneRouteEditPoints(routeEditDraftPoints.value),
      mode: routeEditMode.value,
    }
  ]
}

const setRouteEditFileColumnCount = (columnCount: 5 | 6) => {
  const baseFormat = routeEditFileFormat.value || createDefaultRouteEditFileFormat()
  routeEditFileFormat.value = {
    ...baseFormat,
    columnCount,
  }
}

const applyRouteEditManualZToAll = async () => {
  if (!routeEditHasRoute.value) {
    showErrorMessage('当前没有可修改的路线点')
    return
  }

  if (!routeEditCreateMode.value) {
    pushRouteEditHistory()
  }
  const nextZ = normalizeRouteEditZValue(routeEditManualZ.value)
  setRouteEditManualZ(nextZ)
  setRouteEditFileColumnCount(6)
  routeEditPoints.value = routeEditPoints.value.map(point => ({ ...point, z: nextZ }))
  routeEditDraftPoints.value = routeEditDraftPoints.value.map(point => ({ ...point, z: nextZ }))
  routeEditDirty.value = true
  await applyRouteEditPreview()
}

const confirmApplyRouteEditManualZToAll = () => {
  if (!routeEditHasRoute.value) {
    showErrorMessage('当前没有可修改的路线点')
    return
  }

  const nextZ = normalizeRouteEditZValue(routeEditManualZ.value)
  showConfirmDialog({
    title: '全局应用 Z',
    message: `确定将当前 Z 值应用到整条路线吗？\n\n路线：${trackEditLine.value || '未命名路线'}\nZ 值：${formatRouteEditNumber(nextZ)}\n\n该操作会覆盖当前路线所有点的 Z 值。`,
    confirmText: '确认应用',
    cancelText: '取消',
    type: 'warning',
    onConfirm: async () => {
      closeConfirmDialog()
      await applyRouteEditManualZToAll()
    },
    onCancel: () => {
      closeConfirmDialog()
    }
  })
}

const deleteRouteEditSelection = async () => {
  const range = getRouteEditSelectionRange()
  if (!range) {
    showErrorMessage('请先选择要删除的路线段')
    return
  }
  if (range.start === range.end) {
    showErrorMessage('请选择至少两个点形成路线段')
    return
  }

  pushRouteEditHistory()
  const removeInteriorCount = Math.max(0, range.end - range.start - 1)
  const nextPoints = [
    ...routeEditPoints.value.slice(0, range.start + 1),
    ...routeEditPoints.value.slice(range.end)
  ]
  const nextBreaks = routeEditBreaks.value
    .map(index => {
      if (index < range.start) return index
      if (index >= range.end) return index - removeInteriorCount
      return -1
    })
    .filter(index => index >= 0)

  if (range.start < nextPoints.length - 1) {
    nextBreaks.push(range.start)
  }

  routeEditPoints.value = nextPoints
  routeEditBreaks.value = cloneRouteEditBreaks(nextBreaks)
  routeEditDraftPoints.value = []
  clearRouteEditSelection()
  routeEditMode.value = 'draw'
  routeEditDirty.value = true
  await applyRouteEditPreview()
}

const enterRouteEditCreateMode = async () => {
  if (!trackEditMap.value) {
    showErrorMessage('请先选择地图')
    return
  }

  resetRouteEditWorkspace()
  suppressTrackEditLineReset = true
  trackEditLine.value = ''
  routeEditCreateMode.value = true
  routeEditMode.value = 'draw'
  routeEditFileFormat.value = createDefaultRouteEditFileFormat()
  routeEditDirty.value = false

  await refreshNavPointCloud(trackEditMap.value, { silent: true })
  await applyRouteEditPreview()
  requestNavPointCloudRelayout()
}

const startRouteEditCreate = () => {
  if (!trackEditMap.value) {
    showErrorMessage('请先选择地图')
    return
  }

  const hasUnsavedEdit = routeEditDirty.value || routeEditDraftPoints.value.length > 0 || routeEditBreaks.value.length > 0
  if (hasUnsavedEdit) {
    showConfirmDialog({
      title: '新增路线',
      message: '当前路线编辑内容会被清空，确定要开始新增路线吗？',
      confirmText: '确定',
      cancelText: '取消',
      type: 'warning',
      onConfirm: () => {
        closeConfirmDialog()
        void enterRouteEditCreateMode()
      },
      onCancel: () => {
        closeConfirmDialog()
      }
    })
    return
  }

  void enterRouteEditCreateMode()
}

const undoRouteEditCreatePoint = () => {
  if (!routeEditCreateMode.value) return
  if (routeEditClickHistory.value.length > 0) {
    const hist = routeEditClickHistory.value.pop()!
    routeEditPoints.value = routeEditPoints.value.slice(0, hist.pointsLen)
    routeEditCurveState.value = hist.curveState
  } else {
    routeEditPoints.value = routeEditPoints.value.slice(0, -1)
    routeEditCurveState.value = 'idle'
  }
  routeEditDirty.value = routeEditPoints.value.length > 0
}

const clearRouteEditCreatePoints = () => {
  if (!routeEditCreateMode.value) return
  routeEditPoints.value = []
  routeEditClickHistory.value = []
  routeEditCurveState.value = 'idle'
  routeEditDirty.value = false
}

const cancelRouteEditCreate = () => {
  if (!routeEditCreateMode.value) return
  if (routeEditPoints.value.length > 0) {
    showConfirmDialog({
      title: '取消新增',
      message: '当前手动绘制的路线会被清空，确定取消吗？',
      confirmText: '确定',
      cancelText: '取消',
      type: 'warning',
      onConfirm: () => {
        closeConfirmDialog()
        resetRouteEditWorkspace()
      },
      onCancel: () => {
        closeConfirmDialog()
      }
    })
    return
  }
  resetRouteEditWorkspace()
}

const openRouteEditCreateDialog = () => {
  if (!canSubmitRouteEditCreate.value) {
    showErrorMessage('请至少绘制两个路线点')
    return
  }
  routeEditCreateDialog.value = {
    visible: true,
    trackName: '',
    error: '',
  }
}

const cancelRouteEditCreateDialog = () => {
  routeEditCreateDialog.value.visible = false
  routeEditCreateDialog.value.error = ''
}

const appendRouteEditLocalTrack = (trackName: string) => {
  const mapName = trackEditMap.value
  if (!mapName) return
  saveRouteEditLocalLineList([...routeEditLocalLineList.value, trackName], mapName)
  allTrackList.value = Array.from(new Set([...allTrackList.value, trackName]))
}

const confirmRouteEditCreate = async () => {
  if (!routeEditCreateMode.value) return
  if (routeEditPoints.value.length < 2) {
    routeEditCreateDialog.value.error = '请至少绘制两个路线点'
    return
  }
  const rawName = routeEditCreateDialog.value.trackName.trim()
  if (!rawName) {
    routeEditCreateDialog.value.error = '请输入路线名称'
    return
  }
  if (!trackEditMap.value) {
    routeEditCreateDialog.value.error = '请先选择地图'
    return
  }

  const fullTrackName = rawName.startsWith(`${trackEditMap.value}_`)
    ? rawName
    : `${trackEditMap.value}_${rawName}`
  const existingNames = new Set(trackEditLineList.value.map(item => normalizeTrackName(String(item || ''))))
  if (existingNames.has(normalizeTrackName(fullTrackName))) {
    routeEditCreateDialog.value.error = `路线名称已存在：${fullTrackName}`
    return
  }

  routeEditFileFormat.value = routeEditFileFormat.value || createDefaultRouteEditFileFormat()
  routeEditBreaks.value = []
  const text = serializeRouteEditPoints()
  const blob = new Blob([text], { type: 'text/plain' })

  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    routeEditCreateDialog.value.error = '未选择机器人，无法保存路线'
    return
  }

  try {
    showSuccessMessage('正在上传路线文件...')
    const uploadSuccess = await mapFileApi.uploadTrajectoryFile(robotId, fullTrackName, blob)
    if (!uploadSuccess) {
      throw new Error('上传到服务器失败')
    }

    const downloadedBlob = await mapFileApi.downloadTrajectoryFile(robotId, fullTrackName, true)
    if (!downloadedBlob) {
      throw new Error('从服务器下载验证失败')
    }

    await saveTrajectoryFile(fullTrackName, downloadedBlob)
    appendRouteEditLocalTrack(fullTrackName)
    routeEditOriginalPoints.value = cloneRouteEditPoints(routeEditPoints.value)
    routeEditOriginalBreaks.value = []
    routeEditCreateMode.value = false
    routeEditMode.value = 'pick'
    routeEditDirty.value = false
    routeEditCreateDialog.value.visible = false
    routeEditCreateDialog.value.error = ''
    suppressTrackEditLineReset = true
    trackEditLine.value = fullTrackName
    await applyRouteEditPreview()
    showSuccessMessage('新增路线已创建')
  } catch (error) {
    console.error('新增路线失败:', error)
    routeEditCreateDialog.value.error = '新增路线失败: ' + (error as Error).message
  }
}

const remapRouteEditBreaksAfterReplace = (
  breaks: number[],
  start: number,
  end: number,
  insertedInteriorCount: number
) => {
  const removedInteriorCount = Math.max(0, end - start - 1)
  const diff = insertedInteriorCount - removedInteriorCount
  return cloneRouteEditBreaks(
    breaks
      .map(index => {
        if (index < start) return index
        if (index >= end) return index + diff
        return -1
      })
      .filter(index => index >= 0)
  )
}

const getRouteEditDraftSnappedEndpoints = () => {
  const first = routeEditDraftPoints.value[0]
  const last = routeEditDraftPoints.value[routeEditDraftPoints.value.length - 1]
  const firstIndex = Number(first?.snappedIndex)
  const lastIndex = Number(last?.snappedIndex)
  if (!isValidRouteEditIndex(firstIndex) || !isValidRouteEditIndex(lastIndex) || firstIndex === lastIndex) {
    return null
  }

  const reversed = firstIndex > lastIndex
  return {
    start: Math.min(firstIndex, lastIndex),
    end: Math.max(firstIndex, lastIndex),
    draft: reversed
      ? cloneRouteEditPoints(routeEditDraftPoints.value).reverse()
      : cloneRouteEditPoints(routeEditDraftPoints.value),
  }
}

const applyRouteEditDraft = async () => {
  if (!canApplyRouteEditDraft.value) return

  pushRouteEditHistory()
  const snappedEndpoints = getRouteEditDraftSnappedEndpoints()
  const selectedRange = getRouteEditSelectionRange()

  if (snappedEndpoints) {
    const interiorDraft = snappedEndpoints.draft.slice(1, -1).map(point => ({
      x: point.x,
      y: point.y,
      z: point.z,
    }))
    routeEditPoints.value = [
      ...routeEditPoints.value.slice(0, snappedEndpoints.start + 1),
      ...interiorDraft,
      ...routeEditPoints.value.slice(snappedEndpoints.end)
    ]
    routeEditBreaks.value = remapRouteEditBreaksAfterReplace(
      routeEditBreaks.value,
      snappedEndpoints.start,
      snappedEndpoints.end,
      interiorDraft.length
    )
  } else if (selectedRange) {
    const draft = cloneRouteEditPoints(routeEditDraftPoints.value).map(point => ({
      x: point.x,
      y: point.y,
      z: point.z,
    }))
    routeEditPoints.value = [
      ...routeEditPoints.value.slice(0, selectedRange.start + 1),
      ...draft,
      ...routeEditPoints.value.slice(selectedRange.end)
    ]
    routeEditBreaks.value = remapRouteEditBreaksAfterReplace(
      routeEditBreaks.value,
      selectedRange.start,
      selectedRange.end,
      draft.length
    )
  } else if (routeEditBreaks.value.length > 0) {
    routeEditHistory.value = routeEditHistory.value.slice(0, -1)
    showErrorMessage('当前存在断点，请从断点一端开始绘制并吸附到另一端后再应用')
    return
  } else {
    const draft = cloneRouteEditPoints(routeEditDraftPoints.value).map(point => ({
      x: point.x,
      y: point.y,
      z: point.z,
    }))
    routeEditPoints.value = [...routeEditPoints.value, ...draft]
  }

  routeEditDraftPoints.value = []
  routeEditDraftClickHistory.value = []
  routeEditCurveState.value = 'idle'
  clearRouteEditSelection()
  routeEditDirty.value = true
  routeEditMode.value = 'pick'
  await applyRouteEditPreview()
}

// 二次贝塞尔曲线插值（p0 起点、p1 控制点、p2 终点）
// 生成的点之间间隔沿弧长近似均匀；不包含起点（避免重复），包含终点
const generateBezierCurvePoints = (
  p0: { x: number; y: number; z: number },
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number },
  segments: number
) => {
  const samples: Array<{ x: number; y: number; z: number }> = []
  const n = Math.max(2, Math.floor(segments))
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x
    const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    const z = u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z
    samples.push({
      x: Number(x.toFixed(6)),
      y: Number(y.toFixed(6)),
      z: Number(z.toFixed(6)),
    })
  }
  return samples
}

const undoRouteEditOperation = async () => {
  if (routeEditDraftPoints.value.length > 0) {
    if (routeEditDraftClickHistory.value.length > 0) {
      const hist = routeEditDraftClickHistory.value.pop()!
      routeEditDraftPoints.value = routeEditDraftPoints.value.slice(0, hist.pointsLen)
      routeEditCurveState.value = hist.curveState
    } else {
      routeEditDraftPoints.value = routeEditDraftPoints.value.slice(0, -1)
      routeEditCurveState.value = 'idle'
    }
    await applyRouteEditPreview()
    return
  }

  const previous = routeEditHistory.value[routeEditHistory.value.length - 1]
  if (!previous) return
  routeEditHistory.value = routeEditHistory.value.slice(0, -1)
  routeEditPoints.value = cloneRouteEditPoints(previous.points)
  routeEditBreaks.value = cloneRouteEditBreaks(previous.breaks)
  routeEditDraftPoints.value = cloneRouteEditPoints(previous.draftPoints || [])
  routeEditMode.value = previous.mode || 'pick'
  routeEditDirty.value = true
  clearRouteEditSelection()
  await applyRouteEditPreview()
}

const resetRouteEditRoute = async () => {
  if (!routeEditOriginalPoints.value.length) return
  routeEditPoints.value = cloneRouteEditPoints(routeEditOriginalPoints.value)
  routeEditBreaks.value = cloneRouteEditBreaks(routeEditOriginalBreaks.value)
  routeEditDraftPoints.value = []
  clearRouteEditSelection()
  routeEditHistory.value = []
  routeEditDirty.value = false
  await applyRouteEditPreview()
}

const getRouteEditSelectedTrackName = () => normalizeTrackName(String(trackEditLine.value || ''))
const getRouteEditUploadTrackName = () => getRouteEditSelectedTrackName().replace(/\.txt$/i, '')
const getRouteEditUploadFileName = () => {
  const trackName = getRouteEditUploadTrackName()
  return trackName ? `${trackName}.txt` : ''
}
const getRouteEditUploadDisplayPath = (mapName = trackEditMap.value) => `/dxr_data/trajectory/${mapName || ''}`

const uploadRouteEditRoute = async () => {
  if (routeEditUploading.value) return
  if (!routeEditHasRoute.value) {
    showErrorMessage('当前没有可上传的路线')
    return
  }
  if (routeEditCreateMode.value) {
    showErrorMessage('新增路线请先提交后再上传')
    return
  }
  if (routeEditDraftPoints.value.length > 0) {
    showErrorMessage('当前有未完成的绘制点，请先完成连接后再上传')
    return
  }
  if (routeEditBreaks.value.length > 0) {
    showErrorMessage('当前路线仍有断点，请先补齐后再上传')
    return
  }

  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    showErrorMessage('未选择机器人，无法上传路线')
    return
  }
  const mapName = normalizeMapName(trackEditMap.value)
  const trackName = getRouteEditUploadTrackName()
  const fileName = getRouteEditUploadFileName()
  if (!mapName || !trackName || !fileName) {
    showErrorMessage('请先选择地图和路线')
    return
  }

  routeEditUploading.value = true
  try {
    const text = serializeRouteEditPoints()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })

    showSuccessMessage('正在上传路线文件...')
    const uploadSuccess = await mapFileApi.uploadTrajectoryFile(robotId, trackName, blob)
    if (!uploadSuccess) {
      throw new Error('上传到服务器失败')
    }

    showSuccessMessage('正在从服务器下载验证...')
    const downloadedBlob = await mapFileApi.downloadTrajectoryFile(robotId, trackName, true)
    if (!downloadedBlob) {
      throw new Error('从服务器下载验证失败')
    }

    if (downloadedBlob.size !== blob.size) {
      console.warn(`轨迹文件大小不一致（可能被服务端规范化）: 原始=${blob.size}, 下载=${downloadedBlob.size}`)
    }

    await saveTrajectoryFile(getRouteEditSelectedTrackName(), downloadedBlob)
    routeEditOriginalPoints.value = cloneRouteEditPoints(routeEditPoints.value)
    routeEditOriginalBreaks.value = cloneRouteEditBreaks(routeEditBreaks.value)
    routeEditHistory.value = []
    routeEditDirty.value = false
    showSuccessMessage('路线上传成功')
  } catch (error) {
    console.error('上传路线失败:', error)
    showErrorMessage('上传路线失败: ' + (error as Error).message)
  } finally {
    routeEditUploading.value = false
  }
}

const confirmUploadRouteEditRoute = () => {
  if (!routeEditCanUpload.value) {
    if (routeEditDraftPoints.value.length > 0) {
      showErrorMessage('当前有未完成的绘制点，请先完成连接后再上传')
      return
    }
    if (routeEditBreaks.value.length > 0) {
      showErrorMessage('当前路线仍有断点，请先补齐后再上传')
      return
    }
    showErrorMessage('当前没有可上传的路线')
    return
  }

  showConfirmDialog({
    title: '上传路线',
    message: '是否确认上传当前路线？',
    confirmText: '确认上传',
    cancelText: '取消',
    type: 'warning',
    onConfirm: async () => {
      closeConfirmDialog()
      await uploadRouteEditRoute()
    },
    onCancel: () => {
      closeConfirmDialog()
    }
  })
}

watch(trackEditLineList, (newLines) => {
  if (currentTab.value !== 'track_edit') return
  if (routeEditCreateMode.value) return
  if (newLines.length === 0) {
    trackEditLine.value = ''
    resetRouteEditWorkspace()
    return
  }
  if (trackEditLine.value && !newLines.includes(trackEditLine.value)) {
    trackEditLine.value = ''
    resetRouteEditWorkspace()
  }
})

watch(trackEditMap, async (newMap) => {
  if (currentTab.value !== 'track_edit') return
  resetRouteEditWorkspace()
  loadRouteEditLocalLineList(newMap)
  trackEditLine.value = ''
  if (!newMap) {
    return
  }
  await refreshNavPointCloud(newMap, { silent: true })
  await fetchAllTrackList()
})

watch(trackEditLine, () => {
  if (currentTab.value !== 'track_edit') return
  if (suppressTrackEditLineReset) {
    suppressTrackEditLineReset = false
    return
  }
  if (routeEditCreateMode.value) return
  resetRouteEditWorkspace()
})

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
const navData = ref<{
  w: string | number
  v: string
  x: number
  y: number
  z: number
  theta: number
  brake: number
  lidar: string
  imu: string
  satellite: string
  msfStatus: string
  insOrigin: string
}>({
  w: '0.00',
  v: '0.00 m/s',
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
const selectedVehicleType = computed(() => {
  return deviceStore.selectedRobot?.robot_type || localStorage.getItem('selected_vehicle_type') || 'dog'
})

// 格式化/同步 W 角速度与 V 线速度数据（来自 speed_status 中的 w 与 v，参考首页当前速度数据逻辑）
const syncNavSpeedData = () => {
  // 1. W 角速度（来自 speed_status w）
  const rawW = robotStore.speedStatus?.w
  if (typeof rawW === 'number' && Number.isFinite(rawW)) {
    const normalizedW = Math.abs(rawW) < 0.005 ? 0 : rawW
    navData.value.w = normalizedW.toFixed(2)
  } else {
    navData.value.w = '0.00'
  }

  // 2. V 线速度（来自 speed_status v，参考 Home.vue 首页逻辑）
  if (selectedVehicleType.value === 'four_wheel') {
    const rawV = robotStore.speedStatus?.v
    if (typeof rawV === 'number' && Number.isFinite(rawV)) {
      const normalizedV = Math.abs(rawV) < 0.005 ? 0 : rawV
      navData.value.v = `${normalizedV.toFixed(2)} m/s`
    } else {
      navData.value.v = '--'
    }
    return
  }

  // 非四轮底盘（如机器狗）：优先使用 speed_status.v，若无则备选使用 motionState leg_odom_vel
  const rawV = robotStore.speedStatus?.v
  if (typeof rawV === 'number' && Number.isFinite(rawV)) {
    const normalizedV = Math.abs(rawV) < 0.005 ? 0 : rawV
    navData.value.v = `${normalizedV.toFixed(2)} m/s`
  } else {
    const velocity = robotStore.motionState?.leg_odom_vel
    const vx = Array.isArray(velocity) ? velocity[0] : undefined
    if (typeof vx === 'number' && Number.isFinite(vx)) {
      const normalizedVx = Math.abs(vx) < 0.005 ? 0 : vx
      navData.value.v = `${normalizedVx.toFixed(2)} m/s`
    } else {
      navData.value.v = '--'
    }
  }
}

watch(
  [() => robotStore.speedStatus, () => robotStore.motionState, selectedVehicleType],
  () => {
    syncNavSpeedData()
  },
  { immediate: true, deep: true }
)
const hasRobotRtk = computed(() => {
  const robot = deviceStore.selectedRobot as any
  const extraRaw = robot?.extra_data ?? null
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
const selectedObsMode = ref(1) // 0: 无避障, 1: 停障模式, 2: 绕障模式
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

const msfModeDialogVisible = ref(false)
const selectedMsfMode = ref<number>(3)
const msfModeSubmitting = ref(false)

const confirmMsfModeDialog = async () => {
  try {
    msfModeSubmitting.value = true
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }

    await navigationApi.msfControl(robotId, {
      action: 1,
      mode: selectedMsfMode.value,
      session: selectedNavMap.value
    })
    showSuccessMessage('开启MSF成功')
    msfModeDialogVisible.value = false
  } catch (err) {
    console.error('开启MSF失败:', err)
    showErrorMessage('开启MSF失败')
  } finally {
    msfModeSubmitting.value = false
  }
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

  if (msfEnabled.value) {
    showConfirmDialog({
      title: '关闭MSF',
      message: '确定要关闭MSF吗？',
      onConfirm: async () => {
        try {
          const robotId = deviceStore.selectedRobotId
          if (!robotId) {
            showErrorMessage('未选择机器人')
            return
          }

          await navigationApi.msfControl(robotId, {
            action: 0,
            mode: 3,
            session: selectedNavMap.value
          })
          showSuccessMessage('关闭MSF成功')
        } catch (err) {
          console.error('关闭MSF失败:', err)
          showErrorMessage('关闭MSF失败')
        }
      }
    })
  } else {
    selectedMsfMode.value = 3
    msfModeDialogVisible.value = true
  }
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

    const modeNames = ['无避障', '停障模式', '绕障模式']
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
        trackEditLine.value = ''
        resetRouteEditWorkspace()
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
      trackEditLine.value = ''
      resetRouteEditWorkspace()
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
    trackMapList.value = []
    taskExecutionStore.setSelectedMapName('')
    trackRecordLine.value = ''
    trackRecordTask.value = ''
    trackTaskList.value = []
    trackEditLine.value = ''
    resetRouteEditWorkspace()
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

        await downloadMapFiles(selectedNavMap.value)
        navPointCloudNavigationOrigin.value = await loadNavMapNavigationOrigin(selectedNavMap.value)
        window.dispatchEvent(new CustomEvent('navigation-origin-updated', {
          detail: { mapName: selectedNavMap.value, robotId }
        }))

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
  if (taskSpeed.value <= MIN_TASK_SPEED) {
    showErrorMessage(`已是最小速度（${MIN_TASK_SPEED} m/s），无法继续减小`)
    return
  }
  const previousSpeed = taskSpeed.value
  const nextSpeed = Math.round((taskSpeed.value - 0.1) * 10) / 10
  taskSpeed.value = Math.max(nextSpeed, MIN_TASK_SPEED)
  await submitTaskSpeed(previousSpeed)
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
  if (taskSpeed.value >= MAX_TASK_SPEED) {
    showErrorMessage(`已是最大速度（${MAX_TASK_SPEED} m/s），无法继续增大`)
    return
  }
  const previousSpeed = taskSpeed.value
  const nextSpeed = Math.round((taskSpeed.value + 0.1) * 10) / 10
  taskSpeed.value = Math.min(nextSpeed, MAX_TASK_SPEED)
  await submitTaskSpeed(previousSpeed)
}

// 导航点云图相关
// ===================== 点云图（复用 composable）=====================
const navPc = usePointCloudRenderer({ initialScale: 0.5, initialPointSize: 0.5 })
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
const navPointCloudLoadingText = ref('点云图加载中...')
const navPointCloudError = ref('')
const navPointCloudNavigationOrigin = ref<{ x: number; y: number; z: number } | null>(null)
const arrowMesh = ref<MeshData | null>(null)
const navPointCloudPreviewRef = ref<InstanceType<typeof ThreePointCloudPreview> | null>(null)
const lastLoadedNavPointCloudMap = ref('')
let navPointCloudLoadToken = 0
const selectedNavPcdDensity = ref<'sparse' | 'fine'>('sparse')
const selectedNavPcdColorMode = ref<'gradient' | 'classic'>(
  (localStorage.getItem('pcd_color_mode') as 'gradient' | 'classic') || 'classic'
)
watch(selectedNavPcdColorMode, (val) => {
  if (val) localStorage.setItem('pcd_color_mode', val)
})
const currentLoadedNavPcdFileName = ref('tinyMap.pcd')

const switchNavPcdDensity = async (densityKey: 'sparse' | 'fine') => {
  const mapName = selectedNavMap.value
  if (!mapName) {
    showErrorMessage('请先选择地图')
    return
  }

  const fileName = densityKey === 'fine' ? 'finalCloud.pcd' : 'tinyMap.pcd'
  const label = densityKey === 'fine' ? '精细' : '稀疏'
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''

  if (selectedNavPcdDensity.value === densityKey && navPointCloudData.value.length > 0 && currentLoadedNavPcdFileName.value === fileName) {
    return
  }

  selectedNavPcdDensity.value = densityKey
  navPointCloudLoading.value = true
  navPointCloudLoadingText.value = `正在加载${label}点云地图...`
  navPointCloudError.value = ''

  try {
    let pcdBlob = await getMapFile(mapName, fileName)

    if (!pcdBlob || pcdBlob.size === 0) {
      if (!robotId) {
        navPointCloudError.value = '未选择机器人，无法下载地图'
        showErrorMessage('未选择机器人，无法下载地图')
        navPointCloudLoading.value = false
        return
      }
      navPointCloudLoadingText.value = `正在下载${label}点云地图(${fileName})...`
      pcdBlob = await mapFileApi.downloadMapFile(robotId, mapName, fileName)
      if (pcdBlob && pcdBlob.size > 0) {
        await saveMapFile(mapName, fileName, pcdBlob)
      }
    }

    if (!pcdBlob || pcdBlob.size === 0) {
      navPointCloudError.value = `未找到${label}点云地图文件(${fileName})`
      navPointCloudLoading.value = false
      return
    }

    navPointCloudLoadingText.value = `正在解析${label}点云地图...`
    const arrayBuffer = await pcdBlob.arrayBuffer()
    const result = await parsePcdBufferInWorker(arrayBuffer)
    navPointCloudData.value = result.points
    baseNavPointCloudData.value = result.points
    navPointCloudNormalizationParams.value = result.normParams
    currentLoadedNavPcdFileName.value = fileName
    navPointCloudLoading.value = false

    const trackNameFromStatus = normalizeTrackName(robotStore.cmdStatus?.track_info?.track_name || '')
    const shouldOverlayTrack = robotStore.cmdStatus?.track === 1 && !!trackNameFromStatus
    if (shouldOverlayTrack) {
      activeNavOverlayTrackName.value = trackNameFromStatus
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
      }
    }

    nextTick(() => {
      navPointCloudPreviewRef.value?.fitCameraToScene?.()
    })
  } catch (err: any) {
    console.error(`[导航点云] 切换到${label}地图失败:`, err)
    navPointCloudError.value = `加载${label}点云地图失败: ` + (err?.message || String(err))
    navPointCloudLoading.value = false
  }
}

// 导航地图多视图切换 (点云图、栅格图、卫星图)
const navViewType = ref<'pointcloud' | 'grid' | 'map'>('pointcloud')
const showNavSatelliteMap = computed(() => navViewType.value === 'map')

// AMap 实例与图层状态
const navMapContainer = ref<HTMLElement | null>(null)
let navAmapInstance: any = null
let navAmapApiRef: any = null
let navRobotMarker: any = null
let navOriginMapMarker: any = null
let navTrafficLayer: any = null
const navMapType = ref('standard') // 'standard' | 'satellite'
const navShowTraffic = ref(false)
const navShowLayerMenu = ref(false)
const navAmapLoading = ref(false)

// AMap 循迹轨迹 and 任务点 Marker
const navRobotTrajectoryPolyline = ref<any>(null)
const navRobotTaskpointMarkers = ref<any[]>([])


// 栅格图 PGM / YAML 解析与渲染
const navGridMapCanvasRef = ref<HTMLCanvasElement | null>(null)
const navGridMapContainerRef = ref<HTMLDivElement | null>(null)
const navGridMapLoading = ref(false)
const navGridMapError = ref('')
const navGridMapMeta = ref<GridMapMeta | null>(null)
const showRealtimeScan = ref(false)
const navGridMapWidth = ref(0)
const navGridMapHeight = ref(0)
const navGridMapOffscreenCanvas = shallowRef<HTMLCanvasElement | null>(null)

// 2D 栅格图平移与缩放
const navGridMapZoom = ref(1.0)
const navGridMapPanX = ref(0)
const navGridMapPanY = ref(0)
const currentNavTrajectoryPoints = ref<any[]>([])
const currentNavTaskPoints = ref<any[]>([])
let navPointCloudErrorTimer: number | null = null

const clearNavPointCloudErrorTimer = () => {
  if (navPointCloudErrorTimer !== null) {
    window.clearTimeout(navPointCloudErrorTimer)
    navPointCloudErrorTimer = null
  }
}

const showNavPointCloudErrorDelayed = (message: string, delay = 450) => {
  clearNavPointCloudErrorTimer()
  navPointCloudErrorTimer = window.setTimeout(() => {
    navPointCloudError.value = message
    navPointCloudErrorTimer = null
  }, delay)
}

const requestNavPointCloudRelayout = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      navPointCloudPreviewRef.value?.fitCameraToScene?.()
    })
  })
}

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
  const MAX_SCALE = 100
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
  const labelZoomScale = Math.min(1.8, Math.max(1, Math.sqrt(Math.max(navPointCloudScale.value, 0.01))))

  // 任务点绘制在最上层，并展示名称
  taskPoints.forEach(tp => {
    ctx.beginPath()
    ctx.arc(tp.x, tp.y, 2.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 216, 0, 0.92)'
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.stroke()

    if (tp.name) {
      const fontSize = Math.round(8 * labelZoomScale)
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textW = ctx.measureText(tp.name).width
      const padX = Math.max(2, Math.round(2 * labelZoomScale))
      const padY = Math.max(1, Math.round(1 * labelZoomScale))
      const tagW = textW + padX * 2
      const tagH = fontSize + padY * 2
      const tagX = tp.x - tagW / 2
      const tagY = tp.y - Math.round(12 * labelZoomScale) - tagH / 2
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
    ctx.arc(oProjX, oProjY, 2, 0, Math.PI * 2)
    ctx.fillStyle = '#FF0000'
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ;{
      const lbl = '原点'
      const fontSize = Math.round(8 * labelZoomScale)
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const tw = ctx.measureText(lbl).width
      const padX = Math.max(2, Math.round(2 * labelZoomScale))
      const tagH = fontSize + Math.max(2, Math.round(2 * labelZoomScale))
      const rr = 3
      const tagW = tw + padX * 2
      const tx = oProjX - tagW / 2
      const ty = oProjY - Math.round(6 * labelZoomScale) - tagH
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
      const baseArrowScale = 0.0026
      const minArrowPx = 5
      const maxArrowPx = 14
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
      const arrowSize = 8
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
      const lbl = selectedVehicleType.value === 'four_wheel' ? '无人车' : '机器狗'
      const fontSize = Math.round(8 * labelZoomScale)
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const tw = ctx.measureText(lbl).width
      const padX = Math.max(2, Math.round(2 * labelZoomScale))
      const tagH = fontSize + Math.max(2, Math.round(2 * labelZoomScale))
      const rr = 3
      const tagW = tw + padX * 2
      const tx = rProjX - tagW / 2
      const ty = rProjY - Math.round(12 * labelZoomScale) - tagH
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
        const taskPointName = normalizeTaskPointName(String(getTrackTaskGroupName(task)))
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

    // 将轨迹与任务点坐标保存到全局 ref 中，方便 2D 栅格图及其他组件使用
    currentNavTrajectoryPoints.value = trajectoryPoints
    currentNavTaskPoints.value = taskPointsData

    if (navViewType.value === 'grid') {
      drawNavGridMapCanvas()
    }

    // 如果地图已初始化，也在地图上渲染轨迹和任务点
    if (navAmapInstance && navAmapApiRef) {
      if (navRobotTrajectoryPolyline.value) {
        navAmapInstance.remove(navRobotTrajectoryPolyline.value)
        navRobotTrajectoryPolyline.value = null
      }
      navRobotTaskpointMarkers.value.forEach(marker => {
        navAmapInstance.remove(marker)
      })
      navRobotTaskpointMarkers.value = []
      
      const AMap = navAmapApiRef
      const gnssOrigin = await loadGnssOrigin(selectedNavMap.value)
      
      // 转换轨迹点
      const mapPath: [number, number][] = []
      trajectoryPoints.forEach(p => {
        const gps = convertLocalToGps(p.x, p.y, gnssOrigin)
        if (gps) {
          const gcjCoords = transformWGS84ToGCJ02(gps.longitude, gps.latitude)
          mapPath.push([gcjCoords.longitude, gcjCoords.latitude])
        }
      })
      
      // 画轨迹线
      if (mapPath.length > 1) {
        navRobotTrajectoryPolyline.value = new AMap.Polyline({
          path: mapPath,
          strokeColor: '#39b54a', // 亮绿色
          strokeWeight: 4,
          strokeOpacity: 0.85,
          strokeStyle: 'solid',
          lineJoin: 'round',
          showDir: true,
          zIndex: 105 // 确保折线层级低于底图的文字标注图层 (115)
        })
        navAmapInstance.add(navRobotTrajectoryPolyline.value)
      }
      
      // 画任务点 Marker
      const markers: any[] = []
      taskPointsData.forEach((p, index) => {
        const gps = convertLocalToGps(p.x, p.y, gnssOrigin)
        if (gps) {
          const gcjCoords = transformWGS84ToGCJ02(gps.longitude, gps.latitude)
          const marker = new AMap.Marker({
            position: [gcjCoords.longitude, gcjCoords.latitude],
            offset: new AMap.Pixel(0, 0),
            anchor: 'center',
            content: `
              <div class="robot-map-taskpoint" title="${p.name}">
                <div class="taskpoint-dot">${index + 1}</div>
                <div class="taskpoint-label">${p.name}</div>
              </div>
            `
          })
          navAmapInstance.add(marker)
          markers.push(marker)
        }
      })
      navRobotTaskpointMarkers.value = markers
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

const isMapInList = (mapName: string, list: string[]) => {
  const normalized = normalizeMapName(mapName)
  if (!normalized) return false
  return list.some(item => normalizeMapName(item) === normalized)
}

const extractTrackTaskList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.msg?.result)) return payload.msg.result
  if (Array.isArray(payload?.msg?.data)) return payload.msg.data
  if (Array.isArray(payload?.response?.data)) return payload.response.data
  if (Array.isArray(payload?.response?.msg?.result)) return payload.response.msg.result
  return []
}

const getTrackTaskGroupName = (task: any) => (
  task?.track_point_name
  || task?.track_pointname
  || task?.taskpoint_name
  || task?.task_point_name
  || task?.task_pointname
  || ''
)

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
        name: task?.type_text || task?.preset || `任务点${idx + 1}`
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
  const requestToken = ++navPointCloudLoadToken
  const isStaleRequest = () => requestToken !== navPointCloudLoadToken
  const targetMap = mapName || selectedNavMap.value
  if (!targetMap) {
    console.warn('未选择地图，无法加载点云数据')
    lastLoadedNavPointCloudMap.value = ''
    return
  }

  const normalizedTargetMap = normalizeMapName(targetMap)
  const isMapChanged = !!normalizedTargetMap && normalizedTargetMap !== lastLoadedNavPointCloudMap.value
  const hasExistingPointCloud = navPointCloudData.value.length > 0 || baseNavPointCloudData.value.length > 0
  const silentRefresh = !!options?.silent && hasExistingPointCloud && !isMapChanged

  if (isMapChanged) {
    // 切换地图时重置密度模式为稀疏并清空旧点云，避免先看到旧/默认点云再跳变。
    selectedNavPcdDensity.value = 'sparse'
    currentLoadedNavPcdFileName.value = 'tinyMap.pcd'
    navPointCloudData.value = []
    baseNavPointCloudData.value = []
  }
  if (!silentRefresh) {
    navPointCloudLoading.value = true
  } else {
    navPointCloudLoading.value = false
  }
  navPointCloudLoadingText.value = '点云图加载中...'
  clearNavPointCloudErrorTimer()
  navPointCloudError.value = ''
  console.log('开始加载导航点云数据，地图:', targetMap)
  
  const targetPcdFileName = selectedNavPcdDensity.value === 'fine' ? 'finalCloud.pcd' : 'tinyMap.pcd'
  try {
    // 1. 尝试从 IndexedDB 获取
    let blob = await getMapFile(targetMap, targetPcdFileName)
    
    // 2. 如果缓存中没有，尝试下载
    if (!blob) {
      try {
        navPointCloudLoadingText.value = '地图文件下载中...'
        console.log('本地缓存未找到点云文件，尝试下载...')
        await downloadMapFiles(targetMap)
        blob = await getMapFile(targetMap, targetPcdFileName)
      } catch (downloadErr) {
        console.error('下载地图文件失败:', downloadErr)
      }
      navPointCloudLoadingText.value = '点云图加载中...'
    }
    
    if (!blob || blob.size === 0) {
      throw new Error('点云文件不存在')
    }
    if (isStaleRequest()) return

    console.log('从缓存加载点云文件')
    const buffer = await blob.arrayBuffer()
    
    console.log('PCD文件已加载，大小:', buffer.byteLength, 'bytes')
    const { points: parsedPoints, normParams } = await parsePcdBufferInWorker(buffer)
    if (isStaleRequest()) return
    console.log('解析点云数据，点数:', parsedPoints.length)
    
    if (parsedPoints.length > 0) {
      navPointCloudNormalizationParams.value = normParams
      navPointCloudNavigationOrigin.value = await loadNavMapNavigationOrigin(targetMap)
      navPointCloudData.value = parsedPoints
      // 保存原始地图数据，用于叠加轨迹
      baseNavPointCloudData.value = parsedPoints
      lastLoadedNavPointCloudMap.value = normalizedTargetMap
      lastNavTrackOverlayKey.value = ''
    } else {
      console.warn('未解析到点云数据，使用模拟数据')
      navPointCloudNavigationOrigin.value = null
      navPointCloudData.value = generateMockNavPointCloud()
      lastLoadedNavPointCloudMap.value = normalizedTargetMap
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
    requestNavPointCloudRelayout()
  } catch (error) {
    if (isStaleRequest()) return
    console.error('点云数据加载失败:', error)
    if (hasExistingPointCloud) {
      // 切页时若已有旧点云，保持旧画面，避免瞬时报错闪烁。
      navPointCloudError.value = ''
      scheduleNavPointCloudRender()
    } else {
      showNavPointCloudErrorDelayed('点云数据加载失败')
      navPointCloudNavigationOrigin.value = null
      navPointCloudData.value = generateMockNavPointCloud()
      lastNavTrackOverlayKey.value = ''
      await nextTick()
      scheduleNavPointCloudRender()
      requestNavPointCloudRelayout()
    }
  } finally {
    if (isStaleRequest()) return
    if (!silentRefresh) {
      navPointCloudLoading.value = false
    }
  }
}

// 监听导航地图选择变化
watch(() => taskExecutionStore.selectedMapName, (newMap) => {
  if (!newMap) return
  if (currentTab.value === 'nav') {
    // 仅当地图已在导航列表中时才加载，避免先用旧 map 渲染，再被列表刷新覆盖。
    if (!isMapInList(newMap, navMapList.value)) return
    refreshNavPointCloud(newMap)
    return
  }
  if (currentTab.value === 'track_record') {
    if (!isMapInList(newMap, trackMapList.value)) return
    refreshNavPointCloud(newMap)
    return
  }
  if (currentTab.value === 'track_edit') {
    if (!isMapInList(newMap, trackMapList.value)) return
    loadRouteEditLocalLineList(newMap)
    refreshNavPointCloud(newMap)
  }
}, { immediate: true })

// 导航 AMap/栅格图/卫星图切换与绘制逻辑
let isNavAmapLoading = false

const initNavAMap = () => {
  if (navAmapInstance || isNavAmapLoading || !navMapContainer.value) return
  isNavAmapLoading = true

  // @ts-ignore
  const definedAmapKey = (typeof __AMAP_KEY__ !== 'undefined' ? __AMAP_KEY__ : '') as string
  // @ts-ignore
  const definedAmapSec = (typeof __AMAP_SECURITY__ !== 'undefined' ? __AMAP_SECURITY__ : '') as string
  const envAmapKey = (import.meta as any).env?.VITE_AMAP_KEY || ''
  const envAmapSec = (import.meta as any).env?.VITE_AMAP_SECURITY || ''
  const amapKey = definedAmapKey || envAmapKey || '6f9eaf51960441fa4f813ea2d7e7cfff'
  const amapSec = definedAmapSec || envAmapSec || ''
  
  if (amapSec) {
    ;(window as any)._AMapSecurityConfig = { securityJsCode: amapSec }
  }
  
  AMapLoader.load({
    key: amapKey,
    version: '2.0',
    plugins: ['AMap.ToolBar', 'AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.Scale']
  }).then((AMap) => {
    navAmapApiRef = AMap

    const initLayers = navMapType.value === 'satellite'
      ? [new AMap.TileLayer.Satellite({ detectRetina: true }), new AMap.TileLayer.RoadNet({ detectRetina: true })]
      : [AMap.createDefaultLayer()]

    navAmapInstance = new AMap.Map(navMapContainer.value, {
      zoom: 18,
      zooms: [2, 22],
      center: [116.397428, 39.90923],
      logoEnable: false,
      copyrightEnable: false,
      viewMode: '3D',
      layers: initLayers,
      mapStyle: 'amap://styles/normal'
    })

    const scale = new AMap.Scale({
      position: 'RB',
      offset: new AMap.Pixel(20, 20)
    })
    navAmapInstance.addControl(scale)
    
    navAmapInstance.on('complete', () => {
      try {
        const layers = navAmapInstance.getLayers()
        layers.forEach((layer: any) => {
          const cls = layer.CLASS_NAME || ''
          if (cls.includes('LabelsLayer')) {
            layer.setzIndex(115)
          }
        })
      } catch (err) {
        console.warn('Set LabelsLayer zIndex failed:', err)
      }
      updateNavRobotMapMarker(true)
      if (selectedNavMap.value) {
        loadGnssOrigin(selectedNavMap.value).then(gnssOrigin => {
          updateNavOriginMapMarker(gnssOrigin)
        })
      }

      if (robotStore.isTracking) {
        const runningTrackName = normalizeTrackName(
          robotStore.cmdStatus?.track_info?.track_name
          || activeNavOverlayTrackName.value
          || ''
        )
        if (runningTrackName) {
          lastNavTrackOverlayKey.value = ''
          overlayNavTrackTrajectory(runningTrackName)
        }
      }

      // 路线编辑：在 AMap 点击时尝试绘制/拾取（仅 track_edit tab 生效）
      try {
        navAmapInstance.on('click', handleNavMapClickForRouteEdit)
      } catch (err) {
        console.warn('Bind AMap click for route edit failed:', err)
      }
    })
    isNavAmapLoading = false
  }).catch((error) => {
    console.error('AMap load failed:', error)
    isNavAmapLoading = false
  })
}

const updateNavRobotMapMarker = (shouldCenter = false) => {
  if (!navAmapInstance || !navAmapApiRef || !showNavSatelliteMap.value) return

  const gps = robotStore.gpsMessage
  if (!gps || !gps.longitude || !gps.latitude) return

  const wgsLng = normalizeGpsCoordinate(gps.longitude)
  const wgsLat = normalizeGpsCoordinate(gps.latitude)
  if (wgsLng === 0 || wgsLat === 0) return

  const gcj = transformWGS84ToGCJ02(wgsLng, wgsLat)
  const AMap = navAmapApiRef

  const theta = robotStore.pose?.theta
  const angle = typeof theta === 'number' && Number.isFinite(theta) ? theta * (180 / Math.PI) : 0
  const labelText = selectedVehicleType.value === 'four_wheel' ? '无人车' : '机器狗'

  if (!navRobotMarker) {
    navRobotMarker = new AMap.Marker({
      position: [gcj.longitude, gcj.latitude],
      title: labelText,
      content: `
        <div class="robot-location-indicator">
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${angle}deg); transform-origin: center; display: block;">
            <path d="M18 5L12 14H24Z" fill="#00a0e9"/>
            <circle cx="18" cy="18" r="9.5" fill="#ffffff" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>
            <circle cx="18" cy="18" r="7.5" fill="#00a0e9"/>
          </svg>
          <div class="robot-location-label">${labelText}</div>
        </div>
      `,
      autoRotation: false,
      anchor: 'center',
      offset: new AMap.Pixel(0, 0)
    })
    navAmapInstance.add(navRobotMarker)
  } else {
    navRobotMarker.setPosition([gcj.longitude, gcj.latitude])
    navRobotMarker.setAngle(0)
    navRobotMarker.setContent(`
      <div class="robot-location-indicator">
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${angle}deg); transform-origin: center; display: block;">
          <path d="M18 5L12 14H24Z" fill="#00a0e9"/>
          <circle cx="18" cy="18" r="9.5" fill="#ffffff" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>
          <circle cx="18" cy="18" r="7.5" fill="#00a0e9"/>
        </svg>
        <div class="robot-location-label">${labelText}</div>
      </div>
    `)
  }

  if (shouldCenter) {
    navAmapInstance.setCenter([gcj.longitude, gcj.latitude])
  }
}

const updateNavOriginMapMarker = (gnssOrigin: { latitude: number; longitude: number } | null) => {
  if (!navAmapInstance || !navAmapApiRef) return
  
  if (navOriginMapMarker) {
    navAmapInstance.remove(navOriginMapMarker)
    navOriginMapMarker = null
  }
  
  if (!gnssOrigin) return
  
  const AMap = navAmapApiRef
  const gcjCoords = transformWGS84ToGCJ02(gnssOrigin.longitude, gnssOrigin.latitude)
  
  navOriginMapMarker = new AMap.Marker({
    position: [gcjCoords.longitude, gcjCoords.latitude],
    anchor: 'center',
    zIndex: 108,
    content: `
      <div class="map-origin-marker">
        <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6" cy="6" r="5" fill="#ff3b30" stroke="#ffffff" stroke-width="1"/>
        </svg>
        <div class="map-origin-label">原点</div>
      </div>
    `
  })
  
  navAmapInstance.add(navOriginMapMarker)
}

const clearNavRobotTrajectoryOnMap = () => {
  currentNavTrajectoryPoints.value = []
  currentNavTaskPoints.value = []
  if (navAmapInstance) {
    if (navRobotTrajectoryPolyline.value) {
      navAmapInstance.remove(navRobotTrajectoryPolyline.value)
      navRobotTrajectoryPolyline.value = null
    }
    navRobotTaskpointMarkers.value.forEach(marker => {
      navAmapInstance.remove(marker)
    })
    navRobotTaskpointMarkers.value = []
  }
  if (navViewType.value === 'grid') {
    drawNavGridMapCanvas()
  }
}

const applyNavMapType = () => {
  if (!navAmapInstance || !navAmapApiRef) return
  const AMap = navAmapApiRef

  if (navTrafficLayer) {
    navAmapInstance.remove(navTrafficLayer)
  }

  if (navMapType.value === 'standard') {
    navAmapInstance.setLayers([AMap.createDefaultLayer()])
    navAmapInstance.setMapStyle('amap://styles/normal')
    navAmapInstance.setPitch(0)
    navAmapInstance.setFeatures(['bg', 'road', 'building', 'point'])
  } else if (navMapType.value === 'satellite') {
    navAmapInstance.setLayers([
      new AMap.TileLayer.Satellite({ detectRetina: true }),
      new AMap.TileLayer.RoadNet({ detectRetina: true })
    ])
    navAmapInstance.setMapStyle('amap://styles/normal')
    navAmapInstance.setPitch(0)
    navAmapInstance.setFeatures(['bg', 'road', 'point'])
  }

  try {
    const layers = navAmapInstance.getLayers()
    layers.forEach((layer: any) => {
      const cls = layer.CLASS_NAME || ''
      if (cls.includes('LabelsLayer')) {
        layer.setzIndex(115)
      }
    })
  } catch (err) {
    console.warn('Set LabelsLayer zIndex failed:', err)
  }

  if (navShowTraffic.value) {
    if (!navTrafficLayer) {
      navTrafficLayer = new AMap.TileLayer.Traffic({
        zIndex: 10
      })
    }
    navAmapInstance.add(navTrafficLayer)
  }
}

const setNavMapType = (type: 'standard' | 'satellite') => {
  navMapType.value = type
  applyNavMapType()
  
  updateNavRobotMapMarker(false)
  if (selectedNavMap.value) {
    loadGnssOrigin(selectedNavMap.value).then(gnssOrigin => {
      updateNavOriginMapMarker(gnssOrigin)
    })
  }
  const runningTrackName = normalizeTrackName(
    robotStore.cmdStatus?.track_info?.track_name
    || activeNavOverlayTrackName.value
    || ''
  )
  if (runningTrackName) {
    lastNavTrackOverlayKey.value = ''
    overlayNavTrackTrajectory(runningTrackName)
  }
  
  navShowLayerMenu.value = false
}

const toggleNavTraffic = () => {
  navShowTraffic.value = !navShowTraffic.value
  applyNavMapType()
}

const toggleNavLayerMenu = () => {
  navShowLayerMenu.value = !navShowLayerMenu.value
}

// 栅格图加载与绘制逻辑
// mapName 可选：track_edit 视图通过 trackEditMap 显式传入，避免与 nav 视图的 selectedNavMap 互相干扰
const loadAndDrawNavGridMap = async (mapName?: string) => {
  const targetMap = mapName || selectedNavMap.value
  if (!targetMap) {
    navGridMapMeta.value = null
    navGridMapError.value = '未选择地图'
    return
  }
  
  try {
    navGridMapLoading.value = true
    navGridMapError.value = ''
    
    let yamlBlob = await getMapFile(targetMap, 'gridMap.yaml')
    if (!yamlBlob) {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        yamlBlob = await mapFileApi.downloadMapFile(robotId, targetMap, 'gridMap.yaml', true)
        if (yamlBlob) {
          await saveMapFile(targetMap, 'gridMap.yaml', yamlBlob)
        }
      }
    }
    if (yamlBlob) {
      navGridMapMeta.value = parseGridMapYaml(await yamlBlob.text())
    } else {
      navGridMapMeta.value = null
    }

    let pgmBlob = await getMapFile(targetMap, 'gridMap.pgm')
    if (!pgmBlob) {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        pgmBlob = await mapFileApi.downloadMapFile(robotId, targetMap, 'gridMap.pgm', true)
        if (pgmBlob) {
          await saveMapFile(targetMap, 'gridMap.pgm', pgmBlob)
        }
      }
    }
    
    if (!pgmBlob) {
      navGridMapError.value = '未找到栅格地图文件'
      navGridMapLoading.value = false
      return
    }
    
    const buffer = await pgmBlob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // 解析PGM头部
    let ptr = 0
    let tokenCount = 0
    let inComment = false
    let headerTokens: string[] = []
    
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
        let tokenStart = ptr
        while (ptr < bytes.length && !/\s/.test(String.fromCharCode(bytes[ptr]))) {
            ptr++
        }
        let token = String.fromCharCode(...bytes.subarray(tokenStart, ptr))
        headerTokens.push(token)
        tokenCount++
    }
    
    if (ptr < bytes.length && /\s/.test(String.fromCharCode(bytes[ptr]))) {
        ptr++
    }
    let dataStart = ptr
    
    const magic = headerTokens[0]
    const width = parseInt(headerTokens[1])
    const height = parseInt(headerTokens[2])
    const maxVal = parseInt(headerTokens[3]) || 255
    
    navGridMapWidth.value = width
    navGridMapHeight.value = height
    
    const offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = height
    const offscreenCtx = offscreen.getContext('2d')
    if (!offscreenCtx) return
    
    const imageData = offscreenCtx.createImageData(width, height)
    
    if (magic === 'P5') {
      let p = dataStart
      for (let idx = 0; idx < width * height; idx++) {
        if (p >= bytes.length) break
        const v = bytes[p++]
        const c = v
        const off = idx * 4
        imageData.data[off] = c
        imageData.data[off + 1] = c
        imageData.data[off + 2] = c
        imageData.data[off + 3] = 255
      }
    } else if (magic === 'P2') {
      const textDecoder = new TextDecoder()
      const asciiData = textDecoder.decode(bytes.subarray(dataStart))
      const tokens = asciiData.trim().split(/\s+/)
      
      for (let idx = 0; idx < width * height; idx++) {
        if (idx >= tokens.length) break
        const v = parseInt(tokens[idx], 10)
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
    
    offscreenCtx.putImageData(imageData, 0, 0)
    navGridMapOffscreenCanvas.value = offscreen
    navGridMapLoading.value = false
    drawNavGridMapCanvas()
  } catch (err) {
    console.error('Failed to load and draw nav grid map:', err)
    navGridMapError.value = '加载地图失败'
    navGridMapLoading.value = false
  }
}

// 栅格图世界 ↔ 容器坐标转换辅助
// 返回基础变换参数（baseScale、baseOffsetX/Y、centerX/Y、zoom、panX/Y、mapH），
// 转换函数从闭包中读 ref 状态，与 drawNavGridMapCanvas 完全一致。
const getGridMapViewParams = () => {
  const container = navGridMapContainerRef.value
  const meta = navGridMapMeta.value
  if (!container || !meta) return null
  const mapW = navGridMapWidth.value
  const mapH = navGridMapHeight.value
  if (mapW <= 0 || mapH <= 0) return null
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  if (containerWidth <= 0 || containerHeight <= 0) return null
  const baseScale = Math.min(containerWidth / mapW, containerHeight / mapH)
  const baseOffsetX = (containerWidth - mapW * baseScale) / 2
  const baseOffsetY = (containerHeight - mapH * baseScale) / 2
  return {
    meta,
    mapW,
    mapH,
    containerWidth,
    containerHeight,
    baseScale,
    baseOffsetX,
    baseOffsetY,
    zoom: navGridMapZoom.value,
    panX: navGridMapPanX.value,
    panY: navGridMapPanY.value,
  }
}

// 容器像素坐标 → 世界坐标 (x, y)
const screenToGridWorld = (cx: number, cy: number): { x: number; y: number } | null => {
  const p = getGridMapViewParams()
  if (!p) return null
  const { meta, mapH, containerWidth, containerHeight, baseScale, baseOffsetX, baseOffsetY, zoom, panX, panY } = p
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  // 还原：先去除 pan/zoom，回到基础坐标系
  const dx = (cx - panX - centerX) / zoom + centerX
  const dy = (cy - panY - centerY) / zoom + centerY
  // 基础坐标系 → 地图图像像素坐标
  const px = (dx - baseOffsetX) / baseScale
  const py = (dy - baseOffsetY) / baseScale
  // 地图图像像素坐标 → 世界坐标（注意 y 轴翻转）
  const wx = meta.originX + px * meta.resolution
  const wy = meta.originY + (mapH - py) * meta.resolution
  return { x: wx, y: wy }
}

// 世界坐标 → 容器像素坐标
const gridWorldToScreen = (x: number, y: number): { x: number; y: number } | null => {
  const p = getGridMapViewParams()
  if (!p) return null
  const { meta, mapH, containerWidth, containerHeight, baseScale, baseOffsetX, baseOffsetY, zoom, panX, panY } = p
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  // 世界坐标 → 地图图像像素坐标
  const px = (x - meta.originX) / meta.resolution
  const py = mapH - (y - meta.originY) / meta.resolution
  // 地图图像像素 → 基础坐标系
  const bx = baseOffsetX + px * baseScale
  const by = baseOffsetY + py * baseScale
  // 基础坐标系 → 容器像素（应用 pan/zoom）
  const cx = (bx - centerX) * zoom + centerX + panX
  const cy = (by - centerY) * zoom + centerY + panY
  return { x: cx, y: cy }
}

const drawNavGridMapCanvas = () => {
  const canvas = navGridMapCanvasRef.value
  const container = navGridMapContainerRef.value
  const offscreen = navGridMapOffscreenCanvas.value
  if (!canvas || !container || !offscreen) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const containerWidth = container.clientWidth || 800
  const containerHeight = container.clientHeight || 500
  
  const dpr = window.devicePixelRatio || 1
  canvas.width = containerWidth * dpr
  canvas.height = containerHeight * dpr
  canvas.style.width = containerWidth + 'px'
  canvas.style.height = containerHeight + 'px'
  
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, containerWidth, containerHeight)
  
  const mapW = navGridMapWidth.value
  const mapH = navGridMapHeight.value
  if (mapW <= 0 || mapH <= 0) return
  
  const scaleX = containerWidth / mapW
  const scaleY = containerHeight / mapH
  const baseScale = Math.min(scaleX, scaleY)
  
  const baseOffsetX = (containerWidth - mapW * baseScale) / 2
  const baseOffsetY = (containerHeight - mapH * baseScale) / 2
  
  const zoom = navGridMapZoom.value
  const panX = navGridMapPanX.value
  const panY = navGridMapPanY.value
  
  ctx.save()
  ctx.translate(panX, panY)
  
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  ctx.translate(centerX, centerY)
  ctx.scale(zoom, zoom)
  ctx.translate(-centerX, -centerY)
  
  ctx.save()
  ctx.translate(baseOffsetX, baseOffsetY)
  ctx.scale(baseScale, baseScale)
  ctx.imageSmoothingEnabled = (baseScale * zoom) < 1.0
  ctx.drawImage(offscreen, 0, 0)
  ctx.restore()
  
  const meta = navGridMapMeta.value
  if (!meta) {
    ctx.restore()
    return
  }
  
  if (currentNavTrajectoryPoints.value.length > 1 && currentTab.value !== 'track_edit') {
    ctx.save()
    ctx.beginPath()
    currentNavTrajectoryPoints.value.forEach((p, index) => {
      const px = (p.x - meta.originX) / meta.resolution
      const py = mapH - (p.y - meta.originY) / meta.resolution
      const cx = baseOffsetX + px * baseScale
      const cy = baseOffsetY + py * baseScale
      if (index === 0) {
        ctx.moveTo(cx, cy)
      } else {
        ctx.lineTo(cx, cy)
      }
    })
    ctx.strokeStyle = '#39b54a'
    ctx.lineWidth = 2 / zoom
    ctx.stroke()
    ctx.restore()
  }
  
  if (currentTab.value !== 'track_edit') {
    ctx.save()
    const navOriginX = navPointCloudNavigationOrigin.value?.x ?? 0
    const navOriginY = navPointCloudNavigationOrigin.value?.y ?? 0
    const ox = (navOriginX - meta.originX) / meta.resolution
    const oy = mapH - (navOriginY - meta.originY) / meta.resolution
    const rxOrigin = baseOffsetX + ox * baseScale
    const ryOrigin = baseOffsetY + oy * baseScale
    
    ctx.translate(rxOrigin, ryOrigin)
    ctx.scale(1 / zoom, 1 / zoom)
    
    ctx.beginPath()
    ctx.arc(0, 0, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#ff3b30'
    ctx.fill()
    
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const originText = '原点'
    
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeText(originText, 0, 8)
    
    ctx.fillStyle = '#ff3b30'
    ctx.fillText(originText, 0, 8)
    
    ctx.restore()
  }
  
  const pose = robotStore.pose
  if (pose && Number.isFinite(pose.x) && Number.isFinite(pose.y)) {
    const px = (pose.x - meta.originX) / meta.resolution
    const py = mapH - (pose.y - meta.originY) / meta.resolution
    const rx = baseOffsetX + px * baseScale
    const ry = baseOffsetY + py * baseScale
    
    ctx.save()
    ctx.translate(rx, ry)
    ctx.scale(1 / zoom, 1 / zoom)
    
    ctx.save()
    const angle = typeof pose.theta === 'number' && Number.isFinite(pose.theta) ? pose.theta : 0
    ctx.rotate(-angle)
    
    ctx.beginPath()
    ctx.moveTo(15, 0)
    ctx.lineTo(6, -6)
    ctx.lineTo(6, 6)
    ctx.closePath()
    ctx.fillStyle = '#00a0e9'
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 1
    ctx.fill()
    ctx.shadowColor = 'transparent'
    
    ctx.beginPath()
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2)
    ctx.fillStyle = '#00a0e9'
    ctx.fill()
    ctx.restore()
    
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const labelText = selectedVehicleType.value === 'four_wheel' ? '无人车' : '机器狗'
    
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeText(labelText, 0, 16)
    
    ctx.fillStyle = '#00a0e9'
    ctx.fillText(labelText, 0, 16)
    
    ctx.restore()
  }

  if (currentNavTaskPoints.value.length > 0) {
    currentNavTaskPoints.value.forEach((p, index) => {
      const px = (p.x - meta.originX) / meta.resolution
      const py = mapH - (p.y - meta.originY) / meta.resolution
      const tx = baseOffsetX + px * baseScale
      const ty = baseOffsetY + py * baseScale
      
      ctx.save()
      ctx.translate(tx, ty)
      ctx.scale(1 / zoom, 1 / zoom)
      
      ctx.beginPath()
      ctx.arc(0, 0, 9, 0, Math.PI * 2)
      ctx.fillStyle = '#ff9500'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.fill()
      ctx.stroke()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(index + 1), 0, 0)
      
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.strokeText(p.name, 0, 11)
      
      ctx.fillStyle = '#ff9500'
      ctx.fillText(p.name, 0, 11)
      ctx.restore()
    })
  }

  // 绘制实时激光雷达扫描数据 (2D点云)
  if (showRealtimeScan.value && robotStore.currentScan && robotStore.currentScan.data) {
    const scanPoints = robotStore.currentScan.data
    const pose = robotStore.pose
    
    // 检查点云是否在地图坐标系中，若否则进行局部到全局转换
    let isWorldCoords = false
    if (pose && Number.isFinite(pose.x) && Number.isFinite(pose.y) && scanPoints.length > 0) {
      const pt = scanPoints[0]
      const distToRobot = Math.sqrt((pt[0] - pose.x) ** 2 + (pt[1] - pose.y) ** 2)
      const distToOrigin = Math.sqrt(pt[0] ** 2 + pt[1] ** 2)
      
      // Heuristic: If points are far from origin but close to robot, they are world coordinates
      if (distToOrigin > 15 && distToRobot < 15) {
        isWorldCoords = true
      }
    }

    ctx.save()
    ctx.fillStyle = '#ff0055' // Vibrant neon pink/red
    
    const angle = pose && typeof pose.theta === 'number' && Number.isFinite(pose.theta) ? pose.theta : 0
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    
    scanPoints.forEach(pt => {
      let wx = pt[0]
      let wy = pt[1]
      
      if (!isWorldCoords && pose && Number.isFinite(pose.x) && Number.isFinite(pose.y)) {
        // Local to world transform
        wx = pose.x + pt[0] * cosA - pt[1] * sinA
        wy = pose.y + pt[0] * sinA + pt[1] * cosA
      }
      
      const px = (wx - meta.originX) / meta.resolution
      const py = mapH - (wy - meta.originY) / meta.resolution
      const cx = baseOffsetX + px * baseScale
      const cy = baseOffsetY + py * baseScale
      
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(0.6, 1.0 / zoom), 0, Math.PI * 2)
      ctx.fill()
    })
    
    ctx.restore()
  }

  // route_edit 叠加（仅 track_edit tab 下渲染，避免在 map_record 多余开销）
  if (currentTab.value === 'track_edit') {
    drawRouteEditOnGrid(ctx, meta, mapH, baseOffsetX, baseOffsetY, baseScale, zoom)
  }

  ctx.restore()
}



// route_edit 轨迹叠加到栅格图：主线（绿）、draft（橙虚线）、选中段（橙）、关键点
const drawRouteEditOnGrid = (
  ctx: CanvasRenderingContext2D,
  meta: GridMapMeta,
  mapH: number,
  baseOffsetX: number,
  baseOffsetY: number,
  baseScale: number,
  zoom: number,
) => {
  const points = routeEditPoints.value
  const draftPoints = routeEditDraftPoints.value
  const range = getRouteEditSelectionRange()

  const toCanvas = (p: { x: number; y: number }) => {
    const px = (p.x - meta.originX) / meta.resolution
    const py = mapH - (p.y - meta.originY) / meta.resolution
    return { x: baseOffsetX + px * baseScale, y: baseOffsetY + py * baseScale }
  }

  ctx.save()
  // 主轨迹：使用 breaks 拆分段绘制以支持删除选段后的断开效果
  const pointSegments = splitRouteEditPointsByBreaks(points, routeEditBreaks.value)
  pointSegments.forEach(seg => {
    if (seg.length > 1) {
      ctx.beginPath()
      seg.forEach((p, i) => {
        const sp = toCanvas(p)
        if (i === 0) ctx.moveTo(sp.x, sp.y)
        else ctx.lineTo(sp.x, sp.y)
      })
      ctx.strokeStyle = '#39b54a'
      ctx.lineWidth = 2 / zoom
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
  })

  // draft 轨迹：橙色虚线
  if (draftPoints.length > 1) {
    ctx.beginPath()
    draftPoints.forEach((p, i) => {
      const sp = toCanvas(p)
      if (i === 0) ctx.moveTo(sp.x, sp.y)
      else ctx.lineTo(sp.x, sp.y)
    })
    ctx.strokeStyle = '#ff9500'
    ctx.lineWidth = 2 / zoom
    ctx.setLineDash([6 / zoom, 4 / zoom])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 选中段高亮：橙色加粗
  if (range && range.end > range.start) {
    ctx.beginPath()
    for (let i = range.start; i <= range.end; i++) {
      const sp = toCanvas(points[i])
      if (i === range.start) ctx.moveTo(sp.x, sp.y)
      else ctx.lineTo(sp.x, sp.y)
    }
    ctx.strokeStyle = '#ff9500'
    ctx.lineWidth = 3 / zoom
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // 主轨迹关键点 (仅在绘制或新增模式下画终点，且去掉起点的橙色标记点)
  if (points.length > 0 && (routeEditMode.value === 'draw' || routeEditCreateMode.value)) {
    const sp = toCanvas(points[points.length - 1])
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, Math.max(2.5, 4 / zoom), 0, Math.PI * 2)
    ctx.fillStyle = '#ff9500'
    ctx.fill()
  }

  // draft 关键点 (仅画终点)
  if (draftPoints.length > 0) {
    const sp = toCanvas(draftPoints[draftPoints.length - 1])
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, Math.max(2.0, 3 / zoom), 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#ff9500'
    ctx.lineWidth = 1 / zoom
    ctx.fill()
    ctx.stroke()
  }

  // 选段模式下的点击位置标记 (Canvas)
  if (routeEditMode.value === 'pick') {
    [routeEditSelectionStart.value, routeEditSelectionEnd.value].forEach((idx) => {
      if (isValidRouteEditIndex(idx) && idx < points.length) {
        const sp = toCanvas(points[idx])
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, Math.max(2.5, 4.5 / zoom), 0, Math.PI * 2)
        ctx.fillStyle = '#ff9500'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.0 / zoom
        ctx.fill()
        ctx.stroke()
      }
    })
  }

  ctx.restore()
}

// 栅格图滚轮和拖拽交互
let isDraggingNavGridMap = false
let startDragNavX = 0
let startDragNavY = 0
// 鼠标按下时的 client 坐标（用于判定拖拽 vs 点击）
let pointerDownClientX = 0
let pointerDownClientY = 0
let pointerDownActive = false

const handleNavGridMapWheel = (e: WheelEvent) => {
  e.preventDefault()
  const zoomFactor = 1.1
  let newZoom = navGridMapZoom.value
  if (e.deltaY < 0) {
    newZoom *= zoomFactor
  } else {
    newZoom /= zoomFactor
  }
  navGridMapZoom.value = Math.min(15.0, Math.max(0.4, newZoom))
  drawNavGridMapCanvas()
}

const handleNavGridMapMouseDown = (e: MouseEvent) => {
  isDraggingNavGridMap = true
  startDragNavX = e.clientX - navGridMapPanX.value
  startDragNavY = e.clientY - navGridMapPanY.value
  pointerDownClientX = e.clientX
  pointerDownClientY = e.clientY
  pointerDownActive = true
  if (navGridMapCanvasRef.value) {
    navGridMapCanvasRef.value.style.cursor = 'grabbing'
  }
}

const handleNavGridMapMouseMove = (e: MouseEvent) => {
  if (!isDraggingNavGridMap) return
  navGridMapPanX.value = e.clientX - startDragNavX
  navGridMapPanY.value = e.clientY - startDragNavY
  drawNavGridMapCanvas()
}

const handleNavGridMapMouseUp = (e: MouseEvent) => {
  const wasDragging = isDraggingNavGridMap
  isDraggingNavGridMap = false
  if (navGridMapCanvasRef.value) {
    navGridMapCanvasRef.value.style.cursor = 'grab'
  }
  if (!wasDragging || !pointerDownActive) return
  pointerDownActive = false

  // 拖拽 vs 点击判定
  const moved = Math.hypot(e.clientX - pointerDownClientX, e.clientY - pointerDownClientY)
  if (moved > 6) return

  // route_edit 视图才处理点击交互
  if (currentTab.value !== 'track_edit') return
  if (routeEditMode.value === 'view') return
  if (!navGridMapCanvasRef.value) return

  const rect = navGridMapCanvasRef.value.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top

  if (routeEditMode.value === 'draw') {
    // snap 优先：在 routeEditPoints 中找最近的点（屏幕距离 ≤ snapPixelRadius）
    const snapRadius = routeEditSnapPixelRadius.value
    let snapIndex = -1
    let snapDist = snapRadius
    let snapScreen: { x: number; y: number } | null = null
    routeEditPoints.value.forEach((p, idx) => {
      const sp = gridWorldToScreen(p.x, p.y)
      if (!sp) return
      const d = Math.hypot(sp.x - cx, sp.y - cy)
      if (d < snapDist) {
        snapDist = d
        snapIndex = idx
        snapScreen = sp
      }
    })

    if (snapIndex >= 0 && snapScreen) {
      const snappedPoint = routeEditPoints.value[snapIndex]
      handleRouteEditPlaneClick({
        x: snappedPoint.x,
        y: snappedPoint.y,
        z: getRouteEditDrawPlaneRawZ(),
        snappedIndex: snapIndex,
      })
    } else {
      const world = screenToGridWorld(cx, cy)
      if (world) {
        handleRouteEditPlaneClick({
          x: world.x,
          y: world.y,
          z: getRouteEditDrawPlaneRawZ(),
        })
      }
    }
  } else if (routeEditMode.value === 'pick') {
    const snapRadius = routeEditSnapPixelRadius.value
    let bestIndex = -1
    let bestDist = snapRadius
    routeEditPoints.value.forEach((p, idx) => {
      const sp = gridWorldToScreen(p.x, p.y)
      if (!sp) return
      const d = Math.hypot(sp.x - cx, sp.y - cy)
      if (d < bestDist) {
        bestDist = d
        bestIndex = idx
      }
    })
    if (bestIndex >= 0) {
      handleRouteEditTrajectoryPick({ index: bestIndex })
    }
  }
}

const closeNavLayerMenuOnOutside = (e: MouseEvent) => {
  const el = (e.target as HTMLElement).closest('.map-layer-switcher')
  if (!el) navShowLayerMenu.value = false
}

// 监听视图切换与地图变化以重新初始化和加载
watch(navViewType, async (newType) => {
  if (currentTab.value === 'track_edit') {
    resetRouteEditWorkspace()
  }
  if (newType === 'grid') {
    await loadAndDrawNavGridMap()
    await nextTick()
    drawNavGridMapCanvas()
  } else if (newType === 'map') {
    nextTick(() => {
      initNavAMap()
    })
  }
})

watch(hasRobotRtk, (hasRtk) => {
  if (!hasRtk && navViewType.value === 'map') {
    if (currentTab.value === 'track_edit') {
      navViewType.value = 'grid'
    } else {
      navViewType.value = 'pointcloud'
    }
  }
})

watch(selectedNavMap, async (newMap) => {
  if (newMap) {
    if (navViewType.value === 'grid') {
      await loadAndDrawNavGridMap()
    } else if (navViewType.value === 'map') {
      if (!navAmapInstance) {
        initNavAMap()
      } else {
        updateNavRobotMapMarker(false)
        loadGnssOrigin(newMap).then(gnssOrigin => {
          updateNavOriginMapMarker(gnssOrigin)
        })
        const runningTrackName = normalizeTrackName(
          robotStore.cmdStatus?.track_info?.track_name
          || activeNavOverlayTrackName.value
          || ''
        )
        if (runningTrackName) {
          lastNavTrackOverlayKey.value = ''
          overlayNavTrackTrajectory(runningTrackName)
        }
      }
    }
  }
})

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
  if (navViewType.value === 'grid' && navGridMapCanvasRef.value) {
    drawNavGridMapCanvas()
  }
  if (navViewType.value === 'map') {
    updateNavRobotMapMarker(false)
  }
}, { deep: true })

watch(() => robotStore.gpsMessage, () => {
  if (navViewType.value === 'map') {
    updateNavRobotMapMarker(false)
  }
}, { deep: true })

// 监听实时 2D 点云数据变化，重新绘制导航页的栅格图
watch(
  () => robotStore.currentScan,
  () => {
    if (navViewType.value === 'grid' && showRealtimeScan.value) {
      drawNavGridMapCanvas()
    }
  }
)

watch(showRealtimeScan, () => {
  if (navViewType.value === 'grid') {
    drawNavGridMapCanvas()
  }
})

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
    clearNavRobotTrajectoryOnMap()
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
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('click', closeNavLayerMenuOnOutside)
  await fetchNavPointTaskList()
})

onActivated(async () => {
  if (!mapRefreshTabs.has(currentTab.value)) return

  await refreshMapListCache()
  if (currentTab.value === 'nav') {
    fetchMapList()
    // 切回导航页时清掉旧点云，直接进入“当前地图加载中”状态，避免先显示旧图。
    navPointCloudData.value = []
    baseNavPointCloudData.value = []
    navPointCloudError.value = ''
    navPointCloudLoading.value = true
    navPointCloudLoadingText.value = '点云图加载中...'
    lastLoadedNavPointCloudMap.value = ''
    void initNavPointCloud()
    requestNavPointCloudRelayout()

    // 重新激活时重建 AMap 实例（keep-alive 切页导致 DOM 分离，AMap canvas 失效）
    if (navViewType.value === 'map') {
      nextTick(() => { initNavAMap() })
    } else if (navViewType.value === 'grid') {
      nextTick(() => { drawNavGridMapCanvas() })
    }
  } else if (currentTab.value === 'map_edit') {
    fetchEditMapList()
  } else if (currentTab.value === 'track_record') {
    fetchTrackMapList()
    requestNavPointCloudRelayout()
  } else if (currentTab.value === 'track_edit') {
    fetchTrackMapList()
    loadRouteEditLocalLineList()
    void fetchAllTrackList()
    requestNavPointCloudRelayout()
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

onDeactivated(() => {
  // 离开页面时销毁 AMap 实例，下次 onActivated 时重建（keep-alive 切页导致 DOM 分离）
  if (navAmapInstance) {
    try { navAmapInstance.off('click', handleNavMapClickForRouteEdit) } catch (_) {}
    try { navAmapInstance.destroy() } catch (_) {}
    navAmapInstance = null
    navAmapApiRef = null
    navRobotMarker = null
    navOriginMapMarker = null
    navTrafficLayer = null
    navRobotTrajectoryPolyline.value = null
    navRobotTaskpointMarkers.value = []
    isNavAmapLoading = false
  }
})

onUnmounted(() => {
  window.removeEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('click', closeNavLayerMenuOnOutside)
  clearNavPointCloudErrorTimer()
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
// 实时建图相关状态
const localSlamOnlineActive = ref(false)
const slamOnlineBtnLoading = ref(false)
const slamOnlineDialogVisible = ref(false)
const slamOnlineMapName = ref('')
const slamOnlineActiveName = ref('')  // 记录当前开启的地图名称，关闭时传回
const slamOnlineLoading = ref(false)

// slam=1 且没有建图进度时表示实时建图开启状态
const isSlamOnline = computed(() => {
  const cmdStatus = robotStore.cmdStatus
  if (cmdStatus) {
    return cmdStatus.slam === 1 && !robotStore.mappingProgress
  }
  return localSlamOnlineActive.value
})

const isSlamOnlineMapNameDuplicate = computed(() => {
  const name = slamOnlineMapName.value.trim()
  if (!name) return false
  return isMapInList(name, navMapList.value)
})

const slamOnlineMapDialogVisible = ref(false)
const slamOnlineCanvasRef = ref<HTMLCanvasElement | null>(null)
const slamOnlineZoom = ref(1.0)
const slamOnlinePanX = ref(0)
const slamOnlinePanY = ref(0)

const hasSlamOnlineData = computed(() => !!robotStore.slamGridMapData)
const slamGridMapMetaInfo = computed(() => {
  const map = robotStore.slamGridMapData
  if (!map) return { resolution: 0, width: 0, height: 0 }
  return {
    resolution: map.resolution,
    width: map.width,
    height: map.height
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

const handleSlamOnlineMapNameInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  const sanitized = (target.value || '').replace(/\s+/g, '')
  if (sanitized !== target.value) {
    target.value = sanitized
  }
  slamOnlineMapName.value = sanitized
}

const handleSlamOnlineToggle = () => {
  if (isSlamOnline.value) {
    showConfirmDialog({
      title: '关闭建图',
      message: '确定要关闭实时建图吗？',
      confirmText: '确定',
      cancelText: '取消',
      type: 'warning',
      onConfirm: () => {
        closeConfirmDialog()
        void stopSlamOnlineRequest()
      },
      onCancel: () => {
        closeConfirmDialog()
      }
    })
  } else {
    if (!ensureNavigationClosedForMapping()) return
    slamOnlineMapName.value = ''
    slamOnlineDialogVisible.value = true
  }
}

const drawSlamOnlineGridMap = (map: any) => {
  const canvas = slamOnlineCanvasRef.value
  if (!canvas) return
  const container = canvas.parentElement
  if (!container) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const containerWidth = container.clientWidth || 800
  const containerHeight = container.clientHeight || 500

  // Only resize canvas when dimensions actually change to avoid flicker/jitter
  const dpr = window.devicePixelRatio || 1
  const targetW = containerWidth * dpr
  const targetH = containerHeight * dpr
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW
    canvas.height = targetH
    canvas.style.width = containerWidth + 'px'
    canvas.style.height = containerHeight + 'px'
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // ── 颜色配置 ──────────────────────────────────────────
  const COLOR_UNKNOWN  = '#3d5252'   // 未知区域（背景）
  const COLOR_FREE     = '#9aacac'   // 空闲格（已探测、无障碍）
  const COLOR_OCCUPIED = '#1a2424'   // 占用格（有障碍）

  // 1. 整个 canvas 填充"未知"色
  ctx.fillStyle = COLOR_UNKNOWN
  ctx.fillRect(0, 0, containerWidth, containerHeight)

  const mapW = map.width
  const mapH = map.height
  if (mapW <= 0 || mapH <= 0) return

  // 2. 解析机器人位置 —— 来自独立推送的 slam_pose_update，不再读 map.pose
  const slamPose = robotStore.slamPoseData
  console.log('[DrawSlam] slamPose:', slamPose)
  let rx = 0, ry = 0, theta = 0
  let hasRobot = false

  if (slamPose && Number.isFinite(slamPose.x) && Number.isFinite(slamPose.y)) {
    rx = slamPose.x
    ry = slamPose.y
    theta = Number.isFinite(slamPose.theta) ? slamPose.theta : 0
    hasRobot = true
  }

  // 辅助解析格子的 [cx, cy] 二维坐标 (兼容一维索引、二维点对、对象等各种后端推送格式)
  const getCellCoord = (item: any, width: number): [number, number] | null => {
    if (typeof item === 'number') {
      if (width > 0) {
        const cx = item % width
        const cy = Math.floor(item / width)
        return [cx, cy]
      }
    } else if (Array.isArray(item)) {
      if (item.length >= 2 && typeof item[0] === 'number' && typeof item[1] === 'number') {
        return [item[0], item[1]]
      }
    } else if (item && typeof item === 'object') {
      const cx = typeof item.x === 'number' ? item.x : (typeof item.cx === 'number' ? item.cx : null)
      const cy = typeof item.y === 'number' ? item.y : (typeof item.cy === 'number' ? item.cy : null)
      if (cx !== null && cy !== null) return [cx, cy]
    }
    return null
  }

  // 解析并收集所有有效的自由格与占用格坐标
  const freeCellList: [number, number][] = []
  const occCellList: [number, number][] = []

  if (Array.isArray(map.free_cells)) {
    map.free_cells.forEach((item: any) => {
      const coord = getCellCoord(item, mapW)
      if (coord) freeCellList.push(coord)
    })
  }

  if (Array.isArray(map.occupied_cells)) {
    map.occupied_cells.forEach((item: any) => {
      const coord = getCellCoord(item, mapW)
      if (coord) occCellList.push(coord)
    })
  }

  // 兼容直接发全量 data 数组的情况 (OccupancyGrid: 0=free, 100/1=occupied)
  if (Array.isArray(map.data) && freeCellList.length === 0 && occCellList.length === 0) {
    map.data.forEach((val: number, idx: number) => {
      if (val === 0) {
        const coord = getCellCoord(idx, mapW)
        if (coord) freeCellList.push(coord)
      } else if (val > 0) {
        const coord = getCellCoord(idx, mapW)
        if (coord) occCellList.push(coord)
      }
    })
  }

  let cellX = mapW / 2
  let cellY = mapH / 2

  if (map.origin && hasRobot) {
    cellX = (rx - map.origin.x) / map.resolution
    cellY = (ry - map.origin.y) / map.resolution
  } else if (occCellList.length > 0 || freeCellList.length > 0) {
    // 即使暂无机器人位姿，也根据有效格子分布计算几何中心，确保画面居中
    const all = [...occCellList, ...freeCellList]
    const sumX = all.reduce((acc, c) => acc + c[0], 0)
    const sumY = all.reduce((acc, c) => acc + c[1], 0)
    cellX = sumX / all.length
    cellY = sumY / all.length
  }

  // 3. 以视图中心计算最大半径确定比例尺
  let maxRadius = 20
  const allCells = [...occCellList, ...freeCellList]
  allCells.forEach(([cx, cy]) => {
    const r = Math.max(Math.abs(cx - cellX), Math.abs(cy - cellY))
    if (r > maxRadius) maxRadius = r
  })
  maxRadius += 8

  const halfView = Math.min(containerWidth, containerHeight) / 2
  const baseScale = Math.max(4.0, halfView / maxRadius)

  const viewCX = cellX
  const viewCY = cellY

  ctx.save()
  // 用户手动缩放 / 平移叠加在自动适配之上
  ctx.translate(containerWidth / 2 + slamOnlinePanX.value, containerHeight / 2 + slamOnlinePanY.value)
  ctx.scale(slamOnlineZoom.value, slamOnlineZoom.value)
  ctx.translate(-containerWidth / 2, -containerHeight / 2)

  // 将格子坐标转换为画布像素的内联函数
  const toCanvas = (cx: number, cy: number) => ({
    x: containerWidth  / 2 + (cx - viewCX) * baseScale,
    y: containerHeight / 2 - (cy - viewCY) * baseScale
  })

  // 4. 绘制空闲格（已探测、无障碍）—— 亮灰色
  if (freeCellList.length > 0) {
    ctx.fillStyle = COLOR_FREE
    freeCellList.forEach(([cx, cy]) => {
      const { x, y } = toCanvas(cx, cy)
      ctx.fillRect(x - 0.2, y - 0.2, baseScale + 0.4, baseScale + 0.4)
    })
  }

  // 5. 绘制占用格（有障碍）—— 深色
  if (occCellList.length > 0) {
    ctx.fillStyle = COLOR_OCCUPIED
    occCellList.forEach(([cx, cy]) => {
      const { x, y } = toCanvas(cx, cy)
      ctx.fillRect(x - 0.2, y - 0.2, baseScale + 0.4, baseScale + 0.4)
    })
  }

  // 6. 绘制原点标记（世界坐标 0,0）
  if (map.origin) {
    const oxCell = (0 - map.origin.x) / map.resolution
    const oyCell = (0 - map.origin.y) / map.resolution
    const { x: oxCanvas, y: oyCanvas } = toCanvas(oxCell, oyCell)

    ctx.save()
    ctx.translate(oxCanvas, oyCanvas)
    ctx.scale(1 / slamOnlineZoom.value, 1 / slamOnlineZoom.value)

    ctx.beginPath()
    ctx.arc(0, 0, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#ff3b30'
    ctx.fill()

    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
    ctx.lineWidth = 3
    ctx.strokeText('原点', 0, 8)
    ctx.fillStyle = '#ff6b6b'
    ctx.fillText('原点', 0, 8)

    ctx.restore()
  }

  // 7. 绘制机器人位置（始终在画布中心）
  if (hasRobot) {
    const robotCanvasX = containerWidth / 2
    const robotCanvasY = containerHeight / 2

    ctx.save()
    ctx.translate(robotCanvasX, robotCanvasY)
    ctx.scale(1 / slamOnlineZoom.value, 1 / slamOnlineZoom.value)

    // 1. 方向箭头（最底层，其底盘和描边会被上层的白色外圈完美遮挡/裁剪，只露出外部的尖尖和白边）
    ctx.save()
    ctx.rotate(-theta)
    ctx.beginPath()
    ctx.moveTo(15, 0) // 顶点缩短至 15
    ctx.lineTo(4, -6.5) // 基底加宽至 6.5
    ctx.lineTo(4, 6.5)
    ctx.closePath()
    ctx.fillStyle = '#00a0e9' // 与内圈完全一致的蓝色
    ctx.strokeStyle = '#ffffff' // 白色描边
    ctx.lineWidth = 2.2 // 边框粗细保持 2.2px，匹配圆形白圈的厚度
    ctx.stroke()
    ctx.fill()
    ctx.restore()

    // 2. 外圈（白色底色，中层，覆盖在箭头底盘之上，确保圆形边框完美闭合并完整显示）
    ctx.beginPath()
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 1
    ctx.fill()
    ctx.shadowColor = 'transparent' // 清除阴影

    // 3. 内圈（科技蓝色，最上层，完成圆形的内圈填充）
    ctx.beginPath()
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2)
    ctx.fillStyle = '#00a0e9'
    ctx.fill()

    // 4. 标签（无人车字样）
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'
    ctx.lineWidth = 3
    ctx.strokeText('无人车', 0, 16)
    ctx.fillStyle = '#67d5fd'
    ctx.fillText('无人车', 0, 16)

    ctx.restore()
  }

  ctx.restore() // 恢复用户缩放/平移变换
}

// Mouse events handling for zoom and drag pan
let isDraggingSlamOnline = false
let startDragX = 0
let startDragY = 0

const handleSlamOnlineMouseDown = (e: MouseEvent) => {
  isDraggingSlamOnline = true
  startDragX = e.clientX - slamOnlinePanX.value
  startDragY = e.clientY - slamOnlinePanY.value
  if (slamOnlineCanvasRef.value) {
    slamOnlineCanvasRef.value.style.cursor = 'grabbing'
  }
}

const handleSlamOnlineMouseMove = (e: MouseEvent) => {
  if (!isDraggingSlamOnline) return
  slamOnlinePanX.value = e.clientX - startDragX
  slamOnlinePanY.value = e.clientY - startDragY
  if (robotStore.slamGridMapData) {
    drawSlamOnlineGridMap(robotStore.slamGridMapData)
  }
}

const handleSlamOnlineMouseUp = () => {
  isDraggingSlamOnline = false
  if (slamOnlineCanvasRef.value) {
    slamOnlineCanvasRef.value.style.cursor = 'grab'
  }
}

const handleSlamOnlineWheel = (e: WheelEvent) => {
  const zoomFactor = 1.1
  if (e.deltaY < 0) {
    slamOnlineZoom.value = Math.min(15, slamOnlineZoom.value * zoomFactor)
  } else {
    slamOnlineZoom.value = Math.max(0.15, slamOnlineZoom.value / zoomFactor)
  }
  if (robotStore.slamGridMapData) {
    drawSlamOnlineGridMap(robotStore.slamGridMapData)
  }
}

// RAF handle for throttling slam grid map renders to screen refresh rate (~60fps)
let slamRafId: number | null = null

// Watchers for drawing grid map
watch(() => robotStore.slamGridMapData, (newMap) => {
  if (!slamOnlineMapDialogVisible.value || !newMap) return
  // Throttle renders to one per animation frame (≤ 60fps)
  // even if WebSocket pushes data faster than the screen can refresh
  if (slamRafId !== null) return
  slamRafId = requestAnimationFrame(() => {
    slamRafId = null
    const map = robotStore.slamGridMapData
    if (slamOnlineMapDialogVisible.value && map) {
      drawSlamOnlineGridMap(map)
    }
  })
}, { deep: true })

watch(() => robotStore.slamPoseData, (newPose) => {
  if (!slamOnlineMapDialogVisible.value || !newPose) return
  if (slamRafId !== null) return
  slamRafId = requestAnimationFrame(() => {
    slamRafId = null
    const map = robotStore.slamGridMapData
    if (slamOnlineMapDialogVisible.value && map) {
      drawSlamOnlineGridMap(map)
    }
  })
}, { deep: true })

watch(slamOnlineMapDialogVisible, (visible) => {
  if (visible) {
    // Reset zoom and pan on opening
    slamOnlineZoom.value = 1.0
    slamOnlinePanX.value = 0
    slamOnlinePanY.value = 0
    // 如果内存中已存在栅格地图数据，打开弹窗时立即渲染首帧，无需等待下一次推送
    if (robotStore.slamGridMapData) {
      drawSlamOnlineGridMap(robotStore.slamGridMapData)
    }
  } else {
    // 弹窗关闭时取消尚未执行的渲染帧，防止泄漏
    if (slamRafId !== null) {
      cancelAnimationFrame(slamRafId)
      slamRafId = null
    }
  }
})

// Auto open/close grid map popup when slam online state changes
watch(isSlamOnline, (isActive) => {
  if (isActive) {
    // 清除上次残留的栅格图数据，避免弹窗打开时显示旧数据
    robotStore.clearSlamGridMap()
    // 只有本端主动开启并提交名称时才自动弹出，此处不再对所有终端强制弹出，防止干扰其他端用户
    
    // 如果内存里的地图名称为空，尝试恢复
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (robotId && !slamOnlineActiveName.value) {
      const cachedName = localStorage.getItem(`slam_online_active_name_${robotId}`)
      if (cachedName) {
        slamOnlineActiveName.value = cachedName
      } else if (robotStore.cmdStatus?.map_name) {
        slamOnlineActiveName.value = robotStore.cmdStatus.map_name
      }
    }
  } else {
    // cmd_status 反馈确认已关闭，释放 loading 并清理状态
    if (slamOnlineBtnLoading.value) {
      slamOnlineBtnLoading.value = false
    }
    localSlamOnlineActive.value = false
    slamOnlineActiveName.value = ''
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (robotId) {
      localStorage.removeItem(`slam_online_active_name_${robotId}`)
    }
    void refreshMapListCache()
    slamOnlineMapDialogVisible.value = false
  }
})

const confirmStartSlamOnline = async () => {
  const name = slamOnlineMapName.value.trim()
  if (!name) {
    showErrorMessage('请输入地图名称')
    return
  }
  if (isSlamOnlineMapNameDuplicate.value) {
    showErrorMessage('地图名称已存在')
    return
  }

  if (slamOnlineLoading.value) return
  slamOnlineLoading.value = true
  slamOnlineBtnLoading.value = true

  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }

    await navigationApi.slamOnline(robotId, {
      action: 1,
      map_name: name
    })

    localSlamOnlineActive.value = true
    slamOnlineActiveName.value = name  // 保存地图名称，关闭时传回
    if (robotId) {
      localStorage.setItem(`slam_online_active_name_${robotId}`, name)
    }
    slamOnlineDialogVisible.value = false
    showSuccessMessage('开始实时建图指令已发送')
    void refreshMapListCache()
    // 清除上次残留的栅格图数据，避免弹窗打开时显示旧数据
    robotStore.clearSlamGridMap()
    // Open the map rendering popup
    slamOnlineMapDialogVisible.value = true
  } catch (err: any) {
    console.error('开始实时建图失败:', err)
    const errorMsg = err?.detail || err?.message || '开始实时建图失败'
    showErrorMessage(errorMsg)
  } finally {
    slamOnlineLoading.value = false
    slamOnlineBtnLoading.value = false
  }
}

const cancelStartSlamOnline = () => {
  slamOnlineDialogVisible.value = false
}

const stopSlamOnlineRequest = async () => {
  if (slamOnlineBtnLoading.value) return
  slamOnlineBtnLoading.value = true

  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人')
      slamOnlineBtnLoading.value = false
      return
    }

    const activeMapName = slamOnlineActiveName.value || 
                          localStorage.getItem(`slam_online_active_name_${robotId}`) || 
                          robotStore.cmdStatus?.map_name || 
                          ''

    await navigationApi.slamOnline(robotId, {
      action: 0,
      map_name: activeMapName  // 关闭时传回当前地图名称
    })

    showSuccessMessage('关闭实时建图指令已发送')
    // 不立即释放 loading，等待 isSlamOnline 变为 false（cmd_status 反馈）时再释放
    // 超时保险：5 秒后强制释放
    setTimeout(() => {
      if (slamOnlineBtnLoading.value) {
        slamOnlineBtnLoading.value = false
        localSlamOnlineActive.value = false
        slamOnlineActiveName.value = ''
        if (robotId) {
          localStorage.removeItem(`slam_online_active_name_${robotId}`)
        }
        slamOnlineMapDialogVisible.value = false
      }
    }, 5000)
  } catch (err: any) {
    console.error('关闭实时建图失败:', err)
    const errorMsg = err?.detail || err?.message || '关闭实时建图失败'
    showErrorMessage(errorMsg)
    slamOnlineBtnLoading.value = false
  }
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

type GridMapPoint = { x: number; y: number }
type FeatureAreaType = 'forbidden' | 'stairs' | 'slope' | 'narrow' | 'grass'
type FeatureAreaGeometry = 'area' | 'line'

type FeatureArea = {
  id: string
  name: string
  mapName: string
  type: FeatureAreaType
  taskTypeCode: number
  geometry: FeatureAreaGeometry
  points: GridMapPoint[]
}

type GridMapMeta = {
  resolution: number
  originX: number
  originY: number
}

type TaskJsonArea = {
  shape?: string
  coordinates?: unknown
}

type TaskJsonEntry = {
  type?: unknown
  area?: TaskJsonArea
}

type TaskJsonContent = Record<string, TaskJsonEntry>

const featureAreaTypes: Array<{ value: FeatureAreaType; label: string }> = [
  { value: 'forbidden', label: '禁行区' },
  { value: 'stairs', label: '楼梯' },
  { value: 'slope', label: '斜坡' },
  { value: 'narrow', label: '窄通道' },
  { value: 'grass', label: '草地' },
]

const FEATURE_AREA_FILE_NAME = 'task.json'
const featureAreaTypeCodeMap: Record<FeatureAreaType, number> = {
  forbidden: 0,
  stairs: 1,
  slope: 2,
  narrow: 3,
  grass: 4,
}
const featureAreaTypeByCode = new Map<number, FeatureAreaType>(
  Object.entries(featureAreaTypeCodeMap).map(([type, code]) => [code, type as FeatureAreaType])
)
const isFeatureAreaPanelOpen = ref(false)
const isFeatureAreaDrawing = ref(false)
const featureAreaPreviewVisible = ref(false)
const selectedFeatureAreaType = ref<FeatureAreaType>('forbidden')
const selectedFeatureAreaGeometry = ref<FeatureAreaGeometry>('area')
const selectedFeatureAreaId = ref('')
const featureAreaDraftPoints = ref<GridMapPoint[]>([])
const featureAreas = ref<FeatureArea[]>([])
const featureAreaLoadedNames = ref<Set<string>>(new Set())
const featureAreaCanvasSize = ref({ width: 0, height: 0 })
const featureAreaOverlayStyle = ref<Record<string, string>>({})
const gridMapMeta = ref<GridMapMeta | null>(null)
const featureAreaNameInput = ref<HTMLInputElement | null>(null)
const featureAreaNameDialog = ref({
  visible: false,
  name: '',
  error: '',
})
const canSubmitFeatureArea = computed(() => featureAreaDraftPoints.value.length >= 2 && !!selectedEditMap.value)
const canUndoFeatureAreaStep = computed(() => featureAreaDraftPoints.value.length > 0)
const canDeleteSelectedFeatureArea = computed(() => {
  return Boolean(selectedFeatureAreaId.value && featureAreas.value.some(area => area.id === selectedFeatureAreaId.value))
})
const featureAreaTypeLabelMap = computed<Record<FeatureAreaType, string>>(() => {
  return featureAreaTypes.reduce((labels, type) => {
    labels[type.value] = type.label
    return labels
  }, {} as Record<FeatureAreaType, string>)
})
const featureAreaSelectOptions = computed(() => {
  return featureAreas.value.map((area, index) => ({
    value: area.id,
    label: area.name || `${area.geometry === 'line' ? '线段' : '区域'}-${featureAreaTypeLabelMap.value[area.type]} ${index + 1}`,
  }))
})
const visibleFeatureAreas = computed(() => {
  if (!featureAreaPreviewVisible.value) return []
  if (!selectedFeatureAreaId.value) return featureAreas.value
  return featureAreas.value.filter(area => area.id === selectedFeatureAreaId.value)
})
const shouldShowFeatureAreaOverlay = computed(() => {
  return Boolean(
    featureAreaCanvasSize.value.width > 0
      && featureAreaCanvasSize.value.height > 0
      && !gridMapLoading.value
      && !gridMapError.value
      && (featureAreaPreviewVisible.value || isFeatureAreaDrawing.value || featureAreaDraftPoints.value.length > 0)
  )
})

const pointsToSvg = (points: GridMapPoint[]) => {
  return points.map(point => `${point.x},${point.y}`).join(' ')
}

const getAreaCenter = (points: GridMapPoint[]) => {
  if (!points || points.length === 0) return { x: 0, y: 0 }
  let sumX = 0
  let sumY = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
  }
  return {
    x: sumX / points.length,
    y: sumY / points.length,
  }
}

const parseTaskJsonCoordinates = (rawCoordinates: unknown): Array<[number, number]> => {
  if (!Array.isArray(rawCoordinates)) return []
  return rawCoordinates
    .map((point: any) => {
      if (!Array.isArray(point) || point.length < 2) return null
      const x = Number(point[0])
      const y = Number(point[1])
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
      return [x, y] as [number, number]
    })
    .filter((point): point is [number, number] => !!point)
}

const parseGridMapYaml = (text: string): GridMapMeta | null => {
  const resolutionMatch = text.match(/^\s*resolution\s*:\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*$/im)
  const originMatch = text.match(/^\s*origin\s*:\s*\[\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*,\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*(?:,\s*[-+]?\d*\.?\d+(?:e[-+]?\d+)?\s*)?\]\s*$/im)
  const resolution = Number(resolutionMatch?.[1])
  const originX = Number(originMatch?.[1])
  const originY = Number(originMatch?.[2])
  if (!Number.isFinite(resolution) || resolution <= 0 || !Number.isFinite(originX) || !Number.isFinite(originY)) {
    return null
  }
  return { resolution, originX, originY }
}

const loadGridMapMeta = async (mapName = selectedEditMap.value) => {
  if (!mapName) {
    gridMapMeta.value = null
    return
  }

  try {
    let blob = await getMapFile(mapName, 'gridMap.yaml')
    if (!blob || blob.size === 0) {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        const downloadedBlob = await mapFileApi.downloadMapFile(robotId, mapName, 'gridMap.yaml', true)
        if (downloadedBlob) {
          await saveMapFile(mapName, 'gridMap.yaml', downloadedBlob)
          blob = downloadedBlob
        }
      }
    }

    if (!blob || blob.size === 0) {
      gridMapMeta.value = null
      return
    }
    gridMapMeta.value = parseGridMapYaml(await blob.text())
  } catch (error) {
    console.error('读取栅格地图配置失败:', error)
    gridMapMeta.value = null
  }
}

const canvasPointToMapCoordinate = (point: GridMapPoint): [number, number] => {
  const canvas = gridMapCanvas.value
  const meta = gridMapMeta.value
  if (!canvas || !meta) return [point.x, point.y]

  const x = meta.originX + point.x * meta.resolution
  const y = meta.originY + (canvas.height - point.y) * meta.resolution
  return [
    Number(x.toFixed(6)),
    Number(y.toFixed(6)),
  ]
}

const mapCoordinateToCanvasPoint = (coordinate: [number, number]): GridMapPoint => {
  const canvas = gridMapCanvas.value
  const meta = gridMapMeta.value
  if (!canvas || !meta) {
    return { x: coordinate[0], y: coordinate[1] }
  }

  return {
    x: Math.round((coordinate[0] - meta.originX) / meta.resolution),
    y: Math.round(canvas.height - (coordinate[1] - meta.originY) / meta.resolution),
  }
}

const normalizeTaskShape = (shape: unknown): FeatureAreaGeometry => {
  return String(shape || '').toLowerCase() === 'polyline' ? 'line' : 'area'
}

const parseTaskJsonContentFromBlob = async (blob: Blob | null): Promise<TaskJsonContent> => {
  if (!blob || blob.size === 0) return {}
  try {
    const parsed = JSON.parse(await blob.text())
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as TaskJsonContent
  } catch (error) {
    console.error('解析 task.json 失败:', error)
    return {}
  }
}

const readExistingTaskJsonContent = async (robotId: string, mapName: string): Promise<TaskJsonContent> => {
  const serverBlob = await mapFileApi.downloadMapFile(robotId, mapName, FEATURE_AREA_FILE_NAME, true)
  if (serverBlob) {
    await saveMapFile(mapName, FEATURE_AREA_FILE_NAME, serverBlob)
    return parseTaskJsonContentFromBlob(serverBlob)
  }

  const cachedBlob = await getMapFile(mapName, FEATURE_AREA_FILE_NAME)
  return parseTaskJsonContentFromBlob(cachedBlob)
}

const buildTaskJsonContent = (baseContent: TaskJsonContent = {}): TaskJsonContent => {
  const content: TaskJsonContent = { ...baseContent }
  const currentNames = new Set(featureAreas.value.map(area => area.name))

  featureAreaLoadedNames.value.forEach((name) => {
    if (!currentNames.has(name)) {
      delete content[name]
    }
  })

  featureAreas.value.forEach((area) => {
    content[area.name] = {
      type: area.taskTypeCode,
      area: {
        shape: area.geometry === 'line' ? 'Polyline' : 'Polygon',
        coordinates: area.points.map(canvasPointToMapCoordinate),
      },
    }
  })

  return content
}

const loadFeatureAreasForMap = async (mapName = selectedEditMap.value) => {
  if (!mapName) {
    featureAreas.value = []
    featureAreaLoadedNames.value = new Set()
    return
  }

  try {
    let blob: Blob | null = null
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (robotId) {
      const downloadedBlob = await mapFileApi.downloadMapFile(robotId, mapName, FEATURE_AREA_FILE_NAME, true)
      if (downloadedBlob) {
        await saveMapFile(mapName, FEATURE_AREA_FILE_NAME, downloadedBlob)
        blob = downloadedBlob
      }
    }
    if (!blob || blob.size === 0) {
      blob = await getMapFile(mapName, FEATURE_AREA_FILE_NAME)
    }

    if (!blob || blob.size === 0) {
      featureAreas.value = []
      featureAreaLoadedNames.value = new Set()
      return
    }
    const parsed = await parseTaskJsonContentFromBlob(blob)
    if (Object.keys(parsed).length === 0) {
      featureAreas.value = []
      featureAreaLoadedNames.value = new Set()
      return
    }

    featureAreas.value = Object.entries(parsed)
      .map(([name, entry], index): FeatureArea | null => {
        const code = Number(entry?.type)
        const type = featureAreaTypeByCode.get(code) || 'forbidden'
        const taskTypeCode = Number.isFinite(code) ? code : featureAreaTypeCodeMap[type]
        const geometry = normalizeTaskShape(entry?.area?.shape)
        const points = parseTaskJsonCoordinates(entry?.area?.coordinates).map(mapCoordinateToCanvasPoint)
        if (!type || points.length < 2) return null
        const defaultName = `${geometry === 'line' ? '线段' : '区域'}-${featureAreaTypeLabelMap.value[type]} ${index + 1}`
        return {
          id: `${mapName}:${name}`,
          name: String(name || defaultName),
          mapName,
          type,
          taskTypeCode,
          geometry,
          points,
        }
      })
      .filter((area): area is FeatureArea => !!area)
    featureAreaLoadedNames.value = new Set(featureAreas.value.map(area => area.name))
  } catch (error) {
    console.error('读取功能区 task.json 失败:', error)
    featureAreas.value = []
    featureAreaLoadedNames.value = new Set()
  }

  if (selectedFeatureAreaId.value && !featureAreas.value.some(area => area.id === selectedFeatureAreaId.value)) {
    selectedFeatureAreaId.value = ''
  }
}

const saveFeatureAreasForMap = async () => {
  if (!selectedEditMap.value) return

  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    throw new Error('未选择机器人，无法上传功能区文件')
  }

  const mapName = selectedEditMap.value
  const fileName = FEATURE_AREA_FILE_NAME
  const existingContent = await readExistingTaskJsonContent(robotId, mapName)
  const jsonText = JSON.stringify(buildTaskJsonContent(existingContent), null, 2)
  const blob = new Blob([jsonText], { type: 'application/json' })

  showSuccessMessage('正在上传功能区文件...')
  const uploadSuccess = await mapFileApi.uploadMapFile(robotId, mapName, fileName, blob)
  if (!uploadSuccess) {
    throw new Error('上传功能区文件失败')
  }

  const downloadedBlob = await mapFileApi.downloadMapFile(robotId, mapName, fileName)
  await saveMapFile(mapName, fileName, downloadedBlob || blob)
  featureAreaLoadedNames.value = new Set(featureAreas.value.map(area => area.name))
}

const resetFeatureAreaDraft = () => {
  featureAreaDraftPoints.value = []
  isFeatureAreaDrawing.value = false
  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = getCanvasCursor()
  }
}

const syncFeatureAreaOverlay = () => {
  const canvas = gridMapCanvas.value
  if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
    featureAreaCanvasSize.value = { width: 0, height: 0 }
    featureAreaOverlayStyle.value = {}
    return
  }

  featureAreaCanvasSize.value = {
    width: canvas.width,
    height: canvas.height,
  }
  featureAreaOverlayStyle.value = {
    width: canvas.style.width || `${canvas.width}px`,
    height: canvas.style.height || `${canvas.height}px`,
    transform: canvas.style.transform || 'translate(0px, 0px)',
  }
}

const getPointOrientation = (a: GridMapPoint, b: GridMapPoint, c: GridMapPoint) => {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
}

const isPointOnSegment = (a: GridMapPoint, b: GridMapPoint, c: GridMapPoint) => {
  const epsilon = 0.000001
  return Math.abs(getPointOrientation(a, b, c)) <= epsilon
    && b.x <= Math.max(a.x, c.x) + epsilon
    && b.x + epsilon >= Math.min(a.x, c.x)
    && b.y <= Math.max(a.y, c.y) + epsilon
    && b.y + epsilon >= Math.min(a.y, c.y)
}

const segmentsIntersect = (a: GridMapPoint, b: GridMapPoint, c: GridMapPoint, d: GridMapPoint) => {
  const epsilon = 0.000001
  const o1 = getPointOrientation(a, b, c)
  const o2 = getPointOrientation(a, b, d)
  const o3 = getPointOrientation(c, d, a)
  const o4 = getPointOrientation(c, d, b)

  if (Math.abs(o1) <= epsilon && isPointOnSegment(a, c, b)) return true
  if (Math.abs(o2) <= epsilon && isPointOnSegment(a, d, b)) return true
  if (Math.abs(o3) <= epsilon && isPointOnSegment(c, a, d)) return true
  if (Math.abs(o4) <= epsilon && isPointOnSegment(c, b, d)) return true

  return (o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0)
}

const featureAreaHasSelfIntersection = (points: GridMapPoint[], closePath: boolean) => {
  if (points.length < 4) return false

  const edgeCount = closePath ? points.length : points.length - 1
  const edges = Array.from({ length: edgeCount }, (_, index) => ({
    start: points[index],
    end: points[(index + 1) % points.length],
  }))

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const isAdjacent = Math.abs(i - j) === 1 || (closePath && i === 0 && j === edges.length - 1)
      if (isAdjacent) continue
      if (segmentsIntersect(edges[i].start, edges[i].end, edges[j].start, edges[j].end)) {
        return true
      }
    }
  }

  return false
}

const setFeatureAreaGeometry = (geometry: FeatureAreaGeometry) => {
  if (selectedFeatureAreaGeometry.value === geometry) return

  const nextPoints = featureAreaDraftPoints.value
  if (nextPoints.length >= 4 && featureAreaHasSelfIntersection(nextPoints, geometry === 'area')) {
    showErrorMessage('当前标记点切换后会产生交叉，请先撤销冲突点')
    return
  }

  selectedFeatureAreaGeometry.value = geometry
  featureAreaPreviewVisible.value = true
}

const addFeatureAreaPoint = (point: GridMapPoint) => {
  const canvas = gridMapCanvas.value
  if (!canvas) return
  if (point.x < 0 || point.y < 0 || point.x >= canvas.width || point.y >= canvas.height) return

  const exists = featureAreaDraftPoints.value.some(item => item.x === point.x && item.y === point.y)
  if (exists) {
    showErrorMessage('该标记点已存在，请选择其他位置')
    return
  }

  const nextPoints = [...featureAreaDraftPoints.value, point]
  if (nextPoints.length >= 4 && featureAreaHasSelfIntersection(nextPoints, selectedFeatureAreaGeometry.value === 'area')) {
    showErrorMessage('标记连线存在交叉，请重新选择标记点')
    return
  }

  featureAreaDraftPoints.value = nextPoints
  featureAreaPreviewVisible.value = true
}

const toggleFeatureAreaPreview = () => {
  featureAreaPreviewVisible.value = !featureAreaPreviewVisible.value
}

const undoFeatureAreaStep = () => {
  if (featureAreaDraftPoints.value.length > 0) {
    featureAreaDraftPoints.value = featureAreaDraftPoints.value.slice(0, -1)
    featureAreaPreviewVisible.value = true
  }
}

const deleteSelectedFeatureArea = async () => {
  if (!selectedFeatureAreaId.value) return

  const removedId = selectedFeatureAreaId.value
  const previousAreas = [...featureAreas.value]
  const nextAreas = featureAreas.value.filter(area => area.id !== selectedFeatureAreaId.value)
  if (nextAreas.length === featureAreas.value.length) {
    selectedFeatureAreaId.value = ''
    return
  }

  featureAreas.value = nextAreas
  selectedFeatureAreaId.value = ''
  featureAreaPreviewVisible.value = true
  try {
    await saveFeatureAreasForMap()
    showSuccessMessage('功能区已删除')
  } catch (error) {
    featureAreas.value = previousAreas
    selectedFeatureAreaId.value = removedId
    console.error('删除功能区失败:', error)
    showErrorMessage('删除功能区失败: ' + (error as Error).message)
  }
}

const openFeatureAreaNameDialog = () => {
  featureAreaNameDialog.value = {
    visible: true,
    name: '',
    error: '',
  }
  nextTick(() => {
    featureAreaNameInput.value?.focus()
  })
}

const cancelFeatureAreaNameDialog = () => {
  featureAreaNameDialog.value.visible = false
  featureAreaNameDialog.value.error = ''
}

const confirmFeatureAreaNameDialog = async () => {
  const name = featureAreaNameDialog.value.name.trim()
  if (!name) {
    featureAreaNameDialog.value.error = '请输入功能区名称'
    return
  }

  const isDuplicateName = featureAreas.value.some(area => area.name.trim() === name)
  if (isDuplicateName) {
    featureAreaNameDialog.value.error = '功能区名称已存在'
    return
  }

  const area: FeatureArea = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    mapName: selectedEditMap.value,
    type: selectedFeatureAreaType.value,
    taskTypeCode: featureAreaTypeCodeMap[selectedFeatureAreaType.value],
    geometry: selectedFeatureAreaGeometry.value,
    points: featureAreaDraftPoints.value.map(point => ({ ...point })),
  }

  const previousAreas = [...featureAreas.value]
  featureAreas.value = [...featureAreas.value, area]
  selectedFeatureAreaId.value = area.id
  try {
    await saveFeatureAreasForMap()
    featureAreaDraftPoints.value = []
    isFeatureAreaDrawing.value = false
    featureAreaPreviewVisible.value = true
    featureAreaNameDialog.value.visible = false
    featureAreaNameDialog.value.error = ''

    const canvas = gridMapCanvas.value
    if (canvas) {
      canvas.style.cursor = getCanvasCursor()
    }

    showSuccessMessage('功能区已提交')
  } catch (error) {
    featureAreas.value = previousAreas
    selectedFeatureAreaId.value = ''
    console.error('提交功能区失败:', error)
    featureAreaNameDialog.value.error = '提交功能区失败: ' + (error as Error).message
  }
}

const startFeatureAreaDrawing = () => {
  if (!selectedEditMap.value) {
    showErrorMessage('请先选择地图')
    return
  }
  if (gridMapLoading.value || gridMapError.value || !gridMapCanvas.value || gridMapCanvas.value.width <= 0) {
    showErrorMessage('栅格图未加载，无法添加功能区')
    return
  }

  isEditMode.value = false
  navMode.value = 'pan'
  drawing = false
  isDragging = false
  featureAreaDraftPoints.value = []
  isFeatureAreaDrawing.value = true
  featureAreaPreviewVisible.value = true
  hideEraserPreview()

  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = getCanvasCursor()
  }
}

const toggleFeatureAreaPanel = () => {
  isFeatureAreaPanelOpen.value = !isFeatureAreaPanelOpen.value

  if (isFeatureAreaPanelOpen.value) {
    isEditMode.value = false
    navMode.value = 'pan'
    loadFeatureAreasForMap()
    hideEraserPreview()
  } else {
    resetFeatureAreaDraft()
  }

  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = getCanvasCursor()
  }
}

const submitFeatureArea = () => {
  if (!selectedEditMap.value) {
    showErrorMessage('请先选择地图')
    return
  }
  if (featureAreaDraftPoints.value.length < 2) {
    showErrorMessage('请至少添加两个标记点')
    return
  }
  if (featureAreaDraftPoints.value.length >= 4 && featureAreaHasSelfIntersection(featureAreaDraftPoints.value, selectedFeatureAreaGeometry.value === 'area')) {
    showErrorMessage('标记连线存在交叉，请调整标记点')
    return
  }

  openFeatureAreaNameDialog()
}

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

// ==================== 重定位 (Relocate) 相关逻辑 ====================
const reloModalVisible = ref(false)
const reloCanvas = ref<HTMLCanvasElement | null>(null)
const reloContainer = ref<HTMLElement | null>(null)
const reloMapLoading = ref(false)
const reloMapError = ref('')
const reloMapMeta = ref<GridMapMeta | null>(null)

// 缩放和偏移
let reloScale = 1
let reloOffsetX = 0
let reloOffsetY = 0

// 拖动平移地图状态
let reloIsPanning = false
let reloPanStartX = 0
let reloPanStartY = 0

// 绘制方向箭头状态
const reloArrow = ref<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
let reloIsDrawingArrow = false

// 用于保存静态地图背景的离屏 canvas
let reloOffscreenCanvas: HTMLCanvasElement | null = null

// 居中显示车辆
const checkAndResizeReloCanvas = () => {
  const canvas = reloCanvas.value
  const parent = reloContainer.value
  if (!canvas || !parent) return false

  const sw = parent.clientWidth
  const sh = parent.clientHeight

  if (sw > 0 && sh > 0 && (canvas.width !== sw || canvas.height !== sh)) {
    canvas.width = sw
    canvas.height = sh
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.transform = ''
    return true
  }
  return false
}

// 居中显示车辆
const reloCenterOnRobot = () => {
  const meta = reloMapMeta.value
  const canvas = reloCanvas.value
  const parent = reloContainer.value
  if (!meta || !canvas || !parent || !reloOffscreenCanvas) return

  const mapWidth = reloOffscreenCanvas.width
  const mapHeight = reloOffscreenCanvas.height

  const sw = parent.clientWidth
  const sh = parent.clientHeight
  if (sw <= 0 || sh <= 0) {
    setTimeout(reloCenterOnRobot, 50)
    return
  }

  const pose = robotStore.pose
  let px = mapWidth / 2
  let py = mapHeight / 2

  if (pose) {
    px = (pose.x - meta.originX) / meta.resolution
    py = mapHeight - (pose.y - meta.originY) / meta.resolution
  }

  const baseScale = Math.min(sw / mapWidth, sh / mapHeight)
  const finalScale = baseScale * reloScale

  reloOffsetX = (mapWidth / 2 - px) * finalScale
  reloOffsetY = (mapHeight / 2 - py) * finalScale
  applyReloTransform()
}

// 应用 transform
const applyReloTransform = () => {
  checkAndResizeReloCanvas()
  drawReloCanvas()
}

// 获取重定位 Canvas 上的坐标 (逆变换)
const getReloCanvasCoords = (e: MouseEvent) => {
  const canvas = reloCanvas.value
  if (!canvas || !reloOffscreenCanvas) return { x: 0, y: 0 }

  checkAndResizeReloCanvas()

  const rect = canvas.getBoundingClientRect()
  // 计算鼠标相对 Canvas 的 client 坐标
  const rx = e.clientX - rect.left
  const ry = e.clientY - rect.top

  // 缩放到 Canvas 绘图缓冲区的坐标空间，消除任何 CSS 缩放/DPI 影响
  const mx = rx * (canvas.width / rect.width)
  const my = ry * (canvas.height / rect.height)

  const sw = canvas.width
  const sh = canvas.height
  const mapWidth = reloOffscreenCanvas.width
  const mapHeight = reloOffscreenCanvas.height

  const baseScale = Math.min(sw / mapWidth, sh / mapHeight)
  const finalScale = baseScale * reloScale

  const centerX = (sw - mapWidth * finalScale) / 2 + reloOffsetX
  const centerY = (sh - mapHeight * finalScale) / 2 + reloOffsetY

  return {
    x: Math.floor((mx - centerX) / finalScale),
    y: Math.floor((my - centerY) / finalScale)
  }
}

// 绘制车辆图标 (在屏幕 1:1 像素坐标系下绘制，保证极其清晰)
const drawRobot = (ctx: CanvasRenderingContext2D, px: number, py: number, theta: number) => {
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(-theta) // Canvas 与地图 Y 轴方向相反，旋转方向取反

  // 绘制一个三角箭头，参考点云图风格
  ctx.fillStyle = '#ff00ff' // 洋红色 (与点云图中的小车图标一致)
  ctx.strokeStyle = '#ffffff' // 白色描边使箭头轮廓清晰
  ctx.lineWidth = 2 // 使用 2px 绘制边缘保证无半像素模糊

  ctx.beginPath()
  ctx.moveTo(10, 0)      // 箭头顶点
  ctx.lineTo(-10, -7)    // 左下角
  ctx.lineTo(-6, 0)     // 尾端收缩点
  ctx.lineTo(-10, 7)     // 右下角
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

// 绘制方向箭头 (拖拽时在屏幕 1:1 像素坐标系下绘制)
const drawArrow = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) => {
  ctx.save()
  ctx.strokeStyle = '#ff3366'
  ctx.fillStyle = '#ff3366'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.shadowBlur = 4
  ctx.shadowColor = 'rgba(255, 51, 102, 0.4)' // 增加轻微发光立体感

  // 画主干线
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  // 画箭头头部
  const angle = Math.atan2(endY - startY, endX - startX)
  const arrowLength = 12
  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// 绘制重定位 Canvas
const drawReloCanvas = () => {
  const canvas = reloCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !reloOffscreenCanvas) return

  checkAndResizeReloCanvas()

  const sw = canvas.width
  const sh = canvas.height
  const mapWidth = reloOffscreenCanvas.width
  const mapHeight = reloOffscreenCanvas.height

  const baseScale = Math.min(sw / mapWidth, sh / mapHeight)
  const finalScale = baseScale * reloScale

  const centerX = (sw - mapWidth * finalScale) / 2 + reloOffsetX
  const centerY = (sh - mapHeight * finalScale) / 2 + reloOffsetY

  // 1. 清理
  ctx.clearRect(0, 0, sw, sh)

  // 2. 绘制静态地图 (进行缩放和偏移)
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.scale(finalScale, finalScale)
  ctx.imageSmoothingEnabled = finalScale < 1.0 // 放大时保留边缘，缩小时开启平滑避免噪点
  ctx.drawImage(reloOffscreenCanvas, 0, 0)
  ctx.restore()

  const meta = reloMapMeta.value

  // 3. 绘制地图坐标原点 (0, 0) (1:1 物理像素绘制，保证清晰度)
  if (meta) {
    const navOriginX = navPointCloudNavigationOrigin.value?.x ?? 0
    const navOriginY = navPointCloudNavigationOrigin.value?.y ?? 0
    const px_origin = (navOriginX - meta.originX) / meta.resolution
    const py_origin = mapHeight - (navOriginY - meta.originY) / meta.resolution
    const sx_origin = centerX + px_origin * finalScale
    const sy_origin = centerY + py_origin * finalScale

    ctx.save()
    ctx.translate(sx_origin, sy_origin)

    // 绘制红色圆点
    ctx.beginPath()
    ctx.arc(0, 0, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#ff3b30'
    ctx.fill()

    // 绘制文字说明 (具有白色描边的红色文字 "原点")
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const originText = '原点'

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeText(originText, 0, 8)

    ctx.fillStyle = '#ff3b30'
    ctx.fillText(originText, 0, 8)

    ctx.restore()
  }

  // 4. 绘制车辆当前位置 (1:1 物理像素绘制，杜绝拉伸模糊)
  const pose = robotStore.pose
  if (pose && meta) {
    const px = (pose.x - meta.originX) / meta.resolution
    const py = mapHeight - (pose.y - meta.originY) / meta.resolution
    const sx = centerX + px * finalScale
    const sy = centerY + py * finalScale
    drawRobot(ctx, sx, sy, pose.theta)
  }

  // 5. 绘制重定位拖拽方向箭头 (1:1 物理像素绘制，杜绝拉伸模糊)
  if (reloArrow.value) {
    const arrow = reloArrow.value
    const sx0 = centerX + arrow.startX * finalScale
    const sy0 = centerY + arrow.startY * finalScale
    const sx1 = centerX + arrow.endX * finalScale
    const sy1 = centerY + arrow.endY * finalScale
    drawArrow(ctx, sx0, sy0, sx1, sy1)
  }
}

// 加载地图
const loadReloGridMap = async (mapName: string) => {
  if (!mapName) return

  try {
    reloMapLoading.value = true
    reloMapError.value = ''

    await nextTick()
    const canvas = reloCanvas.value
    if (!canvas) {
      reloMapLoading.value = false
      return
    }

    // 获取地图元数据
    let yamlBlob = await getMapFile(mapName, 'gridMap.yaml')
    if (!yamlBlob) {
      const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (robotId) {
        yamlBlob = await mapFileApi.downloadMapFile(robotId, mapName, 'gridMap.yaml', true)
        if (yamlBlob) {
          await saveMapFile(mapName, 'gridMap.yaml', yamlBlob)
        }
      }
    }
    if (yamlBlob) {
      reloMapMeta.value = parseGridMapYaml(await yamlBlob.text())
    } else {
      reloMapMeta.value = null
    }

    // 获取地图图像
    let pgmBlob = await getMapFile(mapName, 'gridMap.pgm')
    if (!pgmBlob) {
      try {
        await downloadMapFiles(mapName)
        pgmBlob = await getMapFile(mapName, 'gridMap.pgm')
      } catch (err) {
        console.error('下载重定位地图失败:', err)
      }
    }

    if (!pgmBlob) {
      reloMapError.value = '未找到地图文件，且下载失败'
      reloMapLoading.value = false
      return
    }

    const buffer = await pgmBlob.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // PGM 头部解析
    let ptr = 0
    let tokenCount = 0
    let inComment = false
    let headerTokens: string[] = []

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
      let tokenStart = ptr
      while (ptr < bytes.length && !/\s/.test(String.fromCharCode(bytes[ptr]))) {
        ptr++
      }
      let token = String.fromCharCode(...bytes.subarray(tokenStart, ptr))
      headerTokens.push(token)
      tokenCount++
    }

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

    // 创建离屏 canvas 用于缓存静态地图
    reloOffscreenCanvas = document.createElement('canvas')
    reloOffscreenCanvas.width = width
    reloOffscreenCanvas.height = height
    const offscreenCtx = reloOffscreenCanvas.getContext('2d')
    if (!offscreenCtx) return

    const imageData = offscreenCtx.createImageData(width, height)

    if (magic === 'P5') {
      let p = dataStart
      for (let idx = 0; idx < width * height; idx++) {
        if (p >= bytes.length) break
        const v = bytes[p++]
        const off = idx * 4
        imageData.data[off] = v
        imageData.data[off + 1] = v
        imageData.data[off + 2] = v
        imageData.data[off + 3] = 255
      }
    } else if (magic === 'P2') {
      const textDecoder = new TextDecoder()
      const asciiData = textDecoder.decode(bytes.subarray(dataStart))
      const tokens = asciiData.trim().split(/\s+/)
      for (let idx = 0; idx < width * height; idx++) {
        if (idx >= tokens.length) break
        const v = parseInt(tokens[idx], 10)
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

    // 黑白优化映射
    for (let k = 0; k < imageData.data.length; k += 4) {
      const g = imageData.data[k]
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

    offscreenCtx.putImageData(imageData, 0, 0)

    reloScale = 1
    reloOffsetX = 0
    reloOffsetY = 0
    applyReloTransform()

    // 延时让容器布局稳定后居中
    setTimeout(() => {
      reloCenterOnRobot()
      drawReloCanvas()
    }, 100)

  } catch (err) {
    console.error('加载重定位地图失败:', err)
    reloMapError.value = '加载地图失败: ' + (err as Error).message
  } finally {
    reloMapLoading.value = false
  }
}

// 鼠标操作逻辑
const onReloMouseDown = (e: MouseEvent) => {
  if (e.button === 0) {
    // 左键拖动平移
    reloIsPanning = true
    reloPanStartX = e.clientX - reloOffsetX
    reloPanStartY = e.clientY - reloOffsetY
    e.preventDefault()
  } else if (e.button === 2) {
    // 右键画方向箭头
    reloIsDrawingArrow = true
    const coords = getReloCanvasCoords(e)
    reloArrow.value = {
      startX: coords.x,
      startY: coords.y,
      endX: coords.x,
      endY: coords.y
    }
    e.preventDefault()
  }
}

const onReloMouseMove = (e: MouseEvent) => {
  if (reloIsPanning) {
    reloOffsetX = e.clientX - reloPanStartX
    reloOffsetY = e.clientY - reloPanStartY
    applyReloTransform()
  } else if (reloIsDrawingArrow && reloArrow.value) {
    const coords = getReloCanvasCoords(e)
    reloArrow.value.endX = coords.x
    reloArrow.value.endY = coords.y
    drawReloCanvas()
  }
}

const onReloMouseUp = async (e: MouseEvent) => {
  if (e.button === 0) {
    reloIsPanning = false
  } else if (e.button === 2 && reloIsDrawingArrow && reloArrow.value) {
    reloIsDrawingArrow = false
    const arrow = reloArrow.value
    reloArrow.value = null

    const canvas = reloCanvas.value
    const meta = reloMapMeta.value
    if (!canvas || !meta || !reloOffscreenCanvas) return

    const mapHeight = reloOffscreenCanvas.height

    // 1. 计算重定位地图坐标
    const navOriginX = navPointCloudNavigationOrigin.value?.x ?? 0
    const navOriginY = navPointCloudNavigationOrigin.value?.y ?? 0
    const startX = (meta.originX + arrow.startX * meta.resolution) - navOriginX
    const startY = (meta.originY + (mapHeight - arrow.startY) * meta.resolution) - navOriginY

    // 计算朝向 theta
    // Canvas y 轴朝下，Map y 轴朝上，计算角度时 dy 取反
    const dx = arrow.endX - arrow.startX
    const dy = arrow.startY - arrow.endY
    let theta = 0
    if (Math.hypot(dx, dy) > 5) {
      theta = Math.atan2(dy, dx)
    } else {
      // 拖拽距离太小，使用当前机器人朝向，或默认为 0
      theta = robotStore.pose?.theta || 0
    }

    // 2. 提交数据到 API
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) {
      showErrorMessage('未选择机器人，无法重定位')
      return
    }

    showSuccessMessage('重定位数据发送成功')
    drawReloCanvas()

    navigationApi.setReloPose(robotId, {
      x: Number(startX.toFixed(6)),
      y: Number(startY.toFixed(6)),
      theta: Number(theta.toFixed(6))
    }).catch((err: any) => {
      console.error('后台重定位请求失败:', err)
    })
  }
}

const onReloMouseLeave = () => {
  reloIsPanning = false
  if (reloIsDrawingArrow) {
    reloIsDrawingArrow = false
    reloArrow.value = null
    drawReloCanvas()
  }
}

const onReloWheel = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  reloScale = Math.max(0.2, Math.min(5, reloScale * delta))
  applyReloTransform()
}

// 放大/缩小/重置
const reloZoomIn = () => {
  reloScale = Math.min(5, reloScale * 1.2)
  applyReloTransform()
}

const reloZoomOut = () => {
  reloScale = Math.max(0.2, reloScale / 1.2)
  applyReloTransform()
}

const reloResetZoom = () => {
  reloScale = 1
  reloOffsetX = 0
  reloOffsetY = 0
  applyReloTransform()
  reloCenterOnRobot()
  drawReloCanvas()
}

// 打开 / 关闭重定位弹窗
const openReloModal = () => {
  if (!navigationEnabled.value) {
    showErrorMessage('请先开启导航')
    return
  }
  if (!selectedNavMap.value) {
    showErrorMessage('当前没有选择的导航地图，无法开启重定位')
    return
  }
  reloModalVisible.value = true
  loadReloGridMap(selectedNavMap.value)
}

const closeReloModal = () => {
  reloModalVisible.value = false
  reloArrow.value = null
  reloOffscreenCanvas = null
}

// 监听机器人位置变化，实时更新重定位画面中的车辆图标
watch(() => robotStore.pose, () => {
  if (reloModalVisible.value) {
    drawReloCanvas()
  }
}, { deep: true })

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
    await loadGridMapMeta(mapName)
    
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
    await loadFeatureAreasForMap(mapName)
    
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
  gridMapMeta.value = null
  featureAreas.value = []
  featureAreaLoadedNames.value = new Set()
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
  syncFeatureAreaOverlay()
}

// 监听地图编辑选择变化（store setter 已持久化，无需手动写 localStorage）
watch(selectedEditMap, (newMap) => {
  resetFeatureAreaDraft()
  featureAreaPreviewVisible.value = false
  featureAreaNameDialog.value.visible = false
  featureAreaNameDialog.value.error = ''
  selectedFeatureAreaId.value = ''
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
  if (isEditMode.value) {
    isFeatureAreaPanelOpen.value = false
    resetFeatureAreaDraft()
  }
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
  if (isFeatureAreaDrawing.value) {
    return 'crosshair'
  }
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
  syncFeatureAreaOverlay()
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

    if (isFeatureAreaDrawing.value && e.button === 0 && !e.ctrlKey) {
      addFeatureAreaPoint(coords)
      canvas.style.cursor = getCanvasCursor()
      e.preventDefault()
      return
    }

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

.map-btn-disabled-visual,
.map-btn-disabled-visual:disabled {
  background: rgba(70, 89, 104, 0.36);
  color: rgba(174, 194, 210, 0.62);
  border-color: rgba(120, 141, 157, 0.28);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 1;
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

.track-edit-content {
  padding: 18px 20px 24px;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
}

.track-edit-toolbar {
  width: 100%;
  box-sizing: border-box;
}

.track-edit-toolbar .map-btn.active,
.track-edit-toolbar .map-btn-secondary.active {
  border-color: rgba(103, 213, 253, 0.9);
  background: rgba(31, 163, 211, 0.42);
  color: #d8f7ff;
}

.track-edit-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  gap: 12px;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  height: calc(100vh - 294px);
  box-sizing: border-box;
}

.track-edit-map {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 420px;
  background: rgba(10, 42, 58, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.track-edit-mode-hint {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 2;
  color: #ffcf7a;
  background: rgba(6, 18, 31, 0.78);
  border: 1px solid rgba(255, 177, 59, 0.35);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1;
  pointer-events: none;
}

.track-edit-panel {
  align-self: stretch;
  min-width: 0;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  background:
    linear-gradient(180deg, rgba(8, 35, 52, 0.94), rgba(5, 24, 38, 0.92));
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 12px 26px rgba(1, 10, 20, 0.28), inset 0 1px 0 rgba(162, 231, 255, 0.06);
  scrollbar-width: thin;
  scrollbar-color: rgba(103, 213, 253, 0.5) transparent;
  box-sizing: border-box;
}

.track-edit-panel::-webkit-scrollbar {
  width: 4px;
}

.track-edit-panel::-webkit-scrollbar-track {
  background: transparent;
}

.track-edit-panel::-webkit-scrollbar-thumb {
  background: rgba(103, 213, 253, 0.54);
  border-radius: 999px;
}

.track-edit-panel-section {
  padding: 0 0 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(103, 213, 253, 0.16);
}

.track-edit-panel-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: 0;
}

.track-edit-panel-title {
  color: #d8f7ff;
  font-size: 13px;
  font-weight: 700;
}

.track-edit-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 22px;
  margin-bottom: 12px;
}

.track-edit-panel-heading::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 999px;
  background: #67d5fd;
  box-shadow: 0 0 10px rgba(103, 213, 253, 0.45);
  margin-right: 8px;
}

.track-edit-panel-heading .track-edit-panel-title {
  flex: 1;
}

.track-edit-range-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.track-edit-range-row label {
  color: rgba(184, 220, 245, 0.86);
  font-size: 12px;
}

.track-edit-range-row input {
  min-width: 0;
  height: 34px;
  background: rgba(6, 36, 57, 0.86);
  border: 1px solid rgba(103, 213, 253, 0.34);
  color: #eefbff;
  border-radius: 6px;
  padding: 0 10px;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.track-edit-step-counter {
  display: flex;
  align-items: center;
  height: 34px;
  background: rgba(6, 36, 57, 0.86);
  border: 1px solid rgba(103, 213, 253, 0.34);
  border-radius: 6px;
  overflow: hidden;
}

.track-edit-step-counter .step-btn {
  width: 32px;
  height: 100%;
  border: none;
  background: rgba(13, 63, 94, 0.4);
  color: #cdefff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, color 0.2s ease;
}

.track-edit-step-counter .step-btn:hover:not(:disabled) {
  background: rgba(103, 213, 253, 0.24);
  color: #ffffff;
}

.track-edit-step-counter .step-btn:disabled {
  color: rgba(196, 207, 216, 0.25);
  background: rgba(64, 77, 88, 0.15);
  cursor: not-allowed;
}

.track-edit-step-counter .step-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none !important;
  background: transparent !important;
  color: #eefbff;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  padding: 0;
  pointer-events: none;
}

.track-edit-range-row input:focus {
  background: rgba(7, 45, 70, 0.96);
  border-color: rgba(103, 213, 253, 0.82);
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.12);
}

.track-edit-range-row input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.track-edit-z-row input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.track-edit-z-row input[type='number']::-webkit-outer-spin-button,
.track-edit-z-row input[type='number']::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.track-edit-action-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.track-edit-action {
  height: 36px;
  min-width: 0;
  border: 1px solid rgba(103, 213, 253, 0.28);
  border-radius: 6px;
  background: rgba(8, 42, 65, 0.7);
  color: #cdefff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: transform 0.16s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.track-edit-action:hover:not(:disabled) {
  border-color: rgba(103, 213, 253, 0.64);
  color: #ffffff;
  background: rgba(13, 63, 94, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 12, 24, 0.24);
}

.track-edit-action.primary {
  background: linear-gradient(180deg, rgba(45, 149, 190, 0.7), rgba(21, 92, 128, 0.78));
  border-color: rgba(127, 211, 251, 0.62);
  color: #f2fcff;
}

.track-edit-action.active {
  border-color: rgba(103, 213, 253, 0.9);
  background: rgba(31, 163, 211, 0.42);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(103, 213, 253, 0.12);
}

.track-edit-action.danger {
  background: rgba(82, 24, 29, 0.42);
  border-color: rgba(255, 112, 122, 0.42);
  color: #ffc3c7;
}

.track-edit-action.danger:hover:not(:disabled) {
  background: rgba(116, 34, 42, 0.76);
  border-color: rgba(255, 125, 136, 0.68);
  color: #fff0f1;
}

.track-edit-action:disabled {
  background: rgba(64, 77, 88, 0.38);
  border-color: rgba(150, 165, 178, 0.24);
  color: rgba(196, 207, 216, 0.58);
  box-shadow: none;
  opacity: 1;
  cursor: not-allowed;
}

.track-edit-action-full {
  grid-column: 1 / -1;
}

.track-edit-z-row {
  margin-bottom: 10px;
}

@media (max-width: 1280px) {
  .track-edit-workspace {
    grid-template-columns: 1fr;
    height: auto;
  }

  .track-edit-panel {
    height: auto;
    max-height: none;
  }
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

.feature-area-overlay {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  pointer-events: none;
  z-index: 8;
  overflow: visible;
}

.feature-area-shape {
  fill-opacity: 1;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.feature-area-line {
  fill: none;
  fill-opacity: 0;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.feature-area-line.feature-area-draft,
.feature-area-line.feature-area-forbidden,
.feature-area-line.feature-area-stairs,
.feature-area-line.feature-area-slope,
.feature-area-line.feature-area-narrow,
.feature-area-line.feature-area-grass {
  fill: none;
  fill-opacity: 0;
}

.feature-area-marker {
  stroke: #ffffff;
  stroke-width: 0.8;
  vector-effect: non-scaling-stroke;
}

.feature-area-draft {
  stroke-dasharray: 8 6;
  fill-opacity: 0.25;
}

.feature-area-draft-marker {
  stroke-width: 1;
}

/* Base styles for markers and lines */
.feature-area-forbidden {
  fill: #ef4444;
  stroke: #ef4444;
}

.feature-area-stairs {
  fill: #f59e0b;
  stroke: #f59e0b;
}

.feature-area-slope {
  fill: #8b5cf6;
  stroke: #8b5cf6;
}

.feature-area-narrow {
  fill: #06b6d4;
  stroke: #06b6d4;
}

.feature-area-grass {
  fill: #22c55e;
  stroke: #22c55e;
}

/* Polygons shape style (using patterns) */
.feature-area-shape.feature-area-forbidden {
  fill: url(#pattern-forbidden);
}

.feature-area-shape.feature-area-stairs {
  fill: url(#pattern-stairs);
}

.feature-area-shape.feature-area-slope {
  fill: url(#pattern-slope);
}

.feature-area-shape.feature-area-narrow {
  fill: url(#pattern-narrow);
}

.feature-area-shape.feature-area-grass {
  fill: url(#pattern-grass);
}

/* Marker solid fill override (so markers are not filled with patterns) */
.feature-area-marker.feature-area-forbidden {
  fill: #ef4444;
}

.feature-area-marker.feature-area-stairs {
  fill: #f59e0b;
}

.feature-area-marker.feature-area-slope {
  fill: #8b5cf6;
}

.feature-area-marker.feature-area-narrow {
  fill: #06b6d4;
}

.feature-area-marker.feature-area-grass {
  fill: #22c55e;
}

/* Sidebar preview icon custom styles */
.feature-area-type-icon {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
  border-radius: 2px;
}

.feature-area-type-icon rect:last-child {
  fill-opacity: 1;
}

/* Map area text label styles */
.feature-area-label {
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  font-weight: 600;
  pointer-events: none;
  paint-order: stroke fill;
  stroke: #ffffff;
  stroke-width: 3px;
  stroke-linejoin: round;
}

.feature-area-label.feature-area-forbidden {
  fill: #ef4444;
}

.feature-area-label.feature-area-stairs {
  fill: #f59e0b;
}

.feature-area-label.feature-area-slope {
  fill: #8b5cf6;
}

.feature-area-label.feature-area-narrow {
  fill: #06b6d4;
}

.feature-area-label.feature-area-grass {
  fill: #22c55e;
}

/* Floating legend overlay custom styles */
.feature-area-legend {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  padding: 10px 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 100px;
  pointer-events: auto;
  user-select: none;
}

.legend-title {
  color: #2563eb;
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 2px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 4px;
  text-align: left;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-item-icon {
  flex-shrink: 0;
  border-radius: 2px;
}

.legend-item-icon rect:last-child {
  fill-opacity: 1;
}

.legend-item-label {
  font-size: 12px;
  color: #333333;
  font-weight: 500;
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

/* 右侧功能区面板 */
.feature-area-panel-right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 124px;
  background: linear-gradient(180deg, #244e63 0%, #1c4156 100%);
  border-left: 1px solid rgba(73, 146, 176, 0.5);
  border-radius: 8px;
  display: flex;
  z-index: 101;
  box-shadow: -6px 0 18px rgba(10, 30, 45, 0.24);
  backdrop-filter: blur(4px);
  user-select: none;
  -webkit-user-select: none;
}

.feature-area-panel-content {
  width: 100%;
  height: 100%;
  padding: 18px 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.feature-area-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 0 0 22px;
  position: relative;
}

.feature-area-section + .feature-area-section {
  padding-top: 24px;
}

.feature-area-section + .feature-area-section::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 14px;
  right: 14px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(127, 211, 251, 0.48), transparent);
  box-shadow: 0 1px 0 rgba(5, 29, 42, 0.32);
}

.feature-area-section-middle {
  gap: 11px;
  padding-bottom: 22px;
}

.feature-area-section-submit {
  margin-top: auto;
  padding-top: 20px;
  padding-bottom: 0;
}

.feature-area-mode-switch {
  width: 86px;
  height: 34px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border: 1px solid rgba(127, 211, 251, 0.45);
  border-radius: 7px;
  background: rgba(13, 45, 62, 0.72);
  box-shadow: inset 0 0 0 1px rgba(5, 29, 42, 0.22);
}

.feature-area-mode-switch button {
  min-width: 0;
  border: 0;
  background: transparent;
  color: #cdefff;
  font-size: 13px;
  line-height: 32px;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.feature-area-mode-switch button + button {
  border-left: 1px solid rgba(127, 211, 251, 0.38);
}

.feature-area-mode-switch button:hover {
  background: rgba(66, 149, 186, 0.36);
  color: #ffffff;
}

.feature-area-mode-switch button.active {
  background: #7fd3fb;
  color: #123447;
  font-weight: 600;
  box-shadow: 0 0 12px rgba(127, 211, 251, 0.25);
}

.feature-area-action-btn,
.feature-area-delete-btn,
.feature-area-select,
.feature-area-submit-btn {
  width: 86px;
  min-height: 34px;
  border-radius: 6px;
  border: 1px solid rgba(103, 213, 253, 0.35);
  background: rgba(26, 80, 104, 0.8);
  color: #d5f4ff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.feature-area-select {
  outline: none;
  padding: 0 8px;
}

.feature-area-action-btn:hover:not(:disabled),
.feature-area-delete-btn:hover:not(:disabled),
.feature-area-select:hover,
.feature-area-submit-btn:hover:not(:disabled) {
  background: rgba(66, 149, 186, 0.72);
  border-color: rgba(126, 200, 230, 0.58);
  color: #ffffff;
  box-shadow: 0 6px 12px rgba(10, 30, 45, 0.28);
}

.feature-area-delete-btn {
  border-color: rgba(255, 132, 132, 0.42);
  color: #ffd5d5;
}

.feature-area-delete-btn:hover:not(:disabled) {
  background: rgba(151, 55, 66, 0.58);
  border-color: rgba(255, 150, 150, 0.68);
}

.feature-area-select:focus {
  border-color: #7fd3fb;
  box-shadow: 0 0 0 2px rgba(127, 211, 251, 0.16);
}

.feature-area-select option {
  background: #1c4156;
  color: #d5f4ff;
}

.feature-area-action-btn.active {
  background: #7fd3fb;
  border-color: #7fd3fb;
  color: #123447;
  box-shadow: 0 8px 16px rgba(73, 171, 212, 0.35);
  font-weight: 600;
}

.feature-area-action-btn:disabled,
.feature-area-delete-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.feature-area-type-list {
  width: 86px;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-area-type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  color: #cdefff;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
}

.feature-area-type-option input {
  appearance: none;
  -webkit-appearance: none;
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin: 0;
  border-radius: 50%;
  border: 2px solid rgba(142, 218, 248, 0.82);
  background: rgba(13, 45, 62, 0.72);
  cursor: pointer;
  position: relative;
}

.feature-area-type-option input:checked::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #7fd3fb;
  box-shadow: 0 0 8px rgba(127, 211, 251, 0.5);
}

.feature-area-type-option.active {
  color: #7fd3fb;
  font-weight: 600;
}

.feature-area-submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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

/* 实时建图栅格图弹窗 - 更大尺寸，并提升层级避免被顶部菜单遮挡 */
.recording-dialog-overlay.slam-online-map-overlay {
  z-index: 1000000;
  align-items: flex-start;
  padding-top: 120px;
  padding-bottom: 40px;
}

.recording-dialog-card.slam-online-map-dialog {
  min-width: 1000px;
  max-width: 1400px;
  width: 92vw;
  max-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
}

.recording-dialog-card.slam-online-map-dialog .recording-dialog-body {
  max-height: calc(100vh - 200px);
  overflow: hidden;
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

.feature-area-name-dialog-card {
  width: 420px;
}

.route-create-dialog-card {
  width: 460px;
}

.route-create-summary {
  color: rgba(184, 220, 245, 0.82);
  font-size: 13px;
  margin-bottom: 12px;
}

.route-create-name-row {
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid #1fa3d3;
  border-radius: 4px;
  background: rgba(5, 26, 48, 0.6);
  overflow: hidden;
}

.route-create-name-row span {
  color: #67d5fd;
  font-size: 14px;
  padding: 0 12px;
  background: rgba(31, 163, 211, 0.15);
  height: 40px;
  line-height: 40px;
  border-right: 1px solid #1fa3d3;
  white-space: nowrap;
}

.route-create-name-row input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  color: #fff;
  padding: 0 12px;
  height: 40px;
  outline: none;
  font-size: 14px;
}

.feature-area-name-error {
  margin-top: -8px;
  color: #ff9f9f;
  font-size: 13px;
  line-height: 18px;
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

/* 自定义下拉选择框样式 */
.custom-select-container {
  position: relative;
}

.custom-select-trigger {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  user-select: none;
  padding-right: 30px !important; /* 给绝对定位的箭头留出空间 */
}

.custom-select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.nav-select-arrow svg polygon {
  fill: #67d5fd;
}

.custom-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #0a2a3a;
  border: 1px solid rgba(103, 213, 253, 0.4);
  border-radius: 4px;
  max-height: 200px; /* 限制最大高度，防止顶到底部 */
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.custom-select-option {
  padding: 8px 12px;
  font-size: 13px;
  color: #67d5fd;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.custom-select-option:hover {
  background: rgba(103, 213, 253, 0.15);
  color: #fff;
}

.custom-select-option.is-selected {
  background: rgba(103, 213, 253, 0.3);
  color: #fff;
  font-weight: 500;
}

.custom-select-option.is-empty {
  color: rgba(103, 213, 253, 0.5);
  cursor: default;
  text-align: center;
}

/* 兼容 disabled 触发器的样式 */
.nav-select.is-disabled,
.map-edit-select.is-disabled,
.track-select.is-disabled,
.mission-toolbar-select.is-disabled {
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%) !important;
  border-color: rgba(103, 213, 253, 0.3) !important;
  color: rgba(180, 205, 220, 0.62) !important;
  cursor: not-allowed !important;
  box-shadow:
    inset 0 0 0 1px rgba(103, 213, 253, 0.08) !important;
  filter: saturate(0.72) grayscale(0.22) !important;
  opacity: 1 !important;
}

.nav-select.is-disabled .nav-select-arrow svg polygon,
.map-edit-select.is-disabled .nav-select-arrow svg polygon,
.track-select.is-disabled .track-select-arrow svg polygon,
.mission-toolbar-select.is-disabled .nav-select-arrow svg polygon {
  fill: rgba(168, 192, 210, 0.5) !important;
}

/* 细滚动条，契合网站风格 */
.custom-select-dropdown::-webkit-scrollbar {
  width: 4px;
  height: 4px;
  background: transparent;
}

.custom-select-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.custom-select-dropdown::-webkit-scrollbar-thumb {
  background: rgba(103, 213, 253, 0.3);
  border-radius: 2px;
}

.custom-select-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(103, 213, 253, 0.5);
}

.custom-select-dropdown {
  scrollbar-width: thin;
  scrollbar-color: rgba(103, 213, 253, 0.3) transparent;
}

/* ==================== 重定位弹窗样式 ==================== */
.relo-dialog-card {
  min-width: 800px;
  max-width: 90%;
  width: 850px;
}

.relo-dialog-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relo-instructions {
  color: #9adfff;
  font-size: 13px;
  line-height: 1.4;
  background: rgba(10, 42, 58, 0.5);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(103, 213, 253, 0.15);
}

.relo-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.relo-btn {
  background: rgba(103, 213, 253, 0.1);
  border: 1px solid rgba(103, 213, 253, 0.3);
  color: #67d5fd;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.relo-btn:hover {
  background: rgba(103, 213, 253, 0.2);
  border-color: #67d5fd;
}

.relo-map-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid rgba(103, 213, 253, 0.2);
  overflow: hidden;
  cursor: grab;
}

.relo-map-container:active {
  cursor: grabbing;
}

.relo-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 视图切换与栅格图样式 */
.map-view-switcher-group {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 6px;
  z-index: 100;
}
.view-switch-btn {
  width: 24px;
  height: 24px;
  padding: 4px;
  background: rgba(0, 12, 23, 0.75);
  border: 1px solid rgba(89, 192, 252, 0.35);
  backdrop-filter: blur(8px);
  border-radius: 4px;
  color: rgba(89, 192, 252, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.view-switch-btn:hover {
  color: #fff;
  background: rgba(89, 192, 252, 0.15);
  border-color: rgba(89, 192, 252, 0.75);
}
.view-switch-btn.active {
  color: #fff;
  background: rgba(89, 192, 252, 0.55);
  border-color: #59c0fc;
}
.view-switch-btn svg {
  width: 14px;
  height: 14px;
}
.grid-map-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
}
.grid-map-canvas {
  display: block;
}
.grid-map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  color: #1a1a1a;
  font-size: 14px;
  letter-spacing: 1px;
}
.grid-map-overlay.error {
  background: rgba(255, 77, 79, 0.15);
  color: #ff4d4f;
}

/* 确保高德地图底图文字显示在折线之上，自定义标记显示在文字之上 */
:deep(.amap-vectors) {
  z-index: 110 !important;
}
:deep(.amap-labels) {
  z-index: 115 !important;
}
:deep(.amap-markers) {
  z-index: 120 !important;
}

/* 修正比例尺控件文字颜色（防止继承容器白字导致浅色背景下看不清数值） */
:deep(.amap-scale-text) {
  color: #111111 !important;
  font-weight: bold !important;
  text-shadow: 0 0 3px #ffffff, 0 0 3px #ffffff, 0 0 3px #ffffff !important;
}
:deep(.amap-scale-line) {
  border-color: #111111 !important;
}

/* 机器人地图定位标记样式 */
:deep(.robot-location-indicator) {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 36px;
  height: 36px;
  pointer-events: none;
}
:deep(.robot-location-label) {
  position: absolute;
  top: 38px;
  left: 50%;
  transform: translateX(-50%);
  color: #00a0e9;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
  text-shadow: 0 0 3px #ffffff, 0 0 3px #ffffff;
}

/* 机器人地图原点样式 */
:deep(.map-origin-marker) {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  pointer-events: none;
}
:deep(.map-origin-label) {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  color: #ff3b30;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
  text-shadow: 0 0 3px #ffffff, 0 0 3px #ffffff;
}

/* 机器人地图任务点样式 */
:deep(.robot-map-taskpoint) {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
:deep(.robot-map-taskpoint) .taskpoint-dot {
  width: 18px;
  height: 18px;
  background: #ff9500;
  border: 2px solid #ffffff;
  border-radius: 50%;
  color: #ffffff;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}
:deep(.robot-map-taskpoint) .taskpoint-label {
  position: absolute;
  top: 20px;
  color: #ff9500;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
  text-shadow: 0 0 3px #ffffff, 0 0 3px #ffffff;
  pointer-events: none;
}

/* 地图图层切换器 */
.map-layer-switcher {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.layer-switch-trigger {
  background: rgba(0, 12, 23, 0.75);
  border: 1px solid rgba(89, 192, 252, 0.45);
  backdrop-filter: blur(10px);
  border-radius: 4px;
  color: #59c0fc;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  transition: all 0.2s ease;
}
.layer-switch-trigger:hover {
  background: rgba(89, 192, 252, 0.15);
  color: #fff;
  border-color: rgba(89, 192, 252, 0.8);
}
.layer-switch-trigger svg {
  width: 14px;
  height: 14px;
}
.layer-menu-dropdown {
  margin-top: 6px;
  background: rgba(0, 12, 23, 0.85);
  border: 1px solid rgba(89, 192, 252, 0.35);
  backdrop-filter: blur(12px);
  border-radius: 4px;
  padding: 6px 0;
  width: 110px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
}
.layer-option {
  padding: 8px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
}
.layer-option:hover {
  background: rgba(89, 192, 252, 0.12);
  color: #fff;
}
.layer-option.active {
  color: #59c0fc;
  font-weight: bold;
  background: rgba(89, 192, 252, 0.08);
}
.layer-divider {
  height: 1px;
  background: rgba(89, 192, 252, 0.2);
  margin: 4px 0;
}
.option-checkbox {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(89, 192, 252, 0.5);
  border-radius: 2px;
  display: inline-block;
  position: relative;
  transition: all 0.15s;
}
.option-checkbox.checked {
  background: #59c0fc;
  border-color: #59c0fc;
}
.option-checkbox.checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 1px;
  width: 4px;
  height: 6px;
  border: solid #000;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
.layer-option .option-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  display: inline-block;
}
.layer-option.active .option-icon {
  background: #59c0fc;
  box-shadow: 0 0 6px #59c0fc;
}
.layer-menu-fade-enter-active,
.layer-menu-fade-leave-active {
  transition: all 0.2s ease;
}
.layer-menu-fade-enter-from,
.layer-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* 2D 实时点云切换按钮 - 极简图标样式 */
.grid-map-realtime-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 100;
  width: 28px;
  height: 28px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(6px);
  transition: all 0.2s ease;
}
.grid-map-realtime-btn:hover {
  background: rgba(248, 250, 252, 0.8);
  color: #334155;
  border-color: #cbd5e1;
}
.grid-map-realtime-btn.active {
  background: rgba(59, 130, 246, 0.85);
  color: #ffffff;
  border-color: rgba(59, 130, 246, 0.85);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25);
}
.msf-btn-spinner {
  animation: msf-spin 0.8s linear infinite;
}
@keyframes msf-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
