import { getServiceClient } from "@/lib/supabase";
import { inspectHostedBrowserVendorCartReviewStack } from "@/lib/browser-vendor-cart-hosted";
import { getLatestRemoteBridgeHeartbeat } from "@/lib/al-remote-bridge";

export type RuntimeLaneStatus = "live" | "degraded" | "blocked";
export type RuntimeMode = "hosted" | "local-bridge" | "mixed";

export interface RuntimeCheck {
  ok: boolean;
  detail: string;
}

export interface RuntimeLaneTruth {
  id: string;
  label: string;
  status: RuntimeLaneStatus;
  primaryMode: RuntimeMode;
  fallbackMode: RuntimeMode | null;
  detail: string;
  nextAction: string;
  outcome: string;
}

export interface HostedRuntimeTruth {
  generatedAt: string;
  deployment: {
    environment: string;
    deploymentId: string | null;
    gitCommitSha: string | null;
    gitCommitRef: string | null;
  };
  checks: Record<string, RuntimeCheck>;
  lanes: RuntimeLaneTruth[];
  summary: {
    live: number;
    degraded: number;
    blocked: number;
  };
}

function readEnvSecret(key: string): string {
  const value = process.env[key]?.trim() || "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function summarizeLaneCounts(lanes: RuntimeLaneTruth[]) {
  return lanes.reduce(
    (acc, lane) => {
      acc[lane.status] += 1;
      return acc;
    },
    { live: 0, degraded: 0, blocked: 0 } as HostedRuntimeTruth["summary"],
  );
}

