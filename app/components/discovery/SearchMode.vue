<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
const enabled = defineModel<boolean>({ required: true })
</script>

<template>
  <USwitch v-model="enabled" label="AI search" size="sm" :disabled="disabled" />
</template>
