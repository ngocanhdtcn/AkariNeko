import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
  className = "",
}: PageHeaderProps) {
  return (
    <section
      className={`rounded-3xl border border-pink-100 bg-white/85 p-6 shadow-sm backdrop-blur-xl ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {icon ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-pink-50 text-pink-500 shadow-sm">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-3xl font-black text-slate-800">
                {title}
              </h1>
            </div>
          </div>

          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}
