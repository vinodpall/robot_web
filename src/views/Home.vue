
<template>
  <div class="home-container">
    <!-- 左侧状态栏 -->
    <div class="left-box">
      <!-- 可见光视频 -->
      <div class="left-video-card visible-video-card" @click="closeMenus" style="border-radius: 0; overflow: hidden;">
        <div class="cardTitle">
          <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
          可见光视频
        </div>
        <div class="video-card-body video-only-body" style="border-radius: 0; overflow: hidden;">
          <div ref="visibleVideoWrapper" class="video-only-wrapper" style="border-radius: 0; overflow: hidden; position: relative;">
            <video 
              ref="videoElement"
              :class="['video-only-element', { 'video-hidden': !hasVisibleVideoFrame }]"
              :controls="hasVisibleVideoFrame"
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
            <!-- 重连 overlay：保留最后一帧，叠加半透明提示 -->
            <div v-if="webrtcReconnecting" class="video-reconnect-overlay">
              <div class="video-reconnect-spinner"></div>
              <span class="video-reconnect-text">信号重连中...</span>
            </div>
            <div v-else-if="visibleLoading && !hasVisibleVideoFrame" class="video-reconnect-overlay">
              <div class="video-reconnect-spinner"></div>
              <span class="video-reconnect-text">视频加载中...</span>
            </div>
            <div v-else-if="!hasVisibleVideoFrame" class="video-empty-state">
              暂无视频流
            </div>
            <div class="video-action-group">
              <button
                class="video-action-btn stream-mode-btn"
                :disabled="isStreamSwitching.visible || !canSwitchVideoStream('visible')"
                :title="`切换到${getVideoStreamModeLabel('visible') === '主' ? '子码流' : '主码流'}`"
                @click.stop="handleToggleVideoStream('visible')"
              >
                {{ getVideoStreamModeLabel('visible') }}
              </button>
              <button class="video-action-btn icon-only" title="手动重连" @click.stop="handleManualReconnect('visible')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 12A8 8 0 1 1 17.66 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M20 4V9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="video-action-btn icon-only" title="全屏" @click.stop="toggleVideoPanelFullscreen('visible')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3H3V8M16 3H21V8M8 21H3V16M16 21H21V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 红外视频 -->
      <div class="left-video-card infrared-card" style="border-radius: 0; overflow: hidden;">
        <div class="cardTitle">
          <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
          红外视频
        </div>
        <div class="video-card-body video-only-body" style="border-radius: 0; overflow: hidden;">
          <div ref="infraredVideoWrapper" class="video-only-wrapper" style="border-radius: 0; overflow: hidden; position: relative;">
            <video 
              ref="infraredVideoElement"
              :class="['video-only-element', { 'video-hidden': !hasInfraredVideoFrame }]"
              :controls="hasInfraredVideoFrame"
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
            <!-- 红外重连 overlay -->
            <div v-if="infraredReconnecting" class="video-reconnect-overlay">
              <div class="video-reconnect-spinner"></div>
              <span class="video-reconnect-text">信号重连中...</span>
            </div>
            <div v-else-if="infraredLoading && !hasInfraredVideoFrame" class="video-reconnect-overlay">
              <div class="video-reconnect-spinner"></div>
              <span class="video-reconnect-text">视频加载中...</span>
            </div>
            <div v-else-if="!hasInfraredVideoFrame" class="video-empty-state">
              暂无视频流
            </div>
            <div class="video-action-group">
              <button
                class="video-action-btn stream-mode-btn"
                :disabled="isStreamSwitching.infrared || !canSwitchVideoStream('infrared')"
                :title="`切换到${getVideoStreamModeLabel('infrared') === '主' ? '子码流' : '主码流'}`"
                @click.stop="handleToggleVideoStream('infrared')"
              >
                {{ getVideoStreamModeLabel('infrared') }}
              </button>
              <button class="video-action-btn icon-only" title="手动重连" @click.stop="handleManualReconnect('infrared')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 12A8 8 0 1 1 17.66 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M20 4V9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="video-action-btn icon-only" title="全屏" @click.stop="toggleVideoPanelFullscreen('infrared')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3H3V8M16 3H21V8M8 21H3V16M16 21H21V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

<!-- 任务统计 -->
      <div class="left-on3">
        <div class="cardTitle">
          <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
          任务统计
        </div>
        <div class="chart-container">
          <div class="task-content">
            <div class="task-header">
              <div class="task-time">
                <div class="task-name">任务名称：{{ waylineTaskName }}</div>
                <div class="time-item">
                  <span class="label">任务开始时间：<em class="time-value">{{ waylineTaskStartTime }}</em></span>
                  <span v-if="hasActiveTaskStatistics" class="label">当前巡检点：<em class="time-value">{{ waylineInspectionProgressText }}</em></span>
                </div>
              </div>
              <div class="task-status">
                <div :class="['status-btn', waylineTaskStatus]">{{ waylineTaskStatusText }}</div>
              </div>
            </div>
            <div class="task-progress">
              <div class="chart-box">
                <div class="progress-circle-container">
                  <div class="progress-circle">
                    <div 
                      class="progress-circle-outer-glow" 
                      :class="{ 'completed': waylineProgressPercent >= 100 }"
                      :style="{ '--glow-color': waylineProgressPercent > 0 ? '#00e1ff' : '#FF8000' }"
                    ></div>
                    <div 
                      class="progress-circle-outer-ring" 
                      :class="{ 'completed': waylineProgressPercent >= 100 }"
                      :style="{
                        background: `conic-gradient(from -90deg, #00e1ff ${waylineProgressPercent}%, #FF8000 ${waylineProgressPercent}% 100%)`
                      }"
                    >
                    </div>
                    <div class="progress-circle-center">
                      <div class="progress-text">
                        <span>进度</span>
                        <span class="percentage">{{ waylineProgressPercent }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="legend-color blue-gradient"></span>
                    <span>已巡检</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color orange-gradient"></span>
                    <span>待巡检</span>
                  </div>
                </div>
              </div>
              
              <div class="chart-box">
                <div class="progress-circle-container">
                  <div class="progress-circle">
                    <div class="task-status-outer-ring" :class="{ 'error': waylineTaskStatus === 'failed' }"></div>
                    <div class="progress-circle-center">
                      <div class="progress-text">
                        <span>任务</span>
                        <span>状态</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item" @click="toggleTaskStatus">
                    <span class="legend-color green-gradient"></span>
                    <span>正常</span>
                  </div>
                  <div class="legend-item" @click="toggleTaskStatus">
                    <span class="legend-color red-gradient"></span>
                    <span>异常</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 中间区域 -->
    <div class="center-column">
      <!-- 视频播放区域 -->
      <div class="content-on1" @click="closeMenus">
        <div class="pointcloud-wrapper" :class="{ 'pointcloud-fullscreen': isPointCloudFullscreen }">
          <div class="pointcloud-view">
            <ThreePointCloudPreview
              ref="threePointCloudRef"
              :points="pointCloudData"
              :loading="pointCloudLoading"
              :loading-text="pointCloudLoadingText"
              :error="pointCloudError"
              :normalization-params="pointCloudNormalizationParams"
              :navigation-origin="pointCloudNavigationOrigin"
              :robot-pose="robotStore.pose"
              :robot-mesh="arrowMesh"
            />
          </div>
          <!-- 工具按鈕组 -->
          <div class="pcd-btn-group">
            <button class="pcd-tool-btn" @click.stop="centerToRobot" title="定位机器人">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="pcd-tool-btn" @click.stop="togglePointCloudFullscreen" :title="isPointCloudFullscreen ? '退出全屏' : '全屏显示'">
              <svg v-if="!isPointCloudFullscreen" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8V3H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 8V3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 16V21H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 16V21H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V8H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 3V8H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 21V16H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 21V16H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

<!-- 告警信息区域 -->
      <div class="content-on2">
        <div class="on2-top">
          <span class="active">实时警情</span>
        </div>
        <div class="on2-bottom">
          <table class="tableOne">
            <thead>
              <tr>
                <th title="相机名称">相机名称</th>
                <th title="警情类型">警情类型</th>
                <th title="图片">图片</th>
                <th title="内容">内容</th>
                <th title="描述">描述</th>
                <th title="报警时间">报警时间</th>
              </tr>
            </thead>
            <tbody>
              <!-- 实时警情行 -->
              <tr v-for="(item, index) in deviceAlarmData" :key="`alert-${index}`">
                <td :title="item.camera || item.deviceName || '--'">
                  <span class="alarm-camera-tag">{{ item.camera || item.deviceName || '--' }}</span>
                </td>
                <td :title="item.type || '--'">
                  <span v-if="item.type && item.type !== '--'" class="alarm-type-tag">{{ item.type }}</span>
                  <span v-else class="alarm-empty">--</span>
                </td>
                <td :title="item.imageOriginalUrl ? '点击查看大图' : '暂无图片'">
                  <span v-if="!item.imageOriginalUrl" class="no-image">--</span>
                  <img 
                    v-else
                    :src="item.imageUrl"
                    alt="警情图片"
                    class="target-image-small"
                    @click="handleAlertImageClick(item)"
                    @error="handleAlertThumbError(item)"
                    style="cursor:pointer;"
                  />
                </td>
                <td :title="item.content || '--'">
                  <span v-if="item.content && item.content !== '--'" class="alarm-content-tag">{{ item.content }}</span>
                  <span v-else class="alarm-empty">--</span>
                </td>
                <td :title="item.description || '--'">{{ item.description || '--' }}</td>
                <td :title="item.time || '--'">
                  <template v-if="item.time && item.time !== '--'">
                    <span class="alarm-date-part">{{ item.time.split(' ')[0] }}</span>
                    <span class="alarm-clock-part">{{ item.time.split(' ')[1] }}</span>
                  </template>
                  <span v-else class="alarm-empty">--</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 右侧区域 -->
    <div class="right-column">
      <!-- 无人机状态卡片 -->
      <div class="right-on1 drone-status-card">
        <div class="cardTitle">
          <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
          机器人状态
        </div>
        <div class="drone-card-body">
          <div class="on1-bottom">
            <div class="b-top">
              <div class="b-top-left">
                <div class="zhuangtai4">
                  <div :class="isRobotOnline ? 'robot-status-online' : 'robot-status-offline'">{{ isRobotOnline ? '在线' : '离线' }}</div>
                </div>
                <div class="img">
                  <img src="@/assets/source_data/dog.png" alt="" />
                </div>
              </div>
              <div class="b-top-right">
                <div class="b-top-rightCard">
                  <div class="b-top-rightDiv">
                    <img class="metric-icon metric-icon-speed" src="@/assets/source_data/svg_data/robot_speed_card.svg" alt="速度" />
                  <div>
                      <p>{{ formatRobotSpeed() }}</p>
                      <p>当前速度</p>
                  </div>
                </div>
                <div class="b-top-rightDiv">
                  <span class="metric-icon-wrap metric-icon-battery-wrap">
                    <img class="metric-icon metric-icon-battery" src="@/assets/source_data/svg_data/robot_battery_card.svg" alt="电量" />
                    <img v-if="isRobotCharging" class="charging-lightning-badge" src="@/assets/source_data/svg_data/charging_bolt.svg" alt="充电中" />
                  </span>
                  <div>
                    <p class="battery-value-line">
                      <span :class="{ 'battery-percent-charging': isRobotCharging }">{{ formatBattery(robotBatteryLevel) }}</span>
                    </p>
                      <p>当前剩余电量</p>
                  </div>
                </div>
                <div class="b-top-rightDiv">
                  <img class="metric-icon metric-icon-mileage" src="@/assets/source_data/svg_data/robot_mileage_card.svg" alt="里程" />
                  <div>
                    <p>{{ robotStore.totalMileage !== null ? (robotStore.totalMileage / 1000).toFixed(3) + ' km' : '0 km' }}</p>
                      <p>累计行走里程</p>
                  </div>
                </div>
                </div>
              </div>
            </div>
            <div class="b-bottom">
              <div class="status-grid">
                <!-- 第一行 -->
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/longitude.svg" alt="X坐标" />
                    <span class="label">X坐标</span>
                  </div>
                  <span class="value">{{ formatRobotPositionAxis(0) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/latitude.svg" alt="Y坐标" />
                    <span class="label">Y坐标</span>
                  </div>
                  <span class="value">{{ formatRobotPositionAxis(1) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/altitude.svg" alt="高度" />
                    <span class="label">高度</span>
                  </div>
                  <span class="value">{{ formatRobotPositionAxis(2) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img 
                      src="@/assets/source_data/svg_data/robot_source/angle.svg"
                      alt="角度" 
                    />
                    <span class="label">角度</span>
                  </div>
                  <span class="value">{{ formatRobotYaw() }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/status.svg" alt="状态" />
                    <span class="label">状态</span>
                  </div>
                  <span class="value">{{ formatRobotStatus() }}</span>
                </div>
                
                <!-- 第二行 -->
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/voltage.svg" alt="电压" />
                    <span class="label">电压</span>
                  </div>
                  <span class="value">{{ formatRobotVoltage() }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/current.svg" alt="电流" />
                    <span class="label">电流</span>
                  </div>
                  <span class="value">{{ formatRobotCurrent() }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/ground.svg" alt="地面" />
                    <span class="label">地面</span>
                  </div>
                  <span class="value">{{ formatGroundType() }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/foot.svg" alt="步态" />
                    <span class="label">步态</span>
                  </div>
                  <span class="value">{{ formatGaitType() }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/height.svg" alt="姿态" />
                    <span class="label">姿态</span>
                  </div>
                  <span class="value">{{ formatPosture() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 机器人控制 -->
      <div class="right-on2 robot-control-card">
        <div class="cardTitle">
          <div class="cardTitle-left">
            <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
            机器人控制
          </div>
          <img 
            :src="isMicOn ? mkfOnIcon : mkfOffIcon" 
            alt="麦克风" 
            class="mic-icon"
            title="语音对讲开关"
            v-permission-click-dialog="'main-robotcontrol'"
            @click="toggleMic"
          />
        </div>
        <div class="robot-control-container">
          <div class="robot-control-grid">
            <!-- 第一行 -->
            <button :class="getControlButtonClass('stand')" :disabled="isControlDisabled('stand')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('stand')">{{ standControlLabel }}</button>
            <button :class="getControlButtonClass('forceControlMode')" :disabled="isControlDisabled('forceControlMode')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('forceControlMode')">力控模式</button>
            <button :class="getControlButtonClass('emergencyStop', true)" :disabled="isControlDisabled('emergencyStop')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('emergencyStop')">急停</button>
            
            <!-- 第二行 -->
            <button :class="getControlButtonClass('startMove')" :disabled="isControlDisabled('startMove')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('startMove')">{{ moveControlLabel }}</button>
            <button :class="getControlButtonClass('crawl')" :disabled="isControlDisabled('crawl')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('crawl')">{{ crawlControlLabel }}</button>
            <button :class="getControlButtonClass('autoMode')" :disabled="isControlDisabled('autoMode')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('autoMode')">{{ autoModeControlLabel }}</button>
            
            <!-- 第三行 -->
            <button :class="getControlButtonClass('walkGait')" :disabled="isControlDisabled('walkGait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('walkGait')">行走步态</button>
            <button :class="getControlButtonClass('obstacleGait')" :disabled="isControlDisabled('obstacleGait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('obstacleGait')">超障步态</button>
            <button :class="getControlButtonClass('slopeGait')" :disabled="isControlDisabled('slopeGait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('slopeGait')">斜坡步态</button>
            
            <!-- 第四行 -->
            <button :class="getControlButtonClass('stairGait')" :disabled="isControlDisabled('stairGait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('stairGait')">楼梯步态</button>
            <button :class="getControlButtonClass('stairFollowGait')" :disabled="isControlDisabled('stairFollowGait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('stairFollowGait')">帧楼梯步态</button>
            <button :class="getControlButtonClass('stair45Gait')" :disabled="isControlDisabled('stair45Gait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('stair45Gait')">45°楼梯步态</button>
            
            <!-- 第五行 -->
            <button :class="getControlButtonClass('lGait')" :disabled="isControlDisabled('lGait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('lGait')">L步态</button>
            <button :class="getControlButtonClass('mountainGait')" :disabled="isControlDisabled('mountainGait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('mountainGait')">山地步态</button>
            <button :class="getControlButtonClass('quietGait')" :disabled="isControlDisabled('quietGait')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('quietGait')">静音步态</button>
            
            <!-- 第六行 -->
            <button :class="getControlButtonClass('startCharge')" :disabled="isControlDisabled('startCharge')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('startCharge')">开始充电</button>
            <button :class="getControlButtonClass('endCharge')" :disabled="isControlDisabled('endCharge')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('endCharge')">结束充电</button>
            <button :class="getControlButtonClass('resetCharge')" :disabled="isControlDisabled('resetCharge')" v-permission-click-dialog="'main-robotcontrol'" @click="handleControlClick('resetCharge')">重置充电</button>
          </div>
        </div>
      </div>

      <!-- 任务下发 -->
      <div class="right-on3">
        <div class="cardTitle">
          <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
          任务下发
        </div>
        <div class="on3-bottom">
          <div class="on3-bottom-center">
            <div class="task-row">
              <div class="map-dropdown-wrapper" :class="{ 'disabled': navigationEnabled || insEnabled || msfEnabled }">
                <select class="map-dropdown" v-model="selectedMap" :disabled="navigationEnabled || insEnabled || msfEnabled">
                  <option v-if="mapList.length === 0" value="">选择地图</option>
                  <option v-for="map in mapList" :key="map" :value="map">
                    {{ map }}
                  </option>
                </select>
                <span class="dropdown-arrow">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="2,4 6,8 10,4" fill="#67d5fd"/>
                  </svg>
                </span>
              </div>
              <div class="task-buttons">
                <span 
                  class="task-btn" 
                  :class="{ 
                    'active': navigationEnabled, 
                    'disabled': insEnabled || msfEnabled,
                    'loading': navigationLoading
                  }"
                  v-permission-click-dialog="'main-taskdispatch'"
                  @click="handleEnableNavigation"
                >导航</span>
                <span 
                  class="task-btn" 
                  :class="{ 
                    'active': insEnabled, 
                    'disabled': navigationEnabled || msfEnabled || !hasRobotRtk,
                    'loading': insLoading
                  }"
                  v-permission-click-dialog="'main-taskdispatch'"
                  @click="handleEnableIns"
                >INS</span>
                <span 
                  class="task-btn" 
                  :class="{ 
                    'active': msfEnabled, 
                    'disabled': navigationEnabled || insEnabled || !hasRobotRtk,
                    'loading': msfLoading
                  }"
                  v-permission-click-dialog="'main-taskdispatch'"
                  @click="handleEnableMsf"
                >MSF</span>
              </div>
            </div>
            <div class="wayline-control-list">
              <div class="control-row">
                <div class="div">循迹任务：</div>
                <div class="wayline-select-wrapper">
                  <select 
                    v-model="selectedTrack" 
                    class="wayline-select"
                    :disabled="activeTaskType === 'track' || robotStore.isTracking"
                  >
                    <option v-if="filteredTrackList.length === 0" value="">暂无循迹任务</option>
                    <option 
                      v-for="track in filteredTrackList"
                      :key="track"
                      :value="track"
                    >
                      {{ track }}
                    </option>
                  </select>
                  <span class="wayline-custom-arrow">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <polygon points="2,4 6,8 10,4" fill="#fff"/>
                    </svg>
                  </span>
                </div>
                <div class="button-group">
                  <span 
                    class="span" 
                    :class="{ disabled: !canDispatchTrackTask }"
                    v-permission-click-dialog="'main-taskdispatch'"
                    @click="handleDispatchTask"
                  >下发任务</span>
                  <span 
                    class="span1" 
                    :class="{ 
                      disabled: activeTaskType !== 'track' && !robotStore.isTracking,
                      active: activeTaskType === 'track' || robotStore.isTracking
                    }"
                    v-permission-click-dialog="'main-taskdispatch'"
                    @click="handleCancelTask"
                  >
                    取消任务
                  </span>
                </div>
              </div>
              <div class="control-row">
                <div class="div">发布点任务：</div>
                <div class="wayline-select-wrapper">
                  <select 
                    v-model="selectedPointTask" 
                    class="wayline-select"
                    :disabled="activeTaskType === 'point' || robotStore.isPointTaskRunning"
                  >
                    <option v-if="filteredPointTaskList.length === 0" value="">暂无发布点任务</option>
                    <option 
                      v-for="task in filteredPointTaskList"
                      :key="task.task_id"
                      :value="task.task_id"
                    >
                      {{ task.task_name }}
                    </option>
                  </select>
                  <span class="wayline-custom-arrow">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <polygon points="2,4 6,8 10,4" fill="#fff"/>
                    </svg>
                  </span>
                </div>
                <div class="button-group">
                  <span 
                    class="span" 
                    :class="{ disabled: !canDispatchPointTask }"
                    v-permission-click-dialog="'main-taskdispatch'"
                    @click="handleDispatchPointTask"
                  >下发任务</span>
                  <span 
                    class="span1" 
                    :class="{ 
                      disabled: activeTaskType !== 'point' && !robotStore.isPointTaskRunning,
                      active: activeTaskType === 'point' || robotStore.isPointTaskRunning
                    }"
                    v-permission-click-dialog="'main-taskdispatch'"
                    @click="handleCancelTask"
                  >
                    取消任务
                  </span>
                </div>
              </div>
              <div class="control-row">
                <div class="div">多任务组：</div>
                <div class="wayline-select-wrapper">
                  <select 
                    v-model="selectedMultiTask" 
                    class="wayline-select"
                    :disabled="activeTaskType === 'multi' || robotStore.multitaskStatus?.status === true"
                  >
                    <option v-if="multiTaskList.length === 0" value="">暂无多任务组</option>
                    <option 
                      v-for="task in multiTaskList"
                      :key="task.multitask_id"
                      :value="task.multitask_id"
                    >
                      {{ task.multitask_name }}
                    </option>
                  </select>
                  <span class="wayline-custom-arrow">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <polygon points="2,4 6,8 10,4" fill="#fff"/>
                    </svg>
                  </span>
                </div>
                <div class="button-group">
                  <span 
                    class="span" 
                    :class="{ disabled: !canDispatchMultiTask || activeTaskType === 'multi' || robotStore.multitaskStatus?.status === true }"
                    v-permission-click-dialog="'main-taskdispatch'"
                    @click="handleDispatchMultiTask"
                  >下发任务</span>
                  <span 
                    class="span1" 
                    :class="{ disabled: activeTaskType !== 'multi' && !robotStore.multitaskStatus?.status, active: activeTaskType === 'multi' || robotStore.multitaskStatus?.status }"
                    v-permission-click-dialog="'main-taskdispatch'"
                    @click="handleCancelTask"
                  >
                    取消任务
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

  <!-- 下发任务弹窗 -->
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
          <!-- 周期任务开关（仅定时任务可用） -->
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
            <label>日期范围：</label>
            <input 
              v-model="dispatchTaskDialog.form.recurrence_start_date" 
              type="date" 
              class="dispatch-task-input"
              :min="getTodayDate()"
            />
            <span style="margin: 0 8px; color: #67d5fd;">至</span>
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
          <button class="mission-btn mission-btn-pause" v-permission-click-dialog="'main-taskdispatch'" @click="onDispatchTaskConfirm">确定</button>
          <button class="mission-btn mission-btn-cancel" @click="onDispatchTaskCancel">取消</button>
        </div>
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
                :disabled="taskpointList.length === 0 || trackStartDialog.loading"
              >
                <option v-if="taskpointList.length === 0" value="">暂无关键点文件</option>
                <option 
                  v-for="taskpoint in taskpointList" 
                  :key="taskpoint" 
                  :value="taskpoint"
                >
                  {{ taskpoint }}
                </option>
              </select>
            </div>
          </div>
          <div v-if="taskpointList.length === 0" class="dispatch-task-row">
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
            </div>
          </div>
        </div>
        <div class="dispatch-task-actions">
          <button 
            class="mission-btn mission-btn-pause" 
            :class="{ disabled: taskpointList.length === 0 || !trackStartDialog.form.taskpoint_name || trackStartDialog.loading }"
            v-permission-click-dialog="'main-taskdispatch'"
            @click="onTrackStartConfirm"
          >{{ trackStartDialog.loading ? '启动中...' : '确定' }}</button>
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

  <!-- 多任务组启动弹窗 -->
  <div v-if="multiTaskStartDialog.visible" class="custom-dialog-mask">
    <div class="dispatch-task-modal">
      <div class="dispatch-task-modal-content">
        <div class="dispatch-task-title">启动多任务组</div>
        <div class="dispatch-task-form">
          <div class="dispatch-task-row">
            <label>任务组名称：</label>
            <input 
              v-model="multiTaskStartDialog.form.group_name" 
              class="dispatch-task-input" 
              disabled
            />
          </div>
          <div class="dispatch-task-row">
            <label>异常时原地启动：</label>
            <div class="dispatch-switch-wrapper">
              <div
                class="switch-container"
                :class="{ active: multiTaskStartDialog.form.exception_start }"
                @click="multiTaskStartDialog.form.exception_start = !multiTaskStartDialog.form.exception_start"
              >
                <div class="switch-toggle"></div>
              </div>
              <span class="dispatch-switch-label">{{ multiTaskStartDialog.form.exception_start ? '是' : '否' }}</span>
            </div>
          </div>
        </div>
        <div class="dispatch-task-actions">
          <button 
            class="mission-btn mission-btn-pause" 
            v-permission-click-dialog="'main-taskdispatch'"
            @click="onMultiTaskStartConfirm"
          >确定</button>
          <button class="mission-btn mission-btn-cancel" @click="onMultiTaskStartCancel">取消</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 发布点任务启动弹窗 -->
  <div v-if="pointTaskStartDialog.visible" class="custom-dialog-mask">
    <div class="dispatch-task-modal">
      <div class="dispatch-task-modal-content">
        <div class="dispatch-task-title">启动发布点任务</div>
        <div class="dispatch-task-form">
          <div class="dispatch-task-row">
            <label>任务名称：</label>
            <input 
              v-model="pointTaskStartDialog.form.task_name" 
              class="dispatch-task-input" 
              disabled
            />
          </div>

        </div>
        <div class="dispatch-task-actions">
          <button 
            class="mission-btn mission-btn-pause" 
            v-permission-click-dialog="'main-taskdispatch'"
            @click="onPointTaskStartConfirm"
          >确定</button>
          <button class="mission-btn mission-btn-cancel" @click="onPointTaskStartCancel">取消</button>
        </div>
      </div>
    </div>
  </div>
    
    <ConfirmDialog
      :show="confirmDialog.visible"
      title="操作确认"
      :message="confirmDialog.message"
      type="warning"
      confirm-text="确认"
      cancel-text="取消"
      @confirm="onConfirmOk"
      @cancel="onConfirmCancel"
      @close="onConfirmCancel"
    />
    
    <!-- 大图显示模态框 -->
    <div v-if="showBigImage" class="alert-img-mask" @click="closeBigImage">
        <div class="alert-img-modal" @click.stop>
          <div class="alert-img-modal-header">
            <div class="alert-img-modal-title">
              <div class="alert-img-info" v-if="bigImageItem.camera || bigImageItem.type || bigImageItem.content">
                <span v-if="bigImageItem.camera" class="alert-img-tag">
                  <em>相机名称</em><i>{{ bigImageItem.camera }}</i>
                </span>
                <span v-if="bigImageItem.type" class="alert-img-tag">
                  <em>识别项目</em><i>{{ bigImageItem.type }}</i>
                </span>
                <span v-if="bigImageItem.content && bigImageItem.content !== '--'" class="alert-img-tag">
                  <em>内容</em><i>{{ bigImageItem.content }}</i>
                </span>
              </div>
              <div v-else class="alert-img-info-empty">暂无信息</div>
            </div>
            <button class="alert-img-close-btn" @click="closeBigImage">×</button>
          </div>
          <div class="alert-img-modal-body">
            <img
              v-if="!bigImageError"
              :src="bigImageItem.imageOriginalUrl"
              alt="图片预览"
              class="alert-img-preview"
              @error="bigImageError = true"
            />
            <div v-if="bigImageError" class="alert-img-error">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="8" fill="rgba(255,107,107,0.08)"/>
                <path d="M14 34l8-10 5 6 3-4 8 8H14z" fill="rgba(255,107,107,0.25)" stroke="#ff6b6b" stroke-width="1.5" stroke-linejoin="round"/>
                <circle cx="32" cy="18" r="3" fill="rgba(255,107,107,0.4)" stroke="#ff6b6b" stroke-width="1.5"/>
                <rect x="8" y="8" width="32" height="32" rx="4" stroke="#ff6b6b" stroke-width="1.5" stroke-dasharray="4 2"/>
              </svg>
              <span>图片加载失败</span>
            </div>
          </div>
        </div>
      </div>

    <!-- 自定义成功/错误提示 -->
    <SuccessMessage :show="successToast.show" :message="successToast.message" @close="successToast.show = false" />
    <ErrorMessage :show="errorToast.show" :message="errorToast.message" @close="errorToast.show = false" />

  </div>
</template>

<script setup lang="ts">
// ================= 轨迹路线文件本地缓存与配置 ================
import { 
  TRAJECTORY_CONFIG_KEY, 
  TRAJECTORY_STORE_NAME, 
  openTrajectoryDB, 
  saveTrajectoryFile, 
  getTrajectoryFile 
} from '../utils/trajectoryDB'

// 轨迹配置管理
const getTrajectoryConfig = (): Record<string, string> => {
  return JSON.parse(localStorage.getItem(TRAJECTORY_CONFIG_KEY) || '{}')
}
const saveTrajectoryConfig = (config: Record<string, string>): void => {
  localStorage.setItem(TRAJECTORY_CONFIG_KEY, JSON.stringify(config))
}
const updateTrajectoryConfig = (trackName: string, updateTime: string): void => {
  const config = getTrajectoryConfig()
  config[trackName] = updateTime
  saveTrajectoryConfig(config)
}
const shouldDownloadTrajectory = (trackName: string, serverUpdateTime: string): boolean => {
  const config = getTrajectoryConfig()
  const localUpdateTime = config[trackName]
  if (!localUpdateTime) return true
  return localUpdateTime !== serverUpdateTime
}

// 下载单个轨迹文件
const downloadTrajectoryFile = async (robotId: string, trackName: string): Promise<Blob | null> => {
  return mapFileApi.downloadTrajectoryFile(robotId, trackName)
}

// 下载所有轨迹文件（切换地图时调用）
const downloadAllTrajectoryFiles = async (robotId: string, trackList: string[]) => {
  // trackList 形如 [map1_track1@20260121, map1_track2@20260120]
  for (const trackRaw of trackList) {
    const atIndex = trackRaw.indexOf('@')
    const trackName = atIndex > -1 ? trackRaw.substring(0, atIndex) : trackRaw
    const updateTime = atIndex > -1 ? trackRaw.substring(atIndex + 1) : ''
    if (!trackName) continue
    if (!shouldDownloadTrajectory(trackName, updateTime)) continue
    const blob = await downloadTrajectoryFile(robotId, trackName)
    if (blob) {
      await saveTrajectoryFile(trackName, blob)
      updateTrajectoryConfig(trackName, updateTime)
    }
  }
}
import { ref, computed, onMounted, onActivated, onDeactivated, onUnmounted, nextTick, watch } from 'vue'
import { useDevices, useWaylineJobs } from '../composables/useApi'
import {
  navigationApi,
  mapFileApi,
  cameraApi,
  waylineApi,
  livestreamApi,
  dogApi,
} from '../api/services'
import type { CameraInfo } from '../api/services'
import SuccessMessage from '../components/SuccessMessage.vue'
import ErrorMessage from '../components/ErrorMessage.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ThreePointCloudPreview from '../components/ThreePointCloudPreview.vue'
import type { NormalizationParams, PointCloudPoint } from '../composables/usePointCloudRenderer'
import { load3MF } from '../utils/threemfParser'
import type { MeshData } from '../utils/threemfParser'
import { getRobotMapCacheKeys, getRobotContextCacheKeys } from '../utils/robotBootstrap'
import { useDeviceStatus } from '../composables/useDeviceStatus'
import { config, getCurrentEnvironment } from '../config/environment'
import { useDeviceStore } from '../stores/device'
import { useRobotStore } from '../stores/robot'
import { useTaskExecutionStore } from '../stores/taskExecution'
import { getVideoStreams, getVideoStream, setVideoStreams } from '../utils/videoCache'
import type { VideoStream } from '../utils/videoCache'
import { buildRobotHttpAssetUrl } from '../utils/robotHttpProxy'
import AMapLoader from '@amap/amap-jsapi-loader'
import flvjs from 'flv.js'
import * as echarts from 'echarts'
import mapDockIcon from '@/assets/source_data/svg_data/map_dock3.svg'
import mapDroneIcon from '@/assets/source_data/svg_data/map_drone.svg'
import droneArrowIcon from '@/assets/source_data/svg_data/drone_control_svg/drone_arrow.svg'
import droneBatteryIcon from '@/assets/source_data/svg_data/drone_battery.svg'
import droneBatteryChargeIcon from '@/assets/source_data/svg_data/drone_battery_charge.svg'
import mkfOnIcon from '@/assets/source_data/svg_data/mkf_on.svg'
import mkfOffIcon from '@/assets/source_data/svg_data/mkf_off.svg'



// 使用设备管理API
const { getCachedDeviceSns, getCachedWorkspaceId } = useDevices()
const deviceStore = useDeviceStore()
const robotStore = useRobotStore()
const taskExecutionStore = useTaskExecutionStore()

// 自定义提示消息（替代系统alert）
const successToast = ref({ show: false, message: '' })
const errorToast = ref({ show: false, message: '' })
let successTimer: ReturnType<typeof setTimeout> | null = null
let errorTimer: ReturnType<typeof setTimeout> | null = null

const showSuccess = (msg: string, duration = 2500) => {
  if (successTimer) clearTimeout(successTimer)
  successToast.value = { show: true, message: msg }
  successTimer = setTimeout(() => { successToast.value.show = false }, duration)
}
const showError = (msg: string, duration = 4000) => {
  if (errorTimer) clearTimeout(errorTimer)
  errorToast.value = { show: true, message: msg }
  errorTimer = setTimeout(() => { errorToast.value.show = false }, duration)
}

// 使用设备状态API
const { 
  fetchDeviceStatus, 
  fetchMainDeviceStatus,
  fetchDroneStatus,
  dockStatus, 
  droneStatus, 
  gpsStatus,
  formatCoordinate,
  formatHeight,
  formatSpeed,
  formatBattery,
  formatAccTime,
  formatFlightDistance
} = useDeviceStatus()

// 使用航线任务API
const { waylineFiles, fetchWaylineFiles, createJob, fetchWaylineDetail, cancelReturnHome, stopJob, pauseJob, resumeJob, executeJob } = useWaylineJobs()

// 使用全局任务进度store
import { useTaskProgressStore } from '../stores/taskProgress'
const taskProgressStore = useTaskProgressStore()

// 设备告警数据
const deviceAlarmData = ref<any[]>([])
const isHomePageActive = ref(true)
const isAlarmLogLoading = ref(false)
const nextAlarmLogRetryAt = ref(0)
const ALARM_LOG_RETRY_COOLDOWN_MS = 30_000

// 机场位置信息（用于地图显示）
const position = computed(() => {
  // 返回机场状态中的坐标信息
  const status = dockStatus.value
  if (status && 'longitude' in status && 'latitude' in status) {
    return {
      longitude: (status as any).longitude,
      latitude: (status as any).latitude,
      height: (status as any).height || 0
    }
  }
  return null
})

// 获取设备HMS告警的函数
const fetchDeviceHms = async (sn: string) => {
  try {
    // 这里应该调用真实的HMS API，暂时返回空数组
    return []
  } catch (err) {
    console.error('获取HMS告警失败:', err)
    return []
  }
}

// 解析错误消息
const parseErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.response?.data?.message) return error.response.data.message
  return '未知错误'
}

// ================= 机器人实时状态（来自 WebSocket robotStore） ================
let robotInfoTimer: number | null = null

// 计算属性：机器人是否在线（来自 robot_status 或 dog_udp_message wifi_error 心跳）
const isRobotOnline = computed(() => robotStore.isOnline)

// 计算属性：机器人电量（来自 0x21050f0a battery_level）
const robotBatteryLevel = computed(() => robotStore.batteryLevel)

// 计算属性：机器人是否处于充电中（来自 0x21050f0a current 正负值）
const isRobotCharging = computed(() => {
  const current = robotStore.batteryData?.current
  if (typeof current !== 'number' || !Number.isFinite(current)) return false
  return current > 0
})

// 计算属性：机器人电量是否已满（>=100%）
const isRobotBatteryFull = computed(() => {
  const level = Number(robotBatteryLevel.value)
  return Number.isFinite(level) && level >= 100
})

// 导航、INS、MSF 状态（初始值直接读取 store，避免 watch immediate 顺序问题）
const navigationEnabled = ref(robotStore.cmdStatus?.nav === 1)
const insEnabled = ref(robotStore.cmdStatus?.ins === 1)
const msfEnabled = ref(robotStore.cmdStatus?.msf === 1)
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
const navigationLoading = ref(false)
const insLoading = ref(false)
const msfLoading = ref(false)

// cmd_status 同步到本地按钮状态
watch(() => robotStore.cmdStatus, (status) => {
  if (!status) return
  navigationEnabled.value = status.nav === 1
  insEnabled.value = status.ins === 1
  msfEnabled.value = status.msf === 1
}, { deep: true })

// 各字段单独监听：只有对应字段值发生变化时才清除 loading
// 避免无关 cmd_status 消息将 loading 提前清除
watch(() => robotStore.cmdStatus?.nav, (val, oldVal) => {
  if (val !== oldVal && navigationLoading.value) {
    navigationLoading.value = false
  }
})
watch(() => robotStore.cmdStatus?.ins, (val, oldVal) => {
  if (val !== oldVal && insLoading.value) {
    insLoading.value = false
  }
})
watch(() => robotStore.cmdStatus?.msf, (val, oldVal) => {
  if (val !== oldVal && msfLoading.value) {
    msfLoading.value = false
  }
})

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

const extractTrackTaskList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.response?.data)) return payload.response.data
  return []
}

const activeOverlayTrackName = ref('')
const activeOverlayPointTaskId = ref('')
const lastTrackOverlayKey = ref('')
const lastTrackOverlayTaskPointCount = ref(0)
const lastPointTaskOverlayKey = ref('')
let trackTaskListRefreshPromise: Promise<any[]> | null = null

const getCachedTrackTaskListForCurrentRobot = (): any[] => {
  try {
    const contextKeys = getCurrentRobotContextKeys()
    const cachedData = contextKeys
      ? localStorage.getItem(contextKeys.allTrackTaskListKey) || localStorage.getItem('all_track_task_list')
      : localStorage.getItem('all_track_task_list')
    if (!cachedData) return []
    return extractTrackTaskList(JSON.parse(cachedData))
  } catch (err) {
    console.warn('[任务点] 读取缓存任务点列表失败:', err)
    return []
  }
}

const fetchTrackTaskListForCurrentRobot = async (): Promise<any[]> => {
  if (trackTaskListRefreshPromise) return trackTaskListRefreshPromise
  const robotId = deviceStore.selectedRobotId
  if (!robotId) return []

  trackTaskListRefreshPromise = (async () => {
    try {
      const response = await navigationApi.getAllTrackTaskList(robotId)
      const allTaskList = extractTrackTaskList(response)
      const serialized = JSON.stringify(allTaskList)
      const contextKeys = getCurrentRobotContextKeys()
      if (contextKeys) {
        localStorage.setItem(contextKeys.allTrackTaskListKey, serialized)
      }
      localStorage.setItem('all_track_task_list', serialized)
      return allTaskList
    } catch (err) {
      console.warn('[任务点] 刷新任务点列表失败:', err)
      return []
    } finally {
      trackTaskListRefreshPromise = null
    }
  })()

  return trackTaskListRefreshPromise
}

// cmd_status.track 同步 activeTaskType：WebSocket 反馈 track=1 时标记循迹任务运行中
watch(() => robotStore.cmdStatus?.track, (val) => {
  if (val === 1) {
    activeTaskType.value = 'track'
    const trackNameFromStatus = normalizeTrackName(robotStore.cmdStatus?.track_info?.track_name || '')
    const trackName = trackNameFromStatus || activeOverlayTrackName.value || normalizeTrackName(selectedTrack.value)
    if (trackName) {
      activeOverlayTrackName.value = trackName
      overlayTrackTrajectory(trackName)
    }
  } else if (val === 0 && activeTaskType.value === 'track') {
    activeTaskType.value = null
  }
})

// multitask_status 同步 activeTaskType：WebSocket 反馈多任务组运行状态
watch(() => robotStore.multitaskStatus?.status, (running) => {
  if (running === true) {
    activeTaskType.value = 'multi'
  } else if (running === false && activeTaskType.value === 'multi') {
    activeTaskType.value = null
  }
})

// 导航开启时，以 WebSocket 返回的地图为准覆盖缓存与下拉选中
const syncMapFromNavigation = (mapName: string) => {
  if (!mapName) return
  const cached = taskExecutionStore.selectedMapName
  // 若列表中没有该地图，动态插入首位，避免 select 出现空选项
  if (!mapList.value.includes(mapName)) {
    mapList.value = [mapName, ...mapList.value]
  }
  selectedMap.value = mapName
  // 打标记供 robotBootstrap 判断，防止它在 forceResetMapSelection 时覆盖掉这个值
  localStorage.setItem('nav_confirmed_map', mapName)
}

// cmd_status.map_name 变化时同步（导航进行中地图切换）
watch(() => robotStore.cmdStatus?.map_name, (mapName) => {
  if (mapName && robotStore.cmdStatus?.nav === 1) {
    syncMapFromNavigation(mapName)
  }
})

// nav 由 0→1 时立即用当前 map_name 对比并同步
watch(() => robotStore.cmdStatus?.nav, (nav) => {
  if (nav === 1) {
    const mapName = robotStore.cmdStatus?.map_name
    if (mapName) syncMapFromNavigation(mapName)
  } else if (nav === 0) {
    // 导航关闭后清除标记，下次切换机器人时不再受约束
    localStorage.removeItem('nav_confirmed_map')
    ensureDefaultMapSelection()
  }
})

// cmd_status.track_info 同步循迹任务下拉和 activeTrackInfo，并叠加轨迹到点云图
watch(() => robotStore.cmdStatus?.track_info, (info) => {
  if (!info) return
  if (robotStore.cmdStatus?.track === 1 && info.track_name) {
    const normalizedTrackName = normalizeTrackName(info.track_name)
    const normalizedTaskPointName = normalizeTaskPointName(
      info.taskpoint_name || activeTrackInfo.value.taskpoint_name || trackStartDialog.value.form.taskpoint_name || ''
    )
    pendingRunningTrackName.value = normalizedTrackName

    // 若下拉列表中没有该轨迹（缓存为空或机器人正在运行新任务），动态插入并写入缓存
    if (!filteredTrackList.value.includes(normalizedTrackName)) {
      if (!trackList.value.includes(normalizedTrackName)) {
        trackList.value = [normalizedTrackName, ...trackList.value]
        try {
          const contextKeys = getCurrentRobotContextKeys()
          if (contextKeys) {
            localStorage.setItem(contextKeys.trackListKey, JSON.stringify(trackList.value))
          }
          localStorage.setItem('cached_track_list', JSON.stringify(trackList.value))
        } catch { /* 存储失败静默忽略 */ }
      }
    }

    if (!applyPendingRunningTrackName()) {
      selectedTrack.value = normalizedTrackName
    }
    // 同时更新取消时需要的任务参数
    activeTrackInfo.value = {
      track_name: normalizedTrackName,
      // 某些固件在运行中可能回传空 taskpoint_name，这里保留已有值避免任务点丢失
      taskpoint_name: normalizedTaskPointName
    }
    activeOverlayTrackName.value = normalizedTrackName
    // 叠加路线轨迹到点云图
    const nextOverlayKey = `${normalizedTrackName}::${normalizedTaskPointName}`
    if (
      nextOverlayKey !== lastTrackOverlayKey.value ||
      pointCloudData.value.length === basePointCloudData.value.length
    ) {
      overlayTrackTrajectory(normalizedTrackName)
    }
  }
}, { deep: true })

// 循迹任务结束时，还原点云图（移除轨迹叠加），并重置下拉为第一条
watch(() => robotStore.isTracking, (tracking) => {
  if (!tracking) {
    lastTrackOverlayKey.value = ''
    lastTrackOverlayTaskPointCount.value = 0
    activeOverlayTrackName.value = ''
    if (basePointCloudData.value.length > 0) {
      pointCloudData.value = basePointCloudData.value
    }
    // 恢复显示列表第一项
    if (filteredTrackList.value.length > 0) {
      selectedTrack.value = filteredTrackList.value[0]
    }
  }
})

// 麦克风开关状态
const isMicOn = ref(false)

// 切换麦克风状态
const toggleMic = () => {
  isMicOn.value = !isMicOn.value
}

// 大图显示相关状态
const showBigImage = ref(false)
const bigImageItem = ref<{ imageOriginalUrl: string; camera: string; type: string; content: string }>({ imageOriginalUrl: '', camera: '', type: '', content: '' })
const bigImageError = ref(false)

const closeBigImage = () => {
  showBigImage.value = false
  bigImageError.value = false
}

// 处理警情图片点击
const handleAlertImageClick = (item: any) => {
  if (!item?.imageOriginalUrl) return
  bigImageItem.value = item
  bigImageError.value = false
  showBigImage.value = true
}

const handleAlertThumbError = (item: any) => {
  if (!item) return
  const original = item.imageOriginalUrl || ''
  const current = item.imageUrl || ''
  if (!item.imageFallbackTried && original && current !== original) {
    item.imageUrl = original
    item.imageFallbackTried = true
    return
  }
  item.imageUrl = ''
}

// 使用全局任务进度数据
const waylineProgress = computed(() => taskProgressStore.waylineProgress)
const waylineJobDetail = computed(() => taskProgressStore.waylineJobDetail)

// 飞行统计数据
const flightStatistics = ref<any>(null)
const loadingFlightStats = ref(false)
const flightStatsError = ref('')

// 机器人状态映射
const robotStatusMap: Record<number, string> = {
  0: '趴下状态',
  1: '正在起立状态',
  2: '初始站立状态',
  3: '力控站立状态',
  4: '踏步状态',
  5: '正在趴下状态',
  6: '软急停/摔倒状态',
  16: 'RL状态'
}

// 格式化机器人状态（来自 robotStore.robotStatusText）
const formatRobotStatus = (_value?: number) => robotStore.robotStatusText

// 格式化机器人电压（来自 robotStore.voltage，单位 V）
const formatRobotVoltage = (_value?: number) => {
  const v = robotStore.voltage
  if (v === null) return '0.0V'
  return `${v.toFixed(1)}V`
}

// 格式化机器人电流（来自 robotStore.current，单位 A）
const formatRobotCurrent = (_value?: number) => {
  const c = robotStore.current
  if (c === null) return '0A'
  return `${c}A`
}

// 格式化地面类型（来自 robotStore.terrainModeText）
const formatGroundType = () => robotStore.terrainModeText

// 格式化步态（来自 robotStore.gaitText）
const formatGaitType = () => robotStore.gaitText

// 格式化当前速度（来自 0x1009 leg_odom_vel）
const formatRobotSpeed = () => {
  const velocity = robotStore.motionState?.leg_odom_vel
  const vx = Array.isArray(velocity) ? velocity[0] : undefined
  if (typeof vx !== 'number' || !Number.isFinite(vx)) return '--'
  const normalizedVx = Math.abs(vx) < 0.005 ? 0 : vx
  return `${normalizedVx.toFixed(2)} m/s`
}

// 格式化坐标（来自 pose_update）
const formatRobotPositionAxis = (axis: 0 | 1 | 2) => {
  const pose = robotStore.pose
  if (!pose) return '--'

  const map = [pose.x, pose.y, pose.z]
  const value = map[axis]
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--'
  return value.toFixed(3)
}

// 格式化角度（来自 pose_update.theta，原始值显示）
const formatRobotYaw = () => {
  const theta = robotStore.pose?.theta
  if (typeof theta === 'number' && Number.isFinite(theta)) {
    return theta.toFixed(3)
  }

  return '--'
}

// 格式化姿态（来自 robotStore.postureText: 0x11050f08 body_height_state.state）
const formatPosture = () => robotStore.postureText
const pointCloudData = ref<PointCloudPoint[]>([])
const basePointCloudData = ref<PointCloudPoint[]>([])
const threePointCloudRef = ref<InstanceType<typeof ThreePointCloudPreview> | null>(null)
/** 机器狗箭头 3MF 网格（加载完成后设置） */
const arrowMesh = ref<MeshData | null>(null)
const pointCloudNormalizationParams = ref<NormalizationParams>({ centerX: 0, centerY: 0, centerZ: 0, maxRange: 0 })
const pointCloudNavigationOrigin = ref<{ x: number; y: number; z: number } | null>(null)
const pointCloudLoading = ref(false)
const pointCloudLoadingText = ref('点云加载中...')
const pointCloudError = ref('')
const lastLoadedPointCloudMap = ref('')
const lastPointCloudRefreshSignature = ref('')
const lastPointCloudRefreshAt = ref(0)
const POINT_CLOUD_REFRESH_DEDUPE_WINDOW_MS = 8000
const isPointCloudFullscreen = ref(false)
const togglePointCloudFullscreen = () => {
  isPointCloudFullscreen.value = !isPointCloudFullscreen.value
}

// 将视图居中到机器人当前位置
const centerToRobot = () => {
  threePointCloudRef.value?.centerToRobot?.()
}

// 叠加循迹轨迹到点云图
const overlayTrackTrajectory = async (trackName: string) => {
  const normalizedTrackName = normalizeTrackName(trackName)
  if (!normalizedTrackName || basePointCloudData.value.length === 0) return
  try {
    // 1. 读取轨迹路线数据
    const blob = await getTrajectoryFile(normalizedTrackName)
    const trajectoryPoints: Array<{x: number, y: number, z: number}> = []

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
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            trajectoryPoints.push({ x, y, z })
            continue
          }
        }
        // 5列：index, x, y, ... z 置为 0
        if (len === 5) {
          const x = parseFloat(parts[1]), y = parseFloat(parts[2])
          if (!isNaN(x) && !isNaN(y)) {
            trajectoryPoints.push({ x, y, z: 0 })
            continue
          }
        }
        // 其他列数按无效行跳过
      }
    }

    // 2. 读取任务点数据（从 localStorage 的 all_track_task_list）
    const taskPointsData: Array<{x: number, y: number, z: number, name: string}> = []
    const currentTaskPointName = normalizeTaskPointName(activeTrackInfo.value.taskpoint_name)
    const overlayKey = `${normalizedTrackName}::${currentTaskPointName}`
    if (
      lastTrackOverlayKey.value === overlayKey &&
      pointCloudData.value.length > basePointCloudData.value.length &&
      lastTrackOverlayTaskPointCount.value > 0
    ) {
      return
    }

    const collectTaskPoints = (allTaskList: any[]) => {
      let filteredTasks = allTaskList.filter((task: any) => {
        const taskTrackName = normalizeTrackName(String(task.track_name || ''))
        const taskPointName = normalizeTaskPointName(String(task.track_point_name || task.taskpoint_name || task.task_point_name || ''))
        return taskTrackName === normalizedTrackName &&
               taskPointName === currentTaskPointName
      })

      // taskpoint_name 为空或匹配不到时，回退为按 track_name 匹配
      if (!currentTaskPointName || filteredTasks.length === 0) {
        filteredTasks = allTaskList.filter((task: any) => {
          const taskTrackName = normalizeTrackName(String(task.track_name || ''))
          return taskTrackName === normalizedTrackName
        })
        if (filteredTasks.length > 0) {
          console.warn(`[任务点] taskpoint_name=${currentTaskPointName || '(空)'} 未匹配，回退为按轨迹匹配，共 ${filteredTasks.length} 条`)
        }
      }

      filteredTasks.forEach((task: any, idx: number) => {
        const tx = parseFloat(task.x), ty = parseFloat(task.y), tz = parseFloat(task.z ?? '0')
        if (!isNaN(tx) && !isNaN(ty) && !isNaN(tz)) {
          // 优先使用 type_text，其次 preset，最后使用序号
          const taskName = task.type_text || task.preset || `任务点${idx}`
          taskPointsData.push({
            x: tx,
            y: ty,
            z: tz,
            name: taskName
          })
        }
      })
    }

    const cachedTaskList = getCachedTrackTaskListForCurrentRobot()
    if (cachedTaskList.length > 0) {
      collectTaskPoints(cachedTaskList)
    } else {
      console.warn('[任务点] localStorage 中没有 all_track_task_list 数据，尝试远端刷新')
    }

    if (taskPointsData.length === 0) {
      const freshTaskList = await fetchTrackTaskListForCurrentRobot()
      if (freshTaskList.length > 0) {
        collectTaskPoints(freshTaskList)
      }
    }

    if (taskPointsData.length === 0) {
      console.warn('[任务点] 未找到有效的任务点坐标数据')
    }

    // 3. 归一化并合并数据
    const { centerX, centerY, centerZ, maxRange } = pointCloudNormalizationParams.value
    
    const normalizedTrajectory = trajectoryPoints.map(p => ({
      x: (p.x - centerX) / maxRange,
      y: (p.y - centerY) / maxRange,
      z: (p.z - centerZ) / maxRange,
      intensity: 2.0  // 特殊值，渲染时识别为轨迹点（绿色）
    }))

    const normalizedTaskPoints = taskPointsData.map(p => ({
      x: (p.x - centerX) / maxRange,
      y: (p.y - centerY) / maxRange,
      z: (p.z - centerZ) / maxRange,
      intensity: 3.0,  // 特殊值，渲染时识别为任务点（绿色）
      name: p.name      // 保留名称用于显示
    }))

    pointCloudData.value = [
      ...basePointCloudData.value, 
      ...normalizedTrajectory,
      ...normalizedTaskPoints
    ]
    lastTrackOverlayKey.value = overlayKey
    lastTrackOverlayTaskPointCount.value = normalizedTaskPoints.length
  } catch (e) {
    console.warn('叠加轨迹失败:', e)
  }
}

