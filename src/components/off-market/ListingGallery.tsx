'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { OffMarketPhoto } from '@/lib/off-market-listings'

type Props = {
  photos: OffMarketPhoto[]
  prioritySrc?: string
}

export function ListingGallery({ photos, prioritySrc }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const openAt = (i: number) => {
    setIndex(i)
    setOpen(true)
  }

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open) {
      d.showModal()
      document.body.style.overflow = 'hidden'
    } else {
      d.close()
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + photos.length) % photos.length)
    },
    [photos.length],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go])

  const hero = photos[0]
  const rest = photos.slice(1)

  return (
    <section className="bg-stone-100">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:gap-3">
          <button
            type="button"
            onClick={() => openAt(0)}
            className="relative col-span-2 row-span-2 aspect-[4/3] lg:aspect-auto lg:min-h-[min(70vh,520px)] overflow-hidden rounded-2xl bg-stone-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2 group"
          >
            <Image
              src={hero.src}
              alt={hero.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority={prioritySrc === hero.src || !prioritySrc}
            />
            <span className="absolute bottom-4 left-4 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Open gallery ({photos.length})
            </span>
          </button>
          {rest.slice(0, 6).map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => openAt(i + 1)}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 group"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
        {rest.length > 6 && (
          <p className="mt-4 text-center text-sm text-ink-400">
            +{rest.length - 6} more in gallery — click any photo
          </p>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[100] max-h-none max-w-none border-0 bg-transparent p-0 backdrop:bg-black/85 [&::backdrop]:bg-black/85"
        onClose={() => setOpen(false)}
      >
        {open && (
          <div className="flex h-[100dvh] w-[100vw] flex-col bg-black">
            <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
              <span className="text-sm text-white/80">
                {index + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close gallery"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image
                src={photos[index].src}
                alt={photos[index].alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Next photo"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </div>
            <p className="shrink-0 px-4 py-3 text-center text-sm text-white/85">{photos[index].alt}</p>
          </div>
        )}
      </dialog>
    </section>
  )
}
