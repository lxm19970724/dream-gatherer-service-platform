<script setup lang="ts">
/** 登录审计（画板 18）：登录 KPI + 风险分布 + 审计明细表 */
import { computed, ref } from 'vue'
import { Input, Select } from 'ant-design-vue'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { PLATFORM_LOGINS } from '@/mock/audit'
import { hashUid } from '@/mock/utils'

const keyword = ref('')
const resultFilter = ref('all')
const DEVICES = ['Chrome / Windows', 'Safari / macOS', 'Edge / Windows', '小程序 H5']
const RESULT_LABEL: Record<string, string> = { success: '成功', fail: '失败' }

interface AuditRow {
  id: string
  account: string
  time: string
  ip: string
  device: string
  result: 'success' | 'fail'
  risk: '低' | '中' | '高'
  action: string
}
const allRows: AuditRow[] = PLATFORM_LOGINS.map((record) => {
  const hash = hashUid(record.ip + record.time)
  return {
    id: record.id,
    account: record.who,
    time: record.time,
    ip: record.ip,
    device: DEVICES[hash % DEVICES.length] as string,
    result: record.action.includes('失败') ? 'fail' : 'success',
    risk: hash % 11 === 0 ? '高' : hash % 4 === 0 ? '中' : '低',
    action: record.target,
  }
})

const successCount = computed(() => allRows.filter((row) => row.result === 'success').length)
const failCount = computed(() => allRows.filter((row) => row.result === 'fail').length)
const riskCount = computed(() => allRows.filter((row) => row.risk === '高').length)

const rows = computed<Record<string, unknown>[]>(() => allRows.filter((row) => {
  if (resultFilter.value !== 'all' && row.result !== resultFilter.value) return false
  const query = keyword.value.trim().toLowerCase()
  if (!query) return true
  return [row.account, row.ip, row.device, row.time, row.action].some((value) => value.toLowerCase().includes(query))
}).map((row) => ({ ...row })))

/** 近 7 日登录柱状图（内联 SVG，无图表依赖） */
const chart = computed(() => {
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = String(9 + index).padStart(2, '0')
    const count = allRows.filter((row) => row.time.slice(8, 10) === day).length
    return { day: `11-${day}`, count }
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
</script>

<template>
  <main class="dev-log">
    <PageHeader title="登录审计" subtitle="平台账号登录行为与风险识别" eyebrow="AUDIT LOG" />
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
        <p>风险等级由 IP 与登录时间哈希派生，仅作前端演示：</p>
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
}
</style>
