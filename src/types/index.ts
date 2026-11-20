/** 租户分发平台前端领域类型（数据来源均为 Java 后端） */

export type PlatformRole = 'super' | 'senior' | 'basic'
export type PlatformAction =
  | 'resetPassword'
  | 'createTenant'
  | 'requestPrice'
  | 'approvePrice'
  | 'editPrice'
  | 'manageUsers'
export type TenantStatus = 'active' | 'expiring' | 'expired' | 'locked'

/** 所有页面 ID（与路由 path 一一对应；菜单固定） */
export type PageId =
  | 'dev-overview' | 'dev-tenants' | 'dev-billing' | 'dev-accounts' | 'dev-users' | 'dev-log' | 'dev-profile'

/** 租户管理员账号（由后端 tenant_admin 表下发） */
export interface AdminAccount {
  account: string
  name: string
  status: 'active' | 'disabled'
  createdAt: string
  lastLogin: string
  issuer: string
}

/** 平台视角的租户：只保留分发平台使用的字段，租户内部数据不属于本平台 */
export interface Tenant {
  id: string
  name: string
  short: string
  expireAt: string
  status: TenantStatus
  /** 该租户实际成交年费（元/年），可与平台标准价不同 */
  dealPrice: number
  /** 本次订购时长（月），如 6 / 12 / 24 / 36 */
  termMonths: number
  /** 定价说明，如「三年合约优惠」 */
  priceNote: string
  priceUpdatedAt: string
  priceUpdatedBy: string
  avatar: string
  admin: AdminAccount
}

/** 唯一固定套餐——标准价（挂牌价）全局一份；实际成交价按租户记录，互不影响 */
export interface PlatformPlan {
  name: string
  /** 标准价，元 / 年 */
  price: number
  updatedAt: string
  updatedBy: string
}

/** 平台维护人员账号（由初始管理员创建） */
export interface PlatformUser {
  id: string
  account: string
  name: string
  role: PlatformRole
  /** 后端仅在新建 / 重置时一次性返回明文密码，列表不返回 */
  password: string
  status: 'active' | 'disabled'
  createdAt: string
  lastLogin: string
  createdBy: string
}

/** 租户成交价申请：基础角色提交，高级角色审批；通过后只改该租户，不动全局标准价 */
export interface PriceRequest {
  id: string
  tenantId: string
  tenantName: string
  applicant: string
  applicantName: string
  /** 申请订购时长（月） */
  months: number
  /** 该租户当前成交年费 */
  currentPrice: number
  /** 申请成交年费 */
  requestedPrice: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewer: string
  reviewedAt: string
}

/** 续费记录（金额按该租户成交价折算） */
export interface RenewalRecord {
  id: string
  tenant: string
  months: number
  amount: number
  date: string
  expireAt: string
  method: string
  operator: string
}

/** 平台操作日志（与安全审计区分：记录「谁改了什么」） */
export interface OperationLog {
  id: string
  time: string
  actor: string
  role: PlatformRole
  action: string
  target: string
  detail: string
}

/** ===== 菜单 ===== */
export interface MenuItem { id: PageId; name: string; icon: string; badge?: 'pending' | 'myPending' | 'content' }
export interface MenuGroup { label: string; items: MenuItem[] }
