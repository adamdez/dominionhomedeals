import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";

const SCENARIOS = [
  {
    eyebrow: "Inherited house",
    title: "The house is fine, but nobody wants to be the one managing it.",
    body:
      "This usually sounds like: \"We are still sorting through the family side of it, the house is dated, and we do not even know where to start.\" What matters most here is patience, a clear process, and not being pushed into a fast decision before everyone is ready.",
    href: "/sell/inherited",
    cta: "See the inherited-property page",
  },
  {
    eyebrow: "Vacant after a move",
    title: "They already moved and now they are carrying a house they are done with.",
    body:
      "People in this spot usually care about certainty. They want to know when it can close, whether they need to fix anything, and whether the buyer will keep things simple instead of dragging it out.",
    href: "/sell/guide",
    cta: "Read the seller guide",
  },
  {
    eyebrow: "Former rental",
    title: "The tenants are out, the repairs are stacking up, and the owner is over it.",
    body:
      "Landlord sellers tend to talk less about emotion and more about hassle. They want a straight number, a clean process, and no long list of work before the house can change hands.",
    href: "/sell/landlord",
    cta: "See the landlord page",
  },
  {
    eyebrow: "Major repairs",
    title: "The house needs enough work that listing it starts to feel like another project.",
    body:
      "This is where people usually ask some version of: \"Can we just sell it the way it sits?\" The answer they are looking for is not hype. It is whether the buyer can actually handle a roof issue, foundation issue, cleanup, or deferred maintenance without turning the deal into a mess later.",
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
            The Calls We Get Most Often
          </p>
          <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
            How Real Seller Situations Usually Sound
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-ink-400">
            Most homeowners do not call saying, &ldquo;I would like a cash offer.&rdquo;
            They call because something about the house, the timeline, or life around
            it has gotten heavy. These are the kinds of conversations that usually
            bring people to us.
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
