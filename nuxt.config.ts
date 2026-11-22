// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  // Painel administrativo: roda como SPA (o backend fica em server/)
  ssr: false,
  css: ['~/assets/main.css'],
  app: {
    head: {
      title: 'Disparos WhatsApp',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  // Cada chave pode ser sobrescrita por variável de ambiente NUXT_<CHAVE_EM_MAIUSCULO>
  runtimeConfig: {
    adminEmail: '',
    adminPassword: '',
    sessionSecret: '',
    webhookVerifyToken: '',
    metaAppSecret: '',
    graphUrl: 'https://graph.facebook.com',
    graphVersion: 'v23.0',
    databasePath: './data/disparos.db',
    defaultCountryCode: '55',
  },
  nitro: {
    externals: { external: ['better-sqlite3'] },
  },
})
