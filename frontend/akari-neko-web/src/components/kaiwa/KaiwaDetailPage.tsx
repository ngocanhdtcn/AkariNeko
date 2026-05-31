"use client";

import {
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Lightbulb,
  NotebookPen,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { KaiwaLesson } from "@/data/kaiwaData";

type KaiwaDetailPageProps = {
  lesson: KaiwaLesson;
};

export function KaiwaDetailPage({ lesson }: KaiwaDetailPageProps) {
  const [isCompleted, setIsCompleted] = useState(lesson.completed);
  const heroImage = lesson.thumbnailUrl ?? "/akari-assets/hero-bg.png";
  const noteGroups = [
    {
      title: "Từ vựng",
      items: lesson.notes.vocabulary,
      tone: "text-amber-500 bg-amber-50",
    },
    {
      title: "Mẫu câu",
      items: lesson.notes.patterns,
      tone: "text-pink-500 bg-pink-50",
    },
    {
      title: "Ghi nhớ",
      items: lesson.notes.reminders,
      tone: "text-violet-500 bg-violet-50",
    },
  ];

  return (
    <AppShell
      topBarLeftContent={
        <nav
          aria-label="Kaiwa breadcrumb"
          className="flex min-w-0 items-center gap-2 text-sm font-black text-slate-700"
        >
          <Link href="/kaiwa" className="shrink-0 text-pink-500">
            Kaiwa Room
          </Link>
          <ChevronRight size={16} className="shrink-0 text-slate-400" />
          <span className="shrink-0">{lesson.level}</span>
          <ChevronRight size={16} className="shrink-0 text-slate-400" />
          <span className="truncate">
            Bài {lesson.lessonNumber} - {lesson.title}
          </span>
        </nav>
      }
      topBarSearchPlaceholder="Tìm kiếm bài học, từ vựng, ngữ pháp..."
    >
      <section className="akari-kaiwa-detail-hero relative isolate overflow-hidden rounded-[30px] border border-pink-100/80 bg-gradient-to-br from-white via-pink-50/80 to-violet-50 p-5 shadow-[0_18px_48px_rgba(236,72,153,0.10)] sm:p-6">
        <div className="absolute inset-0 opacity-25">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 1200px, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="akari-kaiwa-detail-hero-overlay absolute inset-0 bg-gradient-to-r from-white/92 via-white/68 to-white/20" />

        <div className="relative">
          <Link
            href="/kaiwa"
            className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-pink-100 bg-white/80 px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-pink-50 hover:text-pink-600"
          >
            <ArrowLeft size={16} />
            Kaiwa Room
          </Link>
        </div>

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-pink-500 px-3 py-1 text-sm font-black text-white">
                {lesson.level}
              </span>
              <span className="rounded-full border border-pink-100 bg-white/70 px-3 py-1 text-sm font-bold text-slate-500">
                Bài {lesson.lessonNumber} • {lesson.source}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
              Bài {lesson.lessonNumber} - {lesson.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              {lesson.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-white/80 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-pink-50">
              <Star size={17} />
              Đánh dấu
            </button>
            <button
              type="button"
              onClick={() => setIsCompleted((current) => !current)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-600"
            >
              <CheckCircle2 size={17} />
              {isCompleted ? "Đã học" : "Đánh dấu đã học"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-2">
        <article className="grid h-full content-start rounded-[28px] border border-pink-100/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(236,72,153,0.08)] sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
              <BookOpenText size={20} />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                Video bài học
              </h2>
              <p className="text-sm text-slate-500">
                Nguồn video ưu tiên lấy từ Supabase Storage.
              </p>
            </div>
          </div>

          {lesson.videoUrl ? (
            <video
              controls
              poster={heroImage}
              className="aspect-video w-full rounded-[18px] bg-slate-950 object-contain"
              src={lesson.videoUrl}
            />
          ) : (
            <div className="grid aspect-video place-items-center rounded-[18px] border border-dashed border-pink-200 bg-pink-50/70 p-6 text-center">
              <div>
                <p className="text-base font-black text-slate-800">
                  Chưa gắn video storage
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sau khi upload MP4 lên Supabase, lưu public URL vào cột{" "}
                  <span className="font-black text-pink-500">video_url</span>.
                </p>
              </div>
            </div>
          )}
          <div className="mt-3 rounded-2xl border border-pink-100 bg-pink-50/60 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
            <Lightbulb className="mr-2 inline text-amber-500" size={16} />
            Mẹo học: Nghe trước không xem phụ đề, sau đó mở PDF để shadowing.
          </div>
        </article>

        <article className="grid h-full content-start rounded-[28px] border border-pink-100/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(236,72,153,0.08)] sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
              <FileText size={20} />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                Tài liệu Kaiwa (PDF)
              </h2>
              <p className="text-sm text-slate-500">
                PDF nằm trong trang chi tiết, không tải trên Home.
              </p>
            </div>
          </div>

          {lesson.pdfUrl ? (
            <>
              <iframe
                title={`PDF ${lesson.title}`}
                src={lesson.pdfUrl}
                className="aspect-video min-h-[280px] w-full rounded-[18px] border border-pink-100 bg-white md:min-h-[340px] xl:min-h-0"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={lesson.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-violet-500 px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(139,92,246,0.20)] transition hover:bg-violet-600"
                >
                  <ExternalLink size={16} />
                  Mở tab mới
                </a>
                <a
                  href={lesson.pdfUrl}
                  download
                  className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-pink-50"
                >
                  <Download size={16} />
                  Tải xuống
                </a>
              </div>
            </>
          ) : (
            <div className="grid aspect-video min-h-[280px] place-items-center rounded-[18px] border border-dashed border-violet-200 bg-violet-50/70 p-6 text-center md:min-h-[340px] xl:min-h-0">
              <div>
                <p className="text-base font-black text-slate-800">
                  Chưa gắn PDF storage
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Upload PDF lên Supabase, rồi lưu public URL vào cột{" "}
                  <span className="font-black text-violet-500">pdf_url</span>.
                </p>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-[28px] border border-pink-100/80 bg-white/90 p-5 shadow-[0_14px_34px_rgba(236,72,153,0.08)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
            <NotebookPen size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-800">
              Ghi chú nhanh
            </h2>
            <p className="text-sm text-slate-500">
              Từ vựng và mẫu câu quan trọng trong bài.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {noteGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-[24px] border border-pink-100 bg-white/80 p-4"
            >
              <h3
                className={`mb-3 inline-flex rounded-2xl px-3 py-1 text-sm font-black ${group.tone}`}
              >
                {group.title}
              </h3>
              <ul className="space-y-2 text-sm leading-6 text-slate-500">
                {group.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
