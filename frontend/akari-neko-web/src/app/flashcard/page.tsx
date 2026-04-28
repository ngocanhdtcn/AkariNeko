import { WalletCards } from "lucide-react";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";
import { AppShell } from "@/components/layout/AppShell";

export default function FlashcardPage() {
  return (
    <AppShell>
      <ComingSoonPage
        icon={WalletCards}
        title="Flashcard"
        description="Trang flashcard sẽ dùng để ôn từ vựng và ngữ pháp với hiệu ứng lật thẻ, đánh dấu biết/chưa biết và ghi nhớ từ khó."
      />
    </AppShell>
  );
}
