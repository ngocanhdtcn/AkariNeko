import { AppShell } from "@/components/layout/AppShell";
import { SettingsPage as SettingsPageContent } from "@/components/settings/SettingsPage";

export default function SettingsPage() {
  return (
    <AppShell rightPanel={null}>
      <SettingsPageContent />
    </AppShell>
  );
}