// 用 Web Worker 解析 PCD，避免阻塞主线程
const parsePcdBufferInWorker = (buffer: ArrayBuffer): Promise<{ points: PointCloudPoint[], normParams: { centerX: number, centerY: number, centerZ: number, maxRange: number } }> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/pcdParser.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      worker.terminate()
      if (e.data.ok) {
        resolve({ points: e.data.points, normParams: e.data.normParams })
      } else {
        reject(new Error(e.data.error))
      }
    }
    worker.onerror = (err) => {
      worker.terminate()
      reject(err)
    }
    // 用 transfer 转移 ArrayBuffer 所有权，零拷贝
    worker.postMessage({ buffer }, [buffer])
  })
}

const clearPointCloud = () => {
  pointCloudData.value = []
  basePointCloudData.value = []
  pointCloudNavigationOrigin.value = null
  lastLoadedPointCloudMap.value = ''
  lastPointCloudRefreshSignature.value = ''
  lastPointCloudRefreshAt.value = 0
  lastTrackOverlayKey.value = ''
  lastTrackOverlayTaskPointCount.value = 0
  lastPointTaskOverlayKey.value = ''
  // 重置归一化参数，避免继续显示原场景辅助元素
  pointCloudNormalizationParams.value = { centerX: 0, centerY: 0, centerZ: 0, maxRange: 0 }
}

const syncPointCloudOverlayByRuntimeState = async () => {
  if (basePointCloudData.value.length === 0) return

  const currentTrackName = activeOverlayTrackName.value || normalizeTrackName(selectedTrack.value)
  if (robotStore.isTracking && currentTrackName) {
    activeOverlayTrackName.value = currentTrackName
    await overlayTrackTrajectory(currentTrackName)
    return
  }

  if (robotStore.isPointTaskRunning) {
    const runningTaskName = String(robotStore.taskStatus?.task_name || '').trim()
    const matchedTask =
      pointTaskList.value.find(task => String(task.task_id) === String(activeOverlayPointTaskId.value))
      || pointTaskList.value.find(task => String(task.task_name || '').trim() === runningTaskName)
    if (matchedTask) {
      activeOverlayPointTaskId.value = matchedTask.task_id
      await overlayPointTaskWaypoints(matchedTask.task_id, matchedTask.task_name)
      return
    }
  }

  lastTrackOverlayKey.value = ''
  lastTrackOverlayTaskPointCount.value = 0
  lastPointTaskOverlayKey.value = ''
  pointCloudData.value = [...basePointCloudData.value]
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

const loadMapNavigationOrigin = async (mapName: string): Promise<{ x: number; y: number; z: number } | null> => {
  try {
    const originBlob = await getMapFile(mapName, 'odom_key_frames.txt')
    if (!originBlob || originBlob.size === 0) return null
    const text = await originBlob.text()
    return parseNavigationOriginFromOdomKeyFrames(text)
  } catch (error) {
    console.warn('[点云] 读取导航原点失败:', error)
    return null
  }
}

const refreshPointCloud = async (options?: { silent?: boolean; force?: boolean }) => {
  const hasExistingPointCloud = pointCloudData.value.length > 0 || basePointCloudData.value.length > 0
  const silentRefresh = !!options?.silent && hasExistingPointCloud
  pointCloudLoadingText.value = '点云加载中...'
  if (!silentRefresh) {
    pointCloudLoading.value = true
  } else {
    pointCloudLoading.value = false
  }
  pointCloudError.value = ''
  try {
    if (!selectedMap.value) {
      pointCloudError.value = '请先选择地图'
      clearPointCloud()
      return
    }
    const normalizedSelectedMap = String(selectedMap.value || '').trim().split('@')[0] || ''
    const currentUpdateTime = mapUpdateTimeMap.value[selectedMap.value] || ''
    const currentRefreshSignature = `${normalizedSelectedMap}@${currentUpdateTime}`
    const now = Date.now()
    const shouldSkipDuplicateRefresh =
      !options?.force &&
      normalizedSelectedMap &&
      lastLoadedPointCloudMap.value === normalizedSelectedMap &&
      basePointCloudData.value.length > 0 &&
      currentRefreshSignature === lastPointCloudRefreshSignature.value &&
      now - lastPointCloudRefreshAt.value < POINT_CLOUD_REFRESH_DEDUPE_WINDOW_MS

    if (shouldSkipDuplicateRefresh) {
      await syncPointCloudOverlayByRuntimeState()
      return
    }

    // 快速路径：切页回到首页时，地图未变且已有点云，避免重复重载导致首次拖动卡顿
    if (
      silentRefresh &&
      normalizedSelectedMap &&
      lastLoadedPointCloudMap.value === normalizedSelectedMap &&
      basePointCloudData.value.length > 0
    ) {
      await syncPointCloudOverlayByRuntimeState()
      return
    }

    // 先检查栅格图是否存在，没有则直接报错，不加载其他文件
    const gridBlob = await getMapFile(selectedMap.value, 'gridMap.pgm')
    if (!gridBlob || gridBlob.size === 0) {
      pointCloudError.value = '地图文件不存在'
      clearPointCloud()
      return
    }

    // 栅格图存在，再加载点云
    const pcdBlob = await getMapFile(selectedMap.value, 'tinyMap.pcd')
    if (!pcdBlob || pcdBlob.size === 0) {
      pointCloudError.value = '点云文件不存在'
      clearPointCloud()
      return
    }

    const ab = await pcdBlob.arrayBuffer()
    const { points, normParams } = await parsePcdBufferInWorker(ab)
    if (points.length === 0) {
      pointCloudError.value = '点云数据为空'
      clearPointCloud()
      return
    }

    pointCloudNormalizationParams.value = normParams
    pointCloudNavigationOrigin.value = await loadMapNavigationOrigin(selectedMap.value)
    lastLoadedPointCloudMap.value = normalizedSelectedMap
    lastPointCloudRefreshSignature.value = currentRefreshSignature
    lastPointCloudRefreshAt.value = Date.now()
    pointCloudData.value = points
    basePointCloudData.value = points
    lastTrackOverlayKey.value = ''
    lastTrackOverlayTaskPointCount.value = 0
    lastPointTaskOverlayKey.value = ''
    await nextTick()
    await syncPointCloudOverlayByRuntimeState()
  } catch (error) {
    console.error('[点云] 加载失败:', error)
    pointCloudError.value = '地图加载失败'
    clearPointCloud()
  } finally {
    if (!silentRefresh) {
      pointCloudLoading.value = false
    }
  }
}

// 设备状态刷新定时器
let statusRefreshTimer: number | null = null
// 无人机状态刷新定时器（2秒一次）
let droneStatusRefreshTimer: number | null = null

// 舱盖状态警报声相关
// const previousCoverState = ref<number | undefined>(undefined)
const isAlarmPlaying = ref(false)

// 生成警报声的函数
const createAlarmSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // 设置音频参数
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800Hz 频率
    oscillator.type = 'sine'
    
    // 设置音量包络
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    return audioContext
  } catch (error) {
    return null
  }
}

// 播放警报声的函数
const playAlarmSound = () => {
  if (isAlarmPlaying.value) return
  
  isAlarmPlaying.value = true
  let audioContext: AudioContext | null = null
  
  const playBeep = () => {
    if (!isAlarmPlaying.value) return
    
    audioContext = createAlarmSound()
    
    // 1.5秒后播放下一个"滴"
    setTimeout(() => {
      if (isAlarmPlaying.value) {
        playBeep()
      }
    }, 1500)
  }
  
  playBeep()
  
  return () => {
    isAlarmPlaying.value = false
    if (audioContext) {
      audioContext.close()
    }
  }
}

let stopAlarmSound: (() => void) | null | undefined = null



// 获取机场状态数据
const loadDockStatus = async () => {
  try {
    // 使用主要设备状态获取（自动使用第一个机场）
    await fetchMainDeviceStatus()
    
    // 设备状态更新后，更新地图标记（不定位）
    if (amapInstance) {
      updateMapMarkers()
    }
  } catch (err) {
    // 静默处理错误
  }
}

// 获取无人机状态数据
const loadDroneStatus = async () => {
  try {
    // 获取无人机状态数据
    await fetchDroneStatus()
  } catch (err) {
    // 静默处理错误
  }
}

// 获取飞行统计数据
const loadFlightStatistics = async (days = 7) => {
  loadingFlightStats.value = true
  flightStatsError.value = ''
  try {
    const workspaceId = getCachedWorkspaceId()
    if (!workspaceId) {
      // 静默处理，不显示错误
      return
    }
    const res = await waylineApi.getFlightStatistics(workspaceId, days)
    if (res.code === 0) {
      flightStatistics.value = res.data
      // 更新航线报表图表
      updateFlightStatisticsChart()
    } else {
      // 静默处理，不显示错误
      flightStatistics.value = null
    }
  } catch (e: any) {
    // 静默处理，不显示错误
    flightStatistics.value = null
  } finally {
    loadingFlightStats.value = false
  }
}

// 无人机显示位置计算属性
const droneDisplayPosition = computed<{ longitude: number; latitude: number; height: number } | null>(() => {
  // 检查无人机是否在仓
  const isInDock = droneStatus.value?.inDock === 1
  
  if (isInDock) {
    // 无人机在仓，显示机场坐标
    return position.value
  } else {
    // 无人机不在仓，显示无人机自己的坐标
    if (droneStatus.value && droneStatus.value.longitude && droneStatus.value.latitude) {
      return {
        longitude: droneStatus.value.longitude,
        latitude: droneStatus.value.latitude,
        height: droneStatus.value.height || 0
      }
    }
    // 如果无人机没有坐标数据，返回null
    return null
  }
})

// 相机名称英文 → 中文映射
const formatCameraName = (raw: string): string => {
  if (!raw) return ''
  const map: Record<string, string> = {
    cam_rtsp_left:     '左侧相机',
    cam_rtsp_right:    '右侧相机',
    cam_rtsp_front:    '前置相机',
    cam_rtsp_back:     '后置相机',
    cam_rtsp_rear:     '后置相机',
    cam_rtsp_infrared: '红外相机',
    cam_rtsp_thermal:  '热成像相机',
    cam_rtsp_depth:    '深度相机',
    cam_rtsp_wide:     '广角相机',
    cam_rtsp_zoom:     '变焦相机',
    cam_rtsp_top:      '顶部相机',
    cam_rtsp_bottom:   '底部相机',
    cam_rtsp_0:        '相机·1',
    cam_rtsp_1:        '相机·2',
    cam_rtsp_2:        '相机·3',
    cam_rtsp_3:        '相机·4',
  }
  return map[raw] || raw
}

// 获取最新4条告警日志并显示在实时警情表格
const fetchLatestAlarmLogs = async () => {
  if (!isHomePageActive.value) return
  if (isAlarmLogLoading.value) return
  if (Date.now() < nextAlarmLogRetryAt.value) return

  isAlarmLogLoading.value = true
  try {
    const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (!robotId) return
    const res = await navigationApi.getTrackLogList(robotId, {
      page: 1,
      page_size: 4,
      type: 'track'
    })
    const rows: any[] = res?.data?.data || []
    const formatTs = (ts: number | null) => {
      if (!ts) return '--'
      const ms = ts > 1e10 ? ts : ts * 1000
      return new Date(ms).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    }
    const appendTokenToImageUrl = (url: string): string => {
      if (!url) return ''
      const token = localStorage.getItem('token') || ''
      if (!token) return url
      try {
        const parsed = new URL(url, window.location.origin)
        parsed.searchParams.set('token', token)
        return parsed.toString()
      } catch {
        return url
      }
    }
    // 将图片路径转换为统一机器人 HTTP 代理 URL，解决 CORS
    const toProxyImageUrl = (imgPath: string): string => {
      if (!imgPath) return ''
      return appendTokenToImageUrl(
        buildRobotHttpAssetUrl(robotId, 81, imgPath, { preferDirectForPort81: false })
      )
    }
    // 生成缩略图 URL：将 .jpg/.jpeg/.png 替换为 _thumb.jpg
    const toThumbImageUrl = (proxyUrl: string): string => {
      if (!proxyUrl) return ''
      return proxyUrl.replace(/\.(jpg|jpeg|png)(\?|$)/i, '_thumb.jpg$2')
    }
    deviceAlarmData.value = rows.slice(0, 4).map(row => {
      const outmsg = typeof row?.outmessage === 'string'
        ? (() => { try { return JSON.parse(row.outmessage) } catch { return {} } })()
        : (row?.outmessage || {})
      const imgPath = outmsg?.out_image
      const imageOriginalUrl = toProxyImageUrl(imgPath || '')
      const imageUrl = toThumbImageUrl(imageOriginalUrl)
      // 从图片路径提取相机名称，如 /uploads/rec/20260310/cam_rtsp_left/3/xxx.jpg → cam_rtsp_left
      let cameraRaw = outmsg?.camera_name || outmsg?.camera || ''
      if (!cameraRaw && imgPath) {
        const parts = imgPath.replace(/\\/g, '/').split('/')
        const recIdx = parts.findIndex((p: string) => p === 'rec')
        if (recIdx !== -1 && parts[recIdx + 2]) cameraRaw = parts[recIdx + 2]
      }
      const camera = formatCameraName(cameraRaw)
      return {
        deviceName: row.sn || '--',
        type: row.content || '--',
        imageUrl,
        imageOriginalUrl,
        imageFallbackTried: false,
        camera,
        content: outmsg?.message || '--',
        description: row.task_point_description || '--',
        time: formatTs(row.create_time)
      }
    })
    nextAlarmLogRetryAt.value = 0
  } catch (err) {
    // 本地服务关闭等网络错误时进入冷却，避免请求刷屏
    nextAlarmLogRetryAt.value = Date.now() + ALARM_LOG_RETRY_COOLDOWN_MS
  } finally {
    isAlarmLogLoading.value = false
  }
}

