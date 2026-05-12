"use client";

import { useParams } from "next/navigation";
import { GrammarDetailPage } from "@/components/grammar/GrammarDetailPage";
import { AppShell } from "@/components/layout/AppShell";

export default function GrammarDetailRoutePage() {
  const params = useParams<{ id: string }>();

  return (
    <AppShell>
      <GrammarDetailPage grammarId={params.id} />
    </AppShell>
  );
}
