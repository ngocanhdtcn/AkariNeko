"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

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
      className={`rounded-3xl border border-pink-100 bg-white/85 p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-pink-50 text-pink-400">
          <Sparkles size={16} />
        </span>
        <h2 className="text-base font-black text-slate-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}
