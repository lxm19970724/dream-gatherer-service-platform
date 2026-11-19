<!--
 * @Author: lixuming
 * @Date: 2026-11-19 14:52:45
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-19 17:25:59
 * @Description: 
 * @FilePath: \dream-center-family-manage\src\components\KpiCard.vue
-->
<script setup lang="ts">
/** KPI 卡：主紫 / 珊瑚 / 明黄 / 成功绿四色循环，配色只读令牌 */
import { computed } from 'vue'

type Tone = 'purple' | 'coral' | 'yellow' | 'success'
interface Props {
  label: string
  value: string | number
  trend?: string
  hint?: string
  tone?: Tone
}
const props = withDefaults(defineProps<Props>(), { trend: '', hint: '', tone: 'purple' })
const toneClass = computed(() => `tone-${props.tone}`)
</script>

<template>
  <article class="kpi-card" :class="toneClass">
    <p class="kpi-card__label">{{ label }}</p>
    <p class="kpi-card__value font-number">{{ value }}</p>
    <p v-if="trend || hint" class="kpi-card__foot">
      <span v-if="trend" class="kpi-card__trend">{{ trend }}</span>
      <span v-if="hint" class="kpi-card__hint">{{ hint }}</span>
    </p>
    <slot />
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens.scss' as _tokens;
@use '@/assets/scss/_mixins.scss' as _mixins;

.kpi-card {
  @include _mixins.card;
  position: relative;
  padding: #{_tokens.$sp-5};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: _tokens.$brand-purple;
  }

  &.tone-coral::before {
    background: _tokens.$brand-coral;
  }

  &.tone-yellow::before {
    background: _tokens.$brand-yellow;
  }

  &.tone-success::before {
    background: _tokens.$color-success;
  }

  &__label {
    color: _tokens.$text-secondary;
    font-size: 13px;
  }

  &__value {
    margin-top: #{_tokens.$sp-2};
    font-size: 30px;
    font-weight: 600;
    color: _tokens.$text-primary;
  }

  &__foot {
    margin-top: #{_tokens.$sp-2};
    display: flex;
    gap: #{_tokens.$sp-2};
    font-size: 12px;
  }

  &__trend {
    color: _tokens.$color-success;
  }

  &__hint {
    color: _tokens.$text-muted;
  }
}
</style>
