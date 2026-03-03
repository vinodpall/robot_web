<template>
  <div class="login-container">
    <div class="login-background">
      <img src="/src/assets/source_data/bg_data/mian_pg_bg.png" alt="background" />
    </div>
    
    <div class="login-content">
      <div class="login-left">
        <div class="logo-section">
          <img src="/src/assets/source_data/dog_logo.svg" alt="logo" class="logo" />
          <h1 class="title">机器狗管控平台</h1>
        </div>
        <div class="drone-illustration">
          <img src="/src/assets/source_data/bg_data/main_pg_front.png" alt="drone" />
        </div>
      </div>
      
      <div class="login-right">
        <div class="login-form-container">
          <h2 class="form-title">账号登录</h2>
          
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <input
                v-model="loginForm.username"
                type="text"
                placeholder="请输入用户名"
                class="form-input"
                required
              />
            </div>
            
            <div class="form-group">
              <input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                class="form-input"
                required
              />
            </div>
            
            <div class="form-group remember-section">
              <label class="checkbox-label">
                <input v-model="loginForm.remember" type="checkbox" />
                <span class="checkmark"></span>
                记住密码
              </label>
            </div>
            
            <button 
              type="submit" 
              class="login-button"
              :disabled="loading"
            >
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- 错误提示弹窗 -->
    <div v-if="showErrorDialog" class="error-dialog-mask">
      <div class="error-dialog">
        <div class="error-dialog-header">
          <div class="error-icon">⚠️</div>
          <div class="error-title">登录失败</div>
        </div>
        <div class="error-dialog-content">
          <div class="error-message">{{ errorMessage }}</div>
        </div>
        <div class="error-dialog-actions">
          <button class="error-dialog-btn" @click="closeErrorDialog">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAuth } from '../composables/useApi'
import { initUserPermissions, initAllPermissions } from '../utils/initPermissions'
import { debugPermissions } from '../utils/permissionDebug'
import { robotApi, cameraApi, navigationApi } from '../api/services'

const router = useRouter()
const userStore = useUserStore()
const { login, loading, error } = useAuth()

const loginForm = ref({
  username: '',
  password: '',
  remember: false
})

const errorMessage = ref('')
const showErrorDialog = ref(false)

const normalizeTrackName = (raw: string) => {
  const name = (raw || '').trim()
  const atIndex = name.indexOf('@')
  return atIndex > -1 ? name.slice(0, atIndex) : name
}

const normalizeTaskGroupName = (raw: string) => {
  const name = (raw || '').trim()
  const atIndex = name.indexOf('@')
  return atIndex > -1 ? name.slice(0, atIndex) : name
}

const extractTrackTaskList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.response?.data)) return payload.response.data
  return []
}

// 页面加载时检查是否有保存的登录信息
onMounted(() => {
  const savedUsername = localStorage.getItem('savedUsername')
  const savedPassword = localStorage.getItem('savedPassword')
  const savedExpireTime = localStorage.getItem('savedExpireTime')
  
  // 检查是否过期
  if (savedUsername && savedPassword && savedExpireTime) {
    const expireTime = parseInt(savedExpireTime)
    const currentTime = Date.now()
    
    if (currentTime < expireTime) {
      // 未过期，加载保存的信息
      loginForm.value.username = savedUsername
      loginForm.value.password = savedPassword
      loginForm.value.remember = true
    } else {
      // 已过期，清除保存的信息
      localStorage.removeItem('savedUsername')
      localStorage.removeItem('savedPassword')
      localStorage.removeItem('savedExpireTime')
    }
  }
})

