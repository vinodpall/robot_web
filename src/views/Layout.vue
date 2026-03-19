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
        <router-link to="/dashboard/navigation" class="nav-item" :class="{ active: $route.path === '/dashboard/navigation' }">
          导航管理
        </router-link>
        <router-link
          to="/dashboard/mission"
          class="nav-item"
          :class="{ active: $route.path.includes('mission') || $route.path.includes('multi-task-group') }"
        >
          任务管理
        </router-link>
        <router-link to="/dashboard/alarm-log" class="nav-item" :class="{ active: $route.path === '/dashboard/device-manage' || $route.path === '/dashboard/alarm-log' }">
          日志管理
        </router-link>
        <router-link to="/dashboard/body-params" class="nav-item" :class="{ active: $route.path.includes('body-params') || $route.path.includes('users') || $route.path.includes('roles') || $route.path.includes('super-admin') }">
          系统管理
        </router-link>
      </nav>
      
      <div class="header-right">
        <!-- 鏈哄満鍚嶇О涓嬫媺妗?-->
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
          
          <!-- 涓嬫媺閫夐」 -->
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

        <!-- 鎬ュ仠鎸夐挳 -->
        <span class="stop-btn" :class="{ 'is-active': isStopActive }" @click="toggleStop">
          <div class="stop-content">
            <span>{{ isStopActive ? '启动' : '急停' }}</span>
          </div>
        </span>

        <!-- 鐢ㄦ埛淇℃伅 -->
        <div class="user-info" @click="toggleUserMenu">
          <img src="/src/assets/source_data/avatar.jpg" alt="avatar" class="avatar" />
          <div class="right-sel">
            <span class="name">{{ user?.username || 'admin' }}</span>
            <span class="triangle" :class="{ 'is-active': isUserMenuVisible }"></span>
          </div>
          <!-- 涓嬫媺鑿滃崟 -->
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

    <!-- 鏈哄櫒浜哄垏鎹腑閬僵 -->
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
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useDeviceStore } from '../stores/device'
import { robotApi, userApi } from '../api/services'
import { useDeviceStatus } from '../composables/useDeviceStatus'
import { refreshRobotRelatedCache, refreshCameraCache, refreshMapCache } from '../utils/robotBootstrap'
// 瀵煎叆鑳屾櫙鍥剧墖
import titleBg from '/src/assets/source_data/bg_data/title.png'

const router = useRouter()
const userStore = useUserStore()
const deviceStore = useDeviceStore()

// 璁惧鐘舵€佺鐞?
const { fetchDeviceStatus, deviceStatus } = useDeviceStatus()

const user = computed(() => userStore.user)
const robots = computed(() => deviceStore.robots)
const selectedRobotId = computed({
  get: () => deviceStore.selectedRobotId,
  set: (value) => deviceStore.setSelectedRobot(value)
})

const selectedRobot = computed(() => {
  return robots.value.find(robot => robot.robot_id === selectedRobotId.value)
})

// 根据 robot_id 拉取详情，补全 /users/{id}/robots 返回中缺失字段（如 ip_address）
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

// 鍒ゆ柇褰撳墠閫変腑鐨勬満鍣ㄤ汉鏄惁鍦ㄧ嚎
const isSelectedRobotOnline = computed(() => {
  // 1. 浼樺厛妫€鏌ラ€変腑鏈哄櫒浜虹殑闈欐€佺姸鎬?(鍏煎澶у皬鍐?
  if (selectedRobot.value) {
    const status = selectedRobot.value.status?.toLowerCase()
    if (status === 'online') return true
  }
  
  // 2. 濡傛灉闈欐€佺姸鎬佷笉鍦ㄧ嚎锛屾鏌ュ疄鏃惰澶囩姸鎬?(浠呴拡瀵瑰綋鍓嶉€変腑鐨勬満鍣ㄤ汉)
  // 娉ㄦ剰锛歞eviceStatus 鏄綋鍓嶉€変腑鏈哄櫒浜虹殑瀹炴椂鐘舵€?
  return deviceStatus.value?.online || false
})

// 鍒ゆ柇鍒楄〃涓殑鏈哄櫒浜烘槸鍚﹀湪绾?
const isRobotItemOnline = (robot: any) => {
  // 鍒楄〃涓殑鏈哄櫒浜轰富瑕佷緷璧栧叾闈欐€佺姸鎬佸瓧娈?
  // 濡傛灉鏄綋鍓嶉€変腑鐨勬満鍣ㄤ汉锛屼篃鍙互鍙傝€冨疄鏃剁姸鎬?鍙€夛紝涓轰簡淇濇寔鍒楄〃鍜屽ご閮ㄤ竴鑷达紝杩欓噷绠€鍗曞鐞?
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

// 鐐瑰嚮澶栭儴鍏抽棴涓嬫媺鍒楄〃
const closeSelect = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.el-select')) {
    isSelectActive.value = false
  }
}

