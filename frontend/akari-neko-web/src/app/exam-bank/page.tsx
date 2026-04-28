import { FileText } from "lucide-react";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";
import { AppShell } from "@/components/layout/AppShell";

export default function ExamBankPage() {
  return (
    <AppShell>
      <ComingSoonPage
        icon={FileText}
        title="Exam Bank"
        description="Trang ngân hàng đề sẽ dùng để quản lý file đề thi, PDF, bộ câu hỏi và dữ liệu luyện thi JLPT."
      />
    </AppShell>
  );
}
