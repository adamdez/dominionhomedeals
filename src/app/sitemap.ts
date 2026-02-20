import type { MetadataRoute } from 'next'

const neighborhoods = [
  'spokane-valley', 'post-falls', 'coeur-dalene', 'hayden', 'rathdrum',
  'liberty-lake', 'cheney', 'airway-heights', 'medical-lake', 'deer-park',
  'mead', 'north-spokane', 'south-hill', 'downtown-spokane', 'west-plains',
  'millwood', 'otis-orchards', 'newman-lake', 'hauser', 'spirit-lake',
  'athol', 'dalton-gardens', 'huetter', 'greenacres', 'veradale',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.dominionhomedeals.com'

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/how-we-work`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/neighborhoods`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
  ]

  const neighborhoodPages = neighborhoods.map((slug) => ({
    url: `${baseUrl}/neighborhoods/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...neighborhoodPages]
}