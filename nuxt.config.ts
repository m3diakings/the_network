// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app/',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  ui: {
    colorMode: false
  },
  supabase: {
    redirect: false
  }
})