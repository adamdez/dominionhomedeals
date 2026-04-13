import { updatePlannerTask } from "@/lib/al-planner";
import { getServiceClient } from "@/lib/supabase";

type JsonRecord = Record<string, unknown>;
type CursorAuthScheme = "bearer" | "basic";

interface CursorAgentSnapshot {
  id: string | null;
  status: string | null;
  repositoryUrl: string | null;
  branchName: string | null;
  monitorUrl: string | null;
  prUrl: string | null;
  createdAt: string | null;
  name: string | null;
}

interface CursorOpenJobRow {
  id: number;
  task: string;
  status: string;
  context: unknown;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseContext(raw: unknown): JsonRecord {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return asRecord(parsed);
    } catch {
      return {};
    }
  }
  return asRecord(raw);
}

function shortText(value: string, limit = 200): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, Math.max(0, limit - 3))}...`;
}

function stripMarkdown(value: string): string {
  return value
    .replace(/[*_`>#-]/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCursorRepositoryUrl(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith("github.com/")) return `https://${normalized}`;
  return `https://github.com/${normalized.replace(/^github\.com\//i, "")}`;
}

function cursorAuthSchemes(): CursorAuthScheme[] {
  const preferred = process.env.CURSOR_AGENTS_AUTH_SCHEME?.trim().toLowerCase();
  if (preferred === "bearer" || preferred === "basic") {
    return [preferred];
  }
  return ["bearer", "basic"];
}

function buildCursorAuthHeader(apiKey: string, scheme: CursorAuthScheme): string {
  if (scheme === "basic") {
    return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
  }
  return `Bearer ${apiKey}`;
}

async function parseCursorApiBody(res: Response): Promise<{
  raw: string;
  json: unknown;
}> {
  const raw = await res.text().catch(() => "");
  if (!raw) {
    return { raw: "", json: null };
  }
  try {
    return { raw, json: JSON.parse(raw) };
  } catch {
    return { raw, json: null };
  }
}

async function cursorApiRequest(
  path: string,
  init: RequestInit = {},
): Promise<{
  response: Response;
  authScheme: CursorAuthScheme;
  raw: string;
  json: unknown;
}> {
  const apiKey = process.env.CURSOR_AGENTS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CURSOR_AGENTS_API_KEY missing.");
  }

  let lastResponse: {
    response: Response;
    authScheme: CursorAuthScheme;
    raw: string;
    json: unknown;
  } | null = null;

  for (const authScheme of cursorAuthSchemes()) {
    const response = await fetch(`https://api.cursor.com/v0${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
        Authorization: buildCursorAuthHeader(apiKey, authScheme),
      },
    });
    const body = await parseCursorApiBody(response);
    lastResponse = { response, authScheme, ...body };
    if (response.status !== 401) {
      return lastResponse;
    }
  }

  if (!lastResponse) {
    throw new Error("Cursor agent request failed before a response was received.");
  }
  return lastResponse;
}

function normalizeCursorSnapshot(raw: unknown): CursorAgentSnapshot {
  const record = asRecord(raw);
  const source = asRecord(record.source);
  const target = asRecord(record.target);
  return {
    id: asText(record.id),
    status: asText(record.status),
    repositoryUrl:
      normalizeCursorRepositoryUrl(
        asText(record.repositoryUrl) ||
          asText(source.repository) ||
          asText(record.repo) ||
          asText(record.repository),
      ),
    branchName: asText(target.branchName) || asText(record.branchName),
    monitorUrl:
      asText(target.url) ||
      asText(record.monitorUrl) ||
      (asText(record.id) ? `https://cursor.com/agents/${asText(record.id)}` : null),
    prUrl: asText(target.prUrl) || asText(record.prUrl),
    createdAt: asText(record.createdAt) || asText(record.created_at),
    name: asText(record.name) || asText(record.title),
  };
}

export function cursorLifecycleStatus(status: string | null | undefined): "running" | "finished" | "failed" | "unknown" {
  const normalized = status?.trim().toUpperCase();
  if (!normalized) return "unknown";
  if (
    normalized.includes("FINISH") ||
    normalized.includes("SUCCESS") ||
    normalized.includes("COMPLETE")
  ) {
    return "finished";
  }
  if (
    normalized.includes("FAIL") ||
    normalized.includes("ERROR") ||
    normalized.includes("CANCEL") ||
    normalized.includes("ABORT")
  ) {
    return "failed";
  }
  if (
    normalized.includes("RUN") ||
    normalized.includes("QUEUE") ||
    normalized.includes("PEND") ||
    normalized.includes("START")
  ) {
    return "running";
  }
  return "unknown";
}

