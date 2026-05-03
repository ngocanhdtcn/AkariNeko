"use client";

import { LogOut, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageNotification } from "@/contexts/MessageNotificationContext";
import { getCurrentPageTitle } from "@/lib/navigation";
import { AkariNekoWordmark } from "../branding/AkariNekoWordmark";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function MobileHeader() {
  const pathname = usePathname();
  const currentPageTitle = getCurrentPageTitle(pathname);
  const { profile, logout } = useAuth();
  const { unreadMessageCount } = useMessageNotification();

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[26px] border border-pink-100/80 bg-white/85 px-3 py-3 shadow-[0_18px_50px_rgba(236,72,153,0.09)] backdrop-blur-xl lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-pink-100 to-violet-100 text-xl font-black text-pink-400 shadow-sm">
          A
        </div>

        <div className="min-w-0 max-w-[128px] min-[410px]:max-w-[152px]">
          <AkariNekoWordmark
            size="sm"
            subtitle="Issho ni ganbarimashou!"
            className="origin-left scale-[0.82] min-[410px]:scale-90"
          />

          <p className="-mt-1 text-sm font-bold text-pink-500">
            {currentPageTitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-slate-700 shadow-sm"
        >
          <Search size={18} />
        </button>

        <Link
          href="/messages"
          aria-label="Messages"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-slate-700 shadow-sm"
        >
          <MessageCircle size={18} />

          {unreadMessageCount > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm"
        >
          <UserAvatar
            name={profile?.displayName}
            avatarUrl={profile?.avatarUrl}
            className="h-10 w-10 rounded-full text-sm"
          />
        </Link>

        <button
          type="button"
          aria-label="Log out"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-500"
          onClick={() => void logout()}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
