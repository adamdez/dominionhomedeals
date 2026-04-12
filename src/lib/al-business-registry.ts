import {
  buildAlUrl,
  resolveAlPlatformContext,
  type AlAttentionSummary,
  type AlBoardroomSummary,
  type AlBusinessId,
  type AlBusinessModuleContract,
  type AlManagerSummary,
  type AlPlatformContextInput,
} from "@/lib/al-platform";
import {
  buildDominionLeadAttentionSummary,
  getDominionLeadDashboard,
} from "@/lib/dominion-leads";
import { fetchBoardroomPresentations } from "@/lib/al-review";
import { getWrenchReadyDayReadinessSummary } from "@/lib/wrenchready-day-readiness";

interface AlBusinessManagerDefinition {
  managerId: string;
  buildSummary: (input?: AlPlatformContextInput) => Promise<AlManagerSummary>;
}

interface RegisteredAlBusinessModule extends AlBusinessModuleContract {
  managers: AlBusinessManagerDefinition[];
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

async function buildDominionLeadFlowManagerSummary(
  input?: AlPlatformContextInput,
): Promise<AlManagerSummary> {
  const context = resolveAlPlatformContext(input);
  const dashboard = await getDominionLeadDashboard(24);
  const topRisks = uniqueStrings([
    dashboard.staleLeads > 0
      ? `${dashboard.staleLeads} stale lead(s) still need movement.`
      : null,
    dashboard.untouchedLeads > 0
      ? `${dashboard.untouchedLeads} untouched lead(s) still have no first touch logged.`
      : null,
  ]);
  const nextActions = uniqueStrings([
    dashboard.untouchedLeads > 0
      ? "Tighten first-touch discipline on new leads."
      : null,
    dashboard.staleLeads > 0
      ? "Repair stale follow-up before more seller opportunities cool off."
      : null,
    dashboard.openLeads > 0 && dashboard.staleLeads === 0 && dashboard.untouchedLeads === 0
      ? "Keep every open seller lead tied to the next logged action."
      : null,
  ]);

  return {
    managerId: "lead_flow",
    businessId: "dominion",
    title: "Lead Flow Manager",
    headline: `${dashboard.openLeads} open lead(s), ${dashboard.staleLeads} stale, ${dashboard.untouchedLeads} untouched.`,
    status:
      dashboard.staleLeads > 0 || dashboard.untouchedLeads >= 5
        ? "blocked"
        : dashboard.staleLeads > 0 || dashboard.untouchedLeads > 0
          ? "warning"
          : "healthy",
    topRisks,
    nextActions:
      nextActions.length > 0
        ? nextActions
        : ["Lead flow is currently clean enough to protect seller response speed."],
    escalateToCeo: dashboard.staleLeads > 0 || dashboard.untouchedLeads > 0,
    escalateToAl: dashboard.staleLeads >= 3 || dashboard.untouchedLeads >= 3,
  };
}

async function buildWrenchReadyDayReadinessManagerSummary(
  input?: AlPlatformContextInput,
): Promise<AlManagerSummary> {
  const context = resolveAlPlatformContext(input);
  const readiness = await getWrenchReadyDayReadinessSummary(null, context);
  const record = readiness.record;
  const topRisks = uniqueStrings([
    !record ? "Tomorrow has no readiness record yet." : null,
    record && !record.routeReady ? "Route shape is not ready." : null,
    record && !record.customersConfirmed ? "Customer confirmations are incomplete." : null,
    record && !record.partsReady ? "Parts are not fully ready." : null,
    record && !record.toolsReady ? "Tools are not fully ready." : null,
    record && record.blockerNote ? record.blockerNote : null,
  ]);
  const nextActions = uniqueStrings([
    !record ? "Create tomorrow's readiness record before wrench time starts." : null,
    readiness.status === "blocked"
      ? "Repair the blocker before trusting tomorrow's service promises."
      : null,
    readiness.status === "at_risk"
      ? "Clear the incomplete readiness checks before tomorrow morning."
      : null,
    readiness.status === "ready"
      ? "Keep tomorrow's promise state clean as jobs change."
      : null,
  ]);

  return {
    managerId: "day_readiness",
    businessId: "wrenchready",
    title: "Day Readiness Manager",
    headline: readiness.text,
    status:
      readiness.status === "blocked"
        ? "blocked"
        : readiness.status === "at_risk"
          ? "warning"
          : "healthy",
    topRisks,
    nextActions:
      nextActions.length > 0
        ? nextActions
        : ["Tomorrow is currently in a usable state."],
    escalateToCeo: readiness.status !== "ready",
    escalateToAl: readiness.status === "blocked" || !record,
  };
}

async function buildDominionAttentionSummary(
  input?: AlPlatformContextInput,
): Promise<AlAttentionSummary> {
  const context = resolveAlPlatformContext(input);
  const summary = await buildDominionLeadAttentionSummary({
    host: context.host,
    origin: context.origin,
    limit: 6,
  });
  return {
    headline:
      summary.items[0]?.reason ||
      "No Dominion seller follow-up exceptions are currently screaming for attention.",
    count: summary.items.length,
  };
}

async function buildWrenchReadyAttentionSummary(
  input?: AlPlatformContextInput,
): Promise<AlAttentionSummary> {
  const readiness = await getWrenchReadyDayReadinessSummary(
    null,
    resolveAlPlatformContext(input),
  );
  return {
    headline: readiness.text,
    count: readiness.status === "ready" ? 0 : 1,
  };
}

async function buildDominionBoardroomSummary(
  input?: AlPlatformContextInput,
): Promise<AlBoardroomSummary> {
  const context = resolveAlPlatformContext(input);
  const presentations = await fetchBoardroomPresentations(context.host, 24);
  const related = presentations.filter((item) =>
    /dominion|seller|lead/i.test(`${item.title} ${item.summary} ${item.task}`),
  );
  return {
    headline:
      related[0]?.summary ||
      "No active Dominion-specific Board Room package is currently at the top of the queue.",
  };
}

async function buildWrenchReadyBoardroomSummary(
  input?: AlPlatformContextInput,
): Promise<AlBoardroomSummary> {
  const context = resolveAlPlatformContext(input);
  const presentations = await fetchBoardroomPresentations(context.host, 24);
  const related = presentations.filter((item) =>
    /wrenchready|simon|route|day readiness|mechanic/i.test(
      `${item.title} ${item.summary} ${item.task}`,
    ),
  );
  return {
    headline:
      related[0]?.summary ||
      "No active WrenchReady-specific Board Room package is currently at the top of the queue.",
  };
}

const REGISTRY: Record<AlBusinessId, RegisteredAlBusinessModule> = {
  dominion: {
    businessId: "dominion",
    businessLabel: "Dominion Home Deals",
    ceoId: "dominion",
    scorecardSummary:
      "Realized gross profit, seller response speed, underwriting quality, and buyer liquidity at exit.",
    managerSet: ["lead_flow"],
    attentionBuilder: buildDominionAttentionSummary,
    boardroomSummaryBuilder: buildDominionBoardroomSummary,
    operatorHomePath: "/dominion/leads",
    managers: [
      {
        managerId: "lead_flow",
        buildSummary: buildDominionLeadFlowManagerSummary,
      },
    ],
  },
  wrenchready: {
    businessId: "wrenchready",
    businessLabel: "WrenchReady",
    ceoId: "wrenchready",
    scorecardSummary:
      "Profit per service day, booking quality, route sanity, service trust, and repeat business.",
    managerSet: ["day_readiness"],
    attentionBuilder: buildWrenchReadyAttentionSummary,
    boardroomSummaryBuilder: buildWrenchReadyBoardroomSummary,
    operatorHomePath: "/wrenchready/day-readiness",
    managers: [
      {
        managerId: "day_readiness",
        buildSummary: buildWrenchReadyDayReadinessManagerSummary,
      },
    ],
  },
};

export function listAlBusinessModules(): AlBusinessModuleContract[] {
  return Object.values(REGISTRY).map(({ managers, ...module }) => module);
}

export function getAlBusinessModule(
  businessId: AlBusinessId,
): AlBusinessModuleContract | null {
  const module = REGISTRY[businessId];
  if (!module) return null;
  const { managers, ...rest } = module;
  return rest;
}

export function getAlBusinessRegistrySnapshot(): Array<{
  businessId: AlBusinessId;
  businessLabel: string;
  ceoId: string;
  scorecardSummary: string;
  managerSet: string[];
  operatorHomePath: string;
}> {
  return Object.values(REGISTRY).map((module) => ({
    businessId: module.businessId,
    businessLabel: module.businessLabel,
    ceoId: module.ceoId,
    scorecardSummary: module.scorecardSummary,
    managerSet: [...module.managerSet],
    operatorHomePath: module.operatorHomePath,
  }));
}

export async function buildBusinessManagerSummaries(
  input?: AlPlatformContextInput & {
    businessIds?: AlBusinessId[];
  },
): Promise<AlManagerSummary[]> {
  const businessIds = input?.businessIds?.length
    ? input.businessIds
    : (Object.keys(REGISTRY) as AlBusinessId[]);
  const summaries: AlManagerSummary[] = [];

  for (const businessId of businessIds) {
    const module = REGISTRY[businessId];
    if (!module) continue;
    for (const manager of module.managers) {
      summaries.push(await manager.buildSummary(input));
    }
  }

  return summaries;
}

export async function buildBusinessAttentionSummary(
  businessId: AlBusinessId,
  input?: AlPlatformContextInput,
): Promise<AlAttentionSummary | null> {
  const module = REGISTRY[businessId];
  if (!module?.attentionBuilder) return null;
  return module.attentionBuilder(input);
}

export async function buildBusinessBoardroomSummary(
  businessId: AlBusinessId,
  input?: AlPlatformContextInput,
): Promise<AlBoardroomSummary | null> {
  const module = REGISTRY[businessId];
  if (!module?.boardroomSummaryBuilder) return null;
  return module.boardroomSummaryBuilder(input);
}

export function buildBusinessOperatorHomeUrl(
  businessId: AlBusinessId,
  input?: AlPlatformContextInput,
): string | null {
  const module = REGISTRY[businessId];
  if (!module) return null;
  return buildAlUrl(input, module.operatorHomePath);
}
