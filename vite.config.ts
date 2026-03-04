import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

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
      console.log('🔧 Vite配置 - 使用外网代理:', 'http://10.10.1.3:8000')
      return 'http://10.10.1.3:8000'
    } else {
      console.log('🔧 Vite配置 - 使用内网代理:', 'http://172.16.88.152:8000')
      return 'http://172.16.88.152:8000'
    }
  }

  const getDxrApiTarget = () => {
    const environment = mergedEnv.VITE_APP_ENVIRONMENT || 'intranet'
    if (environment === 'internet') {
      return 'http://10.10.1.3:81'
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
          server.middlewares.use(async (req, res, next) => {
            if (!req.url) return next()

            const isDownload = req.url.startsWith('/download_file')
            const isUpload = req.url.startsWith('/upload_single_file')
            const isDxrApi = req.url.startsWith('/api/dxr_api/')
            if (!isDownload && !isUpload && !isDxrApi) return next()

            const urlObj = new URL(req.url, 'http://localhost')
            const robotIp = urlObj.searchParams.get('robot_ip')
            if (!robotIp) return next() // 没有 robot_ip 则走内置代理

            urlObj.searchParams.delete('robot_ip')
            const targetPath = urlObj.pathname + urlObj.search

            // 根据请求类型决定目标端口
            const isDxrApiReq = urlObj.pathname.startsWith('/api/dxr_api/')
            const targetPort = isDxrApiReq ? 81 : 5000

            const { request: httpRequest } = await import('http')

            const chunks: Buffer[] = []
            req.on('data', (chunk: Buffer) => chunks.push(chunk))
            req.on('end', () => {
              const body = Buffer.concat(chunks)
              const headers: Record<string, string | string[] | undefined> = { ...req.headers }
              headers['host'] = `${robotIp}:${targetPort}`
              if (body.length > 0) headers['content-length'] = String(body.length)

              const proxyReq = httpRequest(
                { hostname: robotIp, port: targetPort, path: targetPath, method: req.method, headers },
                (proxyRes) => {
                  res.writeHead(proxyRes.statusCode!, proxyRes.headers as any)
                  proxyRes.pipe(res)
                }
              )
              proxyReq.on('error', (err) => {
                console.error('[动态代理] 转发失败:', err.message)
                res.writeHead(502)
                res.end('Bad Gateway')
              })
              if (body.length > 0) proxyReq.write(body)
              proxyReq.end()
            })
          })
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
          target: 'http://10.10.1.3:5000',
          changeOrigin: true,
          secure: false,
        },
        '/navigation_delete': {
          target: 'http://10.10.1.3:5000',
          changeOrigin: true,
          secure: false,
        },
        '/download_file': {
          target: 'http://10.10.1.3:5000',
          changeOrigin: true,
          secure: false,
        },
        '/upload_single_file': {
          target: 'http://10.10.1.3:5000',
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
