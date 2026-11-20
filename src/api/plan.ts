/** 标准价接口：全平台唯一，只读（后端故意不提供修改接口） */
import { http } from './request'
import type { PlanVO } from './types'
import { useApp } from '@/stores/app'

export async function getPlan(): Promise<PlanVO> {
  const vo = await http.get<PlanVO>('/plan')
  const plan = useApp().plan
  plan.name = vo.name
  plan.price = vo.standardPrice
  plan.updatedBy = vo.updatedBy
  return vo
}
