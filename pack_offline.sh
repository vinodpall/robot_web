#!/bin/bash

# ==========================================
# robot_web 多架构离线 Docker 镜像打包脚本 (Linux/Mac)
# ==========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}=== 正在构建 robot_web 多架构 Docker 离线镜像 ===${NC}\n"

if [ ! -d "dist" ]; then
  echo -e "${RED}错误: 未在当前目录下检测到 dist 目录，请先运行前端编译命令 (例如 npm run build)！${NC}"
  exit 1
fi

mkdir -p deploy

# 同步部署脚本与配置文件至 deploy 目录
[ -f "deploy_offline.sh" ] && cp -f deploy_offline.sh deploy/deploy_offline.sh
[ -f "deploy.sh" ] && cp -f deploy.sh deploy/deploy.sh
[ -f "docker-compose.yml" ] && cp -f docker-compose.yml deploy/docker-compose.yml
[ -f "Dockerfile" ] && cp -f Dockerfile deploy/Dockerfile
[ -f "server.js" ] && cp -f server.js deploy/server.js
[ -f "package.json" ] && cp -f package.json deploy/package.json

# 强制转换所有 shell 脚本为 Linux LF 格式并赋予执行权限，杜绝 bad interpreter 报错
for f in deploy/*.sh *.sh; do
  if [ -f "$f" ]; then
    sed -i 's/\r$//' "$f" 2>/dev/null || true
    chmod +x "$f" 2>/dev/null || true
  fi
done

# 将包含 blobs/ 的 OCI/新版 Docker 镜像包转换为兼容旧版 Docker 的平铺格式
convert_to_legacy_tar() {
  local tar_file="$1"
  [ ! -f "$tar_file" ] && return 0
  if ! tar -tf "$tar_file" 2>/dev/null | grep -q "^blobs/"; then
    return 0
  fi
  echo -e "${CYAN}正在转换 $tar_file 为兼容旧版 Docker 的镜像包格式...${NC}"
  local tmp_dir
  tmp_dir=$(mktemp -d)
  if tar -xf "$tar_file" -C "$tmp_dir"; then
    if [ ! -f "$tmp_dir/manifest.json" ] && [ -f "$tmp_dir/index.json" ] && command -v python3 >/dev/null 2>&1; then
      python3 - "$tmp_dir" << 'PYEOF'
import json, os, sys
d = sys.argv[1]
idx = json.load(open(os.path.join(d, 'index.json')))
m_digest = idx['manifests'][0]['digest'].replace('sha256:', '')
m_data = json.load(open(os.path.join(d, 'blobs', 'sha256', m_digest)))
cfg = m_data['config']['digest'].replace('sha256:', '')
layers = [l['digest'].replace('sha256:', '') for l in m_data['layers']]
json.dump([{'Config': cfg, 'RepoTags': ['robot-web:latest'], 'Layers': layers}], open(os.path.join(d, 'manifest.json'), 'w'))
PYEOF
    elif [ -f "$tmp_dir/manifest.json" ]; then
      sed -i 's|blobs/sha256/||g' "$tmp_dir/manifest.json"
    fi

    if [ -d "$tmp_dir/blobs/sha256" ]; then
      for bf in "$tmp_dir"/blobs/sha256/*; do
        [ -f "$bf" ] && mv "$bf" "$tmp_dir/$(basename "$bf")"
      done
    fi
    rm -rf "$tmp_dir/blobs" "$tmp_dir/index.json" "$tmp_dir/oci-layout"
    local abs_tar
    abs_tar=$(cd "$(dirname "$tar_file")" && pwd)/$(basename "$tar_file")
    (cd "$tmp_dir" && tar -cf "$abs_tar" manifest.json $(ls | grep -v '^manifest\.json$'))
  fi
  rm -rf "$tmp_dir"
}

# 检查是否支持 docker buildx
USE_BUILDX=false
if docker buildx version >/dev/null 2>&1; then
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
    docker buildx build --platform linux/amd64 -t robot-web:latest --output type=docker,oci-mediatypes=false,dest=deploy/robot-web-x86_64.tar .
  else
    docker build -t robot-web:latest .
    docker save -o deploy/robot-web-x86_64.tar robot-web:latest
  fi
  if [ $? -eq 0 ]; then
    convert_to_legacy_tar "deploy/robot-web-x86_64.tar"
    echo -e "${GREEN}✔ x86_64 镜像导出成功 -> deploy/robot-web-x86_64.tar${NC}"
  fi
}

build_arm() {
  echo -e "\n${YELLOW}正在构建 ARM64 (aarch64) 架构镜像...${NC}"
  if [ "$USE_BUILDX" = true ]; then
    docker buildx build --platform linux/arm64 -t robot-web:latest --output type=docker,oci-mediatypes=false,dest=deploy/robot-web-arm64.tar .
  else
    echo -e "${YELLOW}注意: 当前未检测到 docker buildx，将使用本机环境构建。请确保本机为 ARM 架构！${NC}"
    docker build -t robot-web:latest .
    docker save -o deploy/robot-web-arm64.tar robot-web:latest
  fi
  if [ $? -eq 0 ]; then
    convert_to_legacy_tar "deploy/robot-web-arm64.tar"
    echo -e "${GREEN}✔ ARM64 镜像导出成功 -> deploy/robot-web-arm64.tar${NC}"
  fi
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
