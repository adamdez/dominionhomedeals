"use client";

import Link from "next/link";
import {
  Sun,
  Activity,
  FolderPlus,
  CalendarCheck,
  MessageCircle,
  Search,
  TrendingUp,
  Settings,
  X,
  Sparkles,
  Users,
  Building2,
  Wrench,
  Receipt,
  Heart,
  Bot,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
  category: string;
}

const quickActions: QuickAction[] = [
  {
    id: "morning-brief",
    label: "Morning Brief",
    prompt:
      "Give me my morning brief. What happened overnight, what's on the schedule today, and what needs my immediate attention?",
    icon: <Sun className="h-4 w-4" />,
    category: "Daily Ops",
  },
  {
    id: "status-check",
    label: "Status Check",
    prompt:
      "Run a status check across all businesses. Revenue, pipeline health, active deals, and any red flags for each entity.",
    icon: <Activity className="h-4 w-4" />,
    category: "Daily Ops",
  },
  {
    id: "weekly-review",
    label: "Weekly Review",
    prompt:
      "Let's do the weekly review. Summarize this week's wins, misses, key metrics, and set priorities for next week across all operations.",
    icon: <CalendarCheck className="h-4 w-4" />,
    category: "Daily Ops",
  },
  {
    id: "new-project",
    label: "New Project",
    prompt:
      "I want to kick off a new project. Walk me through setup — what info do you need, what's the timeline look like, and what resources should we allocate?",
    icon: <FolderPlus className="h-4 w-4" />,
    category: "Business",
  },
  {
    id: "ask-anything",
    label: "Ask Al Anything",
    prompt: "",
    icon: <MessageCircle className="h-4 w-4" />,
    category: "Business",
  },
  {
    id: "ux-audit",
    label: "UX Audit",
    prompt:
      "Run a full UX audit on our current website. Analyze every user flow from landing to lead form submission. Identify friction points, accessibility gaps, mobile pain points, and give me a ranked list of quick wins we can ship this week.",
    icon: <Search className="h-4 w-4" />,
    category: "UX Specialists",
  },
  {
    id: "conversion-optimizer",
    label: "Conversion Optimizer",
    prompt:
      "Analyze our entire conversion funnel end-to-end. Evaluate landing page copy, hero sections, CTAs, form design, trust signals, social proof placement, and page speed. Give me specific, actionable changes ranked by expected impact on lead conversion rates with estimated lift percentages.",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "UX Specialists",
  },
  {
    id: "board-meeting",
    label: "Board Meeting",
    prompt:
      "Run a board meeting. Consult Jerry and Tom for a brief status update on their business. Summarize what each reports, flag cross-business issues, and tell me what needs my attention.",
    icon: <Users className="h-4 w-4" />,
    category: "Board",
  },
  {
    id: "dominion-ceo",
    label: "Jerry",
    prompt:
      "Consult Jerry. I want a full status report on the real estate operation - pipeline health, active leads, recent decisions, economic risks, and recommended next actions.",
    icon: <Building2 className="h-4 w-4" />,
    category: "Board",
  },
  {
    id: "wrenchready-ceo",
    label: "Tom",
    prompt:
      "Consult Tom. I want a full status report - bookings this week, profit per service day, Simon's schedule, route quality, and what needs attention.",
    icon: <Wrench className="h-4 w-4" />,
    category: "Board",
  },
  {
    id: "list-crews",
    label: "Available Crews",
    prompt:
      "Call crew_list (I'll approve) and tell me which CrewAI crews are installed, what each one does, and when you'd run tax-scout vs wrenchready vs both.",
    icon: <Bot className="h-4 w-4" />,
    category: "Crews",
  },
  {
    id: "run-tax-scout",
    label: "Run Tax Scout crew",
    prompt:
      "I want to run the Tax Scout crew locally. Use crew_list if needed, then crew_run with crew tax-scout. After it starts, use crew_status until the run finishes and summarize the output for me.",
    icon: <Bot className="h-4 w-4" />,
    category: "Crews",
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAction: (prompt: string) => void;
  onOpenSettings: () => void;
  hostedRuntimeTruth: {
    generatedAt: string;
    summary: { live: number; degraded: number; blocked: number };
    lanes: Array<{
      id: string;
      label: string;
      status: "live" | "degraded" | "blocked";
      primaryMode: "hosted" | "local-bridge" | "mixed";
      fallbackMode: "hosted" | "local-bridge" | "mixed" | null;
      detail: string;
    }>;
  } | null;
  bridgeConnected: boolean;
  bridgeHealth: {
    capabilities?: {
      media_generation?: boolean;
      browser_automation?: boolean;
      cowork_execution?: boolean;
    };
  } | null;
}

export function Sidebar({
  isOpen,
  onClose,
  onQuickAction,
  onOpenSettings,
  hostedRuntimeTruth,
  bridgeConnected,
  bridgeHealth,
}: SidebarProps) {
  const [showRuntime, setShowRuntime] = useState(false);
  const categories = [...new Set(quickActions.map((a) => a.category))];
  const localLaneRows = [
    {
      label: "Local bridge",
      status: bridgeConnected ? "live" : "blocked",
      detail: bridgeConnected ? "Connected for vault and local execution." : "Offline from this operator session.",
    },
    {
      label: "Media lane",
      status:
        bridgeConnected && bridgeHealth?.capabilities?.media_generation
          ? "live"
          : "blocked",
      detail:
        bridgeConnected && bridgeHealth?.capabilities?.media_generation
          ? "Local media generation available."
          : "Needs connected bridge with media_generation capability.",
    },
    {
      label: "Local browser fallback",
      status:
        bridgeConnected && bridgeHealth?.capabilities?.browser_automation
          ? "live"
          : "blocked",
      detail:
        bridgeConnected && bridgeHealth?.capabilities?.browser_automation
          ? "Fallback browser automation available."
          : "Fallback browser lane unavailable from this session.",
    },
  ];

  function statusClasses(status: "live" | "degraded" | "blocked") {
    if (status === "live") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/70";
    }
    if (status === "degraded") {
      return "border-amber-500/20 bg-amber-500/10 text-amber-200/70";
    }
    return "border-red-500/20 bg-red-500/10 text-red-200/70";
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-full w-72 flex-col
          border-r border-emerald-900/20 bg-[#0d1410]
          transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between border-b border-emerald-900/20 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#e2ede8]">
                Al Boreland
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                <span className="text-xs text-emerald-200/40">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-200/40 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200/60 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 al-scrollbar">
          <div className="mb-5 px-2">
            <Link
              href="/al/boardroom"
              className="flex items-center justify-between rounded-xl border border-emerald-900/20 bg-[#111916] px-3 py-3 text-sm font-semibold text-[#e2ede8] transition hover:border-emerald-500/35 hover:bg-emerald-500/10"
            >
              <span>Board Room</span>
              <span className="text-xs uppercase tracking-[0.18em] text-emerald-300/45">Open</span>
            </Link>
          </div>

          <div className="mb-5">
            <div className="px-2">
              <button
                type="button"
                onClick={() => setShowRuntime((value) => !value)}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-900/20 bg-[#111916] px-3 py-3 text-left transition hover:border-emerald-500/25 hover:bg-emerald-500/5"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/25">
                    Runtime
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/70">
                    {hostedRuntimeTruth
                      ? `${hostedRuntimeTruth.summary.live} live, ${hostedRuntimeTruth.summary.degraded} degraded`
                      : "Runtime status unavailable"}
                    {" · "}
                    {bridgeConnected ? "local bridge connected" : "local bridge offline"}
                  </p>
                </div>
                {showRuntime ? (
                  <ChevronDown className="h-4 w-4 text-emerald-200/45" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-emerald-200/45" />
                )}
              </button>

              {showRuntime ? (
                <div className="mt-2 rounded-xl border border-emerald-900/20 bg-[#111916] p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onQuickAction(
                          "Run a status check and summarize what is live, degraded, blocked, and what needs action now.",
                        )
                      }
                      className="rounded-xl border border-emerald-800/40 bg-[#0b110e] px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-500/45"
                    >
                      Run status check
                    </button>
                  </div>

                  {hostedRuntimeTruth ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/40">
                        Hosted lanes
                      </p>
                      {hostedRuntimeTruth.lanes.map((lane) => (
                        <div
                          key={lane.id}
                          className={`rounded-lg border px-3 py-2 ${statusClasses(lane.status)}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold">{lane.label}</span>
                            <span className="text-[10px] uppercase tracking-wide opacity-75">
                              {lane.status}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] opacity-80">
                            {lane.primaryMode}
                            {lane.fallbackMode ? ` -> ${lane.fallbackMode}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/40">
                      Local lanes
                    </p>
                    {localLaneRows.map((lane) => (
                      <div
                        key={lane.label}
                        className={`rounded-lg border px-3 py-2 ${statusClasses(
                          lane.status as "live" | "degraded" | "blocked",
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold">{lane.label}</span>
                          <span className="text-[10px] uppercase tracking-wide opacity-75">
                            {lane.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] opacity-80">{lane.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {categories.map((category) => (
            <div key={category} className="mb-5">
              <h3 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-200/25">
                {category}
              </h3>
              <div className="space-y-0.5">
                {quickActions
                  .filter((a) => a.category === category)
                  .map((action) => (
                    <button
                      key={action.id}
                      onClick={() => onQuickAction(action.prompt)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-emerald-100/60 transition-all hover:bg-emerald-500/10 hover:text-emerald-50 active:scale-[0.98]"
                    >
                      <span className="flex-shrink-0 text-emerald-400/50">
                        {action.icon}
                      </span>
                      {action.label}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-emerald-900/20 p-3">
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-emerald-200/35 transition-all hover:bg-emerald-500/10 hover:text-emerald-200/60"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}
