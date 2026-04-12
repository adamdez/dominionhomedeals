import { getServiceClient } from "@/lib/supabase";

export const AL_INBOX_CATEGORY = "al_inbox_item";

export type InboxItemStatus = "queued" | "running" | "done" | "blocked" | "cancelled";
export type InboxBusiness = "dominion" | "wrenchready" | "cross-business" | "general";
export type InboxLane = "chairman" | "ceo" | "creative" | "systems" | "research" | "follow-through";

export interface InboxItemRecord {
  id: number;
  title: string;
  body: string;
  status: InboxItemStatus;
  business: InboxBusiness;
  lane: InboxLane;
  createdBy: string;
  source: string;
  startedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
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

function normalizeStatus(value: unknown): InboxItemStatus {
  switch (value) {
    case "running":
    case "done":
    case "blocked":
    case "cancelled":
      return value;
    default:
      return "queued";
  }
}

function normalizeBusiness(value: unknown): InboxBusiness {
  switch (value) {
    case "dominion":
    case "wrenchready":
    case "cross-business":
      return value;
    default:
      return "general";
  }
}

function normalizeLane(value: unknown): InboxLane {
  switch (value) {
    case "ceo":
    case "creative":
    case "systems":
    case "research":
    case "follow-through":
      return value;
    default:
      return "chairman";
  }
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
}

function deriveTitle(body: string): string {
  const cleaned = body
    .replace(/\s+/g, " ")
    .replace(/^[\-\*\d\.\)\s]+/, "")
    .trim();
  if (!cleaned) return "Queued AL ask";
  return cleaned.length > 96 ? `${cleaned.slice(0, 93).trimEnd()}...` : cleaned;
}

function inferBusiness(text: string): InboxBusiness {
  const normalized = text.toLowerCase();
  const mentionsWrench =
    /wrenchready|simon|van|mobile mechanic|service day|route|booking/.test(normalized);
  const mentionsDominion =
    /dominion|seller|lead|deal|buyer|underwrit|acquisition|disposition/.test(normalized);

  if (mentionsWrench && mentionsDominion) return "cross-business";
  if (mentionsWrench) return "wrenchready";
  if (mentionsDominion) return "dominion";
  return "general";
}

function inferLane(text: string): InboxLane {
  const normalized = text.toLowerCase();
  if (/hero|decal|tri-?fold|brochure|brand|creative|design|marketing|copy|landing page/.test(normalized)) {
    return "creative";
  }
  if (/fix|bug|deploy|server|bridge|codex|claude|system|desktop|auth|api|site/.test(normalized)) {
    return "systems";
  }
  if (/research|compare|deep dive|analy/.test(normalized)) {
    return "research";
  }
  if (/tom|jerry|ceo|run wrenchready|run dominion/.test(normalized)) {
    return "ceo";
  }
  if (/follow up|follow-through|check back|make sure/.test(normalized)) {
    return "follow-through";
  }
  return "chairman";
}

