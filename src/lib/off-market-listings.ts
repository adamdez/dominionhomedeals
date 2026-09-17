import { SITE } from '@/lib/constants'
import { plymouthListing } from '@/data/plymouth-listing'

export type OffMarketPhoto = { src: string; alt: string }

export type OffMarketListing = {
  slug: string
  status: 'active' | 'draft'
  title: string
  locationLine: string
  priceDisplay: string
  priceNumeric: number
  buyNowDisplay?: string
  eyebrow: string
  tags: string[]
  beds: string
  baths: string
  sqft: string
  lot: string
  year: string
  county: string
  streetAddress: string
  city: string
  state: string
  zip: string
  conditionSummary: string
  summary: string
  paragraphs: string[]
  highlights: { text: string }[]
  buyerOptions?: { title: string; body: string }[]
  facts: [string, string][]
  photos: OffMarketPhoto[]
  neighborhoodTitle: string
  neighborhoodBody: string
  distanceChips: { label: string; value: string }[]
  compLinks?: {
    label: string
    href: string
    status: 'sold' | 'active'
    price: string
    dateLabel: string
    details: string
    comparison: string
    sourceHref?: string
  }[]
  compsCheckedAt?: string
  arv?: { value: string; assumptions: string; rationale: string }
  mapQuery: string
  leadSource: string
  lat?: number
  lng?: number
  cardImageSrc: string
  countySearchUrl?: string
  countySearchLabel?: string
  contactName?: string
  contactPhone?: string
  contactPhoneDisplay?: string
  contactEmail?: string
  primaryCtaLabel?: string
  secondaryCtaLabel?: string
  smsBody?: string
  actionTitle?: string
  actionIntro?: string
  actionSteps?: [string, string][]
  submitLabel?: string
  sourceNote?: string
  dueDiligenceNote?: string
  galleryNote?: string
  layoutStudy?: { currentImage: string; conceptImage: string; pdf: string }
}

const listings: Record<string, OffMarketListing> = {
  '6722-s-plymouth-rd': plymouthListing,

}

export function getOffMarketSlugs(): string[] {
  return Object.values(listings)
    .filter((listing) => listing.status === 'active')
    .map((listing) => listing.slug)
}

export function getOffMarketListing(slug: string): OffMarketListing | undefined {
  const listing = listings[slug]
  // Drafts are reviewable locally. Production and the public catalog exclude them.
  return listing?.status === 'active' ||
    (process.env.NODE_ENV === 'development' && listing?.status === 'draft')
    ? listing
    : undefined
}

export function getAllOffMarketListings(): OffMarketListing[] {
  return Object.values(listings).filter((listing) => listing.status === 'active')
}

export function getSiteUrl(): string {
  return SITE.url
}
