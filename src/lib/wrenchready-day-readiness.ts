import { getAlCanonicalOrigin } from "@/lib/al-platform";
import {
  createPlannerTask,
  listPlannerTasks,
  updatePlannerTask,
} from "@/lib/al-planner";
import { buildHostedAppPrefix } from "@/lib/al-review";
import { getServiceClient } from "@/lib/supabase";

const WRENCHREADY_DAY_READINESS_CATEGORY = "wrenchready_day_readiness";

type JsonRecord = Record<string, unknown>;

export type DayReadinessStatus = "ready" | "at_risk" | "blocked";
export type DayReadinessRisk = "clear" | "watch" | "blocked";
export type DayReadinessOwner = "none" | "al" | "dez" | "simon" | "system";

export interface WrenchReadyDayReadinessRecord {
  id: number;
  date: string;
  jobsPlanned: number;
  routeReady: boolean;
  customersConfirmed: boolean;
  partsReady: boolean;
  fluidsReady: boolean;
  toolsReady: boolean;
  paymentRisk: DayReadinessRisk;
  blockerOwner: DayReadinessOwner;
  blockerNote: string;
  notes: string;
  status: DayReadinessStatus;
  plannerTaskId: number | null;
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

function normalizeDate(value: unknown, fallback = tomorrowKey()): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const normalized = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : fallback;
}

function asBool(value: unknown): boolean {
  return value === true;
}

function normalizeRisk(value: unknown): DayReadinessRisk {
  return value === "watch" || value === "blocked" ? value : "clear";
}

function normalizeOwner(value: unknown): DayReadinessOwner {
  return value === "al" || value === "dez" || value === "simon" || value === "system"
    ? value
    : "none";
}

function shortText(value: unknown, max = 400): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : "";
}