function latestCursorAssistantMessage(messages: unknown): string | null {
  if (!Array.isArray(messages)) return null;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const entry = messages[index];
    const record = asRecord(entry);
    if (asText(record.type) !== "assistant_message") continue;
    const text = asText(record.text);
    if (text) return text;
  }
  return null;
}

function buildCursorStatusMessage(input: {
  snapshot: CursorAgentSnapshot;
  task: string;
  latestAssistantText?: string | null;
}): string {
  const lifecycle = cursorLifecycleStatus(input.snapshot.status);
  const lines = [
    `Cursor agent ${input.snapshot.id ? `#${input.snapshot.id}` : ""} — ${input.snapshot.status || lifecycle.toUpperCase()}`.trim(),
    input.snapshot.name ? `Run: ${input.snapshot.name}` : "",
    input.snapshot.repositoryUrl ? `Repo: ${input.snapshot.repositoryUrl}` : "",
    input.snapshot.branchName ? `Branch: ${input.snapshot.branchName}` : "",
    input.snapshot.prUrl ? `PR: ${input.snapshot.prUrl}` : "",
    input.snapshot.monitorUrl ? `Monitor: ${input.snapshot.monitorUrl}` : "",
    input.task ? `Task: ${shortText(input.task, 200)}` : "",
    input.latestAssistantText
      ? `Latest update: ${shortText(stripMarkdown(input.latestAssistantText), 280)}`
      : "",
  ].filter(Boolean);

  if (lifecycle === "finished") {
    lines.push(
      input.snapshot.prUrl
        ? "Cursor finished. Review the PR and decide whether it is ready for Board Room or needs changes."
        : "Cursor finished. Open the monitor and inspect the final outcome before treating this as ready.",
    );
  } else if (lifecycle === "failed") {
    lines.push("Cursor failed. Repair the blocked execution lane or reroute the work before asking for review.");
  } else {
    lines.push("Cursor is still running. Let it finish or check the monitor before escalating.");
  }

  return lines.join("\n");
}

async function fetchCursorRuntime(agentId: string, task: string): Promise<{
  snapshot: CursorAgentSnapshot;
  latestAssistantText: string | null;
  authScheme: CursorAuthScheme;
  statusMessage: string;
}> {
  const listing = await cursorApiRequest("/agents", { method: "GET" });
  if (!listing.response.ok) {
    throw new Error(`Cursor list failed with HTTP ${listing.response.status}.`);
  }

  const listingJson = listing.json;
  const agents = Array.isArray(listingJson)
    ? listingJson
    : Array.isArray(asRecord(listingJson).agents)
      ? (asRecord(listingJson).agents as unknown[])
      : [];
  const match = agents.find((entry) => normalizeCursorSnapshot(entry).id === agentId);
  if (!match) {
    throw new Error(`Cursor agent ${agentId} was not found in the recent agent list.`);
  }

  const snapshot = normalizeCursorSnapshot(match);
  const conversation = await cursorApiRequest(`/agents/${encodeURIComponent(agentId)}/conversation`, {
    method: "GET",
  });
  if (!conversation.response.ok) {
    throw new Error(`Cursor conversation failed with HTTP ${conversation.response.status}.`);
  }
  const conversationJson = conversation.json;
  const messages = Array.isArray(conversationJson)
    ? conversationJson
    : Array.isArray(asRecord(conversationJson).messages)
      ? (asRecord(conversationJson).messages as unknown[])
      : [];
  const latestAssistantText = latestCursorAssistantMessage(messages);

  return {
    snapshot,
    latestAssistantText,
    authScheme: listing.authScheme,
    statusMessage: buildCursorStatusMessage({
      snapshot,
      task,
      latestAssistantText,
    }),
  };
}

function buildCursorOperatorLinks(snapshot: CursorAgentSnapshot, repositoryUrl: string | null) {
  return [
    ...(snapshot.prUrl
      ? [{ label: "Open Cursor PR", url: snapshot.prUrl, priority: "primary" }]
      : []),
    ...(snapshot.monitorUrl
      ? [{
          label: "Open Cursor monitor",
          url: snapshot.monitorUrl,
          priority: snapshot.prUrl ? "secondary" : "primary",
        }]
      : []),
    ...(repositoryUrl ? [{ label: "Open repo", url: repositoryUrl, priority: "secondary" }] : []),
  ];
}

