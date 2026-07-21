# robot_web 一键构建与导出离线 Docker 镜像脚本 (Windows PowerShell)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== 正在构建 robot_web Docker 离线镜像 ===" -ForegroundColor Green

# 检查 Docker 是否运行
$dockerCheck = docker version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 未检测到运行中的 Docker 服务！" -ForegroundColor Red
    Write-Host "请先启动 Docker Desktop 软件，或直接在 Linux 服务器上执行 ./pack_offline.sh 进行打包。" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Host "错误: 未在当前目录下检测到 dist 目录，请先运行前端编译命令 (例如 npm run build)！" -ForegroundColor Red
    exit 1
}

Write-Host "1. 正在构建 Docker 镜像 (robot-web:latest)..." -ForegroundColor Yellow
docker build -t robot-web:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker 镜像构建失败，请确保 Docker Desktop 已正常启动！" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "deploy")) {
    New-Item -ItemType Directory -Path "deploy" | Out-Null
}

Write-Host "2. 正在导出离线镜像包至 deploy/robot-web-offline.tar ..." -ForegroundColor Yellow
docker save -o deploy/robot-web-offline.tar robot-web:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "🎉 离线镜像导出成功！" -ForegroundColor Green
    Write-Host "文件位置: deploy/robot-web-offline.tar" -ForegroundColor Yellow
    Write-Host "部署提示: 将 deploy/ 目录打包发送到服务器，在目标服务器上直接执行 ./deploy_offline.sh 即可。" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
} else {
    Write-Host "错误: 镜像导出失败！" -ForegroundColor Red
}
