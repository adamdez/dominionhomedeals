export type MetaSellerVariant = 'repairs' | 'estate' | 'direct'

export const META_SELLER_LANDINGS = {
  repairs: {
    headline: 'House needs work? Explore your selling options.',
    intro: 'Before taking on repairs, talk with Dominion Homes about selling. We help Spokane County owners explore selling options based on the property and their situation.',
    formIntro: 'Tell us the address and when you want to sell. Let’s talk about the house.',
  },
  estate: {
    headline: 'As-is sale options for an inherited Spokane County house.',
    intro: 'Tell us about the house and your next steps. If you are an heir still sorting out authority, you can start a conversation before you are ready to sell.',
    formIntro: 'For an inherited or estate property. Share the property and how to reach you. We can discuss your relationship to the property on the call.',
  },
  direct: {
    headline: 'Request an as-is investor offer for a Spokane County house.',
    intro: 'Tell us about the property and when you might sell. You can start a conversation now or ask us to follow up later.',
    formIntro: 'Share the property and how to reach you. You can consider an offer without committing to sell.',
  },
} satisfies Record<MetaSellerVariant, { headline: string; intro: string; formIntro: string }>

// Only fixed message keys choose copy. Never interpolate a visitor's URL into copy.
export function resolveMetaSellerVariant(query: Record<string, string | string[] | undefined>): MetaSellerVariant {
  if (query.variant === 'estate' || query.variant === 'direct' || query.variant === 'repairs') return query.variant
  if (query.utm_content === 'dh_inherited_v1') return 'estate'
  if (query.utm_content === 'dh_direct_v1') return 'direct'
  return 'repairs'
}
