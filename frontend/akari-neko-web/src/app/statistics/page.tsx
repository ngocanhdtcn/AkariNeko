import { BarChart3 } from "lucide-react";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";
import { AppShell } from "@/components/layout/AppShell";

export default function StatisticsPage() {
  return (
    <AppShell>
      <ComingSoonPage
        icon={BarChart3}
        title="Statistics"
        description="Trang thống kê sẽ hiển thị tiến độ học, tỷ lệ đúng sai, streak, từ khó và lịch sử học tập theo ngày/tuần/tháng."
      />
    </AppShell>
  );
}