// 仅在 WebSocket 推入新的 alert 时，才重新拉取最新告警日志
watch(
  () => {
    const latestAlert = robotStore.alerts[0]
    return latestAlert ? `${latestAlert.alert_id}:${latestAlert.detected_at}` : ''
  },
  (latestAlertKey, previousAlertKey) => {
    if (!latestAlertKey || latestAlertKey === previousAlertKey) return
    if (!(deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id'))) return
    fetchLatestAlarmLogs()
  }
)

// 云台切换函数
const switchGimbal = async (videoType: 'dock' | 'drone_visible' | 'drone_infrared') => {
  videoLoading.value = true
  
  try {
    const targetStream = getVideoStream(videoType)
    if (!targetStream) {
      alert(`没有找到${getVideoTypeName(videoType)}视频流`)
      return
    }
    
    // 更新当前视频流地址和类型
    videoStreamUrl.value = targetStream.url
    currentVideoType.value = videoType
    
  // ...
    
    // 选择视频后关闭菜单
    gimbalMenuVisible.value = false
  } finally {
    videoLoading.value = false
  }
}

// 获取视频类型名称
const getVideoTypeName = (type: 'dock' | 'drone_visible' | 'drone_infrared') => {
  const typeMap = {
    dock: '机场',
    drone_visible: '无人机可见光',
    drone_infrared: '无人机红外'
  }
  return typeMap[type]
}

// 获取航线任务进度数据（现在由全局store管理）
const loadWaylineProgress = async () => {
  try {
    // 检查全局store中是否有任务数据
    if (waylineProgress.value?.job_id) {
      // 显示航点和轨迹
      await displayWayline()
    } else {
      // 如果没有任务，清除航点和轨迹显示
      clearWaylineDisplay()
    }
  } catch (err) {
    // 静默处理错误
  }
}

// 格式化时间
const formatTime = (seconds: number) => {
  // 处理NaN和Infinity的情况
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return '00:00'
  }
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化时间戳为日期时间字符串
const formatTimestamp = (timestamp: number) => {
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

// 设置任务状态（正常/异常）
const taskStatus = ref('normal') // 'normal' 或 'error'

// 切换任务状态
const toggleTaskStatus = () => {
  taskStatus.value = taskStatus.value === 'normal' ? 'error' : 'normal'
}



// 航线任务相关计算属性
const wsTaskProgress = computed(() => robotStore.taskProgress)

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const wsTaskMeta = computed(() => {
  if (!isTrackOrPointTaskRunning.value) return null
  const p = wsTaskProgress.value
  if (!p) return null
  const total = Math.max(0, Math.floor(toFiniteNumber(p.total_points, 0)))
  const finishedRaw = Math.max(0, Math.floor(toFiniteNumber(p.finished_points, 0)))
  const finished = total > 0 ? Math.min(finishedRaw, total) : finishedRaw
  const complete = Math.max(0, Math.min(100, toFiniteNumber(p.task_complete, 0)))
  const started = total > 0 || complete > 0 || finished > 0
  const completed = started && ((total > 0 && finished >= total) || complete >= 100)
  return { total, finished, complete, started, completed }
})

const isTrackOrPointTaskRunning = computed(() => {
  return robotStore.isTracking || robotStore.isPointTaskRunning
})

const waylineTaskName = computed(() => {
  if (!hasActiveTaskStatistics.value) return '暂无任务'
  const name = wsTaskProgress.value?.task_name
  if (name && String(name).trim()) return name
  return waylineJobDetail.value?.name || '暂无任务'
})

const waylineTaskStartTime = computed(() => {
  if (!hasActiveTaskStatistics.value) return '--'
  const wsTrackStartTime = wsTaskProgress.value?.track_start_time
  if (wsTrackStartTime && String(wsTrackStartTime).trim()) {
    return String(wsTrackStartTime).trim()
  }
  if (!waylineJobDetail.value?.begin_time) return '--'
  return formatTimestamp(new Date(waylineJobDetail.value.begin_time).getTime())
})

const waylineInspectionProgressText = computed(() => {
  if (!hasActiveTaskStatistics.value) return '0/0'
  const ws = wsTaskMeta.value
  if (ws) {
    return `${ws.finished}/${ws.total}`
  }
  return '0/0'
})

const waylineTaskStatus = computed(() => {
  if (!hasActiveTaskStatistics.value) return 'waiting'
  const ws = wsTaskMeta.value
  if (ws) {
    if (!ws.started) return 'waiting'
    return ws.completed ? 'completed' : 'running'
  }
  return taskProgressStore.taskStatus
})

const waylineProgressPercent = computed(() => {
  if (!hasActiveTaskStatistics.value) return 0
  const ws = wsTaskMeta.value
  if (ws) return Math.round(ws.complete)
  return taskProgressStore.taskProgressPercent
})

const waylineTaskStatusText = computed(() => {
  if (!hasActiveTaskStatistics.value) return '暂无'
  const ws = wsTaskMeta.value
  if (ws) {
    if (!ws.started) return '暂无'
    return ws.completed ? '已完成' : '进行中'
  }

  const status = waylineProgress.value?.status
  if (!status) return '暂无'
  if (status === 'in_progress' || status === 'paused' || status === 'sent') return '进行中'
  if (status === 'ok' || status === 'partially_done' || status === 'canceled' || status === 'failed' || status === 'timeout' || status === 'rejected') return '已完成'
  return '暂无'
})

const hasActiveTaskStatistics = computed(() => {
  return isTrackOrPointTaskRunning.value
})

// 按钮状态控制
const canCancelTask = computed(() => {
  const status = waylineProgress.value?.status
  return status === 'in_progress' || status === 'paused'
})

const canResumeRoute = computed(() => {
  const status = waylineProgress.value?.status
  return status === 'paused'
})

const canPauseRoute = computed(() => {
  const status = waylineProgress.value?.status
  return status === 'in_progress'
})

const canCancelReturnHome = computed(() => {
  // 当无人机正在返航时可以取消返航
  // 这里可以根据实际业务逻辑调整条件
  const status = waylineProgress.value?.status
  return status === 'in_progress' || status === 'paused'
})

const canReturnHome = computed(() => {
  // 当无人机在线且不在仓时可以执行返航
  // 这里可以根据实际业务逻辑调整条件
  const isDroneOnline = droneStatus.value?.isOnline
  const isInDock = droneStatus.value?.inDock === 1
  return isDroneOnline && !isInDock
})



// 分屏控制
const showScreenMenu = ref(false)
const currentScreenMode = ref('一分屏')

const toggleScreenMenu = () => {
  showScreenMenu.value = !showScreenMenu.value
  // 关闭云台菜单
  gimbalMenuVisible.value = false
}

const selectScreenMode = (mode: string) => {
  currentScreenMode.value = mode
  showScreenMenu.value = false
}

// 点击外部关闭菜单
const closeMenus = () => {
  showScreenMenu.value = false
  gimbalMenuVisible.value = false
}

// 全局点击事件处理函数
const handleGlobalClick = (event: Event) => {
  const target = event.target as HTMLElement
  // 如果点击的不是云台按钮或其菜单内的元素，则关闭菜单
  if (!target.closest('.gimbal-control')) {
    gimbalMenuVisible.value = false
  }
  // 如果点击的不是分屏按钮或其菜单内的元素，则关闭分屏菜单
  if (!target.closest('.right-controls')) {
    showScreenMenu.value = false
  }
  // 点击非清晰度菜单区域时关闭清晰度菜单
  if (!target.closest('.quality-btn') && !target.closest('.quality-menu')) {
    showQualityMenu.value = false
  }
}

// 切换云台菜单
const toggleGimbalMenu = (event: Event) => {
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  
  gimbalMenuVisible.value = !gimbalMenuVisible.value
  
  if (gimbalMenuVisible.value) {
    // 设置菜单位置
    nextTick(() => {
      const menu = document.querySelector('.gimbal-menu') as HTMLElement
      if (menu) {
        menu.style.left = rect.left + 'px'
        menu.style.top = (rect.bottom + 4) + 'px'
      }
    })
  }
}

// 告警趋势图表实例
let alarmTrendChart: echarts.ECharts | null = null
// 任务饼图实例
let taskPieChart1: echarts.ECharts | null = null
let taskPieChart2: echarts.ECharts | null = null

// 航线报表图表实例
let lineChart: echarts.ECharts | null = null
// 图表动画定时器
let chartAnimationTimer: number | null = null

// 图表容器引用
const alarmTrendChartRef = ref<HTMLElement | null>(null)
const taskPieChart1Ref = ref<HTMLElement | null>(null)
const taskPieChart2Ref = ref<HTMLElement | null>(null)
const lineChartRef = ref<HTMLElement | null>(null)

// 地图容器ref和地图实例
const mapContainer = ref<HTMLElement | null>(null)
let amapInstance: any = null
let amapApiRef: any = null
const dockMarkers = ref<any[]>([])
const droneMarkers = ref<any[]>([])

// 无人机动画相关状态
const droneAnimationState = ref({
  currentPosition: { longitude: 0, latitude: 0, height: 0 },
  targetPosition: { longitude: 0, latitude: 0, height: 0 },
  isAnimating: false,
  animationStartTime: 0,
  animationDuration: 2000, // 2秒动画时长
  lastUpdateTime: 0
})

// 无人机位置插值函数
const interpolatePosition = (start: any, end: any, progress: number) => {
  return {
    longitude: start.longitude + (end.longitude - start.longitude) * progress,
    latitude: start.latitude + (end.latitude - start.latitude) * progress,
    height: start.height + (end.height - start.height) * progress
  }
}

// 更新无人机位置动画
const updateDronePositionAnimation = () => {
  if (!droneAnimationState.value.isAnimating || !droneMarkers.value.length) {
    return
  }

  const now = Date.now()
  const elapsed = now - droneAnimationState.value.animationStartTime
  const progress = Math.min(elapsed / droneAnimationState.value.animationDuration, 1)

  // 使用缓动函数使动画更自然
  const easeProgress = 1 - Math.pow(1 - progress, 3) // 缓出效果

  const currentPos = droneAnimationState.value.currentPosition
  const targetPos = droneAnimationState.value.targetPosition
  const interpolatedPos = interpolatePosition(currentPos, targetPos, easeProgress)

  // 更新无人机标记位置
  const droneMarker = droneMarkers.value[0]
  if (droneMarker) {
    droneMarker.setPosition([interpolatedPos.longitude, interpolatedPos.latitude])
  }

  // 如果动画完成，停止动画
  if (progress >= 1) {
    droneAnimationState.value.isAnimating = false
    droneAnimationState.value.currentPosition = { ...targetPos }
  } else {
    // 继续动画
    requestAnimationFrame(updateDronePositionAnimation)
  }
}

// 开始无人机位置动画
const startDronePositionAnimation = (newPosition: any) => {
  const currentPos = droneAnimationState.value.currentPosition
  const targetPos = {
    longitude: newPosition.longitude,
    latitude: newPosition.latitude,
    height: newPosition.height || 0
  }

  // 计算两点间距离，根据距离调整动画时长
  const distance = Math.sqrt(
    Math.pow(targetPos.longitude - currentPos.longitude, 2) +
    Math.pow(targetPos.latitude - currentPos.latitude, 2)
  )

  // 根据距离调整动画时长，距离越远动画时间越长，但不超过3秒
  const baseDuration = 1000 // 基础1秒
  const distanceFactor = Math.min(distance * 10000, 2) // 距离因子，最大2秒
  const animationDuration = Math.min(baseDuration + distanceFactor * 1000, 3000)

  droneAnimationState.value = {
    currentPosition: { ...currentPos },
    targetPosition: targetPos,
    isAnimating: true,
    animationStartTime: Date.now(),
    animationDuration: animationDuration,
    lastUpdateTime: Date.now()
  }

  // 开始动画
  requestAnimationFrame(updateDronePositionAnimation)
}
const isInitialLoad = ref(true)

// 视频播放器相关
const videoStreamUrl = ref<string>('')
const videoPlayer = ref<any>(null)
const videoElement = ref<HTMLVideoElement | null>(null)

// 云台切换相关
const currentVideoType = ref<'dock' | 'drone_visible' | 'drone_infrared'>('dock')
const videoLoading = ref(false)
const gimbalMenuVisible = ref(false)

// 清晰度设置相关状态
const showQualityMenu = ref(false)
const currentQuality = ref<number>(0)
const qualityChanging = ref(false)

// 清晰度菜单样式计算属性
const qualityMenuStyle = computed(() => {
  if (!showQualityMenu.value) return {}
  const button = document.querySelector('.quality-btn') as HTMLElement
  if (!button) return {}
  const rect = button.getBoundingClientRect()
  return {
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`
  }
})

// 切换清晰度菜单
const toggleQualityMenu = () => {
  showQualityMenu.value = !showQualityMenu.value
}

// 处理清晰度切换
const handleQualityChange = async (quality: number) => {
  if (qualityChanging.value) return
  try {
    const { dockSns } = getCachedDeviceSns()
    if (!dockSns || dockSns.length === 0) {
      alert('未找到可用的机场设备')
      return
    }

    // 从缓存的视频流中推断当前流的 device_sn/camera_index/video_index
    const streams = getVideoStreams()
    const active = streams.find(s => s.type === currentVideoType.value)
    if (!active) {
      alert('未找到当前视频流信息，无法设置清晰度')
      return
    }

    const videoId = `${active.device_sn}/${active.camera_index}/${active.video_index}`

    qualityChanging.value = true
    showQualityMenu.value = false
    const dockSn = dockSns[0]
    const result = await livestreamApi.setQuality(dockSn, { video_id: videoId, video_quality: quality })
    if ((result as any)?.message && (result as any).message.includes('Set livestream quality command sent')) {
      currentQuality.value = quality
    } else {
      const msg = (result as any)?.detail || (result as any)?.message || '清晰度设置失败'
      alert(msg)
    }
  } catch (err: any) {
    alert(err?.message || '清晰度设置失败')
  } finally {
    qualityChanging.value = false
  }
}

// WGS84坐标转GCJ-02坐标的转换函数
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

// 判断是否在中国范围外
const isOutOfChina = (lng: number, lat: number) => {
  return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271)
}

// 辅助函数：纬度转换
const transformLat = (lng: number, lat: number) => {
  const PI = Math.PI
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
  return ret
}

// 辅助函数：经度转换
const transformLng = (lng: number, lat: number) => {
  const PI = Math.PI
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

// 添加机场标记到地图
const addDockMarker = (longitude: number, latitude: number, dockInfo: any) => {
  if (!amapInstance || !amapApiRef) {
    return
  }

  const AMap = amapApiRef
  
  // 创建机场标记点
  const marker = new AMap.Marker({
    position: [longitude, latitude],
    title: `机场: ${dockInfo?.deviceSn || '未知设备'}`,
    content: `
      <img 
        src="${mapDockIcon}" 
        style="
          width: 32px;
          height: 32px;
          filter: brightness(0) saturate(100%) invert(40%) sepia(100%) saturate(10000%) hue-rotate(200deg) brightness(100%) contrast(100%);
        "
        alt="机场"
      />
    `,
    anchor: 'center',
    offset: new AMap.Pixel(0, 0)
  })

  // 添加到地图
  amapInstance.add(marker)
  dockMarkers.value.push(marker)
  
}

// 清除所有机场标记
const clearDockMarkers = () => {
  if (dockMarkers.value.length > 0) {
    dockMarkers.value.forEach(marker => {
      if (amapInstance) {
        amapInstance.remove(marker)
      }
    })
    dockMarkers.value = []
  }
}

// 无人机朝向扇形覆盖物集合（此处只使用一个）
const droneHeadingSectors = ref<any[]>([])

// 计算扇形顶点（返回经纬度数组）
const computeSectorPath = (center: [number, number], headingDeg: number, radiusMeters = 60, halfAngleDeg = 25) => {
  if (!amapApiRef) return []
  const AMap = amapApiRef
  const path: [number, number][] = []
  const steps = 16
  const start = headingDeg - halfAngleDeg
  const end = headingDeg + halfAngleDeg
  // 中心点
  path.push(center)
  for (let i = 0; i <= steps; i++) {
    const ang = start + (i * (end - start)) / steps
    const rad = (ang * Math.PI) / 180
    // 粗略将半径从米转近似经纬度偏移（按纬度方向近似）
    const dLat = (radiusMeters / 111320) * Math.cos(rad)
    const dLng = (radiusMeters / (111320 * Math.cos((center[1] * Math.PI) / 180))) * Math.sin(rad)
    path.push([center[0] + dLng, center[1] + dLat])
  }
  return path
}

// 创建无人机朝向扇形
const createHeadingSector = (center: [number, number], headingDeg: number) => {
  if (!amapApiRef) return null
  const AMap = amapApiRef
  const path = computeSectorPath(center, headingDeg)
  if (!path.length) return null
  return new AMap.Polygon({
    path,
    strokeColor: '#ff9900',
    strokeWeight: 2,
    fillColor: 'rgba(255,153,0,0.25)',
    fillOpacity: 0.35,
    zIndex: 120
  })
}

// 获取当前云台偏航角（优先设备状态，其次回退机体航向）
const getCurrentGimbalYaw = (): number => {
  const a = (droneStatus.value?.gimbalYaw ?? null) as number | null
  if (typeof a === 'number' && Number.isFinite(a)) return a
  return (droneStatus.value?.attitude?.head ?? 0) as number
}

// 更新现有扇形（若不存在返回null）
const updateHeadingSector = (center: [number, number], headingDeg: number) => {
  const sector = droneHeadingSectors.value?.[0]
  if (!sector || !amapApiRef) return null
  const path = computeSectorPath(center, headingDeg)
  sector.setPath(path)
  return sector
}

// 添加无人机标记到地图
const addDroneMarker = (longitude: number, latitude: number, droneInfo: any) => {
  if (!amapInstance || !amapApiRef) {
    return
  }

  const AMap = amapApiRef
  
  // 创建无人机标记点（箭头图标，后续通过 rotateAngle 实时旋转）
  const marker = new AMap.Marker({
    position: [longitude, latitude],
    title: `无人机: ${droneInfo?.deviceSn || '未知设备'}`,
    icon: new AMap.Icon({
      image: droneArrowIcon,
      imageSize: new AMap.Size(32, 32),
      size: new AMap.Size(32, 32)
    }),
    // 使用 autoRotation/angle 需要配合 setAngle
    autoRotation: false,
    angle: (droneStatus.value?.attitude?.head ?? 0) as number,
    anchor: 'center',
    offset: new AMap.Pixel(0, 0)
  })

  // 添加点击事件
  marker.on('click', () => {
    // 可以在这里添加更多交互功能，比如显示详细信息
  })

  // 添加到地图
  amapInstance.add(marker)
  droneMarkers.value.push(marker)

  // 添加朝向扇形（仅无人机在线时显示）
  if (droneStatus.value?.isOnline) {
    const heading = getCurrentGimbalYaw()
    const sector = createHeadingSector([longitude, latitude], heading)
    if (sector) {
      amapInstance.add(sector)
      droneHeadingSectors.value = [sector]
    }
  }
}

// 清除所有无人机标记
const clearDroneMarkers = () => {
  if (droneMarkers.value.length > 0) {
    droneMarkers.value.forEach(marker => {
      if (amapInstance) {
        amapInstance.remove(marker)
      }
    })
    droneMarkers.value = []
  }
  // 清除无人机朝向扇形
  if (droneHeadingSectors.value?.length > 0) {
    droneHeadingSectors.value.forEach((poly: any) => {
      if (amapInstance) {
        amapInstance.remove(poly)
      }
    })
    droneHeadingSectors.value = []
  }
}

// 更新地图标记（机场和无人机）
const updateMapMarkers = (shouldCenter = false) => {
  // 清除现有标记
  clearDockMarkers()
  
  // 检查是否有位置数据
  if (position.value && position.value.longitude && position.value.latitude) {
  // ...
    const wgsLongitude = position.value.longitude
    const wgsLatitude = position.value.latitude
    
    // 将WGS84坐标转换为GCJ-02坐标
    const gcjCoords = transformWGS84ToGCJ02(wgsLongitude, wgsLatitude)
    const longitude = gcjCoords.longitude
    const latitude = gcjCoords.latitude
    
    // 获取机场设备信息
    const cachedDockSns = JSON.parse(localStorage.getItem('cached_dock_sns') || '[]')
    const deviceSn = cachedDockSns.length > 0 ? cachedDockSns[0] : '未知设备'
    
    const dockInfo = {
      deviceSn: deviceSn,
      isOnline: dockStatus.value?.isOnline || false,
      longitude: longitude,
      latitude: latitude,
      height: position.value.height || 0
    }
    
    // 添加机场标记
    addDockMarker(longitude, latitude, dockInfo)
    
    // 获取无人机设备信息
    const cachedDroneSns = JSON.parse(localStorage.getItem('cached_drone_sns') || '[]')
    const droneDeviceSn = cachedDroneSns.length > 0 ? cachedDroneSns[0] : '未知设备'
    
    // 检查无人机是否有独立的坐标数据
    let droneLongitude = longitude
    let droneLatitude = latitude
    let droneHeight = position.value.height || 0
    
    if (droneStatus.value && droneStatus.value.longitude && droneStatus.value.latitude) {
      // 无人机有独立的坐标数据
      const droneWgsLongitude = droneStatus.value.longitude
      const droneWgsLatitude = droneStatus.value.latitude
      
      // 将WGS84坐标转换为GCJ-02坐标
      const droneGcjCoords = transformWGS84ToGCJ02(droneWgsLongitude, droneWgsLatitude)
      droneLongitude = droneGcjCoords.longitude
      droneLatitude = droneGcjCoords.latitude
      droneHeight = droneStatus.value.height || 0
    } else {
      // 无人机没有独立坐标数据，使用机场坐标
    }
    
    const droneInfo = {
      deviceSn: droneDeviceSn,
      isOnline: droneStatus.value?.isOnline || false,
      longitude: droneLongitude,
      latitude: droneLatitude,
      height: droneHeight
    }
    
    // 处理无人机标记的平滑动画
    if (droneMarkers.value.length === 0) {
      // 第一次创建无人机标记
      addDroneMarker(droneLongitude, droneLatitude, droneInfo)
      // 初始化动画状态
      droneAnimationState.value.currentPosition = {
        longitude: droneLongitude,
        latitude: droneLatitude,
        height: droneHeight
      }
    } else {
      // 检查位置是否有变化
      const currentPos = droneAnimationState.value.currentPosition
      const newPos = { longitude: droneLongitude, latitude: droneLatitude, height: droneHeight }
      
      const positionChanged = Math.abs(currentPos.longitude - newPos.longitude) > 0.000001 ||
                             Math.abs(currentPos.latitude - newPos.latitude) > 0.000001
      
      if (positionChanged && !droneAnimationState.value.isAnimating) {
        // 位置有变化且当前没有动画，开始新的动画
        startDronePositionAnimation(newPos)
      }
      // 无论位置是否变化，都根据机体航向更新箭头角度
      try {
        const heading = (droneStatus.value?.attitude?.head ?? 0) as number
        const marker = droneMarkers.value[0]
        if (marker) {
          if (typeof (marker as any).setAngle === 'function') {
            ;(marker as any).setAngle(heading)
          } else if (typeof (marker as any).setRotation === 'function') {
            ;(marker as any).setRotation(heading)
          }
        }
      } catch {}
      // 同步更新朝向扇形（仅在线时显示）
      try {
        if (droneStatus.value?.isOnline) {
          const heading = getCurrentGimbalYaw()
          const sector = updateHeadingSector([droneLongitude, droneLatitude], heading)
          if (!sector) {
            const newSector = createHeadingSector([droneLongitude, droneLatitude], heading)
            if (newSector) {
              amapInstance?.add(newSector)
              droneHeadingSectors.value = [newSector]
            }
          }
        } else {
          // 离线则清理扇形
          if (droneHeadingSectors.value?.length > 0) {
            droneHeadingSectors.value.forEach((poly: any) => amapInstance?.remove(poly))
            droneHeadingSectors.value = []
          }
        }
      } catch {}
    }
    
    // 更新无人机追踪
    updateDroneTracking()
    
    // 更新当前航点显示
    updateCurrentWaypoint()
    
    // 只在初始加载或明确要求时才设置地图中心
    if (shouldCenter && amapInstance) {
      amapInstance.setCenter([longitude, latitude])
      // 确保地图样式保持为卫星图
      if (amapApiRef) {
        amapInstance.setLayers([
          new amapApiRef.TileLayer.Satellite(),
          new amapApiRef.TileLayer.RoadNet()
        ])
      }
    }
  } else {
    // 无设备坐标数据，无法添加标记
  }
}

// 视频播放控制相关
const isVideoPlaying = ref(false)
const visibleLoading = ref(false)
const hasVisibleVideoFrame = ref(false)
const hasInfraredVideoFrame = ref(false)
const visibleVideoWrapper = ref<HTMLElement | null>(null)
const infraredVideoWrapper = ref<HTMLElement | null>(null)
const webrtcReconnecting = ref(false)   // 可见光重连中（保留最后一帧）
const infraredReconnecting = ref(false) // 红外重连中（保留最后一帧）
const currentTime = ref('00:00')
const totalTime = ref('00:00')
const infraredVideoElement = ref<HTMLVideoElement | null>(null)
const infraredVideoPlayer = ref<any>(null)
const infraredStreamUrl = ref('')
const infraredLoading = ref(false)
const infraredError = ref('')
let infraredPc: RTCPeerConnection | null = null
let infraredSessionId = 0

// ===== WebRTC 自动重连配置 =====
const WEBRTC_MAX_RECONNECT = 10
const WEBRTC_RECONNECT_BASE_DELAY = 3000   // 基础重连间隔 3s，最大退避 15s
const WEBRTC_FREEZE_CHECK_INTERVAL = 5000  // 每 5s 检测一次视频是否冻结
const WEBRTC_START_TIMEOUT = 10000         // 10s 内未建立有效画面则判定为启动失败

// 主视频重连状态
let webrtcReconnectTimer: ReturnType<typeof setTimeout> | null = null
let webrtcReconnectCount = 0
let webrtcFreezeTimer: ReturnType<typeof setInterval> | null = null
let webrtcLastVideoTime = -1
let webrtcStartTimer: ReturnType<typeof setTimeout> | null = null
let visibleReconnectRefreshRunning = false
let visibleBootstrapRetryTimer: ReturnType<typeof setTimeout> | null = null
let visibleBootstrapRetryCount = 0

// 红外视频重连状态
let infraredReconnectTimer: ReturnType<typeof setTimeout> | null = null
let infraredReconnectCount = 0
let infraredFreezeTimer: ReturnType<typeof setInterval> | null = null
let infraredLastVideoTime = -1
let infraredStartTimer: ReturnType<typeof setTimeout> | null = null
let infraredReconnectRefreshRunning = false
let infraredBootstrapRetryTimer: ReturnType<typeof setTimeout> | null = null
let infraredBootstrapRetryCount = 0
let hasHomeActivatedOnce = false
let foregroundRecoverTimer: ReturnType<typeof setTimeout> | null = null
let foregroundRecoverRunning = false
let visibleManualReconnectRunning = false
let infraredManualReconnectRunning = false

// ---------- 主视频重连辅助函数 ----------
const clearWebRTCReconnectTimer = () => {
  if (webrtcReconnectTimer) {
    clearTimeout(webrtcReconnectTimer)
    webrtcReconnectTimer = null
  }
}
const clearWebRTCFreezeDetection = () => {
  if (webrtcFreezeTimer) {
    clearInterval(webrtcFreezeTimer)
    webrtcFreezeTimer = null
  }
  webrtcLastVideoTime = -1
}
const clearWebRTCStartTimer = () => {
  if (webrtcStartTimer) {
    clearTimeout(webrtcStartTimer)
    webrtcStartTimer = null
  }
}
const clearVisibleBootstrapRetryTimer = () => {
  if (visibleBootstrapRetryTimer) {
    clearTimeout(visibleBootstrapRetryTimer)
    visibleBootstrapRetryTimer = null
  }
}
const scheduleVisibleStreamBootstrapRetry = (robotId: string) => {
  if (!robotId || robotId !== deviceStore.selectedRobotId) return
  if (visibleBootstrapRetryTimer) return
  if (visibleBootstrapRetryCount >= 3) return

  visibleBootstrapRetryCount++
  webrtcReconnecting.value = true
  const delay = Math.min(1200 * visibleBootstrapRetryCount, 4000)
  visibleBootstrapRetryTimer = setTimeout(async () => {
    visibleBootstrapRetryTimer = null
    if (!deviceStore.selectedRobotId || deviceStore.selectedRobotId !== robotId) {
      webrtcReconnecting.value = false
      return
    }

    if (!hasCameraStreamUrl(robotId, 'drone_visible')) {
      await initCameraStreams()
    }
    if (!deviceStore.selectedRobotId || deviceStore.selectedRobotId !== robotId) {
      webrtcReconnecting.value = false
      return
    }

    initVideoPlayer()
    if (videoStreamUrl.value) {
      await nextTick()
      startVideoPlayback()
      visibleBootstrapRetryCount = 0
      webrtcReconnecting.value = false
      return
    }

    scheduleVisibleStreamBootstrapRetry(robotId)
  }, delay)
}
const scheduleWebRTCReconnect = () => {
  if (!videoStreamUrl.value) {
    clearWebRTCReconnectTimer()
    clearWebRTCStartTimer()
    webrtcReconnecting.value = false
    return
  }
  if (webrtcReconnectTimer) return // 已有待执行的重连
  if (webrtcReconnectCount >= WEBRTC_MAX_RECONNECT) {
    clearWebRTCStartTimer()
    webrtcReconnecting.value = false
    return
  }
  clearWebRTCStartTimer()
  webrtcReconnectCount++
  webrtcReconnecting.value = true  // 显示 overlay，保留最后一帧
  const delay = Math.min(WEBRTC_RECONNECT_BASE_DELAY * webrtcReconnectCount, 15000)
  webrtcReconnectTimer = setTimeout(async () => {
    webrtcReconnectTimer = null
    if (!videoStreamUrl.value) {
      webrtcReconnecting.value = false
      return
    }

    // 连续失败后主动刷新可见光流地址，避免反复使用失效的旧 URL。
    // 经验上每 3 次失败刷新一次，兼顾恢复速度与后端压力。
    if (webrtcReconnectCount >= 3 && webrtcReconnectCount % 3 === 0) {
      const robotId = deviceStore.selectedRobotId || ''
      if (robotId && !visibleReconnectRefreshRunning) {
        visibleReconnectRefreshRunning = true
        try {
          if (!hasCameraStreamUrl(robotId, 'drone_visible')) {
            await initCameraStreams()
          }
          if (robotId === deviceStore.selectedRobotId) {
            initVideoPlayer()
          }
        } catch (err) {
          console.warn('[WebRTC重连] 刷新可见光流地址失败:', err)
        } finally {
          visibleReconnectRefreshRunning = false
        }
      }
    }

    stopWebRTCPlaybackForReconnect()  // 只关连接，不清 srcObject
    startWebRTCPlayback()
  }, delay)
}
const startWebRTCFreezeDetection = () => {
  clearWebRTCFreezeDetection()
  webrtcFreezeTimer = setInterval(() => {
    if (!videoElement.value || !isPlaying) return
    const t = videoElement.value.currentTime
    if (webrtcLastVideoTime >= 0 && t === webrtcLastVideoTime && !videoElement.value.paused) {
      scheduleWebRTCReconnect()
    }
    webrtcLastVideoTime = t
  }, WEBRTC_FREEZE_CHECK_INTERVAL)
}

// ---------- 红外视频重连辅助函数 ----------
const clearInfraredReconnectTimer = () => {
  if (infraredReconnectTimer) {
    clearTimeout(infraredReconnectTimer)
    infraredReconnectTimer = null
  }
}
const clearInfraredFreezeDetection = () => {
  if (infraredFreezeTimer) {
    clearInterval(infraredFreezeTimer)
    infraredFreezeTimer = null
  }
  infraredLastVideoTime = -1
}
const clearInfraredStartTimer = () => {
  if (infraredStartTimer) {
    clearTimeout(infraredStartTimer)
    infraredStartTimer = null
  }
}
const clearInfraredBootstrapRetryTimer = () => {
  if (infraredBootstrapRetryTimer) {
    clearTimeout(infraredBootstrapRetryTimer)
    infraredBootstrapRetryTimer = null
  }
}
const scheduleInfraredStreamBootstrapRetry = (robotId: string) => {
  if (!robotId || robotId !== deviceStore.selectedRobotId) return
  if (infraredBootstrapRetryTimer) return
  if (infraredBootstrapRetryCount >= 3) return

  infraredBootstrapRetryCount++
  infraredReconnecting.value = true
  const delay = Math.min(1200 * infraredBootstrapRetryCount, 4000)
  infraredBootstrapRetryTimer = setTimeout(async () => {
    infraredBootstrapRetryTimer = null
    if (!deviceStore.selectedRobotId || deviceStore.selectedRobotId !== robotId) {
      infraredReconnecting.value = false
      return
    }

    if (!hasCameraStreamUrl(robotId, 'drone_infrared')) {
      await initCameraStreams()
    }
    if (!deviceStore.selectedRobotId || deviceStore.selectedRobotId !== robotId) {
      infraredReconnecting.value = false
      return
    }

    initInfraredVideo()
    if (infraredStreamUrl.value) {
      await nextTick()
      startInfraredPlayback()
      infraredBootstrapRetryCount = 0
      infraredReconnecting.value = false
      return
    }

    scheduleInfraredStreamBootstrapRetry(robotId)
  }, delay)
}
const scheduleInfraredReconnect = () => {
  if (!infraredStreamUrl.value) {
    clearInfraredReconnectTimer()
    clearInfraredStartTimer()
    infraredReconnecting.value = false
    return
  }
  if (infraredReconnectTimer) return
  if (infraredReconnectCount >= WEBRTC_MAX_RECONNECT) {
    clearInfraredStartTimer()
    infraredReconnecting.value = false
    return
  }
  clearInfraredStartTimer()
  infraredReconnectCount++
  infraredReconnecting.value = true  // 显示 overlay，保留最后一帧
  const delay = Math.min(WEBRTC_RECONNECT_BASE_DELAY * infraredReconnectCount, 15000)
  infraredReconnectTimer = setTimeout(async () => {
    infraredReconnectTimer = null
    if (!infraredStreamUrl.value) {
      infraredReconnecting.value = false
      return
    }

    // 连续失败后主动刷新红外流地址，避免重连反复命中失效 URL。
    if (infraredReconnectCount >= 3 && infraredReconnectCount % 3 === 0) {
      const robotId = deviceStore.selectedRobotId || ''
      if (robotId && !infraredReconnectRefreshRunning) {
        infraredReconnectRefreshRunning = true
        try {
          if (!hasCameraStreamUrl(robotId, 'drone_infrared')) {
            await initCameraStreams()
          }
          if (robotId === deviceStore.selectedRobotId) {
            initInfraredVideo()
          }
        } catch (err) {
          console.warn('[红外重连] 刷新流地址失败:', err)
        } finally {
          infraredReconnectRefreshRunning = false
        }
      }
    }

    stopInfraredWebRTCPlaybackForReconnect()  // 只关连接，不清 srcObject
    startInfraredPlayback(true)  // keepFrame=true，跳过内部 stop
  }, delay)
}
const startInfraredFreezeDetection = () => {
  clearInfraredFreezeDetection()
  infraredFreezeTimer = setInterval(() => {
    if (!infraredVideoElement.value || !infraredPc) return
    const t = infraredVideoElement.value.currentTime
    if (infraredLastVideoTime >= 0 && t === infraredLastVideoTime && !infraredVideoElement.value.paused) {
      scheduleInfraredReconnect()
    }
    infraredLastVideoTime = t
  }, WEBRTC_FREEZE_CHECK_INTERVAL)
}

const getCameraIdentityText = (camera: Partial<CameraInfo>) => {
  return [
    camera.CamType,
    camera.CamName,
    camera.PtzName,
    camera.PtzType,
    camera.CamKey,
    camera.MainUrl,
    camera.SubUrl,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const getCameraStreamType = (camera: Partial<CameraInfo>): VideoStream['type'] | null => {
  const text = getCameraIdentityText(camera)
  if (!text) return null

  if (/(infrared|thermal|ir|红外|热成像)/i.test(text)) {
    return 'drone_infrared'
  }

  if (/(visible|normal|wide|zoom|vision|rgb|可见光|白光)/i.test(text)) {
    return 'drone_visible'
  }

  return null
}

const buildCameraBindings = (cameraData: CameraInfo[]) => {
  const candidates = cameraData.slice(0, 2)
  const bindings: Array<{ camera: CameraInfo; type: Extract<VideoStream['type'], 'drone_visible' | 'drone_infrared'> }> = []

  candidates.forEach((camera, index) => {
    const inferredType = getCameraStreamType(camera)
    const fallbackType: Extract<VideoStream['type'], 'drone_visible' | 'drone_infrared'> =
      index === 0 ? 'drone_visible' : 'drone_infrared'
    const type = inferredType === 'drone_infrared' || inferredType === 'drone_visible'
      ? inferredType
      : fallbackType

    if (!bindings.some(item => item.type === type)) {
      bindings.push({ camera, type })
    }
  })

  if (!bindings.some(item => item.type === 'drone_visible') && candidates[0]) {
    bindings.unshift({ camera: candidates[0], type: 'drone_visible' })
  }

  if (!bindings.some(item => item.type === 'drone_infrared') && candidates[1]) {
    bindings.push({ camera: candidates[1], type: 'drone_infrared' })
  }

  return bindings
}

const startCameraStreamWithRetry = async (
  robotId: string,
  camera: CameraInfo,
  signal?: AbortSignal
): Promise<string> => {
  let lastError: unknown = null

  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    try {
      const response = await cameraApi.startCameraStream(robotId, camera.CamKey, false, signal)
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      if (response?.stream_url) {
        return response.stream_url
      }
      lastError = new Error(`Empty stream url for ${camera.CamKey}`)
    } catch (error) {
      if ((error as any)?.name === 'AbortError' || (error as any)?.message === 'canceled') {
        throw error
      }
      lastError = error
    }
  }

  throw lastError || new Error(`Failed to start stream for ${camera.CamKey}`)
}

// 初始化视频播放器
const initVideoPlayer = () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  const streams = robotId ? getRobotVideoStreams(robotId) : getVideoStreams()
  // 每次初始化先清空，避免沿用旧机器人 URL 触发重连
  videoStreamUrl.value = ''

  const visibleStream =
    (robotId ? getRobotVideoStreamByType(robotId, 'drone_visible') : getVideoStream('drone_visible'))
    || streams.find(stream => stream.type === 'drone_visible')
    || null

  if (visibleStream) {
    visibleLoading.value = true
    videoStreamUrl.value = visibleStream.url
    currentVideoType.value = 'drone_visible'
  } else {
    visibleLoading.value = false
    stopVideoPlayback()
  }
  
  // 由watch(videoStreamUrl)统一触发播放，避免重复拉流
}

// 摄像头初始化的当前 AbortController，新一轮开始时取消上一轮
let cameraInitAbortController: AbortController | null = null
let isCameraInitRunning = false
let cameraInitRunningRobotId = ''
let lastCameraInitSuccessAt = 0
const CAMERA_STREAM_REFRESH_COOLDOWN_MS = 15000

// 初始化摄像头流
const initCameraStreams = async (signal?: AbortSignal) => {
  let robotId = deviceStore.selectedRobotId
  if (!robotId) {
    robotId = localStorage.getItem('selected_robot_id') || ''
  }
  if (!robotId) {
    setVideoStreams([])
    return
  }

  // 优先读缓存（robotBootstrap 切换机器人后已预填充）
  const cachedCameraList = localStorage.getItem(getRobotCameraListCacheKey(robotId))
  let cameraData: any[] | null = null
  if (cachedCameraList) {
    try {
      cameraData = JSON.parse(cachedCameraList)
    } catch (_) {}
  }

  // 缓存为空时才直接请求接口
  if (!cameraData || !Array.isArray(cameraData) || cameraData.length === 0) {
    try {
      const cameraListResponse = await cameraApi.getCameraList(robotId, signal)
      if (signal?.aborted) return
      if (!cameraListResponse?.data || !Array.isArray(cameraListResponse.data) || cameraListResponse.data.length === 0) {
        setRobotVideoStreams(robotId, [])
        return
      }
      cameraData = cameraListResponse.data
      localStorage.setItem(getRobotCameraListCacheKey(robotId), JSON.stringify(cameraData))
    } catch (_) {
      setRobotVideoStreams(robotId, [])
      return
    }
  }

  try {
    const camerasToUse = buildCameraBindings(cameraData as CameraInfo[])
    const streamByType: Partial<Record<'drone_visible' | 'drone_infrared', VideoStream>> = {}
    const startTasks = camerasToUse.map(async ({ camera, type }) => {
      const url = await startCameraStreamWithRetry(robotId, camera, signal)
      if (signal?.aborted) return

      const streamItem: VideoStream = {
        type,
        url,
        switchable_video_types: camera.MainUrl && camera.SubUrl ? ['main', 'sub'] : [],
        device_sn: robotId,
        camera_index: camera.CamKey,
        video_index: camera.CamKey,
        use_sub_stream: false,
      }
      streamByType[type] = streamItem

      const partialStreams = Object.values(streamByType).filter(
        (item): item is VideoStream => Boolean(item)
      )
      setRobotVideoStreams(robotId, partialStreams)
      if (type === 'drone_visible') {
        setRobotDefaultVideoType(robotId, 'drone_visible')
      }

      // 谁先拿到流地址就先播放谁，不等待另一条
      if (deviceStore.selectedRobotId === robotId) {
        if (type === 'drone_visible') {
          initVideoPlayer()
        } else if (type === 'drone_infrared') {
          initInfraredVideo()
        }
      }
    })

    await Promise.allSettled(startTasks)
    if (signal?.aborted) return

    const streamResults = Object.values(streamByType).filter(
      (item): item is VideoStream => Boolean(item)
    )

    // 保存当前成功启动的流；失败的路不会影响另一条成功流
    setRobotVideoStreams(robotId, streamResults)
    if (streamResults.some(stream => stream.type === 'drone_visible')) {
      setRobotDefaultVideoType(robotId, 'drone_visible')
    }
  } catch (error) {
    if ((error as any)?.name === 'AbortError' || (error as any)?.message === 'canceled') return
    setRobotVideoStreams(robotId, [])
  }
}

// 开始视频播放
const startVideoPlayback = () => {
  if (!videoElement.value || !videoStreamUrl.value) {
    visibleLoading.value = false
    return
  }

  visibleLoading.value = true

  try {
    // 销毁之前的播放器实例
    if (videoPlayer.value) {
      videoPlayer.value.destroy()
      videoPlayer.value = null
    }

    // 添加视频事件监听器
    if (videoElement.value) {
      // 强制设置视频样式
      videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
      
      videoElement.value.addEventListener('play', () => {
        isVideoPlaying.value = true
        hasVisibleVideoFrame.value = true
        visibleLoading.value = false
      })
      
      videoElement.value.addEventListener('pause', () => {
        isVideoPlaying.value = false
      })
      
      videoElement.value.addEventListener('timeupdate', updateVideoTime)
      
      videoElement.value.addEventListener('loadedmetadata', () => {
        updateVideoTime()
      })
      
      // 确保视频加载后也应用样式
      videoElement.value.addEventListener('loadeddata', () => {
        const el = videoElement.value
        if (!el) return
        el.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
        hasVisibleVideoFrame.value = true
        visibleLoading.value = false
      })
    }

    // 检查是否是webrtc地址
    if (videoStreamUrl.value.startsWith('webrtc://')) {
      startWebRTCPlayback()
    } else if (videoStreamUrl.value.startsWith('rtmp://')) {
      
      if (flvjs.isSupported()) {
        
        // 将rtmp地址转换为http-flv地址
        const flvUrl = videoStreamUrl.value.replace(/^rtmp:\/\/[^\/]+/, config.api.domain)
        
        // 创建flv播放器
        videoPlayer.value = flvjs.createPlayer({
          type: 'flv',
          url: flvUrl,
          isLive: true,
          hasAudio: false,
          hasVideo: true
        }, {
          enableStashBuffer: false,
          stashInitialSize: 128,
          enableWorker: true,
          lazyLoad: false,
          autoCleanupSourceBuffer: true
        })

        // 绑定到video元素
        videoPlayer.value.attachMediaElement(videoElement.value)
        videoPlayer.value.load()
        videoPlayer.value.play()

        // 强制设置flv播放器的视频元素样式
        if (videoElement.value) {
          videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
        }
      }
    } else {
      videoElement.value.src = videoStreamUrl.value
      videoElement.value.load()
      
      // 强制设置原生视频播放器样式
      videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
      
      videoElement.value.play().then(() => {
        hasVisibleVideoFrame.value = true
        visibleLoading.value = false
      }).catch(error => {
        // 静默处理播放失败
        visibleLoading.value = false
      })
    }
  } catch (error) {
    // 静默处理初始化失败
    visibleLoading.value = false
  }
}

// WebRTC播放器实例
let pc: RTCPeerConnection | null = null
let isPlaying = false
let webrtcSessionId = 0

// 构建SRS API地址（通过 nginx 代理，解决 CORS 问题）
const buildApiUrl = (webrtcUrl: string) => {
  try {
    // webrtc://server:8000/app/stream -> /rtc-proxy/server
    const url = new URL(webrtcUrl)
    return `/rtc-proxy/${url.hostname}`
  } catch (error) {
    // 后备方案：提取主机名
    const match = webrtcUrl.replace('webrtc://', '').split('/')[0].split(':')[0]
    return `/rtc-proxy/${match}`
  }
}

// 开始WebRTC播放
const startWebRTCPlayback = async () => {
  if (isPlaying) {
    stopWebRTCPlayback()
  }

  const serverUrl = videoStreamUrl.value
  if (!serverUrl) {
    console.warn('[WebRTC播放] serverUrl 为空，跳过播放')
    return
  }

  let sessionId = 0
  try {
    // 确保之前的连接已清理
    if (pc) {
      pc.close()
      pc = null
    }

    sessionId = ++webrtcSessionId
    
    // 创建新的RTCPeerConnection
    const currentPc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })
    pc = currentPc

    clearWebRTCStartTimer()
    webrtcStartTimer = setTimeout(() => {
      if (sessionId === webrtcSessionId && pc === currentPc && !isPlaying) {
        scheduleWebRTCReconnect()
      }
    }, WEBRTC_START_TIMEOUT)

    // 添加ICE candidate监听
    currentPc.onicecandidate = (_event) => {
      // ICE candidate gathering
    }

    // 监听连接状态
    currentPc.onconnectionstatechange = () => {
      if (pc !== currentPc || sessionId !== webrtcSessionId) return
      if (currentPc.connectionState === 'connected') {
        clearWebRTCReconnectTimer()
        clearWebRTCStartTimer()
      } else if (currentPc.connectionState === 'failed' || currentPc.connectionState === 'disconnected') {
        scheduleWebRTCReconnect()
      }
    }

    // 处理远程流
    currentPc.ontrack = (e) => {
      if (pc !== currentPc || sessionId !== webrtcSessionId) return
      if (videoElement.value) {
        const videoEl = videoElement.value
        const tryPlayVisible = () => {
          videoEl.play().then(() => {
            hasVisibleVideoFrame.value = true
            visibleLoading.value = false
          }).catch(err => {
            const name = (err as any)?.name || ''
            const message = String((err as any)?.message || '')
            // play() 被后续 load/srcObject 切换中断属于重连过程中的常见瞬态，不触发错误重连
            if (name === 'AbortError' || /interrupted by a new load request/i.test(message)) {
              return
            }
            console.error('[WebRTC播放] ❌ 可见光视频播放失败:', err)
            scheduleWebRTCReconnect()
          })
        }

        // 先绑定事件，再替换 srcObject，避免 metadata 事件先触发导致漏播
        videoEl.onloadedmetadata = () => {
          tryPlayVisible()
        }

        // 新流到来时直接替换 srcObject（重连时旧流已保留最后一帧）
        videoEl.srcObject = e.streams[0]
        hasVisibleVideoFrame.value = true
        visibleLoading.value = false
        clearWebRTCReconnectTimer()
        clearWebRTCStartTimer()
        webrtcReconnecting.value = false  // 隐藏 overlay
        
        // 强制设置WebRTC视频播放器样式
        videoEl.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
        
        // 避免重复 addEventListener 造成错误日志风暴
        videoEl.onerror = () => {
          if (pc !== currentPc || sessionId !== webrtcSessionId) return
          scheduleWebRTCReconnect()
        }

        // 立即尝试一次，覆盖 metadata 事件触发过快或不触发的场景
        tryPlayVisible()

        // 添加超时机制：如果2秒后仍未开始，尝试强制播放
        setTimeout(() => {
          if (!videoEl.srcObject) return
          if (videoEl.paused || videoEl.currentTime === 0) {
            tryPlayVisible()
          }
        }, 2000)
      } else {
        console.error('[WebRTC播放] ❌ videoElement.value 为空')
      }
    }

    // ICE连接状态监听
    currentPc.oniceconnectionstatechange = () => {
      if (pc !== currentPc || sessionId !== webrtcSessionId) return
      if (currentPc.iceConnectionState === 'connected') {
        isPlaying = true
        clearWebRTCReconnectTimer()
        clearWebRTCStartTimer()
        clearVisibleBootstrapRetryTimer()
        visibleBootstrapRetryCount = 0
        webrtcReconnectCount = 0        // 连接成功，重置重连计数
        webrtcReconnecting.value = false // 隐藏 overlay
        startWebRTCFreezeDetection()   // 启动画面冻结检测
      } else if (currentPc.iceConnectionState === 'disconnected') {
        scheduleWebRTCReconnect()      // 网络抖动，调度重连
      } else if (currentPc.iceConnectionState === 'failed') {
        scheduleWebRTCReconnect()      // 连接彻底失败，调度重连
      }
    }

    // 创建offer
    const offer = await currentPc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })
    if (pc !== currentPc || sessionId !== webrtcSessionId) {
      currentPc.close()
      return
    }
    await currentPc.setLocalDescription(offer)

    // 构建SRS API地址
    const apiUrl = buildApiUrl(serverUrl)
    const response = await fetch(`${apiUrl}/rtc/v1/play/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sdp: offer.sdp,
        streamurl: serverUrl
      })
    })

    if (!response.ok) {
      console.error('[WebRTC播放] ❌ SRS 服务器响应错误:', response.status)
      throw new Error(`服务器响应错误: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.code !== 0) {
      throw new Error(`SRS错误: ${data.msg}`)
    }

    // 设置远程描述
    if (pc !== currentPc || sessionId !== webrtcSessionId) {
      currentPc.close()
      return
    }
    await currentPc.setRemoteDescription({
      type: 'answer',
      sdp: data.sdp
    })

  } catch (error) {
    // 连接建立过程中失败，关闭当前 pc 后调度重连（保留最后一帧）
    if (pc && sessionId === webrtcSessionId) {
      pc.close()
      pc = null
    }
    if (sessionId !== webrtcSessionId) {
      return
    }
    isPlaying = false
    visibleLoading.value = false
    clearWebRTCStartTimer()
    scheduleWebRTCReconnect()
  }
}

// 仅关闭连接，不清空 srcObject（重连时调用，保留最后一帧）
const stopWebRTCPlaybackForReconnect = () => {
  webrtcSessionId++
  clearWebRTCStartTimer()
  clearWebRTCFreezeDetection()
  if (pc) { pc.close(); pc = null }
  isPlaying = false
}

// 停止WebRTC播放（完全停止，清空画面）
const stopWebRTCPlayback = () => {
  webrtcSessionId++
  clearWebRTCReconnectTimer()
  clearWebRTCStartTimer()
  clearWebRTCFreezeDetection()
  webrtcReconnecting.value = false

  if (pc) {
    pc.close()
    pc = null
  }

  if (videoElement.value) {
    videoElement.value.srcObject = null
  }

  isPlaying = false
  hasVisibleVideoFrame.value = false
  visibleLoading.value = false
}

// 停止视频播放
const stopVideoPlayback = () => {
  // 清空响应式 URL，确保下次设置相同 URL 时 watch 也能触发
  videoStreamUrl.value = ''
  clearVisibleBootstrapRetryTimer()
  // 停止WebRTC播放
  stopWebRTCPlayback()
  
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.unload()
    videoPlayer.value.detachMediaElement()
    videoPlayer.value.destroy()
    videoPlayer.value = null
  }
  
  if (videoElement.value) {
    videoElement.value.pause()
    videoElement.value.src = ''
    videoElement.value.load()
  }
  hasVisibleVideoFrame.value = false
  visibleLoading.value = false
}

// 重新加载视频
const reloadVideo = () => {
  if (visibleManualReconnectRunning) return
  visibleManualReconnectRunning = true
  webrtcReconnectCount = 0  // 手动重载，重置重连计数
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  const stream = robotId ? getRobotVideoStreamByType(robotId, 'drone_visible') : getVideoStream('drone_visible')
  const streamUrl = stream?.url || videoStreamUrl.value
  if (!streamUrl) {
    visibleManualReconnectRunning = false
    showError('未找到可见光视频流')
    return
  }

  clearWebRTCReconnectTimer()
  clearWebRTCStartTimer()
  clearWebRTCFreezeDetection()
  clearVisibleBootstrapRetryTimer()
  visibleBootstrapRetryCount = 0
  webrtcReconnecting.value = true
  stopWebRTCPlaybackForReconnect()
  videoStreamUrl.value = streamUrl

  nextTick(() => {
    startVideoPlayback()
    visibleManualReconnectRunning = false
  })
}

const initInfraredVideo = () => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  const stream = robotId ? getRobotVideoStreamByType(robotId, 'drone_infrared') : getVideoStream('drone_infrared')
  
  if (stream) {
    infraredLoading.value = true
    infraredStreamUrl.value = stream.url
    infraredError.value = ''
  } else {
    infraredLoading.value = false
    stopInfraredPlayback()
    infraredError.value = '未找到红外视频流'
  }
}

const startInfraredPlayback = (keepFrame = false) => {
  if (!infraredVideoElement.value || !infraredStreamUrl.value) {
    console.warn('[红外视频播放] infraredVideoElement 或 infraredStreamUrl 为空，跳过播放')
    return
  }

  infraredLoading.value = true
  infraredError.value = ''

  if (infraredVideoPlayer.value) {
    infraredVideoPlayer.value.pause()
    infraredVideoPlayer.value.unload()
    infraredVideoPlayer.value.detachMediaElement()
    infraredVideoPlayer.value.destroy()
    infraredVideoPlayer.value = null
  }

  const videoEl = infraredVideoElement.value
  videoEl.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'

  if (infraredStreamUrl.value.startsWith('webrtc://')) {
    startInfraredWebRTCPlayback(keepFrame)
    return
  }

  if (infraredStreamUrl.value.startsWith('rtmp://')) {
    if (flvjs.isSupported()) {
      const flvUrl = infraredStreamUrl.value.replace(/^rtmp:\/\/[^\/]+/, config.api.domain)
      infraredVideoPlayer.value = flvjs.createPlayer({
        type: 'flv',
        url: flvUrl,
        isLive: true,
        hasAudio: false,
        hasVideo: true
      }, {
        enableStashBuffer: false,
        stashInitialSize: 128,
        enableWorker: true,
        lazyLoad: false,
        autoCleanupSourceBuffer: true
      })
      infraredVideoPlayer.value.attachMediaElement(videoEl)
      infraredVideoPlayer.value.load()
      infraredVideoPlayer.value.play().then(() => {
        hasInfraredVideoFrame.value = true
      }).catch(() => {
        hasInfraredVideoFrame.value = false
      }).finally(() => {
        infraredLoading.value = false
      })
    } else {
      infraredError.value = '当前浏览器不支持红外流播放'
      infraredLoading.value = false
    }
    return
  }

  videoEl.src = infraredStreamUrl.value
  videoEl.load()
  videoEl.play().then(() => {
    hasInfraredVideoFrame.value = true
    infraredLoading.value = false
  }).catch(() => {
    hasInfraredVideoFrame.value = false
    infraredError.value = '红外视频加载失败'
    infraredLoading.value = false
  })
}

const startInfraredWebRTCPlayback = async (keepFrame = false) => {
  const serverUrl = infraredStreamUrl.value
  if (!serverUrl || !infraredVideoElement.value) {
    infraredLoading.value = false
    return
  }

  let sessionId = 0
  try {
    // 重连时（keepFrame=true）已由 scheduleInfraredReconnect 内调用 stopInfraredWebRTCPlaybackForReconnect
    // 直接开始即可，不需要再次 stop
    if (!keepFrame) {
      stopInfraredWebRTCPlayback()
    }
    sessionId = ++infraredSessionId
    const currentInfraredPc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })
    infraredPc = currentInfraredPc

    clearInfraredStartTimer()
    infraredStartTimer = setTimeout(() => {
      if (sessionId === infraredSessionId && infraredPc === currentInfraredPc && currentInfraredPc.iceConnectionState !== 'connected') {
        scheduleInfraredReconnect()
      }
    }, WEBRTC_START_TIMEOUT)

    currentInfraredPc.ontrack = (e) => {
      if (infraredPc !== currentInfraredPc || sessionId !== infraredSessionId) return
      if (!infraredVideoElement.value) {
        console.error('[红外视频播放] ❌ infraredVideoElement.value 为空')
        return
      }
      
      // 新流到来，直接替换 srcObject（重连时旧流已保留最后一帧）
      infraredVideoElement.value.srcObject = e.streams[0]
      hasInfraredVideoFrame.value = true
      clearInfraredReconnectTimer()
      clearInfraredStartTimer()
      infraredReconnecting.value = false  // 隐藏 overlay
      infraredVideoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
      
      const videoEl = infraredVideoElement.value
      
      // 等待 loadedmetadata 后播放
      videoEl.onloadedmetadata = () => {
        videoEl.play().then(() => {
          infraredLoading.value = false
        }).catch((err) => {
          console.error('[红外视频播放] ❌ 视频播放失败:', err)
          infraredError.value = '红外视频播放失败'
          infraredLoading.value = false
          scheduleInfraredReconnect()
        })
      }
      
      // 2 秒兜底：若 loadedmetadata 未触发，强制尝试播放
      setTimeout(() => {
        if (!videoEl.srcObject) return
        if (videoEl.readyState === 0) {
          videoEl.play().catch(err => {
            console.error('[红外视频播放] ❌ 兜底播放失败:', err)
            scheduleInfraredReconnect()
          })
        }
        // 无论如何都结束 loading
        infraredLoading.value = false
      }, 2000)
    }

    currentInfraredPc.onconnectionstatechange = () => {
      if (infraredPc !== currentInfraredPc || sessionId !== infraredSessionId) return
      if (currentInfraredPc.connectionState === 'connected') {
        clearInfraredReconnectTimer()
        clearInfraredStartTimer()
      } else if (currentInfraredPc.connectionState === 'failed' || currentInfraredPc.connectionState === 'disconnected') {
        scheduleInfraredReconnect()
      }
    }

    currentInfraredPc.oniceconnectionstatechange = () => {
      if (infraredPc !== currentInfraredPc || sessionId !== infraredSessionId) return
      if (currentInfraredPc.iceConnectionState === 'connected') {
        clearInfraredReconnectTimer()
        clearInfraredStartTimer()
        clearInfraredBootstrapRetryTimer()
        infraredBootstrapRetryCount = 0
        infraredReconnectCount = 0       // 连接成功，重置重连计数
        infraredReconnecting.value = false // 隐藏 overlay
        startInfraredFreezeDetection()   // 启动画面冻结检测
      } else if (currentInfraredPc.iceConnectionState === 'disconnected') {
        scheduleInfraredReconnect()      // 网络抖动，调度重连
      } else if (currentInfraredPc.iceConnectionState === 'failed') {
        scheduleInfraredReconnect()      // 连接彻底失败，调度重连
      }
    }

    const offer = await currentInfraredPc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })
    if (infraredPc !== currentInfraredPc || sessionId !== infraredSessionId) {
      currentInfraredPc.close()
      return
    }
    await currentInfraredPc.setLocalDescription(offer)
    const apiUrl = buildApiUrl(serverUrl)
    const response = await fetch(`${apiUrl}/rtc/v1/play/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sdp: offer.sdp,
        streamurl: serverUrl
      })
    })

    if (!response.ok) {
      throw new Error('WebRTC信令失败')
    }

    const data = await response.json()
    if (data.code !== 0) {
      throw new Error(data.msg || 'WebRTC播放失败')
    }

    if (infraredPc !== currentInfraredPc || sessionId !== infraredSessionId) {
      currentInfraredPc.close()
      return
    }
    await currentInfraredPc.setRemoteDescription({
      type: 'answer',
      sdp: data.sdp
    })
    // loading 由 ontrack 回调负责关闭
  } catch (error) {
    // 连接建立过程中失败，关闭当前 pc 后调度重连（保留最后一帧）
    if (infraredPc && sessionId === infraredSessionId) { infraredPc.close(); infraredPc = null }
    if (sessionId !== infraredSessionId) {
      return
    }
    infraredLoading.value = false
    clearInfraredStartTimer()
    scheduleInfraredReconnect()
  }
}

