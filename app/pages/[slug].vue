<script setup lang="ts">
import { businessCategories, businessDays, type PublicBusiness } from '~~/shared/businesses'
import { serializeJsonLd } from '@/utils/jsonLd'
import { useBusinessInsightsTracking } from '@/composables/insights/useBusinessInsightsTracking'
import type { InsightDestinationKey } from '~~/shared/insights'

const route = useRoute()
const slug = String(route.params.slug)
const canonicalUrl = useCanonicalUrl('/' + encodeURIComponent(slug))
const defaultSocialImage = useCanonicalUrl('/og-image.png')
const googleMapsApiKey = useRuntimeConfig().public.googleMapsApiKey
const {
  data: business,
  status,
  error,
} = await useFetch<PublicBusiness>('/api/businesses/' + encodeURIComponent(slug))
if (business.value?.listingSource === 'curated') {
  await navigateTo('/businesses/' + encodeURIComponent(business.value.slug), { redirectCode: 302 })
} else if (business.value && business.value.slug !== slug) {
  await navigateTo('/' + encodeURIComponent(business.value.slug), { redirectCode: 301 })
}
if (import.meta.server && (error.value || !business.value)) {
  setResponseStatus(error.value && error.value.statusCode !== 404 ? 500 : 404)
}

const { recordClick } = useBusinessInsightsTracking(
  computed(() => business.value?.id),
  'bio',
)

const categoryLabel = computed(
  () => businessCategories.find((item) => item.value === business.value?.category)?.label,
)
const locationLabel = computed(() => {
  const item = business.value
  return (item && [item.city, item.state].filter(Boolean).join(', ')) || item?.location || 'Online'
})
const description = computed(
  () => business.value?.description || 'Discover this business on Creda.',
)
const seoDescription = computed(() =>
  description.value.length > 160
    ? `${description.value.slice(0, 157).trimEnd()}…`
    : description.value,
)
const links = computed(() => {
  const item = business.value
  if (!item) return []
  return [
    {
      label: 'Visit website',
      url: item.websiteUrl,
      destination: 'websiteUrl' as const,
      icon: 'i-lucide-globe-2',
    },
    {
      label: 'Apple App Store',
      url: item.appStoreUrl,
      destination: 'appStoreUrl' as const,
      icon: 'i-lucide-smartphone',
    },
    {
      label: 'Google Play Store',
      url: item.playStoreUrl,
      destination: 'playStoreUrl' as const,
      icon: 'i-lucide-smartphone',
    },
    {
      label: 'Social profile',
      url: item.socialUrl,
      destination: 'socialUrl' as const,
      icon: 'i-lucide-at-sign',
    },
    {
      label: item.contactUrl?.startsWith('tel:') ? 'Call business' : 'Contact us',
      url: item.contactUrl,
      destination: 'contactUrl' as const,
      icon: 'i-lucide-message-circle',
    },
  ].filter(
    (
      link,
    ): link is { label: string; url: string; icon: string; destination: InsightDestinationKey } =>
      Boolean(link.url),
  )
})
const primaryLink = computed(() => links.value[0])
const mapUrl = computed(() => {
  const placeId = business.value?.googlePlaceId
  if (!placeId || !googleMapsApiKey) return null
  const url = new URL('https://www.google.com/maps/embed/v1/place')
  url.searchParams.set('key', googleMapsApiKey)
  url.searchParams.set('q', `place_id:${placeId}`)
  return url.toString()
})
const { copyText, isCopied } = useCopyFeedback()
async function copyLink() {
  await copyText(canonicalUrl)
}
function hoursLabel(day: number): string {
  const row = business.value?.weeklyHours.find((item) => item.day === day)
  return row ? `${row.start}–${row.end}` : 'Closed'
}

useSeoMeta({
  title: computed(() =>
    business.value ? `${business.value.name} — Business page on Creda` : 'Business — Creda',
  ),
  description: seoDescription,
  ogTitle: computed(() => business.value?.name || 'Business on Creda'),
  ogDescription: seoDescription,
  ogUrl: canonicalUrl,
  ogImage: computed(() => business.value?.coverUrl || defaultSocialImage),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  robots: computed(() => (business.value ? 'index, follow' : 'noindex, follow')),
})
useHead(() =>
  business.value
    ? {
        link: [{ rel: 'canonical', href: canonicalUrl }],
        script: [
          {
            type: 'application/ld+json',
            innerHTML: serializeJsonLd({
              '@context': 'https://schema.org',
              '@type': business.value.operationMode === 'online' ? 'Organization' : 'LocalBusiness',
              name: business.value.name,
              url: canonicalUrl,
              description: business.value.description,
              ...(business.value.logoUrl ? { logo: business.value.logoUrl } : {}),
              ...(business.value.location ? { address: business.value.location } : {}),
            }),
          },
        ],
      }
    : {},
)
</script>

