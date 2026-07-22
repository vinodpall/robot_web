#!/bin/bash

# ==========================================
# robot_web 多架构离线 Docker 镜像打包脚本 (Linux/Mac)
# ==========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${GREEN}=== 正在构建 robot_web 多架构 Docker 离线镜像 ===${NC}\n"

if [ ! -d "dist" ]; then
  echo -e "${RED}错误: 未在当前目录下检测到 dist 目录，请先运行前端编译命令 (例如 npm run build)！${NC}"
  exit 1
fi

mkdir -p deploy

# 检查是否支持 docker buildx
USE_BUILDX=false
if docker buildx version &>/devnull; then
  USE_BUILDX=true
fi

echo -e "${YELLOW}请选择打包的系统架构版本:${NC}"
echo "1) 双架构打包 (同时生成 x86_64 和 ARM64 离线包) [默认推荐]"
echo "2) 仅打包 x86_64 架构 (Intel / AMD / 常用PC服务器)"
echo "3) 仅打包 ARM64 架构 (树莓派 / RK3588 / Jetson / 鲲鹏)"
read -p "请选择 [1-3] (回车默认: 1): " pack_choice
pack_choice=${pack_choice:-1}

build_x86() {
  echo -e "\n${YELLOW}正在构建 x86_64 (amd64) 架构镜像...${NC}"
  if [ "$USE_BUILDX" = true ]; then
    docker buildx build --platform linux/amd64 -t robot-web:latest --output type=docker,dest=deploy/robot-web-x86_64.tar .
  else
    docker build -t robot-web:latest .
    docker save -o deploy/robot-web-x86_64.tar robot-web:latest
  fi
  [ $? -eq 0 ] && echo -e "${GREEN}✔ x86_64 镜像导出成功 -> deploy/robot-web-x86_64.tar${NC}"
}

build_arm() {
  echo -e "\n${YELLOW}正在构建 ARM64 (aarch64) 架构镜像...${NC}"
  if [ "$USE_BUILDX" = true ]; then
    docker buildx build --platform linux/arm64 -t robot-web:latest --output type=docker,dest=deploy/robot-web-arm64.tar .
  else
    echo -e "${YELLOW}注意: 当前未检测到 docker buildx，将使用本机环境构建。请确保本机为 ARM 架构！${NC}"
    docker build -t robot-web:latest .
    docker save -o deploy/robot-web-arm64.tar robot-web:latest
  fi
  [ $? -eq 0 ] && echo -e "${GREEN}✔ ARM64 镜像导出成功 -> deploy/robot-web-arm64.tar${NC}"
}

case $pack_choice in
  1)
    build_x86
    build_arm
    ;;
  2)
    build_x86
    ;;
  3)
    build_arm
    ;;
  *)
    echo -e "${RED}无效选择，取消打包。${NC}"
    exit 1
    ;;
esac

echo -e "\n${GREEN}==============================================${NC}"
echo -e "${GREEN}🎉 离线包构建完成！${NC}"
echo -e "镜像放置目录: ${YELLOW}deploy/${NC}"
echo -e "部署提示: 将 deploy/ 目录发送到目标机器，在目标服务器运行 ${YELLOW}./deploy_offline.sh${NC} 即可（脚本将自动识别并提供选择架构）。"
echo -e "=============================================="
