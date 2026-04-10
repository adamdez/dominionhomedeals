import { getServiceClient } from "@/lib/supabase";

export const AL_PLANNER_CATEGORY = "planner_task";

export type PlannerTaskStatus = "open" | "done" | "cancelled";
export type PlannerTaskAssignee = "dez" | "al";

export interface PlannerTaskRecord {
  id: number;
  title: string;
  details: string;
  dueDate: string | null;
  status: PlannerTaskStatus;
  assignedTo: PlannerTaskAssignee;
  createdBy: string;
  source: string;
  createdAt: string | null;
  updatedAt: string | null;
}

type JsonRecord = Record<string, unknown>;

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

function normalizeStatus(value: unknown): PlannerTaskStatus {
  return value === "done" || value === "cancelled" ? value : "open";
}

function normalizeAssignee(value: unknown): PlannerTaskAssignee {
  return value === "al" ? "al" : "dez";
}

function normalizeDueDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function rowToPlannerTask(row: {
  id: number;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
}): PlannerTaskRecord {
  const content = parseContent(row.content);
  return {
    id: row.id,
    title: typeof content.title === "string" && content.title.trim() ? content.title.trim() : "Untitled task",
    details: typeof content.details === "string" ? content.details.trim() : "",
    dueDate: normalizeDueDate(content.dueDate),
    status: normalizeStatus(content.status),
    assignedTo: normalizeAssignee(content.assignedTo),
    createdBy:
      typeof content.createdBy === "string" && content.createdBy.trim()
        ? content.createdBy.trim()
        : "Unknown",
    source:
      typeof content.source === "string" && content.source.trim()
        ? content.source.trim()
        : "planner",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function plannerTaskToContent(task: Partial<PlannerTaskRecord> & { title: string }): string {
  return JSON.stringify({
    title: task.title,
    details: task.details || "",
    dueDate: task.dueDate || null,
    status: normalizeStatus(task.status),
    assignedTo: normalizeAssignee(task.assignedTo),
    createdBy: task.createdBy || "Unknown",
    source: task.source || "planner",
  });
}

export async function listPlannerTasks(): Promise<PlannerTaskRecord[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("al_memories")
    .select("id, content, created_at, updated_at")
    .eq("category", AL_PLANNER_CATEGORY)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data
    .map((row) =>
      rowToPlannerTask(
        row as {
          id: number;
          content: string | null;
          created_at: string | null;
          updated_at: string | null;
        },
      ),
    )
    .sort((a, b) => {
      const aDue = a.dueDate || "9999-12-31";
      const bDue = b.dueDate || "9999-12-31";
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      if (aDue !== bDue) return aDue.localeCompare(bDue);
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
}

export async function createPlannerTask(input: {
  title: string;
  details?: string;
  dueDate?: string | null;
  assignedTo?: PlannerTaskAssignee;
  createdBy?: string;
  source?: string;
}): Promise<PlannerTaskRecord> {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("Supabase service client unavailable.");

  const { data, error } = await supabase
    .from("al_memories")
    .insert({
      category: AL_PLANNER_CATEGORY,
      content: plannerTaskToContent({
        title: input.title.trim(),
        details: input.details?.trim() || "",
        dueDate: normalizeDueDate(input.dueDate),
        assignedTo: input.assignedTo || "dez",
        createdBy: input.createdBy || "Authenticated AL operator",
        source: input.source || "planner",
        status: "open",
      }),
    })
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create planner task.");
  }

  return rowToPlannerTask(
    data as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}

export async function updatePlannerTask(
  id: number,
  updates: Partial<Pick<PlannerTaskRecord, "title" | "details" | "dueDate" | "status" | "assignedTo">>,
): Promise<PlannerTaskRecord> {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("Supabase service client unavailable.");

  const { data: existing, error: existingError } = await supabase
    .from("al_memories")
    .select("id, content, created_at, updated_at")
    .eq("id", id)
    .eq("category", AL_PLANNER_CATEGORY)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message || "Planner task not found.");
  }

  const existingTask = rowToPlannerTask(
    existing as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );

  const nextContent = plannerTaskToContent({
    ...existingTask,
    ...updates,
    title: typeof updates.title === "string" && updates.title.trim() ? updates.title.trim() : existingTask.title,
    details: typeof updates.details === "string" ? updates.details.trim() : existingTask.details,
    dueDate: updates.dueDate === undefined ? existingTask.dueDate : normalizeDueDate(updates.dueDate),
    assignedTo: updates.assignedTo || existingTask.assignedTo,
    status: updates.status || existingTask.status,
  });

  const { data, error } = await supabase
    .from("al_memories")
    .update({ content: nextContent })
    .eq("id", id)
    .eq("category", AL_PLANNER_CATEGORY)
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update planner task.");
  }

  return rowToPlannerTask(
    data as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}
