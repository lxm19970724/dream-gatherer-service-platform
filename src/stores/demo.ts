/** 演示内存态：所有写操作后续由 services/actions 修改此单例，组件不直接改嵌套对象。 */
import { reactive } from 'vue'
import { createInitialState, type DemoState } from '@/mock'

const state = reactive<DemoState>(createInitialState())

export function useDemo(): DemoState {
  return state
}

/** 重置演示数据：对应各端「重置演示数据」按钮 */
export function resetDemo(): void {
  Object.assign(state, createInitialState())
}

export default useDemo
