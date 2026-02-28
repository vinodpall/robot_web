<template>
  <div class="drone-control-main">
      <!-- 侧边栏菜单 -->
      <aside class="sidebar-menu">
        <div class="sidebar-tabs">
          <div
            v-for="tab in sidebarTabs"
            :key="tab.key"
            :class="['sidebar-tab', { active: route.path === tab.path }]"
            :title="tab.label"
            @click="handleTabClick(tab.path)"
          >
            <img :src="tab.icon" :alt="tab.label" />
          </div>
        </div>
      </aside>
      <!-- 主体内容区 -->
      <main class="main-content">
        <div class="main-flex">
          <section class="right-panel">
            <!-- 筛选区 -->
            <div class="mission-top-card card">
              <div class="mission-top-header mission-top-header-left">
                <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
                <span class="mission-top-title">循迹记录</span>
              </div>
            </div>
            <!-- 列表区 -->
            <div class="mission-content-wrapper">
              <div class="mission-toolbar track-toolbar-row">
                <div class="track-toolbar-group">
                  <span class="mission-toolbar-label">地图名称：</span>
                  <select v-model="mapName" class="mission-toolbar-select" style="min-width: 160px;">
                    <option value="">请选择</option>
                    <option value="map-001">地图-001</option>
                    <option value="map-002">地图-002</option>
                  </select>
                </div>

                <div class="track-toolbar-group">
                  <span class="mission-toolbar-label">识别项目：</span>
                  <select v-model="identifyItem" class="mission-toolbar-select" style="min-width: 160px;">
                    <option value="">请选择</option>
                    <option value="person">人员</option>
                    <option value="vehicle">车辆</option>
                  </select>
                </div>

                <div class="track-toolbar-group">
                  <span class="mission-toolbar-label">开始时间：</span>
                  <input
                    v-model="startTime"
                    type="datetime-local"
                    class="mission-toolbar-select track-time-input"
                    style="min-width: 80px;"
                    ref="startTimeInput"
                    @click="openStartTimePicker"
                  />
                </div>

                <div class="track-toolbar-group">
                  <span class="mission-toolbar-label">结束时间：</span>
                  <input
                    v-model="endTime"
                    type="datetime-local"
                    class="mission-toolbar-select track-time-input"
                    style="min-width: 80px;"
                    ref="endTimeInput"
                    @click="openEndTimePicker"
                  />
                </div>
                <div class="track-toolbar-actions track-toolbar-actions-right">
                  <button class="mission-btn mission-btn-primary" @click="handleSearch">查询</button>
                  <button class="mission-btn mission-btn-primary">确定</button>
                  <button class="mission-btn mission-btn-stop" @click="handleDelete">删除</button>
                  <button class="mission-btn mission-btn-export" @click="handleExport">导出</button>
                </div>
              </div>

              <div class="mission-toolbar track-toolbar-row track-toolbar-row-bottom" style="padding-top: 0;">
                <div class="track-toolbar-group">
                  <span class="mission-toolbar-label">循迹路线：</span>
                  <select v-model="trackLine" class="mission-toolbar-select" style="min-width: 160px;">
                    <option value="">请选择</option>
                    <option value="track-001">路线-001</option>
                    <option value="track-002">路线-002</option>
                  </select>
                </div>

                <div class="track-toolbar-group">
                  <span class="mission-toolbar-label">任务组：</span>
                  <select v-model="taskGroup" class="mission-toolbar-select" style="min-width: 160px;">
                    <option value="">请选择</option>
                    <option value="group-001">任务组-001</option>
                    <option value="group-002">任务组-002</option>
                  </select>
                </div>

              </div>

              <div class="file-table">
                <div class="file-table-header">
                  <div class="file-table-cell" style="width: 80px;">序号</div>
                  <div class="file-table-cell">地图</div>
                  <div class="file-table-cell">轨迹</div>
                  <div class="file-table-cell">任务组</div>
                  <div class="file-table-cell">圈数</div>
                  <div class="file-table-cell">避障模式</div>
                  <div class="file-table-cell">原点发布</div>
                  <div class="file-table-cell file-table-action" style="width: 240px;">操作</div>
                </div>
                <div v-if="loading" class="mission-loading">加载中...</div>
                <div v-else-if="error" class="mission-error">{{ error }}</div>
                <template v-else>
                  <template v-if="alarmList.length > 0">
                    <div class="file-table-row" v-for="(row, idx) in alarmList" :key="row.id">
                      <div class="file-table-cell" style="width: 80px;">{{ idx + 1 }}</div>
                      <div class="file-table-cell">{{ row.mapName || row.deviceName || '-' }}</div>
                      <div class="file-table-cell">{{ row.trackName || row.type || '-' }}</div>
                      <div class="file-table-cell">{{ row.taskGroup || '-' }}</div>
                      <div class="file-table-cell">{{ row.laps || '-' }}</div>
                      <div class="file-table-cell">{{ row.obstacleMode || '-' }}</div>
                      <div class="file-table-cell">{{ row.originPublish || '-' }}</div>
                      <div class="file-table-cell file-table-action" style="width: 240px;">
                        <button class="mission-btn mission-btn-secondary">编辑</button>
                        <button class="mission-btn mission-btn-secondary">删除</button>
                        <button class="mission-btn mission-btn-secondary">上移</button>
                        <button class="mission-btn mission-btn-secondary">下移</button>
                      </div>
                    </div>
                  </template>
                  <div v-else class="mission-empty">暂无记录</div>
                </template>
              </div>
            </div>
          </section>
        </div>
      </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHmsAlerts, useDevices } from '../composables/useApi'
