export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Dominion Homes, LLC',
    description: 'We buy houses for cash in Spokane County WA and Kootenai County ID. Fair cash offers in 24 hours, close in as fast as 2 weeks. No agents, no commissions, no repairs.',
    url: 'https://www.dominionhomedeals.com',
    telephone: '+1-208-625-8078',
    email: 'offers@dominionhomedeals.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Post Falls',
      addressRegion: 'ID',
      postalCode: '83854',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 47.7182,
      longitude: -116.9516,
    },
    areaServed: [
      { '@type': 'County', name: 'Spokane County, WA' },
      { '@type': 'County', name: 'Kootenai County, ID' },
    ],
    priceRange: '$$$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '18:00',
    },
    sameAs: [],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How fast can you close on my house in Spokane?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We can close in as fast as 2 weeks. Some sellers prefer a longer timeline, and we work on your schedule. We are local principals based in Post Falls, ID.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to make repairs before selling?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. We buy houses in any condition — fire damage, foundation issues, hoarding, outdated, or just lived-in. No cleaning, no repairs, no prep work needed.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there any fees or commissions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Zero fees and zero commissions. We pay all closing costs. The cash offer you accept is the amount you receive at closing.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get a cash offer on my house?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Fill out our short form or call 208-625-8078. We will review your property details and present a fair, no-obligation cash offer within 24 hours.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you buy houses in Coeur d\'Alene and North Idaho?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We buy houses across all of Kootenai County including Coeur d\'Alene, Post Falls, Hayden, Rathdrum, and surrounding areas.',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}