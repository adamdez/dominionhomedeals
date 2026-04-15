// src/lib/off-market-listings.ts
import { SITE } from '@/lib/constants'
import torrensTrail472Photos from '@/data/torrens-trail-472-photos.json'

export type OffMarketPhoto = { src: string; alt: string }

export type OffMarketListing = {
  slug: string
  title: string
  locationLine: string
  priceDisplay: string
  priceNumeric: number
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
  facts: [string, string][]
  photos: OffMarketPhoto[]
  neighborhoodTitle: string
  neighborhoodBody: string
  distanceChips: { label: string; value: string }[]
  mapQuery: string
  leadSource: string
  lat: number
  lng: number
  cardImageSrc: string
}

const listings: Record<string, OffMarketListing> = {
  'torrens-trail-472': {
    slug: 'torrens-trail-472',
    title: '472 Torrens Trail',
    locationLine: 'Spirit Lake, Idaho 83869',
    priceDisplay: '$460,000',
    priceNumeric: 460000,
    eyebrow: 'Private offering · Off-market',
    tags: ['5 acres', '2016 build', 'Kootenai County'],
    beds: '2',
    baths: '2',
    sqft: '1,952',
    lot: '5 acres',
    year: '2016',
    county: 'Kootenai County',
    streetAddress: '472 Torrens Trail',
    city: 'Spirit Lake',
    state: 'ID',
    zip: '83869',
    conditionSummary: 'Move-in ready — some interior finishing work remaining',
    summary:
      'Move-in ready 2-bedroom, 2-bath home on 5 private acres in Spirit Lake, ID. Built 2016, 1,952 sq ft, asking $460,000. Direct from Dominion Homes.',
    paragraphs: [
      'Set on five private acres in Spirit Lake, Idaho, this 2016-built home offers nearly 2,000 square feet of living space with the quiet of rural North Idaho — minutes from town.',
      'The home is move-in ready with some finishing work still needed, giving a buyer room to personalize while the structure, systems, and land do the heavy lifting.',
      'Two bedrooms and two full baths on a usable five-acre parcel suit a primary residence, vacation property, or long-term hold in a growing North Idaho corridor.',
    ],
    highlights: [
      { text: 'Move-in ready — some interior finishing work remaining' },
      { text: '2016 construction — modern build with predictable systems' },
      { text: 'Five acres — privacy, trees, and usable land' },
      { text: 'Spirit Lake, ID — strong Kootenai County demand for acreage' },
      { text: 'Priced at $460,000 — direct from wholesaler, no MLS commissions' },
      { text: 'Fast close available — we can work to your timeline' },
    ],
    facts: [
      ['Address', '472 Torrens Trail'],
      ['City', 'Spirit Lake'],
      ['State', 'Idaho'],
      ['ZIP Code', '83869'],
      ['County', 'Kootenai County'],
      ['Bedrooms', '2'],
      ['Bathrooms', '2 full'],
      ['Square footage', '1,952 sq ft'],
      ['Lot size', '5 acres'],
      ['Year built', '2016'],
      ['Condition', 'Move-in ready; some finishing needed'],
      ['Asking price', '$460,000'],
      ['Property type', 'Single-family residential'],
    ],
    photos: torrensTrail472Photos as OffMarketPhoto[],
    neighborhoodTitle: 'Spirit Lake, Idaho',
    neighborhoodBody:
      "Spirit Lake sits in the heart of Kootenai County — about 35 miles north of Coeur d'Alene and under an hour from Spokane. Demand for acreage and newer construction remains strong as buyers seek space without giving up regional access.",
    distanceChips: [
      { label: "To Coeur d'Alene", value: '~35 mi' },
      { label: 'To Spokane', value: '~55 mi' },
      { label: 'County', value: 'Kootenai' },
      { label: 'State', value: 'Idaho' },
    ],
    mapQuery: '472 Torrens Trail Spirit Lake ID 83869',
    leadSource: 'off-market-torrens-trail-472',
    lat: 47.9232,
    lng: -116.8685,
    cardImageSrc: torrensTrail472Photos[0]?.src ?? '/images/torrens-trail/exterior-front.svg',
  },
}

export function getOffMarketSlugs(): string[] {
  return Object.keys(listings)
}

export function getOffMarketListing(slug: string): OffMarketListing | undefined {
  return listings[slug]
}

export function getAllOffMarketListings(): OffMarketListing[] {
  return Object.values(listings)
}

export function getSiteUrl(): string {
  return SITE.url
}
