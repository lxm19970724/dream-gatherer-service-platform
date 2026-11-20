/**
 * API 传输类型 —— 与 Java 后端的 DTO / VO / Entity 一一对应。
 * 命名保持后端 camelCase；前端展示层仍沿用 stores 里的实体类型。
 */
import type { PlatformRole, TenantStatus } from '@/types'

/** 后端统一响应 R<T>（request.ts 已拆包，一般无需直接使用） */
export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

/** 后端分页 PageResult<T> */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

/** ===== auth ===== */
export interface LoginReq {
  account: string
  password: string
}
export interface LoginVO {
  token: string
  account: string
  name: string
  role: PlatformRole
}
export interface MeVO {
  account: string
  name: string
  role: PlatformRole
  roleLabel: string
  actions: string[]
}
export interface PasswordReq {
  oldPassword: string
  newPassword: string
}

/** ===== tenant ===== */
export interface TenantVO {
  id: string
  name: string
  shortName: string
  avatar: string
  expireAt: string
  status: TenantStatus
  dealPrice: number
  termMonths: number
  priceNote: string
  adminAccount: string
  adminName: string
}
export interface TenantCreateReq {
  name: string
  shortName: string
  months: number
  dealPrice: number
  avatar: string
}
export interface RenewReq {
  months: number
}
export interface PriceReq {
  months: number
  price: number
  note: string
}
export interface AddTenantResult {
  tenant: TenantVO
  account: string
  password: string
  pendingRequest: boolean
}
export interface ResetPwdResult {
  account: string
  password: string
}

/** ===== plan ===== */
export interface PlanVO {
  name: string
  standardPrice: number
  updatedBy: string
}

/** ===== price request ===== */
export interface PriceRequestVO {
  id: string
  tenantId: string
  tenantName: string
  applicantName: string
  months: number
  currentPrice: number
  requestedPrice: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewer: string
  reviewedAt: string
}
export interface PriceRequestReq {
  tenantId: string
  months: number
  requestedPrice: number
  reason: string
}
export interface ReviewReq {
  approved: boolean
}

/** ===== platform user ===== */
export interface PlatformUserVO {
  id: number
  account: string
  name: string
  role: PlatformRole
  roleLabel: string
  status: string
  createdBy: string
  createdAt: string
  lastLogin: string
}
export interface PlatformUserCreateReq {
  name: string
  role: PlatformRole
}
export interface CreateUserResult {
  user: PlatformUserVO
  password: string
}

/** ===== overview ===== */
export interface OverviewVO {
  tenantCount: number
  activeCount: number
  expiringCount: number
  lockedCount: number
  standardPrice: number
  discountedCount: number
  pendingRequests: number
  statusDistribution: Record<string, number>
}

/** ===== renewal ===== */
/** 后端 renewal_record 实体字段（payment_date / tenant_name） */
export interface RenewalVO {
  id: string
  tenantId: string
  tenantName: string
  months: number
  amount: number
  paymentDate: string
  expireAt: string
  method: string
  operator: string
}

/** ===== audit ===== */
/** 后端 login_audit 实体字段 */
export interface LoginAuditVO {
  id: number
  account: string
  loginTime: string
  ip: string
  device: string
  /** success / fail */
  result: string
  /** low / medium / high */
  risk: string
  /** 登录入口，如「控制台」 */
  entry: string
}
/** 后端 operation_log 实体字段 */
export interface OperationLogVO {
  id: number
  eventTime: string
  actor: string
  actorRole: string
  action: string
  target: string
  detail: string
}
