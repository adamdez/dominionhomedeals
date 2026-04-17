import type { Metadata } from "next";
import { FadeIn } from "@/components/animations/FadeIn";
import { LeadForm } from "@/components/forms/LeadForm";
import { SellerProofSection } from "@/components/sell/SellerProofSection";
import { SellStickyBar } from "@/components/sell/SellStickyBar";
import { SellTrustStrip } from "@/components/sell/SellTrustStrip";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Behind on Payments or Facing Foreclosure in Spokane?",
  description:
    "If you're behind on your mortgage or facing foreclosure in Spokane or Kootenai County, a fast cash sale can stop the process. Local team, no judgment. Call 509-822-5460.",
  alternates: { canonical: `${SITE.url}/sell/foreclosure` },
  openGraph: {
    title: "Facing Foreclosure? You May Have More Options Than You Think",
    description:
      "A fast cash sale can stop foreclosure before it goes further. Local Spokane team, honest answers, no judgment.",
    url: `${SITE.url}/sell/foreclosure`,
    type: "website",
  },
};

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

const TIMELINE_STAGES = [
  {
    stage: "Behind on payments, no notice yet",
    detail:
      "You have the most options here. This is the best time to explore a sale if you do not see a way to catch up.",
  },
  {
    stage: "Received a Notice of Default",
    detail:
      "The clock is running, but you usually still have time to sell. The sooner you act, the more flexibility you have.",
  },
  {
    stage: "Auction date is set",
    detail:
      "It may still be possible to sell before the auction, but timing is tight. Call us immediately so we can evaluate whether a fast close is realistic.",
  },
];

const FAQS = [
  {
    q: "Can I sell my house if I'm behind on the mortgage?",
    a: "Yes. As long as you still own the property, you can sell it. The mortgage gets paid off from the sale proceeds at closing. If there is equity left over, it goes to you.",
  },
  {
    q: "What if I owe more than the house is worth?",
    a: "That is called being underwater. In some cases, a short sale may be an option where the lender agrees to accept less than what is owed. We can help you understand if that is a possibility and give you an honest assessment.",
  },
  {
    q: "Will selling stop the foreclosure?",
    a: "If the sale closes before the foreclosure is finalized, yes. The mortgage gets paid off and the process stops. That is why timing matters - the earlier you start, the more room there is to close cleanly.",
  },
  {
    q: "How fast can you close?",
    a: "When everything is clear and ready, we can close in as little as two weeks. If there is an auction deadline, we'll tell you honestly whether the timeline is realistic.",
  },
  {
    q: "Do I need to fix up the house?",
    a: "No. We buy as-is. No repairs, no cleaning, no preparation. We handle all of that.",
  },
  {
    q: "Will this hurt my credit?",
    a: "A regular sale is much better for your credit than a completed foreclosure. If you're already behind, your credit has likely been affected, but avoiding a foreclosure on your record still makes a real difference.",
  },
];

function FAQJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}

export default function ForeclosurePage() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      <FAQJsonLd />

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
                  Behind on payments
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-display text-hero text-ink-700 text-balance">
                  Behind on Payments in Spokane? Sell Before Foreclosure - Fast Cash
                </h1>
              </FadeIn>

              <FadeIn delay={120}>
                <SellTrustStrip />
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-400">
                  If you are behind on payments in Spokane and need a fast way to avoid
                  foreclosure, we can review the property quickly and tell you if a cash
                  sale can realistically beat the deadline. No judgment and no wasted time.
                </p>
              </FadeIn>

              <FadeIn delay={240}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#get-offer" className="btn-primary">
                    Get Your Cash Offer Now
                  </a>
                  <a href={`tel:${phoneClean}`} className="btn-secondary inline-flex items-center gap-2">
                    <PhoneIcon />
                    Call {SITE.phone}
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={320}>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
                  {[
                    "Can close in 2 weeks",
                    "Stop foreclosure",
                    "No judgment",
                    "No obligation",
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

      <SellerProofSection angle="foreclosure" />

      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                How It Works
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                How a Cash Sale Can Help
              </h2>
              <div className="mt-5 space-y-3 text-base leading-relaxed text-ink-400">
                <p>
                  When you sell your house for cash before the foreclosure completes, the
                  proceeds go toward paying off your mortgage. In many cases, that lets you
                  walk away clean with no foreclosure on your record and any remaining equity
                  coming back to you.
                </p>
                <p>
                  The key is timing. The earlier you reach out, the more options you have.
                  Even if you are not sure where things stand, a quick call can help you
                  understand what is realistic.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              Timeline
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Where Are You in the Process?
            </h2>
            <div className="mt-6 space-y-4">
              {TIMELINE_STAGES.map((item, index) => (
                <FadeIn key={item.stage} delay={index * 100}>
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <h3 className="font-display text-base text-ink-600">{item.stage}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.detail}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Before You Call
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                What to Have Ready
              </h2>
              <p className="mt-4 text-base text-ink-400">
                You do not need everything figured out. But if you have any of this, it helps:
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Property address",
                  "Rough idea of what you owe on the mortgage",
                  "Any notices you've received from the lender",
                  "Whether the house is occupied",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckIcon />
                    <span className="text-sm text-ink-500">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-400">
                If you do not have all of this, that&apos;s okay. We can work with what you know.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section>
        <div className="section-wrap">
          <FadeIn>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Common Questions
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                Straight Answers About Foreclosure
              </h2>
            </div>
          </FadeIn>

          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {FAQS.map((faq, index) => (
              <FadeIn key={faq.q} delay={index * 60}>
                <div className="rounded-xl border border-stone-200 bg-white p-5">
                  <h3 className="font-display text-base text-ink-600">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{faq.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl bg-ink-600 px-7 py-14 text-center sm:px-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-forest-500/10 blur-2xl" />
            <h2 className="font-display text-display text-white text-balance">
              Not Sure Where You Stand? Call Us.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              We&apos;ll listen to your situation, tell you what&apos;s realistic, and give
              you a straight answer. No pressure, no obligation, no judgment.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#get-offer" className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100">
                Get My Cash Offer
              </a>
              <a
                href={`tel:${phoneClean}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-300 transition-colors hover:text-amber-400"
              >
                <PhoneIcon />
                Call {SITE.phone}
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      <SellStickyBar />
    </>
  );
}
