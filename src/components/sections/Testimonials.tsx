// src/components/sections/Testimonials.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/animations/FadeIn";

// These are your 2 real testimonials — update with actual quotes when you get them
const REVIEWS = [
  {
    name: "First Seller",
    location: "Spokane, WA",
    quote:
      "Adam and his team made selling my house so much easier than I expected. They came out, looked at the place, gave me a fair offer, and we closed in two weeks. No hassle, no pressure. Just good people doing what they said they'd do.",
    closedIn: "2 weeks",
  },
  {
    name: "Recent Seller",
    location: "Spokane County, WA",
    quote:
      "I was nervous about selling to a cash buyer but meeting Nathan in person changed everything. He was upfront about the numbers, explained the whole process, and followed through on every promise. I'd recommend Dominion Homes to anyone.",
    closedIn: "2 weeks",
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="border-y border-stone-200 bg-white">
      <div className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              From Our Sellers
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Real People. Real Experiences.
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-7 sm:p-9">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="font-display text-lg leading-relaxed text-ink-600 sm:text-xl">
                &ldquo;{REVIEWS[active].quote}&rdquo;
              </blockquote>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-500">{REVIEWS[active].name}</p>
                  <p className="text-xs text-ink-300">{REVIEWS[active].location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-300">Closed in</p>
                  <p className="text-sm font-semibold text-forest-600">{REVIEWS[active].closedIn}</p>
                </div>
              </div>
            </div>

            {REVIEWS.length > 1 && (
              <div className="mt-5 flex justify-center gap-2">
                {REVIEWS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Testimonial ${i + 1}`}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === active ? "w-6 bg-forest-500" : "w-2 bg-stone-300 hover:bg-stone-400"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
