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
          <div class="mission-top-card card user-top-card">
            <div class="mission-top-header mission-top-header-left">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">本体参数</span>
            </div>
          </div>

          <div class="mission-content-wrapper">
            <!-- 无人车本体参数 -->
            <div v-if="isFourWheel" class="ugv-tire-container">
              <!-- SVG Connector lines -->
              <svg class="ugv-svg-overlay" viewBox="0 0 1100 650" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#168bf2" />
                  </marker>
                </defs>
                
                <!-- Left lines -->
                <path d="M 220 120 L 425 170" stroke="#168bf2" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow)" />
                <path d="M 220 325 L 420 325" stroke="#168bf2" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow)" />
                <path d="M 220 530 L 425 480" stroke="#168bf2" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow)" />

                <!-- Right lines -->
                <path d="M 880 120 L 675 170" stroke="#168bf2" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow)" />
                <path d="M 880 325 L 680 325" stroke="#168bf2" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow)" />
                <path d="M 880 530 L 675 480" stroke="#168bf2" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow)" />
              </svg>

              <!-- 左侧3个轮胎数据 -->
              <div class="ugv-tire-column left-column">
                <div
                  v-for="tireIdx in [0, 2, 4]"
                  :key="`tire-${tireIdx}`"
                  class="tire-info-card"
                  :class="{ 'has-warning': getTireStatus(tireIdx).isWarning }"
                >
                  <div class="tire-card-header">
                    <span class="header-indicator" :class="{ 'warning-glow': getTireStatus(tireIdx).isWarning }"></span>
                    {{ getTireLabel(tireIdx) }}
                  </div>
                  <div class="tire-card-body">
                    <div class="tire-data-grid">
                      <div class="data-item">
                        <span class="data-label">胎压</span>
                        <span class="data-val pressure-val">{{ formatTirePressure(tireIdx) }} <span class="unit">bar</span></span>
                      </div>
                      <div class="data-item">
                        <span class="data-label">胎温</span>
                        <span class="data-val temp-val">{{ formatTireTemperature(tireIdx) }} <span class="unit">℃</span></span>
                      </div>
                    </div>
                    <div class="status-row">
                      <span class="status-label">状态:</span>
                      <span :class="['status-val', getTireStatus(tireIdx).class]">{{ getTireStatus(tireIdx).text }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 中间图片 -->
              <div class="center-image-wrapper">
                <img src="@/assets/source_data/six_wheel_ugv.png" alt="6 Wheel UGV" />
              </div>

              <!-- 右侧3个轮胎数据 -->
              <div class="ugv-tire-column right-column">
                <div
                  v-for="tireIdx in [1, 3, 5]"
                  :key="`tire-${tireIdx}`"
                  class="tire-info-card"
                  :class="{ 'has-warning': getTireStatus(tireIdx).isWarning }"
                >
                  <div class="tire-card-header">
                    <span class="header-indicator" :class="{ 'warning-glow': getTireStatus(tireIdx).isWarning }"></span>
                    {{ getTireLabel(tireIdx) }}
                  </div>
                  <div class="tire-card-body">
                    <div class="tire-data-grid">
                      <div class="data-item">
                        <span class="data-label">胎压</span>
                        <span class="data-val pressure-val">{{ formatTirePressure(tireIdx) }} <span class="unit">bar</span></span>
                      </div>
                      <div class="data-item">
                        <span class="data-label">胎温</span>
                        <span class="data-val temp-val">{{ formatTireTemperature(tireIdx) }} <span class="unit">℃</span></span>
                      </div>
                    </div>
                    <div class="status-row">
                      <span class="status-label">状态:</span>
                      <span :class="['status-val', getTireStatus(tireIdx).class]">{{ getTireStatus(tireIdx).text }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 原有机器狗本体参数 -->
            <div v-else class="body-params-card card">
              <div class="body-params-section">
                <div class="body-params-title">关节电机温度</div>
                <div class="body-params-grid">
                  <div
                    v-for="(temp, idx) in jointMotorTemps"
                    :key="`joint-${idx}`"
                    :class="['body-params-item', getTempLevelClass(jointMotorTempRaw[idx])]"
                  >
                    <span class="body-params-label">{{ jointMotorLabels[idx] || `joint_${idx + 1}` }}</span>
                    <span class="body-params-value">{{ temp }}℃</span>
                  </div>
                </div>
              </div>

              <div class="body-params-section">
                <div class="body-params-title">驱动器温度</div>
                <div class="body-params-grid">
                  <div
                    v-for="(temp, idx) in driverTemps"
                    :key="`driver-${idx}`"
                    :class="['body-params-item', getTempLevelClass(driverTempRaw[idx])]"
                  >
                    <span class="body-params-label">{{ driverLabels[idx] || `driver_${idx + 1}` }}</span>
                    <span class="body-params-value">{{ temp }}℃</span>
                  </div>
                </div>
              </div>

              <div class="body-params-section">
                <div class="body-params-title">CPU 信息</div>
                <div class="body-params-grid body-params-grid-compact">
                  <div :class="['body-params-item', getTempLevelClass(cpuTempRaw)]">
                    <span class="body-params-label">CPU 温度</span>
                    <span class="body-params-value">{{ cpuTemp }}℃</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">CPU 频率</span>
                    <span class="body-params-value">{{ cpuFrequency }} MHz</span>
                  </div>
                </div>
              </div>

              <div class="body-params-section">
                <div class="body-params-title">电池信息</div>
                <div class="body-params-grid">
                  <div class="body-params-item">
                    <span class="body-params-label">电量</span>
                    <span class="body-params-value">{{ batteryLevelText }}</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">电压</span>
                    <span class="body-params-value">{{ batteryVoltageText }}</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">电流</span>
                    <span class="body-params-value">{{ batteryCurrentText }}</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">电池容量</span>
                    <span class="body-params-value">{{ batteryCapacityText }}</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">循环次数</span>
                    <span class="body-params-value">{{ batteryCyclesText }}</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">MOS状态</span>
                    <span class="body-params-value">{{ batteryMosText }}</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">保护状态</span>
                    <span class="body-params-value">{{ batteryProtectedStateText }}</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">电池温度</span>
                    <span class="body-params-value">{{ batteryTempsText }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import bodyInfoIcon from '@/assets/source_data/svg_data/robot_source/body_info.svg'
import userIcon from '@/assets/source_data/svg_data/user.svg'
import roleIcon from '@/assets/source_data/svg_data/role.svg'
import permissionIcon from '@/assets/source_data/svg_data/permission.svg'
import robotInfoIcon from '@/assets/source_data/svg_data/robot_source/robot_info.svg'
import { useRobotStore } from '@/stores/robot'
import { usePermissionStore } from '@/stores/permission'
import { useDeviceStore } from '@/stores/device'

const router = useRouter()
const route = useRoute()
const robotStore = useRobotStore()
const permissionStore = usePermissionStore()
const deviceStore = useDeviceStore()

const isFourWheel = computed(() => deviceStore.selectedRobot?.robot_type === 'four_wheel')

const sidebarTabs = [
  { key: 'body', label: '本体参数', icon: bodyInfoIcon, path: '/dashboard/body-params', permission: 'system-body-show' },
  { key: 'user', label: '用户管理', icon: userIcon, path: '/dashboard/users', permission: 'system-user-show' },
  { key: 'role', label: '角色管理', icon: roleIcon, path: '/dashboard/roles', permission: 'system-role-show' },
  { key: 'super', label: '超级管理员', icon: permissionIcon, path: '/dashboard/super-admin', permission: 'system-super-show' },
  { key: 'robotinfo', label: '设备详情', icon: robotInfoIcon, path: '/dashboard/robot-info', permission: 'system-robotinfo-show' }
]

const currentTab = computed(() => {
  const tab = sidebarTabs.find(item => route.path === item.path)
  return tab?.key ?? 'body'
})

const TEMP_WARN_MIN = 60
const TEMP_DANGER_MIN = 75

const getTempLevelClass = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  if (value >= TEMP_DANGER_MIN) return 'temp-danger'
  if (value >= TEMP_WARN_MIN) return 'temp-warn'
  return ''
}

const formatTelemetryValue = (value: number | undefined | null, digits = 1) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--'
  return value.toFixed(digits)
}

const jointMotorTempRaw = computed(() =>
  Array.from({ length: 12 }, (_, idx) => {
    const value = robotStore.systemTelemetry?.motor_temperature?.[idx]
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  })
)

const jointMotorTemps = computed(() =>
  Array.from({ length: 12 }, (_, idx) => formatTelemetryValue(jointMotorTempRaw.value[idx]))
)

const jointNamePrefixes = [
  '左前侧摆', '左前髋', '左前膝',
  '右前侧摆', '右前髋', '右前膝',
  '左后侧摆', '左后髋', '左后膝',
  '右后侧摆', '右后髋', '右后膝'
]

const jointMotorLabels = jointNamePrefixes.map(name => `${name}关节温度`)
const driverLabels = jointNamePrefixes.map(name => `${name}驱动器温度`)

const driverTempRaw = computed(() =>
  Array.from({ length: 12 }, (_, idx) => {
    const value = robotStore.systemTelemetry?.driver_temperature?.[idx]
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  })
)

const driverTemps = computed(() =>
  Array.from({ length: 12 }, (_, idx) => formatTelemetryValue(driverTempRaw.value[idx], 0))
)

const cpuTempRaw = computed(() => {
  const value = robotStore.systemTelemetry?.cpu_info?.temperature
  return typeof value === 'number' && Number.isFinite(value) ? value : null
})

const cpuTemp = computed(() => formatTelemetryValue(cpuTempRaw.value))
const cpuFrequency = computed(() => formatTelemetryValue(robotStore.systemTelemetry?.cpu_info?.frequency, 0))

const formatBatteryField = (value: number | undefined | null, digits = 0) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--'
  return digits > 0 ? value.toFixed(digits) : String(Math.round(value))
}

