<script setup lang="ts">
import { authInputUi } from '@/utils/authInputUi'
import { adminReviewStatusOptions, type AdminReviewFilters } from '~~/shared/reviews'

defineProps<{ loading?: boolean; disabled?: boolean }>()
const filters = defineModel<AdminReviewFilters>({ required: true })
const emit = defineEmits<{ apply: []; clear: [] }>()
const ratingOptions = [
  { label: 'All ratings', value: 0 },
  ...[5, 4, 3, 2, 1].map((value) => ({
    label: `${value} ${value === 1 ? 'star' : 'stars'}`,
    value,
  })),
]
const rating = computed({
  get: () => filters.value.rating ?? 0,
  set: (value: number) => {
    filters.value.rating = value || undefined
  },
})
</script>

<template>
  <form
    class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-6"
    aria-label="Filter reviews"
    @submit.prevent="emit('apply')"
  >
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_160px_140px]">
      <UFormField label="Business" name="business">
        <UInput
          v-model="filters.business"
          name="business"
          placeholder="Business name or slug"
          icon="i-lucide-store"
          :maxlength="120"
          :disabled="disabled"
          class="w-full"
          :ui="authInputUi"
        />
      </UFormField>
      <UFormField label="Reviewer" name="reviewer">
        <UInput
          v-model="filters.reviewer"
          name="reviewer"
          placeholder="Name or email address"
          icon="i-lucide-user-round-search"
          :maxlength="254"
          :disabled="disabled"
          class="w-full"
          :ui="authInputUi"
        />
      </UFormField>
      <UFormField label="Status" name="status">
        <USelect
          v-model="filters.status"
          name="status"
          :items="adminReviewStatusOptions"
          :disabled="disabled"
          class="w-full"
          :ui="authInputUi"
        />
      </UFormField>
      <UFormField label="Rating" name="rating">
        <USelect
          v-model="rating"
          name="rating"
          :items="ratingOptions"
          :disabled="disabled"
          class="w-full"
          :ui="authInputUi"
        />
      </UFormField>
    </div>
    <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
      <p class="max-w-sm text-xs leading-5 text-[#748176]">
        Leave Business empty to find a reviewer’s reviews across all businesses.
      </p>
      <div class="flex items-center gap-3">
        <UButton
          type="button"
          color="neutral"
          variant="soft"
          :disabled="disabled || loading"
          @click="emit('clear')"
          >Clear filters</UButton
        >
        <UButton
          type="submit"
          icon="i-lucide-search"
          :loading="loading"
          :disabled="disabled || loading"
          class="!bg-[#143e32] !text-white"
          >Find reviews</UButton
        >
      </div>
    </div>
  </form>
</template>
