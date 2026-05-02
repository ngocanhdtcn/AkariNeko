import { DevCheckPage } from "@/components/dev-check/DevCheckPage";
import { AppShell } from "@/components/layout/AppShell";

export default function Page() {
    return (
        <AppShell rightPanel={null}>
            <DevCheckPage />
        </AppShell>
    );
}