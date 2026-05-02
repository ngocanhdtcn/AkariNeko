import { AppShell } from "@/components/layout/AppShell";
import { StudyHistoryPage } from "@/components/study-history/StudyHistoryPage";

export default function Page() {
    return (
        <AppShell rightPanel={null}>
            <StudyHistoryPage />
        </AppShell>
    );
}