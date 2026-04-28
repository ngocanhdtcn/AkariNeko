import { ClipboardList } from "lucide-react";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";
import { AppShell } from "@/components/layout/AppShell";

export default function MockTestPage() {
  return (
    <AppShell>
      <ComingSoonPage
        icon={ClipboardList}
        title="Mock Test"
        description="Trang đề thi thử sẽ dùng để lưu ngân hàng đề, chọn đề theo JLPT level và luyện thi theo thời gian thật."
      />
    </AppShell>
  );
}
