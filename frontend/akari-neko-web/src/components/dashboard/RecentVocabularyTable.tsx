"use client";

import { BookOpen, MoreHorizontal, Star, Volume2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getRecentVocabularies,
  type VocabularyListItem,
} from "@/services/vocabularyService";
import { SoftPanel } from "../ui/SoftPanel";
import { useNotification } from "@/contexts/NotificationContext";

type RecentVocabularyTableProps = {
  refreshKey?: number;
};

function DifficultyStars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          size={15}
          className={
            star <= count
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }
        />
      ))}
    </div>
  );
}

function getDifficultyStarCount(vocabulary: VocabularyListItem) {
  if (vocabulary.isDifficult) {
    return 3;
  }

  if (vocabulary.wrongCount > vocabulary.correctCount) {
    return 2;
  }

  return 1;
}

export function RecentVocabularyTable({
  refreshKey = 0,
}: RecentVocabularyTableProps) {
  const { notifyError } = useNotification();
  const [recentVocabularies, setRecentVocabularies] = useState<
    VocabularyListItem[]
  >([]);
  const [isLoadingRecentVocabularies, setIsLoadingRecentVocabularies] =
    useState(false);
  const [recentVocabularyError, setRecentVocabularyError] = useState<
    string | null
  >(null);

  const loadRecentVocabularies = useCallback(async () => {
    setIsLoadingRecentVocabularies(true);
    setRecentVocabularyError(null);

    try {
      const data = await getRecentVocabularies(5);
      setRecentVocabularies(data);
    } catch (error) {
      console.error("Failed to load recent vocabularies:", error);
      const fallbackMessage = "Không thể tải từ vựng gần đây.";
      setRecentVocabularyError(fallbackMessage);
      notifyError(error, fallbackMessage);
    } finally {
      setIsLoadingRecentVocabularies(false);
    }
  }, [notifyError]);

  useEffect(() => {
    // Reload when the dashboard refresh button completes a stats refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecentVocabularies();
  }, [loadRecentVocabularies, refreshKey]);

  return (
    <SoftPanel className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
            <BookOpen size={18} strokeWidth={2.4} />
          </div>

          <h3 className="text-lg font-black text-slate-800 sm:text-xl">
            Từ vựng gần đây
          </h3>
        </div>

        <button
          type="button"
          className="rounded-2xl px-3 py-2 text-sm font-bold text-violet-500 transition hover:bg-violet-50"
        >
          View all →
        </button>
      </div>

      <div className="grid gap-3 md:hidden">
        {recentVocabularies.slice(0, 3).map((vocabulary) => (
          <div
            key={`${vocabulary.kanji}-${vocabulary.hiragana}-mobile`}
            className="rounded-2xl border border-pink-50 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500 transition hover:bg-pink-100"
                title="Phát âm"
              >
                <Volume2 size={17} strokeWidth={2.4} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-black text-slate-800">
                    {vocabulary.kanji}
                  </p>

                  <span className="rounded-xl bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-500">
                    {vocabulary.level}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-600">
                  {vocabulary.hiragana}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {vocabulary.meaning}
                </p>
              </div>

              <DifficultyStars count={getDifficultyStarCount(vocabulary)} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[22px] border border-pink-50 md:block">
        <div className="grid grid-cols-[48px_1fr_1fr_1.5fr_0.7fr_0.7fr_0.7fr_0.8fr_0.7fr] bg-gradient-to-r from-pink-50/80 to-white px-4 py-3 text-sm font-bold text-slate-500">
          <div />
          <div>Kanji</div>
          <div>Hiragana</div>
          <div>Meaning</div>
          <div>Level</div>
          <div>Correct</div>
          <div>Wrong</div>
          <div>Difficult</div>
          <div>Action</div>
        </div>

        {recentVocabularyError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
            {recentVocabularyError}
          </div>
        ) : null}

        {isLoadingRecentVocabularies ? (
          <div className="rounded-2xl border border-pink-50 bg-white px-4 py-6 text-center text-sm font-bold text-slate-400">
            Đang tải từ vựng gần đây...
          </div>
        ) : recentVocabularies.length > 0 ? (
          recentVocabularies.map((vocabulary) => (
            <div
              key={`${vocabulary.kanji}-${vocabulary.hiragana}`}
              className="grid grid-cols-[48px_1fr_1fr_1.5fr_0.7fr_0.7fr_0.7fr_0.8fr_0.7fr] items-center border-t border-pink-50 px-4 py-3 text-sm text-slate-600 transition hover:bg-pink-50/45"
            >
              <div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-500 transition hover:bg-pink-100"
                  title="Phát âm"
                >
                  <Volume2 size={16} strokeWidth={2.4} />
                </button>
              </div>

              <div className="text-base font-black text-slate-800">
                {vocabulary.kanji}
              </div>

              <div className="font-semibold text-slate-700">
                {vocabulary.hiragana}
              </div>

              <div>{vocabulary.meaning}</div>

              <div>
                <span className="rounded-xl bg-pink-100 px-3 py-1 font-bold text-pink-500">
                  {vocabulary.level}
                </span>
              </div>

              <div className="font-bold text-emerald-600">
                {vocabulary.correctCount}
              </div>

              <div className="font-bold text-rose-500">
                {vocabulary.wrongCount}
              </div>

              <DifficultyStars count={getDifficultyStarCount(vocabulary)} />

              <div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-pink-100 bg-white text-pink-400 shadow-sm transition hover:bg-pink-50"
                  title="More actions"
                >
                  <MoreHorizontal size={17} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-pink-50 bg-white px-4 py-6 text-center text-sm font-medium text-slate-400">
            Chưa có từ vựng nào. Hãy import ở trang Vocabulary trước.
          </div>
        )}
      </div>
    </SoftPanel>
  );
}