// 仅关闭连接，不清空 srcObject（重连时调用，保留最后一帧）
const stopInfraredWebRTCPlaybackForReconnect = () => {
  infraredSessionId++
  clearInfraredStartTimer()
  clearInfraredFreezeDetection()
  if (infraredPc) { infraredPc.close(); infraredPc = null }
}

const stopInfraredWebRTCPlayback = () => {
  infraredSessionId++
  clearInfraredReconnectTimer()
  clearInfraredStartTimer()
  clearInfraredFreezeDetection()
  infraredReconnecting.value = false

  if (infraredPc) {
    infraredPc.close()
    infraredPc = null
  }
  // 清除 srcObject，确保下次重新挂载新流
  if (infraredVideoElement.value) {
    infraredVideoElement.value.srcObject = null
  }
  hasInfraredVideoFrame.value = false
  infraredLoading.value = false
}

const stopInfraredPlayback = () => {
  // 清空响应式 URL，确保下次赋相同 URL 时 watch 也能触发
  infraredStreamUrl.value = ''
  clearInfraredBootstrapRetryTimer()
  stopInfraredWebRTCPlayback()
  if (infraredVideoPlayer.value) {
    infraredVideoPlayer.value.pause()
    infraredVideoPlayer.value.unload()
    infraredVideoPlayer.value.detachMediaElement()
    infraredVideoPlayer.value.destroy()
    infraredVideoPlayer.value = null
  }
  if (infraredVideoElement.value) {
    infraredVideoElement.value.pause()
    infraredVideoElement.value.src = ''
    infraredVideoElement.value.load()
  }
  hasInfraredVideoFrame.value = false
}

const reloadInfraredStream = () => {
  if (infraredManualReconnectRunning) return
  infraredManualReconnectRunning = true
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  const stream = robotId ? getRobotVideoStreamByType(robotId, 'drone_infrared') : getVideoStream('drone_infrared')
  if (!stream) {
    infraredError.value = '未找到红外视频流'
    infraredManualReconnectRunning = false
    return
  }
  infraredReconnectCount = 0  // 手动重载，重置重连计数
  clearInfraredReconnectTimer()
  clearInfraredStartTimer()
  clearInfraredFreezeDetection()
  clearInfraredBootstrapRetryTimer()
  infraredBootstrapRetryCount = 0
  infraredReconnecting.value = true
  stopInfraredWebRTCPlaybackForReconnect()
  infraredStreamUrl.value = stream.url
  nextTick(() => {
    startInfraredPlayback(true)
    infraredManualReconnectRunning = false
  })
}

const handleManualReconnect = (type: 'visible' | 'infrared') => {
  if (type === 'visible') {
    reloadVideo()
    return
  }
  reloadInfraredStream()
}

const isStreamSwitching = ref({ visible: false, infrared: false })

const getPanelVideoStream = (panel: 'visible' | 'infrared'): VideoStream | null => {
  const streamType: VideoStream['type'] = panel === 'visible' ? 'drone_visible' : 'drone_infrared'
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (robotId) {
    return getRobotVideoStreamByType(robotId, streamType)
  }
  return getVideoStream(streamType)
}

const hasSubStreamFromCameraCache = (stream: VideoStream): boolean => {
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return false
  try {
    const raw = localStorage.getItem(getRobotCameraListCacheKey(robotId))
    if (!raw) return false
    const cameras = JSON.parse(raw) as CameraInfo[]
    const camera = cameras.find(item => String(item.CamKey) === String(stream.camera_index))
    return !!(camera?.MainUrl && camera?.SubUrl)
  } catch {
    return false
  }
}

const canSwitchVideoStream = (panel: 'visible' | 'infrared') => {
  const stream = getPanelVideoStream(panel)
  if (!stream) return false
  const fromStream = (stream.switchable_video_types?.length ?? 0) > 0
  return !!stream.camera_index && (fromStream || hasSubStreamFromCameraCache(stream))
}

const getVideoStreamModeLabel = (panel: 'visible' | 'infrared') => {
  const stream = getPanelVideoStream(panel)
  return stream?.use_sub_stream ? '子' : '主'
}

const handleToggleVideoStream = async (panel: 'visible' | 'infrared') => {
  const stream = getPanelVideoStream(panel)
  if (!stream) {
    showError('未找到视频流缓存信息')
    return
  }
  if (!canSwitchVideoStream(panel)) {
    showError('当前视频不支持主/子码流切换')
    return
  }

  const key = panel === 'visible' ? 'visible' : 'infrared'
  if (isStreamSwitching.value[key]) return
  isStreamSwitching.value[key] = true

  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) {
    isStreamSwitching.value[key] = false
    showError('未选择机器人，无法切换码流')
    return
  }
  const nextUseSubStream = !(stream.use_sub_stream === true)

  try {
    // 按后端要求先 stop 再 start，避免沿用旧会话导致切流不生效
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

    if (robotId) {
      const streams = getRobotVideoStreams(robotId)
      const updated = streams.map(item =>
        item.type === updatedStream.type ? { ...item, ...updatedStream } : item
      )
      setRobotVideoStreams(robotId, updated)
    } else {
      const streams = getVideoStreams()
      const updated = streams.map(item =>
        item.type === updatedStream.type ? { ...item, ...updatedStream } : item
      )
      setVideoStreams(updated)
    }

    if (panel === 'visible') {
      stopVideoPlayback()
      await nextTick()
      videoStreamUrl.value = response.stream_url
    } else {
      stopInfraredPlayback()
      await nextTick()
      infraredStreamUrl.value = response.stream_url
    }
    showSuccess(`已切换到${nextUseSubStream ? '子码流' : '主码流'}`)
  } catch (error) {
    showError(`码流切换失败: ${parseErrorMessage(error)}`)
  } finally {
    isStreamSwitching.value[key] = false
  }
}

const toggleVideoPanelFullscreen = async (type: 'visible' | 'infrared') => {
  const panel = type === 'visible' ? visibleVideoWrapper.value : infraredVideoWrapper.value
  if (!panel) return
  try {
    if (document.fullscreenElement === panel) {
      await document.exitFullscreen()
      return
    }
    await panel.requestFullscreen()
  } catch (error) {
    console.error('视频面板全屏切换失败:', error)
  }
}

// 航线选择相关
const selectedWayline = ref('')
const selectedMultiTask = ref('')
const mapList = ref<string[]>([])
let mapListRequestToken = 0
const mapListRequestInFlight = new Map<string, Promise<any>>()
const getCurrentRobotMapKeys = () => {
  const robotId = deviceStore.selectedRobotId || ''
  return robotId ? getRobotMapCacheKeys(robotId) : null
}
const getCurrentRobotContextKeys = () => {
  const robotId = deviceStore.selectedRobotId || ''
  return robotId ? getRobotContextCacheKeys(robotId) : null
}
const getRobotCameraListCacheKey = (robotId: string) => `camera_list_${robotId}`
const getRobotVideoStreamsCacheKey = (robotId: string) => `video_streams_${robotId}`
const getRobotDefaultVideoTypeKey = (robotId: string) => `default_video_type_${robotId}`
const getRobotVideoStreams = (robotId: string): VideoStream[] => {
  try {
    const cached = localStorage.getItem(getRobotVideoStreamsCacheKey(robotId))
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {}
  return getVideoStreams()
}
const getRobotVideoStreamByType = (robotId: string, type: VideoStream['type']): VideoStream | null => {
  const streams = getRobotVideoStreams(robotId)
  return streams.find(stream => stream.type === type) || null
}
const hasCameraStreamUrl = (robotId: string, type: 'drone_visible' | 'drone_infrared') => {
  const stream = getRobotVideoStreamByType(robotId, type)
  return Boolean(stream?.url)
}
const hasBothCameraStreamUrls = (robotId: string) =>
  hasCameraStreamUrl(robotId, 'drone_visible') && hasCameraStreamUrl(robotId, 'drone_infrared')
const setRobotVideoStreams = (robotId: string, streams: VideoStream[]) => {
  localStorage.setItem(getRobotVideoStreamsCacheKey(robotId), JSON.stringify(streams))
  setVideoStreams(streams)
}
const getRobotDefaultVideoType = (robotId: string): VideoStream['type'] | null => {
  return localStorage.getItem(getRobotDefaultVideoTypeKey(robotId)) as VideoStream['type'] | null
}
const setRobotDefaultVideoType = (robotId: string, type: VideoStream['type']) => {
  localStorage.setItem(getRobotDefaultVideoTypeKey(robotId), type)
  localStorage.setItem('default_video_type', type)
}
const persistSelectedMapForCurrentRobot = (mapName: string) => {
  const keys = getCurrentRobotMapKeys()
  if (keys) {
    localStorage.setItem(keys.selectedMapKey, mapName)
  }
}
// selectedMap 由 taskExecutionStore 全局驱动，实现多页面同步
const selectedMap = computed({
  get: () => taskExecutionStore.selectedMapName,
  set: (v: string) => {
    taskExecutionStore.setSelectedMapName(v)
    persistSelectedMapForCurrentRobot(v)
  }
})
const showWaylineDropdown = ref(false)

// 当前活动任务类型：'wayline' | 'point' | 'multi' | null
const activeTaskType = ref<'wayline' | 'point' | 'multi' | 'track' | null>(null)
// 当前运行中的循迹任务参数（取消时需要）
const activeTrackInfo = ref({ track_name: '', taskpoint_name: '' })

// 确认对话框状态
const confirmDialog = ref({
  visible: false,
  message: '',
  onConfirm: null as (() => void) | null
})

// 显示确认对话框
const showConfirmDialog = (message: string, onConfirm: () => void) => {
  confirmDialog.value = {
    visible: true,
    message,
    onConfirm
  }
}

// 确认对话框 - 确定
const onConfirmOk = () => {
  if (confirmDialog.value.onConfirm) {
    confirmDialog.value.onConfirm()
  }
  confirmDialog.value.visible = false
}

// 确认对话框 - 取消
const onConfirmCancel = () => {
  confirmDialog.value.visible = false
}

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
    enable_vision: false,
    vision_algorithms: [] as number[],
    vision_threshold: 0.5,
    // 周期任务相关
    enable_recurrence: false,
    recurrence_start_date: '' as string,
    recurrence_end_date: '' as string
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

// 多任务组启动弹窗
const multiTaskStartDialog = ref({
  visible: false,
  form: {
    group_name: '',
    exception_start: false
  }
})

// 发布点任务启动弹窗
const pointTaskStartDialog = ref({
  visible: false,
  form: {
    task_id: '',
    task_name: '',
    circle: false,
    recover: false
  }
})

// 关键点文件列表（用于循迹任务启动弹窗）
const taskpointList = ref<string[]>([])
let taskpointRequestToken = 0

// 获取关键点文件列表
const fetchTaskpointList = async (trackName: string) => {
  if (!trackName) {
    taskpointList.value = []
    trackStartDialog.value.form.taskpoint_name = ''
    return
  }

  const robotId = deviceStore.selectedRobotId
  if (!robotId) {
    taskpointList.value = []
    trackStartDialog.value.form.taskpoint_name = ''
    return
  }

  const requestToken = ++taskpointRequestToken
  const normalizedTrack = normalizeTrackName(trackName)

  try {
    const response = await navigationApi.getTaskpointList(robotId, normalizedTrack)
    if (requestToken !== taskpointRequestToken || robotId !== deviceStore.selectedRobotId) {
      return
    }
    const groups = Array.isArray(response?.msg?.result) ? response.msg.result : []
    const normalizedGroups = Array.from(
      new Set(
        groups
          .map((group: string) => normalizeTaskPointName(String(group || '')))
          .filter(Boolean)
      )
    )
    taskpointList.value = normalizedGroups
  } catch (err) {
    if (requestToken !== taskpointRequestToken || robotId !== deviceStore.selectedRobotId) {
      return
    }
    console.error('[任务组列表] 获取失败:', err)
    taskpointList.value = []
  }

  trackStartDialog.value.form.taskpoint_name = taskpointList.value.length > 0 ? taskpointList.value[0] : ''
}

// 获取航线文件列表
const loadWaylineFiles = async () => {
  const workspaceId = getCachedWorkspaceId()
  if (!workspaceId) return
  
  try {
    await fetchWaylineFiles(workspaceId, {
      page: 1,
      page_size: 100
    })
    // 默认选择第一条数据
    if (waylineFiles.value && waylineFiles.value.length > 0) {
      const firstId = waylineFiles.value[0].wayline_id
      if (!selectedWayline.value) {
        selectedWayline.value = firstId
      }
    }
  } catch (err) {
    // 静默处理错误
  }
}

const resolvePointTaskCurrentIndex = (taskName: string, totalCount: number) => {
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

const overlayPointTaskWaypoints = async (taskId: string, taskName?: string) => {
  if (!taskId || basePointCloudData.value.length === 0) return

  const targetTask = pointTaskList.value.find(task => String(task.task_id) === String(taskId))
  if (!targetTask) return

  const taskContent = Array.isArray(targetTask.taskcontent) ? targetTask.taskcontent : []
  if (taskContent.length === 0) {
    pointCloudData.value = [...basePointCloudData.value]
    return
  }

  const currentTaskIndex = resolvePointTaskCurrentIndex(taskName || targetTask.task_name, taskContent.length)
  const overlayKey = `${String(taskId)}::${currentTaskIndex}`
  if (
    lastPointTaskOverlayKey.value === overlayKey &&
    pointCloudData.value.length > basePointCloudData.value.length
  ) {
    return
  }
  const { centerX, centerY, centerZ, maxRange } = pointCloudNormalizationParams.value
  if (!maxRange || !Number.isFinite(maxRange)) return

  const normalizedTaskPoints: PointCloudPoint[] = []
  taskContent.forEach((task: any, idx: number) => {
    const tx = parseFloat(task?.x)
    const ty = parseFloat(task?.y)
    const tz = parseFloat(task?.z ?? '0')
    if (!Number.isFinite(tx) || !Number.isFinite(ty) || !Number.isFinite(tz)) return

    const isCurrent = idx === currentTaskIndex
    normalizedTaskPoints.push({
      x: (tx - centerX) / maxRange,
      y: (ty - centerY) / maxRange,
      z: (tz - centerZ) / maxRange,
      intensity: isCurrent ? 2.2 : 1.8,
      name: isCurrent
        ? `当前任务点${idx + 1}`
        : (task?.type_text || task?.preset || `任务点${idx + 1}`)
    })
  })

  pointCloudData.value = [
    ...basePointCloudData.value,
    ...normalizedTaskPoints
  ]
  lastPointTaskOverlayKey.value = overlayKey
}

// 地图文件缓存 - 使用 IndexedDB 存储大文件
const MAP_DB_NAME = 'MapFilesDB'
const MAP_STORE_NAME = 'mapFiles'

// 打开地图文件数据库
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

// 保存地图文件
const saveMapFile = async (mapName: string, fileName: string, blob: Blob): Promise<void> => {
  const db = await openMapDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MAP_STORE_NAME], 'readwrite')
    const store = tx.objectStore(MAP_STORE_NAME)
    const key = buildMapCacheKey(mapName, fileName)
    store.put({ id: key, blob })
    tx.oncomplete = () => {
      resolve()
    }
    tx.onerror = () => {
      console.error(`[地图缓存] ❌ 文件保存失败: ${key}`, tx.error)
      reject(tx.error)
    }
  })
}

// 获取地图文件
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
      request.onerror = () => {
        console.error(`[地图缓存] 读取文件失败: ${normalizedKey}`, request.error)
        resolve(null)
      }
    })
  } catch (err) {
    console.error('[地图缓存] openMapDB 失败:', err)
    return null
  }
}

/**
 * 地图配置文件管理
 * 配置存储在 localStorage 中，格式为：
 * {
 *   "地图名称": "更新时间",
 *   "abc": "20260121103000",
 *   "def": "20260120150000"
 * }
 */
const MAP_CONFIG_KEY = 'map_config'
const mapDownloadTasks = new Map<string, Promise<void>>()

// 读取地图配置
const getMapConfig = (): Record<string, string> => {
  return JSON.parse(localStorage.getItem(MAP_CONFIG_KEY) || '{}')
}

// 保存地图配置
const saveMapConfig = (config: Record<string, string>): void => {
  localStorage.setItem(MAP_CONFIG_KEY, JSON.stringify(config))
}

// 更新单个地图的配置
const updateMapConfig = (mapName: string, updateTime: string): void => {
  const config = getMapConfig()
  config[mapName] = updateTime
  saveMapConfig(config)
}

// 检查地图是否需要下载（比对配置文件中的更新时间）
const shouldDownloadMap = async (mapName: string, serverUpdateTime: string): Promise<boolean> => {
  const config = getMapConfig()
  const localUpdateTime = config[mapName]
  
  // 配置中没有该地图，需要下载
  if (!localUpdateTime) {
    return true
  }
  
  // 更新时间不一致，需要重新下载
  if (localUpdateTime !== serverUpdateTime) {
    return true
  }
  
  // 即使配置显示是最新的，也要检查 IndexedDB 中文件是否真实存在
  try {
    const blob = await getMapFile(mapName, 'tinyMap.pcd')
    if (!blob) {
      return true
    }
  } catch (err) {
    console.error('检查地图文件存在性失败:', err)
    return true
  }
  
  return false
}

// 下载地图文件
const downloadMapFiles = async (mapName: string, updateTime: string) => {
  const robotId = deviceStore.selectedRobotId || 'unknown'
  const taskKey = `${robotId}:${mapName}:${updateTime}`
  const existingTask = mapDownloadTasks.get(taskKey)
  if (existingTask) {
    await existingTask
    return
  }

  const task = (async () => {
    if (!(await shouldDownloadMap(mapName, updateTime))) {
      return
    }
    if (!robotId || robotId === 'unknown') {
      console.warn('[地图缓存] 未选择机器人，无法下载地图')
      return
    }
    const files = await mapFileApi.downloadAllMapFiles(robotId, mapName)
    
    // 保存文件到 IndexedDB
    let savedCount = 0
    for (const [fileName, blob] of files) {
      try {
        await saveMapFile(mapName, fileName, blob)
        savedCount++
      } catch (err) {
        console.error(`[地图缓存] 保存文件失败: ${fileName}`, err)
      }
    }
    const requiredMapFiles = ['tinyMap.pcd', 'gridMap.pgm', 'gridMap.yaml', 'gnss_origin.txt']
    const hasRequiredMapFiles = requiredMapFiles.every(fileName => files.has(fileName))

    if (hasRequiredMapFiles) {
      updateMapConfig(mapName, updateTime)
    }
  })()

  mapDownloadTasks.set(taskKey, task)

  try {
    await task
  } finally {
    if (mapDownloadTasks.get(taskKey) === task) {
      mapDownloadTasks.delete(taskKey)
    }
  }
}

// 获取地图文件 URL（用于渲染）
const getMapFileUrl = async (mapName: string, fileName: string): Promise<string | null> => {
  const blob = await getMapFile(mapName, fileName)
  return blob ? URL.createObjectURL(blob) : null
}

// 地图更新时间映射（运行时使用，key: 地图名, value: 更新时间）
const mapUpdateTimeMap = ref<Record<string, string>>({})

const applyMapListCache = (rawList: string[], robotId?: string) => {
  const parsedMapList: string[] = []
  const parsedUpdateTimeMap: Record<string, string> = {}

  rawList.forEach((item: string) => {
    const value = String(item || '').trim()
    if (!value) return

    const atIndex = value.indexOf('@')
    if (atIndex !== -1) {
      const mapName = value.substring(0, atIndex)
      const updateTime = value.substring(atIndex + 1)
      if (mapName) {
        parsedMapList.push(mapName)
        parsedUpdateTimeMap[mapName] = updateTime
      }
      return
    }

    parsedMapList.push(value)
    parsedUpdateTimeMap[value] = ''
  })

  mapList.value = parsedMapList
  mapUpdateTimeMap.value = parsedUpdateTimeMap
  const keys = robotId ? getRobotMapCacheKeys(robotId) : getCurrentRobotMapKeys()
  if (keys) {
    localStorage.setItem(keys.mapListKey, JSON.stringify(parsedMapList))
    localStorage.setItem(keys.mapUpdateTimeKey, JSON.stringify(parsedUpdateTimeMap))
  }
  localStorage.setItem('cached_map_list', JSON.stringify(parsedMapList))
  localStorage.setItem('cached_map_update_time_map', JSON.stringify(parsedUpdateTimeMap))
}

const ensureDefaultMapSelection = () => {
  // 导航进行中由 cmd_status.map_name 驱动，不在这里覆盖
  if (robotStore.cmdStatus?.nav === 1) return

  const current = taskExecutionStore.selectedMapName
  if (mapList.value.length === 0) {
    if (current) {
      taskExecutionStore.setSelectedMapName('')
      const keys = getCurrentRobotMapKeys()
      if (keys) {
        localStorage.removeItem(keys.selectedMapKey)
      }
      localStorage.removeItem('selected_map_name')
    }
    return
  }

  if (!current || !mapList.value.includes(current)) {
    selectedMap.value = mapList.value[0]
  }
}

// 获取地图列表
const fetchMapList = async (targetRobotId?: string) => {
  const robotId = targetRobotId || deviceStore.selectedRobotId
  if (!robotId) {
    mapList.value = []
    mapUpdateTimeMap.value = {}
    return
  }

  const requestToken = ++mapListRequestToken
  const keys = getRobotMapCacheKeys(robotId)
  const cached = keys ? localStorage.getItem(keys.mapListKey) : null
  const cachedTimeMap = keys ? localStorage.getItem(keys.mapUpdateTimeKey) : null

  if (requestToken !== mapListRequestToken || robotId !== deviceStore.selectedRobotId) {
    return
  }

  mapList.value = cached ? JSON.parse(cached) : []
  mapUpdateTimeMap.value = cachedTimeMap ? JSON.parse(cachedTimeMap) : {}

  if (mapList.value.length === 0) {
    let requestPromise = mapListRequestInFlight.get(robotId)
    if (!requestPromise) {
      requestPromise = navigationApi.getMapList(robotId)
      mapListRequestInFlight.set(robotId, requestPromise)
    }

    try {
      const response = await requestPromise
      if (requestToken !== mapListRequestToken || robotId !== deviceStore.selectedRobotId) {
        return
      }
      const rawList = Array.isArray(response?.msg?.result) ? response.msg.result : []
      applyMapListCache(rawList, robotId)
    } catch (err) {
      if (requestToken !== mapListRequestToken || robotId !== deviceStore.selectedRobotId) {
        return
      }
      console.error('[地图列表] 获取地图列表失败:', err)
    } finally {
      if (mapListRequestInFlight.get(robotId) === requestPromise) {
        mapListRequestInFlight.delete(robotId)
      }
    }
  }

  const cachedMapName =
    (keys ? localStorage.getItem(keys.selectedMapKey) : null)
  if (cachedMapName && mapList.value.includes(cachedMapName)) {
    taskExecutionStore.setSelectedMapName(cachedMapName)
    persistSelectedMapForCurrentRobot(cachedMapName)
  }
  ensureDefaultMapSelection()
}

