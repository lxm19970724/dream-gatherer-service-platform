<script setup lang="ts">
/** 账号分发：每个租户一个唯一管理员账号，可停用 / 重置密码 */
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { Tenant } from '@/types'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useApp } from '@/stores/app'
import { tenantsApi } from '@/api'
import { can } from '@/stores/auth'

const app = useApp()
const toggleState = ref<{ open: boolean; id: string }>({ open: false, id: '' })
const resetInfo = ref<{ account: string; password: string } | null>(null)

const columns: DataTableColumn[] = [
  { title: '管理员账号', dataIndex: 'account', width: 190 },
  { title: '所属租户', dataIndex: 'tenant', width: 190 },
  { title: '姓名', dataIndex: 'name', width: 140 },
  { title: '初始 / 最新密码', dataIndex: 'password', width: 170 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '最近登录', dataIndex: 'lastLogin', width: 150 },
  { title: '操作', dataIndex: 'actions', width: 160 },
]

const rows = computed(() => app.tenants.map((tenant) => ({
  id: tenant.id,
  account: tenant.admin.account,
  tenant: tenant.name,
  name: tenant.admin.name,
  password: resetInfo.value?.account === tenant.admin.account
    ? resetInfo.value.password
    : '—（仅重置后显示）',
  status: tenant.admin.status,
  lastLogin: tenant.admin.lastLogin,
  actions: 'actions',
})))

function tenantById(id: unknown): Tenant {
  return app.tenants.find((tenant) => tenant.id === id) ?? (app.tenants[0] as Tenant)
}

function ensurePermission(): boolean {
  if (can('resetPassword')) return true
  message.error('当前账号无权管理账号')
  return false
}

function askToggle(tenant: Tenant): void {
  if (!ensurePermission()) return
  toggleState.value = { open: true, id: tenant.id }
}

async function applyToggle(): Promise<void> {
  const tenant = tenantById(toggleState.value.id)
  await tenantsApi.toggleTenantRequest(toggleState.value.id)
  message.success(tenant.admin.status === 'active' ? '账号已启用' : '账号已停用')
  toggleState.value = { open: false, id: '' }
}

async function resetPassword(tenant: Tenant): Promise<void> {
  if (!ensurePermission()) return
  const result = await tenantsApi.resetTenantPasswordRequest(tenant.id)
  resetInfo.value = result
  message.success(`${result.account} 的密码已重置`)
}
</script>

<template>
  <main class="dev-accounts">
    <PageHeader title="账号分发" subtitle="每个租户一个唯一管理员账号，可停用或重置密码" eyebrow="ACCOUNTS" />
    <section class="dev-accounts__panel">
      <DataTable :columns="columns" :rows="rows" :searchable="false" :page-size="10" search-placeholder="搜索账号 / 租户">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <StatusTag :value="String(record.status)" :label="record.status === 'active' ? '已启用' : '已停用'"
              :tone="record.status === 'active' ? 'green' : 'gray'" />
          </template>
          <template v-else-if="column.dataIndex === 'password'">
            <span class="font-number dev-accounts__password">{{ String(record.password) }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'actions'">
            <div class="dev-accounts__actions">
              <button type="button" @click="askToggle(tenantById(record.id))">{{ record.status === 'active' ? '停用' :
                '启用' }}</button>
              <button type="button" @click="resetPassword(tenantById(record.id))">重置密码</button>
            </div>
          </template>
        </template>
      </DataTable>
    </section>

    <ConfirmModal :open="toggleState.open"
      :title="tenantById(toggleState.id).admin.status === 'active' ? '确认停用该账号？' : '确认启用该账号？'"
      content="停用后该租户管理员将无法登录；启用后服务恢复。" @confirm="applyToggle" @cancel="toggleState.open = false" />
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens' as _tokens;
@use '@/assets/scss/_mixins' as _mixins;

.dev-accounts {
  &__panel {
    @include _mixins.card;
    padding: #{_tokens.$sp-5};
  }

  &__password {
    font-size: 12px;
    color: _tokens.$text-secondary;
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
    }
  }
}
</style>
