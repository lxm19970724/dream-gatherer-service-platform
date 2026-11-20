<script setup lang="ts">
/** 租户列表：搜索 / 状态筛选 / 弹窗新建 / 续费 / 锁定解锁。套餐只有一种，不再有席位概念。 */
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input, InputNumber, Select, Modal, message } from 'ant-design-vue'
import type { Tenant } from '@/types'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import TenantAvatar from '@/components/TenantAvatar.vue'
import { TENANT_AVATARS, avatarOf } from '@/components/tenantAvatars'
import { TERM_OPTIONS, expireDateFromNow, termLabel, useApp } from '@/stores/app'
import { tenantsApi } from '@/api'
import { can } from '@/stores/auth'

const app = useApp()
const route = useRoute()
const router = useRouter()

const keyword = ref(String(route.query.q ?? ''))
const statusFilter = ref('all')
const confirmState = ref<{ open: boolean; id: string; action: 'lock' | 'unlock' }>({ open: false, id: '', action: 'lock' })
const renewTarget = ref<Tenant | null>(null)
const renewMonths = ref(12)

/** 新建租户弹窗状态 */
const createOpen = ref(false)
const createForm = reactive({ name: '', short: '', duration: 12, dealPrice: app.plan.price, avatar: TENANT_AVATARS[0]!.id })
const created = ref<{ name: string; avatar: string; account: string; password: string; pendingRequest: boolean } | null>(null)

watch(() => route.query.q, (value) => { keyword.value = String(value ?? '') })

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '在服务' },
  { value: 'expiring', label: '到期预警' },
  { value: 'expired', label: '已到期' },
  { value: 'locked', label: '已锁定' },
]
/** 新建 / 续费共用同一组时长选项，到期日从操作当天自动计算 */
const monthOptions = TERM_OPTIONS
const durationOptions = TERM_OPTIONS

const STATUS_LABEL: Record<string, string> = {
  active: '在服务', expiring: '到期预警', expired: '已到期', locked: '已锁定',
}

const columns: DataTableColumn[] = [
  { title: '家族 / 租户', dataIndex: 'name', width: 220 },
  { title: '管理员账号', dataIndex: 'adminAccount', width: 180 },
  { title: '成交年费', dataIndex: 'dealPrice', width: 120 },
  { title: '订购时长', dataIndex: 'months', width: 110 },
  { title: '到期时间', dataIndex: 'expireAt', width: 120 },
  { title: '状态', dataIndex: 'status', width: 110 },
  { title: '操作', dataIndex: 'actions', width: 210 },
]

const rows = computed(() => app.tenants
  .filter((tenant) => statusFilter.value === 'all' || tenant.status === statusFilter.value)
  .filter((tenant) => {
    const query = keyword.value.trim().toLowerCase()
    if (!query) return true
    return [tenant.name, tenant.short, tenant.admin.account]
      .some((value) => value.toLowerCase().includes(query))
  })
  .map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    avatar: tenant.avatar,
    adminAccount: tenant.admin.account,
    dealPrice: tenant.dealPrice,
    months: tenant.termMonths,
    expireAt: tenant.expireAt,
    status: tenant.status,
    actions: 'actions',
  })))

function tenantById(id: unknown): Tenant {
  return app.tenants.find((tenant) => tenant.id === id) ?? (app.tenants[0] as Tenant)
}

function askToggle(tenant: Tenant): void {
  confirmState.value = {
    open: true,
    id: tenant.id,
    action: tenant.status === 'locked' ? 'unlock' : 'lock',
  }
}

async function applyToggle(): Promise<void> {
  const state = confirmState.value
  const tenant = tenantById(state.id)
  await tenantsApi.toggleTenantRequest(state.id)
  message.success(state.action === 'lock' ? `${tenant.short} 已锁定` : `${tenant.short} 已解锁`)
  confirmState.value = { open: false, id: '', action: 'lock' }
}

function openRenew(tenant: Tenant): void {
  renewTarget.value = tenant
  renewMonths.value = 12
}

async function applyRenew(): Promise<void> {
  const tenant = renewTarget.value
  if (!tenant) return
  await tenantsApi.renewTenantRequest(tenant.id, { months: renewMonths.value })
  message.success(`${tenant.short} 已续费`)
  renewTarget.value = null
}

