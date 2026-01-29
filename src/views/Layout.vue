<template>
  <div class="layout-container">
    <div class="header">
      <div class="header-left">
        <img src="/src/assets/source_data/dog_logo.svg" alt="logo" class="logo" />
        <span class="title">机器狗管控平台</span>
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
        <router-link to="/dashboard/users" class="nav-item" :class="{ active: $route.path.includes('users') || $route.path.includes('roles') }">
          系统管理
        </router-link>
      </nav>
      
      <div class="header-right">
        <!-- 机场名称下拉框 -->
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
          
          <!-- 下拉选项 -->
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

        <!-- 急停按钮 -->
        <span class="stop-btn" :class="{ 'is-active': isStopActive }" @click="toggleStop">
          <div class="stop-content">
            <span>{{ isStopActive ? '启动' : '急停' }}</span>
          </div>
        </span>

        <!-- 用户信息 -->
        <div class="user-info" @click="toggleUserMenu">
          <img src="/src/assets/source_data/avatar.jpg" alt="avatar" class="avatar" />
          <div class="right-sel">
            <span class="name">{{ user?.username || 'admin' }}</span>
            <span class="triangle" :class="{ 'is-active': isUserMenuVisible }"></span>
          </div>
          <!-- 下拉菜单 -->
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
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useDeviceStore } from '../stores/device'
import { dockApi, robotApi } from '../api/services'
import { useDeviceStatus } from '../composables/useDeviceStatus'
// 导入背景图片
import titleBg from '/src/assets/source_data/bg_data/title.png'

const router = useRouter()
const userStore = useUserStore()
const deviceStore = useDeviceStore()

// 设备状态管理
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

// 判断当前选中的机器人是否在线
const isSelectedRobotOnline = computed(() => {
  // 1. 优先检查选中机器人的静态状态 (兼容大小写)
  if (selectedRobot.value) {
    const status = selectedRobot.value.status?.toLowerCase()
    if (status === 'online') return true
  }
  
  // 2. 如果静态状态不在线，检查实时设备状态 (仅针对当前选中的机器人)
  // 注意：deviceStatus 是当前选中机器人的实时状态
  return deviceStatus.value?.isOnline || false
})

// 判断列表中的机器人是否在线
const isRobotItemOnline = (robot: any) => {
  // 列表中的机器人主要依赖其静态状态字段
  // 如果是当前选中的机器人，也可以参考实时状态(可选，为了保持列表和头部一致，这里简单处理)
  if (robot.robot_id === selectedRobotId.value) {
    return isSelectedRobotOnline.value
  }
  return robot.status?.toLowerCase() === 'online'
}

const isSelectActive = ref(false)

const toggleSelect = () => {
  isSelectActive.value = !isSelectActive.value
  handleRobotChange()
}

const handleRobotChange = () => {
  // 处理机器人选择逻辑
  console.log('当前选中的机器人:', selectedRobot.value?.robot_id)
}

const selectRobot = (id: string) => {
  selectedRobotId.value = id
  isSelectActive.value = false
}

// 点击外部关闭下拉列表
const closeSelect = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.el-select')) {
    isSelectActive.value = false
  }
}

// 监听点击事件
document.addEventListener('click', closeSelect)

const isUserMenuVisible = ref(false)

const toggleUserMenu = (e: Event) => {
  e.stopPropagation()
  isUserMenuVisible.value = !isUserMenuVisible.value
}

const handleChangePassword = () => {
  // 处理修改密码逻辑
  console.log('修改密码')
  isUserMenuVisible.value = false
}

const handleLogout = () => {
  // 处理退出登录逻辑
  console.log('退出登录')
  userStore.logout()
  router.push('/login')
  isUserMenuVisible.value = false
}

// 点击其他地方关闭用户菜单
const closeUserMenu = () => {
  isUserMenuVisible.value = false
}

// 监听点击事件
document.addEventListener('click', closeUserMenu)

// 急停状态计算
const isStopActive = computed(() => {
  return deviceStatus.value?.emergency_stop_state || false
})

// 急停按钮点击处理
const toggleStop = async () => {
  if (!selectedRobotId.value) {
    console.warn('未选择机器人')
    return
  }

  try {
    await dockApi.emergencyStop(selectedRobotId.value)
    console.log('急停操作成功')
    // 操作成功后刷新设备状态
    await fetchDeviceStatus(selectedRobotId.value)
  } catch (error) {
    console.error('急停操作失败:', error)
    // 可以在这里添加错误提示
  }
}

