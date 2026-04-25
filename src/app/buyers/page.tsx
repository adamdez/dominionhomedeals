import type { Metadata } from "next";
import { FadeIn } from "@/components/animations/FadeIn";
import { BuyersStickyBar } from "@/components/buyers/BuyersStickyBar";
import { BuyerInvestorLeadForm } from "@/components/buyers/BuyerInvestorLeadForm";
import { SITE } from "@/lib/constants";

const buyerBenefits = [
  "Assignable contracts and off-market opportunities",
  "Value-add properties and fast-moving local deals",
  "A place to share your buy box, areas, and property types",
  "No obligation when a deal is not the right fit",
];

const investorInterests = [
  "Debt / private lending",
  "Equity / JV conversations",
  "Long-term rental opportunities",
  "Fix-and-flip projects",
  "Open to hearing what may fit",
];

const faqs = [
  {
    q: "What kinds of deals do you send?",
    a: "It depends on what is available and what fits your criteria. Buyers may hear about assignable contracts, off-market properties, value-add homes, rentals, or small multifamily opportunities.",
  },
  {
    q: "Do I have to commit to anything?",
    a: "No. Joining the list simply tells us what you are looking for so we know when to reach out. You can pass on anything that is not a fit.",
  },
  {
    q: "Do you work with passive investors?",
    a: "Yes, when there may be a practical fit. This page is only an interest and qualification form. It does not guarantee access, placement, returns, or any specific opportunity.",
  },
  {
    q: "What markets do you focus on?",
    a: "We are based in Spokane and primarily watch Spokane County, Spokane Valley, the Spokane-CDA corridor, and nearby North Idaho markets.",
  },
  {
    q: "How fast will I hear from you?",
    a: "If your profile looks relevant to current deal flow, someone from Dominion Homes may reach out directly. You can also call or text us anytime.",
  },
];

export const metadata: Metadata = {
  title: "Spokane Buyer & Investor List | Off-Market Deals | Dominion Homes",
  description:
    "Join Dominion Homes' buyer and investor list for potential off-market real estate deals, assignable opportunities, and real estate conversations in Spokane and North Idaho.",
  alternates: { canonical: `${SITE.url}/buyers` },
  keywords: [
    "cash buyers Spokane",
    "off-market real estate deals Spokane",
    "real estate investors Spokane",
    "invest in Spokane real estate",
    "Spokane investment properties",
  ],
};

function CheckIcon() {
  return (
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
  );
}

