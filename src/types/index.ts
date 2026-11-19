/**
 * 三端共享类型定义（规范源 · 三端同步）
 * 约定：UID 一律 string；日期 YYYY-MM-DD；时间 YYYY-MM-DD HH:mm。
 */

/** ===== 基础联合类型 ===== */
export type AppMode = 'dev' | 'family'
export type Role = 'dev' | 'admin' | 'leader' | 'vice' | 'elder' | 'member'
export type FamilyRole = Exclude<Role, 'dev'>
export type MemberStatus = 'active' | 'left' | 'removed'
export type TenantStatus = 'active' | 'expiring' | 'expired' | 'locked'
export type LedgerType = 'rule' | 'manual' | 'redeem' | 'refund' | 'init'
export type RuleType = 'tier' | 'damage' | 'abyss' | 'manual'
export type ChangeType = 'join' | 'left' | 'removed' | 'role' | 'info' | 'redeem' | 'init'
export type SourceType = 'import-user' | 'import-abyss' | 'import-points' | 'manual' | 'system' | 'member'
export type RedeemStatus = 'pending' | 'approved' | 'fulfilled' | 'rejected'
export type ItemStatus = 'on' | 'off'

/** 字段来源标注（PRD v1.3 §0.1.2）：真实 Excel 值 vs 前端演示合成 */
export type FieldSource = 'excel' | 'synthetic'
/** 逐字段来源元数据，供 UI 展示「来源：…」与审计说明 */
export type FieldSourceMap<T> = Partial<Record<keyof T, FieldSource>>

/** 所有页面 ID（与路由 path / PRD 页面 ID 一一对应） */
export type PageId =
  | 'dev-overview' | 'dev-tenants' | 'dev-new' | 'dev-billing' | 'dev-accounts' | 'dev-log' | 'dev-settings'
  | 'dashboard' | 'members' | 'changes' | 'abyss' | 'records' | 'points' | 'rules'
  | 'rewards' | 'redemptions' | 'content' | 'accounts' | 'subscription' | 'settings' | 'audit'
  | 'admin-home' | 'admin-settings'
  | 'my-overview' | 'my-map' | 'my-records' | 'my-points' | 'my-shop'
  | 'my-requests' | 'my-notices' | 'my-moments' | 'my-profile' | 'mobile'
  | 'home' | 'shop' | 'requests' | 'profile' | 'manage' | 'moments'

/** ===== 核心实体 ===== */
export interface Member {
  /** M001...（前端演示合成） */
  id: string
  /** Excel「UID」，字符串，防精度丢失（真实 Excel） */
  account: string
  /** Excel「昵称」，可含 emoji / 组合字符（真实 Excel） */
  name: string
  /** 前端演示合成；种子账号除外 */
  role: FamilyRole
  /** 原 Excel 缺失 → null，UI 显示「—」 */
  job: string | null
  level: number | null
  /** 家族称号（前端演示合成） */
  title: string
  /** 可用积分（前端演示合成） */
  points: number
  /** 冻结积分（前端演示合成） */
  frozen: number
  status: MemberStatus
  /** YYYY-MM-DD，截取自 Excel「成员加入时间」 */
  join: string
  lastActive: string
  /** T1..T10（前端演示合成） */
  team: string | null
  captain: boolean
  province: string
  city: string
  district: string
  accountStatus: 'active' | 'disabled'
  lastLogin: string
  /** 来自深渊战报「挑战次数」（真实 Excel） */
  challengeCount: number
  /** 逐字段来源标注；渲染层可据此显示「来源：前端演示合成」 */
  source?: FieldSourceMap<Member>
}

export interface AbyssReportRow {
  rank: number
  name: string
  uid: string
  damage: number
  challenges: number
  /** 由桥接计算，不来自 Excel */
  qualified?: boolean
  unregistered?: boolean
  points?: number
  /** 伤害=0 且 挑战=0 的真实未参与记录（第 93–100 名），UI 灰显保留、不得过滤 */
  absent?: boolean
}

export interface AbyssReport {
  title: string
  file: string
  week: string
  date: string
  uploadedAt: string
  uploadedBy: string
  rows: AbyssReportRow[]
}

