# 机器人控制与管理平台 (Robot Web Control Platform)

<p align="center">
  <b>基于 Vue 3 + TypeScript + Three.js 构建的工业级机器人数据监控、导航调度控制平台</b>
</p>

---

## 📖 项目简介

**Robot Web Control Platform** 是一套面向多构型移动机器人（AGV/AMR/巡检机器人等）的综合管理平台。平台提供机器人实时状态监控、低延迟视频回传、2D 栅格与 3D 点云高精度地图渲染、任务航线规划与集群调度、设备管理、告警追溯及企业级权限管控能力。

---

## ⚙️ 环境配置

项目支持快速在**局域网（intranet）**与**公网（internet）**之间切换配置。

### 配置文件说明

根目录下包含配置文件 [env.config.js](file:///e:/Project/robot_web/env.config.js)：

```javascript
export default {
  // 环境类型: 'intranet' (内网) 或 'internet' (外网)
  VITE_APP_ENVIRONMENT: 'internet',
  
  // 平台标题与版本
  VITE_APP_TITLE: '机器人控制平台',
  VITE_APP_VERSION: '1.0.0'
}
```

> **提示**：如果在根目录下创建 `env.local` 文件，其优先级将高于 `env.config.js`。

---

## 🚀 本地开发与构建

### 1. 安装依赖

确保本机已安装 Node.js 18+ 及 npm / pnpm / yarn：

```bash
npm install
```

### 2. 启动开发服务器

根据实际调试场景选择环境模式启动：

```bash
# 默认环境启动
npm run dev

# 内网环境模式启动
npm run dev:intranet

# 外网环境模式启动
npm run dev:internet
```

开发服务器默认监听在 `http://localhost:5173`。

### 3. 项目编译与类型检查

```bash
# 标准打包
npm run build

# 指定内网环境打包
npm run build:intranet

# 指定外网环境打包
npm run build:internet
```

编译产物将输出至根目录的 `dist/` 文件夹。

### 4. 本地预览生产构建产物

```bash
# 方式一：使用 Vite 预览
npm run preview

# 方式二：使用原生生产服务器运行（包含动态代理与信令代理）
node server.js 4173
```

---

## 🚢 部署指南

平台提供了完整的容器化方案，支持在线自动化构建部署以及工控机/局域网环境下的无网离线部署。

### 方式一：Docker 在线部署 (推荐)

在部署机执行自带的一键脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动检测系统环境、交互式引导配置外部访问端口与 FastAPI 后端 API 地址，并拉起服务容器。

若使用 `docker-compose`：

```bash
# 指定端口并后台启动
HOST_PORT=5173 BACKEND_URL=http://127.0.0.1:18000 docker compose up -d --build
```

---

### 方式二：离线打包与部署 (无外网工业场景)

在内网或隔离工控机环境下，可使用离线镜像包方案：

#### 1. 在开发机/有网机打包离线镜像

- **Linux / macOS**:
  ```bash
  chmod +x pack_offline.sh
  ./pack_offline.sh
  ```
- **Windows (PowerShell)**:
  ```powershell
  .\pack_offline.ps1
  ```

打包脚本会自动执行编译构建、导出 Docker 镜像（支持 x86_64 或 aarch64）并生成 `deploy.zip` 压缩包。

#### 2. 在目标机一键导入部署

将 `deploy.zip` 拷贝至目标机解压后运行：

```bash
chmod +x deploy_offline.sh
./deploy_offline.sh
```

---

### 方式三：裸机 Node.js 部署

若目标设备未安装 Docker，也可直接使用 Node 运行生产服务：

```bash
# 确保已完成 npm run build 并存在 dist 目录
node server.js 5173
```

---

## 📡 接口与通信协议参考

- **WebSocket 实时推送规范**：请参考文档 [websockets.md](file:///e:/Project/robot_web/websockets.md)，了解机器人的高频位姿推送、任务状态事件、告警事件等数据格式。
- **动态机器人转发中间件**：在请求携带 `robot_ip` Query 参数时，前端服务器将请求透明转发至指定机器人：
  - `/api/dxr_api/*` 或 `/robot81/*` $\rightarrow$ `http://<robot_ip>:81/*`
  - `/download_file`、`/upload_single_file` 等 $\rightarrow$ `http://<robot_ip>:5000/*`
