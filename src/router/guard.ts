/** 登录守卫：平台菜单固定，不再做页面级角色判断 */
import type { Router } from 'vue-router'
import { useAuth } from '@/stores/auth'

export function installGuard(router: Router): void {
  router.beforeEach((to) => {
    if (to.meta.public === true) return true
    const auth = useAuth()
    if (!auth.authed) return { name: 'Login' }
    return true
  })
}