const batteryLevelText = computed(() => {
  const value = robotStore.batteryData?.battery_level
  return value == null ? '--' : `${formatBatteryField(value)}%`
})

const batteryVoltageText = computed(() => {
  const value = robotStore.batteryData?.voltage
  return value == null ? '--' : `${formatBatteryField(value, 1)}V`
})

const batteryCurrentText = computed(() => {
  const value = robotStore.batteryData?.current
  return value == null ? '--' : `${formatBatteryField(value, 1)}A`
})

const batteryCapacityText = computed(() => {
  const remaining = robotStore.batteryData?.remaining_capacity
  const nominal = robotStore.batteryData?.nominal_capacity
  if (remaining == null || nominal == null) return '--'
  return `${formatBatteryField(remaining)}/${formatBatteryField(nominal)} mA`
})

const batteryCyclesText = computed(() => {
  const value = robotStore.batteryData?.cycles
  return value == null ? '--' : formatBatteryField(value)
})

const batteryMosText = computed(() => {
  const value = robotStore.batteryData?.mos_state
  if (value == null) return '--'
  const state = Number(value)
  if (!Number.isFinite(state)) return '--'
  if (state === 0) return '关闭'
  const isChargeOn = (state & 0x01) > 0
  const isDischargeOn = (state & 0x02) > 0
  if (isChargeOn && isDischargeOn) return '充放电开启'
  if (isChargeOn) return '仅充电开启'
  if (isDischargeOn) return '仅放电开启'
  return `异常(${formatBatteryField(state)})`
})

