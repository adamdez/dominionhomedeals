import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell Your House Fast for Cash in Spokane | Dominion Home Deals",
  description:
    "Get a fair cash offer on your Spokane or Kootenai County house. Close in as little as 7 days. No fees, no repairs, no agents. Local Post Falls team.",
};

/**
 * /sell — Primary PPC landing page for "Fast Cash Sale - Spokane" ad group.
 * Matches intent: seller wants speed + cash + certainty.
 */

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-800 pb-5">
      <p className="font-medium text-zinc-100">{q}</p>
      <div className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{a}</div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-400/10 text-yellow-400 font-bold flex items-center justify-center text-sm">
        {n}
      </div>
      <div>
        <p className="font-medium text-zinc-100">{title}</p>
        <p className="text-zinc-400 text-sm mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function SellFastCashPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-14 space-y-14">

      {/* ── Hero ── */}
      <section className="space-y-4">
        <p className="text-sm font-medium text-yellow-400 tracking-wide uppercase">Fast Cash Sale</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Get a fair cash offer on your<br className="hidden sm:block" />
          Spokane area house — close in days.
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
          We&rsquo;re a local team based in Post Falls. We buy houses as-is for cash,
          pay all closing costs, and can close in as little as 7 days.
          No agents, no fees, no repairs. Just a straightforward sale.
        </p>
        <a
          href="tel:+15098001234"
          className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Call us: (509) 800-1234
        </a>
      </section>

      {/* ── How it works ── */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-white">How it works</h2>
        <div className="space-y-5">
          <Step n="1" title="Call us or fill out the form" desc="Tell us about the property. Takes about 5 minutes." />
          <Step n="2" title="We make you a cash offer" desc="Usually within 24–48 hours. No obligation." />
          <Step n="3" title="You pick the closing date" desc="As fast as 7 days, or whenever works for you." />
          <Step n="4" title="Get paid at closing" desc="Standard title company. We pay all closing costs." />
        </div>
      </section>

      {/* ── What makes us different ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Why sellers choose us</h2>
        <ul className="space-y-2 text-zinc-400 text-sm">
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Local principals — we&rsquo;re in Post Falls, not a call center</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> We pay ALL closing costs — zero fees to you</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Buy as-is — no repairs, no cleaning, no staging</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Close on your timeline — 7 days or 60 days</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> No agents, no commissions</li>
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-white">Common questions</h2>
        <div className="space-y-5">
          <Faq q="How do you determine your offer?" a={<p>We look at comparable sales, the condition of the property, and current market data. Our offers are fair and based on real numbers — we&rsquo;ll walk you through how we got there.</p>} />
          <Faq q="Do I need to make repairs first?" a={<p>No. We buy houses in any condition. Outdated, damaged, cluttered — doesn&rsquo;t matter. We handle everything after closing.</p>} />
          <Faq q="How fast can you actually close?" a={<p>If the title is clear and straightforward, we can close in as little as 7 days. Most sales close in 2–3 weeks. You pick the date.</p>} />
          <Faq q="Are there any fees or commissions?" a={<p>None. We pay all closing costs. The offer we give you is the amount you walk away with.</p>} />
          <Faq q="Is there any obligation if I call?" a={<p>No. Most first calls are just a conversation. We answer your questions, learn about the property, and let you know if we can help. Zero pressure.</p>} />
        </div>
      </section>

      {/* ── Where we buy ── */}
      <section className="rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-5 space-y-2">
        <p className="font-medium text-zinc-200 text-sm">Where we buy</p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Spokane County, WA and Kootenai County, ID — including Spokane, Spokane Valley,
          Coeur d&rsquo;Alene, Post Falls, and surrounding areas. We&rsquo;re local.
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="rounded-2xl bg-yellow-400/5 border border-yellow-400/20 px-6 py-8 space-y-3">
        <p className="font-semibold text-white text-lg">Ready to see what we&rsquo;d offer?</p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Call us. We&rsquo;ll ask a few questions about the property and give you
          a straight answer — usually within 24 hours. No obligation.
        </p>
        <a
          href="tel:+15098001234"
          className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-6 py-3 rounded-xl transition-colors"
        >
          (509) 800-1234
        </a>
      </section>

    </div>
  );
}
