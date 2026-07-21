// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app/',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', '@nuxtjs/supabase', '@nuxtjs/sitemap'],
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
      ],
      script: [
        { src: 'https://www.googletagmanager.com/gtag/js?id=G-Q9DQYNC6PW', async: true },
        { innerHTML: "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-Q9DQYNC6PW');" }
      ]
    }
  },
  ui: {
    colorMode: false
  },
  image: {
    quality: 80,
    domains: [
      'mlcimhopkhjbjzbruddm.supabase.co',
      'wp.floridatradespecialists.com',
      'secure.gravatar.com',
      'placehold.co',
      'picsum.photos'
    ]
  },
  supabase: {
    redirect: false
  },
  site: {
    url: 'https://floridatradespecialists.com',
    name: 'Florida Trade Specialists'
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/admin/**']
  },
  routeRules: {
    // Blog data comes from an external WordPress API, so keep the stale-while-
    // revalidate window short — a transient upstream blip that gets cached
    // clears in ~10 min instead of 30. Cover both the index and post routes.
    '/blog': { swr: 600 },
    '/blog/**': { swr: 600 },
    '/admin/**': { robots: false, index: false }
  },
  experimental: {
    // On redeploy, a stale tab/CDN copy can reference old hashed chunks that no
    // longer exist and 404. Reload the app automatically when a route chunk
    // fails to load instead of dead-ending the user.
    emitRouteChunkError: 'automatic'
  },
  runtimeConfig: {
    turnstileSecretKey: '',
    public: {
      wpApiBase: 'https://wp.floridatradespecialists.com/wp-json/wp/v2',
      turnstileSiteKey: ''
    }
  }
})