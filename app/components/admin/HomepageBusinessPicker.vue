<script setup lang="ts">
import { authInputUi } from '@/utils/authInputUi'
import type { BusinessListResponse, BusinessListItem } from '~~/shared/businesses'
import { HOMEPAGE_FEATURED_LIMIT, type HomepageBusiness } from '~~/shared/homepage'

defineProps<{ purpose: 'hero' | 'featured'; selectedIds: string[] }>()
const emit = defineEmits<{ close: []; select: [business: HomepageBusiness] }>()
const draftSearch = ref('')
const query = ref({ q: '', page: 1 })
const { data, status, error, refresh } = useFetch<BusinessListResponse>('/api/businesses', {
  query,
  retry: 0,
})

function search() {
  query.value = { q: draftSearch.value.trim(), page: 1 }
}

function select(business: BusinessListItem) {
  emit('select', {
    id: business.id,
    name: business.name,
    slug: business.slug,
    logoUrl: business.logoUrl,
    status: 'approved',
  })
}
</script>

<template>
  <UModal
    :open="true"
    :title="purpose === 'hero' ? 'Choose the hero business' : 'Choose featured businesses'"
    description="Search the public directory. Your selections go live when you save the homepage."
    :ui="{ content: 'sm:max-w-xl' }"
    @update:open="
      (open) => {
        if (!open) emit('close')
      }
    "
  >
    <template #body>
      <form class="flex items-center gap-2" role="search" @submit.prevent="search">
        <UInput
          v-model="draftSearch"
          aria-label="Search businesses by name"
          placeholder="Search by business name"
          icon="i-lucide-search"
          :ui="authInputUi"
          :maxlength="120"
          class="min-w-0 flex-1"
        />
        <UButton type="submit" :loading="status === 'pending'">Search</UButton>
      </form>
      <p v-if="purpose === 'featured'" class="mt-3 text-xs text-[#667768]" role="status">
        {{ selectedIds.length }} of {{ HOMEPAGE_FEATURED_LIMIT }} featured spots selected
      </p>
      <div v-if="status === 'pending'" class="mt-5 space-y-3" aria-label="Loading businesses">
        <div v-for="item in 4" :key="item" class="h-20 animate-pulse rounded-xl bg-[#edf1e8]" />
      </div>
      <UiFeedbackAlert
        v-else-if="error"
        tone="error"
        message="Businesses could not be loaded."
        class="mt-5"
      >
        <UButton color="neutral" variant="soft" class="mt-3" @click="refresh()">Try again</UButton>
      </UiFeedbackAlert>
      <div v-else-if="!data?.items.length" class="py-12 text-center">
        <UIcon name="i-lucide-search-x" class="size-8 text-[#7b9475]" />
        <p class="mt-3 font-semibold">No public businesses found</p>
        <p class="mt-2 text-sm text-[#667768]">Try another name or clear your search.</p>
      </div>
      <div v-else class="mt-5 space-y-2">
        <div
          v-for="business in data.items"
          :key="business.id"
          class="flex items-center gap-3 rounded-xl border border-[#e1e8dc] p-3"
        >
          <NuxtImg
            v-if="business.logoUrl"
            :src="business.logoUrl"
            alt=""
            width="40"
            height="40"
            class="size-10 rounded-lg object-cover"
          />
          <span
            v-else
            class="grid size-10 shrink-0 place-items-center rounded-lg bg-[#edf4e4] font-semibold text-[#315b3a]"
            >{{ business.name.charAt(0) }}</span
          >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">{{ business.name }}</p>
            <p class="mt-1 truncate text-xs text-[#738174]">/{{ business.slug }}</p>
          </div>
          <UButton
            :icon="selectedIds.includes(business.id) ? 'i-lucide-check' : 'i-lucide-plus'"
            :disabled="selectedIds.includes(business.id)"
            color="neutral"
            variant="soft"
            :aria-label="`${selectedIds.includes(business.id) ? 'Selected' : 'Select'} ${business.name}`"
            @click="select(business)"
          >
            {{ selectedIds.includes(business.id) ? 'Selected' : 'Select' }}
          </UButton>
        </div>
        <div v-if="data.total > data.pageSize" class="flex items-center justify-between gap-3 pt-4">
          <UButton
            color="neutral"
            variant="soft"
            :disabled="data.page <= 1"
            @click="query = { ...query, page: data.page - 1 }"
            >Previous</UButton
          >
          <span class="text-xs text-[#667768]"
            >{{ data.page }} / {{ Math.ceil(data.total / data.pageSize) }}</span
          >
          <UButton
            color="neutral"
            variant="soft"
            :disabled="data.page * data.pageSize >= data.total"
            @click="query = { ...query, page: data.page + 1 }"
            >Next</UButton
          >
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="soft" @click="emit('close')">Done</UButton>
      </div>
    </template>
  </UModal>
</template>
