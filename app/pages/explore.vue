<script setup lang="ts">
import BusinessCard from '@/components/businesses/BusinessCard.vue'
import FilterFields from '@/components/businesses/FilterFields.vue'
import { serializeJsonLd } from '@/utils/jsonLd'
import { authClient } from '~~/lib/auth-client'
import type { BusinessListResponse } from '~~/shared/businesses'
import { useBusinessDiscovery } from '@/composables/discovery/useBusinessDiscovery'
import {
  directoryCanonicalPath,
  directoryPage,
  directoryPageOutOfRange,
} from '~~/shared/seo/explore'

const route = useRoute()
const exploreUrl = useCanonicalUrl('/explore')
const homeUrl = useCanonicalUrl('/')
const socialImage = useCanonicalUrl('/og-image.png')
const requestedPage = computed(() => directoryPage(route.query.page))
const canonicalPath = computed(() => directoryCanonicalPath(route.query))
const canonicalUrl = computed(() =>
  canonicalPath.value ? new URL(canonicalPath.value, exploreUrl).toString() : null,
)

const { data: session } = await authClient.useSession(useFetch)
const {
  request,
  data,
  error,
  refresh,
  search,
  aiSearch,
  searchNormally,
  category,
  city,
  state,
  operationMode,
  sort,
  sortOptions,
  filtersOpen,
  interpreting,
  searchPending,
  searchNotice,
  extraCriteria,
  applyFilters,
  clearFilters,
  applySort,
  pageLink,
  removeExtraCriterion,
} = useBusinessDiscovery()
await request
const pageUnavailable = computed(
  () =>
    requestedPage.value === null ||
    (data.value?.page === requestedPage.value &&
      directoryPageOutOfRange(requestedPage.value, data.value.total, data.value.pageSize)),
)
const indexable = computed(
  () => Boolean(canonicalUrl.value) && !pageUnavailable.value && !error.value,
)
const title = computed(() =>
  requestedPage.value && requestedPage.value > 1
    ? `Explore Nigerian Businesses & Reviews — Page ${requestedPage.value} | Creda`
    : 'Explore Nigerian Businesses & Reviews | Creda',
)
if (import.meta.server) {
  if (pageUnavailable.value) setResponseStatus(404)
  else if (error.value) setResponseStatus(error.value.statusCode === 400 ? 400 : 503)
}
useSeoMeta({
  title,
  description:
    'Find online and local businesses in Nigeria. Browse by category, city or state, compare customer reviews, and explore business details.',
  robots: computed(() => (indexable.value ? 'index, follow' : 'noindex, follow')),
  ogTitle: title,
  ogDescription:
    'Find online and local businesses in Nigeria. Browse by category, city or state, compare customer reviews, and explore business details.',
  ogUrl: computed(() => canonicalUrl.value ?? exploreUrl),
  ogImage: socialImage,
  ogImageAlt: 'Discover businesses on Creda',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterImage: socialImage,
})
useHead(() => ({
  link:
    indexable.value && canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [],
  script: indexable.value
    ? [
        {
          type: 'application/ld+json',
          innerHTML: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: title.value,
            url: canonicalUrl.value,
            description:
              'Find online and local businesses in Nigeria. Browse by category, city or state, compare customer reviews, and explore business details.',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
                { '@type': 'ListItem', position: 2, name: 'Explore businesses', item: exploreUrl },
              ],
            },
          }),
        },
      ]
    : [],
}))
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
const appToast = useAppToast()