const batteryProtectedStateText = computed(() => {
  const value = robotStore.batteryData?.protected_state
  if (value == null) return '--'
  const state = Number(value)
  if (!Number.isFinite(state)) return '--'
  return state === 0 ? '正常' : `触发保护(${formatBatteryField(state)})`
})

const batteryTempsText = computed(() => {
  const temps = robotStore.batteryData?.battery_temperature
  if (!Array.isArray(temps) || temps.length === 0) return '--'
  const firstTemp = temps.find((item) => typeof item === 'number' && Number.isFinite(item) && item > -100 && item < 200)
  return typeof firstTemp === 'number' ? `${firstTemp.toFixed(1)}°C` : '--'
})

// ---- 无人车本体参数相关计算与方法 ----
const carTemperatures = computed(() => {
  return robotStore.carTemperature?.temperature || []
})

const normalizedMotorInfo = computed(() => {
  const raw = robotStore.carMotorInfo as any
  if (!raw) return { rpm: [], current: [], state: [] }
  let target = raw
  if (typeof raw === 'string') {
    try {
      target = JSON.parse(raw)
    } catch (e) {
      return { rpm: [], current: [], state: [] }
    }
  }
  if (target && target.msg) {
    target = typeof target.msg === 'string' ? JSON.parse(target.msg) : target.msg
  }
  return {
    rpm: Array.isArray(target?.rpm) ? target.rpm : [],
    current: Array.isArray(target?.current) ? target.current : [],
    state: Array.isArray(target?.state) ? target.state : [],
  }
})

