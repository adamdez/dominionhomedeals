import { getServiceClient } from "@/lib/supabase";

export const REMOTE_BRIDGE_JOB_TYPE = "remote_bridge_bundle";
export const REMOTE_BRIDGE_HEARTBEAT_JOB_TYPE = "remote_bridge_heartbeat";

export interface RemoteBridgeRequest {
  id: string;
  name: string;
  input: Record<string, unknown>;
  accountabilityJobId?: number;
}

export interface RemoteBridgeImageResult {
  type: "image";
  base64: string;
  mimeType: string;
  path: string;
}

export type RemoteBridgeRequestResult = {
  id: string;
  name: string;
  result: string | RemoteBridgeImageResult;
};

export interface RemoteBridgeBundle {
  jobId: number;
  status: string;
  task: string;
  requests: RemoteBridgeRequest[];
  results: RemoteBridgeRequestResult[];
  claimedAt: string | null;
  claimedBy: string | null;
  completedAt: string | null;
}

export interface RemoteBridgeHeartbeatSnapshot {
  clientId: string;
  observedAt: string;
  relayApiBase: string | null;
  bridgeAuthRequired: boolean;
  capabilities: Record<string, boolean>;
  coworkProbe: {
    ok: boolean;
    status: string;
    detail: string;
  } | null;
}

type JsonRecord = Record<string, unknown>;

function parseContext(raw: unknown): JsonRecord {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as JsonRecord)
        : {};
    } catch {
      return {};
    }
  }

  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as JsonRecord)
    : {};
}

function asRequest(value: unknown): RemoteBridgeRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const input =
    record.input && typeof record.input === "object" && !Array.isArray(record.input)
      ? (record.input as Record<string, unknown>)
      : {};
  const accountabilityJobId =
    Number.isInteger(Number(record.accountabilityJobId)) && Number(record.accountabilityJobId) > 0
      ? Number(record.accountabilityJobId)
      : undefined;
  if (!id || !name) return null;
  return { id, name, input, accountabilityJobId };
}

function asResult(value: unknown): RemoteBridgeRequestResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const rawResult = record.result;
  const result =
    rawResult &&
    typeof rawResult === "object" &&
    !Array.isArray(rawResult) &&
    (rawResult as Record<string, unknown>).type === "image"
      ? ({
          type: "image",
          base64: String((rawResult as Record<string, unknown>).base64 || ""),
          mimeType: String((rawResult as Record<string, unknown>).mimeType || "image/png"),
          path: String((rawResult as Record<string, unknown>).path || ""),
        } satisfies RemoteBridgeImageResult)
      : typeof rawResult === "string"
        ? rawResult
        : JSON.stringify(rawResult ?? "");
  if (!id || !name) return null;
  return { id, name, result };
}

function rowToBundle(row: {
  id: number;
  status: string | null;
  task: string | null;
  context: unknown;
  completed_at?: string | null;
}): RemoteBridgeBundle {
  const context = parseContext(row.context);
  const requests = Array.isArray(context.requests)
    ? context.requests
        .map(asRequest)
        .filter((entry): entry is RemoteBridgeRequest => Boolean(entry))
    : [];
  const results = Array.isArray(context.results)
    ? context.results
        .map(asResult)
        .filter((entry): entry is RemoteBridgeRequestResult => Boolean(entry))
    : [];

  return {
    jobId: row.id,
    status: typeof row.status === "string" ? row.status : "pending",
    task: typeof row.task === "string" ? row.task : "Remote bridge bundle",
    requests,
    results,
    claimedAt: typeof context.claimed_at === "string" ? context.claimed_at : null,
    claimedBy: typeof context.claimed_by === "string" ? context.claimed_by : null,
    completedAt:
      typeof context.completed_at === "string"
        ? context.completed_at
        : typeof row.completed_at === "string"
          ? row.completed_at
          : null,
  };
}

export function readRemoteBridgeSharedSecret(): string {
  return (
    process.env.AL_REMOTE_BRIDGE_SECRET?.trim() ||
    process.env.REMOTE_BRIDGE_SHARED_SECRET?.trim() ||
    ""
  );
}

export function isRemoteBridgeConfigured(): boolean {
  return Boolean(readRemoteBridgeSharedSecret());
}

function rowToHeartbeat(row: {
  context: unknown;
}): RemoteBridgeHeartbeatSnapshot | null {
  const context = parseContext(row.context);
  const clientId = typeof context.client_id === "string" ? context.client_id.trim() : "";
  const observedAt =
    typeof context.observed_at === "string" && context.observed_at.trim()
      ? context.observed_at.trim()
      : "";
  if (!clientId || !observedAt) return null;

  const capabilities =
    context.capabilities && typeof context.capabilities === "object" && !Array.isArray(context.capabilities)
      ? Object.fromEntries(
          Object.entries(context.capabilities as Record<string, unknown>).map(([key, value]) => [
            key,
            value === true,
          ]),
        )
      : {};
  const coworkRecord =
    context.cowork_probe && typeof context.cowork_probe === "object" && !Array.isArray(context.cowork_probe)
      ? (context.cowork_probe as Record<string, unknown>)
      : null;

  return {
    clientId,
    observedAt,
    relayApiBase:
      typeof context.relay_api_base === "string" && context.relay_api_base.trim()
        ? context.relay_api_base.trim()
        : null,
    bridgeAuthRequired: context.bridge_auth_required === true,
    capabilities,
    coworkProbe: coworkRecord
      ? {
          ok: coworkRecord.ok === true,
          status:
            typeof coworkRecord.status === "string" && coworkRecord.status.trim()
              ? coworkRecord.status.trim()
              : "unknown",
          detail:
            typeof coworkRecord.detail === "string" && coworkRecord.detail.trim()
              ? coworkRecord.detail.trim()
              : "No cowork detail reported.",
        }
      : null,
  };
}

