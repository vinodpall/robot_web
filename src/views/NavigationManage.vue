<template>
  <div class="drone-control-main">
    <!-- 侧边栏菜单 -->
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: currentTab === tab.key }]"
          :title="tab.label"
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
          <!-- 录包建图 -->
          <template v-if="currentTab === 'map_record'">
            <div class="nav-content-wrapper">
              <!-- 采集地图数据 -->
              <div class="map-section">
                <div class="map-section-title">采集地图数据</div>
                <div class="map-section-buttons">
                  <button 
                    class="map-btn map-btn-primary" 
                    :disabled="isRecording"
                    @click="handleStartRecording"
                  >
                    开始录包
                  </button>
                  <button 
                    class="map-btn map-btn-secondary" 
                    :disabled="!isRecording"
                    @click="handleStopRecording"
                  >
                    完成录制
                  </button>
                </div>
              </div>

              <!-- 创建二维地图 -->
              <div class="map-section">
                <div class="map-section-title">创建二维地图</div>
                <div class="map-section-buttons">
                  <button class="map-btn map-btn-primary" @click="handleGenerateMap">生成地图</button>
                  <button class="map-btn map-btn-primary" @click="handleGenerateGridMap">生成栅格地图</button>
                  <button class="map-btn map-btn-primary" @click="handleCreateFusionMap">新建融合地图</button>
                </div>
              </div>

              <!-- 建图进度 -->
              <div class="map-section">
                <div class="map-progress-header">
                  <div class="map-section-title">建图进度:</div>
                  <div class="map-progress-percent">{{ mapProgress }}%</div>
                </div>
                <div class="map-progress-wrapper">
                  <div class="map-progress-bar">
                    <div 
                      class="map-progress-fill" 
                      :style="{ width: mapProgress + '%' }"
                    ></div>
                  </div>
                  <button 
                    class="map-btn map-btn-stop" 
                    :disabled="mapProgress === 0"
                    @click="handleStopMapping"
                  >
                    终止
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 导航 -->
          <template v-else-if="currentTab === 'nav'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">导航</span>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="settings-content">
                <p style="color: #b8c7d9; font-size: 14px;">导航功能开发中...</p>
              </div>
            </div>
          </template>

          <!-- 地图编辑 -->
          <template v-else-if="currentTab === 'map_edit'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">地图编辑</span>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="settings-content">
                <p style="color: #b8c7d9; font-size: 14px;">地图编辑功能开发中...</p>
              </div>
            </div>
          </template>

          <!-- 路线录制 -->
          <template v-else-if="currentTab === 'track_record'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">路线录制</span>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="settings-content">
                <p style="color: #b8c7d9; font-size: 14px;">路线录制功能开发中...</p>
              </div>
            </div>
          </template>

          <!-- 文件管理 -->
          <template v-else-if="currentTab === 'file_manage'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">文件管理</span>
              </div>
              <div class="nav-top-row">
                <input v-model="filter.keyword" class="nav-input" placeholder="请输入关键字搜索" />
                <button class="nav-btn" @click="handleSearch">查询</button>
                <button class="nav-btn nav-btn-add" @click="handleAdd">上传文件</button>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="nav-card-list">
                <div class="nav-card" v-for="(item, idx) in fileList" :key="idx">
                  <div class="nav-card-header">
                    <span class="nav-card-title">{{ item.name || '-' }}</span>
                    <span class="nav-card-delete" @click="handleDelete(item.id)">
                      <img :src="rubbishIcon" alt="删除" />
                    </span>
                  </div>
                  <div class="nav-card-body">
                    <div class="nav-card-info">
                      <div class="info-row"><span class="info-label">文件类型：</span><span class="info-value">{{ item.type || '-' }}</span></div>
                      <div class="info-row"><span class="info-label">文件大小：</span><span class="info-value">{{ item.size || '-' }}</span></div>
                      <div class="info-row"><span class="info-label">创建时间：</span><span class="info-value">{{ item.createTime || '-' }}</span></div>
                      <div class="info-row"><span class="info-label">状态：</span><span class="info-value">{{ item.status || '正常' }}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 数据包管理 -->
          <template v-else-if="currentTab === 'package_manage'">
            <div class="nav-top-card card">
              <div class="nav-top-header">
                <img src="@/assets/source_data/bg_data/card_logo.png" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" alt="logo" />
                <span class="nav-top-title">数据包管理</span>
              </div>
              <div class="nav-top-row">
                <input v-model="filter.keyword" class="nav-input" placeholder="请输入关键字搜索" />
                <button class="nav-btn" @click="handleSearch">查询</button>
                <button class="nav-btn nav-btn-add" @click="handleAdd">新建数据包</button>
              </div>
            </div>
            <div class="nav-content-wrapper">
              <div class="settings-content">
                <p style="color: #b8c7d9; font-size: 14px;">数据包管理功能开发中...</p>
              </div>
            </div>
          </template>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import rubbishIcon from '@/assets/source_data/svg_data/rubbish.svg'
