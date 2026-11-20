/** 运营总览接口：后端聚合 KPI */
import { http } from './request'
import type { OverviewVO } from './types'

export function getOverview(): Promise<OverviewVO> {
  return http.get<OverviewVO>('/overview')
}
