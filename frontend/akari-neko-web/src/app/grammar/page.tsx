import { GraduationCap } from "lucide-react";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";
import { AppShell } from "@/components/layout/AppShell";

export default function GrammarPage() {
  return (
    <AppShell>
      <ComingSoonPage
        icon={GraduationCap}
        title="Grammar"
        description="Trang ngữ pháp sẽ dùng để quản lý mẫu câu, cách dùng, ví dụ tiếng Nhật và nghĩa tiếng Việt theo JLPT, sách và chapter."
      />
    </AppShell>
  );
}
