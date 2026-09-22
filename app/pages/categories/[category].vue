<script setup lang="ts">
import BusinessCollection from '@/components/businesses/BusinessCollection.vue'
import {
  categoryPath,
  collectionPage,
  collectionPagePath,
  getBusinessCategory,
} from '~~/shared/seo/categories'
import type { BusinessListResponse } from '~~/shared/businesses'
import { serializeJsonLd } from '@/utils/jsonLd'

definePageMeta({ key: (route) => route.fullPath })
const route = useRoute()
const category = getBusinessCategory(
  typeof route.params.category === 'string' ? route.params.category : '',
)
const page = collectionPage(route.query.page)
if (!category || page === null)
  throw createError({ statusCode: 404, message: 'Category page not found.' })
const path = categoryPath(category.value)
const { data, error, status, refresh } = await useFetch<BusinessListResponse>(
  `/api/categories/${category.slug}`,
  { query: { page }, retry: 0 },
)
if (error.value?.statusCode === 404)
  throw createError({ statusCode: 404, message: 'Category page not found.' })
if (import.meta.server && error.value) setResponseStatus(503)
const canonicalUrl = useCanonicalUrl(collectionPagePath(path, page))
const origin = new URL(canonicalUrl).origin
const title = `${category.label} in Nigeria${page > 1 ? ` — Page ${page}` : ''} | Creda`
const socialImage = useCanonicalUrl('/og-image.png')
useSeoMeta({
  title,
  description: category.intro,
  ogTitle: title,
  ogDescription: category.intro,
  ogUrl: canonicalUrl,
  ogImage: socialImage,
  twitterCard: 'summary_large_image',
  robots: computed(() => (!error.value && data.value?.total ? 'index, follow' : 'noindex, follow')),
})
useHead(() => ({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description: category.intro,
        url: canonicalUrl,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
            { '@type': 'ListItem', position: 2, name: 'Categories', item: `${origin}/categories` },
            { '@type': 'ListItem', position: 3, name: category.label, item: canonicalUrl },
          ],
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: (data.value?.items ?? []).map((item, index) => ({
            '@type': 'ListItem',
            position: (page - 1) * (data.value?.pageSize ?? 12) + index + 1,
            name: item.name,
            url: `${origin}/businesses/${item.slug}`,
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
      <nav
        aria-label="Breadcrumb"
        class="mb-7 flex flex-wrap items-center gap-2 text-sm text-[#657069]"
      >
        <NuxtLink to="/categories" class="hover:text-[#143e32] hover:underline">Categories</NuxtLink
        ><UIcon name="i-lucide-chevron-right" /><span aria-current="page">{{
          category.label
        }}</span>
      </nav>
      <div class="border-b border-[#dfe6dc] pb-8">
        <div class="mb-4 flex items-center gap-2 text-sm font-medium text-[#5d7b61]">
          <UIcon :name="category.icon" /><span>Discover businesses in Nigeria</span>
        </div>
        <h1 class="text-3xl font-semibold tracking-[-.055em] text-[#143e32] sm:text-4xl">
          {{ category.label }}<span class="text-[#a4c43e]">.</span>
        </h1>
        <p class="mt-3 max-w-3xl text-sm leading-7 text-[#657069] sm:text-base">
          {{ category.intro }}
        </p>
      </div>
      <div class="my-7 flex flex-wrap items-center justify-between gap-4">
        <UButton
          :to="{ path: '/explore', query: { category: category.value } }"
          color="neutral"
          variant="soft"
          icon="i-lucide-sliders-horizontal"
          >Refine by location & more</UButton
        >
        <NuxtLink
          to="/businesses/new"
          class="inline-flex items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >List your business <UIcon name="i-lucide-arrow-up-right"
        /></NuxtLink>
      </div>
      <div v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 class="font-semibold">Businesses couldn’t be loaded</h2>
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
      <BusinessCollection v-else-if="data" v-bind="data" :path="path" />
    </main>
  </div>
</template>
