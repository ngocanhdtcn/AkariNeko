"use client";

import { ArrowRight, Clapperboard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { KaiwaLesson } from "@/data/kaiwaData";
import { getKaiwaLessons } from "@/services/kaiwaService";
import { KaiwaCard } from "./KaiwaCard";

export function KaiwaHomeSection() {
  const [latestLessons, setLatestLessons] = useState<KaiwaLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getKaiwaLessons()
      .then((lessons) => {
        if (!isMounted) {
          return;
        }

        setLatestLessons(lessons.slice(0, 3));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setLatestLessons([]);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="akari-kaiwa-panel rounded-[28px] border border-pink-100/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(236,72,153,0.10)]">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-pink-500">
            <Clapperboard size={16} />
            Kaiwa Room
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-800">
            Video hội thoại & PDF luyện nói
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Luyện nghe, đọc hội thoại và shadowing theo từng bài. Home chỉ giữ
            lối vào nhanh để trang luôn nhẹ và gọn.
          </p>
        </div>

        <Link
          href="/kaiwa"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-black text-pink-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-pink-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100"
        >
          Xem tất cả
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {latestLessons.map((lesson) => (
          <KaiwaCard key={lesson.id} lesson={lesson} />
        ))}
        {!isLoading && latestLessons.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-pink-100 bg-white/80 p-6 text-center md:col-span-3">
            <p className="text-sm font-black text-slate-700">
              Chưa có bài Kaiwa nào trong Supabase.
            </p>
          </div>
        ) : null}
        {isLoading ? (
          <div className="rounded-[24px] border border-dashed border-pink-100 bg-white/80 p-6 text-center md:col-span-3">
            <p className="text-sm font-black text-pink-500">Đang tải bài Kaiwa...</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
