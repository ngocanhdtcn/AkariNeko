import type { LucideIcon } from "lucide-react";

type GradientIconButtonProps = {
  icon: LucideIcon;
  label?: string;
  className?: string;
  onClick?: () => void;
};

export function GradientIconButton({
  icon: Icon,
  label,
  className = "",
  onClick,
}: GradientIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-700 shadow-sm transition hover:bg-pink-50 ${className}`}
    >
      <Icon size={20} strokeWidth={2.4} />
    </button>
  );
}
