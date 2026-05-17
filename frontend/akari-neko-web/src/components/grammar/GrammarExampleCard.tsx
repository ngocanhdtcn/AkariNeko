"use client";

import { SakuraIcon } from "@/components/grammar/SakuraIcon";
import type { GrammarExample } from "@/services/grammarService";

type GrammarExampleCardProps = {
  example: GrammarExample;
  index: number;
};

export function GrammarExampleCard({ example, index }: GrammarExampleCardProps) {
  return (
    <article className="relative grid min-w-0 items-start gap-3 overflow-hidden rounded-2xl border border-pink-100/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(244,114,182,0.055)] sm:grid-cols-[minmax(0,1fr)_1px_minmax(180px,0.82fr)_auto] sm:items-center sm:gap-4">
      <span
        aria-hidden="true"
        className="akari-sakura-petal absolute right-16 top-3 h-2 w-1.5 rounded-[70%_30%_70%_30%] bg-pink-300/25"
      />

      <div className="min-w-0">
        <p
          lang="ja"
          className="min-w-0 whitespace-normal break-words text-xl font-black leading-8 text-slate-950"
        >
          {example.jp || `Ví dụ ${index + 1}`}
        </p>

        {example.reading ? (
          <p
            lang="ja"
            className="mt-1 whitespace-normal break-words text-sm font-bold leading-6 text-[#64708e]"
          >
            {example.reading}
          </p>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="hidden h-full min-h-10 border-l border-dashed border-pink-200 sm:block"
      />

      <p className="min-w-0 whitespace-normal break-words text-sm font-semibold leading-7 text-[#4b5574]">
        {example.vi || "Chưa có nghĩa tiếng Việt."}
      </p>

      <span
        aria-hidden="true"
        className="hidden h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-full border border-pink-200 bg-white text-pink-400 shadow-[0_8px_18px_rgba(244,114,182,0.10)] sm:flex"
      >
        <SakuraIcon size={22} />
      </span>
    </article>
  );
}
