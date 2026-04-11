import { buildAttentionBrief } from "@/lib/al-attention-brief";
import { listPlannerTasks } from "@/lib/al-planner";
import {
  buildHostedBoardroomHomePath,
  buildHostedOperationalProofPath,
  buildHostedPlannerPath,
  fetchBoardroomPresentations,
} from "@/lib/al-review";
import { getLatestRemoteBridgeHeartbeat } from "@/lib/al-remote-bridge";
import {
  buildHostedDominionLeadsPath,
  getDominionLeadDashboard,
  listDominionLeads,
} from "@/lib/dominion-leads";
import {
  buildHostedWrenchReadyDayReadinessPath,
  getWrenchReadyDayReadinessSummary,
} from "@/lib/wrenchready-day-readiness";

export type OperationalProofStatus = "healthy" | "warning" | "failing";

export interface OperationalProofCheck {
  id:
    | "boardroom_followthrough"
    | "dominion_lead_control"
    | "desktop_relay"
    | "wrenchready_day_readiness"
    | "openclaw_ingress"
    | "attention_brief";
  title: string;
  status: OperationalProofStatus;
  summary: string;
  evidence: string[];
  href: string;
}

export interface OperationalProofReport {
  generatedAt: string;
  summary: {
    healthy: number;
    warning: number;
    failing: number;
  };
  topNextMove: string;
  checks: OperationalProofCheck[];
}

const CANONICAL_AL_ORIGIN =
  process.env.AL_CANONICAL_ORIGIN?.trim().replace(/\/+$/, "") ||
  "https://al.dominionhomedeals.com";

