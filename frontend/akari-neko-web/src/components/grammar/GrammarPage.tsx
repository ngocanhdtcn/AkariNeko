"use client";

import {
  BookOpenText,
  Bookmark,
  FileUp,
  Plus,
  RotateCcw,
  ScrollText,
  Search,
} from "lucide-react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GrammarCard } from "@/components/grammar/GrammarCard";
import { GrammarForm } from "@/components/grammar/GrammarForm";
import { GrammarImportModal } from "@/components/grammar/GrammarImportModal";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { AppMultiSelect } from "@/components/ui/AppMultiSelect";
import { AppSelect } from "@/components/ui/AppSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SoftPanel } from "@/components/ui/SoftPanel";
import { useAuth } from "@/contexts/AuthContext";
import {
  addGrammarBookmark,
  createGrammarPoint,
  deleteGrammarPoint,
  getGrammarFilterLevels,
  getGrammarFilterNotes,
  getGrammarPoints,
  removeGrammarBookmark,
  updateGrammarPoint,
  type GrammarMutation,
  type GrammarPoint,
  type JlptLevel,
} from "@/services/grammarService";

const DEFAULT_GRAMMAR_COLUMN_COUNT = 3;
const GRAMMAR_CARD_MIN_WIDTH = 320;
const GRAMMAR_CARD_GRID_GAP = 16;
const MAX_GRAMMAR_ROWS_PER_PAGE = 4;
const GRAMMAR_CARD_GRID_CLASS =
  "grid w-full min-w-0 gap-4";
const allLevelLabel = "All";
const allNotesLabel = "All";
const recentSortLabel = "Mới nhất";
const notesSortLabel = "Theo bài";

function getGrammarGridStyle(columnCount: number): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  };
}

function GrammarCardSkeletonGrid({
  columnCount,
}: {
  columnCount: number;
}) {
  return (
    <div className={GRAMMAR_CARD_GRID_CLASS} style={getGrammarGridStyle(columnCount)}>
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          className="min-h-[244px] rounded-3xl border border-pink-100 bg-white/85 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="h-7 w-14 animate-pulse rounded-xl bg-pink-100/70" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-pink-100/70" />
          </div>
          <div className="mt-6 h-8 w-3/4 animate-pulse rounded-2xl bg-pink-100/70" />
          <div className="mt-4 h-5 w-11/12 animate-pulse rounded-2xl bg-pink-100/60" />
          <div className="mt-4 h-5 w-full animate-pulse rounded-2xl bg-pink-100/50" />
          <div className="mt-2 h-5 w-2/3 animate-pulse rounded-2xl bg-pink-100/50" />
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-pink-50 pt-4">
            <div className="h-4 w-24 animate-pulse rounded-full bg-pink-100/60" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-pink-100/60" />
          </div>
        </article>
      ))}
    </div>
  );
}

function getVisiblePageNumbers(currentPageNumber: number, totalPageCount: number) {
  const maxVisiblePages = 3;
  const halfVisiblePages = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(1, currentPageNumber - halfVisiblePages);
  const endPage = Math.min(totalPageCount, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  );
}

function getActionErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function getResponsiveGrammarColumnCount(width: number) {
  if (width < 768) {
    return 1;
  }

  if (width < 1280) {
    return 2;
  }

  return Math.max(
    DEFAULT_GRAMMAR_COLUMN_COUNT,
    Math.floor(
      (width + GRAMMAR_CARD_GRID_GAP) /
        (GRAMMAR_CARD_MIN_WIDTH + GRAMMAR_CARD_GRID_GAP),
    ),
  );
}

function getGridColumnCount(element: HTMLElement) {
  const elementWidth = element.getBoundingClientRect().width;

  if (elementWidth > 0) {
    return getResponsiveGrammarColumnCount(elementWidth);
  }

  const gridTemplateColumns = window.getComputedStyle(element).gridTemplateColumns;
  const columnCount = gridTemplateColumns
    .split(" ")
    .filter((column) => column.trim().length > 0).length;

  return Math.max(1, columnCount);
}

