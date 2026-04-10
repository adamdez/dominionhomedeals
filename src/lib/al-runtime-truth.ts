import { getServiceClient } from "@/lib/supabase";
import { inspectHostedBrowserVendorCartReviewStack } from "@/lib/browser-vendor-cart-hosted";

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
