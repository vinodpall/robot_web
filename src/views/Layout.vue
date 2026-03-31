<template>
  <div class="layout-container">
    <div class="header">
      <div class="header-left">
        <img src="/src/assets/source_data/dog_logo.svg" alt="logo" class="logo" />
        <span class="title">机器人控制平台</span>
      </div>
      
      <nav class="nav-menu">
        <router-link to="/dashboard/home" class="nav-item" :class="{ active: $route.path === '/dashboard/home' }">
          首页
        </router-link>
        <router-link :to="navigationNavTarget" class="nav-item" :class="{ active: $route.path === '/dashboard/navigation' }">
          导航管理
        </router-link>
        <router-link
          :to="missionNavTarget"
          class="nav-item"
          :class="{ active: $route.path.includes('mission') || $route.path.includes('multi-task-group') }"
        >
          任务管理
        </router-link>
        <router-link :to="logNavTarget" class="nav-item" :class="{ active: $route.path === '/dashboard/device-manage' || $route.path === '/dashboard/alarm-log' }">
          日志管理
        </router-link>
        <router-link :to="systemNavTarget" class="nav-item" :class="{ active: $route.path.includes('body-params') || $route.path.includes('users') || $route.path.includes('roles') || $route.path.includes('super-admin') }">
          系统管理
        </router-link>
      </nav>
      
      <div class="header-right">
        <div class="el-select">
          <div class="el-select__wrapper" 
               :class="{ 'is-active': isSelectActive }" 
               @click.stop="toggleSelect">
            <div class="el-select__selection">
              <div class="el-select__selected-item el-select__placeholder">
                <span class="status-light" :class="isSelectedRobotOnline ? 'is-online' : 'is-offline'"></span>
                <span>{{ selectedRobot?.robot_id || '请选择' }}</span>
              </div>
            </div>
            <div class="el-select__suffix">
              <i class="el-icon el-select__caret">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                  <path fill="currentColor" d="M831.872 340.864 512 652.672 192.128 340.864a30.592 30.592 0 0 0-42.752 0 29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728 30.592 30.592 0 0 0-42.752 0z"></path>
                </svg>
              </i>
            </div>
          </div>
          
          <div class="el-select__dropdown" v-show="isSelectActive" @click.stop>
            <div class="el-select__dropdown-list">
              <div 
                v-for="robot in robots" 
                :key="robot.robot_id"
                class="el-select__dropdown-item"
                :class="{ 'is-selected': robot.robot_id === selectedRobotId }"
                @click="selectRobot(robot.robot_id)"
              >
                <span class="status-light" :class="isRobotItemOnline(robot) ? 'is-online' : 'is-offline'"></span>
                {{ robot.robot_id }}
              </div>
            </div>
          </div>
        </div>

        <span class="stop-btn" :class="{ 'is-active': isStopActive }" @click="toggleStop">
          <div class="stop-content">
            <span>{{ isStopActive ? '启动' : '急停' }}</span>
          </div>
        </span>

        <div class="user-info" @click="toggleUserMenu">
          <img src="/src/assets/source_data/avatar.jpg" alt="avatar" class="avatar" />
          <div class="right-sel">
            <span class="name">{{ user?.username || 'admin' }}</span>
            <span class="triangle" :class="{ 'is-active': isUserMenuVisible }"></span>
          </div>
          <div class="user-menu" v-show="isUserMenuVisible">
            <div class="menu-item" @click="handleChangePassword">
              <span>修改密码</span>
            </div>
            <div class="menu-item" @click="handleLogout">
              <span>退出</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive include="Home">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <transition name="robot-switching-fade">
      <div v-if="robotSwitching" class="robot-switching-overlay">
        <div class="robot-switching-box">
          <div class="robot-switching-spinner"></div>
          <span class="robot-switching-text">机器人切换中...</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useDeviceStore } from '../stores/device'
import { useRobotStore } from '../stores/robot'
import { robotApi, userApi, dogApi } from '../api/services'
import { useDeviceStatus } from '../composables/useDeviceStatus'
import { refreshRobotRelatedCache, refreshCameraCache, refreshMapCache } from '../utils/robotBootstrap'
import titleBg from '/src/assets/source_data/bg_data/title.png'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const deviceStore = useDeviceStore()
const robotStore = useRobotStore()

