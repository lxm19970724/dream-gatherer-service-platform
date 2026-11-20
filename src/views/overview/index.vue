<script setup lang="ts">
/** 运营总览：租户 KPI + 服务健康度 + 固定套餐概览 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TenantAvatar from '@/components/TenantAvatar.vue'
import { useApp } from '@/stores/app'

const app = useApp()
const router = useRouter()

const total = computed(() => app.tenants.length)
const activeCount = computed(() => app.tenants.filter((tenant) => tenant.status === 'active').length)
const warningCount = computed(() => app.tenants.filter((tenant) => tenant.status === 'expiring' || tenant.status === 'expired').length)
const pendingCount = computed(() => app.priceRequests.filter((request) => request.status === 'pending').length)

const circumference = 2 * Math.PI * 42
const activeDash = computed(() => `${circumference * (total.value ? activeCount.value / total.value : 0)} ${circumference}`)

const columns: DataTableColumn[] = [
  { title: '家族 / 租户', dataIndex: 'name', width: 220 },
  { title: '管理员账号', dataIndex: 'account', width: 180 },
  { title: '成交年费', dataIndex: 'dealPrice', width: 120 },
  { title: '到期', dataIndex: 'expireAt', width: 120 },
  { title: '状态', dataIndex: 'status', width: 100 },
]
const rows = computed(() => app.tenants.map((tenant) => ({
  id: tenant.id,
  name: tenant.name,
  avatar: tenant.avatar,
  account: tenant.admin.account,
  dealPrice: tenant.dealPrice,
  expireAt: tenant.expireAt,
  status: tenant.status,
})))

const STATUS_LABEL: Record<string, string> = {
  active: '在服务', expiring: '到期预警', expired: '已到期', locked: '已锁定',
}
</script>

<template>
  <main class="dev-overview">
    <PageHeader title="运营总览" subtitle="平台租户、服务健康度与固定套餐标准价一览" eyebrow="OVERVIEW">
      <template #actions>
        <button type="button" class="dev-overview__primary" @click="router.push('/dev-tenants')">管理租户</button>
      </template>
    </PageHeader>

    <section class="dev-overview__kpis">
      <KpiCard label="租户总数" :value="total" tone="purple" hint="平台已开通家族" />
      <KpiCard label="在服务租户" :value="activeCount" tone="success" hint="状态正常" />
      <KpiCard label="到期预警" :value="warningCount" tone="coral" hint="需关注续费" />
    </section>

    <section class="dev-overview__grid">
      <article class="panel">
        <h2>服务分布</h2>
        <div class="dev-overview__donut">
          <svg viewBox="0 0 100 100" width="130" height="130" role="img" aria-label="在服务租户占比">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-color)" stroke-width="12" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--brand-purple)" stroke-width="12"
              :stroke-dasharray="activeDash" stroke-linecap="round" transform="rotate(-90 50 50)" />
          </svg>
          <div class="dev-overview__donut-text">
            <strong class="font-number">{{ total ? Math.round((activeCount / total) * 100) : 0 }}%</strong>
            <span>在服务占比</span>
          </div>
        </div>
        <ul class="dev-overview__legend">
          <li><i class="dot dot--purple" />在服务 {{ activeCount }}</li>
          <li><i class="dot dot--coral" />预警 / 到期 {{ warningCount }}</li>
        </ul>
      </article>

      <article class="panel">
        <h2>固定套餐</h2>
        <div class="dev-overview__plan">
          <p>当前套餐 · 标准价</p>
          <strong>{{ app.plan.name }}</strong>
          <p class="dev-overview__price">¥ {{ app.plan.price.toLocaleString() }} <small>/ 年</small></p>
          <p class="dev-overview__muted">标准价仅为报价基准；各租户成交年费独立，长约优惠在「套餐与成交价」中申请与审批。</p>
        </div>
        <div class="dev-overview__quick">
          <router-link to="/dev-tenants">查看租户列表 →</router-link>
          <router-link to="/dev-billing">套餐与改价申请 →<span v-if="pendingCount"> ({{ pendingCount }})</span></router-link>
          <router-link to="/dev-log">查看审计日志 →</router-link>
        </div>
      </article>
    </section>

    <section class="panel dev-overview__table">
      <h2>租户概览</h2>
      <DataTable :columns="columns" :rows="rows" :searchable="false" :page-size="5" empty-text="暂无租户">
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <StatusTag :value="String(record.status)"
              :label="STATUS_LABEL[String(record.status)] ?? String(record.status)" />
          </template>
          <template v-else-if="column.dataIndex === 'name'">
          <div class="dev-overview__tenant">
            <TenantAvatar :variant="String(record.avatar)" :size="30" />
            <router-link to="/dev-tenants" class="dev-overview__link">{{ String(record.name) }}</router-link>
          </div>
        </template>
          <template v-else-if="column.dataIndex === 'dealPrice'">
            <strong class="font-number">¥ {{ Number(record.dealPrice).toLocaleString() }}</strong>
          </template>
        </template>
      </DataTable>
    </section>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_mixins.scss' as _mixins;
@use '@/assets/scss/_tokens.scss' as _tokens;

.dev-overview {
  &__primary {
    padding: 8px 18px;
    border-radius: #{_tokens.$radius-md};
    background: _tokens.$brand-purple;
    color: _tokens.$text-inverse;
    font-size: 13px;
  }

  &__kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-5};
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: #{_tokens.$sp-4};
    margin-bottom: #{_tokens.$sp-5};
  }

  &__donut {
    @include _mixins.flex-center;
    position: relative;
    padding: #{_tokens.$sp-3} 0;
  }

  &__donut-text {
    position: absolute;
    @include _mixins.flex-center;
    flex-direction: column;

    strong {
      font-size: 22px;
    }

    span {
      font-size: 11px;
      color: _tokens.$text-muted;
    }
  }

  &__legend {
    display: flex;
    justify-content: center;
    gap: #{_tokens.$sp-5};
    font-size: 11px;
    color: _tokens.$text-secondary;

    li {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  &__plan {
    padding: #{_tokens.$sp-4} 0;

    p {
      color: _tokens.$text-secondary;
      font-size: 12px;
    }

    strong {
      display: block;
      margin: #{_tokens.$sp-2} 0;
      font-size: 20px;
    }
  }

  &__price {
    margin-bottom: #{_tokens.$sp-2} !important;
    font-size: 24px;
    color: _tokens.$brand-purple !important;

    small {
      font-size: 12px;
      color: _tokens.$text-muted;
    }
  }

  &__muted {
    margin-top: #{_tokens.$sp-2};
    color: _tokens.$text-muted !important;
    line-height: 1.7;
  }

  &__quick {
    display: grid;
    gap: #{_tokens.$sp-2};
    padding-top: #{_tokens.$sp-3};
    border-top: 1px solid _tokens.$border-color;

    a {
      color: _tokens.$brand-purple;
      font-size: 12px;
    }
  }

  &__table {
    margin-top: #{_tokens.$sp-2};
  }

  &__tenant {
    display: flex;
    align-items: center;
    gap: #{_tokens.$sp-2};
  }

  &__link {
    color: _tokens.$brand-purple;
  }
}

.panel {
  @include _mixins.card;
  padding: #{_tokens.$sp-5};

  h2 {
    font-size: 16px;
    margin-bottom: #{_tokens.$sp-3};
  }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &--purple {
    background: _tokens.$brand-purple;
  }

  &--coral {
    background: _tokens.$brand-coral;
  }
}
</style>
