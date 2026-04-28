import type { LucideIcon } from "lucide-react";

type StatisticCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  chartClassName: string;
};

function MiniChart({ className }: { className: string }) {
  return (
    <div
      className={`mt-3 h-10 overflow-hidden rounded-xl bg-gradient-to-r ${className}`}
    >
      <svg
        aria-hidden="true"
        className="h-full w-full text-pink-400/70"
        preserveAspectRatio="none"
        viewBox="0 0 120 40"
      >
        <path
          d="M0 28 C12 18, 20 34, 32 24 C45 12, 55 30, 68 18 C80 8, 90 24, 102 14 C110 8, 116 10, 120 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

export function StatisticCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  chartClassName,
}: StatisticCardProps) {
  return (
    <div className="rounded-[20px] border border-pink-50 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={16} strokeWidth={2.4} />
        </span>

        <p className="text-xs font-semibold text-slate-500">{label}</p>
      </div>

      <p className="mt-3 text-2xl font-black text-slate-800">{value}</p>

      <MiniChart className={chartClassName} />
    </div>
  );
}
