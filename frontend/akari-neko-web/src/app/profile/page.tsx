import { UserRound } from "lucide-react";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";
import { AppShell } from "@/components/layout/AppShell";

export default function ProfilePage() {
  return (
    <AppShell>
      <ComingSoonPage
        icon={UserRound}
        title="Profile"
        description="Trang hồ sơ sẽ dùng để cập nhật avatar, tên hiển thị, App Level, XP và JLPT level hiện tại của người dùng."
      />
    </AppShell>
  );
}
