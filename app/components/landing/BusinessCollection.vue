<script setup lang="ts">
import BusinessCard from '@/components/businesses/BusinessCard.vue'
import type { BusinessListItem } from '~~/shared/businesses'
defineProps<{
  headingId: string
  title: string
  description: string
  businesses: BusinessListItem[]
  savedIds: Set<string>
  savePending: boolean
  moreLink: string
  moreLabel: string
}>()
defineEmits<{ toggleSave: [business: BusinessListItem] }>()
</script>

<template>
  <section :aria-labelledby="headingId" class="py-8 sm:py-10">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2
          :id="headingId"
          class="text-2xl font-semibold tracking-[-.04em] text-[#143e32] sm:text-3xl"
        >
          {{ title }}
        </h2>
        <p class="mt-1.5 text-sm leading-6 text-[#657069]">{{ description }}</p>
      </div>
      <NuxtLink
        :to="moreLink"
        class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
        >{{ moreLabel }}<UIcon name="i-lucide-arrow-right" aria-hidden="true"
      /></NuxtLink>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <BusinessCard
        v-for="business in businesses"
        :key="business.id"
        :business="business"
        show-save
        :saved="savedIds.has(business.id)"
        :save-pending="savePending"
        @toggle-save="$emit('toggleSave', business)"
      />
    </div>
  </section>
</template>
