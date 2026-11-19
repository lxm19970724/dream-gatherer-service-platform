<script lang="ts">
export default { name: 'FeishuIcon' }
</script>

<script setup lang="ts">
/**
 * FeishuIcon
 * 飞书图标（用于「飞书账号一键登录」按钮）。
 * 说明：原 React 版本通过 type 传入 iconfont 类名；Vue 版改为内联 SVG，
 *      避免额外引入 iconfont 资源，同时保留 type 参数以兼容调用方。
 */
interface Props {
  type?: string
  size?: number
}

withDefaults(defineProps<Props>(), {
  type: 'icon-feishu',
  size: 18,
})
</script>

<template>
  <svg
    class="feishu-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :data-type="type"
    aria-hidden="true"
  >
    <path
      d="M3.2 15.1c4.6.6 8.9-1.1 11.9-4.2 1.6-1.6 2.7-3.4 3.3-4.9.3-.7.1-1.4-.6-1.6-.6-.2-1.2.1-1.6.6-.9 1.1-2.1 2.1-3.5 2.9-2.6 1.5-5.6 2-8.4 1.6-.9-.1-1.7.5-1.8 1.4-.1.9.5 1.7 1.4 1.8l-.7 2.4Z"
      fill="#3370FF"
    />
    <path
      d="M5.4 19.4c3 .4 5.9-.6 8.1-2.6.9-.8 1.6-1.8 2.1-2.8.4-.8 0-1.6-.8-1.8-.7-.2-1.4.2-1.8.8-.6.9-1.4 1.6-2.3 2.1-1.7 1-3.7 1.3-5.5 1-.8-.1-1.6.5-1.7 1.3-.1.9.5 1.6 1.4 1.7l.5.3Z"
      fill="#00D6B9"
      fill-opacity="0.85"
    />
    <path
      d="M9.9 21.4c2.1.3 4.2-.4 5.7-1.8.6-.6 1.1-1.2 1.5-1.9.3-.6 0-1.3-.6-1.5-.5-.2-1.1.1-1.4.6-.4.6-.9 1.1-1.5 1.5-1.2.7-2.6.9-3.9.7-.7-.1-1.3.4-1.4 1.1-.1.7.4 1.3 1.1 1.4l.5-.1Z"
      fill="#3370FF"
      fill-opacity="0.7"
    />
  </svg>
</template>

<style scoped lang="scss">
.feishu-icon {
  display: inline-block;
  vertical-align: -0.15em;
}
</style>
