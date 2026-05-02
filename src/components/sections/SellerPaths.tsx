import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";

const SELLER_PATHS = [
  {
    title: "Need to sell fast in Spokane",
    description:
      "When repairs, timing, taxes, or family paperwork make the normal listing process feel too slow or uncertain.",
    href: "/sell-my-house-fast-spokane",
    label: "Read the fast-sale Spokane guide",
  },
  {
    title: "Inherited or estate property",
    description:
      "Questions around probate, family decision-making, cleanup, and whether now is even the right time to sell.",
    href: "/sell-house-probate-spokane",
    label: "Read the probate house guide",
  },
  {
    title: "House needs major repairs",
    description:
      "Roof issues, foundation problems, deferred maintenance, or a house that simply is not worth fixing before a sale.",
    href: "/sell/as-is",
    label: "Read the as-is seller guide",
  },
  {
    title: "Behind on payments or feeling squeezed",
    description:
      "When time matters and you need a clear path without listing prep, showings, or a long retail timeline.",
    href: "/sell/foreclosure",
    label: "Read the foreclosure-pressure guide",
  },
  {
    title: "Tired landlord situation",
    description:
      "Tenants, turnover, repairs, and the question every landlord eventually asks: is it still worth holding?",
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
            Seller Situations
          </p>
          <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
            Most Sellers Do Not Start in the Same Place
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-ink-400">
            Some people need speed. Some need clarity. Some just need to understand
            their options before they decide anything. Start with the guide that
            matches what you are dealing with.
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
