/**
 * 生产环境服务器
 * 功能：
 *   1. 静态文件服务（dist 目录）
 *   2. 动态机器人代理：拦截带 robot_ip 参数的请求，转发到对应机器人
 *   3. SRS WebRTC 信令代理
/**
 * 生产环境服务器
 * 功能：
 *   1. 静态文件服务（dist 目录）
 *   2. 动态机器人代理：拦截带 robot_ip 参数的请求，转发到对应机器人
 *   3. SRS WebRTC 信令代理
 *
 * 使用方法：
 *   node server.js [port]       默认端口 4173
 *   PORT=8080 node server.js
 */

import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, 'dist')
const PORT = parseInt(process.env.PORT || process.argv[2] || '4173', 10)

// MIME 类型
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.pgm':  'application/octet-stream',
  '.3mf':  'application/octet-stream',
}

// ---- 动态机器人代理中间件 ----
function dynamicRobotProxy(req, res, next) {
  if (!req.url) return next()

  const isDownload  = req.url.startsWith('/download_file')
  const isUpload    = req.url.startsWith('/upload_single_file')
  const isDxrApi    = req.url.startsWith('/api/dxr_api/')
  const isNavList   = req.url.startsWith('/navigation_list')
  const isNavDelete = req.url.startsWith('/navigation_delete')
  if (!isDownload && !isUpload && !isDxrApi && !isNavList && !isNavDelete) return next()

  const urlObj  = new URL(req.url, 'http://localhost')
  const robotIp = urlObj.searchParams.get('robot_ip')
  if (!robotIp) return next()

  urlObj.searchParams.delete('robot_ip')
  const targetPath = urlObj.pathname + urlObj.search
  const targetPort = urlObj.pathname.startsWith('/api/dxr_api/') ? 81 : 5000

  const headers = { ...req.headers, host: `${robotIp}:${targetPort}` }

  const proxyReq = http.request(
    { hostname: robotIp, port: targetPort, path: targetPath, method: req.method, headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (err) => {
    console.error('[动态代理] 转发失败:', err.message, `-> ${robotIp}:${targetPort}${targetPath}`)
    if (!res.headersSent) { res.writeHead(502); res.end('Bad Gateway') }
  })

  proxyReq.setTimeout(30000, () => {
    console.error('[动态代理] 请求超时:', `${robotIp}:${targetPort}${targetPath}`)
    proxyReq.destroy()
    if (!res.headersSent) { res.writeHead(504); res.end('Gateway Timeout') }
  })

  if (req.method === 'GET' || req.method === 'HEAD' || !req.method) {
    proxyReq.end()
  } else {
    req.pipe(proxyReq)
    req.on('error', (err) => {
      proxyReq.destroy()
      if (!res.headersSent) { res.writeHead(500); res.end('Internal Server Error') }
    })
  }
}

// ---- SRS WebRTC 信令代理中间件 ----
function rtcProxy(req, res, next) {
  if (!req.url) return next()
  const match = req.url.match(/^\/rtc-proxy\/([^/]+)(\/.*)$/)
  if (!match) return next()

  const targetHost = match[1]
  const targetPath = match[2]
  const headers = { ...req.headers, host: `${targetHost}:1985` }

  const proxyReq = http.request(
    { hostname: targetHost, port: 1985, path: targetPath, method: req.method, headers },
    (proxyRes) => {
      const respHeaders = {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
      if (req.method === 'OPTIONS') { res.writeHead(204, respHeaders); res.end(); return }
      res.writeHead(proxyRes.statusCode, respHeaders)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (err) => {
    console.error('[RTC代理] 转发失败:', err.message)
    if (!res.headersSent) { res.writeHead(502); res.end('Bad Gateway') }
  })

  proxyReq.setTimeout(10000, () => {
    proxyReq.destroy()
    if (!res.headersSent) { res.writeHead(504); res.end('Gateway Timeout') }
  })

  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || !req.method) {
    proxyReq.end()
  } else {
    req.pipe(proxyReq)
  }
}

// ---- 后端 API 代理中间件 ----
const BACKEND_URL = process.env.BACKEND_URL || ''

function backendApiProxy(req, res, next) {
  if (!BACKEND_URL) return next()
  if (!req.url) return next()

  // 仅代理 /v1 开头的 API 请求
  if (!req.url.startsWith('/v1/') && req.url !== '/v1') return next()

  try {
    const targetUrl = new URL(req.url, BACKEND_URL)
    const targetHost = targetUrl.hostname
    const isHttps = targetUrl.protocol === 'https:'
    const requester = isHttps ? https : http
    const targetPort = targetUrl.port || (isHttps ? '443' : '80')
    const targetPath = targetUrl.pathname + targetUrl.search

    console.log(`[后端代理] 转发请求: ${req.method} ${req.url} -> ${BACKEND_URL}${targetPath}`)

    const headers = { ...req.headers }
    headers.host = targetUrl.host // 覆盖 host 为目标 host

    const options = {
      hostname: targetHost,
      port: parseInt(targetPort, 10),
      path: targetPath,
      method: req.method,
      headers
    }

    const proxyReq = requester.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
      console.error('[后端代理] 转发失败:', err.message, `-> ${BACKEND_URL}${targetPath}`)
      if (!res.headersSent) {
        res.writeHead(502)
        res.end('Bad Gateway')
      }
    })

    proxyReq.setTimeout(60000, () => {
      console.error('[后端代理] 请求超时:', `${BACKEND_URL}${targetPath}`)
      proxyReq.destroy()
      if (!res.headersSent) {
        res.writeHead(504)
        res.end('Gateway Timeout')
      }
    })

    if (req.method === 'GET' || req.method === 'HEAD' || !req.method) {
      proxyReq.end()
    } else {
      req.pipe(proxyReq)
      req.on('error', (err) => {
        console.error('[后端代理] 请求流读取错误:', err.message)
        proxyReq.destroy()
        if (!res.headersSent) {
          res.writeHead(500)
          res.end('Internal Server Error')
        }
      })
    }
  } catch (err) {
    console.error('[后端代理] 解析 URL 失败:', err.message)
    next()
  }
}

