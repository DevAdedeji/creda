<script setup lang="ts">
import BusinessCollection from '@/components/businesses/BusinessCollection.vue'
import { collectionPage, collectionPagePath } from '~~/shared/seo/categories'
import { parseLocationParts, type LocationPage } from '~~/shared/seo/locations'
import { serializeJsonLd } from '@/utils/jsonLd'

definePageMeta({ key: (route) => route.fullPath })
const route = useRoute()
const parts = Array.isArray(route.params.parts) ? route.params.parts : [route.params.parts ?? '']
const location = parseLocationParts(parts)
const page = collectionPage(route.query.page)
if (!location || page === null)
  throw createError({ statusCode: 404, message: 'Location page not found.' })
const path = `/locations/${parts.join('/')}`
const statePath = `/locations/${location.state.slug}`
const selectedCityPath = location.city ? `${statePath}/${location.city}` : null
const { data, error, status, refresh } = await useFetch<LocationPage>(`/api${path}`, {
  query: { page },
  retry: 0,
})
if (error.value?.statusCode === 404)
  throw createError({ statusCode: 404, message: 'Location page not found.' })
if (import.meta.server && error.value) setResponseStatus(503)
const canonical = useCanonicalUrl(collectionPagePath(path, page))
const origin = new URL(canonical).origin
useSeoMeta({
  title: () => data.value?.title ?? 'Explore local businesses | Creda',
  description: () => data.value?.description,
  ogTitle: () => data.value?.title,
  ogDescription: () => data.value?.description,
  ogUrl: canonical,
  ogImage: useCanonicalUrl('/og-image.png'),
  twitterCard: 'summary_large_image',
  robots: computed(() => (!error.value && data.value?.total ? 'index, follow' : 'noindex, follow')),
})
useHead(() => ({
  link: [{ rel: 'canonical', href: canonical }],
  script: data.value
    ? [
        {
          type: 'application/ld+json',
          innerHTML: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: data.value.title,
            description: data.value.description,
            url: canonical,
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [{ name: 'Home', path: '/' }, ...data.value.breadcrumbs].map(
                (crumb, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: crumb.name,
                  item: `${origin}${crumb.path}`,
                }),
              ),
            },
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: data.value.items.map((item, index) => ({
                '@type': 'ListItem',
                position: (page - 1) * data.value!.pageSize + index + 1,
                name: item.name,
                url: `${origin}/businesses/${item.slug}`,
              })),
            },
          }),
        },
      ]
    : [],
}))
</script>

<template>
  <div class="min-h-screen bg-[#fcfcf8] text-[#172f27]">
    <LandingHeader />
    <main
      id="main"
      class="mx-auto w-full max-w-[1920px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12 xl:w-[90%] xl:px-0"
    >
      <div v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-5">
        <h1 class="font-semibold">Businesses couldn’t be loaded</h1>
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
      <template v-else-if="data">
        <nav
          aria-label="Breadcrumb"
          class="mb-7 flex flex-wrap items-center gap-2 text-sm text-[#657069]"
        >
          <template v-for="(crumb, index) in data.breadcrumbs" :key="crumb.path"
            ><UIcon v-if="index" name="i-lucide-chevron-right" /><span
              v-if="index === data.breadcrumbs.length - 1"
              aria-current="page"
              >{{ crumb.name }}</span
            ><NuxtLink v-else :to="crumb.path" class="hover:text-[#143e32] hover:underline">{{
              crumb.name
            }}</NuxtLink></template
          >
        </nav>
        <div class="border-b border-[#dfe6dc] pb-8">
          <p class="mb-4 flex items-center gap-2 text-sm font-medium text-[#5d7b61]">
            <UIcon name="i-lucide-map-pin" />Discover in person
          </p>
          <h1 class="text-3xl font-semibold tracking-[-.055em] text-[#143e32] sm:text-4xl">
            {{ data.name }}<span class="text-[#a4c43e]">.</span>
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-[#657069] sm:text-base">
            {{ data.description }}
          </p>
        </div>
        <section v-if="data.cities.length" aria-labelledby="cities-heading" class="mt-7">
          <h2 id="cities-heading" class="mb-3 text-sm font-semibold">Explore a city</h2>
          <div class="flex flex-wrap gap-2">
            <UButton
              :to="statePath"
              :aria-current="!location.city ? 'location' : undefined"
              :color="!location.city ? 'primary' : 'neutral'"
              :variant="!location.city ? 'solid' : 'outline'"
              >All cities</UButton
            >
            <UButton
              v-for="city in data.cities"
              :key="city.path"
              :to="city.path"
              :aria-current="city.path === selectedCityPath ? 'location' : undefined"
              :color="city.path === selectedCityPath ? 'primary' : 'neutral'"
              :variant="city.path === selectedCityPath ? 'solid' : 'outline'"
              :trailing-icon="city.path === selectedCityPath ? 'i-lucide-check' : undefined"
              >{{ city.name }} <span class="opacity-70">{{ city.total }}</span></UButton
            >
          </div>
        </section>
        <section v-if="data.categories.length" aria-labelledby="categories-heading" class="mt-7">
          <h2 id="categories-heading" class="mb-3 text-sm font-semibold">Browse by category</h2>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="category in data.categories"
              :key="category.path"
              :to="category.path"
              :aria-current="category.path === path ? 'page' : undefined"
              :color="category.path === path ? 'primary' : 'neutral'"
              :variant="category.path === path ? 'solid' : 'outline'"
              :icon="category.icon"
              >{{ category.label }}</UButton
            >
          </div>
        </section>
        <div class="my-7 flex flex-wrap items-center justify-between gap-4">
          <NuxtLink
            to="/locations"
            class="inline-flex items-center gap-2 text-sm font-medium text-[#315b3a] hover:underline"
            ><UIcon name="i-lucide-map" />Browse all locations</NuxtLink
          ><NuxtLink
            to="/businesses/new"
            class="inline-flex items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
            >List your business<UIcon name="i-lucide-arrow-up-right"
          /></NuxtLink>
        </div>
        <BusinessCollection v-if="data.total" v-bind="data" :path="path" />
        <div
          v-else
          class="rounded-2xl border border-[#dfe6dc] bg-white px-6 py-12 text-center sm:py-16"
        >
          <span
            class="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8f4da] text-2xl text-[#315b3a]"
            ><UIcon name="i-lucide-store"
          /></span>
          <h2 class="mt-5 text-xl font-semibold tracking-tight text-[#143e32]">
            Help put {{ location.state.name }} on the map
          </h2>
          <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#657069]">
            There are no in-person businesses listed here yet. Add yours, or explore businesses
            available online and across Nigeria.
          </p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <UButton to="/explore" color="neutral" variant="soft">Explore businesses</UButton
            ><UButton to="/businesses/new" trailing-icon="i-lucide-arrow-up-right"
              >List your business</UButton
            >
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