function buildCursorPresentationFields(input: {
  task: string;
  existingContext: JsonRecord;
  snapshot: CursorAgentSnapshot;
  latestAssistantText: string | null;
  statusMessage: string;
  authScheme: CursorAuthScheme;
}): JsonRecord {
  const lifecycle = cursorLifecycleStatus(input.snapshot.status);
  const repositoryUrl =
    input.snapshot.repositoryUrl ||
    normalizeCursorRepositoryUrl(asText(input.existingContext.cursor_repository_url)) ||
    normalizeCursorRepositoryUrl(asText(input.existingContext.repo));
  const nextAction =
    lifecycle === "finished"
      ? input.snapshot.prUrl
        ? "Open the Cursor PR, inspect the real code diff, and decide whether it is ready for review or needs changes."
        : "Open the Cursor monitor and inspect the finished outcome before treating this as ready."
      : lifecycle === "failed"
        ? "Repair the blocked Cursor lane or reroute the work before asking for review."
        : "Let Cursor keep running, then refresh the job again before asking for review.";

  return {
    ...input.existingContext,
    cursor_agent_status: input.snapshot.status,
    cursor_repository_url: repositoryUrl,
    cursor_monitor_url: input.snapshot.monitorUrl,
    cursor_pr_url: input.snapshot.prUrl,
    cursor_branch_name: input.snapshot.branchName,
    cursor_created_at: input.snapshot.createdAt,
    cursor_name: input.snapshot.name,
    cursor_auth_scheme: input.authScheme,
    cursor_latest_summary: input.latestAssistantText,
    cursor_last_checked_at: new Date().toISOString(),
    summary:
      lifecycle === "finished"
        ? input.latestAssistantText || "Cursor finished and produced a reviewable outcome."
        : lifecycle === "failed"
          ? "Cursor execution is blocked."
          : "Cursor execution is still running.",
    presentation_recommendation:
      lifecycle === "finished"
        ? input.snapshot.prUrl
          ? "Cursor finished with a PR. Review the diff and decide whether it is ready."
          : "Cursor finished. Inspect the monitor output before treating it as ready."
        : lifecycle === "failed"
          ? "Cursor is blocked and needs repair or rerouting."
          : "Cursor is still executing. Wait for completion or inspect the monitor.",
    presentation_status_label:
      lifecycle === "finished"
        ? "ready for review"
        : lifecycle === "failed"
          ? "blocked"
          : "execution launched",
    presentation_body: input.statusMessage,
    result_snapshot: input.statusMessage,
    review_state:
      lifecycle === "finished"
        ? "ready_for_review"
        : lifecycle === "failed"
          ? "needs_attention"
          : "execution_launched",
    job_completion_status:
      lifecycle === "finished"
        ? "done"
        : lifecycle === "failed"
          ? "error"
          : "launched",
    next_action: nextAction,
    operator_links: buildCursorOperatorLinks(input.snapshot, repositoryUrl),
  };
}

