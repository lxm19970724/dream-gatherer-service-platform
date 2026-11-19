<script setup lang="ts">
/** 套餐与续费（画板 10/17 派生）：套餐卡片 + 续费记录 + 续费动作 */
import { computed, ref } from 'vue'
import { Select, message } from 'ant-design-vue'
import type { Tenant } from '@/types'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useDemo } from '@/stores/demo'
import { can, useSession } from '@/stores/session'

const demo = useDemo()
const session = useSession()

const PRICE: Record<Tenant['plan'], number> = { 旗舰版: 12800, 标准版: 6800, 基础版: 2800 }
const PLANS: Tenant['plan'][] = ['旗舰版', '标准版', '基础版']
const PLAN_FEATURES: Record<Tenant['plan'], string[]> = {
  旗舰版: ['100 席位', '登录审计', '优先支持'],
  标准版: ['60 席位', '积分与兑换', '标准支持'],
  基础版: ['30 席位', '成员与战报', '社区支持'],
}

interface RenewRecord {
  id: string
  tenant: string
  plan: Tenant['plan']
  seats: number
  amount: number
  date: string
  expireAt: string
  method: string
}
const records = ref<RenewRecord[]>(demo.tenants.map((tenant, index) => ({
  id: `BI${String(index + 1).padStart(3, '0')}`,
  tenant: tenant.name,
  plan: tenant.plan,
  seats: tenant.seats,
  amount: PRICE[tenant.plan],
  date: '2026-01-08',
  expireAt: tenant.expireAt,
  method: '对公转账',
})))

const targetId = ref(demo.tenants[0]?.id ?? '')
const targetPlan = ref<Tenant['plan']>(demo.tenants[0]?.plan ?? '标准版')
const targetMonths = ref(12)
const confirmOpen = ref(false)

const tenantOptions = computed(() => demo.tenants.map((tenant) => ({ value: tenant.id, label: tenant.name })))
const planOptions = PLANS.map((plan) => ({ value: plan, label: plan }))
const monthOptions = [{ value: 12, label: '12 个月' }, { value: 24, label: '24 个月' }, { value: 36, label: '36 个月' }]

const annualRevenue = computed(() => records.value.reduce((sum, record) => sum + record.amount, 0))
const warningCount = computed(() => demo.tenants.filter((tenant) => tenant.status === 'expiring' || tenant.status === 'expired').length)

const columns: DataTableColumn[] = [
  { title: '租户', dataIndex: 'tenant', width: 200 },
  { title: '套餐', dataIndex: 'plan', width: 90 },
  { title: '席位', dataIndex: 'seats', width: 80 },
  { title: '金额（元）', dataIndex: 'amount', width: 110 },
  { title: '续费日期', dataIndex: 'date', width: 110 },
  { title: '到期日期', dataIndex: 'expireAt', width: 110 },
  { title: '支付方式', dataIndex: 'method', width: 100 },
  { title: '状态', dataIndex: 'state', width: 90 },
]

function askRenew(): void {
  if (!can('dev-billing', session)) {
    message.error('当前角色无权续费')
    return
  }
  confirmOpen.value = true
}

function applyRenew(): void {
  const tenant = demo.tenants.find((item) => item.id === targetId.value)
  if (!tenant) return
  const next = new Date(`${tenant.expireAt}T00:00:00`)
  next.setMonth(next.getMonth() + targetMonths.value)
  tenant.expireAt = next.toISOString().slice(0, 10)
  tenant.plan = targetPlan.value
  tenant.status = 'active'
  records.value.unshift({
    id: `BI${String(records.value.length + 1).padStart(3, '0')}`,
    tenant: tenant.name,
    plan: targetPlan.value,
    seats: tenant.seats,
    amount: PRICE[targetPlan.value] * (targetMonths.value / 12),
    date: next.toISOString().slice(0, 10).slice(0, 4) + '-01-08',
    expireAt: tenant.expireAt,
    method: '对公转账',
  })
  confirmOpen.value = false
  message.success(`${tenant.short} 套餐续费成功`)
}
</script>

<template>
  <main class="dev-billing">
    <PageHeader title="套餐与续费" subtitle="套餐版本、席位配置与续费记录" eyebrow="BILLING" />
    <section class="dev-billing__kpis">
      <KpiCard label="累计续费金额" :value="`¥ ${annualRevenue.toLocaleString()}`" tone="purple" />
      <KpiCard label="订阅租户" :value="demo.tenants.length" tone="success" />
      <KpiCard label="到期预警" :value="warningCount" tone="coral" />
    </section>

    <section class="dev-billing__plans">
      <article v-for="plan in PLANS" :key="plan" class="dev-billing__plan">
        <p class="dev-billing__plan-name">{{ plan }}</p>
        <p class="font-number dev-billing__plan-price">¥ {{ PRICE[plan].toLocaleString() }}<small>/年</small></p>
        <ul>
          <li v-for="feature in PLAN_FEATURES[plan]" :key="feature">✓ {{ feature }}</li>
        </ul>
      </article>
    </section>

    <section class="dev-billing__panel">
      <div class="dev-billing__toolbar">
        <h2>续费记录</h2>
        <div class="dev-billing__form">
          <Select v-model:value="targetId" :options="tenantOptions" class="dev-billing__select" />
          <Select v-model:value="targetPlan" :options="planOptions" class="dev-billing__select" />
          <Select v-model:value="targetMonths" :options="monthOptions" class="dev-billing__select" />
          <button type="button" class="dev-billing__primary" @click="askRenew">发起续费</button>
        </div>
      </div>
      <DataTable :columns="columns" :rows="records" :searchable="false" :page-size="8">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'state'">
            <StatusTag value="success" label="已完成" tone="green" />
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <span class="font-number">¥ {{ Number(record.amount).toLocaleString() }}</span>
          </template>
        </template>
      </DataTable>
    </section>

    <ConfirmModal :open="confirmOpen" title="确认发起续费？" content="续费后租户状态将恢复为在服务，并延长到期日期。" confirm-text="确认续费"
      @confirm="applyRenew" @cancel="confirmOpen = false" />
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens' as _tokens;
@use '@/assets/scss/_mixins' as _mixins;
.dev-billing {
  &__kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-5};
  }

  &__plans {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-5};
  }

  &__plan {
    @include _mixins.card;
    padding: #{_tokens.$sp-5};
    border-top: 3px solid _tokens.$brand-purple;

    &-name {
      font-size: 16px;
    }

    &-price {
      margin: #{_tokens.$sp-3} 0;
      font-size: 26px;

      small {
        font-size: 12px;
        color: _tokens.$text-muted;
      }
    }

    ul {
      display: grid;
      gap: #{_tokens.$sp-2};
      color: _tokens.$text-secondary;
      font-size: 12px;
    }
  }

  &__panel {
    @include _mixins.card;
    padding: #{_tokens.$sp-5};
  }

  &__toolbar {
    @include _mixins.flex-between;
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-4};

    h2 {
      font-size: 16px;
    }
  }

  &__form {
    display: flex;
    gap: #{_tokens.$sp-2};
  }

  &__select {
    width: 140px;
  }

  &__primary {
    padding: 8px 16px;
    border-radius: #{_tokens.$radius-md};
    background: #{_tokens.$brand-purple};
    color: #{_tokens.$text-inverse};
    font-size: 12px;
  }
}
</style>
