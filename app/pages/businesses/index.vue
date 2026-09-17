<script setup lang="ts">
import BusinessCard from '../../components/businesses/BusinessCard.vue'
import { authInputUi } from '../../utils/authInputUi'
import {
  businessCategories,
  businessTypes,
  type BusinessListResponse,
  type BusinessCategory,
  type BusinessType,
} from '~~/shared/businesses'

useSeoMeta({
  title: 'Explore businesses — Creda',
  description: 'Find businesses worth knowing, starting in Nigeria.',
})

const route = useRoute()
const search = ref(String(route.query.q ?? ''))
const category = ref<BusinessCategory | 'all'>(
  businessCategories.some((item) => item.value === route.query.category)
    ? (route.query.category as BusinessCategory)
    : 'all',
)
const businessType = ref<BusinessType | 'all'>(
  businessTypes.some((item) => item.value === route.query.businessType)
    ? (route.query.businessType as BusinessType)
    : 'all',
)
const location = ref(String(route.query.location ?? ''))
const categoryItems = [{ label: 'All categories', value: 'all' }, ...businessCategories]
const typeItems = [{ label: 'All types', value: 'all' }, ...businessTypes]

const apiQuery = computed(() => ({
  q: typeof route.query.q === 'string' ? route.query.q : undefined,
  category: typeof route.query.category === 'string' ? route.query.category : undefined,
  businessType: typeof route.query.businessType === 'string' ? route.query.businessType : undefined,
  location: typeof route.query.location === 'string' ? route.query.location : undefined,
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
    businessType.value = businessTypes.some((item) => item.value === route.query.businessType)
      ? (route.query.businessType as BusinessType)
      : 'all'
    location.value = String(route.query.location ?? '')
  },
)

function applyFilters() {
  navigateTo({
    path: '/businesses',
    query: {
      q: search.value.trim() || undefined,
      category: category.value === 'all' ? undefined : category.value,
      businessType: businessType.value === 'all' ? undefined : businessType.value,
      location: location.value.trim() || undefined,
    },
  })
}

function pageLink(page: number) {
  return { path: '/businesses', query: { ...route.query, page: String(page) } }
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
        <aside>
          <form
            class="rounded-2xl border border-[#dfe6dc] bg-white p-5 lg:sticky lg:top-28"
            aria-label="Filter businesses"
            @submit.prevent="applyFilters"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[#143e32]">Filter results</h2>
              <UIcon name="i-lucide-sliders-horizontal" class="text-[#5f785d]" />
            </div>
            <div class="mt-6 space-y-5">
              <UFormField label="Search" name="q"
                ><UInput
                  v-model="search"
                  name="q"
                  placeholder="Name or keyword"
                  leading-icon="i-lucide-search"
                  class="w-full"
                  :ui="authInputUi"
              /></UFormField>
              <UFormField label="Category" name="category">
                <USelect
                  v-model="category"
                  :items="categoryItems"
                  name="category"
                  class="w-full"
                  :ui="authInputUi"
                />
              </UFormField>
              <UFormField label="Type" name="businessType">
                <USelect
                  v-model="businessType"
                  :items="typeItems"
                  name="businessType"
                  class="w-full"
                  :ui="authInputUi"
                />
              </UFormField>
              <UFormField label="Location" name="location"
                ><UInput
                  v-model="location"
                  name="location"
                  placeholder="Any location"
                  class="w-full"
                  :ui="authInputUi"
              /></UFormField>
            </div>
            <UButton type="submit" block class="mt-7 !rounded-lg !bg-[#143e32] !text-white"
              >Show businesses</UButton
            >
            <NuxtLink
              to="/businesses"
              class="mt-4 block text-center text-xs font-semibold text-[#657069] hover:underline"
              >Clear filters</NuxtLink
            >
          </form>
        </aside>

        <section aria-live="polite">
          <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-xs font-bold tracking-[.14em] text-[#668269]">THE DIRECTORY</p>
              <h2 class="mt-1 text-2xl font-semibold tracking-tight text-[#143e32]">
                {{ data?.total ?? 0 }} {{ data?.total === 1 ? 'business' : 'businesses' }}
              </h2>
            </div>
            <NuxtLink
              to="/businesses/new"
              class="inline-flex items-center gap-2 text-sm font-semibold text-[#315c3c] hover:underline"
              >List your business <UIcon name="i-lucide-arrow-up-right"
            /></NuxtLink>
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
              Try another search or a broader filter. New businesses are added as their profiles are
              reviewed.
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
          <div
            v-if="data && data.total > data.pageSize"
            class="mt-9 flex items-center justify-between gap-4"
          >
            <UButton
              v-if="data.page > 1"
              :to="pageLink(data.page - 1)"
              color="neutral"
              variant="outline"
              class="!rounded-lg"
              icon="i-lucide-arrow-left"
              >Previous</UButton
            ><span v-else />
            <span class="text-sm text-[#657069]"
              >Page {{ data.page }} of {{ Math.ceil(data.total / data.pageSize) }}</span
            >
            <UButton
              v-if="data.page * data.pageSize < data.total"
              :to="pageLink(data.page + 1)"
              color="neutral"
              variant="outline"
              class="!rounded-lg"
              trailing-icon="i-lucide-arrow-right"
              >Next</UButton
            ><span v-else />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
