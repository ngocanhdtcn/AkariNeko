import type { ReactNode } from "react";

type SoftPanelProps = {
  children: ReactNode;
  className?: string;
};

export function SoftPanel({ children, className = "" }: SoftPanelProps) {
  return (
    <section
      className={`rounded-3xl border border-pink-100 bg-white/95 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
