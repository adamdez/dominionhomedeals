import type { Metadata } from "next";
import { FadeIn } from "@/components/animations/FadeIn";
import { LeadForm } from "@/components/forms/LeadForm";
import { SellerProofSection } from "@/components/sell/SellerProofSection";
import { SellStickyBar } from "@/components/sell/SellStickyBar";
import { SellTrustStrip } from "@/components/sell/SellTrustStrip";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Selling an Inherited or Estate Property in Spokane",
  description:
    "We work with inherited and estate properties regularly in Spokane and Kootenai County. We understand the process takes time. No pressure, no hurry. Call 509-822-5460.",
  alternates: { canonical: `${SITE.url}/sell/inherited` },
  openGraph: {
    title: "Selling an Inherited Property - Spokane & CDA",
    description:
      "Local team experienced with inherited properties, probate, and estate situations. No rush, no pressure.",
    url: `${SITE.url}/sell/inherited`,
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

const FAQS = [
  {
    q: "Can you buy a house that's still in probate?",
    a: "It depends on where you are in the probate process. In many cases, yes - we can work with the estate executor or administrator and coordinate around the probate timeline. The best way to find out is to call us and walk through the situation.",
  },
  {
    q: "What if multiple family members inherited the property?",
    a: "This is common. In general, all owners who are on title need to agree to a sale. We don't step into family disagreements - but we can clearly explain the offer and the process so everyone has the same information to work with.",
  },
  {
    q: "The house needs a lot of work. Does that matter?",
    a: "We buy as-is. You don't need to fix anything, clean it out, or do repairs before we close. We factor the condition into our offer. It may affect what we can pay, but it doesn't stop us from being able to buy.",
  },
  {
    q: "We haven't decided yet. Can we just ask questions?",
    a: "Yes - that's actually the most common first call we get. Call us, tell us what you're dealing with, and we'll answer honestly. There's no obligation, no pitch, no timeline we're trying to push you into.",
  },
  {
    q: "What about personal belongings left in the house?",
    a: "You take whatever you want. Anything left behind we handle - you don't need to empty the house before closing if that's not practical.",
  },
  {
    q: "How long does a cash sale take with an inherited property?",
    a: "It varies depending on where you are in probate and how quickly decisions can be made. When everything is clear and ready, we can close in a few weeks. If there are delays on your side, we can wait.",
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

export default function InheritedPropertyPage() {
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
                  Inherited and probate property help
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-display text-hero text-ink-700 text-balance">
                  Sell an Inherited House in Spokane - Cash Offer in 24 Hours
                </h1>
              </FadeIn>

              <FadeIn delay={120}>
                <SellTrustStrip />
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-400">
                  If you inherited a Spokane house and do not want to juggle repairs,
                  probate stress, or a long listing timeline, we can make a cash offer
                  quickly and work around the pace that makes sense for your family.
                </p>
              </FadeIn>

              <FadeIn delay={240}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#get-offer" className="btn-primary">
                    Talk Through Your Options
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
                    "Probate situations OK",
                    "Buy as-is, any condition",
                    "You pick the timeline",
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

      <SellerProofSection angle="inherited" />

      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Estate Situations
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                What Makes Inherited Properties Different
              </h2>
              <div className="mt-5 space-y-3 text-base leading-relaxed text-ink-400">
                <p>
                  When a property passes to a family member, there&apos;s often more going on than
                  just selling a house. There may be estate paperwork, probate timelines,
                  decisions that involve other family members, or simply the emotional weight
                  of dealing with someone&apos;s home.
                </p>
                <p>
                  We don&apos;t rush this process. If you&apos;re just starting to explore your
                  options, that&apos;s a perfectly fine place to start a conversation. We can
                  explain what a cash sale looks like and let you decide if it makes sense -
                  on your timeline.
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
              First Conversation
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              What We&apos;ll Ask on the First Call
            </h2>
            <p className="mt-4 text-base text-ink-400">
              We keep it short. We&apos;ll typically ask:
            </p>
            <ul className="mt-4 space-y-2.5">
              {[
                "What's the address of the property?",
                "Is it currently occupied?",
                "Where are things in the estate or probate process?",
                "What are you hoping to accomplish and on what kind of timeline?",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span className="text-sm text-ink-500">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-400">
              That&apos;s it to start. We&apos;ll take it from there and let you know if it&apos;s
              something we can work with.
            </p>
          </div>
        </FadeIn>
      </section>

      <section className="border-t border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Common Questions
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                Straight Answers About Inherited Properties
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
              Ready to Talk Through Your Situation?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              Call us. We&apos;ll listen, answer your questions honestly, and tell you what
              we can offer. There&apos;s no pressure and no rush.
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
