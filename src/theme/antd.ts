/**
 * Ant Design Vue 主题令牌（规范源 · 三端同步）
 * 色值与 _tokens.scss 一一对应；业务组件不得自行覆盖品牌色。
 * 侧栏深色的菜单令牌由布局 SCSS 控制（避免 antd rc 版本组件令牌差异）。
 */
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#6C4CF0',
    colorInfo: '#6C4CF0',
    colorSuccess: '#12B76A',
    colorWarning: '#FF7A50',
    colorError: '#F04438',
    colorText: '#1E1E1E',
    colorTextSecondary: '#6B7280',
    colorBgLayout: '#FAFAFA',
    colorBgContainer: '#FFFFFF',
    borderRadius: 12,
    borderRadiusLG: 16,
    fontFamily: "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif",
    fontSize: 14,
  },
  components: {
    Table: {
      colorBgContainer: '#FFFFFF',
      colorTextDescription: '#6B7280',
      colorSplit: '#EEF0F4',
      controlItemBgHover: '#F7F5FF',
    },
    Card: { paddingLG: 24 },
    Button: { fontWeightStrong: 500 },
  },
}

export default antdTheme
