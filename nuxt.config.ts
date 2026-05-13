// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app/',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Florida Trade Specialists — Verified Licensed Contractors',
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/favicon.png' }
      ],
      meta: [
        { name: 'description', content: "Florida's directory of verified, licensed trade pros. Find plumbers, electricians, HVAC techs, and roofers — always free for homeowners." },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:site_name', content: 'Florida Trade Specialists' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image', content: '/images/whyus.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: '/images/whyus.png' }
      ]
    }
  },
  ui: {
    colorMode: false
  },
  supabase: {
    redirect: false
  },
  runtimeConfig: {
    turnstileSecretKey: '',
    public: {
      wpApiBase: 'https://floridatradespecialists.com/wp-json/wp/v2',
      turnstileSiteKey: ''
    }
  }
})