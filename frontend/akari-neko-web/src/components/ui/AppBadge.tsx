import type { ReactNode } from "react";

type AppBadgeTone = "pink" | "violet" | "emerald" | "amber" | "rose" | "slate";

type AppBadgeProps = {
  tone?: AppBadgeTone;
  children: ReactNode;
  className?: string;
};

const toneClassNames: Record<AppBadgeTone, string> = {
  pink: "border-pink-100 bg-pink-50 text-pink-500",
  violet: "border-violet-100 bg-violet-50 text-violet-600",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
  amber: "border-amber-100 bg-amber-50 text-amber-500",
  rose: "border-rose-100 bg-rose-50 text-rose-500",
  slate: "border-slate-100 bg-slate-50 text-slate-500",
};

export function AppBadge({
  tone = "pink",
  children,
  className = "",
}: AppBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 items-center justify-center rounded-full border px-3 py-1 text-xs font-black ${toneClassNames[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
