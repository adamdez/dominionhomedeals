import { buildAttentionBrief } from "@/lib/al-attention-brief";
import { buildOperationalProofReport } from "@/lib/al-operational-proof";
import { listPlannerTasks } from "@/lib/al-planner";
import {
  buildHostedBoardroomHomePath,
  buildHostedLaborLanesPath,
  buildHostedOperationalProofPath,
  buildHostedPlannerPath,
  fetchBoardroomQueueSnapshot,
} from "@/lib/al-review";
import { getLatestRemoteBridgeHeartbeat } from "@/lib/al-remote-bridge";
import {
  buildHostedDominionLeadsPath,
  getDominionLeadDashboard,
} from "@/lib/dominion-leads";
import {
  getWrenchReadyDayReadinessSummary,
} from "@/lib/wrenchready-day-readiness";

export type LaborLaneStatus = "live" | "warning" | "blocked";

export interface LaborLane {
  id:
    | "executive_control"
    | "it_systems"
    | "marketing_creative"
    | "customer_service"
    | "accounting_finance";
  title: string;
  owner: string;
  coverage: string;
  status: LaborLaneStatus;
  summary: string;
  nextMove: string;
  href: string;
  sourceOfTruth: string[];
  executionSurfaces: string[];
  evidence: string[];
}

export interface LaborLaneReport {
  generatedAt: string;
  headline: string;
  topNextMove: string;
  summary: {
    live: number;
    warning: number;
    blocked: number;
  };
  lanes: LaborLane[];
}

const CANONICAL_AL_ORIGIN =
  process.env.AL_CANONICAL_ORIGIN?.trim().replace(/\/+$/, "") ||
  "https://al.dominionhomedeals.com";