function absolutePath(origin: string, path: string) {
  return `${origin.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function severityRank(status: OperationalProofStatus) {
  if (status === "failing") return 3;
  if (status === "warning") return 2;
  return 1;
}

function localTomorrowKey() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openClawSharedSecretConfigured() {
  return Boolean(
    process.env.AL_OPENCLAW_SHARED_SECRET?.trim() ||
      process.env.OPENCLAW_AL_SHARED_SECRET?.trim(),
  );
}

function buildTopNextMove(checks: OperationalProofCheck[]) {
  const ranked = [...checks].sort(
    (left, right) => severityRank(right.status) - severityRank(left.status),
  );
  const first = ranked[0];
  if (!first || first.status === "healthy") {
    return "Core AL control loops are healthy enough to begin live automation proof.";
  }

  switch (first.id) {
    case "boardroom_followthrough":
      return "Repair the Board Room accountability gaps before adding more approvals or presentation volume.";
    case "dominion_lead_control":
      return "Repair the Dominion lead-control trail so every open lead is visibly tied to Planner.";
    case "desktop_relay":
      return "Repair the desktop relay before promising off-machine file, Codex, or cowork labor from a phone.";
    case "wrenchready_day_readiness":
      return "Get tomorrow's WrenchReady readiness loop back into a truthful tracked state before wrench time starts.";
    case "openclaw_ingress":
      return "Finish OpenClaw ingress configuration so the mobile shell becomes a real operating door into AL.";
    case "attention_brief":
      return "Repair the attention brief if it stops reflecting the real operating queues.";
    default:
      return "Repair the weakest control loop before expanding the system further.";
  }
}

function minutesSince(value: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.round((Date.now() - timestamp) / 60000));
}

export async function buildOperationalProofReport(input?: {
  host?: string | null;
  origin?: string | null;
}): Promise<OperationalProofReport> {
  const host = input?.host || "al.dominionhomedeals.com";
  const origin = input?.origin?.trim() || CANONICAL_AL_ORIGIN;

  const [
    boardroom,
    dominionDashboard,
    dominionLeads,
    remoteBridgeHeartbeat,
    wrenchReadySummary,
    plannerTasks,
    attentionBrief,
  ] = await Promise.all([
    fetchBoardroomPresentations(host, 24),
    getDominionLeadDashboard(48),
    listDominionLeads(null),
    getLatestRemoteBridgeHeartbeat(),
    getWrenchReadyDayReadinessSummary(null, { host, origin }),
    listPlannerTasks(),
    buildAttentionBrief({ host, origin }),
  ]);

  const boardroomOwnerGaps = boardroom.filter(
    (item) =>
      (item.waitingOn === "AL" || item.waitingOn === "Dez") &&
      (!item.followUpOwner || item.followUpStatus !== "open"),
  );
  const boardroomStale = boardroom.filter((item) => item.isStale);
  const boardroomCheck: OperationalProofCheck = {
    id: "boardroom_followthrough",
    title: "Board Room follow-through",
    status:
      boardroomOwnerGaps.length > 0
        ? "failing"
        : boardroomStale.length > 0
          ? "warning"
          : "healthy",
    summary:
      boardroom.length === 0
        ? "Board Room is currently quiet."
        : `${boardroom.length} active items tracked, ${boardroomStale.length} stale, ${boardroomOwnerGaps.length} missing accountable follow-through.`,
    evidence: [
      boardroom.length > 0
        ? `${boardroom.filter((item) => item.waitingOn === "AL").length} items currently wait on AL and ${boardroom.filter((item) => item.waitingOn === "Dez" || item.waitingOn === "Dez review").length} wait on Dez review or action.`
        : "No active Board Room presentations are in the queue right now.",
      boardroomOwnerGaps.length > 0
        ? `${boardroomOwnerGaps.length} items show AL or Dez as the blocker without an open follow-up task attached.`
        : "Every Board Room item that points at AL or Dez has a visible open follow-up trail.",
      boardroomStale.length > 0
        ? `${boardroomStale.length} Board Room items have gone stale and need movement or closure.`
        : "No Board Room items are currently stale.",
    ],
    href: absolutePath(origin, buildHostedBoardroomHomePath(host)),
  };

  const dominionMissingPlanner = dominionLeads.filter(
    (record) =>
      record.status !== "won" &&
      record.status !== "lost" &&
      !record.plannerTaskId,
  );
  const dominionCheck: OperationalProofCheck = {
    id: "dominion_lead_control",
    title: "Dominion lead control",
    status:
      dominionMissingPlanner.length > 0
        ? "failing"
        : dominionDashboard.staleLeads > 0 || dominionDashboard.untouchedLeads > 0
          ? "warning"
          : "healthy",
    summary: `${dominionDashboard.openLeads} open leads, ${dominionDashboard.staleLeads} stale, ${dominionDashboard.untouchedLeads} untouched, ${dominionMissingPlanner.length} missing Planner linkage.`,
    evidence: [
      `${dominionDashboard.workingLeads} open Dominion leads are already in active working motion.`,
      dominionMissingPlanner.length > 0
        ? `${dominionMissingPlanner.length} open leads do not currently point to a Planner task and need reconciliation.`
        : "Every open Dominion lead currently has a Planner trail.",
      dominionDashboard.staleLeads > 0 || dominionDashboard.untouchedLeads > 0
        ? `${dominionDashboard.staleLeads} stale leads and ${dominionDashboard.untouchedLeads} untouched leads still need a human move.`
        : "No Dominion leads are stale or untouched right now.",
    ],
    href: absolutePath(origin, buildHostedDominionLeadsPath(host)),
  };

  const relayHeartbeatAgeMinutes = minutesSince(remoteBridgeHeartbeat?.observedAt || null);
  const relayHeartbeatFresh = relayHeartbeatAgeMinutes !== null && relayHeartbeatAgeMinutes <= 5;
  const relayCoworkHealthy = remoteBridgeHeartbeat?.coworkProbe?.ok === true;
  const relayCodexHealthy = remoteBridgeHeartbeat?.capabilities?.codex_execution === true;
  const relayClaudeAuth = remoteBridgeHeartbeat?.claudeAuth || null;
  const relayCoworkStatus = remoteBridgeHeartbeat?.coworkProbe?.status || null;
  const relayCoworkDetail = remoteBridgeHeartbeat?.coworkProbe?.detail?.trim() || null;
  const relayCoworkNeedsAuthRefresh =
    relayClaudeAuth?.oauthExpired === true ||
    relayClaudeAuth?.status === "oauth_expired" ||
    relayClaudeAuth?.status === "oauth_expired_api_present" ||
    relayCoworkStatus === "auth_invalid" ||
    (relayCoworkDetail
      ? /invalid api key|invalid authentication credentials|refresh claude login/i.test(
          relayCoworkDetail,
        )
      : false);
  const relayCheck: OperationalProofCheck = {
    id: "desktop_relay",
    title: "Desktop relay",
    status: !remoteBridgeHeartbeat || !relayHeartbeatFresh
      ? "failing"
      : relayCoworkHealthy && relayCodexHealthy
        ? "healthy"
        : "warning",
    summary: !remoteBridgeHeartbeat
      ? "No desktop relay heartbeat has reached hosted AL yet."
      : relayHeartbeatFresh
        ? `Desktop heartbeat is fresh (${relayHeartbeatAgeMinutes}m ago), Codex is ${relayCodexHealthy ? "live" : "degraded"}, and Claude cowork is ${relayCoworkHealthy ? "live" : relayCoworkNeedsAuthRefresh ? "blocked by auth" : "degraded"}.`
        : `Desktop heartbeat is stale (${relayHeartbeatAgeMinutes}m ago), so off-machine desktop labor is not trustworthy right now.`,
    evidence: [
      remoteBridgeHeartbeat
        ? `Last seen from ${remoteBridgeHeartbeat.clientId} at ${remoteBridgeHeartbeat.observedAt}.`
        : "Hosted AL has not heard from any desktop relay client yet.",
      remoteBridgeHeartbeat
        ? remoteBridgeHeartbeat.bridgeAuthRequired
          ? "The local bridge requires bearer auth for direct requests."
          : "The local bridge is still open on localhost and should be treated as a weaker local boundary."
        : "No bridge auth posture has been reported yet.",
      remoteBridgeHeartbeat?.coworkProbe
        ? `Claude cowork probe: ${remoteBridgeHeartbeat.coworkProbe.status} - ${remoteBridgeHeartbeat.coworkProbe.detail}`
        : "No Claude cowork probe has been reported yet.",
      relayClaudeAuth
        ? `Executor Claude auth: ${relayClaudeAuth.status} - ${relayClaudeAuth.detail}`
        : "No executor Claude auth state has been reported yet.",
      relayCoworkNeedsAuthRefresh
        ? "Claude cowork specifically needs a local Claude re-login or a valid Anthropic executor key before this lane can be trusted."
        : "Claude cowork is not currently signaling a known auth-specific remediation.",
      remoteBridgeHeartbeat
        ? `Codex desktop lane: ${relayCodexHealthy ? "live" : "not confirmed"}`
        : "Codex desktop lane has not reported through the relay yet.",
    ],
    href: absolutePath(origin, buildHostedOperationalProofPath(host)),
  };

  const tomorrowKey = localTomorrowKey();
  const wrenchReadyPlannerExists =
    Boolean(wrenchReadySummary.record?.plannerTaskId) ||
    plannerTasks.some(
      (task) =>
        task.source === "wrenchready_day_readiness" &&
        task.title === `WrenchReady day readiness for ${tomorrowKey}`,
    );
  const wrenchReadyCheck: OperationalProofCheck = {
    id: "wrenchready_day_readiness",
    title: "WrenchReady day-readiness",
    status:
      wrenchReadySummary.record &&
      wrenchReadySummary.status !== "ready" &&
      !wrenchReadyPlannerExists
        ? "failing"
        : !wrenchReadySummary.record || wrenchReadySummary.status !== "ready"
          ? "warning"
          : "healthy",
    summary: wrenchReadySummary.record
      ? `Tomorrow is ${wrenchReadySummary.status.replace(/_/g, " ")} and the control record is ${wrenchReadyPlannerExists ? "linked to Planner." : "missing Planner linkage."}`
      : "No tomorrow-readiness record exists yet.",
    evidence: [
      wrenchReadySummary.record
        ? `Tomorrow's record covers ${wrenchReadySummary.record.jobsPlanned} planned jobs with blocker owner ${wrenchReadySummary.record.blockerOwner}.`
        : "Tomorrow's readiness record has not been created yet.",
      wrenchReadyPlannerExists
        ? "The readiness loop has a Planner trail when the day is not fully clear."
        : "The readiness loop does not currently show a Planner trail for tomorrow's risk state.",
      `Business state: ${wrenchReadySummary.text}`,
    ],
    href: absolutePath(origin, buildHostedWrenchReadyDayReadinessPath(host)),
  };

  const openClawConfigured = openClawSharedSecretConfigured();
  const openClawCheck: OperationalProofCheck = {
    id: "openclaw_ingress",
    title: "OpenClaw ingress",
    status: openClawConfigured ? "healthy" : "warning",
    summary: openClawConfigured
      ? "OpenClaw ingress is configured for authenticated command execution."
      : "OpenClaw discovery exists, but authenticated ingress is not configured in this runtime yet.",
    evidence: [
      "The AL runtime exposes a dedicated OpenClaw ingress route and command catalog.",
      openClawConfigured
        ? "A shared secret is present, so OpenClaw can post authenticated commands."
        : "The shared secret is missing, so only discovery works and real command POSTs remain blocked.",
      "This lane should stay a narrow door into the same AL truth system, not a second assistant.",
    ],
    href: absolutePath(origin, buildHostedOperationalProofPath(host)),
  };

  const totalAttentionItems =
    attentionBrief.waitingOnDez.length +
    attentionBrief.waitingOnAl.length +
    attentionBrief.blockedSystems.length;
  const attentionCheck: OperationalProofCheck = {
    id: "attention_brief",
    title: "Attention brief",
    status: attentionBrief.topNextMove.trim() ? "healthy" : "failing",
    summary: `${totalAttentionItems} active items pulled into the attention brief with top move: ${attentionBrief.topNextMove}`,
    evidence: [
      `${attentionBrief.waitingOnDez.length} items are waiting on Dez.`,
      `${attentionBrief.waitingOnAl.length} items are waiting on AL.`,
      `${attentionBrief.blockedSystems.length} items are blocked on systems.`,
    ],
    href: absolutePath(origin, buildHostedPlannerPath(host)),
  };

  const checks = [
    boardroomCheck,
    dominionCheck,
    relayCheck,
    wrenchReadyCheck,
    openClawCheck,
    attentionCheck,
  ];

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      healthy: checks.filter((check) => check.status === "healthy").length,
      warning: checks.filter((check) => check.status === "warning").length,
      failing: checks.filter((check) => check.status === "failing").length,
    },
    topNextMove: buildTopNextMove(checks),
    checks,
  };
}
