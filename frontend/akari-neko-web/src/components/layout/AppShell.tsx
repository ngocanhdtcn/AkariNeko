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

type AppShellProps = {
  children: ReactNode;
  rightPanel?: ReactNode;
};

export function AppShell({ children, rightPanel }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isLoadingProfile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoadingProfile && !profile && pathname !== "/auth") {
      router.replace("/auth");
    }
  }, [isLoadingProfile, profile, pathname, router]);

  if (isLoadingProfile) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-violet-50">
        <div className="rounded-[28px] border border-pink-100 bg-white/90 px-6 py-5 text-sm font-bold text-slate-500 shadow-sm">
          Đang tải AkariNeko...
        </div>
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
    <main className="h-screen overflow-hidden bg-[linear-gradient(135deg,#fff8fb,#fffdf8_48%,#f7f2ff)] p-4 text-slate-800">
      <div
        className={`mx-auto grid h-full w-full max-w-[1740px] gap-4 transition-[grid-template-columns] duration-300 ease-out ${isSidebarCollapsed
          ? "lg:grid-cols-[112px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]"
          }`}
      >
        <DashboardSidebar isCollapsed={isSidebarCollapsed} />

        <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
          <MobileHeader />

          <DashboardTopBar
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />

          <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pb-28 pr-1 lg:pb-0">
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
