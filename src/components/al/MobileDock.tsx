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
    <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-[260] border-t border-emerald-900/25 bg-[#08100c]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-9 gap-2">
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
              className={`flex min-h-[60px] flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                active
                  ? "bg-emerald-500 text-[#05110b]"
                  : "border border-emerald-900/25 bg-[#111916] text-emerald-100/75"
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span className="text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