function rowToInboxItem(row: {
  id: number;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
}): InboxItemRecord {
  const content = parseContent(row.content);
  const body =
    typeof content.body === "string" && content.body.trim() ? content.body.trim() : "";

  return {
    id: row.id,
    title:
      typeof content.title === "string" && content.title.trim()
        ? content.title.trim()
        : deriveTitle(body),
    body,
    status: normalizeStatus(content.status),
    business: normalizeBusiness(content.business),
    lane: normalizeLane(content.lane),
    createdBy:
      typeof content.createdBy === "string" && content.createdBy.trim()
        ? content.createdBy.trim()
        : "Unknown",
    source:
      typeof content.source === "string" && content.source.trim()
        ? content.source.trim()
        : "al_inbox",
    startedAt: normalizeTimestamp(content.startedAt),
    completedAt: normalizeTimestamp(content.completedAt),
    lastError:
      typeof content.lastError === "string" && content.lastError.trim()
        ? content.lastError.trim()
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function inboxItemToContent(item: Partial<InboxItemRecord> & { body: string }): string {
  const body = item.body.trim();
  return JSON.stringify({
    title:
      typeof item.title === "string" && item.title.trim()
        ? item.title.trim()
        : deriveTitle(body),
    body,
    status: normalizeStatus(item.status),
    business: normalizeBusiness(item.business ?? inferBusiness(body)),
    lane: normalizeLane(item.lane ?? inferLane(body)),
    createdBy: item.createdBy || "Authenticated AL operator",
    source: item.source || "al_inbox",
    startedAt: normalizeTimestamp(item.startedAt),
    completedAt: normalizeTimestamp(item.completedAt),
    lastError:
      typeof item.lastError === "string" && item.lastError.trim()
        ? item.lastError.trim()
        : null,
  });
}

function sortInboxItems(items: InboxItemRecord[]): InboxItemRecord[] {
  const statusRank: Record<InboxItemStatus, number> = {
    running: 0,
    queued: 1,
    blocked: 2,
    done: 3,
    cancelled: 4,
  };

  return [...items].sort((a, b) => {
    if (statusRank[a.status] !== statusRank[b.status]) {
      return statusRank[a.status] - statusRank[b.status];
    }
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });
}

export async function listInboxItems(): Promise<InboxItemRecord[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("al_memories")
    .select("id, content, created_at, updated_at")
    .eq("category", AL_INBOX_CATEGORY)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return sortInboxItems(
    data.map((row) =>
      rowToInboxItem(
        row as {
          id: number;
          content: string | null;
          created_at: string | null;
          updated_at: string | null;
        },
      ),
    ),
  );
}

export async function createInboxItem(input: {
  title?: string;
  body: string;
  business?: InboxBusiness;
  lane?: InboxLane;
  createdBy?: string;
  source?: string;
}): Promise<InboxItemRecord> {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("Supabase service client unavailable.");

  const body = input.body.trim();
  if (!body) {
    throw new Error("Inbox body is required.");
  }

  const { data, error } = await supabase
    .from("al_memories")
    .insert({
      category: AL_INBOX_CATEGORY,
      content: inboxItemToContent({
        title: input.title,
        body,
        business: input.business,
        lane: input.lane,
        createdBy: input.createdBy || "Authenticated AL operator",
        source: input.source || "al_inbox",
        status: "queued",
      }),
    })
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create inbox item.");
  }

  return rowToInboxItem(
    data as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}

export async function updateInboxItem(
  id: number,
  updates: Partial<
    Pick<
      InboxItemRecord,
      "title" | "body" | "status" | "business" | "lane" | "startedAt" | "completedAt" | "lastError"
    >
  >,
): Promise<InboxItemRecord> {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("Supabase service client unavailable.");

  const { data: existing, error: existingError } = await supabase
    .from("al_memories")
    .select("id, content, created_at, updated_at")
    .eq("id", id)
    .eq("category", AL_INBOX_CATEGORY)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message || "Inbox item not found.");
  }

  const current = rowToInboxItem(
    existing as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );

  const nextStatus = updates.status || current.status;
  const nextContent = inboxItemToContent({
    ...current,
    ...updates,
    body:
      typeof updates.body === "string" && updates.body.trim()
        ? updates.body.trim()
        : current.body,
    title:
      typeof updates.title === "string" && updates.title.trim()
        ? updates.title.trim()
        : current.title,
    status: nextStatus,
    startedAt:
      updates.startedAt !== undefined
        ? updates.startedAt
        : nextStatus === "running" && !current.startedAt
          ? new Date().toISOString()
          : current.startedAt,
    completedAt:
      updates.completedAt !== undefined
        ? updates.completedAt
        : nextStatus === "done" || nextStatus === "cancelled"
          ? new Date().toISOString()
          : nextStatus === "queued" || nextStatus === "running"
            ? null
            : current.completedAt,
    lastError:
      updates.lastError !== undefined
        ? updates.lastError
        : nextStatus === "blocked"
          ? current.lastError
          : null,
  });

  const { data, error } = await supabase
    .from("al_memories")
    .update({ content: nextContent })
    .eq("id", id)
    .eq("category", AL_INBOX_CATEGORY)
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update inbox item.");
  }

  return rowToInboxItem(
    data as {
      id: number;
      content: string | null;
      created_at: string | null;
      updated_at: string | null;
    },
  );
}
