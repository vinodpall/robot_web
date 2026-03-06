import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import * as httpModule from 'node:http'

// 读取环境配置文件
function loadEnvConfig() {
  try {
    // ????????
    // 1) ???????????cwd=?????env.local ?? ./env.local
    // 2) ?? vite.config.ts ???????
    const configDir = fileURLToPath(new URL('.', import.meta.url))
    const candidates = [
      resolve(process.cwd(), 'env.local'),
      resolve(configDir, 'env.local')
    ]
    const existing = candidates.find(p => existsSync(p))
    if (!existing) {
      console.log('未找到 env.local 文件，使用默认环境变量 (intranet)')
      return {}
    }
    const envContent = readFileSync(existing, 'utf-8')
    const envVars: Record<string, string> = {}

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=')
        if (key && value) {
          envVars[key.trim()] = value.trim()
        }
      }
    })

    return envVars
  } catch (error) {
    console.log('未找到env.local文件，使用默认环境变量')
    return {}
  }
}

// 动态机器人代理中间件：拦截带 robot_ip 参数的请求，转发到对应机器人
// 同时挂载到 dev server 和 preview server，确保开发与生产行为一致
function dynamicRobotMiddleware(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
  next: () => void
) {
  if (!req.url) return next()

  const isDownload = req.url.startsWith('/download_file')
  const isUpload = req.url.startsWith('/upload_single_file')
  const isDxrApi = req.url.startsWith('/api/dxr_api/')
  const isNavList = req.url.startsWith('/navigation_list')
  const isNavDelete = req.url.startsWith('/navigation_delete')
  if (!isDownload && !isUpload && !isDxrApi && !isNavList && !isNavDelete) return next()

  const urlObj = new URL(req.url, 'http://localhost')
  const robotIp = urlObj.searchParams.get('robot_ip')
  if (!robotIp) return next()

  urlObj.searchParams.delete('robot_ip')
  const targetPath = urlObj.pathname + urlObj.search

  const isDxrApiReq = urlObj.pathname.startsWith('/api/dxr_api/')
  const targetPort = isDxrApiReq ? 81 : 5000

  const headers: Record<string, string | string[] | undefined> = { ...req.headers }
  headers['host'] = `${robotIp}:${targetPort}`

  const proxyReq = httpModule.request(
    { hostname: robotIp, port: targetPort, path: targetPath, method: req.method, headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode!, proxyRes.headers as any)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (err) => {
    console.error('[动态代理] 转发失败:', err.message, `-> ${robotIp}:${targetPort}${targetPath}`)
    if (!res.headersSent) {
      res.writeHead(502)
      res.end('Bad Gateway')
    }
  })

  proxyReq.setTimeout(30000, () => {
    console.error('[动态代理] 请求超时:', `${robotIp}:${targetPort}${targetPath}`)
    proxyReq.destroy()
    if (!res.headersSent) {
      res.writeHead(504)
      res.end('Gateway Timeout')
    }
  })

  // GET/HEAD 没有请求体，直接结束；其他方法将请求体流式转发
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === undefined) {
    proxyReq.end()
  } else {
    req.pipe(proxyReq)
    req.on('error', (err) => {
      console.error('[动态代理] 请求流错误:', err.message)
      proxyReq.destroy()
      if (!res.headersSent) {
        res.writeHead(500)
        res.end('Internal Server Error')
      }
    })
  }
}

