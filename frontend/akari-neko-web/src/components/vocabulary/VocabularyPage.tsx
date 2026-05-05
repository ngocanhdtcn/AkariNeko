"use client";

import {
  BookOpen,
  ChevronDown,
  Download,
  FilePlus2,
  FolderUp,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SoftPanel } from "../ui/SoftPanel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeVocabularyTextFields } from "@/lib/vocabularyTextNormalizer";
import { AppSelect } from "@/components/ui/AppSelect";
import { AppMultiSelect } from "@/components/ui/AppMultiSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EditVocabularyModal } from "@/components/vocabulary/EditVocabularyModal";
import { AddVocabularyModal } from "@/components/vocabulary/AddVocabularyModal";
import { ImportVocabularyModal } from "./ImportVocabularyModal";
import {
  hasActiveStudyFilters,
  readPersistedStudyFilters,
  writePersistedStudyFilters,
} from "@/hooks/useStudyFilterPersistence";
import {
  createVocabulary,
  deleteVocabulary,
  DuplicateVocabularyError,
  getVocabularies,
  getVocabularyFilterOptions,
  updateVocabulary,
  updateVocabularyDifficulty,
  type CreateVocabularyInput,
  type VocabularyListItem,
} from "@/services/vocabularyService";

function ImportButton({
  onSelectSource,
}: {
  onSelectSource: (sourceType: "file" | "folder") => void;
}) {
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        importMenuRef.current &&
        !importMenuRef.current.contains(event.target as Node)
      ) {
        setIsImportMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsImportMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSelectSource(sourceType: "file" | "folder") {
    onSelectSource(sourceType);
    setIsImportMenuOpen(false);
  }

  return (
    <div ref={importMenuRef} className="relative z-[80]">
      <button
        type="button"
        className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105"
        onClick={() => setIsImportMenuOpen((current) => !current)}
      >
        <Upload size={18} />
        Import
        <ChevronDown
          size={16}
          className={`transition-transform ${isImportMenuOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isImportMenuOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[90] w-64 rounded-3xl border border-pink-100 bg-white p-2 shadow-[0_18px_50px_rgba(236,72,153,0.18)]">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-pink-50 hover:text-pink-500"
            onClick={() => handleSelectSource("file")}
          >
            <FilePlus2 size={18} />
            Import file HTML
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-pink-50 hover:text-pink-500"
            onClick={() => handleSelectSource("folder")}
          >
            <FolderUp size={18} />
            Import folder HTML
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function VocabularyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile, isLoadingProfile } = useAuth();
  const [persistedFilters] = useState(() =>
    readPersistedStudyFilters("vocabulary"),
  );
  const hasPersistedFilters = hasActiveStudyFilters(persistedFilters);
  const hasPersistedLevelFilter = Boolean(
    persistedFilters && persistedFilters.level !== "All",
  );
  const [hasInitialUrlFilters] = useState(() =>
    Boolean(
      searchParams.get("level") ||
      searchParams.get("book") ||
      searchParams.get("chapters") ||
      searchParams.get("chapter") ||
      searchParams.get("search") ||
      searchParams.get("difficult") ||
      searchParams.get("page"),
    ),
  );
  const [hasInitialUrlLevelFilter] = useState(() =>
    Boolean(searchParams.get("level")),
  );
  const didApplyProfileLevelRef = useRef(false);
  const didHandleInitialUrlSyncRef = useRef(false);
  const isSyncingUrlRef = useRef(false);
  const [deletingVocabularyId, setDeletingVocabularyId] = useState<string | null>(
    null,
  );
  const [vocabularyPendingDelete, setVocabularyPendingDelete] =
    useState<VocabularyListItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSourceType, setImportSourceType] = useState<"file" | "folder">(
    "file",
  );

  const [updatingDifficultyId, setUpdatingDifficultyId] = useState<string | null>(
    null,
  );

  function openImportModal(sourceType: "file" | "folder") {
    setImportSourceType(sourceType);
    setIsImportModalOpen(true);
  }

  function closeImportModal() {
    setIsImportModalOpen(false);
  }

  const VOCABULARY_PAGE_SIZE = 15;
  const [vocabularies, setVocabularies] = useState<VocabularyListItem[]>([]);
  const [totalVocabularyCount, setTotalVocabularyCount] = useState(0);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState(
    searchParams.get("search") ??
    (hasPersistedFilters ? persistedFilters?.searchKeyword : undefined) ??
    "",
  );
  const [selectedLevel, setSelectedLevel] = useState(
    searchParams.get("level") ??
    (hasPersistedFilters ? persistedFilters?.level : undefined) ??
    "All",
  );
  const [selectedBook, setSelectedBook] = useState(
    searchParams.get("book") ??
    (hasPersistedFilters ? persistedFilters?.book : undefined) ??
    "All",
  );
  const [selectedChapters, setSelectedChapters] = useState(() => {
    const chaptersParam = searchParams.get("chapters");
    const legacyChapterParam = searchParams.get("chapter");

    if (chaptersParam) {
      return chaptersParam.split(",").map(decodeURIComponent).filter(Boolean);
    }

    return legacyChapterParam && legacyChapterParam !== "All"
      ? [legacyChapterParam]
      : hasPersistedFilters
        ? persistedFilters?.chapters ?? []
        : [];
  });
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);
  const [isLoadingVocabularies, setIsLoadingVocabularies] = useState(false);
  const [vocabularyLoadError, setVocabularyLoadError] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = Number(searchParams.get("page") ?? "1");
    return Number.isFinite(pageParam) && pageParam > 0
      ? pageParam
      : hasPersistedFilters
        ? persistedFilters?.page ?? 1
        : 1;
  });
  const [onlyDifficult, setOnlyDifficult] = useState(
    searchParams.get("difficult") === "1" ||
    (!searchParams.has("difficult") &&
      hasPersistedFilters &&
      Boolean(persistedFilters?.onlyDifficult)),
  );
  const filterOptionsRequestIdRef = useRef(0);
  const profileLevelFilter = profile?.currentJlptLevel?.toUpperCase();
  const shouldApplyProfileLevel =
    !hasInitialUrlLevelFilter &&
    !hasPersistedLevelFilter &&
    selectedLevel === "All" &&
    Boolean(profileLevelFilter);
  const areStudyFiltersReady =
    hasInitialUrlLevelFilter ||
    hasPersistedLevelFilter ||
    (!isLoadingProfile && !shouldApplyProfileLevel);

  const updateVocabularyUrl = useCallback(
    ({
      level = selectedLevel,
      book = selectedBook,
      chapters = selectedChapters,
      search = searchKeyword,
      difficult = onlyDifficult,
      page = currentPage,
    }: {
      level?: string;
      book?: string;
      chapters?: string[];
      search?: string;
      difficult?: boolean;
      page?: number;
    }) => {
      const nextParams = new URLSearchParams();

      if (level !== "All") {
        nextParams.set("level", level);
      }

      if (book !== "All") {
        nextParams.set("book", book);
      }

      if (chapters.length > 0) {
        nextParams.set("chapters", chapters.map(encodeURIComponent).join(","));
      }

      if (search.trim()) {
        nextParams.set("search", search.trim());
      }

      if (difficult) {
        nextParams.set("difficult", "1");
      }

      if (page > 1) {
        nextParams.set("page", String(page));
      }

      const queryString = nextParams.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

      isSyncingUrlRef.current = true;
      router.replace(nextUrl, { scroll: false });
    },
    [
      currentPage,
      onlyDifficult,
      pathname,
      router,
      searchKeyword,
      selectedBook,
      selectedChapters,
      selectedLevel,
    ],
  );

  const filteredVocabularies = vocabularies;
  const displayVocabularies = vocabularies;
  const isInitialVocabularyLoading =
    isLoadingVocabularies && displayVocabularies.length === 0;
  const shouldShowVocabularyLoadingOverlay =
    isLoadingVocabularies && displayVocabularies.length > 0;

  const totalPages = Math.max(
    1,
    Math.ceil(totalVocabularyCount / VOCABULARY_PAGE_SIZE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const visiblePageNumbers = getVisiblePageNumbers(safeCurrentPage, totalPages);

  useEffect(() => {
    if (isSyncingUrlRef.current) {
      isSyncingUrlRef.current = false;
      return;
    }

    const hasCurrentUrlFilters = Boolean(
      searchParams.get("level") ||
      searchParams.get("book") ||
      searchParams.get("chapters") ||
      searchParams.get("chapter") ||
      searchParams.get("search") ||
      searchParams.get("difficult") ||
      searchParams.get("page"),
    );

    if (!hasCurrentUrlFilters) {
      didHandleInitialUrlSyncRef.current = true;
      return;
    }

    if (
      !didHandleInitialUrlSyncRef.current &&
      !hasInitialUrlFilters &&
      hasPersistedFilters
    ) {
      didHandleInitialUrlSyncRef.current = true;
      return;
    }

    didHandleInitialUrlSyncRef.current = true;

    const pageParam = Number(searchParams.get("page") ?? "1");
    const nextPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    setSelectedLevel(searchParams.get("level") ?? "All");
    setSelectedBook(searchParams.get("book") ?? "All");
    const chaptersParam = searchParams.get("chapters");
    const legacyChapterParam = searchParams.get("chapter");

    setSelectedChapters(
      chaptersParam
        ? chaptersParam.split(",").map(decodeURIComponent).filter(Boolean)
        : legacyChapterParam && legacyChapterParam !== "All"
          ? [legacyChapterParam]
          : [],
    );
    setSearchKeyword(searchParams.get("search") ?? "");
    setOnlyDifficult(searchParams.get("difficult") === "1");
    setCurrentPage(nextPage);
  }, [hasInitialUrlFilters, hasPersistedFilters, searchParams]);

  useEffect(() => {
    if (!areStudyFiltersReady) {
      return;
    }

    writePersistedStudyFilters("vocabulary", {
      level: selectedLevel,
      book: selectedBook,
      chapters: selectedChapters,
      onlyDifficult,
      searchKeyword,
      page: currentPage,
    });
  }, [
    areStudyFiltersReady,
    currentPage,
    onlyDifficult,
    searchKeyword,
    selectedBook,
    selectedChapters,
    selectedLevel,
  ]);

  useEffect(() => {
    if (
      didApplyProfileLevelRef.current ||
      hasInitialUrlLevelFilter ||
      hasPersistedLevelFilter ||
      selectedLevel !== "All" ||
      !profileLevelFilter
    ) {
      return;
    }

    didApplyProfileLevelRef.current = true;
    setSelectedLevel(profileLevelFilter);
    setSelectedBook("All");
    setSelectedChapters([]);
    setCurrentPage(1);
    updateVocabularyUrl({
      level: profileLevelFilter,
      book: "All",
      chapters: [],
      page: 1,
    });
  }, [
    hasInitialUrlLevelFilter,
    hasPersistedLevelFilter,
    profileLevelFilter,
    selectedLevel,
    updateVocabularyUrl,
  ]);

  const loadVocabularies = useCallback(async (page: number) => {
    if (!areStudyFiltersReady) {
      return;
    }

    setIsLoadingVocabularies(true);
    setVocabularyLoadError(null);

    try {
      const result = await getVocabularies({
        page,
        pageSize: VOCABULARY_PAGE_SIZE,
        searchKeyword,
        level: selectedLevel,
        book: selectedBook,
        chapters: selectedChapters,
        onlyDifficult,
      });

      setVocabularies(result.items);
      setTotalVocabularyCount(result.totalCount);
    } catch (error) {
      console.error("Failed to load vocabularies:", error);
      setVocabularyLoadError("Không thể tải danh sách từ vựng.");
    } finally {
      setIsLoadingVocabularies(false);
    }
  }, [
    areStudyFiltersReady,
    searchKeyword,
    selectedLevel,
    selectedBook,
    selectedChapters,
    onlyDifficult,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVocabularies(currentPage);
  }, [
    loadVocabularies,
    currentPage,
    searchKeyword,
    selectedLevel,
    selectedBook,
    selectedChapters,
    onlyDifficult,
  ]);

  const levelOptions = ["All", ...availableLevels];

  const bookOptions = ["All", ...availableBooks];

  const chapterOptions = availableChapters;

  function handleLevelChange(level: string) {
    setSelectedLevel(level);
    setSelectedBook("All");
    setSelectedChapters([]);
    setAvailableChapters([]);
    setCurrentPage(1);
    updateVocabularyUrl({ level, book: "All", chapters: [], page: 1 });
  }

  function handleBookChange(book: string) {
    setSelectedBook(book);
    setSelectedChapters([]);
    setAvailableChapters([]);
    setCurrentPage(1);
    updateVocabularyUrl({ book, chapters: [], page: 1 });
  }

  function handleChapterChange(chapters: string[]) {
    setSelectedChapters(chapters);
    setCurrentPage(1);
    updateVocabularyUrl({ chapters, page: 1 });
  }

  function handleSearchKeywordChange(keyword: string) {
    setSearchKeyword(keyword);
    setCurrentPage(1);
    updateVocabularyUrl({ search: keyword, page: 1 });
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

  const loadVocabularyFilterOptions = useCallback(async (
    level = selectedLevel,
    book = selectedBook,
  ) => {
    const requestId = filterOptionsRequestIdRef.current + 1;
    filterOptionsRequestIdRef.current = requestId;
    setIsLoadingFilterOptions(true);

    try {
      const options = await getVocabularyFilterOptions({
        level,
        book,
      });

      if (filterOptionsRequestIdRef.current !== requestId) {
        return;
      }

      setAvailableLevels(options.levels);
      setAvailableBooks(options.books);
      setAvailableChapters(options.chapters);
      setSelectedBook((currentBook) =>
        currentBook === "All" || options.books.includes(currentBook)
          ? currentBook
          : "All",
      );
      setSelectedChapters((currentChapters) =>
      {
        const nextChapters = currentChapters.filter((chapter) =>
          options.chapters.includes(chapter),
        );

        return nextChapters.length === currentChapters.length &&
          nextChapters.every((chapter, index) => chapter === currentChapters[index])
          ? currentChapters
          : nextChapters;
      },
      );
    } catch (error) {
      console.error("Failed to load vocabulary filter options:", error);
    } finally {
      if (filterOptionsRequestIdRef.current === requestId) {
        setIsLoadingFilterOptions(false);
      }
    }
  }, [selectedLevel, selectedBook]);

  useEffect(() => {
    if (!areStudyFiltersReady) {
      return;
    }

    // Filter options are loaded from Supabase when the page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVocabularyFilterOptions(selectedLevel, selectedBook);
  }, [
    areStudyFiltersReady,
    selectedLevel,
    selectedBook,
    loadVocabularyFilterOptions,
  ]);

  async function handleConfirmDeleteVocabulary() {
    if (!vocabularyPendingDelete) {
      return;
    }

    setDeletingVocabularyId(vocabularyPendingDelete.id);

    try {
      await deleteVocabulary(vocabularyPendingDelete.id);
      setVocabularyPendingDelete(null);
      await loadVocabularies(currentPage);
    } catch (error) {
      console.error("Failed to delete vocabulary:", error);
      setVocabularyLoadError("Không thể xoá từ vựng. Vui lòng thử lại.");
    } finally {
      setDeletingVocabularyId(null);
    }
  }
  const [editingVocabulary, setEditingVocabulary] =
    useState<VocabularyListItem | null>(null);
  const isSavingVocabulary = false;
  const [editVocabularyError, setEditVocabularyError] = useState<string | null>(
    null,
  );

  function handleSaveVocabulary(vocabulary: VocabularyListItem) {
    const previousVocabulary = editingVocabulary;
    const normalizedVocabulary = normalizeVocabularyTextFields(vocabulary);

    setEditVocabularyError(null);
    setVocabularyLoadError(null);
    setVocabularies((currentVocabularies) =>
      currentVocabularies.map((currentVocabulary) =>
        currentVocabulary.id === normalizedVocabulary.id
          ? {
            ...currentVocabulary,
            book: normalizedVocabulary.book,
            level: normalizedVocabulary.level,
            chapter: normalizedVocabulary.chapter,
            kanji: normalizedVocabulary.kanji,
            hiragana: normalizedVocabulary.hiragana,
            meaning: normalizedVocabulary.meaning,
          }
          : currentVocabulary,
      ),
    );
    setEditingVocabulary(null);

    void updateVocabulary({
        id: normalizedVocabulary.id,
        book: normalizedVocabulary.book,
        level: normalizedVocabulary.level,
        chapter: normalizedVocabulary.chapter,
        kanji: normalizedVocabulary.kanji,
        hiragana: normalizedVocabulary.hiragana,
        meaning: normalizedVocabulary.meaning,
      })
      .then(() => {
        void loadVocabularyFilterOptions();
      })
      .catch((error) => {
        console.error("Failed to update vocabulary:", error);

        if (previousVocabulary) {
          setVocabularies((currentVocabularies) =>
            currentVocabularies.map((currentVocabulary) =>
              currentVocabulary.id === previousVocabulary.id
                ? previousVocabulary
                : currentVocabulary,
            ),
          );
        }

        setEditingVocabulary(normalizedVocabulary);
        setEditVocabularyError(
          error instanceof DuplicateVocabularyError
            ? "Từ vựng này đã tồn tại trong cùng Book / Level / Chapter."
            : "Không thể cập nhật từ vựng. Vui lòng thử lại.",
        );
        setVocabularyLoadError("Không thể cập nhật từ vựng. Vui lòng thử lại.");
      });
  }

  const [isAddVocabularyOpen, setIsAddVocabularyOpen] = useState(false);
  const [isCreatingVocabulary, setIsCreatingVocabulary] = useState(false);
  const [createVocabularyError, setCreateVocabularyError] = useState<string | null>(
    null,
  );

  async function handleCreateVocabulary(vocabulary: CreateVocabularyInput) {
    setIsCreatingVocabulary(true);
    setCreateVocabularyError(null);
    setVocabularyLoadError(null);

    try {
      await createVocabulary(vocabulary);

      setIsAddVocabularyOpen(false);
      setCurrentPage(1);

      void loadVocabularies(1);
      void loadVocabularyFilterOptions();
    } catch (error) {
      console.error("Failed to create vocabulary:", error);
      setCreateVocabularyError(
        error instanceof DuplicateVocabularyError
          ? "Từ vựng này đã tồn tại trong cùng Book / Level / Chapter."
          : "Không thể thêm từ vựng. Vui lòng thử lại.",
      );
    } finally {
      setIsCreatingVocabulary(false);
    }
  }

  async function handleToggleVocabularyDifficulty(vocabulary: VocabularyListItem) {
    setUpdatingDifficultyId(vocabulary.id);
    setVocabularyLoadError(null);
    const nextIsDifficult = !vocabulary.isDifficult;

    setVocabularies((currentVocabularies) =>
      currentVocabularies.map((currentVocabulary) =>
        currentVocabulary.id === vocabulary.id
          ? {
            ...currentVocabulary,
            isDifficult: nextIsDifficult,
          }
          : currentVocabulary,
      ),
    );

    try {
      await updateVocabularyDifficulty(vocabulary.id, nextIsDifficult);
    } catch (error) {
      console.error("Failed to update vocabulary difficulty:", error);
      setVocabularies((currentVocabularies) =>
        currentVocabularies.map((currentVocabulary) =>
          currentVocabulary.id === vocabulary.id
            ? {
              ...currentVocabulary,
              isDifficult: vocabulary.isDifficult,
            }
            : currentVocabulary,
        ),
      );
      setVocabularyLoadError("Không thể cập nhật trạng thái từ khó.");
    } finally {
      setUpdatingDifficultyId(null);
    }
  }

  return (
    <>
      <div className="grid gap-4">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="akari-vocabulary-hero relative z-40 overflow-visible rounded-[30px] border border-pink-100/80 bg-[linear-gradient(105deg,#fff2f7_0%,#fff9fc_45%,#eee8ff_100%)] p-6 shadow-[0_18px_50px_rgba(236,72,153,0.10)]"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-pink-200/35 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
                <BookOpen size={24} strokeWidth={2.4} />
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-pink-500">
                Vocabulary Management
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-800">
                Quản lý từ vựng tiếng Nhật
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Lọc từ vựng theo JLPT, sách, chapter và chuẩn bị import hàng
                loạt từ file HTML hoặc folder HTML.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="flex h-12 items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                onClick={() => {
                  setCreateVocabularyError(null);
                  setIsAddVocabularyOpen(true);
                }}
              >
                <Plus size={18} />
                Thêm từ vựng
              </button>

              <ImportButton onSelectSource={openImportModal} />

              <button
                type="button"
                className="flex h-12 items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </div>
        </motion.section>

        <SoftPanel className="relative z-30 p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[auto_auto_auto_1fr_auto] xl:items-end">
            <AppSelect
              label="JLPT Level"
              items={levelOptions}
              value={selectedLevel}
              onChange={handleLevelChange}
            />

            <AppSelect
              label="Book"
              items={bookOptions}
              value={selectedBook}
              onChange={handleBookChange}
            />

            <AppMultiSelect
              label="Chapter"
              items={chapterOptions}
              values={selectedChapters}
              onChange={handleChapterChange}
              disabled={isLoadingFilterOptions}
              isLoading={isLoadingFilterOptions}
            />

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Search
              </span>

              <div className="flex h-12 items-center rounded-2xl border border-pink-100 bg-white px-4 shadow-sm">
                <Search size={18} className="mr-3 text-slate-400" />

                <input
                  value={searchKeyword}
                  className="w-full bg-transparent text-sm font-medium text-slate-600 outline-none placeholder:text-slate-400"
                  placeholder="Tìm Kanji, Hiragana hoặc nghĩa tiếng Việt..."
                  onChange={(event) =>
                    handleSearchKeywordChange(event.target.value)
                  }
                />
              </div>
            </label>

            <button
              type="button"
              className={`h-12 w-full rounded-2xl border px-4 text-sm font-bold shadow-sm transition xl:w-auto ${onlyDifficult
                ? "border-amber-200 bg-amber-50 text-amber-500"
                : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                }`}
              onClick={() => {
                const nextOnlyDifficult = !onlyDifficult;
                setOnlyDifficult(nextOnlyDifficult);
                setCurrentPage(1);
                updateVocabularyUrl({ difficult: nextOnlyDifficult, page: 1 });
              }}
            >
              {onlyDifficult ? "Only difficult: ON" : "Only difficult"}
            </button>
          </div>

          {searchKeyword ||
            selectedLevel !== "All" ||
            selectedBook !== "All" ||
            selectedChapters.length > 0 ||
            onlyDifficult ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-2xl border border-pink-100 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                onClick={() => {
                  setSearchKeyword("");
                  setSelectedLevel("All");
                  setSelectedBook("All");
                  setSelectedChapters([]);
                  setCurrentPage(1);
                  setOnlyDifficult(false);
                  updateVocabularyUrl({
                    level: "All",
                    book: "All",
                    chapters: [],
                    search: "",
                    difficult: false,
                    page: 1,
                  });
                }}
              >
                Clear filter
              </button>
            </div>
          ) : null}
        </SoftPanel>

        <SoftPanel className="relative z-10 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-black text-slate-800">
                Danh sách từ vựng
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Dữ liệu được đọc trực tiếp từ Supabase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="h-10 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                onClick={() => void loadVocabularies(currentPage)}
              >
                Refresh
              </button>

              <span className="rounded-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-500">
                {isLoadingVocabularies
                  ? "Đang tải..."
                  : `${totalVocabularyCount} từ`}
              </span>
            </div>
          </div>

          {vocabularyLoadError ? (
            <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              {vocabularyLoadError}
            </div>
          ) : null}

          <div className="relative grid min-h-[420px] gap-3 md:hidden">
            {isInitialVocabularyLoading ? (
              <div className="rounded-2xl border border-pink-50 bg-white p-5 text-center text-sm font-bold text-slate-400 shadow-sm">
                Đang tải danh sách từ vựng...
              </div>
            ) : displayVocabularies.length > 0 ? (
              displayVocabularies.map((vocabulary) => (
                <div
                  key={`${vocabulary.id}-vocab-mobile`}
                  className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm"
                >
                  <div className="grid gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 break-words text-xl font-black text-slate-800">
                          {vocabulary.kanji}
                        </p>
                        <span className="rounded-xl bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-500">
                          {vocabulary.level}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {vocabulary.hiragana}
                      </p>

                      <p className="mt-2 break-words text-sm text-slate-500">
                        {vocabulary.meaning}
                      </p>

                      <p className="mt-2 break-words text-xs font-bold text-slate-400">
                        {vocabulary.book} ・ {vocabulary.chapter}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={updatingDifficultyId === vocabulary.id}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${vocabulary.isDifficult
                          ? "border-amber-100 bg-amber-50 text-amber-500"
                          : "border-pink-100 bg-white text-slate-500"
                          }`}
                        onClick={() => void handleToggleVocabularyDifficulty(vocabulary)}
                      >
                        {updatingDifficultyId === vocabulary.id
                          ? "..."
                          : vocabulary.isDifficult
                            ? "Bỏ từ khó"
                            : "Đánh dấu từ khó"}
                      </button>

                      <button
                        type="button"
                        className="flex h-8 min-w-14 items-center justify-center rounded-xl border border-pink-100 bg-white px-3 text-xs font-bold text-pink-400 shadow-sm transition hover:bg-pink-50"
                        onClick={() => {
                          setEditVocabularyError(null);
                          setEditingVocabulary(vocabulary);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={deletingVocabularyId === vocabulary.id}
                        className="flex h-8 min-w-16 items-center justify-center rounded-xl border border-rose-100 bg-white px-3 text-xs font-bold text-rose-400 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setVocabularyPendingDelete(vocabulary)}
                      >
                        {deletingVocabularyId === vocabulary.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-pink-50 bg-white p-5 text-center text-sm font-medium text-slate-400 shadow-sm">
                Chưa có từ vựng nào. Hãy import file HTML trước.
              </div>
            )}

            {shouldShowVocabularyLoadingOverlay ? (
              <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-[2px]">
                <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-bold text-pink-500 shadow-sm">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
                  Đang tải dữ liệu...
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative hidden min-h-[680px] overflow-x-auto rounded-[22px] border border-pink-50 md:block">
            <div className="min-w-[940px]">
            <div className="grid grid-cols-[1fr_1fr_1.5fr_0.6fr_0.65fr_0.65fr_1.8fr] bg-gradient-to-r from-pink-50/80 to-white px-4 py-3 text-sm font-bold text-slate-500">
              <div>Kanji</div>
              <div>Hiragana</div>
              <div>Meaning</div>
              <div>Level</div>
              <div>Correct</div>
              <div>Wrong</div>
              <div>Action</div>
            </div>

            {isInitialVocabularyLoading ? (
              <div className="grid min-h-[620px] place-items-center border-t border-pink-50 px-4 py-8 text-center text-sm font-bold text-slate-400">
                Đang tải danh sách từ vựng...
              </div>
            ) : displayVocabularies.length > 0 ? (
              displayVocabularies.map((vocabulary) => (
                <div
                  key={`${vocabulary.id}-vocab`}
                  className="grid grid-cols-[1fr_1fr_1.5fr_0.6fr_0.65fr_0.65fr_1.8fr] items-center border-t border-pink-50 px-4 py-3 text-sm text-slate-600 transition hover:bg-pink-50/45"
                >
                  <div className="flex items-center gap-2 text-base font-black text-slate-800">
                    <span>{vocabulary.kanji}</span>

                    {vocabulary.isDifficult ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-500">
                        Hard
                      </span>
                    ) : null}
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={updatingDifficultyId === vocabulary.id}
                      className={`flex h-8 min-w-20 items-center justify-center rounded-xl border px-3 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${vocabulary.isDifficult
                        ? "border-amber-100 bg-amber-50 text-amber-500 hover:bg-amber-100/70"
                        : "border-pink-100 bg-white text-slate-500 hover:bg-pink-50"
                        }`}
                      onClick={() => void handleToggleVocabularyDifficulty(vocabulary)}
                    >
                      {updatingDifficultyId === vocabulary.id
                        ? "..."
                        : vocabulary.isDifficult
                          ? "Difficult"
                          : "Mark"}
                    </button>

                    <button
                      type="button"
                      className="flex h-8 min-w-14 items-center justify-center rounded-xl border border-pink-100 bg-white px-3 text-xs font-bold text-pink-400 shadow-sm transition hover:bg-pink-50"
                      onClick={() => {
                        setEditVocabularyError(null);
                        setEditingVocabulary(vocabulary);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={deletingVocabularyId === vocabulary.id}
                      className="flex h-8 min-w-16 items-center justify-center rounded-xl border border-rose-100 bg-white px-3 text-xs font-bold text-rose-400 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setVocabularyPendingDelete(vocabulary)}
                    >
                      {deletingVocabularyId === vocabulary.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="border-t border-pink-50 px-4 py-8 text-center text-sm font-medium text-slate-400">
                Chưa có từ vựng nào. Hãy import file HTML trước.
              </div>
            )}
            </div>

            {shouldShowVocabularyLoadingOverlay ? (
              <div className="absolute inset-0 z-20 grid place-items-center bg-white/70 backdrop-blur-[2px]">
                <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-bold text-pink-500 shadow-sm">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
                  Đang tải dữ liệu...
                </div>
              </div>
            ) : null}
          </div>

          {filteredVocabularies.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-pink-50 pt-4 xl:flex-row xl:items-center xl:justify-between">
              <p className="text-sm font-bold text-slate-500">
                Trang {safeCurrentPage} / {totalPages} ・ Hiển thị{" "}
                {displayVocabularies.length} / {totalVocabularyCount} từ
              </p>

              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:hidden">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  className="h-10 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={() => {
                    const nextPage = Math.max(1, safeCurrentPage - 1);
                    setCurrentPage(nextPage);
                    updateVocabularyUrl({ page: nextPage });
                  }}
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
                  onClick={() => {
                    const nextPage = Math.min(totalPages, safeCurrentPage + 1);
                    setCurrentPage(nextPage);
                    updateVocabularyUrl({ page: nextPage });
                  }}
                >
                  Next
                </button>
              </div>

              <div className="-mx-1 hidden items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  className="h-10 shrink-0 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={() => {
                    const nextPage = Math.max(1, safeCurrentPage - 1);
                    setCurrentPage(nextPage);
                    updateVocabularyUrl({ page: nextPage });
                  }}
                >
                  Prev
                </button>

                {visiblePageNumbers[0] > 1 ? (
                  <>
                    <button
                      type="button"
                      className="h-10 min-w-10 shrink-0 rounded-2xl border border-pink-100 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                      onClick={() => {
                        setCurrentPage(1);
                        updateVocabularyUrl({ page: 1 });
                      }}
                    >
                      1
                    </button>

                    {visiblePageNumbers[0] > 2 ? (
                      <span className="shrink-0 px-1 text-sm font-bold text-slate-400">...</span>
                    ) : null}
                  </>
                ) : null}

                {visiblePageNumbers.map((pageNumber) => {
                  const isActivePage = pageNumber === safeCurrentPage;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`h-10 min-w-10 shrink-0 rounded-2xl border px-3 text-sm font-bold shadow-sm transition ${isActivePage
                        ? "border-pink-200 bg-pink-500 text-white"
                        : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                        }`}
                      onClick={() => {
                        setCurrentPage(pageNumber);
                        updateVocabularyUrl({ page: pageNumber });
                      }}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages ? (
                  <>
                    {visiblePageNumbers[visiblePageNumbers.length - 1] <
                      totalPages - 1 ? (
                      <span className="shrink-0 px-1 text-sm font-bold text-slate-400">...</span>
                    ) : null}

                    <button
                      type="button"
                      className="h-10 min-w-10 shrink-0 rounded-2xl border border-pink-100 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                      onClick={() => {
                        setCurrentPage(totalPages);
                        updateVocabularyUrl({ page: totalPages });
                      }}
                    >
                      {totalPages}
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  className="h-10 shrink-0 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={() => {
                    const nextPage = Math.min(totalPages, safeCurrentPage + 1);
                    setCurrentPage(nextPage);
                    updateVocabularyUrl({ page: nextPage });
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </SoftPanel>
      </div>
      <ImportVocabularyModal
        isOpen={isImportModalOpen}
        sourceType={importSourceType}
        onClose={closeImportModal}
        onImportCompleted={() => {
          setCurrentPage(1);
          void loadVocabularies(1);
          void loadVocabularyFilterOptions();
        }}
      />

      <EditVocabularyModal
        vocabulary={editingVocabulary}
        isSaving={isSavingVocabulary}
        errorMessage={editVocabularyError}
        onClose={() => {
          setEditVocabularyError(null);
          setEditingVocabulary(null);
        }}
        onSave={(vocabulary) => void handleSaveVocabulary(vocabulary)}
      />

      <AddVocabularyModal
        isOpen={isAddVocabularyOpen}
        isSaving={isCreatingVocabulary}
        errorMessage={createVocabularyError}
        onClose={() => {
          setCreateVocabularyError(null);
          setIsAddVocabularyOpen(false);
        }}
        onSave={(vocabulary) => void handleCreateVocabulary(vocabulary)}
      />

      <ConfirmDialog
        isOpen={vocabularyPendingDelete !== null}
        title="Xóa từ vựng?"
        description={
          vocabularyPendingDelete
            ? `Xóa từ "${vocabularyPendingDelete.kanji}" (${vocabularyPendingDelete.hiragana}) khỏi danh sách? Hành động này không thể hoàn tác.`
            : ""
        }
        confirmText="Xóa từ vựng"
        cancelText="Giữ lại"
        isConfirming={deletingVocabularyId !== null}
        onClose={() => {
          if (!deletingVocabularyId) {
            setVocabularyPendingDelete(null);
          }
        }}
        onConfirm={() => void handleConfirmDeleteVocabulary()}
      />
    </>
  );
}
