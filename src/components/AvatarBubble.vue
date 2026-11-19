<script setup lang="ts">
/** 渐变头像：按姓名哈希取色，零图片请求 */
import { computed } from 'vue'
import { hashUid } from '@/mock/utils'

interface Props {
  name: string
  size?: number
}
const props = withDefaults(defineProps<Props>(), { size: 36 })

const GRADIENTS: readonly [string, string][] = [
  ['var(--brand-purple)', 'var(--color-info)'],
  ['var(--brand-coral)', 'var(--brand-yellow)'],
  ['var(--color-success)', 'var(--color-info)'],
  ['var(--brand-purple)', 'var(--brand-coral)'],
]
const style = computed(() => {
  const [from, to] = GRADIENTS[hashUid(props.name) % GRADIENTS.length] as [string, string]
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    fontSize: `${Math.round(props.size * 0.42)}px`,
    background: `linear-gradient(135deg, ${from}, ${to})`,
  }
})
const initial = computed(() => (props.name.trim().charAt(0) || '?').toUpperCase())
</script>

<template>
  <span class="avatar-bubble" :style="style" :title="name">{{ initial }}</span>
</template>

<style scoped lang="scss">
.avatar-bubble {
  @include flex-center;
  flex-shrink: 0;
  color: $text-inverse;
  border-radius: 50%;
  font-weight: 600;
  line-height: 1;
}
</style>