function absolutePath(origin: string, path: string) {
  return `${origin.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function minutesSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.round((Date.now() - timestamp) / 60000));
}

function openClawSharedSecretConfigured() {
  return Boolean(
    process.env.AL_OPENCLAW_SHARED_SECRET?.trim() ||
      process.env.OPENCLAW_AL_SHARED_SECRET?.trim(),
  );
}

function isCreativeItem(input: {
  jobType?: string | null;
  title?: string | null;
  summary?: string | null;
  task?: string | null;
}) {
  const jobType = String(input.jobType || "").toLowerCase();
  if (
    jobType === "browser_commerce_design" ||
    jobType === "media_production" ||
    jobType === "website_brand_media_production"
  ) {
    return true;
  }

  const haystack = [
    input.title,
    input.summary,
    input.task,
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  return /creative|hero|decal|trifold|tri-fold|brochure|signage|wrap|brand media|website refresh|homepage/i.test(
    haystack,
  );
}

function financeTaskSummary(tasks: Awaited<ReturnType<typeof listPlannerTasks>>) {
  const financeTasks = tasks.filter((task) =>
    /(account|bookkeep|invoice|billing|bank|tax|stcu|finance|payment)/i.test(
      `${task.title} ${task.details} ${task.source}`,
    ),
  );
  const open = financeTasks.filter((task) => task.status === "open");
  const overdue = open.filter(
    (task) => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10),
  );

  return {
    financeTasks,
    open,
    overdue,
  };
}

function severityRank(status: LaborLaneStatus) {
  if (status === "blocked") return 3;
  if (status === "warning") return 2;
  return 1;
}

export async function buildLaborLaneReport(input?: {
  host?: string | null;
  origin?: string | null;
}): Promise<LaborLaneReport> {
  const host = input?.host || "al.dominionhomedeals.com";
  const origin = input?.origin?.trim() || CANONICAL_AL_ORIGIN;

  const [
    operationalProof,
    attentionBrief,
    plannerTasks,
    boardroomSnapshot,
    dominionDashboard,
    wrenchReadySummary,
    remoteBridgeHeartbeat,
  ] = await Promise.all([
    buildOperationalProofReport({ host, origin }),
    buildAttentionBrief({ host, origin }),
    listPlannerTasks(),
    fetchBoardroomQueueSnapshot(host, 24),
    getDominionLeadDashboard(48),
    getWrenchReadyDayReadinessSummary(null, { host, origin }),
    getLatestRemoteBridgeHeartbeat(),
  ]);

  const executiveControl: LaborLane = {
    id: "executive_control",
    title: "Executive control",
    owner: "AL",
    coverage: "Chairman judgment, attention, approvals, Planner truth, and cross-business follow-through.",
    status:
      operationalProof.summary.failing > 0
        ? "blocked"
        : operationalProof.summary.warning > 0 ||
            attentionBrief.waitingOnDez.length > 0 ||
            attentionBrief.waitingOnAl.length > 0
          ? "warning"
          : "live",
    summary: `${operationalProof.summary.healthy} healthy loops, ${operationalProof.summary.warning} warning loops, ${operationalProof.summary.failing} failing loops.`,
    nextMove: operationalProof.topNextMove,
    href: absolutePath(origin, buildHostedOperationalProofPath(host)),
    sourceOfTruth: [
      "Operational Proof",
      "Attention Brief",
      "Board Room",
      "Planner",
    ],
    executionSurfaces: [
      "Command Center",
      "Operational Proof",
      "Attention",
      "Board Room",
      "Planner",
    ],
    evidence: [
      attentionBrief.waitingOnDez.length > 0
        ? `${attentionBrief.waitingOnDez.length} items currently wait on Dez.`
        : "Nothing critical currently waits on Dez.",
      attentionBrief.waitingOnAl.length > 0
        ? `${attentionBrief.waitingOnAl.length} items currently wait on AL.`
        : "Nothing critical currently waits on AL.",
      operationalProof.summary.failing > 0
        ? `${operationalProof.summary.failing} control loop(s) are failing and should not be trusted yet.`
        : "No control loops are currently in a failing state.",
    ],
  };

  const relayHeartbeatAgeMinutes = minutesSince(remoteBridgeHeartbeat?.observedAt);
  const relayHeartbeatFresh = relayHeartbeatAgeMinutes !== null && relayHeartbeatAgeMinutes <= 5;
  const codexLive = remoteBridgeHeartbeat?.capabilities?.codex_execution === true;
  const coworkLive = remoteBridgeHeartbeat?.coworkProbe?.ok === true;
  const openClawReady = openClawSharedSecretConfigured();
  const itSystems: LaborLane = {
    id: "it_systems",
    title: "IT and systems",
    owner: "AL",
    coverage: "Phone access, desktop relay, Codex, cowork, OpenClaw ingress, and local machine labor.",
    status:
      !remoteBridgeHeartbeat || !relayHeartbeatFresh
        ? "blocked"
        : codexLive && coworkLive && openClawReady
          ? "live"
          : "warning",
    summary: !remoteBridgeHeartbeat
      ? "No desktop relay heartbeat has reached hosted AL yet."
      : `Desktop relay is ${relayHeartbeatFresh ? "fresh" : "stale"}, Codex is ${
          codexLive ? "live" : "not confirmed"
        }, Claude cowork is ${coworkLive ? "live" : "degraded"}, and OpenClaw ingress is ${
          openClawReady ? "configured" : "not configured"
        }.`,
    nextMove: !remoteBridgeHeartbeat || !relayHeartbeatFresh
      ? "Repair the desktop relay first so AL can actually work from your phone."
      : !openClawReady
        ? "Finish the OpenClaw ingress secret so mobile delegation becomes a real operating door."
        : !coworkLive
          ? "Repair the cowork lane so Claude backup is trustworthy when Codex is not the right fit."
          : "Keep verifying the off-machine path from a real phone, not just localhost.",
    href: absolutePath(origin, buildHostedOperationalProofPath(host)),
    sourceOfTruth: [
      "Remote bridge heartbeat",
      "Operational Proof",
      "Hosted AL health",
    ],
    executionSurfaces: [
      "Remote bridge",
      "Codex",
      "Claude cowork",
      "OpenClaw",
      "Hosted AL",
    ],
    evidence: [
      remoteBridgeHeartbeat
        ? `Last desktop heartbeat arrived ${relayHeartbeatAgeMinutes} minute(s) ago from ${remoteBridgeHeartbeat.clientId}.`
        : "No desktop relay heartbeat is present.",
      `Codex desktop lane is ${codexLive ? "live" : "not confirmed"} and Claude cowork is ${
        coworkLive ? "live" : "not healthy"
      }.`,
      openClawReady
        ? "OpenClaw shared secret is configured."
        : "OpenClaw shared secret is still missing from the runtime.",
    ],
  };

  const creativeItems = [
    ...boardroomSnapshot.visible,
    ...boardroomSnapshot.buried,
  ].filter((item) =>
    isCreativeItem({
      jobType: item.jobType,
      title: item.title,
      summary: item.summary,
      task: item.task,
    }),
  );
  const creativeReviewReady = creativeItems.filter((item) => item.bucket === "review_now").length;
  const creativeCleanup = creativeItems.filter((item) => item.bucket !== "review_now").length;
  const creativeBuried = boardroomSnapshot.buried.filter((item) =>
    isCreativeItem({
      jobType: item.jobType,
      title: item.title,
      summary: item.summary,
      task: item.task,
    }),
  ).length;
  const marketingCreative: LaborLane = {
    id: "marketing_creative",
    title: "Marketing and creative",
    owner: "AL with Tom and Jerry oversight",
    coverage: "Hero media, decals, tri-folds, website packages, review-ready creative proof, and growth materials.",
    status:
      creativeCleanup > 0 && creativeReviewReady === 0
        ? "blocked"
        : creativeCleanup > 0 || creativeBuried > 0
          ? "warning"
          : "live",
    summary:
      creativeItems.length === 0
        ? "No active creative package is currently in Board Room."
        : `${creativeReviewReady} creative package(s) are review-ready, ${creativeCleanup} still need cleanup, and ${creativeBuried} stale creative package(s) are buried from the live queue.`,
    nextMove:
      creativeCleanup > 0
        ? "Run one isolated creative job at a time with an exact artifact checklist and proof before allowing it to close."
        : "Keep creative work isolated by deliverable so hero, decals, and brochures do not collapse into one muddy brief.",
    href: absolutePath(origin, buildHostedBoardroomHomePath(host)),
    sourceOfTruth: [
      "Board Room creative packages",
      "Creative proof rules",
      "Planner follow-through",
    ],
    executionSurfaces: [
      "Board Room",
      "Media production",
      "Browser commerce design",
      "Website production",
      "Codex/Cursor",
    ],
    evidence: [
      creativeItems.length > 0
        ? `${creativeItems.length} creative Board Room item(s) are currently visible in the system.`
        : "There are no active creative Board Room items right now.",
      creativeCleanup > 0
        ? `${creativeCleanup} creative item(s) still need cleanup or proof.`
        : "No active creative items currently need cleanup.",
      creativeBuried > 0
        ? `${creativeBuried} stale or no-proof creative package(s) are buried from the live queue.`
        : "No stale creative packages are currently buried.",
    ],
  };

  const customerService: LaborLane = {
    id: "customer_service",
    title: "Customer service and follow-up",
    owner: "Tom and Jerry, governed by AL",
    coverage: "Seller first touch, customer confirmations, follow-up discipline, trust protection, and next-day service readiness.",
    status:
      wrenchReadySummary.status === "blocked" ||
      dominionDashboard.staleLeads + dominionDashboard.untouchedLeads >= 5
        ? "blocked"
        : wrenchReadySummary.status !== "ready" ||
            dominionDashboard.staleLeads > 0 ||
            dominionDashboard.untouchedLeads > 0
          ? "warning"
          : "live",
    summary: `Dominion has ${dominionDashboard.staleLeads} stale lead(s) and ${dominionDashboard.untouchedLeads} untouched lead(s). WrenchReady tomorrow readiness is ${wrenchReadySummary.status.replace(/_/g, " ")}.`,
    nextMove:
      wrenchReadySummary.status === "blocked"
        ? "Repair tomorrow's WrenchReady readiness before wrench time starts."
        : dominionDashboard.untouchedLeads > 0 || dominionDashboard.staleLeads > 0
          ? "Tighten first-touch and follow-up discipline so leads and customers do not wait on founder memory."
          : "Keep confirmations, first touch, and trust follow-through visible in the same AL surfaces.",
    href:
      wrenchReadySummary.status !== "ready"
        ? wrenchReadySummary.href
        : absolutePath(origin, buildHostedDominionLeadsPath(host)),
    sourceOfTruth: [
      "Dominion lead dashboard",
      "WrenchReady day readiness",
      "Planner follow-through",
    ],
    executionSurfaces: [
      "Dominion Leads",
      "Day Readiness",
      "Attention",
      "Planner",
    ],
    evidence: [
      `${dominionDashboard.openLeads} open Dominion lead(s) are currently tracked.`,
      `WrenchReady tomorrow readiness: ${wrenchReadySummary.text}`,
      dominionDashboard.staleLeads > 0 || dominionDashboard.untouchedLeads > 0
        ? "Lead follow-up still has visible leakage."
        : "No Dominion lead follow-up leakage is currently visible.",
    ],
  };

  const finance = financeTaskSummary(plannerTasks);
  const accountingFinance: LaborLane = {
    id: "accounting_finance",
    title: "Accounting and finance control",
    owner: "AL",
    coverage: "Bookkeeping, banking packets, invoices, payment controls, finance follow-through, and accounting readiness.",
    status:
      finance.overdue.length > 0
        ? "blocked"
        : finance.open.length > 0
          ? "warning"
          : "blocked",
    summary:
      finance.financeTasks.length === 0
        ? "No explicit accounting or finance control queue is currently tracked inside AL."
        : `${finance.open.length} open finance task(s), ${finance.overdue.length} overdue, ${finance.financeTasks.length} tracked total.`,
    nextMove:
      finance.financeTasks.length === 0
        ? "Create the first explicit finance control loop so banking, bookkeeping, and packet work stop depending on founder memory."
        : finance.overdue.length > 0
          ? "Clear overdue finance tasks before more capital, paperwork, or customer promises stack on top."
          : "Keep finance work explicit and proof-backed instead of leaving it in chat or private memory.",
    href: absolutePath(origin, buildHostedPlannerPath(host)),
    sourceOfTruth: [
      "Planner finance tasks",
      "Board Room finance packets",
      "Vault source docs",
    ],
    executionSurfaces: [
      "Planner",
      "Board Room",
      "Command Center",
    ],
    evidence: [
      finance.financeTasks.length > 0
        ? `${finance.financeTasks.length} finance-related Planner task(s) are currently tracked.`
        : "No finance-specific Planner tasks are currently tracked.",
      finance.overdue.length > 0
        ? `${finance.overdue.length} finance task(s) are overdue.`
        : "No finance tasks are currently overdue.",
      finance.financeTasks.length === 0
        ? "This lane still depends on ad hoc founder prompting rather than a durable control surface."
        : "Finance work is at least visible in Planner, even if the lane is not fully mature yet.",
    ],
  };

  const lanes: LaborLane[] = [
    executiveControl,
    itSystems,
    marketingCreative,
    customerService,
    accountingFinance,
  ];

  const summary = {
    live: lanes.filter((lane) => lane.status === "live").length,
    warning: lanes.filter((lane) => lane.status === "warning").length,
    blocked: lanes.filter((lane) => lane.status === "blocked").length,
  };

  const topNextMove =
    [...lanes]
      .sort((left, right) => severityRank(right.status) - severityRank(left.status))
      .find((lane) => lane.status !== "live")?.nextMove ||
    "The labor lanes are healthy enough to start replacing more founder load directly.";

  const headline =
    summary.blocked > 0
      ? "AL only replaces labor when the blocked lanes become real operating systems."
      : summary.warning > 0
        ? "The labor lanes exist, but some still need tightening before they earn trust."
        : "The shared labor lanes are healthy enough to carry more real work.";

  return {
    generatedAt: new Date().toISOString(),
    headline,
    topNextMove,
    summary,
    lanes,
  };
}

export function buildLaborLaneQuickLink(
  host: string | null | undefined,
  origin: string,
) {
  return absolutePath(origin, buildHostedLaborLanesPath(host));
}
