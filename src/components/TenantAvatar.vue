<script setup lang="ts">
/** 租户头像：《忍者必须死3》公开家族头像，按预设 ID 取本地图片。 */
import { computed } from 'vue'
import { avatarOf } from './tenantAvatars'

const props = withDefaults(defineProps<{ variant?: string; size?: number }>(), {
  variant: 'champion',
  size: 36,
})

const option = computed(() => avatarOf(props.variant))
</script>

<template>
  <span class="tenant-avatar" role="img" :aria-label="`${option.label}头像`" :title="option.label"
    :style="{ width: `${size}px`, height: `${size}px`, background: option.color }">
    <img :src="option.src" alt="" loading="lazy" />
  </span>
</template>

<style scoped lang="scss">
.tenant-avatar {
  display: inline-flex;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
