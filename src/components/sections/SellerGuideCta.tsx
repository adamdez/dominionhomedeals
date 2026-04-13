import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";

const GUIDE_POINTS = [
  "When a direct cash sale makes sense and when listing may be smarter",
  "What to ask any cash buyer before you sign anything",
  "How title, timing, repairs, and fees usually work",
  "Where to start if the property is inherited, distressed, tenant-occupied, or time-sensitive",
] as const;

export function SellerGuideCta() {
  return (
    <section className="section-wrap">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-white p-8 shadow-soft sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-forest-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-amber-100/40 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Seller Guide
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                Not Ready to Fill Out the Form Yet?
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-400">
                That is completely fine. Start with the Spokane seller guide instead.
                It is built for homeowners who want to understand the process, compare
                their options, and know what questions to ask before they commit.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/sell/guide" className="btn-primary">
                  Read the Seller Guide
                </Link>
                <Link href="/how-we-work" className="btn-secondary">
                  See How Our Process Works
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                What You Will Get
              </p>
              <ul className="mt-4 space-y-3">
                {GUIDE_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-ink-500">
                    <svg
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
