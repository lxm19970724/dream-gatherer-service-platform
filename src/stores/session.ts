/**
 * 会话与权限（规范源 · 三端同步；APP_MODE 由各端启动时设定）。
 * ACCESS 表是权限的唯一事实源：路由守卫、侧栏菜单、lockView、写操作共用 can()。
 */
import { reactive } from 'vue'
import type { AppMode, AppSession, MenuGroup, PageId, Role } from '@/types'
import { ACCOUNT_ROLE_MAP } from '@/mock/tenants'
import { TENANT_PLATFORM_ACCOUNT } from '@/mock/utils'

/** 当前端：租户端为 dev，家族端 / 小程序端为 family（复制时改此常量） */
const APP_MODE: AppMode = 'dev'

export const TOKEN_KEY = 'token'
export const REMEMBER_KEY = 'family_remember'

/** 角色—页面权限矩阵（PRD 3.4） */
export const ACCESS: Record<Role, PageId[]> = {
  dev: ['dev-overview', 'dev-tenants', 'dev-new', 'dev-billing', 'dev-accounts', 'dev-log', 'dev-settings'],
  admin: ['admin-home', 'members', 'changes', 'accounts', 'subscription', 'admin-settings', 'audit', 'mobile'],
  leader: ['dashboard', 'members', 'changes', 'abyss', 'records', 'points', 'rules', 'rewards', 'redemptions', 'content', 'accounts', 'subscription', 'settings', 'audit', 'mobile'],
  vice: ['dashboard', 'members', 'changes', 'abyss', 'records', 'points', 'rules', 'rewards', 'redemptions', 'content', 'accounts', 'subscription', 'settings', 'audit', 'mobile'],
  elder: ['dashboard', 'members', 'changes', 'abyss', 'records', 'points', 'rules', 'rewards', 'redemptions', 'content', 'accounts', 'mobile'],
  member: ['my-overview', 'my-map', 'my-records', 'my-points', 'my-shop', 'my-requests', 'my-notices', 'my-moments', 'my-profile', 'mobile'],
}

export const ALL_ROLES: Role[] = ['dev', 'admin', 'leader', 'vice', 'elder', 'member']
export const FAMILY_ROLES: Role[] = ['admin', 'leader', 'vice', 'elder', 'member']
export const ROLE_LABEL: Record<Role, string> = {
  dev: '平台管理员',
  admin: '租户管理员',
  leader: '族长',
  vice: '副族长',
  elder: '长老',
  member: '成员',
}

/** 统一权限判断 */
export function can(pageId: PageId, session: AppSession = useSession()): boolean {
  if (!session.authed) return false
  return ACCESS[session.role]?.includes(pageId) ?? false
}

/** 任命权限：只允许任命比自己低一级及以下的角色 */
export function appointableRoles(role: Role): Role[] {
  if (role === 'admin') return ['leader', 'vice', 'elder', 'member']
  if (role === 'leader') return ['vice', 'elder', 'member']
  if (role === 'vice') return ['elder', 'member']
  return []
}

/** 登录账号 → 角色：租户端固定 dev；家族端按真实 UID 种子映射 */
export function resolveRole(account: string): Role {
  if (APP_MODE === 'dev') return 'dev'
  if (account === TENANT_PLATFORM_ACCOUNT) return 'admin'
  return ACCOUNT_ROLE_MAP[account] ?? 'member'
}

/** 角色 → 登录后落地页 */
export function homePathOf(role: Role): string {
  if (APP_MODE === 'dev') return '/dev-overview'
  if (role === 'admin') return '/admin-home'
  if (role === 'leader' || role === 'vice' || role === 'elder') return '/dashboard'
  if (role === 'member') return '/my-overview'
  return '/login'
}

/** token 中仅保存账号与角色，刷新时据此恢复会话，不存业务数据 */
interface TokenPayload { account: string; role: Role }

export function writeToken(account: string, role: Role): void {
  const payload: TokenPayload = { account, role }
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(payload))
  } catch {
    // 隐私模式下 localStorage 不可用时，仍允许本次会话内演示
  }
}

function readToken(): TokenPayload | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Partial<TokenPayload>
      if (parsed.account && parsed.role) return { account: parsed.account, role: parsed.role }
    } catch {
      // 兼容租户端旧版纯字符串 token
    }
    return { account: '', role: APP_MODE === 'dev' ? 'dev' : 'member' }
  } catch {
    return null
  }
}

