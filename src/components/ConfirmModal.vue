<!--
 * @Author: lixuming
 * @Date: 2026-11-19 14:52:45
 * @LastEditors: lixuming 1493311067@qq.com
 * @LastEditTime: 2026-11-19 17:29:51
 * @Description: 
 * @FilePath: \dream-center-family-manage\src\components\ConfirmModal.vue
-->
<script setup lang="ts">
/** 二次确认弹窗（对应原型 confirmBox），可选备注输入 */
import { ref, watch } from 'vue'
import { Modal, Input } from 'ant-design-vue'

interface Props {
  open: boolean
  title: string
  content?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  requireNote?: boolean
  notePlaceholder?: string
}
const props = withDefaults(defineProps<Props>(), {
  content: '',
  confirmText: '确认',
  cancelText: '取消',
  danger: false,
  requireNote: false,
  notePlaceholder: '请输入备注（可选）',
})

const emit = defineEmits<{ confirm: [note: string]; cancel: [] }>()
const note = ref('')

watch(() => props.open, (open) => {
  if (open) note.value = ''
})

function handleOk(): void {
  emit('confirm', note.value.trim())
}

function handleCancel(): void {
  emit('cancel')
}
</script>

<template>
  <Modal :open="open" :title="title" :ok-text="confirmText" :cancel-text="cancelText"
    :ok-button-props="danger ? { danger: true } : {}" :width="480" @ok="handleOk" @cancel="handleCancel">
    <p v-if="content" class="confirm-content">{{ content }}</p>
    <slot />
    <Input v-if="requireNote" v-model:value="note" class="confirm-note" :placeholder="notePlaceholder" />
  </Modal>
</template>

<style scoped lang="scss">
@use '@/assets/scss/_tokens.scss' as _tokens;
.confirm-content {
  color: _tokens.$text-secondary;
  line-height: 1.7;
}

.confirm-note {
  margin-top: #{_tokens.$sp-4};
}
</style>
