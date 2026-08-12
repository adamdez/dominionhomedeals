import type { Metadata } from "next";
import { FadeIn } from "@/components/animations/FadeIn";
import { PropertyManagementForm } from "@/components/forms/PropertyManagementForm";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Property Management for Spokane-Area Landlords",
  description:
    "Small-portfolio property management for landlords in Spokane County and Kootenai County. Direct access to a local owner-operator, not a call center.",
  // Intentionally excluded from search indexes and the sitemap. This is a
  // limited-capacity service handled by referral and direct link only.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
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

const WHAT_WE_HANDLE = [
  {
    title: "Tenant placement",
    detail:
      "Listing and showings, application screening, income and background checks, lease signing, and move-in walkthrough with photos.",
  },
  {
    title: "Rent collection",
    detail:
      "Online payments, late-notice follow-up, and a clear monthly statement so you always know where the property stands.",
  },
  {
    title: "Maintenance coordination",
    detail:
      "We take the calls and dispatch our own trades. You set a spend threshold, and anything above it comes to you first.",
  },
  {
    title: "Inspections and turnover",
    detail:
      "Periodic condition checks with photos, plus make-ready coordination between tenants so vacancy stays short.",
  },
  {
    title: "Notices and compliance",
    detail:
      "Lease renewals, rent-increase notices, and standard landlord-tenant paperwork handled on the required timelines.",
  },
  {
    title: "Owner reporting",
    detail:
      "Monthly income and expense statements, plus year-end documents your accountant can work from directly.",
  },
];

const GOOD_FIT = [
  "One to ten doors in Spokane County or Kootenai County",
  "Single-family houses, duplexes, and small multifamily",
  "Out-of-area owners who need boots on the ground",
  "Accidental landlords who inherited or relocated out of a house",
  "Owners leaving a large management company and tired of being a ticket number",
];

const NOT_A_FIT = [
  "Large apartment complexes and institutional portfolios",
  "Properties outside the Spokane and Coeur d'Alene area",
  "Owners looking strictly for the lowest fee rather than direct communication",
];

const STEPS = [
  {
    step: "1",
    title: "Tell us about the property",
    detail:
      "Address, current rent, tenant status, and what is or is not working right now. A short call is usually enough.",
  },
  {
    step: "2",
    title: "We walk it and give you a plan",
    detail:
      "We look at the property in person, give you an honest read on market rent and condition, and quote our fee up front.",
  },
  {
    step: "3",
    title: "We take over the day-to-day",
    detail:
      "Onboarding, tenant communication, and maintenance move to us. You get monthly statements and a direct line when you want one.",
  },
];

const FAQS = [
  {
    q: "What does it cost?",
    a: "We quote it on the call once we know the property, the door count, and what shape the current tenancy is in. There is no charge for the walkthrough or the quote.",
  },
  {
    q: "How many properties do you take on?",
    a: "A limited number. This is a small, hands-on service rather than a volume operation, so we take on properties we can actually stay on top of.",
  },
  {
    q: "Do I have to sell to you to use this?",
    a: "No. Management and buying are separate. If you ever do want an offer on the property we can talk about it, but there is no obligation and no pressure either direction.",
  },
  {
    q: "Who actually answers when there is a problem?",
    a: "Our local team, in the Spokane area. You are not routed through a national call center, and you are not passed between account managers.",
  },
  {
    q: "Can you take over a property that already has tenants?",
    a: "Yes. We review the existing lease, handle the notice to the tenants that management has changed, and pick up rent collection and maintenance from there.",
  },
  {
    q: "What if I already have a management company?",
    a: "Most agreements have a notice and termination window. Send us what you signed and we will tell you what the transition would look like before you commit to anything.",
  },
];

export default function PropertyManagementPage() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
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
                  Property management
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-display text-hero text-ink-700 text-balance">
                  Property Management for Spokane-Area Landlords
                </h1>
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-400">
                  We manage a small number of rentals across Spokane County and
                  Kootenai County. Same local team that buys houses here, same
                  direct line, no call center in between. If you want your
                  rental to stop being a second job, this is what that looks
                  like.
                </p>
              </FadeIn>

              <FadeIn delay={240}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#inquire" className="btn-primary">
                    Ask About Management
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
                    "Local owner-operator",
                    "Small portfolios welcome",
                    "Fee quoted up front",
                    "No long lock-in pitch",
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
              <div id="inquire" className="scroll-mt-24">
                <PropertyManagementForm />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="section-wrap">
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                What We Handle
              </p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
                The Parts You Do Not Want to Deal With
              </h2>
            </div>
          </FadeIn>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            {WHAT_WE_HANDLE.map((item, index) => (
              <FadeIn key={item.title} delay={index * 60}>
                <div className="h-full rounded-xl border border-stone-200 bg-white p-5">
                  <h3 className="font-display text-base text-ink-600">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-2">
            <FadeIn>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
                  Good Fit
                </p>
                <h2 className="mt-2 font-display text-xl text-ink-600">
                  Who We Work Well With
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {GOOD_FIT.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-ink-500">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-300">
                  Not a Fit
                </p>
                <h2 className="mt-2 font-display text-xl text-ink-600">
                  When to Call Someone Else
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {NOT_A_FIT.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-stone-300" />
                      <span className="text-sm text-ink-400">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-ink-400">
                  We would rather tell you that up front than take on a property
                  we cannot service well.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
              Getting Started
            </p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
              Three Steps, No Paperwork to Start
            </h2>
            <div className="mt-6 space-y-4">
              {STEPS.map((item, index) => (
                <FadeIn key={item.step} delay={index * 100}>
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-500 font-display text-sm text-white">
                        {item.step}
                      </span>
                      <h3 className="font-display text-base text-ink-600">{item.title}</h3>
                    </div>
                    <p className="pl-11 text-sm leading-relaxed text-ink-400">{item.detail}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
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
                Straight Answers for Owners
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
              Let&apos;s Talk About Your Rental
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-stone-400">
              Tell us where the property is and what is going on with it. We will
              give you an honest read on whether we are the right fit and what it
              would cost. No obligation.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#inquire" className="btn-primary">
                Ask About Management
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
    </>
  );
}
