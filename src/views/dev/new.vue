<script setup lang="ts">
/** 新建租户（画板 17 派生）：表单 → 唯一管理员账号 + 席位套餐初始化 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Input, InputNumber, Select, Modal, message } from 'ant-design-vue'
import type { Tenant } from '@/types'
import PageHeader from '@/components/PageHeader.vue'
import { useDemo } from '@/stores/demo'
import { can, useSession } from '@/stores/session'
import { hashUid } from '@/mock/utils'

const demo = useDemo()
const session = useSession()
const router = useRouter()

interface NewTenantForm {
  name: string
  short: string
  server: string
  plan: Tenant['plan']
  seats: number
  expireAt: string
  leader: string
  motto: string
}
const form = reactive<NewTenantForm>({
  name: '',
  short: '',
  server: '星渊新区',
  plan: '标准版',
  seats: 60,
  expireAt: '2027-12-31',
  leader: '',
  motto: '以家族为舟，共赴星渊',
})
const created = ref<Tenant | null>(null)
const createdPassword = ref('')

const planOptions: { value: Tenant['plan']; label: string }[] = [
  { value: '旗舰版', label: '旗舰版 · 100 席位' },
  { value: '标准版', label: '标准版 · 60 席位' },
  { value: '基础版', label: '基础版 · 30 席位' },
]

/** 唯一管理员账号：dev@xingyuan 风格，冲突时顺序递增 */
const accountPreview = computed(() => {
  let account = 'dev@xingyuan'
  let index = 2
  while (demo.tenants.some((tenant) => tenant.admin.account === account)) {
    account = `dev${index}@xingyuan`
    index += 1
  }
  return account
})

function passwordOf(account: string): string {
  return `Xy@2026#${hashUid(account) % 10000}`
}

function submit(): void {
  if (!can('dev-new', session)) {
    message.error('当前角色无权新建租户')
    return
  }
  if (!form.name.trim() || !form.short.trim()) {
    message.warning('请填写家族名称与简称')
    return
  }
  if (demo.tenants.length >= 20) {
    message.error('演示环境最多支持 20 个租户')
    return
  }

  const template = demo.tenants[0] as Tenant
  const account = accountPreview.value
  const id = `T${String(hashUid(account + form.name)).padStart(7, '0').slice(-7)}`
  const tenant: Tenant = {
    ...JSON.parse(JSON.stringify(template)) as Tenant,
    id,
    name: form.name.trim(),
    short: form.short.trim(),
    server: form.server.trim() || '星渊新区',
    plan: form.plan,
    seats: form.seats,
    expireAt: form.expireAt,
    leader: form.leader.trim() || '待任命',
    motto: form.motto.trim(),
    status: 'active',
    admin: {
      ...template.admin,
      account,
      name: `${form.short.trim()}管理员`,
      status: 'active',
      createdAt: form.expireAt.slice(0, 4) + '-01-01 09:00',
      lastLogin: '—',
    },
    members: [],
    announcements: [],
    moments: [],
    redemptions: [],
    changes: [],
    audit: [],
    ledger: [],
    imports: [],
  }

  demo.tenants.push(tenant)
  created.value = tenant
  createdPassword.value = passwordOf(account)
  message.success(`${tenant.short} 已开通`)
}

function resetForm(): void {
  created.value = null
  form.name = ''
  form.short = ''
  form.leader = ''
}
</script>

