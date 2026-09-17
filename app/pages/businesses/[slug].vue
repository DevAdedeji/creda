<script setup lang="ts">
import {
  businessCategories,
  businessDays,
  operationModes,
  type PublicBusiness,
} from '~~/shared/businesses'
import { authClient } from '~~/lib/auth-client'
import { serializeJsonLd } from '@/utils/jsonLd'

const route = useRoute()
const googleMapsApiKey = useRuntimeConfig().public.googleMapsApiKey
const slug = String(route.params.slug)
const canonicalUrl = useCanonicalUrl('/businesses/' + encodeURIComponent(slug))
const defaultSocialImage = useCanonicalUrl('/og-image.png')
const homeUrl = useCanonicalUrl('/')
const exploreUrl = useCanonicalUrl('/explore')
const {
  data: business,
  status,
  error,
} = await useFetch<PublicBusiness>('/api/businesses/' + encodeURIComponent(slug))
if (business.value && business.value.slug !== slug) {
  await navigateTo('/businesses/' + encodeURIComponent(business.value.slug), { redirectCode: 301 })
}
if (import.meta.server && (error.value || !business.value)) {
  setResponseStatus(error.value && error.value.statusCode !== 404 ? 500 : 404)
}
const { data: session } = await authClient.useSession(useFetch)
const { data: saved, status: savedStatus } = await useFetch<{ saved: boolean }>(
  () => `/api/my/saved-businesses/${business.value?.id}`,
  { immediate: Boolean(session.value?.user.emailVerified && business.value) },
)
const savePending = ref(false)
const toast = useToast()

async function toggleSaved() {
  if (!business.value || savePending.value) return
  if (!session.value) {
    await navigateTo({ path: '/login', query: { returnTo: route.fullPath } })
    return
  }
  if (!session.value.user.emailVerified) {
    toast.add({ title: 'Verify your email to save businesses', color: 'warning' })
    return
  }
  savePending.value = true
  try {
    const result = await $fetch<{ saved: boolean }>(
      `/api/my/saved-businesses/${business.value.id}`,
      { method: saved.value?.saved ? 'DELETE' : 'PUT' },
    )
    saved.value = result
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
    savePending.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(canonicalUrl)
    toast.add({ title: 'Profile link copied', color: 'success' })
  } catch {
    toast.add({
      title: 'Could not copy the link',
      description: 'Please try again.',
      color: 'error',
    })
  }
}

const seoLocation = computed(() => {
  const item = business.value
  return item && item.operationMode !== 'online'
    ? [item.city, item.state].filter(Boolean).join(', ')
    : ''
})
const seoTitle = computed(() => {
  const item = business.value
  return item
    ? `${item.name}${seoLocation.value ? ` in ${seoLocation.value}` : ''} — Creda`
    : 'Business — Creda'
})
const seoDescription = computed(() => {
  const item = business.value
  if (!item) return 'Explore this business on Creda.'
  const introduction = seoLocation.value ? `${item.name} in ${seoLocation.value}. ` : ''
  const description = `${introduction}${item.description}`.replace(/\s+/g, ' ').trim()
  return description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogUrl: canonicalUrl,
  ogImage: computed(() => business.value?.coverUrl || defaultSocialImage),
  ogImageAlt: computed(() =>
    business.value ? `${business.value.name} on Creda` : 'Creda business profile',
  ),
  ogImageWidth: computed(() => (business.value?.coverUrl ? undefined : 1200)),
  ogImageHeight: computed(() => (business.value?.coverUrl ? undefined : 630)),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterImage: computed(() => business.value?.coverUrl || defaultSocialImage),
  robots: computed(() => (business.value ? 'index, follow' : 'noindex, follow')),
})
useHead(() => {
  const item = business.value
  if (!item) return {}

  const images = [item.coverUrl, item.logoUrl, ...item.galleryUrls].filter((url): url is string =>
    Boolean(url),
  )
  return {
    link: [{ rel: 'canonical', href: canonicalUrl }],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: serializeJsonLd({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': canonicalUrl,
              url: canonicalUrl,
              name: seoTitle.value,
              description: seoDescription.value,
              inLanguage: 'en-NG',
              mainEntity: { '@id': `${canonicalUrl}#business` },
              ...(images[0] ? { primaryImageOfPage: images[0] } : {}),
            },
            {
              '@type': 'Organization',
              '@id': `${canonicalUrl}#business`,
              name: item.name,
              description: item.description,
              ...(item.websiteUrl ? { url: item.websiteUrl } : {}),
              ...(item.logoUrl ? { logo: item.logoUrl } : {}),
              ...(images.length ? { image: images } : {}),
              ...(seoLocation.value ? { areaServed: seoLocation.value } : {}),
              ...(item.ownershipStatus === 'verified' && item.socialUrl
                ? { sameAs: [item.socialUrl] }
                : {}),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Explore businesses',
                  item: exploreUrl,
                },
                { '@type': 'ListItem', position: 3, name: item.name, item: canonicalUrl },
              ],
            },
          ],
        }),
      },
    ],
  }
})

