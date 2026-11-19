<!--
 * @Author: lixuming
 * @Date: 2026-11-19 14:52:45
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-19 17:23:11
 * @Description: 
 * @FilePath: \dream-center-family-manage\src\components\DataTable.vue
-->
<script setup lang="ts">
/** 通用表格：列配置驱动，内置搜索与分页，基于 antd Table 封装 */
import { computed, ref } from 'vue'
import { Table, Input } from 'ant-design-vue'

export interface DataTableColumn {
  title: string
  dataIndex: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns: DataTableColumn[]
  rows: Record<string, unknown>[]
  rowKey?: string
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  emptyText?: string
}
const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  searchable: true,
  searchPlaceholder: '搜索…',
  pageSize: 10,
  emptyText: '暂无数据',
})

const keyword = ref('')
const tableColumns = computed(() => props.columns.map((column) => ({
  title: column.title,
  dataIndex: column.dataIndex,
  key: column.dataIndex,
  width: column.width,
  align: column.align ?? 'left',
})))

const filteredRows = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return props.rows
  const keys = props.columns.map((column) => column.dataIndex)
  return props.rows.filter((row) => keys.some((key) => String(row[key] ?? '').toLowerCase().includes(query)))
})

const pagination = computed(() => ({ pageSize: props.pageSize, showSizeChanger: false, hideOnSinglePage: false }))

/** 未提供 #cell 插槽时的默认单元格渲染，避免自定义列导致空白 */
function displayValue(record: Record<string, unknown>, column: { dataIndex?: unknown }): string {
  const dataIndex = column.dataIndex
  const key = Array.isArray(dataIndex) ? dataIndex.join('.') : String(dataIndex ?? '')
  const value = record[key]
  return value === null || value === undefined ? '' : String(value)
}
</script>

<template>
  <section class="data-table">
    <div v-if="searchable" class="data-table__toolbar">
      <Input v-model:value="keyword" :placeholder="searchPlaceholder" allow-clear class="data-table__search" />
      <slot name="toolbar" />
    </div>
    <Table
      :columns="tableColumns"
      :data-source="filteredRows"
      :row-key="rowKey"
      :pagination="pagination"
      :locale="{ emptyText }"
      size="middle"
    >
      <template #bodyCell="{ column, record, text }">
        <slot name="cell" :column="column" :record="record" :text="text">
          <span class="data-table__default-cell">{{ displayValue(record, column) }}</span>
        </slot>
      </template>
    </Table>
  </section>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_mixins' as _mixins;
@use '@/assets/scss/_tokens' as _tokens;
.data-table {
  &__toolbar {
    @include _mixins.flex-between;
    gap: _tokens.$sp-3;
    margin-bottom: _tokens.$sp-4;
  }
  &__search { max-width: 280px; }
}
</style>