function openCreate(): void {
  if (!can('createTenant')) {
    message.error('当前账号无权新增租户')
    return
  }
  createForm.name = ''
  createForm.short = ''
  createForm.duration = 12
  createForm.dealPrice = app.plan.price
  createForm.avatar = TENANT_AVATARS[Math.floor(Math.random() * TENANT_AVATARS.length)]!.id
  created.value = null
  createOpen.value = true
}

function openPrice(tenant: Tenant): void {
  router.push({ path: '/dev-billing', query: { tenant: tenant.id } })
}

async function submitCreate(): Promise<void> {
  if (!can('createTenant')) return
  if (!createForm.name.trim() || !createForm.short.trim()) {
    message.warning('请填写家族名称与简称')
    return
  }
  const result = await tenantsApi.createTenant({
    name: createForm.name,
    shortName: createForm.short,
    months: createForm.duration,
    dealPrice: createForm.dealPrice,
    avatar: createForm.avatar,
  })
  created.value = {
    name: result.tenant.name,
    avatar: result.tenant.avatar,
    account: result.account,
    password: result.password,
    pendingRequest: result.pendingRequest,
  }
  message.success(result.pendingRequest
    ? `${result.tenant.shortName} 已开通，优惠价申请已提交待审批`
    : `${result.tenant.shortName} 已开通`)
}

function closeCreate(): void {
  createOpen.value = false
  created.value = null
}
</script>

