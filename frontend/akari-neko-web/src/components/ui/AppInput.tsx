"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
};

export function AppInput({
  icon,
  className = "",
  type = "text",
  ...props
}: AppInputProps) {
  if (icon) {
    return (
      <div className="flex h-12 items-center gap-3 rounded-2xl border border-pink-100 bg-white/85 px-4 shadow-sm transition focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-100/70">
        <span className="shrink-0 text-pink-400">{icon}</span>
        <input
          type={type}
          className={`h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400 ${className}`}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      type={type}
      className={`h-12 rounded-2xl border border-pink-100 bg-white/85 px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
      {...props}
    />
  );
}
