
<template>
  <div class="home-container">
    <!-- 左侧状态栏 -->
    <div class="left-box">
      <!-- 可见光视频 -->
      <div class="left-video-card visible-video-card" @click="closeMenus">
        <div class="cardTitle">
          <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
          可见光视频
        </div>
        <div class="video-card-body video-only-body">
          <div class="video-only-wrapper">
            <video 
              ref="videoElement"
              class="video-only-element"
              muted
              playsinline
              webkit-playsinline
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        </div>
      </div>

      <!-- 红外视频 -->
      <div class="left-video-card infrared-card">
        <div class="cardTitle">
          <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
          红外视频
        </div>
        <div class="video-card-body video-only-body">
          <div class="video-only-wrapper">
            <video 
              ref="infraredVideoElement"
              class="video-only-element"
              muted
              autoplay
              playsinline
              webkit-playsinline
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        </div>
      </div>

<!-- 任务下发 -->
      <div class="left-on3">
        <div class="cardTitle">
          <img src="@/assets/source_data/bg_data/card_logo.png" alt="card logo" />
          任务下发
        </div>
        <div class="on3-bottom">
          <div class="on3-bottom-center">
            <div class="task-row">
              <div class="map-dropdown-wrapper">
                <select class="map-dropdown" v-model="selectedMap">
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
                    'disabled': insEnabled || msfEnabled 
                  }"
                  @click="handleEnableNavigation"
                >导航</span>
                <span 
                  class="task-btn" 
                  :class="{ 
                    'active': insEnabled, 
                    'disabled': navigationEnabled || msfEnabled 
                  }"
                  @click="handleEnableIns"
                >INS</span>
                <span 
                  class="task-btn" 
                  :class="{ 
                    'active': msfEnabled, 
                    'disabled': navigationEnabled || insEnabled 
                  }"
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
                    :class="{ disabled: !canDispatchTask }"
                    @click="handleDispatchTask"
                  >下发任务</span>
                  <span 
                    class="span1" 
                    :class="{ disabled: activeTaskType !== 'wayline' }"
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
                    :class="{ disabled: !canDispatchTask }"
                    @click="handleDispatchPointTask"
                  >下发任务</span>
                  <span 
                    class="span1" 
                    :class="{ disabled: activeTaskType !== 'point' }"
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
                    :class="{ disabled: !canDispatchTask }"
                    @click="handleDispatchMultiTask"
                  >下发任务</span>
                  <span 
                    class="span1" 
                    :class="{ disabled: activeTaskType !== 'multi' }"
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

    <!-- 中间区域 -->
    <div class="center-column">
      <!-- 视频播放区域 -->
      <div class="content-on1" @click="closeMenus">
        <div class="pointcloud-wrapper">
          <div class="pointcloud-view">
            <canvas
              ref="pointCloudCanvas"
              class="pointcloud-canvas"
              tabindex="0"
              @wheel.prevent="handlePointCloudWheel"
              @pointerdown="handlePointCloudPointerDown"
              @keydown="handlePointCloudKeydown"
              @contextmenu.prevent
            ></canvas>
            <div v-if="pointCloudLoading" class="pcd-overlay loading">点云加载中...</div>
            <div v-else-if="pointCloudError" class="pcd-overlay error">{{ pointCloudError }}</div>
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
                <th title="报警时间">报警时间</th>
              </tr>
            </thead>
            <tbody>
              <!-- 实时警情行 -->
              <tr v-for="(item, index) in deviceAlarmData" :key="`alert-${index}`">
                <td :title="item.deviceName || '--'">{{ item.deviceName || '--' }}</td>
                <td :title="item.type || '--'">{{ item.type || '--' }}</td>
                <td :title="item.imageUrl ? '点击查看大图' : '暂无图片'">
                  <span v-if="!item.imageUrl" class="no-image">--</span>
                  <img 
                    v-else
                    :src="item.imageUrl"
                    alt="警情图片"
                    class="target-image-small"
                    @click="handleAlertImageClick(item.imageUrl)"
                    style="cursor:pointer;"
                  />
                </td>
                <td :title="item.content || '--'">{{ item.content || '--' }}</td>
                <td :title="item.time || '--'">{{ item.time || '--' }}</td>
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
                  <div>{{ droneStatus?.isOnline ? '在线' : '离线' }}</div>
                </div>
                <div class="img">
                  <img src="@/assets/source_data/dog.png" alt="" />
                </div>
              </div>
              <div class="b-top-right">
                <div class="b-top-rightCard">
                  <div class="b-top-rightDiv">
                    <img src="@/assets/source_data/speed.png" alt="" />
                  <div>
                    <p>{{ formatSpeed(droneStatus?.horizontalSpeed) }}</p>
                      <p>当前速度</p>
                  </div>
                </div>
                <div class="b-top-rightDiv">
                  <img src="@/assets/source_data/today_time.png" alt="" />
                  <div>
                    <p>{{ formatAccTime(droneStatus?.totalFlightTime) }}</p>
                      <p>本次行走里程</p>
                  </div>
                </div>
                <div class="b-top-rightDiv">
                  <img src="@/assets/source_data/total_miles.png" alt="" />
                  <div>
                    <p>{{ formatFlightDistance(droneStatus?.totalFlightDistance) }}</p>
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
                    <img src="@/assets/source_data/svg_data/longitude.svg" alt="经度" />
                    <span class="label">经度</span>
                  </div>
                  <span class="value">{{ formatCoordinate(droneDisplayPosition?.longitude, 'longitude') }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/latitude.svg" alt="纬度" />
                    <span class="label">纬度</span>
                  </div>
                  <span class="value">{{ formatCoordinate(droneDisplayPosition?.latitude, 'latitude') }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/altitude.svg" alt="高度" />
                    <span class="label">高度</span>
                  </div>
                  <span class="value">{{ formatHeight(droneDisplayPosition?.height) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img 
                      :src="droneStatus?.chargeState === 1 ? droneBatteryChargeIcon : droneBatteryIcon" 
                      alt="电量" 
                    />
                    <span class="label">电量</span>
                  </div>
                  <span class="value">{{ formatBattery(droneStatus?.batteryPercent) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/status.svg" alt="状态" />
                    <span class="label">状态</span>
                  </div>
                  <span class="value">{{ formatRobotStatus(droneStatus?.robotStatus) }}</span>
                </div>
                
                <!-- 第二行 -->
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/voltage.svg" alt="电压" />
                    <span class="label">电压</span>
                  </div>
                  <span class="value">{{ formatRobotVoltage(droneStatus?.voltage) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/current.svg" alt="电流" />
                    <span class="label">电流</span>
                  </div>
                  <span class="value">{{ formatRobotCurrent(droneStatus?.current) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/ground.svg" alt="地面" />
                    <span class="label">地面</span>
                  </div>
                  <span class="value">{{ formatGroundType(droneStatus?.groundType) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/foot.svg" alt="步态" />
                    <span class="label">步态</span>
                  </div>
                  <span class="value">{{ formatGaitType(droneStatus?.gaitType) }}</span>
                </div>
                <div class="status-item">
                  <div class="top-row">
                    <img src="@/assets/source_data/svg_data/height.svg" alt="姿态" />
                    <span class="label">姿态</span>
                  </div>
                  <span class="value">{{ formatPosture(droneStatus?.postureType) }}</span>
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
            @click="toggleMic"
          />
        </div>
        <div class="robot-control-container">
          <div class="robot-control-grid">
            <!-- 第一行 -->
            <button class="control-button active" @click="handleControlClick('stand')">起立</button>
            <button class="control-button active" @click="handleControlClick('forceControlMode')">力控模式</button>
            <button class="control-button active emergency" @click="handleControlClick('emergencyStop')">急停</button>
            
            <!-- 第二行 -->
            <button class="control-button active" @click="handleControlClick('startMove')">开始运动</button>
            <button class="control-button active" @click="handleControlClick('crawl')">匍匐姿态</button>
            <button class="control-button active" @click="handleControlClick('autoMode')">非手动模式</button>
            
            <!-- 第三行 -->
            <button class="control-button active" @click="handleControlClick('walkGait')">行走步态</button>
            <button class="control-button active" @click="handleControlClick('obstacleGait')">超障步态</button>
            <button class="control-button active" @click="handleControlClick('slopeGait')">斜坡步态</button>
            
            <!-- 第四行 -->
            <button class="control-button active" @click="handleControlClick('stairGait')">楼梯步态</button>
            <button class="control-button active" @click="handleControlClick('stairFollowGait')">顺楼梯步态</button>
            <button class="control-button active" @click="handleControlClick('stair45Gait')">45°楼梯步态</button>
            
            <!-- 第五行 -->
            <button class="control-button active" @click="handleControlClick('lGait')">L步态</button>
            <button class="control-button active" @click="handleControlClick('mountainGait')">山地步态</button>
            <button class="control-button active" @click="handleControlClick('quietGait')">静音步态</button>
            
            <!-- 第六行 -->
            <button class="control-button active" @click="handleControlClick('startCharge')">开始充电</button>
            <button class="control-button active" @click="handleControlClick('endCharge')">结束充电</button>
            <button class="control-button active" @click="handleControlClick('resetCharge')">重置充电</button>
          </div>
        </div>
      </div>

      <!-- 任务统计 -->
      <div class="right-on3">
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
                  <span class="label">任务开始时间：{{ waylineTaskStartTime }}</span>
                  <span class="label">当前航点：第{{ waylineCurrentWaypoint }}个</span>
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
          <button class="mission-btn mission-btn-cancel" @click="onDispatchTaskCancel">取消</button>
          <button class="mission-btn mission-btn-pause" @click="onDispatchTaskConfirm">确定</button>
        </div>
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
                :disabled="taskpointList.length === 0"
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
              <span class="custom-select-arrow">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <polygon points="2,4 6,8 10,4" fill="#fff"/>
                </svg>
              </span>
            </div>
          </div>
          <div v-if="taskpointList.length === 0" class="dispatch-task-row">
            <label></label>
            <div class="time-tip" style="color: #ff6b6b;">提示：当前循迹任务没有关键点文件，请先创建</div>
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
            <label>步态选择：</label>
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
          <div class="dispatch-task-row">
            <label>立即启动：</label>
            <div class="dispatch-switch-wrapper">
              <div
                class="switch-container"
                :class="{ active: !trackStartDialog.form.wait }"
                @click="trackStartDialog.form.wait = trackStartDialog.form.wait ? 0 : 1"
              >
                <div class="switch-toggle"></div>
              </div>
              <span class="dispatch-switch-label">{{ trackStartDialog.form.wait ? '否' : '是' }}</span>
            </div>
          </div>
        </div>
        <div class="dispatch-task-actions">
          <button class="mission-btn mission-btn-cancel" @click="onTrackStartCancel">取消</button>
          <button 
            class="mission-btn mission-btn-pause" 
            :class="{ disabled: taskpointList.length === 0 || !trackStartDialog.form.taskpoint_name }"
            @click="onTrackStartConfirm"
          >确定</button>
        </div>
      </div>
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
            <label>循环执行：</label>
            <div class="dispatch-switch-wrapper">
              <div
                class="switch-container"
                :class="{ active: multiTaskStartDialog.form.loop }"
                @click="multiTaskStartDialog.form.loop = !multiTaskStartDialog.form.loop"
              >
                <div class="switch-toggle"></div>
              </div>
              <span class="dispatch-switch-label">{{ multiTaskStartDialog.form.loop ? '是' : '否' }}</span>
            </div>
          </div>
        </div>
        <div class="dispatch-task-actions">
          <button class="mission-btn mission-btn-cancel" @click="onMultiTaskStartCancel">取消</button>
          <button 
            class="mission-btn mission-btn-pause" 
            @click="onMultiTaskStartConfirm"
          >确定</button>
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
          <div class="dispatch-task-row">
            <label>循环执行：</label>
            <div class="dispatch-switch-wrapper">
              <div
                class="switch-container"
                :class="{ active: pointTaskStartDialog.form.circle }"
                @click="pointTaskStartDialog.form.circle = !pointTaskStartDialog.form.circle"
              >
                <div class="switch-toggle"></div>
              </div>
              <span class="dispatch-switch-label">{{ pointTaskStartDialog.form.circle ? '是' : '否' }}</span>
            </div>
          </div>
          <div class="dispatch-task-row">
            <label>断点续传：</label>
            <div class="dispatch-switch-wrapper">
              <div
                class="switch-container"
                :class="{ active: pointTaskStartDialog.form.recover }"
                @click="pointTaskStartDialog.form.recover = !pointTaskStartDialog.form.recover"
              >
                <div class="switch-toggle"></div>
              </div>
              <span class="dispatch-switch-label">{{ pointTaskStartDialog.form.recover ? '是' : '否' }}</span>
            </div>
          </div>
        </div>
        <div class="dispatch-task-actions">
          <button class="mission-btn mission-btn-cancel" @click="onPointTaskStartCancel">取消</button>
          <button 
            class="mission-btn mission-btn-pause" 
            @click="onPointTaskStartConfirm"
          >确定</button>
        </div>
      </div>
    </div>
  </div>
    
    <!-- 确认对话框 -->
    <div v-if="confirmDialog.visible" class="confirm-dialog-mask" @click.self="confirmDialog.visible = false">
      <div class="confirm-dialog">
        <div class="confirm-dialog-header">提示</div>
        <div class="confirm-dialog-body">
          {{ confirmDialog.message }}
        </div>
        <div class="confirm-dialog-actions">
          <button class="confirm-btn confirm-btn-cancel" @click="onConfirmCancel">取消</button>
          <button class="confirm-btn confirm-btn-ok" @click="onConfirmOk">确定</button>
        </div>
      </div>
    </div>
    
    <!-- 大图显示模态框 -->
    <div v-if="showBigImage" class="big-image-mask" @click="closeBigImage">
      <img :src="bigImageUrl" class="big-image" @click.stop />
    </div>
  </div>
</template>

<script setup lang="ts">
// ================= 轨迹路线文件本地缓存与配置 ================
const TRAJECTORY_CONFIG_KEY = 'trajectory_config'
const TRAJECTORY_STORE_NAME = 'trajectory_files'

// 打开轨迹文件的 IndexedDB
const openTrajectoryDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('trajectory_db', 1)
    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(TRAJECTORY_STORE_NAME)) {
        db.createObjectStore(TRAJECTORY_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 保存轨迹文件
const saveTrajectoryFile = async (trackName: string, blob: Blob): Promise<void> => {
  const db = await openTrajectoryDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TRAJECTORY_STORE_NAME], 'readwrite')
    const store = tx.objectStore(TRAJECTORY_STORE_NAME)
    store.put({ id: trackName, blob })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// 获取轨迹文件
const getTrajectoryFile = async (trackName: string): Promise<Blob | null> => {
  try {
    const db = await openTrajectoryDB()
    return new Promise((resolve) => {
      const tx = db.transaction([TRAJECTORY_STORE_NAME], 'readonly')
      const request = tx.objectStore(TRAJECTORY_STORE_NAME).get(trackName)
      request.onsuccess = () => resolve(request.result?.blob || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

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
const downloadTrajectoryFile = async (trackName: string): Promise<Blob | null> => {
  // 轨迹文件名和文件夹同名
  const url = `/download_file?remote_path=/root/dxr_data/trajectory/${trackName}/${trackName}.txt`
  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) return null
    return await response.blob()
  } catch {
    return null
  }
}

// 下载所有轨迹文件（切换地图时调用）
const downloadAllTrajectoryFiles = async (trackList: string[]) => {
  // trackList 形如 [map1_track1@20260121, map1_track2@20260120]
  for (const trackRaw of trackList) {
    const atIndex = trackRaw.indexOf('@')
    const trackName = atIndex > -1 ? trackRaw.substring(0, atIndex) : trackRaw
    const updateTime = atIndex > -1 ? trackRaw.substring(atIndex + 1) : ''
    if (!trackName) continue
    if (!shouldDownloadTrajectory(trackName, updateTime)) continue
    const blob = await downloadTrajectoryFile(trackName)
    if (blob) {
      await saveTrajectoryFile(trackName, blob)
      updateTrajectoryConfig(trackName, updateTime)
    }
  }
}
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useDevices, useWaylineJobs } from '../composables/useApi'
import { controlApi, waylineApi, livestreamApi, navigationApi, mapFileApi } from '../api/services'
import { useDeviceStatus } from '../composables/useDeviceStatus'
import { config } from '../config/environment'
import { useDeviceStore } from '../stores/device'
import { getVideoStreams, getVideoStream, getDefaultVideoType } from '../utils/videoCache'
import AMapLoader from '@amap/amap-jsapi-loader'
import flvjs from 'flv.js'
import mapDockIcon from '@/assets/source_data/svg_data/map_dock3.svg'
import mapDroneIcon from '@/assets/source_data/svg_data/map_drone.svg'
import droneArrowIcon from '@/assets/source_data/svg_data/drone_control_svg/drone_arrow.svg'
import droneBatteryIcon from '@/assets/source_data/svg_data/drone_battery.svg'
import droneBatteryChargeIcon from '@/assets/source_data/svg_data/drone_battery_charge.svg'
import mkfOnIcon from '@/assets/source_data/svg_data/mkf_on.svg'
import mkfOffIcon from '@/assets/source_data/svg_data/mkf_off.svg'
const tinymapPcdUrl = new URL('../../tinyMap.pcd', import.meta.url).href



// 使用设备管理API
const { getCachedDeviceSns, getCachedWorkspaceId } = useDevices()
const deviceStore = useDeviceStore()

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

// 麦克风开关状态
const isMicOn = ref(false)

// 切换麦克风状态
const toggleMic = () => {
  isMicOn.value = !isMicOn.value
}

// 大图显示相关状态
const bigImageUrl = ref('')
const showBigImage = ref(false)

const closeBigImage = () => {
  showBigImage.value = false
  bigImageUrl.value = ''
}

// 处理警情图片点击
const handleAlertImageClick = (imageUrl: string) => {
  if (!imageUrl) return
  bigImageUrl.value = imageUrl
  showBigImage.value = true
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

// 地面类型映射
const groundTypeMap: Record<number, string> = {
  1: '实心地面',
  2: '镂空地面',
  3: '无踢面地面',
  4: '累积帧模式'
}

// 步态映射
const gaitTypeMap: Record<number, string> = {
  1: '行走步态',
  2: '斜坡步态',
  3: '越障步态',
  4: '楼梯步态',
  5: '帧楼梯步态',
  6: '帧45°楼梯步态',
  7: 'L行走步态',
  8: '山地步态',
  9: '静音步态'
}

// 格式化机器人状态
const formatRobotStatus = (value: number | undefined) => {
  if (value === undefined || value === null) return '--'
  return robotStatusMap[value] || '--'
}

// 格式化机器人电压
const formatRobotVoltage = (value: number | undefined) => {
  if (value === undefined || value === null) return '0.0V'
  return `${value.toFixed(1)}V`
}

// 格式化机器人电流
const formatRobotCurrent = (value: number | undefined) => {
  if (value === undefined || value === null) return '0.0A'
  return `${value.toFixed(1)}A`
}

// 格式化地面类型
const formatGroundType = (value: number | undefined) => {
  if (value === undefined || value === null) return '--'
  return groundTypeMap[value] || '--'
}

// 格式化步态
const formatGaitType = (value: number | undefined) => {
  if (value === undefined || value === null) return '--'
  return gaitTypeMap[value] || '--'
}

// 格式化姿态
const formatPosture = (value: number | undefined) => {
  if (value === undefined || value === null) return '--'
  return value === 1 ? '匍匐姿态' : '正常姿态'
}

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
const pointCloudCanvas = ref<HTMLCanvasElement | null>(null)
const pointCloudData = ref<PointCloudPoint[]>([])
const pointCloudLoading = ref(false)
const pointCloudError = ref('')
const pointCloudScale = ref(1)
const pointCloudRotationX = ref(-(20 * Math.PI) / 180)
const pointCloudRotationY = ref(0)
const pointCloudPanX = ref(0)
const pointCloudPanY = ref(0)
const pointCloudPointSize = ref(0.5)
const isPointCloudDragging = ref(false)
let lastPointerX = 0
let lastPointerY = 0
let activePointerId: number | null = null
let pointCloudDragMode: 'rotate' | 'pan' | null = null
let pointCloudFrameRequested = false

const schedulePointCloudRender = () => {
  if (pointCloudFrameRequested) return
  pointCloudFrameRequested = true
  requestAnimationFrame(() => {
    pointCloudFrameRequested = false
    drawPointCloud()
  })
}

const generateMockPointCloud = (count = 800): PointCloudPoint[] => {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    intensity: Math.random()
  }))
}

const normalizePointCloud = (rawPoints: RawPointCloudPoint[]): PointCloudPoint[] => {
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

const parseAsciiPcdContent = (content: string): PointCloudPoint[] => {
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('#'))
  const dataIndex = lines.findIndex(line => line.toLowerCase().startsWith('data'))
  if (dataIndex === -1) return []
  const headerLines = lines.slice(0, dataIndex)
  const dataLines = lines.slice(dataIndex + 1)
  const fieldsLine = headerLines.find(line => line.toLowerCase().startsWith('fields'))
  const fields = fieldsLine ? fieldsLine.split(/\s+/).slice(1) : []
  const xIndex = fields.indexOf('x')
  const yIndex = fields.indexOf('y')
  const zIndex = fields.indexOf('z')
  const intensityIndex = fields.findIndex(field => field === 'intensity' || field === 'rgb')
  if (xIndex === -1 || yIndex === -1) return []

  const rawPoints = dataLines.map(line => line.split(/\s+/))
    .filter(parts => parts.length > Math.max(xIndex, yIndex))
    .map(parts => {
      const x = parseFloat(parts[xIndex])
      const y = parseFloat(parts[yIndex])
      const z = zIndex !== -1 ? parseFloat(parts[zIndex]) : 0
      const intensityValue = intensityIndex !== -1 && parts[intensityIndex] !== undefined ? parseFloat(parts[intensityIndex]) : undefined
      return { x, y, z, intensityValue }
    })
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))

  return normalizePointCloud(rawPoints)
}

const readBinaryValue = (view: DataView, offset: number, type: string, size: number) => {
  switch (type) {
    case 'F':
      if (size === 8) return view.getFloat64(offset, true)
      return view.getFloat32(offset, true)
    case 'I':
      if (size === 1) return view.getInt8(offset)
      if (size === 2) return view.getInt16(offset, true)
      return view.getInt32(offset, true)
    case 'U':
      if (size === 1) return view.getUint8(offset)
      if (size === 2) return view.getUint16(offset, true)
      return view.getUint32(offset, true)
    default:
      return view.getFloat32(offset, true)
  }
}

const extractPcdHeaderInfo = (buffer: ArrayBuffer): PcdHeaderInfo => {
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('utf-8')
  let lineStart = 0
  let dataStartIndex = buffer.byteLength
  const headerInfo: PcdHeaderInfo = {
    fields: [],
    size: [],
    type: [],
    count: [],
    points: 0,
    width: 0,
    height: 0,
    dataType: 'ascii',
    dataStartIndex: buffer.byteLength
  }

  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0x0a) {
      const line = decoder.decode(bytes.slice(lineStart, i)).replace(/\r/g, '').trim()
      const lowerLine = line.toLowerCase()
      if (lowerLine.startsWith('fields')) {
        headerInfo.fields = line.split(/\s+/).slice(1)
      } else if (lowerLine.startsWith('size')) {
        headerInfo.size = line.split(/\s+/).slice(1).map(val => Number(val) || 0)
      } else if (lowerLine.startsWith('type')) {
        headerInfo.type = line.split(/\s+/).slice(1).map(val => val.toUpperCase())
      } else if (lowerLine.startsWith('count')) {
        headerInfo.count = line.split(/\s+/).slice(1).map(val => Number(val) || 1)
      } else if (lowerLine.startsWith('points')) {
        const [, value] = line.split(/\s+/)
        headerInfo.points = Number(value) || 0
      } else if (lowerLine.startsWith('width')) {
        const [, value] = line.split(/\s+/)
        headerInfo.width = Number(value) || 0
      } else if (lowerLine.startsWith('height')) {
        const [, value] = line.split(/\s+/)
        headerInfo.height = Number(value) || 0
      } else if (lowerLine.startsWith('data')) {
        const parts = line.split(/\s+/)
        headerInfo.dataType = parts[1]?.toLowerCase() || 'ascii'
        dataStartIndex = i + 1
        break
      }
      lineStart = i + 1
    }
  }

  headerInfo.dataStartIndex = dataStartIndex
  if (!headerInfo.count.length && headerInfo.fields.length) {
    headerInfo.count = headerInfo.fields.map(() => 1)
  }
  return headerInfo
}

const parseBinaryPcdContent = (buffer: ArrayBuffer, headerInfo: PcdHeaderInfo): PointCloudPoint[] => {
  const counts = headerInfo.count.length ? headerInfo.count : headerInfo.fields.map(() => 1)
  const stride = headerInfo.fields.reduce((sum, _, idx) => {
    const size = headerInfo.size[idx] || 0
    const count = counts[idx] || 1
    return sum + size * count
  }, 0)
  if (!stride) return []

  const bytesAvailable = buffer.byteLength - headerInfo.dataStartIndex
  if (bytesAvailable <= 0) return []

  const totalPoints = headerInfo.points || (headerInfo.width * headerInfo.height) || 0
  const maxReadablePoints = Math.floor(bytesAvailable / stride)
  const pointsToRead = totalPoints > 0 ? Math.min(totalPoints, maxReadablePoints) : maxReadablePoints

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

  return normalizePointCloud(rawPoints)
}

const parsePcdBuffer = (buffer: ArrayBuffer): PointCloudPoint[] => {
  const headerInfo = extractPcdHeaderInfo(buffer)
  if (!headerInfo.fields.length) return []

  if (headerInfo.dataType === 'binary') {
    return parseBinaryPcdContent(buffer, headerInfo)
  }

  if (headerInfo.dataType === 'binary_compressed') {
    console.warn('暂不支持 binary_compressed PCD 数据')
    return []
  }

  return parseAsciiPcdContent(new TextDecoder('utf-8').decode(buffer))
}

const clampPointCloudScale = (value: number) => {
  const MIN_SCALE = 0.01
  const MAX_SCALE = 50
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

const adjustPointCloudScale = (delta: number) => {
  pointCloudScale.value = clampPointCloudScale(pointCloudScale.value + delta)
}

const clampPointCloudPointSize = (value: number) => {
  const MIN_SIZE = 0.5
  const MAX_SIZE = 3
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, value))
}

const handlePointCloudWheel = (event: WheelEvent) => {
  const direction = event.deltaY < 0 ? 1 : -1
  adjustPointCloudScale(direction * 0.1)
  schedulePointCloudRender()
}

const handlePointCloudKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const tagName = target?.tagName
  const isTypingElement = tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable
  if (isTypingElement || event.ctrlKey || event.metaKey || event.altKey) {
    return
  }

  if (event.key === '+' || event.key === '=') {
    pointCloudPointSize.value = clampPointCloudPointSize(pointCloudPointSize.value + 0.1)
    schedulePointCloudRender()
    event.preventDefault()
  } else if (event.key === '-' || event.key === '_') {
    pointCloudPointSize.value = clampPointCloudPointSize(pointCloudPointSize.value - 0.1)
    schedulePointCloudRender()
    event.preventDefault()
  }
}

const handlePointCloudPointerMove = (event: PointerEvent) => {
  if (!isPointCloudDragging.value || (activePointerId !== null && event.pointerId !== activePointerId)) return
  const deltaX = event.clientX - lastPointerX
  const deltaY = event.clientY - lastPointerY
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  if (pointCloudDragMode === 'pan') {
    const canvas = pointCloudCanvas.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    pointCloudPanX.value += deltaX / rect.width
    pointCloudPanY.value += deltaY / rect.height
  } else {
    pointCloudRotationY.value += deltaX * 0.005
    const nextPitch = pointCloudRotationX.value - deltaY * 0.005
    const clampPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, nextPitch))
    pointCloudRotationX.value = clampPitch
  }
  schedulePointCloudRender()
}

const stopPointCloudDragging = () => {
  if (!isPointCloudDragging.value) return
  isPointCloudDragging.value = false
  activePointerId = null
  pointCloudDragMode = null
  window.removeEventListener('pointermove', handlePointCloudPointerMove)
  window.removeEventListener('pointerup', stopPointCloudDragging)
  window.removeEventListener('pointercancel', stopPointCloudDragging)
}

const handlePointCloudPointerDown = (event: PointerEvent) => {
  event.preventDefault()
  if (isPointCloudDragging.value) return
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  isPointCloudDragging.value = true
  activePointerId = event.pointerId
  const shouldPan = event.button === 2 || (event.button === 0 && event.ctrlKey)
  pointCloudDragMode = shouldPan ? 'pan' : 'rotate'
  window.addEventListener('pointermove', handlePointCloudPointerMove)
  window.addEventListener('pointerup', stopPointCloudDragging)
  window.addEventListener('pointercancel', stopPointCloudDragging)
}

const drawPointCloud = () => {
  const canvas = pointCloudCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

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

  const yaw = pointCloudRotationY.value
  const pitch = pointCloudRotationX.value
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const cosPitch = Math.cos(pitch)
  const sinPitch = Math.sin(pitch)
  const baseScale = Math.min(rect.width, rect.height) * 0.8 * pointCloudScale.value
  const panOffsetX = pointCloudPanX.value * rect.width
  const panOffsetY = pointCloudPanY.value * rect.height
  const cameraDistance = 2.2
  const depthScale = 1.4

  pointCloudData.value.forEach(point => {
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

    const radius = (1.2 + point.intensity * 2) * perspective * pointCloudPointSize.value
    const red = Math.floor(40 + point.intensity * 200)
    const green = Math.floor(120 + point.intensity * 100)
    const blue = 255
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.35 + point.intensity * 0.4})`
    ctx.beginPath()
    ctx.arc(projectedX, projectedY, radius, 0, Math.PI * 2)
    ctx.fill()
  })
}

const refreshPointCloud = async () => {
  pointCloudLoading.value = true
  pointCloudError.value = ''
  try {
    let buffer: ArrayBuffer | null = null
    
    // 优先从 IndexedDB 获取当前选中地图的点云文件
    if (selectedMap.value) {
      const blob = await getMapFile(selectedMap.value, 'tinyMap.pcd')
      if (blob) {
        buffer = await blob.arrayBuffer()
      }
    }
    
    // 如果没有下载的地图文件，使用默认测试文件
    if (!buffer) {
      const response = await fetch(tinymapPcdUrl)
      if (!response.ok) {
        throw new Error('PCD 文件加载失败')
      }
      buffer = await response.arrayBuffer()
    }
    
    const parsedPoints = parsePcdBuffer(buffer)
    pointCloudData.value = parsedPoints.length ? parsedPoints : generateMockPointCloud()
    await nextTick()
    schedulePointCloudRender()
  } catch (error) {
    pointCloudError.value = '点云数据加载失败'
    pointCloudData.value = generateMockPointCloud()
    await nextTick()
    schedulePointCloudRender()
  } finally {
    pointCloudLoading.value = false
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
const droneDisplayPosition = computed(() => {
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

    // 获取最新的三条报警数据
const loadLatestAlarmData = async () => {
  try {
    const { dockSns, droneSns } = getCachedDeviceSns()
    const allSns = [...dockSns, ...droneSns]
    
    if (allSns.length === 0) {
      return
    }
    
    // 获取所有设备的报警数据
    const allAlerts: any[] = []
    
    for (const sn of allSns) {
      try {
        const response = await fetchDeviceHms(sn)
        if (response && response.length > 0) {
          allAlerts.push(...response)
        }
      } catch (err) {
        // 静默处理错误
      }
    }
    
    // 按时间排序，取最新的三条
    const sortedAlerts = allAlerts
      .sort((a, b) => b.create_time - a.create_time)
      .slice(0, 3)
    
    // 转换为首页需要的格式
    deviceAlarmData.value = sortedAlerts.map(alert => {
      const deviceType = dockSns.includes(alert.device_sn) ? '机场' : '无人机'
      return {
        deviceName: alert.device_sn,
        time: formatTimestamp(alert.create_time),
        type: deviceType,
        level: alert.level === 1 ? '普通' : '严重',
        content: alert.message_zh
      }
    })
  } catch (err) {
    // 静默处理错误
  }
}

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
const waylineTaskName = computed(() => {
  return waylineJobDetail.value?.name || '暂无任务'
})

const waylineTaskStartTime = computed(() => {
  if (!waylineJobDetail.value?.begin_time) return '--'
  return formatTimestamp(new Date(waylineJobDetail.value.begin_time).getTime())
})

const waylineCurrentWaypoint = computed(() => {
  return waylineProgress.value?.ext?.current_waypoint_index || 0
})

const waylineTaskStatus = computed(() => {
  return taskProgressStore.taskStatus
})

const waylineProgressPercent = computed(() => {
  return taskProgressStore.taskProgressPercent
})

const waylineTaskStatusText = computed(() => {
  const status = waylineProgress.value?.status
  if (!status) return '未知'
  
  const statusTextMap: Record<string, string> = {
    'canceled': '取消或终止',
    'failed': '失败',
    'in_progress': '执行中',
    'ok': '执行成功',
    'partially_done': '部分完成',
    'paused': '暂停',
    'rejected': '拒绝',
    'sent': '已下发',
    'timeout': '超时'
  }
  
  return statusTextMap[status] || '未知'
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
const videoStreamUrl = ref<string>('webrtc://10.10.1.3:1985/live/robot_001_cam_rtsp_left')
const videoPlayer = ref<any>(null)
const videoElement = ref<HTMLVideoElement | null>(null)

// 云台切换相关
const currentVideoType = ref<'dock' | 'drone_visible' | 'drone_infrared'>('dock')
const videoLoading = ref(false)
const startVideoPlayback = () => {
  if (!videoElement.value || !videoStreamUrl.value) {
    console.warn('startVideoPlayback: videoElement 或 videoStreamUrl 不存在')
    return
  }
  try {
    if (videoPlayer.value) {
      videoPlayer.value.destroy()
      videoPlayer.value = null
    }
    if (videoElement.value) {
      videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
      videoElement.value.addEventListener('play', () => {
        isVideoPlaying.value = true
        console.log('videoElement 播放事件触发')
      })
      videoElement.value.addEventListener('pause', () => {
        isVideoPlaying.value = false
        console.log('videoElement 暂停事件触发')
      })
      videoElement.value.addEventListener('timeupdate', updateVideoTime)
      videoElement.value.addEventListener('loadedmetadata', () => {
        updateVideoTime()
        console.log('videoElement loadedmetadata 事件')
      })
      videoElement.value.addEventListener('loadeddata', () => {
        const el = videoElement.value
        if (!el) return
        el.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
        console.log('videoElement loadeddata 事件')
      })
    }
    if (videoStreamUrl.value.startsWith('webrtc://')) {
      console.log('startVideoPlayback: 检测到 webrtc 流，调用 startWebRTCPlayback', videoStreamUrl.value)
      startWebRTCPlayback()
    } else if (videoStreamUrl.value.startsWith('rtmp://')) {
      if (flvjs.isSupported()) {
        const flvUrl = videoStreamUrl.value.replace(/^rtmp:\/\/[^\/]+/, config.api.domain)
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
        videoPlayer.value.attachMediaElement(videoElement.value)
        videoPlayer.value.load()
        videoPlayer.value.play()
        if (videoElement.value) {
          videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
        }
        console.log('startVideoPlayback: flv.js 播放器已初始化')
      } else {
        console.warn('startVideoPlayback: flv.js 不支持')
      }
    } else {
      videoElement.value.src = videoStreamUrl.value
      videoElement.value.load()
      videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
      videoElement.value.play().then(() => {
        console.log('startVideoPlayback: 原生流 play 成功')
      }).catch(error => {
        console.error('startVideoPlayback: 原生流 play 失败', error)
      })
    }
  } catch (error) {
    console.error('startVideoPlayback: 初始化失败', error)
  }
}
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
const startWebRTCPlayback = async () => {
  if (isPlaying) {
    stopWebRTCPlayback()
  }
  const serverUrl = videoStreamUrl.value
  if (!serverUrl) {
    console.warn('startWebRTCPlayback: serverUrl 为空')
    return
  }
  try {
    if (pc) {
      pc.close()
      pc = null
    }
    pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })
    pc.ontrack = (e) => {
      if (videoElement.value) {
        videoElement.value.srcObject = e.streams[0]
        videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
        videoElement.value.play().then(() => {
          console.log('startWebRTCPlayback: WebRTC流 play 成功')
        }).catch(err => {
          console.error('startWebRTCPlayback: WebRTC流 play 失败', err)
        })
        console.log('startWebRTCPlayback: ontrack 触发，已设置 srcObject')
      }
    }
    pc.oniceconnectionstatechange = () => {
      console.log('startWebRTCPlayback: ICE 状态', pc?.iceConnectionState)
      if (pc?.iceConnectionState === 'connected') {
        isPlaying = true
      } else if (pc?.iceConnectionState === 'failed') {
        stopWebRTCPlayback()
      }
    }
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })
    await pc.setLocalDescription(offer)
    const apiUrl = buildApiUrl(serverUrl)
    console.log('startWebRTCPlayback: 请求 SRS /rtc/v1/play/', apiUrl, serverUrl)
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
      console.error('startWebRTCPlayback: SRS 服务器响应错误', response.status)
      throw new Error(`服务器响应错误: ${response.status}`)
    }
    const data = await response.json()
    if (data.code !== 0) {
      console.error('startWebRTCPlayback: SRS 错误', data.msg)
      throw new Error(`SRS错误: ${data.msg}`)
    }
    await pc.setRemoteDescription({
      type: 'answer',
      sdp: data.sdp
    })
    console.log('startWebRTCPlayback: setRemoteDescription 完成')
  } catch (error) {
    console.error('startWebRTCPlayback: 失败', error)
    stopWebRTCPlayback()
  }
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
const currentTime = ref('00:00')
const totalTime = ref('00:00')
const infraredVideoElement = ref<HTMLVideoElement | null>(null)
const infraredVideoPlayer = ref<any>(null)
const infraredStreamUrl = ref('')
const infraredLoading = ref(false)
const infraredError = ref('')
let infraredPc: RTCPeerConnection | null = null

// 初始化视频播放器
const initVideoPlayer = () => {
  // 从video_streams缓存中获取默认视频流
  const defaultVideoType = getDefaultVideoType()
  
  if (defaultVideoType) {
    const defaultStream = getVideoStream(defaultVideoType)
    
    if (defaultStream) {
      videoStreamUrl.value = defaultStream.url
      currentVideoType.value = defaultVideoType
  // ...
    }
  }
  
  // 由watch(videoStreamUrl)统一触发播放，避免重复拉流
}

// 开始视频播放
const startVideoPlayback = () => {
  if (!videoElement.value || !videoStreamUrl.value) {
    return
  }

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
      })
      
      videoElement.value.addEventListener('pause', () => {
        isVideoPlaying.value = false
      })
      
      videoElement.value.addEventListener('timeupdate', updateVideoTime)
      
      videoElement.value.addEventListener('loadedmetadata', () => {
        updateVideoTime()
      })
      
      // 确保视频加载后也应用样式（元素可能在回调触发时已不存在，需判空）
      videoElement.value.addEventListener('loadeddata', () => {
        const el = videoElement.value
        if (!el) return
        el.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
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
      } else {
        // 浏览器不支持flv.js
      }
    } else {
      videoElement.value.src = videoStreamUrl.value
      videoElement.value.load()
      
      // 强制设置原生视频播放器样式
      videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
      
      videoElement.value.play().catch(error => {
        // 静默处理播放失败
      })
    }
  } catch (error) {
    // 静默处理初始化失败
  }
}

// WebRTC播放器实例
let pc: RTCPeerConnection | null = null
let isPlaying = false

// 构建SRS API地址
const buildApiUrl = (webrtcUrl: string) => {
  try {
    // webrtc://server:8000/app/stream -> http://server:1985
    const url = new URL(webrtcUrl)
    return `http://${url.hostname}:1985`
  } catch (error) {
    // 后备方案
    return webrtcUrl.replace('webrtc://', 'http://').replace(':8000', ':1985').split('/')[0]
  }
}

// 开始WebRTC播放
const startWebRTCPlayback = async () => {
  if (isPlaying) {
    stopWebRTCPlayback()
  }

  const serverUrl = videoStreamUrl.value
  if (!serverUrl) {
    return
  }

  try {
    
    // 确保之前的连接已清理
    if (pc) {
      pc.close()
      pc = null
    }
    
    // 创建新的RTCPeerConnection
    pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })

    // 处理远程流
    pc.ontrack = (e) => {
      if (videoElement.value) {
        videoElement.value.srcObject = e.streams[0]
        
        // 强制设置WebRTC视频播放器样式
        videoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
        
        videoElement.value.play().catch(err => {
          // 静默处理播放失败
        })
      }
    }

    // ICE连接状态监听
    pc.oniceconnectionstatechange = () => {
      if (pc?.iceConnectionState === 'connected') {
        isPlaying = true
      } else if (pc?.iceConnectionState === 'failed') {
        stopWebRTCPlayback()
      }
    }

    // 创建offer
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })
    
    await pc.setLocalDescription(offer)

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
      throw new Error(`服务器响应错误: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.code !== 0) {
      throw new Error(`SRS错误: ${data.msg}`)
    }

    // 设置远程描述
    await pc.setRemoteDescription({
      type: 'answer',
      sdp: data.sdp
    })

  } catch (error) {
    stopWebRTCPlayback()
  }
}

// 停止WebRTC播放
const stopWebRTCPlayback = () => {
  if (pc) {
    pc.close()
    pc = null
  }

  if (videoElement.value) {
    videoElement.value.srcObject = null
  }
  
  isPlaying = false
}

// 停止视频播放
const stopVideoPlayback = () => {
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
}

// 重新加载视频
const reloadVideo = () => {
  stopVideoPlayback()
  // 增加延迟确保资源完全清理
  setTimeout(() => {
    startVideoPlayback()
  }, 500)
}

const initInfraredVideo = () => {
  const stream = getVideoStream('drone_infrared')
  if (stream) {
    infraredStreamUrl.value = stream.url
    infraredError.value = ''
  } else {
    infraredError.value = '未找到红外视频流'
  }
}

const startInfraredPlayback = () => {
  if (!infraredVideoElement.value || !infraredStreamUrl.value) return

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
    startInfraredWebRTCPlayback()
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
      infraredVideoPlayer.value.play().finally(() => {
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
    infraredLoading.value = false
  }).catch(() => {
    infraredError.value = '红外视频加载失败'
    infraredLoading.value = false
  })
}

const startInfraredWebRTCPlayback = async () => {
  const serverUrl = infraredStreamUrl.value
  if (!serverUrl || !infraredVideoElement.value) {
    infraredLoading.value = false
    return
  }

  try {
    stopInfraredWebRTCPlayback()
    infraredPc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })

    infraredPc.ontrack = (e) => {
      if (!infraredVideoElement.value) return
      infraredVideoElement.value.srcObject = e.streams[0]
      infraredVideoElement.value.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important;'
      infraredVideoElement.value.play().catch(() => {
        infraredError.value = '红外视频播放失败'
      })
      infraredLoading.value = false
    }

    infraredPc.oniceconnectionstatechange = () => {
      if (infraredPc?.iceConnectionState === 'failed') {
        infraredError.value = '红外连接失败'
        stopInfraredWebRTCPlayback()
      }
    }

    const offer = await infraredPc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })
    await infraredPc.setLocalDescription(offer)
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

    await infraredPc.setRemoteDescription({
      type: 'answer',
      sdp: data.sdp
    })
    infraredLoading.value = false
  } catch (error) {
    infraredError.value = '红外视频播放失败'
    infraredLoading.value = false
    stopInfraredWebRTCPlayback()
  }
}

const stopInfraredWebRTCPlayback = () => {
  if (infraredPc) {
    infraredPc.close()
    infraredPc = null
  }
}

const stopInfraredPlayback = () => {
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
}

const reloadInfraredStream = () => {
  const stream = getVideoStream('drone_infrared')
  if (!stream) {
    infraredError.value = '未找到红外视频流'
    return
  }
  stopInfraredPlayback()
  infraredStreamUrl.value = ''
  nextTick(() => {
    infraredStreamUrl.value = stream.url
  })
}

// 航线选择相关
const selectedWayline = ref('')
const selectedMultiTask = ref('')
const mapList = ref<string[]>([])
const selectedMap = ref('')
const showWaylineDropdown = ref(false)

// 导航、INS、MSF 状态
const navigationEnabled = ref(false)
const insEnabled = ref(false)
const msfEnabled = ref(false)

// 当前活动任务类型：'wayline' | 'point' | 'multi' | null
const activeTaskType = ref<'wayline' | 'point' | 'multi' | 'track' | null>(null)

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
  form: {
    action: 1, // 固定为1，表示启动
    wait: 0, // 0=立即启动, 1=不立即启动
    obs_mode: 1, // 1=近障模式, 2=停障模式, 3=绕障模式
    track_name: '',
    taskpoint_name: '',
    gait_type: 0 // 0=行走步态, 1=斜坡步态, 2=越障步态, 3=楼梯步态, 4=帧楼梯步态, 5=帧45°楼梯步态, 6=L行走步态, 7=山地步态, 8=静音步态
  }
})

// 多任务组启动弹窗
const multiTaskStartDialog = ref({
  visible: false,
  form: {
    group_name: '',
    loop: false
  }
})

// 发布点任务启动弹窗
const pointTaskStartDialog = ref({
  visible: false,
  form: {
    task_id: 0,
    task_name: '',
    circle: false,
    recover: false
  }
})

// 关键点文件列表（用于循迹任务启动弹窗）
const taskpointList = ref<string[]>([])

// 获取关键点文件列表
const fetchTaskpointList = async (trackName: string) => {
  const robotId = deviceStore.selectedRobotId
  if (!robotId || !trackName) {
    taskpointList.value = []
    return
  }
  
  try {
    const response = await navigationApi.getTaskpointList(robotId, trackName)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      taskpointList.value = response.msg.result
    } else {
      taskpointList.value = []
    }
  } catch (error) {
  // ...
    taskpointList.value = []
  }
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
      if (!selectedPointTask.value) {
        selectedPointTask.value = firstId
      }
      if (!selectedMultiTask.value) {
        selectedMultiTask.value = firstId
      }
    }
  } catch (err) {
    // 静默处理错误
  }
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

// 获取地图文件
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
const shouldDownloadMap = (mapName: string, serverUpdateTime: string): boolean => {
  const config = getMapConfig()
  const localUpdateTime = config[mapName]
  
  // 配置中没有该地图，需要下载
  if (!localUpdateTime) {
    return true
  }
  
  // 更新时间不一致，需要重新下载
  return localUpdateTime !== serverUpdateTime
}

// 下载地图文件
const downloadMapFiles = async (mapName: string, updateTime: string) => {
  // 验证配置文件，检查是否需要下载
  if (!shouldDownloadMap(mapName, updateTime)) {
    return
  }
  
  // 获取机器人 IP
  const robotInfo = deviceStore.selectedRobot
  if (!robotInfo?.ip_address) {
    return
  }
  
  const robotIp = robotInfo.ip_address
  
  // 下载文件
  const files = await mapFileApi.downloadAllMapFiles(robotIp, mapName)
  
  // 保存文件到 IndexedDB
  for (const [fileName, blob] of files) {
    await saveMapFile(mapName, fileName, blob)
  }
  
  // 下载成功后更新配置文件
  if (files.size === mapFileApi.MAP_FILES.length) {
    updateMapConfig(mapName, updateTime)
  }
}

// 获取地图文件 URL（用于渲染）
const getMapFileUrl = async (mapName: string, fileName: string): Promise<string | null> => {
  const blob = await getMapFile(mapName, fileName)
  return blob ? URL.createObjectURL(blob) : null
}

// 地图更新时间映射（运行时使用，key: 地图名, value: 更新时间）
const mapUpdateTimeMap = ref<Record<string, string>>({})

// 获取地图列表
const fetchMapList = async () => {
  const robotId = deviceStore.selectedRobotId
  if (!robotId) {
    console.warn('未选择机器人，无法获取地图列表')
    return
  }
  
  try {
    const response = await navigationApi.getMapList(robotId)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      // 处理地图名称和更新时间
      const tempMapList: string[] = []
      const tempUpdateTimeMap: Record<string, string> = {}
      
      response.msg.result.forEach(item => {
        const atIndex = item.indexOf('@')
        if (atIndex !== -1) {
          const mapName = item.substring(0, atIndex)
          const updateTime = item.substring(atIndex + 1) // @ 后面的部分是更新时间
          tempMapList.push(mapName)
          tempUpdateTimeMap[mapName] = updateTime
        } else {
          tempMapList.push(item)
          tempUpdateTimeMap[item] = '' // 没有更新时间
        }
      })
      
      mapList.value = tempMapList
      mapUpdateTimeMap.value = tempUpdateTimeMap
      
      // 缓存地图列表和更新时间映射
      localStorage.setItem('cached_map_list', JSON.stringify(mapList.value))
      localStorage.setItem('cached_map_update_time_map', JSON.stringify(mapUpdateTimeMap.value))
      
      // 默认选择第一个地图
      if (mapList.value.length > 0) {
        selectedMap.value = mapList.value[0]
      }
    } else {
  // ...
    }
  } catch (err) {
  // ...
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_map_list')
    const cachedTimeMap = localStorage.getItem('cached_map_update_time_map')
    if (cached) {
      mapList.value = JSON.parse(cached)
      if (cachedTimeMap) {
        mapUpdateTimeMap.value = JSON.parse(cachedTimeMap)
      }
      if (mapList.value.length > 0 && !selectedMap.value) {
        selectedMap.value = mapList.value[0]
      }
    }
  }
}

// 循迹任务列表
const trackList = ref<string[]>([])
const selectedTrack = ref('')

const fetchTrackList = async () => {
  const robotId = deviceStore.selectedRobotId
  if (!robotId) return
  
  try {
    const response = await navigationApi.getTrackList(robotId)
    if (response && response.msg && response.msg.error_code === 0 && response.msg.result) {
      trackList.value = response.msg.result
    }
  } catch (error) {
  // ...
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
  selectedTrack.value = ''
  // 自动选择第一个
  if (filteredTrackList.value.length > 0) {
    selectedTrack.value = filteredTrackList.value[0]
  }

  // 切换地图时检查并下载地图文件和所有轨迹文件
  if (newMapName) {
    try {
      // 获取该地图的更新时间
      const updateTime = mapUpdateTimeMap.value[newMapName] || ''
      await downloadMapFiles(newMapName, updateTime)

      // 下载所有轨迹文件（带更新时间校验）
      if (trackList.value.length > 0) {
        // 只处理属于当前地图的轨迹
        const relatedTracks = trackList.value.filter(track => track.startsWith(newMapName + '_'))
        await downloadAllTrajectoryFiles(relatedTracks)
      }

      // 地图文件和轨迹文件下载/验证完成后，刷新点云图
      await refreshPointCloud()
    } catch (err) {
      // 下载失败也尝试刷新点云图（可能使用缓存）
      await refreshPointCloud()
    }
  }
})

// 监听 filteredTrackList 变化，确保有数据时自动选择第一个
watch(filteredTrackList, (newList) => {
  if (newList.length > 0 && !selectedTrack.value) {
    selectedTrack.value = newList[0]
  }
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

const fetchPointTaskList = async () => {
  const robotId = deviceStore.selectedRobotId
  if (!robotId) return
  
  try {
    const response = await navigationApi.getPointTaskList(robotId)
    if (response && response.data) {
      pointTaskList.value = response.data
      // 缓存发布点任务列表
      localStorage.setItem('cached_point_task_list', JSON.stringify(pointTaskList.value))
    }
  } catch (error) {
  // ...
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_point_task_list')
    if (cached) {
      pointTaskList.value = JSON.parse(cached)
    }
  }
}

// 监听 pointTaskList 变化，确保有数据时自动选择第一个
watch(pointTaskList, (newList) => {
  if (newList.length > 0 && !selectedPointTask.value) {
    selectedPointTask.value = newList[0].task_id
  }
})

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
  if (newList.length > 0) {
    selectedPointTask.value = newList[0].task_id
  } else {
    selectedPointTask.value = ''
  }
})

// 多任务组列表
interface MultiTask {
  multitask_id: string
  multitask_name: string
  multitask_list: any[]
}

const multiTaskList = ref<MultiTask[]>([])

const fetchMultiTaskList = async () => {
  const robotId = deviceStore.selectedRobotId
  if (!robotId) return
  
  try {
    const response = await navigationApi.getMultiTaskList(robotId)
    if (response && response.msg) {
      multiTaskList.value = response.msg
      // 缓存多任务组列表
      localStorage.setItem('cached_multi_task_list', JSON.stringify(multiTaskList.value))
    }
  } catch (error) {
  // ...
    // 尝试从缓存加载
    const cached = localStorage.getItem('cached_multi_task_list')
    if (cached) {
      multiTaskList.value = JSON.parse(cached)
    }
  }
}

// 监听 multiTaskList 变化，确保有数据时自动选择第一个
watch(multiTaskList, (newList) => {
  if (newList.length > 0 && !selectedMultiTask.value) {
    selectedMultiTask.value = newList[0].multitask_id
  }
})

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
  // 没有活动任务
  const noActiveTask = activeTaskType.value === null
  return hasNavEnabled && noActiveTask
})

// 下发任务处理
const handleDispatchTask = () => {
  if (!canDispatchTask.value) {
    if (!navigationEnabled.value && !insEnabled.value && !msfEnabled.value) {
      alert('请先开启导航、INS或MSF')
    } else if (activeTaskType.value) {
      alert('已有任务在执行中，请先取消当前任务')
    }
    return
  }
  
  // 检查是否选择了循迹任务
  if (!selectedTrack.value) {
    alert('请先选择循迹任务')
    return
  }
  
  // 打开循迹任务启动弹窗
  trackStartDialog.value.form.track_name = selectedTrack.value
  trackStartDialog.value.form.taskpoint_name = ''
  trackStartDialog.value.form.obs_mode = 1
  trackStartDialog.value.form.gait_type = 0
  trackStartDialog.value.form.wait = 0
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
  if (!canDispatchTask.value) {
    if (!navigationEnabled.value && !insEnabled.value && !msfEnabled.value) {
      alert('请先开启导航、INS或MSF')
    } else if (activeTaskType.value) {
      alert('已有任务在执行中，请先取消当前任务')
    }
    return
  }
  
  if (!selectedPointTask.value) {
    alert('请先选择一个发布点任务')
    return
  }
  
  // 查找选中的任务信息
  const selectedTask = filteredPointTaskList.value.find(task => task.task_id === selectedPointTask.value)
  if (!selectedTask) {
    alert('未找到选中的发布点任务')
    return
  }
  
  // 打开弹窗并设置表单数据
  pointTaskStartDialog.value.form.task_id = parseInt(selectedTask.task_id)
  pointTaskStartDialog.value.form.task_name = selectedTask.task_name
  pointTaskStartDialog.value.form.circle = false
  pointTaskStartDialog.value.form.recover = false
  pointTaskStartDialog.value.visible = true
}

const handleDispatchMultiTask = () => {
  if (!canDispatchTask.value) {
    if (!navigationEnabled.value && !insEnabled.value && !msfEnabled.value) {
      alert('请先开启导航、INS或MSF')
    } else if (activeTaskType.value) {
      alert('已有任务在执行中，请先取消当前任务')
    }
    return
  }
  
  if (!selectedMultiTask.value) {
    alert('请先选择一个多任务组')
    return
  }
  
  // 查找选中的任务组名称
  const selectedTask = multiTaskList.value.find(task => task.multitask_id === selectedMultiTask.value)
  if (!selectedTask) {
    alert('未找到选中的多任务组')
    return
  }
  
  // 打开弹窗并设置表单数据
  multiTaskStartDialog.value.form.group_name = selectedTask.multitask_name
  multiTaskStartDialog.value.form.loop = false
  multiTaskStartDialog.value.visible = true
}

// 取消任务
const handleCancelTask = async () => {
  if (activeTaskType.value === null) {
    alert('当前没有正在执行的任务')
    return
  }
  
  const taskTypeMap = {
    wayline: '循迹任务',
    point: '发布点任务',
    multi: '多任务组',
    track: '循迹任务'
  }
  
  const taskName = taskTypeMap[activeTaskType.value] || '任务'
  
  showConfirmDialog(`确定要取消当前${taskName}吗？`, async () => {
    try {
      const robotId = deviceStore.selectedRobotId
      if (!robotId) {
        alert('未找到机器人ID')
        return
      }
      
      // 根据任务类型调用不同的取消接口
      if (activeTaskType.value === 'track') {
        // 取消循迹任务
        const response = await navigationApi.cancelTrack(robotId)
  // ...
        
        if (response && (response as any).response && (response as any).response.msg) {
          const { error_code, error_msg } = (response as any).response.msg
          if (error_code === 0) {
            alert((response as any).message || '循迹任务已取消')
            activeTaskType.value = null
          } else {
            alert(`取消失败: ${error_msg || '未知错误'}`)
          }
        } else {
          alert('循迹任务已取消')
          activeTaskType.value = null
        }
      } else if (activeTaskType.value === 'point') {
        // 停止发布点任务
        const taskId = parseInt(selectedPointTask.value)
        if (!taskId) {
          alert('未找到任务ID')
          return
        }
        
        const response = await navigationApi.stopPointTask({
          task_id: taskId,
          circle: false,
          recover: false
        })
  // ...
        
        if (response && (response as any).response && (response as any).response.msg) {
          const { error_code, error_msg } = (response as any).response.msg
          if (error_code === 0) {
            alert((response as any).message || '发布点任务已停止')
            activeTaskType.value = null
          } else {
            alert(`停止失败: ${error_msg || '未知错误'}`)
          }
        } else {
          alert('发布点任务已停止')
          activeTaskType.value = null
        }
      } else if (activeTaskType.value === 'multi') {
        // 取消多任务组
        const response = await navigationApi.cancelMultiTaskGroup(robotId)
  // ...
        
        if (response && (response as any).response && (response as any).response.msg) {
          const { error_code, error_msg } = (response as any).response.msg
          if (error_code === 0) {
            alert((response as any).message || '多任务组已取消')
            activeTaskType.value = null
          } else {
            alert(`取消失败: ${error_msg || '未知错误'}`)
          }
        } else {
          alert('多任务组已取消')
          activeTaskType.value = null
        }
      } else {
        // 其他任务类型的取消逻辑（暂时只清除状态）
        activeTaskType.value = null
  // ...
        alert(`${taskName}已取消`)
      }
    } catch (error) {
  // ...
      alert('取消任务失败，请稍后重试')
    }
  })
}

const handleEnableNavigation = () => {
  // 检查是否被禁用
  if (insEnabled.value || msfEnabled.value) {
    return
  }
  
  if (!selectedMap.value) {
    alert('请先选择地图')
    return
  }
  
  const action = navigationEnabled.value ? '关闭' : '开启'
  showConfirmDialog(`确定要${action}导航吗？`, async () => {
    try {
      const robotId = deviceStore.selectedRobotId
      if (!robotId) return

      // action: 1 开启, 0 关闭
      await navigationApi.controlNavigation(robotId, {
        action: navigationEnabled.value ? 0 : 1,
        map_name: selectedMap.value
      })
      
      navigationEnabled.value = !navigationEnabled.value
  // ...
    } catch (err) {
  // ...
      alert(`${action}导航失败`)
    }
  })
}

const handleEnableIns = () => {
  // 检查是否被禁用
  if (navigationEnabled.value || msfEnabled.value) {
    return
  }
  
  const action = insEnabled.value ? '关闭' : '开启'
  showConfirmDialog(`确定要${action}INS吗？`, () => {
    insEnabled.value = !insEnabled.value
  // ...
    // TODO: 调用INS开启/关闭API
  })
}

const handleEnableMsf = () => {
  // 检查是否被禁用
  if (navigationEnabled.value || insEnabled.value) {
    return
  }
  
  const action = msfEnabled.value ? '关闭' : '开启'
  showConfirmDialog(`确定要${action}MSF吗？`, () => {
    msfEnabled.value = !msfEnabled.value
  // ...
    // TODO: 调用MSF开启/关闭API
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
  trackStartDialog.value.visible = false
}

// 循迹任务启动弹窗 - 确认
const onTrackStartConfirm = async () => {
  const form = trackStartDialog.value.form
  
  // 验证循迹任务名称
  if (!form.track_name || form.track_name.trim() === '') {
    alert('循迹任务名称不能为空')
    return
  }
  
  // 验证关键点文件是否选择
  if (!form.taskpoint_name || form.taskpoint_name.trim() === '') {
    alert('请选择关键点文件')
    return
  }
  
  // 验证关键点文件列表是否为空
  if (taskpointList.value.length === 0) {
    alert('当前循迹任务没有可用的关键点文件，请先创建关键点文件')
    return
  }
  
  // 验证避障模式
  if (form.obs_mode === null || form.obs_mode === undefined) {
    alert('请选择避障模式')
    return
  }
  
  try {
    const robotId = deviceStore.selectedRobotId
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
        activeTaskType.value = 'track'
      } else {
        alert(`启动失败: ${error_msg || '未知错误'}`)
      }
    } else {
      alert('启动循迹任务成功')
      trackStartDialog.value.visible = false
      activeTaskType.value = 'track'
    }
  } catch (error) {
    console.error('启动循迹任务失败:', error)
    alert('启动循迹任务失败，请稍后重试')
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
    alert('任务组名称不能为空')
    return
  }
  
  try {
    const robotId = deviceStore.selectedRobotId
    if (!robotId) {
      alert('未找到机器人ID')
      return
    }
    
    // 调用启动多任务组API
    const response = await navigationApi.startMultiTaskGroup(robotId, {
      group_name: form.group_name,
      loop: form.loop
    })
    
    console.log('启动多任务组响应:', response)
    
    // 根据返回结果判断是否成功
    if (response && (response as any).response && (response as any).response.msg) {
      const { error_code, error_msg } = (response as any).response.msg
      if (error_code === 0) {
        alert((response as any).message || '多任务组启动成功')
        multiTaskStartDialog.value.visible = false
        activeTaskType.value = 'multi'
      } else {
        alert(`启动失败: ${error_msg || '未知错误'}`)
      }
    } else {
      alert('启动多任务组成功')
      multiTaskStartDialog.value.visible = false
      activeTaskType.value = 'multi'
    }
  } catch (error) {
    console.error('启动多任务组失败:', error)
    alert('启动多任务组失败，请稍后重试')
  }
}

// 发布点任务启动弹窗 - 取消
const onPointTaskStartCancel = () => {
  pointTaskStartDialog.value.visible = false
}

// 发布点任务启动弹窗 - 确认
const onPointTaskStartConfirm = async () => {
  const form = pointTaskStartDialog.value.form
  
  // 验证任务ID
  if (!form.task_id) {
    alert('任务ID不能为空')
    return
  }
  
  try {
    // 调用启动发布点任务API
    const response = await navigationApi.startPointTask({
      task_id: form.task_id,
      circle: form.circle,
      recover: form.recover
    })
    
    console.log('启动发布点任务响应:', response)
    
    // 根据返回结果判断是否成功
    if (response && (response as any).response && (response as any).response.msg) {
      const { error_code, error_msg } = (response as any).response.msg
      if (error_code === 0) {
        alert((response as any).message || '发布点任务启动成功')
        pointTaskStartDialog.value.visible = false
        activeTaskType.value = 'point'
      } else {
        alert(`启动失败: ${error_msg || '未知错误'}`)
      }
    } else {
      alert('发布点任务启动成功')
      pointTaskStartDialog.value.visible = false
      activeTaskType.value = 'point'
    }
  } catch (error) {
    console.error('启动发布点任务失败:', error)
    alert('启动发布点任务失败，请稍后重试')
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
    
    // 调用一键返航API
    const result = await controlApi.returnHome(dockSn)
    
    // 检查结果并提示用户
    if (result.code === 0) {
      alert('一键返航指令发送成功！')
    } else {
      alert(`一键返航失败: ${result.message}`)
    }
    
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
    nextTick(() => {
      startVideoPlayback()
    })
  }
})

watch(() => infraredStreamUrl.value, (newUrl) => {
  if (!newUrl) return
  nextTick(() => {
    startInfraredPlayback()
  })
})

watch(pointCloudData, () => {
  schedulePointCloudRender()
})

watch(pointCloudCanvas, (canvas) => {
  if (canvas && pointCloudData.value.length > 0) {
    schedulePointCloudRender()
  }
})

watch([pointCloudScale, pointCloudRotationX, pointCloudRotationY, pointCloudPanX, pointCloudPanY, pointCloudPointSize], () => {
  schedulePointCloudRender()
})

onMounted(async () => {
  // 初始化警报声（使用Web Audio API生成）
  
  // 获取最新报警数据
  await loadLatestAlarmData()
  
  // 航线任务进度数据现在由全局store管理，无需本地加载
  
  // 初始化视频播放器
  initVideoPlayer()
  initInfraredVideo()
  await refreshPointCloud()
  
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
  window.addEventListener('keydown', handlePointCloudKeydown)

  window.addEventListener('resize', () => {
    alarmTrendChart?.resize()
    taskPieChart1?.resize()
    taskPieChart2?.resize()
    lineChart?.resize()
    drawPointCloud()
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
        console.log('地图加载完成，开始定位')
        console.log('当前定位数据:', position.value)
        console.log('当前机场状态:', dockStatus.value)
        
        // 地图加载完成后立即尝试定位
        updateMapMarkers(isInitialLoad.value)
        // 标记初始加载完成
        isInitialLoad.value = false
        
        // 如果第一次定位失败，延迟后再次尝试
        setTimeout(() => {
          console.log('延迟后再次尝试定位')
          // console.log('当前定位数据:', position.value)
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

// 组件卸载时清理
onUnmounted(() => {
  // 移除全局事件监听
  document.removeEventListener('click', handleGlobalClick)
  window.removeEventListener('keydown', handlePointCloudKeydown)
  stopPointCloudDragging()

  // 清理机场状态刷新定时器
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
  console.log('displayWayline 开始执行')
  console.log('amapInstance:', !!amapInstance)
  console.log('amapApiRef:', !!amapApiRef)
  console.log('waylineJobDetail:', waylineJobDetail.value)
  
  if (!amapInstance || !amapApiRef || !waylineJobDetail.value) {
    console.log('displayWayline 条件不满足，退出')
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
    console.log('waylineJobDetail完整数据:', waylineJobDetail.value)
    
    // 检查是否有waylines数据
    let waylines = waylineJobDetail.value.waylines
    console.log('waylines:', waylines)
    
    // 如果没有waylines数据，尝试通过file_id获取航线文件详情
    if (!waylines || waylines.length === 0) {
      console.log('没有找到waylines数据，尝试通过file_id获取航线文件详情')
      const workspaceId = getCachedWorkspaceId()
      const fileId = waylineJobDetail.value.file_id
      
      if (workspaceId && fileId) {
        console.log('获取航线文件详情 - workspaceId:', workspaceId, 'fileId:', fileId)
        try {
          const waylineDetail = await fetchWaylineDetail(workspaceId, fileId)
          console.log('航线文件详情:', waylineDetail)
          waylines = waylineDetail.waylines
          console.log('从文件详情获取的waylines:', waylines)
        } catch (error) {
          console.error('获取航线文件详情失败:', error)
          return
        }
      } else {
        console.log('缺少workspaceId或fileId，无法获取航线文件详情')
        return
      }
    }
    
    if (!waylines || waylines.length === 0) {
      console.log('仍然没有找到waylines数据')
      return
    }
    
    const wayline = waylines[0] // 取第一个航线
    const waypoints = wayline.waypoints || []
    console.log('waypoints:', waypoints)
    
    if (waypoints.length === 0) {
      console.log('没有找到waypoints数据')
      return
    }
    
    // 创建航点标记
    const markers: any[] = []
    const path: [number, number][] = []
    
    console.log('开始创建航点标记，共', waypoints.length, '个航点')
    
    waypoints.forEach((waypoint: any, index: number) => {
      const [wgsLng, wgsLat] = waypoint.coordinates || [0, 0]
      console.log(`航点 ${index + 1}:`, { wgsLng, wgsLat })
      
      if (wgsLng && wgsLat) {
        // 将WGS84坐标转换为GCJ-02坐标
        const gcjCoords = transformWGS84ToGCJ02(wgsLng, wgsLat)
        console.log(`航点 ${index + 1} 转换后坐标:`, gcjCoords)
        
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
        console.log(`航点 ${index + 1} 已添加到地图`)
      } else {
        console.log(`航点 ${index + 1} 坐标无效，跳过`)
      }
    })
    
    waylineMarkers.value = markers
    console.log('航点标记创建完成，共', markers.length, '个标记')
    
    // 创建航线
    console.log('准备创建航线，路径点数:', path.length)
    if (path.length > 1) {
      waylinePolyline.value = new amapApiRef.Polyline({
        path: path,
        strokeColor: '#67d5fd',
        strokeWeight: 3,
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      })
      amapInstance.add(waylinePolyline.value)
      console.log('航线已添加到地图')
      } else {
        console.log('路径点数不足，无法创建航线')
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
      console.log(`当前航点 ${currentWaypointIndex + 1} 已添加到地图`)
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

// 机器人控制按钮点击处理
const handleControlClick = (controlName: string) => {
  console.log(`机器人控制指令: ${controlName}`)
  // TODO: 实现具体的控制逻辑
}


// 监听选中的机器人ID变化
watch(() => deviceStore.selectedRobotId, async (newId) => {
  if (newId) {
    await fetchDeviceStatus(newId)
  }
})

onMounted(async () => {
  // 如果有选中的机器人，获取其状态
  if (deviceStore.selectedRobotId) {
    await fetchDeviceStatus(deviceStore.selectedRobotId)
  }
  
  // 获取地图列表
  await fetchMapList()
  // 获取循迹任务列表
  await fetchTrackList()
  // 获取发布点任务列表
  await fetchPointTaskList()
  // 获取多任务组列表
  await fetchMultiTaskList()
})

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

.dispatch-task-row label {
  font-size: 14px;
  color: #b8c7d9;
  min-width: 90px;
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
  width: 20%;
}

.tableOne th:nth-child(2),
.tableOne td:nth-child(2) {
  width: 15%;
}

.tableOne th:nth-child(3),
.tableOne td:nth-child(3) {
  width: 10%;
  text-align: center;
}

.tableOne th:nth-child(4),
.tableOne td:nth-child(4) {
  width: 20%;
}

.tableOne th:nth-child(5),
.tableOne td:nth-child(5) {
  width: 35%;
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
  width: clamp(28px, 3.5vw, 36px);
  height: clamp(22px, 2.5vw, 28px);
  margin-right: 8px;
}

.b-top-rightDiv p:first-child {
  color: #d4edfd;
  font-size: clamp(12px, 1vw, 14px);
  font-weight: 600;
  margin-bottom: 2px;
  line-height: 1;
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

.map-dropdown option {
  background: #0c3c56;
  color: #67d5fd;
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
  display: block;
  height: 156px; /* 固定高度为3行的高度 52px * 3 */
  overflow-y: hidden;
}

.tableOne tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.tableOne th,
.tableOne td {
  padding: 0;
  text-align: center;
  border: none;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.tableOne th {
  line-height: 38px;
  height: 38px;
}

.tableOne td {
  line-height: 52px;
  height: 52px;
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
  background: #000;
  display: flex;
  flex: 1;
}

.video-only-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  background: linear-gradient(#1f87cc33, #1f87cc00);
  border: 1px solid #164159;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.task-name {
  color: #59bfff;
  font-size: 14px;
  line-height: 25px;
  margin: 0;
  padding: 0;
  text-align: left;
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
  gap: 20px;
  padding: 0;
}

.time-item .label {
  color: #59bfff;
  font-size: 12px;
  white-space: nowrap; /* 防止文字换行 */
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

.status-btn.waiting {
  width: 60px;
  height: 20px;
  text-align: center;
  color: #c4cdc9;
  background: linear-gradient(#0bed9654, #0bed9600);
  box-shadow: inset 0 0 6px #0bed96;
  border-radius: 3px;
  font-size: 12px;
  border: 1px solid #0BED96;
  line-height: 20px;
  padding: 0;
}

.status-btn.running {
  width: 60px;
  height: 20px;
  text-align: center;
  color: #1890ff;
  background: linear-gradient(#1890ff54, #1890ff00);
  box-shadow: inset 0 0 6px #1890ff;
  border-radius: 3px;
  font-size: 12px;
  border: 1px solid #1890ff;
  line-height: 20px;
  padding: 0;
}

.status-btn.completed {
  width: 60px;
  height: 20px;
  text-align: center;
  color: #52c41a;
  background: linear-gradient(#52c41a54, #52c41a00);
  box-shadow: inset 0 0 6px #52c41a;
  border-radius: 3px;
  font-size: 12px;
  border: 1px solid #52c41a;
  line-height: 20px;
  padding: 0;
}

.status-btn.failed {
  width: 60px;
  height: 20px;
  text-align: center;
  color: #ff4d4f;
  background: linear-gradient(#ff4d4f54, #ff4d4f00);
  box-shadow: inset 0 0 6px #ff4d4f;
  border-radius: 3px;
  font-size: 12px;
  border: 1px solid #ff4d4f;
  line-height: 20px;
  padding: 0;
}

.status-btn.paused {
  width: 60px;
  height: 20px;
  text-align: center;
  color: #faad14;
  background: linear-gradient(#faad1454, #faad1400);
  box-shadow: inset 0 0 6px #faad14;
  border-radius: 3px;
  font-size: 12px;
  border: 1px solid #faad14;
  line-height: 20px;
  padding: 0;
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

  .status-btn.waiting,
  .status-btn.paused {
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
.big-image-mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.big-image {
  max-width: 80vw;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 4px 24px #000a;
  background: #fff;
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



