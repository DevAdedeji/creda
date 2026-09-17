<script setup lang="ts">
import BusinessCard from '@/components/businesses/BusinessCard.vue'
import FilterFields from '@/components/businesses/FilterFields.vue'
import { authClient } from '~~/lib/auth-client'
import {
  businessCategories,
  operationModes,
  type BusinessListResponse,
  type BusinessCategory,
  type OperationMode,
} from '~~/shared/businesses'

const canonicalUrl = useCanonicalUrl('/explore')
const socialImage = useCanonicalUrl('/og-image.png')

useSeoMeta({
  title: 'Explore businesses — Creda',
  description: 'Find businesses worth knowing, starting in Nigeria.',
  ogTitle: 'Explore businesses — Creda',
  ogDescription: 'Find businesses worth knowing, starting in Nigeria.',
  ogUrl: canonicalUrl,
  ogImage: socialImage,
  ogImageAlt: 'Discover businesses on Creda',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterImage: socialImage,
})
useHead({ link: [{ rel: 'canonical', href: canonicalUrl }] })

const route = useRoute()
const filtersOpen = ref(false)
const search = ref(String(route.query.q ?? ''))
function selectedValues<T extends string>(value: unknown, options: readonly { value: T }[]): T[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  return [
    ...new Set(values.filter((item): item is T => options.some((option) => option.value === item))),
  ]
}
const category = ref<BusinessCategory[]>(selectedValues(route.query.category, businessCategories))
const city = ref(String(route.query.city ?? ''))
const state = ref(String(route.query.state ?? ''))
const operationMode = ref<OperationMode[]>(
  selectedValues(route.query.operationMode, operationModes),
)
const sortOptions = [
  { label: 'Best match', value: 'relevance' },
  { label: 'Top rated', value: 'top_rated' },
  { label: 'Most reviewed', value: 'most_reviewed' },
  { label: 'Newest', value: 'newest' },
] as const
type DirectorySort = (typeof sortOptions)[number]['value']
const sort = ref<DirectorySort>(
  sortOptions.some((item) => item.value === route.query.sort)
    ? (route.query.sort as DirectorySort)
    : 'relevance',
)
const apiQuery = computed(() => ({
  q: typeof route.query.q === 'string' ? route.query.q : undefined,
  category: route.query.category ?? undefined,
  location: typeof route.query.location === 'string' ? route.query.location : undefined,
  city: typeof route.query.city === 'string' ? route.query.city : undefined,
  state: typeof route.query.state === 'string' ? route.query.state : undefined,
  operationMode: route.query.operationMode ?? undefined,
  sort: typeof route.query.sort === 'string' ? route.query.sort : undefined,
  page: typeof route.query.page === 'string' ? route.query.page : undefined,
}))
const { data, status, error, refresh } = await useFetch<BusinessListResponse>('/api/businesses', {
  query: apiQuery,
})
const { data: session } = await authClient.useSession(useFetch)
const visibleIds = computed(() =>
  session.value?.user.emailVerified
    ? (data.value?.items.map((item) => item.id).join(',') ?? '')
    : '',
)
const {
  data: savedStatus,
  status: savedLoadStatus,
  refresh: refreshSaved,
} = await useFetch<{ ids: string[] }>('/api/my/saved-businesses/status', {
  query: computed(() => ({ ids: visibleIds.value || undefined })),
  immediate: Boolean(visibleIds.value),
})
const savedIds = computed(() => new Set(savedStatus.value?.ids ?? []))
const savingId = ref<string | null>(null)
const toast = useToast()

async function toggleSaved(item: BusinessListResponse['items'][number]) {
  if (savingId.value || (session.value?.user.emailVerified && savedLoadStatus.value !== 'success'))
    return
  if (!session.value) {
    await navigateTo({ path: '/login', query: { returnTo: route.fullPath } })
    return
  }
  if (!session.value.user.emailVerified) {
    toast.add({ title: 'Verify your email to save businesses', color: 'warning' })
    return
  }
  savingId.value = item.id
  const wasSaved = savedIds.value.has(item.id)
  try {
    const result = await $fetch<{ saved: boolean }>(`/api/my/saved-businesses/${item.id}`, {
      method: wasSaved ? 'DELETE' : 'PUT',
    })
    const next = new Set(savedIds.value)
    if (result.saved) next.add(item.id)
    else next.delete(item.id)
    savedStatus.value = { ids: [...next] }
    toast.add({
      title: result.saved ? 'Saved to your businesses' : 'Removed from saved businesses',
      color: 'success',
    })
  } catch {
    toast.add({
      title: 'Could not update saved businesses',
      description: 'Please try again.',
      color: 'error',
    })
  } finally {
    savingId.value = null
  }
}

