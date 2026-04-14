// API閰嶇疆鏂囦欢
import { config, getCurrentConfig } from '../config/environment'

// 鏍规嵁鐜鍔ㄦ€佽幏鍙朅PI閰嶇疆
const getApiConfig = () => {
    // 鍦ㄧ敓浜х幆澧冧腑浣跨敤鐩稿璺緞锛堝悓鍩熼儴缃诧級锛屽湪寮€鍙戠幆澧冧腑浣跨敤鐩稿璺緞锛堜緷璧朧ite浠ｇ悊锛?
    if (import.meta.env.PROD) {
        // 鐢熶骇鐜锛氬悓鍩熼儴缃诧紝浣跨敤鐩稿璺緞
        return {
            baseUrl: '/v1',
            domain: window.location.origin
        }
    } else {
        // 寮€鍙戠幆澧冿細鐩磋繛 8000锛屼笉缁忚繃 5173 /v1 浠ｇ悊
        const current = getCurrentConfig()
        const directBase = `${current.services.vision}/v1`
        return {
            baseUrl: directBase,
            domain: current.services.vision
        }
    }
}

const apiConfig = getApiConfig()
export const API_BASE_URL = apiConfig.baseUrl
export const API_DOMAIN = apiConfig.domain

// HTTP璇锋眰宸ュ叿绫?
export class ApiClient {
    private baseURL: string
    private defaultHeaders: Record<string, string>

    constructor(baseURL: string) {
        this.baseURL = baseURL
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        console.log('ApiClient 初始化完成:', baseURL)
    }

    // 璁剧疆璁よ瘉token
    setAuthToken(token: string) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`
        console.log('设置认证 token:', token ? '已设置' : '未设置')
    }

    // 娓呴櫎璁よ瘉token
    clearAuthToken() {
        delete this.defaultHeaders['Authorization']
    }

    // 閫氱敤璇锋眰鏂规硶
    private isAbortError(error: unknown): boolean {
        return error instanceof DOMException && error.name === 'AbortError'
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit & { responseType?: 'blob', baseURL?: string } = {}
    ): Promise<T> {
        const baseURL = options.baseURL !== undefined ? options.baseURL : this.baseURL
        const url = `${baseURL}${endpoint}`

        // 鍚堝苟璇锋眰澶达紝纭繚鑷畾涔夌殑Content-Type涓嶈瑕嗙洊
        const headers: Record<string, string> = { ...this.defaultHeaders }
        if (options.headers) {
            Object.assign(headers, options.headers)
        }

        // 璋冭瘯淇℃伅锛氭鏌uthorization澶达紙寮€鍙戞椂浣跨敤锛岀敓浜х幆澧冩敞閲婏級
        // console.log('API璇锋眰URL:', url)
        // console.log('瀹屾暣璇锋眰URL:', window.location.origin + url)
        // console.log('璇锋眰澶?', headers)
        // console.log('Authorization澶?', headers['Authorization'])

        const config: RequestInit = {
            headers,
            ...options,
        }

        try {
            const response = await fetch(url, config)
            let data: any = null;

            // 妫€鏌ユ槸鍚﹂渶瑕佽繑鍥瀊lob
            if (options?.responseType === 'blob') {
                data = await response.blob();
            } else {
                const contentType = response.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }
            }

            if (!response.ok) {
                // 鐩存帴鎶涘嚭data锛岃繖鏍穋atch鑳芥嬁鍒板悗绔殑detail瀛楁
                throw data;
            }
            return data;
        } catch (error) {
            if (
                !this.isAbortError(error) &&
                !(error instanceof TypeError && error.message.includes('Failed to fetch'))
            ) {
                console.error('API请求失败:', error)
            }
            throw error
        }
    }

    // GET璇锋眰
    async get<T>(endpoint: string, params?: Record<string, any>, options?: RequestInit & { responseType?: 'blob', baseURL?: string }): Promise<T> {
        let url = endpoint
        if (params) {
            const queryParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value))
                }
            })
            url = `${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        }
        return this.request<T>(url, { method: 'GET', ...options })
    }

    // POST璇锋眰
    async post<T>(endpoint: string, data?: any, options?: RequestInit & { responseType?: 'blob', baseURL?: string }): Promise<T> {
        let body: string | undefined

        // 濡傛灉data鏄瓧绗︿覆涓攐ptions涓寚瀹氫簡Content-Type涓篺orm-urlencoded锛岀洿鎺ヤ娇鐢?
        if (typeof data === 'string' && options?.headers &&
            'content-type' in options.headers &&
            options.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            body = data
        } else {
            // 鍚﹀垯鎸塉SON鏍煎紡澶勭悊
            body = data ? JSON.stringify(data) : undefined
        }

        return this.request<T>(endpoint, {
            method: 'POST',
            body,
            ...options
        })
    }

    // PUT璇锋眰
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    // PATCH璇锋眰
    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    // DELETE璇锋眰
    async delete<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            body: data ? JSON.stringify(data) : undefined
        })
    }

    // 鏋勫缓甯﹀弬鏁扮殑URL
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private buildUrlWithParams(endpoint: string, params: Record<string, any>): string {
        const url = new URL(endpoint, this.baseURL)
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value))
            }
        })
        return url.pathname + url.search
    }
}

// 鍒涘缓API瀹㈡埛绔疄渚?
export const apiClient = new ApiClient(API_BASE_URL)

// 璋冭瘯淇℃伅
console.log('API 客户端配置')
console.log('- 环境:', import.meta.env.PROD ? '生产环境' : '开发环境')
console.log('- API_BASE_URL:', API_BASE_URL)
console.log('- API_DOMAIN:', API_DOMAIN)
console.log('- 当前域名:', window.location.origin)

// 鍝嶅簲鏁版嵁绫诲瀷瀹氫箟
export interface ApiResponse<T = any> {
    code: number
    message: string
    data: T
}

export interface PaginatedResponse<T = any> {
    items: T[]
    total: number
    page: number
    pageSize: number
} 
