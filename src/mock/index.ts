/**
 * Mock 数据统一出口 / 内存态工厂（规范源 · 三端同步）。
 * 业务数据只存内存，刷新即初始态；不写 localStorage。
 */
import type {
  AbyssReport,
  Announcement,
  AuditRecord,
  ChangeRecord,
  FamilyRole,
  ImportRecord,
  Member,
  Moment,
  PointLedger,
  Redemption,
  RewardItem,
  Tenant,
} from '@/types'
import { TENANTS } from './tenants'

export * from './utils'
export * from './bridges/excelMembers'
export * from './bridges/excelAbyss'
export * from './members'
export * from './abyss'
export * from './points'
export * from './redemptions'
export * from './content'
export * from './changes'
export * from './audit'
export * from './tenants'
export * from './region'

/** 演示内存态：tenant 与主集合互为同一对象图，避免快照分叉 */
export interface DemoState {
  tenant: Tenant
  /** 平台租户全集（租户端 dev-* 页面的写操作对象；tenant 指向 tenants[0]） */
  tenants: Tenant[]
  members: Member[]
  abyssReport: AbyssReport
  ledger: PointLedger[]
  items: RewardItem[]
  redemptions: Redemption[]
  announcements: Announcement[]
  moments: Moment[]
  changes: ChangeRecord[]
  imports: ImportRecord[]
  audit: AuditRecord[]
  /** 已结算周次，用于幂等校验 */
  settledWeeks: string[]
}

/** 创建全新初始态（深拷贝，保证 reset 后不被历史引用污染） */
export function createInitialState(): DemoState {
  const tenants = JSON.parse(JSON.stringify(TENANTS)) as Tenant[]
  const tenant = tenants[0] as Tenant
  return {
    tenant,
    tenants,
    members: tenant.members,
    abyssReport: tenant.abyssReport,
    ledger: tenant.ledger,
    items: tenant.items,
    redemptions: tenant.redemptions,
    announcements: tenant.announcements,
    moments: tenant.moments,
    changes: tenant.changes,
    imports: tenant.imports,
    audit: tenant.audit,
    settledWeeks: [],
  }
}

/** 重置演示数据（ stores/demo.ts 的 resetDemo() 调用此方法） */
export function resetDemoData(): DemoState {
  return createInitialState()
}

/** 供 QA / 画板 16 自验的数据体检 */
export interface DemoValidation {
  memberCount: number
  reportRows: number
  zeroDamageRows: number
  sourceMarkedMembers: number
  unregisteredUids: string[]
  roleSeeds: Record<string, FamilyRole>
  pass: boolean
}

export function validateDemoData(): DemoValidation {
  const expected = createInitialState()
  const roleSeeds: Record<string, FamilyRole> = {
    '429108139': 'admin',
    '715805542': 'leader',
    '610466469': 'elder',
    '200116265': 'member',
  }
  const validation: DemoValidation = {
    memberCount: expected.members.length,
    reportRows: expected.abyssReport.rows.length,
    zeroDamageRows: expected.abyssReport.rows.filter((row) => row.absent === true).length,
    sourceMarkedMembers: expected.members.filter(
      (member) => member.source?.account === 'excel'
        && member.source?.name === 'excel'
        && member.source?.role === 'synthetic',
    ).length,
    unregisteredUids: expected.abyssReport.rows
      .filter((row) => row.unregistered === true)
      .map((row) => row.uid),
    roleSeeds,
    pass: false,
  }
  validation.pass =
    validation.memberCount === 100 &&
    validation.reportRows === 100 &&
    validation.zeroDamageRows === 8 &&
    validation.sourceMarkedMembers === validation.memberCount &&
    validation.unregisteredUids.length === 1 &&
    validation.unregisteredUids[0] === '702084278'
  return validation
}
