import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/al/'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/api/', '/al/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/al/'],
      },
    ],
    sitemap: 'https://dominionhomedeals.com/sitemap.xml',
  }
}
