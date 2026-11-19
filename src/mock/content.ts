/** 公告与动态（前端演示合成，非 Excel 数据） */
import type { Announcement, Moment } from '@/types'
import { hashInt, padId } from './utils'

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'A01', kind: '公告', title: '11 月深渊战报已发布', content: '本周战报已完成解析，请族长核对名次与伤害后进行结算。第 65 名存在未登记 UID，请补建账号。', image: null, pinned: true, status: 'published', publishedAt: '2026-11-14 09:30', publisher: '烟火', tag: '战报' },
  { id: 'A02', kind: '通知', title: '家族积分规则更新', content: '自本周起，伤害达标线调整为 5000 万，60 名以后需挑战至少 3 次。', image: null, pinned: true, status: 'published', publishedAt: '2026-11-13 20:00', publisher: '烟火', tag: '积分' },
  { id: 'A03', kind: '公告', title: '周末家族战动员', content: '本周六 20:00 集合，请各位成员提前备好体力。', image: null, pinned: false, status: 'published', publishedAt: '2026-11-12 18:20', publisher: '麋鹿不迷路' },
  { id: 'A04', kind: '通知', title: '兑换商城新增头像框', content: '限定头像框已上架，可用 800 积分兑换，每人限兑 1 次。', image: null, pinned: false, status: 'published', publishedAt: '2026-11-11 12:00', publisher: '烟火', tag: '商城' },
  { id: 'A05', kind: '公告', title: '关于成员资料补录的提醒', content: '请尚未补录地区的成员在「我的资料」中填写省 / 市 / 区县。', image: null, pinned: false, status: 'published', publishedAt: '2026-11-10 10:00', publisher: '系统' },
  { id: 'A06', kind: '公告', title: '12 月赛季规则草案', content: '草案征求家族成员意见，反馈截止 11 月 30 日。', image: null, pinned: false, status: 'draft', publishedAt: '', publisher: '烟火' },
  { id: 'A07', kind: '通知', title: '重大变更自动公告示例', content: '族长任命变更由系统自动发布公告（演示用）。', image: null, pinned: false, status: 'published', publishedAt: '2026-11-08 09:00', publisher: '系统', auto: true },
  { id: 'A08', kind: '公告', title: '家族周年庆典预告', content: '周年庆典将于下月开启，敬请期待。', image: null, pinned: false, status: 'draft', publishedAt: '', publisher: '麋鹿不迷路' },
]

const MOMENT_TEXTS = [
  '今晚深渊冲榜成功，感谢队伍里的每一位！',
  '新成员报到，请多指教～',
  '换了新的家族头像框，好看吗？',
  '周末活动打卡，家族氛围越来越好了。',
  '战报终于结算完成，积分已到账。',
  '求组队，缺一个输出位。',
  '第一次进前 20，记录一下。',
  '兑换的称号到手啦！',
  '分享一张今天的游戏截图。',
  '提醒：别忘了补录地区资料。',
  '家族公告更新了，大家看一下。',
  '连续签到 30 天达成。',
]

export const MOMENTS: Moment[] = MOMENT_TEXTS.map((text, index) => {
  const memberId = padId('M', (index % 18) + 1)
  return {
    id: padId('P', index + 1, 4),
    memberId,
    content: text,
    images: [],
    time: `2026-11-${String((index % 13) + 1).padStart(2, '0')} ${String(8 + (index % 12)).padStart(2, '0')}:${String(hashInt(memberId, 0, 59, index)).padStart(2, '0')}`,
    likes: hashInt(memberId, 0, 48, index + 30),
    comments: index % 3 === 0 ? [{ name: '烟火', text: '继续保持！' }] : [],
  }
})
