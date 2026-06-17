<template>
  <div class="drone-control-main">
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: currentTab === tab.key }]"
          v-permission-click-dialog="tab.permission"
          @click="handleTabClick(tab)"
        >
          <img :src="tab.icon" :alt="tab.label" />
        </div>
      </div>
    </aside>

    <main class="main-content">
      <div class="main-flex">
        <section class="right-panel">
          <!-- 顶部 Header (独立层) -->
          <div class="mission-top-card card">
            <div class="mission-top-header">
              <div style="display: flex; align-items: center;">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="mission-top-title">设备详情</span>
              </div>
            </div>
          </div>

          <!-- 下方内容卡片 -->
          <div class="mission-content-wrapper split-wrapper" style="flex: 1; display: flex; flex-direction: column; min-height: 0; position: relative;">
            <!-- 加载转圈，使用绝对定位覆盖在下方卡片区 -->
            <div v-if="loading" class="robot-info-loading" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 15, 28, 0.85); z-index: 10; border-radius: 10px;">
              <div class="loading-spinner"></div>
              <span>正在同步设备数据...</span>
            </div>

            <!-- 暂无机器人数据 -->
            <div v-else-if="!robotData" class="robot-info-empty" style="flex: 1; min-height: 350px;">
              <div class="empty-icon-wrapper">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <span>暂无机器人数据，请先在右上角选择机器人</span>
            </div>

            <!-- 数据配置内容区 -->
            <template v-if="robotData">
              <div class="dashboard-grid">

        <!-- 左侧 25% 机器人大卡片 -->
        <aside class="dashboard-left">
          <div class="db-card model-card">
            <div class="model-viewport" style="position: relative;">
              <div class="header-status" :class="robotData.status || 'offline'" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 12px;">
                <span class="status-dot"></span>
                <span class="status-text" style="font-size: 13px; font-weight: bold; color: #EAF7FF;">{{ getStatusLabel(robotData.status) }}</span>
              </div>
              <img 
                :src="robotData.robot_type === 'robot_dog' ? dogImg : carImg" 
                alt="Robot Model" 
                class="model-img" 
              />
            </div>
            <div class="model-info">
              <div class="form-group">
                <span class="info-label mb-1">机器人名称</span>
                <input v-model="form.name" class="dash-input text-center model-name-input" placeholder="输入名称..." />
              </div>
              <div class="info-row">
                <span class="info-label">机器人ID</span>
                <span class="info-val">{{ robotData.robot_id || '--' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">类型</span>
                <span class="info-val">{{ getRobotTypeLabel(robotData.robot_type) }}</span>
              </div>
              
              <div class="info-row space-between">
                <span class="info-label">在线状态</span>
                <div class="cyber-switch" :class="{ 'is-active': form.status === 'online' }" @click="form.status = form.status === 'online' ? 'offline' : 'online'">
                  <div class="switch-slider"></div>
                </div>
              </div>

              <div class="form-group flex-1">
                <span class="info-label mb-1">设备描述</span>
                <textarea v-model="form.description" class="dash-input desc-input" placeholder="添加设备描述..."></textarea>
              </div>
            </div>
          </div>
        </aside>

        <!-- 右侧主内容区 -->
        <div class="dashboard-right">
          <!-- 状态驾驶舱 (4个小卡片) -->
          <section class="cockpit-row">
            <div class="db-card stat-card">
              <div class="stat-title">在线状态</div>
              <div class="stat-body">
                <select v-model="form.status" class="dash-select" :class="form.status">
                  <option value="online">● 在线</option>
                  <option value="offline">● 离线</option>
                  <option value="maintenance">● 维护</option>
                </select>
              </div>
            </div>
            <div class="db-card stat-card">
              <div class="stat-title">当前任务</div>
              <div class="stat-body">
                <span class="stat-val highlight-blue">{{ robotData.current_task_name || '空闲' }}</span>
              </div>
            </div>
            <div class="db-card stat-card">
              <div class="stat-title">电池电量</div>
              <div class="stat-body">
                <span class="stat-val highlight-yellow">{{ robotData.battery_level != null ? robotData.battery_level + ' %' : '-- %' }}</span>
              </div>
            </div>
            <div class="db-card stat-card">
              <div class="stat-title">网络延迟</div>
              <div class="stat-body">
                <span class="stat-val highlight-green">12 ms</span>
              </div>
            </div>
          </section>

          <!-- 空间定位与导航状态 -->
          <section class="db-card section-card">
            <div class="section-title">空间定位与导航状态</div>
            <div class="location-grid">
              <div class="loc-item">
                <div class="loc-lbl">X</div>
                <div class="loc-val">{{ formatCoord(robotData.x) }}</div>
              </div>
              <div class="loc-item">
                <div class="loc-lbl">Y</div>
                <div class="loc-val">{{ formatCoord(robotData.y) }}</div>
              </div>
              <div class="loc-item">
                <div class="loc-lbl">Z</div>
                <div class="loc-val">{{ formatCoord(robotData.z) }}</div>
              </div>
              <div class="loc-item">
                <div class="loc-lbl">地图</div>
                <div class="loc-val highlight-blue">{{ robotData.map_name || 'MSF' }}</div>
              </div>
            </div>
          </section>

          <!-- 姿态与运动状态 (简化版) -->
          <section class="db-card section-card">
            <div class="section-title">姿态与运动状态</div>
            <div class="location-grid">
              <div class="loc-item">
                <div class="loc-lbl">偏航角</div>
                <div class="loc-val">{{ robotData.theta != null ? (robotData.theta * 180 / Math.PI).toFixed(1) + '°' : '--' }}</div>
              </div>
              <div class="loc-item">
                <div class="loc-lbl">偏航弧度</div>
                <div class="loc-val">{{ formatCoord(robotData.theta) }}</div>
              </div>
              <div class="loc-item">
                <div class="loc-lbl">Speed V</div>
                <div class="loc-val highlight-blue">{{ robotData.speed_v != null ? robotData.speed_v.toFixed(2) : '0.00' }} <span style="font-size: 11px">m/s</span></div>
              </div>
              <div class="loc-item">
                <div class="loc-lbl">Speed W</div>
                <div class="loc-val highlight-blue">{{ robotData.speed_w != null ? robotData.speed_w.toFixed(2) : '0.00' }} <span style="font-size: 11px">rad/s</span></div>
              </div>
            </div>
          </section>

          <!-- 传感器状态矩阵 (动态配置) -->
          <section class="db-card section-card flex-1-card">
            <div class="section-title" style="display: flex; align-items: center;">
              <span style="font-weight: bold;">传感器设备挂载配置</span>
              <button @click="openAddSensorModal" class="add-sensor-btn" style="margin-left: auto; background: rgba(0, 210, 255, 0.15); border: 1px solid rgba(0, 210, 255, 0.4); color: #EAF7FF; padding: 6px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: bold; transition: all 0.2s;">
                <span class="icon" style="font-size: 18px; font-weight: bold;">+</span> 添加传感器
              </button>
            </div>
            <div class="sensor-matrix">
              <!-- RTK 是固有配置 -->
              <div class="sensor-item interactive" :class="{ 'equipped': extraDataObj.rtk }" @click="extraDataObj.rtk = !extraDataObj.rtk">
                <div class="sensor-header">
                  <div class="sensor-lbl">RTK <span class="sensor-sub">高精度定位</span></div>
                </div>
                <div class="sensor-footer">
                  <div class="sensor-status">
                    <span class="status-dot"></span>
                    <span>{{ extraDataObj.rtk ? '已搭载' : '未挂载' }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 动态添加的传感器 -->
              <div v-for="(sensor, idx) in extraDataObj.sensors" :key="idx" class="sensor-item equipped">
                <div class="sensor-header">
                  <div class="sensor-lbl">{{ sensor.en }} <span class="sensor-sub">{{ sensor.cn }}</span></div>
                  <div class="delete-sensor" @click="removeSensor(idx)" title="移除传感器">×</div>
                </div>
                <div class="sensor-footer">
                  <div class="sensor-status">
                    <span class="status-dot"></span>
                    <span>已搭载</span>
                  </div>
                  <div class="sensor-unit" style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                    <span>{{ sensor.unit || '--' }}</span>
                    <span v-if="sensor.min_val != null || sensor.max_val != null" style="font-size: 11px; opacity: 0.8; color: #8cb7cc;">
                      阈值: {{ sensor.min_val != null ? sensor.min_val : '--' }} ~ {{ sensor.max_val != null ? sensor.max_val : '--' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 底部系统信息与保存栏 -->
        <footer class="dashboard-footer">
          <div class="sys-info">
            <span class="sys-lbl">数据库ID:</span>
            <span class="sys-val">{{ robotData.id }}</span>
          </div>
          <div class="sys-info">
            <span class="sys-lbl">IP:</span>
            <input v-model="form.ip_address" class="dash-input ip-input" placeholder="0.0.0.0" />
          </div>
          <div class="sys-info">
            <span class="sys-lbl">MQTT:</span>
            <span class="sys-val">{{ robotData.mqtt_topic_prefix || '--' }}</span>
          </div>
          <div class="sys-info">
            <span class="sys-lbl">最后心跳:</span>
            <span class="sys-val">{{ formatTime(robotData.last_heartbeat) }}</span>
          </div>
          <div class="spacer"></div>
          <button class="save-btn" @click="onSave" :disabled="saving">
            {{ saving ? '保存中...' : '保存配置' }}
          </button>
        </footer>
            </div>
          </template>
          </div>
        </section>
      </div>
    </main>

    <!-- 添加传感器弹窗 -->
    <div v-if="showSensorModal" class="modal-overlay cyber-modal-overlay">
      <div class="cyber-modal">
        <div class="cyber-modal-corner top-left"></div>
        <div class="cyber-modal-corner bottom-right"></div>
        <h3 class="cyber-modal-title">
          传感器配置
        </h3>
        
        <div class="cyber-form-group">
          <label class="cyber-label">英文名称</label>
          <div class="cyber-input-wrapper">
            <input v-model="newSensor.en" class="cyber-input" placeholder="例: O2, LEL, CO2, NO2" />
            <div class="cyber-input-focus-line"></div>
          </div>
        </div>
        
        <div class="cyber-form-group">
          <label class="cyber-label">中文名称</label>
          <div class="cyber-input-wrapper">
            <input v-model="newSensor.cn" class="cyber-input" placeholder="例: 氧气, 可燃气体" />
            <div class="cyber-input-focus-line"></div>
          </div>
        </div>
        
        <div class="cyber-form-group">
          <label class="cyber-label">测量单位</label>
          <div class="cyber-input-wrapper">
            <input v-model="newSensor.unit" class="cyber-input" placeholder="例: %vol, ppm, mg/m³" />
            <div class="cyber-input-focus-line"></div>
          </div>
        </div>

        <div class="cyber-form-group">
          <label class="cyber-label">上限值 (选填)</label>
          <div class="cyber-input-wrapper">
            <input v-model="newSensor.max_val" type="number" step="any" class="cyber-input" placeholder="请输入报警上限，为空代表无上限" />
            <div class="cyber-input-focus-line"></div>
          </div>
        </div>

        <div class="cyber-form-group">
          <label class="cyber-label">下限值 (选填)</label>
          <div class="cyber-input-wrapper">
            <input v-model="newSensor.min_val" type="number" step="any" class="cyber-input" placeholder="请输入报警下限，为空代表无下限" />
            <div class="cyber-input-focus-line"></div>
          </div>
        </div>
        
        <div class="cyber-modal-actions">
          <button class="cyber-btn cancel-btn" @click="showSensorModal = false">取消</button>
          <button class="cyber-btn confirm-btn" @click="confirmAddSensor">确认</button>
        </div>
      </div>
    </div>

    <ErrorMessage :show="errorMsg.show" :message="errorMsg.text" @close="errorMsg.show = false" />
    <SuccessMessage :show="successMsg.show" :message="successMsg.text" @close="successMsg.show = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { useDeviceStore } from '@/stores/device'
import { robotApi } from '@/api/services'
import type { Robot } from '@/types'
import ErrorMessage from '@/components/ErrorMessage.vue'
import SuccessMessage from '@/components/SuccessMessage.vue'
import bodyInfoIcon from '@/assets/source_data/svg_data/robot_source/body_info.svg'
import userIcon from '@/assets/source_data/svg_data/user.svg'
import roleIcon from '@/assets/source_data/svg_data/role.svg'
import permissionIcon from '@/assets/source_data/svg_data/permission.svg'
import robotInfoIcon from '@/assets/source_data/svg_data/robot_source/robot_info.svg'
import dogImg from '@/assets/source_data/dog.png'
import carImg from '@/assets/source_data/car.png'

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()
const deviceStore = useDeviceStore()

const sidebarTabs = [
  { key: 'body', label: '本体参数', icon: bodyInfoIcon, path: '/dashboard/body-params', permission: 'system-body-show' },
  { key: 'user', label: '用户管理', icon: userIcon, path: '/dashboard/users', permission: 'system-user-show' },
  { key: 'role', label: '角色管理', icon: roleIcon, path: '/dashboard/roles', permission: 'system-role-show' },
  { key: 'super', label: '超级管理员', icon: permissionIcon, path: '/dashboard/super-admin', permission: 'system-super-show' },
  { key: 'robotinfo', label: '设备详情', icon: robotInfoIcon, path: '/dashboard/robot-info', permission: 'system-robotinfo-show' }
]

const currentTab = computed(() => {
  const tab = sidebarTabs.find(item => route.path === item.path)
  return tab?.key ?? 'robotinfo'
})

const handleTabClick = (tab: { key: string; path: string; permission?: string }) => {
  if (tab.permission && !permissionStore.hasPermission(tab.permission)) {
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('permission-denied', { detail: { permission: tab.permission } }))
    }
    return
  }
  if (route.path !== tab.path) router.push(tab.path)
}

const loading = ref(false)
const saving = ref(false)
const robotData = ref<Robot | null>(null)
const errorMsg = ref({ show: false, text: '' })
const successMsg = ref({ show: false, text: '' })
let errorTimer: ReturnType<typeof setTimeout> | null = null
let successTimer: ReturnType<typeof setTimeout> | null = null

const currentTime = ref('')
let timeInterval: ReturnType<typeof setInterval> | null = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toTimeString().split(' ')[0]
}

const form = ref({
  name: '',
  description: '',
  status: '',
  ip_address: '',
  is_active: true
})

interface CustomSensor {
  en: string;
  cn: string;
  unit: string;
  max_val?: number | string | null;
  min_val?: number | string | null;
}

const extraDataObj = ref({
  rtk: false,
  sensors: [] as CustomSensor[]
})

// 添加传感器弹窗状态
const showSensorModal = ref(false)
const newSensor = ref<CustomSensor>({ en: '', cn: '', unit: '', max_val: '', min_val: '' })

const openAddSensorModal = () => {
  newSensor.value = { en: '', cn: '', unit: '', max_val: '', min_val: '' }
  showSensorModal.value = true
}

const confirmAddSensor = () => {
  if (!newSensor.value.en || !newSensor.value.cn) {
    showError('中英文名称不能为空')
    return
  }
  
  const parsedMax = newSensor.value.max_val !== '' && newSensor.value.max_val !== undefined && newSensor.value.max_val !== null 
    ? Number(newSensor.value.max_val) 
    : null
  const parsedMin = newSensor.value.min_val !== '' && newSensor.value.min_val !== undefined && newSensor.value.min_val !== null 
    ? Number(newSensor.value.min_val) 
    : null

  extraDataObj.value.sensors.push({ 
    ...newSensor.value,
    max_val: Number.isNaN(parsedMax) ? null : parsedMax,
    min_val: Number.isNaN(parsedMin) ? null : parsedMin
  })
  showSensorModal.value = false
}

const removeSensor = (idx: number) => {
  extraDataObj.value.sensors.splice(idx, 1)
}

const showError = (text: string) => {
  if (errorTimer) { clearTimeout(errorTimer); errorTimer = null }
  errorMsg.value = { show: true, text }
  errorTimer = setTimeout(() => { errorMsg.value.show = false; errorTimer = null }, 3000)
}

const showSuccess = (text: string) => {
  if (successTimer) { clearTimeout(successTimer); successTimer = null }
  successMsg.value = { show: true, text }
  successTimer = setTimeout(() => { successMsg.value.show = false; successTimer = null }, 2000)
}

const formatCoord = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--'
  return value.toFixed(3)
}

const formatTime = (time: string | null | undefined) => {
  if (!time) return '--'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '--'
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const getStatusLabel = (status: string | null | undefined) => {
  if (!status) return '未知'
  switch (status.toLowerCase()) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'maintenance': return '维护'
    default: return status
  }
}

const getRobotTypeLabel = (type: string | null | undefined) => {
  if (!type) return '通用底盘'
  switch (type.toLowerCase()) {
    case 'four_wheel': return '四轮底盘'
    case 'robot_dog': return '四足机器狗'
    case 'tracked': return '履带式机器人'
    default: return type
  }
}


const populateData = (data: Robot) => {
  form.value.name = data.name || ''
  form.value.description = data.description || ''
  form.value.status = data.status || 'offline'
  form.value.ip_address = data.ip_address || ''
  form.value.is_active = data.is_active ?? true

  let extra = data.extra_data
  if (typeof extra === 'string') {
    try { extra = JSON.parse(extra) } catch { extra = {} }
  }
  extraDataObj.value.rtk = !!extra?.rtk
  
  // 兼容旧的字符串数组、新的对象数组、以及包裹在 sensor 中的字典格式
  let parsedSensors = Array.isArray(extra?.sensors) ? extra.sensors : []
  extraDataObj.value.sensors = parsedSensors.map((s: any) => {
    if (typeof s === 'string') return { en: s, cn: s, unit: '' }
    if (s && typeof s === 'object') {
      const sensorObj = s.sensor || s
      return {
        en: sensorObj.en || '',
        cn: sensorObj.cn || '',
        unit: sensorObj.unit || '',
        max_val: sensorObj.max_val !== undefined ? sensorObj.max_val : null,
        min_val: sensorObj.min_val !== undefined ? sensorObj.min_val : null
      }
    }
    return { en: '', cn: '', unit: '' }
  })
}

const loadRobotDetail = async () => {
  const selectedRobotId = deviceStore.selectedRobotId
  if (!selectedRobotId) {
    robotData.value = null
    return
  }

  loading.value = true
  try {
    const detail = await robotApi.getRobotDetail(selectedRobotId)
    if (detail) {
      robotData.value = detail
      populateData(detail)
    }
  } catch (error) {
    console.error('Failed to load robot detail:', error)
    showError('加载机器人信息失败')
  } finally {
    loading.value = false
  }
}

const onSave = async () => {
  if (!robotData.value) return
  saving.value = true
  try {
    let currentExtra = robotData.value.extra_data
    if (typeof currentExtra === 'string') {
      try { currentExtra = JSON.parse(currentExtra) } catch { currentExtra = {} }
    }
    const extra_data = {
      ...currentExtra,
      rtk: extraDataObj.value.rtk,
      sensors: extraDataObj.value.sensors.map(s => ({
        sensor: {
          en: s.en,
          cn: s.cn,
          unit: s.unit,
          max_val: s.max_val !== '' && s.max_val != null ? Number(s.max_val) : null,
          min_val: s.min_val !== '' && s.min_val != null ? Number(s.min_val) : null
        }
      }))
    }

    const payload: Partial<Robot> = {
      name: form.value.name,
      description: form.value.description || null as any,
      status: form.value.status,
      ip_address: form.value.ip_address,
      is_active: form.value.is_active,
      extra_data
    }

    await robotApi.updateRobot(robotData.value.id, payload)
    showSuccess('配置保存成功')
    await loadRobotDetail()
  } catch (error: any) {
    const msg = error?.detail || error?.message || '保存失败'
    showError(typeof msg === 'string' ? msg : '保存失败')
  } finally {
    saving.value = false
  }
}

watch(() => deviceStore.selectedRobotId, (newId) => {
  if (newId) loadRobotDetail()
  else robotData.value = null
})

onMounted(() => {
  loadRobotDetail()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
@import './mission-common.css';



.dashboard-content {
  flex: 1;
  padding: 12px 16px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 全局布局 Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 24% 1fr;
  grid-template-rows: 1fr auto;
  gap: 12px;
  height: 100%;
  width: 100%;
  padding-bottom: 4px;
}

.dashboard-left {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dashboard-right {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

.dashboard-footer {
  grid-column: 1 / -1;
  grid-row: 2;
  display: flex;
  align-items: center;
  gap: 16px;
  border-top: 1px solid rgba(0, 210, 255, 0.15);
  padding: 6px 12px 0 12px;
  background: rgba(11, 29, 51, 0.4);
  border-radius: 4px;
}

/* 颜色规范类 */
.highlight-blue { color: #00D2FF; }
.highlight-green { color: #00D084; }
.highlight-yellow { color: #FFB020; }
.highlight-red { color: #FF4D4F; }

/* 卡片基础样式 */
.db-card {
  background: rgba(16, 45, 72, 0.42);
  border: 1px solid rgba(0, 210, 255, 0.15);
  box-shadow: inset 0 0 20px rgba(0, 210, 255, 0.05);
  border-radius: 6px;
  box-sizing: border-box;
}

/* 统一输入组件样式 */
.dash-input, .dash-select {
  background: rgba(0, 210, 255, 0.05);
  border: 1px solid rgba(0, 210, 255, 0.2);
  color: #EAF7FF;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.dash-input:focus, .dash-select:focus {
  border-color: #00D2FF;
  background: rgba(0, 210, 255, 0.1);
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.2);
}
.dash-select {
  padding: 4px 6px;
  cursor: pointer;
  appearance: auto;
}
.dash-select option {
  background: #0B1D33;
  color: #EAF7FF;
}

/* 按钮样式 */
.dash-btn {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dash-btn.outline {
  background: transparent;
  border: 1px solid #7EA6C4;
  color: #7EA6C4;
}
.dash-btn.outline:hover {
  background: rgba(126, 166, 196, 0.1);
  color: #EAF7FF;
  border-color: #EAF7FF;
}
.dash-btn.primary {
  background: rgba(0, 210, 255, 0.1);
  border: 1px solid #00D2FF;
  color: #00D2FF;
}
.dash-btn.primary:hover {
  background: #00D2FF;
  color: #fff;
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.4);
}

/* --- Header 样式 --- */
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon { font-size: 18px; }
.header-title {
  font-size: 15px;
  font-weight: bold;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: bold;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  background: #FF4D4F;
  box-shadow: 0 0 6px #FF4D4F;
}
.online .status-dot, .normal .status-dot, .equipped .status-dot { background: #00D084; box-shadow: 0 0 6px #00D084; }
.offline .status-dot, .error .status-dot { background: #FF4D4F; box-shadow: 0 0 6px #FF4D4F; }
.maintenance .status-dot { background: #FFB020; box-shadow: 0 0 6px #FFB020; }

.header-time {
  font-family: 'Consolas', monospace;
  font-size: 14px;
  font-weight: bold;
  color: #00D2FF;
}

/* --- 左侧机器人卡片 --- */
.model-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
}
.model-viewport {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, rgba(0, 210, 255, 0.1) 0%, transparent 70%);
  margin-bottom: 12px;
  min-height: 120px;
}
.model-img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.5));
}
.model-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.form-group {
  display: flex;
  flex-direction: column;
}

.model-name-input {
  font-size: 15px;
  font-weight: bold;
  color: #00D2FF;
  padding: 4px;
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: rgba(0, 210, 255, 0.05);
  padding: 6px 10px;
  border-left: 2px solid #00D2FF;
}
.info-row.space-between {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.info-label {
  font-size: 11px;
  color: #7EA6C4;
}
.info-val {
  font-size: 13px;
  font-weight: bold;
  color: #EAF7FF;
  font-family: 'Consolas', monospace;
}
.flex-1 { flex: 1; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 12px; }
.desc-input {
  height: 100%;
  resize: none;
  padding: 6px;
  font-size: 11px;
}

/* 开关样式 */
.cyber-switch {
  position: relative;
  width: 32px;
  height: 14px;
  background: rgba(5, 15, 30, 0.6);
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.cyber-switch.is-active {
  border-color: #00D084;
  background: rgba(0, 208, 132, 0.1);
}
.switch-slider {
  position: absolute;
  top: 1px;
  left: 2px;
  width: 10px;
  height: 10px;
  background: #7EA6C4;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.cyber-switch.is-active .switch-slider {
  transform: translateX(16px);
  background: #00D084;
  box-shadow: 0 0 4px #00D084;
}

/* --- 右侧状态驾驶舱 --- */
.cockpit-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  height: 60px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 12px;
  gap: 4px;
}
.stat-title {
  font-size: 11px;
  color: #7EA6C4;
}
.stat-body {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stat-val {
  font-size: 15px;
  font-weight: bold;
  font-family: 'Consolas', monospace;
}

/* --- Section Card 通用样式 --- */
.section-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}
.flex-1-card {
  flex: 1; /* 让传感器矩阵占据剩余的所有高度 */
}

.section-title {
  font-size: 12px;
  color: #00D2FF;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}
.section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 10px;
  background: #00D2FF;
  margin-right: 6px;
}
.section-title.space-between {
  justify-content: space-between;
}

/* --- 空间定位与导航状态 --- */
.location-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.loc-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 210, 255, 0.1);
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.loc-lbl {
  font-size: 12px;
  color: #7EA6C4;
  font-weight: bold;
}
.loc-val {
  font-size: 16px;
  font-weight: bold;
  font-family: 'Consolas', monospace;
}

/* --- 传感器矩阵 (模块化机甲面板交互) --- */
.add-sensor-btn {
  background: transparent;
  border: 1px dashed rgba(0, 210, 255, 0.5);
  color: #00D2FF;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.add-sensor-btn:hover {
  background: rgba(0, 210, 255, 0.1);
  border-color: #00D2FF;
}

.sensor-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  align-content: start;
  padding: 4px 4px 12px 0;
}
/* 自定义滚动条 */
.sensor-matrix::-webkit-scrollbar { width: 4px; }
.sensor-matrix::-webkit-scrollbar-thumb { background: rgba(0, 210, 255, 0.2); border-radius: 2px; }

.sensor-item {
  background: linear-gradient(180deg, rgba(11, 29, 51, 0.6) 0%, rgba(7, 20, 36, 0.6) 100%);
  border: 1px solid rgba(0, 210, 255, 0.15);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  min-height: 80px;
}
.sensor-item::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 4px; height: 100%;
  background: rgba(0, 210, 255, 0.3);
  border-radius: 6px 0 0 6px;
  transition: all 0.3s;
}

.sensor-item.interactive {
  cursor: pointer;
}
.sensor-item.interactive:hover {
  border-color: rgba(0, 210, 255, 0.5);
  background: linear-gradient(180deg, rgba(11, 29, 51, 0.9) 0%, rgba(7, 20, 36, 0.9) 100%);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}
.sensor-item.equipped::before {
  background: #00D084;
  box-shadow: 0 0 8px rgba(0, 208, 132, 0.5);
}
.sensor-item.equipped {
  border-color: rgba(0, 208, 132, 0.3);
  background: linear-gradient(180deg, rgba(0, 208, 132, 0.05) 0%, rgba(7, 20, 36, 0.6) 100%);
}

.sensor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}
.sensor-lbl {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #00D2FF;
}
.sensor-sub {
  font-size: 12px;
  color: #7EA6C4;
  font-weight: normal;
}
.sensor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-top: 1px dashed rgba(0, 210, 255, 0.1);
  padding-top: 10px;
}
.sensor-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #EAF7FF;
}
.sensor-unit {
  font-size: 12px;
  color: #7EA6C4;
  font-family: 'Consolas', monospace;
}
.delete-sensor {
  font-size: 20px;
  color: rgba(255, 77, 79, 0.4);
  cursor: pointer;
  line-height: 1;
  transition: all 0.2s;
  padding-left: 8px;
}
.delete-sensor:hover {
  color: #FF4D4F;
  transform: scale(1.2);
}

/* --- 底部系统信息 --- */
.sys-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sys-lbl {
  color: #7EA6C4;
  font-size: 11px;
}
.sys-val {
  color: #EAF7FF;
  font-size: 12px;
  font-family: 'Consolas', monospace;
}
.ip-input {
  width: 100px;
  padding: 2px 6px;
  font-size: 12px;
}
.spacer {
  flex: 1;
}
.save-btn {
  background: #00D084;
  border: 1px solid #00D084;
  color: #fff;
  padding: 8px 28px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 208, 132, 0.3);
  letter-spacing: 1px;
}
.save-btn:hover:not(:disabled) {
  background: #00E696;
  border-color: #00E696;
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 230, 150, 0.5);
  transform: translateY(-1px);
}
.save-btn:disabled {
  background: rgba(0, 208, 132, 0.2);
  border-color: rgba(0, 208, 132, 0.3);
  color: #7EA6C4;
  box-shadow: none;
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* --- 赛博朋克弹窗样式 --- */
.cyber-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(2, 6, 12, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.cyber-modal {
  width: 380px;
  background: linear-gradient(145deg, rgba(11, 29, 51, 0.95) 0%, rgba(7, 20, 36, 0.95) 100%);
  border: 1px solid rgba(0, 210, 255, 0.3);
  box-shadow: 0 0 40px rgba(0, 210, 255, 0.15), inset 0 0 20px rgba(0, 210, 255, 0.05);
  border-radius: 6px;
  padding: 28px 24px 24px;
  position: relative;
  overflow: hidden;
  transform: translateY(0);
  animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.cyber-modal-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid #00D2FF;
  pointer-events: none;
}
.cyber-modal-corner.top-left { top: 0; left: 0; border-right: none; border-bottom: none; border-top-left-radius: 6px; }
.cyber-modal-corner.bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; border-bottom-right-radius: 6px; }

.cyber-modal-title {
  color: #00D2FF;
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 210, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(0, 210, 255, 0.15);
  padding-bottom: 12px;
}

.cyber-form-group {
  margin-bottom: 18px;
}
.cyber-label {
  display: block;
  color: #7EA6C4;
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.cyber-input-wrapper {
  position: relative;
}
.cyber-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 210, 255, 0.2);
  color: #EAF7FF;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.3s ease;
  box-sizing: border-box;
  outline: none;
}
.cyber-input::placeholder { color: rgba(126, 166, 196, 0.5); font-size: 13px; }
.cyber-input-focus-line {
  position: absolute;
  bottom: 0; left: 50%;
  width: 0; height: 2px;
  background: #00D2FF;
  transition: all 0.3s ease;
  transform: translateX(-50%);
  border-radius: 2px;
}
.cyber-input:focus {
  border-color: rgba(0, 210, 255, 0.4);
  background: rgba(0, 210, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.cyber-input:focus + .cyber-input-focus-line { width: 100%; box-shadow: 0 0 8px #00D2FF; }

.cyber-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 32px;
}
.cyber-btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cyber-btn.cancel-btn {
  background: transparent;
  border: 1px solid rgba(126, 166, 196, 0.4);
  color: #7EA6C4;
}
.cyber-btn.cancel-btn:hover {
  background: rgba(126, 166, 196, 0.1);
  border-color: #EAF7FF;
  color: #EAF7FF;
}
.cyber-btn.confirm-btn {
  background: rgba(0, 210, 255, 0.1);
  border: 1px solid #00D2FF;
  color: #00D2FF;
  box-shadow: inset 0 0 10px rgba(0, 210, 255, 0.2);
}
.cyber-btn.confirm-btn:hover {
  background: #00D2FF;
  color: #071424;
  box-shadow: 0 0 15px rgba(0, 210, 255, 0.6);
}

/* 加载和空状态 */
.robot-info-loading, .robot-info-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  font-size: 14px;
  color: #00D2FF;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 210, 255, 0.2);
  border-top-color: #00D2FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon-wrapper {
  color: rgba(0, 210, 255, 0.3);
}
</style>
