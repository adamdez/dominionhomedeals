import { getDominionServiceClient } from "@/lib/dominion-supabase";
import { createHash } from "node:crypto";

const DOMINION_LEAD_TABLE = "dominion_website_lead_receipts";
export const DOMINION_OPTIONS_FLOW = "seller_options_v1";

export type DominionSellerAuthority = "owner" | "authorized_representative";
export type DominionDeliveryOutcome = {
  status: "pending" | "provider_accepted" | "skipped" | "failed" | "outcome_unknown";
  referenceId?: string;
};
export type DominionDeliveryMap = Record<
  "email" | "teamSms" | "sentinel" | "lazarus" | "mailchimp",
  DominionDeliveryOutcome
>;
export interface DominionOptionsReceipt {
  flow: typeof DOMINION_OPTIONS_FLOW;
  submissionId: string;
  payloadFingerprint: string;
  receivedAt: string;
  delivery: DominionDeliveryMap;
  deliveryUpdatedAt?: string;
  [key: string]: unknown;
}

type JsonRecord = Record<string, unknown>;
type StringMap = Record<string, string>;

export type DominionLeadStatus =
  | "new"
  | "working"
  | "under_contract"
  | "won"
  | "lost";

export type DominionLeadOwner = "unassigned" | "dez" | "al" | "logan";

export interface DominionLeadRecord {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  condition: string;
  timeline: string;
  primaryConstraint?: string;
  submittedAt: string;
  source: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
  funnelVisitId?: string;
  adAttribution: StringMap;
  smsConsent: boolean;
  smsConsentTimestamp: string | null;
  smsConsentIP: string;
  status: DominionLeadStatus;
  owner: DominionLeadOwner;
  firstTouchAt: string | null;
  lastActionAt: string | null;
  nextActionDueDate: string | null;
  notes: string;
  plannerTaskId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  sellerAuthority?: DominionSellerAuthority | null;
  optionsReceipt?: DominionOptionsReceipt | null;
}

export interface DominionLeadSubmissionInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  condition: string;
  timeline: string;
  primaryConstraint?: string | null;
  source?: string | null;
  landingPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  funnelVisitId?: string | null;
  adAttribution?: Record<string, unknown> | null;
  smsConsent?: boolean | null;
  smsConsentTimestamp?: string | null;
  smsConsentIP?: string | null;
  submittedAt: string;
  sellerAuthority?: DominionSellerAuthority | null;
  tcpaConsented?: boolean;
}

function parseContent(raw: unknown): JsonRecord {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as JsonRecord;
  if (typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : {};
  } catch {
    return {};
  }
}

function optionsReceiptFromContent(value: unknown): DominionOptionsReceipt | null {
  // Preserve the entire server-owned envelope during lead status/owner edits.
  // Validate its identity separately before acknowledging a duplicate.
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as DominionOptionsReceipt)
    : null;
}

function sellerAuthority(value: unknown): DominionSellerAuthority | null {
  return value === "owner" || value === "authorized_representative" ? value : null;
}

function shortText(value: unknown, max = 400): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : "";
}

function normalizeStringRecord(value: unknown, preserveRawValues = false): StringMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => preserveRawValues ? Number(b === "oppref") - Number(a === "oppref") : 0)
      .map(([key, entry]) => [shortText(key, 80),
        preserveRawValues && typeof entry === "string" ? entry : shortText(entry, 300)] as const)
      .filter(([key, entry]) => key && entry)
      .slice(0, 80),
  );
}

function normalizeStatus(value: unknown): DominionLeadStatus {
  switch (String(value || "").trim()) {
    case "working":
    case "under_contract":
    case "won":
    case "lost":
      return value as DominionLeadStatus;
    default:
      return "new";
  }
}

function normalizeOwner(value: unknown): DominionLeadOwner {
  switch (String(value || "").trim()) {
    case "dez":
    case "al":
    case "logan":
      return value as DominionLeadOwner;
    default:
      return "unassigned";
  }
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = new Date(value.trim());
  return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : null;
}

