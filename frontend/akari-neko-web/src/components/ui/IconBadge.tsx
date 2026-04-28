import type { LucideIcon } from "lucide-react";

type IconBadgeProps = {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
};

export function IconBadge({
  icon: Icon,
  className = "bg-pink-50 text-pink-500",
  iconClassName = "",
}: IconBadgeProps) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${className}`}
    >
      <Icon size={20} strokeWidth={2.4} className={iconClassName} />
    </div>
  );
}
