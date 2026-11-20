<script setup lang="ts">
/** 多租户列表（画板 17）：搜索 / 状态筛选 / 锁定解锁 / 续费入口 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input, Select, Modal, message } from 'ant-design-vue'
import type { Tenant } from '@/types'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useDemo } from '@/stores/demo'
import { can, useSession } from '@/stores/session'

const demo = useDemo()
const session = useSession()
const route = useRoute()
const router = useRouter()

const keyword = ref(String(route.query.q ?? ''))
const statusFilter = ref('all')
const confirmState = ref<{ open: boolean; id: string; action: 'lock' | 'unlock' }>({ open: false, id: '', action: 'lock' })
const renewTarget = ref<Tenant | null>(null)
const renewPlan = ref<Tenant['plan']>('旗舰版')
const renewMonths = ref(12)

watch(() => route.query.q, (value) => { keyword.value = String(value ?? '') })

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '在服务' },
  { value: 'expiring', label: '到期预警' },
  { value: 'expired', label: '已到期' },
  { value: 'locked', label: '已锁定' },
]
const planOptions = ['旗舰版', '标准版', '基础版'].map((plan) => ({ value: plan, label: plan }))

const STATUS_LABEL: Record<string, string> = {
  active: '在服务', expiring: '到期预警', expired: '已到期', locked: '已锁定',
}

const columns: DataTableColumn[] = [
  { title: '家族 / 租户', dataIndex: 'name', width: 200 },
  { title: '管理员账号', dataIndex: 'adminAccount', width: 170 },
  { title: '套餐', dataIndex: 'plan', width: 90 },
  { title: '席位', dataIndex: 'seats', width: 110 },
  { title: '到期时间', dataIndex: 'expireAt', width: 110 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '操作', dataIndex: 'actions', width: 170 },
]

const rows = computed(() => demo.tenants
  .filter((tenant) => statusFilter.value === 'all' || tenant.status === statusFilter.value)
  .filter((tenant) => {
    const query = keyword.value.trim().toLowerCase()
    if (!query) return true
    return [tenant.name, tenant.short, tenant.admin.account, tenant.leader, tenant.plan]
      .some((value) => value.toLowerCase().includes(query))
  })
  .map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    adminAccount: tenant.admin.account,
    plan: tenant.plan,
    seats: tenant.seats,
    expireAt: tenant.expireAt,
    status: tenant.status,
    actions: 'actions',
  })))

function ensurePermission(pageId: 'dev-tenants'): boolean {
  if (can(pageId, session)) return true
  message.error('当前角色无权执行该操作')
  return false
}

function tenantById(id: unknown): Tenant {
  return demo.tenants.find((tenant) => tenant.id === id) ?? (demo.tenants[0] as Tenant)
}

function askToggle(tenant: Tenant): void {
  if (!ensurePermission('dev-tenants')) return
  confirmState.value = {
    open: true,
    id: tenant.id,
    action: tenant.status === 'locked' ? 'unlock' : 'lock',
  }
}

function applyToggle(): void {
  const state = confirmState.value
  const tenant = demo.tenants.find((item) => item.id === state.id)
  if (tenant) {
    tenant.status = state.action === 'lock' ? 'locked' : 'active'
    tenant.admin.status = state.action === 'lock' ? 'disabled' : 'active'
    message.success(state.action === 'lock' ? `${tenant.short} 已锁定` : `${tenant.short} 已解锁`)
  }
  confirmState.value = { open: false, id: '', action: 'lock' }
}

function openRenew(tenant: Tenant): void {
  if (!ensurePermission('dev-tenants')) return
  renewTarget.value = tenant
  renewPlan.value = tenant.plan
  renewMonths.value = 12
}

function applyRenew(): void {
  const tenant = renewTarget.value
  if (!tenant) return
  if (!ensurePermission('dev-tenants')) return
  const next = new Date(`${tenant.expireAt}T00:00:00`)
  next.setMonth(next.getMonth() + renewMonths.value)
  tenant.expireAt = next.toISOString().slice(0, 10)
  tenant.plan = renewPlan.value
  tenant.status = 'active'
  message.success(`${tenant.short} 已续费至 ${tenant.expireAt}`)
  renewTarget.value = null
}
</script>

<template>
  <main class="dev-tenants">
    <PageHeader title="租户列表" subtitle="管理平台家族租户的套餐、席位与服务状态" eyebrow="TENANTS">
      <template #actions>
        <button type="button" class="dev-tenants__primary" @click="router.push('/dev-new')">+ 新建租户</button>
      </template>
    </PageHeader>

    <section class="dev-tenants__panel">
      <div class="dev-tenants__toolbar">
        <Input v-model:value="keyword" placeholder="搜索家族 / 账号 / 族长" allow-clear class="dev-tenants__search" />
        <Select v-model:value="statusFilter" :options="statusOptions" class="dev-tenants__select" />
        <span class="dev-tenants__count">共 {{ rows.length }} 个租户</span>
      </div>

      <DataTable :columns="columns" :rows="rows" :searchable="false" :page-size="10">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'name'">
            <strong>{{ String(record.name) }}</strong>
          </template>
          <template v-else-if="column.dataIndex === 'seats'">
            <span class="font-number">{{ String(record.seats) }}</span>
            <span class="dev-tenants__seats">/ 100</span>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <StatusTag :value="String(record.status)"
              :label="STATUS_LABEL[String(record.status)] ?? String(record.status)" />
          </template>
          <template v-else-if="column.dataIndex === 'actions'">
            <div class="dev-tenants__actions">
              <button type="button" @click="openRenew(tenantById(record.id))">续费</button>
              <button type="button" :class="record.status === 'locked' ? 'is-unlock' : 'is-lock'"
                @click="askToggle(tenantById(record.id))">{{ record.status === 'locked' ? '解锁' : '锁定' }}</button>
            </div>
          </template>
        </template>
      </DataTable>
    </section>

    <ConfirmModal :open="confirmState.open" :title="confirmState.action === 'lock' ? '确认锁定租户？' : '确认解锁租户？'"
      :content="confirmState.action === 'lock' ? '锁定后该租户管理员将无法登录，服务暂停。' : '解锁后该租户管理员可重新登录。'"
      :confirm-text="confirmState.action === 'lock' ? '确认锁定' : '确认解锁'" danger @confirm="applyToggle"
      @cancel="confirmState.open = false" />

    <Modal :open="renewTarget !== null" title="套餐续费" :ok-text="`确认续费 ${renewMonths} 个月`" @ok="applyRenew"
      @cancel="renewTarget = null">
      <p class="dev-tenants__renew-name">{{ renewTarget?.name }}</p>
      <label class="dev-tenants__field">套餐版本
        <Select v-model:value="renewPlan" :options="planOptions" class="dev-tenants__field-control" />
      </label>
      <label class="dev-tenants__field">续费时长
        <Select v-model:value="renewMonths"
          :options="[{ value: 12, label: '12 个月' }, { value: 24, label: '24 个月' }, { value: 36, label: '36 个月' }]"
          class="dev-tenants__field-control" />
      </label>
    </Modal>
  </main>
</template>

<style scoped lang="scss">
@use "@/assets/scss/_tokens.scss" as _tokens;
@use "@/assets/scss/_mixins.scss" as _mixins;
.dev-tenants {
  &__primary {
    padding: 8px 18px;
    border-radius: #{_tokens.$radius-md};
    background: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
    font-size: 13px;
  }

  &__panel {
    @include _mixins.card;
    padding: #{_tokens.$sp-5};
  }

  &__toolbar {
    @include _mixins.flex-between;
    gap: #{_tokens.$sp-3};
    margin-bottom: #{_tokens.$sp-4};
  }

  &__search {
    width: 280px;
  }

  &__select {
    width: 140px;
  }

  &__count {
    color: _tokens.$text-muted;
    font-size: 12px;
  }

  &__seats {
    color: _tokens.$text-muted;
    font-size: 11px;
  }

  &__actions {
    display: flex;
    gap: #{_tokens.$sp-2};

    button {
      padding: 3px 10px;
      border-radius: #{_tokens.$radius-sm};
      font-size: 12px;
      color: _tokens.$brand-purple;
      background: rgba(_tokens.$brand-purple, .08);

      &.is-lock {
        color: _tokens.$color-danger;
        background: rgba(_tokens.$color-danger, .08);
      }

      &.is-unlock {
        color: _tokens.$color-success;
        background: rgba(_tokens.$color-success, .1);
      }
    }
  }

  &__renew-name {
    color: _tokens.$text-secondary;
    margin-bottom: #{_tokens.$sp-4};
  }

  &__field {
    display: block;
    margin-bottom: #{_tokens.$sp-3};
    font-size: 12px;
    color: _tokens.$text-secondary;
  }

  &__field-control {
    display: block;
    margin-top: #{_tokens.$sp-2};
  }
}
</style>
