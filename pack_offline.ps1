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

# 同步部署脚本与配置文件至 deploy 目录，并确保 .sh 脚本为 LF 换行符
$syncFiles = @("deploy_offline.sh", "deploy.sh", "docker-compose.yml", "Dockerfile", "server.js", "package.json")
foreach ($f in $syncFiles) {
    if (Test-Path $f) {
        if ($f.EndsWith(".sh")) {
            $raw = [System.IO.File]::ReadAllText((Resolve-Path $f)).Replace("`r`n", "`n")
            [System.IO.File]::WriteAllText((Join-Path (Resolve-Path "deploy") $f), $raw, (New-Object System.Text.UTF8Encoding($false)))
        } else {
            Copy-Item -Path $f -Destination (Join-Path "deploy" $f) -Force
        }
    }
}

# 将 Docker 25+/Buildx 导出的 OCI blobs 目录结构转换为全版本兼容的平铺结构（避免旧版 Docker 报 blobs/json: no such file or directory）
function Convert-ToLegacyDockerTar {
    param([string]$TarPath)
    if (-not (Test-Path $TarPath)) { return }
    $tarList = tar -tf $TarPath 2>&1
    if ($LASTEXITCODE -ne 0 -or -not ($tarList -match "^blobs/")) { return }

    Write-Host "正在转换 $TarPath 为兼容旧版 Docker 的镜像包格式..." -ForegroundColor Cyan
    $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("docker_tar_" + [System.Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $tmpDir | Out-Null
    try {
        tar -xf $TarPath -C $tmpDir
        $manifestFile = Join-Path $tmpDir "manifest.json"
        $indexFile = Join-Path $tmpDir "index.json"
        if (-not (Test-Path $manifestFile) -and (Test-Path $indexFile)) {
            $idx = Get-Content $indexFile -Raw | ConvertFrom-Json
            $mDigest = $idx.manifests[0].digest.Replace("sha256:", "")
            $mData = Get-Content (Join-Path $tmpDir "blobs\sha256\$mDigest") -Raw | ConvertFrom-Json
            $cfg = $mData.config.digest.Replace("sha256:", "")
            $layers = @($mData.layers | ForEach-Object { $_.digest.Replace("sha256:", "") })
            $manifestObj = @(@{ Config = $cfg; RepoTags = @("robot-web:latest"); Layers = $layers })
            $manifestJson = ConvertTo-Json $manifestObj -Depth 5 -Compress
            [System.IO.File]::WriteAllText($manifestFile, $manifestJson, (New-Object System.Text.UTF8Encoding($false)))
        } elseif (Test-Path $manifestFile) {
            $rawManifest = [System.IO.File]::ReadAllText($manifestFile).Replace("blobs/sha256/", "")
            [System.IO.File]::WriteAllText($manifestFile, $rawManifest, (New-Object System.Text.UTF8Encoding($false)))
        }

        $blobsShaDir = Join-Path $tmpDir "blobs\sha256"
        if (Test-Path $blobsShaDir) {
            Get-ChildItem -Path $blobsShaDir -File | ForEach-Object {
                Move-Item -Path $_.FullName -Destination (Join-Path $tmpDir $_.Name) -Force
            }
        }
        Remove-Item -Path (Join-Path $tmpDir "blobs") -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $indexFile -Force -ErrorAction SilentlyContinue
        Remove-Item -Path (Join-Path $tmpDir "oci-layout") -Force -ErrorAction SilentlyContinue

        $absTar = (Resolve-Path $TarPath).Path
        $otherFiles = @(Get-ChildItem -Path $tmpDir -File | Where-Object { $_.Name -ne "manifest.json" } | ForEach-Object { $_.Name })
        Push-Location $tmpDir
        tar -cf $absTar manifest.json @otherFiles
        Pop-Location
    } finally {
        if (Test-Path $tmpDir) {
            Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
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
        docker buildx build --platform linux/amd64 -t robot-web:latest --output type=docker,oci-mediatypes=false,dest=deploy/robot-web-x86_64.tar .
    } else {
        docker build -t robot-web:latest .
        docker save -o deploy/robot-web-x86_64.tar robot-web:latest
    }
    if ($LASTEXITCODE -eq 0) {
        Convert-ToLegacyDockerTar -TarPath "deploy/robot-web-x86_64.tar"
        Write-Host "✔ x86_64 镜像导出成功 -> deploy/robot-web-x86_64.tar" -ForegroundColor Green
    }
}

function Build-Arm {
    Write-Host "`n正在构建 ARM64 (aarch64) 架构镜像..." -ForegroundColor Yellow
    if ($useBuildx) {
        docker buildx build --platform linux/arm64 -t robot-web:latest --output type=docker,oci-mediatypes=false,dest=deploy/robot-web-arm64.tar .
    } else {
        Write-Host "注意: 当前未检测到 docker buildx，将使用本机环境构建。请确保本机为 ARM 架构！" -ForegroundColor Yellow
        docker build -t robot-web:latest .
        docker save -o deploy/robot-web-arm64.tar robot-web:latest
    }
    if ($LASTEXITCODE -eq 0) {
        Convert-ToLegacyDockerTar -TarPath "deploy/robot-web-arm64.tar"
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
