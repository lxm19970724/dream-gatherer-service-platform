/**
 * 租户接口：列表 / 新建 / 续费 / 锁定 / 重置密码 / 直接调价。
 * 数据全部来自 Java 后端；请求成功后同步回 store，页面读同一份响应式数据。
 */
import { http } from './request'
import type {
  AddTenantResult, PageResult, PriceReq, RenewReq, ResetPwdResult, TenantCreateReq, TenantVO,
} from './types'
import { useApp } from '@/stores/app'
import type { Tenant } from '@/types'

/** 后端 TenantVO → 前端 Tenant（后端只返回平台展示所需字段） */
function toTenant(vo: TenantVO): Tenant {
  return {
    id: vo.id,
    name: vo.name,
    short: vo.shortName,
    avatar: vo.avatar,
    expireAt: vo.expireAt,
    status: vo.status,
    dealPrice: vo.dealPrice,
    termMonths: vo.termMonths,
    priceNote: vo.priceNote,
    priceUpdatedAt: '',
    priceUpdatedBy: '',
    admin: {
      account: vo.adminAccount,
      name: vo.adminName,
      status: vo.status === 'active' ? 'active' : 'disabled',
      createdAt: '',
      lastLogin: '—',
      issuer: '星渊服务平台',
    },
  }
}

/** 用后端列表替换本地 store 的租户数据（保持引用，页面响应式不丢） */
function syncTenants(vos: TenantVO[]): void {
  const app = useApp()
  app.tenants.splice(0, app.tenants.length, ...vos.map(toTenant))
}

/** 租户列表（后端分页） */
export async function listTenants(params: {
  keyword?: string; status?: string; page?: number; size?: number
} = {}): Promise<Tenant[]> {
  const result = await http.get<PageResult<TenantVO>>('/tenants', {
    keyword: params.keyword,
    status: params.status,
    page: params.page ?? 1,
    size: params.size ?? 1000,
  })
  syncTenants(result.records)
  return useApp().tenants
}

/** 新建租户 */
export async function createTenant(req: TenantCreateReq): Promise<AddTenantResult> {
  const result = await http.post<AddTenantResult>('/tenants', req)
  await listTenants()
  return result
}

/** 续费 */
export async function renewTenantRequest(id: string, req: RenewReq): Promise<void> {
  await http.post<void>(`/tenants/${id}/renew`, req)
  await listTenants()
}

/** 锁定 / 解锁 */
export async function toggleTenantRequest(id: string): Promise<void> {
  await http.patch<void>(`/tenants/${id}/status`)
  await listTenants()
}

/** 重置租户管理员密码 */
export function resetTenantPasswordRequest(id: string): Promise<ResetPwdResult> {
  return http.post<ResetPwdResult>(`/tenants/${id}/reset-password`)
}

/** 高权限直接调整成交价 */
export async function setTenantPriceRequest(id: string, req: PriceReq): Promise<void> {
  await http.put<void>(`/tenants/${id}/price`, req)
  await listTenants()
}
