import { createPlannerTask, listPlannerTasks } from "@/lib/al-planner";
import { buildAttentionBrief } from "@/lib/al-attention-brief";
import { buildLaborLaneReport } from "@/lib/al-labor-lanes";
import { buildOperationalProofReport } from "@/lib/al-operational-proof";
import {
  buildHostedDominionLeadsPath,
  buildDominionLeadAttentionSummary,
} from "@/lib/dominion-leads";
import {
  buildHostedLaborLanesPath,
  buildHostedOperationalProofPath,
  fetchBoardroomPresentations,
} from "@/lib/al-review";
import {
  buildHostedWrenchReadyDayReadinessPath,
  getWrenchReadyDayReadinessSummary,
} from "@/lib/wrenchready-day-readiness";

export type OpenClawCommand =
  | "command_catalog"
  | "attention_brief"
  | "planner_add_task"
  | "planner_list_tasks"
  | "boardroom_waiting_on_me"
  | "wrenchready_day_readiness"
  | "dominion_lead_attention"
  | "operational_proof"
  | "labor_lanes";

const OPENCLAW_COMMANDS: OpenClawCommand[] = [
  "command_catalog",
  "attention_brief",
  "planner_add_task",
  "planner_list_tasks",
  "boardroom_waiting_on_me",
  "wrenchready_day_readiness",
  "dominion_lead_attention",
  "operational_proof",
  "labor_lanes",
];

export interface OpenClawEnvelope {
  command?: OpenClawCommand;
  message?: string;
  actor?: "dez" | "al";
  title?: string;
  details?: string;
  dueDate?: string | null;
  assignedTo?: "dez" | "al";
  date?: string | null;
}

export interface OpenClawResult {
  ok: boolean;
  text: string;
  links?: Array<{ label: string; href: string }>;
  data?: Record<string, unknown>;
}

const CANONICAL_AL_ORIGIN =
  process.env.AL_CANONICAL_ORIGIN?.trim().replace(/\/+$/, "") || "https://al.dominionhomedeals.com";
const CANONICAL_AL_HOST = new URL(CANONICAL_AL_ORIGIN).host;

export function readOpenClawSharedSecret(): string {
  return (
    process.env.AL_OPENCLAW_SHARED_SECRET?.trim() ||
    process.env.OPENCLAW_AL_SHARED_SECRET?.trim() ||
    ""
  );
}

export function isOpenClawCommand(value: unknown): value is OpenClawCommand {
  return typeof value === "string" && OPENCLAW_COMMANDS.includes(value as OpenClawCommand);
}