function compareNaturalText(left: string, right: string) {
  return left.localeCompare(right, "vi", {
    numeric: true,
    sensitivity: "base",
  });
}

function getAvailableNotesFromGrammarItems(grammarItems: GrammarPoint[]) {
  return Array.from(
    new Set(
      grammarItems
        .map((item) => getGrammarNoteFilterOption(item.notes))
        .filter(Boolean),
    ),
  ).sort(compareNaturalText);
}

function mergeNoteOptions(firstItems: string[], secondItems: string[]) {
  return Array.from(new Set([...firstItems, ...secondItems])).sort(compareNaturalText);
}

function areStringArraysEqual(firstItems: string[], secondItems: string[]) {
  return (
    firstItems.length === secondItems.length &&
    firstItems.every((item, index) => item === secondItems[index])
  );
}

function getGrammarNoteFilterOption(note: string | null | undefined) {
  const normalizedNote = note?.trim() ?? "";

  if (!normalizedNote) {
    return "";
  }

  const searchableNote = normalizedNote
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const asciiLessonMatch = searchableNote.match(/\bbai\s*\d+(?:\s*[+-]\s*\d+)?/i);

  if (asciiLessonMatch) {
    const lessonNumber = asciiLessonMatch[0]
      .replace(/^bai/i, "")
      .trim()
      .replace(/\s*([+-])\s*/g, "$1");

    return `Bài ${lessonNumber}`;
  }

  const lessonMatch = normalizedNote.match(/\b[Bb]ài\s*\d+(?:\s*[+-]\s*\d+)?/u);

  return lessonMatch ? lessonMatch[0].replace(/\s+/g, " ") : normalizedNote;
}

