export default defineNuxtConfig({
  compatibilityDate: '2026-09-25',
  devtools: { enabled: true },
  css: ['~/assets/styles/main.css'],
  modules: ['@pinia/nuxt'],
  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Northwind Supply',
      meta: [
        {
          name: 'description',
          content: 'Northwind Supply — a demo storefront for homeware and everyday goods.',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  runtimeConfig: {

    contentful: {
      spaceId: '',
      accessToken: '',
      environment: 'master',
      graphqlHost: 'graphql.contentful.com',
    },
  },
})
