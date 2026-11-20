<script setup lang="ts">
/** 租户分发平台统一外壳：深色侧栏 + 顶栏 + 白卡浅灰内容区。菜单固定，不做权限过滤。 */
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input } from 'ant-design-vue'
import AppIcon from '@/components/AppIcon.vue'
import BrandMark from '@/components/BrandMark.vue'
import type { MenuItem } from '@/types'
import { PLATFORM_ROLE_LABEL, logout, useAuth } from '@/stores/auth'
import { fixedMenu, titleOf, toggleSidebar, useLayout } from '@/stores/layout'
import {
  authApi, overviewApi, planApi, platformUserApi, priceRequestApi, renewalApi, tenantsApi,
} from '@/api'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const layout = useLayout()

const groups = computed(() => fixedMenu())
const breadcrumb = computed(() => String(route.meta.title ?? titleOf(String(route.name ?? ''))))

function isActive(item: MenuItem): boolean {
  return route.path === `/${item.id}`
}

function onSearch(): void {
  const keyword = layout.searchKeyword.trim()
  router.push({ name: 'DevTenants', query: keyword ? { q: keyword } : {} })
}

async function onLogout(): Promise<void> {
  await authApi.logout()
  logout()
  router.push('/login')
}

/** 进入控制台后统一从后端拉取基础数据到 store */
async function preloadData(): Promise<void> {
  if (!auth.authed) return
  await Promise.allSettled([
    tenantsApi.listTenants(),
    planApi.getPlan(),
    priceRequestApi.listPriceRequests(),
    renewalApi.listRenewals(),
    platformUserApi.listPlatformUsers(),
    overviewApi.getOverview(),
  ])
}

onMounted(preloadData)

</script>

<template>
  <div class="layout" :class="{ 'layout--collapsed': layout.collapsed }">
    <aside class="layout__sidebar">
      <div class="brand" :class="{ 'brand--collapsed': layout.collapsed }">
        <span class="brand__mark"><BrandMark :size="30" glow /></span>
        <span v-if="!layout.collapsed" class="brand__text">
          <strong>聚梦者·服务平台</strong>
          <small>租户分发控制台</small>
        </span>
      </div>

      <nav class="layout__nav" aria-label="主导航">
        <section v-for="group in groups" :key="group.label" class="nav-group">
          <router-link v-for="item in group.items" :key="item.id" :to="`/${item.id}`" class="nav-group__item"
            :class="{ 'is-active': isActive(item), 'is-collapsed': layout.collapsed }" :title="layout.collapsed ? item.name : undefined">
            <AppIcon :name="item.icon" :size="18" class="nav-group__icon" />
            <span v-if="!layout.collapsed" class="nav-group__name">{{ item.name }}</span>
          </router-link>
        </section>
      </nav>
    </aside>

    <div class="layout__main">
      <header class="topbar">
        <div class="topbar__crumb">
          <button type="button" class="topbar__collapse" :aria-label="layout.collapsed ? '展开侧栏' : '收起侧栏'"
            @click="toggleSidebar">
            <AppIcon name="menu" :size="18" />
          </button>
          <span class="topbar__platform"><BrandMark :size="16" />聚梦者服务平台</span>
          <span class="topbar__sep">/</span>
          <strong>{{ breadcrumb }}</strong>
        </div>
        <div class="topbar__tools">
          <Input.Search v-model:value="layout.searchKeyword" placeholder="搜索租户…" allow-clear class="topbar__search"
            @search="onSearch" />
          <router-link to="/dev-log" class="topbar__icon-btn" title="审计日志"><AppIcon name="audit" :size="18" /></router-link>
          <router-link to="/dev-profile" class="topbar__icon-btn" title="个人中心"><AppIcon name="profile" :size="18" /></router-link>
          <details class="user-menu">
            <summary class="user-menu__trigger">
              <span class="user-menu__avatar">{{ auth.name.slice(0, 1) }}</span>
              <span>{{ auth.name }}</span>
              <span class="user-menu__role">{{ PLATFORM_ROLE_LABEL[auth.role] }}</span>
              <AppIcon name="chevron" :size="14" class="user-menu__chevron" />
            </summary>
            <div class="user-menu__panel">
              <p>{{ auth.account }}</p>
              <button type="button" @click="router.push('/dev-profile')"><AppIcon name="profile" :size="15" />个人中心</button>
              <button type="button" @click="router.push('/dev-users')"><AppIcon name="users" :size="15" />平台用户</button>
              <button type="button" class="user-menu__danger" @click="onLogout"><AppIcon name="logout" :size="15" />退出登录</button>
            </div>
          </details>
        </div>
      </header>

      <main class="layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_mixins' as _mixins;
@use '@/assets/scss/_tokens' as _tokens;

.layout {
  --sidebar-width: #{_tokens.$sidebar-width};
  display: flex;
  min-height: 100vh;
  background: _tokens.$bg-page;

  &--collapsed {
    --sidebar-width: 72px;
  }

  &__sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 12;
    display: flex;
    flex-direction: column;
    width: var(--sidebar-width);
    overflow: hidden;
    background: _tokens.$nav-dark;
    color: #{_tokens.$text-inverse};
    transition: width .18s;
  }

  &__main {
    flex: 1;
    margin-left: var(--sidebar-width);
    min-width: 0;
    transition: margin-left .18s;
  }

  &__content {
    padding: #{_tokens.$sp-6} #{_tokens.$sp-8} #{_tokens.$sp-10};
    max-width: #{_tokens.$content-max};
    margin: 0 auto;
  }
}