const { fetchDeviceStatus, deviceStatus } = useDeviceStatus()

const TASK_MODULE_LAST_PATH_KEY = 'task_module_last_path'
const TASK_MODULE_DEFAULT_PATH = '/dashboard/mission'
const TASK_MODULE_PATH_SET = new Set([
  '/dashboard/mission',
  '/dashboard/mission-logs',
  '/dashboard/multi-task-group'
])
const NAV_MODULE_LAST_PATH_KEY = 'nav_module_last_path'
const NAV_MODULE_DEFAULT_PATH = '/dashboard/navigation'
const NAV_MODULE_PATH_SET = new Set(['/dashboard/navigation'])
const LOG_MODULE_LAST_PATH_KEY = 'log_module_last_path'
const LOG_MODULE_DEFAULT_PATH = '/dashboard/alarm-log'
const LOG_MODULE_PATH_SET = new Set(['/dashboard/alarm-log', '/dashboard/device-manage'])
const SYSTEM_MODULE_LAST_PATH_KEY = 'system_module_last_path'
const SYSTEM_MODULE_DEFAULT_PATH = '/dashboard/body-params'
const SYSTEM_MODULE_PATH_SET = new Set([
  '/dashboard/body-params',
  '/dashboard/users',
  '/dashboard/roles',
  '/dashboard/super-admin'
])

const normalizeTaskModulePath = (path: string | null | undefined) => {
  if (!path) return TASK_MODULE_DEFAULT_PATH
  return TASK_MODULE_PATH_SET.has(path) ? path : TASK_MODULE_DEFAULT_PATH
}

const lastTaskModulePath = ref(
  normalizeTaskModulePath(localStorage.getItem(TASK_MODULE_LAST_PATH_KEY))
)
const lastNavModulePath = ref(
  NAV_MODULE_PATH_SET.has(localStorage.getItem(NAV_MODULE_LAST_PATH_KEY) || '')
    ? (localStorage.getItem(NAV_MODULE_LAST_PATH_KEY) as string)
    : NAV_MODULE_DEFAULT_PATH
)
const lastLogModulePath = ref(
  LOG_MODULE_PATH_SET.has(localStorage.getItem(LOG_MODULE_LAST_PATH_KEY) || '')
    ? (localStorage.getItem(LOG_MODULE_LAST_PATH_KEY) as string)
    : LOG_MODULE_DEFAULT_PATH
)
const lastSystemModulePath = ref(
  SYSTEM_MODULE_PATH_SET.has(localStorage.getItem(SYSTEM_MODULE_LAST_PATH_KEY) || '')
    ? (localStorage.getItem(SYSTEM_MODULE_LAST_PATH_KEY) as string)
    : SYSTEM_MODULE_DEFAULT_PATH
)

const missionNavTarget = computed(() => lastTaskModulePath.value)
const navigationNavTarget = computed(() => lastNavModulePath.value)
const logNavTarget = computed(() => lastLogModulePath.value)
const systemNavTarget = computed(() => lastSystemModulePath.value)

watch(
  () => route.path,
  (path) => {
    if (TASK_MODULE_PATH_SET.has(path)) {
      lastTaskModulePath.value = path
      localStorage.setItem(TASK_MODULE_LAST_PATH_KEY, path)
    }
    if (NAV_MODULE_PATH_SET.has(path)) {
      lastNavModulePath.value = path
      localStorage.setItem(NAV_MODULE_LAST_PATH_KEY, path)
    }
    if (LOG_MODULE_PATH_SET.has(path)) {
      lastLogModulePath.value = path
      localStorage.setItem(LOG_MODULE_LAST_PATH_KEY, path)
    }
    if (SYSTEM_MODULE_PATH_SET.has(path)) {
      lastSystemModulePath.value = path
      localStorage.setItem(SYSTEM_MODULE_LAST_PATH_KEY, path)
    }
  },
  { immediate: true }
)

const user = computed(() => userStore.user)
const robots = computed(() => deviceStore.robots)
const selectedRobotId = computed({
  get: () => deviceStore.selectedRobotId,
  set: (value) => deviceStore.setSelectedRobot(value)
})

const selectedRobot = computed(() => {
  return robots.value.find(robot => robot.robot_id === selectedRobotId.value)
})

