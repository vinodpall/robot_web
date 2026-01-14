<template>
  <div v-if="show" class="confirm-dialog-mask" @click="handleMaskClick">
    <div class="confirm-dialog" @click.stop>
      <button class="confirm-close-btn" aria-label="关闭" @click="handleCancel">×</button>
      <div class="confirm-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="24" :fill="iconColor" opacity="0.1"/>
          <path d="M24 12C17.373 12 12 17.373 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 17.373 30.627 12 24 12ZM24 34C18.486 34 14 29.514 14 24C14 18.486 18.486 14 24 14C29.514 14 34 18.486 34 24C34 29.514 29.514 34 24 34Z" :fill="iconColor"/>
          <path d="M24 18V26M24 30V30.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="confirm-title">{{ title }}</div>
      <div class="confirm-content">
        <p v-for="(line, index) in messageLines" :key="index">{{ line }}</p>
      </div>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-btn-cancel" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button class="confirm-btn confirm-btn-confirm" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'success' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  message: '您确定要执行此操作吗?',
  confirmText: '确认',
  cancelText: '取消',
  type: 'warning'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

const messageLines = computed(() => {
  return props.message?.split('\n') || []
})

const iconColor = computed(() => {
  const colors = {
    warning: '#faad14',
    info: '#1890ff',
    success: '#52c41a',
    error: '#ff4d4f'
  }
  return colors[props.type]
})

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

// 点击遮罩关闭
const handleMaskClick = () => {
  handleCancel()
}
</script>

<style scoped>
.confirm-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  margin-top: 28vh;
  background: linear-gradient(135deg, #1a233a 80%, #16213a 100%);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 8px 40px #000a, 0 2px 16px rgba(24, 144, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  width: 86%;
  border: 1px solid rgba(24, 144, 255, 0.25);
  position: relative;
}

.confirm-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  color: #8c96a8;
  font-size: 22px;
  cursor: pointer;
  transition: color 0.2s;
}

.confirm-close-btn:hover {
  color: #fff;
}

.confirm-icon {
  margin-bottom: 12px;
}

.confirm-title {
  font-size: 18px;
  color: #fff;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}

.confirm-content {
  text-align: center;
  margin-bottom: 20px;
  color: #c9d1d9;
  width: 100%;
}

.confirm-content p {
  margin: 6px 0;
  font-size: 13px;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
}

.confirm-btn {
  padding: 8px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  min-width: 90px;
}

.confirm-btn-cancel {
  background: rgba(140, 150, 168, 0.15);
  color: #c9d1d9;
  border: 1px solid rgba(140, 150, 168, 0.3);
}

.confirm-btn-cancel:hover {
  background: rgba(140, 150, 168, 0.25);
  border-color: rgba(140, 150, 168, 0.5);
}

.confirm-btn-confirm {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  border: 1px solid rgba(24, 144, 255, 0.5);
}

.confirm-btn-confirm:hover {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}
</style>
