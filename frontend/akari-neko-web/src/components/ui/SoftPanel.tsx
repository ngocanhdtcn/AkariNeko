import type { ReactNode } from "react";

type SoftPanelProps = {
  children: ReactNode;
  className?: string;
};

export function SoftPanel({ children, className = "" }: SoftPanelProps) {
  return (
    <section
      className={`rounded-[28px] border border-pink-100/80 bg-white/90 shadow-[0_18px_50px_rgba(236,72,153,0.09)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}
