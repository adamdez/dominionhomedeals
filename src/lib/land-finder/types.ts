export type LandMode = "vacant" | "expanded";
export type ReviewState = "unreviewed" | "maybe" | "pass";
export type ListingStatus = "unknown" | "listed" | "not_listed";
export type DistressStatus = "unknown" | "evidence" | "none";
export type QualificationStatus = "confirmed_vacant" | "verify_improvements";

export interface ParcelProperties {
  parcelId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  acres: number;
  useDescription: string;
  landValue: number | null;
  assessmentYear: number | null;
  qualification: QualificationStatus;
}

export interface ParcelGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
}

export interface ParcelFeature {
  type: "Feature";
  id: string;
  geometry: ParcelGeometry;
  properties: ParcelProperties;
}

export interface ParcelFeatureCollection {
  type: "FeatureCollection";
  features: ParcelFeature[];
}

export interface LandFinderReview {
  parcelId: string;
  favorite: boolean;
  reviewState: ReviewState;
  calledAt: string | null;
  letterSentAt: string | null;
  notes: string;
  listingStatus: ListingStatus;
  listingVerifiedAt: string | null;
  listingSourceUrl: string | null;
  distressStatus: DistressStatus;
  distressVerifiedAt: string | null;
  distressSourceUrl: string | null;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandFinderReviewInput {
  favorite: boolean;
  reviewState: ReviewState;
  calledAt: string | null;
  letterSentAt: string | null;
  notes: string;
  listingStatus: ListingStatus;
  listingVerifiedAt: string | null;
  listingSourceUrl: string | null;
  distressStatus: DistressStatus;
  distressVerifiedAt: string | null;
  distressSourceUrl: string | null;
  updatedBy: string;
}

export const EMPTY_REVIEW_INPUT: LandFinderReviewInput = {
  favorite: false,
  reviewState: "unreviewed",
  calledAt: null,
  letterSentAt: null,
  notes: "",
  listingStatus: "unknown",
  listingVerifiedAt: null,
  listingSourceUrl: null,
  distressStatus: "unknown",
  distressVerifiedAt: null,
  distressSourceUrl: null,
  updatedBy: "Team",
};
