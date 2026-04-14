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
  BookUp,
  Receipt,
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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const pathname = usePathname();
  const categories = [...new Set(quickActions.map((a) => a.category))];
  const featuredQuickActionIds = new Set([
    "morning-brief",
    "board-meeting",
    "new-project",
    "ask-anything",
  ]);
  const coreLinks = [
    {
      href: "/",
      label: "Command Center",
      detail: "Start here",
      icon: <Sparkles className="h-4 w-4 text-sky-300/75" />,
    },
    {
      href: "/attention",
      label: "Attention",
      detail: "What needs action",
      icon: <Activity className="h-4 w-4 text-sky-300/75" />,
    },
    {
      href: "/inbox",
      label: "Inbox",
      detail: "Queue asks without blocking chat",
      icon: <BookUp className="h-4 w-4 text-sky-300/75" />,
    },
    {
      href: "/boardroom",
      label: "Board Room",
      detail: "Approvals and packages",
      icon: <Users className="h-4 w-4 text-sky-300/75" />,
    },
    {
      href: "/planner",
      label: "Planner",
      detail: "Task truth",
      icon: <CalendarDays className="h-4 w-4 text-sky-300/75" />,
    },
    {
      href: "/operational-proof",
      label: "System Health",
      detail: "Can we trust the loops?",
      icon: <ShieldCheck className="h-4 w-4 text-sky-300/75" />,
    },
  ] as const;
  const businessLinks = [
    {
      href: "/dominion/leads",
      label: "Dominion Leads",
      detail: "First touch and follow-up",
      icon: <Building2 className="h-4 w-4 text-sky-300/75" />,
    },
    {
      href: "/wrenchready/day-readiness",
      label: "Day Readiness",
      detail: "Protect wrench time",
      icon: <Wrench className="h-4 w-4 text-sky-300/75" />,
    },
    {
      href: "/labor-lanes",
      label: "Labor Lanes",
      detail: "Can AL replace labor here?",
      icon: <Receipt className="h-4 w-4 text-sky-300/75" />,
    },
  ] as const;
  const extendedQuickActionCategories = categories.filter((category) =>
    quickActions.some(
      (action) => action.category === category && !featuredQuickActionIds.has(action.id),
    ),
  );
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
      return "border-[rgba(0,229,155,0.15)] bg-[rgba(0,229,155,0.06)] text-[#00e59b]";
    }
    if (status === "degraded") {
      return "border-[rgba(255,176,32,0.15)] bg-[rgba(255,176,32,0.06)] text-[#ffb020]";
    }
    return "border-[rgba(255,77,106,0.15)] bg-[rgba(255,77,106,0.06)] text-[#ff4d6a]";
  }

  function navItemClasses(href: string) {
    const target = withAlAppPrefix(pathname, href);
    const active = pathname === target;
    return active
      ? "border-transparent bg-transparent text-[var(--al-text-primary)]"
      : "border-transparent bg-transparent text-[var(--al-text-secondary)] hover:text-[var(--al-text-primary)] hover:bg-[var(--al-cyan-dim)]";
  }

  function navActiveBar(href: string) {
    const target = withAlAppPrefix(pathname, href);
    return pathname === target;
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-full w-72 flex-col pb-24
          transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0
          lg:pb-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "var(--al-glass-bg-elevated)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 al-separator-v" />

        <div
          className="relative flex items-center justify-between px-5 pb-5 pt-6"
          style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)", background: "var(--al-surface-0)" }}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 al-separator-h" />
          <div className="flex items-center gap-3">
            <div className="al-avatar-ring flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--al-cyan-dim)]">
              <Sparkles className="h-4 w-4 text-[var(--al-cyan)]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase al-brass-label font-mono">
                AL operator
              </p>
              <h2 className="text-sm font-semibold text-[var(--al-text-primary)] al-glow-text">
                Al Boreland
              </h2>
              <p className="text-xs text-[var(--al-text-tertiary)]">Command and follow-through</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-3 text-[var(--al-text-tertiary)] transition-colors hover:bg-[var(--al-cyan-dim)] hover:text-[var(--al-cyan)] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 al-scrollbar">
          <div className="mb-5 px-2">
            <div className="mb-3">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider font-mono text-[var(--al-cyan-muted)]">
                Core
              </p>
              <div className="mt-2 space-y-0.5">
                {coreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={withAlAppPrefix(pathname, link.href)}
                    className={`group relative flex items-start gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left transition active:scale-[0.99] ${navItemClasses(link.href)}`}
                    onClick={onClose}
                  >
                    {navActiveBar(link.href) && (
                      <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-[var(--al-cyan)] shadow-[0_0_8px_var(--al-cyan)]" />
                    )}
                    <span className={`mt-0.5 flex-shrink-0 ${navActiveBar(link.href) ? "text-[var(--al-cyan)]" : ""}`}>{link.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{link.label}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--al-text-tertiary)]">{link.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider font-mono text-[var(--al-cyan-muted)]">
                Business lanes
              </p>
              <div className="mt-2 space-y-0.5">
                {businessLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={withAlAppPrefix(pathname, link.href)}
                    className={`group relative flex items-start gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left transition active:scale-[0.99] ${navItemClasses(link.href)}`}
                    onClick={onClose}
                  >
                    {navActiveBar(link.href) && (
                      <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-[var(--al-cyan)] shadow-[0_0_8px_var(--al-cyan)]" />
                    )}
                    <span className={`mt-0.5 flex-shrink-0 ${navActiveBar(link.href) ? "text-[var(--al-cyan)]" : ""}`}>{link.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{link.label}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--al-text-tertiary)]">{link.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div className="px-2">
              <button
                type="button"
                onClick={() => setShowRuntime((value) => !value)}
                className="al-glass-subtle flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:border-[var(--al-border-hover)]"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider font-mono text-[var(--al-cyan-muted)]">
                    Runtime
                  </p>
                  <p className="mt-1 text-xs text-[var(--al-text-secondary)]">
                    {hostedRuntimeTruth
                      ? `${hostedRuntimeTruth.summary.live} live, ${hostedRuntimeTruth.summary.degraded} degraded`
                      : "Runtime status unavailable"}
                    {" · "}
                    {bridgeConnected ? "local bridge connected" : "local bridge offline"}
                  </p>
                </div>
                {showRuntime ? (
                  <ChevronDown className="h-4 w-4 text-[var(--al-text-tertiary)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--al-text-tertiary)]" />
                )}
              </button>

              {showRuntime ? (
                <div className="al-glass-subtle mt-2 rounded-xl p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onQuickAction(
                          "Run a status check and summarize what is live, degraded, blocked, and what needs action now.",
                        )
                      }
                      className="rounded-xl al-glass-subtle px-3 py-2 text-xs font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)]"
                    >
                      Run status check
                    </button>
                  </div>

                  {hostedRuntimeTruth ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] font-mono text-[var(--al-cyan-muted)]">
                        Hosted lanes
                      </p>
                      {hostedRuntimeTruth.lanes.map((lane) => (
                        <div
                          key={lane.id}
                          className={`rounded-lg border px-3 py-2 ${statusClasses(lane.status)}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold font-mono">{lane.label}</span>
                            <span className="text-[10px] uppercase tracking-wide font-mono opacity-75">
                              {lane.status}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] opacity-80 font-mono">
                            {lane.primaryMode}
                            {lane.fallbackMode ? ` -> ${lane.fallbackMode}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] font-mono text-[var(--al-cyan-muted)]">
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
                          <span className="text-[11px] font-semibold font-mono">{lane.label}</span>
                          <span className="text-[10px] uppercase tracking-wide font-mono opacity-75">
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

          <div className="mb-5">
            <div className="px-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider font-mono text-[var(--al-cyan-muted)]">
                Start here
              </p>
              <div className="mt-2 space-y-0.5">
                {quickActions
                  .filter((action) => featuredQuickActionIds.has(action.id))
                  .map((action) => (
                    <button
                      key={action.id}
                      onClick={() => onQuickAction(action.prompt)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--al-text-secondary)] transition-all hover:bg-[var(--al-cyan-dim)] hover:text-[var(--al-cyan)] active:scale-[0.98]"
                    >
                      <span className="flex-shrink-0 text-[var(--al-cyan-muted)]">
                        {action.icon}
                      </span>
                      {action.label}
                    </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowQuickActions((value) => !value)}
                className="mt-2 flex w-full items-center justify-between rounded-xl al-glass-subtle px-3 py-3 text-left transition hover:border-[var(--al-border-hover)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--al-text-primary)]">More quick asks</p>
                  <p className="mt-0.5 text-[11px] text-[var(--al-text-tertiary)]">
                    Specialist prompts and CEO shortcuts
                  </p>
                </div>
                {showQuickActions ? (
                  <ChevronDown className="h-4 w-4 text-[var(--al-text-tertiary)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--al-text-tertiary)]" />
                )}
              </button>
            </div>

            {showQuickActions ? (
              <div className="mt-3">
                {extendedQuickActionCategories.map((category) => (
                  <div key={category} className="mb-4">
                    <h3 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider font-mono text-[var(--al-cyan-muted)]">
                      {category}
                    </h3>
                    <div className="space-y-0.5">
                      {quickActions
                        .filter(
                          (action) =>
                            action.category === category && !featuredQuickActionIds.has(action.id),
                        )
                        .map((action) => (
                          <button
                            key={action.id}
                            onClick={() => onQuickAction(action.prompt)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--al-text-secondary)] transition-all hover:bg-[var(--al-cyan-dim)] hover:text-[var(--al-cyan)] active:scale-[0.98]"
                          >
                            <span className="flex-shrink-0 text-[var(--al-cyan-muted)]">
                              {action.icon}
                            </span>
                            {action.label}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="relative p-3">
          <div className="pointer-events-none absolute inset-x-0 top-0 al-separator-h" />
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--al-text-secondary)] transition-all hover:bg-[var(--al-cyan-dim)] hover:text-[var(--al-cyan)]"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}
