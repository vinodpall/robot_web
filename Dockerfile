# 使用国内高速镜像源（DaoCloud）的 Node 基础镜像，防止国内拉取超时
FROM docker.m.daocloud.io/library/node:20-alpine

WORKDIR /app

# 拷贝运行代理服务器所需的代码
COPY server.js ./

# 拷贝本地已编译好的前端静态制品文件（dist 目录）
COPY dist ./dist

# 暴露容器内端口
EXPOSE 4173

# 设置默认环境变量
ENV PORT=4173
ENV NODE_ENV=production
ENV BACKEND_URL=http://host.docker.internal:18000

# 启动 Node 生产服务器
CMD ["node", "server.js"]
