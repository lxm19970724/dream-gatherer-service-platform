/**
 * Mock 公共工具（规范源 · 三端同步）
 * 所有缺失字段均基于 hash(uid) 确定性合成，禁止 Math.random()。
 */
import type { FamilyRole } from '@/types'

/** 登录角色种子（真实 UID 来自 Excel，角色为前端演示合成） */
export const LOGIN_ROLE_SEEDS: Record<string, FamilyRole> = {
  '429108139': 'admin',   // 大明子呦i → 租户管理员
  '715805542': 'leader',  // 烟火 → 族长
  '610466469': 'elder',   // 麋鹿不迷路 → 长老
  '200116265': 'member',  // 凉̶̨白͓开༗ → 成员
}

/** 租户端平台账号示意（非 Excel 数据） */
export const TENANT_PLATFORM_ACCOUNT = 'dev@xingyuan'

/** FNV-1a 32 位哈希：同一 UID 永远得到同一结果 */
export function hashUid(uid: string): number {
  let hash = 2166136261
  for (let i = 0; i < uid.length; i += 1) {
    hash ^= uid.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** 从数组中按 UID 确定性取一项 */
export function hashPick<T>(uid: string, candidates: readonly T[]): T {
  if (candidates.length === 0) throw new Error('hashPick: 候选数组不能为空')
  return candidates[hashUid(uid) % candidates.length] as T
}

/** 由 hash 派生的稳定整数，区间 [min, max] */
export function hashInt(uid: string, min: number, max: number, salt = 0): number {
  const span = max - min + 1
  return min + (hashUid(`${uid}#${salt}`) % span)
}

/** 截取日期 YYYY-MM-DD HH:mm → YYYY-MM-DD */
export function dateOf(datetime: string): string {
  return datetime.slice(0, 10)
}

/** 由加入时间派生的稳定活跃时间（前端演示合成） */
export function timeOf(datetime: string, salt = 0): string {
  const date = dateOf(datetime)
  const hour = String((hashInt(date, 8, 23, salt)).toString().padStart(2, '0'))
  const minute = String(hashInt(date, 0, 59, salt + 1)).toString().padStart(2, '0')
  return `${date} ${hour}:${minute}`
}

/** 稳定的三位序号 ID，如 M001 / L0007 */
export function padId(prefix: string, index: number, width = 3): string {
  return `${prefix}${String(index).padStart(width, '0')}`
}

/**
 * 运行时集合差：战报 UID - 成员 UID。
 * 不硬编码数量，保证任何一份 Excel 都能算出未登记账号。
 */
export function findUnregisteredUids(memberUids: readonly string[], reportUids: readonly string[]): string[] {
  const known = new Set(memberUids)
  const missing = new Set<string>()
  reportUids.forEach((uid) => {
    if (!known.has(uid)) missing.add(uid)
  })
  return Array.from(missing)
}

/** 按 hash 派生非种子成员角色（前端演示合成） */
export function synthesizedRole(uid: string): FamilyRole {
  const seed = LOGIN_ROLE_SEEDS[uid]
  if (seed) return seed
  const value = hashUid(`${uid}:role`) % 100
  if (value < 2) return 'leader'
  if (value < 5) return 'vice'
  if (value < 15) return 'elder'
  return 'member'
}
