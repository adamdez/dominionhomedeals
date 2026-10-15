import { atlanticPageHtml } from '@/data/atlantic-page'

export const dynamic = 'force-static'

export function GET() {
  return new Response(atlanticPageHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
