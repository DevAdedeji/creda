<script setup lang="ts">
withDefaults(
  defineProps<{
    form?: string
    primaryLabel: string
    cancelLabel?: string
    cancelDisabled?: boolean
    loading?: boolean
    disabled?: boolean
    danger?: boolean
  }>(),
  {
    form: undefined,
    cancelLabel: 'Cancel',
    cancelDisabled: false,
    loading: false,
    disabled: false,
    danger: false,
  },
)

defineEmits<{ cancel: []; primary: [] }>()
</script>

<template>
  <div class="flex w-full items-center justify-between gap-3">
    <UButton
      type="button"
      color="neutral"
      variant="soft"
      :disabled="cancelDisabled"
      class="!rounded-xl !bg-[#edf1ea] !px-4 !text-[#385344] hover:!bg-[#e2e9df]"
      @click="$emit('cancel')"
    >
      {{ cancelLabel }}
    </UButton>
    <UButton
      :type="form ? 'submit' : 'button'"
      :form="form"
      :loading="loading"
      :disabled="disabled"
      :color="danger ? 'error' : 'primary'"
      class="!rounded-xl !px-5"
      :class="danger ? '' : '!bg-[#143e32] !text-white hover:!bg-[#24563f]'"
      @click="!form && $emit('primary')"
    >
      {{ primaryLabel }}
    </UButton>
  </div>
</template>
