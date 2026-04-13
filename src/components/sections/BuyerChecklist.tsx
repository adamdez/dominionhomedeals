import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";

const TRUST_FACTORS = [
  {
    title: "Who is actually buying the house?",
    body: "A serious buyer should be able to tell you plainly whether they are the direct buyer or just trying to tie the property up and shop the contract around.",
  },
  {
    title: "Who is handling title and closing?",
    body: "You should know the title company before you sign. Real sellers want to know where closing happens, who is coordinating paperwork, and what the timeline looks like.",
  },
  {
    title: "Can they explain the offer without dancing around it?",
    body: "Most homeowners do not expect retail. They do expect a straight answer on repairs, timeline, fees, and how the number was reached.",
  },
  {
    title: "Do they act local and reachable?",
    body: "People notice when a company feels like a call center. They want real names, a real phone number, and someone who can actually meet them if needed.",
  },
  {
    title: "Are there any surprise fees or upfront costs?",
    body: "There should not be. Sellers are already stressed enough. Hidden fees, vague paperwork, and pressure tactics are where trust usually falls apart.",
  },
  {
    title: "What happens if timing changes?",
    body: "Real life moves around. Serious buyers should be able to talk through fast closings, slower closings, estate delays, tenant issues, and other timing problems without making it weird.",
  },
] as const;

const WHAT_SELLERS_USUALLY_WANT = [
  "A fair number, even if it is not top-dollar retail",
  "Clear communication and quick follow-up",
  "No cleanup, no repairs, and no showings",
  "A buyer who actually closes when they say they will",
  "A process that does not make a hard situation even harder",
] as const;

export function BuyerChecklist() {
  return (
    <section className="border-y border-stone-200 bg-stone-100/50">
      <div className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              How Sellers Vet Buyers
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              If You Are Comparing Cash Buyers, Start Here
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-ink-400">
              People selling to a direct buyer usually care about the same few
              things: can you explain the process, can you close, and are you going
              to make this easier or harder? That is the standard we think sellers
              should use.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <FadeIn>
            <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-500">
                What Usually Matters Most
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
                  . It walks through what to ask, what to expect, and where a direct
                  sale makes sense.
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
