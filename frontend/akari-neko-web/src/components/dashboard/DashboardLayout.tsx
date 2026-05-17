"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/services/dashboardStatsService";
import { AppShell } from "../layout/AppShell";
import { DashboardHero } from "./DashboardHero";
import { MobileStatsSection } from "./MobileStatsSection";
import { RecentGrammarTable } from "./RecentGrammarTable";
import { RecentVocabularyTable } from "./RecentVocabularyTable";
import { RightStatsPanel } from "./RightStatsPanel";
import { StudyShortcutCards } from "./StudyShortcutCards";

export function DashboardLayout() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [isLoadingDashboardStats, setIsLoadingDashboardStats] = useState(false);
  const [dashboardStatsError, setDashboardStatsError] = useState<string | null>(
    null,
  );
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const isLoadingDashboardStatsRef = useRef(false);

  const loadDashboardStats = useCallback(async () => {
    if (isLoadingDashboardStatsRef.current) {
      return;
    }

    isLoadingDashboardStatsRef.current = true;
    setIsLoadingDashboardStats(true);
    setDashboardStatsError(null);

    try {
      const stats = await getDashboardStats();
      setDashboardStats(stats);
      setDashboardRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      const fallbackMessage = "Không thể tải thống kê học tập.";
      setDashboardStatsError(fallbackMessage);
    } finally {
      isLoadingDashboardStatsRef.current = false;
      setIsLoadingDashboardStats(false);
    }
  }, []);

  useEffect(() => {
    // Load dashboard stats when the dashboard mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboardStats();
  }, [loadDashboardStats]);

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
      <RecentVocabularyTable refreshKey={dashboardRefreshKey} />
      <RecentGrammarTable refreshKey={dashboardRefreshKey} />
    </AppShell>
  );
}
