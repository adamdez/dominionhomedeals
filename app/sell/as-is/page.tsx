import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell Your House As-Is in Spokane — No Repairs Needed | Dominion Home Deals",
  description:
    "We buy houses in any condition in Spokane and Kootenai County. No repairs, no cleaning, no inspections. Fair cash offer, close on your timeline.",
};

/**
 * /sell/as-is — PPC landing page for "Sell As-Is / Ugly House" ad group.
 * Matches intent: seller knows house needs work, doesn't want to deal with it.
 * Tone: practical, no-judgment, honest about how condition affects price.
 */

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-800 pb-5">
      <p className="font-medium text-zinc-100">{q}</p>
      <div className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{a}</div>
    </div>
  );
}

export default function SellAsIsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-14 space-y-14">

      {/* ── Hero ── */}
      <section className="space-y-4">
        <p className="text-sm font-medium text-yellow-400 tracking-wide uppercase">Sell As-Is</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Your house needs work?<br className="hidden sm:block" />
          That&rsquo;s fine. We buy as-is.
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
          No repairs, no cleaning, no staging, no open houses.
          We buy houses in any condition in Spokane and Kootenai County.
          You don&rsquo;t need to fix a thing — we handle all of that after closing.
        </p>
        <a
          href="tel:+15098001234"
          className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Call us: (509) 800-1234
        </a>
      </section>

      {/* ── What "as-is" actually means ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">What &ldquo;as-is&rdquo; actually means</h2>
        <div className="space-y-3">
          <p className="text-zinc-400 leading-relaxed">
            When we say we buy as-is, we mean it. You don&rsquo;t need to paint, patch,
            replace the roof, fix the plumbing, or haul anything out. The house can be
            outdated, damaged, cluttered, or just plain rough — it doesn&rsquo;t change whether
            we can buy it.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            We factor the condition into our offer. That means the price reflects the work
            that needs to be done, but it also means you skip all the cost, time, and
            hassle of doing that work yourself. For most sellers in this situation,
            that&rsquo;s the whole point.
          </p>
        </div>
      </section>

      {/* ── What we commonly see ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Houses we regularly buy</h2>
        <ul className="space-y-2 text-zinc-400 text-sm">
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Outdated kitchens, bathrooms, flooring</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Roof damage or aging systems (HVAC, plumbing, electrical)</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Foundation issues or structural concerns</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Fire, smoke, or water damage</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Hoarding situations or heavy cleanout needed</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Code violations or unpermitted work</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">✓</span> Homes that have been sitting vacant</li>
        </ul>
        <p className="text-zinc-400 leading-relaxed text-sm">
          If your house has problems, there&rsquo;s a good chance we&rsquo;ve seen something similar.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-white">Common questions</h2>
        <div className="space-y-5">
          <Faq q="Do I need to get an inspection before selling?" a={<p>No. We do our own evaluation. You don&rsquo;t need to hire an inspector, get repair estimates, or do any pre-sale work.</p>} />
          <Faq q="Will the condition affect the offer?" a={<p>Yes — we&rsquo;re straightforward about that. A house that needs a new roof and a full rehab will get a different offer than one that just needs cosmetic updates. But the condition doesn&rsquo;t stop us from buying. We account for the work in our numbers and give you a fair offer based on reality.</p>} />
          <Faq q="What if there's stuff left in the house?" a={<p>Take what you want and leave the rest. We handle cleanout after closing. You don&rsquo;t need to rent a dumpster or spend weekends hauling things out.</p>} />
          <Faq q="Can you buy a house with code violations?" a={<p>In most cases, yes. We deal with code issues regularly. Let us know what you&rsquo;re dealing with and we&rsquo;ll tell you if it&rsquo;s something we can work through.</p>} />
          <Faq q="How fast can you close?" a={<p>If everything is straightforward, we can typically close in two to three weeks. If you need more time, that&rsquo;s fine too — we work on your schedule.</p>} />
          <Faq q="Why would I sell as-is instead of fixing it up?" a={<p>That depends on your situation. Fixing up a house costs money, takes time, and comes with risk. Some sellers would rather skip all of that and get a clean, certain close. We can give you a cash offer so you have a real number to compare against.</p>} />
          <Faq q="Is there any obligation if I call?" a={<p>None. Most first calls are just a conversation. You tell us about the house, we ask a few questions, and we let you know if it&rsquo;s something we can work with. No pressure.</p>} />
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
        <p className="font-semibold text-white text-lg">Want to know what we&rsquo;d offer?</p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Call us, describe the house, and we&rsquo;ll give you a straight answer.
          No repairs needed. No obligation.
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
