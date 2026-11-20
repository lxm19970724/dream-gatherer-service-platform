<script setup lang="ts">
/**
 * 套餐与成交价：平台只有一个固定套餐，标准价全平台统一；
 * 每个租户单独记录成交年费 / 订购时长 / 定价说明，所有改价只作用于所选租户。
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Input, InputNumber, Select, message } from 'ant-design-vue'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TenantAvatar from '@/components/TenantAvatar.vue'
import { TERM_OPTIONS, termLabel, useApp } from '@/stores/app'
import { priceRequestApi, tenantsApi } from '@/api'
import { can } from '@/stores/auth'

const app = useApp()
const route = useRoute()

const tenantOptions = computed(() => app.tenants.map((tenant) => ({ value: tenant.id, label: tenant.name })))
const pendingCount = computed(() => app.priceRequests.filter((item) => item.status === 'pending').length)
const discountedCount = computed(() => app.tenants.filter((tenant) => tenant.dealPrice < app.plan.price).length)

const directTenantId = ref(String(route.query.tenant ?? app.tenants[0]?.id ?? ''))
const directMonths = ref(12)
const directPrice = ref(0)
const directNote = ref('')
const requestTenantId = ref(app.tenants[0]?.id ?? '')
const requestMonths = ref(12)
const requestedPrice = ref(0)
const requestReason = ref('')

const directTenant = computed(() => app.tenants.find((tenant) => tenant.id === directTenantId.value))
const requestTenant = computed(() => app.tenants.find((tenant) => tenant.id === requestTenantId.value))

/** 切换租户时带出该租户当前的价格、时长与说明 */
watch(directTenantId, (id) => {
  const tenant = app.tenants.find((item) => item.id === id)
  if (!tenant) return
  directMonths.value = tenant.termMonths
  directPrice.value = tenant.dealPrice
  directNote.value = tenant.priceNote
}, { immediate: true })

watch(requestTenantId, (id) => {
  const tenant = app.tenants.find((item) => item.id === id)
  if (!tenant) return
  requestMonths.value = tenant.termMonths
  requestedPrice.value = tenant.dealPrice
}, { immediate: true })

watch(() => route.query.tenant, (value) => {
  if (value) directTenantId.value = String(value)
}, { immediate: true })

const priceColumns: DataTableColumn[] = [
  { title: '租户', dataIndex: 'name', width: 200 },
  { title: '标准价（年）', dataIndex: 'standard', width: 110 },
  { title: '成交价（年）', dataIndex: 'deal', width: 120 },
  { title: '订购时长', dataIndex: 'months', width: 100 },
  { title: '定价说明', dataIndex: 'note', width: 200 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 150 },
  { title: '状态', dataIndex: 'status', width: 100 },
]

const priceRows = computed(() => app.tenants.map((tenant) => ({
  id: tenant.id,
  name: tenant.name,
  avatar: tenant.avatar,
  standard: app.plan.price,
  deal: tenant.dealPrice,
  months: tenant.termMonths,
  note: tenant.priceNote,
  updatedAt: tenant.priceUpdatedAt || '—',
  status: app.priceRequests.some((item) => item.tenantId === tenant.id && item.status === 'pending')
    ? '审批中'
    : tenant.dealPrice < app.plan.price ? '优惠价' : '标准价',
})))

const requestColumns: DataTableColumn[] = [
  { title: '申请编号', dataIndex: 'id', width: 100 },
  { title: '租户', dataIndex: 'tenantName', width: 180 },
  { title: '申请人', dataIndex: 'applicantName', width: 100 },
  { title: '时长', dataIndex: 'months', width: 80 },
  { title: '当前价 → 申请价', dataIndex: 'change', width: 170 },
  { title: '原因', dataIndex: 'reason', width: 220 },
  { title: '提交时间', dataIndex: 'submittedAt', width: 150 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '操作', dataIndex: 'actions', width: 140 },
]

const requestRows = computed(() => app.priceRequests.map((item) => ({
  id: item.id,
  tenantName: item.tenantName,
  applicantName: item.applicantName,
  months: item.months,
  change: `¥${item.currentPrice.toLocaleString()} → ¥${item.requestedPrice.toLocaleString()}`,
  reason: item.reason || '—',
  submittedAt: item.submittedAt,
  status: item.status,
  reviewer: item.reviewer,
  actions: item.status === 'pending' ? 'actions' : 'done',
})))

