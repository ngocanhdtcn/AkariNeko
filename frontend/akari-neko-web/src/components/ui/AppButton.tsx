"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonVariant = "primary" | "secondary" | "danger" | "soft";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
  icon?: ReactNode;
};

const variantClassNames: Record<AppButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_12px_28px_rgba(236,72,153,0.20)] hover:brightness-105 focus-visible:ring-pink-200",
  secondary:
    "border border-pink-100 bg-white/85 text-slate-600 shadow-sm hover:border-pink-200 hover:bg-pink-50/70 focus-visible:ring-pink-100",
  danger:
    "border border-rose-100 bg-rose-50 text-rose-500 shadow-sm hover:bg-rose-100/70 focus-visible:ring-rose-100",
  soft:
    "border border-violet-100 bg-violet-50 text-violet-600 shadow-sm hover:bg-violet-100/70 focus-visible:ring-violet-100",
};

export function AppButton({
  variant = "secondary",
  icon,
  className = "",
  children,
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold outline-none transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${variantClassNames[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
