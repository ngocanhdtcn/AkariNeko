"use client";

import { Sparkles } from "lucide-react";
import type { GrammarExample } from "@/services/grammarService";

type GrammarExampleCardProps = {
  example: GrammarExample;
  index: number;
};

export function GrammarExampleCard({ example, index }: GrammarExampleCardProps) {
  return (
    <article className="rounded-2xl border border-pink-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p lang="ja" className="min-w-0 break-words text-xl font-black leading-9 text-slate-800">
          {example.jp || `Ví dụ ${index + 1}`}
        </p>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-pink-50 text-pink-400"
        >
          <Sparkles size={17} />
        </span>
      </div>

      {example.reading ? (
        <p lang="ja" className="mt-2 break-words text-sm font-bold leading-6 text-violet-500">
          {example.reading}
        </p>
      ) : null}

      {example.vi ? (
        <p className="mt-3 break-words text-sm font-semibold leading-7 text-slate-600">
          {example.vi}
        </p>
      ) : null}
    </article>
  );
}
