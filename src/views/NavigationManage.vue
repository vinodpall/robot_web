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
          @click="handleTabClick(tab.key)"
        >
          <img :src="tab.icon" :alt="tab.label" />
        </div>
      </div>
    </aside>
    <!-- 主体内容区 -->
    <main class="main-content">
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
                    @click="handleStartRecording"
                  >
                    开始录包
                  </button>
                  <button 
                    class="map-btn map-btn-secondary" 
                    :disabled="!isRecording"
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
                  <button class="map-btn map-btn-primary" @click="handleGenerateMap">生成地图</button>
                  <button class="map-btn map-btn-primary" @click="handleGenerateGridMap">生成栅格地图</button>
                  <button class="map-btn map-btn-primary" @click="handleCreateFusionMap">新建融合地图</button>
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
                    :class="navigationEnabled ? 'map-btn-danger' : 'map-btn-primary'"
                    @click="handleStartNav"
                  >
                    {{ navigationEnabled ? '关闭导航' : '开始导航' }}
                  </button>
                  <button class="map-btn map-btn-secondary" @click="handlePauseNav">暂停导航</button>
                  <button class="map-btn map-btn-secondary" @click="handleResumeNav">暂停停障</button>
                  <button 
                    class="map-btn" 
                    :class="insEnabled ? 'map-btn-danger' : 'map-btn-primary'"
                    @click="handleStartINS"
                  >
                    {{ insEnabled ? '关闭INS' : '开始INS' }}
                  </button>
                  <button class="map-btn map-btn-primary" @click="handleInitINS">INS初始化</button>
                  <button 
                    class="map-btn" 
                    :class="msfEnabled ? 'map-btn-danger' : 'map-btn-primary'"
                    @click="handleStartMSF"
                  >
                    {{ msfEnabled ? '关闭MSF' : '开始MSF' }}
                  </button>
                  <button class="map-btn map-btn-secondary" @click="handleCircleMode">循迹避障模式</button>
                  <button class="map-btn map-btn-secondary" @click="handleCloseGPS">{{ gpsEnabled ? '关闭GPS' : '开启GPS' }}</button>
                  <button class="map-btn map-btn-secondary" @click="handleSetOrigin">原点设置</button>
                </div>
              </div>

              <!-- 主体内容区 -->
              <div class="nav-main-content">
                <!-- 左侧信息面板 -->
                <div class="nav-info-panel">
                  <!-- 地图选择 -->
                  <div class="nav-info-item">
                    <label class="nav-label">地图：</label>
                    <select v-model="selectedNavMap" class="nav-select">
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

                  <!-- 速度信息 -->
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

                  <!-- 位置信息 -->
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

                  <!-- 其他状态信息 -->
                  <div class="nav-info-item">
                    <span class="nav-info-label">theta:</span>
                    <span class="nav-info-value">{{ navData.theta }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">抱闸:</span>
                    <span class="nav-info-value">{{ navData.brake }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">激光雷达数据:</span>
                    <span class="nav-info-value">{{ navData.lidar }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">IMU数据:</span>
                    <span class="nav-info-value">{{ navData.imu }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">卫星数据:</span>
                    <span class="nav-info-value">{{ navData.satellite }}</span>
                  </div>

                  <div class="nav-info-item">
                    <span class="nav-info-label">MSF状态:</span>
                    <span class="nav-info-value">{{ navData.msfStatus }}</span>
                  </div>
                </div>

                <!-- 右侧地图可视化区域 -->
                <div class="nav-map-container">
                  <div class="nav-map-canvas">
                    <div class="pointcloud-wrapper">
                      <div class="pointcloud-view">
                        <canvas
                          ref="navPointCloudCanvas"
                          class="pointcloud-canvas"
                          tabindex="0"
                          @wheel.prevent="handleNavPointCloudWheel"
                          @pointerdown="handleNavPointCloudPointerDown"
                          @keydown="handleNavPointCloudKeydown"
                          @contextmenu.prevent
                        ></canvas>
                        <div v-if="navPointCloudLoading" class="pcd-overlay loading">点云加载中...</div>
                        <div v-else-if="navPointCloudError" class="pcd-overlay error">{{ navPointCloudError }}</div>
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
                      <option v-for="map in editMapList" :key="map" :value="map">{{ map }}</option>
                    </select>
                  </div>
                  <div class="toolbar-right">
                    <button class="toolbar-btn" :class="{ active: isEditMode }" @click="toggleEditMode" title="栅格图编辑">
                      编辑
                    </button>
                  </div>
                </div>
              </div>
              <div class="map-edit-grid-main">
                <div class="gridmap-container">
                  <canvas ref="gridMapCanvas" class="grid-canvas"></canvas>
                  <div v-if="gridMapLoading" class="map-overlay loading">地图加载中...</div>
                  <div v-else-if="gridMapError" class="map-overlay error">{{ gridMapError }}</div>
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
                      <button class="tool-button" :class="{ active: activeTool === 'pen' && navMode === 'edit' }" @click="setTool('pen')" title="画笔">
                        <img :src="mapPenIcon" class="tool-icon-img" alt="画笔" />
                      </button>
                      <!-- 橡皮擦 -->
                      <button class="tool-button" :class="{ active: activeTool === 'eraser' && navMode === 'edit' }" @click="setTool('eraser')" title="橡皮擦">
                        <img :src="mapEraserIcon" class="tool-icon-img" alt="橡皮擦" />
                      </button>
                      <!-- 撤销 -->
                      <button class="tool-button" :class="{ disabled: !canUndo }" @click="canUndo && undoEdit()" title="撤回">
                        <img :src="mapRollbackIcon" class="tool-icon-img" alt="撤回" />
                      </button>
                      <!-- 初始化 -->
                      <button class="tool-button" @click="clearGridEdit" title="初始化">
                        <img :src="mapInitIcon" class="tool-icon-img" alt="初始化" />
                      </button>
                      <!-- 大小滚动条 -->
                      <div class="tool-slider">
                        <div class="slider-label">大小</div>
                        <input type="range" min="1" max="20" v-model.number="brushSize" class="size-slider-vertical" orient="vertical" />
                        <div class="slider-value">{{ brushSize }}</div>
                      </div>
                      <!-- 保存 -->
                      <button class="tool-button" :class="{ disabled: !gridImageData }" @click="gridImageData && handleSaveGridMap()" title="保存地图">
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
                    <select v-model="trackRecordMap" class="track-select">
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
                  <button class="map-btn track-btn track-btn-danger" @click="handleTrackDelete">删除路线</button>
                  <button class="map-btn map-btn-primary track-btn" @click="handleTrackPreview">预览路线</button>
                  <button class="map-btn map-btn-primary track-btn" @click="handleTrackSmooth">轨迹平滑</button>
                </div>
              </div>
              <div class="track-record-map">
                <div class="nav-map-canvas">
                  <div class="pointcloud-wrapper">
                    <div class="pointcloud-view">
                      <canvas
                        ref="navPointCloudCanvas"
                        class="pointcloud-canvas"
                        tabindex="0"
                        @wheel.prevent="handleNavPointCloudWheel"
                        @pointerdown="handleNavPointCloudPointerDown"
                        @keydown="handleNavPointCloudKeydown"
                        @contextmenu.prevent
                      ></canvas>
                      <div v-if="navPointCloudLoading" class="pcd-overlay loading">点云加载中...</div>
                      <div v-else-if="navPointCloudError" class="pcd-overlay error">{{ navPointCloudError }}</div>
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
            <div class="nav-content-wrapper file-manage-content">
              <div class="file-manage-toolbar">
                <span class="file-manage-label">地图:</span>
                <div class="track-select-wrapper">
                  <select v-model="fileManageMap" class="map-edit-select">
                    <option v-for="map in fileMapList" :key="map" :value="map">{{ map }}</option>
                  </select>
                </div>
                <button class="map-btn map-btn-danger" @click="handleDeleteMap">删除地图</button>
                <div class="file-manage-package-group">
                  <span class="file-manage-label">数据包:</span>
                  <div class="track-select-wrapper">
                    <select v-model="fileManagePackage" class="map-edit-select">
                      <option v-if="dataPackageList.length === 0" value="">暂无数据包</option>
                      <option v-for="pkg in dataPackageList" :key="pkg" :value="pkg">{{ pkg }}</option>
                    </select>
                  </div>
                  <button class="map-btn map-btn-danger" @click="handleDeletePackage">删除数据包</button>
                </div>
              </div>
              <div class="file-table" style="min-height: 600px;">
                <div class="file-table-header" style="height: 50px !important; min-height: 44px !important; align-items: center; display: flex;">
                  <div class="file-table-cell file-table-check" style="min-width: 80px; width: 80px; text-align: center; display: flex; align-items: center; justify-content: center;">序号</div>
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center; display: flex; align-items: center; justify-content: center;">类型</div>
                  <div class="file-table-cell file-table-name" style="flex: 1; text-align: center; display: flex; align-items: center; justify-content: center;">名称</div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center; display: flex; align-items: center; justify-content: center;">创建时间</div>
                  <div class="file-table-cell file-table-action" style="min-width: 150px; width: 150px; text-align: center; display: flex; align-items: center; justify-content: center;">操作</div>
                </div>
                
                <template v-if="fileManageList.length > 0">
                  <div class="file-table-row" v-for="(item, index) in fileManageList" :key="item.id" style="min-height: 60px; display: flex; align-items: center;">
                    <div class="file-table-cell file-table-check" style="min-width: 80px; width: 80px; text-align: center;">{{ index + 1 }}</div>
                    <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;">{{ item.type }}</div>
                    <div class="file-table-cell file-table-name" style="flex: 1; text-align: center;">{{ item.name }}</div>
                    <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;">{{ item.createTime }}</div>
                    <div class="file-table-cell file-table-action" style="min-width: 150px; width: 150px; text-align: center; display: flex; justify-content: center; align-items: center;">
                      <button class="action-btn action-btn-delete" @click="handleDelete(item)">
                        <img :src="deleteIcon" alt="删除" />
                        删除
                      </button>
                    </div>
                  </div>
                </template>
                
                <!-- 始终显示固定的空行以保持表格边框（补足到10行） -->
                <div class="file-table-row" v-for="i in Math.max(0, 10 - fileManageList.length)" :key="'empty-' + i" style="min-height: 60px; display: flex; align-items: center;">
                  <div class="file-table-cell file-table-check" style="min-width: 80px; width: 80px; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 120px; width: 120px; text-align: center;"></div>
                  <div class="file-table-cell file-table-name" style="flex: 1; text-align: center;"></div>
                  <div class="file-table-cell" style="min-width: 200px; width: 200px; text-align: center;"></div>
                  <div class="file-table-cell file-table-action" style="min-width: 150px; width: 150px; text-align: center;"></div>
                </div>
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
          <input v-model="recordingName" placeholder="请输入数据包名称" class="recording-input" />
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn" @click="cancelStartRecording">取消</button>
          <button class="map-btn map-btn-primary" @click="confirmStartRecording" :disabled="recordingLoading">
            {{ recordingLoading ? '提交中...' : '开始录包' }}
          </button>
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
              :class="{ 'active': selectedObsMode === 0 }"
              @click="selectedObsMode = 0"
            >
              <input type="radio" name="obs_mode" :value="0" v-model="selectedObsMode" />
              <span>近障模式</span>
            </label>
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
              :class="{ 'active': selectedObsMode === 2 }"
              @click="selectedObsMode = 2"
            >
              <input type="radio" name="obs_mode" :value="2" v-model="selectedObsMode" />
              <span>绕障模式</span>
            </label>
          </div>
        </div>
        <div class="recording-dialog-actions">
          <button class="map-btn" @click="cancelObsHandleDialog">取消</button>
          <button class="map-btn map-btn-primary" @click="confirmObsHandleDialog" :disabled="obsHandleLoading">
            {{ obsHandleLoading ? '提交中...' : '确认' }}
          </button>
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
          <button class="map-btn" @click="cancelTrackRecord">取消</button>
          <button class="map-btn map-btn-primary" @click="confirmTrackRecord" :disabled="trackRecordDialog.loading">
            {{ trackRecordDialog.loading ? '提交中...' : '开始录制' }}
          </button>
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
import { ref, onMounted, nextTick, watch, computed, shallowRef } from 'vue'
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

// 导航点云图相关变量（需要在前面声明，因为在cleanupNavPointCloud中使用）
let navPointCloudInitialized = false
let navResizeObserver: ResizeObserver | null = null

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
  { key: 'map_record', label: '录包建图', icon: mapRecordIcon },
  { key: 'nav', label: '导航', icon: navIcon },
  { key: 'map_edit', label: '地图编辑', icon: mapEditIcon },
  { key: 'track_record', label: '路线录制', icon: trackRecordIcon },
  { key: 'file_manage', label: '文件管理', icon: packageManageIcon }
]

const currentTab = ref('map_record')

const handleTabClick = (key: string) => {
  const previousTab = currentTab.value
  currentTab.value = key
  
  // 如果离开导航/路线录制标签，清理点云图状态
  if ((previousTab === 'nav' || previousTab === 'track_record') && key !== 'nav' && key !== 'track_record') {
    cleanupNavPointCloud()
  }
  
  // 当切换到导航标签时，初始化点云图并获取GPS状态和地图列表
  if (key === 'nav') {
    nextTick(() => {
      fetchMapList() // 获取地图列表
      initNavPointCloud()
      fetchGpsStatus() // 获取GPS状态
    })
  } else if (key === 'track_record') {
    nextTick(() => {
      initNavPointCloud()
      fetchTrackMapList() // 获取路线录制页面的地图列表
      fetchAllTrackList() // 获取所有循迹任务列表
    })
  } else if (key === 'map_edit') {
    // 切换到地图编辑标签时获取地图列表
    fetchEditMapList()
    // 如果已有选中的地图，手动加载一次（因为如果值没变，watcher不会触发）
    if (selectedEditMap.value) {
      nextTick(() => {
        loadGridMap(selectedEditMap.value)
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
  if (navResizeObserver) {
    (navResizeObserver as ResizeObserver | null)?.disconnect()
    navResizeObserver = null
  }
}

// 路线录制相关状态
const trackRecordMap = ref('')
const trackMapList = ref<string[]>([]) // 路线录制页面的地图列表
const trackRecordLine = ref('')
const trackRecordTask = ref('')

// 所有循迹任务列表（从API获取）
const allTrackList = ref<string[]>([])

// 获取所有循迹任务列表
const fetchAllTrackList = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    console.warn('未选择机器人，无法获取循迹任务列表')
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_track_list')
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
      localStorage.setItem('cached_track_list', JSON.stringify(allTrackList.value))
      console.log('获取到所有循迹任务列表:', allTrackList.value)
    } else {
      console.warn('循迹任务列表返回格式异常')
      // 尝试从缓存加载
      const cached = localStorage.getItem('cached_track_list')
      if (cached) {
        allTrackList.value = JSON.parse(cached)
      }
    }
  } catch (error) {
    console.error('获取循迹任务列表失败:', error)
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_track_list')
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

// 任务组列表
const trackTaskList = ref<string[]>([])

// 监听路线录制地图选择变化 - 同步更新路线和任务组列表
watch(trackRecordMap, async (newMap) => {
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
      console.log('✓ 轨迹文件已在缓存中:', newLine)
      return
    }
    
    // 从服务器下载轨迹文件
    // 注意：这里假设 mapFileApi.downloadTrajectoryFile 接受的是 trackName
    const blob = await mapFileApi.downloadTrajectoryFile(newLine)
    
    if (blob) {
      // DEBUG: 检查下载的内容
      const text = await blob.text()
      console.log('DEBUG: 下载的轨迹文件内容预览:', text.substring(0, 200))
      console.log('DEBUG: 下载的轨迹文件大小:', blob.size)
      
      if (text.trim().startsWith('<') || text.includes('error_code')) {
        console.error('DEBUG: 下载的内容看起来像是HTML错误页面或JSON错误信息')
      }

      // 保存到IndexedDB
      await saveTrajectoryFile(newLine, blob)
      console.log('✓ 轨迹文件下载并保存成功:', newLine)
      
      // DEBUG: 立即验证保存是否成功
      const savedBlob = await getTrajectoryFile(newLine)
      console.log('DEBUG: 验证保存结果:', savedBlob ? `成功, 大小: ${savedBlob.size}` : '失败, 未找到文件')
    } else {
      console.warn('⚠ 轨迹文件下载失败:', newLine)
    }
  } catch (error) {
    console.error('下载轨迹文件失败:', error)
  }
})

// 路线录制状态
const isTrackRecording = ref(false)
const trackRecordDialog = ref({
  visible: false,
  trackName: '',
  loading: false
})

const handleTrackRecord = () => {
  if (isTrackRecording.value) {
    // 正在录制 -> 停止录制
    stopTrackRecord()
  } else {
    // 未录制 -> 打开弹窗开始录制
    if (!trackRecordMap.value) {
      alert('请先选择地图')
      return
    }
    trackRecordDialog.value.trackName = ''
    trackRecordDialog.value.visible = true
  }
}

// 停止录制逻辑
const stopTrackRecord = async () => {
  if (!confirm('确定要完成录制吗？')) return

  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  try {
    // action 0 是停止
    const response = await navigationApi.trackRecord(robotId, {
      action: 0,
      track_name: '' 
    })
    
    isTrackRecording.value = false
    alert('录制完成')
    
    // 刷新列表
    await fetchAllTrackList()
    
  } catch(error: any) {
      console.error('停止录制失败:', error)
      alert(`停止录制失败: ${error.message || '未知错误'}`)
  }
}

// 确认开始录制
const confirmTrackRecord = async () => {
  if (!trackRecordDialog.value.trackName) {
    alert('请输入路线名称')
    return
  }
  
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  trackRecordDialog.value.loading = true
  try {
    const fullTrackName = `${trackRecordMap.value}_${trackRecordDialog.value.trackName}`
    const response = await navigationApi.trackRecord(robotId, {
      action: 1, // 开始
      track_name: fullTrackName
    })
    
    isTrackRecording.value = true
    trackRecordDialog.value.visible = false
    alert('开始录制路线')
  } catch (error: any) {
    console.error('开始录制失败:', error)
    alert(`开始录制失败: ${error.message || '未知错误'}`)
  } finally {
    trackRecordDialog.value.loading = false
  }
}

const cancelTrackRecord = () => {
  trackRecordDialog.value.visible = false
}

const handleTrackDelete = () => {
  if (!trackRecordLine.value) {
    alert('请先选择要删除的路线') // 保持简单的alert提示，或改用showErrorMessage
    return
  }
  
  showConfirmDialog({
    title: '删除路线',
    message: `确定要删除路线 "${trackRecordLine.value}" 吗？`,
    type: 'warning',
    confirmText: '删除',
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
        trackRecordLine.value = ''
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

const handleTrackPreview = async () => {
  console.log('预览路线')
  
  // 检查是否选中了路线
  if (!trackRecordLine.value) {
    showErrorMessage('请先选择路线')
    return
  }
  
  try {
    // 从IndexedDB获取轨迹文件
    const blob = await getTrajectoryFile(trackRecordLine.value)
    
    if (!blob) {
      showErrorMessage('未找到轨迹文件，请确认路线是否存在')
      return
    }
    
    console.log('✓ 找到轨迹文件，开始解析:', trackRecordLine.value)
    
    // 读取轨迹文件内容
    const text = await blob.text()
    console.log('DEBUG: 预览读取的文件内容预览:', text.substring(0, 200))
    
    const lines = text.trim().split('\n')
    
    // 解析轨迹点
    const trajectoryPoints: Array<{x: number, y: number, z: number}> = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue // 跳过空行和注释
      
      // 尝试用逗号分隔（CSV格式）或空格分隔
      let parts: string[]
      if (trimmed.includes(',')) {
        parts = trimmed.split(',')
      } else {
        parts = trimmed.split(/\s+/)
      }
      
      // 检查数据格式
      // 格式可能是: index, x, y, z, ...
      // 或者: x, y, z ...
      
      let x: number, y: number, z: number
      
      // 尝试解析为 index, x, y, z 格式 (5列或更多)
      if (parts.length >= 4) {
        // 假设第2,3,4列是x,y,z (忽略第1列索引)
        const val1 = parseFloat(parts[1])
        const val2 = parseFloat(parts[2])
        const val3 = parseFloat(parts[3])
        
        if (!isNaN(val1) && !isNaN(val2) && !isNaN(val3)) {
          x = val1
          y = val2
          z = val3
          trajectoryPoints.push({ x, y, z })
          continue
        }
      }
      
      // 如果上面的解析失败，尝试解析为 x, y, z 格式 (3列)
      if (parts.length >= 3) {
        const val0 = parseFloat(parts[0])
        const val1 = parseFloat(parts[1])
        const val2 = parseFloat(parts[2])
        
        if (!isNaN(val0) && !isNaN(val1) && !isNaN(val2)) {
          x = val0
          y = val1
          z = val2
          trajectoryPoints.push({ x, y, z })
        }
      }
    }
    
    if (trajectoryPoints.length === 0) {
      console.warn('DEBUG: 解析失败，未找到有效的轨迹点。首行内容:', lines[0])
      showErrorMessage('轨迹文件格式无法识别')
      return
    }
    
    console.log(`✓ 解析到 ${trajectoryPoints.length} 个轨迹点`)
    
    // 获取归一化参数
    const { centerX, centerY, centerZ, maxRange } = navPointCloudNormalizationParams.value
    
    // 如果没有地图数据，使用轨迹自身的范围（虽然这不太可能发生，因为已经加载了地图）
    if (maxRange <= 1e-6) {
      console.warn('地图归一化参数无效，使用轨迹自身范围')
      // ... 原有逻辑 ...
    }
    
    // 使用地图参数归一化轨迹点
    const normalizedTrajectoryPoints = trajectoryPoints.map(p => ({
      x: (p.x - centerX) / maxRange,
      y: (p.y - centerY) / maxRange,
      z: (p.z - centerZ) / maxRange,
      intensity: 2.0 // 使用特殊强度值区分轨迹 (2.0)
    }))
    
    // 合并地图数据和轨迹数据
    if (baseNavPointCloudData.value.length > 0) {
      navPointCloudData.value = [...baseNavPointCloudData.value, ...normalizedTrajectoryPoints]
    } else {
      navPointCloudData.value = normalizedTrajectoryPoints
    }
    
    // 渲染点云图
    await nextTick()
    scheduleNavPointCloudRender()
    
    showSuccessMessage(`轨迹预览加载成功 (${trajectoryPoints.length} 个点)`)
    console.log('✓ 轨迹预览渲染完成')
  } catch (error) {
    console.error('预览路线失败:', error)
    showErrorMessage('预览路线失败: ' + (error as Error).message)
  }
}

const handleTrackSmooth = async () => {
  if (!trackRecordLine.value) {
    alert('请先选择要平滑的路线')
    return
  }
  
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  try {
    await navigationApi.trajectorySmooth(robotId, {
      track_name: trackRecordLine.value
    })
    showSuccessMessage('轨迹平滑处理成功')
  } catch (error: any) {
    console.error('轨迹平滑失败:', error)
    showErrorMessage(`轨迹平滑失败: ${error.message || '未知错误'}`)
  }
}

// 导航相关状态
const selectedNavMap = ref('')
const navMapList = ref<string[]>([]) // 地图列表

// 监听导航地图选择变化
watch(selectedNavMap, (newMap) => {
  if (newMap) {
    refreshNavPointCloud(newMap)
  }
})

const taskSpeed = ref(1.0)
const navData = ref({
  w: 0,
  v: '0, 0',
  x: 0,
  y: 0,
  theta: 0,
  brake: 0,
  lidar: '未收到',
  imu: '未收到',
  satellite: '未收到',
  msfStatus: '未开启'
})

const navigationEnabled = ref(false)
const insEnabled = ref(false)
const msfEnabled = ref(false)

// GPS状态
const gpsEnabled = ref(false)

// 循迹避障模式对话框状态
const obsHandleDialogVisible = ref(false)
const selectedObsMode = ref(0) // 0: 近障, 1: 停障, 2: 绕障
const obsHandleLoading = ref(false)


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
      try {
        const robotId = deviceStore.selectedRobotId
        if (!robotId) {
          showErrorMessage('未选择机器人')
          return
        }

        await navigationApi.controlNavigation(robotId, {
          action: navigationEnabled.value ? 0 : 1,
          map_name: selectedNavMap.value
        })
        
        navigationEnabled.value = !navigationEnabled.value
        showSuccessMessage(`${action}导航成功`)
      } catch (err) {
        console.error(`${action}导航失败:`, err)
        showErrorMessage(`${action}导航失败`)
      }
    }
  })
}

const handlePauseNav = async () => {
  console.log('暂停导航')
  try {
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }
    await navigationApi.pauseNavigation(robotId, { action: 1 })
    showSuccessMessage('暂停指令已发送')
  } catch (err) {
    console.error('暂停导航失败:', err)
    showErrorMessage('暂停导航失败')
  }
}

const handleResumeNav = async () => {
  console.log('暂停恢复')
  try {
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showErrorMessage('未选择机器人')
      return
    }
    await navigationApi.pauseNavigation(robotId, { action: 0 })
    showSuccessMessage('恢复指令已发送')
  } catch (err) {
    console.error('恢复导航失败:', err)
    showErrorMessage('恢复导航失败')
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
        
        insEnabled.value = !insEnabled.value
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
        
        msfEnabled.value = !msfEnabled.value
        showSuccessMessage(`${action}MSF成功`)
      } catch (err) {
        console.error(`${action}MSF失败:`, err)
        showErrorMessage(`${action}MSF失败`)
      }
    }
  })
}

