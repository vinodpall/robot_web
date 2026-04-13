// 鐜閰嶇疆鏂囦欢
// 鏀寔鍐呯綉/澶栫綉鐜鍒囨崲

// 鐜绫诲瀷甯搁噺
export const Environment = {
  INTRANET: 'intranet',  // 鍐呯綉鐜
  INTERNET: 'internet'   // 澶栫綉鐜
} as const

export type Environment = typeof Environment[keyof typeof Environment]

// 鐜閰嶇疆鎺ュ彛
export interface EnvironmentConfig {
  // API閰嶇疆
  api: {
    baseUrl: string
    domain: string
  }

  // WebSocket閰嶇疆
  websocket: {
    host: string
    port: number
    fullUrl: string
  }

  // 瑙嗛娴侀厤缃?
  video: {
    webrtcDomain: string
    rtmpDomain: string
  }

  // 鍏朵粬鏈嶅姟閰嶇疆
  services: {
    vision: string
    livestream: string
    mapFile: string  // 鍦板浘鏂囦欢鏈嶅姟鍦板潃
  }
}

// 鍐呯綉鐜閰嶇疆
const intranetConfig: EnvironmentConfig = {
  api: {
    baseUrl: '/v1',
    domain: '/v1' // 鍚屽煙閮ㄧ讲锛屼娇鐢ㄧ浉瀵硅矾寰?
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
    mapFile: 'http://172.16.88.152:5000'  // 鍦板浘鏂囦欢鏈嶅姟
  }
}

// 澶栫綉鐜閰嶇疆
const internetConfig: EnvironmentConfig = {
  api: {
    baseUrl: '/v1',
    domain: '/v1' // 鍚屽煙閮ㄧ讲锛屼娇鐢ㄧ浉瀵硅矾寰?
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
    mapFile: 'http://10.10.1.71:5000'  // 鍦板浘鏂囦欢鏈嶅姟
  }
}

// 鑾峰彇褰撳墠鐜绫诲瀷
export function getCurrentEnvironment(): Environment {
  // 浼樺厛浣跨敤鏋勫缓鏃舵敞鍏ョ殑甯搁噺锛屽叾娆′娇鐢?Vite 鐜鍙橀噺
  let envFromDefine: string | undefined
  try {
    // __APP_ENVIRONMENT__ 鐢?vite.config.ts 鐨?define 娉ㄥ叆
    // @ts-ignore
    envFromDefine = typeof __APP_ENVIRONMENT__ !== 'undefined' ? __APP_ENVIRONMENT__ : undefined
  } catch (_err) {
    envFromDefine = undefined
  }

  const envFromVar = (import.meta.env && (import.meta.env as any).VITE_APP_ENVIRONMENT) as string | undefined
  const resolved = envFromDefine || envFromVar || Environment.INTRANET

  console.log('馃敡 鐜妫€娴?')
  console.log('- __APP_ENVIRONMENT__:', envFromDefine)
  console.log('- VITE_APP_ENVIRONMENT:', envFromVar)
  console.log('- 鏈€缁堢幆澧?', resolved)

  if (resolved === Environment.INTERNET) return Environment.INTERNET
  return Environment.INTRANET
}

// 鑾峰彇褰撳墠鐜閰嶇疆
export function getCurrentConfig(): EnvironmentConfig {
  const currentEnv = getCurrentEnvironment()
  return currentEnv === Environment.INTRANET ? intranetConfig : internetConfig
}

// 璁剧疆鐜绫诲瀷锛堥€氳繃鐜鍙橀噺锛?
export function setEnvironment(env: Environment): void {
  console.log(`褰撳墠鐜: ${env}`)
  console.log('濡傞渶鍒囨崲鐜锛岃淇敼 .env 鏂囦欢涓殑 VITE_APP_ENVIRONMENT 鍙橀噺')
}

// 瀵煎嚭褰撳墠閰嶇疆鐨勪究鎹疯闂?
export const config = getCurrentConfig()

// 瀵煎嚭鐜绫诲瀷
export const currentEnvironment = getCurrentEnvironment()

// 寮哄埗鍒锋柊鐜閰嶇疆锛堢敤浜庣櫥褰曟椂纭繚閰嶇疆姝ｇ‘锛?
export function refreshEnvironmentConfig(): EnvironmentConfig {
  console.log('馃攧 寮哄埗鍒锋柊鐜閰嶇疆...')
  console.log('- 鐜鍙橀噺 VITE_APP_ENVIRONMENT:', import.meta.env.VITE_APP_ENVIRONMENT)

  // 閲嶆柊鑾峰彇閰嶇疆
  const newConfig = getCurrentConfig()

  console.log('馃攧 鍒锋柊鍚庣殑閰嶇疆:')
  console.log('- 鐜绫诲瀷:', getCurrentEnvironment())
  console.log('- API鍩熷悕:', newConfig.api.domain)
  console.log('- WebRTC鍩熷悕:', newConfig.video.webrtcDomain)

  return newConfig
}

// 璋冭瘯鍑芥暟
export function logEnvironmentConfig(): void {
  console.log('馃敡 褰撳墠鐜閰嶇疆:')
  console.log('- 鐜绫诲瀷:', currentEnvironment)
  console.log('- API鍩熷悕:', config.api.domain)
  console.log('- WebSocket鍦板潃:', config.websocket.fullUrl)
  console.log('- WebRTC鍩熷悕:', config.video.webrtcDomain)
  console.log('- 生产环境:', import.meta.env.PROD ? '是' : '否')
  console.log('- 褰撳墠鍩熷悕:', typeof window !== 'undefined' ? window.location.origin : 'N/A')
  try {
    // @ts-ignore
    console.log('- 鏋勫缓甯搁噺 __APP_ENVIRONMENT__:', typeof __APP_ENVIRONMENT__ !== 'undefined' ? __APP_ENVIRONMENT__ : 'undefined')
  } catch (_) { }
  console.log('- 鐜鍙橀噺 VITE_APP_ENVIRONMENT:', import.meta.env.VITE_APP_ENVIRONMENT)
}

// 瀵煎嚭鎵€鏈夐厤缃緵澶栭儴浣跨敤
export {
  intranetConfig,
  internetConfig
} 

