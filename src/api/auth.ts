/**
 * 认证接口：登录 / 当前账号 / 修改密码 / 登出。
 * 所有数据均请求 Java 后端，本地不做任何账号校验。
 */
import { http } from './request'
import type { LoginReq, LoginVO, MeVO, PasswordReq } from './types'
import { login as establishSession, PLATFORM_ROLE_LABEL } from '@/stores/auth'
import type { PlatformRole } from '@/types'

/** 登录，成功后写入会话（含 token） */
export async function login(req: LoginReq): Promise<LoginVO> {
  const vo = await http.post<LoginVO>('/auth/login', req)
  establishSession({ account: vo.account, name: vo.name, role: vo.role }, vo.token)
  return vo
}

/** 当前账号信息 */
export function me(): Promise<MeVO> {
  return http.get<MeVO>('/auth/me')
}

/** 修改本人密码 */
export function changePassword(req: PasswordReq): Promise<void> {
  return http.put<void>('/auth/password', req)
}

/**
 * 登出：JWT 为无状态令牌，后端不保存会话，
 * 本地清理登录态即可（由调用方调用 auth store 的 logout）。
 */
export async function logout(): Promise<void> {
  return Promise.resolve()
}

/** 把后端 role code 转成中文标签（页面展示用） */
export function roleLabelOf(role: PlatformRole): string {
  return PLATFORM_ROLE_LABEL[role] ?? role
}