const handleLogin = async () => {
  try {
    errorMessage.value = ''
    showErrorDialog.value = false
    
    // 正确的代码 👇
    const response = await login(loginForm.value)
    
    userStore.setUser((response as any).user)
    userStore.setToken((response as any).token)
    
    // 根据是否勾选记住密码来保存或清除登录信息
    if (loginForm.value.remember) {
      // 保存到 localStorage，设置7天过期时间
      const expireTime = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7天后过期
      localStorage.setItem('savedUsername', loginForm.value.username)
      localStorage.setItem('savedPassword', loginForm.value.password)
      localStorage.setItem('savedExpireTime', expireTime.toString())
    } else {
      // 清除保存的信息
      localStorage.removeItem('savedUsername')
      localStorage.removeItem('savedPassword')
      localStorage.removeItem('savedExpireTime')
    }
    
    // 登录成功后立即初始化权限
    try {
      await initAllPermissions()
      await initUserPermissions()
      
      // 权限初始化完成后，输出调试信息
      debugPermissions()
      
      // 获取机器人列表并缓存摄像头信息
      try {
        const robotsResponse = await robotApi.getRobots()
        if (robotsResponse && robotsResponse.items && robotsResponse.items.length > 0) {
          // 取第一个机器人的ID，或者使用缓存的
          const cachedRobotId = localStorage.getItem('selected_robot_id')
          const robotId = cachedRobotId || robotsResponse.items[0].robot_id
          
          // 获取摄像头列表
          const cameraResponse = await cameraApi.getCameraList(robotId)
          if (cameraResponse && cameraResponse.data) {
            // 存储到本地
            localStorage.setItem('camera_list', JSON.stringify(cameraResponse.data))
            // 登录后立即启动前两个摄像头流
            const cameraList = cameraResponse.data || []
            for (let i = 0; i < 2; i++) {
              if (cameraList[i]) {
                try {
                  await cameraApi.startCameraStream(robotId, cameraList[i].CamKey, false)
                } catch (e) {}
              }
            }
          }
          
          // 获取所有循迹任务点列表
          try {
            const trackTaskResponse = await navigationApi.getAllTrackTaskList(robotId)
            const allTrackTaskList = extractTrackTaskList(trackTaskResponse)
            localStorage.setItem('all_track_task_list', JSON.stringify(allTrackTaskList))
          } catch (trackErr) {
            console.error('获取循迹任务点列表失败:', trackErr)
            // 获取失败不影响登录流程
          }

          // 获取地图列表并缓存（页面后续只读缓存）
          try {
            const mapListResponse = await navigationApi.getMapList(robotId)
            const mapList: string[] = []
            const mapUpdateTimeMap: Record<string, string> = {}
            const rawList = mapListResponse?.msg?.result || []
            rawList.forEach((item: string) => {
              const atIndex = item.indexOf('@')
              if (atIndex !== -1) {
                const mapName = item.substring(0, atIndex)
                const updateTime = item.substring(atIndex + 1)
                mapList.push(mapName)
                mapUpdateTimeMap[mapName] = updateTime
              } else {
                mapList.push(item)
                mapUpdateTimeMap[item] = ''
              }
            })
            localStorage.setItem('cached_map_list', JSON.stringify(mapList))
            localStorage.setItem('cached_map_update_time_map', JSON.stringify(mapUpdateTimeMap))
            if (!localStorage.getItem('selected_map_name') && mapList.length > 0) {
              localStorage.setItem('selected_map_name', mapList[0])
            }
          } catch (mapErr) {
            console.error('获取地图列表失败:', mapErr)
          }

          // 获取循迹列表并缓存（页面后续只读缓存）
          try {
            const trackListResponse = await navigationApi.getTrackList(robotId)
            const rawTrackList = trackListResponse?.msg?.result || []
            localStorage.setItem('cached_track_list', JSON.stringify(rawTrackList))
          } catch (trackListErr) {
            console.error('获取循迹列表失败:', trackListErr)
          }

          // 兜底：若循迹列表为空，尝试从 all_track_task_list 推导
          try {
            const cachedTrackListRaw = localStorage.getItem('cached_track_list')
            const currentTrackList = cachedTrackListRaw ? JSON.parse(cachedTrackListRaw) : []
            if (!Array.isArray(currentTrackList) || currentTrackList.length === 0) {
              const cachedAllTaskListRaw = localStorage.getItem('all_track_task_list')
              const allTaskList = cachedAllTaskListRaw ? extractTrackTaskList(JSON.parse(cachedAllTaskListRaw)) : []
              const derivedTracks = Array.from(
                new Set(allTaskList.map((task: any) => String(task.track_name || '').trim()).filter(Boolean))
              )
              localStorage.setItem('cached_track_list', JSON.stringify(derivedTracks))
            }
          } catch (deriveTrackErr) {
            console.error('从任务点缓存推导循迹列表失败:', deriveTrackErr)
          }

          // 获取任务组列表并缓存（按路线聚合）
          try {
            const cachedTrackListRaw = localStorage.getItem('cached_track_list')
            const trackList: string[] = cachedTrackListRaw ? JSON.parse(cachedTrackListRaw) : []
            const trackSet = Array.from(new Set(trackList.map(item => normalizeTrackName(item)).filter(Boolean)))
            const taskGroupMap: Record<string, string[]> = {}

            for (const trackName of trackSet) {
              try {
                const resp = await navigationApi.getTaskpointList(robotId, trackName)
                const groups = Array.isArray(resp?.msg?.result) ? resp.msg.result : []
                taskGroupMap[trackName] = Array.from(new Set(groups.map((g: string) => normalizeTaskGroupName(g)).filter(Boolean)))
              } catch (err) {
                console.error(`获取任务组列表失败: ${trackName}`, err)
                taskGroupMap[trackName] = []
              }
            }

            // 用 all_track_task_list 补齐（兼容接口返回差异）
            const cachedAllTaskListRaw = localStorage.getItem('all_track_task_list')
            if (cachedAllTaskListRaw) {
              const allTaskList = extractTrackTaskList(JSON.parse(cachedAllTaskListRaw))
              allTaskList.forEach((task: any) => {
                const trackName = normalizeTrackName(String(task.track_name || ''))
                const groupName = normalizeTaskGroupName(String(task.track_point_name || task.taskpoint_name || task.task_point_name || ''))
                if (!trackName || !groupName) return
                if (!taskGroupMap[trackName]) taskGroupMap[trackName] = []
                if (!taskGroupMap[trackName].includes(groupName)) {
                  taskGroupMap[trackName].push(groupName)
                }
              })
            }

            localStorage.setItem('cached_taskpoint_group_map', JSON.stringify(taskGroupMap))
          } catch (taskGroupErr) {
            console.error('构建任务组缓存失败:', taskGroupErr)
          }
        }
      } catch (cameraErr) {
        console.error('获取摄像头列表失败:', cameraErr)
        // 摄像头获取失败不影响登录流程
      }
      
      // 权限初始化完成后再跳转
      router.push('/dashboard/home')
    } catch (err) {
      console.error('权限初始化失败:', err)
      // 即使权限初始化失败，也允许用户进入系统
      router.push('/dashboard/home')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败'
    showErrorDialog.value = true
  }
}

const closeErrorDialog = () => {
  showErrorDialog.value = false
  errorMessage.value = ''
}


</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.login-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-content {
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: space-between;
  padding: 0 5%;
}

.login-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 600px;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3rem;
}

