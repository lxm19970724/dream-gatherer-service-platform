/**
 * 积分规则与流水。
 * 规则为业务演示配置；结算函数为纯函数，便于 UI 直接渲染明细与拦截项。
 */
import type {
  AbyssReport,
  AbyssReportRow,
  Member,
  PointLedger,
  PointRule,
  SettleDetail,
  SettleInput,
  SettleIssue,
  SettleResult,
} from '@/types'
import { hashInt, padId } from './utils'

/** 战报达标规则（PRD 0.1.3） */
export const RULES: PointRule[] = [
  {
    id: 'R1', name: '名次 1-5 名', desc: '深渊战报前 5 名基础奖励', type: 'tier',
    cond: 'rank 1-5', formula: '120 分 + 伤害 ≥7000万额外 10 分', points: 120, cap: 130,
    priority: 1, enabled: true, tiers: [{ from: 1, to: 5, points: 120 }],
  },
  {
    id: 'R2', name: '名次 6-20 名', desc: '深渊战报 6-20 名基础奖励', type: 'tier',
    cond: 'rank 6-20', formula: '90 分 + 伤害 ≥7000万额外 10 分', points: 90, cap: 100,
    priority: 2, enabled: true, tiers: [{ from: 6, to: 20, points: 90 }],
  },
  {
    id: 'R3', name: '名次 21-40 名', desc: '深渊战报 21-40 名基础奖励', type: 'tier',
    cond: 'rank 21-40', formula: '60 分 + 伤害 ≥7000万额外 10 分', points: 60, cap: 70,
    priority: 3, enabled: true, tiers: [{ from: 21, to: 40, points: 60 }],
  },
  {
    id: 'R4', name: '名次 41-60 名', desc: '深渊战报 41-60 名基础奖励', type: 'tier',
    cond: 'rank 41-60', formula: '40 分 + 伤害 ≥7000万额外 10 分', points: 40, cap: 50,
    priority: 4, enabled: true, tiers: [{ from: 41, to: 60, points: 40 }],
  },
  {
    id: 'R5', name: '达标伤害门槛', desc: '伤害 ≥ 5000 万方可获得名次奖励', type: 'damage',
    cond: 'damage >= 50000000', formula: '达标才发分，未达标记 0', points: 0, cap: 0,
    priority: 5, enabled: true, threshold: 50_000_000,
  },
  {
    id: 'R6', name: '60 名后出勤要求', desc: '60 名以后挑战次数 ≥3 次', type: 'abyss',
    cond: 'rank > 60 && challenges >= 3', formula: '出勤达标发放 20 分', points: 20, cap: 20,
    priority: 6, enabled: true, over: { rank: 60, minChallenges: 3, points: 20 },
  },
  {
    id: 'R7', name: '缺席扣分', desc: '连续缺席未参与成员扣 5 分（演示）', type: 'manual',
    cond: 'damage = 0 && challenges = 0', formula: '-5 分', points: -5, cap: 0,
    priority: 7, enabled: false,
  },
]

/** 初始积分流水（前端演示合成，按 UID 确定性生成） */
export const LEDGER: PointLedger[] = Array.from({ length: 36 }, (_, index) => {
  const memberId = padId('M', (index % 20) + 1)
  const amount = hashInt(memberId, 10, 120, index)
  return {
    id: padId('L', index + 1, 4),
    memberId,
    time: `2026-11-${String((index % 12) + 1).padStart(2, '0')} ${String(9 + (index % 9)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`,
    amount,
    type: index % 7 === 0 ? 'manual' : 'rule',
    reason: index % 7 === 0 ? '管理员调整' : `深渊战报 W${30 + (index % 12)} 结算`,
    operator: index % 3 === 0 ? '烟火' : '系统',
  }
})

function ruleHitOf(row: AbyssReportRow): string {
  if (row.absent === true) return '未参与 / R7 缺席'
  if (row.damage < 50_000_000) return 'R5 伤害未达标'
  if (row.rank <= 5) return 'R1 名次 1-5'
  if (row.rank <= 20) return 'R2 名次 6-20'
  if (row.rank <= 40) return 'R3 名次 21-40'
  if (row.rank <= 60) return 'R4 名次 41-60'
  return 'R6 出勤达标'
}

/**
 * 战报结算纯函数：不修改入参，返回明细 / 拦截项 / 发放 / 新增流水。
 * 幂等由调用方依据 settledWeeks 判断（同一 week 重复结算直接返回既有结果）。
 * createMissing=true 时由服务层先把未登记 UID 补建进 members 再调用本函数；
 * 若成员表仍缺该 UID，则无论开关如何都产出 unregistered 拦截项（ok=false，不会提交流水）。
 */
export function settleAbyss(
  report: AbyssReport,
  members: Member[],
  existingLedger: PointLedger[],
  input: SettleInput,
): SettleResult {
  const issues: SettleIssue[] = []
  const details: SettleDetail[] = []
  const granted: SettleResult['granted'] = []
  const ledger: PointLedger[] = []
  const memberByUid = new Map(members.map((member) => [member.account, member]))
  const settled = existingLedger.some((item) => item.reason.includes(`[${input.week}]`))

  if (settled) {
    issues.push({ kind: 'duplicate', message: `周次 ${input.week} 已结算，重复请求已拦截` })
  }

  report.rows.forEach((row) => {
    const member = memberByUid.get(row.uid)
    const qualified = row.qualified === true
    const detail: SettleDetail = {
      ...row,
      memberId: member ? member.id : null,
      ruleHit: ruleHitOf(row),
    }
    details.push(detail)

    if (!member) {
      issues.push({
        kind: 'unregistered',
        uid: row.uid,
        message: input.createMissing
          ? `第 ${row.rank} 名 ${row.name}（UID ${row.uid}）未登记；请先补建账号再重新结算`
          : `第 ${row.rank} 名 ${row.name}（UID ${row.uid}）未登记，本次结算已拦截`,
      })
      return
    }
    if (row.absent === true) {
      issues.push({
        kind: 'zero-damage',
        uid: row.uid,
        message: `第 ${row.rank} 名 ${row.name}（UID ${row.uid}）未参与，本次不发放`,
      })
      return
    }
    // createMissing 只决定是否允许服务层补建；已登记且达标的行无论该开关如何都应可预览发放
    if (!qualified || settled) return

    const points = row.points ?? 0
    if (points <= 0) return
    granted.push({ memberId: member.id, points })
    ledger.push({
      id: padId('L', existingLedger.length + ledger.length + 1, 4),
      memberId: member.id,
      time: `${report.date} 10:00`,
      amount: points,
      type: 'rule',
      reason: `深渊战报 [${input.week}] 结算 · 第 ${row.rank} 名`,
      operator: input.operator,
    })
  })

  if (members.length >= 100 && issues.some((issue) => issue.kind === 'unregistered') && !input.createMissing) {
    issues.push({ kind: 'over-cap', message: '成员已达 100 人上限，补建前请先清理席位' })
  }

  const blocking = issues.some((issue) => issue.kind === 'unregistered' || issue.kind === 'over-cap' || issue.kind === 'duplicate')
  return { ok: !blocking, issues, details, granted, ledger }
}
