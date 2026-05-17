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
import { SakuraIcon } from "@/components/grammar/SakuraIcon";
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

function SakuraPetal({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`akari-sakura-petal absolute block h-3 w-2 rounded-[70%_30%_70%_30%] bg-pink-300/45 shadow-[0_0_12px_rgba(244,114,182,0.20)] ${className}`}
    />
  );
}

function SakuraBlossom({
  className = "",
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`absolute grid place-items-center text-pink-300 drop-shadow-[0_5px_10px_rgba(244,114,182,0.18)] ${className}`}
    >
      <SakuraIcon size={size} />
    </span>
  );
}

function SakuraBranchScene() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[66%] overflow-hidden lg:block"
    >
      <div className="absolute -right-12 top-4 h-56 w-56 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute bottom-2 right-14 h-36 w-72 rounded-full bg-rose-200/35 blur-3xl" />
      <div className="absolute left-12 top-24 h-36 w-48 rounded-full bg-white/45 blur-2xl" />

      <div className="absolute -right-3 top-3 z-20 h-56 w-72">
        <SakuraBlossom className="right-12 top-20 text-pink-300/80" size={34} />
        <SakuraBlossom className="right-6 top-4 text-pink-200/75" size={24} />
        <SakuraBlossom className="right-28 top-10 text-rose-300/70" size={18} />
        <SakuraBlossom className="right-48 top-40 text-pink-300/65" size={22} />
      </div>

      <div className="absolute bottom-0 right-0 z-0 h-28 w-full bg-[radial-gradient(ellipse_at_78%_100%,rgba(251,207,232,0.70),transparent_62%),linear-gradient(0deg,rgba(255,228,235,0.62),transparent_78%)]" />
      <div className="absolute bottom-3 right-20 z-0 h-14 w-72 rounded-[50%] bg-pink-200/35 blur-xl" />

      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 h-full w-[82%] select-none">
        <Image
          src="/images/grammar/grammar-cat-banner.avif"
          alt="AkariNeko grammar cat banner"
          fill
          priority
          sizes="82vw"
          className="object-cover object-right-bottom opacity-95 drop-shadow-[0_18px_28px_rgba(244,114,182,0.12)] [mask-image:linear-gradient(90deg,transparent_0%,black_18%,black_100%)]"
        />
      </div>

      <span className="absolute bottom-7 right-[31%] z-10 h-5 w-32 rounded-full bg-rose-300/20 blur-md" />

      <SakuraPetal className="left-[8%] top-[42%] rotate-[-24deg] opacity-60" />
      <SakuraPetal className="left-[20%] top-[57%] h-4 w-2.5 rotate-[28deg] opacity-45" />
      <SakuraPetal className="left-[34%] top-[36%] rotate-[44deg] opacity-55" />
      <SakuraPetal className="left-[44%] top-[62%] h-3.5 w-2 rotate-[-36deg] opacity-50" />
      <SakuraPetal className="right-[39%] top-[44%] h-4 w-2.5 rotate-[20deg] opacity-65" />
      <SakuraPetal className="right-[26%] top-[55%] rotate-[-18deg] opacity-50" />
      <SakuraPetal className="right-[16%] top-[67%] h-3.5 w-2 rotate-[36deg] opacity-45" />
      <SakuraPetal className="right-[10%] top-[26%] rotate-[-8deg] opacity-50" />
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
      className="inline-flex min-h-8 w-fit items-center justify-center gap-2 rounded-2xl px-1 py-1 text-sm font-bold text-pink-500 transition hover:text-pink-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100"
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

      <section className="relative min-h-[240px] animate-pulse overflow-hidden rounded-3xl border border-pink-100/60 bg-gradient-to-r from-[#fff8fb] via-[#fff5f9] to-[#ffeef6] p-5 shadow-[0_10px_40px_rgba(255,182,193,0.15)] sm:p-7 lg:p-8">
        <div className="absolute -right-16 -top-10 hidden h-64 w-64 rounded-full bg-pink-200/30 blur-3xl lg:block" />
        <div className="absolute bottom-0 right-10 hidden h-28 w-[52%] rounded-full bg-rose-200/30 blur-2xl lg:block" />
        <div className="relative z-10 grid min-w-0 gap-6 lg:min-h-[210px] lg:max-w-[50%] lg:content-center">
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
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <AppButton
        variant="secondary"
        disabled={isBookmarking}
        className="min-w-[106px] border-pink-100 bg-white/90 text-pink-500 shadow-[0_10px_26px_rgba(236,72,153,0.12)]"
        icon={
          grammarPoint.isBookmarked ? (
            <BookmarkCheck size={17} className="text-pink-500" />
          ) : (
            <Bookmark size={17} className="text-pink-500" />
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
        className="min-w-[96px] border-pink-100 bg-white/90 text-violet-500 shadow-[0_10px_26px_rgba(139,92,246,0.10)]"
        icon={<Pencil size={17} className="text-violet-500" />}
        onClick={onEdit}
      >
        Sửa
      </AppButton>

      <AppButton
        variant="secondary"
        className="min-w-[96px] border-rose-100 bg-white/90 text-rose-500 shadow-[0_10px_26px_rgba(244,63,94,0.10)] hover:bg-rose-50"
        icon={<Trash2 size={17} className="text-rose-500" />}
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
      <div className="grid min-w-0 gap-3">
        <BackToGrammarLink />

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
    <div className="grid min-w-0 gap-4 lg:gap-3">
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

      <section className="relative isolate min-h-[240px] overflow-hidden rounded-3xl border border-pink-100/60 bg-gradient-to-r from-[#fff8fb] via-[#fff5f9] to-[#ffeef6] px-5 pb-5 pt-4 shadow-[0_10px_40px_rgba(255,182,193,0.15)] sm:px-7 sm:pb-7 sm:pt-5 lg:px-8 lg:pb-8 lg:pt-6">
        <div className="pointer-events-none absolute -left-16 top-6 h-48 w-48 rounded-full bg-white/60 blur-3xl" />
        <div className="pointer-events-none absolute left-[34%] top-10 h-28 w-28 rounded-full bg-pink-200/20 blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24 rounded-b-3xl bg-[linear-gradient(0deg,rgba(255,240,244,0.58),transparent_78%)]" />
        <SakuraPetal className="left-[48%] top-[23%] rotate-[22deg] opacity-35" />
        <SakuraPetal className="left-[58%] top-[39%] h-4 w-2.5 rotate-[-24deg] opacity-35" />
        <SakuraPetal className="left-[66%] top-[18%] rotate-[38deg] opacity-30" />

        <SakuraBranchScene />

        <GrammarActionButtons
          grammarPoint={grammarPoint}
          isBookmarking={isBookmarking}
          className="relative z-30 mb-5 lg:absolute lg:left-[51%] lg:top-7 lg:mb-0 lg:-translate-x-1/2"
          onBookmark={() => void handleBookmark()}
          onEdit={() => setIsFormOpen(true)}
          onDelete={() => setIsDeleteOpen(true)}
        />

        <div className="relative z-20 grid min-w-0 gap-4 lg:min-h-[190px] lg:max-w-[50%] lg:content-center">
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
            <h1 className="break-words text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              {grammarPoint.title}
            </h1>
            <p className="mt-3 break-words text-lg font-black leading-8 text-pink-500">
              {grammarPoint.structure || "Chưa có cấu trúc"}
            </p>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#4b5574]">
              {grammarPoint.meaning || "Chưa có ý nghĩa."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-bold text-[#64708e]">
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
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <GrammarDetailSection title="1. Cấu trúc">
          <p className="break-words rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-lg font-black leading-8 text-emerald-700">
            {grammarPoint.structure || "Chưa có cấu trúc."}
          </p>
        </GrammarDetailSection>

        <GrammarDetailSection title="2. Ý nghĩa">
          <p className="break-words text-sm font-semibold leading-7 text-[#4b5574]">
            {grammarPoint.meaning || "Chưa có ý nghĩa."}
          </p>
        </GrammarDetailSection>

        <GrammarDetailSection title="3. Cách dùng">
          <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-[#4b5574]">
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
            <p className="text-sm font-semibold leading-7 text-[#64708e]">
              Chưa có ví dụ cho mẫu ngữ pháp này.
            </p>
          )}
        </GrammarDetailSection>

        <GrammarDetailSection title="5. Ghi chú">
          <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-[#4b5574]">
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
