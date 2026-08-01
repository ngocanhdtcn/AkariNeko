"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { mobileNavItems } from "@/data/dashboardData";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const navItems =
    profile?.role === "admin"
      ? [
          ...mobileNavItems,
          {
            icon: ShieldCheck,
            label: "Duyệt",
            href: "/admin/users",
            active: false,
          },
        ]
      : mobileNavItems;

  return (
    <nav
      className="akari-mobile-bottom-nav fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 grid h-18 rounded-[28px] border border-pink-100 bg-white shadow-[0_8px_24px_rgba(236,72,153,0.14)] sm:inset-x-4 lg:hidden"
      style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`m-1 flex flex-col items-center justify-center gap-1 rounded-[22px] text-xs font-bold outline-none transition focus-visible:ring-4 focus-visible:ring-pink-100 ${
              isActive
                ? "bg-gradient-to-br from-pink-50 to-violet-50 text-violet-500 shadow-sm"
                : "text-slate-500 hover:bg-pink-50 hover:text-slate-700"
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
