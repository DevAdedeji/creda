<script setup lang="ts">
import { informationPages } from '~~/shared/information-pages'
import { serializeJsonLd } from '@/utils/jsonLd'

const props = defineProps<{ title: string; description: string; path: string; eyebrow: string }>()
const canonical = useCanonicalUrl(props.path)
const socialImage = useCanonicalUrl('/og-image.png')
useSeoMeta({
  title: `${props.title} | Creda`,
  description: props.description,
  ogTitle: `${props.title} | Creda`,
  ogDescription: props.description,
  ogUrl: canonical,
  ogImage: socialImage,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterImage: socialImage,
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type':
          props.path === '/about'
            ? 'AboutPage'
            : props.path === '/contact'
              ? 'ContactPage'
              : 'WebPage',
        '@id': canonical,
        url: canonical,
        name: props.title,
        description: props.description,
        inLanguage: 'en-NG',
        isPartOf: { '@type': 'WebSite', name: 'Creda', url: useCanonicalUrl('/') },
      }),
    },
  ],
})
</script>

<template>
  <div>
    <LandingHeader />
    <main class="mx-auto w-full max-w-[1920px] px-5 py-10 sm:px-8 sm:py-16 xl:w-[90%] xl:px-0">
      <nav aria-label="Breadcrumb" class="mb-8 flex items-center gap-2 text-sm text-[#657069]">
        <NuxtLink to="/" class="hover:text-[#143e32] hover:underline">Home</NuxtLink>
        <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
        <span aria-current="page">{{ title }}</span>
      </nav>
      <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <div class="min-w-0">
          <header class="mb-10 max-w-3xl">
            <p class="text-xs font-bold uppercase tracking-[.15em] text-[#5d7b61]">{{ eyebrow }}</p>
            <h1
              class="mt-3 text-4xl font-semibold leading-tight tracking-[-.05em] text-[#143e32] sm:text-5xl"
            >
              {{ title }}
            </h1>
            <p class="mt-5 text-lg leading-8 text-[#657069]">{{ description }}</p>
          </header>
          <div class="space-y-6"><slot /></div>
        </div>
        <aside class="rounded-2xl border border-[#dfe6dc] bg-white p-5 lg:sticky lg:top-32">
          <p class="px-3 text-xs font-bold uppercase tracking-[.12em] text-[#5d7b61]">
            More about Creda
          </p>
          <nav aria-label="Information pages" class="mt-3 grid gap-1">
            <NuxtLink
              v-for="page in informationPages"
              :key="page.path"
              :to="page.path"
              :aria-current="page.path === path ? 'page' : undefined"
              class="flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-3 text-sm font-medium"
              :class="
                page.path === path
                  ? 'bg-[#eaf3e1] text-[#143e32]'
                  : 'text-[#526a58] hover:bg-[#f4f7f0]'
              "
              >{{ page.label
              }}<UIcon v-if="page.path === path" name="i-lucide-arrow-right" aria-hidden="true"
            /></NuxtLink>
          </nav>
        </aside>
      </div>
    </main>
    <LandingFooter />
  </div>
</template>
