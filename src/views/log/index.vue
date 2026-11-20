<script setup lang="ts">
/** 审计日志：登录审计（谁在什么时候从哪登录）+ 平台操作日志（谁改了什么） */
import { computed, onMounted, ref } from 'vue'
import { Input, Select, Tabs, TabPane } from 'ant-design-vue'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { auditApi, type AuditRow } from '@/api'
import type { OperationLog } from '@/types'

const activeTab = ref('login')
const keyword = ref('')
const resultFilter = ref('all')
const RESULT_LABEL: Record<string, string> = { success: '成功', fail: '失败' }

const allRows = ref<AuditRow[]>([])
const operationRows = ref<OperationLog[]>([])
async function loadAudits(): Promise<void> {
  const [login, ops] = await Promise.all([
    auditApi.listLoginAudits({ size: 1000 }),
    auditApi.listOperationLogs({ size: 1000 }),
  ])
  allRows.value = login.records
  operationRows.value = ops.records
}
onMounted(loadAudits)

const successCount = computed(() => allRows.value.filter((row) => row.result === 'success').length)
const failCount = computed(() => allRows.value.filter((row) => row.result === 'fail').length)
const riskCount = computed(() => allRows.value.filter((row) => row.risk === '高').length)

const rows = computed<Record<string, unknown>[]>(() => allRows.value.filter((row) => {
  if (resultFilter.value !== 'all' && row.result !== resultFilter.value) return false
  const query = keyword.value.trim().toLowerCase()
  if (!query) return true
  return [row.account, row.ip, row.device, row.time, row.action].some((value) => value.toLowerCase().includes(query))
}).map((row) => ({ ...row })))

/** 近 7 日登录柱状图（内联 SVG，无图表依赖） */
const chart = computed(() => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const day = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    const fullDate = `${date.getFullYear()}-${day}`
    const count = allRows.value.filter((row) => row.time.slice(0, 10) === fullDate).length
    return { day, count }
  })
  const max = Math.max(1, ...days.map((item) => item.count))
  return days.map((item) => ({ ...item, height: Math.max(4, Math.round((item.count / max) * 76)) }))
})

const columns: DataTableColumn[] = [
  { title: '账号', dataIndex: 'account', width: 170 },
  { title: '时间', dataIndex: 'time', width: 150 },
  { title: 'IP 地址', dataIndex: 'ip', width: 130 },
  { title: '设备', dataIndex: 'device', width: 160 },
  { title: '结果', dataIndex: 'result', width: 80 },
  { title: '风险', dataIndex: 'risk', width: 80 },
  { title: '操作对象', dataIndex: 'action', width: 110 },
]

/** 平台操作日志：记录权限相关的写操作，与登录行为分开 */
const operationColumns: DataTableColumn[] = [
  { title: '时间', dataIndex: 'time', width: 160 },
  { title: '操作人', dataIndex: 'actor', width: 160 },
  { title: '角色', dataIndex: 'role', width: 130 },
  { title: '动作', dataIndex: 'action', width: 170 },
  { title: '对象', dataIndex: 'target', width: 180 },
  { title: '详情', dataIndex: 'detail', width: 260 },
]
</script>

