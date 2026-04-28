import { Trophy } from "lucide-react";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";
import { AppShell } from "@/components/layout/AppShell";

export default function QuizPage() {
  return (
    <AppShell>
      <ComingSoonPage
        icon={Trophy}
        title="Quiz"
        description="Trang quiz sẽ dùng để luyện tập câu hỏi trắc nghiệm, kiểm tra nhanh và tính điểm theo từng bộ từ vựng hoặc ngữ pháp."
      />
    </AppShell>
  );
}