const formatCarTempValue = (value: number | undefined | null) => {
  if (value === undefined || value === null || value <= -1000) return '--'
  return value.toFixed(1)
}

const formatMotorValue = (value: number | undefined | null, isCurrent = false) => {
  if (value === undefined || value === null) return '--'
  if (isCurrent) return value.toFixed(1)
  return String(Math.round(value))
}

const getMotorParsedState = (state: number | undefined | null) => {
  if (state === undefined || state === null || isNaN(state)) {
    return {
      runStatusText: '--',
      conModeText: '--',
      faultText: '--',
      hasFault: false,
      isRun: false
    }
  }
  const val = Math.floor(state)
  const isRun = (val & 1) !== 0
  const runStatusText = isRun ? '启动' : '停机'
  const conModeText = (val & (1 << 7)) !== 0 ? '外部PLC' : 'PC'

  const faults: string[] = []
  if ((val & (1 << 1)) !== 0) faults.push('过流')
  if ((val & (1 << 2)) !== 0) faults.push('过压')
  if ((val & (1 << 3)) !== 0) faults.push('编码器故障')
  if ((val & (1 << 4)) !== 0) faults.push('位置偏差过大')
  if ((val & (1 << 5)) !== 0) faults.push('欠压')
  if ((val & (1 << 6)) !== 0) faults.push('过载')
  if ((val & (1 << 15)) !== 0) faults.push('CAN1通讯超时')

  const hasFault = faults.length > 0
  const faultText = hasFault ? faults.join(', ') : '正常'

  return {
    runStatusText,
    conModeText,
    faultText,
    hasFault,
    isRun
  }
}

const getMotorRunClass = (state: number | undefined | null) => {
  const parsed = getMotorParsedState(state)
  if (parsed.runStatusText === '--') return ''
  return parsed.isRun ? 'motor-run-on' : 'motor-run-off'
}

const getMotorFaultClass = (state: number | undefined | null) => {
  const parsed = getMotorParsedState(state)
  if (parsed.faultText === '--') return ''
  return parsed.hasFault ? 'motor-fault-error' : 'motor-fault-ok'
}

// ---- 无人车轮胎参数计算与方法 ----
const formatTirePressure = (idx: number) => {
  const value = robotStore.tireInfo?.tire_pressure?.[idx]
  if (value === undefined || value === null) return '--'
  return (value / 100).toFixed(2)
}

const formatTireTemperature = (idx: number) => {
  const value = robotStore.tireInfo?.tire_temperature?.[idx]
  if (value === undefined || value === null) return '--'
  return Math.round(value)
}

const getTireLabel = (idx: number) => {
  const labels = ['左前轮', '右前轮', '左中轮', '右中轮', '左后轮', '右后轮']
  return labels[idx] || `轮胎 ${idx + 1}`
}