const categoryLabel = computed(
  () => businessCategories.find((item) => item.value === business.value?.category)?.label,
)
const modeLabel = computed(
  () => operationModes.find((item) => item.value === business.value?.operationMode)?.label,
)
function hoursLabel(day: number): string {
  const row = business.value?.weeklyHours.find((item) => item.day === day)
  return row ? `${row.start}–${row.end}` : 'Closed'
}
const mapUrl = computed(() => {
  const placeId = business.value?.googlePlaceId
  if (!placeId || !googleMapsApiKey) return null
  const url = new URL('https://www.google.com/maps/embed/v1/place')
  url.searchParams.set('key', googleMapsApiKey)
  url.searchParams.set('q', `place_id:${placeId}`)
  return url.toString()
})
const destinations = computed(() => {
  const item = business.value
  if (!item) return []
  return [
    { label: 'Visit website', url: item.websiteUrl, icon: 'i-lucide-globe' },
    { label: 'Apple App Store', url: item.appStoreUrl, icon: 'i-lucide-smartphone' },
    { label: 'Google Play Store', url: item.playStoreUrl, icon: 'i-lucide-smartphone' },
    { label: 'View social profile', url: item.socialUrl, icon: 'i-lucide-at-sign' },
    { label: 'Contact business', url: item.contactUrl, icon: 'i-lucide-message-circle' },
  ].filter((link): link is { label: string; url: string; icon: string } => Boolean(link.url))
})
</script>

