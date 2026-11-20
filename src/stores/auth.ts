/**
 * auth store —— 账户、登录 / 登出、记住密码与「动作级」权限。
 *
 * 与旧 session store 的区别：
 * - 菜单/路由不再按角色过滤（平台是单一控制台，菜单固定）；
 * - 权限下沉到具体操作：重置密码、新增租户、申请租户优惠价、审批、直接调价、管理账号。
 */
import { reactive } from 'vue'
import type { PlatformAction, PlatformRole, PlatformUser } from '@/types'

export const TOKEN_KEY = 'platform_token'
export const REMEMBER_KEY = 'platform_remember'

export const PLATFORM_ROLE_LABEL: Record<PlatformRole, string> = {
  super: '初始管理员',
  senior: '高级运维',
  basic: '基础销售/运维',
}

/** 角色可执行动作矩阵——权限判断的唯一事实源 */
const ACTION_MATRIX: Record<PlatformRole, PlatformAction[]> = {
  super: ['resetPassword', 'createTenant', 'requestPrice', 'approvePrice', 'editPrice', 'manageUsers'],
  senior: ['resetPassword', 'createTenant', 'requestPrice', 'approvePrice', 'editPrice'],
  basic: ['resetPassword', 'createTenant', 'requestPrice'],
}

export const ACTION_LABEL: Record<PlatformAction, string> = {
  resetPassword: '重置密码',
  createTenant: '新增租户',
  requestPrice: '申请租户优惠价',
  approvePrice: '审批租户改价申请',
  editPrice: '直接调整租户成交价',
  manageUsers: '新增 / 管理平台账号',
}

/** 权限说明（平台用户页展示用） */
export const ROLE_PERMISSION_ROWS = [
  { role: 'super' as const, actions: ['resetPassword', 'createTenant', 'requestPrice', 'approvePrice', 'editPrice', 'manageUsers'] },
  { role: 'senior' as const, actions: ['resetPassword', 'createTenant', 'requestPrice', 'approvePrice', 'editPrice'] },
  { role: 'basic' as const, actions: ['resetPassword', 'createTenant', 'requestPrice'] },
]

export interface AuthState {
  authed: boolean
  account: string
  name: string
  role: PlatformRole
}

interface TokenPayload {
  account: string
  name: string
  role: PlatformRole
}

/** 会话信息单独存一份（token 本身是纯 JWT 字符串，不含用户信息） */
const USER_KEY = 'platform_user'

function readToken(): TokenPayload | null {
  try {
    // 兼容旧版：token 位置曾是 JSON 字符串
    const raw = localStorage.getItem(USER_KEY) ?? localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TokenPayload>
    if (parsed.account && parsed.name && parsed.role) {
      return { account: parsed.account, name: parsed.name, role: parsed.role }
    }
  } catch {
    // 兼容 / 隐私模式下不可用
  }
  return null
}

const restored = readToken()
const state = reactive<AuthState>({
  authed: restored !== null,
  account: restored?.account ?? '',
  name: restored?.name ?? '',
  role: restored?.role ?? 'basic',
})

export function useAuth(): AuthState {
  return state
}

export function can(action: PlatformAction): boolean {
  if (!state.authed) return false
  return ACTION_MATRIX[state.role]?.includes(action) ?? false
}

/** 登录：写入后端返回的真实 JWT 与账号信息 */
export function login(user: PlatformUser | TokenPayload, token = ''): void {
  state.authed = true
  state.account = user.account
  state.name = user.name
  state.role = user.role
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({
      account: user.account,
      name: user.name,
      role: user.role,
    } satisfies TokenPayload))
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 隐私模式下不因持久化失败而阻断
  }
}

/** 清空登录态（供响应拦截器 401 时调用），保留「记住密码」偏好 */
export function clearSession(): void {
  state.authed = false
  state.account = ''
  state.name = ''
  state.role = 'basic'
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // 忽略
  }
}

/** 退出登录：清会话并通知后端（通知失败也不影响本地退出） */
export function logout(): void {
  clearSession()
}

export function saveRemember(account: string, password: string): void {
  try {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({ account, password }))
  } catch {
    // 忽略
  }
}

export function loadRemember(): { account: string; password: string } | null {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { account?: string; password?: string }
    return { account: parsed.account ?? '', password: parsed.password ?? '' }
  } catch {
    return null
  }
}

export function clearRemember(): void {
  try {
    localStorage.removeItem(REMEMBER_KEY)
  } catch {
    // 忽略
  }
}
