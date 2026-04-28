"use client";

import { Bell, ChevronDown, Home, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  getCurrentPageTitle,
  getCurrentSearchPlaceholder,
} from "@/lib/navigation";

type DashboardTopBarProps = {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function DashboardTopBar({
  isSidebarCollapsed,
  onToggleSidebar,
}: DashboardTopBarProps) {
  const pathname = usePathname();
  const currentPageTitle = getCurrentPageTitle(pathname);
  const searchPlaceholder = getCurrentSearchPlaceholder(pathname);

  return (
    <header className="hidden min-h-[88px] grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[30px] border border-pink-100/80 bg-white/85 px-5 py-4 shadow-[0_18px_50px_rgba(236,72,153,0.09)] backdrop-blur-xl lg:grid">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={
            isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-700 shadow-sm transition hover:bg-pink-50"
          onClick={onToggleSidebar}
        >
          <Menu
            size={26}
            strokeWidth={2.2}
            className={`transition-transform duration-300 ${
              isSidebarCollapsed ? "rotate-90" : ""
            }`}
          />
        </button>

        <div className="hidden items-center gap-2 font-bold text-pink-500 sm:flex">
          <Home size={18} strokeWidth={2.4} />
          <span>{currentPageTitle}</span>
        </div>
      </div>

      <div className="mx-auto hidden h-14 w-full max-w-[620px] items-center rounded-full border border-pink-100 bg-white px-5 text-sm text-slate-400 shadow-inner md:flex">
        <Search size={19} className="mr-3 text-slate-500" />
        <span>{searchPlaceholder}</span>

        <span className="ml-auto rounded-lg border border-slate-100 px-2 py-1 text-xs text-slate-400">
          Ctrl + K
        </span>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-700 shadow-sm transition hover:bg-pink-50"
        >
          <Bell size={22} strokeWidth={2.2} />

          <span className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <button
          type="button"
          className="flex h-14 min-w-[210px] items-center gap-3 rounded-2xl border border-pink-100 bg-white px-3 shadow-sm transition hover:bg-pink-50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-violet-200 text-2xl">
            👧🏻
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-bold text-slate-800">
              Ngọc Ánh
            </p>
            <p className="text-xs text-slate-500">Level 12</p>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-pink-100">
              <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
            </div>
          </div>

          <ChevronDown size={17} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
}
