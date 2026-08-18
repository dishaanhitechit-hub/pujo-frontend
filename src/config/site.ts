// Club identity and infrastructure configuration.
// Festival-specific data (year, puja dates, countdown) lives in festival.ts.

export const siteConfig = {
  name: 'শতদল',
  nameEn: 'Shatadal',
  tagline: 'Kolaghat',
  fullName: 'শতদল, Kolaghat',
  description:
    'A celebration of tradition, community, and devotion. The annual Durga Puja of Shatadal, Kolaghat — bringing the community together every year.',
  shortDescription: 'Durga Puja · Kolaghat',

  contact: {
    address: 'Kolaghat, Purba Medinipur, West Bengal',
    city: 'Kolaghat',
    state: 'West Bengal',
    pincode: '721134',
    phone: null as string | null,
    email: null as string | null,
    whatsapp: null as string | null,
  },

  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    youtube: null as string | null,
  },

  meta: {
    description:
      'Official website of Shatadal Kolaghat Durga Puja. Join us for the annual celebration of tradition, devotion, and community.',
    ogImage: '/assets/og/og-default.jpg',
    url: 'https://shatadal.in',
  },

  nav: {
    appName: 'PujoPay',
    appDescription: 'Collection Management System',
  },
} as const

export type SiteConfig = typeof siteConfig
