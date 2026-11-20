/** 租户分发平台路由表：菜单固定，路由只做登录校验，不按角色过滤 */
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
        path: 'dev-overview',
        name: 'DevOverview',
        component: () => import('@/views/overview/index.vue'),
        meta: { pageId: 'dev-overview', title: '运营总览' },
      },
      {
        path: 'dev-tenants',
        name: 'DevTenants',
        component: () => import('@/views/tenants/index.vue'),
        meta: { pageId: 'dev-tenants', title: '租户列表' },
      },
      {
        path: 'dev-billing',
        name: 'DevBilling',
        component: () => import('@/views/billing/index.vue'),
        meta: { pageId: 'dev-billing', title: '套餐与价格' },
      },
      {
        path: 'dev-accounts',
        name: 'DevAccounts',
        component: () => import('@/views/accounts/index.vue'),
        meta: { pageId: 'dev-accounts', title: '账号分发' },
      },
      {
        path: 'dev-users',
        name: 'DevUsers',
        component: () => import('@/views/users/index.vue'),
        meta: { pageId: 'dev-users', title: '平台用户' },
      },
      {
        path: 'dev-log',
        name: 'DevLog',
        component: () => import('@/views/log/index.vue'),
        meta: { pageId: 'dev-log', title: '审计日志' },
      },
      {
        path: 'dev-profile',
        name: 'DevProfile',
        component: () => import('@/views/profile/index.vue'),
        meta: { pageId: 'dev-profile', title: '个人中心' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: LockView },
]

export default routes
