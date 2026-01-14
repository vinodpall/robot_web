<template>
  <div v-if="show" class="success-message-overlay">
    <div class="success-message-dialog">
      <div class="success-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="#52c41a" opacity="0.15"/>
          <path d="M28 14L17 25L12 20" stroke="#52c41a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="success-message-content">{{ message }}</div>
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
.success-message-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 10000;
  pointer-events: none;
}

.success-message-dialog {
  margin-top: 20vh;
  background: linear-gradient(135deg, #1a233a 80%, #16213a 100%);
  border: 1px solid rgba(82, 196, 26, 0.4);
  border-radius: 12px;
  padding: 20px 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 2px 10px rgba(82, 196, 26, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 260px;
  max-width: 400px;
  pointer-events: auto;
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

.success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-message-content {
  color: #ffffff;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
}
</style>