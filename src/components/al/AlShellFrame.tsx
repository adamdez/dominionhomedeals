"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
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
  const isCommandCenter = pathname === "/al";

  if (isCommandCenter) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full w-full">
      <aside className="hidden h-full w-72 shrink-0 border-r border-emerald-900/20 bg-[#0b120e] lg:flex lg:flex-col">
        <div className="border-b border-emerald-900/20 px-5 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/45">
            AL Navigation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">Keep the bolts tight</h2>
          <p className="mt-3 text-sm leading-6 text-emerald-100/60">
            Stay inside the same AL truth system while moving between command, approvals, tasks, and daily operating checks.
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
                    ? "border-emerald-500/25 bg-emerald-500/10"
                    : "border-emerald-900/20 bg-[#101714] hover:border-emerald-500/30 hover:bg-emerald-500/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      active ? "bg-emerald-500 text-[#05110b]" : "bg-[#0b120e] text-emerald-200/70"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#f3faf6]">{item.label}</p>
                    <p className="text-xs text-emerald-100/45">{item.note}</p>
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