export async function enqueueRemoteBridgeBundle(input: {
  requests: RemoteBridgeRequest[];
  requestedBy?: string;
}): Promise<{ jobId: number } | { error: string }> {
  const supabase = getServiceClient();
  if (!supabase) return { error: "No database connection." };

  const timestamp = new Date().toISOString();
  const context = {
    requests: input.requests,
    requested_at: timestamp,
    requested_by: input.requestedBy || "authenticated_al_operator",
    relay_mode: "hosted_polling",
    results: [],
  };

  const { data, error } = await supabase
    .from("al_jobs")
    .insert({
      job_type: REMOTE_BRIDGE_JOB_TYPE,
      task: `Remote bridge bundle (${input.requests.length} request${input.requests.length === 1 ? "" : "s"})`,
      context: JSON.stringify(context),
      status: "pending",
      triggered_by: "al_remote_bridge_dispatch",
      started_at: timestamp,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { error: error?.message || "Could not enqueue remote bridge bundle." };
  }

  return { jobId: Number(data.id) };
}

export async function recordRemoteBridgeHeartbeat(
  heartbeat: RemoteBridgeHeartbeatSnapshot,
): Promise<boolean> {
  const supabase = getServiceClient();
  if (!supabase) return false;

  const payload = {
    client_id: heartbeat.clientId,
    observed_at: heartbeat.observedAt,
    relay_api_base: heartbeat.relayApiBase,
    bridge_auth_required: heartbeat.bridgeAuthRequired,
    capabilities: heartbeat.capabilities,
    cowork_probe: heartbeat.coworkProbe,
  };

  const { error } = await supabase.from("al_jobs").insert({
    job_type: REMOTE_BRIDGE_HEARTBEAT_JOB_TYPE,
    task: `Remote bridge heartbeat (${heartbeat.clientId})`,
    context: JSON.stringify(payload),
    status: "done",
    triggered_by: "al_remote_bridge_heartbeat",
    started_at: heartbeat.observedAt,
    completed_at: heartbeat.observedAt,
    result: JSON.stringify(payload),
  });

  return !error;
}

export async function getLatestRemoteBridgeHeartbeat(): Promise<RemoteBridgeHeartbeatSnapshot | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("al_jobs")
    .select("context")
    .eq("job_type", REMOTE_BRIDGE_HEARTBEAT_JOB_TYPE)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToHeartbeat(data as { context: unknown });
}

export async function getRemoteBridgeBundle(jobId: number): Promise<RemoteBridgeBundle | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("al_jobs")
    .select("id, status, task, context, completed_at")
    .eq("id", jobId)
    .eq("job_type", REMOTE_BRIDGE_JOB_TYPE)
    .single();

  if (error || !data) return null;
  return rowToBundle(
    data as {
      id: number;
      status: string | null;
      task: string | null;
      context: unknown;
      completed_at?: string | null;
    },
  );
}

export async function claimNextRemoteBridgeBundle(clientId: string): Promise<RemoteBridgeBundle | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("al_jobs")
    .select("id, status, task, context, completed_at")
    .eq("job_type", REMOTE_BRIDGE_JOB_TYPE)
    .eq("status", "pending")
    .order("id", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0] as {
    id: number;
    status: string | null;
    task: string | null;
    context: unknown;
    completed_at?: string | null;
  };
  const existingContext = parseContext(row.context);
  const nextContext = {
    ...existingContext,
    claimed_at: new Date().toISOString(),
    claimed_by: clientId,
  };

  const { data: claimed, error: updateError } = await supabase
    .from("al_jobs")
    .update({
      status: "running",
      context: JSON.stringify(nextContext),
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id, status, task, context, completed_at")
    .single();

  if (updateError || !claimed) {
    return null;
  }

  return rowToBundle(
    claimed as {
      id: number;
      status: string | null;
      task: string | null;
      context: unknown;
      completed_at?: string | null;
    },
  );
}

export async function completeRemoteBridgeBundle(input: {
  jobId: number;
  results: RemoteBridgeRequestResult[];
  isError: boolean;
  clientId: string;
  errorMessage?: string | null;
}): Promise<boolean> {
  const supabase = getServiceClient();
  if (!supabase) return false;

  const current = await getRemoteBridgeBundle(input.jobId);
  const currentContext = current
    ? parseContext({
        claimed_at: current.claimedAt,
        claimed_by: current.claimedBy,
      })
    : {};
  const completedAt = new Date().toISOString();
  const nextContext = {
    ...currentContext,
    completed_at: completedAt,
    completed_by: input.clientId,
    results: input.results,
    error_message: input.errorMessage || null,
  };

  const payload = input.isError
    ? {
        status: "error",
        error_msg: input.errorMessage || "Remote bridge bundle failed.",
        result: JSON.stringify(input.results),
        completed_at: completedAt,
        context: JSON.stringify(nextContext),
      }
    : {
        status: "done",
        result: JSON.stringify(input.results),
        completed_at: completedAt,
        context: JSON.stringify(nextContext),
      };

  const { error } = await supabase.from("al_jobs").update(payload).eq("id", input.jobId);
  return !error;
}