watch(
  () => route.query,
  () => {
    search.value = String(route.query.q ?? '')
    category.value = selectedValues(route.query.category, businessCategories)
    city.value = String(route.query.city ?? '')
    state.value = String(route.query.state ?? '')
    operationMode.value = selectedValues(route.query.operationMode, operationModes)
    sort.value = sortOptions.some((item) => item.value === route.query.sort)
      ? (route.query.sort as DirectorySort)
      : 'relevance'
  },
)

function applyFilters() {
  filtersOpen.value = false
  navigateTo({
    path: '/explore',
    query: {
      q: search.value.trim() || undefined,
      category: category.value.length ? category.value : undefined,
      city: city.value.trim() || undefined,
      state: state.value.trim() || undefined,
      operationMode: operationMode.value.length ? operationMode.value : undefined,
      sort: sort.value === 'relevance' ? undefined : sort.value,
    },
  })
}

function clearFilters() {
  search.value = ''
  category.value = []
  city.value = ''
  state.value = ''
  operationMode.value = []
  sort.value = 'relevance'
  filtersOpen.value = false
  navigateTo('/explore')
}

function pageLink(page: number) {
  const query = { ...route.query }
  if (page === 1) delete query.page
  else query.page = String(page)
  return { path: '/explore', query }
}

