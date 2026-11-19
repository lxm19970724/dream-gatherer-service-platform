<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue'
import { antdTheme } from '@/theme/antd'
</script>

<template>
  <ConfigProvider :theme="antdTheme">
    <router-view />
  </ConfigProvider>
</template>
