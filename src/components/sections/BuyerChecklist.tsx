import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";

const TRUST_FACTORS = [
  {
    title: "Who is actually buying the house?",
    body: "Ask if they are buying it themselves or assigning the contract to someone else.",
  },
  {
    title: "Who is handling title and closing?",
    body: "You should know the title company before you sign.",
  },
  {
    title: "Can they explain the offer?",
    body: "A real buyer should explain repairs, costs, timing, and fees in plain language.",
  },
  {
    title: "Can you reach them?",
    body: "Look for a real name, real phone number, and someone who can meet you if needed.",
  },
  {
    title: "Are there any fees?",
    body: "You should not pay upfront fees to get an offer.",
  },
  {
    title: "What happens if timing changes?",
    body: "Ask what happens if probate, tenants, moving, or title takes longer than expected.",
  },
] as const;

const WHAT_SELLERS_USUALLY_WANT = [
  "A fair number",
  "Clear communication",
  "No repairs or showings",
  "A buyer who closes",
  "Less stress, not more",
] as const;

export function BuyerChecklist() {
  return (
    <section className="border-y border-stone-200 bg-stone-100/50">
      <div className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              Compare Buyers
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              A good cash buyer should be easy to check.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-ink-400">
              Before you sign anything, make sure you know who is buying, where
              closing happens, and whether there are any fees.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <FadeIn>
            <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                What Sellers Usually Want
              </p>
              <ul className="mt-5 space-y-3">
                {WHAT_SELLERS_USUALLY_WANT.map((item) => (
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
              <div className="mt-6 rounded-xl bg-stone-50 p-4">
                <p className="text-sm leading-relaxed text-ink-400">
                  If you want the long version, start with the{" "}
                  <Link href="/sell/guide" className="font-semibold text-forest-600 hover:text-forest-700">
                    Spokane seller guide
                  </Link>
                  . It explains what to ask and when a direct sale makes sense.
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="grid gap-4 md:grid-cols-2">
            {TRUST_FACTORS.map((item, index) => (
              <FadeIn key={item.title} delay={index * 60}>
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                    Checkpoint {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-display text-2xl text-ink-600">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">
                    {item.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
