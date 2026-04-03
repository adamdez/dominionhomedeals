import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/al/'],
      },
    ],
    sitemap: 'https://dominionhomedeals.com/sitemap.xml',
  }
}
