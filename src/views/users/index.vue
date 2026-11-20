<script setup lang="ts">
/** 平台用户管理：初始管理员创建维护人员账号并分配权限（动作级控制，非菜单级） */
import { computed, reactive, ref } from 'vue'
import { Select, Modal, message } from 'ant-design-vue'
import type { PlatformAction, PlatformRole } from '@/types'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { ACTION_LABEL, PLATFORM_ROLE_LABEL, ROLE_PERMISSION_ROWS, can } from '@/stores/auth'
import { useApp } from '@/stores/app'
import { platformUserApi } from '@/api'

const app = useApp()

const createOpen = ref(false)
const createForm = reactive<{ name: string; role: PlatformRole }>({ name: '', role: 'basic' })
const created = ref<{ name: string; account: string; password: string } | null>(null)
const resetInfo = ref<{ account: string; password: string } | null>(null)

const roleOptions = [
  { value: 'senior', label: '高级运维（审批改价 / 直接改价）' },
  { value: 'basic', label: '基础销售/运维（改价需申请）' },
]

const columns: DataTableColumn[] = [
  { title: '账号', dataIndex: 'account', width: 180 },
  { title: '姓名', dataIndex: 'name', width: 130 },
  { title: '角色', dataIndex: 'role', width: 140 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '创建人', dataIndex: 'createdBy', width: 150 },
  { title: '最近登录', dataIndex: 'lastLogin', width: 150 },
  { title: '操作', dataIndex: 'actions', width: 170 },
]

const rows = computed(() => app.platformUsers.map((user) => ({
  id: user.id,
  account: user.account,
  name: user.name,
  role: PLATFORM_ROLE_LABEL[user.role],
  status: user.status,
  createdBy: user.createdBy,
  lastLogin: user.lastLogin,
  actions: 'actions',
})))

function actionLabel(action: string): string {
  return ACTION_LABEL[action as PlatformAction] ?? action
}

function openCreate(): void {
  if (!can('manageUsers')) {
    message.error('只有初始管理员可以新增平台账号')
    return
  }
  createForm.name = ''
  createForm.role = 'basic'
  created.value = null
  createOpen.value = true
}

async function submitCreate(): Promise<void> {
  if (!can('manageUsers')) return
  if (!createForm.name.trim()) {
    message.warning('请填写姓名')
    return
  }
  const result = await platformUserApi.createPlatformUser({ name: createForm.name, role: createForm.role })
  created.value = { name: result.user.name, account: result.user.account, password: result.password }
  await platformUserApi.listPlatformUsers()
  message.success('平台账号已创建')
}

function closeCreate(): void {
  createOpen.value = false
  created.value = null
}

async function toggleUser(account: unknown): Promise<void> {
  if (!can('manageUsers')) return
  const user = app.platformUsers.find((item) => item.id === account)
  if (!user) return
  await platformUserApi.togglePlatformUserRequest(user.id)
  message.success(user.status === 'active' ? '账号已启用' : '账号已停用')
}

async function resetPassword(account: unknown): Promise<void> {
  if (!can('manageUsers')) return
  const user = app.platformUsers.find((item) => item.id === account)
  if (!user) return
  const result = await platformUserApi.resetPlatformUserPasswordRequest(user.id)
  resetInfo.value = result
  message.success(`${result.account} 的密码已重置`)
}
</script>

