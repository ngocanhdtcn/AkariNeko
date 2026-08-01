"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { KaiwaLesson } from "@/data/kaiwaData";
import { getKaiwaLessonById } from "@/services/kaiwaService";
import { KaiwaDetailPage } from "./KaiwaDetailPage";

type KaiwaDetailRouteProps = {
  lessonId: string;
};

export function KaiwaDetailRoute({ lessonId }: KaiwaDetailRouteProps) {
  const [lesson, setLesson] = useState<KaiwaLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getKaiwaLessonById(lessonId)
      .then((item) => {
        if (isMounted) {
          setLesson(item);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLesson(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  if (isLoading) {
    return (
      <AppShell>
        <section className="rounded-[28px] border border-dashed border-pink-100 bg-white/90 p-8 text-center">
          <p className="text-sm font-black text-pink-500">Đang tải bài Kaiwa...</p>
        </section>
      </AppShell>
    );
  }

  if (!lesson) {
    return (
      <AppShell>
        <section className="rounded-[28px] border border-dashed border-pink-100 bg-white/90 p-8 text-center">
          <p className="text-lg font-black text-slate-800">
            Không thể mở bài Kaiwa này
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Bài học không tồn tại hoặc tài khoản chưa được cấp quyền phù hợp.
          </p>
        </section>
      </AppShell>
    );
  }

  return <KaiwaDetailPage lesson={lesson} />;
}
