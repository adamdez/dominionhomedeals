"use client";

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
} from "lucide-react";

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
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAction: (prompt: string) => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onQuickAction,
  onOpenSettings,
}: SidebarProps) {
  const categories = [...new Set(quickActions.map((a) => a.category))];

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
