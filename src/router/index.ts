import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { installGuard } from './guard'

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

installGuard(router)

export default router
