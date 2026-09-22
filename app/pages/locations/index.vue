<script setup lang="ts">
import type { LocationLink } from '~~/shared/seo/locations'
import { serializeJsonLd } from '@/utils/jsonLd'

const { data, error, status, refresh } = await useFetch<LocationLink[]>('/api/locations', {
  retry: 0,
})
if (import.meta.server && error.value) setResponseStatus(503)
const search = ref('')
const states = computed(() =>
  (data.value ?? []).filter((state) =>
    state.name.toLowerCase().includes(search.value.trim().toLowerCase()),
  ),
)
const hasBusinesses = computed(() => data.value?.some((state) => state.total > 0))
const canonical = useCanonicalUrl('/locations')
const title = 'Discover businesses by location in Nigeria | Creda'
const description =
  'Explore Nigerian states and cities to find businesses offering in-person services. Compare details, photos and customer reviews before you get in touch.'
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: canonical,
  ogImage: useCanonicalUrl('/og-image.png'),
  twitterCard: 'summary_large_image',
  robots: computed(() =>
    !error.value && hasBusinesses.value ? 'index, follow' : 'noindex, follow',
  ),
})
useHead(() => ({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        url: canonical,
        description,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: (data.value ?? [])
            .filter((state) => state.total > 0)
            .map((state, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: state.name,
              url: new URL(state.path, canonical).toString(),
            })),
        },
      }),
    },
  ],
}))
</script>

<template>
  <div class="min-h-screen bg-[#fcfcf8] text-[#172f27]">
    <LandingHeader />
    <main
      id="main"
      class="mx-auto w-full max-w-[1920px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12 xl:w-[90%] xl:px-0"
    >
      <NuxtLink
        to="/explore"
        class="mb-7 inline-flex items-center gap-2 text-sm text-[#657069] hover:text-[#143e32] hover:underline"
        ><UIcon name="i-lucide-arrow-left" />Explore businesses</NuxtLink
      >
      <div class="border-b border-[#dfe6dc] pb-8">
        <p class="mb-4 flex items-center gap-2 text-sm font-medium text-[#5d7b61]">
          <UIcon name="i-lucide-map-pin" />Around Nigeria
        </p>
        <h1 class="text-3xl font-semibold tracking-[-.055em] text-[#143e32] sm:text-4xl">
          Find your next local favourite<span class="text-[#a4c43e]">.</span>
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-[#657069] sm:text-base">
          Start with a state, then explore its cities and businesses. These listings offer in-person
          services; check their details before planning a visit or appointment.
        </p>
      </div>
      <div class="my-7 flex flex-wrap items-end justify-between gap-5">
        <div class="w-full sm:max-w-sm">
          <label for="state-search" class="mb-2 block text-sm font-medium">Find a state</label
          ><UInput
            id="state-search"
            v-model="search"
            icon="i-lucide-search"
            placeholder="Lagos, Rivers, Federal Capital Territory…"
            class="w-full"
            size="lg"
          />
        </div>
        <NuxtLink
          to="/businesses/new"
          class="inline-flex items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >List your business<UIcon name="i-lucide-arrow-up-right"
        /></NuxtLink>
      </div>
      <div v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 class="font-semibold">Locations couldn’t be loaded</h2>
        <p class="mt-1 text-sm">Please try again in a moment.</p>
        <UButton
          class="mt-4"
          color="neutral"
          variant="soft"
          :loading="status === 'pending'"
          @click="refresh()"
          >Try again</UButton
        >
      </div>
      <template v-else>
        <p
          v-if="!hasBusinesses"
          class="mb-6 rounded-xl border border-[#dfe6dc] bg-white p-5 text-sm leading-6 text-[#657069]"
        >
          We’re growing the local directory. Add a business to help people discover what’s around
          them, or
          <NuxtLink to="/explore" class="font-semibold text-[#315b3a] underline"
            >explore all businesses</NuxtLink
          >, including those operating online.
        </p>
        <div v-if="states.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <NuxtLink
            v-for="state in states"
            :key="state.path"
            :to="state.path"
            class="group flex min-h-28 items-center gap-4 rounded-2xl border border-[#dfe6dc] bg-white p-5 transition hover:border-[#71906c] hover:bg-[#f6f9f2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315b3a]"
          >
            <span
              class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f4da] text-xl text-[#315b3a]"
              ><UIcon name="i-lucide-map-pin"
            /></span>
            <span class="min-w-0 flex-1"
              ><span class="block font-semibold text-[#143e32]">{{ state.name }}</span
              ><span class="mt-1 block text-sm text-[#657069]">{{
                state.total
                  ? `${state.total} ${state.total === 1 ? 'business' : 'businesses'}`
                  : 'Be the first to list here'
              }}</span></span
            ><UIcon name="i-lucide-arrow-right" class="shrink-0 text-[#5d7b61]" />
          </NuxtLink>
        </div>
        <div
          v-else
          role="status"
          class="rounded-2xl border border-[#dfe6dc] bg-white px-6 py-12 text-center"
        >
          <h2 class="text-lg font-semibold">No matching states</h2>
          <p class="mt-2 text-sm text-[#657069]">Try a different name, or browse the full list.</p>
          <UButton class="mt-5" color="neutral" variant="soft" @click="search = ''"
            >Show all states</UButton
          >
        </div>
      </template>
    </main>
  </div>
</template>
