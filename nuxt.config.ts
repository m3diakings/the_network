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
    // Use the canonical www domain — the non-www host 307-redirects here, and
    // all runtime canonicals resolve to www, so the sitemap and og:url must too.
    url: 'https://www.floridatradespecialists.com',
    name: 'Florida Trade Specialists'
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/admin/**']
  },
  routeRules: {
    // Vercel ISR: each public page renders on the server at most once a day and
    // is served from Vercel's cache in between, so crawler traffic across the
    // ~2,800 directory pages does not run a function per request. Query strings
    // are ignored for caching except the ones a page reads.
    '/**': { isr: { expiration: 86400, allowQuery: [] } },
    '/listings': { isr: { expiration: 86400, allowQuery: ['category', 'city', 'page'] } },
    // Blog data comes from an external WordPress API, so keep the window short:
    // a transient upstream blip that gets cached clears in ~10 min.
    '/blog': { isr: { expiration: 600, allowQuery: ['page'] } },
    '/blog/**': { isr: { expiration: 600, allowQuery: [] } },
    // Signed-in and write paths always run on demand.
    '/admin': { isr: false, robots: false, index: false },
    '/admin/**': { isr: false, robots: false, index: false },
    '/api/**': { isr: false },
    '/api/__sitemap__/**': { isr: { expiration: 86400, allowQuery: [] } }
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