// src/app/sell/as-is/page.tsx
import type { Metadata } from "next";
import { FadeIn } from "@/components/animations/FadeIn";
import { LeadForm } from "@/components/forms/LeadForm";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sell Your House As-Is in Spokane — No Repairs Needed",
  description:
    "We buy houses in any condition in Spokane and Kootenai County. No repairs, no cleaning, no inspections. Fair cash offer, close on your timeline. Call 509-822-5460.",
  alternates: { canonical: `${SITE.url}/sell/as-is` },
  openGraph: {
    title: "Sell Your House As-Is — No Repairs, No Cleaning",
    description:
      "Local team buys houses in any condition. Outdated, damaged, cluttered — doesn't matter. Fair cash offer.",
    url: `${SITE.url}/sell/as-is`,
    type: "website",
  },
};

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

const CONDITIONS = [
  "Outdated kitchens, bathrooms, flooring",
  "Roof damage or aging systems (HVAC, plumbing, electrical)",
  "Foundation issues or structural concerns",
  "Fire, smoke, or water damage",
  "Hoarding situations or heavy cleanout needed",
  "Code violations or unpermitted work",
  "Homes that have been sitting vacant",
];

const FAQS = [
  {
    q: "Do I need to get an inspection before selling?",
    a: "No. We do our own evaluation. You don't need to hire an inspector, get repair estimates, or do any pre-sale work.",
  },
  {
    q: "Will the condition of my house affect the offer?",
    a: "Yes — we're straightforward about that. A house that needs a new roof and a full rehab will get a different offer than one that just needs cosmetic updates. But the condition doesn't stop us from buying. We account for the work in our numbers and give you a fair offer based on reality.",
  },
  {
    q: "What if there's stuff left in the house?",
    a: "Take what you want and leave the rest. We handle cleanout after closing. You don't need to rent a dumpster or spend weekends hauling things out.",
  },
  {
    q: "Can you buy a house with code violations?",
    a: "In most cases, yes. We deal with code issues regularly. Let us know what you're dealing with and we'll tell you if it's something we can work through.",
  },
  {
    q: "How fast can you close?",
    a: "If everything is straightforward, we can typically close in two to three weeks. If you need more time, that's fine too — we work on your schedule.",
  },
  {
    q: "Why would I sell as-is instead of fixing it up and listing?",
    a: "That depends on your situation. Fixing up a house costs money, takes time, and comes with risk — especially if the house needs major work. Some sellers would rather skip all of that and get a clean, certain close. We can give you a cash offer so you have a real number to compare against.",
  },
  {
    q: "Is there any obligation if I call?",
    a: "None. Most first calls are just a conversation. You tell us about the house, we ask a few questions, and we let you know if it's something we can work with. No pressure.",
  },
];

export default function SellAsIsPage() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-forest-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="pt-2">
              <FadeIn>
                <div className="trust-badge mb-5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest-500" />
                  </span>
                  Sell As-Is — Any Condition
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-display text-hero text-ink-700 text-balance">
                  Your House Needs Work?
                  <br />
                  <span className="text-forest-500">
                    We Buy As-Is.
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-400">
                  No repairs, no cleaning, no staging, no open houses.
                  We buy houses in any condition in Spokane and Kootenai County.
                  You don&apos;t need to fix a thing — we handle all of that
                  after closing.
                </p>
              </FadeIn>

              <FadeIn delay={240}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#get-offer" className="btn-primary">
                    Get Your Cash Offer
                  </a>
                  <a
                    href={`tel:${phoneClean}`}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <PhoneIcon />
                    Call {SITE.phone}
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={320}>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
                  {[
                    "No repairs needed",
                    "We handle cleanout",
                    "Any condition",
                    "Zero fees",
                  ].map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <CheckIcon />
                      {item}
                    </span>
                  ))}
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={200} direction="left">
              <div id="get-offer" className="scroll-mt-24">
                <LeadForm />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════ WHAT AS-IS MEANS ══════════ */}
      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                No Judgment
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                What &ldquo;As-Is&rdquo; Actually Means
              </h2>
              <div className="mt-5 space-y-3 text-base leading-relaxed text-ink-400">
                <p>
                  When we say we buy as-is, we mean it. You don&apos;t need to paint,
                  patch, replace the roof, fix the plumbing, or haul anything out.
                  The house can be outdated, damaged, cluttered, or just plain rough
                  — it doesn&apos;t change whether we can buy it.
                </p>
                <p>
                  We factor the condition into our offer. That means the price reflects
                  the work that needs to be done, but it also means you skip all the
                  cost, time, and hassle of doing that work yourself.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════ CONDITIONS WE BUY ══════════ */}
      <section className="section-wrap">
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              We&apos;ve Seen It All
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Houses We Regularly Buy
            </h2>
            <ul className="mt-5 space-y-2.5">
              {CONDITIONS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span className="text-sm text-ink-500">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-400">
              If your house has problems, there&apos;s a good chance we&apos;ve seen
              something similar. Call us and describe the situation — we&apos;ll tell
              you straight whether we can work with it.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="border-t border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Common Questions
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                Straight Answers About Selling As-Is
              </h2>
            </div>
          </FadeIn>

          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {FAQS.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 60}>
                <div className="rounded-xl border border-stone-200 bg-white p-5">
                  <h3 className="font-display text-base text-ink-600">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{faq.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="section-wrap">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl bg-ink-600 px-7 py-14 text-center sm:px-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-forest-500/10 blur-2xl" />
            <h2 className="font-display text-display text-white text-balance">
              Want to Know What We&apos;d Offer?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              Call us, describe the house, and we&apos;ll give you a straight answer.
              No repairs needed. No obligation.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#get-offer" className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100">
                Get My Cash Offer
              </a>
              <a
                href={`tel:${phoneClean}`}
                className="text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
              >
                <PhoneIcon />
                Call {SITE.phone}
              </a>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