watch(mapList, () => {
  ensureDefaultMapSelection()
})

// 循迹任务列表
const trackList = ref<string[]>([])
const selectedTrack = ref('')
const trajectoryDownloadInFlight = ref(false)
const pendingRunningTrackName = ref('')
const trackListForceRefreshInFlight = ref(false)
let lastTrackListForceRefreshAt = 0
const TRACK_LIST_FORCE_REFRESH_INTERVAL_MS = 3000

const syncSelectedMapTrajectoryFiles = async (mapName: string) => {
  if (!mapName) return
  if (trajectoryDownloadInFlight.value) return
  if (trackList.value.length === 0) return

  const relatedTracks = trackList.value.filter(track => track.startsWith(mapName + '_'))
  if (relatedTracks.length === 0) return
  const robotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
  if (!robotId) return

  trajectoryDownloadInFlight.value = true
  try {
    await downloadAllTrajectoryFiles(robotId, relatedTracks)
  } finally {
    trajectoryDownloadInFlight.value = false
  }
}

const applyPendingRunningTrackName = () => {
  const pendingName = normalizeTrackName(pendingRunningTrackName.value || '')
  if (!pendingName) return false
  const matched = filteredTrackList.value.find(item => normalizeTrackName(item) === pendingName)
  if (!matched) return false
  selectedTrack.value = matched
  pendingRunningTrackName.value = ''
  return true
}

const fetchTrackList = async (forceRefresh = false) => {
  const contextKeys = getCurrentRobotContextKeys()
  const robotId = deviceStore.selectedRobotId
  if (forceRefresh && robotId) {
    const now = Date.now()
    if (trackListForceRefreshInFlight.value) return
    if (now - lastTrackListForceRefreshAt < TRACK_LIST_FORCE_REFRESH_INTERVAL_MS) return
    trackListForceRefreshInFlight.value = true
    try {
      const response = await navigationApi.getTrackList(robotId)
      const remoteList = Array.isArray(response?.msg?.result) ? response.msg.result : []
      trackList.value = remoteList
      if (contextKeys) {
        localStorage.setItem(contextKeys.trackListKey, JSON.stringify(trackList.value))
      }
      localStorage.setItem('cached_track_list', JSON.stringify(trackList.value))
      lastTrackListForceRefreshAt = Date.now()
      return
    } catch (error) {
      console.warn('[循迹列表] 强制刷新失败，回退缓存:', error)
    } finally {
      trackListForceRefreshInFlight.value = false
    }
  }

  const cached = contextKeys ? localStorage.getItem(contextKeys.trackListKey) : null
  if (cached) {
    trackList.value = JSON.parse(cached)
    return
  }

  // 兜底：从 all_track_task_list 推导轨迹列表
  const cachedTaskListRaw = contextKeys ? localStorage.getItem(contextKeys.allTrackTaskListKey) : null
  if (cachedTaskListRaw) {
    try {
      const allTaskList = extractTrackTaskList(JSON.parse(cachedTaskListRaw))
      const trackSet = new Set<string>()
      allTaskList.forEach((task: any) => {
        const trackName = String(task.track_name || '').trim()
        if (trackName) trackSet.add(trackName)
      })
      trackList.value = Array.from(trackSet)
    } catch (err) {
      console.warn('[循迹缓存] 从 all_track_task_list 推导失败:', err)
      trackList.value = []
    }
  } else {
    trackList.value = []
  }
}

// 过滤后的循迹任务列表
const filteredTrackList = computed(() => {
  if (!selectedMap.value) return []
  return trackList.value
    .filter(track => track.startsWith(selectedMap.value + '_'))
    .map(track => {
      const atIndex = track.indexOf('@')
      return atIndex > -1 ? track.substring(0, atIndex) : track
    })
})

// 监听地图变化，重置选中的循迹任务并下载地图文件
watch(selectedMap, async (newMapName) => {
  // store setter 已写入 localStorage，无需再重复写入
  selectedTrack.value = ''
  // 自动选择第一个
  if (filteredTrackList.value.length > 0) {
    selectedTrack.value = filteredTrackList.value[0]
  }

  // 切换地图时检查并下载地图文件和所有轨迹文件
  if (newMapName) {
    clearPointCloud()
    pointCloudError.value = ''
    pointCloudLoadingText.value = '地图文件下载中...'
    pointCloudLoading.value = true
    try {
      // 获取该地图的更新时间
      const updateTime = mapUpdateTimeMap.value[newMapName] || ''
      await downloadMapFiles(newMapName, updateTime)

      // 下载所有轨迹文件（带更新时间校验）
      await syncSelectedMapTrajectoryFiles(newMapName)

      // 地图文件和轨迹文件下载/验证完成后，刷新点云图
      await refreshPointCloud()
    } catch (err) {
      // 下载失败也尝试刷新点云图（可能使用缓存）
      await refreshPointCloud()
    }
  } else {
    clearPointCloud()
    pointCloudLoading.value = false
    pointCloudLoadingText.value = '点云加载中...'
  }
})

// 监听 filteredTrackList 变化，确保有数据时自动选择第一个
// 循迹进行中时由 WebSocket 数据驱动，不强制覆盖
watch(filteredTrackList, (newList) => {
  if (applyPendingRunningTrackName()) return
  if (robotStore.isTracking) return
  if (newList.length > 0 && !newList.includes(selectedTrack.value)) {
    selectedTrack.value = newList[0]
  }
})

// 地图先到、轨迹后到时，补偿触发一次轨迹文件下载
watch(trackList, async (newList, oldList) => {
  if (!selectedMap.value) return
  if (newList.length === 0) return
  if (oldList.length > 0) return
  await syncSelectedMapTrajectoryFiles(selectedMap.value)
})

// 发布点任务列表
interface PointTask {
  isStart: boolean
  task_id: string
  task_name: string
  taskcontent: any[]
}

const pointTaskList = ref<PointTask[]>([])
const selectedPointTask = ref('')
let pointTaskRequestToken = 0
const pendingRunningPointTaskName = ref('')

const applyPendingRunningPointTaskName = () => {
  const pendingName = String(pendingRunningPointTaskName.value || '').trim()
  if (!pendingName) return false
  const matched = filteredPointTaskList.value.find(t => String(t.task_name || '').trim() === pendingName)
  if (!matched) return false
  selectedPointTask.value = matched.task_id
  activeOverlayPointTaskId.value = matched.task_id
  void overlayPointTaskWaypoints(matched.task_id, matched.task_name)
  pendingRunningPointTaskName.value = ''
  return true
}

const fetchPointTaskList = async (forceRefresh = false) => {
  // 优先读缓存（robotBootstrap 切换机器人后已预填充）
  const contextKeys = getCurrentRobotContextKeys()
  const cached = !forceRefresh && contextKeys ? localStorage.getItem(contextKeys.pointTaskListKey) : null
  if (cached) {
    try {
      const list = JSON.parse(cached)
      pointTaskList.value = list.map((task: any) => ({
        ...task,
        task_id: String(task.task_id)
      }))
      return
    } catch (_) {}
  }

  // 缓存为空时才直接请求接口
  const robotId = deviceStore.selectedRobotId
  if (!robotId) return
  const requestToken = ++pointTaskRequestToken
  try {
    const response = await navigationApi.getPointTaskList(robotId)
    if (requestToken !== pointTaskRequestToken || robotId !== deviceStore.selectedRobotId) {
      return
    }
    if (response && response.data) {
      pointTaskList.value = response.data.map((task: any) => ({
        ...task,
        task_id: String(task.task_id)
      }))
      if (contextKeys) {
        localStorage.setItem(contextKeys.pointTaskListKey, JSON.stringify(pointTaskList.value))
      }
      localStorage.setItem('cached_point_task_list', JSON.stringify(pointTaskList.value))
    }
  } catch (error) {
    if (requestToken !== pointTaskRequestToken || robotId !== deviceStore.selectedRobotId) {
      return
    }
    pointTaskList.value = []
  }
}

// 过滤后的发布点任务列表（根据当前地图筛选）
const filteredPointTaskList = computed(() => {
  if (!selectedMap.value) return []
  
  // 根据地图名称筛选：task_name 以 "地图名称_" 开头
  return pointTaskList.value.filter(task => {
    return task.task_name.startsWith(selectedMap.value + '_')
  })
})

// 监听筛选后的发布点任务列表变化，自动选择第一个
watch(filteredPointTaskList, (newList) => {
  if (applyPendingRunningPointTaskName()) return
  if (newList.length > 0) {
    selectedPointTask.value = newList[0].task_id
  } else {
    selectedPointTask.value = ''
  }
}, { immediate: true })

// task_status.task_name 同步发布点任务下拉，并叠加发布点到点云
watch(() => robotStore.taskStatus, (ts) => {
  if (!ts?.is_running || !ts.task_name) {
    activeOverlayPointTaskId.value = ''
    lastPointTaskOverlayKey.value = ''
    if (!robotStore.isTracking && basePointCloudData.value.length > 0) {
      pointCloudData.value = basePointCloudData.value
    }
    return
  }
  if (!selectedMap.value) {
    selectedPointTask.value = ''
    return
  }
  pendingRunningPointTaskName.value = String(ts.task_name || '').trim()
  if (applyPendingRunningPointTaskName()) return
  void fetchPointTaskList(true)
}, { deep: true })

watch(() => selectedPointTask.value, (taskId) => {
  if (!robotStore.isPointTaskRunning || !taskId) return
  const matched = pointTaskList.value.find(task => String(task.task_id) === String(taskId))
  if (!matched) return
  activeOverlayPointTaskId.value = matched.task_id
  overlayPointTaskWaypoints(matched.task_id, matched.task_name)
})

// 多任务组列表
interface MultiTask {
  multitask_id: string
  multitask_name: string
  multitask_list: any[]
}

const multiTaskList = ref<MultiTask[]>([])
let multiTaskRequestToken = 0
const pendingRunningMultiTaskName = ref('')
const lastHandledRunningMultiTaskName = ref('')
const wasHomeMultiTaskRunning = ref(false)

const getHomeRunningMultiTaskGroupName = () => {
  const status = robotStore.multitaskStatus
  const groupName = String(status?.current_group_name || '').trim()
  if (groupName) return groupName
  return String(status?.current_task_name || '').trim()
}

const applyPendingHomeRunningMultiTaskName = () => {
  const runningName = String(pendingRunningMultiTaskName.value || '').trim()
  if (!runningName) return false
  const matched = multiTaskList.value.find(item =>
    String(item.multitask_name || '').trim() === runningName ||
    String(item.multitask_id || '').trim() === runningName
  )
  if (!matched) return false
  if (selectedMultiTask.value !== matched.multitask_id) {
    selectedMultiTask.value = matched.multitask_id
  }
  pendingRunningMultiTaskName.value = ''
  return true
}

const fetchMultiTaskList = async (forceRefresh = false) => {
  // 优先读缓存（robotBootstrap 切换机器人后已预填充）
  const contextKeys = getCurrentRobotContextKeys()
  const cached = !forceRefresh && contextKeys ? localStorage.getItem(contextKeys.multiTaskListKey) : null
  if (cached) {
    try {
      multiTaskList.value = JSON.parse(cached)
      applyPendingHomeRunningMultiTaskName()
      return
    } catch (_) {}
  }

  // 缓存为空时才直接请求接口
  const robotId = deviceStore.selectedRobotId
  if (!robotId) return
  const requestToken = ++multiTaskRequestToken
  try {
    const response = await navigationApi.getMultiTaskList(robotId)
    if (requestToken !== multiTaskRequestToken || robotId !== deviceStore.selectedRobotId) {
      return
    }
    if (response && response.msg) {
      multiTaskList.value = response.msg
      if (contextKeys) {
        localStorage.setItem(contextKeys.multiTaskListKey, JSON.stringify(multiTaskList.value))
      }
      localStorage.setItem('cached_multi_task_list', JSON.stringify(multiTaskList.value))
    }
  } catch (error) {
    if (requestToken !== multiTaskRequestToken || robotId !== deviceStore.selectedRobotId) {
      return
    }
    multiTaskList.value = []
  }
}

// 监听 multiTaskList 变化，确保有数据时自动选择第一个
watch(multiTaskList, (newList) => {
  if (newList.length === 0) {
    selectedMultiTask.value = ''
    return
  }

  if (applyPendingHomeRunningMultiTaskName()) {
    return
  }

  const hasCurrentSelection = newList.some(item => item.multitask_id === selectedMultiTask.value)
  if (!hasCurrentSelection) {
    selectedMultiTask.value = newList[0].multitask_id
  }
})

watch(
  () => ({
    running: robotStore.multitaskStatus?.status === true,
    runningName: getHomeRunningMultiTaskGroupName()
  }),
  ({ running, runningName }) => {
    if (!running || !runningName) {
      if (!running && wasHomeMultiTaskRunning.value && multiTaskList.value.length > 0) {
        selectedMultiTask.value = multiTaskList.value[0].multitask_id
      }
      wasHomeMultiTaskRunning.value = false
      pendingRunningMultiTaskName.value = ''
      if (!running) {
        lastHandledRunningMultiTaskName.value = ''
      }
      return
    }
    wasHomeMultiTaskRunning.value = true
    // WebSocket 会频繁推送 multitask_status，避免同一任务名重复刷列表。
    if (lastHandledRunningMultiTaskName.value === runningName) {
      return
    }
    lastHandledRunningMultiTaskName.value = runningName
    pendingRunningMultiTaskName.value = runningName
    // 先刷新列表，再按名称匹配选中
    void fetchMultiTaskList(true)
  },
  { immediate: true }
)

// 获取当前选中的航线名称
const getCurrentWaylineName = computed(() => {
  const currentWayline = waylineFiles.value.find(f => f.wayline_id === selectedWayline.value)
  return currentWayline ? currentWayline.name : '请选择'
})

const dispatchWaylineTask = (waylineId: string, taskLabel: string) => {
  const currentWayline = waylineFiles.value.find(f => f.wayline_id === waylineId)
  if (!currentWayline) {
    alert(`请先选择一个${taskLabel}`)
    return
  }

  const deviceSns = getCachedDeviceSns()
  if (!deviceSns.dockSns || deviceSns.dockSns.length === 0) {
    alert('未找到可用的设备')
    return
  }

  const currentBatteryPercent = typeof droneStatus.value?.batteryPercent === 'number' 
    ? Math.round(droneStatus.value.batteryPercent as number) 
    : null
  if (currentBatteryPercent !== null && currentBatteryPercent < 30) {
    const confirmContinue = window.confirm(`当前电量为${currentBatteryPercent}%，低于30%，不建议飞行。是否继续下发${taskLabel}？`)
    if (!confirmContinue) {
      return
    }
  }
  
  dispatchTaskDialog.value.form = {
    name: `${taskLabel}_${Date.now()}`,
    dock_sn: deviceSns.dockSns[0],
    file_id: currentWayline.wayline_id,
    task_type: 0,
    out_of_control_action: 0,
    rth_altitude: 100,
    rth_mode: 1,
    exit_wayline_when_rc_lost: 0,
    wayline_precision_type: 1,
    begin_time: null,
    end_time: null,
    enable_vision: false,
    vision_algorithms: [],
    vision_threshold: 0.5,
    enable_recurrence: false,
    recurrence_start_date: '',
    recurrence_end_date: ''
  }
  
  dispatchTaskDialog.value.visible = true
}

// 检查是否可以下发任务
const canDispatchTask = computed(() => {
  // 必须开启导航、INS或MSF中的至少一个
  const hasNavEnabled = navigationEnabled.value || insEnabled.value || msfEnabled.value
  // 没有活动任务（直接读 WebSocket 状态，避免 watch 时序问题）
  const noActiveTask =
    activeTaskType.value === null &&
    !robotStore.isTracking &&
    !robotStore.isPointTaskRunning &&
    robotStore.multitaskStatus?.status !== true
  return hasNavEnabled && noActiveTask
})

const canDispatchTrackTask = computed(() => {
  return canDispatchTask.value && filteredTrackList.value.length > 0
})

const canDispatchPointTask = computed(() => {
  return canDispatchTask.value && filteredPointTaskList.value.length > 0
})

const canDispatchMultiTask = computed(() => {
  return (
    taskExecutionStore.canStartMultiTask &&
    robotStore.multitaskStatus?.status !== true &&
    multiTaskList.value.length > 0
  )
})

const isNavigationPaused = computed(() => {
  return Number((robotStore.cmdStatus as any)?.app_nav_pause?.result ?? 0) === 1
})

const ensureNavPauseReleased = () => {
  if (isNavigationPaused.value) {
    showError('请先关闭导航暂停')
    return false
  }
  return true
}

// 下发任务处理
const handleDispatchTask = () => {
  if (!ensureNavPauseReleased()) return

  if (!canDispatchTrackTask.value) {
    if (!navigationEnabled.value && !insEnabled.value && !msfEnabled.value) {
      showError('请先开启导航、INS或MSF')
    } else if (activeTaskType.value) {
      showError('已有任务在执行中，请先取消当前任务')
    }
    return
  }
  
  // 检查是否选择了循迹任务
  if (!selectedTrack.value) {
    if (filteredTrackList.value.length > 0) {
      selectedTrack.value = filteredTrackList.value[0]
    } else {
      showError('请先选择循迹任务')
      return
    }
  }
  
  // 打开循迹任务启动弹窗
  trackStartDialog.value.form.track_name = selectedTrack.value
  trackStartDialog.value.form.taskpoint_name = ''
  trackStartDialog.value.form.obs_mode = 1
  trackStartDialog.value.form.gait_type = 0
  trackStartDialog.value.form.wait = 0
  resetTrackStartProgress()
  trackStartDialog.value.visible = true
  
  // 获取关键点文件列表
  fetchTaskpointList(selectedTrack.value)
}

const dispatchTrackTask = (trackName: string, taskLabel: string) => {
  if (!trackName) {
    alert(`请先选择一个${taskLabel}`)
    activeTaskType.value = null
    return
  }
  
  // 构造一个临时的任务表单数据，因为循迹任务可能不需要 wayline_id
  // 或者它需要特定的格式。
  // 根据之前的 API 结构，下发任务通常需要 file_id。
  // 对于循迹任务，file_id 可能就是 trackName。
  
  const deviceSns = getCachedDeviceSns()
  dispatchTaskDialog.value.form = {
    name: `${taskLabel}_${Date.now()}`,
    dock_sn: deviceSns.dockSns[0] || '',
    file_id: trackName, // 使用 trackName 作为 file_id
    task_type: 0,
    out_of_control_action: 0,
    rth_altitude: 100,
    rth_mode: 1,
    exit_wayline_when_rc_lost: 0,
    wayline_precision_type: 1,
    begin_time: null,
    end_time: null,
    enable_vision: false,
    vision_algorithms: [],
    vision_threshold: 0.5,
    enable_recurrence: false,
    recurrence_start_date: '',
    recurrence_end_date: ''
  }
  
  dispatchTaskDialog.value.visible = true
}

const handleDispatchPointTask = () => {
  if (!ensureNavPauseReleased()) return

  if (!canDispatchPointTask.value) {
    if (!navigationEnabled.value && !insEnabled.value && !msfEnabled.value) {
      alert('请先开启导航、INS或MSF')
    } else if (activeTaskType.value) {
      alert('已有任务在执行中，请先取消当前任务')
    }
    return
  }
  
  if (!selectedPointTask.value) {
    if (filteredPointTaskList.value.length > 0) {
      selectedPointTask.value = filteredPointTaskList.value[0].task_id
    } else {
      alert('请先选择一个发布点任务')
      return
    }
  }
  
  // 查找选中的任务信息
  const selectedTask = filteredPointTaskList.value.find(task => task.task_id === selectedPointTask.value)
  if (!selectedTask) {
    alert('未找到选中的发布点任务')
    return
  }
  
  // 打开弹窗并设置表单数据
  pointTaskStartDialog.value.form.task_id = selectedTask.task_id // 直接使用字符串ID
  pointTaskStartDialog.value.form.task_name = selectedTask.task_name
  pointTaskStartDialog.value.form.circle = false
  pointTaskStartDialog.value.form.recover = false
  pointTaskStartDialog.value.visible = true
}

const handleDispatchMultiTask = () => {
  if (!canDispatchMultiTask.value) {
    if (!taskExecutionStore.canStartMultiTask) {
      showError('当前有其他任务正在运行')
    } else if (robotStore.multitaskStatus?.status === true || activeTaskType.value === 'multi') {
      showError('多任务组任务正在运行，请先关闭')
    } else if (multiTaskList.value.length === 0) {
      showError('请先选择一个多任务组')
    }
    return
  }
  
  if (!selectedMultiTask.value) {
    if (multiTaskList.value.length > 0) {
      selectedMultiTask.value = multiTaskList.value[0].multitask_id
    } else {
      showError('请先选择一个多任务组')
      return
    }
  }
  
  // 查找选中的任务组名称
  const selectedTask = multiTaskList.value.find(task => task.multitask_id === selectedMultiTask.value)
  if (!selectedTask) {
    showError('未找到选中的多任务组')
    return
  }
  
  // 打开弹窗并设置表单数据
  multiTaskStartDialog.value.form.group_name = selectedTask.multitask_name
  multiTaskStartDialog.value.form.exception_start = false
  multiTaskStartDialog.value.visible = true
}

// 取消任务
const resolveActiveTaskTypeForCancel = (): 'wayline' | 'point' | 'multi' | 'track' | null => {
  if (activeTaskType.value) return activeTaskType.value
  if (robotStore.isTracking) return 'track'
  if (robotStore.isPointTaskRunning) return 'point'
  if (robotStore.multitaskStatus?.status === true) return 'multi'
  return null
}

const handleCancelTask = async () => {
  const effectiveTaskType = resolveActiveTaskTypeForCancel()
  if (effectiveTaskType === null) {
    showError('当前没有正在执行的任务')
    return
  }

  if ((effectiveTaskType === 'track' || effectiveTaskType === 'point') && !ensureNavPauseReleased()) {
    return
  }
  
  const taskTypeMap = {
    wayline: '循迹任务',
    point: '发布点任务',
    multi: '多任务组',
    track: '循迹任务'
  }
  
  const taskName = taskTypeMap[effectiveTaskType] || '任务'
  
  showConfirmDialog(`确定要取消当前${taskName}吗？`, async () => {
    try {
      const robotId = deviceStore.selectedRobotId
      if (!robotId) {
        showError('未找到机器人ID')
        return
      }
      
      // 根据任务类型调用不同的取消接口
      if (effectiveTaskType === 'track') {
        const trackName =
          normalizeTrackName(robotStore.cmdStatus?.track_info?.track_name || '')
          || activeTrackInfo.value.track_name
          || normalizeTrackName(selectedTrack.value)
        const taskpointName =
          normalizeTaskPointName(robotStore.cmdStatus?.track_info?.taskpoint_name || '')
          || activeTrackInfo.value.taskpoint_name
          || trackStartDialog.value.form.taskpoint_name
          || ''

        if (!trackName) {
          showError('未获取到正在执行的循迹任务名称')
          return
        }

        // 取消循迹任务，使用启动时保存的任务参数
        const response = await navigationApi.stopTrack(robotId, {
          action: 0,
          wait: 0,
          obs_mode: 1,
          track_name: trackName,
          taskpoint_name: taskpointName
        })
  // ...
        
        if (response && (response as any).msg) {
          const { error_code, error_msg } = (response as any).msg
          if (error_code === 0) {
            showSuccess('循迹任务已取消')
            activeTaskType.value = null
            activeTrackInfo.value = { track_name: '', taskpoint_name: '' }
          } else {
            showError(`取消失败: ${error_msg || '未知错误'}`)
          }
        } else {
          showSuccess('循迹任务已取消')
          activeTaskType.value = null
          activeTrackInfo.value = { track_name: '', taskpoint_name: '' }
        }
      } else if (effectiveTaskType === 'point') {
        // 停止发布点任务
        let taskId = selectedPointTask.value
        if (!taskId && robotStore.taskStatus?.task_name) {
          const matched = pointTaskList.value.find(task => task.task_name === robotStore.taskStatus?.task_name)
          if (matched) {
            taskId = matched.task_id
          }
        }
        if (!taskId) {
          showError('未找到任务ID')
          return
        }
        
        const response = await navigationApi.stopPointTask(robotId, {
          id: taskId,
          sn: robotId
        })
  // ...
        
        if (response && (response as any).msg) {
          const { error_code, error_msg } = (response as any).msg
          if (error_code === 0) {
            showSuccess('发布点任务已停止')
            activeTaskType.value = null
          } else {
            showError(`停止失败: ${error_msg || '未知错误'}`)
          }
        } else {
          showSuccess('发布点任务已停止')
          activeTaskType.value = null
        }
      } else if (effectiveTaskType === 'multi') {
        // 关闭多任务组（与多任务组任务页面一致，action=0）
        const response = await navigationApi.startMultiTaskGroup(robotId, {
          multitask_name: '',
          multitask_id: '',
          middle_start: 0,
          action: 0
        })
        taskExecutionStore.markMultiTaskStopped()
        activeTaskType.value = null
        showSuccess((response as any)?.message || '关闭指令已发送')
      } else {
        // 其他任务类型的取消逻辑（暂时只清除状态）
        activeTaskType.value = null
  // ...
        showSuccess(`${taskName}已取消`)
      }
    } catch (error) {
  // ...
      showError('取消任务失败，请稍后重试')
    }
  })
}

const handleEnableNavigation = () => {
  // 检查是否被禁用
  if (insEnabled.value || msfEnabled.value) {
    return
  }
  
  if (!selectedMap.value) {
    showError('请先选择地图')
    return
  }
  
  const action = navigationEnabled.value ? '关闭' : '开启'
  showConfirmDialog(`确定要${action}导航吗？`, async () => {
    navigationLoading.value = true
    try {
      const robotId = deviceStore.selectedRobotId
      if (!robotId) { navigationLoading.value = false; return }

      // action: 1 开启, 0 关闭；状态由 cmd_status WebSocket 反馈更新
      await navigationApi.controlNavigation(robotId, {
        action: navigationEnabled.value ? 0 : 1,
        map_name: selectedMap.value
      })
    } catch (err) {
      navigationLoading.value = false
      showError(`${action}导航失败: ${parseErrorMessage(err)}`)
    }
  })
}

const handleEnableIns = () => {
  if (!hasRobotRtk.value) {
    showError('当前机器人未配置RTK，无法操作INS')
    return
  }
  // 检查是否被禁用
  if (navigationEnabled.value || msfEnabled.value) {
    return
  }
  
  const action = insEnabled.value ? '关闭' : '开启'
  showConfirmDialog(`确定要${action}INS吗？`, async () => {
    insLoading.value = true
    try {
      const robotId = deviceStore.selectedRobotId
      if (!robotId) { insLoading.value = false; return }

      // action: 1 开启, 0 关闭；状态由 cmd_status WebSocket 反馈更新
      await navigationApi.insControl(robotId, {
        action: insEnabled.value ? 0 : 1
      })
    } catch (err) {
      insLoading.value = false
      console.error(`${action}INS失败:`, err)
      alert(`${action}INS失败`)
    }
  })
}

const handleEnableMsf = () => {
  if (!hasRobotRtk.value) {
    showError('当前机器人未配置RTK，无法操作MSF')
    return
  }
  // 检查是否被禁用
  if (navigationEnabled.value || insEnabled.value) {
    return
  }
  
  if (!selectedMap.value) {
    alert('请先选择地图')
    return
  }
  
  const action = msfEnabled.value ? '关闭' : '开启'
  showConfirmDialog(`确定要${action}MSF吗？`, async () => {
    msfLoading.value = true
    try {
      const robotId = deviceStore.selectedRobotId
      if (!robotId) { msfLoading.value = false; return }

      // action: 1 开启, 0 关闭；状态由 cmd_status WebSocket 反馈更新
      await navigationApi.msfControl(robotId, {
        action: msfEnabled.value ? 0 : 1,
        mode: 3,
        session: selectedMap.value
      })
    } catch (err) {
      msfLoading.value = false
      console.error(`${action}MSF失败:`, err)
      alert(`${action}MSF失败`)
    }
  })
}

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

// 返回今天的本地日期 YYYY-MM-DD
const getTodayDate = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// 将Date按本地时间格式化为 YYYY-MM-DDTHH:mm:ss（不带时区）
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

// 下发任务确认
const onDispatchTaskConfirm = async () => {
  const form = dispatchTaskDialog.value.form
  
  // 验证必填字段
  if (!form.name.trim()) {
    alert('请输入任务名称')
    return
  }
  
  if ((form.task_type === 1) && !form.begin_time) {
    alert('定时任务需要设置开始时间')
    return
  }

  // 周期任务校验（仅定时任务）
  if (form.task_type === 1 && form.enable_recurrence) {
    if (!form.recurrence_start_date || !form.recurrence_end_date) {
      alert('请选择周期任务的开始和结束日期')
      return
    }
    const sd = new Date(form.recurrence_start_date)
    const ed = new Date(form.recurrence_end_date)
    const today = new Date(getTodayDate())
    if (sd < today || ed < today) {
      alert('周期任务日期不能早于今天')
      return
    }
    if (sd > ed) {
      alert('周期任务的开始日期不能晚于结束日期')
      return
    }
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
    
    // 根据任务类型设置execute_time
    if (form.task_type === 0) {
      // 立即任务：使用本地时间字符串（不带时区）
      taskData.execute_time = formatLocalDateTime(new Date())
    } else if (form.task_type === 1 && form.begin_time) {
      // 定时任务：使用选择的本地时间字符串（不带时区）
      taskData.execute_time = form.begin_time.length === 16 ? `${form.begin_time}:00` : form.begin_time
    }
    
    // 创建任务
    // 附加周期任务配置，并将提交的 task_type 改为 3
    if (form.task_type === 1 && form.enable_recurrence) {
      taskData.task_type = 3
      taskData.recurrence_config = {
        recurrence_type: 'date_range',
        start_date: form.recurrence_start_date,
        end_date: form.recurrence_end_date
      }
    }

    const response = await createJob(workspaceId, taskData)
  // ...
    
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
          // ...
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
  // ...
    alert('任务下发失败')
  }
}

// 下发任务取消
const onDispatchTaskCancel = () => {
  dispatchTaskDialog.value.visible = false
}

// 循迹任务启动弹窗 - 取消
const onTrackStartCancel = () => {
  if (trackStartDialog.value.loading) return
  trackStartDialog.value.visible = false
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
  options?: {
    gaitConfig?: { command: string; label: string }
    stepLogger?: (message: string) => void
  }
) => {
  const log = options?.stepLogger ?? (() => {})

  if (robotStore.robotStatusText === 'RL状态') {
    log('检测到 RL状态，先切换到行走步态')
    await sendDogCommand(robotId, 'foot_walk')
  }

  log('发送非手动模式指令')
  await sendDogCommand(robotId, 'mode_auto')
  log('设置地形为实心地面')
  await sendDogCommand(robotId, 'ground_1')

  log('等待机器人进入非手动模式')
  await waitForRobotState(
    () => Array.isArray(robotStore.rcsData?.rcs_state) && robotStore.rcsData.rcs_state[0] === 1,
    15000,
    '等待机器人切换到非手动模式超时'
  )

  log('发送导航模块非手动模式指令')
  await sendDogCommand(robotId, 'mode_auto_2')

  if (robotStore.motionState?.basic_state !== 4) {
    log('机器人当前未处于踏步状态，发送踏步指令')
    await sendDogCommand(robotId, 'action')
    log('等待机器人进入踏步状态')
    await waitForRobotState(
      () => robotStore.motionState?.basic_state === 4,
      15000,
      '等待机器人进入踏步状态超时'
    )
  }

  if (options?.gaitConfig) {
    log(`切换目标步态为${options.gaitConfig.label}`)
    await sendDogCommand(robotId, options.gaitConfig.command)
    log(`等待机器人切换到${options.gaitConfig.label}`)
    await waitForRobotState(
      () => robotStore.gaitText === options.gaitConfig?.label,
      15000,
      `等待机器人切换到${options.gaitConfig.label}超时`
    )
  }
}

const resolveCheckExitChargeResult = (response: any): boolean | null => {
  const candidates = [
    response?.msg?.on_charge_pile,
    response?.response?.msg?.on_charge_pile,
    response?.data?.msg?.on_charge_pile,
  ]
  for (const value of candidates) {
    if (typeof value === 'boolean') return value
  }
  return null
}

const isRobotProneState = () => {
  const basicState = Number(robotStore.motionState?.basic_state)
  return basicState === 0 || basicState === 5
}

const finalizeTrackTaskStart = async (trackName: string, taskpointName: string, successMessage?: string) => {
  const normalizedTrackName = normalizeTrackName(trackName)
  activeTaskType.value = 'track'
  taskExecutionStore.markMultiTaskStopped()
  selectedTrack.value = normalizedTrackName
  activeTrackInfo.value = { track_name: normalizedTrackName, taskpoint_name: taskpointName }
  activeOverlayTrackName.value = normalizedTrackName
  await overlayTrackTrajectory(normalizedTrackName)
  showSuccess(successMessage || '循迹任务启动成功')
}

// 循迹任务启动弹窗 - 确认
const onTrackStartConfirm = async () => {
  if (!ensureNavPauseReleased()) return

  const form = trackStartDialog.value.form
  
  // 验证循迹任务名称
  if (!form.track_name || form.track_name.trim() === '') {
    showError('循迹任务名称不能为空')
    return
  }
  
  // 验证关键点文件是否选择
  if (!form.taskpoint_name || form.taskpoint_name.trim() === '') {
    showError('请选择关键点文件')
    return
  }
  
  // 验证关键点文件列表是否为空
  if (taskpointList.value.length === 0) {
    showError('当前循迹任务没有可用的关键点文件，请先创建关键点文件')
    return
  }
  
  // 验证避障模式
  if (form.obs_mode === null || form.obs_mode === undefined) {
    showError('请选择避障模式')
    return
  }

  const gaitConfig = trackGaitConfigMap[form.gait_type]
  if (!gaitConfig) {
    showError('请选择有效的步态')
    return
  }
  
  if (trackStartDialog.value.loading) return
  trackStartDialog.value.loading = true
  trackStartDialog.value.visible = false
  trackInitDialog.value.text = '循迹任务启动中...'
  trackInitDialog.value.visible = true

  try {
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showError('未找到机器人ID')
      return
    }

    resetTrackStartProgress()
    pushTrackStartStep('检查循迹启动前置状态')
    const checkResult = await navigationApi.startTrack(robotId, {
      obs_mode: form.obs_mode,
      track_name: form.track_name,
      taskpoint_name: form.taskpoint_name,
      gait_name: gaitConfig.command,
      ground: ''
    })

    const canWaitDirectly = resolveCheckExitChargeResult(checkResult)
    if (canWaitDirectly === true) {
      pushTrackStartStep('检测到可直接启动，等待循迹启动', 'success')
      showSuccess('等待循迹启动', 8000)
      return
    }
    if (canWaitDirectly === false && isRobotProneState()) {
      pushTrackStartStep('机器狗处于趴下状态，请先起立', 'error')
      showError('机器狗处于趴下状态，请先将机器狗起立')
      return
    }

    trackInitDialog.value.text = '机器狗初始化中...'
    pushTrackStartStep('开始准备循迹任务启动流程')
    await prepareRobotForTaskStart(robotId, {
      gaitConfig,
      stepLogger: pushTrackStartStep
    })

    pushTrackStartStep('发送循迹任务启动指令')
    const response = await navigationApi.stopTrack(robotId, {
      action: 1,
      wait: form.wait ?? 0,
      obs_mode: form.obs_mode,
      track_name: form.track_name,
      taskpoint_name: form.taskpoint_name
    })
    
    // 根据返回结果判断是否成功
    const startMsg = (response as any)?.response?.msg || (response as any)?.msg
    if (startMsg) {
      const { error_code, error_msg } = startMsg
      if (error_code === 0) {
        pushTrackStartStep((response as any).message || '循迹任务启动成功', 'success')
        await finalizeTrackTaskStart(form.track_name, form.taskpoint_name, (response as any).message || '循迹任务启动成功')
      } else {
        pushTrackStartStep(`启动失败: ${error_msg || '未知错误'}`, 'error')
        showError(`启动失败: ${error_msg || '未知错误'}`)
      }
    } else {
      pushTrackStartStep('循迹任务启动成功', 'success')
      await finalizeTrackTaskStart(form.track_name, form.taskpoint_name)
    }
  } catch (error) {
    console.error('启动循迹任务失败:', error)
    const errorMessage = parseErrorMessage(error) || '启动循迹任务失败，请稍后重试'
    pushTrackStartStep(errorMessage, 'error')
    showError(errorMessage)
  } finally {
    trackInitDialog.value.visible = false
    trackStartDialog.value.loading = false
  }
}



// 多任务组启动弹窗 - 取消
const onMultiTaskStartCancel = () => {
  multiTaskStartDialog.value.visible = false
}

