export const META_SELLER_QUALIFICATION_VERSION = "meta_seller_followup_v2" as const;

export const META_SELLER_SERVICE_AREAS = [
  { value: "spokane_county_wa", label: "Spokane County, Washington", state: "WA", city: "Spokane County" },
  { value: "kootenai_county_id", label: "Kootenai County, Idaho", state: "ID", city: "Kootenai County" },
] as const;

const VERIFIED_SCREENING_AREAS = [
  { value: "spokane_buying_area_wa", label: "Spokane buying area, Washington", state: "WA", city: "Spokane buying area" },
  { value: "north_idaho_buying_area_id", label: "Nearby North Idaho buying area", state: "ID", city: "North Idaho buying area" },
] as const;

const CHOICES = {
  serviceArea: [...META_SELLER_SERVICE_AREAS.map(area => area.value), ...VERIFIED_SCREENING_AREAS.map(area => area.value), 'outside_service_area'],
  timeline: ['asap', 'within_30_days', 'within_31_to_60_days', 'within_60_days', 'more_than_60_days', 'checking_value', 'unsure'],
  sellerAuthority: ['owner', 'authorized_representative', 'heir_without_authority', 'helper_tenant_agent', 'researching', 'unsure'],
  propertyType: ['site_built', 'manufactured_with_owned_land', 'manufactured_without_land', 'vacant_land', 'commercial_or_five_plus', 'other', 'unsure'],
  listingStatus: ['not_listed', 'expired', 'listed', 'unsure'],
  offerReadiness: ['wants_offer_now', 'value_only', 'not_ready', 'retail_only', 'unsure'],
  priceTradeoff: ['accepts_below_repaired_retail', 'requires_retail', 'unsure'],
  condition: ['move_in_ready', 'normal_wear', 'repairs_needed', 'major_work', 'unsure'],
  sellerReason: ['repairs', 'inherited_estate', 'rental', 'vacant', 'relocating', 'other', 'prefer_not_to_say'],
  bestTimeToSpeak: ['morning', 'afternoon', 'evening', 'anytime'],
} as const;

export type MetaSellerFollowUpTier = 'ready_now' | 'nurture' | 'probate_help' | 'needs_review' | 'outside_buy_box';
export const META_SELLER_FOLLOWUP_LABELS: Record<MetaSellerFollowUpTier, string> = {
  ready_now: 'Ready for an offer conversation',
  nurture: 'Follow up over time',
  probate_help: 'Inherited property: authority needs review',
  needs_review: 'Clarify the property and seller situation',
  outside_buy_box: 'Outside the current buying criteria: review before pursuing',
};

export interface MetaSellerQualificationInput {
  qualificationVersion?: unknown;
  serviceArea?: unknown;
  timeline?: unknown;
  sellerAuthority?: unknown;
  propertyType?: unknown;
  listingStatus?: unknown;
  offerReadiness?: unknown;
  priceTradeoff?: unknown;
  condition?: unknown;
  sellerReason?: unknown;
  bestTimeToSpeak?: unknown;
  contactConsent?: unknown;
}

export type NormalizedMetaSellerQualification = {
  [K in keyof typeof CHOICES]: (typeof CHOICES)[K][number]
} & { qualificationVersion: typeof META_SELLER_QUALIFICATION_VERSION; contactConsent: true };

export function metaSellerFollowUpTier(value: NormalizedMetaSellerQualification): MetaSellerFollowUpTier {
  if (value.serviceArea === 'outside_service_area' ||
    !['site_built', 'manufactured_with_owned_land', 'unsure'].includes(value.propertyType)) return 'outside_buy_box';
  if (value.sellerAuthority === 'heir_without_authority') return 'probate_help';
  if (['helper_tenant_agent', 'researching', 'unsure'].includes(value.sellerAuthority) ||
    !['not_listed','expired'].includes(value.listingStatus) || value.propertyType === 'unsure') return 'needs_review';
  if (['asap', 'within_30_days', 'within_31_to_60_days', 'within_60_days'].includes(value.timeline) &&
    value.offerReadiness === 'wants_offer_now' && value.priceTradeoff === 'accepts_below_repaired_retail') return 'ready_now';
  return 'nurture';
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateMetaSellerQualification(
  input: MetaSellerQualificationInput,
): { ok: true; value: NormalizedMetaSellerQualification } | { ok: false; error: string } {
  const value = {
    qualificationVersion: stringValue(input.qualificationVersion) === 'meta_distressed_seller_v1'
      ? META_SELLER_QUALIFICATION_VERSION : stringValue(input.qualificationVersion),
    serviceArea: stringValue(input.serviceArea),
    timeline: stringValue(input.timeline) || 'unsure',
    sellerAuthority: stringValue(input.sellerAuthority) || 'unsure',
    propertyType: stringValue(input.propertyType) || 'unsure',
    listingStatus: stringValue(input.listingStatus) || 'unsure',
    offerReadiness: stringValue(input.offerReadiness) || 'unsure',
    priceTradeoff: stringValue(input.priceTradeoff) || 'unsure',
    condition: stringValue(input.condition) || 'unsure',
    sellerReason: stringValue(input.sellerReason) || 'prefer_not_to_say',
    bestTimeToSpeak: stringValue(input.bestTimeToSpeak) || 'anytime',
    contactConsent: input.contactConsent,
  };

  if (value.qualificationVersion !== META_SELLER_QUALIFICATION_VERSION) {
    return { ok: false, error: "The offer-review version is invalid." };
  }
  for (const key of Object.keys(CHOICES) as Array<keyof typeof CHOICES>) {
    if (!(CHOICES[key] as readonly string[]).includes(value[key])) {
      return { ok: false, error: `Please check the ${key} answer.` };
    }
  }
  if (value.contactConsent !== true) {
    return { ok: false, error: "Please confirm that Dominion may respond to this request." };
  }

  return { ok: true, value: value as NormalizedMetaSellerQualification };
}

export function metaSellerServiceArea(value: string) {
  return [...META_SELLER_SERVICE_AREAS, ...VERIFIED_SCREENING_AREAS].find((area) => area.value === value) || null;
}

export function metaSellerQualificationSummary(value: NormalizedMetaSellerQualification): string {
  const tier = metaSellerFollowUpTier(value);
  return [META_SELLER_FOLLOWUP_LABELS[tier], `tier=${tier}`, `area=${value.serviceArea}`,
    `type=${value.propertyType}`, `timing=${value.timeline}`, `authority=${value.sellerAuthority}`,
    `best=${value.bestTimeToSpeak}`].join(' | ').slice(0, 240);
}
