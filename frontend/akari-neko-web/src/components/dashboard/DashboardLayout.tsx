"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { DashboardHero } from "./DashboardHero";
import { MobileStatsSection } from "./MobileStatsSection";
import { RecentVocabularyTable } from "./RecentVocabularyTable";
import { RightStatsPanel } from "./RightStatsPanel";
import { StudyShortcutCards } from "./StudyShortcutCards";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/services/dashboardStatsService";

export function DashboardLayout() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [isLoadingDashboardStats, setIsLoadingDashboardStats] = useState(false);
  const [dashboardStatsError, setDashboardStatsError] = useState<string | null>(
    null,
  );

  async function loadDashboardStats() {
    setIsLoadingDashboardStats(true);
    setDashboardStatsError(null);

    try {
      const stats = await getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      setDashboardStatsError("Không thể tải thống kê học tập.");
    } finally {
      setIsLoadingDashboardStats(false);
    }
  }

  useEffect(() => {
    // Load dashboard stats when the dashboard mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboardStats();
  }, []);

  return (
    <AppShell
      rightPanel={
        <RightStatsPanel
          dashboardStats={dashboardStats}
          isLoading={isLoadingDashboardStats}
          errorMessage={dashboardStatsError}
          onRefresh={() => void loadDashboardStats()}
        />
      }
    >
      <DashboardHero />
      <MobileStatsSection />
      <StudyShortcutCards />
      <RecentVocabularyTable />
    </AppShell>
  );
}
