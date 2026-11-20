/**
 * app store —— 服务平台业务数据的只读内存镜像。
 * 所有数据由 src/api 从 Java 后端拉取后写入这里，页面统一从本 store 读取；
 * 本文件不持有任何种子数据，也不提供本地写操作。
 */
import { reactive } from 'vue'
import type {
  PlatformPlan,
  PlatformUser,
  PriceRequest,
  RenewalRecord,
  Tenant,
} from '@/types'

export interface AppState {
  tenants: Tenant[]
  plan: PlatformPlan
  platformUsers: PlatformUser[]
  priceRequests: PriceRequest[]
  renewals: RenewalRecord[]
}

const state = reactive<AppState>({
  tenants: [],
  plan: { name: '', price: 0, updatedAt: '', updatedBy: '' },
  platformUsers: [],
  priceRequests: [],
  renewals: [],
})

export function useApp(): AppState {
  return state
}

/** 可选订购时长（新建租户 / 续费 / 成交价申请共用） */
export const TERM_OPTIONS = [
  { value: 6, label: '半年（6 个月）' },
  { value: 12, label: '一年（12 个月）' },
  { value: 24, label: '两年（24 个月）' },
  { value: 36, label: '三年（36 个月）' },
]

export function termLabel(months: number): string {
  return TERM_OPTIONS.find((option) => option.value === months)?.label ?? `${months} 个月`
}

/** 从当前日期起算的到期日（半年 / 一年 / 两年…），用于新建表单的日期预览 */
export function expireDateFromNow(months: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
