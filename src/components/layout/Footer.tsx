// src/components/layout/Footer.tsx
import Link from "next/link";
import Image from "next/image";
import { SITE, NEIGHBORHOODS } from "@/lib/constants";

export function Footer() {
    const year = new Date().getFullYear();
    const topNeighborhoods = NEIGHBORHOODS.slice(0, 10);

  return (
        <footer className="border-t border-stone-200 bg-ink-600 text-stone-300">
              <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
                      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Brand */}
                                <div>
                                            <div className="flex items-center gap-2.5 mb-3">
                                                          <Image
                                                                            src="/images/logo1.png"
                                                                            alt="Dominion Homes logo"
                                                                            width={32}
                                                                            height={32}
                                                                          />
                                                          <span className="font-display text-lg text-stone-100">Dominion Homes</span>span>
                                            </div>div>
                                            <p className="text-sm leading-relaxed text-stone-400">
                                                          Your local cash home buyers serving Spokane County, WA and Kootenai
                                                          County, ID. Based in Post Falls.
                                            </p>p>
                                            <p className="mt-3 text-sm font-semibold text-amber-400">{SITE.phone}</p>p>
                                </div>div>
                      
                        {/* Links */}
                                <div>
                                            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">Company</h3>h3>
                                            <ul className="space-y-2">
                                              {[
          { label: "Get a Cash Offer", href: "#get-offer" },
          { label: "How It Works", href: "/how-we-work" },
          { label: "About Us", href: "/about" },
          { label: "Areas We Serve", href: "/neighborhoods" },
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms & Conditions", href: "/terms" },
                        ].map((link) => (
                                          <li key={link.href}>
                                                            <Link
                                                                                  href={link.href}
                                                                                  className="text-sm text-stone-400 hover:text-amber-400 transition-colors"
                                                                                >
                                                              {link.label}
                                                            </Link>Link>
                                          </li>li>
                                        ))}
                                            </ul>ul>
                                </div>div>
                      
                        {/* Areas */}
                                <div>
                                            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">Areas We Serve</h3>h3>
                                            <ul className="space-y-2">
                                              {topNeighborhoods.slice(0, 8).map((n) => (
                          <li key={n.slug}>
                                            <Link
                                                                  href={`/neighborhoods/${n.slug}`}
                                                                  className="text-sm text-stone-400 hover:text-amber-400 transition-colors"
                                                                >
                                              {n.name}, {n.state}
                                            </Link>Link>
                          </li>li>
                        ))}
                                            </ul>ul>
                                </div>div>
                      
                        {/* Promise */}
                                <div>
                                            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">Our Promise</h3>h3>
                                            <ul className="space-y-2 text-sm text-stone-400">
                                                          <li className="flex items-center gap-2">
                                                                          <span className="text-forest-400">✓</span>span> No commissions or fees
                                                          </li>li>
                                                          <li className="flex items-center gap-2">
                                                                          <span className="text-forest-400">✓</span>span> Buy in any condition
                                                          </li>li>
                                                          <li className="flex items-center gap-2">
                                                                          <span className="text-forest-400">✓</span>span> Close on your timeline
                                                          </li>li>
                                                          <li className="flex items-center gap-2">
                                                                          <span className="text-forest-400">✓</span>span> Local team — we meet in person
                                                          </li>li>
                                                          <li className="flex items-center gap-2">
                                                                          <span className="text-forest-400">✓</span>span> No pressure, no obligation
                                                          </li>li>
                                            </ul>ul>
                                </div>div>
                      </div>div>
              </div>div>
        
          {/* Bottom bar — legal disclosures */}
              <div className="border-t border-stone-500/20">
                      <div className="mx-auto max-w-6xl px-5 py-5 sm:px-6 lg:px-8">
                                <div className="space-y-2 text-[11px] leading-relaxed text-stone-500">
                                            <p>
                                                          © {year} {SITE.legalName}. All rights reserved.
                                              {" · "}
                                                          <Link href="/privacy" className="underline hover:text-stone-300 transition-colors">
                                                                          Privacy Policy
                                                          </Link>Link>
                                              {" · "}
                                                          <Link href="/terms" className="underline hover:text-stone-300 transition-colors">
                                                                          Terms &amp; Conditions
                                                          </Link>Link>
                                            </p>p>
                                            <p>
                                                          Dominion Homes, LLC is a real estate investment company. We are principals — not
                                                          licensed real estate agents or brokers. We buy properties directly. We are not
                                                          affiliated with any government agency. This is not a solicitation for listings.
                                            </p>p>
                                            <p>
                                                          Serving Spokane County, WA and Kootenai County, ID. Title services provided by WFG
                                                          National Title Insurance Company, Eastern WA. https://wfgtitle.com/eastern-washington/
                                                          &amp; North Idaho Title https://www.northidahotitle.com/
                                            </p>p>
                                </div>div>
                      </div>div>
              </div>div>
        </footer>footer>
      );
}</footer>
