"use client";

import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GrammarDetailSection } from "@/components/grammar/GrammarDetailSection";
import { GrammarExampleCard } from "@/components/grammar/GrammarExampleCard";
import { GrammarForm } from "@/components/grammar/GrammarForm";
import { getJlptBadgeClassName } from "@/components/grammar/GrammarCard";
import { AppButton } from "@/components/ui/AppButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  GrammarNotFoundError,
  addGrammarBookmark,
  deleteGrammarPoint,
  getGrammarPointById,
  removeGrammarBookmark,
  updateGrammarPoint,
  type GrammarMutation,
  type GrammarPoint,
} from "@/services/grammarService";

type GrammarDetailPageProps = {
  grammarId: string;
};

const loadErrorMessage = "Không thể tải chi tiết ngữ pháp. Vui lòng thử lại.";

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getActionErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function BackToGrammarLink() {
  return (
    <Link
      href="/grammar"
      className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-white/85 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-pink-200 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100"
    >
      <ArrowLeft size={17} />
      Quay lại danh sách
    </Link>
  );
}

function GrammarDetailSkeleton() {
  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-11 w-44 animate-pulse rounded-2xl bg-pink-100/70" />
        <div className="flex gap-2">
          <div className="h-10 w-20 animate-pulse rounded-2xl bg-pink-100/70" />
          <div className="h-10 w-20 animate-pulse rounded-2xl bg-pink-100/70" />
          <div className="h-10 w-20 animate-pulse rounded-2xl bg-pink-100/70" />
        </div>
      </div>

      <section className="animate-pulse rounded-3xl border border-pink-100 bg-gradient-to-br from-rose-100 via-pink-50 to-violet-100 p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="h-8 w-16 rounded-full bg-white/70" />
            <div className="mt-5 h-10 w-2/3 rounded-full bg-white/70" />
            <div className="mt-4 h-6 w-1/2 rounded-full bg-white/60" />
            <div className="mt-4 h-5 w-5/6 rounded-full bg-white/60" />
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="h-8 w-28 rounded-full bg-white/65" />
              <div className="h-8 w-32 rounded-full bg-white/65" />
            </div>
          </div>
          <div className="hidden h-56 w-[450px] max-w-[34vw] rounded-3xl bg-white/55 lg:block" />
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <LoadingSkeleton variant="card" className="min-h-44" />
        <LoadingSkeleton variant="card" className="min-h-44" />
        <LoadingSkeleton variant="card" className="min-h-44" />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <LoadingSkeleton variant="list" rows={3} />
        <LoadingSkeleton variant="card" className="min-h-44" />
      </div>
    </div>
  );
}

