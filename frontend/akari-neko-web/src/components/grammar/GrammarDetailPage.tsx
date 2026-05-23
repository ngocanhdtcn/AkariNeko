"use client";

import Image from "next/image";

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

const loadErrorMessage =
  "Không thể tải chi tiết ngữ pháp. Vui lòng thử lại.";

function SakuraBranchScene() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[72%] overflow-hidden lg:block"
    >
      <Image
        src="/images/grammar/grammar-cat-banner.avif"
        alt="AkariNeko grammar cat banner"
        fill
        priority
        sizes="72vw"
        className="object-cover object-right-bottom opacity-95 drop-shadow-[0_18px_28px_rgba(244,114,182,0.12)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.32)_16%,black_38%,black_100%)]"
      />
    </div>
  );
}

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
      className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-2xl px-1 py-1 text-sm font-bold text-pink-500 transition hover:text-pink-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100"
    >
      <ArrowLeft size={17} />
      Quay lại
    </Link>
  );
}

function GrammarDetailSkeleton() {
  return (
    <div className="akari-grammar-detail grid min-w-0 gap-4 pb-24 lg:pb-0">
      <div className="h-10 w-28 animate-pulse rounded-2xl bg-pink-100/70" />

      <section className="min-h-[280px] animate-pulse overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-[#fff8fb] via-[#fff5f9] to-[#ffeef6] p-5 shadow-sm">
        <div className="h-8 w-16 rounded-full bg-white/75" />
        <div className="mt-5 h-10 w-3/4 rounded-full bg-white/75" />
        <div className="mt-4 h-14 w-full rounded-2xl bg-white/65" />
        <div className="mt-4 h-5 w-5/6 rounded-full bg-white/65" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="h-11 rounded-2xl bg-white/70" />
          <div className="h-11 rounded-2xl bg-white/70" />
          <div className="h-11 rounded-2xl bg-white/70" />
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

type GrammarActionButtonsProps = {
  grammarPoint: GrammarPoint;
  isBookmarking: boolean;
  className?: string;
  onBookmark: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function GrammarActionButtons({
  grammarPoint,
  isBookmarking,
  className = "",
  onBookmark,
  onEdit,
  onDelete,
}: GrammarActionButtonsProps) {
  return (
    <div className={`grid grid-cols-3 gap-2 sm:gap-3 ${className}`}>
      <AppButton
        variant="secondary"
        disabled={isBookmarking}
        className="akari-grammar-action-save w-full min-w-0 !gap-1 !rounded-xl !px-2 !py-1 text-[11px] leading-none !border-emerald-100 !bg-emerald-50/90 !text-emerald-700 shadow-[0_10px_24px_rgba(16,185,129,0.08)] hover:!bg-emerald-100/80 sm:!min-h-11 sm:!gap-2 sm:!rounded-2xl sm:!px-4 sm:!py-2 sm:text-sm"
        icon={
          grammarPoint.isBookmarked ? (
            <BookmarkCheck size={15} className="shrink-0 text-current sm:size-[17px]" />
          ) : (
            <Bookmark size={15} className="shrink-0 text-current sm:size-[17px]" />
          )
        }
        onClick={onBookmark}
      >
        {isBookmarking
          ? "Đang lưu..."
          : grammarPoint.isBookmarked
            ? "Đã lưu"
            : "Lưu"}
      </AppButton>

      <AppButton
        variant="secondary"
        className="akari-grammar-action-edit w-full min-w-0 !gap-1 !rounded-xl !px-2 !py-1 text-[11px] leading-none !border-violet-100 !bg-violet-50/90 !text-violet-600 shadow-[0_10px_24px_rgba(139,92,246,0.08)] hover:!bg-violet-100/75 sm:!min-h-11 sm:!gap-2 sm:!rounded-2xl sm:!px-4 sm:!py-2 sm:text-sm"
        icon={<Pencil size={15} className="shrink-0 text-current sm:size-[17px]" />}
        onClick={onEdit}
      >
        Sửa
      </AppButton>

      <AppButton
        variant="secondary"
        className="akari-grammar-action-delete w-full min-w-0 !gap-1 !rounded-xl !px-2 !py-1 text-[11px] leading-none !border-rose-100 !bg-rose-50/90 !text-rose-600 shadow-[0_10px_24px_rgba(244,63,94,0.08)] hover:!bg-rose-100/75 sm:!min-h-11 sm:!gap-2 sm:!rounded-2xl sm:!px-4 sm:!py-2 sm:text-sm"
        icon={<Trash2 size={15} className="shrink-0 text-current sm:size-[17px]" />}
        onClick={onDelete}
      >
        Xóa
      </AppButton>
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
      const updatedGrammarPoint = await updateGrammarPoint(
        grammarPoint.id,
        payload,
      );
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
      <div className="grid min-w-0 gap-3 pb-24 lg:pb-0">
        <BackToGrammarLink />

        <section className="rounded-3xl border border-rose-100 bg-rose-50/80 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-lg font-black text-rose-600">
                Không thể tải chi tiết ngữ pháp
              </h1>
              <p className="mt-2 break-words text-sm font-semibold leading-6 text-rose-500">
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
      <div className="grid min-w-0 gap-3 pb-24 lg:pb-0">
        <BackToGrammarLink />
        <EmptyState
          icon={<RotateCcw size={24} />}
          title="Không tìm thấy mẫu ngữ pháp"
          description="Mẫu ngữ pháp này có thể đã bị xóa hoặc không còn tồn tại."
          actionLabel="Quay lại"
          onAction={() => router.push("/grammar")}
        />
      </div>
    );
  }

  return (
    <div className="akari-grammar-detail grid min-w-0 gap-4 pb-24 lg:pb-0">
      <div className="flex min-w-0">
        <BackToGrammarLink />
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

      <section className="akari-grammar-detail-hero relative isolate overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-[#fff2f5] via-[#fff7f2] to-[#ffe7ef] p-5 shadow-sm sm:p-6 lg:min-h-[300px] lg:p-8">
        <SakuraBranchScene />

        <div className="relative z-20 grid min-w-0 gap-5 lg:max-w-[52%]">
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
            <h1
              lang="ja"
              className="whitespace-normal break-words text-3xl font-black leading-tight text-slate-950 sm:text-4xl"
            >
              {grammarPoint.title}
            </h1>

            <p className="akari-grammar-structure mt-4 whitespace-normal break-words rounded-2xl border border-pink-100 bg-white/75 px-4 py-3 text-base font-black leading-7 text-pink-600 shadow-sm sm:text-lg">
              {grammarPoint.structure || "Chưa có cấu trúc"}
            </p>

            <p className="mt-4 whitespace-normal break-words text-base font-semibold leading-7 text-slate-600">
              {grammarPoint.meaning || "Chưa có ý nghĩa."}
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span className="akari-grammar-date-chip inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5">
              <CalendarDays size={14} className="shrink-0" />
              <span className="truncate">Tạo: {formatDate(grammarPoint.createdAt)}</span>
            </span>
            <span className="akari-grammar-date-chip inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5">
              <CalendarDays size={14} className="shrink-0" />
              <span className="truncate">
                Cập nhật: {formatDate(grammarPoint.updatedAt)}
              </span>
            </span>
          </div>

          <GrammarActionButtons
            grammarPoint={grammarPoint}
            isBookmarking={isBookmarking}
            onBookmark={() => void handleBookmark()}
            onEdit={() => setIsFormOpen(true)}
            onDelete={() => setIsDeleteOpen(true)}
          />
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <GrammarDetailSection title="1. Cấu trúc">
          <p className="akari-grammar-structure whitespace-normal break-words rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-lg font-black leading-8 text-emerald-700">
            {grammarPoint.structure || "Chưa có cấu trúc."}
          </p>
        </GrammarDetailSection>

        <GrammarDetailSection title="2. Ý nghĩa">
          <p className="whitespace-normal break-words text-sm font-semibold leading-7 text-slate-600">
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
            <div className="grid min-w-0 gap-3">
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
