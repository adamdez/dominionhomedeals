import { getAlCanonicalOrigin } from "@/lib/al-platform";
import {
  createPlannerTask,
  listPlannerTasks,
  updatePlannerTask,
} from "@/lib/al-planner";
import { buildHostedAppPrefix } from "@/lib/al-review";
import { getServiceClient } from "@/lib/supabase";

const DOMINION_LEAD_CATEGORY = "dominion_lead_control";
const CANONICAL_AL_ORIGIN = getAlCanonicalOrigin();

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

export interface DominionLeadHealth {
  isStale: boolean;
  staleReason: string | null;
  dueDate: string | null;
  waitingOn: "AL" | "Dez" | null;
}

export interface DominionLeadAttentionItem {
  id: number;
  title: string;
  reason: string;
  href: string;
  owner: "AL" | "Dez";
  status: DominionLeadStatus;
  isStale: boolean;
}

export interface DominionLeadAttentionSummary {
  openLeads: number;
  staleLeads: number;
  items: DominionLeadAttentionItem[];
}

export interface DominionLeadDashboard {
  generatedAt: string;
  openLeads: number;
  staleLeads: number;
  workingLeads: number;
  untouchedLeads: number;
  leads: Array<{
    record: DominionLeadRecord;
    health: DominionLeadHealth;
  }>;
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

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timelineThresholdHours(timeline: string): number {
  const lowered = timeline.toLowerCase();
  if (lowered.includes("asap")) return 1;
  if (lowered.includes("soon")) return 4;
  return 24;
}

function hoursSince(value: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (Date.now() - timestamp) / 3600000);
}

function plannerAssigneeForOwner(owner: DominionLeadOwner): "al" | "dez" {
  return owner === "al" ? "al" : "dez";
}

function waitingOwnerForLead(owner: DominionLeadOwner): "AL" | "Dez" {
  return owner === "al" ? "AL" : "Dez";
}