export default function BuyersPage() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      <section className="relative overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-forest-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full bg-amber-100/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.92fr] lg:gap-14">
            <FadeIn>
              <div className="pt-2">
                <div className="trust-badge mb-5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest-500" />
                  </span>
                  Spokane-Based Operator - Buyer & Investor List
                </div>

                <h1 className="font-display text-hero text-ink-700 text-balance">
                  Want First Look at Off-Market Deals?
                  <br />
                  <span className="text-forest-500">Want Your Money Working in Real Estate?</span>
                </h1>

                <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-400">
                  Join Dominion Homes' local buyer and investor list. Tell us what you buy, where you
                  invest, or what kind of real estate opportunities you may want to hear about.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#join-list" className="btn-primary">
                    Join the Buyer & Investor List
                  </a>
                  <a href={`tel:${phoneClean}`} className="btn-secondary">
                    Call or Text {SITE.phone}
                  </a>
                </div>

                <div className="mt-7 grid gap-3 text-sm text-ink-400 sm:grid-cols-3">
                  {["Local deal flow", "No obligation", "Practical follow-up"].map((item) => (
                    <div key={item} className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                      <span className="font-semibold text-ink-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={120} direction="left">
              <BuyerInvestorLeadForm />
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "I buy properties",
                eyebrow: "Active buyers",
                text: "For cash buyers, landlords, flippers, and operators who want to hear about assignable contracts, off-market properties, and value-add deals.",
              },
              {
                title: "I invest capital",
                eyebrow: "Passive investors",
                text: "For people who may want to discuss capital placement across debt, equity, rental, or project-based real estate opportunities when there is a fit.",
              },
            ].map((item) => (
              <FadeIn key={item.title}>
                <div className="h-full rounded-2xl border border-stone-200 bg-stone-50 p-6 card-lift">
                  <p className="text-xs font-bold uppercase tracking-widest text-forest-500">{item.eyebrow}</p>
                  <h2 className="mt-2 font-display text-2xl text-ink-700">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <FadeIn>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                For Active Buyers
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                Tell us your buy box before the next deal moves.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-400">
                When we have a property that may be assignable, off-market, or a practical fit for
                local buyers, we want to know who should hear about it first.
              </p>
              <ul className="mt-6 space-y-3">
                {buyerBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckIcon />
                    <span className="text-sm text-ink-500">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={120} direction="left">
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                Common Buy Boxes
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["Spokane SFRs", "Small multifamily", "Value-add rentals", "Fix-and-flip projects", "North Idaho", "Assignable deals"].map((item) => (
                  <div key={item} className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-ink-500">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <FadeIn>
              <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                  Capital Ranges
                </p>
                <div className="mt-5 grid gap-3">
                  {["Under $100,000", "$100,000-$300,000", "$300,000+"].map((item) => (
                    <div key={item} className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                      <span className="font-display text-xl text-ink-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={120} direction="left">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                  For Passive Investors
                </p>
                <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                  Share what kind of real estate conversations may fit.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-400">
                  Some people are active operators. Others want to understand whether a real estate
                  opportunity could fit their goals. The list helps us route conversations carefully.
                </p>
                <ul className="mt-6 space-y-3">
                  {investorInterests.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-ink-500">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-ink-400">
                  This is an interest form only. Dominion Homes does not promise returns, guaranteed
                  access, or investment placement through this page.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              How It Works
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Simple enough for a QR code.
            </h2>
          </div>
        </FadeIn>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              number: "1",
              title: "Share your criteria",
              text: "Tell us whether you buy properties, invest capital, or both, plus your markets and basic preferences.",
            },
            {
              number: "2",
              title: "We sort the fit",
              text: "Your profile helps us understand who should hear about a buyer deal, rental opportunity, lending conversation, or project.",
            },
            {
              number: "3",
              title: "We reach out when relevant",
              text: "If something may match, a local Dominion Homes team member can contact you directly with the next step.",
            },
          ].map((step, index) => (
            <FadeIn key={step.number} delay={index * 100}>
              <div className="h-full rounded-2xl border border-stone-200 bg-white p-6 card-lift">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-500 font-display text-lg text-white shadow-sm">
                  {step.number}
                </span>
                <h3 className="mt-4 font-display text-lg text-ink-600">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{step.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="section-wrap">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <FadeIn>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                  Local Operator, Local Opportunities
                </p>
                <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                  We are not a national call center.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-400">
                  Dominion Homes is based in Spokane. We care about practical fit, clear communication,
                  and long-term local relationships with buyers, lenders, and investors.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={120} direction="left">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Local Spokane team",
                  "Straightforward follow-up",
                  "Buyer criteria saved separately",
                  "No seller-lead confusion",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                    <h3 className="text-sm font-semibold text-ink-600">{item}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-400">
                      Built for people who want to hear about relevant real estate opportunities without noise.
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              FAQ
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600">
              Questions before you join?
            </h2>
          </div>
        </FadeIn>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((item, index) => (
            <FadeIn key={item.q} delay={index * 60}>
              <details className="group rounded-2xl border border-stone-200 bg-white p-5">
                <summary className="cursor-pointer list-none font-semibold text-ink-600">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{item.a}</p>
              </details>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="section-wrap pt-0">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl bg-ink-600 px-7 py-12 text-center sm:px-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-forest-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
            <h2 className="font-display text-display text-white text-balance">
              Ready to get on the list?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              Share your criteria once. We will use it to understand what buyer or investor
              conversations may be relevant.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#join-list" className="btn-primary !bg-white !text-ink-600 hover:!bg-stone-100">
                Join the List
              </a>
              <a
                href={`sms:${phoneClean}`}
                className="text-sm font-semibold text-stone-300 transition-colors hover:text-amber-400"
              >
                Or text us: {SITE.phone}
              </a>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-xs leading-relaxed text-stone-400">
              This page is for people who want to be contacted about potential real estate opportunities.
              Submission does not guarantee deal access or investment placement. Opportunities are subject
              to fit, availability, and applicable laws.
            </p>
          </div>
        </FadeIn>
      </section>

      <BuyersStickyBar />
    </>
  );
}