const enrichSelectedRobotDetail = async (robotId: string) => {
  if (!robotId) return
  try {
    const detail = await robotApi.getRobotDetail(robotId)
    if (!detail) return
    const currentList = [...deviceStore.robots]
    const idx = currentList.findIndex(item => String(item.robot_id) === String(robotId))
    if (idx >= 0) {
      currentList[idx] = { ...currentList[idx], ...detail }
    } else {
      currentList.push(detail as any)
    }
    deviceStore.setRobots(currentList as any)
  } catch (error) {
    console.warn(`Failed to load robot detail for ${robotId}:`, error)
  }
}

const isSelectedRobotOnline = computed(() => {
  if (selectedRobot.value) {
    const status = selectedRobot.value.status?.toLowerCase()
    if (status === 'online') return true
  }
  
  return deviceStatus.value?.online || false
})

const isRobotItemOnline = (robot: any) => {
  if (robot.robot_id === selectedRobotId.value) {
    return isSelectedRobotOnline.value
  }
  return robot.status?.toLowerCase() === 'online'
}

const isSelectActive = ref(false)
const robotSwitching = ref(false)

const toggleSelect = () => {
  isSelectActive.value = !isSelectActive.value
}

const selectRobot = (id: string) => {
  if (selectedRobotId.value === id) {
    isSelectActive.value = false
    return
  }
  selectedRobotId.value = id
  isSelectActive.value = false
}

const closeSelect = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.el-select')) {
    isSelectActive.value = false
  }
}

document.addEventListener('click', closeSelect)

const isUserMenuVisible = ref(false)

const toggleUserMenu = (e: Event) => {
  e.stopPropagation()
  isUserMenuVisible.value = !isUserMenuVisible.value
}

const handleChangePassword = () => {
  isUserMenuVisible.value = false
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
  isUserMenuVisible.value = false
}

const closeUserMenu = () => {
  isUserMenuVisible.value = false
}

document.addEventListener('click', closeUserMenu)

const isStopActive = computed(() => {
  return robotStore.motionState?.basic_state === 6
})

const toggleStop = async () => {
  if (!selectedRobotId.value) {
    console.warn('No robot selected')
    return
  }

  try {
    await dogApi.sendCommand(selectedRobotId.value, { command_name: 'stop' })
  } catch (error) {
    console.error('急停操作失败:', error)
  }
}

let switchToken = 0
let currentAbortController: AbortController | null = null

const refreshRobotContext = async (robotId: string) => {
  if (currentAbortController) currentAbortController.abort()
  currentAbortController = new AbortController()
  const { signal } = currentAbortController

  const myToken = ++switchToken

  await fetchDeviceStatus(robotId)
  if (switchToken !== myToken) return

  await refreshCameraCache(robotId, signal)
  if (switchToken !== myToken) return

  window.dispatchEvent(new CustomEvent('robot-camera-ready', {
    detail: { robotId, timestamp: Date.now() }
  }))

  await refreshMapCache(robotId, { forceResetMapSelection: true }, signal)
  if (switchToken !== myToken) return
  window.dispatchEvent(new CustomEvent('robot-map-list-ready', {
    detail: { robotId, timestamp: Date.now() }
  }))

  refreshRobotRelatedCache(robotId, { forceResetMapSelection: true, skipMapRefresh: true }, signal).then(() => {
    if (switchToken !== myToken) return
    window.dispatchEvent(new CustomEvent('robot-context-refreshed', {
      detail: { robotId, timestamp: Date.now() }
    }))
  })
}

watch(
  () => deviceStore.selectedRobotId,
  async (newRobotId, oldRobotId) => {
    if (!newRobotId || newRobotId === oldRobotId) return
    robotSwitching.value = true
    try {
      await enrichSelectedRobotDetail(newRobotId)
      await refreshRobotContext(newRobotId)
    } finally {
      robotSwitching.value = false
    }
  }
)

