import { updatePlannerTask } from "@/lib/al-planner";
import { getServiceClient } from "@/lib/supabase";

type JsonRecord = Record<string, unknown>;
type CursorAuthScheme = "bearer" | "basic";
export type CursorTaskType =
  | "landing_page"
  | "google_ads_copy"
  | "meta_ads_copy"
  | "marketing_copy"
  | "repo_implementation"
  | "bugfix"
  | "unknown";

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
  result?: string | null;
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

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function uniqueLines(values: Array<string | null | undefined>, limit = 4): string[] {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const text = asText(value);
    if (!text) continue;
    const normalized = normalizeForMatch(text);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(text);
    if (output.length >= limit) break;
  }
  return output;
}

function normalizePlaybookContent(value: string): string {
  return normalizeForMatch(
    value
      .replace(/^cursor playbook lesson \([^)]+\)\s*\d{4}-\d{2}-\d{2}:\s*/i, "")
      .replace(/^founder feedback \(\d{4}-\d{2}-\d{2}\):\s*/i, "")
      .replace(/^dez (preference|policy|decision) \(\d{4}-\d{2}-\d{2}\):\s*/i, ""),
  );
}

function normalizeCursorRepositoryUrl(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith("github.com/")) return `https://${normalized}`;
  return `https://github.com/${normalized.replace(/^github\.com\//i, "")}`;
}

function cursorTaskTypeKeywords(taskType: CursorTaskType): string[] {
  switch (taskType) {
    case "landing_page":
      return ["landing page", "hero", "headline", "conversion", "cta", "website"];
    case "google_ads_copy":
      return ["google ads", "google ad", "search ad", "rsa", "headline", "description"];
    case "meta_ads_copy":
      return ["meta ads", "facebook ads", "instagram ad", "primary text", "ad creative"];
    case "marketing_copy":
      return ["ad copy", "copy", "campaign", "offer", "message", "marketing"];
    case "repo_implementation":
      return ["repo", "component", "page", "implementation", "branch", "pr"];
    case "bugfix":
      return ["bug", "fix", "error", "issue", "regression"];
    default:
      return ["cursor"];
  }
}

function cursorTaskTypeLabel(taskType: CursorTaskType): string {
  switch (taskType) {
    case "landing_page":
      return "Landing page build";
    case "google_ads_copy":
      return "Google Ads copy";
    case "meta_ads_copy":
      return "Meta ads copy";
    case "marketing_copy":
      return "Marketing copy";
    case "repo_implementation":
      return "Repo implementation";
    case "bugfix":
      return "Bugfix";
    default:
      return "General Cursor work";
  }
}

function inferCursorTaskType(task: string, repo?: string | null): CursorTaskType {
  const haystack = `${task} ${repo || ""}`.toLowerCase();
  if (/google\s*ads|search\s*ads|rsa|responsive search/i.test(haystack)) return "google_ads_copy";
  if (/meta\s*ads|facebook\s*ads|instagram\s*ads|primary text|ad creative/i.test(haystack)) return "meta_ads_copy";
  if (/landing page|homepage|hero section|sales page|squeeze page/i.test(haystack)) return "landing_page";
  if (/ad copy|campaign copy|marketing copy|offer messaging/i.test(haystack)) return "marketing_copy";
  if (/bug|fix|error|issue|regression|broken/i.test(haystack)) return "bugfix";
  if (/repo|component|refactor|implement|page|branch|pull request|pr\b|website/i.test(haystack)) return "repo_implementation";
  return "unknown";
}

