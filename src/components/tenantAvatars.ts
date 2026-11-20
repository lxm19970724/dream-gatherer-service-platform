/** 租户默认头像：使用《忍者必须死3》公开的家族联赛 / 车轮战头像（本地缓存，离线可用）。 */
export interface TenantAvatarOption {
  id: string
  label: string
  src: string
  /** 图片加载前的兜底色 */
  color: string
}

export const TENANT_AVATARS: TenantAvatarOption[] = [
  { id: 'champion', label: '冠军家族', src: '/avatars/champion.jpg', color: '#f59e0b' },
  { id: 'runner-up', label: '亚军家族', src: '/avatars/runner-up.jpg', color: '#6d7cf6' },
  { id: 'third', label: '季军家族', src: '/avatars/third.jpg', color: '#818cf8' },
  { id: 'top8', label: '八强家族', src: '/avatars/top8.jpg', color: '#e0b060' },
  { id: 'top16', label: '十六强家族', src: '/avatars/top16.jpg', color: '#a78bfa' },
  { id: 'top32', label: '三十二强家族', src: '/avatars/top32.jpg', color: '#94a3b8' },
  { id: 'league', label: '联赛家族', src: '/avatars/league.jpg', color: '#64748b' },
  { id: 'wheel-champion', label: '冠军·车轮战', src: '/avatars/wheel-champion.jpg', color: '#c084fc' },
  { id: 'wheel-runner-up', label: '亚军·车轮战', src: '/avatars/wheel-runner-up.jpg', color: '#f472b6' },
  { id: 'wheel-third', label: '季军·车轮战', src: '/avatars/wheel-third.jpg', color: '#f87171' },
]

export function avatarOf(id: string | undefined): TenantAvatarOption {
  return TENANT_AVATARS.find((option) => option.id === id) ?? TENANT_AVATARS[0]!
}

export function randomAvatarId(): string {
  return TENANT_AVATARS[Math.floor(Math.random() * TENANT_AVATARS.length)]!.id
}
