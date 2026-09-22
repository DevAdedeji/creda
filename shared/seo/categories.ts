import { businessCategories, type BusinessCategory } from '../businesses'

const categoryDetails: Record<BusinessCategory, { intro: string; icon: string }> = {
  software: {
    intro:
      'Explore software and apps for work and everyday life. Compare what each product does, follow its official links, and read customer experiences before you choose.',
    icon: 'i-lucide-command',
  },
  creative: {
    intro:
      'Find creative businesses working across design, photography, branding and other visual services. Browse their work and contact them to discuss your project.',
    icon: 'i-lucide-palette',
  },
  retail: {
    intro:
      'Discover shops and retailers, online and in person. Explore their products, find official shopping links, and read experiences shared by customers.',
    icon: 'i-lucide-shopping-bag',
  },
  services: {
    intro:
      'Explore professional services for your work or business. Compare service descriptions and customer experiences, then contact a provider about your needs.',
    icon: 'i-lucide-briefcase-business',
  },
  food: {
    intro:
      'Discover food and hospitality businesses, from places to eat to food services. Check their listed details and official links before you visit or order.',
    icon: 'i-lucide-utensils',
  },
  home_services: {
    intro:
      'Find businesses that help with your home and property. Explore their services and coverage, then get in touch to discuss availability and a quote.',
    icon: 'i-lucide-house',
  },
  health: {
    intro:
      'Explore health and medical businesses and their listed services. Contact providers directly to confirm services, professional credentials and appointment availability.',
    icon: 'i-lucide-heart-pulse',
  },
  beauty: {
    intro:
      'Find beauty and wellness businesses for your next appointment. Browse services, photos and customer experiences before contacting a provider.',
    icon: 'i-lucide-sparkles',
  },
  automotive: {
    intro:
      'Explore automotive businesses for vehicles, maintenance and related services. Check what each business offers and contact them about your vehicle.',
    icon: 'i-lucide-car',
  },
  education: {
    intro:
      'Discover education and learning businesses. Explore their courses and services, and follow official links for entry requirements, schedules and fees.',
    icon: 'i-lucide-graduation-cap',
  },
  fitness: {
    intro:
      'Find fitness and recreation businesses for your routine. Compare listed activities and hours, then ask about classes, facilities or memberships.',
    icon: 'i-lucide-dumbbell',
  },
  entertainment: {
    intro:
      'Explore arts and entertainment businesses. Discover what they offer and use their official links for current events, tickets and bookings.',
    icon: 'i-lucide-ticket',
  },
  travel: {
    intro:
      'Discover travel and accommodation businesses. Explore their services and customer experiences, then confirm availability and booking details directly.',
    icon: 'i-lucide-plane',
  },
  pets: {
    intro:
      'Find businesses offering products and services for pets. Browse their details and contact them to discuss the care or supplies your pet needs.',
    icon: 'i-lucide-paw-print',
  },
  finance: {
    intro:
      'Explore financial service businesses, including payment, banking and savings products. Compare listed services and customer experiences, and check terms and eligibility with each provider.',
    icon: 'i-lucide-landmark',
  },
  other: {
    intro:
      'Discover more businesses on Creda. Browse what they offer, read customer experiences and find their official contact details.',
    icon: 'i-lucide-compass',
  },
}

export const categoryCatalog = businessCategories.map((category) => ({
  ...category,
  slug: category.value.replaceAll('_', '-'),
  ...categoryDetails[category.value],
}))
export type CategoryInfo = (typeof categoryCatalog)[number]
export type CategorySummary = CategoryInfo & { total: number }

export function getBusinessCategory(slug: string): CategoryInfo | undefined {
  return categoryCatalog.find((category) => category.slug === slug)
}

export function categoryPath(value: BusinessCategory): string {
  return `/categories/${value.replaceAll('_', '-')}`
}

export function collectionPage(value: unknown): number | null {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^[1-9]\d{0,3}$/.test(value)) return null
  return Number(value)
}

export function collectionPagePath(path: string, page: number): string {
  return page === 1 ? path : `${path}?page=${page}`
}