// 多任务组启动弹窗 - 确认
const onMultiTaskStartConfirm = async () => {
  const form = multiTaskStartDialog.value.form
  
  // 验证任务组名称
  if (!form.group_name || form.group_name.trim() === '') {
    showError('任务组名称不能为空')
    return
  }
  
  try {
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showError('未找到机器人ID')
      return
    }

    if (!taskExecutionStore.canStartMultiTask) {
      showError('当前有其他任务正在运行')
      return
    }
    if (robotStore.multitaskStatus?.status === true || activeTaskType.value === 'multi') {
      showError('多任务组任务正在运行，请先关闭')
      return
    }

    const selectedGroup = multiTaskList.value.find(task => task.multitask_id === selectedMultiTask.value)
    if (!selectedGroup || !selectedGroup.multitask_id) {
      showError('无效的多任务组')
      return
    }
    
    // 点击确定立即关闭弹窗
    multiTaskStartDialog.value.visible = false
    
    // 调用启动多任务组API
    const response = await navigationApi.startMultiTaskGroup(robotId, {
      multitask_name: selectedGroup.multitask_name,
      multitask_id: selectedGroup.multitask_id,
      middle_start: Number(form.exception_start),
      action: 1
    })
    
    // 根据返回结果判断是否成功
    if (response && (response as any).response && (response as any).response.msg) {
      const { error_code, error_msg } = (response as any).response.msg
      if (error_code === 0) {
        activeTaskType.value = 'multi'
        taskExecutionStore.markMultiTaskStarted()
        showSuccess((response as any).message || '多任务组启动成功')
      } else {
        showError(`启动失败: ${error_msg || '未知错误'}`)
      }
    } else {
      activeTaskType.value = 'multi'
      taskExecutionStore.markMultiTaskStarted()
      showSuccess('多任务组启动成功')
    }
  } catch (error) {
    console.error('启动多任务组失败:', error)
    showError('启动多任务组失败，请稍后重试')
  }
}

// 发布点任务启动弹窗 - 取消
const onPointTaskStartCancel = () => {
  pointTaskStartDialog.value.visible = false
}

// 发布点任务启动弹窗 - 确认
const onPointTaskStartConfirm = async () => {
  if (!ensureNavPauseReleased()) return

  const form = pointTaskStartDialog.value.form
  
  // 验证任务ID
  if (!form.task_id) {
    showError('任务ID不能为空')
    return
  }
  
  try {
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      showError('未找到机器人ID')
      return
    }

    if (!navigationEnabled.value && !insEnabled.value && !msfEnabled.value) {
      showError('请先开启导航、INS或MSF')
      return
    }
    if (activeTaskType.value && activeTaskType.value !== 'point') {
      showError('当前有其他任务正在运行')
      return
    }
    if (robotStore.isTracking || robotStore.multitaskStatus?.status === true) {
      showError('当前有其他任务正在运行')
      return
    }

    // 点击确定立即关闭弹窗
    pointTaskStartDialog.value.visible = false
    trackInitDialog.value.text = '机器狗初始化中...'
    trackInitDialog.value.visible = true

    await prepareRobotForTaskStart(robotId, {
      gaitConfig: trackGaitConfigMap[0]
    })

    // 调用启动发布点任务API
    const response = await navigationApi.startPointTask(robotId, {
      id: form.task_id, // 传递字符串ID
      sn: robotId
    })
    
    // 根据返回结果判断是否成功
    if (response && (response as any).msg) {
      const { error_code, error_msg } = (response as any).msg
      if (error_code === 0) {
        activeTaskType.value = 'point'
        taskExecutionStore.markMultiTaskStopped()
        activeOverlayPointTaskId.value = form.task_id
        await overlayPointTaskWaypoints(form.task_id, form.task_name)
        showSuccess('发布点任务启动成功')
      } else {
        showError(`启动失败: ${error_msg || '未知错误'}`)
      }
    } else {
      activeTaskType.value = 'point'
      taskExecutionStore.markMultiTaskStopped()
      activeOverlayPointTaskId.value = form.task_id
      await overlayPointTaskWaypoints(form.task_id, form.task_name)
      showSuccess('发布点任务启动成功')
    }
  } catch (error) {
    console.error('启动发布点任务失败:', error)
    showError(parseErrorMessage(error) || '启动发布点任务失败，请稍后重试')
  } finally {
    trackInitDialog.value.visible = false
  }
}

// 航线暂停处理
const handlePauseRoute = async () => {
  try {
    const workspaceId = getCachedWorkspaceId()
    if (!workspaceId) {
      alert('未找到workspace_id')
      return
    }
    
    if (!waylineProgress.value?.job_id) {
      alert('没有正在执行的任务')
      return
    }
    
    await pauseJob(workspaceId, waylineProgress.value.job_id)
    alert('航线暂停指令已发送')
    
    // 任务进度由全局store自动更新
  } catch (err) {
    console.error('航线暂停失败:', err)
    alert('航线暂停失败')
  }
}

// 航线恢复处理
const handleResumeRoute = async () => {
  try {
    const workspaceId = getCachedWorkspaceId()
    if (!workspaceId) {
      alert('未找到workspace_id')
      return
    }
    
    if (!waylineProgress.value?.job_id) {
      alert('没有正在执行的任务')
      return
    }
    
    await resumeJob(workspaceId, waylineProgress.value.job_id)
    alert('航线恢复指令已发送')
    
    // 任务进度由全局store自动更新
  } catch (err) {
    console.error('航线恢复失败:', err)
    alert('航线恢复失败')
  }
}

// 取消返航处理
const handleCancelReturnHome = async () => {
  try {
    const workspaceId = getCachedWorkspaceId()
    if (!workspaceId) {
      alert('未找到workspace_id')
      return
    }
    
    const { dockSns } = getCachedDeviceSns()
    if (dockSns.length === 0) {
      alert('未找到可用的机场设备')
      return
    }
    
    if (!confirm('确定要取消返航吗？')) {
      return
    }
    
    await cancelReturnHome(workspaceId, dockSns[0])
    alert('取消返航指令已发送')
    
    // 任务进度由全局store自动更新
  } catch (err) {
    console.error('取消返航失败:', err)
    alert('取消返航失败')
  }
}

// 一键返航处理
const handleReturnHome = async () => {
  try {
    // 获取缓存的机场SN
    const { dockSns } = getCachedDeviceSns()
    if (dockSns.length === 0) {
      alert('没有找到可用的机场设备')
      return
    }
    
    // 使用第一个机场SN
    const dockSn = dockSns[0]
    
    // 弹出确认对话框
    const confirmed = confirm('确定要执行一键返航吗？')
    if (!confirmed) {
      return
    }
    
    alert('一键返航功能暂不可用（旧控制接口已停用）')
    return
    
  } catch (error: any) {
    console.error('一键返航失败:', error)
    const errorMsg = parseErrorMessage(error)
    alert(`一键返航失败: ${errorMsg}`)
  }
}

// 初始化告警趋势图表
const initAlarmTrendChart = () => {
  if (!alarmTrendChartRef.value) return
  
  alarmTrendChart = echarts.init(alarmTrendChartRef.value)
  const option = {
    grid: {
      top: '15%',
      left: '5%',
      right: '5%',
      bottom: '8%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['设备告警', '巡检告警', '环境告警', '任务告警'],
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12
      }
    },
    series: [
      {
        data: [180, 150, 90, 120],
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: '#FF8000'
              },
              {
                offset: 1,
                color: 'rgba(255, 128, 0, 0.1)'
              }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
  alarmTrendChart.setOption(option)
}

// 初始化任务饼图
const initTaskPieCharts = () => {
  if (!taskPieChart1Ref.value || !taskPieChart2Ref.value) return

  // 进度环形图配置
  const progressOption = {
    backgroundColor: 'transparent',
    series: [
      {
        name: '巡检进度',
        type: 'pie',
        radius: ['75%', '90%'],
        center: ['50%', '45%'],
        startAngle: 90,
        silent: true,
        label: {
          show: false
        },
        emphasis: {
          scale: false,
          scaleSize: 0
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.3)'
        },
        data: [
          { 
            value: 25, 
            name: '已巡检',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#67d5fd' },
                  { offset: 1, color: '#2683b6' }
                ]
              },
              shadowBlur: 10,
              shadowColor: 'rgba(103, 213, 253, 0.3)'
            }
          },
          { 
            value: 75, 
            name: '待巡检',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#FF8000' },
                  { offset: 1, color: '#B25000' }
                ]
              },
              borderWidth: 1,
              borderColor: 'rgba(255, 128, 0, 0.3)'
            }
          }
        ],
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDuration: 1000
      }
    ]
  };

  // 状态环形图配置
  const statusOption = {
    backgroundColor: 'transparent',
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['75%', '90%'],
        center: ['50%', '45%'],
        startAngle: 90,
        silent: true,
        label: {
          show: false
        },
        emphasis: {
          scale: false,
          scaleSize: 0
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.3)'
        },
        data: [
          { 
            value: 75, 
            name: '正常',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#52C41A' },
                  { offset: 1, color: '#3d9213' }
                ]
              },
              shadowBlur: 10,
              shadowColor: 'rgba(82, 196, 26, 0.3)'
            }
          },
          { 
            value: 25, 
            name: '异常',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#FF4D4F' },
                  { offset: 1, color: '#B22426' }
                ]
              },
              borderWidth: 1,
              borderColor: 'rgba(255, 77, 79, 0.3)'
            }
          }
        ],
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDuration: 1000
      }
    ]
  };

  taskPieChart1 = echarts.init(taskPieChart1Ref.value)
  taskPieChart2 = echarts.init(taskPieChart2Ref.value)

  taskPieChart1.setOption(progressOption)
  taskPieChart2.setOption(statusOption)
  
  // 添加图表动画效果
  const animateCharts = () => {
    if (taskPieChart1 && taskPieChart2) {
      // 为第一个图表添加旋转动画
      taskPieChart1.setOption({
        series: [{
          animation: true,
          animationDuration: 3000,
          animationEasingUpdate: 'cubicInOut'
        }]
      });
      
      // 为第二个图表添加旋转动画
      taskPieChart2.setOption({
        series: [{
          animation: true,
          animationDuration: 3000,
          animationEasingUpdate: 'cubicInOut'
        }]
      });
    }
  };
  
  // 初始动画
  animateCharts();
  
  // 每隔一段时间刷新动画效果（记录并可在卸载时清理）
  if (chartAnimationTimer) {
    clearInterval(chartAnimationTimer)
    chartAnimationTimer = null
  }
  chartAnimationTimer = setInterval(() => {
    animateCharts();
  }, 10000) as unknown as number;
}

// 初始化航线报表图表
const initLineChart = () => {
  if (!lineChartRef.value) return
  
  lineChart = echarts.init(lineChartRef.value)
  const option = {
    grid: {
      top: '12%',
      left: '1%',
      right: '1%',
      bottom: '2%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'none'
      }
    },
    xAxis: {
      type: 'category',
      data: ['10-01', '10-02', '10-03', '10-04', '10-05', '10-06', '10-07'],
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        margin: 8
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        margin: 8
      }
    },
    series: [
      {
        data: [120, 180, 150, 210, 190, 230, 200],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#59C0FC',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          color: '#59C0FC',
          width: 3
        },
        label: {
          show: true,
          position: 'top',
          distance: 5,
          color: '#fff',
          fontSize: 11,
          backgroundColor: 'rgba(89, 192, 252, 0.2)',
          borderRadius: 4,
          padding: [2, 4],
          formatter: '{c}'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(89, 192, 252, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(89, 192, 252, 0.1)'
              }
            ]
          }
        }
      }
    ]
  }
  lineChart.setOption(option)
  // 新增：如果有接口数据，立即用接口数据覆盖
  updateFlightStatisticsChart()
}

// 更新飞行统计图表
const updateFlightStatisticsChart = () => {
  if (!lineChart || !flightStatistics.value) return
  
  const dailyStats = flightStatistics.value.daily_stats || []
  const dates = dailyStats.map((item: any) => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}-${date.getDate().toString().padStart(2, '0')}`
  })
  const taskCounts = dailyStats.map((item: any) => item.total_tasks || 0)
  
  const option = {
    grid: {
      top: '12%',
      left: '1%',
      right: '1%',
      bottom: '2%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'none'
      },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>任务数：${data.value}`
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        margin: 8
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        margin: 8
      }
    },
    series: [
      {
        data: taskCounts,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#59C0FC',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          color: '#59C0FC',
          width: 3
        },
        label: {
          show: true,
          position: 'top',
          distance: 5,
          color: '#fff',
          fontSize: 11,
          backgroundColor: 'rgba(89, 192, 252, 0.2)',
          borderRadius: 4,
          padding: [2, 4],
          formatter: '{c}'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(89, 192, 252, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(89, 192, 252, 0.1)'
              }
            ]
          }
        }
      }
    ]
  }
  lineChart.setOption(option)
}

// 监听视频流地址变化
watch(() => videoStreamUrl.value, (newUrl) => {
  if (newUrl) {
    visibleLoading.value = true
    nextTick(() => {
      startVideoPlayback()
    })
  }
})

watch(() => infraredStreamUrl.value, (newUrl) => {
  if (!newUrl) return
  infraredLoading.value = true
  nextTick(() => {
    startInfraredPlayback()
  })
})

onMounted(async () => {
  window.addEventListener('robot-camera-ready', handleRobotCameraReady)
  window.addEventListener('robot-map-list-ready', handleRobotMapListReady)
  window.addEventListener('robot-track-list-ready', handleRobotTrackListReady)
  window.addEventListener('multi-task-list-updated', handleMultiTaskListUpdated)
  window.addEventListener('point-task-list-updated', handlePointTaskListUpdated)
  window.addEventListener('track-task-group-updated', handleTrackTaskGroupUpdated)
  window.addEventListener('track-task-list-updated', handleTrackTaskListUpdated)
  window.addEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('pageshow', handlePageShow)

  // 初始化警报声（使用Web Audio API生成）
  
  // WebSocket 在 App.vue 全局启动，此处无需再轮询机器人状态

  // 加载机器狗箭头 3MF 模型
  load3MF('/jiantou.3mf').then(mesh => {
    if (mesh) {
      arrowMesh.value = mesh
    } else {
      console.warn('[3MF] 箭头模型加载失败，将使用内置三角形替代')
    }
  })

  // 航线任务进度数据现在由全局store管理，无需本地加载
  
  // 视频初始化统一由 robot-camera-ready / onActivated 处理，避免重复起流
  if (deviceStore.selectedRobot) {
    // 点云加载改为后台并行，避免阻塞首屏视频初始化
    void refreshPointCloud()
  }
  
  // 初始化图表
  nextTick(() => {
    setTimeout(() => {
      initAlarmTrendChart()
      initTaskPieCharts()
      initLineChart()
    }, 100)
  })

  // 添加全局点击事件监听器，用于点击空白处关闭菜单
  document.addEventListener('click', handleGlobalClick)

  // 监听机器人切换事件，切换后刷新下拉列表数据
  window.addEventListener('resize', () => {
    alarmTrendChart?.resize()
    taskPieChart1?.resize()
    taskPieChart2?.resize()
    lineChart?.resize()
  })

  // 初始化地图
  if (mapContainer.value) {
    // 读取凭据：优先使用通过 vite.define 注入的常量，其次使用 VITE_ 环境变量
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
      plugins: ['AMap.ToolBar', 'AMap.Geolocation', 'AMap.PlaceSearch']
    }).then((AMap) => {
      amapApiRef = AMap // 缓存 AMap
      amapInstance = new AMap.Map(mapContainer.value, {
        zoom: 18,
        center: [116.397428, 39.90923],
        logoEnable: false,
        copyrightEnable: false,
        mapStyle: 'amap://styles/satellite', // 强制设置卫星图样式
        layers: [
          new AMap.TileLayer.Satellite(),
          new AMap.TileLayer.RoadNet()
        ]
      })
      
      
      // 地图加载完成后更新机场标记
      amapInstance.on('complete', () => {
        updateMapMarkers(isInitialLoad.value)
        isInitialLoad.value = false
        
        setTimeout(() => {
          if (isInitialLoad.value) {
            updateMapMarkers(true)
            isInitialLoad.value = false
          }
        }, 2000)
      })
    }).catch((error) => {
      // 地图加载失败
    })
  }
  

  
  // 航线任务进度现在由全局store管理，无需本地轮询
})

// 切换机器人第一阶段：camera_list 就绪，立即启动视频流
const handleRobotCameraReady = async (event: Event) => {
  const { robotId } = (event as CustomEvent).detail || {}
  const targetRobotId = robotId || deviceStore.selectedRobotId || ''
  // 若事件携带的 robotId 与当前选中不符，说明是过期回调，直接忽略
  if (robotId && robotId !== deviceStore.selectedRobotId) {
    return
  }
  if (!targetRobotId) return
  // 同一机器人初始化进行中时，忽略重复事件，避免 start 被反复 cancel
  if (isCameraInitRunning && cameraInitRunningRobotId === targetRobotId) {
    return
  }
  // 取消上一轮摄像头初始化（如 A 的 startCameraStream 还在飞行）
  if (cameraInitAbortController) cameraInitAbortController.abort()
  cameraInitAbortController = new AbortController()
  const { signal } = cameraInitAbortController
  isCameraInitRunning = true
  cameraInitRunningRobotId = targetRobotId

  try {
    stopVideoPlayback()
    stopInfraredPlayback()
    await initCameraStreams(signal)
    if (signal.aborted) return  // 已被新一轮取代
    lastCameraInitSuccessAt = Date.now()
    initVideoPlayer()
    initInfraredVideo()
  } finally {
    if (cameraInitRunningRobotId === targetRobotId) {
      isCameraInitRunning = false
      cameraInitRunningRobotId = ''
    }
  }
}

// 切换机器人第二阶段：其余数据就绪，刷新下拉框和点云
const handleRobotMapListReady = async (event: Event) => {
  const { robotId } = (event as CustomEvent).detail || {}
  if (robotId && robotId !== deviceStore.selectedRobotId) {
    return
  }

  await fetchMapList(robotId)
  const navMapName = robotStore.cmdStatus?.map_name
  if (robotStore.cmdStatus?.nav === 1 && navMapName) {
    syncMapFromNavigation(navMapName)
  }
}

const handleRobotTrackListReady = async (event: Event) => {
  const { robotId } = (event as CustomEvent).detail || {}
  if (robotId && robotId !== deviceStore.selectedRobotId) {
    return
  }
  await fetchTrackList()
}

const handleMultiTaskListUpdated = async (event: Event) => {
  const { robotId } = (event as CustomEvent).detail || {}
  if (robotId && robotId !== deviceStore.selectedRobotId) {
    return
  }
  await fetchMultiTaskList()
}

const handlePointTaskListUpdated = async (event: Event) => {
  const { robotId } = (event as CustomEvent).detail || {}
  if (robotId && robotId !== deviceStore.selectedRobotId) {
    return
  }
  await fetchPointTaskList()
}

const handleTrackTaskGroupUpdated = async (event: Event) => {
  const { robotId, trackName } = (event as CustomEvent).detail || {}
  if (robotId && robotId !== deviceStore.selectedRobotId) {
    return
  }
  const updatedTrack = normalizeTrackName(String(trackName || ''))
  const currentTrack = normalizeTrackName(trackStartDialog.value.form.track_name || selectedTrack.value || '')
  if (!updatedTrack || !currentTrack || updatedTrack !== currentTrack) {
    return
  }
  await fetchTaskpointList(currentTrack)
}

const handleTrackTaskListUpdated = async (event: Event) => {
  const { robotId } = (event as CustomEvent).detail || {}
  if (robotId && robotId !== deviceStore.selectedRobotId) {
    return
  }

  await fetchTrackList()

  const runningTrackName = normalizeTrackName(
    robotStore.cmdStatus?.track_info?.track_name
    || activeOverlayTrackName.value
    || selectedTrack.value
    || ''
  )
  if (!robotStore.isTracking || !runningTrackName || basePointCloudData.value.length === 0) return

  lastTrackOverlayKey.value = ''
  lastTrackOverlayTaskPointCount.value = 0
  await overlayTrackTrajectory(runningTrackName)
}

// 切换机器人第三阶段：其余数据就绪，刷新其他下拉和点云
const handleRobotContextRefreshed = async (event: Event) => {
  const { robotId } = (event as CustomEvent).detail || {}
  if (robotId && robotId !== deviceStore.selectedRobotId) {
    return
  }
  // 切换机器人时清空实时警情列表
  deviceAlarmData.value = []
  // 地图下拉已在 robot-map-list-ready 阶段刷新，这里只刷新其余列表
  selectedTrack.value = ''
  selectedPointTask.value = ''
  selectedMultiTask.value = ''
  trackList.value = []
  pointTaskList.value = []
  multiTaskList.value = []
  await fetchTrackList()
  await fetchPointTaskList()
  await fetchMultiTaskList()
  // fetchMapList 拿到的是缓存值；若导航当前正在运行，以 WebSocket 的地图为最终值
  const navMapName = robotStore.cmdStatus?.map_name
  if (robotStore.cmdStatus?.nav === 1 && navMapName) {
    syncMapFromNavigation(navMapName)
  }
  // 若已选中地图则刷新点云
  if (selectedMap.value) {
    await nextTick()
    const updateTime = mapUpdateTimeMap.value[selectedMap.value] || ''
    await downloadMapFiles(selectedMap.value, updateTime)
    await refreshPointCloud()
  }
}

// 组件卸载时清理
onUnmounted(() => {
  // 移除全局事件监听
  document.removeEventListener('click', handleGlobalClick)
  window.removeEventListener('robot-camera-ready', handleRobotCameraReady)
  window.removeEventListener('robot-map-list-ready', handleRobotMapListReady)
  window.removeEventListener('robot-track-list-ready', handleRobotTrackListReady)
  window.removeEventListener('multi-task-list-updated', handleMultiTaskListUpdated)
  window.removeEventListener('point-task-list-updated', handlePointTaskListUpdated)
  window.removeEventListener('track-task-group-updated', handleTrackTaskGroupUpdated)
  window.removeEventListener('track-task-list-updated', handleTrackTaskListUpdated)
  window.removeEventListener('robot-context-refreshed', handleRobotContextRefreshed)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('pageshow', handlePageShow)
  if (foregroundRecoverTimer) {
    clearTimeout(foregroundRecoverTimer)
    foregroundRecoverTimer = null
  }

  // robotInfoTimer 已废弃，无需清理


  
  if (statusRefreshTimer) {
    clearInterval(statusRefreshTimer)
    statusRefreshTimer = null
  }
  
  // 清理无人机状态刷新定时器
  if (droneStatusRefreshTimer) {
    clearInterval(droneStatusRefreshTimer)
    droneStatusRefreshTimer = null
  }
  
  // 航线任务进度现在由全局store管理，无需清理本地定时器
  // 清理图表动画定时器
  if (chartAnimationTimer) {
    clearInterval(chartAnimationTimer)
    chartAnimationTimer = null
  }
  
  // 清理地图标记
  clearDockMarkers()
  clearDroneMarkers()
  
  // 清理航点和轨迹
  clearWaylineDisplay()
  
  // 清理地图实例
  if (amapInstance) {
    amapInstance.destroy()
    amapInstance = null
    amapApiRef = null
  }
  
  // 停止视频播放
  stopVideoPlayback()
  stopInfraredPlayback()
  
  // 清理WebRTC资源
  if (pc) {
    pc.close()
    pc = null
  }
  
  if (amapInstance) {
    amapInstance.destroy()
    amapInstance = null
  }
  if (alarmTrendChart) {
    alarmTrendChart.dispose()
  }
  if (taskPieChart1) {
    taskPieChart1.dispose()
  }
  if (taskPieChart2) {
    taskPieChart2.dispose()
  }
  if (lineChart) {
    lineChart.dispose()
  }
  
  // 停止并清理警报声
  if (stopAlarmSound) {
    stopAlarmSound()
    stopAlarmSound = null
  }
  isAlarmPlaying.value = false
})

// 舱盖状态监听
watch(() => dockStatus.value?.coverState, (newCoverState) => {
  // 只要舱盖不是关闭状态（值不为0）就播放警报声
  if (newCoverState !== 0 && !isAlarmPlaying.value) {
    // 舱盖不是关闭状态，播放警报声
    stopAlarmSound = playAlarmSound()
  }
  // 舱盖状态变为关闭（值为0）时停止警报声
  else if (newCoverState === 0 && isAlarmPlaying.value) {
    // 舱盖关闭，停止警报声
    if (stopAlarmSound) {
      stopAlarmSound()
      stopAlarmSound = null
    }
  }
})

// 切换播放/暂停
const togglePlay = () => {
  if (!videoElement.value) return
  
  if (isVideoPlaying.value) {
    videoElement.value.pause()
  } else {
    videoElement.value.play()
  }
}

// 更新视频时间
const updateVideoTime = () => {
  if (!videoElement.value) return
  
  const current = videoElement.value.currentTime
  const duration = videoElement.value.duration
  
  // 处理无效的currentTime
  if (isNaN(current) || !isFinite(current) || current < 0) {
    currentTime.value = '00:00'
  } else {
    currentTime.value = formatTime(current)
  }
  
  // 处理无效的duration
  if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
    totalTime.value = formatTime(duration)
  } else {
    totalTime.value = '00:00'
  }
}

