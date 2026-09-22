<script setup lang="ts">
import type { BusinessListItem } from '~~/shared/businesses'

const props = defineProps<{ slug: string }>()
const { data, status, error, refresh } = await useFetch<{ items: BusinessListItem[] }>(
  () => `/api/businesses/${encodeURIComponent(props.slug)}/related`,
)
</script>

<template>
  <section
    v-if="status === 'pending' || error || data?.items.length"
    class="mt-12 border-t border-[#dfe6dc] pt-8"
    aria-labelledby="related-businesses-heading"
  >
    <h2
      id="related-businesses-heading"
      class="text-2xl font-semibold tracking-tight text-[#143e32]"
    >
      More in this category
    </h2>
    <p class="mt-2 text-sm leading-6 text-[#657069]">
      Other businesses to explore. Compare their details and customer experiences.
    </p>
    <div
      v-if="status === 'pending'"
      class="mt-6 grid gap-5 md:grid-cols-3"
      aria-label="Loading related businesses"
      role="status"
    >
      <div v-for="item in 3" :key="item" class="h-56 animate-pulse rounded-2xl bg-[#e8eee4]" />
      <span class="sr-only">Loading related businesses</span>
    </div>
    <div
      v-else-if="error"
      class="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe6dc] bg-white p-5"
    >
      <p class="text-sm text-[#657069]">We couldn’t load other businesses right now.</p>
      <UButton color="neutral" variant="soft" @click="refresh()">Try again</UButton>
    </div>
    <div v-else class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <BusinessesBusinessCard v-for="item in data?.items" :key="item.id" :business="item" />
    </div>
  </section>
</template>
