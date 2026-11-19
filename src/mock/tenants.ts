/**
 * 租户与账号（前端演示合成；成员与战报真值来自 Excel 桥接）。
 * ACCOUNT_ROLE_MAP 为家族端登录角色映射的单一事实源。
 */
import type { AdminAccount, Tenant } from '@/types'
import { ABYSS_REPORT } from './abyss'
import { ANNOUNCEMENTS, MOMENTS } from './content'
import { AUDIT } from './audit'
import { CHANGES, IMPORTS } from './changes'
import { MEMBERS, UNREGISTERED_MEMBERS } from './members'
import { LEDGER, RULES } from './points'
import { ITEMS, REDEMPTIONS } from './redemptions'
import { LOGIN_ROLE_SEEDS, TENANT_PLATFORM_ACCOUNT } from './utils'

/** 家族端登录账号 → 角色（UID 为真实 Excel 值，角色为前端演示合成） */
export const ACCOUNT_ROLE_MAP = LOGIN_ROLE_SEEDS

/** 租户端平台账号示意（非 Excel 数据） */
export const PLATFORM_ACCOUNT = TENANT_PLATFORM_ACCOUNT

const admin: AdminAccount = {
  account: TENANT_PLATFORM_ACCOUNT,
  name: '平台管理员',
  status: 'active',
  createdAt: '2025-01-08 10:00',
  lastLogin: '2026-11-16 09:12',
  issuer: '星渊服务平台',
}

const BASE_TENANT: Tenant = {
  id: 'T001',
  name: '箱庭·潇湘雨轩',
  short: '潇湘雨轩',
  server: '星渊一区',
  level: 6,
  leader: '烟火',
  cap: 100,
  founded: '2021-10-11',
  motto: '以家族为舟，共赴星渊',
  createdAt: '2025-01-08 10:00',
  plan: '旗舰版',
  seats: 100,
  expireAt: '2027-01-08',
  status: 'active',
  admin,
  titles: [
    { id: 'TT1', name: '豪杰', color: 'var(--brand-purple)', desc: '家族核心贡献者' },
    { id: 'TT2', name: '精英', color: 'var(--color-info)', desc: '活跃贡献成员' },
    { id: 'TT3', name: '新锐', color: 'var(--brand-coral)', desc: '新晋成员' },
  ],
  teams: [
    { id: 'T1', name: '一队·星渊', note: '主力输出' },
    { id: 'T2', name: '二队·逐月', note: '均衡阵容' },
    { id: 'T3', name: '三队·破晓', note: '新人培养' },
    { id: 'T4', name: '四队·流光', note: '机动替补' },
    { id: 'T5', name: '五队·长风', note: '后勤支援' },
    { id: 'T6', name: '六队·归途', note: '预备队' },
  ],
  members: MEMBERS,
  abyssReport: ABYSS_REPORT,
  announcements: ANNOUNCEMENTS,
  moments: MOMENTS,
  items: ITEMS,
  redemptions: REDEMPTIONS,
  rules: RULES,
  ledger: LEDGER,
  changes: CHANGES,
  imports: IMPORTS,
  audit: AUDIT,
}

/** 平台运营多租户（租户端画板 17），另两条为演示合成 */
export const TENANTS: Tenant[] = [
  BASE_TENANT,
  {
    ...BASE_TENANT,
    id: 'T002',
    name: '星渊·长夜未央',
    short: '长夜未央',
    server: '星渊二区',
    leader: '南國战神',
    plan: '标准版',
    seats: 60,
    status: 'expiring',
    expireAt: '2026-12-10',
    admin: { ...admin, account: 'admin_longnight', name: '长夜管理员' },
    members: [],
    announcements: [],
    moments: [],
  },
  {
    ...BASE_TENANT,
    id: 'T003',
    name: '流光· Until Dawn',
    short: 'Until Dawn',
    server: '星渊三区',
    leader: '浅蓝',
    plan: '基础版',
    seats: 30,
    status: 'active',
    expireAt: '2026-12-31',
    admin: { ...admin, account: 'admin_untildawn', name: '流光管理员' },
    members: [],
    announcements: [],
    moments: [],
  },
]

/** 未登记 UID 补建账号在成员表中的引用（画板 16 演示） */
export const UNREGISTERED_ACCOUNT = UNREGISTERED_MEMBERS[0]?.account ?? '702084278'
