/**
 * axios 请求封装 —— 全站唯一的网络出口，所有业务数据均来自 Java 后端。
 *
 * 1. baseURL 指向 Java 后端（见 .env 的 VITE_API_BASE_URL）；
 * 2. 请求拦截器自动把登录 token 以 `Authorization: Bearer xxx` 注入；
 * 3. 响应拦截器把后端统一响应 { code, message, data } 拆包，code !== 0 直接抛业务错误；
 * 4. 401 统一清理登录态并跳登录页，避免每个页面重复处理。
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'ant-design-vue'
import { clearSession, TOKEN_KEY } from '@/stores/auth'

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 15000,
})

/** 请求拦截：带上 token */
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

/** 响应拦截：拆包 R<T>，统一错误处理 */
instance.interceptors.response.use(
  (response) => {
    const body = response.data as { code?: number; message?: string; data?: unknown }
    if (body === null || typeof body !== 'object' || !('code' in body)) return response.data
    if (body.code === 0) return body.data as never
    message.error(body.message || '请求失败')
    return Promise.reject(new Error(body.message || '请求失败'))
  },
  (error) => {
    const status = error?.response?.status as number | undefined
    if (status === 401) {
      clearSession()
      message.error('登录已过期，请重新登录')
      const current = window.location.hash
      if (!current.includes('/login')) window.location.hash = '#/login'
    } else if (status === 403) {
      message.error('当前账号无权执行该操作')
    } else if (status && status >= 500) {
      message.error('服务器开小差了，请稍后再试')
    } else if (!error?.response) {
      message.error('无法连接后端服务，请先启动 Spring Boot 服务')
    }
    return Promise.reject(error)
  },
)

/**
 * 泛型请求方法：响应拦截器已把 R<T> 拆包成 T，
 * 但 axios 的类型系统仍声明返回 AxiosResponse，因此这里用 as unknown as Promise<T> 修正。
 */
export const http = {
  get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return instance.get(url, { params }) as unknown as Promise<T>
  },
  post<T>(url: string, data?: unknown): Promise<T> {
    return instance.post(url, data) as unknown as Promise<T>
  },
  put<T>(url: string, data?: unknown): Promise<T> {
    return instance.put(url, data) as unknown as Promise<T>
  },
  patch<T>(url: string, data?: unknown): Promise<T> {
    return instance.patch(url, data) as unknown as Promise<T>
  },
  delete<T>(url: string): Promise<T> {
    return instance.delete(url) as unknown as Promise<T>
  },
}

export default instance