import trackRecordIcon from '@/assets/source_data/svg_data/robot_source/track_record.svg'

const router = useRouter()
const route = useRoute()



// 使用HMS报警API和设备管理API
const { hmsAlerts, loading, error, fetchDeviceHms, setAllAlerts } = useHmsAlerts()
const { getCachedDeviceSns, fetchDevices } = useDevices()

const sidebarTabs = [
  { key: 'track-record', label: '循迹记录', icon: trackRecordIcon, path: '/dashboard/alarm-log' }
]
const handleTabClick = (path: string) => {
  if (route.path !== path) {
    router.push(path)
  }
}

const startTimeInput = ref<HTMLInputElement | null>(null)
const endTimeInput = ref<HTMLInputElement | null>(null)

const openStartTimePicker = () => {
  startTimeInput.value?.showPicker?.()
  startTimeInput.value?.focus()
}

const openEndTimePicker = () => {
  endTimeInput.value?.showPicker?.()
  endTimeInput.value?.focus()
}

// 筛选相关
const selectedDeviceType = ref('')
const filter = ref({ level: '' })
const mapName = ref('')
const identifyItem = ref('')
const startTime = ref('')
const endTime = ref('')
const trackLine = ref('')
const taskGroup = ref('')
const alarmList = ref<any[]>([])

// 从本地缓存获取设备列表
const getCachedDevices = () => {
  const { dockSns, droneSns } = getCachedDeviceSns()
  
  console.log('从本地缓存获取设备SN:', { dockSns, droneSns })
  
  // 返回所有设备SN，包括机场和无人机
  const allDevices = [
    ...dockSns.map((sn: string) => ({
      device_sn: sn,
      device_name: sn,
      nickname: sn,
      device_type: '3-3-0' // 机场类型
    })),
    ...droneSns.map((sn: string) => ({
      device_sn: sn,
      device_name: sn,
      nickname: sn,
      device_type: '0-100-0' // 无人机类型
    }))
  ]
  
  return allDevices
}

// 获取设备类型选项
const getDeviceTypeOptions = () => {
  return [
    { value: '', label: '全部设备' },
    { value: 'dock', label: '机场' },
    { value: 'drone', label: '无人机' }
  ]
}

// 初始化：从本地缓存获取设备并加载所有设备的报警数据
const initDevice = () => {
  const cachedDevices = getCachedDevices()
  
  if (cachedDevices.length === 0) {
    // 如果没有缓存设备，尝试获取设备列表
    loadDevicesAndAlarmData()
  } else {
    // 默认显示所有设备的报警数据
    loadAllAlarmData()
  }
}

// 加载设备列表并获取报警数据
const loadDevicesAndAlarmData = async () => {
  try {
    const devices = await fetchDevices()
    
    // 重新获取缓存设备并加载报警数据
    const cachedDevices = getCachedDevices()
    
    if (cachedDevices.length > 0) {
      loadAllAlarmData()
    }
  } catch (err) {
    console.error('获取设备列表失败:', err)
  }
}

// 设备类型选择变化
const handleDeviceTypeChange = async () => {
  if (selectedDeviceType.value === '') {
    // 选择全部设备，显示所有设备的报警数据
    loadAllAlarmData()
  } else if (selectedDeviceType.value === 'dock') {
    // 选择机场，显示机场的报警数据
    loadDockAlarmData()
  } else if (selectedDeviceType.value === 'drone') {
    // 选择无人机，先清空报警数据，然后显示无人机的报警数据
    setAllAlerts([])
    updateAlarmList()
    loadDroneAlarmData()
  }
}

