import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { SoftPanel } from "../ui/SoftPanel";

type ComingSoonPageProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function ComingSoonPage({
  icon: Icon,
  title,
  description,
}: ComingSoonPageProps) {
  return (
    <SoftPanel className="relative min-h-[520px] overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-violet-200/30 blur-3xl" />

      <div className="relative z-10 flex min-h-[460px] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-pink-100 to-violet-100 text-pink-500 shadow-sm">
          <Icon size={38} strokeWidth={2.3} />
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-sm font-bold text-pink-500">
          <Sparkles size={16} />
          Coming soon
        </div>

        <h2 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
          {title}
        </h2>

        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
          {description}
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105"
        >
          <ArrowLeft size={18} />
          Quay về Home
        </Link>
      </div>
    </SoftPanel>
  );
}
