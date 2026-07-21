// API配置文件
import { config, getCurrentConfig } from '../config/environment'

// 根据环境动态获取API配置
const getApiConfig = () => {
    // 在生产环境中统一使用相对路径（同域部署），在开发环境中直连代理
    if (import.meta.env.PROD) {
        // 生产环境：同域部署，使用相对路径
        return {
            baseUrl: '/v1',
            domain: window.location.origin
        }
    } else {
        // 开发环境：直连 8000，不经过 5173 /v1 代理
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

// HTTP请求工具类
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

    // 设置认证token
    setAuthToken(token: string) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`
        console.log('设置认证 token:', token ? '已设置' : '未设置')
    }

    // 清除认证token
    clearAuthToken() {
        delete this.defaultHeaders['Authorization']
    }

    // 通用请求方法
    private isAbortError(error: unknown): boolean {
        return error instanceof DOMException && error.name === 'AbortError'
    }

    private getHeaderValue(headers: HeadersInit | undefined, key: string): string | undefined {
        if (!headers) return undefined
        try {
            const value = new Headers(headers).get(key)
            return value ?? undefined
        } catch {
            return undefined
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit & { responseType?: 'blob', baseURL?: string } = {}
    ): Promise<T> {
        const baseURL = options.baseURL !== undefined ? options.baseURL : this.baseURL
        const url = `${baseURL}${endpoint}`

        // 合并请求头，确保自定义的Content-Type不被覆盖
        const headers = new Headers(this.defaultHeaders)
        if (options.headers) {
            const extraHeaders = new Headers(options.headers)
            extraHeaders.forEach((value, key) => {
                headers.set(key, value)
            })
        }

        const config: RequestInit = {
            ...options,
            headers,
        }

        try {
            const response = await fetch(url, config)
            let data: any = null;

            // 检查是否需要返回blob
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
                // 直接抛出data，这样catch能拿到后端的detail字段
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

    // GET请求
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

    // POST请求
    async post<T>(endpoint: string, data?: any, options?: RequestInit & { responseType?: 'blob', baseURL?: string }): Promise<T> {
        let body: BodyInit | undefined

        // 如果data是字符串且options中指定了Content-Type为form-urlencoded，直接使用
        const contentType = this.getHeaderValue(options?.headers, 'content-type') || ''
        if (typeof data === 'string' && contentType.includes('application/x-www-form-urlencoded')) {
            body = data
        } else {
            // 否则按JSON格式处理
            body = data ? JSON.stringify(data) : undefined
        }

        return this.request<T>(endpoint, {
            method: 'POST',
            body,
            ...options
        })
    }

    // PUT请求
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    // PATCH请求
    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    // DELETE请求
    async delete<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            body: data ? JSON.stringify(data) : undefined
        })
    }
}

// 创建API客户端实例
export const apiClient = new ApiClient(API_BASE_URL)

// 响应数据类型定义
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
