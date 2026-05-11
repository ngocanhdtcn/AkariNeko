"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`grid place-items-center rounded-3xl border border-pink-100 bg-gradient-to-br from-white via-pink-50/70 to-violet-50/70 px-5 py-8 text-center shadow-sm ${className}`}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-100 bg-white text-pink-400 shadow-sm">
          {icon ?? <Sparkles size={24} strokeWidth={2.3} />}
        </div>

        <h3 className="text-lg font-black text-slate-800">{title}</h3>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          {description}
        </p>

        {actionLabel && onAction ? (
          <button
            type="button"
            className="mt-5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.18)] transition hover:brightness-105"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
