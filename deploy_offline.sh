#!/bin/bash

# ==========================================
# robot_web 离线 Docker 一键部署脚本 (支持多架构智能识别与纯 Docker 降级)
# ==========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}=== 启动 robot_web 离线 Docker 部署流程 ===${NC}\n"

# 1. 检查 Docker 是否安装
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}错误: 未检测到 Docker，请先安装 Docker。${NC}" >&2
  exit 1
fi

# 2. 检测 Docker Compose 工具 (若未安装则自动降级使用纯 Docker 命令行部署)
COMPOSE_CMD=""
if [ -x "$(command -v docker-compose)" ]; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo -e "${YELLOW}提示: 未检测到 docker-compose，将自动使用标准 Docker 引擎完成无缝部署。${NC}"
fi

# 3. 自动检测 CPU 架构并寻找对应离线镜像
SYS_ARCH=$(uname -m)
DETECTED_TYPE="x86_64"

case "$SYS_ARCH" in
  x86_64|amd64)
    DETECTED_TYPE="x86_64"
    PREFERRED_TAR="robot-web-x86_64.tar"
    ;;
  aarch64|arm64|armv8*)
    DETECTED_TYPE="arm64"
    PREFERRED_TAR="robot-web-arm64.tar"
    ;;
  *)
    DETECTED_TYPE="x86_64"
    PREFERRED_TAR="robot-web-x86_64.tar"
    ;;
esac

echo -e "${CYAN}系统的 CPU 架构检测为: ${GREEN}${SYS_ARCH} (${DETECTED_TYPE})${NC}"

# 收集可用镜像列表
AVAILABLE_TARS=()
[ -f "robot-web-x86_64.tar" ] && AVAILABLE_TARS+=("robot-web-x86_64.tar")
[ -f "robot-web-arm64.tar" ] && AVAILABLE_TARS+=("robot-web-arm64.tar")
[ -f "robot-web-offline.tar" ] && AVAILABLE_TARS+=("robot-web-offline.tar")
[ -f "robot-web-image.tar" ] && AVAILABLE_TARS+=("robot-web-image.tar")

# 兼容子目录查找
[ -f "deploy/robot-web-x86_64.tar" ] && AVAILABLE_TARS+=("deploy/robot-web-x86_64.tar")
[ -f "deploy/robot-web-arm64.tar" ] && AVAILABLE_TARS+=("deploy/robot-web-arm64.tar")
[ -f "deploy/robot-web-offline.tar" ] && AVAILABLE_TARS+=("deploy/robot-web-offline.tar")

if [ ${#AVAILABLE_TARS[@]} -eq 0 ]; then
  echo -e "${RED}错误: 未检测到任何离线镜像文件 (.tar)！${NC}"
  echo "请确保已将离线镜像包（如 robot-web-x86_64.tar 或 robot-web-arm64.tar）放置在当前目录下。"
  exit 1
fi

# 匹配默认使用的镜像
CHOSEN_TAR=""
for tar_file in "${AVAILABLE_TARS[@]}"; do
  if [[ "$tar_file" == *"$PREFERRED_TAR"* ]]; then
    CHOSEN_TAR="$tar_file"
    break
  fi
done

# 如果没有精确匹配到架构专属文件，则默认选第一个文件
if [ -z "$CHOSEN_TAR" ]; then
  CHOSEN_TAR="${AVAILABLE_TARS[0]}"
fi

echo -e "\n${YELLOW}请选择要加载的离线镜像版本:${NC}"
INDEX=1
DEFAULT_INDEX=1
for tar_file in "${AVAILABLE_TARS[@]}"; do
  EXTRA_TIPS=""
  if [ "$tar_file" == "$CHOSEN_TAR" ]; then
    EXTRA_TIPS=" ${GREEN}(推荐: 匹配当前系统架构 ${SYS_ARCH})${NC}"
    DEFAULT_INDEX=$INDEX
  fi
  echo -e "  $INDEX) $tar_file $EXTRA_TIPS"
  INDEX=$((INDEX + 1))
done

read -p "请输入序号 [1-$((INDEX-1))] (回车默认: $DEFAULT_INDEX): " user_choice
user_choice=${user_choice:-$DEFAULT_INDEX}

# 获取用户选择的文件
OFFLINE_TAR="${AVAILABLE_TARS[$((user_choice-1))]}"

if [ -z "$OFFLINE_TAR" ]; then
  echo -e "${RED}选择无效，使用默认推荐镜像: $CHOSEN_TAR${NC}"
  OFFLINE_TAR="$CHOSEN_TAR"
fi

# 4. 载入离线镜像包
echo -e "\n${YELLOW}正在载入离线 Docker 镜像包 ($OFFLINE_TAR)...${NC}"
docker load -i "$OFFLINE_TAR"
if [ $? -ne 0 ]; then
  echo -e "${RED}错误: 离线镜像导入失败，请检查文件完整性或 Docker 服务运行状态！${NC}"
  exit 1
fi
echo -e "${GREEN}离线镜像载入成功！${NC}\n"

# 5. 读取默认值与环境变量配置
DEFAULT_HOST_PORT="5173"
DEFAULT_BACKEND_URL="http://host.docker.internal:18000"

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

# 8. 执行离线部署
echo -e "${YELLOW}4. 正在启动 Docker 容器 (使用离线镜像)...${NC}"

if [ -n "$COMPOSE_CMD" ]; then
  $COMPOSE_CMD down
  $COMPOSE_CMD up -d
else
  # Compose 未安装时，自动降级为标准 docker 命令运行
  docker rm -f robot-web >/dev/null 2>&1
  docker run -d \
    --name robot-web \
    --restart always \
    --network host \
    -e PORT="$HOST_PORT" \
    -e BACKEND_URL="$BACKEND_URL" \
    -e NODE_ENV=production \
    --log-opt max-size=10m \
    --log-opt max-file=3 \
    robot-web:latest
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
