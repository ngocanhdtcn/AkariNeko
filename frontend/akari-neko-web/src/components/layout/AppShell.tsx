"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { DashboardTopBar } from "../dashboard/DashboardTopBar";
import { MobileBottomNav } from "../dashboard/MobileBottomNav";
import { MobileHeader } from "../dashboard/MobileHeader";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type AppShellProps = {
  children: ReactNode;
  rightPanel?: ReactNode;
  topBarLeftContent?: ReactNode;
  topBarSearchPlaceholder?: string;
};

export function AppShell({
  children,
  rightPanel,
  topBarLeftContent,
  topBarSearchPlaceholder,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isLoadingProfile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoadingProfile && !profile && pathname !== "/auth") {
      router.replace("/auth");
    }
  }, [isLoadingProfile, pathname, profile, router]);

  if (isLoadingProfile) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-violet-50">
        <LoadingSkeleton variant="card" className="w-[min(92vw,420px)]" />
      </div>
    );
  }

  if (!profile && pathname !== "/auth") {
    return null;
  }

  function toggleSidebar() {
    setIsSidebarCollapsed((current) => !current);
  }

  return (
    <main className="akari-mobile-scroll overflow-x-hidden bg-[linear-gradient(135deg,#fff8fb,#fffdf8_48%,#f7f2ff)] p-2 text-slate-800 sm:p-4">
      <div
        className={`mx-auto grid w-full max-w-[1740px] gap-3 transition-[grid-template-columns] duration-300 ease-out sm:gap-4 lg:items-start ${isSidebarCollapsed
          ? "lg:grid-cols-[112px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]"
          }`}
      >
        <DashboardSidebar isCollapsed={isSidebarCollapsed} />

        <section className="grid min-w-0 gap-3 sm:gap-4">
          <MobileHeader />

          <DashboardTopBar
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            leftContent={topBarLeftContent}
            searchPlaceholder={topBarSearchPlaceholder}
          />

          <div className="min-w-0 overflow-x-hidden pb-44 lg:pb-0">
            {rightPanel ? (
              <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="grid min-w-0 content-start gap-4">
                  {children}
                </section>

                {rightPanel}
              </div>
            ) : (
              <section className="grid min-w-0 content-start gap-4">
                {children}
              </section>
            )}
          </div>
        </section>
      </div>

      <MobileBottomNav />
    </main>
  );
}
