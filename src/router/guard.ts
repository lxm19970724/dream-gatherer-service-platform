/** 鉴权与权限守卫：未登录 → /login；无权限 → /lock/:pageId */
import type { Router } from 'vue-router'
import type { PageId } from '@/types'
import { can, useSession } from '@/stores/session'

export function installGuard(router: Router): void {
  router.beforeEach((to) => {
    if (to.meta.public === true) return true
    const session = useSession()
    if (!session.authed) return { name: 'Login' }

    const pageId = to.meta.pageId as PageId | undefined
    if (pageId && !can(pageId, session)) {
      return { name: 'Lock', params: { pageId } }
    }
    return true
  })
}
