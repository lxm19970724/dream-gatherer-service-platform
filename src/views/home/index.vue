<template>
  <main class="home">
    <h1>聚梦者 · 家族租户服务平台</h1>
    <p>已登录身份：平台管理员。运营总览入口已就绪。</p>
  </main>
</template>

<script setup lang="ts">
// 租户端 home 占位；正式运营总览见 views/dev/overview.vue（T02 实现）
</script>

<style lang="scss" scoped>
.home {
  @include flex-center;
  flex-direction: column;
  gap: $sp-3;
  min-height: 100vh;
  color: $text-primary;
  h1 { font-size: 32px; color: $brand-purple; }
  p { color: $text-secondary; }
}
</style>
