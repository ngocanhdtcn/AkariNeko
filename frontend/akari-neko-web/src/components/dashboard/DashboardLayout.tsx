import { AppShell } from "../layout/AppShell";
import { DashboardHero } from "./DashboardHero";
import { MobileStatsSection } from "./MobileStatsSection";
import { RecentVocabularyTable } from "./RecentVocabularyTable";
import { RightStatsPanel } from "./RightStatsPanel";
import { StudyShortcutCards } from "./StudyShortcutCards";

export function DashboardLayout() {
  return (
    <AppShell rightPanel={<RightStatsPanel />}>
      <DashboardHero />
      <MobileStatsSection />
      <StudyShortcutCards />
      <RecentVocabularyTable />
    </AppShell>
  );
}
