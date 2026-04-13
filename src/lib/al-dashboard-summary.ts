import { getAlCanonicalHost, getAlCanonicalOrigin, resolveAlOrigin } from "@/lib/al-platform";
import {
  buildBusinessManagerSummaries,
  getAlBusinessRegistrySnapshot,
} from "@/lib/al-business-registry";
import {
  buildHostedAttentionPath,
  buildHostedBoardroomHomePath,
  buildHostedOperationalProofPath,
  fetchBoardroomQueueSnapshot,
} from "@/lib/al-review";
import { buildAttentionBrief, type AttentionBriefItem } from "@/lib/al-attention-brief";

export interface DashboardSummarySpotlight {
  title: string;
  reason: string;
  href: string;
  tone: "emerald" | "amber" | "red" | "sky";
}

export interface DashboardBusinessModuleSummary {
  businessId: string;
  businessLabel: string;
  ceoId: string;
  operatorHomePath: string;
  scorecardSummary: string;
  status: "healthy" | "warning" | "blocked";
  headline: string;
  nextAction: string;
}

export interface DashboardSummary {
  generatedAt: string;
  headline: string;
  counts: {
    reviewReady: number;
    activeCleanup: number;
    buriedStale: number;
    waitingOnDez: number;
    waitingOnAl: number;
    blockedSystems: number;
  };
  spotlight: DashboardSummarySpotlight[];
  businesses: DashboardBusinessModuleSummary[];
}

const CANONICAL_AL_ORIGIN = getAlCanonicalOrigin();

function absolutePath(origin: string, path: string) {
  return `${origin.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function spotlightFromAttention(
  item: AttentionBriefItem | undefined,
  tone: DashboardSummarySpotlight["tone"],
): DashboardSummarySpotlight | null {
  if (!item) return null;
  return {
    title: item.title,
    reason: item.reason,
    href: item.href,
    tone,
  };
}

export async function buildDashboardSummary(input?: {
  host?: string | null;
  origin?: string | null;
}): Promise<DashboardSummary> {
  const host = input?.host || getAlCanonicalHost();
  const origin = resolveAlOrigin({ host: input?.host, origin: input?.origin });
  const [attentionBrief, boardroomSnapshot] = await Promise.all([
    buildAttentionBrief({ host, origin }),
    fetchBoardroomQueueSnapshot(host, 12),
  ]);
  const [modules, managerSummaries] = await Promise.all([
    getAlBusinessRegistrySnapshot(),
    buildBusinessManagerSummaries({ host, origin }),
  ]);

  const spotlight: DashboardSummarySpotlight[] = [
    spotlightFromAttention(attentionBrief.waitingOnDez[0], "amber"),
    spotlightFromAttention(attentionBrief.blockedSystems[0], "red"),
    spotlightFromAttention(attentionBrief.waitingOnAl[0], "sky"),
    boardroomSnapshot.visible[0]
      ? {
          title: boardroomSnapshot.visible[0].title,
          reason:
            boardroomSnapshot.visible[0].bucket === "review_now"
              ? `Board Room ready: ${boardroomSnapshot.visible[0].summary}`
              : `Board Room cleanup: ${boardroomSnapshot.visible[0].summary}`,
          href: absolutePath(origin, boardroomSnapshot.visible[0].boardroomPath),
          tone: boardroomSnapshot.visible[0].bucket === "review_now" ? "emerald" : "amber",
        }
      : null,
  ].filter((item): item is DashboardSummarySpotlight => Boolean(item));

  const headline =
    attentionBrief.waitingOnDez[0]?.title
      ? `Waiting on Dez: ${attentionBrief.waitingOnDez[0].title}`
      : boardroomSnapshot.counts.reviewNow > 0
        ? `${boardroomSnapshot.counts.reviewNow} review-ready item${
            boardroomSnapshot.counts.reviewNow === 1 ? "" : "s"
          } are live now`
        : boardroomSnapshot.counts.buried > 0
          ? `${boardroomSnapshot.counts.buried} stale package${
              boardroomSnapshot.counts.buried === 1 ? "" : "s"
            } buried from the live queue`
          : "The command center is quiet enough to start fresh work cleanly.";

  const businesses = modules.map((module) => {
    const matchingManagers = managerSummaries.filter(
      (summary) => summary.businessId === module.businessId,
    );
    const rank = { healthy: 1, warning: 2, blocked: 3 } as const;
    const primaryManager =
      matchingManagers.sort((a, b) => rank[b.status] - rank[a.status])[0] || null;

    return {
      businessId: module.businessId,
      businessLabel: module.businessLabel,
      ceoId: module.ceoId,
      operatorHomePath: absolutePath(origin, module.operatorHomePath),
      scorecardSummary: module.scorecardSummary,
      status: primaryManager?.status || "healthy",
      headline:
        primaryManager?.headline ||
        `${module.businessLabel} has no registered manager summary yet.`,
      nextAction:
        primaryManager?.nextActions[0] ||
        "Register a manager summary before trusting this business module.",
    } satisfies DashboardBusinessModuleSummary;
  });

  return {
    generatedAt: new Date().toISOString(),
    headline,
    counts: {
      reviewReady: boardroomSnapshot.counts.reviewNow,
      activeCleanup:
        boardroomSnapshot.counts.needsAttention + boardroomSnapshot.counts.localOnly,
      buriedStale: boardroomSnapshot.counts.buried,
      waitingOnDez: attentionBrief.waitingOnDez.length,
      waitingOnAl: attentionBrief.waitingOnAl.length,
      blockedSystems: attentionBrief.blockedSystems.length,
    },
    spotlight: spotlight.slice(0, 4),
    businesses,
  };
}

export function buildDashboardSummaryLinks(host: string | null | undefined, origin: string) {
  return {
    attention: absolutePath(origin, buildHostedAttentionPath(host)),
    boardroom: absolutePath(origin, buildHostedBoardroomHomePath(host)),
    operationalProof: absolutePath(origin, buildHostedOperationalProofPath(host)),
  };
}