function buildCursorTaskTemplate(taskType: CursorTaskType): string[] {
  switch (taskType) {
    case "landing_page":
      return [
        "Build for real conversion, not just pretty layout.",
        "Keep the value proposition obvious above the fold.",
        "Use specific proof, CTA clarity, and mobile-respectful structure.",
        "Leave a reviewable artifact in the repo and summarize what changed.",
      ];
    case "google_ads_copy":
      return [
        "Write concrete, high-intent Google ad copy instead of generic slogans.",
        "Favor clarity, service fit, and commercial intent over fluff.",
        "Return structured ad assets that a human can review quickly.",
        "Surface any missing offer, geo, or trust details that weaken the ads.",
      ];
    case "meta_ads_copy":
      return [
        "Write direct-response Meta copy with a clear hook, offer, and next step.",
        "Do not rely on vague inspirational language.",
        "Make the copy feel human, specific, and scroll-stopping without sounding spammy.",
        "Return review-ready creative copy grouped clearly for fast approval.",
      ];
    case "marketing_copy":
      return [
        "Prioritize clarity, specificity, and believable offers.",
        "Do not produce generic AI-sounding marketing language.",
        "Return the copy in a reviewable format with obvious sections and variants.",
      ];
    case "bugfix":
      return [
        "Fix the concrete issue with minimal drift.",
        "Call out the root cause, the exact fix, and residual risk.",
        "Prefer reviewable diffs over broad unrelated cleanup.",
      ];
    case "repo_implementation":
      return [
        "Make the requested repo change directly and keep the branch reviewable.",
        "Summarize what changed, what remains, and what should be reviewed next.",
        "Avoid broad speculative refactors unless they are necessary for the task.",
      ];
    default:
      return [
        "Deliver a reviewable result, not a vague status update.",
        "Summarize what changed, what still needs review, and any blocker plainly.",
      ];
  }
}

function looksRelevantToCursorTaskType(content: string, taskType: CursorTaskType): boolean {
  const normalized = content.toLowerCase();
  if (normalized.includes("cursor")) return true;
  return cursorTaskTypeKeywords(taskType).some((keyword) => normalized.includes(keyword));
}

