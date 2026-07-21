#!/bin/bash

# ==========================================
# robot_web 一键构建与导出离线 Docker 镜像脚本 (Linux/Mac)
# ==========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${GREEN}=== 正在构建 robot_web Docker 离线镜像 ===${NC}\n"

if [ ! -d "dist" ]; then
  echo -e "${RED}错误: 未在当前目录下检测到 dist 目录，请先运行前端编译命令 (例如 npm run build:intranet)！${NC}"
  exit 1
fi

echo -e "${YELLOW}1. 正在构建 Docker 镜像 (robot-web:latest)...${NC}"
docker build -t robot-web:latest .
if [ $? -ne 0 ]; then
  echo -e "${RED}错误: Docker 镜像构建失败，请检查 Docker 服务运行状态！${NC}"
  exit 1
fi

mkdir -p deploy

echo -e "${YELLOW}2. 正在导出离线镜像包至 deploy/robot-web-offline.tar ...${NC}"
docker save -o deploy/robot-web-offline.tar robot-web:latest

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}==============================================${NC}"
  echo -e "${GREEN}🎉 离线镜像导出成功！${NC}"
  echo -e "文件位置: ${YELLOW}deploy/robot-web-offline.tar${NC}"
  echo -e "部署提示: 将 deploy/ 目录发送到无外网的目标机器，运行 ${YELLOW}./deploy_offline.sh${NC} 即可完成离线部署。"
  echo -e "=============================================="
else
  echo -e "\n${RED}❌ 镜像导出失败！${NC}"
  exit 1
fi