const getTireStatus = (idx: number) => {
  const tire = robotStore.tireInfo
  if (!tire) {
    return { text: '正常', class: 'status-normal', isWarning: false } // default to normal instead of unknown if no data received yet
  }

  const noData = tire.no_data_warning?.[idx] ?? 0
  const gasLeak = (tire.gas_leak_warning?.[idx] ?? tire['gas_leak_warning ']?.[idx]) ?? 0
  const highTemp = tire.high_temperature_warning?.[idx] ?? 0
  const pressState = tire.pressure_state?.[idx] ?? 0x40

  if (noData === 1) {
    return { text: '传感器丢失', class: 'status-error', isWarning: true }
  }
  if (gasLeak === 1) {
    return { text: '快漏报警', class: 'status-error', isWarning: true }
  }
  if (highTemp === 1) {
    return { text: '高温报警', class: 'status-error', isWarning: true }
  }
  if (pressState === 0x00) {
    return { text: '胎压过高', class: 'status-error', isWarning: true }
  }
  if (pressState === 0x80) {
    return { text: '胎压过低', class: 'status-error', isWarning: true }
  }
  if (pressState === 0x40) {
    return { text: '正常', class: 'status-normal', isWarning: false }
  }

  return { text: '正常', class: 'status-normal', isWarning: false }
}

const emitPermissionDenied = (permission: string) => {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('permission-denied', {
      detail: { permission }
    }))
  }
}

const handleTabClick = (tab: { key: string; path: string; permission?: string }) => {
  if (tab.permission && !permissionStore.hasPermission(tab.permission)) {
    emitPermissionDenied(tab.permission)
    return
  }
  if (route.path !== tab.path) router.push(tab.path)
}
</script>

<style scoped>
@import './mission-common.css';

.user-top-card {
  min-height: 64px;
  padding-bottom: 0;
}

.mission-top-header.mission-top-header-left {
  justify-content: flex-start !important;
}

.body-params-card {
  padding: 20px 24px 26px;
  background: transparent;
  border: none;
  box-shadow: none;
}

.body-params-section + .body-params-section {
  margin-top: 18px;
}

.body-params-title {
  color: #67d5fd;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.body-params-title::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #67d5fd;
  box-shadow: 0 0 8px rgba(103, 213, 253, 0.6);
}

.body-params-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 18px;
}

.body-params-grid-compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.body-params-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid rgba(90, 164, 206, 0.45);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(22, 58, 88, 0.72) 0%, rgba(16, 42, 66, 0.88) 100%);
  box-shadow: inset 0 0 10px rgba(5, 18, 30, 0.4), 0 6px 14px rgba(4, 12, 22, 0.25);
}

.body-params-item:hover {
  border-color: rgba(103, 213, 253, 0.75);
}

.body-params-label {
  color: #b6d2e5;
  font-size: 12px;
}

.body-params-value {
  color: #eef7ff;
  font-size: 15px;
  font-weight: 700;
}

.temp-warn {
  border-color: rgba(255, 189, 84, 0.8);
}

.temp-danger {
  border-color: rgba(255, 88, 88, 0.9);
}

/* 无人车电机信息样式 */
.motor-info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.motor-info-card {
  border: 1px solid rgba(90, 164, 206, 0.45);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(22, 58, 88, 0.72) 0%, rgba(16, 42, 66, 0.88) 100%);
  box-shadow: inset 0 0 10px rgba(5, 18, 30, 0.4), 0 6px 14px rgba(4, 12, 22, 0.25);
  padding: 14px;
  box-sizing: border-box;
}

.motor-info-card:hover {
  border-color: rgba(103, 213, 253, 0.75);
}

.motor-info-header {
  font-size: 14px;
  font-weight: bold;
  color: #67d5fd;
  border-bottom: 1px solid rgba(103, 213, 253, 0.25);
  padding-bottom: 6px;
  margin-bottom: 10px;
  text-align: center;
}

.motor-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.motor-info-label {
  color: #b6d2e5;
  font-size: 12px;
}

.motor-info-value {
  color: #eef7ff;
  font-size: 14px;
  font-weight: bold;
}

