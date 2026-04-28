"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { DashboardTopBar } from "../dashboard/DashboardTopBar";
import { MobileBottomNav } from "../dashboard/MobileBottomNav";
import { MobileHeader } from "../dashboard/MobileHeader";

type AppShellProps = {
  children: ReactNode;
  rightPanel?: ReactNode;
};

export function AppShell({ children, rightPanel }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  function toggleSidebar() {
    setIsSidebarCollapsed((current) => !current);
  }

  return (
    <main className="h-screen overflow-hidden bg-[linear-gradient(135deg,#fff8fb,#fffdf8_48%,#f7f2ff)] p-4 text-slate-800">
      <div
        className={`mx-auto grid h-full w-full max-w-[1740px] gap-4 transition-[grid-template-columns] duration-300 ease-out ${
          isSidebarCollapsed
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