// ---- 静态文件服务 ----
function staticServe(req, res) {
  // 仅取 pathname，忽略 query string
  let urlPath = new URL(req.url, 'http://localhost').pathname
  // 解码防止路径遍历
  try { urlPath = decodeURIComponent(urlPath) } catch { /* ignore */ }

  // 防路径遍历：不允许 ../
  if (urlPath.includes('..')) {
    res.writeHead(400); res.end('Bad Request'); return
  }

  let filePath = path.join(DIST_DIR, urlPath)

  const tryFile = (fp) => {
    fs.stat(fp, (err, stat) => {
      if (!err && stat.isFile()) {
        serveFile(fp, res)
      } else if (!err && stat.isDirectory()) {
        tryFile(path.join(fp, 'index.html'))
      } else {
        // SPA fallback：返回 index.html
        serveFile(path.join(DIST_DIR, 'index.html'), res)
      }
    })
  }

  tryFile(filePath)
}

function serveFile(fp, res) {
  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not Found'); return
    }
    const ext  = path.extname(fp).toLowerCase()
    const mime = MIME[ext] || 'application/octet-stream'
    const headers = { 'Content-Type': mime }
    const normalizedPath = fp.replace(/\\/g, '/')
    const isHtml = ext === '.html'
    const isHashedAsset = /\/assets\/.+-[A-Za-z0-9_-]{8,}\./.test(normalizedPath)

    if (isHtml) {
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
      headers['Pragma'] = 'no-cache'
      headers['Expires'] = '0'
    } else if (isHashedAsset) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    } else {
      headers['Cache-Control'] = 'public, max-age=3600'
    }

    res.writeHead(200, headers)
    res.end(data)
  })
}

// ---- 简易中间件链 ----
function runMiddleware(middlewares, req, res) {
  let i = 0
  const next = () => {
    const fn = middlewares[i++]
    if (fn) fn(req, res, next)
  }
  next()
}

// ---- 启动服务器 ----
const server = http.createServer((req, res) => {
  runMiddleware([
    backendApiProxy,
    dynamicRobotProxy,
    rtcProxy,
    staticServe,
  ], req, res)
})

// ---- WebSocket 升级代理 ----
server.on('upgrade', (req, socket, head) => {
  if (!BACKEND_URL || !req.url) {
    socket.destroy()
    return
  }

  // 仅代理 /v1 开头的 WebSocket 请求
  if (req.url.startsWith('/v1/') || req.url === '/v1') {
    try {
      const targetUrl = new URL(req.url, BACKEND_URL)
      const targetHost = targetUrl.hostname
      const isHttps = targetUrl.protocol === 'https:'
      const requester = isHttps ? https : http
      const targetPort = targetUrl.port || (isHttps ? 443 : 80)
      const targetPath = targetUrl.pathname + targetUrl.search

      console.log(`[WS代理] 转发 WebSocket 升级请求: ${req.url} -> ${targetHost}:${targetPort}${targetPath}`)

      const proxyReq = requester.request({
        hostname: targetHost,
        port: parseInt(targetPort, 10),
        path: targetPath,
        method: 'GET',
        headers: {
          ...req.headers,
          host: targetUrl.host
        }
      })

      proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
        let responseHeaders = `HTTP/1.1 101 Switching Protocols\r\n`
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (Array.isArray(value)) {
            for (const v of value) {
              responseHeaders += `${key}: ${v}\r\n`
            }
          } else if (value !== undefined) {
            responseHeaders += `${key}: ${value}\r\n`
          }
        }
        responseHeaders += `\r\n`

        socket.write(responseHeaders)
        if (proxyHead && proxyHead.length > 0) {
          socket.write(proxyHead)
        }

        proxySocket.pipe(socket)
        socket.pipe(proxySocket)

        proxySocket.on('error', (err) => {
          console.error('[WS代理] 后端 socket 错误:', err.message)
          socket.destroy()
        })
        socket.on('error', (err) => {
          console.error('[WS代理] 客户端 socket 错误:', err.message)
          proxySocket.destroy()
        })
      })

      proxyReq.on('error', (err) => {
        console.error('[WS代理] 连接后端 WebSocket 失败:', err.message)
        socket.destroy()
      })

      proxyReq.end()
    } catch (err) {
      console.error('[WS代理] 解析 WebSocket URL 失败:', err.message)
      socket.destroy()
    }
  } else {
    socket.destroy()
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 生产服务器已启动: http://0.0.0.0:${PORT}`)
  console.log(`   静态文件目录: ${DIST_DIR}`)
  console.log(`   动态机器人代理: 已启用 (robot_ip 参数路由)`)
  console.log(`   WebSocket 代理: 已启用 (/v1 -> ${BACKEND_URL})`)
})