import mapRecordIcon from '@/assets/source_data/svg_data/map_record.svg'
import navIcon from '@/assets/source_data/svg_data/nav.svg'
import mapEditIcon from '@/assets/source_data/svg_data/map_edit.svg'
import trackRecordIcon from '@/assets/source_data/svg_data/track_record.svg'
import fileManageIcon from '@/assets/source_data/svg_data/file_manage.svg'
import packageManageIcon from '@/assets/source_data/svg_data/package_manage.svg'

// 侧边栏菜单配置
const sidebarTabs = [
  { key: 'map_record', label: '录包建图', icon: mapRecordIcon },
  { key: 'nav', label: '导航', icon: navIcon },
  { key: 'map_edit', label: '地图编辑', icon: mapEditIcon },
  { key: 'track_record', label: '路线录制', icon: trackRecordIcon },
  { key: 'file_manage', label: '文件管理', icon: fileManageIcon },
  { key: 'package_manage', label: '数据包管理', icon: packageManageIcon }
]

const currentTab = ref('map_record')

const handleTabClick = (key: string) => {
  currentTab.value = key
}

// 筛选
const filter = ref<{ keyword: string }>({ keyword: '' })

const handleSearch = () => {
  console.log('搜索:', filter.value.keyword)
  // TODO: 实现搜索逻辑
}

// 录包建图相关状态
const isRecording = ref(false)
const mapProgress = ref(0)

// 录包建图相关方法
const handleStartRecording = () => {
  isRecording.value = true
  console.log('开始录包')
  // TODO: 调用开始录包API
}

const handleStopRecording = () => {
  isRecording.value = false
  console.log('完成录制')
  // TODO: 调用完成录制API
}

const handleGenerateMap = () => {
  console.log('生成地图')
  // TODO: 调用生成地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleGenerateGridMap = () => {
  console.log('生成栅格地图')
  // TODO: 调用生成栅格地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleCreateFusionMap = () => {
  console.log('新建融合地图')
  // TODO: 调用新建融合地图API
  mapProgress.value = 10 // 示例：开始进度
}

const handleStopMapping = () => {
  console.log('终止建图')
  mapProgress.value = 0
  // TODO: 调用终止建图API
}

// 文件管理示例数据
const fileList = ref([
  {
    id: 'F001',
    name: '地图文件_001.map',
    type: 'MAP',
    size: '15.6 MB',
    createTime: '2024-12-20 10:30:00',
    status: '正常'
  },
  {
    id: 'F002',
    name: '路径数据_002.path',
    type: 'PATH',
    size: '2.3 MB',
    createTime: '2024-12-21 14:20:00',
    status: '正常'
  },
  {
    id: 'F003',
    name: '配置文件_003.cfg',
    type: 'CONFIG',
    size: '128 KB',
    createTime: '2024-12-22 09:15:00',
    status: '正常'
  },
  {
    id: 'F004',
    name: '日志文件_004.log',
    type: 'LOG',
    size: '5.8 MB',
    createTime: '2024-12-23 16:45:00',
    status: '正常'
  }
])

const handleAdd = () => {
  console.log('添加操作')
  // TODO: 根据currentTab实现对应的添加逻辑
}

const handleDelete = (id: string) => {
  console.log('删除:', id)
  // TODO: 实现删除逻辑
}
</script>

<style scoped>
@import './mission-common.css';

