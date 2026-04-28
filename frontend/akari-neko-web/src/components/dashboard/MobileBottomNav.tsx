"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems } from "@/data/dashboardData";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 grid h-18 grid-cols-5 rounded-[28px] border border-pink-100 bg-white/95 shadow-[0_18px_50px_rgba(236,72,153,0.18)] backdrop-blur-xl lg:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-bold transition ${
              isActive ? "text-violet-500" : "text-slate-500"
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.7 : 2.2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
