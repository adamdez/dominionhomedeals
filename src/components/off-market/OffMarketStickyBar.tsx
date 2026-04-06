'use client'

import { Phone } from 'lucide-react'

type Props = {
  propertyTitle: string
  phone: string
  phoneDisplay: string
}

export function OffMarketStickyBar({ propertyTitle, phone, phoneDisplay }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/90 bg-stone-50/95 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink-500">{propertyTitle}</p>
          <a href={`tel:${phone}`} className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-forest-700">
            <Phone className="h-4 w-4 shrink-0" />
            {phoneDisplay}
          </a>
        </div>
        <a
          href="#inquire"
          className="shrink-0 rounded-xl bg-forest-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-forest-700"
        >
          Inquire
        </a>
      </div>
    </div>
  )
}