.nav-top-card {
  margin-bottom: 4px;
  background: linear-gradient(135deg, #0a2a3a 80%, #0a0f1c 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px #0003;
  padding: 18px 24px 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-top-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.nav-top-title {
  font-size: 16px;
  color: #67d5fd;
  font-weight: 600;
}

.nav-top-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 4px;
  flex-wrap: wrap;
  overflow-x: visible;
}

.nav-input {
  height: 32px;
  border-radius: 4px;
  border: 1px solid #164159;
  background: transparent;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  box-shadow: 0 0 0 1px #164159 inset;
  transition: border 0.2s, box-shadow 0.2s;
  min-width: 120px;
  max-width: 180px;
  flex-shrink: 0;
}

.nav-input:focus {
  outline: none;
  border: 1.5px solid #16bbf2;
  box-shadow: 0 0 0 2px rgba(22,187,242,0.15);
}

.nav-btn {
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  padding: 4px 18px;
  cursor: pointer;
  border: none;
  transition: background 0.2s, color 0.2s, border 0.2s;
  height: 32px;
  margin-left: 4px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  background: #0c3c56;
  color: #67d5fd;
  border: 1px solid rgba(38, 131, 182, 0.8);
}

.nav-btn:hover {
  background: #0c4666;
  color: #67d5fd;
}

.nav-btn-add {
  margin-left: 4px;
}

.nav-content-wrapper {
  background: linear-gradient(135deg, #0a2a3a 80%, #0a0f1c 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px #0003;
  padding: 32px 32px 24px 32px;
  margin-bottom: 20px;
  min-height: 520px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.nav-card-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  margin-top: 0;
}

.nav-card {
  width: 100%;
  max-width: 400px;
  background: rgba(128, 128, 128, 0.12);
  border-radius: 8px;
  box-shadow: 0 2px 8px #0003;
  padding: 0 0 14px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: box-shadow 0.2s;
  justify-self: center;
}

.nav-card:hover {
  box-shadow: 0 4px 12px rgba(103, 213, 253, 0.2);
}

.nav-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  padding: 0 20px 0 24px;
  min-height: 38px;
  background: rgba(217, 217, 217, 0.10);
  border-radius: 8px 8px 0 0;
  height: 44px;
}

.nav-card-title {
  color: #FFF;
  font-family: Inter, 'Microsoft YaHei', Arial, sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  letter-spacing: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-card-delete {
  color: #ff4d4f;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  transition: filter 0.2s;
  height: 44px;
  padding-left: 12px;
}

.nav-card-delete img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: none;
  transition: filter 0.2s;
  display: block;
  margin: auto 0;
  color: #ff4d4f;
}

.nav-card-delete:hover img {
  filter: drop-shadow(0 0 4px #ff4d4f);
}

.nav-card-body {
  display: flex;
  align-items: center;
  padding: 20px 24px;
}

.nav-card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #d4edfd;
  font-size: 12px;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.info-row {
  display: flex;
  gap: 8px;
  align-items: center;
  line-height: 1.7;
}

.info-label {
  color: #b8c7d9;
  min-width: 80px;
  font-weight: 500;
  text-align: right;
  font-size: 12px;
  line-height: 1.7;
}

.info-value {
  color: #fff;
  font-weight: 400;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.7;
}

.settings-content {
  padding: 40px 20px;
  text-align: center;
}

/* 录包建图样式 */
.map-section {
  background: rgba(10, 42, 58, 0.6);
  border-radius: 8px;
  padding: 24px 32px;
  margin-bottom: 24px;
}

.map-section-title {
  font-size: 16px;
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 20px;
}

.map-section-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.map-btn {
  padding: 10px 32px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  min-width: 120px;
}

.map-btn-primary {
  background: #1890ff;
  color: #ffffff;
}

.map-btn-primary:hover:not(:disabled) {
  background: #40a9ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4);
}

.map-btn-primary:disabled {
  background: #1890ff;
  opacity: 0.5;
  cursor: not-allowed;
}

.map-btn-secondary {
  background: #6c757d;
  color: #ffffff;
}

.map-btn-secondary:hover:not(:disabled) {
  background: #868e96;
}

.map-btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-btn-stop {
  background: #6c757d;
  color: #ffffff;
  min-width: 100px;
}

.map-btn-stop:hover:not(:disabled) {
  background: #868e96;
}

.map-btn-stop:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-progress-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.map-progress-percent {
  font-size: 16px;
  color: #ffffff;
  font-weight: 600;
}

.map-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.map-progress-bar {
  flex: 1;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.map-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  border-radius: 12px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
}
</style>