function rowToDominionLead(row: {
  id: number;
  content: unknown;
  created_at: string | null;
  updated_at: string | null;
}): DominionLeadRecord {
  const content = parseContent(row.content);
  const optionsReceipt = optionsReceiptFromContent(content.optionsReceipt);
  const isOptionsFlow = optionsReceipt?.flow === DOMINION_OPTIONS_FLOW;
  const firstName = shortText(content.firstName, 120);
  const lastName = shortText(content.lastName, 120);
  const fullName =
    shortText(content.fullName, 240) ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    "Unknown lead";

  return {
    id: row.id,
    fullName,
    phone: shortText(content.phone, 32),
    email: shortText(content.email, 160).toLowerCase(),
    address: shortText(content.address, 240),
    city: shortText(content.city, 120),
    state: shortText(content.state, 8),
    zip: shortText(content.zip, 12),
    condition: shortText(content.condition, 240),
    timeline: shortText(content.timeline, 120),
    submittedAt: normalizeTimestamp(content.submittedAt) || row.created_at || new Date().toISOString(),
    source: shortText(content.source, 120) || "website",
    landingPage: shortText(content.landingPage, 240) || "/",
    utmSource: shortText(content.utmSource, 160),
    utmMedium: shortText(content.utmMedium, 160),
    utmCampaign: shortText(content.utmCampaign, 160),
    utmTerm: shortText(content.utmTerm, 240),
    utmContent: shortText(content.utmContent, 240),
    gclid: shortText(content.gclid, 160),
    ...(isOptionsFlow ? { funnelVisitId: shortText(content.funnelVisitId, 40) } : {}),
    adAttribution: normalizeStringRecord(content.adAttribution, isOptionsFlow),
    smsConsent: content.smsConsent === true,
    smsConsentTimestamp: normalizeTimestamp(content.smsConsentTimestamp),
    smsConsentIP: shortText(content.smsConsentIP, 80),
    status: normalizeStatus(content.status),
    owner: normalizeOwner(content.owner),
    firstTouchAt: normalizeTimestamp(content.firstTouchAt),
    lastActionAt: normalizeTimestamp(content.lastActionAt),
    nextActionDueDate: normalizeDate(content.nextActionDueDate),
    notes: shortText(content.notes, 2000),
    plannerTaskId:
      Number.isInteger(Number(content.plannerTaskId)) && Number(content.plannerTaskId) > 0
        ? Number(content.plannerTaskId)
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(isOptionsFlow ? {
      primaryConstraint: shortText(content.primaryConstraint, 240),
      sellerAuthority: sellerAuthority(content.sellerAuthority), optionsReceipt,
    } : {}),
  };
}

function dominionLeadToContent(
  record: Omit<DominionLeadRecord, "id" | "createdAt" | "updatedAt">,
): string {
  const [firstName, ...lastNameParts] = record.fullName.trim().split(/\s+/);
  return JSON.stringify({
    firstName: firstName || "",
    lastName: lastNameParts.join(" "),
    fullName: record.fullName.trim(),
    phone: record.phone.trim(),
    email: record.email.trim().toLowerCase(),
    address: record.address.trim(),
    city: record.city.trim(),
    state: record.state.trim(),
    zip: record.zip.trim(),
    condition: record.condition.trim(),
    timeline: record.timeline.trim(),
    submittedAt: normalizeTimestamp(record.submittedAt) || new Date().toISOString(),
    source: record.source.trim() || "website",
    landingPage: record.landingPage.trim() || "/",
    utmSource: record.utmSource.trim(),
    utmMedium: record.utmMedium.trim(),
    utmCampaign: record.utmCampaign.trim(),
    utmTerm: record.utmTerm.trim(),
    utmContent: record.utmContent.trim(),
    gclid: record.gclid.trim(),
    ...(record.optionsReceipt?.flow === DOMINION_OPTIONS_FLOW
      ? { funnelVisitId: shortText(record.funnelVisitId, 40) }
      : {}),
    adAttribution: normalizeStringRecord(record.adAttribution, record.optionsReceipt?.flow === DOMINION_OPTIONS_FLOW),
    smsConsent: record.smsConsent === true,
    smsConsentTimestamp: normalizeTimestamp(record.smsConsentTimestamp),
    smsConsentIP: record.smsConsentIP.trim(),
    status: normalizeStatus(record.status),
    owner: normalizeOwner(record.owner),
    firstTouchAt: normalizeTimestamp(record.firstTouchAt),
    lastActionAt: normalizeTimestamp(record.lastActionAt),
    nextActionDueDate: normalizeDate(record.nextActionDueDate),
    notes: shortText(record.notes, 2000),
    plannerTaskId: record.plannerTaskId || null,
    ...(record.optionsReceipt?.flow === DOMINION_OPTIONS_FLOW ? {
      primaryConstraint: shortText(record.primaryConstraint, 240),
      ...(sellerAuthority(record.sellerAuthority) ? { sellerAuthority: record.sellerAuthority } : {}),
      optionsReceipt: record.optionsReceipt,
    } : {}),
  });
}

