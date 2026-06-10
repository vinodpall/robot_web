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
    
    const response = await login(loginForm.value)
    
    // 登录验证成功后，清除原设备缓存并直接进入系统
    localStorage.removeItem('selected_vehicle_type')
    localStorage.removeItem('selected_robot_id')
    localStorage.removeItem('selected_robot_info')

    userStore.setUser((response as any).user)
    userStore.setToken((response as any).token)
    
    // 根据是否勾选记住密码来保存或清除登录信息
    if (loginForm.value.remember) {
      const expireTime = Date.now() + (7 * 24 * 60 * 60 * 1000)
      localStorage.setItem('savedUsername', loginForm.value.username)
      localStorage.setItem('savedPassword', loginForm.value.password)
      localStorage.setItem('savedExpireTime', expireTime.toString())
    } else {
      localStorage.removeItem('savedUsername')
      localStorage.removeItem('savedPassword')
      localStorage.removeItem('savedExpireTime')
    }
    
    router.push('/dashboard/home')

    ;(async () => {
      try {
        await initAllPermissions()
        await initUserPermissions()
      } catch (err) {
        console.error('权限初始化失败:', err)
      }
    })()
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
  font-family: 'YouSheBiaoTiHei', 'Microsoft YaHei', 'PingFang SC', 'SimHei', sans-serif;
  font-size: 48px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0.5px;
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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

/* 车辆选择弹窗样式 */
.vehicle-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(4, 8, 16, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.vehicle-dialog {
  background: rgba(15, 25, 45, 0.95);
  border: 1px solid rgba(0, 188, 212, 0.4);
  border-radius: 16px;
  width: 90%;
  max-width: 680px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 188, 212, 0.15);
  padding: 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.vehicle-dialog-header {
  text-align: center;
}

.vehicle-dialog-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(0, 188, 212, 0.5);
  margin-bottom: 0.5rem;
}

.vehicle-dialog-subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
}

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.vehicle-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1.5px solid rgba(0, 188, 212, 0.15);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.vehicle-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.08), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.vehicle-card:hover:not(.disabled) {
  border-color: rgba(0, 188, 212, 0.6);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 188, 212, 0.2);
}

.vehicle-card:hover:not(.disabled)::before {
  opacity: 1;
}

.vehicle-card.active {
  border-color: #00bcd4;
  background: rgba(0, 188, 212, 0.08);
  box-shadow: 0 0 20px rgba(0, 188, 212, 0.25), inset 0 0 15px rgba(0, 188, 212, 0.15);
}

.vehicle-card.active::after {
  content: '✓';
  position: absolute;
  top: 10px;
  right: 12px;
  width: 20px;
  height: 20px;
  background: #00bcd4;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  line-height: 20px;
  font-weight: bold;
}

.vehicle-card.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.01);
}

.vehicle-icon-wrap {
  width: 70px;
  height: 70px;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.75);
}

.vehicle-card:hover:not(.disabled) .vehicle-icon-wrap {
  background: rgba(0, 188, 212, 0.1);
  border-color: rgba(0, 188, 212, 0.3);
  transform: scale(1.05);
  color: #00bcd4;
}

.vehicle-card.active .vehicle-icon-wrap {
  background: rgba(0, 188, 212, 0.15);
  border-color: rgba(0, 188, 212, 0.4);
  color: #00bcd4;
}

.vehicle-svg {
  width: 36px;
  height: 36px;
}

.vehicle-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.35rem;
}

.vehicle-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.4;
  padding: 0 0.5rem;
}

.vehicle-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
}

.vehicle-dialog-btn {
  padding: 0.65rem 1.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.vehicle-dialog-btn.cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.75);
}

.vehicle-dialog-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
}

.vehicle-dialog-btn.confirm {
  background: linear-gradient(135deg, #00bcd4, #0097a7);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.25);
}

.vehicle-dialog-btn.confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #00acc1, #00838f);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 188, 212, 0.35);
}

.vehicle-dialog-btn.confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (max-width: 576px) {
  .vehicle-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .vehicle-dialog {
    padding: 1.5rem;
    gap: 1rem;
  }
  .vehicle-dialog-title {
    font-size: 1.3rem;
  }
}
</style>
