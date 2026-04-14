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
      <aside
        className="relative hidden h-full w-72 shrink-0 lg:flex lg:flex-col"
        style={{ background: "var(--al-glass-bg)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[var(--al-cyan)]/15 to-transparent" />

        <div className="relative px-5 py-6" style={{ background: "var(--al-surface-0)" }}>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--al-cyan)]/12 to-transparent" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] font-mono text-[var(--al-cyan-muted)]">
            AL Navigation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--al-text-primary)] al-glow-text">Operator map</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--al-text-secondary)]">
            Stay inside one control surface while moving between command, approvals, tasks, and operating checks.
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4 al-scrollbar">
          {sectionLinks.map((item) => {
            const href = withAlAppPrefix(pathname, item.href);
            const active = pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={href}
                className={`relative block overflow-hidden rounded-2xl border px-4 py-4 transition ${
                  active
                    ? "border-transparent bg-transparent"
                    : "border-transparent bg-transparent hover:bg-[var(--al-cyan-dim)]"
                }`}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-[var(--al-cyan)] shadow-[0_0_8px_var(--al-cyan)]" />
                )}
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      active ? "bg-[var(--al-cyan)] text-[var(--al-void)]" : "bg-[var(--al-surface-0)] text-[var(--al-cyan-muted)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--al-text-primary)]">{item.label}</p>
                    <p className="text-xs text-[var(--al-text-tertiary)]">{item.note}</p>
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