function submissionRecord(
  input: DominionLeadSubmissionInput,
  isOptionsFlow = false,
): Omit<DominionLeadRecord, "id" | "createdAt" | "updatedAt"> {
  const fullName = `${shortText(input.firstName, 120)} ${shortText(input.lastName, 120)}`.trim() || "Unknown lead";
  const baseRecord: Omit<DominionLeadRecord, "id" | "createdAt" | "updatedAt"> = {
    fullName,
    phone: shortText(input.phone, 32),
    email: shortText(input.email, 160).toLowerCase(),
    address: shortText(input.address, 240),
    city: shortText(input.city, 120),
    state: shortText(input.state, 8),
    zip: shortText(input.zip, 12),
    condition: shortText(input.condition, 240),
    timeline: shortText(input.timeline, 120),
    submittedAt: normalizeTimestamp(input.submittedAt) || new Date().toISOString(),
    source: shortText(input.source, 120) || "website",
    landingPage: shortText(input.landingPage, 240) || "/",
    utmSource: shortText(input.utmSource, 160),
    utmMedium: shortText(input.utmMedium, 160),
    utmCampaign: shortText(input.utmCampaign, 160),
    utmTerm: shortText(input.utmTerm, 240),
    utmContent: shortText(input.utmContent, 240),
    gclid: shortText(input.gclid, 160),
    ...(isOptionsFlow ? { funnelVisitId: shortText(input.funnelVisitId, 40) } : {}),
    adAttribution: normalizeStringRecord(input.adAttribution, isOptionsFlow),
    smsConsent: input.smsConsent === true,
    smsConsentTimestamp: normalizeTimestamp(input.smsConsentTimestamp),
    smsConsentIP: shortText(input.smsConsentIP, 80),
    status: "new",
    owner: "unassigned",
    firstTouchAt: null,
    lastActionAt: null,
    nextActionDueDate: null,
    notes: "",
    plannerTaskId: null,
    ...(isOptionsFlow ? {
      primaryConstraint: shortText(input.primaryConstraint, 240),
      ...(sellerAuthority(input.sellerAuthority) ? { sellerAuthority: input.sellerAuthority } : {}),
    } : {}),
  };

  return baseRecord;
}

