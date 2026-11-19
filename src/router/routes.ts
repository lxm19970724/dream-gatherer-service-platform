/*
 * @Author: lixuming
 * @Date: 2026-11-19 14:52:18
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-19 17:52:50
 * @Description: 路由配置
 * @FilePath: \dream-center-family-manage\src\router\routes.ts
 */
/** 租户端路由表（T02：dev-* 七页 + 登录 + lock 兜底，统一 ConsoleLayout 外壳） */
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'
import LockView from '@/components/LockView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'Root', redirect: '/dev-overview' },
      {
        path: 'dev-overview', name: 'DevOverview',
        component: () => import('@/views/dev/overview.vue'),
        meta: { pageId: 'dev-overview', title: '运营总览' },
      },
      {
        path: 'dev-tenants', name: 'DevTenants',
        component: () => import('@/views/dev/tenants.vue'),
        meta: { pageId: 'dev-tenants', title: '租户列表' },
      },
      {
        path: 'dev-new', name: 'DevNew',
        component: () => import('@/views/dev/new.vue'),
        meta: { pageId: 'dev-new', title: '新建租户' },
      },
      {
        path: 'dev-billing', name: 'DevBilling',
        component: () => import('@/views/dev/billing.vue'),
        meta: { pageId: 'dev-billing', title: '套餐与续费' },
      },
      {
        path: 'dev-accounts', name: 'DevAccounts',
        component: () => import('@/views/dev/accounts.vue'),
        meta: { pageId: 'dev-accounts', title: '账号分发' },
      },
      {
        path: 'dev-log', name: 'DevLog',
        component: () => import('@/views/dev/log.vue'),
        meta: { pageId: 'dev-log', title: '登录审计' },
      },
      {
        path: 'dev-settings', name: 'DevSettings',
        component: () => import('@/views/dev/settings.vue'),
        meta: { pageId: 'dev-settings', title: '平台设置' },
      },
    ],
  },
  { path: '/lock/:pageId', name: 'Lock', component: LockView },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: LockView },
]

export default routes
