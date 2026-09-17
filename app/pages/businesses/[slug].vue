<script setup lang="ts">
import {
  businessCategories,
  businessTypes,
  operationModes,
  type PublicBusiness,
} from '~~/shared/businesses'

const route = useRoute()
const slug = String(route.params.slug)
const {
  data: business,
  status,
  error,
} = await useFetch<PublicBusiness>('/api/businesses/' + encodeURIComponent(slug))

useSeoMeta({
  title: computed(() => (business.value ? business.value.name + ' — Creda' : 'Business — Creda')),
  description: computed(() => business.value?.description ?? 'Explore this business on Creda.'),
})

const categoryLabel = computed(
  () => businessCategories.find((item) => item.value === business.value?.category)?.label,
)
const typeLabel = computed(() =>
  business.value?.businessTypes
    .map((type) => businessTypes.find((item) => item.value === type)?.label ?? type)
    .join(' · '),
)
const modeLabel = computed(
  () => operationModes.find((item) => item.value === business.value?.operationMode)?.label,
)
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
    <main class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-6xl py-10 sm:py-14">
      <NuxtLink
        to="/businesses"
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
        <h1 class="text-3xl font-semibold text-[#143e32]">Business not found.</h1>
        <p class="mt-3 text-[#657069]">This profile may not be available yet.</p>
        <UButton to="/businesses" class="mt-6 !rounded-xl !bg-[#143e32] !text-white"
          >Browse businesses</UButton
        >
      </div>
      <template v-else>
        <div class="mt-9 overflow-hidden rounded-3xl border border-[#dfe6dc] bg-white">
          <div class="h-24 bg-[#dcebd4] sm:h-32" />
          <div class="px-6 pb-8 sm:px-10">
            <div class="-mt-9 flex flex-wrap items-end justify-between gap-4">
              <img
                v-if="business.logoUrl"
                :src="business.logoUrl"
                alt=""
                width="80"
                height="80"
                referrerpolicy="no-referrer"
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
            <p class="mt-4 max-w-3xl text-base leading-8 text-[#5c6e60]">
              {{ business.description }}
            </p>
            <div class="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#607162]">
              <span class="inline-flex items-center gap-2"
                ><UIcon name="i-lucide-map-pin" /> {{ business.location || 'Online' }}</span
              ><span class="inline-flex items-center gap-2"
                ><UIcon name="i-lucide-building-2" /> {{ typeLabel }}</span
              ><span class="inline-flex items-center gap-2"
                ><UIcon name="i-lucide-monitor-smartphone" /> {{ modeLabel }}</span
              >
            </div>
          </div>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section
            class="rounded-2xl border border-[#dfe6dc] bg-white p-7 sm:p-9"
            aria-labelledby="reviews-heading"
          >
            <div class="flex items-center gap-3">
              <span
                class="grid size-11 place-items-center rounded-xl bg-[#e8f4da] text-xl text-[#315b3a]"
                ><UIcon name="i-lucide-message-circle"
              /></span>
              <h2 id="reviews-heading" class="text-2xl font-semibold tracking-tight text-[#143e32]">
                Customer experiences
              </h2>
            </div>
            <div
              class="mt-9 rounded-xl border border-dashed border-[#cbd9c6] bg-[#f9fbf6] px-6 py-10 text-center"
            >
              <UIcon name="i-lucide-messages-square" class="text-3xl text-[#799478]" />
              <h3 class="mt-3 text-lg font-semibold text-[#143e32]">No reviews yet.</h3>
              <p class="mt-2 text-sm text-[#657069]">
                Customer experiences will appear here when available.
              </p>
            </div>
          </section>
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
            <p
              v-if="business.ownershipStatus === 'verified'"
              class="mt-6 border-t border-[#edf0e9] pt-5 text-xs leading-5 text-[#657069]"
            >
              Ownership verified means we checked who manages this profile. It is not a guarantee of
              service quality.
            </p>
          </aside>
        </div>
      </template>
    </main>
  </div>
</template>