function extractCursorAgentIdFromText(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  const directMatch =
    text.match(/cursor\.com\/agents\/([A-Za-z0-9-]+)/i) ||
    text.match(/cursor\.com\/agents\?id=([A-Za-z0-9-]+)/i) ||
    text.match(/\bID:\s*([A-Za-z0-9-]+)/i) ||
    text.match(/Cursor agent dispatched \(([A-Za-z0-9-]+)\)/i);
  return directMatch?.[1] || null;
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

async function loadRelevantCursorLessons(taskType: CursorTaskType): Promise<string[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("al_memories")
    .select("category, content, updated_at")
    .in("category", [
      "cursor_playbook",
      "founder_feedback",
      "founder_policy",
      "founder_decision",
      "cursor_outcome_success",
      "cursor_outcome_failure",
    ])
    .order("updated_at", { ascending: false })
    .limit(120);

  if (error || !data) return [];

  const relevant = data
    .filter((entry) => looksRelevantToCursorTaskType(asText(entry.content) || "", taskType))
    .map((entry) => {
      const content = asText(entry.content) || "";
      if (entry.category === "cursor_outcome_success" || entry.category === "cursor_outcome_failure") {
        try {
          const parsed = JSON.parse(content) as JsonRecord;
          return asText(parsed.playbookSignal) || asText(parsed.summary) || content;
        } catch {
          return content;
        }
      }
      return content;
    });

  return uniqueLines(relevant, 5);
}

export async function buildCursorDispatchPrompt(input: {
  task: string;
  repo?: string | null;
}): Promise<{
  prompt: string;
  taskType: CursorTaskType;
  taskTypeLabel: string;
  appliedLessons: string[];
}> {
  const taskType = inferCursorTaskType(input.task, input.repo);
  const taskTypeLabel = cursorTaskTypeLabel(taskType);
  const baseRules = buildCursorTaskTemplate(taskType);
  const appliedLessons = await loadRelevantCursorLessons(taskType);

  const sections = [
    "You are a managed Cursor worker running under AL Boreland.",
    `Task class: ${taskTypeLabel}.`,
    "",
    "Primary assignment:",
    input.task.trim(),
    "",
    "Execution standard:",
    ...baseRules.map((line) => `- ${line}`),
    "",
    "Required final behavior:",
    "- Leave a reviewable repo artifact if code changes are made.",
    "- In your final assistant update, say what changed, what still needs review, and any blockers.",
    "- Do not pretend work is done if the artifact is weak or incomplete.",
  ];

  if (appliedLessons.length > 0) {
    sections.push("", "Founder and AL lessons for this class of Cursor work:");
    for (const lesson of appliedLessons) {
      sections.push(`- ${shortText(stripMarkdown(lesson), 260)}`);
    }
  }

  return {
    prompt: sections.join("\n"),
    taskType,
    taskTypeLabel,
    appliedLessons,
  };
}

export async function captureCursorFounderLearning(input: {
  message: string;
}): Promise<{ saved: boolean; memoryId?: number; taskType?: CursorTaskType }> {
  const raw = asText(input.message);
  if (!raw) return { saved: false };

  const lower = raw.toLowerCase();
  const durable =
    lower.includes("remember this") ||
    lower.includes("from now on") ||
    lower.includes("never again") ||
    lower.includes("must ") ||
    lower.includes("do not ") ||
    lower.includes("don't ") ||
    lower.includes("not acceptable") ||
    lower.includes("i need al to") ||
    lower.includes("i need you to");
  const cursorRelevant =
    lower.includes("cursor") ||
    /landing page|google ads|meta ads|facebook ads|instagram ads|ad copy|marketing copy|repo/i.test(lower);

  if (!durable || !cursorRelevant) {
    return { saved: false };
  }

  const taskType = inferCursorTaskType(raw);
  const supabase = getServiceClient();
  if (!supabase) return { saved: false, taskType };

  const content = `Cursor playbook lesson (${taskType}) ${new Date().toISOString().slice(0, 10)}: ${raw
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900)}`;
  const normalized = normalizePlaybookContent(content);

  const { data: existingRows, error: existingError } = await supabase
    .from("al_memories")
    .select("id, content")
    .eq("category", "cursor_playbook")
    .order("updated_at", { ascending: false })
    .limit(80);

  if (existingError) {
    return { saved: false, taskType };
  }

  const existing = (existingRows || []).find(
    (entry) => normalizePlaybookContent(asText(entry.content) || "") === normalized,
  );

  if (existing) {
    await supabase
      .from("al_memories")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return { saved: true, memoryId: existing.id, taskType };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("al_memories")
    .insert({ category: "cursor_playbook", content })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return { saved: false, taskType };
  }

  return { saved: true, memoryId: inserted.id, taskType };
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
  const taskType = inferCursorTaskType(
    input.task,
    asText(input.context.cursor_repository_url) || asText(input.context.repo),
  );
  const summary =
    asText(input.context.cursor_latest_summary) ||
    asText(input.context.summary) ||
    asText(input.context.presentation_recommendation) ||
    input.task;
  const playbookSignal =
    input.lifecycle === "finished"
      ? `For ${cursorTaskTypeLabel(taskType).toLowerCase()} work, keep asking Cursor for review-ready artifacts and a plain final summary instead of treating launch alone as progress.`
      : `For ${cursorTaskTypeLabel(taskType).toLowerCase()} work, AL should inspect Cursor status early and reroute quickly when the run blocks or stalls.`;

  const content = JSON.stringify(
    {
      source: "cursor_agent",
      jobId: input.jobId,
      lifecycle: input.lifecycle,
      taskType,
      task: input.task,
      repositoryUrl,
      prUrl,
      summary,
      playbookSignal,
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
    cursor_task_type: taskType,
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
  const agentId =
    asText(context.cursor_agent_id) ||
    extractCursorAgentIdFromText(asText(context.cursor_monitor_url)) ||
    extractCursorAgentIdFromText(asText(context.presentation_body)) ||
    extractCursorAgentIdFromText(asText(context.result_snapshot)) ||
    extractCursorAgentIdFromText(row.result || null);
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
    .select("id, task, status, context, result")
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
