"use client";

import {
  BookOpenText,
  Bookmark,
  CalendarDays,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { GrammarPoint, JlptLevel } from "@/services/grammarService";

type GrammarCardProps = {
  grammar: GrammarPoint;
  isBusy?: boolean;
  onBookmark: (grammar: GrammarPoint) => void;
  onEdit: (grammar: GrammarPoint) => void;
  onDelete: (grammar: GrammarPoint) => void;
};

const jlptBadgeClassNames: Record<JlptLevel, string> = {
  N5: "border-emerald-100 bg-emerald-500 text-white",
  N4: "border-blue-100 bg-blue-500 text-white",
  N3: "border-violet-100 bg-violet-500 text-white",
  N2: "border-orange-100 bg-orange-400 text-white",
  N1: "border-pink-100 bg-pink-500 text-white",
};

export function getJlptBadgeClassName(level: JlptLevel) {
  return jlptBadgeClassNames[level];
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function GrammarCard({
  grammar,
  isBusy = false,
  onBookmark,
  onEdit,
  onDelete,
}: GrammarCardProps) {
  const updatedDate = formatDate(grammar.updatedAt ?? grammar.createdAt);

  return (
    <article className="group flex min-h-[228px] min-w-0 flex-col rounded-3xl border border-pink-100 bg-white/90 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-[0_18px_42px_rgba(236,72,153,0.14)]">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex min-h-7 items-center justify-center rounded-xl border px-2.5 py-1 text-xs font-black leading-none ${getJlptBadgeClassName(grammar.jlptLevel)}`}
        >
          {grammar.jlptLevel}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isBusy}
            aria-label="Sửa ngữ pháp"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 opacity-0 transition hover:bg-violet-50 hover:text-violet-500 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onEdit(grammar)}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            disabled={isBusy}
            aria-label="Xóa ngữ pháp"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onDelete(grammar)}
          >
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            disabled={isBusy}
            aria-label={grammar.isBookmarked ? "Bỏ lưu ngữ pháp" : "Lưu ngữ pháp"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-violet-300 transition hover:bg-pink-50 hover:text-pink-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onBookmark(grammar)}
          >
            <Bookmark
              size={21}
              strokeWidth={2}
              fill={grammar.isBookmarked ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      <div className="mt-5 min-w-0 flex-1">
        <h2 className="break-words text-[21px] font-extrabold leading-[1.35] text-slate-900 sm:text-[22px]">
          {grammar.title}
        </h2>
        <p className="mt-3 line-clamp-1 break-words text-[15px] font-extrabold leading-6 text-slate-700">
          {grammar.structure || "Chưa có cấu trúc"}
        </p>
        <p className="mt-3 line-clamp-2 text-[13px] font-semibold leading-6 text-slate-500 sm:text-sm">
          {grammar.meaning}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-pink-50 pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-4 text-[12px] font-bold leading-none text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <BookOpenText size={14} />
            {grammar.examples.length} ví dụ
          </span>
          {updatedDate ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} />
              {updatedDate}
            </span>
          ) : null}
        </div>

        <Link
          href={`/grammar/${grammar.id}`}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl px-2 text-[13px] font-black leading-none text-pink-500 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100"
        >
          Xem chi tiết
          <span aria-hidden="true">-&gt;</span>
        </Link>
      </div>
    </article>
  );
}
