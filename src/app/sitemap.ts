import type { MetadataRoute } from 'next'
import { SELLER_STORIES } from '@/lib/seller-stories'
import { getAllSlugs } from '@/lib/neighborhoods'
import { SELLER_SEO_PAGES } from '@/lib/seller-seo-pages'
import { SITE } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE.url
  const contentLastUpdated = new Date('2026-05-27T12:00:00-07:00')
  const legalLastUpdated = new Date('2026-05-22T12:00:00-07:00')

  const staticPages = [
    { url: baseUrl, lastModified: contentLastUpdated, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/sell`, lastModified: contentLastUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/sell/guide`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.85 },
    { url: `${baseUrl}/how-we-calculate-cash-offers-spokane-cda`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.88 },
    { url: `${baseUrl}/stories`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/sell/as-is`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/sell/foreclosure`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/sell/inherited`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/sell/landlord`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/how-we-work`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: contentLastUpdated, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/neighborhoods`, lastModified: contentLastUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified: legalLastUpdated, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: legalLastUpdated, changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  const neighborhoodPages = getAllSlugs().map((slug) => ({
    url: `${baseUrl}/neighborhoods/${slug}`,
    lastModified: contentLastUpdated,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const storyPages = SELLER_STORIES.map((story) => ({
    url: `${baseUrl}/stories/${story.slug}`,
    lastModified: contentLastUpdated,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const sellerSeoPages = SELLER_SEO_PAGES.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: contentLastUpdated,
    changeFrequency: 'monthly' as const,
    priority: page.slug === 'sell-my-house-fast-spokane' || page.slug === 'sell-my-house-fast-coeur-d-alene' ? 0.95 : 0.88,
  }))

  return [...staticPages, ...sellerSeoPages, ...storyPages, ...neighborhoodPages]
}