// 查询
const handleSearch = async () => {
  if (selectedDeviceType.value === '') {
    loadAllAlarmData()
  } else if (selectedDeviceType.value === 'dock') {
    loadDockAlarmData()
  } else if (selectedDeviceType.value === 'drone') {
    // 选择无人机，先清空报警数据，然后显示无人机的报警数据
    setAllAlerts([])
    updateAlarmList()
    loadDroneAlarmData()
  }
}

// 重置
const handleReset = () => {
  filter.value = { level: '' }
  selectedDeviceType.value = ''
  loadAllAlarmData()
}

const handleConfirm = () => {
  console.log('确定筛选', {
    mapName: mapName.value,
    identifyItem: identifyItem.value,
    startTime: startTime.value,
    endTime: endTime.value,
    trackLine: trackLine.value,
    taskGroup: taskGroup.value
  })
}

const handleDelete = () => {
  console.log('删除记录')
}

const handleExport = () => {
  console.log('导出记录')
}

// 加载所有设备的报警数据
const loadAllAlarmData = async () => {
  const cachedDevices = getCachedDevices()
  
  if (cachedDevices.length === 0) {
    return
  }
  
  try {
    // 获取所有设备的报警数据
    const allAlerts: any[] = []
    
    for (const device of cachedDevices) {
      try {
        const response = await fetchDeviceHms(device.device_sn)
        if (response && response.length > 0) {
          allAlerts.push(...response)
        }
      } catch (err) {
        console.error(`获取设备 ${device.device_sn} 报警数据失败:`, err)
        // 继续获取其他设备的数据
      }
    }
    
    setAllAlerts(allAlerts)
    updateAlarmList()
  } catch (err) {
    console.error('获取所有设备报警数据失败:', err)
  }
}

// 加载机场的报警数据
const loadDockAlarmData = async () => {
  const cachedDevices = getCachedDevices()
  const dockDevices = cachedDevices.filter((device: any) => device.device_type === '3-3-0')
  
  if (dockDevices.length === 0) {
    return
  }
  
  try {
    // 获取所有机场的报警数据
    const allAlerts: any[] = []
    
    for (const device of dockDevices) {
      try {
        const response = await fetchDeviceHms(device.device_sn)
        if (response && response.length > 0) {
          allAlerts.push(...response)
        }
      } catch (err) {
        console.error(`获取机场 ${device.device_sn} 报警数据失败:`, err)
        // 继续获取其他机场的数据
      }
    }
    
    setAllAlerts(allAlerts)
    updateAlarmList()
  } catch (err) {
    console.error('获取所有机场报警数据失败:', err)
  }
}

// 加载无人机的报警数据
const loadDroneAlarmData = async () => {
  const cachedDevices = getCachedDevices()
  const droneDevices = cachedDevices.filter((device: any) => device.device_type === '0-100-0')
  
  if (droneDevices.length === 0) {
    return
  }
  
  try {
    // 获取所有无人机的报警数据
    const allAlerts: any[] = []
    
    for (const device of droneDevices) {
      try {
        const response = await fetchDeviceHms(device.device_sn)
        if (response && response.length > 0) {
          allAlerts.push(...response)
        }
      } catch (err) {
        console.error(`获取无人机 ${device.device_sn} 报警数据失败:`, err)
        // 继续获取其他无人机的数据
      }
    }
    
    setAllAlerts(allAlerts)
    updateAlarmList()
  } catch (err) {
    console.error('获取所有无人机报警数据失败:', err)
  }
}

// 更新报警列表
const updateAlarmList = () => {
  if (!hmsAlerts.value.length) {
    alarmList.value = []
    return
  }
  
  const cachedDevices = getCachedDevices()
  
  alarmList.value = hmsAlerts.value
    .filter(alert => {
      if (filter.value.level && alert.level.toString() !== filter.value.level) {
        return false
      }
      return true
    })
    .map(alert => {
      const device = cachedDevices.find((d: any) => d.device_sn === alert.device_sn)
      return {
        id: alert.id,
        deviceName: device?.device_name || device?.nickname || alert.device_sn,
        type: getDeviceTypeText(device?.device_type),
        content: alert.message_zh,
        level: alert.level,
        levelText: getLevelText(alert.level),
        time: formatTime(alert.create_time)
      }
    })
    .sort((a, b) => b.time.localeCompare(a.time)) // 按时间倒序
}

// 获取设备类型文本
const getDeviceTypeText = (deviceType: string) => {
  switch (deviceType) {
    case '3-3-0':
      return '机场'
    case '0-100-0':
      return '无人机'
    default:
      return '未知设备'
  }
}

// 监听筛选条件变化
const watchFilter = () => {
  if (hmsAlerts.value.length > 0) {
    updateAlarmList()
  }
}

