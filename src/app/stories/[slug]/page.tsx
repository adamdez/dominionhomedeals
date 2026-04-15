import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { SITE } from "@/lib/constants";
import { getSellerStory, SELLER_STORIES } from "@/lib/seller-stories";

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SELLER_STORIES.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = getSellerStory(slug);
  if (!story) {
    return { title: "Local Deal Snapshot" };
  }

  return {
    title: `${story.title} | Local Deal Snapshot`,
    description: story.summary,
    alternates: { canonical: `${SITE.url}/stories/${story.slug}` },
    openGraph: {
      title: `${story.title} | Dominion Homes`,
      description: story.summary,
      url: `${SITE.url}/stories/${story.slug}`,
      type: "article",
    },
  };
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink-500">
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
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function SellerStoryDetailPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = getSellerStory(slug);
  if (!story) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "Local Deal Snapshots", url: `${SITE.url}/stories` },
          { name: story.title, url: `${SITE.url}/stories/${story.slug}` },
        ]}
      />
      <section className="relative overflow-hidden bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="mx-auto max-w-4xl px-5 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-600">
            {story.situation}
          </p>
          <h1 className="font-display text-display text-ink-700 text-balance">
            {story.title}
          </h1>
          <p className="mt-3 text-sm font-medium uppercase tracking-[0.16em] text-ink-300">
            {story.location}
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-ink-400">
            {story.hook}
          </p>
        </div>
      </section>

      <section className="section-wrap">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Local Context
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                {story.intro}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Why It Mattered
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-500">
                {story.summary}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Privacy Note
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                {story.note}
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Property Snapshot
              </p>
              <div className="mt-4">
                <BulletList items={story.propertySnapshot} />
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Seller Priorities
              </p>
              <div className="mt-4">
                <BulletList items={story.sellerPriority} />
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Why A Direct Sale Fit
              </p>
              <div className="mt-4">
                <BulletList items={story.whyDirectSaleFit} />
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Typical Closing Shape
              </p>
              <div className="mt-4">
                <BulletList items={story.closingShape} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <div className="relative overflow-hidden rounded-2xl bg-ink-600 px-7 py-14 text-center sm:px-14">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-forest-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

          <h2 className="font-display text-display text-white text-balance">
            Want to Talk Through Your Situation?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-stone-400">
            Every property is different, but the questions are usually familiar.
            If you want to walk through your situation, start with the guide or go
            straight to the cash-offer form.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sell/guide"
              className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100"
            >
              Read the Seller Guide
            </Link>
            <Link
              href="/#get-offer"
              className="text-sm font-semibold text-stone-300 transition-colors hover:text-amber-400"
            >
              Or get a cash offer
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
