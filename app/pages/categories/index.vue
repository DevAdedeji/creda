<script setup lang="ts">
import { categoryPath, type CategorySummary } from '~~/shared/seo/categories'
import { serializeJsonLd } from '@/utils/jsonLd'

const { data, error, status, refresh } = await useFetch<CategorySummary[]>('/api/categories', {
  retry: 0,
})
if (import.meta.server && error.value) setResponseStatus(503)
const categories = computed(() =>
  [...(data.value ?? [])].sort((a, b) => Number(b.total > 0) - Number(a.total > 0)),
)
const search = ref('')
const visible = computed(() =>
  categories.value.filter((category) =>
    category.label.toLowerCase().includes(search.value.trim().toLowerCase()),
  ),
)
const canonicalUrl = useCanonicalUrl('/categories')
const origin = new URL(canonicalUrl).origin
const socialImage = useCanonicalUrl('/og-image.png')
useSeoMeta({
  title: 'Business Categories in Nigeria — Creda',
  description:
    'Browse business categories on Creda, from software and financial services to food, shopping and local services. Find business details and customer reviews.',
  ogTitle: 'Business Categories in Nigeria — Creda',
  ogDescription:
    'Find your next business by category. Explore services, official links and customer experiences on Creda.',
  ogUrl: canonicalUrl,
  ogImage: socialImage,
  twitterCard: 'summary_large_image',
  robots: computed(() => (error.value ? 'noindex, follow' : 'index, follow')),
})
useHead(() => ({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Business categories',
        url: canonicalUrl,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: categories.value
            .filter((category) => category.total > 0)
            .map((category, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: category.label,
              url: new URL(categoryPath(category.value), origin).toString(),
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
      <nav aria-label="Breadcrumb" class="mb-7 flex items-center gap-2 text-sm text-[#657069]">
        <NuxtLink to="/explore" class="hover:text-[#143e32] hover:underline"
          >Explore businesses</NuxtLink
        ><UIcon name="i-lucide-chevron-right" /><span aria-current="page">Categories</span>
      </nav>
      <div
        class="flex flex-col justify-between gap-6 border-b border-[#dfe6dc] pb-8 sm:flex-row sm:items-end"
      >
        <div>
          <h1 class="text-3xl font-semibold tracking-[-.055em] text-[#143e32] sm:text-4xl">
            What are you looking for<span class="text-[#a4c43e]">?</span>
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-[#657069] sm:text-base">
            Start with a category. Discover businesses, explore what they offer, and hear from their
            customers.
          </p>
        </div>
        <UButton
          to="/explore"
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-arrow-right"
          class="self-start whitespace-nowrap"
          >Explore all businesses</UButton
        >
      </div>
      <div v-if="error" role="alert" class="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 class="font-semibold">Categories couldn’t be loaded</h2>
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
        <div class="my-7 max-w-sm">
          <label for="category-search" class="mb-2 block text-sm font-medium"
            >Find a category</label
          >
          <UInput
            id="category-search"
            v-model="search"
            type="search"
            icon="i-lucide-search"
            placeholder="Search categories"
            class="w-full"
            size="lg"
          />
        </div>
        <div v-if="visible.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <NuxtLink
            v-for="category in visible"
            :key="category.value"
            :to="categoryPath(category.value)"
            class="group flex items-start gap-4 rounded-2xl border border-[#dfe6dc] bg-white p-5 transition hover:border-[#b9cdb4] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315b3a]"
          >
            <span
              class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eff4e9] text-xl text-[#315b3a]"
              ><UIcon :name="category.icon"
            /></span>
            <div class="min-w-0 flex-1">
              <h2 class="font-semibold text-[#143e32]">{{ category.label }}</h2>
              <p class="mt-1 text-xs leading-5 text-[#657069]">
                {{
                  category.total
                    ? `${category.total} ${category.total === 1 ? 'business' : 'businesses'}`
                    : 'Be the first to list'
                }}
              </p>
            </div>
            <UIcon
              name="i-lucide-arrow-up-right"
              class="mt-1 shrink-0 text-[#657069] group-hover:text-[#143e32]"
            />
          </NuxtLink>
        </div>
        <div
          v-else
          role="status"
          class="rounded-2xl border border-[#dfe6dc] bg-white p-8 text-center"
        >
          <h2 class="font-semibold">No matching categories</h2>
          <p class="mt-2 text-sm text-[#657069]">
            Try a different word, or search for a business directly.
          </p>
          <UButton class="mt-4" color="neutral" variant="soft" @click="search = ''"
            >Show all categories</UButton
          >
        </div>
      </template>
    </main>
  </div>
</template>
