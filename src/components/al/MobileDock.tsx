"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookUp, Building2, CalendarDays, LayoutPanelTop, MessageCircle, Receipt, ShieldCheck, Wrench } from "lucide-react";
import { alAppPrefix } from "@/lib/al-app-path";

const navItems = [
  { href: "/", label: "Talk", icon: MessageCircle },
  { href: "/inbox", label: "Inbox", icon: BookUp },
  { href: "/attention", label: "Attention", icon: Activity },
  { href: "/operational-proof", label: "Proof", icon: ShieldCheck },
  { href: "/labor-lanes", label: "Lanes", icon: Receipt },
  { href: "/boardroom", label: "Board Room", icon: LayoutPanelTop },
  { href: "/planner", label: "Punch List", icon: CalendarDays },
  { href: "/dominion/leads", label: "Leads", icon: Building2 },
  { href: "/wrenchready/day-readiness", label: "Day Ready", icon: Wrench },
];

export function MobileDock() {
  const pathname = usePathname();
  const appPrefix = alAppPrefix(pathname);

  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[260] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 lg:hidden"
      style={{ background: "rgba(5,9,17,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--al-cyan)]/15 to-transparent" />
      <div className="mx-auto grid max-w-md grid-cols-9 gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const href =
            item.href === "/"
              ? appPrefix || "/"
              : `${appPrefix}${item.href}`;
          const active =
            href === "/"
              ? pathname === "/" || pathname === "/al"
              : pathname === href;

          return (
            <Link
              key={item.href}
              href={href}
              className={`relative flex min-h-[56px] flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
                active
                  ? "text-[var(--al-cyan)]"
                  : "text-[var(--al-text-tertiary)]"
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span className="text-center leading-tight">{item.label}</span>
              {active && (
                <span className="absolute bottom-1 h-[3px] w-[3px] rounded-full bg-[var(--al-cyan)] shadow-[0_0_6px_var(--al-cyan)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
