"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardMenuItems } from "@/data/dashboardData";
import { AkariNekoWordmark } from "../branding/AkariNekoWordmark";
import { useMessageNotification } from "@/contexts/MessageNotificationContext";
import { useTheme } from "@/contexts/ThemeContext";

type DashboardSidebarProps = {
  isCollapsed: boolean;
};

export function DashboardSidebar({ isCollapsed }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { unreadMessageCount } = useMessageNotification();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <aside
      className={`hidden h-full min-h-0 rounded-[30px] border border-pink-100/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.10)] backdrop-blur-xl transition-all duration-300 ease-out lg:grid lg:grid-rows-[auto_minmax(0,1fr)_auto] ${isCollapsed ? "px-4" : "px-5"
        }`}
    >
      <div
        className={`shrink-0 pb-6 pt-2 transition-all duration-300 ${isCollapsed ? "px-0 text-center" : "px-2"
          }`}
      >
        {isCollapsed ? (
          <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-violet-50 shadow-sm">
            <img
              src="/akari-assets/cat-logo.png"
              alt=""
              className="h-12 w-12 object-contain"
            />
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
                      ? `${item.activeItemClassName ?? "bg-pink-50 text-pink-600"} shadow-sm`
                      : "text-slate-600 hover:bg-pink-50 hover:text-slate-900"
                    }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${isActive
                      ? item.activeIconClassName ?? "bg-pink-500 text-white"
                      : item.iconClassName ?? "bg-slate-50 text-slate-400"
                      }`}
                  >
                    <Icon size={17} strokeWidth={2.3} />
                  </span>

                  {!isCollapsed ? <span>{item.label}</span> : null}

                  {item.href === "/messages" && unreadMessageCount > 0 ? (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black text-white shadow-[0_0_10px_rgba(244,63,94,0.45)]">
                      {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                    </span>
                  ) : null}
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
          aria-pressed={isDarkMode}
          onClick={toggleDarkMode}
          className={`group flex w-full items-center rounded-2xl border border-pink-100 bg-white text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-violet-200/40 ${isCollapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-3"
            }`}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shadow-sm transition group-hover:bg-amber-100">
              {isDarkMode ? <Moon size={17} /> : <Sun size={17} />}
            </span>
            {!isCollapsed ? <span>Dark mode</span> : null}
          </span>

          {!isCollapsed ? (
            <span
              className={`relative h-8 w-15 rounded-full border p-1 shadow-inner transition ${isDarkMode
                ? "border-violet-300/30 bg-gradient-to-r from-violet-500 to-fuchsia-500"
                : "border-amber-100 bg-gradient-to-r from-amber-100 to-pink-100"
                }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full bg-white text-[13px] shadow-[0_4px_12px_rgba(15,23,42,0.22)] transition-transform ${isDarkMode ? "translate-x-7 text-violet-500" : "translate-x-0 text-amber-500"
                  }`}
              >
                {isDarkMode ? "☾" : "☀"}
              </span>
            </span>
          ) : null}
        </button>

        <div className="overflow-hidden rounded-[24px] border border-pink-100 bg-gradient-to-br from-white via-pink-50/80 to-white p-3 text-center shadow-sm">
          <div
            className={`grid place-items-center ${isCollapsed ? "" : "gap-2"}`}
          >
            <img
              src="/akari-assets/cat-left.png"
              alt=""
              className={
                isCollapsed
                  ? "h-12 w-12 object-contain"
                  : "h-[7.5rem] w-full object-contain"
              }
            />

            {!isCollapsed ? (
              <p className="text-sm font-semibold leading-5 text-slate-700">
                Cùng AkariNeko
                <br />
                học mỗi ngày nhé! <span className="text-pink-400">✿</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
