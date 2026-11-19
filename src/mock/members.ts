/**
 * 成员集合：99 行 Excel 真值 + 未登记 UID 补建 = 100 人。
 * 未登记 UID 通过「战报 UID 集合 - 成员 UID 集合」运行时计算，不硬编码数量。
 */
import type { Member } from '@/types'
import { ABYSS_UIDS, RAW_ABYSS_ROWS } from './bridges/excelAbyss'
import { buildMemberFrom, buildMembers, MEMBER_UIDS } from './bridges/excelMembers'
import { findUnregisteredUids } from './utils'

/** 成员上限（含全部管理职位） */
export const MEMBER_LIMIT = 100

/** 战报中的真实挑战次数，按 UID 回填成员（真实 Excel 字段） */
const challengeByUid = new Map<string, number>(
  RAW_ABYSS_ROWS.map((row) => [row[2], row[4]]),
)

const registeredMembers: Member[] = buildMembers().map((member) => ({
  ...member,
  challengeCount: challengeByUid.get(member.account) ?? 0,
}))

/** 未登记 UID 列表：由集合差算出；当前样本保证包含 702084278 */
export const UNREGISTERED_UIDS: string[] = findUnregisteredUids(MEMBER_UIDS, ABYSS_UIDS)

/** 未登记成员：数据来自战报真值，加入时间以战报日期兜底（前端演示合成） */
export const UNREGISTERED_MEMBERS: Member[] = UNREGISTERED_UIDS.map((uid, index) => {
  const row = RAW_ABYSS_ROWS.find((item) => item[2] === uid)
  if (!row) {
    const fallback = buildMemberFrom([uid, uid, '2026-11-13 00:00'], registeredMembers.length + index + 1, 0)
    return {
      ...fallback,
      source: { ...fallback.source, account: 'excel', name: 'excel', join: 'synthetic' },
    }
  }
  const member = buildMemberFrom([row[2], row[1], '2026-11-13 00:00'], registeredMembers.length + index + 1, row[4])
  return {
    ...member,
    // 前端演示合成：未登记账号由导入补建，角色为普通成员、状态在家族
    role: 'member' as const,
    status: 'active' as const,
    accountStatus: 'active' as const,
    // 账号/昵称来自战报真值；加入时间由战报日期兜底 → 前端演示合成
    source: {
      ...member.source,
      account: 'excel',
      name: 'excel',
      join: 'synthetic',
      challengeCount: 'excel',
    },
  }
})

/** 全量成员（恰好 100 人） */
export const MEMBERS: Member[] = [...registeredMembers, ...UNREGISTERED_MEMBERS]

/** 按 UID（登录账号）查成员 */
export function getMemberByUid(uid: string): Member | undefined {
  return MEMBERS.find((member) => member.account === uid)
}

/** 按内部 ID 查成员 */
export function getMemberById(id: string): Member | undefined {
  return MEMBERS.find((member) => member.id === id)
}

/** 当前登录账号对应的成员（含未登记补建账号） */
export function memberOfAccount(account: string): Member | undefined {
  return getMemberByUid(account) ?? UNREGISTERED_MEMBERS.find((member) => member.account === account)
}
