import { DevCheckPage } from "@/components/dev-check/DevCheckPage";
import { AppShell } from "@/components/layout/AppShell";
import { notFound } from "next/navigation";

export default function Page() {
    if (process.env.NODE_ENV !== "development") {
        notFound();
    }

    return (
        <AppShell rightPanel={null}>
            <DevCheckPage />
        </AppShell>
    );
}