const renewalRows = computed(() => app.renewals.map((item) => ({ ...item })))

const renewalColumns: DataTableColumn[] = [
  { title: '租户', dataIndex: 'tenant', width: 200 },
  { title: '时长', dataIndex: 'months', width: 90 },
  { title: '金额（元）', dataIndex: 'amount', width: 120 },
  { title: '续费日期', dataIndex: 'date', width: 120 },
  { title: '到期日期', dataIndex: 'expireAt', width: 120 },
  { title: '支付方式', dataIndex: 'method', width: 110 },
  { title: '操作人', dataIndex: 'operator', width: 150 },
]

const STATUS_LABEL: Record<string, string> = {
  pending: '待审批', approved: '已通过', rejected: '已驳回',
}

async function applyDirectPrice(): Promise<void> {
  if (!can('editPrice')) {
    message.error('当前账号无权直接调整租户成交价')
    return
  }
  if (!directTenant.value) {
    message.warning('请先选择租户')
    return
  }
  if (!directPrice.value || directPrice.value <= 0) {
    message.warning('请输入有效成交年费')
    return
  }
  await tenantsApi.setTenantPriceRequest(directTenantId.value, {
    months: directMonths.value, price: directPrice.value, note: directNote.value,
  })
  message.success(`${directTenant.value.short} 成交价已调整为 ¥${directPrice.value.toLocaleString()}/年，标准价与其他租户不变`)
}

async function submitRequest(): Promise<void> {
  if (!can('requestPrice')) {
    message.error('当前账号无权提交成交价申请')
    return
  }
  if (!requestTenant.value) {
    message.warning('请先选择租户')
    return
  }
  if (!requestedPrice.value || requestedPrice.value <= 0 || requestedPrice.value === requestTenant.value.dealPrice) {
    message.warning('请填写与该租户当前成交价不同的有效金额')
    return
  }
  if (app.priceRequests.some((item) => item.tenantId === requestTenantId.value && item.status === 'pending')) {
    message.warning('该租户已有待审批申请，请先等待审批结果')
    return
  }
  await priceRequestApi.submitPriceRequest({
    tenantId: requestTenantId.value,
    months: requestMonths.value,
    requestedPrice: requestedPrice.value,
    reason: requestReason.value,
  })
  requestReason.value = ''
  message.success('已为该租户提交优惠价申请，审批通过后生效；标准价不会变化')
}

async function review(id: string, approved: boolean): Promise<void> {
  if (!can('approvePrice')) {
    message.error('当前账号无权审批')
    return
  }
  const request = app.priceRequests.find((item) => item.id === id)
  await priceRequestApi.reviewPriceRequestRequest(id, { approved })
  if (request) {
    message.success(approved
      ? `已通过：${request.tenantName} 按 ¥${request.requestedPrice.toLocaleString()}/年成交，标准价不变`
      : `已驳回 ${request.tenantName} 的改价申请`)
  }
}
</script>

