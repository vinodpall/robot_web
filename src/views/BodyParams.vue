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
            <div class="body-params-card card">
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
                    <span class="body-params-label">剩余容量</span>
                    <span class="body-params-value">{{ batteryRemainingText }}</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">额定容量</span>
                    <span class="body-params-value">{{ batteryNominalText }}</span>
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
import { useRobotStore } from '@/stores/robot'
import { usePermissionStore } from '@/stores/permission'

const router = useRouter()
const route = useRoute()
const robotStore = useRobotStore()
const permissionStore = usePermissionStore()

const sidebarTabs = [
  { key: 'body', label: '本体参数', icon: bodyInfoIcon, path: '/dashboard/body-params', permission: 'system-body-show' },
  { key: 'user', label: '用户管理', icon: userIcon, path: '/dashboard/users', permission: 'system-user-show' },
  { key: 'role', label: '角色管理', icon: roleIcon, path: '/dashboard/roles', permission: 'system-role-show' },
  { key: 'super', label: '超级管理员', icon: permissionIcon, path: '/dashboard/super-admin', permission: 'system-super-show' }
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
  '左前侧摆', '左前高', '左前膝',
  '右前侧摆', '右前高', '右前膝',
  '左后侧摆', '左后高', '左后膝',
  '右后侧摆', '右后高', '右后膝'
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

const batteryRemainingText = computed(() => {
  const value = robotStore.batteryData?.remaining_capacity
  return value == null ? '--' : `${formatBatteryField(value)}mAh`
})

const batteryNominalText = computed(() => {
  const value = robotStore.batteryData?.nominal_capacity
  return value == null ? '--' : `${formatBatteryField(value)}mAh`
})

const batteryCyclesText = computed(() => {
  const value = robotStore.batteryData?.cycles
  return value == null ? '--' : formatBatteryField(value)
})

const batteryMosText = computed(() => {
  const value = robotStore.batteryData?.mos_state
  return value == null ? '--' : formatBatteryField(value)
})

const batteryTempsText = computed(() => {
  const temps = robotStore.batteryData?.battery_temperature
  if (!Array.isArray(temps) || temps.length === 0) return '--'
  const shown = temps
    .filter((item) => typeof item === 'number' && Number.isFinite(item) && item > -100 && item < 200)
    .slice(0, 3)
    .map((item) => `${item.toFixed(1)}°C`)
  return shown.length > 0 ? shown.join(' / ') : '--'
})

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
</style>