/** 记住密码（唯一允许持久化的另一项数据） */
export function saveRemember(account: string, password: string): void {
  try {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({ account, password }))
  } catch {
    // 忽略持久化失败
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
    // 忽略持久化失败
  }
}

const restored = readToken()
const session = reactive<AppSession>({
  authed: restored !== null,
  role: restored?.role ?? (APP_MODE === 'dev' ? 'dev' : 'member'),
  tenantId: 'T001',
  account: restored?.account ?? '',
})

/** 模块级 reactive 单例 */
export function useSession(): AppSession {
  return session
}

/** 登录：账号 + 可选角色解析；返回最终角色 */
export function login(account: string, role?: Role): Role {
  const finalRole = role ?? resolveRole(account)
  session.authed = true
  session.account = account
  session.role = finalRole
  writeToken(account, finalRole)
  return finalRole
}

/** 演示专用角色切换（不改动登录账号） */
export function switchRole(role: Role): void {
  session.role = role
  if (session.authed) writeToken(session.account, role)
}

/** 退出登录：清除 token，但保留「记住密码」偏好 */
export function logout(): void {
  session.authed = false
  session.account = ''
  session.role = APP_MODE === 'dev' ? 'dev' : 'member'
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 忽略持久化失败
  }
}

/** 顶层菜单（T02/T03 布局按 can() 过滤后渲染） */
export function getMenu(role: Role): MenuGroup[] {
  const groups: MenuGroup[] = [
    {
      label: '平台运营',
      items: [
        { id: 'dev-overview', name: '运营总览', icon: 'dashboard' },
        { id: 'dev-tenants', name: '租户列表', icon: 'team' },
        { id: 'dev-new', name: '新建租户', icon: 'plus' },
        { id: 'dev-billing', name: '套餐与续费', icon: 'wallet' },
        { id: 'dev-accounts', name: '账号分发', icon: 'user' },
        { id: 'dev-log', name: '登录审计', icon: 'file' },
        { id: 'dev-settings', name: '平台设置', icon: 'setting' },
      ],
    },
    {
      label: '家族运营',
      items: [
        { id: 'dashboard', name: '数据总览', icon: 'dashboard' },
        { id: 'members', name: '成员管理', icon: 'team' },
        { id: 'changes', name: '成员变动', icon: 'swap' },
        { id: 'abyss', name: '深渊排班', icon: 'calendar' },
        { id: 'records', name: '深渊战报', icon: 'file' },
        { id: 'points', name: '积分管理', icon: 'star' },
        { id: 'rules', name: '积分规则', icon: 'setting' },
        { id: 'rewards', name: '兑换物品', icon: 'gift' },
        { id: 'redemptions', name: '兑换审核', icon: 'audit', badge: 'pending' },
        { id: 'content', name: '公告与动态', icon: 'notice', badge: 'content' },
        { id: 'accounts', name: '账号管理', icon: 'user' },
        { id: 'subscription', name: '订阅与续费', icon: 'wallet' },
        { id: 'settings', name: '家族设置', icon: 'setting' },
        { id: 'audit', name: '权限与审计', icon: 'audit' },
      ],
    },
    {
      label: '管理员',
      items: [
        { id: 'admin-home', name: '管理员工作台', icon: 'dashboard' },
        { id: 'admin-settings', name: '管理员设置', icon: 'setting' },
      ],
    },
    {
      label: '我的空间',
      items: [
        { id: 'my-overview', name: '我的概览', icon: 'dashboard' },
        { id: 'my-map', name: '成员分布', icon: 'map' },
        { id: 'my-records', name: '我的战报', icon: 'file' },
        { id: 'my-points', name: '我的积分', icon: 'star' },
        { id: 'my-shop', name: '兑换商城', icon: 'gift' },
        { id: 'my-requests', name: '我的申请', icon: 'audit', badge: 'myPending' },
        { id: 'my-notices', name: '家族公告', icon: 'notice' },
        { id: 'my-moments', name: '家族动态', icon: 'team' },
        { id: 'my-profile', name: '个人资料', icon: 'user' },
      ],
    },
    {
      label: '预览',
      items: [{ id: 'mobile', name: '用户端预览', icon: 'mobile' }],
    },
  ]

  return groups
    .map((group) => ({ label: group.label, items: group.items.filter((item) => can(item.id, { ...session, role })) }))
    .filter((group) => group.items.length > 0)
}