export async function recordDominionLeadSubmission(
  input: DominionLeadSubmissionInput,
): Promise<DominionLeadRecord | null> {
  const supabase = getDominionServiceClient();
  if (!supabase) return null;
  const baseRecord = submissionRecord(input);

  const { data, error } = await supabase
    .from(DOMINION_LEAD_TABLE)
    .insert({
      flow: "website_general",
      content: dominionLeadToContent(baseRecord),
    })
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to record Dominion lead.");
  }

  return rowToDominionLead(
    data as {
      id: number;
      content: unknown;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}

export function isDominionOptionsSubmissionId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export class DominionOptionsSubmissionConflictError extends Error {
  constructor() {
    super("This submission reference was already used for different details.");
    this.name = "DominionOptionsSubmissionConflictError";
  }
}

interface OptionsSubmissionReceipt {
  record: DominionLeadRecord;
  duplicate: boolean;
  submissionId: string;
  payloadFingerprint: string;
  storedContent: string;
}

function pendingDelivery(): DominionDeliveryMap {
  return {
    email: { status: "pending" }, lazarus: { status: "pending" },
    teamSms: { status: "skipped" }, sentinel: { status: "skipped" }, mailchimp: { status: "skipped" },
  };
}

export function dominionOptionsDeliveryStatus(delivery: DominionDeliveryMap | undefined) {
  const outcomes = Object.values(delivery || {});
  if (outcomes.some((outcome) => outcome.status === "pending")) return "pending";
  if (!outcomes.length || outcomes.some((outcome) =>
    outcome.status === "failed" || outcome.status === "outcome_unknown")) return "needs_review";
  // A newsletter sync alone is not an operational seller-lead destination.
  return [delivery?.email, delivery?.teamSms, delivery?.sentinel, delivery?.lazarus]
    .some((outcome) => outcome?.status === "provider_accepted")
    ? "provider_accepted" : "needs_review";
}

export async function recordDominionOptionsLeadSubmission(
  input: DominionLeadSubmissionInput,
  submissionId: string,
): Promise<OptionsSubmissionReceipt> {
  if (!isDominionOptionsSubmissionId(submissionId) || !sellerAuthority(input.sellerAuthority)) {
    throw new Error("Invalid seller-options submission identity.");
  }
  const supabase = getDominionServiceClient();
  if (!supabase) throw new Error("Durable lead storage is unavailable.");

  const normalizedId = submissionId.toLowerCase();
  const base = submissionRecord(input, true);
  // Generated timestamps/IP are not seller input and must not break a retry.
  const { submittedAt: _submittedAt, smsConsentTimestamp: _consentAt,
    smsConsentIP: _consentIp, ...immutable } = base;
  const payloadFingerprint = createHash("sha256").update(JSON.stringify({
    ...immutable,
    adAttribution: Object.fromEntries(Object.entries(base.adAttribution).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
    tcpaConsented: input.tcpaConsented === true,
  })).digest("hex");
  const optionsReceipt: DominionOptionsReceipt = {
    flow: DOMINION_OPTIONS_FLOW, submissionId: normalizedId, payloadFingerprint,
    receivedAt: base.submittedAt, delivery: pendingDelivery(),
  };
  const content = dominionLeadToContent({ ...base, optionsReceipt });

  // The dedicated Dominion table has UNIQUE(submission_id). Only the winning
  // insert may run notification and CRM fanout.
  const inserted = await supabase.from(DOMINION_LEAD_TABLE).insert({
    flow: DOMINION_OPTIONS_FLOW,
    submission_id: normalizedId,
    payload_fingerprint: payloadFingerprint,
    content,
  }).select("id, content, created_at, updated_at").single();
  let row = inserted.data;
  let duplicate = false;
  if (inserted.error?.code === "23505") {
    const existing = await supabase.from(DOMINION_LEAD_TABLE)
      .select("id, content, created_at, updated_at")
      .eq("submission_id", normalizedId).maybeSingle();
    if (existing.error || !existing.data) throw new Error("Could not verify the existing submission.");
    row = existing.data;
    const saved = optionsReceiptFromContent(parseContent(row.content).optionsReceipt);
    if (saved?.flow !== DOMINION_OPTIONS_FLOW || saved.submissionId !== normalizedId ||
      saved.payloadFingerprint !== payloadFingerprint) throw new DominionOptionsSubmissionConflictError();
    duplicate = true;
  } else if (inserted.error || !row) {
    throw new Error("Could not record the seller-options inquiry.");
  }
  if (!row || !Number.isSafeInteger(row.id) || row.id <= 0) {
    throw new Error("The saved submission did not return a valid receipt.");
  }
  return {
    record: rowToDominionLead(row),
    duplicate,
    submissionId: normalizedId,
    payloadFingerprint,
    storedContent: typeof row.content === "string" ? row.content : JSON.stringify(row.content),
  };
}

export async function recordDominionOptionsDelivery(
  receipt: OptionsSubmissionReceipt,
  delivery: DominionDeliveryMap,
): Promise<void> {
  const supabase = getDominionServiceClient();
  if (!supabase || !receipt.record.optionsReceipt || receipt.duplicate) {
    throw new Error("Only the receipt creator can record delivery outcomes.");
  }
  const updatedAt = new Date().toISOString();
  const content = dominionLeadToContent({
    ...receipt.record,
    optionsReceipt: { ...receipt.record.optionsReceipt, delivery, deliveryUpdatedAt: updatedAt },
  });
  const { data, error } = await supabase.from(DOMINION_LEAD_TABLE)
    .update({ content, updated_at: updatedAt })
    .eq("id", receipt.record.id)
    .eq("submission_id", receipt.submissionId)
    .eq("payload_fingerprint", receipt.payloadFingerprint)
    .eq("content", receipt.storedContent)
    .select("id").single();
  if (error || !data) throw new Error("Delivery outcomes need operator reconciliation.");
}
