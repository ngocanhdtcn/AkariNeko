"use client";

import Link from "next/link";
import { BookmarkCheck, GraduationCap, MoreHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getRecentGrammarPoints,
  type GrammarPoint,
} from "@/services/grammarService";
import { EmptyState } from "../ui/EmptyState";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { SoftPanel } from "../ui/SoftPanel";

type RecentGrammarTableProps = {
  refreshKey?: number;
};

function getExampleCountLabel(grammar: GrammarPoint) {
  return `${grammar.examples.length} ví dụ`;
}

export function RecentGrammarTable({ refreshKey = 0 }: RecentGrammarTableProps) {
  const [recentGrammarPoints, setRecentGrammarPoints] = useState<GrammarPoint[]>(
    [],
  );
  const [isLoadingRecentGrammar, setIsLoadingRecentGrammar] = useState(false);
  const [recentGrammarError, setRecentGrammarError] = useState<string | null>(
    null,
  );

  const loadRecentGrammarPoints = useCallback(async () => {
    setIsLoadingRecentGrammar(true);
    setRecentGrammarError(null);

    try {
      const data = await getRecentGrammarPoints(5);
      setRecentGrammarPoints(data);
    } catch (error) {
      console.error("Failed to load recent grammar points:", error);
      setRecentGrammarError("Không thể tải ngữ pháp gần đây.");
    } finally {
      setIsLoadingRecentGrammar(false);
    }
  }, []);

  useEffect(() => {
    // Reload when the dashboard refresh button completes a stats refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecentGrammarPoints();
  }, [loadRecentGrammarPoints, refreshKey]);

  return (
    <SoftPanel className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
            <GraduationCap size={18} strokeWidth={2.4} />
          </div>

          <h3 className="text-lg font-black text-slate-800 sm:text-xl">
            Ngữ pháp gần đây
          </h3>
        </div>

        <Link
          href="/grammar"
          className="rounded-2xl px-3 py-2 text-sm font-bold text-violet-500 transition hover:bg-violet-50"
        >
          View all →
        </Link>
      </div>

      <div className="grid gap-3 md:hidden">
        {isLoadingRecentGrammar ? (
          <LoadingSkeleton variant="list" rows={3} />
        ) : recentGrammarPoints.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={24} />}
            title="Chưa có ngữ pháp gần đây"
            description="Thêm mẫu ngữ pháp ở trang Grammar để danh sách này có dữ liệu."
            className="py-6"
          />
        ) : (
          recentGrammarPoints.slice(0, 3).map((grammar) => (
            <Link
              key={`${grammar.id}-mobile`}
              href={`/grammar/${grammar.id}`}
              className="rounded-2xl border border-pink-50 bg-white px-4 py-3 shadow-sm transition hover:bg-pink-50/45"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                  <GraduationCap size={17} strokeWidth={2.4} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p lang="ja" className="truncate text-lg font-black text-slate-800">
                      {grammar.title}
                    </p>

                    <span className="shrink-0 rounded-xl bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-500">
                      {grammar.jlptLevel}
                    </span>
                  </div>

                  <p lang="ja" className="truncate text-sm font-semibold text-pink-500">
                    {grammar.structure || "Chưa có cấu trúc"}
                  </p>

                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {grammar.meaning}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[22px] border border-pink-50 md:block">
        <div className="grid grid-cols-[48px_1.1fr_1.35fr_1.5fr_0.65fr_0.75fr_0.75fr_0.65fr] bg-gradient-to-r from-pink-50/80 to-white px-4 py-3 text-sm font-bold text-slate-500">
          <div />
          <div>Mẫu</div>
          <div>Cấu trúc</div>
          <div>Ý nghĩa</div>
          <div>Level</div>
          <div>Ví dụ</div>
          <div>Đã lưu</div>
          <div>Action</div>
        </div>

        {recentGrammarError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
            {recentGrammarError}
          </div>
        ) : null}

        {isLoadingRecentGrammar ? (
          <LoadingSkeleton variant="table" rows={4} />
        ) : recentGrammarPoints.length > 0 ? (
          recentGrammarPoints.map((grammar) => (
            <div
              key={grammar.id}
              className="grid grid-cols-[48px_1.1fr_1.35fr_1.5fr_0.65fr_0.75fr_0.75fr_0.65fr] items-center border-t border-pink-50 px-4 py-3 text-sm text-slate-600 transition hover:bg-pink-50/45"
            >
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                  <GraduationCap size={16} strokeWidth={2.4} />
                </div>
              </div>

              <div lang="ja" className="truncate text-base font-black text-slate-800">
                {grammar.title}
              </div>

              <div lang="ja" className="truncate font-semibold text-pink-500">
                {grammar.structure || "Chưa có cấu trúc"}
              </div>

              <div className="truncate">{grammar.meaning}</div>

              <div>
                <span className="rounded-xl bg-pink-100 px-3 py-1 font-bold text-pink-500">
                  {grammar.jlptLevel}
                </span>
              </div>

              <div className="font-bold text-violet-500">
                {getExampleCountLabel(grammar)}
              </div>

              <div>
                {grammar.isBookmarked ? (
                  <BookmarkCheck size={17} className="text-pink-500" />
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </div>

              <div>
                <Link
                  href={`/grammar/${grammar.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-pink-100 bg-white text-pink-400 shadow-sm transition hover:bg-pink-50"
                  title="Xem chi tiết"
                >
                  <MoreHorizontal size={17} strokeWidth={2.4} />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<GraduationCap size={24} />}
            title="Chưa có ngữ pháp gần đây"
            description="Thêm mẫu ngữ pháp ở trang Grammar để danh sách này có dữ liệu."
            className="m-4"
          />
        )}
      </div>
    </SoftPanel>
  );
}
