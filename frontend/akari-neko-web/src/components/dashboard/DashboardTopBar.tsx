"use client";

import {
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageNotification } from "@/contexts/MessageNotificationContext";
import { useOnlineUsers } from "@/contexts/OnlineUsersContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
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
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const currentPageTitle = getCurrentPageTitle(pathname);
  const searchPlaceholder = getCurrentSearchPlaceholder(pathname);
  const { onlineUserCount } = useOnlineUsers();
  const { unreadMessageCount } = useMessageNotification();

  return (
    <header className="hidden min-h-[88px] grid-cols-[minmax(220px,auto)_minmax(280px,620px)_minmax(300px,auto)] items-center gap-4 rounded-[30px] border border-pink-100/80 bg-white/85 px-5 py-4 shadow-[0_18px_50px_rgba(236,72,153,0.09)] backdrop-blur-xl lg:grid">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          aria-label={
            isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-700 shadow-sm transition hover:bg-pink-50"
          onClick={onToggleSidebar}
        >
          <Menu
            size={26}
            strokeWidth={2.2}
            className={`transition-transform duration-300 ${isSidebarCollapsed ? "rotate-90" : ""
              }`}
          />
        </button>

        <div className="flex min-w-0 items-center gap-2 font-bold text-pink-500">
          <Home size={18} strokeWidth={2.4} className="shrink-0" />
          <span className="truncate">{currentPageTitle}</span>
        </div>
      </div>

      <div className="mx-auto flex h-14 w-full items-center rounded-full border border-pink-100 bg-white px-5 text-sm text-slate-400 shadow-inner">
        <Search size={19} className="mr-3 shrink-0 text-slate-500" />
        <span className="min-w-0 flex-1 truncate">{searchPlaceholder}</span>

        <span className="ml-3 shrink-0 rounded-lg border border-slate-100 px-2 py-1 text-xs text-slate-400">
          Ctrl + K
        </span>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-3">
        <div className="flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 text-sm font-bold text-emerald-600 shadow-sm">
          <UsersRound size={16} />
          {onlineUserCount} online
        </div>

        <Link
          href="/messages"
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-500 shadow-sm transition hover:bg-pink-50 hover:text-pink-500"
        >
          <MessageCircle size={18} />

          {unreadMessageCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black text-white">
              {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white px-3 py-2 shadow-sm transition hover:bg-pink-50"
        >
          <UserAvatar
            name={profile?.displayName}
            avatarUrl={profile?.avatarUrl}
            className="h-9 w-9 rounded-xl text-sm"
          />

          <div className="hidden min-w-0 sm:block">
            <p className="max-w-[150px] truncate text-sm font-black text-slate-700">
              {profile?.displayName ?? "AkariNeko"}
            </p>
            <p className="max-w-[150px] truncate text-xs font-medium text-slate-400">
              Level {profile?.appLevel ?? 1}
            </p>
          </div>
        </Link>

        <button
          type="button"
          aria-label="Log out"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-400 shadow-sm transition hover:bg-rose-50 hover:text-rose-500"
          onClick={() => void logout()}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