export interface Tier { from: number; to: number; points: number }
export interface OverRule { rank: number; minChallenges: number; points: number }

export interface PointRule {
  id: string
  name: string
  desc: string
  type: RuleType
  cond: string
  formula: string
  points: number
  cap: number
  priority: number
  enabled: boolean
  tiers?: Tier[]
  over?: OverRule
  threshold?: number
}

export interface PointLedger {
  id: string
  memberId: string
  time: string
  amount: number
  type: LedgerType
  reason: string
  operator: string
}

export interface RewardItem {
  id: string
  name: string
  desc: string
  cost: number
  stock: number
  limit: number
  status: ItemStatus
  glyph: string
  g1: string
  g2: string
}

export interface TimelineEntry { t: string; text: string; who: string }

export interface Redemption {
  id: string
  memberId: string
  itemId: string
  itemName: string
  cost: number
  status: RedeemStatus
  applied: string
  contact: string
  note: string
  reviewer: string
  timeline: TimelineEntry[]
}

export interface Announcement {
  id: string
  kind: '公告' | '通知'
  title: string
  content: string
  image: string | null
  pinned: boolean
  status: 'published' | 'draft'
  publishedAt: string
  publisher: string
  auto?: boolean
  tag?: string
}

export interface Comment { name: string; text: string }

export interface Moment {
  id: string
  memberId: string
  content: string
  images: string[]
  time: string
  likes: number
  comments: Comment[]
}

export interface ChangeRecord {
  id: string
  date: string
  time: string
  memberId: string | null
  name: string
  type: ChangeType
  desc: string
  source: SourceType
  operator: string
}

export interface ImportRecord {
  id: string
  type: 'user' | 'abyss' | 'points'
  file: string
  rows: number
  ok: number
  warn: number
  err: number
  time: string
  status: 'success' | 'partial' | 'failed'
}

export interface AuditRecord {
  id: string
  time: string
  who: string
  role: string
  action: string
  target: string
  ip: string
}

export interface Team { id: string; name: string; note: string }
export interface Title { id: string; name: string; color: string; desc: string }
export interface AdminAccount {
  account: string
  name: string
  status: 'active' | 'disabled'
  createdAt: string
  lastLogin: string
  issuer: string
}

export interface Tenant {
  id: string
  name: string
  short: string
  server: string
  level: number
  leader: string
  cap: number
  founded: string
  motto: string
  createdAt: string
  plan: '旗舰版' | '标准版' | '基础版'
  seats: number
  expireAt: string
  status: TenantStatus
  admin: AdminAccount
  titles: Title[]
  teams: Team[]
  members: Member[]
  abyssReport: AbyssReport
  announcements: Announcement[]
  moments: Moment[]
  items: RewardItem[]
  redemptions: Redemption[]
  rules: PointRule[]
  ledger: PointLedger[]
  changes: ChangeRecord[]
  imports: ImportRecord[]
  audit: AuditRecord[]
}

export interface RegionNode { code: string; name: string; children?: RegionNode[] }

/** ===== 会话 / 菜单 / 响应 ===== */
export interface AppSession {
  authed: boolean
  role: Role
  tenantId: string
  account: string
}

export interface MenuItem { id: PageId; name: string; icon: string; badge?: 'pending' | 'myPending' | 'content' }
export interface MenuGroup { label: string; items: MenuItem[] }

/** Mock 服务层统一响应，便于未来替换真实 API */
export interface MockResult<T> { code: 0 | 1; data: T; message: string }

/** ===== 关键操作入参 / 出参 ===== */
export interface SettleInput { week: string; operator: string; createMissing: boolean }
export interface SettleIssue {
  kind: 'unregistered' | 'over-cap' | 'zero-damage' | 'duplicate'
  uid?: string
  message: string
}
export interface SettleDetail extends AbyssReportRow { memberId: string | null; ruleHit: string }
export interface SettleResult {
  ok: boolean
  issues: SettleIssue[]
  details: SettleDetail[]
  granted: { memberId: string; points: number }[]
  ledger: PointLedger[]
}
export interface RedeemInput { memberId: string; itemId: string; contact: string; note: string }
