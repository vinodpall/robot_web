export const Environment = {
  INTRANET: 'intranet',
  INTERNET: 'internet'
} as const

export type Environment = typeof Environment[keyof typeof Environment]

export interface EnvironmentConfig {
  api: {
    baseUrl: string
    domain: string
  }
  websocket: {
    host: string
    port: number
    fullUrl: string
  }
  video: {
    webrtcDomain: string
    rtmpDomain: string
  }
  services: {
    vision: string
    livestream: string
    mapFile: string
  }
}

const intranetConfig: EnvironmentConfig = {
  api: {
    baseUrl: '/v1',
    domain: '/v1'
  },
  websocket: {
    host: '172.16.88.152',
    port: 8000,
    fullUrl: 'ws://172.16.88.152:8000'
  },
  video: {
    webrtcDomain: 'webrtc://172.16.88.152:8000',
    rtmpDomain: 'rtmp://172.16.88.152:8000'
  },
  services: {
    vision: 'http://172.16.88.152:8000',
    livestream: 'http://172.16.88.152:8000',
    mapFile: 'http://172.16.88.152:5000'
  }
}

const internetConfig: EnvironmentConfig = {
  api: {
    baseUrl: '/v1',
    domain: '/v1'
  },
  websocket: {
    host: '10.10.1.71',
    port: 8000,
    fullUrl: 'ws://10.10.1.71:8000'
  },
  video: {
    webrtcDomain: 'webrtc://10.10.1.71:8000',
    rtmpDomain: 'rtmp://10.10.1.71:8000'
  },
  services: {
    vision: 'http://10.10.1.71:8000',
    livestream: 'http://10.10.1.71:8000',
    mapFile: 'http://10.10.1.71:5000'
  }
}

export function getCurrentEnvironment(): Environment {
  // Prefer build-time define, then Vite env var, fallback to intranet
  let envFromDefine: string | undefined
  try {
    // Injected by vite define in vite.config.ts
    // @ts-ignore
    envFromDefine = typeof __APP_ENVIRONMENT__ !== 'undefined' ? __APP_ENVIRONMENT__ : undefined
  } catch (_err) {
    envFromDefine = undefined
  }

  const envFromVar = (import.meta.env && (import.meta.env as any).VITE_APP_ENVIRONMENT) as string | undefined
  const resolved = envFromDefine || envFromVar || Environment.INTRANET

  console.log('[Env] Detect environment')
  console.log('- __APP_ENVIRONMENT__:', envFromDefine)
  console.log('- VITE_APP_ENVIRONMENT:', envFromVar)
  console.log('- resolved:', resolved)

  if (resolved === Environment.INTERNET) return Environment.INTERNET
  return Environment.INTRANET
}

export function getCurrentConfig(): EnvironmentConfig {
  const currentEnv = getCurrentEnvironment()
  return currentEnv === Environment.INTRANET ? intranetConfig : internetConfig
}

export function setEnvironment(env: Environment): void {
  console.log(`[Env] Current environment: ${env}`)
  console.log('[Env] To switch environment, set VITE_APP_ENVIRONMENT in .env file')
}

export const config = getCurrentConfig()

export const currentEnvironment = getCurrentEnvironment()

export function refreshEnvironmentConfig(): EnvironmentConfig {
  console.log('[Env] Force refresh environment config...')
  console.log('- VITE_APP_ENVIRONMENT:', import.meta.env.VITE_APP_ENVIRONMENT)

  const newConfig = getCurrentConfig()

  console.log('[Env] Config after refresh:')
  console.log('- environment:', getCurrentEnvironment())
  console.log('- API domain:', newConfig.api.domain)
  console.log('- WebRTC domain:', newConfig.video.webrtcDomain)

  return newConfig
}

export function logEnvironmentConfig(): void {
  console.log('[Env] Current environment config:')
  console.log('- environment:', currentEnvironment)
  console.log('- API domain:', config.api.domain)
  console.log('- WebSocket URL:', config.websocket.fullUrl)
  console.log('- WebRTC domain:', config.video.webrtcDomain)
  console.log('- production:', import.meta.env.PROD ? 'yes' : 'no')
  console.log('- current origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A')
  try {
    // @ts-ignore
    console.log('- __APP_ENVIRONMENT__:', typeof __APP_ENVIRONMENT__ !== 'undefined' ? __APP_ENVIRONMENT__ : 'undefined')
  } catch (_) { }
  console.log('- VITE_APP_ENVIRONMENT:', import.meta.env.VITE_APP_ENVIRONMENT)
}

export {
  intranetConfig,
  internetConfig
}