.brand {
  @include _mixins.flex-between;
  gap: #{_tokens.$sp-3};
  height: #{_tokens.$topbar-height};
  padding: 0 #{_tokens.$sp-5};
  border-bottom: 1px solid rgba(_tokens.$text-inverse, .08);
  flex-shrink: 0;
  overflow: hidden;
  justify-content: flex-start;

  &--collapsed {
    justify-content: center;
    padding: 0;
  }

  &__mark {
    @include _mixins.flex-center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    color: _tokens.$text-inverse;
  }

  &__text {
    display: flex;
    flex-direction: column;
    white-space: nowrap;

    strong {
      font-size: 15px;
    }

    small {
      color: rgba(_tokens.$text-inverse, .5);
      font-size: 10px;
    }
  }
}

.layout__nav {
  flex: 1;
  overflow-y: auto;
  padding: #{_tokens.$sp-4} #{_tokens.$sp-3};
}

.nav-group {
  margin-bottom: #{_tokens.$sp-5};

  &__item {
    display: flex;
    align-items: center;
    gap: #{_tokens.$sp-2};
    padding: 9px #{_tokens.$sp-3};
    border-radius: #{_tokens.$radius-md};
    color: rgba(_tokens.$text-inverse, .72);
    font-size: 13px;
    white-space: nowrap;
    transition: background .16s;

    &:hover {
      background: rgba(_tokens.$text-inverse, .06);
    }

    &.is-active {
      background: _tokens.$brand-purple;
      color: #{_tokens.$text-inverse};
      font-weight: 600;
    }

    &.is-collapsed {
      justify-content: center;
      padding-left: 0;
      padding-right: 0;
    }
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    opacity: .85;
  }

  &__name {
    flex: 1;
  }
}

.topbar {
  @include _mixins.flex-between;
  height: #{_tokens.$topbar-height};
  padding: 0 #{_tokens.$sp-8};
  background: _tokens.$card-white;
  border-bottom: 1px solid _tokens.$border-color;

  &__crumb {
    display: flex;
    align-items: center;
    color: _tokens.$text-muted;
    font-size: 13px;

    strong {
      color: _tokens.$text-primary;
      font-weight: 600;
    }
  }

  &__collapse {
    margin-right: #{_tokens.$sp-3};
    padding: 2px 8px;
    border-radius: _tokens.$radius-sm;
    color: _tokens.$text-secondary;
    font-size: 15px;

    &:hover {
      background: _tokens.$bg-page;
    }
  }

  &__platform {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: _tokens.$text-secondary;
    white-space: nowrap;
  }

  &__icon-btn {
    @include _mixins.flex-center;
    width: 30px;
    height: 30px;
    border-radius: _tokens.$radius-md;
    color: _tokens.$text-secondary;
    transition: background .16s, color .16s;

    &:hover {
      background: _tokens.$bg-page;
      color: _tokens.$brand-purple;
    }
  }

  &__sep {
    margin: 0 #{_tokens.$sp-2};
  }

  &__tools {
    display: flex;
    align-items: center;
    gap: #{_tokens.$sp-4};
  }

  &__search {
    width: 220px;
  }
}

.user-menu {
  position: relative;

  &__trigger {
    @include _mixins.flex-between;
    gap: #{_tokens.$sp-2};
    cursor: pointer;
    list-style: none;
    font-size: 13px;

    &::-webkit-details-marker {
      display: none;
    }
  }

  &__avatar {
    @include _mixins.flex-center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
    font-size: 10px;
  }

  &__chevron {
    color: _tokens.$text-muted;
  }

  &__role {
    padding: 1px 6px;
    border-radius: _tokens.$radius-pill;
    background: rgba(_tokens.$brand-purple, .1);
    color: _tokens.$brand-purple;
    font-size: 11px;
  }

  &__panel {
    position: absolute;
    right: 0;
    top: 38px;
    z-index: 20;
    width: 190px;
    padding: #{_tokens.$sp-2};
    border-radius: _tokens.$radius-md;
    background: _tokens.$card-white;
    box-shadow: _tokens.$shadow-modal;

    p {
      padding: #{_tokens.$sp-2};
      color: _tokens.$text-muted;
      font-size: 11px;
      border-bottom: 1px solid _tokens.$border-color;
    }

    button {
      display: flex;
      align-items: center;
      gap: #{_tokens.$sp-2};
      width: 100%;
      padding: #{_tokens.$sp-2};
      text-align: left;
      font-size: 12px;
      border-radius: _tokens.$radius-sm;

      &:hover {
        background: _tokens.$bg-page;
      }
    }
  }

  &__danger {
    color: _tokens.$color-danger;
  }
}

@media (max-width: 900px) {
  .layout--collapsed {
    --sidebar-width: 60px;
  }

  .topbar__search {
    width: 140px;
  }

  .topbar__platform {
    display: none;
  }
}
</style>
