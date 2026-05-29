import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";

const SCENARIOS = [
  {
    eyebrow: "Inherited house",
    title: "The house is inherited and nobody wants to manage it.",
    body:
      "You may still be sorting paperwork, family decisions, cleanup, or repairs. We can talk through the property before everything is perfect.",
    href: "/sell/inherited",
    cta: "See the inherited-property page",
  },
  {
    eyebrow: "Vacant after a move",
    title: "They moved out and the house is sitting empty.",
    body:
      "Vacant houses still have taxes, utilities, insurance, and maintenance. A direct sale can make sense when you are done carrying it.",
    href: "/sell/guide",
    cta: "Read the seller guide",
  },
  {
    eyebrow: "Former rental",
    title: "The rental needs work and the owner is done.",
    body:
      "Tenants, turnover, repairs, and late rent can wear people out. We buy rentals as-is, even when the property is not ready to list.",
    href: "/sell/landlord",
    cta: "See the landlord page",
  },
  {
    eyebrow: "Major repairs",
    title: "The house needs more work than you want to take on.",
    body:
      "Roof, foundation, cleanup, old systems, or years of deferred maintenance are all common. You do not need to fix the house before asking for an offer.",
    href: "/sell/as-is",
    cta: "See the as-is page",
  },
] as const;

export function CommonSellerScenarios() {
  return (
    <section className="section-wrap">
      <FadeIn>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
            Common Seller Situations
          </p>
          <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
            Why sellers usually call us
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-ink-400">
            Most people call because the house, the timing, or the cleanup has
            become too much. These are the situations we see most often.
          </p>
        </div>
      </FadeIn>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {SCENARIOS.map((scenario, index) => (
          <FadeIn key={scenario.title} delay={index * 90}>
            <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                {scenario.eyebrow}
              </p>
              <h3 className="mt-3 font-display text-2xl leading-tight text-ink-600">
                {scenario.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                {scenario.body}
              </p>
              <Link
                href={scenario.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest-600 transition-colors hover:text-forest-700"
              >
                {scenario.cta}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </article>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