// 监听筛选条件变化
watch(() => filter.value.level, watchFilter)

// 获取报警类型
const getAlertType = (module: number) => {
  const typeMap: Record<number, string> = {
    1: '系统告警',
    2: '设备告警',
    3: '系统告警',
    4: '设备告警'
  }
  return typeMap[module] || '未知告警'
}

// 获取等级文本
const getLevelText = (level: number) => {
  const map: Record<number, string> = {
    0: '通知',
    1: '提醒',
    2: '警告'
  }
  return map[level] ?? `等级${level}`
}

// 格式化时间
const formatTime = (timestamp: number) => {
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

// 页面加载时初始化
onMounted(() => {
  initDevice()
})
</script>

<style scoped>
@import './mission-common.css';

/* 循迹记录标题左对齐 */
.mission-top-header.mission-top-header-left {
  justify-content: flex-start !important;
}

/* 工具栏布局优化 */
.track-toolbar-row {
  flex-wrap: wrap;
  column-gap: 16px;
  row-gap: 8px;
  padding: 4px 0;
  margin-bottom: 4px;
}

.track-toolbar-row-bottom {
  margin-top: 0;
}

.track-toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.track-toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.track-toolbar-group .mission-toolbar-label {
  min-width: 76px;
  text-align: right;
  margin: 0;
}

.track-toolbar-actions-left {
  margin-left: 0;
}

.track-toolbar-actions-right {
  margin-left: auto;
}

.track-toolbar-end-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.track-toolbar-row .mission-toolbar-select {
  height: 32px;
  line-height: 32px;
  padding: 0 10px;
  font-size: 13px;
}

.track-toolbar-row .mission-btn {
  height: 32px;
  line-height: 32px;
  min-width: 96px;
  padding: 0 20px;
  font-size: 13px;
}

.mission-btn-export {
  background: #2a7bd1;
  border: 1px solid #2a7bd1;
  color: #ffffff;
}

.mission-btn-export:hover {
  filter: brightness(1.05);
}

.track-time-input {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
  padding-right: 18px;
  box-sizing: border-box;
}

.track-time-input::-webkit-calendar-picker-indicator {
  opacity: 0;
  cursor: pointer;
  position: absolute;
  right: 8px;
}

.track-time-input {
  -webkit-appearance: none;
  appearance: none;
}

.alarm-input {
  height: 32px;
  border-radius: 4px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
}
.alarm-input:focus {
  outline: none;
  border: 1.5px solid #16bbf2;
  box-shadow: 0 0 0 2px rgba(22,187,242,0.15);
}
.custom-select-wrapper {
  position: relative;
  display: inline-block;
  min-width: 140px;
  max-width: 180px;
  width: 100%;
  vertical-align: middle;
  flex-shrink: 0;
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
  z-index: 2;
}
.mission-select {
  background: transparent !important;
  background-color: transparent !important;
  width: 100%;
  min-width: 140px;
  max-width: 180px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #164159;
  color: #fff;
  font-size: 14px;
  padding: 0 12px;
  padding-right: 30px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-sizing: border-box;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
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
/* 保证下拉菜单（option）背景色不变 */
.mission-select option {
  background: #172233;
  color: #fff;
}
/* 筛选项布局 */
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-right: 24px; /* 增加右侧间距，从16px改为24px */
}
.filter-label {
  color: #b8c7d9;
  font-size: 14px;
  min-width: 64px;
  white-space: nowrap;
  flex-shrink: 0;
}
/* 按钮样式优化 */
.mission-btn {
  min-width: 72px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  margin-left: 12px; /* 增加左侧间距，从8px改为12px */
}
/* 调整mission-top-row的间距 */
.mission-top-row {
  gap: 24px; /* 增加整体间距，从20px改为24px */
}
/* 其余 alarm-xxx 样式已移除，统一复用 mission-common.css */
.mission-th:last-child,
.mission-td:last-child {
  min-width: 220px;
  max-width: 320px;
  text-align: center;
  padding-left: 16px;
  padding-right: 16px;
}

/* 等级徽章样式 */
.level-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.level-0 {
  background: rgba(103, 213, 253, 0.15);
  color: #67d5fd;
  border: 1px solid rgba(103, 213, 253, 0.3);
}
.level-1 {
  background: rgba(250, 173, 20, 0.18);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.35);
}
.level-2 {
  background: rgba(255, 107, 107, 0.22);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.35);
}

/* 重置按钮样式 */
.mission-btn-reset {
  background: #232b3a;
  color: #fff;
  border: 1px solid #232b3a;
}
.mission-btn-reset:hover {
  background: #2d3648;
  color: #fff;
}
</style> 