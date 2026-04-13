import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { SELLER_STORIES } from "@/lib/seller-stories";

const TRUST_SIGNALS = [
  {
    title: "Real names, real phone number",
    body: "People trust this kind of business faster when they can tell who they are dealing with and how to reach them.",
  },
  {
    title: "Title and closing named up front",
    body: "Calling out the title company and the closing path removes a lot of the uncertainty sellers usually feel.",
  },
  {
    title: "No pressure to make the house retail-ready",
    body: "For a lot of as-is sellers, the win is getting out cleanly without a repair list, not pretending the house is market-perfect.",
  },
] as const;

export function Testimonials() {
  return (
    <section className="border-y border-stone-200 bg-white">
      <div className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              Local Deal Snapshots
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              The Kind of Closings Sellers Usually Ask Us About
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-ink-400">
              These are privacy-safe local deal snapshots built from the kinds of
              inherited, rental, and relocation situations that come up most often.
              They are written to show how a direct sale usually works, without
              pretending a blended example is a public review.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-1">
            {SELLER_STORIES.map((story, index) => (
              <FadeIn key={story.slug} delay={index * 90}>
                <article className="h-full rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-forest-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-600">
                      {story.situation}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-300">
                      {story.location}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-[1.4rem] leading-snug text-ink-600">
                    {story.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">
                    {story.summary}
                  </p>

                  <div className="mt-6 space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-500">
                        Property snapshot
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-400">
                        {story.propertySnapshot[0]}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-500">
                        What mattered most
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-400">
                        {story.sellerPriority[0]}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-500">
                        Why a direct sale fit
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-400">
                        {story.whyDirectSaleFit[0]}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/stories/${story.slug}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest-600 transition-colors hover:text-forest-700"
                  >
                    Read the full story
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </article>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={120}>
            <aside className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                What Usually Builds Trust
              </p>
              <h3 className="mt-3 font-display text-3xl leading-tight text-ink-600">
                Sellers usually know pretty quickly whether this feels real.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                In this space, people are watching for simple things: whether the
                buyer sounds local, whether the process is clear, and whether the
                answers stay practical instead of sounding rehearsed.
              </p>

              <div className="mt-6 space-y-4">
                {TRUST_SIGNALS.map((signal) => (
                  <div key={signal.title} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-sm font-semibold text-ink-600">{signal.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-400">
                      {signal.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-forest-50 p-4">
                <p className="text-sm leading-relaxed text-forest-700">
                  This section is now set up like a real deal library. When you have
                  real closings you want public, we can replace these snapshots one by
                  one with verified case studies instead of rebuilding the section.
                </p>
              </div>
            </aside>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
