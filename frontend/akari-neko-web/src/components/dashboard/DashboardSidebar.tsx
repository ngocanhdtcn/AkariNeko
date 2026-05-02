"use client";

import { Moon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardMenuItems } from "@/data/dashboardData";
import { AkariNekoWordmark } from "../branding/AkariNekoWordmark";

type DashboardSidebarProps = {
  isCollapsed: boolean;
};

export function DashboardSidebar({ isCollapsed }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`hidden h-full min-h-0 rounded-[30px] border border-pink-100/80 bg-white/85 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.10)] backdrop-blur-xl transition-all duration-300 ease-out lg:grid lg:grid-rows-[auto_minmax(0,1fr)_auto] ${isCollapsed ? "px-4" : "px-5"
        }`}
    >
      <div
        className={`shrink-0 pb-6 pt-2 transition-all duration-300 ${isCollapsed ? "px-0 text-center" : "px-2"
          }`}
      >
        {isCollapsed ? (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-violet-100 text-2xl shadow-sm">
            🐱
          </div>
        ) : (
          <AkariNekoWordmark size="sm" subtitle="明るく・楽しく・日本語" />
        )}
      </div>

      <nav className="min-h-0 overflow-y-auto pr-1">
        <div className="grid gap-2 rounded-[26px] bg-white/70 p-3 shadow-sm">
          {dashboardMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <motion.div
                key={item.label}
                whileHover={{ x: isCollapsed ? 0 : 3 }}
                whileTap={{ scale: 0.99 }}
                transition={{
                  duration: 0.16,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex w-full items-center rounded-2xl text-sm font-bold ${isCollapsed
                      ? "justify-center px-0 py-3"
                      : "gap-3 px-4 py-2.5 text-left"
                    } ${isActive
                      ? "bg-gradient-to-r from-pink-100 to-rose-50 text-pink-600 shadow-sm"
                      : "text-slate-600 hover:bg-pink-50 hover:text-slate-900"
                    }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-pink-500 text-white" : "text-slate-400"
                      }`}
                  >
                    <Icon size={17} strokeWidth={2.3} />
                  </span>

                  {!isCollapsed ? <span>{item.label}</span> : null}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 space-y-3 pt-4">
        <button
          type="button"
          title="Dark mode"
          className={`flex w-full items-center rounded-2xl border border-pink-100 bg-white text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 ${isCollapsed
              ? "justify-center px-0 py-3"
              : "justify-between px-4 py-3"
            }`}
        >
          <span className="flex items-center gap-3">
            <Moon size={18} className="text-amber-400" />
            {!isCollapsed ? <span>Dark mode</span> : null}
          </span>

          {!isCollapsed ? (
            <span className="relative h-7 w-12 rounded-full bg-slate-200">
              <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow" />
            </span>
          ) : null}
        </button>

        <div className="rounded-[24px] border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-3 shadow-sm">
          <div
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"
              }`}
          >
            <div className={isCollapsed ? "text-3xl" : "text-4xl"}>🐱</div>

            {!isCollapsed ? (
              <div>
                <p className="font-bold text-slate-800">AkariNeko</p>
                <p className="text-xs text-slate-500">Phiên bản 1.0.0</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
