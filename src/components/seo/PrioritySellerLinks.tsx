import Link from "next/link";

const PRIORITY_SELLER_LINKS = [
  {
    title: "Sell My House Fast Spokane",
    href: "/sell-my-house-fast-spokane",
    text: "For Spokane sellers dealing with repairs, tenants, taxes, or a tight timeline.",
  },
  {
    title: "Cash Home Buyers Spokane",
    href: "/cash-home-buyers-spokane",
    text: "What to ask before choosing a cash buyer.",
  },
  {
    title: "We Buy Houses Spokane",
    href: "/we-buy-houses-spokane",
    text: "For houses that need repairs, cleanup, or a simpler sale.",
  },
  {
    title: "Sell My House Fast Coeur d'Alene",
    href: "/sell-my-house-fast-coeur-d-alene",
    text: "For CDA, Post Falls, Hayden, and Kootenai County sellers.",
  },
  {
    title: "How Cash Offers Are Calculated",
    href: "/how-we-calculate-cash-offers-spokane-cda",
    text: "How we think about repairs, costs, timing, and price.",
  },
] as const;

type PrioritySellerLinksProps = {
  eyebrow?: string;
  title?: string;
  intro?: string;
  className?: string;
};

export function PrioritySellerLinks({
  eyebrow = "Useful Seller Guides",
  title = "Start with the page that fits your situation",
  intro = "Start here if you are comparing a cash offer with listing.",
  className = "border-y border-stone-200 bg-white",
}: PrioritySellerLinksProps) {
  return (
    <section className={className}>
      <div className="section-wrap">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">{eyebrow}</p>
            <h2 className="mt-2 font-display text-display text-ink-600 text-balance">{title}</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-400">{intro}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {PRIORITY_SELLER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex h-full flex-col rounded-xl border border-stone-200 bg-stone-50 p-5 transition hover:border-amber-300 hover:bg-amber-50"
              >
                <h3 className="font-display text-lg leading-tight text-ink-600 group-hover:text-ink-700">
                  {link.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-400">{link.text}</p>
                <span className="mt-4 text-sm font-semibold text-forest-600 group-hover:text-forest-700">
                  Read guide -&gt;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
