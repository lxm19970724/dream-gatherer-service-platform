/** 续费记录接口：数据来自后端 renewal_record 表 */
import { http } from './request'
import type { RenewalVO } from './types'
import type { RenewalRecord } from '@/types'
import { useApp } from '@/stores/app'

export async function listRenewals(): Promise<RenewalRecord[]> {
  const rows = await http.get<RenewalVO[]>('/renewals')
  const normalized: RenewalRecord[] = rows.map((row) => ({
    id: row.id,
    tenant: row.tenantName,
    months: row.months,
    amount: row.amount,
    date: row.paymentDate,
    expireAt: row.expireAt,
    method: row.method,
    operator: row.operator,
  }))
  const app = useApp()
  app.renewals.splice(0, app.renewals.length, ...normalized)
  return app.renewals
}
