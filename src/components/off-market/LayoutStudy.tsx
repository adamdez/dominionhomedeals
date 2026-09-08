'use client'

import { useState } from 'react'
import Image from 'next/image'

type Props = { currentImage: string; conceptImage: string; pdf: string }

export function LayoutStudy({ currentImage, conceptImage, pdf }: Props) {
  const [proposed, setProposed] = useState(false)
  const src = proposed ? conceptImage : currentImage
  return (
    <section aria-labelledby="layout-study-title">
      <h2 id="layout-study-title" className="font-display text-heading text-ink-600 mb-3">Footprint and proposed changes</h2>
      <p className="mb-5 text-sm leading-relaxed text-ink-500">The county footprint and photo evidence are shown separately from the optional conversion. Interior partitions and room dimensions still need field verification.</p>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Choose layout view">
        <button type="button" aria-pressed={!proposed} onClick={() => setProposed(false)} className={`rounded-full border px-5 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${!proposed ? 'border-forest-700 bg-forest-700 text-white' : 'border-stone-300 bg-white text-ink-600'}`}>Current footprint</button>
        <button type="button" aria-pressed={proposed} onClick={() => setProposed(true)} className={`rounded-full border px-5 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${proposed ? 'border-amber-500 bg-amber-100 text-amber-950' : 'border-stone-300 bg-white text-ink-600'}`}>Proposed concept</button>
      </div>
      <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <Image src={src} alt={proposed ? 'Optional conversion map. Target five bedrooms and four bathrooms. Added cost and room locations are unconfirmed.' : 'County building footprint. First floor 2070 square feet. Second floor 980 square feet. Basement 1236 square feet recorded separately. Interior walls are not mapped.'} width={900} height={660} unoptimized className="h-auto w-full" />
        <figcaption className="border-t border-stone-200 px-5 py-4 text-xs leading-relaxed text-ink-500">{proposed ? 'Proposed only. This is a scope map. It is not a measured floor plan or an approved construction plan. Conversion costs are additional to renovating the existing layout.' : 'County sketch checked September 8, 2026. The walkthrough confirmed 3 full baths and 1 half bath. Interior room positions remain to be mapped.'}</figcaption>
      </figure>
      <div className="mt-4 flex flex-wrap gap-5 text-sm font-semibold text-forest-700">
        <a className="underline underline-offset-4" href={src} target="_blank" rel="noopener noreferrer">Open full-size diagram</a>
        <a className="underline underline-offset-4" href={pdf} target="_blank" rel="noopener noreferrer">Download both views</a>
      </div>
    </section>
  )
}
