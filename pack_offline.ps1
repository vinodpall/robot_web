# robot_web 多架构离线 Docker 镜像打包脚本 (Windows PowerShell)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== 正在构建 robot_web 多架构 Docker 离线镜像 ===" -ForegroundColor Green

# 检查 Docker 是否运行
$dockerCheck = docker version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 未检测到运行中的 Docker 服务！" -ForegroundColor Red
    Write-Host "请先启动 Docker Desktop 软件。" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Host "错误: 未在当前目录下检测到 dist 目录，请先运行前端编译命令 (例如 npm run build)！" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "deploy")) {
    New-Item -ItemType Directory -Path "deploy" | Out-Null
}

# 检查是否支持 docker buildx
$useBuildx = $false
docker buildx version 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    $useBuildx = $true
}

Write-Host "请选择打包的系统架构版本:" -ForegroundColor Yellow
Write-Host "1) 双架构打包 (同时生成 x86_64 和 ARM64 离线包) [默认推荐]"
Write-Host "2) 仅打包 x86_64 架构 (Intel / AMD / 常用PC服务器)"
Write-Host "3) 仅打包 ARM64 架构 (树莓派 / RK3588 / Jetson / 鲲鹏)"
$packChoice = Read-Host "请选择 [1-3] (回车默认: 1)"
if ([string]::IsNullOrWhiteSpace($packChoice)) { $packChoice = "1" }

function Build-X86 {
    Write-Host "`n正在构建 x86_64 (amd64) 架构镜像..." -ForegroundColor Yellow
    if ($useBuildx) {
        docker buildx build --platform linux/amd64 -t robot-web:latest --output type=docker,dest=deploy/robot-web-x86_64.tar .
    } else {
        docker build -t robot-web:latest .
        docker save -o deploy/robot-web-x86_64.tar robot-web:latest
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✔ x86_64 镜像导出成功 -> deploy/robot-web-x86_64.tar" -ForegroundColor Green
    }
}

function Build-Arm {
    Write-Host "`n正在构建 ARM64 (aarch64) 架构镜像..." -ForegroundColor Yellow
    if ($useBuildx) {
        docker buildx build --platform linux/arm64 -t robot-web:latest --output type=docker,dest=deploy/robot-web-arm64.tar .
    } else {
        Write-Host "注意: 当前未检测到 docker buildx，将使用本机环境构建。请确保本机为 ARM 架构！" -ForegroundColor Yellow
        docker build -t robot-web:latest .
        docker save -o deploy/robot-web-arm64.tar robot-web:latest
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✔ ARM64 镜像导出成功 -> deploy/robot-web-arm64.tar" -ForegroundColor Green
    }
}

switch ($packChoice) {
    "1" { Build-X86; Build-Arm }
    "2" { Build-X86 }
    "3" { Build-Arm }
    default { Write-Host "无效选择，取消打包。" -ForegroundColor Red; exit 1 }
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "🎉 离线包构建完成！" -ForegroundColor Green
Write-Host "镜像放置目录: deploy/" -ForegroundColor Yellow
Write-Host "部署提示: 将 deploy/ 目录打包发送到服务器，在目标服务器上直接执行 ./deploy_offline.sh 即可。" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
