export default defineNuxtConfig({
  devServer: { port: 4002 },
  compatibilityDate: '2026-09-17',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: { colorMode: false },
  icon: { clientBundle: { scan: true } },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'theme-color', content: '#143e32' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