// 全屏功能
const toggleFullscreen = () => {
  const playerElement = document.querySelector('.player_box')
  
  if (!playerElement) {
    return
  }

  try {
    if (!document.fullscreenElement) {
      // 进入全屏
      if (playerElement.requestFullscreen) {
        playerElement.requestFullscreen()
      } else if ((playerElement as any).webkitRequestFullscreen) {
        // Safari
        (playerElement as any).webkitRequestFullscreen()
      } else if ((playerElement as any).mozRequestFullScreen) {
        // Firefox
        (playerElement as any).mozRequestFullScreen()
      } else if ((playerElement as any).msRequestFullscreen) {
        // IE/Edge
        (playerElement as any).msRequestFullscreen()
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        // Safari
        (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        // Firefox
        (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        // IE/Edge
        (document as any).msExitFullscreen()
      }
    }
  } catch (error) {
    alert('全屏功能暂时不可用，请检查浏览器设置')
  }
}

// 追踪无人机
const isDroneTracking = ref(false)
const toggleDroneTracking = () => {
  isDroneTracking.value = !isDroneTracking.value
  if (isDroneTracking.value) {
    centerToDroneMarker();
  }
}

// 航点和轨迹相关变量
const waylineMarkers = ref<any[]>([])
const waylinePolyline = ref<any>(null)
const currentWaypointMarker = ref<any>(null)

// 更新无人机追踪位置
const updateDroneTracking = () => {
  if (isDroneTracking.value) {
    centerToDroneMarker();
  }
}

// 清除航线显示
const clearWaylineDisplay = () => {
  if (amapInstance) {
    // 清除航点标记
    waylineMarkers.value.forEach(marker => {
      amapInstance.remove(marker)
    })
    waylineMarkers.value = []
    
    // 清除航线
    if (waylinePolyline.value) {
      amapInstance.remove(waylinePolyline.value)
      waylinePolyline.value = null
    }
    
    // 清除当前航点标记
    if (currentWaypointMarker.value) {
      amapInstance.remove(currentWaypointMarker.value)
      currentWaypointMarker.value = null
    }
  }
}

    // 记录上次渲染的任务信息，避免为函数动态挂属性
    const lastWaylineJobId = ref<any>(undefined)
    const lastWaylineTaskStatus = ref<any>(undefined)

    // 显示航点和航线（仅在需要时重绘，避免每次都清空重画）
    const displayWayline = async () => {
  if (!amapInstance || !amapApiRef || !waylineJobDetail.value) {
    return
  }
  
      // 判断是否需要重绘：
      // 若已存在航线或航点且任务未发生变化，不重复清空与重绘
      const hasWaylineDisplay = waylineMarkers.value.length > 0 || waylinePolyline.value
      const currentJobId = waylineProgress.value?.job_id
      const currentTaskStatus = waylineProgress.value?.status
      // 在 Home 页简化：当没有任何显示或任务ID/状态变化时才重绘
      const shouldRedraw = !hasWaylineDisplay || lastWaylineJobId.value !== currentJobId || lastWaylineTaskStatus.value !== currentTaskStatus
      if (!shouldRedraw) {
        // 仅更新当前航点高亮
        updateCurrentWaypoint()
        return
      }
      // 需要重绘时清理旧图层
      clearWaylineDisplay()
  
  try {
    let waylines = waylineJobDetail.value.waylines
    
    if (!waylines || waylines.length === 0) {
      const workspaceId = getCachedWorkspaceId()
      const fileId = waylineJobDetail.value.file_id
      
      if (workspaceId && fileId) {
        try {
          const waylineDetail = await fetchWaylineDetail(workspaceId, fileId)
          waylines = waylineDetail.waylines
        } catch (error) {
          console.error('获取航线文件详情失败:', error)
          return
        }
      } else {
        return
      }
    }
    
    if (!waylines || waylines.length === 0) {
      return
    }
    
    const wayline = waylines[0]
    const waypoints = wayline.waypoints || []
    
    if (waypoints.length === 0) {
      return
    }
    
    // 创建航点标记
    const markers: any[] = []
    const path: [number, number][] = []
    
    waypoints.forEach((waypoint: any, index: number) => {
      const [wgsLng, wgsLat] = waypoint.coordinates || [0, 0]
      
      if (wgsLng && wgsLat) {
        const gcjCoords = transformWGS84ToGCJ02(wgsLng, wgsLat)
        
        // 创建航点标记
        const marker = new amapApiRef.Marker({
          position: [gcjCoords.longitude, gcjCoords.latitude],
          icon: new amapApiRef.Icon({
            size: new amapApiRef.Size(20, 20),
            image: 'data:image/svg+xml;base64,' + btoa(`
              <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="#67d5fd" stroke="#fff" stroke-width="2"/>
                <text x="10" y="13" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">${index + 1}</text>
              </svg>
            `),
            imageSize: new amapApiRef.Size(20, 20)
          }),
          title: `航点 ${index + 1}`
        })
        
        markers.push(marker)
        amapInstance.add(marker)
        path.push([gcjCoords.longitude, gcjCoords.latitude])
      } else {
        // invalid coords, skip
      }
    })
    
    waylineMarkers.value = markers
    
    if (path.length > 1) {
      waylinePolyline.value = new amapApiRef.Polyline({
        path: path,
        strokeColor: '#67d5fd',
        strokeWeight: 3,
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      })
      amapInstance.add(waylinePolyline.value)
      } else {
        // 路径点不足无法创建航线
      }
      // 记录本次渲染对应的任务ID与状态
      lastWaylineJobId.value = currentJobId
      lastWaylineTaskStatus.value = currentTaskStatus
    
    // 显示当前航点
    updateCurrentWaypoint()
    
  } catch (error) {
    console.error('显示航线失败:', error)
  }
}

// 更新当前航点显示
const updateCurrentWaypoint = () => {
  if (!amapInstance || !amapApiRef || !waylineJobDetail.value || !waylineProgress.value) {
    return
  }
  
  // 清除之前的当前航点标记
  if (currentWaypointMarker.value) {
    amapInstance.remove(currentWaypointMarker.value)
    currentWaypointMarker.value = null
  }
  
  const currentWaypointIndex = waylineProgress.value.ext?.current_waypoint_index || 0
  const waylines = waylineJobDetail.value.waylines
  
  if (!waylines || waylines.length === 0) {
    return
  }
  
  const wayline = waylines[0]
  const waypoints = wayline.waypoints || []
  
  if (currentWaypointIndex >= 0 && currentWaypointIndex < waypoints.length) {
    const waypoint = waypoints[currentWaypointIndex]
    const [wgsLng, wgsLat] = waypoint.coordinates || [0, 0]
    
    if (wgsLng && wgsLat) {
      const gcjCoords = transformWGS84ToGCJ02(wgsLng, wgsLat)
      
      // 创建当前航点标记
      currentWaypointMarker.value = new amapApiRef.Marker({
        position: [gcjCoords.longitude, gcjCoords.latitude],
        icon: new amapApiRef.Icon({
          size: new amapApiRef.Size(24, 24),
          image: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#ff4d4f" stroke="#fff" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">${currentWaypointIndex + 1}</text>
            </svg>
          `),
          imageSize: new amapApiRef.Size(24, 24)
        }),
        title: `当前航点 ${currentWaypointIndex + 1}`
      })
      
      amapInstance.add(currentWaypointMarker.value)
    }
  }
}

// 地图定位到无人机标记实际位置
const centerToDroneMarker = () => {
  if (amapInstance && droneMarkers.value.length > 0) {
    const markerPos = droneMarkers.value[0].getPosition();
    amapInstance.setCenter(markerPos);
  }
}

type RobotControlName =
  | 'stand'
  | 'forceControlMode'
  | 'emergencyStop'
  | 'startMove'
  | 'crawl'
  | 'autoMode'
  | 'walkGait'
  | 'obstacleGait'
  | 'slopeGait'
  | 'stairGait'
  | 'stairFollowGait'
  | 'stair45Gait'
  | 'lGait'
  | 'mountainGait'
  | 'quietGait'
  | 'startCharge'
  | 'endCharge'
  | 'resetCharge'

const controlCommandNameMap: Partial<Record<RobotControlName, string>> = {
  stand: 'stand_down',
  forceControlMode: 'power',
  emergencyStop: 'stop',
  startMove: 'action',
  crawl: 'height_down',
  autoMode: 'mode_auto',
  walkGait: 'foot_walk',
  obstacleGait: 'foot_obs',
  slopeGait: 'foot_climb',
  stairGait: 'foot_stair',
  stairFollowGait: 'foot_stair2',
  stair45Gait: 'foot_stair3',
  lGait: 'foot_l',
  mountainGait: 'foot_mountain',
  quietGait: 'foot_silent',
  startCharge: 'charge_start',
  endCharge: 'charge_stop',
  resetCharge: 'charge_clean',
}

const controlButtonLabelMap: Record<RobotControlName, string> = {
  stand: '起立',
  forceControlMode: '力控模式',
  emergencyStop: '急停',
  startMove: '开始运动',
  crawl: '匍匐姿态',
  autoMode: '非手动模式',
  walkGait: '行走步态',
  obstacleGait: '超障步态',
  slopeGait: '斜坡步态',
  stairGait: '楼梯步态',
  stairFollowGait: '帧楼梯步态',
  stair45Gait: '45°楼梯步态',
  lGait: 'L步态',
  mountainGait: '山地步态',
  quietGait: '静音步态',
  startCharge: '开始充电',
  endCharge: '结束充电',
  resetCharge: '重置充电',
}

const isControlRequesting = ref(false)
const getBasicStateCode = (): number | null => {
  const raw = robotStore.motionState?.basic_state
  if (raw == null) return null
  const code = Number(raw)
  return Number.isFinite(code) ? code : null
}

const standControlLabel = computed(() => {
  const basicState = getBasicStateCode()
  return basicState === 2 || basicState === 3 || basicState === 4 || basicState === 16 ? '趴下' : '起立'
})
const moveControlLabel = computed(() => {
  const basicState = getBasicStateCode()
  return basicState === 4 ? '停止运动' : '开始运动'
})
const crawlControlLabel = computed(() => {
  const postureText = robotStore.postureText || ''
  return postureText.includes('匍匐') ? '正常姿态' : '匍匐姿态'
})
const isManualMode = computed(() => (robotStore.rcsData?.rcs_state?.[0] ?? 0) === 0)
const autoModeControlLabel = computed(() => isManualMode.value ? '非手动模式' : '手动模式')

const getControlActionLabel = (controlName: RobotControlName) => {
  if (controlName === 'stand') return standControlLabel.value
  if (controlName === 'startMove') return moveControlLabel.value
  if (controlName === 'crawl') return crawlControlLabel.value
  if (controlName === 'autoMode') return autoModeControlLabel.value
  return controlButtonLabelMap[controlName]
}

const gaitControlSet = new Set<RobotControlName>([
  'walkGait',
  'obstacleGait',
  'slopeGait',
  'stairGait',
  'stairFollowGait',
  'stair45Gait',
  'lGait',
  'mountainGait',
  'quietGait',
])

const allControlNames = Object.keys(controlCommandNameMap) as RobotControlName[]
const allowedGaitsWhenCrouch = new Set<RobotControlName>(['walkGait', 'slopeGait', 'lGait', 'mountainGait', 'quietGait'])
const bodyHeightControlSet = new Set<RobotControlName>(['crawl'])

const canUseStandingControls = (state: number | null) => {
  if (state == null) return false
  return state === 2 || state === 3 || state === 4 || state === 16
}

type RobotControlMode = 'manual' | 'navigation' | 'assist'
type GaitTag = 'walk' | 'slope' | 'obstacle' | 'stair' | 'l' | 'mountain' | 'quiet' | 'unknown'

const getGaitControlNameByState = (gaitState: number | string | null | undefined): RobotControlName | null => {
  if (gaitState == null) return null
  const gaitCode = Number(gaitState)
  if (!Number.isFinite(gaitCode)) return null
  if (gaitCode === 0) return 'walkGait'
  if (gaitCode === 1) return 'obstacleGait'
  if (gaitCode === 2) return 'slopeGait'
  if (gaitCode === 6) return 'stairGait'
  if (gaitCode === 7) return 'stairFollowGait'
  if (gaitCode === 8) return 'stair45Gait'
  if (gaitCode === 32) return 'lGait'
  if (gaitCode === 33) return 'mountainGait'
  if (gaitCode === 34) return 'quietGait'
  return null
}

const getCurrentControlMode = (): RobotControlMode => {
  const navEnabled = robotStore.cmdStatus?.nav === 1
  if (navEnabled) return 'navigation'
  const isManual = (robotStore.rcsData?.rcs_state?.[0] ?? 0) === 0
  return isManual ? 'manual' : 'assist'
}

const getCurrentGaitTag = (): GaitTag => {
  const gaitControlName = getGaitControlNameByState(robotStore.motionState?.gait_state ?? null)
  if (gaitControlName === 'walkGait') return 'walk'
  if (gaitControlName === 'slopeGait') return 'slope'
  if (gaitControlName === 'obstacleGait') return 'obstacle'
  if (gaitControlName === 'stairGait' || gaitControlName === 'stairFollowGait' || gaitControlName === 'stair45Gait') return 'stair'
  if (gaitControlName === 'lGait') return 'l'
  if (gaitControlName === 'mountainGait') return 'mountain'
  if (gaitControlName === 'quietGait') return 'quiet'

  const gaitText = robotStore.gaitText || ''
  if (gaitText.includes('行走')) return 'walk'
  if (gaitText.includes('斜坡')) return 'slope'
  if (gaitText.includes('超障')) return 'obstacle'
  if (gaitText.includes('楼梯') || gaitText.includes('45°')) return 'stair'
  if (gaitText.includes('L')) return 'l'
  if (gaitText.includes('山地')) return 'mountain'
  if (gaitText.includes('静音')) return 'quiet'
  return 'unknown'
}

const getCurrentGaitControlName = (): RobotControlName | null => {
  const gaitControlName = getGaitControlNameByState(robotStore.motionState?.gait_state ?? null)
  if (gaitControlName) return gaitControlName

  const tag = getCurrentGaitTag()
  if (tag === 'walk') return 'walkGait'
  if (tag === 'slope') return 'slopeGait'
  if (tag === 'obstacle') return 'obstacleGait'
  if (tag === 'l') return 'lGait'
  if (tag === 'mountain') return 'mountainGait'
  if (tag === 'quiet') return 'quietGait'
  if (tag === 'stair') {
    const gaitText = robotStore.gaitText || ''
    if (gaitText.includes('45°')) return 'stair45Gait'
    if (gaitText.includes('帧') || gaitText.includes('累积帧')) return 'stairFollowGait'
    return 'stairGait'
  }
  return null
}

const addAllGaitControls = (set: Set<RobotControlName>) => {
  gaitControlSet.forEach(name => set.add(name))
}

const syncCrouchGaitDisabledState = (set: Set<RobotControlName>) => {
  gaitControlSet.forEach(name => {
    if (allowedGaitsWhenCrouch.has(name)) {
      set.delete(name)
      return
    }
    set.add(name)
  })
}

const addCurrentGaitControl = (set: Set<RobotControlName>) => {
  const current = getCurrentGaitControlName()
  if (current) set.add(current)
}

const addManyControls = (set: Set<RobotControlName>, controls: RobotControlName[]) => {
  controls.forEach(control => set.add(control))
}

const disableAllExcept = (...allowed: RobotControlName[]) => {
  const disabled = new Set<RobotControlName>(allControlNames)
  allowed.forEach(control => disabled.delete(control))
  return disabled
}

const getControlStateSnapshot = () => {
  const basicState = getBasicStateCode()
  const mode = getCurrentControlMode()
  const postureText = robotStore.postureText || ''
  const gaitTag = getCurrentGaitTag()
  const currentGaitControl = getCurrentGaitControlName()
  const chargeActive = robotStore.cmdStatus?.charge === 1
  const dockCharging = isRobotCharging.value

  return {
    mode,
    basicState,
    isForce: basicState === 3,
    isMoving: basicState === 4,
    isDown: basicState === 0 || basicState === 6,
    isStandingState: basicState === 2 || basicState === 3 || basicState === 4 || basicState === 16,
    isCrouch: postureText.includes('匍匐'),
    gaitTag,
    currentGaitControl,
    chargeActive,
    dockCharging,
  }
}

// 按产品文档生成“置灰按钮集合”（在基础安全规则之上叠加）
const getDocDisabledControls = (): Set<RobotControlName> => {
  const disabled = new Set<RobotControlName>()
  const state = getControlStateSnapshot()

  if (state.isDown) {
    return disableAllExcept('stand', 'startCharge', 'autoMode')
  }

  if (!state.isForce) {
    if (state.mode === 'manual' && !state.isCrouch && state.isStandingState && !state.isMoving) {
      const keepGaitSwitchable =
        state.gaitTag === 'l' ||
        state.gaitTag === 'mountain' ||
        state.gaitTag === 'quiet'
      if (!keepGaitSwitchable) {
        addAllGaitControls(disabled)
      }
      disabled.add('stand')
      return disabled
    }
    return disabled
  }

  if (state.mode === 'manual' && !state.isCrouch && state.gaitTag === 'walk' && state.chargeActive && state.dockCharging) {
    return disableAllExcept('stand', 'endCharge')
  }

  if (state.mode === 'manual') {
    if (!state.isCrouch) {
      disabled.add('forceControlMode')
      disabled.add('stand')

      if (!state.isMoving) {
        addAllGaitControls(disabled)
        return disabled
      }

      disabled.add('startMove')
      if (state.gaitTag === 'walk') {
        disabled.add('walkGait')
        return disabled
      }
      if (state.gaitTag === 'slope') {
        disabled.add('slopeGait')
        return disabled
      }
      if (state.gaitTag === 'obstacle') {
        disabled.add('obstacleGait')
        return disabled
      }
      if (state.gaitTag === 'stair') {
        addCurrentGaitControl(disabled)
        return disabled
      }
      if (state.gaitTag === 'l') {
        disabled.add('lGait')
        disabled.add('startCharge')
        disabled.add('endCharge')
        return disabled
      }
      if (state.gaitTag === 'mountain') {
        disabled.add('mountainGait')
        disabled.add('startCharge')
        disabled.add('endCharge')
        return disabled
      }
      if (state.gaitTag === 'quiet') {
        disabled.add('quietGait')
        disabled.add('startCharge')
        disabled.add('endCharge')
        return disabled
      }

      addAllGaitControls(disabled)
      return disabled
    }

    disabled.add('forceControlMode')
    disabled.add('stand')

    if (!state.isMoving) {
      syncCrouchGaitDisabledState(disabled)
      return disabled
    }

    syncCrouchGaitDisabledState(disabled)
    disabled.add('crawl')
    disabled.add('startMove')
    if (state.chargeActive) {
      disabled.add('startCharge')
    }
    return disabled
  }

  if (state.mode === 'navigation') {
    if (!state.isCrouch) {
      if (!state.isMoving) {
        addManyControls(disabled, ['forceControlMode', 'startCharge', 'endCharge', 'stand'])
        addAllGaitControls(disabled)
        return disabled
      }

      disabled.add('forceControlMode')
      disabled.add('startMove')
      if (state.gaitTag === 'walk') {
        disabled.add('walkGait')
        if (state.chargeActive) {
          disabled.add('startCharge')
        }
        return disabled
      }

      addAllGaitControls(disabled)
      return disabled
    }

    addManyControls(disabled, ['forceControlMode', 'startCharge', 'endCharge', 'crawl', 'startMove'])
    syncCrouchGaitDisabledState(disabled)
    return disabled
  }

  if (!state.isCrouch) {
    disabled.add('forceControlMode')
    disabled.add('stand')

    if (!state.isMoving) {
      addAllGaitControls(disabled)
      return disabled
    }

    disabled.add('startMove')
    if (state.gaitTag === 'walk') {
      disabled.add('walkGait')
      if (state.chargeActive) {
        disabled.add('startCharge')
      }
      return disabled
    }
    if (state.gaitTag === 'slope') {
      disabled.add('slopeGait')
      return disabled
    }
    if (state.gaitTag === 'obstacle') {
      disabled.add('obstacleGait')
      return disabled
    }
    if (state.gaitTag === 'stair') {
      addCurrentGaitControl(disabled)
      return disabled
    }
    if (state.gaitTag === 'l') {
      disabled.add('lGait')
      disabled.add('startCharge')
      disabled.add('endCharge')
      return disabled
    }
    if (state.gaitTag === 'mountain') {
      disabled.add('mountainGait')
      disabled.add('startCharge')
      disabled.add('endCharge')
      return disabled
    }
    if (state.gaitTag === 'quiet') {
      disabled.add('quietGait')
      disabled.add('startCharge')
      disabled.add('endCharge')
      return disabled
    }

    addAllGaitControls(disabled)
    return disabled
  }

  disabled.add('forceControlMode')
  disabled.add('crawl')

  if (!state.isMoving) {
    syncCrouchGaitDisabledState(disabled)
    disabled.add('startCharge')
    disabled.add('endCharge')
    return disabled
  }
  
  syncCrouchGaitDisabledState(disabled)
  disabled.add('startMove')
  if (state.chargeActive) {
    disabled.add('startCharge')
  }
  return disabled
}

const isControlEnabled = (controlName: RobotControlName) => {
  if (isControlRequesting.value) return false
  if (!robotStore.isOnline) return false
  if (!controlCommandNameMap[controlName]) return false

  const basicState = getBasicStateCode()
  const isRobotStatusStateMissing = basicState == null
  let baseEnabled = false

  if (controlName === 'stand') {
    // 运动中（basic_state=4）禁止趴下，需先停止运动
    baseEnabled = basicState === 0 || basicState === 2 || basicState === 3 || basicState === 6 || basicState === 16
  } else if (controlName === 'crawl') {
    baseEnabled = canUseStandingControls(basicState)
    if (baseEnabled && getCurrentControlMode() !== 'manual') {
      // 匍匐姿态仅允许在手动模式下切换
      baseEnabled = false
    }
  } else if (controlName === 'startMove') {
    // 开始运动仅允许在力控模式进入；踏步状态下保留“停止运动”可点击
    baseEnabled = basicState === 3 || basicState === 4
  } else if (controlName === 'forceControlMode') {
    const isLGait = getCurrentGaitTag() === 'l'
    // basic_state=3(力控) 或 4(踏步) 时，力控模式按钮均置灰
    // L行走步态下允许点击力控模式
    baseEnabled = canUseStandingControls(basicState) && (isLGait || (basicState !== 3 && basicState !== 4))
  } else if (controlName === 'autoMode') {
    baseEnabled = basicState === 0 || basicState === 2 || basicState === 3 || basicState === 4 || basicState === 6 || basicState === 16
  } else if (gaitControlSet.has(controlName)) {
    baseEnabled = canUseStandingControls(basicState)
    const currentGaitControl = getCurrentGaitControlName()
    const isCrouchHeight = (robotStore.postureText || '').includes('匍匐')
    if (baseEnabled && !isCrouchHeight && basicState !== 4 && currentGaitControl === controlName) {
      // 当前步态按钮固定置灰（含 gait_state=0 时行走步态）
      baseEnabled = false
    }
  } else if (controlName === 'startCharge' || controlName === 'endCharge' || controlName === 'resetCharge') {
    if (isRobotStatusStateMissing && (controlName === 'startCharge' || controlName === 'resetCharge')) {
      return false
    }
    baseEnabled = basicState !== 1 && basicState !== 5
    if (controlName === 'startCharge') {
      // 以电流正负判断是否充电：current>0 视为充电中，此时禁止“开始充电”
      baseEnabled = baseEnabled && !isRobotCharging.value
    } else if (controlName === 'endCharge') {
      // 充电中或电量100%均允许“结束充电”
      baseEnabled = baseEnabled && (isRobotCharging.value || isRobotBatteryFull.value)
    }
  } else if (controlName === 'emergencyStop') {
    if (isRobotStatusStateMissing) {
      return false
    }
    baseEnabled = basicState !== 6
  } else {
    baseEnabled = false
  }
  if (!baseEnabled) return false

  if (controlName === 'startCharge' || controlName === 'endCharge') {
    // 充电按钮不受文档规则分支额外置灰，统一按电流正负控制
    return true
  }
  if (controlName === 'forceControlMode' && getCurrentGaitTag() === 'l') {
    return true
  }

  const docDisabledControls = getDocDisabledControls()
  if (controlName === 'stand') return true
  return !docDisabledControls.has(controlName)
}

const isControlDisabled = (controlName: RobotControlName) => !isControlEnabled(controlName)

const getControlButtonClass = (controlName: RobotControlName, isEmergency = false) => {
  const enabled = isControlEnabled(controlName)
  return ['control-button', enabled ? 'active' : 'disabled', isEmergency && enabled ? 'emergency' : '']
}

const getControlRuleViolationMessage = (controlName: RobotControlName): string | null => {
  const postureText = robotStore.postureText || ''
  const isCrouchHeight = postureText.includes('匍匐')
  if (isCrouchHeight && gaitControlSet.has(controlName) && !allowedGaitsWhenCrouch.has(controlName)) {
    return '当前为匍匐高度，仅支持行走步态、斜坡步态、L步态、山地步态、静音步态'
  }

  const gaitText = robotStore.gaitText || ''
  const isLimitedGait = gaitText.includes('L行走') || gaitText.includes('山地') || gaitText.includes('静音')
  if (isLimitedGait && bodyHeightControlSet.has(controlName)) {
    return '当前步态不支持更改机器人身体高度与地形模式'
  }

  return null
}

// 机器人控制按钮点击处理
const handleControlClick = async (controlName: RobotControlName) => {
  const postureText = robotStore.postureText || ''
  const commandName = controlName === 'crawl'
    ? (postureText.includes('匍匐') ? 'height_normal' : 'height_down')
    : controlName === 'autoMode'
      ? (isManualMode.value ? 'mode_auto' : 'mode_manual')
      : controlCommandNameMap[controlName]
  if (!commandName) {
    showError('该控制项暂未接入后端指令')
    return
  }

  if (!isControlEnabled(controlName)) {
    const currentStateText = robotStore.robotStatusText || '--'
    showError(`当前状态（${currentStateText}）下该操作不可用`)
    return
  }

  const ruleViolationMessage = getControlRuleViolationMessage(controlName)
  if (ruleViolationMessage) {
    showError(ruleViolationMessage)
    return
  }

  const robotId = deviceStore.selectedRobotId
  if (!robotId) {
    showError('未选择机器人，无法发送控制指令')
    return
  }

  isControlRequesting.value = true
  try {
    await dogApi.sendCommand(robotId, { command_name: commandName })
    showSuccess(`${getControlActionLabel(controlName)}指令已发送`)
  } catch (error) {
    showError(`指令发送失败: ${parseErrorMessage(error)}`)
  } finally {
    isControlRequesting.value = false
  }
}


// 监听选中的机器人ID变化
watch(() => deviceStore.selectedRobotId, async (newId, oldId) => {
  if (!newId) return
  const isRobotSwitched = oldId !== undefined && newId !== oldId

  // 切换机器人时，先清空下拉数据，避免短暂显示上一台机器人的缓存
  if (isRobotSwitched) {
    selectedMap.value = ''
    selectedTrack.value = ''
    selectedPointTask.value = ''
    selectedMultiTask.value = ''
    mapList.value = []
    trackList.value = []
    pointTaskList.value = []
    multiTaskList.value = []
  }

  await Promise.all([
    fetchDeviceStatus(newId),
    fetchMapList(newId)
  ])
}, { immediate: true })

// 监听 selectedRobot 对象的变化（修复首次登录数据不显示的问题）
// 当 Layout.vue 加载完机器人列表后，selectedRobot 会从 undefined 变为有值
watch(() => deviceStore.selectedRobot, async (newRobot, oldRobot) => {
  // 从无到有，说明机器人列表刚加载完成，此时触发首次数据加载
  if (newRobot && !oldRobot) {
    
    // 加载所有列表数据
    await fetchMapList(newRobot.robot_id)
    await fetchTrackList()
    await fetchPointTaskList()
    await fetchMultiTaskList()
    
    // 如果已经有选中的地图，触发刷新
    if (selectedMap.value) {
      await nextTick()
      const updateTime = mapUpdateTimeMap.value[selectedMap.value] || ''
      await downloadMapFiles(selectedMap.value, updateTime)
      await refreshPointCloud()
    }
  }
}, { immediate: false })

onMounted(async () => {
  // 首次挂载时：如果 robot 已就绪（刷新页面直接进来的情况），加载列表并初始化
  // 视频初始化由 robot-camera-ready 事件处理，此处只做列表与点云兜底
  if (deviceStore.selectedRobot) {
    if (mapList.value.length === 0) await fetchMapList(deviceStore.selectedRobot.robot_id)
    if (trackList.value.length === 0) await fetchTrackList()
    if (pointTaskList.value.length === 0) await fetchPointTaskList()
    if (multiTaskList.value.length === 0) await fetchMultiTaskList()

    if (selectedMap.value) {
      // 点云加载后台并行执行，避免影响视频首帧启动
      void (async () => {
        await nextTick()
        const updateTime = mapUpdateTimeMap.value[selectedMap.value] || ''
        await downloadMapFiles(selectedMap.value, updateTime)
        await refreshPointCloud()
      })()
    }
  }
})

// 从其他页面切回首页时（keep-alive 缓存，onMounted 不再重复执行）
onActivated(async () => {
  isHomePageActive.value = true
  if (!hasHomeActivatedOnce) {
    hasHomeActivatedOnce = true
    // 首次激活也执行一次视频恢复兜底，避免错过 robot-camera-ready 事件时首屏无流
    if (deviceStore.selectedRobot) {
      void recoverVideoStreamsOnForeground()
    }
    return
  }
  if (deviceStore.selectedRobot) {
    // 重新拉取循迹列表，确保数据最新（接口失败时自动回退到缓存）
    await fetchTrackList()
    await recoverVideoStreamsOnForeground()

    if (selectedMap.value) {
      await nextTick()
      await refreshPointCloud({ silent: true })
    }
  }
})

onDeactivated(() => {
  isHomePageActive.value = false
})

const recoverVideoStreamsOnForeground = async () => {
  if (foregroundRecoverRunning) return
  if (!isHomePageActive.value) return
  if (document.hidden) return
  if (!deviceStore.selectedRobot) return

  foregroundRecoverRunning = true
  try {
    // 与 onActivated 保持一致：先清理旧重连状态，避免并发冲突。
    clearWebRTCReconnectTimer()
    clearInfraredReconnectTimer()
    clearWebRTCFreezeDetection()
    clearInfraredFreezeDetection()
    webrtcReconnectCount = 0
    infraredReconnectCount = 0
    webrtcReconnecting.value = false
    infraredReconnecting.value = false

    const mainConnAlive = pc !== null
      && (pc.connectionState === 'connected' || pc.connectionState === 'connecting')
      && videoElement.value !== null

    const infraredConnAlive = infraredPc !== null
      && (infraredPc.connectionState === 'connected' || infraredPc.connectionState === 'connecting')

    if (!mainConnAlive || !infraredConnAlive) {
      const robotId = deviceStore.selectedRobot.robot_id
      const hasCachedStreamUrls = hasBothCameraStreamUrls(robotId)
      const shouldRefreshStreams =
        !isCameraInitRunning
        && !hasCachedStreamUrls
        && (Date.now() - lastCameraInitSuccessAt > CAMERA_STREAM_REFRESH_COOLDOWN_MS)
      if (shouldRefreshStreams) {
        await initCameraStreams()
        lastCameraInitSuccessAt = Date.now()
      }
    }

    if (!mainConnAlive) {
      initVideoPlayer()
      await nextTick()
      if (videoStreamUrl.value) startVideoPlayback()
    } else if (videoElement.value && videoElement.value.paused) {
      videoElement.value.play().catch(() => {})
    }

    if (!infraredConnAlive) {
      initInfraredVideo()
      await nextTick()
      if (infraredStreamUrl.value) startInfraredPlayback()
    } else if (infraredVideoElement.value && infraredVideoElement.value.paused) {
      infraredVideoElement.value.play().catch(() => {})
    }
  } finally {
    foregroundRecoverRunning = false
  }
}

const scheduleForegroundRecover = () => {
  if (foregroundRecoverTimer) return
  // 聚合 visibilitychange/focus/pageshow 的连续触发，避免重复重连。
  foregroundRecoverTimer = setTimeout(() => {
    foregroundRecoverTimer = null
    recoverVideoStreamsOnForeground()
  }, 250)
}

const handleVisibilityChange = () => {
  if (!document.hidden) {
    scheduleForegroundRecover()
  }
}

const handleWindowFocus = () => {
  if (!document.hidden) {
    scheduleForegroundRecover()
  }
}

const handlePageShow = () => {
  if (!document.hidden) {
    scheduleForegroundRecover()
  }
}

</script>

<style scoped>
/* 航线选择器样式 */
.wayline-select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.wayline-select {
  width: 100%;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 8px;
  font-size: 12px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 24px;
  cursor: pointer;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
}

.wayline-select:focus {
  outline: none;
  border: 1.5px solid #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.wayline-select:disabled {
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

.wayline-select:disabled + .wayline-custom-arrow svg polygon {
  fill: rgba(168, 192, 210, 0.5);
}

.wayline-select option {
  background: #172233;
  color: #fff;
  border: none;
}

.wayline-custom-arrow {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.wayline-custom-arrow svg {
  width: 100%;
  height: 100%;
}

/* 下发任务弹窗样式 */
.dispatch-task-modal {
  display: flex;
  background: #172233;
  border-radius: 12px;
  box-shadow: 0 4px 24px #0008;
  overflow: hidden;
  width: 90%;
  max-width: 420px;
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
  font-size: 22px;
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
  gap: 10px;
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
  animation: task-btn-spin 0.7s linear infinite;
}

.track-init-text {
  color: #d7f5ff;
  font-size: 16px;
  font-weight: 500;
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

.dispatch-task-row label {
  font-size: 14px;
  color: #b8c7d9;
  min-width: 90px;
  text-align: right;
}

.dispatch-task-input {
  flex: 1;
  min-width: 0;
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

/* 首页启动循迹任务弹窗：与循迹任务页面保持一致 */
.track-start-modal {
  max-width: 460px !important;
  width: 88% !important;
}

.track-start-modal .dispatch-task-modal-content {
  padding: 22px 26px !important;
}

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

.custom-select-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
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

/* 下拉选项样式 - 参考mission-common.css */
.mission-select,
.mission-select option {
  background: #16213a !important;
  color: #fff !important;
  border: none !important;
}

/* 下拉选项悬停和选中状态 */
.mission-select option:hover {
  background: #223a5e !important;
  color: #67d5fd !important;
}

.mission-select option:checked {
  background: #164159 !important;
  color: #67d5fd !important;
}

/* Webkit浏览器的下拉选项样式 */
.mission-select::-webkit-listbox {
  background: #16213a !important;
}

.mission-select::-webkit-option {
  background: #16213a !important;
  color: #fff !important;
}

.mission-select::-webkit-option:hover {
  background: #223a5e !important;
  color: #67d5fd !important;
}

.mission-select::-webkit-option:checked {
  background: #164159 !important;
  color: #67d5fd !important;
}

/* Firefox浏览器的下拉选项样式 */
.mission-select:-moz-focusring {
  color: transparent;
  text-shadow: 0 0 0 #fff;
}

.mission-select:-moz-listbox {
  background: #16213a !important;
}

.mission-select:focus {
  outline: none;
  border: 1.5px solid #67d5fd;
  box-shadow: 0 0 0 2px rgba(103, 213, 253, 0.15);
}

.mission-select:disabled {
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

/* 巡检告警图片样式 */
.target-image-small {
  max-width: 40px;
  max-height: 30px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
  border: 1px solid #164159;
  display: block;
  margin: 0 auto;
}

.target-image-small:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(103, 213, 253, 0.3);
}

/* ---- 首页告警表格单元格样式 ---- */
/* 相机名称标签 */
.alarm-camera-tag {
  display: inline-block;
  max-width: 95%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(103, 213, 253, 0.08);
  color: #67d5fd;
  border: 1px solid rgba(103, 213, 253, 0.22);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 11px;
  vertical-align: middle;
}
/* 警情类型标签 */
.alarm-type-tag {
  display: inline-block;
  max-width: 95%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(100, 160, 240, 0.08);
  color: #9ec3f0;
  border: 1px solid rgba(100, 160, 240, 0.2);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 11px;
  vertical-align: middle;
}
/* 内容标签 */
.alarm-content-tag {
  display: inline-block;
  max-width: 95%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(255, 143, 100, 0.1);
  color: #ff9f6b;
  border: 1px solid rgba(255, 143, 100, 0.25);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 11px;
  vertical-align: middle;
}
/* 时间双行 */
.alarm-date-part {
  display: block;
  color: #7fa8c2;
  font-size: 10px;
  line-height: 1.5;
  white-space: nowrap;
}
.alarm-clock-part {
  display: block;
  color: #67d5fd;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}
/* 空值占位 */
.alarm-empty {
  color: rgba(255,255,255,0.2);
}

.loading-image-small {
  width: 40px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a2a3a;
  border: 1px solid #164159;
  border-radius: 4px;
  font-size: 8px;
  color: #67d5fd;
  text-align: center;
  line-height: 1.2;
}

.no-image {
  color: #666;
  font-size: 12px;
}

/* 调整巡检告警表格列宽 */
/* 巡检告警列宽 - 使用百分比布局 */
.tableOne th:nth-child(1),
.tableOne td:nth-child(1) {
  width: 13%;
}

.tableOne th:nth-child(2),
.tableOne td:nth-child(2) {
  width: 19%;
}

.tableOne th:nth-child(3),
.tableOne td:nth-child(3) {
  width: 10%;
  text-align: center;
}

.tableOne th:nth-child(4),
.tableOne td:nth-child(4) {
  width: 22%;
}

.tableOne th:nth-child(5),
.tableOne td:nth-child(5) {
  width: 16%;
}

.tableOne th:nth-child(6),
.tableOne td:nth-child(6) {
  width: 20%;
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
  margin-top: 24px;
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

.dispatch-task-actions .mission-btn-pause.disabled {
  background: #2a3f51;
  color: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.dispatch-task-actions .mission-btn-pause.disabled:hover {
  background: #2a3f51;
  box-shadow: none;
}

.custom-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.fall-alert-frame {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2100;
}

.fall-alert-edge {
  position: absolute;
  background: linear-gradient(90deg, rgba(255, 84, 84, 0) 0%, rgba(255, 84, 84, 0.95) 50%, rgba(255, 84, 84, 0) 100%);
  box-shadow: 0 0 18px rgba(255, 60, 60, 0.65);
  animation: fall-alert-pulse 0.9s ease-in-out infinite;
}

.fall-alert-edge.top,
.fall-alert-edge.bottom {
  left: 0;
  width: 100%;
  height: 8px;
}

.fall-alert-edge.left,
.fall-alert-edge.right {
  top: 0;
  width: 8px;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 84, 84, 0) 0%, rgba(255, 84, 84, 0.95) 50%, rgba(255, 84, 84, 0) 100%);
}

.fall-alert-edge.top { top: 0; }
.fall-alert-edge.right { right: 0; }
.fall-alert-edge.bottom { bottom: 0; }
.fall-alert-edge.left { left: 0; }

.fall-alert-mask {
  z-index: 2200;
  background: rgba(16, 0, 0, 0.48);
}

.fall-alert-dialog {
  width: min(460px, calc(100vw - 32px));
  border-radius: 14px;
  border: 1px solid rgba(255, 107, 107, 0.45);
  background: linear-gradient(180deg, rgba(52, 10, 10, 0.98) 0%, rgba(24, 9, 9, 0.98) 100%);
  box-shadow: 0 22px 56px rgba(0, 0, 0, 0.45), 0 0 36px rgba(255, 80, 80, 0.18);
  overflow: hidden;
}

.fall-alert-title {
  padding: 18px 22px 10px;
  font-size: 24px;
  font-weight: 700;
  color: #ff8d8d;
  text-align: center;
  letter-spacing: 1px;
}

.fall-alert-body {
  padding: 0 22px 10px;
}

.fall-alert-message {
  color: #ffe5e5;
  font-size: 15px;
  line-height: 1.7;
  text-align: center;
}

.fall-alert-metrics {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  display: grid;
  gap: 8px;
  color: rgba(255, 230, 230, 0.88);
  font-size: 13px;
}

.fall-alert-actions {
  display: flex;
  justify-content: center;
  padding: 0 22px 22px;
}

.fall-alert-actions .confirm-btn-ok {
  min-width: 132px;
  background: linear-gradient(180deg, #ff6f6f 0%, #e34747 100%);
  box-shadow: 0 10px 24px rgba(227, 71, 71, 0.28);
}

@keyframes fall-alert-pulse {
  0%, 100% {
    opacity: 0.35;
    filter: saturate(0.85);
  }
  50% {
    opacity: 1;
    filter: saturate(1.2);
  }
}

.home-container {
  display: grid;
  grid-template-columns: clamp(280px, 28vw, 480px) 1fr clamp(280px, 28vw, 480px);
  gap: 12px;
  padding: 20px;
  height: calc(100vh - 84px); /* 64px导航栏 + 20px间距 */
  background-color: #0a0f1c;
  color: #fff;
  box-sizing: border-box;
  position: fixed;
  top: 84px; /* 64px导航栏 + 20px间距 */
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
}

/* 左侧列样式 */
.left-box {
  display: grid;
  grid-template-rows: 3.5fr 3.5fr 3fr;
  height: calc(100vh - 124px); /* 64px导航栏 + 20px间距 + 40px内边距 */
  overflow-y: auto;
  width: clamp(280px, 28vw, 480px);
  gap: 20px; /* 统一卡片间距 */
}

.left-box > * {
  min-height: 0;
}

.left-box .left-video-card,
.left-box .left-on3 {
  min-height: 0;
}

/* 自定义滚动条样式 */
.left-box::-webkit-scrollbar {
  width: 4px;
}

.left-box::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.left-box::-webkit-scrollbar-thumb {
  background: rgba(0, 168, 255, 0.3);
  border-radius: 2px;
}

.left-box::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 168, 255, 0.5);
}

/* 左侧卡片通用样式 */
.left-on1, .left-on2, .left-on3 {
  overflow: hidden;
  margin-bottom: 0; /* 移除margin-bottom，使用gap控制间距 */
}

.left-on1 {
  width: 100%;
  height: calc((100vh - 124px) * 0.333 - 20px);
  background-image: url('@/assets/source_data/bg_data/card_first_body.png');
  background-size: 100% 100%;
}

.left-on2 {
  width: 100%;
  height: calc((100vh - 124px) * 0.333 - 20px);
  background-image: url('@/assets/source_data/bg_data/card_first_body.png');
  background-size: 100% 100%;
}

.left-on3 {
  width: 100%;
  background-image: url('@/assets/source_data/bg_data/card_first_body.png');
  background-size: 100% 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cardTitle {
  width: calc(100% - 10px);
  height: 41px;
  display: flex;
  justify-content: start;
  align-items: center;
  padding-left: 10px;
  background-image: url('@/assets/source_data/bg_data/card_title.png');
  background-size: 100% 100%;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  flex-shrink: 0;
}

.cardTitle img {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.on1-bottom, .on2-bottom, .on3-bottom, .on4-bottom {
  width: 100%;
  padding: 0 20px;
  height: calc(100% - 41px);
  position: relative;
  box-sizing: border-box;
}

/* 顶部区域 */
.b-top {
  width: 100%;
  flex: 1.5;
  display: flex;
  margin: 0;
  min-height: 0;
}

.b-top-left {
  width: 60%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  position: relative;
  gap: clamp(10px, 2vw, 20px);
}

.b-top-right {
  width: 40%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.zhuangtai4 {
  width: 45%;
  height: 75%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  background: linear-gradient(270deg, #0187bf00, #0187bf66);
}

.zhuangtai4 > div {
  width: 64px;
  height: 68px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #c6c7c7;
  font-size: 14px;
  font-weight: 500;
  background: url('@/assets/source_data/status.png') no-repeat;
  background-size: 100% 100%;
}

.zhuangtai4 > div.robot-status-online {
  color: #22c55e;
}

.zhuangtai4 > div.robot-status-offline {
  color: #ef4444;
}

.img {
  width: 55%;
  aspect-ratio: 100/100;
  max-width: 100px;
  max-height: 100px;
  margin-left: 10px;
}

.img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.b-top-rightCard {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding-right: 5px;
  padding-top: 0;
  gap: 4px;
}

.b-top-rightDiv {
  width: 85%;
  min-height: 30px;
  height: auto;
  border-radius: 8px;
  background: linear-gradient(270deg, #0187bf4d, #0187bf00);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #d4edfd;
  padding: 4px 0;
}

.b-top-rightDiv img {
  width: clamp(34px, 2.6vw, 40px);
  height: clamp(34px, 2.6vw, 40px);
  margin-right: 8px;
  object-fit: contain;
  flex-shrink: 0;
}

.b-top-rightDiv .metric-icon {
  display: block;
  transform-origin: center center;
}

.b-top-rightDiv .metric-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.b-top-rightDiv .metric-icon-battery-wrap .metric-icon-battery {
  margin-right: 0;
}

.b-top-rightDiv .metric-icon-speed {
  transform: scale(1.02);
}

.b-top-rightDiv .metric-icon-battery {
  transform: scale(1.02) translateY(1px);
}

.b-top-rightDiv .metric-icon-mileage {
  transform: scale(1.18) translateY(-2px);
}

.b-top-rightDiv .charging-text {
  display: none;
}

.b-top-rightDiv p.battery-value-line {
  display: inline-flex !important;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  gap: 2px;
  line-height: 1;
}

.b-top-rightDiv .battery-percent-charging {
  color: #5FEA94;
}

.b-top-rightDiv .charging-lightning-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(12px, 1.05vw, 14px);
  height: clamp(12px, 1.05vw, 14px);
  z-index: 2;
  filter: drop-shadow(0 0 3px rgba(0, 255, 102, 0.95)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.8));
  animation: chargingLightningBlink 0.9s steps(1, end) infinite;
  pointer-events: none;
}

@keyframes chargingLightningBlink {
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}

.b-top-rightDiv p:first-child {
  color: #d4edfd;
  font-size: clamp(12px, 1vw, 14px);
  font-weight: 600;
  margin-bottom: 2px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
  display: inline-block;
  min-width: 9ch;
  white-space: nowrap;
}

.b-top-rightDiv p:last-child {
  color: rgba(212, 237, 253, 0.7);
  font-size: clamp(9px, 0.75vw, 10px);
  line-height: 1;
}

.b-top-rightDiv .icon-back {
  width: 24px;
  height: 24px;
  color: #00a8ff;
}

/* 底部区域 */
.b-bottom {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  margin-top: 8px;
}

.status-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px 10px;
  padding: 0 10px;
  align-items: center;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  justify-content: center;
  min-width: 0;
}

.status-item .top-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
}

.status-item img {
  width: clamp(16px, 2vw, 18px);
  height: clamp(16px, 2vw, 18px);
  filter: brightness(0) saturate(100%) invert(69%) sepia(28%) saturate(469%) hue-rotate(169deg) brightness(91%) contrast(87%);
}

.status-item .label {
  color: rgba(212, 237, 253, 0.8);
  font-size: clamp(9px, 0.7vw, 10px);
  font-weight: 500;
}

.status-item .value {
  color: #d4edfd;
  font-size: clamp(8px, 0.7vw, 10px);
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.icon-back {
  width: 16px;
  height: 16px;
}



.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(0, 168, 255, 0.1);
  border-radius: 8px;
  padding: 12px 8px;
}

.grid-item .icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.grid-item .value {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

/* 下拉框样式 */
.el-select {
  width: 190px;
  border: 1px rgba(201, 59, 59, 0) solid;
  display: inline-block;
  position: relative;
  vertical-align: middle;
}

.el-select__wrapper {
  width: 190px;
  height: 32px;
  background-color: transparent;
  box-shadow: 0 0 0 1px #164159 inset;
  align-items: center;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  font-size: 14px;
  gap: 6px;
  line-height: 24px;
  padding: 4px 12px;
  position: relative;
  text-align: left;
}

.el-select__selection {
  flex: 1;
  position: relative;
}

.el-select__placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.el-select__suffix {
  display: flex;
  align-items: center;
}

.el-select__caret {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  height: 16px;
  width: 16px;
  display: inline-flex;
}

.el-select__caret svg {
  height: 100%;
  width: 100%;
}

/* 巡检点样式 */
.on2-bottom-center {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
}

.fabu {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fabu .div {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  min-width: 60px;
}

.fabu .span {
  background: rgba(0, 168, 255, 0.1);
  border: 1px solid #00a8ff;
  color: #00a8ff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
}

.fabu .span:hover {
  background: rgba(0, 168, 255, 0.2);
}

.fabu .span1 {
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
}

.fabu .span1:hover {
  background: rgba(255, 77, 79, 0.2);
}

/* 任务下发样式 */
.on3-bottom-center {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2vh, 15px);
  height: 100%;
  padding: clamp(5px, 1vh, 10px) 0;
  justify-content: flex-start;
}

.task-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.map-selector-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.map-label {
  color: #67d5fd;
  font-size: 14px;
  white-space: nowrap;
}

.map-select-wrapper {
  position: relative;
  min-width: 120px;
}

.map-select {
  width: 100%;
  height: 32px;
  padding: 0 25px 0 10px;
  background: rgba(12, 60, 86, 0.5);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 4px;
  color: #67d5fd;
  font-size: 12px;
  cursor: pointer;
  appearance: none;
  outline: none;
  transition: all 0.3s;
}

.map-select:hover {
  border-color: rgba(103, 213, 253, 0.6);
  background: rgba(12, 60, 86, 0.7);
}

.map-select option {
  background: #0c3c56;
  color: #67d5fd;
}

.map-select:disabled {
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

.map-select:disabled + .map-custom-arrow svg polygon {
  fill: rgba(168, 192, 210, 0.5);
}

.map-custom-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.map-custom-arrow svg polygon {
  fill: #67d5fd;
}

.task-button-group {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}

.task-toggle-button {
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 4px;
  background: #0c3c56;
  color: #67d5fd;
  font-size: 12px;
  border: 1px solid rgba(38, 131, 182, 0.4);
  cursor: pointer;
  transition: all 0.3s;
}

.task-toggle-button:hover {
  background: #0c4666;
  border-color: rgba(103, 213, 253, 0.8);
}

.task-button-group .task-toggle-button {
  flex: none;
  min-width: 70px;
  padding: 0 12px;
}

/* 任务行样式 */
.task-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  justify-content: space-between;
}

.map-dropdown-wrapper {
  position: relative;
  flex: 0 0 auto;
  width: 220px;
}

.map-dropdown {
  width: 100%;
  height: 32px;
  padding: 0 30px 0 12px;
  background: rgba(12, 60, 86, 0.6);
  border: 1px solid rgba(103, 213, 253, 0.3);
  border-radius: 4px;
  color: #67d5fd;
  font-size: 13px;
  cursor: pointer;
  appearance: none;
  outline: none;
  transition: all 0.3s;
}

.map-dropdown:hover {
  border-color: rgba(103, 213, 253, 0.6);
  background: rgba(12, 60, 86, 0.8);
}

.map-dropdown:disabled,
.map-dropdown-wrapper.disabled .map-dropdown {
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
.map-dropdown-wrapper.disabled .map-dropdown:hover {
  border-color: rgba(103, 213, 253, 0.3);
  background:
    linear-gradient(180deg, rgba(12, 60, 86, 0.42) 0%, rgba(10, 42, 58, 0.52) 100%);
}
.map-dropdown-wrapper.disabled .dropdown-arrow svg polygon {
  fill: rgba(168, 192, 210, 0.5);
}

.map-dropdown option {
  background: #0c3c56;
  color: #67d5fd;
}

/* 地图下拉列表滚动条（支持 WebKit/Chromium 的可样式化场景） */
.map-dropdown {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.map-dropdown::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}

.map-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.map-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.map-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.dropdown-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.task-buttons {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}

.task-btn {
  min-width: 65px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  padding: 0 14px;
  background: #0c3c56;
  border-radius: 4px;
  border: 1px solid rgba(38, 131, 182, 0.4);
  color: #67d5fd;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.task-btn:hover {
  background: #0c4666;
  border-color: rgba(103, 213, 253, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(103, 213, 253, 0.2);
}

.task-btn:active {
  transform: translateY(0);
}

/* 激活状态 - 红色 */
.task-btn.active {
  background: #c62828;
  border-color: #ff5252;
  color: #fff;
  box-shadow: 0 0 10px rgba(198, 40, 40, 0.5);
}

.task-btn.active:hover {
  background: #d32f2f;
  border-color: #ff6666;
  box-shadow: 0 0 15px rgba(198, 40, 40, 0.7);
}

/* 禁用状态 - 置灰 */
.task-btn.disabled {
  background: #1a1a1a;
  border-color: rgba(100, 100, 100, 0.3);
  color: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.task-btn.disabled:hover {
  background: #1a1a1a;
  border-color: rgba(100, 100, 100, 0.3);
  transform: none;
  box-shadow: none;
}

/* loading 状态 - 隐藏文字，显示旋转圆圈 */
.task-btn.loading {
  pointer-events: none;
  color: transparent;
  position: relative;
  opacity: 0.85;
}
.task-btn.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(103, 213, 253, 0.25);
  border-top-color: #67d5fd;
  border-radius: 50%;
  animation: task-btn-spin 0.7s linear infinite;
}
.task-btn.active.loading::after {
  border-color: rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
}
@keyframes task-btn-spin {
  to { transform: rotate(360deg); }
}

.wayline-control-list {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2vh, 15px);
  margin-top: 0;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  justify-content: flex-start;
}

.control-row .wayline-select-wrapper {
  flex: 1;
  margin: 0 4px;
  min-width: 150px;
}

.control-row.second-row {
  justify-content: space-between;
  gap: 8px;
}

.control-row.second-row .span,
.control-row.second-row .span1 {
  flex: 1;
  min-width: 70px;
}

.control-row .div {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  white-space: nowrap;
  width: 65px;
  text-align: right;
  padding-right: 2px;
  flex-shrink: 0;
}

.control-row .span {
  width: clamp(60px, 6vw, 70px);
  height: 30px;
  line-height: 30px;
  text-align: center;
  background: #0c3c56;
  border-radius: 4px;
  border: 1px solid rgba(38, 131, 182, 0);
  color: #67d5fd;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.3s;
}

.control-row .span:hover {
  border-color: rgba(38, 131, 182, 0.8);
  background: #0c4666;
}

.control-row .span1 {
  width: clamp(60px, 6vw, 70px);
  height: 30px;
  line-height: 30px;
  text-align: center;
  background: #561c1c;
  border-radius: 4px;
  border: 1px solid rgba(182, 38, 38, 0);
  color: #fd6767;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.3s;
}

.control-row .span1:hover {
  border-color: rgba(182, 38, 38, 0.8);
  background: #662626;
}

/* 任务运行中 - 取消按钮高亮激活状态 */
.control-row .span1.active {
  background: #c62828;
  border-color: #ff5252;
  color: #fff;
  box-shadow: 0 0 10px rgba(198, 40, 40, 0.6);
  animation: cancel-btn-pulse 2s ease-in-out infinite;
}
.control-row .span1.active:hover {
  background: #d32f2f;
  border-color: #ff6666;
  box-shadow: 0 0 14px rgba(198, 40, 40, 0.8);
}
@keyframes cancel-btn-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(198, 40, 40, 0.5); }
  50%       { box-shadow: 0 0 18px rgba(198, 40, 40, 0.9); }
}

/* 禁用状态样式 */
.control-row .span.disabled,
.control-row .span1.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: rgba(255, 255, 255, 0.4);
}

.control-row .span.disabled:hover,
.control-row .span1.disabled:hover {
  border-color: rgba(38, 131, 182, 0);
  background: #0c3c56;
}

.control-row .span1.disabled:hover {
  border-color: rgba(182, 38, 38, 0);
  background: #561c1c;
}

/* 任务信息样式 */
.on4-bottom-t {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.on4-bottom-tl p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 5px 0;
}

.on4-bottom-tl span {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.on4-bottom-tr span {
  color: #00a8ff;
  font-size: 16px;
  font-weight: 500;
}

.on4-bottom-b {
  display: flex;
  gap: 10px;
}

.divon4 {
  flex: 1;
  height: 131px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

/* 中间列样式 */
.center-column {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 统一卡片间距 */
  height: calc(100vh - 124px);
  background: transparent;
  overflow: hidden;
  flex: 1;
}

/* 中间列内容样式 */
.content-on1 {
  width: 100%;
  height: calc((100vh - 124px) * 0.333 * 2 - 20px);
  background: transparent;
  border-radius: 4px;
  position: relative;
  padding: 20px;
}

.content-on1::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/source_data/bg_data/video_bg.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 1;
}

.pointcloud-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  padding: 4px;
  background: rgba(0, 12, 23, 0.2);
  border-radius: 6px;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
}

.pointcloud-view {
  flex: 1;
  position: relative;
  border-radius: 10px;
  border: 1px solid rgba(89, 192, 252, 0.2);
  background: radial-gradient(circle at 20% 20%, rgba(89, 192, 252, 0.2), transparent 45%),
              radial-gradient(circle at 80% 10%, rgba(255, 128, 0, 0.12), transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(0, 225, 255, 0.2), transparent 50%),
              #020915;
  overflow: hidden;
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

/* 点云工具按鈕组：排列在两框线之间的右下角 */
.pcd-btn-group {
  position: absolute;
  bottom: -20px;
  right: 12px;
  display: flex;
  gap: 6px;
  z-index: 10;
}
.pcd-tool-btn {
  width: 24px;
  height: 24px;
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: rgba(89, 192, 252, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
.pcd-tool-btn:hover {
  color: #fff;
}
.pcd-tool-btn svg {
  width: 100%;
  height: 100%;
}

/* 点云全屏模式 */
.pointcloud-fullscreen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0 !important;
  padding: 0 !important;
}
/* 全屏时把按钮组收回到可视区域内右下角 */
.pointcloud-fullscreen .pcd-btn-group {
  bottom: 16px;
  right: 16px;
  z-index: 10000;
}

.boxGrid-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
  background: rgba(0, 12, 23, .5);
  border-radius: 4px;
  overflow: hidden;
}

.boxGrid-box-content {
  flex: 1;
  position: relative;
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
}

.player_container {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
  overflow: hidden !important;
  background: #000 !important;
}

.player_item {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
  overflow: hidden !important;
}

.player_box {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
  background: #000 !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

/* 强制视频元素填满整个容器 */
.player_box video,
.player_box canvas,
.player_box img,
.player_box > * {
  width: 100% !important;
  height: 100% !important;
  object-fit: fill !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  outline: none !important;
  box-sizing: border-box !important;
  display: block !important;
}

/* 专门针对 flv.js 播放器的样式 */
.player_box .flv-player,
.player_box .flv-player *,
.player_box .video-js,
.player_box .video-js *,
.player_box .vjs-tech {
  width: 100% !important;
  height: 100% !important;
  object-fit: fill !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  outline: none !important;
  box-sizing: border-box !important;
}

/* WebRTC 和其他流媒体播放器 */
.player_box canvas[data-webrtc],
.player_box video[data-webrtc] {
  width: 100% !important;
  height: 100% !important;
  object-fit: fill !important;
  transform: none !important;
}

.boxGrid-box-bottom {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: rgba(0, 12, 23, .8);
  position: relative;
  z-index: 3;
}

.drone-card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  flex: 1;
  min-height: 0;
  position: relative;
  box-sizing: border-box;
}

.drone-video-panel {
  border: 1px solid rgba(89, 192, 252, 0.2);
  border-radius: 6px;
  overflow: hidden;
}

.infrared-card .infrared-video-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.infrared-video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.8);
}

.infrared-refresh {
  padding: 4px 14px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid rgba(89, 192, 252, 0.5);
  color: #59c0fc;
  cursor: pointer;
  transition: all 0.2s;
}

.infrared-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.infrared-refresh:not(:disabled):hover {
  background: rgba(89, 192, 252, 0.1);
}

.infrared-player-box {
  min-height: 200px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(89, 192, 252, 0.2);
  background: #000;
  position: relative;
}

.infrared-player {
  position: relative;
  width: 100%;
  height: 260px;
  background: #000;
}

.infrared-player video {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
}

/* 清晰度设置按钮样式（与无人机控制页一致） */
.quality-btn {
  padding: 4px;
  background: transparent;
  border: none;
  color: #67d5fd;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quality-btn:hover {
  color: #59c0fc;
}

.quality-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 清晰度菜单样式（与无人机控制页一致） */
.quality-menu {
  position: fixed;
  background: rgba(20, 30, 40, 0.95);
  border: 1px solid rgba(89, 192, 252, 0.3);
  border-radius: 6px;
  padding: 4px 0;
  z-index: 99999;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 60px;
}

.quality-menu-item {
  padding: 4px 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.quality-menu-item:hover {
  background: rgba(89, 192, 252, 0.1);
  color: #59C0FC;
}

.svg-icon {
  width: 20px;
  height: 20px;
  fill: #59C0FC;
}

.el-icon {
  color: #59C0FC;
  font-size: 20px;
}

/* 告警信息区域样式 */
.content-on2 {
  width: 100%;
  height: calc((100vh - 124px) * 0.334);
  background-image: url('@/assets/source_data/bg_data/card_second_body.png');
  background-size: 100% 100%;
  overflow: hidden;
}

.on2-top {
  height: 41px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background-image: url('@/assets/source_data/bg_data/card_second_body_title.png');
  background-size: 100% 100%;
}

.on2-top span {
  padding: 0 12px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 14px;
  height: 100%;
  display: flex;
  align-items: center;
}

.on2-top span.active {
  color: rgb(89, 192, 252);
  font-weight: 500;
}

.on2-bottom {
  height: calc(100% - 41px);
  width: 100%;
  padding: 8px 15px;
  overflow: hidden;
  box-sizing: border-box;
}

.tableOne {
  width: calc(100% - 2px);
  height: calc(100% - 4px);
  border-collapse: collapse;
  background: transparent;
  color: #fff;
  border-spacing: 0;
  table-layout: fixed;
  margin: 0 auto;
  border-radius: 4px;
  overflow: hidden;
}

.tableOne thead {
  width: 100%;
}

.tableOne tbody {
  width: 100%;
  display: table-row-group;
}

.tableOne tr {
  display: table-row;
  width: 100%;
}

.tableOne th,
.tableOne td {
  padding: 0;
  text-align: center;
  border: none;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.tableOne th {
  line-height: 34px;
  height: 34px;
}

.tableOne td {
  line-height: 1.3;
  height: 41px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  padding: 4px 4px;
}

/* 删除列分隔线的样式，改为行分隔线 */
.tableOne tr:not(:last-child) td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* 表头底部的分隔线稍微加深一点 */
.tableOne thead tr th {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}



.tableOne th {
  background-color: rgba(0, 28, 46, 0.95);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
}

.tableOne td {
  background-color: rgba(0, 28, 46, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tableOne tr:nth-child(even) td {
  background-color: rgba(0, 28, 46, 0.4);
}

.tableOne tr:hover td {
  background-color: rgba(0, 28, 46, 0.6);
}

.tableOne td span[style*="color: #FF8000"] {
  color: #FF4D4F !important;
}

:deep(.el-table) {
  background-color: transparent;
  color: #fff;
}

:deep(.el-table tr) {
  background-color: transparent;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: rgba(255, 255, 255, 0.05);
}

:deep(.el-table td.el-table__cell, .el-table th.el-table__cell.is-leaf) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

/* 右侧列样式 */
.right-column {
  display: grid;
  grid-template-rows: 3.5fr 3.5fr 3fr;
  gap: 20px; /* 统一卡片间距 */
  height: calc(100vh - 124px);
  overflow-y: auto;
  width: clamp(280px, 28vw, 480px);
}

.right-column > * {
  min-height: 0;
}

.right-column::-webkit-scrollbar {
  width: 4px;
}

.right-column::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.right-column::-webkit-scrollbar-thumb {
  background: rgba(0, 168, 255, 0.3);
  border-radius: 2px;
}

.right-column::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 168, 255, 0.5);
}
.icon-back {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.cardTitle .icon-back {
  width: 18px;
  height: 18px;
  color: #00a8ff;
}

.b-top-rightDiv .icon-back {
  width: 24px;
  height: 24px;
  color: #00a8ff;
}

.b-bottom-top .icon-back,
.b-bottom-bottom .icon-back {
  width: 16px;
  height: 16px;
  color: #00a8ff;
}

.button-group {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.button-group-second {
  display: flex;
  gap: clamp(20px, 2vw, 26px);
  width: 100%;
  justify-content: space-between;
}

.button-group-second .span,
.button-group-second .span1 {
  width: clamp(80px, 8vw, 90px);
}

.button-group-second .span:first-child {
  margin-left: 0;
}

.button-group-second .span1:last-child {
  margin-right: 0;
}

/* 环境状态样式 */
.left-video-card {
  width: 100%;
  background-image: url('@/assets/source_data/bg_data/card_first_body.png');
  background-size: 100% 100%;
  margin-top: 0;
  display: flex;
  flex-direction: column;
}

.left-video-card .cardTitle {
  margin-bottom: 0;
}

.video-card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.video-only-body {
  padding: 0;
  flex: 1;
  display: flex;
  min-height: 0;
}

.video-only-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, #0e2b40 0%, #0b2235 100%);
  display: flex;
  flex: 1;
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


:deep(.video-only-element::-webkit-media-controls-mute-button),
:deep(.video-only-element::-webkit-media-controls-volume-control-container),
:deep(.video-only-element::-webkit-media-controls-volume-slider),
:deep(.video-only-element::-webkit-media-controls-overflow-button),
:deep(.video-only-element::-webkit-media-controls-toggle-closed-captions-button),
:deep(.video-only-element::-webkit-media-controls-fullscreen-button) {
  display: none !important;
  -webkit-appearance: none;
}

/* 视频重连 overlay：保留最后一帧，叠加半透明提示 */
.video-reconnect-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;
  pointer-events: none;
}
.video-reconnect-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: video-spin 0.8s linear infinite;
}
.video-reconnect-text {
  color: #fff;
  font-size: 13px;
  letter-spacing: 0.5px;
}
@keyframes video-spin {
  to { transform: rotate(360deg); }
}

.right-controls {
  display: flex;
  align-items: center;
  gap: clamp(6px, 0.5vw, 8px);
  cursor: pointer;
  position: relative;
  padding: clamp(4px, 0.4vw, 6px) clamp(6px, 0.5vw, 8px);
  border-radius: 4px;
  transition: all 0.3s;
}

.right-controls:hover {
  background: rgba(255, 255, 255, 0.1);
}

.screen-icon {
  width: clamp(16px, 1.2vw, 18px);
  height: clamp(16px, 1.2vw, 18px);
  filter: brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  margin-right: -2px;
}

.dropdown-icon {
  color: rgba(255, 255, 255, 0.5);
  font-size: clamp(10px, 0.8vw, 12px);
  display: flex;
  align-items: center;
  margin-left: 2px;
}

.dropdown-icon svg {
  width: clamp(12px, 1vw, 14px);
  height: clamp(12px, 1vw, 14px);
}

.screen-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  background: rgba(0, 12, 23, .9);
  border: 1px solid rgba(89, 192, 252, 0.3);
  border-radius: 4px;
  padding: clamp(6px, 0.5vw, 8px) 0;
  min-width: clamp(100px, 8vw, 120px);
  margin-bottom: 8px;
}

.menu-item {
  padding: clamp(6px, 0.5vw, 8px) clamp(12px, 1vw, 16px);
  color: #fff;
  font-size: clamp(12px, 0.9vw, 14px);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.menu-item:hover {
  background: rgba(89, 192, 252, 0.1);
  color: #59C0FC;
}

/* 添加一个小三角形 */
.screen-menu::after {
  content: '';
  position: absolute;
  bottom: -5px;
  right: 10px;
  width: 10px;
  height: 10px;
  background: rgba(0, 12, 23, .9);
  border-right: 1px solid rgba(89, 192, 252, 0.3);
  border-bottom: 1px solid rgba(89, 192, 252, 0.3);
  transform: rotate(45deg);
}

/* 右侧卡片通用样式 */
.right-on1,
.right-on2,
.right-on3 {
  width: 100%;
  background-image: url('@/assets/source_data/bg_data/card_first_body.png');
  background-size: 100% 100%;
  margin-bottom: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.right-on1 {
  position: relative;
}

.robot-control-card .cardTitle {
  width: calc(100% - 10px);
  height: 41px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 10px;
  padding-right: 10px;
  background-image: url('@/assets/source_data/bg_data/card_title.png');
  background-size: 100% 100%;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  flex-shrink: 0;
}

.cardTitle img {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

/* 无人机状态卡片主体样式 */
.drone-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  margin: 0;
}

/* 无人机状态卡片内的 on1-bottom 应该填满整个 drone-card-body */
.drone-card-body .on1-bottom {
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 15px 0;
  margin: 0;
  box-sizing: border-box;
}

.chart-container {
  flex: 1;
  width: 100%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend-chart {
  width: calc(100% - 40px);
  height: calc(100% - 10px);
  margin-top: 5px;
}

/* 航线任务样式 */
.task-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 0;
  gap: 10px;
}

.task-header {
  width: calc(100% - 20px);
  height: 50px;
  margin: 10px 10px 0 10px;
  background:
    linear-gradient(180deg, rgba(22, 113, 176, 0.24) 0%, rgba(8, 42, 75, 0.06) 100%),
    radial-gradient(120% 160% at 0% 0%, rgba(86, 193, 255, 0.2) 0%, rgba(86, 193, 255, 0) 65%);
  border: 1px solid rgba(65, 166, 235, 0.45);
  box-shadow:
    inset 0 0 0 1px rgba(27, 107, 171, 0.35),
    0 4px 12px rgba(0, 18, 33, 0.45);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-radius: 2px;
}

.video-empty-state {
  position: absolute;
  inset: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(204, 225, 236, 0.86);
  font-size: 14px;
  letter-spacing: 0.5px;
  z-index: 5;
  pointer-events: none;
}

.task-name {
  color: #8ed9ff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  line-height: 25px;
  margin: 0;
  padding: 0;
  text-align: left;
  text-shadow: 0 0 8px rgba(56, 180, 255, 0.35);
}

.task-time {
  display: flex;
  flex-direction: column;
  width: calc(70% - 10px);
  justify-content: flex-start;
  align-items: flex-start;
}

.time-item {
  display: flex;
  align-items: center;
  height: 25px;
  line-height: 25px;
  gap: 16px;
  padding: 0;
}

.time-item .label {
  color: #6dc9ff;
  font-size: 12px;
  opacity: 0.94;
  white-space: nowrap; /* 防止文字换行 */
  text-shadow: 0 0 6px rgba(40, 128, 191, 0.28);
}

.time-item .time-value {
  color: #b6e8ff;
  font-style: normal;
  font-weight: 600;
  margin-left: 2px;
  text-shadow: 0 0 7px rgba(80, 200, 255, 0.35);
}

.time-item .label:last-child {
  color: #83eaff;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(44, 209, 255, 0.35);
}

.task-status {
  padding-right: 10px;
  width: 30%;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 0;
}

.status-btn {
  width: 62px;
  height: 22px;
  text-align: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.2px;
  padding: 0;
  backdrop-filter: blur(2px);
}

.status-btn.waiting {
  color: #d5dfdb;
  background: linear-gradient(180deg, rgba(142, 255, 204, 0.34) 0%, rgba(11, 237, 150, 0.08) 100%);
  box-shadow: inset 0 0 8px rgba(11, 237, 150, 0.5), 0 0 8px rgba(11, 237, 150, 0.18);
  border: 1px solid rgba(11, 237, 150, 0.78);
}

.status-btn.running {
  color: #7fd0ff;
  background: linear-gradient(180deg, rgba(24, 144, 255, 0.44) 0%, rgba(24, 144, 255, 0.08) 100%);
  box-shadow: inset 0 0 8px rgba(24, 144, 255, 0.62), 0 0 10px rgba(24, 144, 255, 0.22);
  border: 1px solid rgba(80, 176, 255, 0.95);
}

.status-btn.completed {
  color: #98ef7a;
  background: linear-gradient(180deg, rgba(82, 196, 26, 0.42) 0%, rgba(82, 196, 26, 0.08) 100%);
  box-shadow: inset 0 0 8px rgba(82, 196, 26, 0.6), 0 0 9px rgba(82, 196, 26, 0.2);
  border: 1px solid rgba(131, 225, 89, 0.92);
}

.status-btn.failed {
  color: #ff8e90;
  background: linear-gradient(180deg, rgba(255, 77, 79, 0.42) 0%, rgba(255, 77, 79, 0.08) 100%);
  box-shadow: inset 0 0 8px rgba(255, 77, 79, 0.58), 0 0 9px rgba(255, 77, 79, 0.2);
  border: 1px solid rgba(255, 120, 122, 0.92);
}

.status-btn.paused {
  color: #ffd074;
  background: linear-gradient(180deg, rgba(250, 173, 20, 0.42) 0%, rgba(250, 173, 20, 0.08) 100%);
  box-shadow: inset 0 0 8px rgba(250, 173, 20, 0.58), 0 0 9px rgba(250, 173, 20, 0.2);
  border: 1px solid rgba(255, 199, 85, 0.92);
}

/* 任务进度图表样式调整 */
.task-progress {
  width: 100%;
  height: calc(100% - 70px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px 10px;
  margin: 0;
  gap: 30px;
}

.chart-box {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: 15px;
  padding-bottom: 20px;
}

/* 双环进度条样式 */
.progress-circle-container {
  position: relative;
  width: 80px;
  height: 80px;
  overflow: visible;
}

.progress-circle {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 外环：进度显示环 */
.progress-circle-outer-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  /* 使用遮罩形成8px厚度的圆环，颜色用背景的conic-gradient控制 */
  border: none;
  border-radius: 50%;
  box-sizing: border-box;
  transition: all 0.3s ease;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 8px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 8px));
  z-index: 2;
}

.progress-circle-outer-ring.completed { filter: brightness(1.1); }
/* 独立的外部光晕层，避免mask裁剪阴影 */
.progress-circle-outer-glow {
  position: absolute;
  inset: -8px; /* 外扩，避免环边缘出现暗圈 */
  border-radius: 50%;
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: screen; /* 在深色背景上避免发暗/黑圈 */
  filter: blur(8px);
  opacity: 0.6;
  will-change: filter, transform, opacity;
  animation: glow-pulse 4s infinite alternate ease-in-out;
  background: radial-gradient(circle, var(--glow-color, #00e1ff) 40%, transparent 70%);
}

.progress-circle-outer-glow.completed {
  animation: pulse-completed 4s infinite alternate;
}

@keyframes glow-pulse {
  0% { filter: blur(6px); opacity: 0.45; transform: scale(0.98); }
  100% { filter: blur(12px); opacity: 0.9; transform: scale(1.04); }
}

@keyframes pulse-completed {
  0% { 
    filter: blur(8px); 
    opacity: 0.6; 
    transform: scale(1); 
    background: radial-gradient(circle, #00e1ff 40%, transparent 70%);
  }
  50% { 
    filter: blur(12px); 
    opacity: 0.9; 
    transform: scale(1.05); 
    background: radial-gradient(circle, #00e1ff 50%, transparent 60%);
  }
  100% { 
    filter: blur(8px); 
    opacity: 0.6; 
    transform: scale(1); 
    background: radial-gradient(circle, #00e1ff 40%, transparent 70%);
  }
}

@keyframes ring-brightness {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.3); }
}

.progress-circle-center {
  position: absolute;
  width: 56px;
  height: 56px;
  top: 12px;
  left: 12px;
  border-radius: 50%;
  background-color: rgba(0, 12, 23, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.8);
  z-index: 3;
}

.progress-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.progress-text span {
  color: #00e1ff;
  font-size: 14px;
  line-height: 1.2;
  text-shadow: 0 0 8px rgba(0, 225, 255, 0.9);
}

.progress-text .percentage {
  font-size: 24px;
  font-weight: bold;
  margin-top: 2px;
  color: #00e1ff;
  text-shadow: 0 0 10px rgba(0, 225, 255, 1);
}

.chart-box:nth-child(2) .progress-text span {
  color: #00e1ff;
  text-shadow: 0 0 5px rgba(0, 225, 255, 0.7);
}

/* 图例样式 */
.chart-legend {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-top: 15px;
  position: absolute;
  bottom: 0px;
  left: 0;
  right: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

.blue-gradient {
  background: linear-gradient(90deg, #00e1ff, #0088a3);
}

.orange-gradient {
  background: linear-gradient(90deg, #ff8000, #B25000);
}

.green-gradient {
  background: linear-gradient(90deg, #00ff7f, #00b359);
}

.red-gradient {
  background: linear-gradient(90deg, #ff4d4f, #B22426);
}

.legend-item span:last-child {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.chart-box:first-child .legend-item:first-child span:last-child {
  color: #00e1ff;
  text-shadow: 0 0 3px rgba(0, 225, 255, 0.5);
}

.chart-box:first-child .legend-item:last-child span:last-child {
  color: #ff8000;
  text-shadow: 0 0 3px rgba(255, 128, 0, 0.5);
}

.chart-box:last-child .legend-item:first-child span:last-child {
  color: #00ff7f;
  text-shadow: 0 0 3px rgba(0, 255, 127, 0.5);
}

.chart-box:last-child .legend-item:last-child span:last-child {
  color: #ff4d4f;
  text-shadow: 0 0 3px rgba(255, 77, 79, 0.5);
}

/* 地图容器样式 */

/* 航线任务卡片响应式样式 */
@media (max-width: 1400px) {
  .task-header {
    padding: 0 clamp(10px, 1.5vw, 15px);
  }

  .task-name {
    font-size: clamp(12px, 1vw, 14px);
  }

  .time-item {
    gap: clamp(10px, 1.5vw, 20px);
  }

  .time-item .label {
    font-size: clamp(11px, 0.9vw, 12px);
  }

  .task-progress {
    gap: clamp(15px, 1.5vw, 20px);
  }
  

}

@media (max-width: 1200px) {
  .task-time {
    width: 65%;
  }

  .task-status {
    width: 35%;
  }

  .status-btn {
    width: clamp(50px, 5vw, 60px);
    font-size: clamp(11px, 0.9vw, 12px);
  }

  .legend-item span:last-child {
    font-size: clamp(11px, 0.9vw, 12px);
  }
}

@media (max-width: 992px) {
  .task-header {
    height: auto;
    min-height: 50px;
    padding: clamp(8px, 1vw, 10px) clamp(8px, 1.2vw, 12px);
  }

  .task-time {
    width: 60%;
  }

  .task-status {
    width: 40%;
  }

  .time-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    height: auto;
  }
  

}

@media (max-width: 768px) {
  .task-content {
    gap: 15px;
  }

  .task-header {
    margin: 5px;
  }

  .task-time {
    width: 100%;
  }

  .task-status {
    display: none;
  }

  .task-progress {
    flex-direction: column;
    height: auto;
    gap: 10px;
  }
  
  .chart-box {
    height: 120px;
  }
  

}



/* 任务状态外环样式 */
.task-status-outer-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 8px solid #52c41a; /* 默认绿色（正常状态） */
  border-radius: 50%;
  box-sizing: border-box;
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
  transition: all 0.3s ease;
  animation: pulse-status 4s infinite alternate;
}

@keyframes pulse-status {
  0% {
    box-shadow: 0 0 20px rgba(82, 196, 26, 0.8), inset 0 0 10px rgba(82, 196, 26, 0.5);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 35px rgba(82, 196, 26, 1), inset 0 0 15px rgba(82, 196, 26, 0.7);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 25px rgba(82, 196, 26, 0.9), inset 0 0 12px rgba(82, 196, 26, 0.6);
    transform: scale(1);
  }
}

.task-status-outer-ring.error {
  border-color: #ff4d4f; /* 异常状态为红色 */
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
  animation: pulse-error 4s infinite alternate;
}

@keyframes pulse-error {
  0% {
    box-shadow: 0 0 20px rgba(255, 77, 79, 0.8), inset 0 0 10px rgba(255, 77, 79, 0.5);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 35px rgba(255, 77, 79, 1), inset 0 0 15px rgba(255, 77, 79, 0.7);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 25px rgba(255, 77, 79, 0.9), inset 0 0 12px rgba(255, 77, 79, 0.6);
    transform: scale(1);
  }
}



@media (max-width: 1400px) {
  .status-circle {
    width: 110px;
    height: 110px;
  }
}

@media (max-width: 1200px) {
  .status-circle {
    width: 100px;
    height: 100px;
    border-width: 3px;
  }
}

@media (max-width: 992px) {
  .status-circle {
    width: 90px;
    height: 90px;
    border-width: 3px;
  }
}






  








/* 第一个环形图的字体缩小 */
.chart-box:first-child .progress-text span {
  font-size: 12px;
}

.chart-box:first-child .progress-text .percentage {
  font-size: 20px;
}


.video-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, 0.8);
}

.time-display,
.time-separator,
.time-display {
  font-size: 14px;
}

.play-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.play-btn svg {
  width: 24px;
  height: 24px;
  fill: #59C0FC;
}

.paused {
  fill: #FF4D4F;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.video-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.time-display {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.time-separator {
  color: rgba(255, 255, 255, 0.5);
}

.play-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn:hover {
  background: rgba(89, 192, 252, 0.1);
}

.play-btn svg {
  width: 20px;
  height: 20px;
  fill: #59C0FC;
  transition: fill 0.3s ease;
}

.play-btn.paused svg {
  fill: #FF4D4F;
}

.play-btn.paused:hover {
  background: rgba(255, 77, 79, 0.1);
}

.center-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 移除绝对定位，因为现在center-controls为空 */
}

/* 云台切换按钮样式 */
.gimbal-control {
  position: relative;
  display: flex;
  align-items: center;
  z-index: 10000;
}

.gimbal-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #59C0FC;
  min-width: 32px;
  min-height: 32px;
}

.gimbal-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.gimbal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gimbal-btn.loading {
  opacity: 0.7;
  cursor: wait;
}

.gimbal-btn svg {
  width: clamp(16px, 1.2vw, 18px);
  height: clamp(16px, 1.2vw, 18px);
  fill: currentColor;
  transition: all 0.3s ease;
}

.gimbal-btn:hover svg {
  transform: scale(1.1);
}

.gimbal-menu {
  position: fixed;
  background: rgba(20, 30, 40, 0.95);
  border: 1px solid rgba(89, 192, 252, 0.3);
  border-radius: 6px;
  padding: 8px 0;
  z-index: 99999;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 120px;
}

.gimbal-menu .menu-item {
  padding: 8px 12px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  transition: all 0.3s ease;
}

.gimbal-menu .menu-item:hover {
  background: rgba(89, 192, 252, 0.1);
  color: #59C0FC;
}

.gimbal-menu .menu-item.active {
  background: rgba(89, 192, 252, 0.2);
  color: #59C0FC;
}

.fullscreen-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #59C0FC; /* 设置默认颜色 */
}

.fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #16bbf2; /* 悬停时改变颜色 */
}

.fullscreen-btn svg {
  width: 24px;
  height: 24px;
  transition: color 0.3s ease;
  fill: currentColor; /* 使用当前文字颜色 */
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-text::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid rgba(89, 192, 252, 0.3);
  border-top: 2px solid #59C0FC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  padding: 0 20px;
}

.error-text {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 6px;
  padding: 12px 16px;
  max-width: 100%;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  text-align: center;
  padding: 0 20px;
}

.empty-text {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 12px 16px;
  max-width: 100%;
}

/* 算法开关和选择样式 */
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

.dispatch-algorithm-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
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
  padding: 4px 0;
  transition: all 0.2s;
}

.dispatch-algorithm-option:hover {
  background: rgba(103, 213, 253, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
  margin: 0 -8px;
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

/* 大图显示模态框样式 */
.alert-img-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.78);
  backdrop-filter: blur(2px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.alert-img-modal {
  background: linear-gradient(160deg, #0f1f30 0%, #132030 100%);
  border: 1px solid rgba(103,213,253,0.18);
  border-radius: 10px;
  min-width: 420px;
  max-width: 92vw;
  box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(103,213,253,0.06);
}
.alert-img-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(103,213,253,0.12);
  gap: 12px;
  min-height: 52px;
}
.alert-img-modal-title {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.alert-img-info {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.alert-img-tag {
  display: inline-flex;
  align-items: stretch;
  border-radius: 5px;
  overflow: hidden;
  font-size: 12px;
  border: 1px solid rgba(103,213,253,0.22);
  background: rgba(8,22,36,0.7);
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
}
.alert-img-tag em {
  font-style: normal;
  background: rgba(103,213,253,0.13);
  color: #67d5fd;
  padding: 4px 8px;
  border-right: 1px solid rgba(103,213,253,0.18);
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
}
.alert-img-tag i {
  font-style: normal;
  color: #e2f3ff;
  padding: 4px 10px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  font-size: 12px;
}
.alert-img-info-empty {
  color: rgba(180,200,220,0.35);
  font-size: 12px;
  font-style: italic;
}
.alert-img-close-btn {
  background: none;
  border: none;
  color: #b8c7d9;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  flex-shrink: 0;
}
.alert-img-close-btn:hover { color: #fff; }
.alert-img-modal-body {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.alert-img-preview {
  max-width: 80vw;
  max-height: 70vh;
  border-radius: 4px;
}
.alert-img-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #ff6b6b;
  font-size: 14px;
  padding: 24px;
}

/* 表格tooltip样式优化 */
.tableOne th[title]:hover::after,
.tableOne td[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  margin-bottom: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.tableOne th[title]:hover::before,
.tableOne td[title]:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
  margin-bottom: -5px;
  z-index: 1000;
  pointer-events: none;
}

/* 确保表格单元格有相对定位，以便tooltip正确定位 */
.tableOne th,
.tableOne td {
  position: relative;
}

/* ========== 机器人控制面板样式 ========== */
.robot-control-container {
  flex: 1;
  width: 100%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.robot-control-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px 8px;
  padding: 8px 12px 10px;
}

.control-button {
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(38, 131, 182, 0.4);
  outline: none;
  white-space: nowrap;
  text-align: center;
  line-height: 1.4;
}

/* 活跃状态按钮 - 项目主题色 */
.control-button.active {
  background: #0c3c56;
  color: #67d5fd;
}

.control-button.active:hover {
  background: #0c4666;
  border-color: rgba(103, 213, 253, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(103, 213, 253, 0.2);
}

.control-button.active:active {
  transform: translateY(0);
  box-shadow: none;
}

/* 禁用状态按钮 - 灰色 */
.control-button.disabled {
  background: #555;
  color: #888;
  cursor: not-allowed;
  border-color: #444;
}

.control-button.disabled:hover {
  transform: none;
  box-shadow: none;
}

/* 急停按钮 - 红色特殊样式 */
.control-button.emergency {
  background: #8b2022;
  color: #ff6b6b;
  border-color: rgba(255, 107, 107, 0.4);
}

.control-button.emergency:hover {
  background: #a52527;
  border-color: rgba(255, 107, 107, 0.8);
  box-shadow: 0 2px 6px rgba(255, 107, 107, 0.2);
}

.control-button.emergency:active {
  box-shadow: none;
}

/* 卡片标题左侧容器 */
.cardTitle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 麦克风图标样式 */
.mic-icon {
  width: 26px;
  height: 26px;
  cursor: pointer;
  transition: all 0.3s;
  filter: brightness(1.2);
  margin-top: 6px;
}

.mic-icon:hover {
  transform: scale(1.1);
  filter: brightness(1.5);
}


/* 确认对话框样式 - 参考ResultDialog */
.confirm-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-dialog {
  position: relative;
  width: 380px;
  max-width: 86vw;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(23,30,49,0.98), rgba(16,22,38,0.98));
  border: 1px solid rgba(99, 216, 255, 0.18);
  box-shadow: 0 12px 32px rgba(0,0,0,0.35);
}

.confirm-dialog-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 24px 10px 24px;
  font-size: 18px;
  color: #e9f3ff;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.confirm-dialog-body {
  padding: 8px 24px 14px 24px;
  color: #d1d7e0;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

.confirm-dialog-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 6px 24px 18px 24px;
}

.confirm-btn {
  min-width: 90px;
  height: 34px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
}

.confirm-btn-cancel {
  background: rgba(255,255,255,0.08);
  color: #e6e6e6;
  border-color: rgba(255,255,255,0.18);
}

.confirm-btn-cancel:hover {
  background: rgba(255,255,255,0.16);
}

.confirm-btn-ok {
  background: rgba(255,255,255,0.12);
  color: #e9f3ff;
  border-color: rgba(99, 216, 255, 0.3);
}

.confirm-btn-ok:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(99, 216, 255, 0.5);
}

</style>
