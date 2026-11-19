/*
 * @Author: lixuming
 * @Date: 2026-11-18 09:16:58
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-18 11:15:32
 * @Description: 
 * @FilePath: \dream-center-family-manage\src\main.ts
 */
import { createApp } from 'vue'
import '@/assets/scss/index.scss'
import App from './App.vue'
import router from './router'

// 使用antd
import useAntd from './ant-design-vue'


const app = createApp(App)
useAntd(app)
app.use(router)
app.mount('#app')
