"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutPanelTop, MessageCircle } from "lucide-react";

const navItems = [
  { href: "/", label: "Chat", icon: MessageCircle },
  { href: "/boardroom", label: "Board Room", icon: LayoutPanelTop },
  { href: "/planner", label: "Planner", icon: CalendarDays },
];

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-[260] border-t border-emerald-900/25 bg-[#08100c]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/" || pathname === "/al"
              : pathname === item.href || pathname === `/al${item.href}`;

          return (
            <Link
              key={item.href}
              href={item.href}
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