<template>
  <main class="dev-log">
    <PageHeader title="审计日志" subtitle="登录行为与平台操作留痕" eyebrow="AUDIT LOG" />
    <Tabs v-model:activeKey="activeTab">
      <TabPane key="login" tab="登录审计">
    <section class="dev-log__kpis">
      <KpiCard label="登录总次数" :value="allRows.length" tone="purple" />
      <KpiCard label="登录成功" :value="successCount" tone="success" />
      <KpiCard label="登录失败" :value="failCount" tone="coral" />
      <KpiCard label="高风险记录" :value="riskCount" tone="yellow" />
    </section>

    <section class="dev-log__grid">
      <article class="dev-log__panel">
        <h2>近 7 日登录趋势</h2>
        <svg class="dev-log__chart" viewBox="0 0 280 110" role="img" aria-label="近七日登录趋势">
          <line x1="8" y1="92" x2="272" y2="92" stroke="var(--border-color)" />
          <g v-for="(item, index) in chart" :key="item.day">
            <rect :x="14 + index * 38" :y="92 - item.height" width="20" :height="item.height" rx="4"
              fill="var(--brand-purple)" :opacity="0.55 + index * 0.05" />
            <text :x="24 + index * 38" y="106" text-anchor="middle" font-size="9" fill="var(--text-muted)">{{ item.day
              }}</text>
            <text :x="24 + index * 38" :y="86 - item.height" text-anchor="middle" font-size="9"
              fill="var(--text-secondary)">{{ item.count }}</text>
          </g>
        </svg>
      </article>
      <article class="dev-log__panel dev-log__risk">
        <h2>风险说明</h2>
        <p>风险等级由后端根据登录行为判定：</p>
        <ul>
          <li>
            <StatusTag value="低" tone="green" /> 常规登录
          </li>
          <li>
            <StatusTag value="中" tone="yellow" /> 异地或新设备
          </li>
          <li>
            <StatusTag value="高" tone="coral" /> 需人工复核
          </li>
        </ul>
      </article>
    </section>

    <section class="dev-log__panel dev-log__table">
      <div class="dev-log__toolbar">
        <h2>审计明细</h2>
        <div class="dev-log__filters">
          <Input v-model:value="keyword" placeholder="搜索账号 / IP / 设备" allow-clear class="dev-log__search" />
          <Select v-model:value="resultFilter"
            :options="[{ value: 'all', label: '全部结果' }, { value: 'success', label: '成功' }, { value: 'fail', label: '失败' }]"
            class="dev-log__select" />
        </div>
      </div>
      <DataTable :columns="columns" :rows="rows" :searchable="false" :page-size="10" empty-text="无匹配审计记录">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'result'">
            <StatusTag :value="String(record.result)"
              :label="RESULT_LABEL[String(record.result)] ?? String(record.result)"
              :tone="record.result === 'success' ? 'green' : 'coral'" />
          </template>
          <template v-else-if="column.dataIndex === 'risk'">
            <StatusTag :value="String(record.risk)"
              :tone="record.risk === '高' ? 'coral' : record.risk === '中' ? 'yellow' : 'green'" />
          </template>
        </template>
      </DataTable>
    </section>
      </TabPane>

      <TabPane key="operations" tab="平台操作日志">
        <section class="dev-log__panel dev-log__table">
          <h2>操作留痕</h2>
          <p class="dev-log__ops-hint">记录新增租户、租户成交价调整与审批、账号重置等权限相关操作，回答「谁改了什么」。</p>
          <DataTable :columns="operationColumns" :rows="operationRows" :searchable="false" :page-size="10"
            empty-text="暂无操作记录" />
        </section>
      </TabPane>
    </Tabs>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens' as _tokens;
@use '@/assets/scss/_mixins' as _mixins;
.dev-log {
  &__kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-5};
  }

  &__grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-5};
  }

  &__panel {
    @include _mixins.card;
    padding: #{_tokens.$sp-5};

    h2 {
      font-size: 16px;
      margin-bottom: #{_tokens.$sp-4};
    }
  }

  &__chart {
    width: 100%;
    max-width: 320px;
  }

  &__risk {
    p {
      color: #{_tokens.$text-secondary};
      font-size: 12px;
      line-height: 1.7;
    }

    ul {
      display: grid;
      gap: #{_tokens.$sp-2};
      margin-top: #{_tokens.$sp-3};
      font-size: 12px;
      color: #{_tokens.$text-secondary};

      li {
        display: flex;
        align-items: center;
        gap: #{_tokens.$sp-2};
      }
    }
  }

  &__toolbar {
    @include _mixins.flex-between;
    gap: #{_tokens.$sp-3};
    margin-bottom: #{_tokens.$sp-4};
  }

  &__filters {
    display: flex;
    gap: #{_tokens.$sp-2};
  }

  &__search {
    width: 220px;
  }

  &__select {
    width: 120px;
  }

  &__ops-hint {
    color: _tokens.$text-muted;
    font-size: 12px;
    line-height: 1.7;
    margin-bottom: _tokens.$sp-4;
  }
}
</style>
