<template>
  <div class="drone-control-main">
    <!-- 侧边栏 -->
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: currentTab === tab.key }]"
          @click="handleTabClick(tab.key)"
        >
          <img :src="tab.icon" :alt="tab.label" />
        </div>
      </div>
    </aside>
    <!-- 主体内容区 -->
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
                  <div class="body-params-item" v-for="(temp, idx) in jointMotorTemps" :key="`joint-${idx}`">
                    <span class="body-params-label">关节{{ idx + 1 }}</span>
                    <span class="body-params-value">{{ temp }}℃</span>
                  </div>
                </div>
              </div>

              <div class="body-params-section">
                <div class="body-params-title">驱动器温度</div>
                <div class="body-params-grid">
                  <div class="body-params-item" v-for="(temp, idx) in driverTemps" :key="`driver-${idx}`">
                    <span class="body-params-label">驱动器{{ idx + 1 }}</span>
                    <span class="body-params-value">{{ temp }}℃</span>
                  </div>
                </div>
              </div>

              <div class="body-params-section">
                <div class="body-params-title">CPU 信息</div>
                <div class="body-params-grid body-params-grid-compact">
                  <div class="body-params-item">
                    <span class="body-params-label">CPU 温度</span>
                    <span class="body-params-value">{{ cpuTemp }}℃</span>
                  </div>
                  <div class="body-params-item">
                    <span class="body-params-label">CPU 频率</span>
                    <span class="body-params-value">{{ cpuFrequency }} MHz</span>
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
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import bodyInfoIcon from '@/assets/source_data/svg_data/robot_source/body_info.svg'

const router = useRouter()
const route = useRoute()

const sidebarTabs = [
  { key: 'body', label: '本体参数', icon: bodyInfoIcon, path: '/dashboard/users' }
]
const currentTab = ref('body')
const jointMotorTemps = ref(Array.from({ length: 12 }, () => 42))
const driverTemps = ref(Array.from({ length: 12 }, () => 38))
const cpuTemp = ref(55)
const cpuFrequency = ref(1800)

const handleTabClick = (key: string) => {
  const tab = sidebarTabs.find(t => t.key === key)
  if (tab && route.path !== tab.path) {
    router.push(tab.path)
  }
  currentTab.value = key
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
  box-shadow: inset 0 0 12px rgba(7, 24, 38, 0.35), 0 10px 18px rgba(4, 12, 22, 0.3);
}

.body-params-label {
  color: #b6d2e5;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.body-params-value {
  color: #eef7ff;
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 0 6px rgba(103, 213, 253, 0.35);
}
</style>