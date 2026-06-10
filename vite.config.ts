import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createRequire } from 'node:module'
import * as httpModule from 'node:http'

// 璇诲彇鐜閰嶇疆鏂囦欢
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
      // 灏濊瘯鍥為€€璇诲彇 env.config.js锛圕ommonJS 鏍煎紡锛?
      const configDir = fileURLToPath(new URL('.', import.meta.url))
      const envConfigJs = resolve(configDir, 'env.config.js')
      if (existsSync(envConfigJs)) {
        try {
          const _require = createRequire(import.meta.url)
          const jsConfig = _require(envConfigJs) as Record<string, string>
          console.log('Loaded env vars from env.config.js:', jsConfig.VITE_APP_ENVIRONMENT)
          return jsConfig
        } catch (e) {
          console.log('Failed to read env.config.js:', e)
        }
      }
      console.log('env.local not found, using default environment (intranet)')
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
    console.log('env.local not found, using default environment variables')
    return {}
  }
}

// 鍔ㄦ€佹満鍣ㄤ汉浠ｇ悊涓棿浠讹細鎷︽埅甯?robot_ip 鍙傛暟鐨勮姹傦紝杞彂鍒板搴旀満鍣ㄤ�?
// 鍚屾椂鎸傝浇�?dev server �?preview server锛岀‘淇濆紑鍙戜笌鐢熶骇琛屼负涓€鑷?
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
  const isRobot81 = req.url.startsWith('/robot81/')
  if (!isDownload && !isUpload && !isDxrApi && !isNavList && !isNavDelete && !isRobot81) return next()

  const urlObj = new URL(req.url, 'http://localhost')
  const robotIp = urlObj.searchParams.get('robot_ip')
  if (!robotIp) return next()

  urlObj.searchParams.delete('robot_ip')

  const isDxrApiReq = urlObj.pathname.startsWith('/api/dxr_api/')
  const isRobot81Req = urlObj.pathname.startsWith('/robot81/')
  const targetPort = (isDxrApiReq || isRobot81Req) ? 81 : 5000

  // /robot81/ 鏄満鍣ㄤ�?:81 闈欐€佹枃浠朵唬鐞嗭紝闇€鍓ユ帀璇ュ墠缂€鍚庤浆�?
  if (isRobot81Req) {
    urlObj.pathname = urlObj.pathname.replace(/^\/robot81/, '')
  }

  const headers: Record<string, string | string[] | undefined> = { ...req.headers }
  headers['host'] = `${robotIp}:${targetPort}`

  const finalPath = urlObj.pathname + urlObj.search

  const proxyReq = httpModule.request(
    { hostname: robotIp, port: targetPort, path: finalPath, method: req.method, headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode!, proxyRes.headers as any)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (err) => {
    console.error('[dynamic-proxy] forward failed:', err.message, `-> ${robotIp}:${targetPort}${finalPath}`)
    if (!res.headersSent) {
      res.writeHead(502)
      res.end('Bad Gateway')
    }
  })

  proxyReq.setTimeout(30000, () => {
    console.error('[dynamic-proxy] request timeout:', `${robotIp}:${targetPort}${finalPath}`)
    proxyReq.destroy()
    if (!res.headersSent) {
      res.writeHead(504)
      res.end('Gateway Timeout')
    }
  })

  // GET/HEAD 娌℃湁璇锋眰浣擄紝鐩存帴缁撴潫锛涘叾浠栨柟娉曞皢璇锋眰浣撴祦寮忚浆鍙?
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === undefined) {
    proxyReq.end()
  } else {
    req.pipe(proxyReq)
    req.on('error', (err) => {
      console.error('[dynamic-proxy] request stream error:', err.message)
      proxyReq.destroy()
      if (!res.headersSent) {
        res.writeHead(500)
        res.end('Internal Server Error')
      }
    })
  }
}

// SRS WebRTC 淇′护浠ｇ悊涓棿浠讹細澶勭悊 /rtc-proxy/{host}/rtc/v1/play/ -> http://{host}:1985/rtc/v1/play/
// �?nginx location ~ ^/rtc-proxy/([^/]+)/rtc/v1/play/ 琛屼负涓€鑷达紝瑙ｅ喅鏈湴寮€鍙?CORS 闂�?
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
    console.error('[rtc-proxy] forward failed:', err.message, `-> ${targetHost}:1985${targetPath}`)
    if (!res.headersSent) {
      res.writeHead(502)
      res.end('Bad Gateway')
    }
  })

  proxyReq.setTimeout(10000, () => {
    console.error('[rtc-proxy] request timeout:', `${targetHost}:1985${targetPath}`)
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
      console.error('[rtc-proxy] request stream error:', err.message)
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
  // 鍔犺浇鐜鍙橀�?
  const env = loadEnv(mode, process.cwd(), '')
  const localEnv = loadEnvConfig()

  // 鍚堝苟鐜鍙橀噺锛屾湰鍦伴厤缃紭�?
  const mergedEnv = { ...env, ...localEnv }

  // 鏍规嵁鐜鍙橀噺鍔ㄦ€侀厤缃唬�?
  const getProxyTarget = () => {
    const environment = mergedEnv.VITE_APP_ENVIRONMENT || 'intranet'
    console.log('Vite config - current environment:', environment)
    if (environment === 'internet') {
      console.log('Vite config - using internet proxy:', 'http://39.185.83.71:8000')
      return 'http://39.185.83.71:8000'
    } else {
      console.log('Vite config - using intranet proxy:', 'http://172.16.88.152:8000')
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
      // 鍔ㄦ€佹満鍣ㄤ汉浠ｇ悊鎻掍欢锛氭嫤鎴�?robot_ip 鍙傛暟鐨勮姹傦紝杞彂鍒板搴旀満鍣ㄤ�?
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
      host: '127.0.0.1', // 缁戝畾鍒?27.0.0.1鑰屼笉鏄痩ocalhost
      proxy: {
        '/v1': {
          target: getProxyTarget(),
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, _res) => {
              console.error('Proxy error:', err.message)
              console.error('   Request URL:', req.url)
              console.error('   Target server:', options.target)
            })
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('Proxy request:', req.method, req.url, '->', options.target)
            })
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Proxy response:', proxyRes.statusCode, req.url)
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
    // 瀹氫箟鐜鍙橀�?
    define: {
      __APP_ENVIRONMENT__: JSON.stringify(mergedEnv.VITE_APP_ENVIRONMENT || 'intranet'),
      __AMAP_KEY__: JSON.stringify(mergedEnv.VITE_AMAP_KEY || ''),
      __AMAP_SECURITY__: JSON.stringify(mergedEnv.VITE_AMAP_SECURITY || '')
    }
  }
})




