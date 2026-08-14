import type {
  DistressStatus,
  LandFinderReview,
  LandFinderReviewInput,
  ListingStatus,
  ReviewState,
} from "@/lib/land-finder/types";

type ReviewRow = {
  parcel_id: string;
  favorite: boolean;
  review_state: ReviewState;
  called_at: string | null;
  letter_sent_at: string | null;
  notes: string;
  listing_status: ListingStatus;
  listing_verified_at: string | null;
  listing_source_url: string | null;
  distress_status: DistressStatus;
  distress_verified_at: string | null;
  distress_source_url: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

const REVIEW_STATES = new Set<ReviewState>(["unreviewed", "maybe", "pass"]);
const LISTING_STATUSES = new Set<ListingStatus>(["unknown", "listed", "not_listed"]);
const DISTRESS_STATUSES = new Set<DistressStatus>(["unknown", "evidence", "none"]);

function nullableDate(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || !value || Number.isNaN(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
}

function nullableUrl(value: unknown): string | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 1000) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function isSpokaneParcelId(value: string): boolean {
  return /^\d{5}\.\d{4}$/.test(value);
}

export function parseReviewInput(value: unknown): LandFinderReviewInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const calledAt = nullableDate(input.calledAt);
  const letterSentAt = nullableDate(input.letterSentAt);
  const listingVerifiedAt = nullableDate(input.listingVerifiedAt);
  const distressVerifiedAt = nullableDate(input.distressVerifiedAt);
  const listingSourceUrl = nullableUrl(input.listingSourceUrl);
  const distressSourceUrl = nullableUrl(input.distressSourceUrl);

  if (
    typeof input.favorite !== "boolean" ||
    typeof input.reviewState !== "string" ||
    !REVIEW_STATES.has(input.reviewState as ReviewState) ||
    typeof input.notes !== "string" ||
    input.notes.length > 5000 ||
    typeof input.listingStatus !== "string" ||
    !LISTING_STATUSES.has(input.listingStatus as ListingStatus) ||
    typeof input.distressStatus !== "string" ||
    !DISTRESS_STATUSES.has(input.distressStatus as DistressStatus) ||
    typeof input.updatedBy !== "string" ||
    !/^[A-Za-z][A-Za-z0-9 .'-]{0,39}$/.test(input.updatedBy) ||
    calledAt === undefined ||
    letterSentAt === undefined ||
    listingVerifiedAt === undefined ||
    distressVerifiedAt === undefined ||
    listingSourceUrl === undefined ||
    distressSourceUrl === undefined
  ) {
    return null;
  }

  return {
    favorite: input.favorite,
    reviewState: input.reviewState as ReviewState,
    calledAt,
    letterSentAt,
    notes: input.notes.trim(),
    listingStatus: input.listingStatus as ListingStatus,
    listingVerifiedAt,
    listingSourceUrl,
    distressStatus: input.distressStatus as DistressStatus,
    distressVerifiedAt,
    distressSourceUrl,
    updatedBy: input.updatedBy.trim(),
  };
}

export function reviewRowToModel(row: ReviewRow): LandFinderReview {
  return {
    parcelId: row.parcel_id,
    favorite: row.favorite,
    reviewState: row.review_state,
    calledAt: row.called_at,
    letterSentAt: row.letter_sent_at,
    notes: row.notes,
    listingStatus: row.listing_status,
    listingVerifiedAt: row.listing_verified_at,
    listingSourceUrl: row.listing_source_url,
    distressStatus: row.distress_status,
    distressVerifiedAt: row.distress_verified_at,
    distressSourceUrl: row.distress_source_url,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function reviewInputToRow(parcelId: string, input: LandFinderReviewInput) {
  return {
    parcel_id: parcelId,
    favorite: input.favorite,
    review_state: input.reviewState,
    called_at: input.calledAt,
    letter_sent_at: input.letterSentAt,
    notes: input.notes,
    listing_status: input.listingStatus,
    listing_verified_at: input.listingVerifiedAt,
    listing_source_url: input.listingSourceUrl,
    distress_status: input.distressStatus,
    distress_verified_at: input.distressVerifiedAt,
    distress_source_url: input.distressSourceUrl,
    updated_by: input.updatedBy,
    updated_at: new Date().toISOString(),
  };
}