export function GrammarDetailPage({ grammarId }: GrammarDetailPageProps) {
  const router = useRouter();
  const [grammarPoint, setGrammarPoint] = useState<GrammarPoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadGrammarPoint = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setIsNotFound(false);

    try {
      const nextGrammarPoint = await getGrammarPointById(grammarId);
      setGrammarPoint(nextGrammarPoint);
    } catch (error) {
      console.error("Failed to load grammar detail:", error);
      setGrammarPoint(null);

      if (error instanceof GrammarNotFoundError) {
        setIsNotFound(true);
      } else {
        setLoadError(loadErrorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [grammarId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGrammarPoint();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadGrammarPoint]);

  async function handleBookmark() {
    if (!grammarPoint || isBookmarking) {
      return;
    }

    setIsBookmarking(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const updatedGrammarPoint = grammarPoint.isBookmarked
        ? await removeGrammarBookmark(grammarPoint.id)
        : await addGrammarBookmark(grammarPoint.id);

      setGrammarPoint(updatedGrammarPoint);
      setActionMessage(
        updatedGrammarPoint.isBookmarked
          ? "Đã lưu ngữ pháp."
          : "Đã bỏ lưu ngữ pháp.",
      );
    } catch (error) {
      console.error("Failed to update grammar bookmark:", error);
      setActionError(
        getActionErrorMessage(
          error,
          "Không thể cập nhật bookmark. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsBookmarking(false);
    }
  }

  async function handleSave(payload: GrammarMutation) {
    if (!grammarPoint) {
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const updatedGrammarPoint = await updateGrammarPoint(grammarPoint.id, payload);
      setGrammarPoint(updatedGrammarPoint);
      setIsFormOpen(false);
      setActionMessage("Đã cập nhật ngữ pháp.");
    } catch (error) {
      console.error("Failed to update grammar:", error);
      setActionError(
        getActionErrorMessage(
          error,
          "Không thể cập nhật ngữ pháp. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!grammarPoint) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await deleteGrammarPoint(grammarPoint.id);
      router.push("/grammar");
    } catch (error) {
      console.error("Failed to delete grammar:", error);
      setActionError(
        getActionErrorMessage(
          error,
          "Không thể xóa mẫu ngữ pháp. Vui lòng thử lại.",
        ),
      );
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <GrammarDetailSkeleton />;
  }

  if (loadError) {
    return (
      <div className="grid min-w-0 gap-5">
        <div className="flex flex-col gap-2">
          <BackToGrammarLink />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Ngữ pháp / Chi tiết
          </p>
        </div>

        <section className="rounded-3xl border border-rose-100 bg-rose-50/80 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-black text-rose-600">
                Không thể tải chi tiết ngữ pháp
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-rose-500">
                {loadError}
              </p>
            </div>

            <AppButton
              variant="danger"
              icon={<RotateCcw size={17} />}
              onClick={() => void loadGrammarPoint()}
            >
              Thử lại
            </AppButton>
          </div>
        </section>
      </div>
    );
  }

  if (isNotFound || !grammarPoint) {
    return (
      <EmptyState
        icon={<RotateCcw size={24} />}
        title="Không tìm thấy mẫu ngữ pháp"
        description="Mẫu ngữ pháp này có thể đã bị xóa hoặc không còn tồn tại."
        actionLabel="Quay lại danh sách"
        onAction={() => router.push("/grammar")}
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <BackToGrammarLink />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Ngữ pháp / Chi tiết
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <AppButton
            variant={grammarPoint.isBookmarked ? "secondary" : "primary"}
            disabled={isBookmarking}
            icon={
              grammarPoint.isBookmarked ? (
                <BookmarkCheck size={17} />
              ) : (
                <Bookmark size={17} />
              )
            }
            onClick={() => void handleBookmark()}
          >
            {isBookmarking
              ? "Đang lưu..."
              : grammarPoint.isBookmarked
                ? "Đã lưu"
                : "Lưu"}
          </AppButton>
          <AppButton
            variant="secondary"
            icon={<Pencil size={17} />}
            onClick={() => setIsFormOpen(true)}
          >
            Sửa
          </AppButton>
          <AppButton
            variant="danger"
            icon={<Trash2 size={17} />}
            onClick={() => setIsDeleteOpen(true)}
          >
            Xóa
          </AppButton>
        </div>
      </div>

      {actionError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
          {actionError}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
          {actionMessage}
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-rose-100 via-pink-50 to-violet-100 p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="relative z-10 grid min-w-0 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-xs font-black ${getJlptBadgeClassName(grammarPoint.jlptLevel)}`}
              >
                {grammarPoint.jlptLevel}
              </span>
              {grammarPoint.isBookmarked ? (
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-pink-100 bg-white/75 px-3 py-1 text-xs font-black text-pink-500">
                  <BookmarkCheck size={14} />
                  Đã lưu
                </span>
              ) : null}
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                {grammarPoint.title}
              </h1>
              <p className="mt-3 break-words text-lg font-black leading-8 text-rose-600">
                {grammarPoint.structure || "Chưa có cấu trúc"}
              </p>
              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-700">
                {grammarPoint.meaning || "Chưa có ý nghĩa."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5">
                <CalendarDays size={14} />
                Tạo: {formatDate(grammarPoint.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5">
                <CalendarDays size={14} />
                Cập nhật: {formatDate(grammarPoint.updatedAt)}
              </span>
            </div>
          </div>

          <img
            src="/images/grammar/grammar-cat-banner.avif"
            alt="AkariNeko grammar cat banner"
            className="hidden h-auto w-[450px] max-w-[34vw] select-none object-contain pointer-events-none lg:block"
          />
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <GrammarDetailSection title="1. Cấu trúc">
          <p className="break-words rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-lg font-black leading-8 text-emerald-700">
            {grammarPoint.structure || "Chưa có cấu trúc."}
          </p>
        </GrammarDetailSection>

        <GrammarDetailSection title="2. Ý nghĩa">
          <p className="break-words text-sm font-semibold leading-7 text-slate-600">
            {grammarPoint.meaning || "Chưa có ý nghĩa."}
          </p>
        </GrammarDetailSection>

        <GrammarDetailSection title="3. Cách dùng">
          <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-slate-600">
            {grammarPoint.explanation || "Chưa có phần giải thích cách dùng."}
          </p>
        </GrammarDetailSection>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <GrammarDetailSection title="4. Ví dụ">
          {grammarPoint.examples.length ? (
            <div className="grid gap-3">
              {grammarPoint.examples.map((example, index) => (
                <GrammarExampleCard
                  key={`${example.jp}-${example.vi ?? ""}-${index}`}
                  example={example}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold leading-7 text-slate-500">
              Chưa có ví dụ cho mẫu ngữ pháp này.
            </p>
          )}
        </GrammarDetailSection>

        <GrammarDetailSection title="5. Ghi chú">
          <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-slate-600">
            {grammarPoint.notes || "Chưa có ghi chú."}
          </p>
        </GrammarDetailSection>
      </div>

      <GrammarForm
        isOpen={isFormOpen}
        grammar={grammarPoint}
        isSaving={isSaving}
        onClose={() => {
          if (!isSaving) {
            setIsFormOpen(false);
          }
        }}
        onSubmit={(payload) => void handleSave(payload)}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Xóa ngữ pháp?"
        description="Bạn có chắc muốn xóa mẫu ngữ pháp này không?"
        confirmText={isDeleting ? "Đang xóa..." : "Xóa ngữ pháp"}
        cancelText="Hủy"
        isConfirming={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
