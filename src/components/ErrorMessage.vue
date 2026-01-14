<template>
  <div v-if="show" class="error-message-overlay">
    <div class="error-message-dialog">
      <div class="error-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="#ff4d4f" opacity="0.15"/>
          <path d="M20 12V22M20 26V26.5" stroke="#ff4d4f" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="error-title">操作失败</div>
      <div class="error-message-content">{{ message }}</div>
      <div class="error-message-actions">
        <button class="error-btn error-btn-primary" @click="close">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  message: string
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const close = () => {
  emit('close')
}
</script>

<style scoped>
.error-message-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.error-message-dialog {
  margin-top: 28vh;
  background: linear-gradient(135deg, #1a233a 80%, #16213a 100%);
  border: 1px solid rgba(255, 77, 79, 0.4);
  border-radius: 16px;
  padding: 20px 28px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6), 0 2px 16px rgba(255, 77, 79, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 300px;
  max-width: 400px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.error-title {
  color: #ff4d4f;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.error-message-content {
  color: #c9d1d9;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
  text-align: center;
}

.error-message-actions {
  display: flex;
  justify-content: center;
  width: 100%;
}

.error-btn {
  padding: 8px 32px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.error-btn-primary {
  background: linear-gradient(135deg, #ff4d4f 0%, #d32029 100%);
  color: #fff;
  border: 1px solid rgba(255, 77, 79, 0.5);
}

.error-btn-primary:hover {
  background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%);
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
}
</style>
