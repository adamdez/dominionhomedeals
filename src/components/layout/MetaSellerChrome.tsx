import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export function MetaSellerChrome({ children }: { children: React.ReactNode }) {
  return <>
    <header className="border-b border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6 lg:px-8">
        <Link href="/sell/offer-check" className="flex items-center gap-3" aria-label="Dominion Homes seller options">
          <Image src="/images/logo-mark.webp" alt="Dominion Homes logo" width={38} height={38} priority />
          <span><span className="block font-display text-xl text-ink-600">Dominion Homes</span><span className="block text-xs text-forest-500">Local selling options</span></span>
        </Link>
        <a href={`tel:${SITE.phone.replace(/\D/g, '')}`} className="whitespace-nowrap text-sm font-semibold text-forest-600 underline underline-offset-4">{SITE.phone}</a>
      </div>
    </header>
    {children}
    <footer className="border-t border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-6xl space-y-3 px-5 py-8 text-sm leading-relaxed text-ink-500 sm:px-6 lg:px-8">
        <p>Dominion Homes is a home-buying and wholesale business, not a licensed real estate brokerage. We may purchase directly or assign a purchase agreement to another buyer. We are not always the final buyer.</p>
        <p>© 2026 {SITE.legalName}. <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link> · <Link href="/terms" className="underline underline-offset-4">Terms &amp; Conditions</Link></p>
      </div>
    </footer>
  </>;
}
