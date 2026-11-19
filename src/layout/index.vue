<script setup lang="ts">
/** 租户端统一外壳（画板 24 规范）：深色侧栏 + 顶栏 + 白卡浅灰内容区 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input } from 'ant-design-vue'
import type { MenuItem } from '@/types'
import { getMenu, can, logout, ROLE_LABEL, useSession } from '@/stores/session'
import { useDemo } from '@/stores/demo'
import { TENANT_PLATFORM_ACCOUNT } from '@/mock/utils'

const route = useRoute()
const router = useRouter()
const session = useSession()
const demo = useDemo()
const searchText = ref('')

/** 菜单与权限同源：getMenu 内部逐项 can() 过滤，不写死角色数组 */
const groups = computed(() => getMenu(session.role).map((group) => ({
  ...group,
  items: group.items.filter((item) => can(item.id, session)),
})))

const breadcrumb = computed(() => String(route.meta.title ?? '运营控制台'))

function isActive(item: MenuItem): boolean {
  return route.path === `/${item.id}`
}

/** 侧栏徽标：从内存态实时计算，避免写死数量 */
function badgeOf(item: MenuItem): number {
  if (item.badge === 'pending') return demo.redemptions.filter((entry) => entry.status === 'pending').length
  if (item.badge === 'content') return demo.announcements.filter((entry) => entry.status === 'draft').length
  if (item.badge === 'myPending') {
    return demo.redemptions.filter((entry) => entry.memberId === 'M001' && entry.status === 'pending').length
  }
  return 0
}

function onSearch(): void {
  const keyword = searchText.value.trim()
  router.push({ name: 'DevTenants', query: keyword ? { q: keyword } : {} })
}

function onLogout(): void {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <aside class="layout__sidebar">
      <div class="brand">
        <!-- <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <path d="M16 2 29 9v14L16 30 3 23V9Z" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="m16 9 6 3.5v7L16 23l-6-3.5v-7Z" fill="currentColor" opacity=".85" />
          </svg>
        </span> -->
        <span class="brand__text">
          <strong>聚梦者·服务平台</strong>
          <small>家族租户管理控制台</small>
        </span>
      </div>

      <nav class="layout__nav" aria-label="主导航">
        <section v-for="group in groups" :key="group.label" class="nav-group">
          <p class="nav-group__label">{{ group.label }}</p>
          <router-link v-for="item in group.items" :key="item.id" :to="`/${item.id}`" class="nav-group__item"
            :class="{ 'is-active': isActive(item) }">
            <span class="nav-group__glyph" aria-hidden="true">◆</span>
            <span class="nav-group__name">{{ item.name }}</span>
            <span v-if="badgeOf(item)" class="nav-group__badge">{{ badgeOf(item) }}</span>
          </router-link>
        </section>
      </nav>
    </aside>

    <div class="layout__main">
      <header class="topbar">
        <div class="topbar__crumb">
          <span>星渊服务平台</span>
          <span class="topbar__sep">/</span>
          <strong>{{ breadcrumb }}</strong>
        </div>
        <div class="topbar__tools">
          <Input.Search v-model:value="searchText" placeholder="搜索租户…" allow-clear class="topbar__search"
            @search="onSearch" />
          <details class="user-menu">
            <summary class="user-menu__trigger">
              <span class="user-menu__avatar">DEV</span>
              <span>{{ ROLE_LABEL[session.role] }}</span>
              <span aria-hidden="true">▾</span>
            </summary>
            <div class="user-menu__panel">
              <p>{{ TENANT_PLATFORM_ACCOUNT }}</p>
              <button type="button" @click="router.push('/dev-settings')">平台设置</button>
              <button type="button" class="user-menu__danger" @click="onLogout">退出登录</button>
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
@use '@/assets/scss/_css-vars' as _vars;
@use '@/assets/scss/_tokens' as _tokens;
@use '@/assets/scss/_mixins' as _mixins;

.layout {
  display: flex;
  min-height: 100vh;
  background: _tokens.$bg-page;

  &__sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 12;
    display: flex;
    flex-direction: column;
    width: #{_tokens.$sidebar-width};
    background: _tokens.$nav-dark;
    color: #{_tokens.$text-inverse};
  }

  &__main {
    flex: 1;
    margin-left: #{_tokens.$sidebar-width};
    min-width: 0;
  }

  &__content {
    padding: #{_tokens.$sp-6} #{_tokens.$sp-8} #{_tokens.$sp-10};
    max-width: #{_tokens.$content-max};
    margin: 0 auto;
  }
}

