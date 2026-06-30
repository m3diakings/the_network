<script setup lang="ts">
type Faq = { question: string, answer: string }

const faqs: Faq[] = [
  {
    question: 'Is Florida Trade Specialists free to use?',
    answer:
      'Yes. Browsing the directory and contacting contractors is always free for homeowners. There are no fees, no sign-up, and no lead forms — you call or visit the business directly.'
  },
  {
    question: 'Are the contractors licensed and verified?',
    answer:
      'Every published listing is reviewed before it goes live. We display license-backed profiles so you can confirm a contractor holds the proper Florida credentials for their trade before you reach out.'
  },
  {
    question: 'How do I contact a contractor?',
    answer:
      'Each listing has tap-to-call and a link to the business website. You contact the contractor directly — we never sit between you and the pro, and we never sell your information as a lead.'
  },
  {
    question: 'What areas of Florida do you cover?',
    answer:
      'We list licensed trade pros across Florida. You can filter the directory by city or browse county and category hub pages to find contractors who serve your area.'
  },
  {
    question: 'What trades can I find here?',
    answer:
      'Electricians, plumbers, HVAC contractors, roofers, general contractors, and other specialty trades. Browse the full set of trade categories from the directory or the footer.'
  },
  {
    question: 'How do I get my business listed?',
    answer:
      'Submit your business through the application page. Standard listings are free, and most submissions are reviewed within about a day before they appear in the directory.'
  },
  {
    question: 'How are listings reviewed?',
    answer:
      'We check that the business is a real, licensed Florida trade operation with valid contact details before publishing. Listings that can\'t be verified are not published.'
  },
  {
    question: 'Do you charge for leads or use lead forms?',
    answer:
      'No. We don\'t run lead forms, auction your contact details, or charge homeowners or contractors per lead. The directory simply connects you with licensed pros.'
  }
]

const titleTag = 'Frequently Asked Questions — Florida Trade Specialists'
const descriptionTag =
  'Answers about using the Florida Trade Specialists directory — how listings are verified, how to contact licensed contractors, coverage areas, and how to get your trade business listed.'

useSeoMeta({
  title: titleTag,
  description: descriptionTag,
  ogTitle: titleTag,
  ogDescription: descriptionTag,
  ogImage: '/images/whyus.png',
  twitterCard: 'summary_large_image',
  twitterTitle: titleTag,
  twitterDescription: descriptionTag,
  twitterImage: '/images/whyus.png'
})

const siteOrigin = useRequestURL().origin
const canonicalUrl = `${siteOrigin}/faq`

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }]
})

const jsonLd = computed(() => {
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer
      }
    }))
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteOrigin}/` },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: canonicalUrl }
    ]
  }
  return [faqPage, breadcrumbs]
})

useHead({
  script: computed(() => jsonLd.value.map(obj => ({
    type: 'application/ld+json',
    innerHTML: JSON.stringify(obj)
  })))
})

const accordionItems = computed(() =>
  faqs.map(f => ({ label: f.question, content: f.answer }))
)

const faqCtaLinks = [
  {
    label: 'Browse the directory',
    to: '/listings',
    icon: 'i-lucide-arrow-right',
    size: 'lg' as const
  },
  {
    label: 'List your business',
    to: '/submit-business',
    color: 'neutral' as const,
    variant: 'outline' as const,
    size: 'lg' as const
  }
]
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <UContainer class="py-10">
      <div class="mx-auto max-w-3xl">
        <UPageHeader
          headline="Help"
          title="Frequently Asked Questions"
          description="Everything homeowners and contractors ask about using the Florida Trade Specialists directory."
          :ui="{ root: 'border-b-0' }"
        />

        <UPageBody class="mt-6 pb-16">
          <UAccordion
            :items="accordionItems"
            :ui="{ item: 'border-b border-default/60 py-1' }"
          />
        </UPageBody>
      </div>
    </UContainer>

    <UPageCTA
      variant="naked"
      title="Still have a question?"
      description="Browse licensed Florida trade pros, or list your business in about a day."
      :links="faqCtaLinks"
    />
  </UPage>
</template>