function tomorrowKey(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildHostedWrenchReadyDayReadinessPath(host: string | null | undefined): string {
  return `${buildHostedAppPrefix(host)}/wrenchready/day-readiness`;
}

function deriveStatus(input: {
  jobsPlanned: number;
  routeReady: boolean;
  customersConfirmed: boolean;
  partsReady: boolean;
  fluidsReady: boolean;
  toolsReady: boolean;
  paymentRisk: DayReadinessRisk;
  blockerOwner: DayReadinessOwner;
}): DayReadinessStatus {
  if (input.jobsPlanned <= 0) return "at_risk";

  const blockers = [
    input.routeReady,
    input.customersConfirmed,
    input.partsReady,
    input.fluidsReady,
    input.toolsReady,
  ].filter((value) => value === false).length;

  if (
    input.paymentRisk === "blocked" ||
    input.blockerOwner !== "none" ||
    blockers >= 2
  ) {
    return "blocked";
  }

  if (input.paymentRisk === "watch" || blockers === 1) {
    return "at_risk";
  }

  return "ready";
}

function rowToReadiness(row: {
  id: number;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
}): WrenchReadyDayReadinessRecord {
  const content = parseContent(row.content);
  const jobsPlanned =
    Number.isFinite(Number(content.jobsPlanned)) && Number(content.jobsPlanned) >= 0
      ? Number(content.jobsPlanned)
      : 0;
  const paymentRisk = normalizeRisk(content.paymentRisk);
  const blockerOwner = normalizeOwner(content.blockerOwner);
  return {
    id: row.id,
    date: normalizeDate(content.date),
    jobsPlanned,
    routeReady: asBool(content.routeReady),
    customersConfirmed: asBool(content.customersConfirmed),
    partsReady: asBool(content.partsReady),
    fluidsReady: asBool(content.fluidsReady),
    toolsReady: asBool(content.toolsReady),
    paymentRisk,
    blockerOwner,
    blockerNote: shortText(content.blockerNote),
    notes: shortText(content.notes, 1000),
    status: deriveStatus({
      jobsPlanned,
      routeReady: asBool(content.routeReady),
      customersConfirmed: asBool(content.customersConfirmed),
      partsReady: asBool(content.partsReady),
      fluidsReady: asBool(content.fluidsReady),
      toolsReady: asBool(content.toolsReady),
      paymentRisk,
      blockerOwner,
    }),
    plannerTaskId:
      Number.isInteger(Number(content.plannerTaskId)) && Number(content.plannerTaskId) > 0
        ? Number(content.plannerTaskId)
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readinessToContent(input: Omit<WrenchReadyDayReadinessRecord, "id" | "createdAt" | "updatedAt" | "status"> & { status?: DayReadinessStatus }) {
  const status =
    input.status ||
    deriveStatus({
      jobsPlanned: input.jobsPlanned,
      routeReady: input.routeReady,
      customersConfirmed: input.customersConfirmed,
      partsReady: input.partsReady,
      fluidsReady: input.fluidsReady,
      toolsReady: input.toolsReady,
      paymentRisk: input.paymentRisk,
      blockerOwner: input.blockerOwner,
    });
  return JSON.stringify({
    date: normalizeDate(input.date),
    jobsPlanned: Math.max(0, Math.round(input.jobsPlanned)),
    routeReady: Boolean(input.routeReady),
    customersConfirmed: Boolean(input.customersConfirmed),
    partsReady: Boolean(input.partsReady),
    fluidsReady: Boolean(input.fluidsReady),
    toolsReady: Boolean(input.toolsReady),
    paymentRisk: normalizeRisk(input.paymentRisk),
    blockerOwner: normalizeOwner(input.blockerOwner),
    blockerNote: shortText(input.blockerNote),
    notes: shortText(input.notes, 1000),
    plannerTaskId: input.plannerTaskId || null,
    status,
  });
}

function plannerTitleForDate(date: string) {
  return `WrenchReady day readiness for ${date}`;
}

function buildPlannerDetails(
  readiness: Omit<WrenchReadyDayReadinessRecord, "id" | "createdAt" | "updatedAt">,
): string {
  return [
    `Status: ${readiness.status.replace(/_/g, " ")}`,
    `Jobs planned: ${readiness.jobsPlanned}`,
    readiness.routeReady ? "" : "Route order still needs work.",
    readiness.customersConfirmed ? "" : "Customer confirmations are incomplete.",
    readiness.partsReady ? "" : "Parts are not fully ready.",
    readiness.fluidsReady ? "" : "Fluids are not fully ready.",
    readiness.toolsReady ? "" : "Tools are not fully ready.",
    readiness.paymentRisk === "watch" ? "Payment risk needs review." : "",
    readiness.paymentRisk === "blocked" ? "Payment path is blocked." : "",
    readiness.blockerOwner !== "none" ? `Blocker owner: ${readiness.blockerOwner}` : "",
    readiness.blockerNote || "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function ensurePlannerFollowUp(
  readiness: Omit<WrenchReadyDayReadinessRecord, "id" | "createdAt" | "updatedAt">,
): Promise<number | null> {
  const title = plannerTitleForDate(readiness.date);
  const details = buildPlannerDetails(readiness);
  const tasks = await listPlannerTasks();
  const existing = tasks.find((task) => task.id === readiness.plannerTaskId) ||
    tasks.find(
      (task) =>
        task.title === title &&
        task.source === "wrenchready_day_readiness" &&
        task.dueDate === readiness.date,
    );

  if (readiness.status === "ready") {
    if (existing && existing.status === "open") {
      await updatePlannerTask(existing.id, {
        status: "done",
        details,
      });
      return existing.id;
    }
    return existing?.id || readiness.plannerTaskId;
  }

  if (existing) {
    await updatePlannerTask(existing.id, {
      status: "open",
      details,
      dueDate: readiness.date,
      assignedTo: "al",
    });
    return existing.id;
  }

  const task = await createPlannerTask({
    title,
    details,
    dueDate: readiness.date,
    assignedTo: "al",
    createdBy: "WrenchReady day-readiness",
    source: "wrenchready_day_readiness",
  });
  return task.id;
}

async function findReadinessRecord(
  targetDate: string,
): Promise<WrenchReadyDayReadinessRecord | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("al_memories")
    .select("id, content, created_at, updated_at")
    .eq("category", WRENCHREADY_DAY_READINESS_CATEGORY)
    .order("updated_at", { ascending: false });

  if (error || !data) return null;

  return (
    data
      .map((row) =>
        rowToReadiness(
          row as {
            id: number;
            content: string | null;
            created_at: string | null;
            updated_at: string | null;
          },
        ),
      )
      .find((row) => row.date === targetDate) || null
  );
}

export async function getWrenchReadyDayReadiness(
  date?: string | null,
): Promise<WrenchReadyDayReadinessRecord | null> {
  const targetDate = normalizeDate(date || tomorrowKey());
  return findReadinessRecord(targetDate);
}

export async function upsertWrenchReadyDayReadiness(input: {
  date?: string | null;
  jobsPlanned?: number;
  routeReady?: boolean;
  customersConfirmed?: boolean;
  partsReady?: boolean;
  fluidsReady?: boolean;
  toolsReady?: boolean;
  paymentRisk?: DayReadinessRisk;
  blockerOwner?: DayReadinessOwner;
  blockerNote?: string;
  notes?: string;
}): Promise<WrenchReadyDayReadinessRecord> {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("Supabase service client unavailable.");

  const targetDate = normalizeDate(input.date || tomorrowKey());
  const existing = await getWrenchReadyDayReadiness(targetDate);
  const draft = {
    date: targetDate,
    jobsPlanned:
      Number.isFinite(Number(input.jobsPlanned))
        ? Math.max(0, Math.round(Number(input.jobsPlanned)))
        : existing?.jobsPlanned || 0,
    routeReady: input.routeReady ?? existing?.routeReady ?? false,
    customersConfirmed: input.customersConfirmed ?? existing?.customersConfirmed ?? false,
    partsReady: input.partsReady ?? existing?.partsReady ?? false,
    fluidsReady: input.fluidsReady ?? existing?.fluidsReady ?? false,
    toolsReady: input.toolsReady ?? existing?.toolsReady ?? false,
    paymentRisk: normalizeRisk(input.paymentRisk ?? existing?.paymentRisk ?? "clear"),
    blockerOwner: normalizeOwner(input.blockerOwner ?? existing?.blockerOwner ?? "none"),
    blockerNote: shortText(input.blockerNote ?? existing?.blockerNote ?? ""),
    notes: shortText(input.notes ?? existing?.notes ?? "", 1000),
    plannerTaskId: existing?.plannerTaskId || null,
  };
  const status = deriveStatus(draft);
  const plannerTaskId = await ensurePlannerFollowUp({ ...draft, status });
  const content = readinessToContent({
    ...draft,
    plannerTaskId,
    status,
  });

  if (existing) {
    const { data, error } = await supabase
      .from("al_memories")
      .update({ content })
      .eq("id", existing.id)
      .eq("category", WRENCHREADY_DAY_READINESS_CATEGORY)
      .select("id, content, created_at, updated_at")
      .single();
    if (error || !data) {
      throw new Error(error?.message || "Failed to update day-readiness record.");
    }
    return rowToReadiness(
      data as {
        id: number;
        content: string | null;
        created_at: string | null;
        updated_at: string | null;
      },
    );
  }

  const { data, error } = await supabase
    .from("al_memories")
    .insert({
      category: WRENCHREADY_DAY_READINESS_CATEGORY,
      content,
    })
    .select("id, content, created_at, updated_at")
    .single();
  if (error || !data) {
    throw new Error(error?.message || "Failed to create day-readiness record.");
  }
  return rowToReadiness(
    data as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}

export async function getWrenchReadyDayReadinessSummary(
  date?: string | null,
  input?: { host?: string | null; origin?: string | null },
) {
  const record = await getWrenchReadyDayReadiness(date || tomorrowKey());
  const origin =
    input?.origin?.trim() || getAlCanonicalOrigin();
  const readinessHref = `${origin}${buildHostedWrenchReadyDayReadinessPath(input?.host)}`;
  if (!record) {
    return {
      ok: true,
      text: "No WrenchReady day-readiness record exists for tomorrow yet.",
      href: readinessHref,
      status: "at_risk" as DayReadinessStatus,
      record: null,
    };
  }

  const text =
    record.status === "ready"
      ? `Tomorrow is ready: ${record.jobsPlanned} jobs planned and the day is route-ready.`
      : record.status === "blocked"
        ? `Tomorrow is blocked: ${record.blockerNote || "readiness issues need repair before wrench time starts."}`
        : `Tomorrow is at risk: ${record.blockerNote || "one or more readiness checks are incomplete."}`;

  return {
    ok: true,
    text,
    href: readinessHref,
    status: record.status,
    record,
  };
}
