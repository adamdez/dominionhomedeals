import type { MetadataRoute } from 'next'

// ─── Single source of truth for neighborhood slugs ───────────────────────────
// Must match exactly the keys in src/app/neighborhoods/[slug]/page.tsx
// If you add or remove a neighborhood page, update this array.
const neighborhoods = [
  // Spokane County
  'spokane-valley',
  'north-spokane',
  'south-hill',
  'downtown-spokane',
  'cheney',
  'airway-heights',
  'liberty-lake',
  'mead',
  'deer-park',
  'medical-lake',
  'millwood',
  'otis-orchards',
  'nine-mile-falls',
  'elk',
  'spangle',
  // Kootenai County
  'coeur-d-alene',
  'post-falls',
  'hayden',
  'rathdrum',
  'dalton-gardens',
  'spirit-lake',
  'athol',
  'hauser',
  'harrison',
  'worley',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dominionhomedeals.com'

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/sell`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/sell/as-is`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/sell/foreclosure`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/sell/inherited`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/sell/landlord`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/how-we-work`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/neighborhoods`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  const neighborhoodPages = neighborhoods.map((slug) => ({
    url: `${baseUrl}/neighborhoods/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...neighborhoodPages]
}