// 鐩戝惉鐐瑰嚮浜嬩欢
document.addEventListener('click', closeSelect)

const isUserMenuVisible = ref(false)

const toggleUserMenu = (e: Event) => {
  e.stopPropagation()
  isUserMenuVisible.value = !isUserMenuVisible.value
}

const handleChangePassword = () => {
  // 澶勭悊淇敼瀵嗙爜閫昏緫
  isUserMenuVisible.value = false
}

const handleLogout = () => {
  // 澶勭悊閫€鍑虹櫥褰曢€昏緫
  userStore.logout()
  router.push('/login')
  isUserMenuVisible.value = false
}

// 鐐瑰嚮鍏朵粬鍦版柟鍏抽棴鐢ㄦ埛鑿滃崟
const closeUserMenu = () => {
  isUserMenuVisible.value = false
}

// 鐩戝惉鐐瑰嚮浜嬩欢
document.addEventListener('click', closeUserMenu)

// 鎬ュ仠鐘舵€佽绠?
const isStopActive = computed(() => {
  return deviceStatus.value?.emergency_stop_state || false
})

// 鎬ュ仠鎸夐挳鐐瑰嚮澶勭悊
const toggleStop = async () => {
  if (!selectedRobotId.value) {
    console.warn('No robot selected')
    return
  }

  try {
    // 鎬ュ仠鎺ュ彛宸茬Щ闄わ紙鏃х郴缁熷凡鍋滅敤锛?
  } catch (error) {
    console.error('鎬ュ仠鎿嶄綔澶辫触:', error)
  }
}

// 姣忔鍒囨崲鏈哄櫒浜烘椂閫掑锛岀敤浜庝涪寮冨凡杩囨湡鐨勫紓姝ュ洖璋?
let switchToken = 0
// 鐢ㄤ簬鍙栨秷灞氬皬璇锋眰鐨?AbortController
let currentAbortController: AbortController | null = null

const refreshRobotContext = async (robotId: string) => {
  // 涓涓婁竴涓満鍣ㄤ汉鐨勬墍鏈夋鍦ㄩ琛岀殑璇锋眰
  if (currentAbortController) currentAbortController.abort()
  currentAbortController = new AbortController()
  const { signal } = currentAbortController

  const myToken = ++switchToken

  await fetchDeviceStatus(robotId)
  if (switchToken !== myToken) return // 宸插垏鎹㈠埌鍏朵粬鏈哄櫒浜猴紝涓㈠純

  // 绗竴闃舵锛氫粎鎷夊彇鎽勫儚澶村垪琛紝绔嬪嵆閫氱煡涓荤晫闈㈠惎鍔ㄨ棰?
  await refreshCameraCache(robotId, signal)
  if (switchToken !== myToken) return // 涓㈠純

  window.dispatchEvent(new CustomEvent('robot-camera-ready', {
    detail: { robotId, timestamp: Date.now() }
  }))

  // 绗簩闃舵锛氬悗鍙板姞杞藉叾浣欐暟鎹紙鍦板浘銆佸惊杩广€佷换鍔＄粍绛夛級锛屽畬鎴愬悗鍐嶉€氱煡涓嬫媺妗嗗埛鏂?
  await refreshMapCache(robotId, { forceResetMapSelection: true }, signal)
  if (switchToken !== myToken) return
  window.dispatchEvent(new CustomEvent('robot-map-list-ready', {
    detail: { robotId, timestamp: Date.now() }
  }))

  refreshRobotRelatedCache(robotId, { forceResetMapSelection: true, skipMapRefresh: true }, signal).then(() => {
    if (switchToken !== myToken) return // 宸茶繃鏈燂紝涓㈠純
    window.dispatchEvent(new CustomEvent('robot-context-refreshed', {
      detail: { robotId, timestamp: Date.now() }
    }))
  })
}

// 鐩戝惉閫変腑鐨勬満鍣ㄤ汉鍙樺寲锛屽垏鎹㈠悗寮哄埗閲嶆媺鎺ュ彛
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