.brand {
  @include _mixins.flex-between;
  gap: #{_tokens.$sp-2};
  height: #{_tokens.$topbar-height};
  padding: 0 #{_tokens.$sp-5};
  border-bottom: 1px solid rgba(_tokens.$text-inverse, .08);

  &__mark {
    color: #{_tokens.$brand-purple};
    display: flex;
  }

  &__text {
    display: flex;
    flex-direction: column;

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

  &__label {
    padding: 0 #{_tokens.$sp-3} #{_tokens.$sp-2};
    color: rgba(_tokens.$text-inverse, .38);
    font-size: 10px;
    letter-spacing: .1em;
  }

  &__item {
    @include _mixins.flex-between;
    gap: #{_tokens.$sp-2};
    padding: 9px #{_tokens.$sp-3};
    border-radius: #{_tokens.$radius-md};
    color: rgba(_tokens.$text-inverse, .72);
    font-size: 13px;
    transition: background .16s;

    &:hover {
      background: rgba(_tokens.$text-inverse, .06);
    }

    &.is-active {
      background: #{_tokens.$brand-purple};
      color: #{_tokens.$text-inverse};
      font-weight: 600;
    }
  }

  &__glyph {
    font-size: 9px;
    opacity: .6;
  }

  &__name {
    flex: 1;
  }

  &__badge {
    min-width: 18px;
    padding: 0 5px;
    border-radius: #{_tokens.$radius-pill};
    background: #{_tokens.$brand-coral};
    color: #{_tokens.$text-inverse};
    font-size: 10px;
    text-align: center;
  }
}

.identity {
  margin: #{_tokens.$sp-3};
  padding: #{_tokens.$sp-4};
  border-radius: #{_tokens.$radius-md};
  background: #{_tokens.$surface-dark};

  &__label {
    color: rgba(_tokens.$text-inverse, .45);
    font-size: 10px;
  }

  &__name {
    margin-top: 2px;
    font-size: 13px;
    font-weight: 600;
  }

  &__account {
    margin: 2px 0 #{_tokens.$sp-3};
    color: rgba(_tokens.$text-inverse, .5);
    font-size: 10px;
  }
}

.topbar {
  @include _mixins.flex-between;
  height: #{_tokens.$topbar-height};
  padding: 0 #{_tokens.$sp-8};
  background: #{_tokens.$card-white};
  border-bottom: 1px solid #{_tokens.$border-color};

  &__crumb {
    color: #{_tokens.$text-muted};
    font-size: 13px;

    strong {
      color: #{_tokens.$text-primary};
      font-weight: 600;
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
    background: #{_tokens.$brand-purple};
    color: #{_tokens.$text-inverse};
    font-size: 10px;
  }

  &__panel {
    position: absolute;
    right: 0;
    top: 38px;
    z-index: 20;
    width: 180px;
    padding: #{_tokens.$sp-2};
    border-radius: #{_tokens.$radius-md};
    background: _tokens.$card-white;
    box-shadow: #{_tokens.$shadow-modal};

    p {
      padding: #{_tokens.$sp-2};
      color: #{_tokens.$text-muted};
      font-size: 11px;
      border-bottom: 1px solid _tokens.$border-color;
    }

    button {
      display: block;
      width: 100%;
      padding: #{_tokens.$sp-2};
      text-align: left;
      font-size: 12px;
      border-radius: #{_tokens.$radius-sm};

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
  .layout__sidebar {
    width: 72px;
  }

  .layout__main {
    margin-left: 72px;
  }

  .brand__text,
  .nav-group__label,
  .nav-group__name,
  .identity {
    display: none;
  }

  .topbar__search {
    width: 140px;
  }
}
</style>
