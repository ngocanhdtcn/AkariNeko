"use client";

import { History, RefreshCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import {
    deleteStudyHistory,
    getStudyHistories,
    getStudyHistorySummary,
    type StudyHistoryItem,
    type StudyHistorySummary,
} from "@/services/studyHistoryService";

const STUDY_HISTORY_PAGE_SIZE = 15;

type StudyHistoryRange = "all" | "today" | "last7days";

function getRangeStartDate(range: StudyHistoryRange) {
    const date = new Date();

    if (range === "today") {
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }

    if (range === "last7days") {
        date.setDate(date.getDate() - 7);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }

    return null;
}

function formatStudyDate(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function getStudyScopeLabel(history: StudyHistoryItem) {
    const scopes = [
        history.level ?? "All levels",
        history.book ?? "All books",
        history.chapter ?? "All chapters",
    ];

    return scopes.join(" • ");
}

function getAccuracyPercent(history: StudyHistoryItem) {
    if (history.reviewedCount === 0) {
        return 0;
    }

    return Math.round((history.rememberedCount / history.reviewedCount) * 100);
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
    const maxVisiblePages = 5;
    const halfVisiblePages = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisiblePages);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from(
        { length: endPage - startPage + 1 },
        (_, index) => startPage + index,
    );
}

export function StudyHistoryPage() {
    const [histories, setHistories] = useState<StudyHistoryItem[]>([]);
    const [totalHistoryCount, setTotalHistoryCount] = useState(0);
    const [historySummary, setHistorySummary] = useState<StudyHistorySummary>({
        reviewedCount: 0,
        rememberedCount: 0,
        forgotCount: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRange, setSelectedRange] =
        useState<StudyHistoryRange>("all");
    const [isLoadingHistories, setIsLoadingHistories] = useState(false);
    const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(
        null,
    );
    const [historyPendingDelete, setHistoryPendingDelete] =
        useState<StudyHistoryItem | null>(null);

    const totalPages = Math.max(
        1,
        Math.ceil(totalHistoryCount / STUDY_HISTORY_PAGE_SIZE),
    );

    const safeCurrentPage = Math.min(currentPage, totalPages);

    const visiblePageNumbers = getVisiblePageNumbers(
        safeCurrentPage,
        totalPages,
    );

    const loadStudyHistories = useCallback(async (page = currentPage) => {
        setIsLoadingHistories(true);
        setHistoryLoadError(null);

        try {
            const result = await getStudyHistories({
                page,
                pageSize: STUDY_HISTORY_PAGE_SIZE,
                fromDate: getRangeStartDate(selectedRange),
            });

            setHistories(result.items);
            setTotalHistoryCount(result.totalCount);
        } catch (error) {
            console.error("Failed to load study histories:", error);
            const fallbackMessage = "Không thể tải lịch sử học.";
            setHistoryLoadError(fallbackMessage);
        } finally {
            setIsLoadingHistories(false);
        }
    }, [currentPage, selectedRange]);

    const loadStudyHistorySummary = useCallback(async () => {
        try {
            const summary = await getStudyHistorySummary(
                getRangeStartDate(selectedRange),
            );

            setHistorySummary(summary);
        } catch (error) {
            console.error("Failed to load study history summary:", error);
            const fallbackMessage = "Không thể tải tổng thống kê lịch sử học.";
            setHistoryLoadError(fallbackMessage);
        }
    }, [selectedRange]);

    async function handleConfirmDeleteStudyHistory() {
        if (!historyPendingDelete) {
            return;
        }

        setDeletingHistoryId(historyPendingDelete.id);

        try {
            await deleteStudyHistory(historyPendingDelete.id);
            setHistoryPendingDelete(null);
            await loadStudyHistories(safeCurrentPage);
            await loadStudyHistorySummary();
        } catch (error) {
            console.error("Failed to delete study history:", error);
            const fallbackMessage = "Không thể xoá phiên học. Vui lòng thử lại.";
            setHistoryLoadError(fallbackMessage);
        } finally {
            setDeletingHistoryId(null);
        }
    }
    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadStudyHistories(currentPage);
            void loadStudyHistorySummary();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [currentPage, selectedRange, loadStudyHistories, loadStudyHistorySummary]);

    return (
        <>
        <div className="akari-study-history grid gap-5">
            <PageHeader
                eyebrow="Study History"
                title="Lịch sử học Flashcard"
                description="Theo dõi các phiên học đã lưu từ Flashcard."
                icon={<History size={21} />}
                className="akari-study-history-hero"
                action={
                    <AppButton icon={<RefreshCcw size={16} />} onClick={() => void loadStudyHistories(safeCurrentPage)}>
                        Làm mới
                    </AppButton>
                }
            />

            <section className="grid gap-4 xl:grid-cols-3">
                <div className="akari-study-history-stat rounded-[26px] border border-pink-100 bg-white/85 p-5 shadow-sm">
                    <p className="text-sm font-bold text-slate-500">Reviewed</p>
                    <p className="mt-2 text-3xl font-black text-slate-800">
                        {historySummary.reviewedCount}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">Theo bộ lọc hiện tại</p>
                </div>

                <div className="akari-study-history-stat rounded-[26px] border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm">
                    <p className="text-sm font-bold text-emerald-600">Remembered</p>
                    <p className="mt-2 text-3xl font-black text-emerald-700">
                        {historySummary.rememberedCount}
                    </p>
                    <p className="mt-1 text-sm text-emerald-600/75">
                        Tổng số từ đã nhớ
                    </p>
                </div>

                <div className="akari-study-history-stat rounded-[26px] border border-rose-100 bg-rose-50/80 p-5 shadow-sm">
                    <p className="text-sm font-bold text-rose-500">Forgot</p>
                    <p className="mt-2 text-3xl font-black text-rose-600">
                        {historySummary.forgotCount}
                    </p>
                    <p className="mt-1 text-sm text-rose-500/75">
                        Tổng số từ đã quên
                    </p>
                </div>
            </section>

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">
                            Danh sách phiên học
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {totalHistoryCount} phiên học đã lưu.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: "All", value: "all" },
                            { label: "Today", value: "today" },
                            { label: "Last 7 days", value: "last7days" },
                        ].map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                className={`h-10 rounded-2xl border px-4 text-sm font-bold shadow-sm transition ${
                                    selectedRange === item.value
                                        ? "border-pink-200 bg-pink-500 text-white"
                                        : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                                }`}
                                onClick={() => {
                                    setSelectedRange(item.value as StudyHistoryRange);
                                    setCurrentPage(1);
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {historyLoadError ? (
                    <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
                        {historyLoadError}
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-2xl border border-pink-50">
                    <div className="overflow-x-auto">
                        <div className="min-w-[980px]">
                            <div className="grid grid-cols-[190px_250px_100px_110px_100px_100px_120px] gap-x-4 bg-pink-50/80 px-4 py-3 text-sm font-bold text-slate-500">
                                <div>Time</div>
                                <div>Scope</div>
                                <div>Reviewed</div>
                                <div>Remember</div>
                                <div>Forgot</div>
                                <div>Accuracy</div>
                                <div>Action</div>
                            </div>

                            {isLoadingHistories ? (
                                <div className="border-t border-pink-50 p-4">
                                    <LoadingSkeleton variant="table" rows={5} />
                                </div>
                            ) : histories.length > 0 ? (
                                histories.map((history) => (
                                    <div
                                        key={history.id}
                                        className="grid grid-cols-[190px_250px_100px_110px_100px_100px_120px] gap-x-4 border-t border-pink-50 px-4 py-3 text-sm text-slate-600 transition hover:bg-pink-50/45"
                                    >
                                        <div className="font-bold text-slate-700">
                                            {formatStudyDate(history.createdAt)}
                                        </div>

                                        <div>
                                            <p className="font-bold text-slate-700">
                                                {getStudyScopeLabel(history)}
                                            </p>

                                            {history.onlyDifficult ? (
                                                <p className="mt-1 text-xs font-bold text-amber-500">
                                                    Only difficult
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="font-black text-slate-800">
                                            {history.reviewedCount}
                                        </div>

                                        <div className="font-black text-emerald-600">
                                            {history.rememberedCount}
                                        </div>

                                        <div className="font-black text-rose-500">
                                            {history.forgotCount}
                                        </div>

                                        <div className="font-black text-pink-500">
                                            {getAccuracyPercent(history)}%
                                        </div>

                                        <div>
                                            <button
                                                type="button"
                                                disabled={deletingHistoryId === history.id}
                                                className="flex h-8 min-w-16 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-3 text-xs font-bold text-rose-400 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                onClick={() => setHistoryPendingDelete(history)}
                                            >
                                                <Trash2 size={14} />
                                                {deletingHistoryId === history.id ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="border-t border-pink-50 p-6">
                                    <EmptyState
                                        icon={<History size={24} />}
                                        title={
                                            selectedRange === "all"
                                                ? "Chưa có lịch sử học"
                                                : "Không có phiên học trong bộ lọc"
                                        }
                                        description={
                                            selectedRange === "all"
                                                ? "Hãy học Flashcard rồi lưu phiên để theo dõi tiến độ."
                                                : "Thử chọn All để xem toàn bộ phiên học đã lưu."
                                        }
                                        actionLabel={selectedRange === "all" ? undefined : "Xem tất cả"}
                                        onAction={
                                            selectedRange === "all"
                                                ? undefined
                                                : () => {
                                                    setSelectedRange("all");
                                                    setCurrentPage(1);
                                                }
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {totalHistoryCount > 0 ? (
                    <div className="mt-4 flex flex-col gap-3 border-t border-pink-50 pt-4 xl:flex-row xl:items-center xl:justify-between">
                        <p className="text-sm font-bold text-slate-500">
                            Trang {safeCurrentPage} / {totalPages} • Hiển thị{" "}
                            {histories.length} / {totalHistoryCount} phiên
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={safeCurrentPage <= 1}
                                className="h-10 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            >
                                Prev
                            </button>

                            {visiblePageNumbers.map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    className={`h-10 min-w-10 rounded-2xl border px-3 text-sm font-bold shadow-sm transition ${pageNumber === safeCurrentPage
                                            ? "border-pink-200 bg-pink-500 text-white"
                                            : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                                        }`}
                                    onClick={() => setCurrentPage(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            ))}

                            <button
                                type="button"
                                disabled={safeCurrentPage >= totalPages}
                                className="h-10 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                                onClick={() =>
                                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                                }
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : null}
            </section>
        </div>

        <ConfirmDialog
            isOpen={historyPendingDelete !== null}
            title="Xóa phiên học?"
            description={
                historyPendingDelete
                    ? `Xóa phiên học ngày ${formatStudyDate(historyPendingDelete.createdAt)}? Hành động này không thể hoàn tác.`
                    : ""
            }
            confirmText="Xóa phiên học"
            cancelText="Giữ lại"
            isConfirming={deletingHistoryId !== null}
            onClose={() => {
                if (!deletingHistoryId) {
                    setHistoryPendingDelete(null);
                }
            }}
            onConfirm={() => void handleConfirmDeleteStudyHistory()}
        />
        </>
    );
}