async function toggleSaved(item: BusinessListResponse['items'][number]) {
  if (savingId.value || (session.value?.user.emailVerified && savedLoadStatus.value !== 'success'))
    return
  if (!session.value) {
    await navigateTo({ path: '/login', query: { returnTo: route.fullPath } })
    return
  }
  if (!session.value.user.emailVerified) {
    appToast.warning('Verify your email to save businesses')
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
    appToast.success(result.saved ? 'Business saved' : 'Business removed from saved')
  } catch {
    appToast.error('Could not update saved businesses', 'Please try again.')
  } finally {
    savingId.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#fcfcf8] text-[#172f27]">
    <LandingHeader />
    <main class="mx-auto w-full max-w-[1920px] px-5 pb-14 pt-9 sm:px-8 sm:pt-12 xl:w-[90%] xl:px-0">
      <div
        class="flex flex-col gap-6 border-b border-[#dfe6dc] pb-7 sm:pb-9 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h1 class="text-3xl font-semibold tracking-[-.055em] text-[#143e32] sm:text-4xl">
            Explore businesses<span class="text-[#a4c43e]">.</span>
          </h1>
          <p class="mt-2 max-w-xl text-sm leading-6 text-[#657069] sm:text-base">
            Browse business profiles and find the details you need before you visit, contact, or
            buy.
          </p>
        </div>
        <nav aria-label="Browse businesses" class="shrink-0">
          <p class="mb-2 text-xs font-medium text-[#657069]">Browse by</p>
          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              to="/categories"
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe6dc] bg-white px-4 py-2 text-sm font-medium text-[#315b3a] transition-colors hover:border-[#b5c7ae] hover:bg-[#edf3e7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315b3a]"
            >
              <UIcon name="i-lucide-layout-grid" class="size-4" aria-hidden="true" />
              Categories
            </NuxtLink>
            <NuxtLink
              to="/locations"
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe6dc] bg-white px-4 py-2 text-sm font-medium text-[#315b3a] transition-colors hover:border-[#b5c7ae] hover:bg-[#edf3e7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315b3a]"
            >
              <UIcon name="i-lucide-map-pin" class="size-4" aria-hidden="true" />
              Locations
            </NuxtLink>
          </div>
        </nav>
      </div>
      <div
        v-if="session?.user.emailVerified && savedLoadStatus === 'error'"
        role="alert"
        class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <span>We couldn’t load your saved businesses.</span>
        <UButton color="neutral" variant="link" size="sm" @click="refreshSaved()"
          >Try again</UButton
        >
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
                v-model:ai-search="aiSearch"
                v-model:category="category"
                v-model:city="city"
                v-model:state="state"
                v-model:operation-mode="operationMode"
                :disabled="interpreting"
              />
            </div>
            <UButton
              type="submit"
              :loading="interpreting"
              :disabled="searchPending"
              block
              class="mt-7 !rounded-lg !bg-[#143e32] !text-white"
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
          <div
            class="flex flex-col gap-6 pb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
          >
            <div class="flex w-full items-center justify-between gap-3 lg:w-auto">
              <div class="flex min-w-0 items-center gap-2 sm:gap-3">
                <label for="directory-sort" class="shrink-0 text-sm font-semibold text-[#345341]"
                  >Sort by</label
                >
                <USelect
                  id="directory-sort"
                  v-model="sort"
                  :disabled="searchPending || Boolean(searchNotice)"
                  :items="[...sortOptions]"
                  class="min-w-0 w-36 sm:w-40"
                  :ui="{ base: '!rounded-lg !border-[#d9e2d8] !ring-0 focus:!ring-0' }"
                  @update:model-value="applySort"
                />
              </div>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-sliders-horizontal"
                aria-label="Filter businesses"
                title="Filter businesses"
                class="ml-auto shrink-0 !rounded-xl !border-[#d5dfd2] !bg-white !text-[#143e32] lg:!hidden"
                @click="filtersOpen = true"
              />
            </div>
            <NuxtLink
              to="/businesses/new"
              class="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#315c3c] hover:underline lg:self-auto"
              >List your business <UIcon name="i-lucide-arrow-up-right"
            /></NuxtLink>
          </div>
          <div
            v-if="searchNotice"
            role="status"
            class="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
          >
            <p>{{ searchNotice }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <UButton color="neutral" variant="soft" size="sm" @click="searchNormally">
                Search normally
              </UButton>
              <UButton color="neutral" variant="link" size="sm" @click="applyFilters"
                >Try again</UButton
              >
            </div>
          </div>
          <template v-if="!searchNotice">
            <div
              v-if="extraCriteria.length && !searchPending"
              class="mb-5 flex flex-wrap gap-2"
              aria-label="Additional search filters"
            >
              <button
                v-for="filter in extraCriteria"
                :key="filter.key"
                type="button"
                :aria-label="`Remove ${filter.label} filter`"
                class="inline-flex items-center gap-2 rounded-lg border border-[#d4e1cb] bg-[#edf4e7] px-3 py-2 text-xs font-medium text-[#315b3a] hover:bg-[#e3eedb]"
                @click="removeExtraCriterion(filter.key)"
              >
                {{ filter.label }}<UIcon name="i-lucide-x" />
              </button>
            </div>
            <p v-if="interpreting" role="status" class="mb-4 text-sm text-[#657069]">
              Finding businesses that match your search…
            </p>
            <div
              v-if="pageUnavailable && (!searchPending || requestedPage === null)"
              role="status"
              class="rounded-2xl border border-[#dfe6dc] bg-white p-9 sm:p-12"
            >
              <span
                class="grid size-14 place-items-center rounded-xl bg-[#e8f4da] text-2xl text-[#315b3a]"
              >
                <UIcon name="i-lucide-search-x" />
              </span>
              <h3 class="mt-5 text-2xl font-semibold tracking-tight text-[#143e32]">
                This page isn’t available.
              </h3>
              <p class="mt-2 max-w-lg text-sm leading-6 text-[#657069]">
                The page number may be incorrect, or the results may have changed. Start from the
                first page to keep exploring.
              </p>
              <UButton :to="pageLink(1)" class="mt-5">Go to the first page</UButton>
            </div>
            <div
              v-else-if="searchPending"
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
                {{
                  data?.discovery?.searchable === false
                    ? 'Let’s narrow that down.'
                    : 'No businesses found.'
                }}
              </h3>
              <p class="mt-2 max-w-lg text-sm leading-6 text-[#657069]">
                {{
                  (data?.discovery?.searchable === false ? data.discovery.clarification : null) ||
                  'Try another search or a broader filter. New businesses appear as soon as they are listed.'
                }}
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
                :match-reasons="data.reasons?.[item.id]"
                show-save
                :saved="savedIds.has(item.id)"
                :save-pending="
                  Boolean(savingId) ||
                  (Boolean(session?.user.emailVerified) && savedLoadStatus !== 'success')
                "
                @toggle-save="toggleSaved(item)"
              />
            </div>
            <div
              v-if="
                data && data.total > data.pageSize && !searchPending && !pageUnavailable && !error
              "
              class="mt-9"
            >
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
          </template>
        </section>
      </div>
    </main>
    <LandingFooter />
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
            v-model:ai-search="aiSearch"
            v-model:category="category"
            v-model:city="city"
            v-model:state="state"
            v-model:operation-mode="operationMode"
            :disabled="interpreting"
          />
        </form>
      </template>
      <template #footer>
        <UButton
          type="submit"
          form="mobile-business-filters"
          :loading="interpreting"
          :disabled="searchPending"
          block
          class="!rounded-lg !bg-[#143e32] !text-white"
          >Show businesses</UButton
        >
        <UButton color="neutral" variant="ghost" block @click="clearFilters">Clear filters</UButton>
      </template>
    </UDrawer>
  </div>
</template>