.logo {
  width: 70px;
  height: 70px;
  margin-right: 1rem;
}

.title {
  color: #FFF;
  text-align: center;
  font-family: YouSheBiaoTiHei;
  font-size: 48px;
  font-style: normal;
  font-weight: bold;
  line-height: 150%;
  letter-spacing: 1px;
  margin: 0;
}

.drone-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.drone-illustration img {
  max-width: 100%;
  height: auto;
}

.login-right {
  width: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form-container {
  background: rgba(15, 25, 45, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 188, 212, 0.3);
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.form-title {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #ffffff;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-input {
  padding: 1rem;
  border: 1px solid rgba(0, 188, 212, 0.3);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #ffffff;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #00bcd4;
  box-shadow: 0 0 0 2px rgba(0, 188, 212, 0.2);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.remember-section {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.checkbox-label input {
  margin-right: 0.5rem;
}

.login-button {
  padding: 1rem;
  background: linear-gradient(135deg, #00bcd4, #0097a7);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #00acc1, #00838f);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 6px;
  color: #f44336;
  text-align: center;
  font-size: 0.9rem;
}

/* 错误提示弹窗样式 */
.error-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.error-dialog {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  max-height: 80%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.error-dialog-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #f44336;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}

.error-icon {
  margin-right: 10px;
  font-size: 1.5rem;
}

.error-dialog-content {
  padding: 20px;
  text-align: center;
  color: #333;
  font-size: 1rem;
  overflow-y: auto;
  flex-grow: 1;
}

.error-dialog-actions {
  padding: 15px 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
  background: #f0f0f0;
}

.error-dialog-btn {
  padding: 8px 15px;
  background: #00bcd4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.error-dialog-btn:hover {
  background: #00acc1;
}

@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
    padding: 2rem;
  }
  
  .login-left {
    max-width: 100%;
    margin-bottom: 2rem;
  }
  
  .login-right {
    width: 100%;
    max-width: 400px;
  }
  
  .title {
    font-size: 2rem;
  }
}
</style>