export function buildHostedDominionLeadsPath(host: string | null | undefined): string {
  return `${buildHostedAppPrefix(host)}/dominion/leads`;
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

export function describeDominionLeadHealth(record: DominionLeadRecord): DominionLeadHealth {
  if (record.status === "won" || record.status === "lost") {
    return {
      isStale: false,
      staleReason: null,
      dueDate: null,
      waitingOn: null,
    };
  }

  const today = todayKey();
  const waitingOn = waitingOwnerForLead(record.owner);
  const nextActionDueDate = normalizeDate(record.nextActionDueDate);

  if (record.status === "new" && !record.firstTouchAt) {
    const threshold = timelineThresholdHours(record.timeline);
    const ageHours = hoursSince(record.submittedAt);
    return {
      isStale: ageHours !== null && ageHours >= threshold,
      staleReason:
        ageHours !== null && ageHours >= threshold
          ? `No first touch recorded ${Math.floor(ageHours)}h after submission`
          : null,
      dueDate: record.submittedAt.slice(0, 10),
      waitingOn,
    };
  }

  if (nextActionDueDate && nextActionDueDate < today) {
    return {
      isStale: true,
      staleReason: `Next action overdue since ${nextActionDueDate}`,
      dueDate: nextActionDueDate,
      waitingOn,
    };
  }

  const lastMovement =
    record.lastActionAt ||
    record.firstTouchAt ||
    record.updatedAt ||
    record.submittedAt;
  const movementAgeHours = hoursSince(lastMovement);
  const staleAfterHours = record.status === "under_contract" ? 168 : 72;

  return {
    isStale: movementAgeHours !== null && movementAgeHours >= staleAfterHours,
    staleReason:
      movementAgeHours !== null && movementAgeHours >= staleAfterHours
        ? `No logged movement for ${Math.floor(movementAgeHours)}h`
        : null,
    dueDate: nextActionDueDate,
    waitingOn,
  };
}

function plannerTitleForLead(record: DominionLeadRecord) {
  const shortAddress = record.address || `${record.city}, ${record.state}`;
  return `Dominion lead follow-up: ${record.fullName} - ${shortAddress}`;
}

function findMatchingPlannerTaskId(
  record: DominionLeadRecord,
  tasks: Awaited<ReturnType<typeof listPlannerTasks>>,
): number | null {
  if (record.plannerTaskId) return record.plannerTaskId;
  const expectedTitle = plannerTitleForLead(record);
  const match = tasks.find(
    (task) => task.source === DOMINION_LEAD_CATEGORY && task.title === expectedTitle,
  );
  return match?.id || null;
}

function summarizeDashboard(entries: DominionLeadDashboard["leads"]) {
  return {
    openLeads: entries.filter(
      (entry) => entry.record.status !== "won" && entry.record.status !== "lost",
    ).length,
    staleLeads: entries.filter((entry) => entry.health.isStale).length,
    workingLeads: entries.filter(
      (entry) =>
        entry.record.status === "working" || entry.record.status === "under_contract",
    ).length,
    untouchedLeads: entries.filter(
      (entry) => entry.record.status === "new" && !entry.record.firstTouchAt,
    ).length,
  };
}

function buildPlannerDetails(record: DominionLeadRecord, health: DominionLeadHealth): string {
  return [
    `Status: ${record.status.replace(/_/g, " ")}`,
    `Owner: ${record.owner}`,
    `Submitted: ${new Date(record.submittedAt).toLocaleString()}`,
    `Timeline: ${record.timeline || "Not captured"}`,
    `Condition: ${record.condition || "Not captured"}`,
    `Phone: ${record.phone || "Not captured"}`,
    `Email: ${record.email || "Not captured"}`,
    `Property: ${[record.address, `${record.city}, ${record.state} ${record.zip}`.trim()].filter(Boolean).join(" - ")}`,
    record.firstTouchAt ? `First touch: ${new Date(record.firstTouchAt).toLocaleString()}` : "First touch: not logged",
    record.nextActionDueDate ? `Next action due: ${record.nextActionDueDate}` : "",
    health.staleReason ? `Attention: ${health.staleReason}` : "",
    record.notes || "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function ensurePlannerFollowUp(record: DominionLeadRecord): Promise<number | null> {
  const title = plannerTitleForLead(record);
  const health = describeDominionLeadHealth(record);
  const details = buildPlannerDetails(record, health);
  const tasks = await listPlannerTasks();
  const existing =
    tasks.find((task) => task.id === record.plannerTaskId) ||
    tasks.find(
      (task) =>
        task.source === DOMINION_LEAD_CATEGORY &&
        task.title === title,
    );

  if (record.status === "won") {
    if (existing && existing.status === "open") {
      await updatePlannerTask(existing.id, {
        status: "done",
        details,
      });
      return existing.id;
    }
    return existing?.id || record.plannerTaskId;
  }

  if (record.status === "lost") {
    if (existing && existing.status === "open") {
      await updatePlannerTask(existing.id, {
        status: "cancelled",
        details,
      });
      return existing.id;
    }
    return existing?.id || record.plannerTaskId;
  }

  if (existing) {
    await updatePlannerTask(existing.id, {
      status: "open",
      details,
      dueDate: health.dueDate || record.nextActionDueDate || record.submittedAt.slice(0, 10),
      assignedTo: plannerAssigneeForOwner(record.owner),
    });
    return existing.id;
  }

  const task = await createPlannerTask({
    title,
    details,
    dueDate: health.dueDate || record.nextActionDueDate || record.submittedAt.slice(0, 10),
    assignedTo: plannerAssigneeForOwner(record.owner),
    createdBy: "Dominion lead control",
    source: DOMINION_LEAD_CATEGORY,
  });
  return task.id;
}

export async function listDominionLeads(limit?: number | null): Promise<DominionLeadRecord[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from("al_memories")
    .select("id, content, created_at, updated_at")
    .eq("category", DOMINION_LEAD_CATEGORY)
    .order("updated_at", { ascending: false });

  if (limit && limit > 0) {
    query = query.limit(Math.max(limit, 12));
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const plannerTasks = await listPlannerTasks();

  return data
    .map((row) => {
      const record = rowToDominionLead(
        row as {
          id: number;
          content: string | null;
          created_at: string | null;
          updated_at: string | null;
        },
      );
      return {
        ...record,
        plannerTaskId: findMatchingPlannerTaskId(record, plannerTasks),
      };
    })
    .sort((a, b) => {
      const aHealth = describeDominionLeadHealth(a);
      const bHealth = describeDominionLeadHealth(b);
      if (a.status !== b.status) {
        const aClosed = a.status === "won" || a.status === "lost";
        const bClosed = b.status === "won" || b.status === "lost";
        if (aClosed !== bClosed) return aClosed ? 1 : -1;
      }
      if (aHealth.isStale !== bHealth.isStale) return aHealth.isStale ? -1 : 1;
      return b.submittedAt.localeCompare(a.submittedAt);
    });
}

export async function getDominionLeadDashboard(limit = 24): Promise<DominionLeadDashboard> {
  const allLeads = await listDominionLeads(null);
  const decoratedAll = allLeads.map((record) => ({
    record,
    health: describeDominionLeadHealth(record),
  }));
  const summary = summarizeDashboard(decoratedAll);

  return {
    generatedAt: new Date().toISOString(),
    ...summary,
    leads: decoratedAll.slice(0, limit),
  };
}

export async function buildDominionLeadAttentionSummary(input?: {
  host?: string | null;
  origin?: string | null;
  limit?: number;
}): Promise<DominionLeadAttentionSummary> {
  const origin = input?.origin?.trim() || CANONICAL_AL_ORIGIN;
  const host = input?.host;
  const dashboard = await getDominionLeadDashboard(18);
  const basePath = buildHostedDominionLeadsPath(host);

  const items = dashboard.leads
    .filter(
      (entry) =>
        entry.record.status !== "won" &&
        entry.record.status !== "lost" &&
        (entry.health.isStale || entry.record.status === "new"),
    )
    .slice(0, input?.limit || 6)
    .map((entry) => ({
      id: entry.record.id,
      title: `${entry.record.fullName} - ${entry.record.address || entry.record.city}`,
      reason:
        entry.health.staleReason ||
        (entry.record.firstTouchAt
          ? "Lead is open and still needs the next action logged"
          : "No first touch is logged yet"),
      href: `${origin.replace(/\/+$/, "")}${basePath}#lead-${entry.record.id}`,
      owner: entry.health.waitingOn || "Dez",
      status: entry.record.status,
      isStale: entry.health.isStale,
    }));

  return {
    openLeads: dashboard.openLeads,
    staleLeads: dashboard.staleLeads,
    items,
  };
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
    (await (async () => {
      const inserted = rowToDominionLead(
        data as {
          id: number;
          content: string | null;
          created_at: string | null;
          updated_at: string | null;
        },
      );

      const plannerTaskId = await ensurePlannerFollowUp(inserted);
      if (plannerTaskId === inserted.plannerTaskId) {
        return data;
      }

      const { data: updated, error: updateError } = await supabase
        .from("al_memories")
        .update({
          content: dominionLeadToContent({
            ...inserted,
            plannerTaskId,
          }),
        })
        .eq("category", DOMINION_LEAD_CATEGORY)
        .eq("id", inserted.id)
        .select("id, content, created_at, updated_at")
        .single();

      if (updateError || !updated) {
        throw new Error(updateError?.message || "Failed to attach planner task to Dominion lead.");
      }

      return updated;
    })()) as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}

export async function updateDominionLead(
  id: number,
  updates: Partial<{
    status: DominionLeadStatus;
    owner: DominionLeadOwner;
    nextActionDueDate: string | null;
    notes: string;
    markTouchedNow: boolean;
  }>,
): Promise<DominionLeadRecord> {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("Supabase service client unavailable.");

  const { data: existing, error: existingError } = await supabase
    .from("al_memories")
    .select("id, content, created_at, updated_at")
    .eq("category", DOMINION_LEAD_CATEGORY)
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message || "Dominion lead not found.");
  }

  const current = rowToDominionLead(
    existing as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
  const now = new Date().toISOString();
  const nextStatus = updates.status ? normalizeStatus(updates.status) : current.status;
  const firstTouchAt =
    updates.markTouchedNow || (!current.firstTouchAt && nextStatus !== "new")
      ? current.firstTouchAt || now
      : current.firstTouchAt;
  const draft: DominionLeadRecord = {
    ...current,
    status: nextStatus,
    owner: updates.owner ? normalizeOwner(updates.owner) : current.owner,
    firstTouchAt,
    lastActionAt: now,
    nextActionDueDate:
      updates.nextActionDueDate === undefined
        ? current.nextActionDueDate
        : normalizeDate(updates.nextActionDueDate),
    notes:
      typeof updates.notes === "string"
        ? shortText(updates.notes, 2000)
        : current.notes,
  };
  const plannerTaskId = await ensurePlannerFollowUp(draft);
  const content = dominionLeadToContent({
    ...draft,
    plannerTaskId,
  });

  const { data, error } = await supabase
    .from("al_memories")
    .update({ content })
    .eq("category", DOMINION_LEAD_CATEGORY)
    .eq("id", id)
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update Dominion lead.");
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