export async function buildHostedRuntimeTruth(): Promise<HostedRuntimeTruth> {
  const checks: Record<string, RuntimeCheck> = {};

  const openAiKey = readEnvSecret("OPENAI_API_KEY");
  const anthropicKey = readEnvSecret("ANTHROPIC_API_KEY");
  const supabaseUrl = readEnvSecret("NEXT_PUBLIC_SUPABASE_URL");
  const delegateSecret =
    readEnvSecret("AL_DELEGATE_SECRET") || readEnvSecret("SUPABASE_SERVICE_ROLE_KEY");
  const cursorKey = readEnvSecret("CURSOR_AGENTS_API_KEY");
  const openClawSecret =
    readEnvSecret("AL_OPENCLAW_SHARED_SECRET") || readEnvSecret("OPENCLAW_AL_SHARED_SECRET");
  const remoteBridgeSecret =
    readEnvSecret("AL_REMOTE_BRIDGE_SECRET") || readEnvSecret("REMOTE_BRIDGE_SHARED_SECRET");
  const remoteBridgeHeartbeat = await getLatestRemoteBridgeHeartbeat();
  const remoteBridgeHeartbeatAgeMinutes =
    remoteBridgeHeartbeat?.observedAt
      ? Math.max(0, Math.round((Date.now() - new Date(remoteBridgeHeartbeat.observedAt).getTime()) / 60000))
      : null;
  const remoteBridgeHeartbeatFresh =
    remoteBridgeHeartbeatAgeMinutes !== null && Number.isFinite(remoteBridgeHeartbeatAgeMinutes)
      ? remoteBridgeHeartbeatAgeMinutes <= 5
      : false;
  const remoteCoworkStatus = remoteBridgeHeartbeat?.coworkProbe?.status || null;
  const remoteCoworkDetail = remoteBridgeHeartbeat?.coworkProbe?.detail?.trim() || null;
  const remoteCoworkNeedsAuthRefresh =
    remoteCoworkStatus === "auth_invalid" ||
    (remoteCoworkDetail
      ? /invalid api key|invalid authentication credentials|refresh claude login/i.test(
          remoteCoworkDetail,
        )
      : false);

  checks.reasoning_openai = {
    ok: Boolean(openAiKey),
    detail: openAiKey
      ? "OPENAI_API_KEY present for primary chairman reasoning."
      : "OPENAI_API_KEY missing.",
  };
  checks.reasoning_anthropic = {
    ok: Boolean(anthropicKey),
    detail: anthropicKey
      ? "ANTHROPIC_API_KEY present as legacy drift, not as an approved chairman primary."
      : "ANTHROPIC_API_KEY missing.",
  };
  checks.delegation_env = {
    ok: Boolean(supabaseUrl && delegateSecret),
    detail:
      supabaseUrl && delegateSecret
        ? "Supabase URL and delegate secret are configured."
        : "NEXT_PUBLIC_SUPABASE_URL or AL_DELEGATE_SECRET/SUPABASE_SERVICE_ROLE_KEY missing.",
  };
  checks.cursor_agents = {
    ok: Boolean(cursorKey),
    detail: cursorKey
      ? "CURSOR_AGENTS_API_KEY present for hosted code execution fallback."
      : "CURSOR_AGENTS_API_KEY missing.",
  };
  checks.openclaw_ingress = {
    ok: Boolean(openClawSecret),
    detail: openClawSecret
      ? "OpenClaw shared secret present for authenticated AL ingress."
      : "AL_OPENCLAW_SHARED_SECRET / OPENCLAW_AL_SHARED_SECRET missing.",
  };
  checks.remote_bridge_relay = {
    ok: Boolean(remoteBridgeSecret && remoteBridgeHeartbeatFresh),
    detail: !remoteBridgeSecret
      ? "AL_REMOTE_BRIDGE_SECRET / REMOTE_BRIDGE_SHARED_SECRET missing."
      : remoteBridgeHeartbeatFresh
        ? `Remote desktop relay heartbeat is fresh (${remoteBridgeHeartbeatAgeMinutes}m ago).`
        : remoteBridgeHeartbeat
          ? `Remote desktop relay heartbeat is stale (${remoteBridgeHeartbeatAgeMinutes}m ago).`
          : "No remote desktop relay heartbeat has been observed yet.",
  };

  try {
    const sb = getServiceClient();
    if (!sb) {
      throw new Error("No Supabase service client.");
    }
    const { error: memoriesError } = await sb
      .from("al_memories")
      .select("id", { head: true, count: "exact" });
    if (memoriesError) throw memoriesError;
    checks.supabase_service = {
      ok: true,
      detail: "Supabase service client query succeeded.",
    };
  } catch (error) {
    checks.supabase_service = {
      ok: false,
      detail: error instanceof Error ? error.message : "Unknown Supabase error.",
    };
  }

  const hostedBrowser = inspectHostedBrowserVendorCartReviewStack();
  checks.hosted_browser = {
    ok: hostedBrowser.available,
    detail: hostedBrowser.available
      ? "Browserbase + Stagehand hosted browser execution is configured."
      : `Hosted browser unavailable: ${hostedBrowser.missingAccess.join(", ") || "unknown"}.`,
  };

  const lanes: RuntimeLaneTruth[] = [
    {
      id: "openclaw_ingress",
      label: "OpenClaw mobile and automation ingress",
      status: openClawSecret ? "live" : "blocked",
      primaryMode: "hosted",
      fallbackMode: null,
      detail: openClawSecret
        ? "OpenClaw can route authenticated operator and automation traffic into the same AL runtime."
        : "OpenClaw ingress secret is not configured yet.",
      nextAction: openClawSecret
        ? "Keep the command contract narrow and test one trusted channel first."
        : "Set AL_OPENCLAW_SHARED_SECRET or OPENCLAW_AL_SHARED_SECRET before enabling OpenClaw ingress.",
      outcome: "Mobile command access and recurring automation use the same AL truth surfaces instead of creating a second assistant.",
    },
    {
      id: "desktop_relay",
      label: "Remote desktop relay",
      status: !remoteBridgeSecret
        ? "blocked"
        : remoteBridgeHeartbeatFresh &&
            remoteBridgeHeartbeat?.capabilities?.codex_execution === true &&
            remoteBridgeHeartbeat?.coworkProbe?.ok === true
          ? "live"
          : "degraded",
      primaryMode: "hosted",
      fallbackMode: "local-bridge",
      detail: !remoteBridgeSecret
        ? "Remote desktop relay secret is not configured yet."
        : !remoteBridgeHeartbeat
          ? "Hosted AL can queue desktop work, but no bridge heartbeat has been observed yet."
          : remoteBridgeHeartbeatFresh
            ? `Desktop relay heartbeat is fresh (${remoteBridgeHeartbeatAgeMinutes}m ago); Codex is ${remoteBridgeHeartbeat.capabilities?.codex_execution === true ? "live" : "degraded"} and Claude cowork is ${remoteBridgeHeartbeat.coworkProbe?.ok === true ? "live" : remoteCoworkNeedsAuthRefresh ? `blocked by auth (${remoteCoworkDetail || remoteCoworkStatus || "unknown"})` : "degraded"}.`
            : `Desktop relay heartbeat is stale (${remoteBridgeHeartbeatAgeMinutes}m ago), so off-machine desktop work is not trustworthy right now.`,
      nextAction: remoteBridgeSecret
        ? remoteBridgeHeartbeatFresh
          ? remoteCoworkNeedsAuthRefresh
            ? "Keep the desktop bridge alive, then refresh Claude login on Dez's machine or replace the stale Anthropic executor key."
            : "Keep the desktop bridge alive, and repair Claude cowork if it stays degraded."
          : "Get the desktop bridge polling again so hosted AL has a fresh heartbeat before relying on remote work."
        : "Set AL_REMOTE_BRIDGE_SECRET / REMOTE_BRIDGE_SHARED_SECRET and restart hosted + local bridge runtimes.",
      outcome: "Hosted AL can reach Codex, cowork, and local file labor even when Dez is away from the machine.",
    },
    {
      id: "chairman_reasoning",
      label: "Chairman reasoning",
      status: openAiKey ? "live" : "blocked",
      primaryMode: "hosted",
      fallbackMode: null,
      detail: openAiKey
        ? "OpenAI-only chairman reasoning is configured."
        : anthropicKey
          ? "OPENAI_API_KEY is missing. Anthropic is present, but chairman reasoning is intentionally not allowed to fall back there."
          : "OPENAI_API_KEY is missing for chairman reasoning.",
      nextAction: openAiKey
        ? "Keep smoke-testing hosted chat after deploy."
        : "Set OPENAI_API_KEY in the hosted runtime.",
      outcome: "Reliable executive reasoning without hidden provider drift.",
    },
    {
      id: "ceo_delegation",
      label: "CEO delegation",
      status: supabaseUrl && delegateSecret ? "live" : "blocked",
      primaryMode: "hosted",
      fallbackMode: null,
      detail:
        supabaseUrl && delegateSecret
          ? "Hosted delegation path can create and dispatch CEO jobs."
          : "Delegation env contract is incomplete.",
      nextAction:
        supabaseUrl && delegateSecret
          ? "Run delegation smoke tests after deploy."
          : "Set NEXT_PUBLIC_SUPABASE_URL and AL_DELEGATE_SECRET/SUPABASE_SERVICE_ROLE_KEY.",
      outcome: "Named CEO ownership and async accountability stay live.",
    },
    {
      id: "hosted_browser_vendor_cart_review",
      label: "Hosted browser commerce",
      status: hostedBrowser.available ? "live" : "degraded",
      primaryMode: "hosted",
      fallbackMode: "local-bridge",
      detail: hostedBrowser.available
        ? "Browserbase + Stagehand is the primary browser execution lane."
        : `Hosted browser blocked (${hostedBrowser.missingAccess.join(", ") || "unknown"}), local bridge fallback still required.`,
      nextAction: hostedBrowser.available
        ? "Use hosted browser first; local bridge remains fallback/debug."
        : "Restore hosted browser env/config or rely on local bridge fallback.",
      outcome: "Vendor/design/cart flows stay review-safe without depending on one machine.",
    },
    {
      id: "media_production",
      label: "Brand media production",
      status: "degraded",
      primaryMode: "local-bridge",
      fallbackMode: null,
      detail:
        "Media generation currently depends on the operator-connected local bridge for source-photo access, Runway rendering, and artifact packaging.",
      nextAction:
        "Keep the local bridge connected for media jobs; use hosted AL health plus local bridge health together before claiming this lane live end to end.",
      outcome: "Simon-led website and brand assets can be generated and reviewed with truthful source control.",
    },
    {
      id: "website_brand_media_production",
      label: "Website brand/media production",
      status:
        openAiKey && (cursorKey || hostedBrowser.available)
          ? "degraded"
          : "blocked",
      primaryMode: "mixed",
      fallbackMode: "local-bridge",
      detail:
        "Website production is mixed-mode: hosted reasoning plus review routes, with local bridge media generation and code/browser execution as needed.",
      nextAction:
        "Use runtime truth to confirm hosted reasoning is live and local bridge is connected before running Simon-led site production jobs.",
      outcome: "WrenchReady site updates can keep moving even when one tool lane degrades.",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    deployment: {
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
    },
    checks,
    lanes,
    summary: summarizeLaneCounts(lanes),
  };
}
