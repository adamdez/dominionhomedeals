export type MetaSellerVariant = 'repairs' | 'estate' | 'direct'

// A fixed message treatment keeps the existing direct-offer form and tracking.
export const META_MOVE_AFTER_COPY = {
  headline: 'Sell first. Move after.',
  intro: 'Need the money from selling your house before you can move? Ask about selling as-is with a move-out date after closing. For houses in Spokane and nearby North Idaho.',
  terms: 'A title company holds the agreed portion of your proceeds in escrow. Before you agree, we explain the move-out date, release conditions, any occupancy costs and the money you receive at closing. The terms are put in writing.',
} as const

export function usesMoveAfterMessage(query: Record<string, string | string[] | undefined>, variant: MetaSellerVariant): boolean {
  return variant === 'direct' && query.message === 'move_after'
}

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
    headline: 'Sell your house as-is. Request a cash offer.',
    intro: 'For houses in Spokane and nearby North Idaho. Skip the repairs and contractors. Let’s talk through your property and closing timeline.',
    formIntro: 'Tell us about the house. We’ll contact you to discuss an as-is cash offer. No commitment to sell.',
  },
} satisfies Record<MetaSellerVariant, { headline: string; intro: string; formIntro: string }>

// Only fixed message keys choose copy. Never interpolate a visitor's URL into copy.
export function resolveMetaSellerVariant(query: Record<string, string | string[] | undefined>): MetaSellerVariant {
  if (query.variant === 'estate' || query.variant === 'direct' || query.variant === 'repairs') return query.variant
  if (query.utm_content === 'dh_inherited_v1') return 'estate'
  if (query.utm_content === 'dh_direct_v1') return 'direct'
  return 'repairs'
}
