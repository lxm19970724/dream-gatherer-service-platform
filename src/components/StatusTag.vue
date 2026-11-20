<!--
 * @Author: lixuming
 * @Date: 2026-11-19 14:52:45
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-20 17:04:37
 * @Description: 
 * @FilePath: \dream-gatherer-service-platform\src\components\StatusTag.vue
-->
<script setup lang="ts">
/** 状态 / 职位 / 来源标签：口径与原型 DB.STATUS / ROLES / SRC 一致 */
import { computed } from 'vue'

type Tone = 'purple' | 'coral' | 'yellow' | 'green' | 'gray' | 'blue'
interface Props {
  value: string
  label?: string
  tone?: Tone
}
const props = withDefaults(defineProps<Props>(), { label: '', tone: 'gray' })

const TONE_BY_VALUE: Record<string, Tone> = {
  active: 'green',
  published: 'green',
  approved: 'green',
  fulfilled: 'green',
  success: 'green',
  leader: 'purple',
  admin: 'purple',
  vice: 'blue',
  pending: 'coral',
  expiring: 'coral',
  rejected: 'coral',
  left: 'gray',
  removed: 'gray',
  draft: 'gray',
  locked: 'gray',
  expired: 'gray',
  elder: 'yellow',
  member: 'gray',
}
const resolvedTone = computed<Tone>(() => props.tone === 'gray' ? (TONE_BY_VALUE[props.value] ?? 'gray') : props.tone)
const text = computed(() => props.label || props.value)
</script>

<template>
  <span class="status-tag" :class="`tone-${resolvedTone}`">{{ text }}</span>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens' as _tokens;
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: #{_tokens.$radius-sm};
  font-size: 12px;
  line-height: 20px;
  background: rgba(_tokens.$text-muted, .12);
  color: _tokens.$text-secondary;
  white-space: nowrap;

  &.tone-purple {
    background: rgba(_tokens.$brand-purple, .12);
    color: _tokens.$brand-purple;
  }

  &.tone-coral {
    background: rgba(_tokens.$brand-coral, .14);
    color: _tokens.$brand-coral;
  }

  &.tone-yellow {
    background: rgba(_tokens.$brand-yellow, .24);
    color: rgba(_tokens.$brand-yellow, .28);
  }

  &.tone-green {
    background: rgba(_tokens.$color-success, .12);
    color: _tokens.$color-success;
  }

  &.tone-blue {
    background: rgba(_tokens.$color-info, .12);
    color: _tokens.$color-info;
  }
}
</style>
