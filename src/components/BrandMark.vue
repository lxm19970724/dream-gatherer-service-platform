<script setup lang="ts">
/**
 * 聚梦者服务品牌标志：四角星内核 + 环绕轨道 + 三颗心愿星点。
 * 纯 SVG、颜色跟随 currentColor，深色侧栏与浅色顶栏都能用。
 * 折叠态只显示图形，展开态由外部搭配文字。
 */
withDefaults(defineProps<{ size?: number; glow?: boolean }>(), {
  size: 34,
  glow: false,
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"
    class="brand-mark" :class="{ 'brand-mark--glow': glow }">
    <!-- 外环轨道：象征汇聚 -->
    <circle cx="24" cy="24" r="19" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 4" opacity=".55" />
    <path d="M24 5a19 19 0 0 1 16.5 28.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".9" />
    <!-- 四角星内核：主品牌符号 -->
    <path d="M24 11.5c.9 5.6 2.9 7.6 8.5 8.5-5.6.9-7.6 2.9-8.5 8.5-.9-5.6-2.9-7.6-8.5-8.5 5.6-.9 7.6-2.9 8.5-8.5z"
      fill="currentColor" />
    <path d="M24 27.5c.5 3.1 1.6 4.2 4.7 4.7-3.1.5-4.2 1.6-4.7 4.7-.5-3.1-1.6-4.2-4.7-4.7 3.1-.5 4.2-1.6 4.7-4.7z"
      fill="currentColor" opacity=".65" />
    <!-- 三颗心愿星点 -->
    <circle cx="38.5" cy="10" r="2" fill="currentColor" />
    <circle cx="9" cy="30" r="1.6" fill="currentColor" opacity=".8" />
    <circle cx="34" cy="40" r="1.4" fill="currentColor" opacity=".7" />
  </svg>
</template>

<style scoped lang="scss">
.brand-mark {
  display: block;
  flex-shrink: 0;

  &--glow {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, .35));
  }
}
</style>
