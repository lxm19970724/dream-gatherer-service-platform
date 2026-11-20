/**
 * layout store —— 布局相关状态与固定菜单。
 * 本平台只有一个控制台，菜单对所有登录用户一致，不做角色过滤。
 */
import { reactive } from 'vue'
import type { MenuGroup, PageId } from '@/types'

export interface MenuEntry {
  id: PageId
  name: string
  icon: string
}

/** 固定菜单（唯一事实源）：新建租户已并入租户列表弹窗，平台设置已由平台用户管理取代 */
export const FIXED_MENU: MenuGroup[] = [
  {
    label: '平台运营',
    items: [
      { id: 'dev-overview', name: '运营总览', icon: 'dashboard' },
      { id: 'dev-tenants', name: '租户列表', icon: 'team' },
      { id: 'dev-billing', name: '套餐与价格', icon: 'wallet' },
      { id: 'dev-accounts', name: '账号分发', icon: 'key' },
      { id: 'dev-users', name: '平台用户', icon: 'users' },
      { id: 'dev-log', name: '审计日志', icon: 'audit' },
    ],
  },
]

export interface LayoutState {
  collapsed: boolean
  searchKeyword: string
}

const COLLAPSE_KEY = 'platform_sidebar_collapsed'

const state = reactive<LayoutState>({
  collapsed: localStorage.getItem(COLLAPSE_KEY) === '1',
  searchKeyword: '',
})

export function useLayout(): LayoutState {
  return state
}

export function fixedMenu(): MenuGroup[] {
  return FIXED_MENU
}

export function toggleSidebar(): void {
  state.collapsed = !state.collapsed
  try {
    localStorage.setItem(COLLAPSE_KEY, state.collapsed ? '1' : '0')
  } catch {
    // 隐私模式下忽略持久化失败
  }
}

/** 菜单项 id → 标题，供面包屑 / 搜索跳转使用 */
export function titleOf(pageId: PageId | string): string {
  for (const group of FIXED_MENU) {
    const hit = group.items.find((item) => item.id === pageId)
    if (hit) return hit.name
  }
  return '运营控制台'
}
