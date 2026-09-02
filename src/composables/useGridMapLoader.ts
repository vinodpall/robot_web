import { ref } from 'vue'
import { getMapFile, saveMapFile } from '../utils/mapDB'
import { mapFileApi } from '../api/services'

export interface ParsedPGM {
  width: number
  height: number
  maxVal: number
  magic: string
  imageData: ImageData
  offscreenCanvas: HTMLCanvasElement
}

/**
 * 解析 PGM 二进制/ASCII 数据并转换为 ImageData 与 Offscreen Canvas
 */
export function parsePGM(buffer: ArrayBuffer, optimizeColors: boolean = true): ParsedPGM {
  const bytes = new Uint8Array(buffer)

  let ptr = 0
  let tokenCount = 0
  let inComment = false
  const headerTokens: string[] = []

  while (ptr < bytes.length && tokenCount < 4) {
    const char = String.fromCharCode(bytes[ptr])
    if (inComment) {
      if (char === '\n') inComment = false
      ptr++
      continue
    }
    if (char === '#') {
      inComment = true
      ptr++
      continue
    }
    if (/\s/.test(char)) {
      ptr++
      continue
    }
    const tokenStart = ptr
    while (ptr < bytes.length && !/\s/.test(String.fromCharCode(bytes[ptr]))) {
      ptr++
    }
    const token = String.fromCharCode(...bytes.subarray(tokenStart, ptr))
    headerTokens.push(token)
    tokenCount++
  }

  if (ptr < bytes.length && /\s/.test(String.fromCharCode(bytes[ptr]))) {
    ptr++
  }
  const dataStart = ptr

  const magic = headerTokens[0]
  const width = parseInt(headerTokens[1], 10)
  const height = parseInt(headerTokens[2], 10)
  const maxVal = parseInt(headerTokens[3], 10) || 255

  if (!width || !height) {
    throw new Error(`无效的 PGM 尺寸: ${width}x${height}`)
  }

  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const offscreenCtx = offscreen.getContext('2d')
  if (!offscreenCtx) {
    throw new Error('无法创建 2D Canvas 上下文')
  }

  const imageData = offscreenCtx.createImageData(width, height)

  if (magic === 'P5') {
    let p = dataStart
    for (let idx = 0; idx < width * height; idx++) {
      if (p >= bytes.length) break
      const v = bytes[p++]
      const off = idx * 4
      imageData.data[off] = v
      imageData.data[off + 1] = v
      imageData.data[off + 2] = v
      imageData.data[off + 3] = 255
    }
  } else if (magic === 'P2') {
    const textDecoder = new TextDecoder()
    const asciiData = textDecoder.decode(bytes.subarray(dataStart))
    const tokens = asciiData.trim().split(/\s+/)

    for (let idx = 0; idx < width * height; idx++) {
      if (idx >= tokens.length) break
      const v = parseInt(tokens[idx], 10)
      const c = Math.floor((v / maxVal) * 255)
      const off = idx * 4
      imageData.data[off] = c
      imageData.data[off + 1] = c
      imageData.data[off + 2] = c
      imageData.data[off + 3] = 255
    }
  } else {
    throw new Error(`不支持的 PGM 格式: ${magic}`)
  }

  if (optimizeColors) {
    for (let k = 0; k < imageData.data.length; k += 4) {
      const g = imageData.data[k]
      if (g === 205) {
        imageData.data[k] = 205
        imageData.data[k + 1] = 205
        imageData.data[k + 2] = 205
      } else if (g < 128) {
        imageData.data[k] = 0
        imageData.data[k + 1] = 0
        imageData.data[k + 2] = 0
      } else {
        imageData.data[k] = 255
        imageData.data[k + 1] = 255
        imageData.data[k + 2] = 255
      }
    }
  }

  offscreenCtx.putImageData(imageData, 0, 0)

  return {
    width,
    height,
    maxVal,
    magic,
    imageData,
    offscreenCanvas: offscreen
  }
}

/**
 * 将 ImageData 转换为 P5 二进制 PGM 数据
 */
export function convertImageDataToPGM(imageData: ImageData): Uint8Array {
  const width = imageData.width
  const height = imageData.height
  const header = `P5\n${width} ${height}\n255\n`
  const headerBytes = new TextEncoder().encode(header)

  const pixels = new Uint8Array(width * height)
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = imageData.data[i * 4]
  }

  const pgmData = new Uint8Array(headerBytes.length + pixels.length)
  pgmData.set(headerBytes, 0)
  pgmData.set(pixels, headerBytes.length)
  return pgmData
}

/**
 * 栅格地图加载与解析 Composable
 */
export function useGridMapLoader() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentMapData = ref<ParsedPGM | null>(null)

  const loadGridMap = async (
    robotId: string,
    mapName: string,
    options: { optimizeColors?: boolean; forceDownload?: boolean } = {}
  ): Promise<ParsedPGM | null> => {
    if (!mapName) return null

    loading.value = true
    error.value = null

    try {
      let pgmBlob: Blob | null = null

      if (!options.forceDownload) {
        pgmBlob = await getMapFile(mapName, 'gridMap.pgm')
      }

      if (!pgmBlob && robotId) {
        try {
          pgmBlob = await mapFileApi.downloadMapFile(robotId, mapName, 'gridMap.pgm', true)
          if (pgmBlob) {
            await saveMapFile(mapName, 'gridMap.pgm', pgmBlob)
          }
        } catch (downloadErr: any) {
          console.warn(`[GridMapLoader] 下载地图文件失败: ${mapName}`, downloadErr)
        }
      }

      if (!pgmBlob) {
        throw new Error(`未找到地图文件: ${mapName}/gridMap.pgm`)
      }

      const buffer = await pgmBlob.arrayBuffer()
      const parsed = parsePGM(buffer, options.optimizeColors !== false)
      currentMapData.value = parsed
      return parsed
    } catch (err: any) {
      const msg = err.message || '加载地图失败'
      error.value = msg
      console.error('[GridMapLoader]', err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    currentMapData,
    loadGridMap,
    parsePGM,
    convertImageDataToPGM
  }
}
