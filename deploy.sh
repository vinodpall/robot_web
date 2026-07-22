#!/bin/bash

# ==========================================
# robot_web 一键 Docker 部署脚本
# ==========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}=== 启动 robot_web Docker 部署流程 ===${NC}\n"

# 检查 Docker 是否安装
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}错误: 未检测到 Docker，请先安装 Docker。${NC}" >&2
  exit 1
fi

# 检查 Docker Compose 工具
COMPOSE_CMD=""
if [ -x "$(command -v docker-compose)" ]; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo -e "${YELLOW}提示: 未检测到 docker-compose，将自动使用标准 Docker 引擎完成构建部署。${NC}"
fi

# 定义默认值
DEFAULT_HOST_PORT="5173"
DEFAULT_BACKEND_URL="http://127.0.0.1:8000"

# 检查 dist 文件夹是否存在
if [ ! -d "dist" ]; then
  echo -e "${RED}错误: 未在当前目录下检测到编译好的 dist/ 文件夹！${NC}"
  echo "请确保您已在本地运行 npm run build 进行了编译，"
  echo "并在打包时包含了生成的 dist 目录。"
  exit 1
fi

# 读取已有配置
if [ -f .env ]; then
  echo -e "${YELLOW}检测到已存在 .env 配置文件，将读取默认值:${NC}"
  eval "$(cat .env | grep -v '^#')"
  DEFAULT_HOST_PORT=${HOST_PORT:-$DEFAULT_HOST_PORT}
  DEFAULT_BACKEND_URL=${BACKEND_URL:-$DEFAULT_BACKEND_URL}
  echo "- 宿主机端口 (HOST_PORT): $DEFAULT_HOST_PORT"
  echo "- 后端 API 地址 (BACKEND_URL): $DEFAULT_BACKEND_URL"
  echo ""
fi

# 1. 引导输入后端 API 地址
echo -e "${YELLOW}1. 请输入 FastAPI 后端 API 地址 (同机部署保持默认即可):${NC}"
read -p "后端 API 地址 (回车默认: $DEFAULT_BACKEND_URL): " input_backend_url
BACKEND_URL=${input_backend_url:-$DEFAULT_BACKEND_URL}
echo -e "已设定后端 API 地址: ${GREEN}$BACKEND_URL${NC}\n"

# 2. 引导输入宿主机端口
echo -e "${YELLOW}2. 请输入 Web 平台对外暴露的端口:${NC}"
read -p "对外端口 (回车默认: $DEFAULT_HOST_PORT): " input_host_port
HOST_PORT=${input_host_port:-$DEFAULT_HOST_PORT}
echo -e "已设定对外端口: ${GREEN}$HOST_PORT${NC}\n"

# 3. 生成或修改 .env 文件
echo -e "${YELLOW}3. 正在生成配置文件 .env ...${NC}"
cat << EOF > .env
# robot_web 部署环境变量配置
HOST_PORT=$HOST_PORT
BACKEND_URL=$BACKEND_URL
EOF
echo -e "${GREEN}配置文件 .env 生成成功!${NC}\n"

# 4. 执行部署
echo -e "${YELLOW}4. 正在启动 Docker 容器...${NC}"
if [ -n "$COMPOSE_CMD" ]; then
  $COMPOSE_CMD down
  $COMPOSE_CMD up -d --build
else
  docker build -t robot-web:latest . && \
  docker rm -f robot-web >/dev/null 2>&1 && \
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
  echo -e "${GREEN}🎉 robot_web 部署成功！${NC}"
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
