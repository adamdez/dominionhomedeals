import princeton4129Photos from '@/data/4129-e-princeton-ave-photos.json'
import { SITE } from '@/lib/constants'

export type OffMarketPhoto = { src: string; alt: string }

export type OffMarketListing = {
  slug: string
  status: 'active' | 'sold' | 'draft'
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
  compLinks?: { label: string; href: string }[]
  mapQuery: string
  leadSource: string
  lat: number
  lng: number
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
}

const listings: Record<string, OffMarketListing> = {
  '4129-e-princeton-ave': {
    slug: '4129-e-princeton-ave',
    status: 'active',
    title: '4129 E Princeton Ave',
    locationLine: 'Spokane, WA 99217',
    priceDisplay: '$143,000',
    priceNumeric: 143000,
    eyebrow: 'Off-market light industrial property in Hillyard',
    tags: [
      '$143K asking',
      'Light industrial zoning',
      '0.35-acre lot',
      'Two-bay shop',
      'House + shop photos',
      'Sold as-is',
    ],
    beds: 'N/A',
    baths: 'N/A',
    sqft: '15,244 lot',
    lot: '0.35 acre',
    year: 'Buyer verify',
    county: 'Spokane County',
    streetAddress: '4129 E Princeton Ave',
    city: 'Spokane',
    state: 'WA',
    zip: '99217',
    conditionSummary:
      'Off-market light industrial property on 0.35 acre in Hillyard. Includes a manufactured home, two-bay shop, storage shed, and open yard. Interior and exterior photos are posted.',
    summary:
      'Off-market property at 4129 E Princeton Ave in Spokane. Asking $143,000. The 0.35-acre light industrial lot has a manufactured home, two-bay shop, storage shed, open yard, and utility equipment. It may work for a contractor, small shop, service business, equipment parking, or storage. Interior and exterior photos are posted.',
    paragraphs: [
      'The main value here is the light industrial land, the two-bay shop, the open yard, and the location. This is better suited for a contractor or small business than a regular house flip.',
      'The asking price is $143,000, which works out to about $9.38 per square foot based on the reported 15,244-square-foot lot. Possible uses include a contractor yard, small shop and office, repair or service business, equipment parking, material storage, or extra space for a nearby business.',
      'The property is being sold as-is and will need cleanup. Current photos show the manufactured home, shop, yard, and utility panels. Buyers need to check the buildings, utilities, access, zoning, permits, and whether the property will work for their intended use.',
    ],
    highlights: [
      { text: '$143,000 asking price' },
      { text: 'Approximately 15,244 sq ft / 0.35 acre' },
      { text: 'Light industrial zoning' },
      { text: 'About $9.38 per square foot of land at the asking price' },
      { text: 'Two-bay shop, storage shed, manufactured home, and open yard' },
      { text: 'Interior and exterior photos of the house, shop, and yard are posted' },
      { text: 'Possible contractor yard, small shop, service business, parking, or storage use' },
      { text: 'Sold as-is; buyer needs to verify condition, utilities, zoning, permits, and intended use' },
    ],
    facts: [
      ['Asking price', '$143,000'],
      ['Parcel', '35031.0213'],
      ['Lot size', 'Approximately 15,244 sq ft / 0.35 acre'],
      ['Approx. land price', '$9.38 per sq ft based on the reported lot size'],
      ['Zoning', 'LI - Light Industrial; buyer needs to confirm its intended use'],
      ['Assessor use', 'Other Residential'],
      ['Existing improvements', 'Manufactured home, two-bay shop, storage shed, and other exterior improvements - all as-is'],
      ['Photos', 'Exterior, manufactured-home interior, and shop photos posted July 2026'],
      ['Sale type', 'Off-market, sold as-is'],
      ['Best fit', 'Contractor, small shop, service business, or nearby business needing more yard or storage space'],
      ['Buyer needs to check', 'Buildings, title, access, utilities, cleanup, zoning, permits, drainage, parking, and intended use'],
    ],
    photos: princeton4129Photos as OffMarketPhoto[],
    neighborhoodTitle: 'Hillyard light industrial area',
    neighborhoodBody:
      'The property is in an established Hillyard industrial area with shops, service businesses, yards, and storage nearby. It is a smaller lot, so it makes more sense for a contractor or small business than for a large warehouse or truck yard.',
    distanceChips: [
      { label: 'Asking', value: '$143K' },
      { label: 'Zoning', value: 'LI' },
      { label: 'Lot', value: '0.35 acre' },
      { label: 'Best use', value: 'Shop + yard' },
    ],
    mapQuery: '4129 E Princeton Ave Spokane WA 99217',
    leadSource: 'off-market-4129-e-princeton-ave',
    lat: 47.69965971,
    lng: -117.34977618,
    cardImageSrc: princeton4129Photos[0]?.src ?? '/images/4129-e-princeton-ave/IMG_0206.webp',
    countySearchUrl: 'https://cp.spokanecounty.org/scout/propertyinformation/?PID=35031.0213',
    countySearchLabel: 'View Spokane County SCOUT parcel record',
    contactName: 'Adam',
    contactPhone: '5095907091',
    contactPhoneDisplay: '509-590-7091',
    contactEmail: 'adam@dominionhomedeals.com',
    primaryCtaLabel: 'Request property details',
    secondaryCtaLabel: 'Text Adam',
    smsBody:
      'I want to review 4129 E Princeton Ave at the $143,000 asking price. Can I get the property details?',
    actionIntro:
      'Questions or want to take a look? Send your info and Adam will get back to you.',
    actionSteps: [],
    submitLabel: 'Request property details',
    sourceNote:
      'As of July 23, 2026, the asking price is $143,000. Spokane County records show parcel 35031.0213, approximately 15,244 sq ft / 0.35 acre, and LI zoning. Exterior photos were taken July 23, 2026. Interior photos of the manufactured home and shop were taken July 26, 2026. The street-view photos are included for area context; the finished commercial building and trailer on the right are neighboring property and are not included. Buyer should verify the county information and intended use.',
    dueDiligenceNote:
      'Sold as-is. Buyer needs to verify title, property lines, access, condition of the buildings, manufactured-home title and status, utilities, cleanup or removal costs, zoning, permitted use, drainage, parking, environmental issues, permits, and whether the property will work for the buyer.',
  },
}

export function getOffMarketSlugs(): string[] {
  return Object.values(listings)
    .filter((listing) => listing.status === 'active')
    .map((listing) => listing.slug)
}

export function getOffMarketListing(slug: string): OffMarketListing | undefined {
  const listing = listings[slug]
  return listing?.status === 'active' ? listing : undefined
}

export function getAllOffMarketListings(): OffMarketListing[] {
  return Object.values(listings).filter((listing) => listing.status === 'active')
}

export function getSiteUrl(): string {
  return SITE.url
}
