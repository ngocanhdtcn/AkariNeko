"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { getCurrentPageTitle } from "@/lib/navigation";
import { AkariNekoWordmark } from "../branding/AkariNekoWordmark";

export function MobileHeader() {
  const pathname = usePathname();
  const currentPageTitle = getCurrentPageTitle(pathname);

  return (
    <header className="flex items-center justify-between rounded-[26px] border border-pink-100/80 bg-white/85 px-4 py-3 shadow-[0_18px_50px_rgba(236,72,153,0.09)] backdrop-blur-xl lg:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-violet-100 text-2xl shadow-sm">
          🌸
        </div>

        <div className="min-w-0">
          <AkariNekoWordmark
            size="sm"
            subtitle="一緒に頑張りましょう！🌸"
            className="origin-left scale-90"
          />

          <p className="-mt-1 text-sm font-bold text-pink-500">
            {currentPageTitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-pink-100 bg-white text-slate-700 shadow-sm"
        >
          <Search size={20} />
        </button>

        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-pink-100 bg-white text-slate-700 shadow-sm"
        >
          <Bell size={20} />

          <span className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-violet-200 text-xl shadow-sm"
        >
          👧🏻
        </button>
      </div>
    </header>
  );
}
