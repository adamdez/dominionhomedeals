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
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { withAlAppPrefix } from "@/lib/al-app-path";

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
    label: "Morning rundown",
    prompt:
      "Give me the morning rundown. What happened overnight, what is on deck today, and what needs my attention first?",
    icon: <Sun className="h-4 w-4" />,
    category: "Daily Ops",
  },
  {
    id: "status-check",
    label: "Shop check",
    prompt:
      "Run a full shop check across all businesses. Give me revenue, pipeline health, active work, and any loose bolts I need to know about.",
    icon: <Activity className="h-4 w-4" />,
    category: "Daily Ops",
  },
  {
    id: "weekly-review",
    label: "Weekly tune-up",
    prompt:
      "Let's do the weekly tune-up. Summarize wins, misses, key metrics, and what we should tighten up next week across the whole operation.",
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
    label: "Talk to Al",
    prompt: "",
    icon: <MessageCircle className="h-4 w-4" />,
    category: "Business",
  },
  {
    id: "ux-audit",
    label: "UX once-over",
    prompt:
      "Give the website a full UX once-over. Check every major user flow, find the friction, call out mobile pain points, and hand me the highest-leverage fixes we can ship this week.",
    icon: <Search className="h-4 w-4" />,
    category: "UX Specialists",
  },
  {
    id: "conversion-optimizer",
    label: "Conversion tune-up",
    prompt:
      "Tune up the full conversion funnel. Evaluate copy, hero, CTA flow, form design, trust signals, social proof, and page speed, then rank the changes by likely lift.",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "UX Specialists",
  },
  {
    id: "board-meeting",
    label: "Board check-in",
    prompt:
      "Run a board check-in. Consult Jerry and Tom, summarize what each reports, flag cross-business issues, and tell me what needs my attention.",
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
    label: "Available crews",
    prompt:
      "Call crew_list and tell me which crews are installed, what each one is good for, and when you would reach for tax-scout versus wrenchready versus both.",
    icon: <Bot className="h-4 w-4" />,
    category: "Crews",
  },
  {
    id: "run-tax-scout",
    label: "Run Tax Scout",
    prompt:
      "Run the Tax Scout crew locally. Use crew_list if needed, then crew_run with crew tax-scout. Stay with it until it finishes and give me the plain-English result.",
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
      codex_execution?: boolean;
    };
    coworkProbe?: {
      ok?: boolean | null;
      status?: string;
      detail?: string;
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
  const pathname = usePathname();
  const categories = [...new Set(quickActions.map((a) => a.category))];
  const localLaneRows = [
    {
      label: "Local bridge",
      status: bridgeConnected ? "live" : "blocked",
      detail: bridgeConnected ? "Connected for vault and local execution." : "Offline from this session.",
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
          : "Needs a connected bridge with media generation.",
    },
    {
      label: "Claude cowork backup",
      status:
        bridgeConnected && bridgeHealth?.capabilities?.cowork_execution
          ? "live"
          : bridgeConnected && bridgeHealth?.coworkProbe?.status
            ? "degraded"
            : "blocked",
      detail:
        bridgeConnected && bridgeHealth?.capabilities?.cowork_execution
          ? "Legacy Claude executor is available as a secondary local lane."
          : bridgeConnected &&
              bridgeHealth?.coworkProbe?.detail &&
              bridgeHealth?.capabilities?.codex_execution
            ? `Claude backup issue: ${bridgeHealth.coworkProbe.detail} Codex fallback is available, so coding work can still continue locally.`
            : bridgeConnected && bridgeHealth?.coworkProbe?.detail
              ? `Claude backup issue: ${bridgeHealth.coworkProbe.detail}`
            : "Secondary Claude executor is unavailable from this session.",
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
          : "Fallback browser lane is unavailable from this session.",
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
          fixed left-0 top-0 z-40 flex h-full w-72 flex-col pb-24
          border-r border-amber-700/20 bg-[#0d1410]
          transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0
          lg:pb-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div
          className="al-flannel-panel flex items-center justify-between border-b border-amber-700/20 px-5 pb-5 pt-6"
          style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase al-brass-label">
                Straight Answer
              </p>
              <h2 className="text-sm font-semibold text-[#f2f6f3]">
                Al Boreland
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                <span className="text-xs text-emerald-100/50">Steady hand online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-3 text-emerald-200/45 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200/65 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 al-scrollbar">
          <div className="mb-5 px-2">
            <div className="space-y-2">
              <Link
                href={withAlAppPrefix(pathname, "/boardroom")}
                className="al-shop-card flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#f2f6f3] transition hover:border-amber-400/35 hover:bg-amber-500/5 active:scale-[0.99]"
                onClick={onClose}
              >
                <span>Board Room</span>
                <span className="text-xs uppercase tracking-[0.18em] text-amber-300/55">Open</span>
              </Link>
              <Link
                href={withAlAppPrefix(pathname, "/attention")}
                className="al-shop-card flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#f2f6f3] transition hover:border-amber-400/35 hover:bg-amber-500/5 active:scale-[0.99]"
                onClick={onClose}
              >
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400/65" />
                  Attention
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-amber-300/55">Open</span>
              </Link>
              <Link
                href={withAlAppPrefix(pathname, "/planner")}
                className="al-shop-card flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#f2f6f3] transition hover:border-amber-400/35 hover:bg-amber-500/5 active:scale-[0.99]"
                onClick={onClose}
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-emerald-400/65" />
                  Planner
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-amber-300/55">Open</span>
              </Link>
              <Link
                href={withAlAppPrefix(pathname, "/operational-proof")}
                className="al-shop-card flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#f2f6f3] transition hover:border-amber-400/35 hover:bg-amber-500/5 active:scale-[0.99]"
                onClick={onClose}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400/65" />
                  Operational Proof
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-amber-300/55">Open</span>
              </Link>
              <Link
                href={withAlAppPrefix(pathname, "/dominion/leads")}
                className="al-shop-card flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#f2f6f3] transition hover:border-amber-400/35 hover:bg-amber-500/5 active:scale-[0.99]"
                onClick={onClose}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-400/65" />
                  Dominion Leads
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-amber-300/55">Open</span>
              </Link>
              <Link
                href={withAlAppPrefix(pathname, "/wrenchready/day-readiness")}
                className="al-shop-card flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#f2f6f3] transition hover:border-amber-400/35 hover:bg-amber-500/5 active:scale-[0.99]"
                onClick={onClose}
              >
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-emerald-400/65" />
                  Day Readiness
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-amber-300/55">Open</span>
              </Link>
            </div>
          </div>

          <div className="mb-5">
            <div className="px-2">
              <button
                type="button"
                onClick={() => setShowRuntime((value) => !value)}
                className="al-shop-card flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:border-amber-400/30 hover:bg-amber-500/5"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/50">
                    Runtime
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/72">
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
                <div className="al-shop-card mt-2 rounded-xl p-3">
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
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/50">
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/50">
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
              <h3 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300/45">
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