// SRS WebRTC 信令代理中间件：处理 /rtc-proxy/{host}/rtc/v1/play/ -> http://{host}:1985/rtc/v1/play/
// 与 nginx location ~ ^/rtc-proxy/([^/]+)/rtc/v1/play/ 行为一致，解决本地开发 CORS 问题
function rtcProxyMiddleware(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
  next: () => void
) {
  if (!req.url) return next()

  const match = req.url.match(/^\/rtc-proxy\/([^/]+)(\/.*)$/)
  if (!match) return next()

  const targetHost = match[1]
  const targetPath = match[2]  // /rtc/v1/play/ ...

  const headers: Record<string, string | string[] | undefined> = { ...req.headers }
  headers['host'] = `${targetHost}:1985`

  const proxyReq = httpModule.request(
    { hostname: targetHost, port: 1985, path: targetPath, method: req.method, headers },
    (proxyRes) => {
      const responseHeaders: Record<string, string | string[]> = {
        ...(proxyRes.headers as Record<string, string | string[]>),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204, responseHeaders)
        res.end()
        return
      }
      res.writeHead(proxyRes.statusCode!, responseHeaders)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (err) => {
    console.error('[RTC代理] 转发失败:', err.message, `-> ${targetHost}:1985${targetPath}`)
    if (!res.headersSent) {
      res.writeHead(502)
      res.end('Bad Gateway')
    }
  })

  proxyReq.setTimeout(10000, () => {
    console.error('[RTC代理] 请求超时:', `${targetHost}:1985${targetPath}`)
    proxyReq.destroy()
    if (!res.headersSent) {
      res.writeHead(504)
      res.end('Gateway Timeout')
    }
  })

  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || req.method === undefined) {
    proxyReq.end()
  } else {
    req.pipe(proxyReq)
    req.on('error', (err) => {
      console.error('[RTC代理] 请求流错误:', err.message)
      proxyReq.destroy()
      if (!res.headersSent) {
        res.writeHead(500)
        res.end('Internal Server Error')
      }
    })
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const localEnv = loadEnvConfig()

  // 合并环境变量，本地配置优先
  const mergedEnv = { ...env, ...localEnv }

  // 根据环境变量动态配置代理
  const getProxyTarget = () => {
    const environment = mergedEnv.VITE_APP_ENVIRONMENT || 'intranet'
    console.log('🔧 Vite配置 - 当前环境:', environment)
    if (environment === 'internet') {
      console.log('🔧 Vite配置 - 使用外网代理:', 'http://39.185.83.71:8000')
      return 'http://39.185.83.71:8000'
    } else {
      console.log('🔧 Vite配置 - 使用内网代理:', 'http://172.16.88.152:8000')
      return 'http://172.16.88.152:8000'
    }
  }

  const getDxrApiTarget = () => {
    const environment = mergedEnv.VITE_APP_ENVIRONMENT || 'intranet'
    if (environment === 'internet') {
      return 'http://39.185.83.71:81'
    } else {
      return 'http://172.16.88.152:81'
    }
  }

  return {
    base: './',
    plugins: [
      vue(),
      // 动态机器人代理插件：拦截带 robot_ip 参数的请求，转发到对应机器人
      {
        name: 'dynamic-robot-proxy',
        configureServer(server) {
          server.middlewares.use(dynamicRobotMiddleware)
          server.middlewares.use(rtcProxyMiddleware)
        },
        configurePreviewServer(server) {
          server.middlewares.use(dynamicRobotMiddleware)
          server.middlewares.use(rtcProxyMiddleware)
        }
      }
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '127.0.0.1', // 绑定到127.0.0.1而不是localhost
      proxy: {
        '/v1': {
          target: getProxyTarget(),
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, _res) => {
              console.error('❌ 代理错误:', err.message)
              console.error('   请求URL:', req.url)
              console.error('   目标服务器:', options.target)
            })
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('📤 代理请求:', req.method, req.url, '→', options.target)
            })
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('📥 代理响应:', proxyRes.statusCode, req.url)
            })
          }
        },
        '/api/dxr_api': {
          target: getDxrApiTarget(),
          changeOrigin: true,
          secure: false,
        },
        '/navigation_list': {
          target: 'http://39.185.83.71:5000',
          changeOrigin: true,
          secure: false,
        },
        '/navigation_delete': {
          target: 'http://39.185.83.71:5000',
          changeOrigin: true,
          secure: false,
        },
        '/download_file': {
          target: 'http://39.185.83.71:5000',
          changeOrigin: true,
          secure: false,
        },
        '/upload_single_file': {
          target: 'http://39.185.83.71:5000',
          changeOrigin: true,
          secure: false,
        },
      }
    },
    // 定义环境变量
    define: {
      __APP_ENVIRONMENT__: JSON.stringify(mergedEnv.VITE_APP_ENVIRONMENT || 'intranet'),
      __AMAP_KEY__: JSON.stringify(mergedEnv.VITE_AMAP_KEY || ''),
      __AMAP_SECURITY__: JSON.stringify(mergedEnv.VITE_AMAP_SECURITY || '')
    }
  }
})
