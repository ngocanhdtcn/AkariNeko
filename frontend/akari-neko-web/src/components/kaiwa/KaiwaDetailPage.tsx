"use client";

import {
  ArrowLeft,
  BookOpenText,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Lightbulb,
  NotebookPen,
  Star,
  Video,
  Volume2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { KaiwaLesson } from "@/data/kaiwaData";
import { getYouTubeEmbedUrl, getYouTubeVideoId } from "@/lib/youtube";
import { useYouTubeVideoTitles } from "@/hooks/useYouTubeVideoTitles";
import { getDisplayFileNameFromUrl } from "@/lib/fileLabels";

type KaiwaDetailPageProps = {
  lesson: KaiwaLesson;
};

function getFileLabelFromUrl(
  url: string,
  fallback: string,
  titlesByUrl: Record<string, string> = {},
) {
  const youTubeTitle = titlesByUrl[url];

  if (youTubeTitle) {
    return youTubeTitle;
  }

  const youTubeId = getYouTubeVideoId(url);

  if (youTubeId) {
    return `YouTube ${youTubeId}`;
  }

  return getDisplayFileNameFromUrl(url, fallback);
}

function getPdfViewerUrl(url: string) {
  const [baseUrl, hash = ""] = url.split("#");
  const params = new URLSearchParams(hash);

  if (!params.has("zoom")) {
    params.set("zoom", "page-width");
  }

  if (!params.has("view")) {
    params.set("view", "FitH");
  }

  return `${baseUrl}#${params.toString()}`;
}

export function KaiwaDetailPage({ lesson }: KaiwaDetailPageProps) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);
  const heroImage = lesson.thumbnailUrl ?? "/akari-assets/hero-bg.png";
  const videoUrls = lesson.videoUrls.length > 0 ? lesson.videoUrls : lesson.videoUrl ? [lesson.videoUrl] : [];
  const videoTitlesByUrl = useYouTubeVideoTitles(videoUrls);
  const pdfUrls = lesson.pdfUrls.length > 0 ? lesson.pdfUrls : lesson.pdfUrl ? [lesson.pdfUrl] : [];
  const audioUrls = lesson.audioUrls.length > 0 ? lesson.audioUrls : lesson.audioUrl ? [lesson.audioUrl] : [];
  const selectedVideoUrl = videoUrls[selectedVideoIndex] ?? "";
  const selectedYouTubeEmbedUrl = selectedVideoUrl ? getYouTubeEmbedUrl(selectedVideoUrl) : "";
  const selectedPdfUrl = pdfUrls[selectedPdfIndex] ?? "";
  const selectedPdfViewerUrl = selectedPdfUrl ? getPdfViewerUrl(selectedPdfUrl) : "";
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
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4">
        <article className="grid h-full content-start rounded-[28px] border border-pink-100/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(236,72,153,0.08)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                <BookOpenText size={20} />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Video bài học
                </h2>
                <p className="text-sm text-slate-500">
                  Nguồn video có thể lấy từ YouTube hoặc Supabase Storage.
                </p>
              </div>
            </div>
            <span className="rounded-2xl bg-rose-50 px-3 py-1 text-sm font-black text-rose-500">
              {videoUrls.length} video
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
          {selectedVideoUrl ? (
            selectedYouTubeEmbedUrl ? (
              <iframe
                title={`Video ${lesson.title}`}
                src={selectedYouTubeEmbedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full rounded-[18px] border-0 bg-slate-950"
              />
            ) : (
              <video
                controls
                poster={heroImage}
                className="aspect-video w-full rounded-[18px] bg-slate-950 object-contain"
                src={selectedVideoUrl}
              />
            )
          ) : (
            <div className="grid aspect-video place-items-center rounded-[18px] border border-dashed border-pink-200 bg-pink-50/70 p-6 text-center">
              <div>
                <p className="text-base font-black text-slate-800">
                  Chưa gắn video
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Dán link YouTube hoặc upload MP4 lên Supabase, rồi lưu vào cột{" "}
                  <span className="font-black text-pink-500">video_url/video_urls</span>.
                </p>
              </div>
            </div>
          )}

          {videoUrls.length > 0 ? (
            <div className="grid content-start gap-2 rounded-[18px] border border-pink-100 bg-white/70 p-3">
              {videoUrls.map((videoUrl, index) => (
                <button
                  key={videoUrl}
                  type="button"
                  onClick={() => setSelectedVideoIndex(index)}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    selectedVideoIndex === index
                      ? "border-rose-200 bg-rose-50"
                      : "border-pink-100 bg-white hover:bg-pink-50/60"
                  }`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500 text-white">
                    <Video size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-slate-800">
                      {getFileLabelFromUrl(videoUrl, `Video ${index + 1}`, videoTitlesByUrl)}
                    </span>
                    <span className="block truncate text-xs font-semibold text-slate-500">
                      {getFileLabelFromUrl(videoUrl, `Video ${index + 1}`, videoTitlesByUrl)}
                    </span>
                  </span>
                  <ChevronRight size={17} className="text-slate-400" />
                </button>
              ))}
            </div>
          ) : null}
          </div>
          <div className="mt-3 rounded-2xl border border-pink-100 bg-pink-50/60 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
            <Lightbulb className="mr-2 inline text-amber-500" size={16} />
            Mẹo học: Nghe trước không xem phụ đề, sau đó mở PDF để shadowing.
          </div>
        </article>

        <article className="grid h-full content-start rounded-[28px] border border-pink-100/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(236,72,153,0.08)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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
            <span className="rounded-2xl bg-violet-50 px-3 py-1 text-sm font-black text-violet-500">
              {pdfUrls.length} PDF
            </span>
          </div>

          {selectedPdfUrl ? (
            <>
              <iframe
                title={`PDF ${lesson.title}`}
                src={selectedPdfViewerUrl}
                className="min-h-[520px] w-full rounded-[18px] border border-pink-100 bg-white md:min-h-[620px]"
              />
              {pdfUrls.length > 1 ? (
                <div className="mt-4 grid gap-2">
                  {pdfUrls.map((pdfUrl, index) => (
                    <button
                      key={pdfUrl}
                      type="button"
                      onClick={() => setSelectedPdfIndex(index)}
                      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        selectedPdfIndex === index
                          ? "border-violet-200 bg-violet-50"
                          : "border-pink-100 bg-white hover:bg-violet-50/60"
                      }`}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white">
                        <FileText size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-slate-800">
                          {getFileLabelFromUrl(pdfUrl, `PDF ${index + 1}`)}
                        </span>
                        <span className="block truncate text-xs font-semibold text-slate-500">
                          {getFileLabelFromUrl(pdfUrl, `PDF ${index + 1}`)}
                        </span>
                      </span>
                      <ChevronRight size={17} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={selectedPdfViewerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-violet-500 px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(139,92,246,0.20)] transition hover:bg-violet-600"
                >
                  <ExternalLink size={16} />
                  Mở tab mới
                </a>
                <a
                  href={selectedPdfUrl}
                  download
                  className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-pink-50"
                >
                  <Download size={16} />
                  Tải xuống
                </a>
              </div>
            </>
          ) : (
            <div className="grid min-h-[520px] place-items-center rounded-[18px] border border-dashed border-violet-200 bg-violet-50/70 p-6 text-center md:min-h-[620px]">
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

        <article className="grid h-full content-start rounded-[28px] border border-pink-100/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(236,72,153,0.08)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <Volume2 size={20} />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Audio nghe riêng
                </h2>
                <p className="text-sm text-slate-500">
                  File MP3 được upload riêng cho đoạn nghe trong bài Kaiwa.
                </p>
              </div>
            </div>
            <span className="rounded-2xl bg-amber-50 px-3 py-1 text-sm font-black text-amber-500">
              {audioUrls.length} MP3
            </span>
          </div>

          {audioUrls.length > 0 ? (
            <div className="grid gap-3">
              {audioUrls.map((audioUrl, index) => (
                <div
                  key={audioUrl}
                  className="rounded-[18px] border border-amber-100 bg-amber-50/45 p-3"
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
                    <Volume2 size={17} className="text-amber-500" />
                    {getFileLabelFromUrl(audioUrl, `MP3 ${index + 1}`)}
                  </div>
                  <audio controls src={audioUrl} className="w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[160px] place-items-center rounded-[18px] border border-dashed border-amber-200 bg-amber-50 p-6 text-center">
              <div>
                <p className="text-base font-black text-slate-800">
                  Chưa gắn MP3 riêng
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Upload MP3 trong modal thêm/sửa Kaiwa để học viên nghe trực tiếp tại đây.
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
