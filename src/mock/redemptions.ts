/** 兑换商品与兑换单（前端演示合成，非 Excel 数据） */
import type { Redemption, RewardItem } from '@/types'
import { hashInt, padId } from './utils'

export const ITEMS: RewardItem[] = [
  { id: 'I01', name: '限定头像框·星渊', desc: '深渊赛季限定头像框', cost: 800, stock: 12, limit: 1, status: 'on', glyph: '星', g1: 'var(--brand-purple)', g2: 'var(--color-info)' },
  { id: 'I02', name: '家族专属称号·豪杰', desc: '30 天限时称号', cost: 1200, stock: 8, limit: 1, status: 'on', glyph: '豪', g1: 'var(--brand-coral)', g2: 'var(--brand-yellow)' },
  { id: 'I03', name: '月卡·积分加成', desc: '当月积分获取 +10%', cost: 600, stock: 30, limit: 2, status: 'on', glyph: '月', g1: 'var(--color-success)', g2: 'var(--color-info)' },
  { id: 'I04', name: '深渊应援礼包', desc: '含专属表情与徽章', cost: 450, stock: 20, limit: 3, status: 'on', glyph: '援', g1: 'var(--brand-purple)', g2: 'var(--brand-coral)' },
  { id: 'I05', name: '定制名片背景', desc: '家族主题名片背景', cost: 300, stock: 50, limit: 2, status: 'on', glyph: '名', g1: 'var(--color-info)', g2: 'var(--brand-purple)' },
  { id: 'I06', name: '周末双倍卡', desc: '一次战斗积分双倍', cost: 900, stock: 0, limit: 1, status: 'off', glyph: '倍', g1: 'var(--brand-yellow)', g2: 'var(--brand-coral)' },
  { id: 'I07', name: '家族公告置顶券', desc: '公告置顶 7 天', cost: 1500, stock: 5, limit: 1, status: 'on', glyph: '置', g1: 'var(--brand-coral)', g2: 'var(--brand-purple)' },
  { id: 'I08', name: '专属客服通道', desc: '30 天优先响应', cost: 2000, stock: 3, limit: 1, status: 'on', glyph: '服', g1: 'var(--color-success)', g2: 'var(--brand-yellow)' },
]

const REDEEM_STATUSES = ['pending', 'approved', 'fulfilled', 'rejected'] as const

/** 12 条兑换单，状态 / 申请时间按序号确定性生成 */
export const REDEMPTIONS: Redemption[] = Array.from({ length: 12 }, (_, index) => {
  const item = ITEMS[index % ITEMS.length] as RewardItem
  const status = REDEEM_STATUSES[index % REDEEM_STATUSES.length]
  const memberId = padId('M', (index % 24) + 1)
  const applied = `2026-11-${String((index % 12) + 1).padStart(2, '0')} ${String(10 + (index % 8)).padStart(2, '0')}:${String(hashInt(memberId, 0, 59, index)).padStart(2, '0')}`
  return {
    id: padId('R', index + 1, 4),
    memberId,
    itemId: item.id,
    itemName: item.name,
    cost: item.cost,
    status,
    applied,
    contact: `member_${memberId}@example.com`,
    note: index % 3 === 0 ? '希望尽快发放，感谢！' : '',
    reviewer: status === 'pending' ? '' : '烟火',
    timeline: [
      { t: applied, text: '提交兑换申请', who: memberId },
      ...(status === 'pending'
        ? []
        : [{ t: `${applied.slice(0, 10)} 14:00`, text: status === 'rejected' ? '申请已驳回，积分退回' : '审核通过，等待发放', who: '烟火' }]),
    ],
  }
})

export function getItemById(id: string): RewardItem | undefined {
  return ITEMS.find((item) => item.id === id)
}
