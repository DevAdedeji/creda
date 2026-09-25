<script setup lang="ts">
import { categoryPath } from '~~/shared/seo/categories'
import type { BusinessCategory } from '~~/shared/businesses'
import { trackAnalyticsEvent } from '@/utils/analytics'
import SearchPanel from '@/components/landing/SearchPanel.vue'
import BusinessCollection from '@/components/landing/BusinessCollection.vue'
import { useBusinessBookmarks } from '@/composables/businesses/useBusinessBookmarks'
import type { HomepageBusinesses } from '~~/shared/homepage'
import type { LocationLink } from '~~/shared/seo/locations'
import { serializeJsonLd } from '@/utils/jsonLd'

const canonicalUrl = useCanonicalUrl('/')
const socialImage = useCanonicalUrl('/og-image.png')
const siteOrigin = new URL(canonicalUrl).origin

useSeoMeta({
  title: 'Creda — Discover Nigerian Businesses & Customer Reviews',
  description:
    'Discover online and local businesses in Nigeria. Read customer reviews, explore services and photos, and find the right business for you.',
  ogTitle: 'Creda — Discover Nigerian Businesses & Customer Reviews',
  ogDescription:
    'Discover online and local businesses in Nigeria. Explore business details, photos and customer reviews.',
  ogUrl: canonicalUrl,
  ogImage: socialImage,
  ogImageAlt: 'Creda — Discover Nigerian Businesses & Customer Reviews',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterImage: socialImage,
})
useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonLd({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${siteOrigin}/#organization`,
            name: 'Creda',
            url: canonicalUrl,
            logo: useCanonicalUrl('/creda-logo.png'),
          },
          {
            '@type': 'WebSite',
            '@id': `${siteOrigin}/#website`,
            name: 'Creda',
            url: canonicalUrl,
            inLanguage: 'en-NG',
            publisher: { '@id': `${siteOrigin}/#organization` },
          },
        ],
      }),
    },
  ],
})

const categories: { label: string; value: BusinessCategory; icon: string }[] = [
  { label: 'Food & drink', value: 'food', icon: 'i-lucide-utensils' },
  { label: 'Shopping', value: 'retail', icon: 'i-lucide-shopping-bag' },
  { label: 'Beauty & wellness', value: 'beauty', icon: 'i-lucide-sparkles' },
  { label: 'Home services', value: 'home_services', icon: 'i-lucide-house' },
  { label: 'Software & apps', value: 'software', icon: 'i-lucide-monitor-smartphone' },
  { label: 'Professional services', value: 'services', icon: 'i-lucide-briefcase-business' },
]

const directoryRequest = useFetch<HomepageBusinesses>('/api/homepage', {
  key: 'homepage-businesses',
  retry: 0,
})
const locationRequest = useFetch<LocationLink[]>('/api/locations', {
  key: 'homepage-locations',
  retry: 0,
})
await Promise.all([directoryRequest, locationRequest])
const {
  data: directory,
  status: directoryStatus,
  error: directoryError,
  refresh: refreshDirectory,
} = directoryRequest
const {
  data: locationData,
  status: locationStatus,
  error: locationError,
  refresh: refreshLocations,
} = locationRequest
const visibleBusinesses = computed(() => [
  ...(directory.value?.featured ?? []),
  ...(directory.value?.recent ?? []),
])
const { savedIds, pending: savePending, toggleSaved } = useBusinessBookmarks(visibleBusinesses)
const locations = computed(() =>
  (locationData.value ?? [])
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, 8),
)

