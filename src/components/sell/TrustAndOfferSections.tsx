import Link from "next/link";
import { SITE } from "@/lib/constants";
import { SELLER_PROOF } from "@/lib/sell-proof";

const offerFactors = [
  {
    title: "After-repair value",
    body: "We look at nearby sales and what the house could be worth after repairs.",
  },
  {
    title: "Repair and cleanup scope",
    body: "Roof, systems, flooring, cleanup, tenants, and old repairs all affect the offer.",
  },
  {
    title: "Holding and resale costs",
    body: "Taxes, utilities, insurance, closing costs, and resale risk are part of the math.",
  },
  {
    title: "Your timeline",
    body: "A fast as-is sale can mean fewer delays, no showings, and a clearer closing date.",
  },
] as const;

const verifyItems = [
  "Ask who is actually buying the property.",
  "Use a real title or escrow company.",
  "Ask for written terms, deadlines, and any cancellation rights.",
  "Do not pay upfront fees or sign under pressure.",
] as const;

export function SellerProofBand() {
  const testimonial = SELLER_PROOF.verifiedTestimonials[0];

  return (
    <section className="border-y border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Verified Local Profile</p>
          <h2 className="mt-2 font-display text-xl text-ink-600">Google Business Profile</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            The phone and business information should match what you see here.
          </p>
          <a
            href={SITE.profiles.googleBusiness}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-forest-600 underline-offset-4 hover:underline"
          >
            View Google profile
          </a>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Owner-Led</p>
          <h2 className="mt-2 font-display text-xl text-ink-600">{SELLER_PROOF.founder.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            You work with a local buyer serving Spokane County and Kootenai County.
          </p>
          <Link href="/about" className="mt-4 inline-flex text-sm font-semibold text-forest-600 underline-offset-4 hover:underline">
            Meet the team
          </Link>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Title Closing</p>
          <h2 className="mt-2 font-display text-xl text-ink-600">Clear paperwork</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            Closings run through title so documents, payoffs, and funds are handled clearly.
          </p>
          <Link href="/how-we-work" className="mt-4 inline-flex text-sm font-semibold text-forest-600 underline-offset-4 hover:underline">
            See the process
          </Link>
        </div>

        <div className="rounded-xl border border-stone-200 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Seller Feedback</p>
          <blockquote className="mt-2 text-sm leading-relaxed text-ink-500">
            "{testimonial.quote}"
          </blockquote>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-ink-300">
            {testimonial.name} - {testimonial.neighborhood}
          </p>
        </div>
      </div>
    </section>
  );
}

export function CashOfferMathSection() {
  return (
    <section className="border-y border-stone-200 bg-stone-100/50">
      <div className="section-wrap">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Offer Math</p>
          <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
            How We Calculate Cash Offers In Spokane &amp; CDA
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-400">
            A cash offer is based on the house, repairs, costs, timing, and how quickly you want to close.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {offerFactors.map((item) => (
            <article key={item.title} className="rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="font-display text-lg text-ink-600">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/how-we-calculate-cash-offers-spokane-cda" className="btn-secondary !py-3 text-sm">
            Read the full offer guide
          </Link>
        </div>
      </div>
    </section>
  );
}

export function VerifyCashBuyerSection() {
  return (
    <section className="section-wrap">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Protect Yourself</p>
          <h2 className="mt-2 font-display text-display text-ink-600 text-balance">
            How To Verify Any Cash Buyer
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-400">
            You should be able to slow down, check the details, and compare options. A legitimate buyer will not make
            that hard.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {verifyItems.map((item) => (
            <div key={item} className="rounded-xl border border-stone-200 bg-white p-5">
              <p className="text-sm leading-relaxed text-ink-500">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
