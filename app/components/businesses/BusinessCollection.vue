<script setup lang="ts">
import BusinessCard from '@/components/businesses/BusinessCard.vue'
import type { BusinessListItem } from '~~/shared/businesses'
import { collectionPagePath } from '~~/shared/seo/categories'

const props = defineProps<{
  items: BusinessListItem[]
  total: number
  page: number
  pageSize: number
  path: string
}>()
const pages = computed(() => Math.ceil(props.total / props.pageSize))
const pageLink = (page: number) => collectionPagePath(props.path, page)
</script>

<template>
  <div>
    <div v-if="items.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <BusinessCard v-for="item in items" :key="item.id" :business="item" />
    </div>
    <div
      v-else
      class="rounded-2xl border border-[#dfe6dc] bg-white px-6 py-12 text-center sm:py-16"
    >
      <span
        class="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8f4da] text-2xl text-[#315b3a]"
        ><UIcon name="i-lucide-store"
      /></span>
      <h2 class="mt-5 text-xl font-semibold tracking-tight text-[#143e32]">
        There’s room for your business here
      </h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-[#657069]">
        No businesses are listed here yet. Explore another category or add a business for others to
        discover.
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <UButton to="/categories" color="neutral" variant="soft">Browse categories</UButton>
        <UButton to="/businesses/new" trailing-icon="i-lucide-arrow-up-right"
          >List your business</UButton
        >
      </div>
    </div>
    <nav
      v-if="pages > 1"
      aria-label="Business pages"
      class="mt-9 flex flex-wrap items-center justify-between gap-3"
    >
      <UButton
        :to="page > 1 ? pageLink(page - 1) : undefined"
        :disabled="page <= 1"
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        >Previous</UButton
      >
      <UPagination
        :page="page"
        :total="total"
        :items-per-page="pageSize"
        :sibling-count="1"
        :show-controls="false"
        :to="pageLink"
        class="hidden sm:flex"
      />
      <span class="text-sm text-[#657069] sm:hidden">Page {{ page }} of {{ pages }}</span>
      <UButton
        :to="page < pages ? pageLink(page + 1) : undefined"
        :disabled="page >= pages"
        color="neutral"
        variant="outline"
        trailing-icon="i-lucide-arrow-right"
        >Next</UButton
      >
    </nav>
  </div>
</template>
