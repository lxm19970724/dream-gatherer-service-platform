<!--
 * @Author: lixuming
 * @Date: 2026-11-19 14:52:45
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-19 17:57:16
 * @Description: 
 * @FilePath: \dream-center-family-manage\src\components\PageHeader.vue
-->
<script setup lang="ts">
/** 统一页头：标题 + 副标题 + 右侧操作区（对应画板 24 规范） */
interface Props {
  title: string
  subtitle?: string
  eyebrow?: string
}
withDefaults(defineProps<Props>(), { subtitle: '', eyebrow: '' })
</script>

<template>
  <header class="page-header">
    <div class="page-header__text">
      <p v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_mixins' as _mixins;
@use '@/assets/scss/_tokens' as _tokens;
.page-header {
  @include _mixins.flex-between;
  gap: _tokens.$sp-4;
  margin-bottom: _tokens.$sp-6;
  &__eyebrow {
    color: _tokens.$brand-purple;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .08em;
    margin-bottom: _tokens.$sp-1;
  }
  &__title {
    font-size: 26px;
    color: _tokens.$text-primary;
    line-height: 1.3;
  }
  &__subtitle {
    margin-top: _tokens.$sp-1;
    color: _tokens.$text-secondary;
    font-size: 14px;
  }
  &__actions {
    display: flex;
    align-items: center;
    gap: _tokens.$sp-2;
    flex-shrink: 0;
  }
}
</style>
