import { AppShell } from "@/components/layout/AppShell";
import { QuizPage } from "@/components/quiz/QuizPage";

export default function Page() {
  return (
    <AppShell rightPanel={null}>
      <QuizPage />
    </AppShell>
  );
}