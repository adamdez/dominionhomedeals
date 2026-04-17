import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { SITE } from "@/lib/constants";
import { getByCounty } from "@/lib/neighborhoods";

export function Footer() {
  const year = new Date().getFullYear();
  const topNeighborhoods = getByCounty("Spokane County").slice(0, 8);
  const promises = [
    "No commissions or fees",
    "Buy in any condition",
    "Close on your timeline",
    "Local team - we meet in person",
    "No pressure, no obligation",
  ] as const;

  return (
    <footer className="border-t border-stone-200 bg-ink-600 pb-24 text-stone-300 sm:pb-20">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <Image src="/images/logo-mark.webp" alt="Dominion Homes logo" width={32} height={32} quality={80} />
              <span className="font-display text-lg text-stone-100">Dominion Homes</span>
            </div>
            <p className="text-sm leading-relaxed text-stone-400">
              Your local cash home buyers serving Spokane County, WA and Kootenai County, ID. Based in Spokane.
            </p>
            <p className="mt-3 text-sm font-semibold text-amber-400">{SITE.phone}</p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">Company</h3>
            <ul className="space-y-2">
              {[
                { label: "Get a Cash Offer", href: "/#get-offer" },
                { label: "How It Works", href: "/how-we-work" },
                { label: "Seller Guide", href: "/sell/guide" },
                { label: "Seller Stories", href: "/stories" },
                { label: "About Us", href: "/about" },
                { label: "Areas We Serve", href: "/neighborhoods" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms & Conditions", href: "/terms" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-stone-400 transition-colors hover:text-amber-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">Areas We Serve</h3>
            <ul className="space-y-2">
              {topNeighborhoods.map((neighborhood) => (
                <li key={neighborhood.slug}>
                  <Link
                    href={`/neighborhoods/${neighborhood.slug}`}
                    className="text-sm text-stone-400 transition-colors hover:text-amber-400"
                  >
                    {neighborhood.name}, {neighborhood.state}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">Our Promise</h3>
            <ul className="space-y-2 text-sm text-stone-400">
              {promises.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-forest-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-500/20 bg-ink-700/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5 lg:px-8">
          <p className="text-[15px] leading-snug text-stone-200 sm:text-base">
            <span className="font-semibold text-amber-400">Questions?</span> Use the chat button in the corner — we
            typically reply within minutes during business hours.
          </p>
          <p className="shrink-0 text-xs text-stone-500 sm:text-sm">No signup required.</p>
        </div>
      </div>

      <div className="border-t border-stone-500/20">
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-6 lg:px-8">
          <div className="space-y-2 text-[11px] leading-relaxed text-stone-500">
            <p>
              &copy; {year} {SITE.legalName}. All rights reserved.
              {" · "}
              <Link href="/privacy" className="underline transition-colors hover:text-stone-300">
                Privacy Policy
              </Link>
              {" · "}
              <Link href="/terms" className="underline transition-colors hover:text-stone-300">
                Terms &amp; Conditions
              </Link>
            </p>
            <p>
              Dominion Homes, LLC is a real estate investment company. We are principals - not licensed real estate
              agents or brokers. We buy properties directly. We are not affiliated with any government agency. This is
              not a solicitation for listings.
            </p>
            <p>
              Serving Spokane County, WA and Kootenai County, ID. Title services provided by{" "}
              <a
                href="https://wfgtitle.com/eastern-washington/"
                target="_blank"
                rel="noreferrer"
                className="underline transition-colors hover:text-stone-300"
              >
                WFG National Title Insurance Company, Eastern WA
              </a>{" "}
              and{" "}
              <a
                href="https://www.northidahotitle.com/"
                target="_blank"
                rel="noreferrer"
                className="underline transition-colors hover:text-stone-300"
              >
                North Idaho Title
              </a>
            </p>
          </div>
        </div>
      </div>

      <Script
        id="leadconnector-chat"
        src="https://widgets.leadconnectorhq.com/loader.js"
        strategy="lazyOnload"
        data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
        data-widget-id="69e18ffea4d201d81948ea87"
      />
    </footer>
  );
}
