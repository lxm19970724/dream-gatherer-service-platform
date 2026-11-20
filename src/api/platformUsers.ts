/** 平台用户接口：列表 / 新增 / 启停 / 重置密码（写操作仅初始管理员可用） */
import { http } from './request'
import type { CreateUserResult, PlatformUserCreateReq, PlatformUserVO, ResetPwdResult } from './types'
import { useApp } from '@/stores/app'

export async function listPlatformUsers(): Promise<PlatformUserVO[]> {
  const rows = await http.get<PlatformUserVO[]>('/platform-users')
  const app = useApp()
  const existing = new Map(app.platformUsers.map((user) => [user.account, user]))
  rows.forEach((vo) => {
    const item = existing.get(vo.account)
    if (item) {
      Object.assign(item, {
        name: vo.name,
        role: vo.role,
        status: vo.status,
        createdBy: vo.createdBy,
        createdAt: vo.createdAt,
        lastLogin: vo.lastLogin,
      })
    } else {
      app.platformUsers.push({
        id: String(vo.id),
        account: vo.account,
        name: vo.name,
        role: vo.role,
        password: '',
        status: vo.status === 'disabled' ? 'disabled' : 'active',
        createdAt: vo.createdAt,
        lastLogin: vo.lastLogin,
        createdBy: vo.createdBy,
      })
    }
  })
  return rows
}

export function createPlatformUser(req: PlatformUserCreateReq): Promise<CreateUserResult> {
  return http.post<CreateUserResult>('/platform-users', req)
}

export async function togglePlatformUserRequest(id: string | number): Promise<void> {
  await http.patch<void>(`/platform-users/${id}/status`)
  await listPlatformUsers()
}

export function resetPlatformUserPasswordRequest(id: string | number): Promise<ResetPwdResult> {
  return http.post<ResetPwdResult>(`/platform-users/${id}/reset-password`)
}
