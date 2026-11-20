/** 审计接口：登录审计 + 平台操作日志，数据全部来自后端 */
import { http } from './request'
import type { LoginAuditVO, OperationLogVO, PageResult } from './types'
import type { OperationLog, PlatformRole } from '@/types'

/** 登录审计展示行 */
export interface AuditRow {
  id: string
  account: string
  time: string
  ip: string
  device: string
  result: 'success' | 'fail'
  risk: '低' | '中' | '高'
  action: string
}

function formatTime(value: string): string {
  return value ? value.replace('T', ' ').slice(0, 16) : '—'
}

function toAuditRow(vo: LoginAuditVO): AuditRow {
  const riskMap: Record<string, AuditRow['risk']> = { low: '低', medium: '中', high: '高' }
  return {
    id: String(vo.id),
    account: vo.account,
    time: formatTime(vo.loginTime),
    ip: vo.ip,
    device: vo.device,
    result: vo.result === 'fail' ? 'fail' : 'success',
    risk: riskMap[vo.risk] ?? '低',
    action: vo.entry,
  }
}

function toOperationLog(vo: OperationLogVO): OperationLog {
  return {
    id: String(vo.id),
    time: formatTime(vo.eventTime),
    actor: vo.actor,
    role: vo.actorRole as PlatformRole,
    action: vo.action,
    target: vo.target,
    detail: vo.detail,
  }
}

/** 登录审计列表 */
export async function listLoginAudits(params: {
  keyword?: string; result?: string; page?: number; size?: number
} = {}): Promise<PageResult<AuditRow>> {
  const page = params.page ?? 1
  const size = params.size ?? 10
  const result = await http.get<PageResult<LoginAuditVO>>('/login-audits', { ...params, page, size })
  return { ...result, records: result.records.map(toAuditRow) }
}

/** 操作日志列表 */
export async function listOperationLogs(params: {
  keyword?: string; page?: number; size?: number
} = {}): Promise<PageResult<OperationLog>> {
  const page = params.page ?? 1
  const size = params.size ?? 10
  const result = await http.get<PageResult<OperationLogVO>>('/operation-logs', { ...params, page, size })
  return { ...result, records: result.records.map(toOperationLog) }
}
