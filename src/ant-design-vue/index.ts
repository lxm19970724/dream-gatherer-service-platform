/**
 * Ant Design Vue 按需注册（规范源 · 租户端/家族端同步）
 * 登录页原有 Input/Button/Form/FormItem 保持不变，按架构要求扩展常用组件。
 */
import type { App, Component, Plugin } from 'vue'
import {
  Input,
  Button,
  Form,
  Table,
  Modal,
  Select,
  Tabs,
  Tag,
  Drawer,
  Cascader,
  Upload,
  Card,
  Row,
  Col,
  Space,
  InputNumber,
  Checkbox,
  Radio,
  Switch,
  DatePicker,
  Tooltip,
  Popconfirm,
  Dropdown,
  Menu,
  Badge,
  Avatar,
  Empty,
  Spin,
  Divider,
  Segmented,
  Slider,
} from 'ant-design-vue'

type AntdRegistration = Plugin | Component

const components: AntdRegistration[] = [
  Input,
  Button,
  Form,
  Table,
  Modal,
  Select,
  Tabs,
  Tag,
  Drawer,
  Cascader,
  Upload,
  Card,
  Row,
  Col,
  Space,
  InputNumber,
  Checkbox,
  Radio,
  Switch,
  DatePicker,
  Tooltip,
  Popconfirm,
  Dropdown,
  Menu,
  Badge,
  Avatar,
  Empty,
  Spin,
  Divider,
  Segmented,
  Slider,
]

type NamedComponent = Component & {
  name?: string
  displayName?: string
}

/** 全局注册业务页面所需的 antd 组件 */
function useAntd(app: App): void {
  components.forEach((component) => {
    const install = (component as { install?: unknown } | null)?.install
    if (typeof install === 'function') {
      app.use(component as Plugin)
      return
    }

    const named = component as NamedComponent
    const componentName = named.displayName || named.name
    if (componentName) {
      app.component(componentName, component as Component)
    }
  })
}

export default useAntd