<template>
  <main class="dev-users">
    <PageHeader title="平台用户" subtitle="初始管理员创建维护账号并分配操作权限" eyebrow="PLATFORM USERS">
      <template #actions>
        <button v-if="can('manageUsers')" type="button" class="dev-users__primary" @click="openCreate">+ 新增平台账号</button>
      </template>
    </PageHeader>

    <section class="dev-users__panel">
      <DataTable :columns="columns" :rows="rows" :searchable="false" :page-size="10" empty-text="暂无平台账号">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <StatusTag :value="String(record.status)" :label="record.status === 'active' ? '已启用' : '已停用'"
              :tone="record.status === 'active' ? 'green' : 'gray'" />
          </template>
          <template v-else-if="column.dataIndex === 'actions'">
            <div v-if="can('manageUsers')" class="dev-users__actions">
              <button type="button" @click="toggleUser(record.id)">{{ record.status === 'active' ? '停用' : '启用' }}</button>
              <button type="button" @click="resetPassword(record.id)">重置密码</button>
            </div>
            <span v-else class="dev-users__muted">仅初始管理员可管理</span>
          </template>
        </template>
      </DataTable>
    </section>

    <section class="dev-users__panel dev-users__matrix">
      <h2>权限说明</h2>
      <p class="dev-users__hint">菜单对所有登录账号固定可见；权限只约束具体操作。高级运维可审批基础角色提交的申请。</p>
      <div class="dev-users__matrix-grid">
        <article v-for="row in ROLE_PERMISSION_ROWS" :key="row.role" class="dev-users__role-card">
          <h3>{{ PLATFORM_ROLE_LABEL[row.role] }}</h3>
          <ul>
            <li v-for="action in row.actions" :key="action">✓ {{ actionLabel(action) }}</li>
          </ul>
        </article>
      </div>
    </section>

    <Modal :open="createOpen" :title="created ? '平台账号创建成功' : '新增平台账号'"
      :ok-text="created ? '完成' : '创建账号'" :cancel-text="created ? '关闭' : '取消'"
      @ok="created ? closeCreate() : submitCreate()" @cancel="closeCreate">
      <template v-if="created">
        <p class="dev-users__result-name">{{ created.name }} 的账号如下，请妥善保存初始密码：</p>
        <div class="dev-users__preview-row"><span>账号</span><strong class="font-number">{{ created.account }}</strong></div>
        <div class="dev-users__preview-row"><span>初始密码</span><strong class="font-number">{{ created.password }}</strong></div>
      </template>
      <template v-else>
        <label class="dev-users__field">姓名
          <input v-model="createForm.name" class="dev-users__input" placeholder="例如：运维·小张" />
        </label>
        <label class="dev-users__field">角色
          <Select v-model:value="createForm.role" :options="roleOptions" class="dev-users__select" />
        </label>
        <p class="dev-users__hint">账号自动生成；初始管理员唯一，不通过本表单创建。</p>
      </template>
    </Modal>

    <Modal :open="resetInfo !== null" title="密码已重置" :footer="null" @cancel="resetInfo = null">
      <template v-if="resetInfo">
        <div class="dev-users__preview-row"><span>账号</span><strong class="font-number">{{ resetInfo.account }}</strong></div>
        <div class="dev-users__preview-row"><span>新密码</span><strong class="font-number">{{ resetInfo.password }}</strong></div>
      </template>
    </Modal>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens' as _tokens;
@use '@/assets/scss/_mixins' as _mixins;

.dev-users {
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
    margin-bottom: _tokens.$sp-4;
  }

  &__actions {
    display: flex;
    gap: _tokens.$sp-2;

    button {
      padding: 3px 10px;
      border-radius: _tokens.$radius-sm;
      font-size: 12px;
      color: _tokens.$brand-purple;
      background: rgba(_tokens.$brand-purple, .08);
    }
  }

  &__muted {
    color: _tokens.$text-muted;
    font-size: 12px;
  }

  &__matrix {
    h2 {
      font-size: 16px;
      margin-bottom: _tokens.$sp-2;
    }
  }

  &__hint {
    color: _tokens.$text-muted;
    font-size: 12px;
    line-height: 1.7;
    margin-bottom: _tokens.$sp-4;
  }

  &__matrix-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: _tokens.$sp-3;
  }

  &__role-card {
    padding: _tokens.$sp-4;
    border: 1px solid _tokens.$border-color;
    border-radius: _tokens.$radius-md;
    background: _tokens.$bg-page;

    h3 {
      font-size: 13px;
      margin-bottom: _tokens.$sp-3;
      color: _tokens.$brand-purple;
    }

    ul {
      display: grid;
      gap: _tokens.$sp-2;
      color: _tokens.$text-secondary;
      font-size: 12px;
    }
  }

  &__field {
    display: block;
    margin-bottom: _tokens.$sp-4;
    font-size: 12px;
    color: _tokens.$text-secondary;
  }

  &__input {
    display: block;
    width: 100%;
    margin-top: _tokens.$sp-2;
    padding: 8px 10px;
    border: 1px solid _tokens.$border-color;
    border-radius: _tokens.$radius-md;
    background: _tokens.$card-white;
  }

  &__select {
    display: block;
    width: 100%;
    margin-top: _tokens.$sp-2;
  }

  &__result-name {
    color: _tokens.$text-secondary;
    margin-bottom: _tokens.$sp-4;
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
