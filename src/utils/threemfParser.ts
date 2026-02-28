/**
 * threemfParser.ts
 * 解析 3MF 文件并提取归一化网格数据
 *
 * 3MF 结构：ZIP 压缩包，内含 3D/3dmodel.model（XML），
 * XML 中 <mesh><vertices>…</vertices><triangles>…</triangles></mesh>
 */

import JSZip from 'jszip'

export interface Vec3 { x: number; y: number; z: number }

export interface MeshData {
  /** 归一化顶点（已居中并缩放到 ±1） */
  vertices: Vec3[]
  /** 三角面索引，每3个为一个面 [v0, v1, v2, ...] */
  indices: number[]
}

/**
 * 读取并解析 3MF 文件，返回首个 mesh 的归一化数据
 * @param url  公共路径，如 '/jiantou.3mf'
 */
export async function load3MF(url: string): Promise<MeshData | null> {
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const arrayBuffer = await resp.arrayBuffer()

    const zip = await JSZip.loadAsync(arrayBuffer)

    // 找到模型描述文件（通常在 3D/3dmodel.model）
    let modelXml: string | null = null
    for (const [path, file] of Object.entries(zip.files)) {
      if (path.toLowerCase().endsWith('.model') && !file.dir) {
        modelXml = await file.async('string')
        break
      }
    }
    if (!modelXml) return null

    const parser = new DOMParser()
    const doc = parser.parseFromString(modelXml, 'application/xml')

    // 取第一个 mesh 元素
    const meshEl = doc.querySelector('mesh')
    if (!meshEl) return null

    // 解析顶点
    const rawVerts: Vec3[] = []
    const vertexEls = meshEl.querySelectorAll('vertices > vertex')
    vertexEls.forEach(v => {
      rawVerts.push({
        x: parseFloat(v.getAttribute('x') ?? '0'),
        y: parseFloat(v.getAttribute('y') ?? '0'),
        z: parseFloat(v.getAttribute('z') ?? '0'),
      })
    })

    // 解析三角面索引
    const indices: number[] = []
    const triangleEls = meshEl.querySelectorAll('triangles > triangle')
    triangleEls.forEach(t => {
      indices.push(
        parseInt(t.getAttribute('v1') ?? '0'),
        parseInt(t.getAttribute('v2') ?? '0'),
        parseInt(t.getAttribute('v3') ?? '0'),
      )
    })

    if (!rawVerts.length || !indices.length) return null

    // ===== 归一化：居中并缩放到 ±1 =====
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    for (const v of rawVerts) {
      if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x
      if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y
      if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z
    }
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const cz = (minZ + maxZ) / 2
    const maxRange = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-6) / 2

    const vertices: Vec3[] = rawVerts.map(v => ({
      x: (v.x - cx) / maxRange,
      y: (v.y - cy) / maxRange,
      z: (v.z - cz) / maxRange,
    }))

    return { vertices, indices }
  } catch (e) {
    console.error('[3MF] 解析失败', e)
    return null
  }
}
