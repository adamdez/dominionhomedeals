import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";

const NAV = [
  { label: "How It Works", href: "/how-we-work" },
  { label: "Buyers & Investors", href: "/buyers" },
  { label: "Seller Guide", href: "/sell/guide" },
  { label: "Seller Stories", href: "/stories" },
  { label: "Areas We Serve", href: "/neighborhoods" },
  { label: "About Us", href: "/about" },
] as const;

export function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-stone-200/70 bg-stone-50/95 py-3 backdrop-blur-md shadow-soft">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/images/logo-mark.webp"
            alt="Dominion Homes logo"
            width={36}
            height={36}
            className="transition-transform group-hover:scale-105"
            priority
            quality={82}
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base text-ink-600">Dominion Homes</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-forest-400">
              Spokane Direct Buyers
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-400 transition-colors hover:text-forest-600"
            >
              {link.label}
            </Link>
          ))}
          <a href={`tel:${SITE.phone.replace(/\D/g, "")}`} className="text-sm font-semibold text-ink-500">
            {SITE.phone}
          </a>
          <a href="/#get-offer" className="btn-primary text-sm !px-5 !py-2.5">
            Get My Cash Offer
          </a>
        </nav>

        <details className="group relative md:hidden">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg">
            <span className="sr-only">Open menu</span>
            <div className="flex flex-col gap-[5px]">
              <span className="h-[2px] w-5 bg-ink-500 transition-transform duration-200 group-open:translate-y-[7px] group-open:rotate-45" />
              <span className="h-[2px] w-5 bg-ink-500 transition-opacity duration-200 group-open:opacity-0" />
              <span className="h-[2px] w-5 bg-ink-500 transition-transform duration-200 group-open:-translate-y-[7px] group-open:-rotate-45" />
            </div>
          </summary>
          <nav className="absolute right-0 top-[calc(100%+0.75rem)] flex w-[min(20rem,calc(100vw-2.5rem))] flex-col gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-3 shadow-elevated">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2.5 text-[15px] font-medium text-ink-500 hover:bg-forest-50"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`tel:${SITE.phone.replace(/\D/g, "")}`}
              className="rounded-lg px-4 py-2.5 text-[15px] font-semibold text-ink-500"
            >
              {SITE.phone}
            </a>
            <a href="/#get-offer" className="btn-primary mt-2 text-center">
              Get My Cash Offer
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}