export function GrammarPage() {
  const { profile } = useAuth();
  const canManageGrammar = profile?.role === "admin";
  const lockedStudentLevel =
    profile && profile.role !== "admin"
      ? ((profile.currentJlptLevel?.toUpperCase() || "N5") as JlptLevel)
      : null;
  const [items, setItems] = useState<GrammarPoint[]>([]);
  const [availableLevels, setAvailableLevels] = useState<JlptLevel[]>([]);
  const [availableNotes, setAvailableNotes] = useState<string[]>([]);
  const [isLoadingFilterLevels, setIsLoadingFilterLevels] = useState(false);
  const [isLoadingFilterNotes, setIsLoadingFilterNotes] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(allLevelLabel);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState(recentSortLabel);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingGrammar, setEditingGrammar] = useState<GrammarPoint | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deletingGrammar, setDeletingGrammar] = useState<GrammarPoint | null>(null);
  const [savingGrammarId, setSavingGrammarId] = useState<string | "new" | null>(
    null,
  );
  const [busyGrammarId, setBusyGrammarId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [grammarColumnCount, setGrammarColumnCount] = useState(
    DEFAULT_GRAMMAR_COLUMN_COUNT,
  );
  const grammarLayoutRef = useRef<HTMLDivElement | null>(null);

  const selectedLevelFilter = useMemo(() => {
    if (lockedStudentLevel) {
      return lockedStudentLevel;
    }

    if (availableLevels.includes(selectedLevel as JlptLevel)) {
      return selectedLevel as JlptLevel;
    }

    return undefined;
  }, [availableLevels, lockedStudentLevel, selectedLevel]);

  const selectedNotesFilter = useMemo(
    () => selectedNotes.filter((note) => availableNotes.includes(note)),
    [availableNotes, selectedNotes],
  );

  const selectedSortMode = selectedSort === notesSortLabel ? "notes" : "recent";
  const grammarGridStyle = useMemo(
    () => getGrammarGridStyle(grammarColumnCount),
    [grammarColumnCount],
  );
  const grammarPageSize = grammarColumnCount * MAX_GRAMMAR_ROWS_PER_PAGE;

  const totalPages = Math.max(1, Math.ceil(items.length / grammarPageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visiblePageNumbers = getVisiblePageNumbers(safeCurrentPage, totalPages);
  const displayItems = items.slice(
    (safeCurrentPage - 1) * grammarPageSize,
    safeCurrentPage * grammarPageSize,
  );
  const shouldShowPagination = items.length > grammarPageSize;
  const isFiltered = Boolean(
    search.trim() ||
      selectedLevelFilter ||
      selectedNotesFilter.length > 0 ||
      selectedSortMode !== "recent" ||
      bookmarkedOnly,
  );

  const loadGrammarItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const nextItems = await getGrammarPoints({
        search,
        jlptLevel: selectedLevelFilter,
        notes: selectedNotesFilter,
        bookmarkedOnly,
        sortMode: selectedSortMode,
      });
      setItems(nextItems);
      setAvailableNotes((currentNotes) => {
        const nextNotes = mergeNoteOptions(
          currentNotes,
          getAvailableNotesFromGrammarItems(nextItems),
        );

        return areStringArraysEqual(currentNotes, nextNotes)
          ? currentNotes
          : nextNotes;
      });
    } catch (error) {
      console.error("Failed to load grammar items:", error);
      setLoadError("Không thể tải danh sách ngữ pháp. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [bookmarkedOnly, search, selectedLevelFilter, selectedNotesFilter, selectedSortMode]);

  const loadFilterLevels = useCallback(async () => {
    setIsLoadingFilterLevels(true);

    try {
      const nextLevels = await getGrammarFilterLevels();
      setAvailableLevels(nextLevels);
      setSelectedLevel((currentLevel) =>
        currentLevel === allLevelLabel ||
        nextLevels.includes(currentLevel as JlptLevel)
          ? currentLevel
          : allLevelLabel,
      );
    } catch (error) {
      console.error("Failed to load grammar filter levels:", error);
      setAvailableLevels([]);
      setSelectedLevel(allLevelLabel);
    } finally {
      setIsLoadingFilterLevels(false);
    }
  }, []);

  const loadFilterNotes = useCallback(async () => {
    setIsLoadingFilterNotes(true);

    try {
      const nextNotes = await getGrammarFilterNotes({
        jlptLevel: selectedLevelFilter,
      });
      setAvailableNotes((currentNotes) => {
        return areStringArraysEqual(currentNotes, nextNotes)
          ? currentNotes
          : nextNotes;
      });
      setSelectedNotes((currentNotes) =>
        nextNotes.length > 0
          ? currentNotes.filter((note) => nextNotes.includes(note))
          : currentNotes,
      );
    } catch (error) {
      console.error("Failed to load grammar filter notes:", error);
    } finally {
      setIsLoadingFilterNotes(false);
    }
  }, [selectedLevelFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGrammarItems();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadGrammarItems]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFilterLevels();
    void loadFilterNotes();
  }, [loadFilterLevels, loadFilterNotes]);

  useEffect(() => {
    const gridElement = grammarLayoutRef.current;

    if (!gridElement) {
      return;
    }

    const currentGridElement = gridElement;

    function updateColumnCount() {
      setGrammarColumnCount(getGridColumnCount(currentGridElement));
    }

    updateColumnCount();

    const resizeObserver = new ResizeObserver(updateColumnCount);
    resizeObserver.observe(currentGridElement);

    return () => resizeObserver.disconnect();
  }, []);

  function handleAdd() {
    if (!canManageGrammar) {
      return;
    }

    setEditingGrammar(null);
    setIsFormOpen(true);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleLevelChange(value: string) {
    setSelectedLevel(lockedStudentLevel ?? value);
    setCurrentPage(1);
  }

  function handleNotesChange(values: string[]) {
    setSelectedNotes(values);
    setCurrentPage(1);
  }

  function handleSortChange(value: string) {
    setSelectedSort(value);
    setCurrentPage(1);
  }

  function handleBookmarkFilterChange(nextBookmarkedOnly: boolean) {
    setBookmarkedOnly(nextBookmarkedOnly);
    setCurrentPage(1);
  }

  function handleClearFilters() {
    setSearch("");
    setSelectedLevel(lockedStudentLevel ?? allLevelLabel);
    setSelectedNotes([]);
    setSelectedSort(recentSortLabel);
    setBookmarkedOnly(false);
    setCurrentPage(1);
  }

  function goToPage(page: number) {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
  }

  async function handleSave(payload: GrammarMutation) {
    if (!canManageGrammar) {
      return;
    }

    setSavingGrammarId(editingGrammar?.id ?? "new");
    setActionError(null);
    setActionMessage(null);

    try {
      if (editingGrammar) {
        await updateGrammarPoint(editingGrammar.id, payload);
        setActionMessage("Đã cập nhật ngữ pháp.");
      } else {
        await createGrammarPoint(payload);
        setActionMessage("Đã thêm mẫu ngữ pháp.");
        setCurrentPage(1);
      }

      setIsFormOpen(false);
      setEditingGrammar(null);
      await loadFilterLevels();
      await loadFilterNotes();
      await loadGrammarItems();
    } catch (error) {
      console.error("Failed to save grammar:", error);
      setActionError("Không thể lưu ngữ pháp. Vui lòng thử lại.");
    } finally {
      setSavingGrammarId(null);
    }
  }

  async function handleToggleBookmark(grammar: GrammarPoint) {
    setBusyGrammarId(grammar.id);
    setActionError(null);
    setActionMessage(null);

    try {
      const updatedGrammar = grammar.isBookmarked
        ? await removeGrammarBookmark(grammar.id)
        : await addGrammarBookmark(grammar.id);

      setItems((current) =>
        current.map((item) => (item.id === grammar.id ? updatedGrammar : item)),
      );
      setActionMessage(
        updatedGrammar.isBookmarked
          ? "Đã lưu ngữ pháp."
          : "Đã bỏ lưu ngữ pháp.",
      );

      if (bookmarkedOnly && !updatedGrammar.isBookmarked) {
        await loadGrammarItems();
      }
    } catch (error) {
      console.error("Failed to update grammar bookmark:", error);
      setActionError(
        getActionErrorMessage(
          error,
          "Không thể cập nhật bookmark. Vui lòng thử lại.",
        ),
      );
    } finally {
      setBusyGrammarId(null);
    }
  }

  async function handleDelete() {
    if (!canManageGrammar || !deletingGrammar) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await deleteGrammarPoint(deletingGrammar.id);
      setActionMessage("Đã xóa mẫu ngữ pháp.");
      setDeletingGrammar(null);
      await loadFilterLevels();
      await loadFilterNotes();
      await loadGrammarItems();
    } catch (error) {
      console.error("Failed to delete grammar:", error);
      setActionError("Không thể xóa mẫu ngữ pháp. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      ref={grammarLayoutRef}
      className="grid w-full min-w-0 gap-4 pb-24 lg:pb-0"
    >
      <section className="akari-grammar-hero relative z-40 overflow-hidden rounded-3xl border border-pink-100 bg-[linear-gradient(105deg,#fff2f7_0%,#fff9fc_48%,#eee8ff_100%)] p-6 shadow-[0_18px_50px_rgba(236,72,153,0.10)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-pink-200/35 blur-3xl" />

        <div className="relative z-10 flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
              <ScrollText size={24} strokeWidth={2.4} />
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-pink-500">
              GRAMMAR LIBRARY
            </p>

            <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-800">
              Ngữ pháp tiếng Nhật
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Lưu lại và ôn tập các mẫu ngữ pháp theo JLPT, cấu trúc và ví dụ
              minh họa.
            </p>
          </div>

          <div className={`flex min-w-0 flex-wrap items-center gap-3 ${canManageGrammar ? "" : "hidden"}`}>
            <AppButton
              variant="secondary"
              icon={<FileUp size={18} />}
              className="min-h-11 w-full min-[420px]:w-auto"
              onClick={() => setIsImportOpen(true)}
            >
              Import CSV
            </AppButton>
            <AppButton
              icon={<Plus size={18} />}
              className="min-h-11 w-full min-[420px]:w-auto"
              onClick={handleAdd}
            >
              Thêm ngữ pháp
            </AppButton>
          </div>
        </div>
      </section>

      <SoftPanel className="relative z-30 p-4 sm:p-5">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[160px_180px_170px_220px_minmax(260px,1fr)] xl:items-end">
          <AppSelect
            label="JLPT LEVEL"
            items={lockedStudentLevel ? [lockedStudentLevel] : [allLevelLabel, ...availableLevels]}
            value={lockedStudentLevel ?? selectedLevel}
            onChange={handleLevelChange}
            isLoading={isLoadingFilterLevels}
            disabled={Boolean(lockedStudentLevel)}
          />

          <AppMultiSelect
            label="BÀI"
            items={availableNotes}
            values={selectedNotes}
            onChange={handleNotesChange}
            isLoading={isLoadingFilterNotes}
            enableRangeSelection
            showAllOption
            allLabel={allNotesLabel}
          />

          <AppSelect
            label="SORT"
            items={[recentSortLabel, notesSortLabel]}
            value={selectedSort}
            onChange={handleSortChange}
          />

          <label className="grid min-w-0 gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              BOOKMARK
            </span>
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={!bookmarkedOnly}
                className={`h-12 min-w-0 rounded-2xl border px-3 text-sm font-bold shadow-sm transition ${
                  !bookmarkedOnly
                    ? "border-pink-200 bg-pink-50 text-pink-500"
                    : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                }`}
                onClick={() => handleBookmarkFilterChange(false)}
              >
                All
              </button>
              <button
                type="button"
                aria-pressed={bookmarkedOnly}
                className={`flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold shadow-sm transition ${
                  bookmarkedOnly
                    ? "border-pink-200 bg-pink-50 text-pink-500"
                    : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                }`}
                onClick={() => handleBookmarkFilterChange(true)}
              >
                <Bookmark
                  size={16}
                  className="shrink-0"
                  fill={bookmarkedOnly ? "currentColor" : "none"}
                />
                <span className="min-w-0 truncate">Đã lưu</span>
              </button>
            </div>
          </label>

          <label className="grid min-w-0 gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              SEARCH
            </span>
            <AppInput
              icon={<Search size={17} />}
              value={search}
              placeholder="Tìm mẫu ngữ pháp..."
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </label>
        </div>

        {isFiltered ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="min-h-10 rounded-2xl border border-pink-100 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : null}
      </SoftPanel>

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

      {isLoading ? (
        <GrammarCardSkeletonGrid columnCount={grammarColumnCount} />
      ) : loadError ? (
        <EmptyState
          icon={<RotateCcw size={24} />}
          title="Không thể tải ngữ pháp"
          description={loadError}
          actionLabel="Thử lại"
          onAction={() => void loadGrammarItems()}
        />
      ) : items.length ? (
        <>
          <div className={GRAMMAR_CARD_GRID_CLASS} style={grammarGridStyle}>
            {displayItems.map((item) => (
              <GrammarCard
                key={item.id}
                grammar={item}
                isBusy={busyGrammarId === item.id}
                canManage={canManageGrammar}
                onBookmark={(grammar) => void handleToggleBookmark(grammar)}
                onEdit={(grammar) => {
                  if (canManageGrammar) {
                    setEditingGrammar(grammar);
                    setIsFormOpen(true);
                  }
                }}
                onDelete={(grammar) => {
                  if (canManageGrammar) {
                    setDeletingGrammar(grammar);
                  }
                }}
              />
            ))}
          </div>

          {shouldShowPagination ? (
            <SoftPanel className="p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <p className="text-sm font-bold text-slate-500">
                  Trang {safeCurrentPage} / {totalPages} ・ Hiển thị{" "}
                  {displayItems.length} / {items.length} mẫu ngữ pháp
                </p>

                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:hidden">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    className="h-10 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => goToPage(safeCurrentPage - 1)}
                  >
                    Prev
                  </button>

                  <div className="min-w-0 rounded-2xl border border-pink-100 bg-pink-50 px-3 py-2 text-center text-sm font-black text-pink-500">
                    {safeCurrentPage} / {totalPages}
                  </div>

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    className="h-10 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => goToPage(safeCurrentPage + 1)}
                  >
                    Next
                  </button>
                </div>

                <div className="-mx-1 hidden items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    className="h-10 shrink-0 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => goToPage(safeCurrentPage - 1)}
                  >
                    Prev
                  </button>

                  {visiblePageNumbers[0] > 1 ? (
                    <>
                      <button
                        type="button"
                        className="h-10 min-w-10 shrink-0 rounded-2xl border border-pink-100 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                        onClick={() => goToPage(1)}
                      >
                        1
                      </button>

                      {visiblePageNumbers[0] > 2 ? (
                        <span className="shrink-0 px-1 text-sm font-bold text-slate-400">
                          ...
                        </span>
                      ) : null}
                    </>
                  ) : null}

                  {visiblePageNumbers.map((pageNumber) => {
                    const isActivePage = pageNumber === safeCurrentPage;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`h-10 min-w-10 shrink-0 rounded-2xl border px-3 text-sm font-bold shadow-sm transition ${
                          isActivePage
                            ? "border-pink-200 bg-pink-500 text-white"
                            : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                        }`}
                        onClick={() => goToPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  {visiblePageNumbers[visiblePageNumbers.length - 1] <
                  totalPages ? (
                    <>
                      {visiblePageNumbers[visiblePageNumbers.length - 1] <
                      totalPages - 1 ? (
                        <span className="shrink-0 px-1 text-sm font-bold text-slate-400">
                          ...
                        </span>
                      ) : null}

                      <button
                        type="button"
                        className="h-10 min-w-10 shrink-0 rounded-2xl border border-pink-100 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                        onClick={() => goToPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  ) : null}

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    className="h-10 shrink-0 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => goToPage(safeCurrentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </SoftPanel>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={isFiltered ? <Search size={24} /> : <BookOpenText size={24} />}
          title={
            isFiltered
              ? "Không tìm thấy ngữ pháp"
              : "Chưa có mẫu ngữ pháp nào"
          }
          description={
            isFiltered
              ? "Thử đổi từ khóa hoặc bộ lọc JLPT nhé."
              : "Hãy thêm mẫu đầu tiên để bắt đầu xây dựng kho ngữ pháp nhé."
          }
          actionLabel={isFiltered || !canManageGrammar ? undefined : "Thêm ngữ pháp"}
          onAction={isFiltered || !canManageGrammar ? undefined : handleAdd}
        />
      )}

      <GrammarForm
        isOpen={canManageGrammar && isFormOpen}
        grammar={editingGrammar}
        isSaving={savingGrammarId !== null}
        onClose={() => {
          if (savingGrammarId === null) {
            setIsFormOpen(false);
            setEditingGrammar(null);
          }
        }}
        onSubmit={(payload) => void handleSave(payload)}
      />

      <GrammarImportModal
        isOpen={canManageGrammar && isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportCompleted={() => {
          setActionMessage("Đã import ngữ pháp thành công.");
          void loadFilterLevels();
          void loadFilterNotes();
          void loadGrammarItems();
        }}
      />

      <ConfirmDialog
        isOpen={canManageGrammar && Boolean(deletingGrammar)}
        title="Xóa mẫu ngữ pháp?"
        description={
          deletingGrammar
            ? `Mẫu "${deletingGrammar.title}" sẽ bị xóa khỏi danh sách học.`
            : ""
        }
        confirmText={isDeleting ? "Đang xóa..." : "Xóa"}
        cancelText="Hủy"
        isConfirming={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingGrammar(null);
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