// 监听选中的机器人变化，自动获取设备状态
watch(selectedRobotId, async (newRobotId) => {
  if (newRobotId) {
    await fetchDeviceStatus(newRobotId)
  }
})

// 页面加载时恢复设备列表和状态
onMounted(async () => {
  // 获取机器人列表
  try {
    const res = await robotApi.getRobots()
    if (res && res.items) {
      deviceStore.setRobots(res.items)
      // 如果没有选中机器人且有列表，默认选中第一个
      if (!selectedRobotId.value && res.items.length > 0) {
        deviceStore.setSelectedRobot(res.items[0].robot_id)
      }
    }
  } catch (e) {
    console.error('获取机器人列表失败:', e)
  }

  // 恢复并拉取选中机器人的状态
  if (selectedRobotId.value) {
    await fetchDeviceStatus(selectedRobotId.value)
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

/* 顶部导航栏 */
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

/* 左侧Logo和标题 */
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
  font-family: 'YouSheBiaoTiHei', 'Microsoft YaHei', '黑体', 'SimHei', sans-serif;
  font-size: clamp(20px, 2.5vw, 34px); /* 使用clamp自动缩放 */
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
  max-width: clamp(200px, 25vw, 400px); /* 使用clamp自动缩放最大宽度 */
}

/* 中间导航菜单 */
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
  padding-left: clamp(6vw, 9vw, 14vw); /* 保证六个菜单均匀分布 */
  padding-right: clamp(6vw, 9vw, 14vw);
  min-width: 0;
}

.nav-item {
  width: clamp(70px, 6vw, 110px); /* 使用clamp自动缩放宽度 */
  height: 54px;
  background: url('/src/assets/source_data/bg_data/title_dark.png') no-repeat;
  background-position: bottom center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Source Han Sans CN;
  font-weight: 400;
  font-size: clamp(14px, 1.2vw, 18px); /* 使用clamp自动缩放字体大小 */
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

/* 右侧功能区 */
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
  width: clamp(250px, 30vw, 350px); /* 增加宽度范围 */
}

/* 机场选择器样式 */
.el-select {
  --el-transition-duration: 0.3s;
  --el-border-radius-base: 4px;
  --el-border-color: rgba(255, 255, 255, 0.2);
  --el-fill-color-blank: rgba(255, 255, 255, 0.1);
  
  width: clamp(140px, 15vw, 180px); /* 增加宽度范围 */
  margin-right: clamp(10px, 1.5vw, 15px);
  display: inline-block;
  position: relative;
  vertical-align: middle;
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
  position: relative;
  text-align: left;
  transform: translateZ(0);
  transition: var(--el-transition-duration);
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
  white-space: nowrap; /* 防止文字换行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-select__placeholder {
  color: #fff;
  margin-right: 20px;
  white-space: nowrap; /* 防止文字换行 */
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

/* 添加一个激活状态的类 */
.el-select__wrapper.is-active {
  --el-border-color: rgba(255, 255, 255, 0.6);
  --el-fill-color-blank: rgba(255, 255, 255, 0.2);
}

.el-select__wrapper.is-active .el-select__suffix svg {
  transform: rotate(180deg);
}

/* 下拉选项样式 */
.el-select__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
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

/* 急停按钮样式 */
.stop-btn {
  width: clamp(40px, 4vw, 48px); /* 缩小尺寸 */
  height: clamp(40px, 4vw, 48px); /* 缩小尺寸 */
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
  display: none; /* 隐藏文字内容 */
}

.stop-icon {
  display: flex;
  align-items: center;
}

.icon {
  width: 16px;
  height: 16px;
}

/* 用户信息样式 */
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
  gap: 6px; /* 减少间距 */
  min-width: clamp(60px, 8vw, 80px); /* 调整最小宽度 */
}

.name {
  color: #fff;
  font-size: clamp(14px, 1.2vw, 16px); /* 调整字体大小 */
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

/* 用户菜单样式 */
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

/* 主内容区 */
.main-content {
  height: calc(100vh - 88px);
  overflow-y: auto;
  background: #f5f5f5;
}

/* 响应式断点 */
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

/* 新增：高分辨率屏幕优化 */
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

/* 新增：超高分辨率屏幕优化 */
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

/* 呼吸灯状态指示器 */
.status-light {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999; /* 默认未知灰色 */
  margin-right: 8px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.status-light.is-online {
  background-color: #52c41a; /* 在线绿色 */
  box-shadow: 0 0 8px #52c41a;
  animation: breathing 2s infinite ease-in-out;
}

.status-light.is-offline {
  background-color: #ff4d4f; /* 离线红色 */
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