async function captureCursorOutcome(input: {
  jobId: number;
  task: string;
  lifecycle: "finished" | "failed";
  context: JsonRecord;
}): Promise<JsonRecord> {
  if (input.context.cursor_outcome_captured_at) {
    return input.context;
  }

  const supabase = getServiceClient();
  if (!supabase) return input.context;

  const repositoryUrl =
    asText(input.context.cursor_repository_url) ||
    normalizeCursorRepositoryUrl(asText(input.context.repo));
  const prUrl = asText(input.context.cursor_pr_url);
  const summary =
    asText(input.context.cursor_latest_summary) ||
    asText(input.context.summary) ||
    asText(input.context.presentation_recommendation) ||
    input.task;

  const content = JSON.stringify(
    {
      source: "cursor_agent",
      jobId: input.jobId,
      lifecycle: input.lifecycle,
      task: input.task,
      repositoryUrl,
      prUrl,
      summary,
      capturedAt: new Date().toISOString(),
    },
    null,
    2,
  );

  const { data, error } = await supabase
    .from("al_memories")
    .insert({
      category: input.lifecycle === "finished" ? "cursor_outcome_success" : "cursor_outcome_failure",
      content,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return input.context;
  }

  return {
    ...input.context,
    cursor_outcome_memory_id: data.id,
    cursor_outcome_captured_at: new Date().toISOString(),
  };
}

async function syncCursorPlannerTask(context: JsonRecord, lifecycle: "finished" | "failed", statusMessage: string) {
  const plannerTaskId = Number(context.planner_task_id);
  if (!Number.isFinite(plannerTaskId) || plannerTaskId <= 0) return;

  const details = [
    `Cursor lifecycle: ${lifecycle}`,
    asText(context.cursor_pr_url) ? `PR: ${asText(context.cursor_pr_url)}` : "",
    asText(context.cursor_monitor_url) ? `Monitor: ${asText(context.cursor_monitor_url)}` : "",
    shortText(statusMessage, 500),
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await updatePlannerTask(plannerTaskId, {
      details,
      status: lifecycle === "finished" ? "done" : "open",
      assignedTo: lifecycle === "finished" ? "al" : "al",
    });
  } catch {
    // Planner sync is helpful, but it should not block job refresh.
  }
}

export async function refreshManagedCursorJob(
  row: CursorOpenJobRow,
  options?: { force?: boolean; minAgeSeconds?: number },
): Promise<{
  refreshed: boolean;
  lifecycle: "running" | "finished" | "failed" | "unknown";
  statusMessage: string | null;
  error?: string;
}> {
  const context = parseContext(row.context);
  const agentId = asText(context.cursor_agent_id);
  if (!agentId || !process.env.CURSOR_AGENTS_API_KEY?.trim()) {
    return { refreshed: false, lifecycle: "unknown", statusMessage: null };
  }

  const minAgeSeconds = options?.minAgeSeconds ?? 120;
  const lastChecked = asText(context.cursor_last_checked_at);
  if (!options?.force && lastChecked) {
    const ageMs = Date.now() - new Date(lastChecked).getTime();
    if (Number.isFinite(ageMs) && ageMs >= 0 && ageMs < minAgeSeconds * 1000) {
      return { refreshed: false, lifecycle: "unknown", statusMessage: null };
    }
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return {
      refreshed: false,
      lifecycle: "unknown",
      statusMessage: null,
      error: "Supabase unavailable.",
    };
  }

  try {
    const runtime = await fetchCursorRuntime(agentId, row.task);
    let nextContext = buildCursorPresentationFields({
      task: row.task,
      existingContext: context,
      snapshot: runtime.snapshot,
      latestAssistantText: runtime.latestAssistantText,
      statusMessage: runtime.statusMessage,
      authScheme: runtime.authScheme,
    });
    const lifecycle = cursorLifecycleStatus(runtime.snapshot.status);

    if (lifecycle === "finished" || lifecycle === "failed") {
      nextContext = await captureCursorOutcome({
        jobId: row.id,
        task: row.task,
        lifecycle,
        context: nextContext,
      });
      await syncCursorPlannerTask(nextContext, lifecycle, runtime.statusMessage);
    }

    const payload: Record<string, unknown> = {
      result: runtime.statusMessage,
      context: JSON.stringify(nextContext),
    };

    if (lifecycle === "finished") {
      payload.status = "done";
      payload.completed_at = new Date().toISOString();
      payload.error_msg = null;
    } else if (lifecycle === "failed") {
      payload.status = "error";
      payload.completed_at = new Date().toISOString();
      payload.error_msg = runtime.statusMessage;
    }

    await supabase.from("al_jobs").update(payload).eq("id", row.id);

    return {
      refreshed: true,
      lifecycle,
      statusMessage: runtime.statusMessage,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cursor refresh failed.";
    await supabase
      .from("al_jobs")
      .update({
        context: JSON.stringify({
          ...context,
          cursor_last_checked_at: new Date().toISOString(),
          cursor_tracking_error: message,
        }),
      })
      .eq("id", row.id);

    return {
      refreshed: false,
      lifecycle: "unknown",
      statusMessage: null,
      error: message,
    };
  }
}

export async function refreshOpenCursorJobs(options?: {
  limit?: number;
  force?: boolean;
  minAgeSeconds?: number;
}): Promise<{
  scanned: number;
  refreshed: number;
  finished: number;
  failed: number;
  running: number;
  errors: Array<{ jobId: number; error: string }>;
}> {
  const supabase = getServiceClient();
  if (!supabase || !process.env.CURSOR_AGENTS_API_KEY?.trim()) {
    return { scanned: 0, refreshed: 0, finished: 0, failed: 0, running: 0, errors: [] };
  }

  const limit = options?.limit ?? 12;
  const { data, error } = await supabase
    .from("al_jobs")
    .select("id, task, status, context")
    .eq("job_type", "cursor_agent")
    .in("status", ["pending", "running", "launched"])
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return { scanned: 0, refreshed: 0, finished: 0, failed: 0, running: 0, errors: [] };
  }

  const results = await Promise.all(
    (data as CursorOpenJobRow[]).map((row) =>
      refreshManagedCursorJob(row, {
        force: options?.force,
        minAgeSeconds: options?.minAgeSeconds,
      }).then((result) => ({ row, result })),
    ),
  );

  return {
    scanned: results.length,
    refreshed: results.filter((entry) => entry.result.refreshed).length,
    finished: results.filter((entry) => entry.result.lifecycle === "finished").length,
    failed: results.filter((entry) => entry.result.lifecycle === "failed").length,
    running: results.filter((entry) => entry.result.lifecycle === "running").length,
    errors: results
      .filter((entry) => entry.result.error)
      .map((entry) => ({ jobId: entry.row.id, error: entry.result.error as string })),
  };
}
