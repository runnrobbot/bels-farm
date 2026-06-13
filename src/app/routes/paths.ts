/** Single source of truth for app route paths. */
export const paths = {
  // Public marketing site
  home: '/',
  about: '/about',
  catalog: '/catalog',
  catalogSpecies: (species: string) => `/catalog/${species}`,
  listing: (id: string) => `/catalog/item/${id}`,
  qurbanPublic: '/qurban',
  gallery: '/gallery',
  testimonials: '/testimonials',
  faq: '/faq',
  articles: '/articles',
  article: (slug: string) => `/articles/${slug}`,
  contact: '/contact',

  // Customer self-service portal
  portal: '/portal',
  portalQurban: '/portal/qurban',

  // Auth
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  updatePassword: '/auth/update-password',

  // App (authenticated)
  dashboard: '/app',
  livestock: '/app/livestock',
  animal: (id: string) => `/app/livestock/${id}`,
  health: '/app/health',
  breeding: '/app/breeding',
  feeding: '/app/feeding',
  inventory: '/app/inventory',
  suppliers: '/app/suppliers',
  customers: '/app/customers',
  customer: (id: string) => `/app/customers/${id}`,
  chat: '/app/chat',
  employees: '/app/employees',
  finance: '/app/finance',
  qurban: '/app/qurban',
  tasks: '/app/tasks',
  calendar: '/app/calendar',
  reports: '/app/reports',
  cms: '/app/cms',
  audit: '/app/audit',
  settings: '/app/settings',
  scan: '/app/scan',
} as const;
