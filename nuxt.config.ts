import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  alias: { '@server': fileURLToPath(new URL('./server', import.meta.url)) },
  devServer: { port: 4002 },
  compatibilityDate: '2026-09-17',
  nitro: {
    experimental: { tasks: true },
    scheduledTasks: { '*/15 * * * *': ['business-images-cleanup'] },
  },
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image'],
  image: {
    domains: ['cdn.byteship.cloud'],
    format: ['avif', 'webp'],
  },
  runtimeConfig: {
    public: {
      googleMapsApiKey: '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || '',
    },
  },
  css: ['~/assets/css/main.css'],
  ui: { colorMode: false },
  icon: { clientBundle: { scan: true } },
  app: {
    head: {
      htmlAttrs: { lang: 'en', class: 'motion-safe:scroll-smooth scroll-pt-20 lg:scroll-pt-28' },
      meta: [{ name: 'theme-color', content: '#143e32' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
