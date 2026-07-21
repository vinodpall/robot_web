#!/bin/bash

# ==========================================
# robot_web 离线 Docker 一键部署脚本
# ==========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}=== 启动 robot_web 离线 Docker 部署流程 ===${NC}\n"

# 1. 检查 Docker 是否安装
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}错误: 未检测到 Docker，请先安装 Docker。${NC}" >&2
  exit 1
fi

# 2. 检查 Docker Compose 是否安装
if ! [ -x "$(command -v docker-compose)" ] && ! docker compose version &>/devnull; then
  echo -e "${RED}错误: 未检测到 docker-compose，请先安装 docker-compose。${NC}" >&2
  exit 1
fi

# 3. 检查离线镜像文件是否存在
OFFLINE_TAR="robot-web-offline.tar"
if [ ! -f "$OFFLINE_TAR" ]; then
  if [ -f "robot-web-image.tar" ]; then
    OFFLINE_TAR="robot-web-image.tar"
  elif [ -f "deploy/robot-web-offline.tar" ]; then
    OFFLINE_TAR="deploy/robot-web-offline.tar"
  else
    echo -e "${RED}错误: 当前目录下未检测到离线镜像文件 ($OFFLINE_TAR)！${NC}"
    echo "请确保已将离线镜像文件压缩包放置在与本脚本相同的目录下。"
    exit 1
  fi
fi

# 4. 载入离线镜像包
echo -e "${YELLOW}正在载入离线 Docker 镜像包 ($OFFLINE_TAR)...${NC}"
docker load -i "$OFFLINE_TAR"
if [ $? -ne 0 ]; then
  echo -e "${RED}错误: 离线镜像导入失败，请检查文件完整性或 Docker 服务运行状态！${NC}"
  exit 1
fi
echo -e "${GREEN}离线镜像载入成功！${NC}\n"

# 5. 读取默认值与环境变量配置
DEFAULT_HOST_PORT="5173"
DEFAULT_BACKEND_URL="http://127.0.0.1:8000"

if [ -f .env ]; then
  echo -e "${YELLOW}检测到已存在 .env 配置文件，将读取默认值:${NC}"
  eval "$(cat .env | grep -v '^#')"
  DEFAULT_HOST_PORT=${HOST_PORT:-$DEFAULT_HOST_PORT}
  DEFAULT_BACKEND_URL=${BACKEND_URL:-$DEFAULT_BACKEND_URL}
  echo "- 宿主机端口 (HOST_PORT): $DEFAULT_HOST_PORT"
  echo "- 后端 API 地址 (BACKEND_URL): $DEFAULT_BACKEND_URL"
  echo ""
fi

# 6. 引导输入配置
echo -e "${YELLOW}1. 请输入 FastAPI 后端 API 地址 (同机部署保持默认即可):${NC}"
read -p "后端 API 地址 (回车默认: $DEFAULT_BACKEND_URL): " input_backend_url
BACKEND_URL=${input_backend_url:-$DEFAULT_BACKEND_URL}
echo -e "已设定后端 API 地址: ${GREEN}$BACKEND_URL${NC}\n"

echo -e "${YELLOW}2. 请输入 Web 平台对外暴露的端口:${NC}"
read -p "对外端口 (回车默认: $DEFAULT_HOST_PORT): " input_host_port
HOST_PORT=${input_host_port:-$DEFAULT_HOST_PORT}
echo -e "已设定对外端口: ${GREEN}$HOST_PORT${NC}\n"

# 7. 生成或更新 .env 文件
echo -e "${YELLOW}3. 正在生成配置文件 .env ...${NC}"
cat << EOF > .env
# robot_web 部署环境变量配置
HOST_PORT=$HOST_PORT
BACKEND_URL=$BACKEND_URL
EOF
echo -e "${GREEN}配置文件 .env 生成成功!${NC}\n"

# 8. 执行离线部署 (注意：无需 --build，使用已载入的离线镜像)
echo -e "${YELLOW}4. 正在启动 Docker 容器 (使用离线镜像)...${NC}"
if [ -x "$(command -v docker-compose)" ]; then
  docker-compose down
  docker-compose up -d
else
  docker compose down
  docker compose up -d
fi

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}==============================================${NC}"
  echo -e "${GREEN}🎉 robot_web 离线部署成功！${NC}"
  echo -e "${GREEN}==============================================${NC}"
  echo -e "你可以访问以下地址打开平台:"
  echo -e "👉 ${YELLOW}http://<服务器IP>:$HOST_PORT${NC}"
  echo ""
  echo -e "使用以下命令查看运行状态和日志:"
  echo -e "- 查看容器状态: ${YELLOW}docker ps -f name=robot-web${NC}"
  echo -e "- 查看实时日志: ${YELLOW}docker logs -f robot-web${NC}"
  echo -e "=============================================="
else
  echo -e "\n${RED}❌ 部署过程中出现错误，请检查控制台输出日志！${NC}"
  exit 1
fi
