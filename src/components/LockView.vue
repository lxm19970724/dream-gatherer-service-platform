<!--
 * @Author: lixuming
 * @Date: 2026-11-19 14:52:45
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-19 16:54:24
 * @Description: 
 * @FilePath: \dream-center-family-manage\src\components\LockView.vue
-->
<script setup lang="ts">
/** 无权 / 不存在页面占位（对应原型 lockView） */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'ant-design-vue'
import { homePathOf, ROLE_LABEL, useSession } from '@/stores/session'

interface Props { pageId?: string }
const props = withDefaults(defineProps<Props>(), { pageId: '' })
const router = useRouter()
const session = useSession()
const roleLabel = computed(() => ROLE_LABEL[session.role] ?? '访客')
const fallbackPath = computed(() => homePathOf(session.role))

function goBack(): void {
  const target = fallbackPath.value
  router.push(target === '/login' ? '/' : target)
}
</script>

<template>
  <main class="lock-view">
    <div class="lock-view__card">
      <div class="lock-view__icon" aria-hidden="true">🔒</div>
      <h1>无权访问该页面</h1>
      <p class="lock-view__desc">
        当前身份「{{ roleLabel }}」没有页面
        <code v-if="pageId">{{ pageId }}</code>
        的访问权限，或该页面尚不存在。
      </p>
      <Button type="primary" @click="goBack">回到可用页</Button>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens.scss' as _tokens;
@use '@/assets/scss/_mixins.scss' as _mixins;

.lock-view {
  @include _mixins.flex-center;
  min-height: 100vh;
  padding: #{_tokens.$sp-6};
  background: #{_tokens.$bg-page};

  &__card {
    @include _mixins.card;
    max-width: 460px;
    width: 100%;
    padding: #{_tokens.$sp-10} #{_tokens.$sp-8};
    text-align: center;
  }

  &__icon {
    font-size: 42px;
    margin-bottom: #{_tokens.$sp-4};
  }

  h1 {
    font-size: 22px;
    margin-bottom: #{_tokens.$sp-3};
  }

  &__desc {
    color: #{_tokens.$text-secondary};
    margin-bottom: #{_tokens.$sp-6};
    line-height: 1.7;
  }

  code {
    color: #{_tokens.$brand-purple};
  }
}
</style>
