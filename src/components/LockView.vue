<script setup lang="ts">
/** 404 占位：平台菜单固定、无页面级权限拦截，故仅承担「页面不存在」提示 */
import { useRouter } from 'vue-router'
import { Button } from 'ant-design-vue'

const router = useRouter()
</script>

<template>
  <main class="lock-view">
    <div class="lock-view__card">
      <div class="lock-view__icon" aria-hidden="true">🧭</div>
      <h1>页面不存在</h1>
      <p class="lock-view__desc">你访问的页面已移除或地址有误，回到运营总览继续操作。</p>
      <Button type="primary" @click="router.push('/dev-overview')">回到运营总览</Button>
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
}
</style>
