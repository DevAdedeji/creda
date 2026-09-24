<script setup lang="ts">
import dmSansLatin from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url'
import { isAnalyticsEnabled } from '@/utils/analytics'

useHead({
  link: [
    { rel: 'preload', href: dmSansLatin, as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  ],
})

const hostname = useRequestURL().hostname

useSeoMeta({
  ogSiteName: 'Creda',
  ogLocale: 'en_NG',
  twitterCard: 'summary_large_image',
})

if (isAnalyticsEnabled(hostname)) {
  useHead({
    script: [
      {
        src: 'https://www.sabilytics.com/script.js',
        async: true,
        'data-site': 'zknt5414lf3e',
        'data-domain': 'creda.ng',
      },
    ],
  })
}
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-[#fcfcf8] font-sans text-[#172f27] antialiased">
      <NuxtPage />
    </div>
  </UApp>
</template>
