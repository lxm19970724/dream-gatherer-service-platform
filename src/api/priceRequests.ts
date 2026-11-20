/** 成交价申请接口：列表 / 提交 / 审批（一单一价，只影响指定租户） */
import { http } from './request'
import type { PriceRequestReq, PriceRequestVO, ReviewReq } from './types'
import { useApp } from '@/stores/app'
import { listTenants } from './tenants'

export async function listPriceRequests(status?: string): Promise<PriceRequestVO[]> {
  const rows = await http.get<PriceRequestVO[]>('/price-requests', { status })
  const app = useApp()
  const existing = new Map(app.priceRequests.map((item) => [item.id, item]))
  rows.forEach((vo) => {
    const item = existing.get(vo.id)
    if (item) {
      Object.assign(item, {
        tenantId: vo.tenantId,
        tenantName: vo.tenantName,
        applicantName: vo.applicantName,
        months: vo.months,
        currentPrice: vo.currentPrice,
        requestedPrice: vo.requestedPrice,
        reason: vo.reason,
        status: vo.status,
        submittedAt: vo.submittedAt,
        reviewer: vo.reviewer,
        reviewedAt: vo.reviewedAt,
      })
    } else {
      app.priceRequests.unshift({
        id: vo.id,
        tenantId: vo.tenantId,
        tenantName: vo.tenantName,
        applicant: vo.applicantName,
        applicantName: vo.applicantName,
        months: vo.months,
        currentPrice: vo.currentPrice,
        requestedPrice: vo.requestedPrice,
        reason: vo.reason,
        status: vo.status,
        submittedAt: vo.submittedAt,
        reviewer: vo.reviewer,
        reviewedAt: vo.reviewedAt,
      })
    }
  })
  return rows
}

export async function submitPriceRequest(req: PriceRequestReq): Promise<void> {
  await http.post<void>('/price-requests', req)
  await listPriceRequests()
}

export async function reviewPriceRequestRequest(id: string, req: ReviewReq): Promise<void> {
  await http.post<void>(`/price-requests/${id}/review`, req)
  await Promise.all([listPriceRequests(), listTenants()])
}
