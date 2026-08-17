type FaqItem = {
  q: string;
  a: string;
};

/**
 * FAQPage structured data.
 *
 * Emit alongside any visible FAQ block. Google and AI answer engines read
 * this to lift question/answer pairs directly; the questions must match
 * the on-page text exactly, so always pass the same array the page renders.
 */
export function FaqJsonLd({ faqs }: { faqs: ReadonlyArray<FaqItem> }) {
  if (!faqs.length) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
