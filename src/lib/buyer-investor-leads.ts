import { getServiceClient } from "@/lib/supabase";

const BUYER_INVESTOR_LEAD_CATEGORY = "dominion_buyer_investor_lead_control";

type JsonRecord = Record<string, unknown>;

export type BuyerInvestorInterestType =
  | "active_buyer"
  | "passive_investor"
  | "both";

export type BuyerInvestorLeadStatus = "new" | "working" | "qualified" | "inactive";
export type BuyerInvestorLeadOwner = "unassigned" | "adam" | "logan";

export interface BuyerInvestorLeadSubmissionInput {
  fullName: string;
  email: string;
  phone: string;
  interestType: BuyerInvestorInterestType;
  buyerStrategies: string[];
  opportunityInterests: string[];
  capitalRange: string;
  interestDetails: string;
  preferredMarkets: string;
  timeline: string;
  source?: string | null;
  landingPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  submittedAt: string;
}

export interface BuyerInvestorLeadRecord extends BuyerInvestorLeadSubmissionInput {
  id: number;
  status: BuyerInvestorLeadStatus;
  owner: BuyerInvestorLeadOwner;
  firstTouchAt: string | null;
  lastActionAt: string | null;
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
}

function parseContent(raw: string | null): JsonRecord {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : {};
  } catch {
    return {};
  }
}

function shortText(value: unknown, max = 400): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : "";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 120))
        .filter(Boolean)
    : [];
}

function normalizeInterestType(value: unknown): BuyerInvestorInterestType {
  switch (String(value || "").trim()) {
    case "active_buyer":
    case "passive_investor":
    case "both":
      return value as BuyerInvestorInterestType;
    default:
      return "both";
  }
}

function normalizeStatus(value: unknown): BuyerInvestorLeadStatus {
  switch (String(value || "").trim()) {
    case "working":
    case "qualified":
    case "inactive":
      return value as BuyerInvestorLeadStatus;
    default:
      return "new";
  }
}

function normalizeOwner(value: unknown): BuyerInvestorLeadOwner {
  switch (String(value || "").trim()) {
    case "adam":
    case "logan":
      return value as BuyerInvestorLeadOwner;
    default:
      return "unassigned";
  }
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = new Date(value.trim());
  return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : null;
}

function rowToBuyerInvestorLead(row: {
  id: number;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
}): BuyerInvestorLeadRecord {
  const content = parseContent(row.content);

  return {
    id: row.id,
    fullName: shortText(content.fullName, 240) || "Unknown lead",
    email: shortText(content.email, 160).toLowerCase(),
    phone: shortText(content.phone, 32),
    interestType: normalizeInterestType(content.interestType),
    buyerStrategies: stringList(content.buyerStrategies),
    opportunityInterests: stringList(content.opportunityInterests),
    capitalRange: shortText(content.capitalRange, 80),
    interestDetails: shortText(content.interestDetails, 1000),
    preferredMarkets: shortText(content.preferredMarkets, 500),
    timeline: shortText(content.timeline, 120),
    source: shortText(content.source, 120) || "website",
    landingPage: shortText(content.landingPage, 240) || "/buyers",
    utmSource: shortText(content.utmSource, 160),
    utmMedium: shortText(content.utmMedium, 160),
    utmCampaign: shortText(content.utmCampaign, 160),
    utmTerm: shortText(content.utmTerm, 160),
    utmContent: shortText(content.utmContent, 160),
    gclid: shortText(content.gclid, 160),
    submittedAt: normalizeTimestamp(content.submittedAt) || row.created_at || new Date().toISOString(),
    status: normalizeStatus(content.status),
    owner: normalizeOwner(content.owner),
    firstTouchAt: normalizeTimestamp(content.firstTouchAt),
    lastActionAt: normalizeTimestamp(content.lastActionAt),
    notes: shortText(content.notes, 2000),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buyerInvestorLeadToContent(
  record: Omit<BuyerInvestorLeadRecord, "id" | "createdAt" | "updatedAt">,
): string {
  return JSON.stringify({
    fullName: record.fullName.trim(),
    email: record.email.trim().toLowerCase(),
    phone: record.phone.trim(),
    interestType: normalizeInterestType(record.interestType),
    buyerStrategies: record.buyerStrategies.map((item) => shortText(item, 120)).filter(Boolean),
    opportunityInterests: record.opportunityInterests.map((item) => shortText(item, 120)).filter(Boolean),
    capitalRange: record.capitalRange.trim(),
    interestDetails: record.interestDetails.trim(),
    preferredMarkets: record.preferredMarkets.trim(),
    timeline: record.timeline.trim(),
    source: shortText(record.source, 120) || "website",
    landingPage: shortText(record.landingPage, 240) || "/buyers",
    utmSource: shortText(record.utmSource, 160),
    utmMedium: shortText(record.utmMedium, 160),
    utmCampaign: shortText(record.utmCampaign, 160),
    utmTerm: shortText(record.utmTerm, 160),
    utmContent: shortText(record.utmContent, 160),
    gclid: shortText(record.gclid, 160),
    submittedAt: normalizeTimestamp(record.submittedAt) || new Date().toISOString(),
    status: normalizeStatus(record.status),
    owner: normalizeOwner(record.owner),
    firstTouchAt: normalizeTimestamp(record.firstTouchAt),
    lastActionAt: normalizeTimestamp(record.lastActionAt),
    notes: shortText(record.notes, 2000),
  });
}

export async function recordBuyerInvestorLeadSubmission(
  input: BuyerInvestorLeadSubmissionInput,
): Promise<BuyerInvestorLeadRecord | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const baseRecord: Omit<BuyerInvestorLeadRecord, "id" | "createdAt" | "updatedAt"> = {
    fullName: shortText(input.fullName, 240) || "Unknown lead",
    email: shortText(input.email, 160).toLowerCase(),
    phone: shortText(input.phone, 32),
    interestType: normalizeInterestType(input.interestType),
    buyerStrategies: input.buyerStrategies.map((item) => shortText(item, 120)).filter(Boolean),
    opportunityInterests: input.opportunityInterests.map((item) => shortText(item, 120)).filter(Boolean),
    capitalRange: shortText(input.capitalRange, 80),
    interestDetails: shortText(input.interestDetails, 1000),
    preferredMarkets: shortText(input.preferredMarkets, 500),
    timeline: shortText(input.timeline, 120),
    source: shortText(input.source, 120) || "website",
    landingPage: shortText(input.landingPage, 240) || "/buyers",
    utmSource: shortText(input.utmSource, 160),
    utmMedium: shortText(input.utmMedium, 160),
    utmCampaign: shortText(input.utmCampaign, 160),
    utmTerm: shortText(input.utmTerm, 160),
    utmContent: shortText(input.utmContent, 160),
    gclid: shortText(input.gclid, 160),
    submittedAt: normalizeTimestamp(input.submittedAt) || new Date().toISOString(),
    status: "new",
    owner: "unassigned",
    firstTouchAt: null,
    lastActionAt: null,
    notes: "",
  };

  const { data, error } = await supabase
    .from("al_memories")
    .insert({
      category: BUYER_INVESTOR_LEAD_CATEGORY,
      content: buyerInvestorLeadToContent(baseRecord),
    })
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to record buyer/investor lead.");
  }

  return rowToBuyerInvestorLead(
    data as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}
