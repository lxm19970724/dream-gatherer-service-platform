/** 深渊战报：100 行真值 + 派生标记 */
import type { AbyssReport, AbyssReportRow } from '@/types'
import { buildAbyssReport } from './bridges/excelAbyss'
import { MEMBER_UIDS } from './bridges/excelMembers'

/** 战报主体（unregistered 依据 99 人成员表计算，保留导入前状态） */
export const ABYSS_REPORT: AbyssReport = buildAbyssReport(MEMBER_UIDS)

/** 第 93-100 名：伤害 0、挑战 0 的真实未参与记录（absent:true，灰显展示、不过滤） */
export const ZERO_DAMAGE_ROWS: AbyssReportRow[] = ABYSS_REPORT.rows.filter((row) => row.absent === true)

/** 达标行 */
export const QUALIFIED_ROWS: AbyssReportRow[] = ABYSS_REPORT.rows.filter((row) => row.qualified === true)

/** 未登记 UID 行（画板 16 结算拦截项） */
export const UNREGISTERED_ROWS: AbyssReportRow[] = ABYSS_REPORT.rows.filter((row) => row.unregistered === true)
