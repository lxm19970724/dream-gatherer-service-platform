/**
 * Ant Design Vue 按需注册（规范源 · 租户端/家族端同步）
 * 登录页原有 Input/Button/Form/FormItem 保持不变，按架构要求扩展常用组件。
 */
import type { App } from 'vue'
import {
  Input,
  Button,
  Form,
  FormItem,
  Table,
  Modal,
  Select,
  SelectOption,
  Tabs,
  TabPane,
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

const components = [
  Input,
  Button,
  Form,
  FormItem,
  Table,
  Modal,
  Select,
  SelectOption,
  Tabs,
  TabPane,
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

/** 全局注册业务页面所需的 antd 组件 */
function useAntd(app: App): void {
  components.forEach((component) => {
    app.use(component)
  })
}

export default useAntd
