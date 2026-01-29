$filePath = "e:\Project\robot_web\src\views\NavigationManage.vue"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Replace the clearGridEdit function body
$oldCode = @"
// 清除编辑
const clearGridEdit = () => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !missionGridImageData) return
  
  // 构建PGM文件头
  const header = ``P5\n`${width} `${height}\n255\n``
  const headerBytes = new TextEncoder().encode(header)
  
  // 创建像素数据数组（灰度值）
  const pixels = new Uint8Array(width * height)
  
  // 从ImageData提取灰度值
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    // 使用R通道的值（因为是黑白图，RGB值相同）
    pixels[i] = imageData.data[idx]
  }
  
  // 合并头部和像素数据
  const pgmData = new Uint8Array(headerBytes.length + pixels.length)
  pgmData.set(headerBytes, 0)
  pgmData.set(pixels, headerBytes.length)
  
  return pgmData
}
"@

$newCode = @"
// 清除编辑
const clearGridEdit = () => {
  const canvas = gridMapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !missionGridImageData) return
  
  // 恢复原始地图数据
  ctx.putImageData(missionGridImageData, 0, 0)
  gridImageData = null
  editHistory.value = []
}
"@

$content = $content -replace [regex]::Escape($oldCode), $newCode
Set-Content $filePath $content -Encoding UTF8 -NoNewline

Write-Output "File updated successfully!"
