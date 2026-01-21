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

  return {
    base: './',
    plugins: [vue()],
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
            proxy.on('error', (err, req, res) => {
              console.error('❌ 代理错误:', err.message)
              console.error('   请求URL:', req.url)
              console.error('   目标服务器:', options.target)
            })
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('📤 代理请求:', req.method, req.url, '→', options.target)
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('📥 代理响应:', proxyRes.statusCode, req.url)
            })
          }
        },
        '/download_file': {
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
