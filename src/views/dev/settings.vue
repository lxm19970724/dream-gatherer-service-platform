<script setup lang="ts">
/** 平台设置（画板 24 派生）：参数展示 + 演示数据重置 */
import { computed, reactive, ref } from 'vue'
import { Input, Switch, message } from 'ant-design-vue'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { resetDemo, useDemo } from '@/stores/demo'
import { can, useSession } from '@/stores/session'

const demo = useDemo()
const session = useSession()
const confirmOpen = ref(false)

const defaults = { platformName: '星渊·服务平台', contact: 'ops@xingyuan.example', timeout: 30, allowRegister: true }
const form = reactive({ ...defaults })

const summary = computed(() => [
  { label: '租户数', value: demo.tenants.length },
  { label: '成员数', value: demo.members.length },
  { label: '战报行数', value: demo.abyssReport.rows.length },
])

function save(): void {
  if (!can('dev-settings', session)) {
    message.error('当前角色无权修改平台设置')
    return
  }
  message.success('平台参数已保存（演示态，刷新后恢复默认值）')
}

function applyReset(): void {
  if (!can('dev-settings', session)) {
    message.error('当前角色无权重置演示数据')
    return
  }
  resetDemo()
  Object.assign(form, defaults)
  confirmOpen.value = false
  message.success('演示数据已恢复初始态')
}
</script>

<template>
  <main class="dev-settings">
    <PageHeader title="平台设置" subtitle="平台参数与演示数据管理" eyebrow="SETTINGS" />
    <section class="dev-settings__grid">
      <form class="dev-settings__panel" @submit.prevent="save">
        <h2>基础参数</h2>
        <label>平台名称<Input v-model:value="form.platformName" /></label>
        <label>运维邮箱<Input v-model:value="form.contact" /></label>
        <label>会话超时（分钟）<Input v-model:value="form.timeout" type="number" /></label>
        <label class="dev-settings__switch">允许租户自助申请
          <Switch v-model:checked="form.allowRegister" />
        </label>
        <button type="submit" class="dev-settings__primary">保存设置</button>
      </form>

      <aside class="dev-settings__panel">
        <h2>数据状态</h2>
        <div class="dev-settings__summary">
          <KpiCard v-for="item in summary" :key="item.label" :label="item.label" :value="item.value" tone="purple" />
        </div>
        <p class="dev-settings__note">演示数据仅保存在内存；刷新页面即可恢复初始态。下方可立即重置。</p>
      </aside>
    </section>

    <section class="dev-settings__panel dev-settings__danger">
      <h2>危险操作</h2>
      <p>重置后将清除本次会话中的租户锁定、账号停用、新建租户与续费记录。</p>
      <button type="button" class="dev-settings__reset" @click="confirmOpen = true">重置演示数据</button>
    </section>

    <ConfirmModal :open="confirmOpen" title="确认重置演示数据？" content="所有临时修改将被丢弃，数据恢复到 schema 真值构造的初始态。" confirm-text="立即重置"
      danger @confirm="applyReset" @cancel="confirmOpen = false" />
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens' as _tokens;
@use '@/assets/scss/_mixins' as _mixins;
.dev-settings {
  &__grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-4};
  }

  &__panel {
    @include _mixins.card;
    padding: #{_tokens.$sp-6};

    h2 {
      font-size: 16px;
      margin-bottom: #{_tokens.$sp-4};
    }

    label {
      display: block;
      margin-bottom: #{_tokens.$sp-4};
      font-size: 12px;
      color: _tokens.$text-secondary;

      :deep(.ant-input) {
        display: block;
        margin-top: #{_tokens.$sp-2};
      }
    }
  }

  &__switch {
    @include _mixins.flex-between;
  }

  &__primary {
    padding: 9px 20px;
    border-radius: #{_tokens.$radius-md};
    background: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
    font-size: 13px;
  }

  &__summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: #{_tokens.$sp-2};
  }

  &__note {
    margin-top: #{_tokens.$sp-4};
    color: _tokens.$text-muted;
    font-size: 11px;
    line-height: 1.7;
  }

  &__danger {
    border-left: 3px solid _tokens.$color-danger;

    p {
      color: _tokens.$text-secondary;
      font-size: 12px;
      margin-bottom: #{_tokens.$sp-4};
    }
  }

  &__reset {
    padding: 8px 18px;
    border-radius: #{_tokens.$radius-md};
    background: rgba(_tokens.$color-danger, .1);
    color: _tokens.$color-danger;
    font-size: 12px;
  }
}
</style>
