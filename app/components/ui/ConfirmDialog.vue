<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description: string
    confirmLabel: string
    loading?: boolean
    danger?: boolean
  }>(),
  { loading: false, danger: false },
)

const open = defineModel<boolean>('open', { default: false })
defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal v-model:open="open" :title="title" :ui="{ content: 'max-w-md rounded-2xl' }">
    <template #body>
      <UiFeedbackAlert :tone="danger ? 'warning' : 'info'" :message="description" />
    </template>
    <template #footer>
      <UiModalActions
        :primary-label="confirmLabel"
        :loading="loading"
        :disabled="loading"
        :danger="danger"
        @cancel="open = false"
        @primary="$emit('confirm')"
      />
    </template>
  </UModal>
</template>