function applySort() {
  navigateTo({
    path: '/explore',
    query: {
      ...route.query,
      sort: sort.value === 'relevance' ? undefined : sort.value,
      page: undefined,
    },
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#fcfcf8] text-[#172f27]">
    <LandingHeader />
    <main class="mx-auto w-full max-w-[1920px] px-5 pb-14 pt-9 sm:px-8 sm:pt-12 xl:w-[90%] xl:px-0">
      <div class="border-b border-[#dfe6dc] pb-7 sm:pb-9">
        <h1 class="text-3xl font-semibold tracking-[-.055em] text-[#143e32] sm:text-4xl">
          Explore businesses<span class="text-[#a4c43e]">.</span>
        </h1>
        <p class="mt-2 max-w-xl text-sm leading-6 text-[#657069] sm:text-base">
          Browse business profiles and find the details you need before you visit, contact, or buy.
        </p>
      </div>
      <div class="grid gap-9 py-8 lg:grid-cols-[245px_minmax(0,1fr)] lg:py-10">
        <aside class="hidden lg:block">
          <form
            class="rounded-2xl border border-[#dfe6dc] bg-white p-5 lg:sticky lg:top-28"
            aria-label="Filter businesses"
            @submit.prevent="applyFilters"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[#143e32]">Filter results</h2>
              <UIcon name="i-lucide-sliders-horizontal" class="text-[#5f785d]" />
            </div>
            <div class="mt-6">
              <FilterFields
                v-model:search="search"
                v-model:category="category"
                v-model:city="city"
                v-model:state="state"
                v-model:operation-mode="operationMode"
              />
            </div>
            <UButton type="submit" block class="mt-7 !rounded-lg !bg-[#143e32] !text-white"
              >Show businesses</UButton
            >
            <button
              type="button"
              class="mt-4 block w-full text-center text-xs font-semibold text-[#657069] hover:underline"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </form>
        </aside>

        <section aria-live="polite">
          <h2 class="sr-only">Business listings</h2>
          <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-sliders-horizontal"
                aria-label="Filter businesses"
                title="Filter businesses"
                class="!rounded-xl !border-[#d5dfd2] !bg-white !text-[#143e32] lg:!hidden"
                @click="filtersOpen = true"
              />
              <label for="directory-sort" class="text-sm font-semibold text-[#345341]"
                >Sort by</label
              >
              <USelect
                id="directory-sort"
                v-model="sort"
                :items="[...sortOptions]"
                class="min-w-40"
                :ui="{ base: '!rounded-lg !border-[#d9e2d8] !ring-0 focus:!ring-0' }"
                @update:model-value="applySort"
              />
            </div>
            <NuxtLink
              to="/businesses/new"
              class="inline-flex items-center gap-2 text-sm font-semibold text-[#315c3c] hover:underline"
              >List your business <UIcon name="i-lucide-arrow-up-right"
            /></NuxtLink>
          </div>
          <div
            v-if="session?.user.emailVerified && savedLoadStatus === 'error'"
            role="alert"
            class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <span>We couldn’t load your saved businesses.</span>
            <UButton color="neutral" variant="link" size="sm" @click="refreshSaved()"
              >Try again</UButton
            >
          </div>
          <div
            v-if="status === 'pending'"
            class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading businesses"
          >
            <div v-for="n in 6" :key="n" class="h-72 animate-pulse rounded-2xl bg-[#e8eee4]" />
          </div>
          <div v-else-if="error" class="rounded-2xl border border-red-200 bg-white p-8">
            <h3 class="text-lg font-semibold text-red-800">We couldn’t load the directory.</h3>
            <p class="mt-2 text-sm text-[#657069]">Please try again in a moment.</p>
            <UButton color="neutral" variant="outline" class="mt-5" @click="refresh()"
              >Try again</UButton
            >
          </div>
          <div
            v-else-if="!data?.items.length"
            class="rounded-2xl border border-[#dfe6dc] bg-white p-9 sm:p-12"
          >
            <span
              class="grid size-14 place-items-center rounded-xl bg-[#e8f4da] text-2xl text-[#315b3a]"
              ><UIcon name="i-lucide-search-x"
            /></span>
            <h3 class="mt-5 text-2xl font-semibold tracking-tight text-[#143e32]">
              No businesses found.
            </h3>
            <p class="mt-2 max-w-lg text-sm leading-6 text-[#657069]">
              Try another search or a broader filter. New businesses appear as soon as they are
              listed.
            </p>
            <NuxtLink
              to="/explore"
              class="mt-5 inline-flex text-sm font-semibold text-[#315b3a] hover:underline"
              >Browse all businesses</NuxtLink
            >
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <BusinessCard
              v-for="item in data.items"
              :key="item.id"
              :business="item"
              show-save
              :saved="savedIds.has(item.id)"
              :save-pending="
                Boolean(savingId) ||
                (Boolean(session?.user.emailVerified) && savedLoadStatus !== 'success')
              "
              @toggle-save="toggleSaved(item)"
            />
          </div>
          <div v-if="data && data.total > data.pageSize" class="mt-9">
            <nav
              aria-label="Business pages"
              class="flex flex-wrap items-center justify-between gap-3"
            >
              <UButton
                :to="data.page > 1 ? pageLink(data.page - 1) : undefined"
                :disabled="data.page <= 1"
                size="sm"
                color="neutral"
                variant="outline"
                class="!rounded-lg"
                icon="i-lucide-arrow-left"
                >Previous</UButton
              >
              <UPagination
                :page="data.page"
                :total="data.total"
                :items-per-page="data.pageSize"
                :sibling-count="1"
                :show-controls="false"
                :to="pageLink"
                class="hidden sm:flex"
              />
              <span class="text-sm text-[#657069] sm:hidden">
                Page {{ data.page }} of {{ Math.ceil(data.total / data.pageSize) }}
              </span>
              <UButton
                :to="data.page * data.pageSize < data.total ? pageLink(data.page + 1) : undefined"
                :disabled="data.page * data.pageSize >= data.total"
                size="sm"
                color="neutral"
                variant="outline"
                class="!rounded-lg"
                trailing-icon="i-lucide-arrow-right"
                >Next</UButton
              >
            </nav>
          </div>
        </section>
      </div>
    </main>
    <UDrawer
      v-model:open="filtersOpen"
      title="Filter results"
      close
      :ui="{
        content: 'max-h-[90dvh] rounded-t-3xl bg-white',
        container: 'max-h-[90dvh] !gap-0 !overflow-hidden !p-0',
        header: 'shrink-0 border-b border-[#e5ebe2] px-6 py-5',
        body: 'min-h-0 overflow-y-auto px-6 py-6',
        footer:
          'shrink-0 border-t border-[#e5ebe2] px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4',
      }"
    >
      <template #body>
        <form id="mobile-business-filters" @submit.prevent="applyFilters">
          <FilterFields
            v-model:search="search"
            v-model:category="category"
            v-model:city="city"
            v-model:state="state"
            v-model:operation-mode="operationMode"
          />
        </form>
      </template>
      <template #footer>
        <UButton
          type="submit"
          form="mobile-business-filters"
          block
          class="!rounded-lg !bg-[#143e32] !text-white"
          >Show businesses</UButton
        >
        <UButton color="neutral" variant="ghost" block @click="clearFilters">Clear filters</UButton>
      </template>
    </UDrawer>
  </div>
</template>
