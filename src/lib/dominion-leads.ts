import { getServiceClient } from "@/lib/supabase";

const DOMINION_LEAD_CATEGORY = "dominion_lead_control";

type JsonRecord = Record<string, unknown>;

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
  submittedAt: string;
  source: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  status: DominionLeadStatus;
  owner: DominionLeadOwner;
  firstTouchAt: string | null;
  lastActionAt: string | null;
  nextActionDueDate: string | null;
  notes: string;
  plannerTaskId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
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
  source?: string | null;
  landingPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  submittedAt: string;
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
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
}): DominionLeadRecord {
  const content = parseContent(row.content);
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
    status: normalizeStatus(record.status),
    owner: normalizeOwner(record.owner),
    firstTouchAt: normalizeTimestamp(record.firstTouchAt),
    lastActionAt: normalizeTimestamp(record.lastActionAt),
    nextActionDueDate: normalizeDate(record.nextActionDueDate),
    notes: shortText(record.notes, 2000),
    plannerTaskId: record.plannerTaskId || null,
  });
}

export async function recordDominionLeadSubmission(
  input: DominionLeadSubmissionInput,
): Promise<DominionLeadRecord | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

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
    status: "new",
    owner: "unassigned",
    firstTouchAt: null,
    lastActionAt: null,
    nextActionDueDate: null,
    notes: "",
    plannerTaskId: null,
  };

  const { data, error } = await supabase
    .from("al_memories")
    .insert({
      category: DOMINION_LEAD_CATEGORY,
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
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}