.motor-run-on {
  color: #67d5fd;
}

.motor-run-off {
  color: #a0aab0;
}

.motor-fault-ok {
  color: #52c41a;
}

.motor-fault-error {
  color: #ff4d4f;
  text-shadow: 0 0 4px rgba(255, 77, 79, 0.5);
}

/* 无人车六轮轮胎参数新样式 */
.ugv-tire-container {
  position: relative;
  width: 100%;
  max-width: 1250px;
  margin: 0 auto;
  aspect-ratio: 1100 / 650;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
}

.ugv-tire-column {
  position: absolute;
  top: 5%;
  bottom: 5%;
  width: 20%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 2;
  box-sizing: border-box;
}

.left-column {
  left: 0%;
}

.right-column {
  right: 0%;
}

.center-image-wrapper {
  position: absolute;
  left: 23%;
  right: 23%;
  top: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
}

.center-image-wrapper img {
  height: 100%;
  max-height: 100%;
  width: 100%;
  object-fit: contain;
  mix-blend-mode: screen;
  transform: scale(1.75);
}

.ugv-svg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.tire-info-card {
  border: 1px solid rgba(103, 213, 253, 0.15);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(12, 30, 56, 0.85) 0%, rgba(6, 18, 34, 0.95) 100%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(103, 213, 253, 0.05);
  padding: 14px;
  box-sizing: border-box;
  width: 100%;
  min-height: 125px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.tire-info-card:hover {
  border-color: rgba(103, 213, 253, 0.6);
  box-shadow: 0 15px 35px rgba(0, 255, 135, 0.05), 0 12px 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(103, 213, 253, 0.1);
  transform: translateY(-4px);
}

.tire-info-card.has-warning {
  border-color: rgba(255, 77, 79, 0.4);
  box-shadow: 0 10px 30px rgba(255, 77, 79, 0.1), inset 0 0 15px rgba(255, 77, 79, 0.05);
}

.tire-info-card.has-warning:hover {
  border-color: rgba(255, 77, 79, 0.8);
  box-shadow: 0 15px 35px rgba(255, 77, 79, 0.2), inset 0 0 20px rgba(255, 77, 79, 0.15);
}

.tire-card-header {
  font-size: 14px;
  font-weight: 600;
  color: #e2f1fc;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  text-shadow: 0 0 10px rgba(226, 241, 252, 0.3);
}

.header-indicator {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ff87;
  box-shadow: 0 0 8px #00ff87;
  margin-right: 8px;
  vertical-align: middle;
}

.header-indicator.warning-glow {
  background: #ff4d4f;
  box-shadow: 0 0 8px #ff4d4f;
}

.tire-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tire-data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}

.data-item {
  background: rgba(22, 58, 88, 0.3);
  border: 1px solid rgba(103, 213, 253, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  box-sizing: border-box;
}

.data-label {
  font-size: 11px;
  color: #7da5c4;
  text-transform: uppercase;
}

.data-val {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.pressure-val {
  color: #00ff87;
  text-shadow: 0 0 6px rgba(0, 255, 135, 0.2);
}

.temp-val {
  color: #eef7ff;
}

.unit {
  font-size: 11px;
  color: #7da5c4;
  font-weight: normal;
  margin-left: 2px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: rgba(16, 42, 66, 0.4);
  border-radius: 4px;
  font-size: 12px;
}

.status-label {
  color: #8bb7d8;
}

.status-val {
  font-weight: 600;
  font-size: 12px;
}

.status-normal {
  color: #00ff87;
  text-shadow: 0 0 8px rgba(0, 255, 135, 0.3);
}

.status-error {
  color: #ff4d4f;
  text-shadow: 0 0 8px rgba(255, 77, 79, 0.4);
  animation: pulse-red 2s infinite alternate;
}

@keyframes pulse-red {
  0% { text-shadow: 0 0 4px rgba(255, 77, 79, 0.4); }
  100% { text-shadow: 0 0 12px rgba(255, 77, 79, 0.8); }
}
</style>
