"use client";

import type { ReactNode } from "react";
import { SakuraIcon } from "@/components/grammar/SakuraIcon";

type GrammarDetailSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function GrammarDetailSection({
  title,
  children,
  className = "",
}: GrammarDetailSectionProps) {
  return (
    <section
      className={`akari-grammar-detail-section relative overflow-hidden rounded-3xl border border-pink-100 bg-white/85 p-4 shadow-sm sm:p-5 ${className}`}
    >
      <span
        aria-hidden="true"
        className="akari-sakura-petal absolute right-8 top-5 h-2.5 w-1.5 rounded-[70%_30%_70%_30%] bg-pink-300/20"
      />
      <span
        aria-hidden="true"
        className="akari-sakura-petal absolute right-14 top-9 h-2 w-1.5 rounded-[70%_30%_70%_30%] bg-rose-300/16"
      />

      <div className="relative z-10 mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center text-pink-400 drop-shadow-[0_5px_10px_rgba(244,114,182,0.14)]">
          <SakuraIcon size={21} />
        </span>
        <h2 className="min-w-0 break-words text-base font-black text-slate-950">
          {title}
        </h2>
      </div>
      <div className="relative z-10 grid min-w-0 gap-3">{children}</div>
    </section>
  );
}
