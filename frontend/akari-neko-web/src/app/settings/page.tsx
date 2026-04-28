import { Settings } from "lucide-react";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";
import { AppShell } from "@/components/layout/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <ComingSoonPage
        icon={Settings}
        title="Settings"
        description="Trang cài đặt sẽ dùng để đổi ngôn ngữ, dark mode, thông báo, tài khoản và các thiết lập học tập của AkariNeko."
      />
    </AppShell>
  );
}