<template>
  <div class="min-h-screen bg-[#fcfcf8] text-[#172f27]">
    <LandingHeader />
    <main class="mx-auto w-full max-w-[1920px] px-5 py-10 sm:px-8 sm:py-14 xl:w-[90%] xl:px-0">
      <NuxtLink
        to="/explore"
        class="inline-flex items-center gap-2 text-sm font-semibold text-[#47644d] hover:underline"
        ><UIcon name="i-lucide-arrow-left" /> Explore businesses</NuxtLink
      >
      <div
        v-if="status === 'pending'"
        class="mt-9 grid gap-5 lg:grid-cols-[1fr_300px]"
        aria-label="Loading business profile"
      >
        <div class="h-96 animate-pulse rounded-2xl bg-[#e8eee4]" />
        <div class="h-64 animate-pulse rounded-2xl bg-[#e8eee4]" />
      </div>
      <div
        v-else-if="error || !business"
        class="mt-9 rounded-2xl border border-[#dfe6dc] bg-white p-10"
      >
        <h1 class="text-3xl font-semibold text-[#143e32]">
          {{ error && error.statusCode !== 404 ? 'Profile unavailable.' : 'Business not found.' }}
        </h1>
        <p class="mt-3 text-[#657069]">
          {{
            error && error.statusCode !== 404
              ? 'We could not load this profile right now. Please try again later.'
              : 'This profile may not be available yet.'
          }}
        </p>
        <UButton to="/explore" class="mt-6 !rounded-xl !bg-[#143e32] !text-white"
          >Browse businesses</UButton
        >
      </div>
      <template v-else>
        <div class="mt-9 overflow-hidden rounded-3xl border border-[#dfe6dc] bg-white">
          <div class="h-40 bg-[#dcebd4] sm:h-56">
            <NuxtImg
              v-if="business.coverUrl"
              :src="business.coverUrl"
              :alt="`${business.name} cover image`"
              width="1920"
              height="384"
              densities="x1"
              format="webp"
              class="size-full object-cover"
            />
          </div>
          <div class="px-6 pb-8 sm:px-10">
            <div class="-mt-9 flex flex-wrap items-end justify-between gap-4">
              <NuxtImg
                v-if="business.logoUrl"
                :src="business.logoUrl"
                alt=""
                width="80"
                height="80"
                format="webp"
                class="size-20 rounded-2xl border-4 border-white bg-white object-cover shadow-sm"
              />
              <span
                v-else
                class="grid size-20 place-items-center rounded-2xl border-4 border-white bg-[#d8f36a] text-3xl font-bold text-[#143e32] shadow-sm"
                >{{ business.name.charAt(0).toUpperCase() }}</span
              >
              <span
                v-if="business.ownershipStatus === 'verified'"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#e5f3da] px-3 py-2 text-xs font-semibold text-[#2e6541]"
                ><UIcon name="i-lucide-badge-check" /> Ownership verified</span
              >
            </div>
            <p class="mt-6 text-xs font-bold uppercase tracking-[.15em] text-[#5d7b61]">
              {{ categoryLabel }}
            </p>
            <h1 class="mt-2 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
              {{ business.name }}
            </h1>
            <div class="mt-5 flex flex-wrap gap-2">
              <UButton
                color="neutral"
                variant="outline"
                :icon="saved?.saved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
                :loading="savePending"
                :disabled="
                  savePending || (Boolean(session?.user.emailVerified) && savedStatus === 'pending')
                "
                class="!rounded-xl !border-[#d4e0d0] !text-[#234d37]"
                @click="toggleSaved"
                >{{ saved?.saved ? 'Saved' : 'Save business' }}</UButton
              >
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-link"
                class="!rounded-xl !border-[#d4e0d0] !text-[#234d37]"
                @click="copyLink()"
                >Copy profile link</UButton
              >
            </div>
            <p class="mt-4 max-w-3xl text-base leading-8 text-[#5c6e60]">
              {{ business.description }}
            </p>
            <div class="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#607162]">
              <span class="inline-flex items-center gap-2"
                ><UIcon
                  :name="
                    business.operationMode === 'online' ? 'i-lucide-globe-2' : 'i-lucide-map-pin'
                  "
                />
                {{
                  [business.city, business.state].filter(Boolean).join(', ') ||
                  business.location ||
                  'Online'
                }}</span
              ><span class="inline-flex items-center gap-2"
                ><UIcon name="i-lucide-monitor-smartphone" /> {{ modeLabel }}</span
              >
            </div>
            <div
              v-if="business.serviceArea"
              class="mt-6 flex flex-wrap gap-x-7 gap-y-2 border-t border-[#edf0e9] pt-5 text-sm text-[#45614d]"
            >
              <span v-if="business.serviceArea" class="inline-flex items-start gap-2"
                ><UIcon name="i-lucide-route" class="mt-0.5 shrink-0" /> Serves
                {{ business.serviceArea }}</span
              >
            </div>
          </div>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div class="space-y-6">
            <section
              v-if="business.services.length"
              class="rounded-2xl border border-[#dfe6dc] bg-white p-7 sm:p-9"
              aria-labelledby="services-heading"
            >
              <h2
                id="services-heading"
                class="text-2xl font-semibold tracking-tight text-[#143e32]"
              >
                What they offer
              </h2>
              <div class="mt-5 flex flex-wrap gap-2">
                <span
                  v-for="service in business.services"
                  :key="service"
                  class="rounded-full border border-[#d9e6d1] bg-[#f4f9ef] px-4 py-2 text-sm font-medium text-[#315840]"
                  >{{ service }}</span
                >
              </div>
            </section>
            <section
              v-if="business.galleryUrls.length"
              class="rounded-2xl border border-[#dfe6dc] bg-white p-7 sm:p-9"
              aria-labelledby="gallery-heading"
            >
              <h2 id="gallery-heading" class="text-2xl font-semibold tracking-tight text-[#143e32]">
                Gallery
              </h2>
              <BusinessesGallery
                :images="business.galleryUrls"
                :business-name="business.name"
                class="mt-6"
              />
            </section>
            <ReviewsSection
              :business-id="business.id"
              :slug="business.slug"
              :business-name="business.name"
            />
            <section
              v-if="mapUrl"
              class="overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white"
              aria-labelledby="location-heading"
            >
              <div class="px-7 py-6 sm:px-9">
                <h2
                  id="location-heading"
                  class="text-2xl font-semibold tracking-tight text-[#143e32]"
                >
                  Location
                </h2>
                <p class="mt-2 text-sm text-[#657069]">{{ business.location }}</p>
              </div>
              <iframe
                :src="mapUrl"
                :title="`Map showing ${business.name}`"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                allowfullscreen
                class="h-72 w-full border-0 sm:h-80"
              />
            </section>
          </div>
          <aside
            class="self-start rounded-2xl border border-[#dfe6dc] bg-white p-6"
            aria-labelledby="links-heading"
          >
            <h2 id="links-heading" class="text-lg font-semibold text-[#143e32]">
              Find this business
            </h2>
            <p class="mt-1 text-sm leading-6 text-[#657069]">
              Official destinations shared with Creda.
            </p>
            <div class="mt-5 grid gap-2">
              <a
                v-for="link in destinations"
                :key="link.label"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-between gap-3 rounded-xl border border-[#dfe6dc] px-4 py-3 text-sm font-semibold text-[#234532] transition hover:border-[#a6bea3] hover:bg-[#f5f9f1]"
                ><span class="flex items-center gap-2"
                  ><UIcon :name="link.icon" /> {{ link.label }}</span
                ><UIcon name="i-lucide-arrow-up-right"
              /></a>
            </div>
            <div
              v-if="business.weeklyHours.length || business.openingHours"
              class="mt-6 border-t border-[#edf0e9] pt-5"
            >
              <h3 class="flex items-center gap-2 text-sm font-semibold text-[#143e32]">
                <UIcon name="i-lucide-clock-3" /> Business hours
              </h3>
              <div v-if="business.weeklyHours.length" class="mt-4 space-y-2">
                <div
                  v-for="day in businessDays"
                  :key="day.value"
                  class="flex justify-between gap-3 text-xs text-[#526653]"
                >
                  <span>{{ day.label }}</span>
                  <span>{{ hoursLabel(day.value) }}</span>
                </div>
                <p v-if="business.hoursTimeZone" class="pt-2 text-xs text-[#778679]">
                  {{ business.hoursTimeZone.replaceAll('_', ' ') }} time
                </p>
              </div>
              <p v-else class="mt-3 text-sm text-[#526653]">{{ business.openingHours }}</p>
            </div>
            <p
              v-if="business.ownershipStatus === 'verified'"
              class="mt-6 border-t border-[#edf0e9] pt-5 text-xs leading-5 text-[#657069]"
            >
              Ownership verified means we checked who manages this profile. It is not a guarantee of
              service quality.
            </p>
            <div class="mt-5 border-t border-[#edf0e9] pt-4">
              <ReportsDialog :business-id="business.id" label="Report this business" />
            </div>
          </aside>
        </div>
      </template>
    </main>
  </div>
</template>
