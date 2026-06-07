"use client";

import {
  Bookmark,
  ChevronRight,
  Clock3,
  FileText,
  Lock,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { KaiwaLesson } from "@/data/kaiwaData";

type KaiwaCardProps = {
  lesson: KaiwaLesson;
  eager?: boolean;
};

function getLessonImage(lesson: KaiwaLesson) {
  return lesson.thumbnailUrl ?? "/akari-assets/hero-bg.png";
}

export function KaiwaCard({ lesson, eager = false }: KaiwaCardProps) {
  return (
    <article className="group overflow-hidden rounded-[26px] border border-pink-100/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(236,72,153,0.08)] transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-[0_18px_42px_rgba(236,72,153,0.14)]">
      <div className="grid gap-4 sm:grid-cols-[116px_minmax(0,1fr)]">
        <Link
          href={`/kaiwa/${lesson.id}`}
          className="relative block aspect-[4/3] overflow-hidden rounded-[22px] bg-pink-50 sm:aspect-auto sm:h-[138px]"
        >
          <Image
            src={getLessonImage(lesson)}
            alt=""
            fill
            loading={eager ? "eager" : undefined}
            sizes="(max-width: 640px) 100vw, 116px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          {lesson.locked ? (
            <span className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-2xl bg-slate-950/60 text-white">
              <Lock size={17} />
            </span>
          ) : null}
        </Link>

        <div className="min-w-0">
          <div className="mb-2 flex items-start justify-between gap-3">
            <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-600">
              {lesson.level} • Bài {lesson.lessonNumber}
            </span>
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl border border-pink-100 bg-white text-slate-400 transition hover:bg-pink-50 hover:text-pink-500"
              aria-label="Đánh dấu bài học"
            >
              <Bookmark size={16} />
            </button>
          </div>

          <h3 className="line-clamp-1 text-xl font-black text-slate-900">
            {lesson.title}
          </h3>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {lesson.source} • {lesson.category}
          </p>
          <p className="mt-2 line-clamp-2 min-h-11 text-sm leading-6 text-slate-500">
            {lesson.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Video size={16} className="text-rose-500" />
          Video
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText size={16} className="text-pink-500" />
          PDF
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={16} className="text-violet-500" />
          {lesson.duration}
        </span>
      </div>

      <Link
        href={`/kaiwa/${lesson.id}`}
        className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-pink-500/10 px-4 text-sm font-black text-pink-600 transition hover:bg-pink-500 hover:text-white"
      >
        Học ngay
        <ChevronRight size={17} />
      </Link>
    </article>
  );
}
