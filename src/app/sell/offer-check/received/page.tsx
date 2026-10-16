import type { Metadata } from 'next';
import { SITE } from '@/lib/constants';
import { MetaReceiptTracker } from '@/components/analytics/MetaReceiptTracker';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Property Inquiry Received', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function MetaOfferReceivedPage() {
  return <main id="main-content" className="mx-auto max-w-2xl px-5 py-32">
    <p className="text-sm font-semibold text-forest-600">Property inquiry received</p>
    <h1 className="mt-4 font-display text-4xl text-ink-600">Thank you for contacting Dominion.</h1>
    <p className="mt-5 leading-relaxed text-ink-400">A team member will review your request and contact you. This is not a property offer or a promise to buy.</p>
    <a href={`tel:${SITE.phone.replace(/\D/g, '')}`} className="btn-secondary mt-6">Call {SITE.phone}</a>
    <div><MetaReceiptTracker pixelId={process.env.META_ADS_PIXEL_ID || ''}
      mode={process.env.META_ADS_MEASUREMENT_MODE || 'disabled'} deployment={process.env.VERCEL_ENV || ''} /></div>
  </main>;
}