<template>
  <main class="dev-billing">
    <PageHeader title="套餐与成交价" subtitle="唯一固定套餐 · 标准价统一，实际成交价按租户约定" eyebrow="PLAN & PRICING" />

    <section class="dev-billing__kpis">
      <KpiCard label="标准年费" :value="`¥ ${app.plan.price.toLocaleString()}`" tone="purple" hint="全平台报价基准" />
      <KpiCard label="签约租户" :value="app.tenants.length" tone="success" />
      <KpiCard label="优惠价租户" :value="discountedCount" tone="coral" hint="成交价低于标准价" />
      <KpiCard label="待审批申请" :value="pendingCount" tone="coral" />
    </section>

    <section class="dev-billing__plan-card">
      <div>
        <p class="dev-billing__eyebrow">统一套餐 · 标准价仅供参考</p>
        <h2>{{ app.plan.name }}</h2>
        <p class="font-number dev-billing__price">¥ {{ app.plan.price.toLocaleString() }}<small>/年</small></p>
        <p class="dev-billing__updated">标准价更新：{{ app.plan.updatedAt }} · {{ app.plan.updatedBy }}</p>
      </div>
      <ul class="dev-billing__features">
        <li>✓ 标准价不随单个租户改价而变化</li>
        <li>✓ 每个租户独立记录成交年费与订购时长</li>
        <li>✓ 三年长约等优惠走申请 / 审批并留痕</li>
      </ul>
    </section>

    <section class="dev-billing__grid">
      <article v-if="can('editPrice')" class="dev-billing__panel">
        <h2>直接调整租户成交价 <span class="dev-billing__tag">高级权限</span></h2>
        <p class="dev-billing__hint">销售谈好价格后，高级运维 / 初始管理员可直接为所选租户定价；标准价与其他租户不受影响。</p>
        <div class="dev-billing__form">
          <Select v-model:value="directTenantId" :options="tenantOptions" placeholder="选择租户" class="dev-billing__select" />
          <InputNumber v-model:value="directPrice" :min="1" :step="100" class="dev-billing__number" addon-before="¥" addon-after="/年" />
          <Select v-model:value="directMonths" :options="TERM_OPTIONS" class="dev-billing__term" />
          <Input v-model:value="directNote" placeholder="定价说明，如：三年长约优惠" class="dev-billing__reason" />
          <button type="button" class="dev-billing__primary" @click="applyDirectPrice">保存成交价</button>
        </div>
      </article>

      <article v-if="can('requestPrice')" class="dev-billing__panel">
        <h2>申请租户优惠价 <span class="dev-billing__tag dev-billing__tag--basic">基础权限</span></h2>
        <p class="dev-billing__hint">例如客户一次下单三年、希望年费更低：填写该租户的约定价格与原因，审批通过后才生效，标准价不变。</p>
        <div class="dev-billing__form">
          <Select v-model:value="requestTenantId" :options="tenantOptions" placeholder="选择租户" class="dev-billing__select" />
          <InputNumber v-model:value="requestedPrice" :min="1" :step="100" class="dev-billing__number" addon-before="¥" addon-after="/年" />
          <Select v-model:value="requestMonths" :options="TERM_OPTIONS" class="dev-billing__term" />
          <Input v-model:value="requestReason" placeholder="申请原因，如：一次签三年，客户要求优惠" class="dev-billing__reason" />
          <button type="button" class="dev-billing__primary dev-billing__primary--ghost" @click="submitRequest">提交申请</button>
        </div>
        <p v-if="requestTenant" class="dev-billing__quote">
          该租户当前 ¥{{ requestTenant.dealPrice.toLocaleString() }}/年 · {{ termLabel(requestMonths) }}，
          按申请价合计 ¥{{ ((requestedPrice || 0) * requestMonths / 12).toLocaleString() }}
        </p>
      </article>
    </section>

    <section class="dev-billing__panel dev-billing__section">
      <h2>各租户成交价</h2>
      <DataTable :columns="priceColumns" :rows="priceRows" :searchable="false" :page-size="10" empty-text="暂无租户">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'name'">
            <div class="dev-billing__tenant">
              <TenantAvatar :variant="String(record.avatar)" :size="30" />
              <span>{{ String(record.name) }}</span>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'standard'">
            <span class="dev-billing__muted">¥ {{ Number(record.standard).toLocaleString() }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'deal'">
            <strong class="font-number">¥ {{ Number(record.deal).toLocaleString() }}</strong>
          </template>
          <template v-else-if="column.dataIndex === 'months'">
            {{ termLabel(Number(record.months)) }}
          </template>
          <template v-else-if="column.dataIndex === 'note'">
            <span class="dev-billing__muted">{{ String(record.note) }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <StatusTag :value="String(record.status)"
              :tone="record.status === '审批中' ? 'yellow' : record.status === '优惠价' ? 'green' : 'gray'" />
          </template>
        </template>
      </DataTable>
    </section>

    <section class="dev-billing__panel dev-billing__section">
      <h2>成交价申请与审批</h2>
      <DataTable :columns="requestColumns" :rows="requestRows" :searchable="false" :page-size="8"
        empty-text="暂无成交价申请">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'months'">
            {{ termLabel(Number(record.months)) }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <StatusTag :value="String(record.status)" :label="STATUS_LABEL[String(record.status)] ?? String(record.status)"
              :tone="record.status === 'pending' ? 'yellow' : record.status === 'approved' ? 'green' : 'gray'" />
          </template>
          <template v-else-if="column.dataIndex === 'actions'">
            <div v-if="record.actions === 'actions' && can('approvePrice')" class="dev-billing__actions">
              <button type="button" class="is-approve" @click="review(String(record.id), true)">通过</button>
              <button type="button" class="is-reject" @click="review(String(record.id), false)">驳回</button>
            </div>
            <span v-else class="dev-billing__muted">
              {{ record.status === 'pending' ? '等待审批' : `由 ${String(record.reviewer || '—')} 处理` }}
            </span>
          </template>
        </template>
      </DataTable>
    </section>

    <section class="dev-billing__panel dev-billing__section">
      <h2>续费记录</h2>
      <DataTable :columns="renewalColumns" :rows="renewalRows" :searchable="false" :page-size="8" empty-text="暂无续费记录">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'amount'">
            <span class="font-number">¥ {{ Number(record.amount).toLocaleString() }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'months'">
            {{ termLabel(Number(record.months)) }}
          </template>
        </template>
      </DataTable>
    </section>

    <p class="dev-billing__footnote">平台套餐全局唯一，标准价作为报价基准；每个租户的成交年费独立管理，改价不会波及全平台，也不存在席位、所属服务器或口号等版本差异。</p>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens' as _tokens;
@use '@/assets/scss/_mixins' as _mixins;

.dev-billing {
  &__kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-5};
  }

  &__plan-card {
    @include _mixins.card;
    display: flex;
    justify-content: space-between;
    gap: _tokens.$sp-6;
    padding: _tokens.$sp-6;
    border-top: 3px solid _tokens.$brand-purple;
    margin-bottom: #{_tokens.$sp-5};
  }

  &__eyebrow {
    color: _tokens.$brand-purple;
    font-size: 11px;
    letter-spacing: .08em;
  }

  h2 {
    font-size: 16px;
  }

  &__price {
    margin: _tokens.$sp-3 0;
    font-size: 30px;

    small {
      font-size: 12px;
      color: _tokens.$text-muted;
    }
  }

  &__updated {
    color: _tokens.$text-muted;
    font-size: 11px;
  }

  &__features {
    display: grid;
    align-content: center;
    gap: _tokens.$sp-2;
    color: _tokens.$text-secondary;
    font-size: 12px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: _tokens.$sp-4;
    margin-bottom: _tokens.$sp-4;
  }

  &__panel {
    @include _mixins.card;
    padding: _tokens.$sp-5;

    h2 {
      margin-bottom: _tokens.$sp-2;
    }
  }

  &__section {
    margin-bottom: _tokens.$sp-4;
  }

  &__tag {
    margin-left: _tokens.$sp-2;
    padding: 2px 7px;
    border-radius: _tokens.$radius-pill;
    background: rgba(_tokens.$brand-purple, .1);
    color: _tokens.$brand-purple;
    font-size: 10px;
    vertical-align: middle;

    &--basic {
      background: rgba(_tokens.$color-info, .1);
      color: _tokens.$color-info;
    }
  }

  &__hint {
    color: _tokens.$text-muted;
    font-size: 12px;
    line-height: 1.7;
    margin-bottom: _tokens.$sp-4;
  }

  &__form {
    display: flex;
    gap: _tokens.$sp-2;
    align-items: center;
    flex-wrap: wrap;
  }

  &__select {
    width: 170px;
  }

  &__number {
    width: 150px;
  }

  &__term {
    width: 140px;
  }

  &__reason {
    width: 220px;
  }

  &__quote {
    margin-top: _tokens.$sp-3;
    color: _tokens.$brand-purple;
    font-size: 12px;
  }

  &__tenant {
    display: flex;
    align-items: center;
    gap: #{_tokens.$sp-2};
  }

  &__primary {
    padding: 8px 16px;
    border-radius: _tokens.$radius-md;
    background: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
    font-size: 12px;

    &--ghost {
      background: rgba(_tokens.$brand-purple, .1);
      color: _tokens.$brand-purple;
    }
  }

  &__actions {
    display: flex;
    gap: _tokens.$sp-2;

    button {
      padding: 3px 10px;
      border-radius: _tokens.$radius-sm;
      font-size: 12px;
    }

    .is-approve {
      color: _tokens.$color-success;
      background: rgba(_tokens.$color-success, .1);
    }

    .is-reject {
      color: _tokens.$color-danger;
      background: rgba(_tokens.$color-danger, .08);
    }
  }

  &__muted {
    color: _tokens.$text-muted;
    font-size: 12px;
  }

  &__footnote {
    color: _tokens.$text-muted;
    font-size: 11px;
    line-height: 1.7;
  }
}
</style>
