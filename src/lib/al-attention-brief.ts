import { listPlannerTasks } from "@/lib/al-planner";
import { buildDominionLeadAttentionSummary } from "@/lib/dominion-leads";
import {
  buildHostedPlannerPath,
  fetchBoardroomPresentations,
} from "@/lib/al-review";
import { getWrenchReadyDayReadinessSummary } from "@/lib/wrenchready-day-readiness";

export interface AttentionBriefItem {
  title: string;
  owner: "AL" | "Dez" | "System";
  reason: string;
  href: string;
}

export interface AttentionBrief {
  generatedAt: string;
  waitingOnDez: AttentionBriefItem[];
  waitingOnAl: AttentionBriefItem[];
  blockedSystems: AttentionBriefItem[];
  topNextMove: string;
}

const CANONICAL_AL_ORIGIN =
  process.env.AL_CANONICAL_ORIGIN?.trim().replace(/\/+$/, "") || "https://al.dominionhomedeals.com";

function absolutePath(origin: string, path: string) {
  return `${origin.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function localDayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function buildAttentionBrief(input?: {
  host?: string | null;
  origin?: string | null;
}): Promise<AttentionBrief> {
  const host = input?.host || "al.dominionhomedeals.com";
  const origin = input?.origin?.trim() || CANONICAL_AL_ORIGIN;
  const plannerPath = buildHostedPlannerPath(host);
  const [tasks, presentations, leadSummary, wrenchReady] = await Promise.all([
    listPlannerTasks(),
    fetchBoardroomPresentations(host, 16),
    buildDominionLeadAttentionSummary({ host, origin, limit: 6 }),
    getWrenchReadyDayReadinessSummary(null, { host, origin }),
  ]);

  const today = localDayKey();
  const overdueTasks = tasks.filter(
    (task) => task.status === "open" && typeof task.dueDate === "string" && task.dueDate < today,
  );

  const wrenchReadyItem =
    wrenchReady.status === "ready"
      ? null
      : {
          title: "WrenchReady tomorrow readiness",
          owner:
            wrenchReady.record?.blockerOwner === "system"
              ? ("System" as const)
              : wrenchReady.record?.blockerOwner === "al" || !wrenchReady.record
                ? ("AL" as const)
                : ("Dez" as const),
          reason: wrenchReady.text,
          href: wrenchReady.href,
        };

  const waitingOnDez: AttentionBriefItem[] = [
    ...(wrenchReadyItem?.owner === "Dez" ? [wrenchReadyItem] : []),
    ...leadSummary.items
      .filter((item) => item.owner === "Dez")
      .map((item) => ({
        title: item.title,
        owner: "Dez" as const,
        reason: item.reason,
        href: item.href,
      })),
    ...presentations
      .filter((item) => item.waitingOn === "Dez" || item.waitingOn === "Dez review")
      .slice(0, 5)
      .map((item) => ({
        title: item.title,
        owner: "Dez" as const,
        reason: item.isStale ? item.staleReason || "Waiting on Dez too long" : `Board Room action: ${item.waitingOn}`,
        href: absolutePath(origin, item.boardroomPath),
      })),
    ...overdueTasks
      .filter((task) => task.assignedTo === "dez")
      .slice(0, 5)
      .map((task) => ({
        title: task.title,
        owner: "Dez" as const,
        reason: task.dueDate ? `Planner overdue since ${task.dueDate}` : "Planner task is still open",
        href: absolutePath(origin, plannerPath),
      })),
  ].slice(0, 6);

  const waitingOnAl: AttentionBriefItem[] = [
    ...(wrenchReadyItem?.owner === "AL" ? [wrenchReadyItem] : []),
    ...leadSummary.items
      .filter((item) => item.owner === "AL")
      .map((item) => ({
        title: item.title,
        owner: "AL" as const,
        reason: item.reason,
        href: item.href,
      })),
    ...presentations
      .filter((item) => item.waitingOn === "AL")
      .slice(0, 4)
      .map((item) => ({
        title: item.title,
        owner: "AL" as const,
        reason: item.isStale ? item.staleReason || "Waiting on AL too long" : "Open AL follow-up",
        href: absolutePath(origin, item.boardroomPath),
      })),
    ...overdueTasks
      .filter((task) => task.assignedTo === "al")
      .slice(0, 4)
      .map((task) => ({
        title: task.title,
        owner: "AL" as const,
        reason: task.dueDate ? `Planner overdue since ${task.dueDate}` : "Planner task is still open",
        href: absolutePath(origin, plannerPath),
      })),
  ].slice(0, 6);

  const blockedSystems: AttentionBriefItem[] = [
    ...(wrenchReadyItem?.owner === "System" ? [wrenchReadyItem] : []),
    ...presentations
      .filter((item) => item.waitingOn === "System repair" || item.waitingOn === "Dez's machine")
      .slice(0, 6)
      .map((item) => ({
        title: item.title,
        owner: "System" as const,
        reason: item.staleReason || item.waitingOn,
        href: absolutePath(origin, item.boardroomPath),
      })),
  ].slice(0, 6);

  const topNextMove =
    waitingOnDez[0]?.title
      ? `Dez should clear: ${waitingOnDez[0].title}`
      : blockedSystems[0]?.title
        ? `Repair or reroute: ${blockedSystems[0].title}`
        : waitingOnAl[0]?.title
          ? `AL should move: ${waitingOnAl[0].title}`
          : "No urgent exceptions right now.";

  return {
    generatedAt: new Date().toISOString(),
    waitingOnDez,
    waitingOnAl,
    blockedSystems,
    topNextMove,
  };
}
