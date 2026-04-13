import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { SITE } from "@/lib/constants";
import { SELLER_STORIES } from "@/lib/seller-stories";

export const metadata: Metadata = {
  title: "Local Deal Snapshots | Common Spokane & North Idaho Situations",
  description:
    "Read grounded, privacy-safe deal snapshots based on the inherited, as-is, rental, and relocation situations Dominion Homes handles in Spokane County and North Idaho.",
  alternates: { canonical: `${SITE.url}/stories` },
  openGraph: {
    title: "Local Deal Snapshots | Dominion Homes",
    description:
      "Privacy-safe deal snapshots and common local situations for homeowners considering a direct sale.",
    url: `${SITE.url}/stories`,
    type: "website",
  },
};

export default function SellerStoriesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "Local Deal Snapshots", url: `${SITE.url}/stories` },
        ]}
      />
      <section className="relative overflow-hidden bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-600">
            Local Deal Snapshots
          </p>
          <h1 className="font-display text-display text-ink-700 text-balance">
            What a Local As-Is Closing Usually Looks Like
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-ink-400">
            These pages are written like deal snapshots, not glossy testimonials.
            They show the kinds of inherited, rental, and relocation situations that
            come up in Spokane County and North Idaho, while keeping identifying
            details out of public view.
          </p>
        </div>
      </section>

      <section className="section-wrap">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SELLER_STORIES.map((story, index) => (
            <FadeIn key={story.slug} delay={index * 80}>
              <article className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                  {story.situation}
                </p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-ink-600">
                  {story.title}
                </h2>
                <p className="mt-2 text-sm font-medium text-ink-300">{story.location}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-400">
                  {story.summary}
                </p>
                <div className="mt-5 rounded-xl bg-stone-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-500">
                    Why a direct sale fit
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    {story.whyDirectSaleFit[0]}
                  </p>
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
      </section>
    </>
  );
}