onMounted(async () => {
  const hadSelectedRobotBeforeMount = !!deviceStore.selectedRobotId

  try {
    const userId = Number(user.value?.id)
    let robotList: any[] = []
    let fromUserBinding = false

    if (!Number.isNaN(userId) && userId > 0) {
      const res = await userApi.getUserRobots(userId)
      robotList = Array.isArray(res) ? res : (Array.isArray((res as any)?.items) ? (res as any).items : [])
      fromUserBinding = true
    } else {
      const res = await robotApi.getRobots()
      robotList = Array.isArray(res?.items) ? res.items : []
    }

    if (fromUserBinding && robotList.length > 0) {
      const hasMissingIp = robotList.some(robot => !robot?.ip_address)
      if (hasMissingIp) {
        try {
          const full = await robotApi.getRobots({ skip: 0, limit: 100 })
          const fullList = Array.isArray(full?.items) ? full.items : []
          const fullByRobotId = new Map(fullList.map(robot => [String(robot.robot_id), robot]))
          robotList = robotList.map(robot => {
            const key = String(robot?.robot_id ?? '')
            const fullRobot = fullByRobotId.get(key)
            return fullRobot ? { ...fullRobot, ...robot } : robot
          })
        } catch (mergeError) {
          console.warn('Failed to enrich user robots with ip_address:', mergeError)
        }
      }
    }

    if (robotList.length > 0) {
      deviceStore.setRobots(robotList as any)
      if (!selectedRobotId.value) {
        deviceStore.setSelectedRobot(robotList[0].robot_id)
      }
      if (deviceStore.selectedRobotId) {
        await enrichSelectedRobotDetail(deviceStore.selectedRobotId)
      }
    } else {
      deviceStore.setRobots([])
    }
  } catch (e) {
    console.error('Failed to fetch robot list:', e)
  }

  if (hadSelectedRobotBeforeMount && deviceStore.selectedRobotId) {
    await refreshRobotContext(deviceStore.selectedRobotId)
  }
})
</script>

<style scoped>
@font-face {
  font-family: 'YouSheBiaoTiHei';
  src: url('/fonts/YouSheBiaoTiHei-2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.robot-switching-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.robot-switching-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: rgba(10, 20, 40, 0.92);
  border: 1px solid rgba(103, 213, 253, 0.35);
  border-radius: 12px;
  padding: 32px 48px;
  box-shadow: 0 0 30px rgba(103, 213, 253, 0.2);
}

.robot-switching-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(103, 213, 253, 0.2);
  border-top-color: #67d5fd;
  border-radius: 50%;
  animation: spinner-rotate 0.8s linear infinite;
}

@keyframes spinner-rotate {
  to { transform: rotate(360deg); }
}

.robot-switching-text {
  color: #67d5fd;
  font-size: 15px;
  letter-spacing: 2px;
}

