import type { BusinessCategory, PublicBusiness } from '~~/shared/businesses'
import type { ReviewListResponse } from '~~/shared/reviews'

const localTypes = {
  retail: 'Store',
  home_services: 'HomeAndConstructionBusiness',
  automotive: 'AutomotiveBusiness',
  beauty: 'HealthAndBeautyBusiness',
  finance: 'FinancialService',
} as const satisfies Partial<Record<BusinessCategory, string>>

export type BusinessSchemaType =
  | 'Organization'
  | 'LocalBusiness'
  | (typeof localTypes)[keyof typeof localTypes]

interface BusinessEntity {
  '@type': BusinessSchemaType
  '@id': string
  name: string
  description: string
  url: string
  logo?: string
  image?: string[]
  address?: {
    '@type': 'PostalAddress'
    streetAddress: string
    addressLocality?: string
    addressRegion?: string
  }
  areaServed?: string
  telephone?: string
  openingHoursSpecification?: {
    '@type': 'OpeningHoursSpecification'
    dayOfWeek: string
    opens: string
    closes: string
  }[]
  sameAs?: string[]
}

interface BusinessReviewEntity {
  '@context': 'https://schema.org'
  '@type': BusinessSchemaType
  '@id': string
  name: string
  aggregateRating: {
    '@type': 'AggregateRating'
    ratingValue: number
    reviewCount: number
    bestRating: number
    worstRating: number
  }
  review?: {
    '@type': 'Review'
    author: { '@type': 'Person'; name: string }
    reviewBody: string
    reviewRating: {
      '@type': 'Rating'
      ratingValue: number
      bestRating: number
      worstRating: number
    }
  }[]
}

export function businessSchemaType(business: PublicBusiness): BusinessSchemaType {
  if (business.operationMode === 'online' || !business.location) return 'Organization'
  return business.category in localTypes
    ? localTypes[business.category as keyof typeof localTypes]
    : 'LocalBusiness'
}

export function businessPageTitle(business: PublicBusiness): string {
  return `${business.name} — Business Details & Customer Reviews | Creda`
}

export function businessPageDescription(business: PublicBusiness): string {
  const location =
    business.operationMode === 'online'
      ? ''
      : [business.city, business.state].filter(Boolean).join(', ')
  const introduction = `${business.name}${location ? ` in ${location}` : ''}: business details and customer reviews. `
  const description = `${introduction}${business.description}`.replace(/\s+/g, ' ').trim()
  return description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description
}

export function businessStructuredData(
  business: PublicBusiness,
  canonicalUrl: string,
): BusinessEntity {
  const type = businessSchemaType(business)
  const images = [business.coverUrl, business.logoUrl, ...business.galleryUrls].filter(
    (url): url is string => Boolean(url),
  )
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return {
    '@type': type,
    '@id': `${canonicalUrl}#business`,
    name: business.name,
    description: business.description,
    url: business.websiteUrl || canonicalUrl,
    ...(business.logoUrl ? { logo: business.logoUrl } : {}),
    ...(images.length ? { image: images } : {}),
    ...(business.location
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: business.location,
            ...(business.city ? { addressLocality: business.city } : {}),
            ...(business.state ? { addressRegion: business.state } : {}),
          },
        }
      : {}),
    ...(business.serviceArea ? { areaServed: business.serviceArea } : {}),
    ...(business.contactUrl?.startsWith('tel:') ? { telephone: business.contactUrl.slice(4) } : {}),
    ...(type !== 'Organization' && business.weeklyHours.length
      ? {
          openingHoursSpecification: dayNames.map((name, index) => {
            const hours = business.weeklyHours.find((day) => day.day === index + 1)
            return {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: `https://schema.org/${name}`,
              opens: hours ? `${hours.start}:00` : '00:00:00',
              closes: hours ? `${hours.end}:00` : '00:00:00',
            }
          }),
        }
      : {}),
    ...(business.ownershipStatus === 'verified' && business.socialUrl
      ? { sameAs: [business.socialUrl] }
      : {}),
  }
}

export function businessReviewStructuredData(
  business: { name: string; canonicalUrl: string; type: BusinessSchemaType },
  data: ReviewListResponse,
): BusinessReviewEntity | null {
  if (!data.reviewCount || data.averageRating === null) return null
  // Only public names may enter Review markup. Anonymous ratings still count in the visible aggregate.
  const reviews = data.reviews.filter(
    (review) =>
      !review.isAnonymous && review.authorName.trim().length > 0 && review.authorName.length < 100,
  )
  return {
    '@context': 'https://schema.org',
    '@type': business.type,
    '@id': `${business.canonicalUrl}#business`,
    name: business.name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(data.averageRating.toFixed(1)),
      reviewCount: data.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    ...(reviews.length
      ? {
          review: reviews.map((review) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: review.authorName },
            reviewBody: review.body,
            reviewRating: {
              '@type': 'Rating',
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
  }
}
