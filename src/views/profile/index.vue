<script setup lang="ts">
/** 个人中心：查看本人账号信息与权限，修改自己的登录密码 */
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { PlatformAction } from '@/types'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { ACTION_LABEL, PLATFORM_ROLE_LABEL, ROLE_PERMISSION_ROWS, logout, useAuth } from '@/stores/auth'
import { useApp } from '@/stores/app'
import { authApi } from '@/api'

const auth = useAuth()
const app = useApp()
const router = useRouter()

const currentUser = computed(() => app.platformUsers.find((user) => user.account === auth.account))
const permissions = computed(() => {
  const row = ROLE_PERMISSION_ROWS.find((item) => item.role === auth.role)
  return row?.actions.map((action) => ACTION_LABEL[action as PlatformAction]) ?? []
})

const pwdForm = reactive({ old: '', next: '', confirm: '' })

async function submitPassword(): Promise<void> {
  if (!pwdForm.old || !pwdForm.next) {
    message.warning('请填写原密码与新密码')
    return
  }
  if (pwdForm.next !== pwdForm.confirm) {
    message.error('两次输入的新密码不一致')
    return
  }
  try {
    await authApi.changePassword({ oldPassword: pwdForm.old, newPassword: pwdForm.next })
    message.success('密码已修改，下次登录请使用新密码')
    pwdForm.old = ''
    pwdForm.next = ''
    pwdForm.confirm = ''
  } catch (error) {
    message.error(error instanceof Error ? error.message : '修改失败')
  }
}

async function onLogout(): Promise<void> {
  await authApi.logout()
  logout()
  router.push('/login')
}
</script>

<template>
  <main class="dev-profile">
    <PageHeader title="个人中心" subtitle="查看账号信息与权限，修改登录密码" eyebrow="PROFILE">
      <template #actions>
        <button type="button" class="dev-profile__logout" @click="onLogout">退出登录</button>
      </template>
    </PageHeader>

    <section class="dev-profile__grid">
      <article class="dev-profile__card">
        <div class="dev-profile__identity">
          <span class="dev-profile__avatar">{{ auth.name.slice(0, 1) }}</span>
          <div>
            <h2>{{ auth.name }}</h2>
            <p>{{ PLATFORM_ROLE_LABEL[auth.role] }}</p>
          </div>
        </div>
        <div class="dev-profile__row"><span>登录账号</span><strong class="font-number">{{ auth.account }}</strong></div>
        <div class="dev-profile__row"><span>账号状态</span>
          <StatusTag :value="currentUser?.status ?? 'active'" :label="currentUser?.status === 'disabled' ? '已停用' : '已启用'"
            :tone="currentUser?.status === 'disabled' ? 'gray' : 'green'" />
        </div>
        <div class="dev-profile__row"><span>创建时间</span><strong>{{ currentUser?.createdAt ?? '—' }}</strong></div>
        <div class="dev-profile__row"><span>最近登录</span><strong class="font-number">{{ currentUser?.lastLogin ?? '—' }}</strong></div>
        <div class="dev-profile__row"><span>创建人</span><strong>{{ currentUser?.createdBy ?? '—' }}</strong></div>
      </article>

      <article class="dev-profile__card">
        <h2>我的权限</h2>
        <p class="dev-profile__hint">菜单固定可见，以下为本账号可执行的具体操作：</p>
        <ul class="dev-profile__perms">
          <li v-for="item in permissions" :key="item">✓ {{ item }}</li>
        </ul>
        <p class="dev-profile__hint">如需调整权限，请联系初始管理员在「平台用户」中变更角色。</p>
      </article>
    </section>

    <section class="dev-profile__card dev-profile__password">
      <h2>修改密码</h2>
      <form class="dev-profile__form" @submit.prevent="submitPassword">
        <label>原密码<input v-model="pwdForm.old" type="password" autocomplete="current-password" placeholder="请输入原密码" /></label>
        <label>新密码<input v-model="pwdForm.next" type="password" autocomplete="new-password" placeholder="至少 6 位" /></label>
        <label>确认新密码<input v-model="pwdForm.confirm" type="password" autocomplete="new-password" placeholder="再次输入新密码" /></label>
        <button type="submit" class="dev-profile__primary">保存密码</button>
      </form>
    </section>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens' as _tokens;
@use '@/assets/scss/_mixins' as _mixins;

.dev-profile {
  &__logout {
    padding: 8px 18px;
    border: 1px solid _tokens.$border-color;
    border-radius: _tokens.$radius-md;
    background: _tokens.$card-white;
    color: _tokens.$color-danger;
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: _tokens.$sp-4;
    margin-bottom: _tokens.$sp-4;
  }

  &__card {
    @include _mixins.card;
    padding: _tokens.$sp-6;

    h2 {
      font-size: 16px;
      margin-bottom: _tokens.$sp-4;
    }
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: _tokens.$sp-3;
    margin-bottom: _tokens.$sp-5;

    h2 {
      margin: 0;
    }

    p {
      color: _tokens.$text-muted;
      font-size: 12px;
    }
  }

  &__avatar {
    @include _mixins.flex-center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
    font-size: 18px;
  }

  &__row {
    @include _mixins.flex-between;
    gap: _tokens.$sp-3;
    padding: _tokens.$sp-3 0;
    border-bottom: 1px solid _tokens.$border-color;
    font-size: 12px;

    span {
      color: _tokens.$text-secondary;
    }
  }

  &__hint {
    color: _tokens.$text-muted;
    font-size: 12px;
    line-height: 1.7;
    margin-bottom: _tokens.$sp-3;
  }

  &__perms {
    display: grid;
    gap: _tokens.$sp-2;
    margin-bottom: _tokens.$sp-4;
    color: _tokens.$text-secondary;
    font-size: 12px;
  }

  &__form {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: _tokens.$sp-3;
    align-items: end;

    label {
      display: grid;
      gap: _tokens.$sp-2;
      color: _tokens.$text-secondary;
      font-size: 12px;
    }

    input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid _tokens.$border-color;
      border-radius: _tokens.$radius-md;
      background: _tokens.$card-white;
    }
  }

  &__primary {
    padding: 9px 20px;
    border-radius: _tokens.$radius-md;
    background: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
    font-size: 13px;
  }
}
</style>