function trackHomepageLink(event: MouseEvent) {
  const anchor = event.target instanceof Element ? event.target.closest('a') : null
  if (!anchor || anchor.origin !== window.location.origin) return
  const path = anchor.pathname
  if (path === '/explore' || path.startsWith('/categories') || path.startsWith('/locations')) {
    trackAnalyticsEvent('homepage_browse_clicked', { destination: path.split('/')[1] || 'explore' })
  } else if (path === '/businesses/new') {
    trackAnalyticsEvent('listing_cta_clicked', { surface: 'homepage' })
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-[#fcfcf8] text-[#172f27]"
    @click="trackHomepageLink"
    @auxclick.middle="trackHomepageLink"
  >
    <a
      class="fixed -top-24 left-5 z-50 rounded-lg bg-[#143e32] px-5 py-3 text-white focus:top-4"
      href="#main"
      >Skip to content</a
    >
    <LandingHeader />
    <main id="main" class="mx-auto w-full max-w-[1920px] px-5 pb-12 sm:px-8 xl:w-[90%] xl:px-0">
      <SearchPanel />
      <nav
        aria-label="Browse business categories"
        class="flex items-center gap-2 overflow-x-auto border-b sm:flex-wrap [&::-webkit-scrollbar]:hidden [scrollbar-width:none] border-[#dfe6dc] py-5 sm:gap-2.5"
      >
        <NuxtLink
          v-for="category in categories"
          :key="category.value"
          :to="categoryPath(category.value)"
          class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#dfe6dc] bg-white px-3.5 text-sm font-medium text-[#345341] transition hover:border-[#71906c] hover:bg-[#eff5e8]"
        >
          <UIcon :name="category.icon" aria-hidden="true" />{{ category.label }}
        </NuxtLink>
        <NuxtLink
          to="/categories"
          class="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >All categories<UIcon name="i-lucide-arrow-right" aria-hidden="true"
        /></NuxtLink>
      </nav>

      <div
        v-if="directoryStatus === 'pending'"
        role="status"
        aria-label="Loading businesses"
        class="py-8"
      >
        <div class="mb-5 h-8 w-56 animate-pulse rounded-lg bg-[#e9efe2]" />
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div v-for="n in 6" :key="n" class="h-80 animate-pulse rounded-2xl bg-[#edf2e8]" />
        </div>
      </div>
      <div
        v-else-if="directoryError"
        role="alert"
        class="my-8 rounded-2xl border border-[#dfe6dc] bg-white p-7"
      >
        <UIcon name="i-lucide-wifi-off" class="text-2xl text-[#637463]" aria-hidden="true" />
        <h2 class="mt-3 text-xl font-semibold">Businesses couldn’t be loaded</h2>
        <p class="mt-2 text-sm text-[#657069]">
          Please try again. You can still search or browse categories above.
        </p>
        <UButton color="neutral" variant="soft" class="mt-5 min-h-11" @click="refreshDirectory()"
          >Try again</UButton
        >
      </div>
      <template v-else>
        <NuxtLink
          v-if="directory?.hero"
          :to="'/businesses/' + directory.hero.slug"
          class="group mt-7 flex items-center gap-4 rounded-2xl border border-[#d3dfca] bg-[#eff5e8] p-4 sm:px-6"
        >
          <NuxtImg
            v-if="directory.hero.logoUrl"
            :src="directory.hero.logoUrl"
            alt=""
            width="56"
            height="56"
            format="webp"
            class="size-14 shrink-0 rounded-xl border border-[#dfe6dc] bg-white object-cover"
          />
          <span
            v-else
            class="grid size-14 shrink-0 place-items-center rounded-xl bg-[#dff0d7] text-xl font-semibold text-[#28583c]"
            >{{ directory.hero.name.charAt(0).toUpperCase() }}</span
          >
          <span class="min-w-0 flex-1">
            <span
              class="mb-0.5 block text-[11px] font-semibold uppercase tracking-[.1em] text-[#5d7b61]"
              >In the spotlight</span
            >
            <span class="block font-semibold text-[#143e32]"
              >{{ directory.hero.name }}
              <BusinessesVerifiedMark v-if="directory.hero.ownershipStatus === 'verified'" in-link
            /></span>
            <span class="mt-1 hidden truncate text-sm text-[#657069] sm:block">{{
              directory.hero.description
            }}</span>
          </span>
          <span class="hidden text-sm font-semibold text-[#315b3a] lg:inline">View business</span>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="shrink-0 text-xl text-[#315b3a]"
            aria-hidden="true"
          />
        </NuxtLink>
        <BusinessCollection
          v-if="directory?.featured.length"
          heading-id="featured-heading"
          title="Featured businesses"
          description="A few places and brands to get you started."
          :businesses="directory.featured"
          :saved-ids="savedIds"
          :save-pending="savePending"
          more-link="/explore"
          more-label="Explore all businesses"
          @toggle-save="toggleSaved"
        />
        <BusinessCollection
          v-if="directory?.recent.length"
          heading-id="recent-heading"
          title="Recently added"
          description="Meet the latest businesses on Creda."
          :businesses="directory.recent"
          :saved-ids="savedIds"
          :save-pending="savePending"
          more-link="/explore?sort=newest"
          more-label="See more new businesses"
          :class="{ 'border-t border-[#dfe6dc]': directory.featured.length }"
          @toggle-save="toggleSaved"
        />
        <div
          v-if="!directory?.hero && !visibleBusinesses.length"
          class="my-8 rounded-2xl border border-[#dfe6dc] bg-white px-6 py-10 text-center"
        >
          <UIcon name="i-lucide-store" class="text-3xl text-[#5d7b61]" aria-hidden="true" />
          <h2 class="mt-3 text-xl font-semibold">Help your next customer find you</h2>
          <p class="mt-2 text-sm text-[#657069]">
            Be one of the first businesses people discover on Creda.
          </p>
          <UButton
            to="/businesses/new"
            class="mt-5 min-h-11"
            trailing-icon="i-lucide-arrow-up-right"
            >List your business</UButton
          >
        </div>
      </template>

      <section aria-labelledby="locations-heading" class="border-t border-[#dfe6dc] py-8 sm:py-10">
        <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="locations-heading"
              class="text-2xl font-semibold tracking-[-.04em] text-[#143e32] sm:text-3xl"
            >
              Explore by location
            </h2>
            <p class="mt-1.5 text-sm leading-6 text-[#657069]">
              Find businesses you can visit or meet in person.
            </p>
          </div>
          <NuxtLink
            to="/locations"
            class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
            >All locations<UIcon name="i-lucide-arrow-right" aria-hidden="true"
          /></NuxtLink>
        </div>
        <div
          v-if="locationStatus === 'pending'"
          class="grid grid-cols-2 gap-3 lg:grid-cols-4"
          role="status"
          aria-label="Loading locations"
        >
          <div v-for="n in 4" :key="n" class="h-24 animate-pulse rounded-xl bg-[#edf2e8]" />
        </div>
        <div
          v-else-if="locationError"
          class="flex flex-wrap items-center gap-3 rounded-xl border border-[#dfe6dc] p-5"
          role="alert"
        >
          <p class="flex-1 text-sm text-[#657069]">Locations couldn’t be loaded.</p>
          <UButton color="neutral" variant="soft" class="min-h-11" @click="refreshLocations()"
            >Try again</UButton
          >
        </div>
        <div v-else-if="locations.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="location in locations"
            :key="location.path"
            :to="location.path"
            class="group flex min-h-24 items-center gap-3 rounded-xl border border-[#dfe6dc] bg-white p-4 transition hover:border-[#71906c] hover:bg-[#f6f9f2]"
          >
            <span
              class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eff5e8] text-xl text-[#315b3a]"
              ><UIcon name="i-lucide-map-pin" aria-hidden="true"
            /></span>
            <span class="min-w-0 flex-1"
              ><span class="block text-sm font-semibold">{{ location.name }}</span
              ><span class="mt-1 block text-xs text-[#657069]"
                >{{ location.total }} {{ location.total === 1 ? 'business' : 'businesses' }}</span
              ></span
            >
            <UIcon name="i-lucide-arrow-right" class="shrink-0 text-[#5d7b61]" aria-hidden="true" />
          </NuxtLink>
        </div>
        <p v-else class="text-sm leading-6 text-[#657069]">
          The local directory is growing.
          <NuxtLink to="/explore" class="font-semibold text-[#315b3a] underline"
            >Explore online businesses</NuxtLink
          >
          while more places join.
        </p>
      </section>
      <section
        id="for-businesses"
        aria-labelledby="owner-heading"
        class="flex flex-col justify-between gap-6 rounded-2xl bg-[#143e32] p-6 text-white sm:p-8 lg:flex-row lg:items-center"
      >
        <div class="max-w-2xl">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#d8f36a]">
            For business owners
          </p>
          <h2 id="owner-heading" class="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">
            Your business belongs here.
          </h2>
          <p class="mt-3 text-sm leading-6 text-[#d4e1d8]">
            Create a free profile with your services, photos, and customer reviews. Get your own
            shareable business page at
            <span class="whitespace-nowrap font-medium text-white">creda.ng/your-business</span>.
          </p>
        </div>
        <UButton
          to="/businesses/new"
          trailing-icon="i-lucide-arrow-up-right"
          class="!min-h-12 !shrink-0 !justify-center !rounded-xl !bg-[#d8f36a] !px-6 !font-semibold !text-[#143e32] hover:!bg-[#e3fa91]"
          >List your business</UButton
        >
      </section>
    </main>
    <LandingFooter />
  </div>
</template>
