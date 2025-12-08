<template>
  <div class="nav-manage">
    <div class="card">
      <h1>导航管理</h1>
      <p>在这里可以后续扩展导航菜单的配置、分组与可见性等功能。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.nav-manage {
  min-height: calc(100vh - 120px);
  background: #0a0f1c;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 48px 64px;
  max-width: 760px;
  text-align: center;
  color: #e8f6ff;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.35);
}

.card h1 {
  font-size: 32px;
  margin-bottom: 16px;
  letter-spacing: 2px;
  color: #ffffff;
}

.card p {
  font-size: 16px;
  color: #a8c4d8;
  line-height: 1.8;
}
</style>
