/** 管理操作日志与平台登录审计（前端演示合成） */
import type { AuditRecord } from '@/types'
import { hashInt, padId, TENANT_PLATFORM_ACCOUNT } from './utils'

export const AUDIT: AuditRecord[] = Array.from({ length: 12 }, (_, index) => {
  const actions = ['任命成员', '结算战报', '审核兑换', '发布公告', '锁定租户', '续费订阅']
  const day = String((index % 14) + 1).padStart(2, '0')
  return {
    id: padId('AU', index + 1, 4),
    time: `2026-11-${day} ${String(9 + (index % 9)).padStart(2, '0')}:${String(hashInt(`AU${index}`, 0, 59)).padStart(2, '0')}`,
    who: index % 3 === 0 ? '烟火' : index % 3 === 1 ? '麋鹿不迷路' : TENANT_PLATFORM_ACCOUNT,
    role: index % 3 === 2 ? 'dev' : 'leader',
    action: actions[index % actions.length] as string,
    target: index % 4 === 0 ? '成员管理' : index % 4 === 1 ? '深渊战报' : '系统设置',
    ip: `192.168.1.${20 + index}`,
  }
})

/** 平台登录审计（租户端画板 18） */
export const PLATFORM_LOGINS: AuditRecord[] = Array.from({ length: 20 }, (_, index) => {
  const day = String((index % 14) + 1).padStart(2, '0')
  return {
    id: padId('PL', index + 1, 4),
    time: `2026-11-${day} ${String(8 + (index % 11)).padStart(2, '0')}:${String(hashInt(`PL${index}`, 0, 59)).padStart(2, '0')}`,
    who: index % 4 === 0 ? TENANT_PLATFORM_ACCOUNT : `admin_${padId('T', (index % 3) + 1)}`,
    role: index % 4 === 0 ? 'dev' : 'admin',
    action: index % 7 === 0 ? '登录失败' : '登录成功',
    target: index % 2 === 0 ? '控制台' : '开放接口',
    ip: `10.0.${index % 5}.${30 + index}`,
  }
})
