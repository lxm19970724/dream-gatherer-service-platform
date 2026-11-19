/*
 * @Author: lixuming
 * @Date: 2026-11-18 09:16:58
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-19 16:22:22
 * @Description: 
 * @FilePath: \dream-center-family-manage\vite.config.ts
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// 三端统一：@ → src；SCSS 自动注入令牌与 mixin。
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.join(import.meta.dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false,
        additionalData: `
          @use "@/assets/scss/_tokens.scss";
          @use "@/assets/scss/_mixins.scss";
        `,
      },
    },
  },
})