.robot-switching-fade-enter-active,
.robot-switching-fade-leave-active {
  transition: opacity 0.25s ease;
}
.robot-switching-fade-enter-from,
.robot-switching-fade-leave-to {
  opacity: 0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.layout-container {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  background-color: #0a0f1c;
}

.header {
  width: 100%;
  height: 90px;
  background: url('/title.png') no-repeat;
  background-size: 100% 98%;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 3vw, 40px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: clamp(10px, 2vw, 20px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: clamp(2px, 0.5vw, 4px);
  position: relative;
  z-index: 1;
  min-width: 0;
  margin-left: -40px;
  margin-top: 5px;
  flex-shrink: 0;
  flex: 0 0 auto;
  width: clamp(280px, 30vw, 400px);
}

.logo {
  width: clamp(24px, 3vw, 36px);
  height: clamp(24px, 3vw, 36px);
  filter: brightness(0) saturate(100%) invert(100%);
  flex-shrink: 0;
  margin-left: 5px;
}

.title {
  font-family: 'YouSheBiaoTiHei', 'Microsoft YaHei', '榛戜綋', 'SimHei', sans-serif;
  font-size: clamp(20px, 2.5vw, 34px);
  font-weight: normal;
  letter-spacing: 1px;
  text-align: left;
  font-style: normal;
  text-transform: none;
  margin-left: 0px;
  background: linear-gradient(to bottom, #fff, #63d8ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  display: inline-block;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, .25));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: clamp(200px, 25vw, 400px);
}

.nav-menu {
  display: flex;
  align-items: flex-start;
  gap: clamp(12px, 2.2vw, 32px);
  position: relative;
  z-index: 1;
  flex: 1;
  justify-content: center;
  margin-left: 0;
  list-style: none;
  height: 54px;
  margin-top: 26px;
  border-radius: 0;
  padding-left: clamp(6vw, 9vw, 14vw);
  padding-right: clamp(6vw, 9vw, 14vw);
  min-width: 0;
}

.nav-item {
  width: clamp(70px, 6vw, 110px);
  height: 54px;
  background: url('/src/assets/source_data/bg_data/title_dark.png') no-repeat;
  background-position: bottom center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Source Han Sans CN;
  font-weight: 400;
  font-size: clamp(14px, 1.2vw, 18px);
  color: #9f9f9f;
  font-style: normal;
  text-transform: none;
  cursor: pointer;
  text-decoration: none;
  flex-shrink: 0;
}

.nav-item:hover {
  color: #ffffff;
}

.nav-item.active {
  color: #ffffff;
  background: url('/src/assets/source_data/bg_data/title_light.png') no-repeat;
  background-position: bottom center;
}

.nav-item.active::after {
  display: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.5vw, 15px);
  position: relative;
  z-index: 1;
  margin-right: clamp(10px, 1.5vw, 15px);
  flex-shrink: 0;
  min-width: 0;
  flex: 0 0 auto;
  width: clamp(250px, 30vw, 350px);
}

.el-select {
  --el-transition-duration: 0.3s;
  --el-border-radius-base: 4px;
  --el-border-color: rgba(255, 255, 255, 0.2);
  --el-fill-color-blank: rgba(255, 255, 255, 0.1);
  
  width: clamp(140px, 15vw, 180px);
  margin-right: clamp(10px, 1.5vw, 15px);
  display: inline-block;
  position: relative;
  vertical-align: middle;
  min-height: 32px;
}

.el-select__wrapper {
  align-items: center;
  background-color: var(--el-fill-color-blank);
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  font-size: 14px;
  gap: 6px;
  line-height: 24px;
  min-height: 32px;
  padding: 4px 12px;
  position: absolute;
  right: 0;
  width: 170px;
  text-align: left;
  transform: translateZ(0);
  transition: var(--el-transition-duration);
  overflow: hidden;
}

.el-select__wrapper:hover {
  --el-border-color: rgba(255, 255, 255, 0.4);
  --el-fill-color-blank: rgba(255, 255, 255, 0.15);
}

.el-select__selection {
  display: flex;
  align-items: center;
  flex: 1;
  color: #fff;
  font-size: 14px;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-select__placeholder {
  color: #fff;
  margin-right: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-select__suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #fff;
  transition: transform var(--el-transition-duration);
  display: flex;
  align-items: center;
}

.el-select__caret {
  height: 16px;
  width: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.el-select__caret svg {
  width: 12px;
  height: 12px;
  transition: transform var(--el-transition-duration);
}

.el-select__wrapper:hover .el-select__suffix {
  color: #fff;
}

.el-select__wrapper:active .el-select__suffix svg {
  transform: rotate(180deg);
}

.el-select__wrapper.is-active {
  --el-border-color: rgba(255, 255, 255, 0.6);
  --el-fill-color-blank: rgba(255, 255, 255, 0.2);
}

.el-select__wrapper.is-active .el-select__suffix svg {
  transform: rotate(180deg);
}

.el-select__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 170px;
  background-color: rgba(15, 25, 45, 0.95);
  border: 1px solid rgba(0, 188, 212, 0.3);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.el-select__dropdown-list {
  padding: 4px 0;
  margin: 0;
  list-style: none;
}

.el-select__dropdown-item {
  padding: 10px 16px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.el-select__dropdown-item:hover {
  background: rgba(0, 188, 212, 0.2);
  color: #00bcd4;
}

.el-select__dropdown-item.is-selected {
  background: rgba(0, 188, 212, 0.3);
  color: #00bcd4;
  font-weight: bold;
}

.stop-btn {
  width: clamp(40px, 4vw, 48px);
  height: clamp(40px, 4vw, 48px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  position: relative;
  background: url('/src/assets/source_data/stop_release.png') no-repeat center center;
  background-size: contain;
  border: none;
  outline: none;
  flex-shrink: 0;
}

.stop-btn:active {
  background-image: url('/src/assets/source_data/stop_click.png');
  transform: scale(0.95);
}

.stop-btn.is-active {
  background-image: url('/src/assets/source_data/stop_click.png');
}

.stop-content {
  display: none;
}

.stop-icon {
  display: flex;
  align-items: center;
}

.icon {
  width: 16px;
  height: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 2px;
  position: relative;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.right-sel {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: clamp(60px, 8vw, 80px);
}

.name {
  color: #fff;
  font-size: clamp(14px, 1.2vw, 16px);
  font-weight: bold;
  font-family: Source Han Sans CN;
}

.triangle {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #999;
  margin-left: 4px;
  transition: transform 0.3s;
}

.triangle.is-active {
  transform: rotate(180deg);
}

.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  z-index: 10;
}

.menu-item {
  padding: 10px 16px;
  color: #333;
  font-size: 14px;
  transition: all 0.3s;
  cursor: pointer;
}

.menu-item:hover {
  background: #f5f5f5;
  color: #1890ff;
}

.menu-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.main-content {
  height: calc(100vh - 88px);
  overflow-y: auto;
  background: #f5f5f5;
}

@media (max-width: 1400px) {
  .nav-menu {
    gap: clamp(15px, 3vw, 35px);
    margin: 0 15px;
  }
}

@media (max-width: 1200px) {
  .header {
    padding: 0 clamp(15px, 2.5vw, 30px);
  }
  
  .nav-menu {
    gap: clamp(10px, 2.5vw, 25px);
    margin: 0 10px;
  }
  
  .header-right {
    gap: clamp(8px, 1.5vw, 18px);
  }
}

@media (max-width: 992px) {
  .header {
    padding: 0 clamp(10px, 2vw, 20px);
  }
  
  .nav-menu {
    gap: clamp(8px, 2vw, 20px);
    margin: 0 8px;
  }
  
  .title {
    font-size: clamp(16px, 2.5vw, 28px);
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 10px;
    flex-wrap: nowrap;
  }
  
  .header-left {
    min-width: auto;
  }
  
  .title {
    display: none;
  }
  
  .nav-menu {
    gap: clamp(6px, 1.5vw, 15px);
    margin: 0 5px;
    flex: none;
  }
  
  .nav-item {
    padding: 6px clamp(4px, 1vw, 12px);
    font-size: clamp(10px, 1.2vw, 14px);
  }
  
  .header-right {
    gap: clamp(10px, 1.5vw, 15px);
  }
  
  .el-select {
    min-width: 100px;
  }
  
  .dock-selector {
    max-width: clamp(60px, 12vw, 100px);
    font-size: clamp(10px, 1.2vw, 14px);
  }
  
  .username {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-menu {
    gap: clamp(4px, 1vw, 8px);
  }
  
  .nav-item {
    padding: 4px clamp(2px, 0.8vw, 8px);
    font-size: clamp(9px, 1vw, 12px);
  }
  
  .dock-selector {
    max-width: clamp(50px, 10vw, 80px);
    padding: 4px clamp(15px, 2.5vw, 20px) 4px 8px;
  }
}

@media (min-width: 1920px) {
  .nav-menu {
    padding-left: 12vw;
    padding-right: 12vw;
    gap: clamp(18px, 2.5vw, 36px);
  }
  
  .header-left {
    width: 420px;
  }
  
  .header-right {
    width: 320px;
  }
  
  .el-select {
    width: 160px;
  }
  
  .stop-btn {
    width: 45px;
    height: 45px;
  }
}

@media (min-width: 2560px) {
  .nav-menu {
    padding-left: 20vw;
    padding-right: 20vw;
    gap: clamp(20px, 3vw, 40px);
  }
  
  .nav-item {
    width: 100px;
  }
  
  .header-left {
    width: 360px;
  }
  
  .header-right {
    width: 300px;
  }
  
  .el-select {
    width: 170px;
  }
  
  .stop-btn {
    width: 42px;
    height: 42px;
  }
}

.status-light {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999;
  margin-right: 8px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.status-light.is-online {
  background-color: #52c41a;
  box-shadow: 0 0 8px #52c41a;
  animation: breathing 2s infinite ease-in-out;
}

.status-light.is-offline {
  background-color: #ff4d4f;
  box-shadow: 0 0 4px #ff4d4f;
}

@keyframes breathing {
  0% {
    box-shadow: 0 0 4px #52c41a;
    opacity: 0.7;
  }
  50% {
    box-shadow: 0 0 12px #52c41a;
    opacity: 1;
  }
  100% {
    box-shadow: 0 0 4px #52c41a;
    opacity: 0.7;
  }
}
</style>