const handleCircleMode = () => {
  // 显示循迹避障模式选择对话框
  obsHandleDialogVisible.value = true
}

// 取消循迹避障模式对话框
const cancelObsHandleDialog = () => {
  obsHandleDialogVisible.value = false
  selectedObsMode.value = 0
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

    const modeNames = ['近障模式', '停障模式', '绕障模式']
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
    // 从缓存读取地图列表
    const cached = localStorage.getItem('cached_map_list')
    if (cached) {
      navMapList.value = JSON.parse(cached)
      
      // 尝试恢复选中的地图
      const cachedMapName = localStorage.getItem('selected_map_name')
      if (cachedMapName && navMapList.value.includes(cachedMapName)) {
        selectedNavMap.value = cachedMapName
      } else if (navMapList.value.length > 0 && !selectedNavMap.value) {
        // 如果有地图列表且当前未选择地图，默认选择第一个
        selectedNavMap.value = navMapList.value[0]
      }
    } else {
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
    console.error('读取地图列表缓存失败:', err)
  }
}

// 监听导航地图选择变化，同步到全局缓存
watch(selectedNavMap, (newMapName) => {
  if (newMapName) {
    localStorage.setItem('selected_map_name', newMapName)
  }
})

// 从API刷新地图列表缓存
const refreshMapListCache = async () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  try {
    const response = await navigationApi.getMapList(robotId)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      localStorage.setItem('cached_map_list', JSON.stringify(response.msg.result))
    }
  } catch (err) {
    console.error('刷新地图列表缓存失败:', err)
  }
}

