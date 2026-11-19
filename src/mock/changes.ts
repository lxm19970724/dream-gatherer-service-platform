/** 成员变动与导入记录（前端演示合成，非 Excel 数据） */
import type { ChangeRecord, ChangeType, ImportRecord, SourceType } from '@/types'
import { hashInt, padId } from './utils'

const CHANGE_ITEMS: ReadonlyArray<{ type: ChangeType; source: SourceType; desc: string }> = [
  { type: 'init', source: 'import-user', desc: '导入家族成员表，建立 99 人初始档案' },
  { type: 'role', source: 'manual', desc: '任命烟火为族长' },
  { type: 'role', source: 'manual', desc: '任命麋鹿不迷路为长老' },
  { type: 'role', source: 'manual', desc: '任命凉̶̨白͓开༗为成员' },
  { type: 'join', source: 'import-user', desc: '新成员加入家族' },
  { type: 'join', source: 'import-user', desc: '新成员加入家族' },
  { type: 'left', source: 'member', desc: '成员主动退出' },
  { type: 'removed', source: 'manual', desc: '管理员清退成员' },
  { type: 'info', source: 'member', desc: '成员补录地区资料' },
  { type: 'info', source: 'member', desc: '成员修改昵称' },
  { type: 'role', source: 'system', desc: '职位变更自动公告已发布' },
  { type: 'redeem', source: 'member', desc: '提交兑换申请' },
  { type: 'join', source: 'import-abyss', desc: '战报结算补建未登记 UID 702084278' },
  { type: 'info', source: 'import-abyss', desc: '导入深渊战报 100 行' },
  { type: 'info', source: 'import-points', desc: '批量调整积分' },
]

export const CHANGES: ChangeRecord[] = CHANGE_ITEMS.map((item, index) => {
  const day = String((index % 14) + 1).padStart(2, '0')
  const memberIndex = (index % 20) + 1
  return {
    id: padId('C', index + 1, 4),
    date: `2026-11-${day}`,
    time: `2026-11-${day} ${String(9 + (index % 10)).padStart(2, '0')}:${String(hashInt(`C${index}`, 0, 59)).padStart(2, '0')}`,
    memberId: index === 12 ? null : padId('M', memberIndex),
    name: index === 12 ? '鱼忆七秒梦' : `成员 ${padId('M', memberIndex)}`,
    type: item.type,
    desc: item.desc,
    source: item.source,
    operator: index % 4 === 0 ? '系统' : '烟火',
  }
})

export const IMPORTS: ImportRecord[] = [
  { id: 'IP01', type: 'user', file: '箱庭·潇湘雨轩家族成员.xlsx', rows: 99, ok: 99, warn: 0, err: 0, time: '2026-11-01 09:12', status: 'success' },
  { id: 'IP02', type: 'abyss', file: '2026-11-13_深渊战报.xlsx', rows: 100, ok: 99, warn: 9, err: 1, time: '2026-11-14 09:30', status: 'partial' },
  { id: 'IP03', type: 'points', file: '2026-11_积分批量调整.xlsx', rows: 24, ok: 24, warn: 0, err: 0, time: '2026-11-15 10:05', status: 'success' },
]
