<script setup lang="ts">
import BusinessCard from '@/components/businesses/BusinessCard.vue'
import FilterFields from '@/components/businesses/FilterFields.vue'
import {
  businessCategories,
  operationModes,
  type BusinessListResponse,
  type BusinessCategory,
  type OperationMode,
} from '~~/shared/businesses'

const canonicalUrl = useCanonicalUrl('/businesses')
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
const category = ref<BusinessCategory | 'all'>(
  businessCategories.some((item) => item.value === route.query.category)
    ? (route.query.category as BusinessCategory)
    : 'all',
)
const city = ref(String(route.query.city ?? ''))
const state = ref(String(route.query.state ?? ''))
const operationMode = ref<OperationMode | 'all'>(
  operationModes.some((item) => item.value === route.query.operationMode)
    ? (route.query.operationMode as OperationMode)
    : 'all',
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
  category: typeof route.query.category === 'string' ? route.query.category : undefined,
  location: typeof route.query.location === 'string' ? route.query.location : undefined,
  city: typeof route.query.city === 'string' ? route.query.city : undefined,
  state: typeof route.query.state === 'string' ? route.query.state : undefined,
  operationMode:
    typeof route.query.operationMode === 'string' ? route.query.operationMode : undefined,
  sort: typeof route.query.sort === 'string' ? route.query.sort : undefined,
  page: typeof route.query.page === 'string' ? route.query.page : undefined,
}))
const { data, status, error, refresh } = await useFetch<BusinessListResponse>('/api/businesses', {
  query: apiQuery,
})

watch(
  () => route.query,
  () => {
    search.value = String(route.query.q ?? '')
    category.value = businessCategories.some((item) => item.value === route.query.category)
      ? (route.query.category as BusinessCategory)
      : 'all'
    city.value = String(route.query.city ?? '')
    state.value = String(route.query.state ?? '')
    operationMode.value = operationModes.some((item) => item.value === route.query.operationMode)
      ? (route.query.operationMode as OperationMode)
      : 'all'
    sort.value = sortOptions.some((item) => item.value === route.query.sort)
      ? (route.query.sort as DirectorySort)
      : 'relevance'
  },
)

function applyFilters() {
  filtersOpen.value = false
  navigateTo({
    path: '/businesses',
    query: {
      q: search.value.trim() || undefined,
      category: category.value === 'all' ? undefined : category.value,
      city: city.value.trim() || undefined,
      state: state.value.trim() || undefined,
      operationMode: operationMode.value === 'all' ? undefined : operationMode.value,
      sort: sort.value === 'relevance' ? undefined : sort.value,
    },
  })
}

function clearFilters() {
  search.value = ''
  category.value = 'all'
  city.value = ''
  state.value = ''
  operationMode.value = 'all'
  sort.value = 'relevance'
  filtersOpen.value = false
  navigateTo('/businesses')
}

function pageLink(page: number) {
  const query = { ...route.query }
  if (page === 1) delete query.page
  else query.page = String(page)
  return { path: '/businesses', query }
}

function applySort() {
  navigateTo({
    path: '/businesses',
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
    <main>
      <section class="border-b border-[#dfe6dc] bg-[#eef3e7]">
        <div class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px] py-14 sm:py-20">
          <span
            class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold tracking-[.12em] text-[#446d4b]"
            ><UIcon name="i-lucide-compass" /> FIND YOUR NEXT GOOD BUSINESS</span
          >
          <h1
            class="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-[-.06em] text-[#143e32] sm:text-6xl"
          >
            Explore businesses<br /><span class="font-normal italic text-[#648757]"
              >worth knowing.</span
            >
          </h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-[#5b6f5f]">
            Browse real business profiles and find the details you need before you visit, contact,
            or buy.
          </p>
        </div>
      </section>
      <div
        class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px] grid gap-9 py-10 lg:grid-cols-[245px_minmax(0,1fr)] lg:py-14"
      >
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
          <div class="mb-6 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-2xl font-semibold tracking-tight text-[#143e32]">The directory</h2>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-sliders-horizontal"
                aria-label="Filter businesses"
                title="Filter businesses"
                class="!rounded-xl !border-[#d5dfd2] !bg-white !text-[#143e32] lg:!hidden"
                @click="filtersOpen = true"
              />
            </div>
            <NuxtLink
              to="/businesses/new"
              class="inline-flex self-start items-center gap-2 text-sm font-semibold text-[#315c3c] hover:underline lg:self-auto"
              >List your business <UIcon name="i-lucide-arrow-up-right"
            /></NuxtLink>
          </div>
          <div class="mb-6 flex flex-wrap items-center justify-end gap-3">
            <div class="flex items-center gap-2">
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
              to="/businesses"
              class="mt-5 inline-flex text-sm font-semibold text-[#315b3a] hover:underline"
              >Browse all businesses</NuxtLink
            >
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <BusinessCard v-for="item in data.items" :key="item.id" :business="item" />
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
