"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { DashboardTopBar } from "../dashboard/DashboardTopBar";
import { MobileBottomNav } from "../dashboard/MobileBottomNav";
import { MobileHeader } from "../dashboard/MobileHeader";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_LOGIN_HINT_KEY, useAuth } from "@/contexts/AuthContext";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type AppShellProps = {
  children: ReactNode;
  rightPanel?: ReactNode;
  topBarLeftContent?: ReactNode;
  topBarSearchPlaceholder?: string;
};

function subscribeToLoginHintChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function getLoginHintSnapshot() {
  return window.sessionStorage.getItem(AUTH_LOGIN_HINT_KEY) === "1";
}

function getLoginHintServerSnapshot() {
  return false;
}

export function AppShell({
  children,
  rightPanel,
  topBarLeftContent,
  topBarSearchPlaceholder,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoadingProfile, profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const hasLoginHint = useSyncExternalStore(
    subscribeToLoginHintChange,
    getLoginHintSnapshot,
    getLoginHintServerSnapshot,
  );
  const isApprovalPage = pathname === "/account-pending";
  const hasAuthSignal = isAuthenticated || hasLoginHint;
  const hasApprovedProfile = profile?.approvalStatus === "approved";
  const canShowApp =
    hasAuthSignal && (isApprovalPage || hasApprovedProfile || isLoadingProfile);

  useEffect(() => {
    if (!isLoadingProfile && !canShowApp && pathname !== "/auth") {
      router.replace(hasAuthSignal ? "/account-pending" : "/auth");
    }
  }, [canShowApp, hasAuthSignal, isLoadingProfile, pathname, router]);

  if (isLoadingProfile && !canShowApp) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-violet-50">
        <LoadingSkeleton variant="card" className="w-[min(92vw,420px)]" />
      </div>
    );
  }

  if (!canShowApp && pathname !== "/auth") {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-violet-50 px-4 text-center">
        <div className="grid gap-3">
          <LoadingSkeleton variant="card" className="w-[min(92vw,420px)]" />
          <p className="text-sm font-bold text-slate-500">
            Dang chuyen toi trang dang nhap...
          </p>
        </div>
      </div>
    );
  }

  function toggleSidebar() {
    setIsSidebarCollapsed((current) => !current);
  }

  return (
    <main className="akari-mobile-scroll min-h-screen flex flex-col overflow-x-clip bg-[linear-gradient(135deg,#fff8fb,#fffdf8_48%,#f7f2ff)] p-2 text-slate-800 sm:p-4 lg:h-screen lg:overflow-hidden lg:px-6 xl:px-8">
      <DashboardSidebar isCollapsed={isSidebarCollapsed} />

      <div
        className={`grid w-full min-w-0 gap-3 transition-[margin] duration-300 ease-out sm:gap-4 lg:h-full lg:w-auto lg:overflow-visible lg:pr-1 ${isSidebarCollapsed
          ? "lg:ml-[140px]"
          : "lg:ml-[328px]"
          }`}
      >
        <section className="grid min-w-0 gap-3 sm:gap-4 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]">
          <MobileHeader />

          <DashboardTopBar
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            leftContent={topBarLeftContent}
            searchPlaceholder={topBarSearchPlaceholder}
          />

          <div className="min-w-0 flex-1 overflow-x-clip pb-44 lg:min-h-0 lg:overflow-y-auto lg:pb-0 lg:pr-1 xl:pr-2">
            <div
              className={`grid min-w-0 gap-4 ${rightPanel
                ? "xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
                : ""
                }`}
            >
              <section className="grid min-w-0 content-start gap-4 h-full">
                {children}
              </section>

              {rightPanel ? (
                <div className="akari-desktop-right-panel hidden min-w-0 xl:block">
                  {rightPanel}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <MobileBottomNav />
    </main>
  );
}