function absolutePath(path: string) {
  return `${CANONICAL_AL_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function hostedPath(
  target:
    | "attention"
    | "planner"
    | "boardroom"
    | "wrenchready"
    | "dominion_leads"
    | "operational_proof"
    | "labor_lanes",
) {
  switch (target) {
    case "attention":
      return absolutePath("/attention");
    case "planner":
      return absolutePath("/planner");
    case "boardroom":
      return absolutePath("/boardroom");
    case "wrenchready":
      return absolutePath(buildHostedWrenchReadyDayReadinessPath(CANONICAL_AL_HOST));
    case "dominion_leads":
      return absolutePath(buildHostedDominionLeadsPath(CANONICAL_AL_HOST));
    case "operational_proof":
      return absolutePath(buildHostedOperationalProofPath(CANONICAL_AL_HOST));
    case "labor_lanes":
      return absolutePath(buildHostedLaborLanesPath(CANONICAL_AL_HOST));
    default:
      return CANONICAL_AL_ORIGIN;
  }
}

export function getOpenClawCommandCatalog() {
  return [
    {
      command: "command_catalog",
      summary: "List the supported AL mobile/automation commands and what each one does.",
    },
    {
      command: "attention_brief",
      summary: "Get the founder attention brief across Board Room, Planner, Dominion leads, and WrenchReady day readiness.",
    },
    {
      command: "dominion_lead_attention",
      summary: "Get the hottest Dominion seller-lead follow-up risks and links into the Dominion lead control lane.",
    },
    {
      command: "planner_add_task",
      summary: "Create a Planner task inside AL and return the Planner link.",
    },
    {
      command: "planner_list_tasks",
      summary: "List the top open Planner tasks across the operation.",
    },
    {
      command: "boardroom_waiting_on_me",
      summary: "Show Board Room items currently waiting on Dez or AL.",
    },
    {
      command: "wrenchready_day_readiness",
      summary: "Report tomorrow's WrenchReady day-readiness state and link to the control surface.",
    },
    {
      command: "operational_proof",
      summary: "Score the core AL control loops so you can see what is healthy, warning, or failing.",
    },
    {
      command: "labor_lanes",
      summary: "Show whether AL can actually replace labor in IT, marketing, customer service, accounting, and executive control.",
    },
  ];
}

function extractPlannerTaskFromMessage(message: string): Pick<
  OpenClawEnvelope,
  "title" | "details" | "assignedTo" | "dueDate"
> {
  const normalized = message.trim();
  const afterColon = normalized.includes(":")
    ? normalized.split(":").slice(1).join(":").trim()
    : normalized;
  let title = afterColon
    .replace(/^add\s+(a\s+)?planner\s+task/i, "")
    .replace(/^planner\s+task/i, "")
    .replace(/^todo/i, "")
    .trim();
  let assignedTo: "dez" | "al" = /(?:for|assigned to)\s+al\b/i.test(title) ? "al" : "dez";
  title = title.replace(/\b(?:for|assigned to)\s+(?:al|dez)\b/gi, "").trim();

  let dueDate: string | null = null;
  const dateMatch = title.match(/\bdue\s+(\d{4}-\d{2}-\d{2})\b/i);
  if (dateMatch?.[1]) {
    dueDate = dateMatch[1];
    title = title.replace(dateMatch[0], "").trim();
  } else if (/\btomorrow\b/i.test(title)) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    dueDate = `${year}-${month}-${day}`;
    title = title.replace(/\btomorrow\b/gi, "").trim();
  }

  title = title.replace(/^[\s:-]+|[\s:-]+$/g, "").trim();
  return {
    title: title || normalized,
    details: `Created from OpenClaw message: ${normalized}`,
    assignedTo,
    dueDate,
  };
}

export function inferOpenClawEnvelope(input: OpenClawEnvelope): OpenClawEnvelope | null {
  if (input.command) {
    return input;
  }

  const message = input.message?.trim();
  if (!message) {
    return null;
  }

  const lowered = message.toLowerCase();
  if (
    lowered.includes("help") ||
    lowered.includes("commands") ||
    lowered.includes("what can you do")
  ) {
    return { ...input, command: "command_catalog" };
  }

  if (
    lowered.includes("operational proof") ||
    lowered.includes("proof report") ||
    lowered.includes("are the loops healthy") ||
    lowered.includes("proof")
  ) {
    return { ...input, command: "operational_proof" };
  }

  if (
    lowered.includes("labor lane") ||
    lowered.includes("labour lane") ||
    lowered.includes("replace labor") ||
    lowered.includes("replace outsourcing") ||
    lowered.includes("marketing lane") ||
    lowered.includes("customer service lane") ||
    lowered.includes("accounting lane") ||
    lowered.includes("it lane")
  ) {
    return { ...input, command: "labor_lanes" };
  }

  if (
    lowered.includes("attention") ||
    lowered.includes("what needs my attention") ||
    lowered.includes("what needs attention")
  ) {
    return { ...input, command: "attention_brief" };
  }

  if (
    lowered.includes("dominion") &&
    (lowered.includes("lead") || lowered.includes("seller"))
  ) {
    return { ...input, command: "dominion_lead_attention" };
  }

  if (
    lowered.includes("day readiness") ||
    lowered.includes("tomorrow ready") ||
    lowered.includes("tomorrow status") ||
    lowered.includes("wrenchready tomorrow")
  ) {
    return { ...input, command: "wrenchready_day_readiness" };
  }

  if (
    lowered.includes("board room") ||
    lowered.includes("boardroom") ||
    lowered.includes("waiting on me")
  ) {
    return { ...input, command: "boardroom_waiting_on_me" };
  }

  if (
    lowered.includes("planner") &&
    (lowered.includes("add") || lowered.includes("create") || lowered.includes("todo"))
  ) {
    return {
      ...input,
      command: "planner_add_task",
      ...extractPlannerTaskFromMessage(message),
    };
  }

  if (lowered.includes("planner") || lowered.includes("tasks")) {
    return { ...input, command: "planner_list_tasks" };
  }

  return null;
}

export async function runOpenClawCommand(input: OpenClawEnvelope): Promise<OpenClawResult> {
  const resolved = inferOpenClawEnvelope(input);
  if (!resolved?.command) {
    return {
      ok: false,
      text:
        "OpenClaw message did not map cleanly to a supported AL command yet. Ask for help/commands, attention, Dominion leads, Planner, Board Room, or WrenchReady tomorrow readiness.",
      links: [{ label: "Attention", href: hostedPath("attention") }],
      data: { supportedCommands: getOpenClawCommandCatalog() as unknown as Record<string, unknown> },
    };
  }

  if (resolved.command === "command_catalog") {
    const commands = getOpenClawCommandCatalog();
    return {
      ok: true,
      text: commands.map((entry) => `- ${entry.command}: ${entry.summary}`).join("\n"),
      links: [
        { label: "Attention", href: hostedPath("attention") },
        { label: "Dominion Leads", href: hostedPath("dominion_leads") },
        { label: "Day Readiness", href: hostedPath("wrenchready") },
        { label: "Operational Proof", href: hostedPath("operational_proof") },
        { label: "Labor Lanes", href: hostedPath("labor_lanes") },
      ],
      data: { commands },
    };
  }

  if (resolved.command === "attention_brief") {
    const brief = await buildAttentionBrief();
    return {
      ok: true,
      text: [
        brief.waitingOnDez[0] ? `Waiting on Dez: ${brief.waitingOnDez[0].title}` : "",
        brief.blockedSystems[0] ? `Blocked: ${brief.blockedSystems[0].title}` : "",
        `Top next move: ${brief.topNextMove}`,
      ]
        .filter(Boolean)
        .join("\n"),
      links: [
        { label: "Attention", href: hostedPath("attention") },
        { label: "Planner", href: hostedPath("planner") },
        { label: "Board Room", href: hostedPath("boardroom") },
      ],
      data: brief as unknown as Record<string, unknown>,
    };
  }

  if (resolved.command === "planner_add_task") {
    if (!resolved.title?.trim()) {
      return { ok: false, text: "Planner task title is required." };
    }
    const task = await createPlannerTask({
      title: resolved.title,
      details: resolved.details || "",
      dueDate: resolved.dueDate || null,
      assignedTo: resolved.assignedTo || "dez",
      createdBy: "OpenClaw",
      source: "openclaw",
    });
    return {
      ok: true,
      text: `Added to Planner for ${task.assignedTo === "al" ? "AL" : "Dez"}: ${task.title}`,
      links: [{ label: "Open Planner", href: hostedPath("planner") }],
      data: { task },
    };
  }

  if (resolved.command === "planner_list_tasks") {
    const tasks = (await listPlannerTasks())
      .filter((task) => task.status === "open")
      .slice(0, 8);
    return {
      ok: true,
      text:
        tasks.length > 0
          ? tasks
              .map((task) => `- ${task.title} (${task.assignedTo === "al" ? "AL" : "Dez"})`)
              .join("\n")
          : "Planner is clear right now.",
      links: [{ label: "Open Planner", href: hostedPath("planner") }],
      data: { tasks },
    };
  }

  if (resolved.command === "dominion_lead_attention") {
    const summary = await buildDominionLeadAttentionSummary({
      host: CANONICAL_AL_HOST,
      origin: CANONICAL_AL_ORIGIN,
      limit: 6,
    });
    return {
      ok: true,
      text:
        summary.items.length > 0
          ? summary.items.map((item) => `- ${item.title}: ${item.reason}`).join("\n")
          : "No Dominion leads are screaming for attention right now.",
      links: [
        { label: "Dominion Leads", href: hostedPath("dominion_leads") },
        ...(summary.items.slice(0, 2).map((item) => ({ label: item.title, href: item.href }))),
      ],
      data: summary as unknown as Record<string, unknown>,
    };
  }

  if (resolved.command === "wrenchready_day_readiness") {
    const summary = await getWrenchReadyDayReadinessSummary(resolved.date || null, {
      host: CANONICAL_AL_HOST,
      origin: CANONICAL_AL_ORIGIN,
    });
    return {
      ok: true,
      text: summary.text,
      links: [{ label: "Open day-readiness", href: summary.href }],
      data: summary as unknown as Record<string, unknown>,
    };
  }

  if (resolved.command === "operational_proof") {
    const report = await buildOperationalProofReport({
      host: CANONICAL_AL_HOST,
      origin: CANONICAL_AL_ORIGIN,
    });
    return {
      ok: true,
      text: [
        `Top next move: ${report.topNextMove}`,
        `Healthy: ${report.summary.healthy}`,
        `Warning: ${report.summary.warning}`,
        `Failing: ${report.summary.failing}`,
      ].join("\n"),
      links: [{ label: "Open operational proof", href: hostedPath("operational_proof") }],
      data: report as unknown as Record<string, unknown>,
    };
  }

  if (resolved.command === "labor_lanes") {
    const report = await buildLaborLaneReport({
      host: CANONICAL_AL_HOST,
      origin: CANONICAL_AL_ORIGIN,
    });
    return {
      ok: true,
      text: [
        report.headline,
        `Top next move: ${report.topNextMove}`,
        ...report.lanes.map((lane) => `- ${lane.title}: ${lane.status} - ${lane.summary}`),
      ].join("\n"),
      links: [
        { label: "Labor Lanes", href: hostedPath("labor_lanes") },
        { label: "Operational Proof", href: hostedPath("operational_proof") },
        { label: "Attention", href: hostedPath("attention") },
      ],
      data: report as unknown as Record<string, unknown>,
    };
  }

  const actor = resolved.actor === "al" ? "AL" : "Dez";
  const presentations = (await fetchBoardroomPresentations("al.dominionhomedeals.com", 16))
    .filter((item) =>
      actor === "Dez"
        ? item.waitingOn === "Dez" || item.waitingOn === "Dez review"
        : item.waitingOn === "AL",
    )
    .slice(0, 6);
  return {
    ok: true,
    text:
      presentations.length > 0
        ? presentations.map((item) => `- ${item.title} (${item.waitingOn})`).join("\n")
        : `Nothing is actively waiting on ${actor}.`,
    links: presentations.slice(0, 3).map((item) => ({
      label: item.title,
      href: absolutePath(item.boardroomPath),
    })),
    data: { presentations },
  };
}
