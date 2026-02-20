// src/types/index.ts

/** TCPA Consent Record — immutable, required on every form submission */
export interface TCPAConsentRecord {
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  consentLanguage: string;
  capturePoint: string;
  pageUrl: string;
  smsConsent: boolean;
  callConsent: boolean;
  emailConsent: boolean;
  consentHash: string;
}

/** Property info from the seller */
export interface PropertyInfo {
  address: string;
  city: string;
  state: "WA" | "ID";
  zip: string;
  county: "Spokane" | "Kootenai";
  propertyType?: "single_family" | "multi_family" | "condo" | "mobile" | "land" | "other";
  condition?: "great" | "minor_repairs" | "needs_work" | "major_issues";
  occupancy?: "owner_occupied" | "tenant" | "vacant";
  situation?: string;
}

/** Lead object sent to Sentinel CRM */
export interface Lead {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  property: PropertyInfo;
  timeline?: "asap" | "30_days" | "60_days" | "flexible";
  source: LeadSource;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  gclid?: string;
  landingPage?: string;
  referrer?: string;
  tcpaConsent: TCPAConsentRecord;
  createdAt: string;
  sessionId: string;
  device?: "mobile" | "tablet" | "desktop";
}

export type LeadSource =
  | "website_form"
  | "phone_call"
  | "organic_search"
  | "google_ads"
  | "direct"
  | "referral"
  | "neighborhood_page";

export interface SentinelResponse {
  success: boolean;
  leadId?: string;
  message?: string;
  errors?: string[];
}

export interface Neighborhood {
  slug: string;
  name: string;
  city: string;
  county: "Spokane" | "Kootenai";
  state: "WA" | "ID";
  zip: string;
}
