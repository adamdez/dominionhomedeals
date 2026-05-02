import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { LeadForm } from "@/components/forms/LeadForm";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import type { SellerSeoPage } from "@/lib/seller-seo-pages";
import { SELLER_SEO_LAST_UPDATED } from "@/lib/seller-seo-pages";
import { getSellerSeoUrl } from "@/lib/seller-seo-pages";
import { SITE } from "@/lib/constants";

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

function StructuredData({ page }: { page: SellerSeoPage }) {
  const pageUrl = getSellerSeoUrl(page.slug);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: page.title,
    description: page.description,
    provider: { "@id": `${SITE.url}/#business` },
    areaServed: [
      { "@type": "City", name: "Spokane" },
      { "@type": "AdministrativeArea", name: "Spokane County, WA" },
      { "@type": "AdministrativeArea", name: "Kootenai County, ID" },
    ],
    serviceType: "Direct cash home buying",
    url: pageUrl,
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: page.metaTitle,
    description: page.description,
    dateModified: SELLER_SEO_LAST_UPDATED,
    about: { "@id": `${pageUrl}#service` },
    publisher: { "@id": `${SITE.url}/#business` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
    </>
  );
}

export function SellerSeoLandingPage({ page }: { page: SellerSeoPage }) {
  const phoneClean = SITE.phone.replace(/\D/g, "");
  const pageUrl = getSellerSeoUrl(page.slug);

  return (
    <>
      <StructuredData page={page} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: page.title, url: pageUrl },
        ]}
      />

      <section className="relative overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-50 via-forest-50/20 to-stone-50" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="pt-2">
              <FadeIn>
                <div className="trust-badge mb-5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest-500" />
                  </span>
                  {page.eyebrow}
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-display text-hero text-ink-700 text-balance">{page.h1}</h1>
              </FadeIn>

              <FadeIn delay={140}>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-400">{page.intro}</p>
              </FadeIn>

              <FadeIn delay={170}>
                <p className="mt-4 text-sm font-medium text-ink-300">
                  Last updated {new Date(`${SELLER_SEO_LAST_UPDATED}T12:00:00`).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" "}for Spokane-area sellers.
                </p>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#get-offer" className="btn-primary">
                    {page.ctaLabel}
                  </a>
                  <a href={`tel:${phoneClean}`} className="btn-secondary">
                    Call or Text {SITE.phone}
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={260}>
                <div className="mt-7 grid gap-2 text-sm text-ink-400 sm:grid-cols-2">
                  {page.bullets.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckIcon />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={180} direction="left">
              <div id="get-offer" className="scroll-mt-24">
                <p className="mb-3 text-center text-sm font-medium text-forest-600">
                  Takes about 60 seconds - no obligation
                </p>
                <LeadForm />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="section-wrap">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.8fr]">
            <FadeIn>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Direct Answer</p>
                <h2 className="mt-2 font-display text-display text-ink-600 text-balance">The short version</h2>
                <p className="mt-4 text-lg leading-relaxed text-ink-400">{page.directAnswer}</p>
              </div>
            </FadeIn>

            <FadeIn delay={120} direction="left">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <h3 className="text-sm font-semibold text-ink-600">Why sellers call us</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{page.proofAngle}</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 md:grid-cols-3">
            {page.sections.map((section, index) => (
              <FadeIn key={section.title} delay={index * 90}>
                <article className="h-full rounded-2xl border border-stone-200 bg-white p-6 card-lift">
                  <h2 className="font-display text-xl text-ink-600">{section.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">{section.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-100/50">
        <div className="section-wrap">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">How It Works</p>
              <h2 className="mt-2 font-display text-display text-ink-600 text-balance">{page.stepsTitle}</h2>
            </div>
          </FadeIn>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {page.steps.map((step, index) => (
              <FadeIn key={step.title} delay={index * 90}>
                <div className="h-full rounded-2xl border border-stone-200 bg-white p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-500 font-display text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg text-ink-600">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Questions Sellers Ask</p>
            <h2 className="mt-2 font-display text-display text-ink-600">A few straight answers</h2>
          </FadeIn>

          <div className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {page.faqs.map((faq) => (
              <details key={faq.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-ink-600">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="section-wrap">
          <div className="mx-auto max-w-4xl text-center">
            <FadeIn>
              <p className="text-xs font-bold uppercase tracking-widest text-forest-500">Related Local Guides</p>
              <h2 className="mt-2 font-display text-3xl text-ink-600">Keep reading if this sounds like your house</h2>
            </FadeIn>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {page.related.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} className="btn-secondary !py-2.5 text-sm">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