<template>
  <main class="dev-new">
    <PageHeader title="新建租户" subtitle="开通家族租户并下发唯一管理员账号" eyebrow="ONBOARDING">
      <template #actions>
        <button type="button" class="dev-new__ghost" @click="router.push('/dev-tenants')">返回列表</button>
      </template>
    </PageHeader>

    <section class="dev-new__grid">
      <form class="dev-new__form" @submit.prevent="submit">
        <h2>家族资料</h2>
        <label>家族名称 <span>*</span>
          <Input v-model:value="form.name" placeholder="例如：箱庭·潇湘雨轩" />
        </label>
        <label>家族简称 <span>*</span>
          <Input v-model:value="form.short" placeholder="例如：潇湘雨轩" />
        </label>
        <label>所属服务器
          <Input v-model:value="form.server" placeholder="星渊一区" />
        </label>
        <label>族长 / 联系人
          <Input v-model:value="form.leader" placeholder="昵称或联系人" />
        </label>
        <label>家族口号
          <Input v-model:value="form.motto" />
        </label>

        <h2>套餐与席位</h2>
        <label>套餐版本
          <Select v-model:value="form.plan" :options="planOptions" />
        </label>
        <label>初始席位
          <InputNumber v-model:value="form.seats" :min="10" :max="100" class="dev-new__number" />
        </label>
        <label>服务到期日
          <input v-model="form.expireAt" type="date" class="dev-new__date" />
        </label>

        <button type="submit" class="dev-new__submit">开通租户并生成账号</button>
      </form>

      <aside class="dev-new__preview">
        <h2>开通预览</h2>
        <div class="dev-new__preview-row"><span>管理员账号</span><strong class="font-number">{{ accountPreview }}</strong>
        </div>
        <div class="dev-new__preview-row"><span>初始密码</span><strong class="font-number">{{ passwordOf(accountPreview)
            }}</strong></div>
        <div class="dev-new__preview-row"><span>套餐 / 席位</span><strong>{{ form.plan }} · {{ form.seats }}</strong></div>
        <div class="dev-new__preview-row"><span>到期日期</span><strong class="font-number">{{ form.expireAt }}</strong>
        </div>
        <p class="dev-new__hint">开通后可在「账号分发」中停用账号或重置密码；演示数据刷新后恢复初始态。</p>
      </aside>
    </section>

    <Modal :open="created !== null" title="租户开通成功" :footer="null" @cancel="resetForm">
      <template v-if="created">
        <p class="dev-new__success">{{ created.name }} 已开通，管理员账号如下：</p>
        <div class="dev-new__preview-row"><span>账号</span><strong class="font-number">{{ created.admin.account
            }}</strong></div>
        <div class="dev-new__preview-row"><span>初始密码</span><strong class="font-number">{{ createdPassword }}</strong>
        </div>
        <div class="dev-new__modal-actions">
          <button type="button" @click="resetForm">继续新建</button>
          <button type="button" class="dev-new__primary" @click="router.push('/dev-tenants')">查看租户列表</button>
        </div>
      </template>
    </Modal>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens.scss' as _tokens;
@use '@/assets/scss/_mixins.scss' as _mixins;
.dev-new {
  &__ghost {
    padding: 8px 16px;
    border: 1px solid _tokens.$border-color;
    border-radius: _tokens.$radius-md;
    background: _tokens.$card-white;
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
    gap: _tokens.$sp-4;
  }

  &__form,
  &__preview {
    @include _mixins.card;
    padding: _tokens.$sp-6;

    h2 {
      font-size: 16px;
      margin-bottom: _tokens.$sp-4;
    }

    label {
      display: block;
      margin-bottom: _tokens.$sp-3;
      font-size: 12px;
      color: _tokens.$text-secondary;

      span {
        color: _tokens.$color-danger;
      }

      :deep(.ant-input),
      :deep(.ant-select),
      .dev-new__date {
        display: block;
        width: 100%;
        margin-top: _tokens.$sp-2;
      }
    }
  }

  &__number {
    display: block;
    width: 100%;
    margin-top: _tokens.$sp-2;
  }

  &__date {
    padding: 8px 10px;
    border: 1px solid _tokens.$border-color;
    border-radius: _tokens.$radius-md;
    background: _tokens.$card-white;
  }

  &__submit {
    width: 100%;
    margin-top: _tokens.$sp-3;
    padding: 11px 0;
    border-radius: _tokens.$radius-md;
    background: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
    font-size: 14px;
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

    strong {
      color: _tokens.$text-primary;
    }
  }

  &__hint {
    margin-top: _tokens.$sp-4;
    color: _tokens.$text-muted;
    font-size: 11px;
    line-height: 1.7;
  }

  &__success {
    color: _tokens.$text-secondary;
    margin-bottom: _tokens.$sp-4;
  }

  &__modal-actions {
    @include _mixins.flex-between;
    gap: _tokens.$sp-3;
    margin-top: _tokens.$sp-5;

    button {
      flex: 1;
      padding: 9px 0;
      border-radius: _tokens.$radius-md;
      border: 1px solid _tokens.$border-color;
      font-size: 13px;
    }
  }

  &__primary {
    background: _tokens.$brand-purple;
    border-color: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
  }
}
</style>