// 椤甸潰鍔犺浇鏃舵仮澶嶈澶囧垪琛ㄥ拰鐘舵€?
onMounted(async () => {
  const hadSelectedRobotBeforeMount = !!deviceStore.selectedRobotId

  // 鑾峰彇鏈哄櫒浜哄垪琛?
  // 获取机器人列表（优先当前用户绑定）
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

    // /users/{id}/robots 返回通常不含 ip_address，补拉全量机器人信息并按 robot_id 合并
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

  // 浠呭湪鎸傝浇鍓嶅凡瀛樺湪閫変腑鏈哄櫒浜烘椂涓诲姩鍒锋柊
  // 鑻ユ寕杞芥椂閫氳繃 setSelectedRobot 閫変腑鐨勬満鍣ㄤ汉锛寃atch 浼氳礋璐ｈЕ鍙戝埛鏂?
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

/* 鏈哄櫒浜哄垏鎹㈤伄缃?*/
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

/* 椤堕儴瀵艰埅鏍?*/
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

/* 宸︿晶Logo鍜屾爣棰?*/
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
  font-size: clamp(20px, 2.5vw, 34px); /* 浣跨敤clamp鑷姩缂╂斁 */
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
  max-width: clamp(200px, 25vw, 400px); /* 浣跨敤clamp鑷姩缂╂斁鏈€澶у搴?*/
}

/* 涓棿瀵艰埅鑿滃崟 */
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
  padding-left: clamp(6vw, 9vw, 14vw); /* 淇濊瘉鍏釜鑿滃崟鍧囧寑鍒嗗竷 */
  padding-right: clamp(6vw, 9vw, 14vw);
  min-width: 0;
}

.nav-item {
  width: clamp(70px, 6vw, 110px); /* 浣跨敤clamp鑷姩缂╂斁瀹藉害 */
  height: 54px;
  background: url('/src/assets/source_data/bg_data/title_dark.png') no-repeat;
  background-position: bottom center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Source Han Sans CN;
  font-weight: 400;
  font-size: clamp(14px, 1.2vw, 18px); /* 浣跨敤clamp鑷姩缂╂斁瀛椾綋澶у皬 */
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

/* 鍙充晶鍔熻兘鍖?*/
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
  width: clamp(250px, 30vw, 350px); /* 澧炲姞瀹藉害鑼冨洿 */
}

/* 鏈哄満閫夋嫨鍣ㄦ牱寮?*/
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
  width: 170px; /* 瑙嗚瀹藉害锛屽悜宸︽孩鍑哄鍣紝涓嶅奖鍝嶅閮ㄥ竷灞€ */
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
  white-space: nowrap; /* 闃叉鏂囧瓧鎹㈣ */
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-select__placeholder {
  color: #fff;
  margin-right: 20px;
  white-space: nowrap; /* 闃叉鏂囧瓧鎹㈣ */
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

/* 娣诲姞涓€涓縺娲荤姸鎬佺殑绫?*/
.el-select__wrapper.is-active {
  --el-border-color: rgba(255, 255, 255, 0.6);
  --el-fill-color-blank: rgba(255, 255, 255, 0.2);
}

.el-select__wrapper.is-active .el-select__suffix svg {
  transform: rotate(180deg);
}

/* 涓嬫媺閫夐」鏍峰紡 */
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

/* 鎬ュ仠鎸夐挳鏍峰紡 */
.stop-btn {
  width: clamp(40px, 4vw, 48px); /* 缂╁皬灏哄 */
  height: clamp(40px, 4vw, 48px); /* 缂╁皬灏哄 */
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
  display: none; /* 闅愯棌鏂囧瓧鍐呭 */
}

.stop-icon {
  display: flex;
  align-items: center;
}

.icon {
  width: 16px;
  height: 16px;
}

/* 鐢ㄦ埛淇℃伅鏍峰紡 */
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
  gap: 6px; /* 鍑忓皯闂磋窛 */
  min-width: clamp(60px, 8vw, 80px); /* 璋冩暣鏈€灏忓搴?*/
}

.name {
  color: #fff;
  font-size: clamp(14px, 1.2vw, 16px); /* 璋冩暣瀛椾綋澶у皬 */
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

/* 鐢ㄦ埛鑿滃崟鏍峰紡 */
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

/* 涓诲唴瀹瑰尯 */
.main-content {
  height: calc(100vh - 88px);
  overflow-y: auto;
  background: #f5f5f5;
}

/* 鍝嶅簲寮忔柇鐐?*/
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

/* 鏂板锛氶珮鍒嗚鲸鐜囧睆骞曚紭鍖?*/
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

/* 鏂板锛氳秴楂樺垎杈ㄧ巼灞忓箷浼樺寲 */
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

/* 鍛煎惛鐏姸鎬佹寚绀哄櫒 */
.status-light {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999; /* 榛樿鏈煡鐏拌壊 */
  margin-right: 8px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.status-light.is-online {
  background-color: #52c41a; /* 鍦ㄧ嚎缁胯壊 */
  box-shadow: 0 0 8px #52c41a;
  animation: breathing 2s infinite ease-in-out;
}

.status-light.is-offline {
  background-color: #ff4d4f; /* 绂荤嚎绾㈣壊 */
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