<template>
  <div class="min-h-screen bg-[#f6f8f2] text-[#173b32]">
    <main
      v-if="status === 'pending'"
      class="mx-auto max-w-5xl px-5 py-12"
      aria-label="Loading business page"
    >
      <div class="h-80 animate-pulse rounded-3xl bg-[#e1eadc]" />
      <div class="mt-6 h-72 animate-pulse rounded-3xl bg-white" />
    </main>
    <main v-else-if="error || !business" class="mx-auto max-w-xl px-5 py-28 text-center">
      <h1 class="text-4xl font-semibold tracking-tight">
        {{ error && error.statusCode !== 404 ? 'Page unavailable.' : 'Business not found.' }}
      </h1>
      <p class="mt-4 text-[#64746a]">
        {{
          error && error.statusCode !== 404
            ? 'Please try again later.'
            : 'This business page is not available.'
        }}
      </p>
      <UButton to="/explore" class="mt-7 !rounded-xl !bg-[#173b32] !text-white"
        >Explore businesses</UButton
      >
    </main>
    <template v-else>
      <div class="relative h-64 overflow-hidden bg-[#173b32] sm:h-80 lg:h-[390px]">
        <NuxtImg
          v-if="business.coverUrl"
          :src="business.coverUrl"
          :alt="`${business.name} cover image`"
          width="1920"
          height="780"
          densities="x1"
          format="webp"
          class="size-full object-cover"
        />
        <div v-else class="absolute inset-0 overflow-hidden">
          <div class="absolute -right-12 -top-32 size-96 rounded-full bg-[#d8f36a]/20 blur-2xl" />
          <div class="absolute bottom-0 left-1/4 size-64 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div
          class="absolute inset-x-0 top-0 bg-gradient-to-b from-black/35 to-transparent px-5 py-6 sm:px-10"
        >
          <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <span class="truncate text-sm font-semibold text-white sm:text-base">{{
              business.name
            }}</span>
            <a
              v-if="primaryLink"
              :href="primaryLink.url"
              @click="recordClick(primaryLink.destination)"
              @auxclick.middle="recordClick(primaryLink.destination)"
              :target="primaryLink.url.startsWith('tel:') ? undefined : '_blank'"
              rel="noopener noreferrer"
              class="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#173b32] transition hover:bg-[#e7f5d9] sm:text-sm"
            >
              {{ primaryLink.label }} <UIcon name="i-lucide-arrow-up-right" class="ml-1 inline" />
            </a>
          </div>
        </div>
      </div>

      <main class="mx-auto -mt-16 max-w-6xl px-5 pb-20 sm:px-8 lg:-mt-24">
        <section
          class="relative overflow-hidden rounded-3xl bg-white px-6 pb-9 shadow-[0_20px_70px_#143e3215] sm:px-10 sm:pb-12"
        >
          <div class="-mt-0.5 flex flex-wrap items-end justify-between gap-4 pt-7 sm:pt-9">
            <NuxtImg
              v-if="business.logoUrl"
              :src="business.logoUrl"
              alt=""
              width="88"
              height="88"
              format="webp"
              class="size-20 rounded-2xl border border-[#e2e9df] bg-white object-cover sm:size-24"
            />
            <span
              v-else
              class="grid size-20 place-items-center rounded-2xl bg-[#d8f36a] text-4xl font-bold text-[#173b32] sm:size-24"
              >{{ business.name.charAt(0).toUpperCase() }}</span
            >
          </div>
          <p class="mt-7 text-xs font-bold uppercase tracking-[.17em] text-[#5d8060]">
            {{ categoryLabel }}
          </p>
          <h1
            class="mt-2 max-w-4xl text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-6xl"
          >
            {{ business.name }}<span class="text-[#a5c92e]">.</span>
            <BusinessesVerifiedMark
              v-if="business.ownershipStatus === 'verified'"
              class="!size-7 sm:!size-9"
            />
          </h1>
          <p class="mt-5 max-w-3xl text-base leading-8 text-[#5f7065] sm:text-lg">
            {{ business.description }}
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <a
              v-if="primaryLink"
              :href="primaryLink.url"
              @click="recordClick(primaryLink.destination)"
              @auxclick.middle="recordClick(primaryLink.destination)"
              :target="primaryLink.url.startsWith('tel:') ? undefined : '_blank'"
              rel="noopener noreferrer"
              class="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#173b32] px-6 text-sm font-semibold text-white transition hover:bg-[#285743]"
              >{{ primaryLink.label }} <UIcon name="i-lucide-arrow-up-right"
            /></a>
            <button
              type="button"
              class="inline-flex min-h-12 items-center gap-2 rounded-xl border px-5 text-sm font-semibold transition"
              :class="
                isCopied()
                  ? 'border-[#b9d8ac] bg-[#e8f4da] text-[#285c37]'
                  : 'border-[#d8e3d6] text-[#315840] hover:bg-[#f4f9ef]'
              "
              @click="copyLink"
            >
              <UIcon :name="isCopied() ? 'i-lucide-check' : 'i-lucide-link'" />
              {{ isCopied() ? 'Copied' : 'Copy page link' }}
            </button>
          </div>
          <div
            class="mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#e9eee7] pt-6 text-sm text-[#617364]"
          >
            <span class="inline-flex items-center gap-2"
              ><UIcon name="i-lucide-map-pin" /> {{ locationLabel }}</span
            >
            <span v-if="business.serviceArea" class="inline-flex items-center gap-2"
              ><UIcon name="i-lucide-route" /> Serves {{ business.serviceArea }}</span
            >
          </div>
        </section>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="space-y-6">
            <section v-if="business.services.length" class="rounded-3xl bg-white p-7 sm:p-9">
              <h2 class="text-2xl font-semibold tracking-tight">What they offer</h2>
              <div class="mt-5 flex flex-wrap gap-2">
                <span
                  v-for="service in business.services"
                  :key="service"
                  class="rounded-full bg-[#f0f7eb] px-4 py-2 text-sm font-medium text-[#315840]"
                  >{{ service }}</span
                >
              </div>
            </section>
            <section v-if="business.galleryUrls.length" class="rounded-3xl bg-white p-7 sm:p-9">
              <h2 class="text-2xl font-semibold tracking-tight">Gallery</h2>
              <BusinessesGallery
                :images="business.galleryUrls"
                :business-name="business.name"
                class="mt-5"
              />
            </section>
            <section v-if="mapUrl" class="overflow-hidden rounded-3xl bg-white">
              <div class="p-7 sm:p-9">
                <h2 class="text-2xl font-semibold tracking-tight">Find us</h2>
                <p class="mt-2 text-sm text-[#64746a]">{{ business.location }}</p>
              </div>
              <iframe
                :src="mapUrl"
                :title="`Map showing ${business.name}`"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                allowfullscreen
                class="h-72 w-full border-0"
              />
            </section>
          </div>
          <aside class="space-y-6">
            <section v-if="links.length" class="rounded-3xl bg-white p-7">
              <h2 class="text-xl font-semibold">Business links</h2>
              <div class="mt-5 grid gap-2">
                <a
                  v-for="link in links"
                  :key="link.label"
                  :href="link.url"
                  @click="recordClick(link.destination)"
                  @auxclick.middle="recordClick(link.destination)"
                  :target="link.url.startsWith('tel:') ? undefined : '_blank'"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between gap-3 rounded-xl border border-[#dfe8dc] px-4 py-3 text-sm font-semibold text-[#315840] transition hover:bg-[#f3f8ef]"
                  ><span class="inline-flex items-center gap-2"
                    ><UIcon :name="link.icon" /> {{ link.label }}</span
                  ><UIcon name="i-lucide-arrow-up-right"
                /></a>
              </div>
            </section>
            <section
              v-if="business.weeklyHours.length || business.openingHours"
              class="rounded-3xl bg-white p-7"
            >
              <h2 class="text-xl font-semibold">Hours & availability</h2>
              <div v-if="business.weeklyHours.length" class="mt-5 space-y-3">
                <div
                  v-for="day in businessDays"
                  :key="day.value"
                  class="flex justify-between gap-4 text-sm text-[#526653]"
                >
                  <span>{{ day.label }}</span
                  ><span>{{ hoursLabel(day.value) }}</span>
                </div>
                <p v-if="business.hoursTimeZone" class="pt-2 text-xs text-[#778679]">
                  {{ business.hoursTimeZone.replaceAll('_', ' ') }} time
                </p>
              </div>
              <p v-else class="mt-4 text-sm leading-6 text-[#526653]">
                {{ business.openingHours }}
              </p>
            </section>
            <NuxtLink
              :to="'/businesses/' + business.slug"
              class="flex items-center justify-between rounded-3xl bg-[#eaf3e5] p-6 text-sm font-semibold text-[#315840] transition hover:bg-[#dcecd5]"
              >See our Creda listing and reviews <UIcon name="i-lucide-arrow-right"
            /></NuxtLink>
          </aside>
        </div>
      </main>
      <footer class="border-t border-[#e0e9dc] px-5 py-6 text-center text-xs text-[#708174]">
        A business page on
        <NuxtLink to="/" class="font-bold text-[#315840] hover:underline">creda.</NuxtLink>
      </footer>
    </template>
  </div>
</template>