<template>
  <main class="dev-tenants">
    <PageHeader title="租户列表" subtitle="管理家族租户的服务状态与续费，统一使用固定套餐" eyebrow="TENANTS">
      <template #actions>
        <button type="button" class="dev-tenants__primary" @click="openCreate">+ 新建租户</button>
      </template>
    </PageHeader>

    <section class="dev-tenants__panel">
      <div class="dev-tenants__toolbar">
        <Input v-model:value="keyword" placeholder="搜索家族 / 账号" allow-clear class="dev-tenants__search" />
        <Select v-model:value="statusFilter" :options="statusOptions" class="dev-tenants__select" />
        <span class="dev-tenants__count">共 {{ rows.length }} 个租户</span>
      </div>

      <DataTable :columns="columns" :rows="rows" :searchable="false" :page-size="10">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'name'">
            <div class="dev-tenants__tenant">
              <TenantAvatar :variant="String(record.avatar)" :size="32" />
              <strong>{{ String(record.name) }}</strong>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'dealPrice'">
            <strong class="font-number">¥ {{ Number(record.dealPrice).toLocaleString() }}</strong>
          </template>
          <template v-else-if="column.dataIndex === 'months'">
            {{ termLabel(Number(record.months)) }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <StatusTag :value="String(record.status)"
              :label="STATUS_LABEL[String(record.status)] ?? String(record.status)" />
          </template>
          <template v-else-if="column.dataIndex === 'actions'">
            <div class="dev-tenants__actions">
              <button type="button" @click="openRenew(tenantById(record.id))">续费</button>
              <button type="button" @click="openPrice(tenantById(record.id))">调价</button>
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

    <Modal :open="renewTarget !== null" title="租户续费"
      :ok-text="`确认续费 · ¥${Math.round((renewTarget?.dealPrice ?? 0) * renewMonths / 12).toLocaleString()}`" @ok="applyRenew"
      @cancel="renewTarget = null">
      <p class="dev-tenants__renew-name">{{ renewTarget?.name }}</p>
      <p class="dev-tenants__renew-hint">{{ app.plan.name }}：该租户成交价 ¥{{ renewTarget?.dealPrice.toLocaleString() }} / 年
        （标准价 ¥{{ app.plan.price.toLocaleString() }} / 年），按所选时长折算金额。</p>
      <label class="dev-tenants__field">续费时长
        <Select v-model:value="renewMonths" :options="monthOptions" class="dev-tenants__field-control" />
      </label>
    </Modal>

    <!-- 新建租户已并入列表页，不再有独立菜单 -->
    <Modal :open="createOpen" title="新建租户" :ok-text="created ? '完成' : '开通租户'"
      :cancel-text="created ? '关闭' : '取消'" @ok="created ? closeCreate() : submitCreate()" @cancel="closeCreate">
      <template v-if="created">
        <div class="dev-tenants__tenant dev-tenants__tenant--created">
          <TenantAvatar :variant="created.avatar" :size="40" />
          <div>
            <strong>{{ created.name }}</strong>
            <p class="dev-tenants__muted">{{ avatarOf(created.avatar).label }}头像</p>
          </div>
        </div>
        <p class="dev-tenants__renew-name">已开通，管理员账号如下：</p>
        <div class="dev-tenants__preview-row"><span>账号</span><strong class="font-number">{{ created.account }}</strong></div>
        <div class="dev-tenants__preview-row"><span>初始密码</span><strong class="font-number">{{ created.password }}</strong></div>
        <p v-if="created.pendingRequest" class="dev-tenants__renew-hint">约定成交价与标准价不同，已生成待审批申请；审批通过前该租户按标准价 ¥{{ app.plan.price.toLocaleString() }} / 年计。</p>
      </template>
      <template v-else>
        <label class="dev-tenants__field">家族名称 <span class="dev-tenants__required">*</span>
          <Input v-model:value="createForm.name" placeholder="例如：箱庭·潇湘雨轩" class="dev-tenants__field-control" />
        </label>
        <label class="dev-tenants__field">家族简称 <span class="dev-tenants__required">*</span>
          <Input v-model:value="createForm.short" placeholder="例如：潇湘雨轩" class="dev-tenants__field-control" />
        </label>
        <div class="dev-tenants__field">
          <span>租户头像 <em class="dev-tenants__muted">（{{ avatarOf(createForm.avatar).label }}）</em></span>
          <div class="dev-tenants__avatars">
            <button v-for="option in TENANT_AVATARS" :key="option.id" type="button"
              class="dev-tenants__avatar-option" :class="{ 'is-active': createForm.avatar === option.id }"
              :title="option.label" :aria-label="option.label" @click="createForm.avatar = option.id">
              <TenantAvatar :variant="option.id" :size="38" />
            </button>
          </div>
        </div>
        <label class="dev-tenants__field">服务时长
          <Select v-model:value="createForm.duration" :options="durationOptions" class="dev-tenants__field-control" />
        </label>
        <label class="dev-tenants__field">约定成交年费
          <InputNumber v-model:value="createForm.dealPrice" :min="1" :step="100" class="dev-tenants__field-control" addon-before="¥" addon-after="/年" />
        </label>
        <p class="dev-tenants__renew-hint">标准价 ¥{{ app.plan.price.toLocaleString() }} / 年，可按谈判结果调整；基础角色填写非标准价会生成待审批申请。到期日按开通当天自动计算：<strong class="font-number">{{ expireDateFromNow(createForm.duration) }}</strong>。</p>
      </template>
    </Modal>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens.scss' as _tokens;
@use '@/assets/scss/_mixins.scss' as _mixins;

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
    margin-bottom: #{_tokens.$sp-3};
  }

  &__renew-hint {
    color: _tokens.$text-muted;
    font-size: 12px;
    line-height: 1.7;
    margin-bottom: #{_tokens.$sp-4};
  }

  &__required {
    color: _tokens.$color-danger;
  }

  &__field {
    display: block;
    margin-bottom: #{_tokens.$sp-3};
    font-size: 12px;
    color: _tokens.$text-secondary;
  }

  &__field-control {
    display: block;
    width: 100%;
    margin-top: #{_tokens.$sp-2};
  }

  &__tenant {
    display: flex;
    align-items: center;
    gap: #{_tokens.$sp-2};

    &--created {
      margin-bottom: #{_tokens.$sp-3};
      strong {
        font-size: 13px;
      }
    }
  }

  &__avatars {
    display: grid;
    grid-template-columns: repeat(8, 38px);
    gap: #{_tokens.$sp-2};
    margin-top: #{_tokens.$sp-2};
  }

  &__avatar-option {
    padding: 2px;
    border: 2px solid transparent;
    border-radius: 50%;
    line-height: 0;
    transition: border-color .15s, transform .15s;

    &:hover {
      transform: translateY(-2px);
    }

    &.is-active {
      border-color: _tokens.$brand-purple;
    }
  }

  &__muted {
    color: _tokens.$text-muted;
    font-size: 11px;
    font-style: normal;
  }

  &__preview-row {
    @include _mixins.flex-between;
    gap: _tokens.$sp-3;
    padding: _tokens.$sp-3 0;
    border-bottom: 1px solid _tokens.$border-color;
    font-size: 12px;

    span {
      color: _tokens.$text-secondary;
    }
  }
}
</style>
