import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";

const SELLER_PATHS = [
  {
    title: "Sell fast in Spokane",
    description:
      "For sellers dealing with repairs, taxes, tenants, family paperwork, or a tight deadline.",
    href: "/sell-my-house-fast-spokane",
    label: "Read the fast-sale Spokane guide",
  },
  {
    title: "Sell fast in Coeur d'Alene",
    description:
      "For CDA, Post Falls, Hayden, and Kootenai County sellers who want an as-is option.",
    href: "/sell-my-house-fast-coeur-d-alene",
    label: "Read the CDA fast-sale guide",
  },
  {
    title: "Inherited house",
    description:
      "For probate, cleanup, family decisions, or an estate property nobody wants to manage.",
    href: "/sell-house-probate-spokane",
    label: "Read the probate house guide",
  },
  {
    title: "House needs repairs",
    description:
      "For roof, foundation, cleanup, or deferred maintenance issues.",
    href: "/sell/as-is",
    label: "Read the as-is seller guide",
  },
  {
    title: "Behind on payments",
    description:
      "For sellers who need options before the timeline gets worse.",
    href: "/sell/foreclosure",
    label: "Read the foreclosure-pressure guide",
  },
  {
    title: "Tired landlord",
    description:
      "For rentals with tenants, repairs, turnover, or landlord burnout.",
    href: "/sell-rental-property-spokane",
    label: "Read the rental property guide",
  },
] as const;

export function SellerPaths() {
  return (
    <section className="section-wrap">
      <FadeIn>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
            Seller Guides
          </p>
          <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
            Start with the page that fits your situation.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-ink-400">
            Pick the guide closest to what you are dealing with. Each one
            explains the options in plain English.
          </p>
        </div>
      </FadeIn>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {SELLER_PATHS.map((path, index) => (
          <FadeIn key={path.href} delay={index * 90}>
            <article className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                Situation {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-2xl text-ink-600">
                {path.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-400">
                {path.description}
              </p>
              <Link
                href={path.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest-600 transition-colors hover:text-forest-700"
              >
                {path.label}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </article>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
