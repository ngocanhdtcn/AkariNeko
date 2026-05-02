import { AppShell } from "@/components/layout/AppShell";
import { MessagesPage } from "@/components/messages/MessagesPage";

export default function Page() {
    return (
        <AppShell rightPanel={null}>
            <MessagesPage />
        </AppShell>
    );
}