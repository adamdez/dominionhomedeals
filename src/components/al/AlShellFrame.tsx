"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookUp,
  Building2,
  CalendarDays,
  LayoutPanelTop,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { withAlAppPrefix } from "@/lib/al-app-path";

const sectionLinks = [
  { href: "/", label: "Command Center", icon: MessageCircle, note: "Talk to AL" },
  { href: "/inbox", label: "Inbox", icon: BookUp, note: "Queue asks without blocking chat" },
  { href: "/attention", label: "Attention", icon: Activity, note: "What needs action" },
  { href: "/operational-proof", label: "Operational Proof", icon: ShieldCheck, note: "Are the loops healthy?" },
  { href: "/labor-lanes", label: "Labor Lanes", icon: Receipt, note: "Can AL replace labor here?" },
  { href: "/boardroom", label: "Board Room", icon: LayoutPanelTop, note: "Approvals and packages" },
  { href: "/planner", label: "Planner", icon: CalendarDays, note: "Task truth" },
  { href: "/dominion/leads", label: "Dominion Leads", icon: Building2, note: "First touch and follow-up" },
  { href: "/wrenchready/day-readiness", label: "Day Readiness", icon: Wrench, note: "Protect wrench time" },
];

export function AlShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCommandCenter = pathname === "/al" || pathname === "/";

  if (isCommandCenter) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full w-full">
      <aside className="hidden h-full w-72 shrink-0 border-r border-slate-700/55 bg-[#09101f] lg:flex lg:flex-col">
        <div className="border-b border-slate-700/55 px-5 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400/80">
            AL Navigation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#f4f8ff]">Operator map</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300/80">
            Stay inside one control surface while moving between command, approvals, tasks, and operating checks.
          </p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4 al-scrollbar">
          {sectionLinks.map((item) => {
            const href = withAlAppPrefix(pathname, item.href);
            const active = pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={href}
                className={`block rounded-2xl border px-4 py-4 transition ${
                  active
                    ? "border-sky-500/30 bg-sky-500/12"
                    : "border-slate-700/55 bg-[#0d1527] hover:border-sky-500/35 hover:bg-sky-500/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      active ? "bg-sky-500 text-slate-950" : "bg-[#0a1222] text-sky-200/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#f4f8ff]">{item.label}</p>
                    <p className="text-xs text-slate-300/70">{item.note}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-h-0 min-w-0 flex-1">{children}</div>
    </div>
  );
}