// 获取地图编辑页面的地图列表（从缓存读取）
const fetchEditMapList = () => {
  try {
    // 从缓存读取地图列表
    const cached = localStorage.getItem('cached_map_list')
    if (cached) {
      editMapList.value = JSON.parse(cached)
      
      // 尝试恢复选中的地图
      const cachedMapName = localStorage.getItem('selected_map_name')
      if (cachedMapName && editMapList.value.includes(cachedMapName)) {
        selectedEditMap.value = cachedMapName
      } else if (editMapList.value.length > 0 && !selectedEditMap.value) {
        // 如果有地图列表且当前未选择地图，默认选择第一个
        selectedEditMap.value = editMapList.value[0]
      }
    } else {
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
    console.error('读取地图编辑列表缓存失败:', err)
  }
}

// 获取路线录制页面的地图列表（从缓存读取）
const fetchTrackMapList = () => {
  try {
    const cached = localStorage.getItem('cached_map_list')
    if (cached) {
      trackMapList.value = JSON.parse(cached)
      
      // 尝试恢复选中的地图
      const cachedMapName = localStorage.getItem('selected_map_name')
      if (cachedMapName && trackMapList.value.includes(cachedMapName)) {
        trackRecordMap.value = cachedMapName
      } else if (trackMapList.value.length > 0 && !trackRecordMap.value) {
        trackRecordMap.value = trackMapList.value[0]
      }
    } else {
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
    console.error('读取路线录制地图列表缓存失败:', err)
  }
}

// 获取文件管理页面的地图列表（从缓存读取）
const fetchFileMapList = () => {
  try {
    const cached = localStorage.getItem('cached_map_list')
    if (cached) {
      const rawList: string[] = JSON.parse(cached)
      // 处理地图名称：移除 @ 及后面的内容
      fileMapList.value = rawList.map(mapName => {
        const atIndex = mapName.indexOf('@')
        return atIndex > -1 ? mapName.substring(0, atIndex) : mapName
      })
      
      // 尝试恢复选中的地图
      const cachedMapName = localStorage.getItem('selected_map_name')
      // 对于文件管理，如果处理后的列表中包含缓存的名字
      if (cachedMapName && fileMapList.value.includes(cachedMapName)) {
        fileManageMap.value = cachedMapName
      } else if (fileMapList.value.length > 0 && !fileManageMap.value) {
        fileManageMap.value = fileMapList.value[0]
      }
    } else {
      console.warn('缓存中没有地图列表数据')
    }
  } catch (err) {
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
    }
  } catch (error) {
    console.error('获取数据包列表失败:', error)
    dataPackageList.value = []
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
  console.log('原点设置')
  // TODO: 调用原点设置API
}

const decreaseSpeed = () => {
  if (taskSpeed.value > 0.1) {
    taskSpeed.value = Math.round((taskSpeed.value - 0.1) * 10) / 10
  }
}

const increaseSpeed = () => {
  if (taskSpeed.value < 5.0) {
    taskSpeed.value = Math.round((taskSpeed.value + 0.1) * 10) / 10
  }
}

// 导航点云图相关
type PointCloudPoint = { x: number; y: number; z: number; intensity: number }
type RawPointCloudPoint = { x: number; y: number; z?: number; intensityValue?: number }
type PcdHeaderInfo = {
  fields: string[]
  size: number[]
  type: string[]
  count: number[]
  points: number
  width: number
  height: number
  dataType: string
  dataStartIndex: number
}

const tinymapPcdUrl = new URL('../../tinyMap.pcd', import.meta.url).href
const navPointCloudCanvas = ref<HTMLCanvasElement | null>(null)
const navPointCloudData = shallowRef<PointCloudPoint[]>([])
// 保存原始地图点云数据（归一化后的），用于叠加轨迹
const baseNavPointCloudData = shallowRef<PointCloudPoint[]>([])
// 保存点云归一化参数
const navPointCloudNormalizationParams = ref({
  minX: 0, maxX: 0,
  minY: 0, maxY: 0,
  minZ: 0, maxZ: 0,
  rangeX: 1, rangeY: 1, rangeZ: 1,
  maxRange: 1,
  centerX: 0, centerY: 0, centerZ: 0
})
const navPointCloudLoading = ref(false)
const navPointCloudError = ref('')
const navPointCloudScale = ref(1.5)
const navPointCloudRotationX = ref(-(20 * Math.PI) / 180)
const navPointCloudRotationY = ref(0)
const navPointCloudPanX = ref(0)
const navPointCloudPanY = ref(0)
let navPointCloudFrameRequested = false
let isNavPointCloudDragging = false
let lastNavPointerX = 0
let lastNavPointerY = 0
let navPointCloudDragMode: 'rotate' | 'pan' | null = null

const scheduleNavPointCloudRender = () => {
  if (navPointCloudFrameRequested) return
  navPointCloudFrameRequested = true
  requestAnimationFrame(() => {
    navPointCloudFrameRequested = false
    drawNavPointCloud()
  })
}

const drawNavPointCloud = () => {
  const canvas = navPointCloudCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  
  // 如果容器尺寸过小，说明还没有完全渲染，延迟绘制
  if (rect.width < 100 || rect.height < 100) {
    console.log('容器尺寸过小，延迟渲染:', rect.width, rect.height)
    return
  }

  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  if ((ctx as any).resetTransform) {
    ;(ctx as any).resetTransform()
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#020915'
  ctx.fillRect(0, 0, rect.width, rect.height)

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

  navPointCloudData.value.forEach(point => {
    const centeredX = point.x
    const centeredY = -point.z
    const centeredZ = point.y

    const xzRotatedX = centeredX * cosYaw + centeredZ * sinYaw
    const xzRotatedZ = -centeredX * sinYaw + centeredZ * cosYaw

    const yRotatedY = centeredY * cosPitch - xzRotatedZ * sinPitch
    const yRotatedZ = centeredY * sinPitch + xzRotatedZ * cosPitch

    const perspectiveZ = yRotatedZ * depthScale
    const perspective = cameraDistance / (cameraDistance - perspectiveZ)
    const projectedX = xzRotatedX * baseScale * perspective + rect.width / 2 + panOffsetX
    const projectedY = yRotatedY * baseScale * perspective + rect.height / 2 + panOffsetY

    if (projectedX < -100 || projectedX > rect.width + 100 || projectedY < -100 || projectedY > rect.height + 100) {
      return
    }

    const radius = (1.2 + point.intensity * 2) * perspective * 0.5
    
    // 如果强度 >= 2.0，说明是轨迹点，显示为亮绿色
    if (point.intensity >= 1.9) {
      ctx.fillStyle = `rgba(0, 255, 0, 0.9)`
      ctx.beginPath()
      // 轨迹点显示为2像素大小
      ctx.arc(projectedX, projectedY, 1.0 * dpr, 0, Math.PI * 2)
      ctx.fill()
    } else {
      const red = Math.floor(40 + point.intensity * 200)
      const green = Math.floor(120 + point.intensity * 100)
      const blue = 255
      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.35 + point.intensity * 0.4})`
      ctx.beginPath()
      ctx.arc(projectedX, projectedY, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  // 绘制原点
  const { centerX, centerY, centerZ, maxRange } = navPointCloudNormalizationParams.value
  
  if (maxRange > 1e-6) {
    // 计算原点 (0,0,0) 的归一化坐标
    const originNormX = (0 - centerX) / maxRange
    const originNormY = (0 - centerY) / maxRange
    const originNormZ = (0 - centerZ) / maxRange
    
    // 应用与点云相同的变换
    const centeredX = originNormX
    const centeredY = -originNormZ
    const centeredZ = originNormY

    const xzRotatedX = centeredX * cosYaw + centeredZ * sinYaw
    const xzRotatedZ = -centeredX * sinYaw + centeredZ * cosYaw

    const yRotatedY = centeredY * cosPitch - xzRotatedZ * sinPitch
    const yRotatedZ = centeredY * sinPitch + xzRotatedZ * cosPitch

    const perspectiveZ = yRotatedZ * depthScale
    const perspective = cameraDistance / (cameraDistance - perspectiveZ)
    const projectedX = xzRotatedX * baseScale * perspective + rect.width / 2 + panOffsetX
    const projectedY = yRotatedY * baseScale * perspective + rect.height / 2 + panOffsetY
    
    // 绘制原点标记
    ctx.beginPath()
    ctx.arc(projectedX, projectedY, 3 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = '#FF0000' // 红色
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5 * dpr
    ctx.stroke()
    
    // 绘制文字
    ctx.fillStyle = '#FF0000' // 红色
    ctx.font = `bold ${12 * dpr}px Arial`
    ctx.fillText('原点', projectedX + 6 * dpr, projectedY - 6 * dpr)
  }
}

const handleNavPointCloudWheel = (e: WheelEvent) => {
  const direction = e.deltaY < 0 ? 1 : -1
  const MIN_SCALE = 0.01
  const MAX_SCALE = 50
  navPointCloudScale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, navPointCloudScale.value + direction * 0.1))
  scheduleNavPointCloudRender()
}

const handleNavPointCloudPointerDown = (e: PointerEvent) => {
  e.preventDefault()
  if (isNavPointCloudDragging) return
  
  isNavPointCloudDragging = true
  lastNavPointerX = e.clientX
  lastNavPointerY = e.clientY
  
  const shouldPan = e.button === 2 || (e.button === 0 && e.ctrlKey)
  navPointCloudDragMode = shouldPan ? 'pan' : 'rotate'

  const handlePointerMove = (e: PointerEvent) => {
    if (!isNavPointCloudDragging) return
    
    const deltaX = e.clientX - lastNavPointerX
    const deltaY = e.clientY - lastNavPointerY
    lastNavPointerX = e.clientX
    lastNavPointerY = e.clientY

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

  const handlePointerUp = () => {
    isNavPointCloudDragging = false
    navPointCloudDragMode = null
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerUp)
  }

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointercancel', handlePointerUp)
}

const handleNavPointCloudKeydown = (e: KeyboardEvent) => {
  if (e.key === 'r' || e.key === 'R') {
    navPointCloudScale.value = 1
    navPointCloudRotationX.value = -(20 * Math.PI) / 180
    navPointCloudRotationY.value = 0
    navPointCloudPanX.value = 0
    navPointCloudPanY.value = 0
    scheduleNavPointCloudRender()
  }
}

import { navigationApi, mapFileApi } from '../api/services'
import { useDeviceStore } from '../stores/device'

const deviceStore = useDeviceStore()
const generateMockNavPointCloud = (count = 800): PointCloudPoint[] => {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    intensity: Math.random()
  }))
}

// 点云数据归一化
const normalizeNavPointCloud = (rawPoints: RawPointCloudPoint[]): PointCloudPoint[] => {
  if (!rawPoints.length) return []

  const xs = rawPoints.map(p => p.x)
  const ys = rawPoints.map(p => p.y)
  const zs = rawPoints.map(p => p.z ?? 0)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  const rangeX = maxX - minX
  const rangeY = maxY - minY
  const rangeZ = maxZ - minZ
  const maxRange = Math.max(rangeX, rangeY, rangeZ, 1e-6)

  const centerX = (maxX + minX) / 2
  const centerY = (maxY + minY) / 2
  const centerZ = (maxZ + minZ) / 2

  // 保存归一化参数，供轨迹叠加使用
  navPointCloudNormalizationParams.value = {
    minX, maxX,
    minY, maxY,
    minZ, maxZ,
    rangeX, rangeY, rangeZ,
    maxRange,
    centerX, centerY, centerZ
  }

  const intensityValues = rawPoints
    .map(p => (p.intensityValue !== undefined && Number.isFinite(p.intensityValue) ? p.intensityValue : undefined))
    .filter((val): val is number => typeof val === 'number')
  const minIntensity = intensityValues.length ? Math.min(...intensityValues) : 0
  const maxIntensity = intensityValues.length ? Math.max(...intensityValues) : 1
  const intensityRange = maxIntensity - minIntensity || 1

  return rawPoints.map(point => {
    const centeredZ = point.z ?? centerZ
    let normalizedIntensity: number
    if (point.intensityValue !== undefined && Number.isFinite(point.intensityValue)) {
      normalizedIntensity = (point.intensityValue - minIntensity) / intensityRange
    } else if (point.z !== undefined && Number.isFinite(point.z)) {
      normalizedIntensity = (point.z - minZ) / (rangeZ || 1)
    } else {
      normalizedIntensity = 0.5
    }
    normalizedIntensity = Math.min(1, Math.max(0, normalizedIntensity))

    return {
      x: (point.x - centerX) / maxRange,
      y: (point.y - centerY) / maxRange,
      z: (centeredZ - centerZ) / maxRange,
      intensity: normalizedIntensity
    }
  })
}

// 解析PCD文件
const parseNavPcdBuffer = (buffer: ArrayBuffer): PointCloudPoint[] => {
  const decoder = new TextDecoder('utf-8')
  let headerEndIndex = 0
  const maxHeaderSize = Math.min(2048, buffer.byteLength)
  const headerChunk = decoder.decode(buffer.slice(0, maxHeaderSize))
  const headerEndMarker = '\nDATA '
  const headerEndPos = headerChunk.indexOf(headerEndMarker)

  if (headerEndPos === -1) {
    console.warn('未找到PCD头部结束标记，尝试解析前1024字节作为header')
    headerEndIndex = 1024
  } else {
    const dataLineStart = headerEndPos + headerEndMarker.length
    const dataLineEnd = headerChunk.indexOf('\n', dataLineStart)
    headerEndIndex = dataLineEnd !== -1 ? dataLineEnd + 1 : dataLineStart + 10
  }

  const headerBytes = buffer.slice(0, headerEndIndex)
  const headerText = decoder.decode(headerBytes)
  const lines = headerText.split('\n').map(l => l.trim()).filter(Boolean)

  const headerInfo: PcdHeaderInfo = {
    fields: [],
    size: [],
    type: [],
    count: [],
    points: 0,
    width: 0,
    height: 0,
    dataType: 'ascii',
    dataStartIndex: headerEndIndex
  }

  for (const line of lines) {
    const [key, ...values] = line.split(/\s+/)
    if (key === 'FIELDS') headerInfo.fields = values
    else if (key === 'SIZE') headerInfo.size = values.map(Number)
    else if (key === 'TYPE') headerInfo.type = values
    else if (key === 'COUNT') headerInfo.count = values.map(Number)
    else if (key === 'POINTS') headerInfo.points = parseInt(values[0], 10) || 0
    else if (key === 'WIDTH') headerInfo.width = parseInt(values[0], 10) || 0
    else if (key === 'HEIGHT') headerInfo.height = parseInt(values[0], 10) || 0
    else if (key === 'DATA') headerInfo.dataType = values[0]?.toLowerCase() || 'ascii'
  }

  if (headerInfo.dataType === 'ascii') {
    const dataText = decoder.decode(buffer.slice(headerEndIndex))
    const dataLines = dataText.split('\n').map(l => l.trim()).filter(Boolean)
    const rawPoints: RawPointCloudPoint[] = []

    for (const line of dataLines) {
      const vals = line.split(/\s+/).map(Number)
      if (vals.length < headerInfo.fields.length) continue
      const point: RawPointCloudPoint = { x: 0, y: 0 }
      headerInfo.fields.forEach((field, i) => {
        const val = vals[i]
        if (!Number.isFinite(val)) return
        if (field === 'x') point.x = val
        else if (field === 'y') point.y = val
        else if (field === 'z') point.z = val
        else if (field === 'intensity') point.intensityValue = val
      })
      rawPoints.push(point)
    }
    return normalizeNavPointCloud(rawPoints)
  }

  const counts = headerInfo.count.length ? headerInfo.count : headerInfo.fields.map(() => 1)
  const stride = headerInfo.size.reduce((sum, size, i) => sum + size * counts[i], 0)
  const bytesAvailable = buffer.byteLength - headerInfo.dataStartIndex
  const pointsToRead = Math.min(headerInfo.points || 0, Math.floor(bytesAvailable / stride))

  const readBinaryValue = (view: DataView, offset: number, type: string, size: number): number => {
    if (type === 'F') return size === 4 ? view.getFloat32(offset, true) : view.getFloat64(offset, true)
    if (type === 'I') {
      if (size === 1) return view.getInt8(offset)
      if (size === 2) return view.getInt16(offset, true)
      if (size === 4) return view.getInt32(offset, true)
    }
    if (type === 'U') {
      if (size === 1) return view.getUint8(offset)
      if (size === 2) return view.getUint16(offset, true)
      if (size === 4) return view.getUint32(offset, true)
    }
    return 0
  }

  const view = new DataView(buffer, headerInfo.dataStartIndex)
  const rawPoints: RawPointCloudPoint[] = []

  for (let pointIndex = 0; pointIndex < pointsToRead; pointIndex++) {
    const baseOffset = pointIndex * stride
    let fieldOffset = 0
    let truncated = false
    const point: RawPointCloudPoint = { x: 0, y: 0, z: 0 }

    for (let fieldIndex = 0; fieldIndex < headerInfo.fields.length; fieldIndex++) {
      const field = headerInfo.fields[fieldIndex]
      const size = headerInfo.size[fieldIndex] || 0
      const repeat = counts[fieldIndex] || 1
      const type = headerInfo.type[fieldIndex] || 'F'

      for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex++) {
        const valueOffset = baseOffset + fieldOffset + repeatIndex * size
        if (valueOffset + size > bytesAvailable) {
          truncated = true
          break
        }

        if (field === 'rgb') {
          const rgbValue = view.getUint32(valueOffset, true)
          const r = rgbValue & 0xff
          const g = (rgbValue >> 8) & 0xff
          const b = (rgbValue >> 16) & 0xff
          point.intensityValue = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        } else {
          const value = readBinaryValue(view, valueOffset, type, size)
          if (field === 'x') point.x = value
          else if (field === 'y') point.y = value
          else if (field === 'z') point.z = value
          else if (field === 'intensity') point.intensityValue = value
        }
      }

      if (truncated) break
      fieldOffset += size * repeat
    }

    if (truncated) break
    if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
      rawPoints.push(point)
    }
  }

  return normalizeNavPointCloud(rawPoints)
}

// 刷新点云数据
const refreshNavPointCloud = async (mapName?: string) => {
  const targetMap = mapName || selectedNavMap.value
  if (!targetMap) {
    console.warn('未选择地图，无法加载点云数据')
    return
  }

  navPointCloudLoading.value = true
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
    
    let buffer: ArrayBuffer
    
    if (blob) {
      console.log('从缓存加载点云文件')
      buffer = await blob.arrayBuffer()
    } else {
      // 3. 如果还是没有，尝试加载默认文件（作为后备）
      console.warn('无法获取地图点云文件，尝试加载默认文件')
      const response = await fetch(tinymapPcdUrl)
      if (!response.ok) {
        throw new Error('默认 PCD 文件加载失败')
      }
      buffer = await response.arrayBuffer()
    }
    
    console.log('PCD文件已加载，大小:', buffer.byteLength, 'bytes')
    const parsedPoints = parseNavPcdBuffer(buffer)
    console.log('解析点云数据，点数:', parsedPoints.length)
    
    if (parsedPoints.length > 0) {
      navPointCloudData.value = parsedPoints
      // 保存原始地图数据，用于叠加轨迹
      baseNavPointCloudData.value = parsedPoints
    } else {
      console.warn('未解析到点云数据，使用模拟数据')
      navPointCloudData.value = generateMockNavPointCloud()
    }
    
    // 等待数据设置完成后渲染
    await nextTick()
    scheduleNavPointCloudRender()
  } catch (error) {
    console.error('点云数据加载失败:', error)
    navPointCloudError.value = '点云数据加载失败'
    navPointCloudData.value = generateMockNavPointCloud()
    await nextTick()
    scheduleNavPointCloudRender()
  } finally {
    navPointCloudLoading.value = false
  }
}

// 初始化导航点云图
const initNavPointCloud = async () => {
  // 如果已经初始化且 Canvas 仍然存在，只需要重新渲染
  if (navPointCloudInitialized && navPointCloudCanvas.value && navResizeObserver) {
    console.log('点云图已初始化，重新渲染')
    forceInitialRender()
    return
  }
  
  if (!navPointCloudCanvas.value) {
    console.warn('导航点云图Canvas未找到')
    return
  }
  
  console.log('导航点云图Canvas已就绪，开始初始化')
  
  // 清理旧的 ResizeObserver
  if (navResizeObserver) {
    (navResizeObserver as ResizeObserver | null)?.disconnect()
    navResizeObserver = null
  }
  
  navPointCloudInitialized = true
  
  // 先加载数据（如果还没有数据）
  if (navPointCloudData.value.length === 0) {
    await refreshNavPointCloud()
  }
  
  // 使用 ResizeObserver 监听容器尺寸变化，确保在容器尺寸稳定后渲染
  // 这样可以解决初始加载时容器尺寸为0或很小的问题
  if (navResizeObserver) {
    (navResizeObserver as ResizeObserver | null)?.disconnect()
  }
  
  navResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      // 只有当容器有足够大的尺寸时才进行渲染
      if (width > 100 && height > 100) {
        console.log('容器尺寸变化，触发渲染:', width, height)
        scheduleNavPointCloudRender()
      }
    }
  })
  
  navResizeObserver.observe(navPointCloudCanvas.value)
  
  // 强制触发一次布局检查和渲染
  forceInitialRender()
}

// 强制初始渲染，等待容器尺寸稳定
const forceInitialRender = () => {
  let attempts = 0
  const maxAttempts = 10
  
  const tryRender = () => {
    const canvas = navPointCloudCanvas.value
    if (!canvas) return
    
    const parent = canvas.parentElement
    const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect()
    attempts++
    
    if (rect.width > 100 && rect.height > 100) {
      console.log('初始渲染成功，容器尺寸:', rect.width, rect.height)
      scheduleNavPointCloudRender()
    } else if (attempts < maxAttempts) {
      // 容器尺寸还不够，继续等待
      requestAnimationFrame(tryRender)
    } else {
      console.warn('初始渲染尝试次数已达上限，强制渲染')
      scheduleNavPointCloudRender()
    }
  }
  
  requestAnimationFrame(tryRender)
}

onMounted(async () => {
  await nextTick()
  
  // 如果默认就是导航标签，则初始化
  if (currentTab.value === 'nav') {
    await nextTick()
    fetchMapList()
    initNavPointCloud()
    fetchGpsStatus()
  }
})

// 录包建图相关状态
const isRecording = ref(false)
const mapProgress = ref(0)
const recordingDialogVisible = ref(false)
const recordingName = ref('')
const recordingLoading = ref(false)

// 录包建图相关方法
const handleStartRecording = () => {
  // 弹出输入对话框，输入数据包名称
  recordingName.value = ''
  recordingDialogVisible.value = true
}

const confirmStartRecording = async () => {
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

    isRecording.value = true
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

const handleStopRecording = async () => {
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

    isRecording.value = false
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

const handleGenerateMap = () => {
  console.log('生成地图')
  // TODO: 调用生成地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleGenerateGridMap = () => {
  console.log('生成栅格地图')
  // TODO: 调用生成栅格地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleCreateFusionMap = () => {
  console.log('新建融合地图')
  // TODO: 调用新建融合地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleStopMapping = () => {
  console.log('终止建图')
  mapProgress.value = 0
  // TODO: 调用终止建图API
}

// 地图编辑相关状态
const selectedEditMap = ref('')
const editMapList = ref<string[]>([]) // 地图编辑页面的地图列表
const gridMapCanvas = ref<HTMLCanvasElement | null>(null)
const gridMapLoading = ref(false)
const gridMapError = ref('')
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

// 保存地图文件
const saveMapFile = async (mapName: string, fileName: string, blob: Blob): Promise<void> => {
  const db = await openMapDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MAP_STORE_NAME], 'readwrite')
    const store = tx.objectStore(MAP_STORE_NAME)
    store.put({ id: `${mapName}/${fileName}`, blob })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// 下载地图文件
const downloadMapFiles = async (mapName: string) => {
  // 获取机器人 IP
  const robotInfo = deviceStore.selectedRobot
  if (!robotInfo?.ip_address) {
    throw new Error('未获取到机器人IP，无法下载地图')
  }
  
  const robotIp = robotInfo.ip_address
  
  // 下载文件
  const files = await mapFileApi.downloadAllMapFiles(robotIp, mapName)
  
  // 保存文件到 IndexedDB
  for (const [fileName, blob] of files) {
    await saveMapFile(mapName, fileName, blob)
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
    
  } catch (err) {
    console.error('加载地图失败:', err)
    gridMapError.value = '加载地图失败: ' + (err as Error).message
  } finally {
    gridMapLoading.value = false
  }
}

// 监听地图选择变化
// 监听地图选择变化，同步到全局缓存
watch(selectedEditMap, (newMap) => {
  if (newMap) {
    localStorage.setItem('selected_map_name', newMap)
    loadGridMap(newMap)
  }
})

// 监听地图编辑选择变化
watch(selectedEditMap, (newMap) => {
  if (newMap) {
    loadGridMap(newMap)
  }
})

// [新增] 同步地图选择到全局缓存
watch(selectedEditMap, (newMap) => {
  if (newMap) localStorage.setItem('selected_map_name', newMap)
})

watch(trackRecordMap, (newMap) => {
  if (newMap) localStorage.setItem('selected_map_name', newMap)
})



let isDragging = false
let lastX = 0
let lastY = 0
let drawing = false
let editLastX = 0
let editLastY = 0

// 编辑模式切换
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    navMode.value = 'pan'
  }
  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = isEditMode.value ? 'crosshair' : 'grab'
  }
}

// 获取橡皮擦光标样式
const getEraserCursor = () => {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23ff6b6b' stroke='%23333' stroke-width='1.5' d='M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0'/%3E%3Cpath fill='white' stroke='%23333' stroke-width='1' d='M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-6.36-6.36z'/%3E%3C/svg%3E") 12 12, auto`
}

// 设置导航模式
const setNavMode = (mode: 'pan' | 'edit') => {
  navMode.value = mode
  const canvas = gridMapCanvas.value
  if (canvas) {
    if (mode === 'pan') {
      canvas.style.cursor = 'grab'
    } else {
      // 编辑模式下根据当前工具设置光标
      canvas.style.cursor = activeTool.value === 'pen' ? 'crosshair' : getEraserCursor()
    }
  }
}

// 设置工具
const setTool = (tool: 'pen' | 'eraser') => {
  activeTool.value = tool
  navMode.value = 'edit'
  const canvas = gridMapCanvas.value
  if (canvas) {
    canvas.style.cursor = tool === 'pen' ? 'crosshair' : getEraserCursor()
  }
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
        
        // 获取机器人IP
        const robotInfo = deviceStore.selectedRobot
        if (!robotInfo?.ip_address) {
          showErrorMessage('未获取到机器人IP，无法上传地图')
          return
        }
        
        const robotIp = robotInfo.ip_address
        const mapName = selectedEditMap.value
        const fileName = 'gridMap.pgm'
        
        console.log('准备上传PGM文件:', {
          robotIp,
          mapName,
          fileName,
          dataSize: pgmData.length,
          width: currentImageData.width,
          height: currentImageData.height
        })
        
        // 步骤1: 上传到服务器
        showSuccessMessage('正在上传到服务器...')
        const uploadSuccess = await mapFileApi.uploadMapFile(robotIp, mapName, fileName, blob)
        
        if (!uploadSuccess) {
          throw new Error('上传到服务器失败')
        }
        console.log('✓ 服务器上传成功')
        
        // 步骤2: 从服务器下载验证
        showSuccessMessage('正在从服务器下载验证...')
        const downloadedBlob = await mapFileApi.downloadMapFile(robotIp, mapName, fileName)
        
        if (!downloadedBlob) {
          throw new Error('从服务器下载验证失败')
        }
        
        // 验证文件大小
        if (downloadedBlob.size !== blob.size) {
          console.warn(`⚠ 文件大小不匹配: 原始=${blob.size}, 下载=${downloadedBlob.size}`)
          showErrorMessage(`文件大小不匹配: 原始=${blob.size}bytes, 下载=${downloadedBlob.size}bytes`)
        } else {
          console.log('✓ 服务器下载验证成功，文件大小一致:', downloadedBlob.size)
          
          // 步骤3: 更新IndexedDB中的缓存
          await saveMapFile(mapName, fileName, downloadedBlob)
          console.log('✓ IndexedDB缓存已更新')
          
          showSuccessMessage('地图保存成功！')
        }
        
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
  
  // 鼠标滚轮事件
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    currentScale = Math.max(0.2, Math.min(5, currentScale * delta))
    applyTransform()
  }
  
  // 鼠标按下事件
  const onMouseDown = (e: MouseEvent) => {
    // 编辑模式下且为编辑导航模式的左键编辑
    if (isEditMode.value && navMode.value === 'edit' && e.button === 0 && !e.ctrlKey) {
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
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      currentOffsetX += dx
      currentOffsetY += dy
      applyTransform()
      lastX = e.clientX
      lastY = e.clientY
    }
  }
  
  // 鼠标松开事件
  const endDrag = () => {
    isDragging = false
    drawing = false
    if (isEditMode.value) {
      // 编辑模式下根据当前工具恢复光标
      canvas.style.cursor = activeTool.value === 'pen' ? 'crosshair' : getEraserCursor()
    } else {
      canvas.style.cursor = 'grab'
    }
  }
  
  // 添加事件监听
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', endDrag)
  canvas.addEventListener('mouseleave', endDrag)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault())
}

// 监听tab切换，加载地图
watch(currentTab, async (newTab) => {
  if (newTab === 'map_edit') {
    await nextTick()
    // 如果已经选中了地图，加载该地图；否则加载默认地图
    if (selectedEditMap.value) {
      loadGridMap(selectedEditMap.value)
    } else {
      loadAndRenderGridMap()
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
const fileManagePackage = ref('包A')
const fileManageList = ref<any[]>([])

// 获取文件列表
const fetchNavigationList = async () => {
  if (!fileManageMap.value) {
    fileManageList.value = []
    return
  }
  
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  try {
    let response = await navigationApi.getNavigationList(robotId, fileManageMap.value)
    
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
        name: (item.prefix || '') + item.name, // 加上前缀
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
  if (newMap) localStorage.setItem('selected_map_name', newMap)
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
        await navigationApi.deleteNavigationData({
          map_name: fileManageMap.value,
          type: item.type,
          pwd: item.pwd,
          is_file: item.is_file,
          path: '/root/dxr_data/map'
        })
        showSuccessMessage('删除成功')
        fetchNavigationList()
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

.file-manage-content {
  padding: 16px 20px 24px;
}

.file-manage-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: -4px;
  padding: 0;
}

.file-manage-package-group {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 18px;
}

.file-manage-label {
  color: #b8dcf5;
  font-size: 14px;
  line-height: 40px;
}

.file-manage-toolbar .map-edit-select {
  height: 40px;
  min-width: 220px;
}

.file-table {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(62, 121, 150, 0.6);
  background: transparent;
}

.file-table-header {
  background: #1c4b64;
  color: #e9f7ff;
  font-size: 13px;
  font-weight: 600;
  height: 44px;
}

.file-table-row {
  background: transparent;
  color: #cfe9ff;
  font-size: 13px;
  border-top: 1px solid rgba(45, 111, 145, 0.5);
}

.file-table-cell {
  padding: 0 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-table-name {
  text-align: left;
}

.file-table-action {
  display: flex;
  justify-content: center;
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
  height: calc(100vh - 260px);
  min-height: 500px;
}

.nav-info-panel {
  width: 260px;
  background: rgba(10, 42, 58, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.2);
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  overflow-y: auto;
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

.nav-speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-speed-btn {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #0c3c56 0%, #0a2f44 100%);
  border: 1px solid rgba(38, 131, 182, 0.6);
  border-radius: 6px;
  color: #67d5fd;
  font-size: 24px;
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
  width: 110px;
  height: 40px;
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
  gap: 16px;
}

.nav-info-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-info-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
}

.nav-info-value {
  font-size: 14px;
  color: #67d5fd;
  font-weight: 500;
}

.nav-map-container {
  flex: 1;
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
  width: 100%;
  height: 100%;
  position: relative;
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
  position: relative;
  background: radial-gradient(circle at 20% 20%, rgba(89, 192, 252, 0.2), transparent 45%),
              radial-gradient(circle at 80% 10%, rgba(255, 128, 0, 0.12), transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(0, 225, 255, 0.2), transparent 50%),
              #020915;
  overflow: hidden;
  box-sizing: border-box;
}

.pointcloud-canvas {
  width: 100%;
  height: 100%;
  display: block;
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

.map-overlay.error {
  background: rgba(255, 77, 79, 0.2);
  color: #ff6b6b;
}

.map-overlay.loading {
  color: #67d5fd;
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
}

.panel-tools {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 8px 20px;
  gap: 10px;
  align-items: center;
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

.tool-button.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.tool-icon-img {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%) invert(88%) sepia(9%) saturate(748%) hue-rotate(164deg);
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
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  appearance: slider-vertical;
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
  padding: 20px 24px;
  border-bottom: 1px solid rgba(103, 213, 253, 0.2);
  font-size: 16px;
  font-weight: 600;
  color: #67d5fd;
}

.recording-dialog-body {
  padding: 24px;
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

.recording-input:focus {
  border-color: #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
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
  display: flex;
  background: rgba(12, 60, 86, 0.5);
  border-bottom: 1px solid rgba(103, 213, 253, 0.2);
  padding: 12px 16px;
  font-weight: 600;
  color: #67d5fd;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.file-table-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 滚动条样式 */
.file-table-body::-webkit-scrollbar {
  width: 6px;
}

.file-table-body::-webkit-scrollbar-track {
  background: rgba(10, 42, 58, 0.3);
}

.file-table-body::-webkit-scrollbar-thumb {
  background: rgba(103, 213, 253, 0.3);
  border-radius: 3px;
}

.file-table-body::-webkit-scrollbar-thumb:hover {
  background: rgba(103, 213, 253, 0.5);
}

.file-table-row {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(103, 213, 253, 0.1);
  color: #b8dcf5;
  transition: background 0.2s;
}

.file-table-row:hover {
  background: rgba(12, 60, 86, 0.3);
}

.file-table-cell {
  flex: 1;
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
