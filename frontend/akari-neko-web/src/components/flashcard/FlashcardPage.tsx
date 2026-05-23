"use client";

import { BookOpen, Eye, EyeOff, GraduationCap, RotateCcw, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppSelect } from "@/components/ui/AppSelect";
import { AppMultiSelect } from "@/components/ui/AppMultiSelect";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import {
    hasActiveStudyFilters,
    readPersistedStudyFilters,
    writePersistedStudyFilters,
} from "@/hooks/useStudyFilterPersistence";
import {
    createFlashcardStudySession,
    getFlashcardVocabularies,
    reviewFlashcard,
    type ReviewFlashcardResult,
} from "@/services/flashcardService";
import {
    getGrammarPoints,
    type GrammarPoint,
    type JlptLevel,
} from "@/services/grammarService";
import {
    getVocabularyFilterOptions,
    type VocabularyListItem,
} from "@/services/vocabularyService";

const FLASHCARD_LIMIT_OPTIONS = ["100 từ", "Tất cả theo filter"] as const;
type FlashcardLimitOption = (typeof FLASHCARD_LIMIT_OPTIONS)[number];

export function FlashcardPage() {
    const { profile, isLoadingProfile } = useAuth();
    const [studyMode, setStudyMode] = useState<"vocabulary" | "grammar">("vocabulary");
    const [persistedFilters] = useState(() =>
        readPersistedStudyFilters("flashcard"),
    );
    const hasPersistedFilters = hasActiveStudyFilters(persistedFilters);
    const didApplyProfileLevelRef = useRef(false);
    const [vocabularies, setVocabularies] = useState<VocabularyListItem[]>([]);
    const [grammarPoints, setGrammarPoints] = useState<GrammarPoint[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const flashcardsRequestIdRef = useRef(0);
    const grammarRequestIdRef = useRef(0);
    const filterOptionsRequestIdRef = useRef(0);
    const [isSavingSession, setIsSavingSession] = useState(false);
    const [isSessionSaved, setIsSessionSaved] = useState(false);
    const [sessionSavedMessage, setSessionSavedMessage] = useState<string | null>(
        null,
    );

    type FlashcardSessionStats = {
        reviewedCount: number;
        rememberedCount: number;
        forgotCount: number;
    };

    const [sessionStats, setSessionStats] = useState<FlashcardSessionStats>({
        reviewedCount: 0,
        rememberedCount: 0,
        forgotCount: 0,
    });

    const [selectedLevel, setSelectedLevel] = useState(
        hasPersistedFilters ? persistedFilters?.level ?? "All" : "All",
    );
    const [selectedBook, setSelectedBook] = useState(
        hasPersistedFilters ? persistedFilters?.book ?? "All" : "All",
    );
    const [selectedChapters, setSelectedChapters] = useState<string[]>(
        hasPersistedFilters ? persistedFilters?.chapters ?? [] : [],
    );
    const [onlyDifficult, setOnlyDifficult] = useState(
        hasPersistedFilters && Boolean(persistedFilters?.onlyDifficult),
    );
    const [flashcardLimitOption, setFlashcardLimitOption] =
        useState<FlashcardLimitOption>(
            persistedFilters?.flashcardLimitMode === "all"
                ? "Tất cả theo filter"
                : "100 từ",
        );
    const [showHiragana, setShowHiragana] = useState(true);

    const [availableLevels, setAvailableLevels] = useState<string[]>([]);
    const [availableBooks, setAvailableBooks] = useState<string[]>([]);
    const [availableChapters, setAvailableChapters] = useState<string[]>([]);
    const shouldApplyProfileLevel =
        !hasPersistedFilters &&
        selectedLevel === "All" &&
        Boolean(profile?.currentJlptLevel);
    const areStudyFiltersReady =
        hasPersistedFilters || (!isLoadingProfile && !shouldApplyProfileLevel);

    const currentVocabulary = vocabularies[currentIndex] ?? null;
    const currentGrammarPoint = grammarPoints[currentIndex] ?? null;
    const currentDeckCount =
        studyMode === "vocabulary" ? vocabularies.length : grammarPoints.length;

    const progressText = useMemo(() => {
        if (currentDeckCount === 0) {
            return "0 / 0";
        }

        return `${currentIndex + 1} / ${currentDeckCount}`;
    }, [currentDeckCount, currentIndex]);

    const loadFlashcards = useCallback(async () => {
        if (!areStudyFiltersReady || studyMode !== "vocabulary") {
            return;
        }

        const requestId = flashcardsRequestIdRef.current + 1;
        flashcardsRequestIdRef.current = requestId;
        setIsLoading(true);
        setLoadError(null);

        try {
            const data = await getFlashcardVocabularies({
                level: selectedLevel,
                book: selectedBook,
                chapters: selectedChapters,
                onlyDifficult,
                limitCount:
                    flashcardLimitOption === "Tất cả theo filter" ? null : 100,
            });

            if (flashcardsRequestIdRef.current !== requestId) {
                return;
            }

            setVocabularies(data);
            setCurrentIndex(0);
            setIsFlipped(false);

            setSessionStats({
                reviewedCount: 0,
                rememberedCount: 0,
                forgotCount: 0,
            });

            setSessionSavedMessage(null);
            setIsSessionSaved(false);
        } catch (error) {
            console.error("Failed to load flashcards:", error);
            const fallbackMessage = "Không thể tải flashcard.";
            setLoadError(fallbackMessage);
        } finally {
            if (flashcardsRequestIdRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, [
        areStudyFiltersReady,
        studyMode,
        selectedLevel,
        selectedBook,
        selectedChapters,
        onlyDifficult,
        flashcardLimitOption,
    ]);

    const loadGrammarFlashcards = useCallback(async () => {
        if (!areStudyFiltersReady) {
            return;
        }

        const isActiveGrammarMode = studyMode === "grammar";
        const requestId = grammarRequestIdRef.current + 1;
        grammarRequestIdRef.current = requestId;
        if (isActiveGrammarMode) {
            setIsLoading(true);
        }
        setLoadError(null);

        try {
            const data = await getGrammarPoints({
                jlptLevel:
                    selectedLevel === "All" ? undefined : (selectedLevel as JlptLevel),
            });

            if (grammarRequestIdRef.current !== requestId) {
                return;
            }

            setGrammarPoints(data);
            if (isActiveGrammarMode) {
                setCurrentIndex(0);
                setIsFlipped(false);
                setSessionStats({
                    reviewedCount: 0,
                    rememberedCount: 0,
                    forgotCount: 0,
                });
                setSessionSavedMessage(null);
                setIsSessionSaved(false);
            }
        } catch (error) {
            console.error("Failed to load grammar flashcards:", error);
            setLoadError("Không thể tải flashcard ngữ pháp.");
        } finally {
            if (isActiveGrammarMode && grammarRequestIdRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, [areStudyFiltersReady, selectedLevel, studyMode]);

    const handleNextCard = useCallback(() => {
        if (currentDeckCount === 0) {
            return;
        }

        setCurrentIndex((current) => (current + 1) % currentDeckCount);
        setIsFlipped(false);
    }, [currentDeckCount]);

    const handlePreviousCard = useCallback(() => {
        if (currentDeckCount === 0) {
            return;
        }

        setCurrentIndex((current) =>
            current === 0 ? currentDeckCount - 1 : current - 1,
        );
        setIsFlipped(false);
    }, [currentDeckCount]);

    function getFlashcardPriorityScore(vocabulary: VocabularyListItem) {
        const difficultScore = vocabulary.isDifficult ? 100 : 0;
        const wrongScore = vocabulary.wrongCount * 10;
        const correctPenalty = vocabulary.correctCount * 2;
        const randomScore = Math.random() * 5;

        return difficultScore + wrongScore - correctPenalty + randomScore;
    }

    function handleShuffle() {
        if (studyMode === "vocabulary") {
            setVocabularies((current) =>
                [...current].sort(
                    (firstVocabulary, secondVocabulary) =>
                        getFlashcardPriorityScore(secondVocabulary) -
                        getFlashcardPriorityScore(firstVocabulary),
                ),
            );
        } else {
            setGrammarPoints((current) => [...current].sort(() => Math.random() - 0.5));
        }

        setCurrentIndex(0);
        setIsFlipped(false);
        setIsSessionSaved(false);
        setSessionSavedMessage(null);
    }

    const loadFilterOptions = useCallback(async (
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
                    nextChapters.every(
                        (chapter, index) => chapter === currentChapters[index],
                    )
                    ? currentChapters
                    : nextChapters;
            },
            );
        } catch (error) {
            console.error("Failed to load flashcard filter options:", error);
            setLoadError("Không thể tải bộ lọc flashcard.");
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

        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadFilterOptions(selectedLevel, selectedBook);
    }, [areStudyFiltersReady, selectedLevel, selectedBook, loadFilterOptions]);

    useEffect(() => {
        if (!areStudyFiltersReady) {
            return;
        }

        writePersistedStudyFilters("flashcard", {
            level: selectedLevel,
            book: selectedBook,
            chapters: selectedChapters,
            onlyDifficult,
            flashcardLimitMode:
                flashcardLimitOption === "Tất cả theo filter" ? "all" : "limited",
        });
    }, [
        areStudyFiltersReady,
        flashcardLimitOption,
        onlyDifficult,
        selectedBook,
        selectedChapters,
        selectedLevel,
    ]);

    useEffect(() => {
        if (
            didApplyProfileLevelRef.current ||
            hasPersistedFilters ||
            selectedLevel !== "All" ||
            !profile?.currentJlptLevel
        ) {
            return;
        }

        didApplyProfileLevelRef.current = true;
        setSelectedLevel(profile.currentJlptLevel);
        setSelectedBook("All");
        setSelectedChapters([]);
    }, [hasPersistedFilters, profile?.currentJlptLevel, selectedLevel]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadFlashcards();
    }, [loadFlashcards]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadGrammarFlashcards();
    }, [loadGrammarFlashcards]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
                return;
            }

            const target = event.target as HTMLElement | null;
            const isTypingTarget =
                target?.tagName === "INPUT" ||
                target?.tagName === "SELECT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable;

            if (isTypingTarget) {
                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                handleNextCard();
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                handlePreviousCard();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleNextCard, handlePreviousCard]);

    const levelOptions = ["All", ...availableLevels];
    const bookOptions = ["All", ...availableBooks];
    const chapterOptions = availableChapters;

    function handleLevelChange(level: string) {
        setSelectedLevel(level);
        setSelectedBook("All");
        setSelectedChapters([]);
        setAvailableChapters([]);
    }

    function handleBookChange(book: string) {
        setSelectedBook(book);
        setSelectedChapters([]);
        setAvailableChapters([]);
    }

    function updateReviewedVocabularyLocally(
        vocabularyId: string,
        result: ReviewFlashcardResult,
    ) {
        setVocabularies((currentVocabularies) =>
            currentVocabularies.map((vocabulary) => {
                if (vocabulary.id !== vocabularyId) {
                    return vocabulary;
                }

                const nextCorrectCount =
                    result === "remember"
                        ? vocabulary.correctCount + 1
                        : vocabulary.correctCount;

                const nextWrongCount =
                    result === "forgot"
                        ? vocabulary.wrongCount + 1
                        : vocabulary.wrongCount;

                return {
                    ...vocabulary,
                    correctCount: nextCorrectCount,
                    wrongCount: nextWrongCount,
                    isDifficult:
                        result === "forgot" ||
                        vocabulary.isDifficult ||
                        nextWrongCount >= nextCorrectCount + 2,
                };
            }),
        );
    }

    function updateSessionStats(result: ReviewFlashcardResult) {
        setSessionStats((current) => ({
            reviewedCount: current.reviewedCount + 1,
            rememberedCount:
                result === "remember"
                    ? current.rememberedCount + 1
                    : current.rememberedCount,
            forgotCount:
                result === "forgot" ? current.forgotCount + 1 : current.forgotCount,
        }));
    }

    function handleReviewFlashcard(result: ReviewFlashcardResult) {
        if (isReviewing) {
            return;
        }

        if (studyMode === "grammar") {
            if (!currentGrammarPoint) {
                return;
            }

            setIsReviewing(true);
            setLoadError(null);
            setSessionSavedMessage(null);
            setIsSessionSaved(false);
            updateSessionStats(result);
            handleNextCard();
            setIsReviewing(false);
            return;
        }

        if (!currentVocabulary) {
            return;
        }

        const reviewedVocabulary = currentVocabulary;

        setIsReviewing(true);
        setLoadError(null);
        updateReviewedVocabularyLocally(reviewedVocabulary.id, result);
        setSessionSavedMessage(null);
        setIsSessionSaved(false);
        updateSessionStats(result);
        handleNextCard();
        setIsReviewing(false);

        void reviewFlashcard(reviewedVocabulary, result).catch((error) => {
            console.error("Failed to review flashcard:", error);
            const fallbackMessage = "Không thể lưu kết quả ôn tập.";
            setLoadError(fallbackMessage);
        });
    }

    function handleResetSession() {
        setSessionStats({
            reviewedCount: 0,
            rememberedCount: 0,
            forgotCount: 0,
        });

        setCurrentIndex(0);
        setIsFlipped(false);
    }

    const hasActiveFilter =
        selectedLevel !== "All" ||
        (studyMode === "vocabulary" &&
            (selectedBook !== "All" ||
                selectedChapters.length > 0 ||
                onlyDifficult));

    function handleClearFilters() {
        setSelectedLevel("All");
        setSelectedBook("All");
        setSelectedChapters([]);
        setOnlyDifficult(false);
    }

    function handleStudyModeChange(nextMode: "vocabulary" | "grammar") {
        setStudyMode(nextMode);
        setCurrentIndex(0);
        setIsFlipped(false);
        setSessionSavedMessage(null);
        setIsSessionSaved(false);
        setSessionStats({
            reviewedCount: 0,
            rememberedCount: 0,
            forgotCount: 0,
        });
    }

    async function handleSaveStudySession() {
        if (sessionStats.reviewedCount === 0 || isSavingSession || isSessionSaved) {
            return;
        }

        setIsSavingSession(true);
        setLoadError(null);

        try {
            await createFlashcardStudySession({
                reviewedCount: sessionStats.reviewedCount,
                rememberedCount: sessionStats.rememberedCount,
                forgotCount: sessionStats.forgotCount,
                level: selectedLevel,
                book: selectedBook,
                chapter:
                    selectedChapters.length > 0 ? selectedChapters.join(", ") : "All",
                onlyDifficult,
            });

            setSessionSavedMessage("Đã lưu phiên học. Hãy ôn thêm từ mới để bắt đầu phiên tiếp theo.");
            setIsSessionSaved(true);
            setSessionStats({
                reviewedCount: 0,
                rememberedCount: 0,
                forgotCount: 0,
            });
        } catch (error) {
            console.error("Failed to save flashcard study session:", error);
            const fallbackMessage = "Không thể lưu phiên học.";
            setLoadError(fallbackMessage);
        } finally {
            setIsSavingSession(false);
        }
    }

    return (
        <div className="grid gap-5">
            <PageHeader
                eyebrow="Flashcard"
                title="Ôn tập bằng flashcard"
                description="Luyện ghi nhớ từ vựng và ngữ pháp trong cùng một không gian học tập."
                icon={<BookOpen size={21} />}
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <AppButton
                            icon={<RotateCcw size={16} />}
                            onClick={() =>
                                studyMode === "vocabulary"
                                    ? void loadFlashcards()
                                    : void loadGrammarFlashcards()
                            }
                        >
                            Tải lại
                        </AppButton>
                        <AppButton
                            variant="primary"
                            icon={<Shuffle size={16} />}
                            disabled={currentDeckCount === 0}
                            onClick={handleShuffle}
                        >
                            Smart shuffle
                        </AppButton>
                    </div>
                }
            />

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.7fr] lg:items-stretch">
                    <button
                        type="button"
                        className={`group flex min-h-20 items-center justify-between gap-4 rounded-[22px] border px-5 py-4 text-left shadow-sm transition ${
                            studyMode === "vocabulary"
                                ? "border-violet-200 bg-gradient-to-br from-violet-50 to-white ring-2 ring-violet-100"
                                : "border-pink-100 bg-white hover:border-violet-200 hover:bg-violet-50/50"
                        }`}
                        onClick={() => handleStudyModeChange("vocabulary")}
                    >
                        <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
                                <BookOpen size={27} />
                            </span>
                            <div className="min-w-0">
                                <p className="font-sans text-xl font-black leading-none text-slate-900">
                                    単語
                                </p>
                                <p className="mt-1 text-base font-black text-slate-800">
                                    Từ vựng
                                </p>
                            </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                            {vocabularies.length} thẻ
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`group flex min-h-20 items-center justify-between gap-4 rounded-[22px] border px-5 py-4 text-left shadow-sm transition ${
                            studyMode === "grammar"
                                ? "border-pink-400 bg-gradient-to-br from-pink-50 to-white ring-2 ring-pink-100"
                                : "border-pink-100 bg-white hover:border-pink-300 hover:bg-pink-50/50"
                        }`}
                        onClick={() => handleStudyModeChange("grammar")}
                    >
                        <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                                <GraduationCap size={28} />
                            </span>
                            <div className="min-w-0">
                                <p className="font-sans text-xl font-black leading-none text-slate-900">
                                    文法
                                </p>
                                <p className="mt-1 text-base font-black text-slate-800">
                                    Ngữ pháp
                                </p>
                            </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                            {grammarPoints.length} thẻ
                        </span>
                    </button>

                    <div className="flex min-h-20 flex-col justify-center rounded-[22px] border border-pink-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-500">
                                Hôm nay cần ôn:
                            </p>
                            <p className="mt-2 text-sm font-black text-slate-500">
                                <span className="text-violet-500">{vocabularies.length}</span>{" "}
                                từ vựng
                                <span className="mx-2 text-pink-300">•</span>
                                <span className="text-pink-500">{grammarPoints.length}</span>{" "}
                                ngữ pháp
                            </p>
                        </div>
                        <AppButton
                            variant="primary"
                            className="mt-3 sm:mt-0"
                            icon={<Shuffle size={16} />}
                            disabled={currentDeckCount === 0}
                            onClick={handleShuffle}
                        >
                            Ôn tất cả
                        </AppButton>
                    </div>
                </div>
            </section>

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className={`grid gap-4 xl:items-end ${
                    studyMode === "vocabulary"
                        ? "xl:grid-cols-[auto_auto_auto_auto_1fr_auto]"
                        : "xl:grid-cols-[auto_1fr_auto]"
                }`}>
                    <AppSelect
                        label="JLPT Level"
                        items={levelOptions}
                        value={selectedLevel}
                        onChange={handleLevelChange}
                    />

                    {studyMode === "vocabulary" ? (
                        <>
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
                                onChange={setSelectedChapters}
                                disabled={isLoadingFilterOptions}
                                isLoading={isLoadingFilterOptions}
                            />

                            <AppSelect
                                label="Số lượng"
                                items={[...FLASHCARD_LIMIT_OPTIONS]}
                                value={flashcardLimitOption}
                                onChange={(value) =>
                                    setFlashcardLimitOption(value as FlashcardLimitOption)
                                }
                            />
                        </>
                    ) : null}

                    <div className="rounded-2xl bg-pink-50 px-4 py-3 text-sm font-bold text-pink-500">
                        {isLoading ? "Đang tải..." : `${currentDeckCount} flashcard`}
                    </div>

                    {studyMode === "vocabulary" ? (
                        <button
                            type="button"
                            className={`h-12 rounded-2xl border px-4 text-sm font-bold shadow-sm transition ${onlyDifficult
                                ? "border-amber-200 bg-amber-50 text-amber-500"
                                : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                                }`}
                            onClick={() => setOnlyDifficult((current) => !current)}
                        >
                            {onlyDifficult ? "Only difficult: ON" : "Only difficult"}
                        </button>
                    ) : null}

                </div>

                {hasActiveFilter ? (
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            className="rounded-2xl border border-pink-100 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                            onClick={handleClearFilters}
                        >
                            Clear filter
                        </button>
                    </div>
                ) : null}
            </section>

            {loadError ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
                    {loadError}
                </div>
            ) : null}

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-6 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                {isLoading ? (
                    <LoadingSkeleton variant="card" className="min-h-[360px]" />
                ) : studyMode === "vocabulary" && currentVocabulary ? (
                    <div className="grid gap-5">
                        <div className="grid gap-3">
                            <div className="flex min-w-0 items-center justify-between gap-3">
                                <span className="shrink-0 rounded-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-500">
                                    {progressText}
                                </span>

                                <div className="ml-auto flex min-w-0 items-center justify-end gap-2 text-right text-sm font-bold text-slate-500">
                                    <span className="shrink-0">{currentVocabulary.level}</span>
                                    <span className="shrink-0">・</span>
                                    <span className="truncate">{currentVocabulary.book}</span>
                                    <span className="shrink-0">・</span>
                                    <span className="truncate">{currentVocabulary.chapter}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                                    Correct {currentVocabulary.correctCount}
                                </span>

                                <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-500">
                                    Wrong {currentVocabulary.wrongCount}
                                </span>

                                {currentVocabulary.isDifficult ? (
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-500">
                                        Hard
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                className={`absolute right-4 top-4 z-10 inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-sm transition sm:right-6 sm:top-6 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm ${showHiragana
                                    ? "border-pink-200 bg-pink-50 text-pink-500"
                                    : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                                    }`}
                                onClick={() => setShowHiragana((current) => !current)}
                            >
                                {showHiragana ? <Eye size={15} /> : <EyeOff size={15} />}
                                Hiragana
                            </button>

                            <button
                                type="button"
                                className="min-h-[360px] w-full rounded-[30px] border border-pink-100 bg-gradient-to-br from-white via-pink-50/60 to-violet-50 p-8 text-center shadow-inner transition lg:hover:scale-[1.005]"
                                onClick={() => setIsFlipped((current) => !current)}
                            >
                                {!isFlipped ? (
                                    <div className="grid h-full place-items-center gap-4">
                                        <div>
                                            <p className="text-6xl font-black text-slate-800">
                                                {currentVocabulary.kanji}
                                            </p>
                                            {showHiragana ? (
                                                <p className="mt-4 text-2xl font-bold text-pink-500">
                                                    {currentVocabulary.hiragana}
                                                </p>
                                            ) : null}
                                            <p className="mt-6 text-sm font-bold text-slate-400">
                                                Bấm vào thẻ để xem nghĩa
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid h-full place-items-center">
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                                                Meaning
                                            </p>
                                            <p className="mt-4 whitespace-pre-wrap break-words font-sans text-2xl font-semibold leading-10 tracking-normal text-slate-800 sm:text-3xl sm:leading-relaxed">
                                                {currentVocabulary.meaning}
                                            </p>
                                            <p className="mt-6 text-sm font-bold text-slate-400">
                                                Bấm lại để xem mặt trước
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 lg:grid-cols-[auto_1fr_1fr_auto] lg:items-center">
                            <button
                                type="button"
                                className="h-12 rounded-2xl border border-pink-100 bg-white px-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 sm:px-5 sm:text-sm"
                                onClick={handlePreviousCard}
                            >
                                Prev
                            </button>

                            <button
                                type="button"
                                disabled={isReviewing}
                                className="h-12 rounded-2xl border border-rose-100 bg-rose-50 px-2 text-xs font-bold text-rose-500 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm"
                                onClick={() => void handleReviewFlashcard("forgot")}
                            >
                                {isReviewing ? "..." : "Forgot"}
                            </button>

                            <button
                                type="button"
                                disabled={isReviewing}
                                className="h-12 rounded-2xl border border-emerald-100 bg-emerald-50 px-2 text-xs font-bold text-emerald-600 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm"
                                onClick={() => void handleReviewFlashcard("remember")}
                            >
                                {isReviewing ? "..." : "Remember"}
                            </button>

                            <button
                                type="button"
                                className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-2 text-xs font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 sm:px-6 sm:text-sm"
                                onClick={handleNextCard}
                            >
                                Next
                            </button>
                        </div>

                        <div className="rounded-[26px] border border-pink-50 bg-white px-5 py-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-800">
                                        Session summary
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Theo dõi nhanh kết quả ôn tập trong phiên hiện tại.
                                    </p>

                                    {sessionSavedMessage ? (
                                        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
                                            {sessionSavedMessage}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        disabled={sessionStats.reviewedCount === 0 || isSavingSession || isSessionSaved}
                                        className="h-10 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                        onClick={() => void handleSaveStudySession()}
                                    >
                                        {isSavingSession ? "Đang lưu..." : "Kết thúc phiên"}
                                    </button>

                                    <button
                                        type="button"
                                        className="h-10 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                                        onClick={handleResetSession}
                                    >
                                        Reset session
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-pink-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-pink-400">
                                        Reviewed
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-slate-800">
                                        {sessionStats.reviewedCount}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-500">
                                        Remember
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-emerald-600">
                                        {sessionStats.rememberedCount}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-rose-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-400">
                                        Forgot
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-rose-500">
                                        {sessionStats.forgotCount}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : studyMode === "grammar" && currentGrammarPoint ? (
                    <div className="grid gap-5">
                        <div className="grid gap-3">
                            <div className="flex min-w-0 items-center justify-between gap-3">
                                <span className="shrink-0 rounded-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-500">
                                    {progressText}
                                </span>

                                <div className="ml-auto flex min-w-0 items-center justify-end gap-2 text-right text-sm font-bold text-slate-500">
                                    <span className="shrink-0">{currentGrammarPoint.jlptLevel}</span>
                                    <span className="shrink-0">・</span>
                                    <span className="truncate">Ngữ pháp</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                                    Remember {sessionStats.rememberedCount}
                                </span>

                                <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-500">
                                    Forgot {sessionStats.forgotCount}
                                </span>

                                {currentGrammarPoint.isBookmarked ? (
                                    <span className="rounded-full bg-pink-50 px-3 py-1 text-pink-500">
                                        Đã lưu
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="min-h-[360px] rounded-[30px] border border-pink-100 bg-gradient-to-br from-white via-pink-50/60 to-violet-50 p-8 text-center shadow-inner transition lg:hover:scale-[1.005]"
                            onClick={() => setIsFlipped((current) => !current)}
                        >
                            {!isFlipped ? (
                                <div className="grid h-full place-items-center gap-4">
                                    <div>
                                        <p
                                            lang="ja"
                                            className="whitespace-normal break-words font-sans text-5xl font-black leading-tight tracking-normal text-slate-800 sm:text-6xl"
                                        >
                                            {currentGrammarPoint.title}
                                        </p>
                                        {currentGrammarPoint.structure ? (
                                            <p
                                                lang="ja"
                                                className="mx-auto mt-5 max-w-3xl rounded-2xl border border-pink-100 bg-white/80 px-4 py-3 text-lg font-black leading-8 text-pink-500 shadow-sm sm:text-2xl"
                                            >
                                                {currentGrammarPoint.structure}
                                            </p>
                                        ) : null}
                                        <p className="mt-6 text-sm font-bold text-slate-400">
                                            Bấm vào thẻ để xem nghĩa và cách dùng
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid h-full place-items-center">
                                    <div className="mx-auto max-w-4xl">
                                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                                            Meaning
                                        </p>
                                        <p className="mt-4 whitespace-pre-wrap break-words font-sans text-2xl font-semibold leading-10 tracking-normal text-slate-800 sm:text-3xl sm:leading-relaxed">
                                            {currentGrammarPoint.meaning}
                                        </p>
                                        {currentGrammarPoint.explanation ? (
                                            <p className="mt-5 whitespace-pre-wrap break-words text-base font-semibold leading-8 text-slate-500">
                                                {currentGrammarPoint.explanation}
                                            </p>
                                        ) : null}
                                        {currentGrammarPoint.examples[0] ? (
                                            <div className="mt-6 rounded-2xl border border-pink-100 bg-white/80 px-4 py-3 text-left">
                                                <p lang="ja" className="font-sans text-base font-black text-slate-800">
                                                    {currentGrammarPoint.examples[0].jp}
                                                </p>
                                                {currentGrammarPoint.examples[0].vi ? (
                                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                                        {currentGrammarPoint.examples[0].vi}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                        <p className="mt-6 text-sm font-bold text-slate-400">
                                            Bấm lại để xem mặt trước
                                        </p>
                                    </div>
                                </div>
                            )}
                        </button>

                        <div className="grid grid-cols-4 gap-2 lg:grid-cols-[auto_1fr_1fr_auto] lg:items-center">
                            <button
                                type="button"
                                className="h-12 rounded-2xl border border-pink-100 bg-white px-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 sm:px-5 sm:text-sm"
                                onClick={handlePreviousCard}
                            >
                                Prev
                            </button>

                            <button
                                type="button"
                                disabled={isReviewing}
                                className="h-12 rounded-2xl border border-rose-100 bg-rose-50 px-2 text-xs font-bold text-rose-500 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm"
                                onClick={() => void handleReviewFlashcard("forgot")}
                            >
                                {isReviewing ? "..." : "Forgot"}
                            </button>

                            <button
                                type="button"
                                disabled={isReviewing}
                                className="h-12 rounded-2xl border border-emerald-100 bg-emerald-50 px-2 text-xs font-bold text-emerald-600 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm"
                                onClick={() => void handleReviewFlashcard("remember")}
                            >
                                {isReviewing ? "..." : "Remember"}
                            </button>

                            <button
                                type="button"
                                className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-2 text-xs font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 sm:px-6 sm:text-sm"
                                onClick={handleNextCard}
                            >
                                Next
                            </button>
                        </div>

                        <div className="rounded-[26px] border border-pink-50 bg-white px-5 py-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-800">
                                        Session summary
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Theo dõi nhanh kết quả ôn tập trong phiên hiện tại.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="h-10 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                                    onClick={handleResetSession}
                                >
                                    Reset session
                                </button>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-pink-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-pink-400">
                                        Reviewed
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-slate-800">
                                        {sessionStats.reviewedCount}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-500">
                                        Remember
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-emerald-600">
                                        {sessionStats.rememberedCount}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-rose-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-400">
                                        Forgot
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-rose-500">
                                        {sessionStats.forgotCount}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <EmptyState
                        icon={
                            studyMode === "vocabulary" ? (
                                <BookOpen size={24} />
                            ) : (
                                <GraduationCap size={24} />
                            )
                        }
                        title={
                            hasActiveFilter
                                ? studyMode === "vocabulary"
                                    ? "Không có từ theo bộ lọc"
                                    : "Không có ngữ pháp theo bộ lọc"
                                : "Chưa có flashcard"
                        }
                        description={
                            hasActiveFilter
                                ? studyMode === "vocabulary"
                                    ? "Thử đổi level, book, chapter hoặc tắt Only difficult để luyện thêm từ."
                                    : "Thử đổi JLPT level để luyện thêm mẫu ngữ pháp."
                                : studyMode === "vocabulary"
                                    ? "Hãy import hoặc thêm từ vựng ở trang Vocabulary trước khi ôn flashcard."
                                    : "Hãy thêm mẫu ngữ pháp ở trang Grammar trước khi ôn flashcard."
                        }
                        actionLabel={hasActiveFilter ? "Xoá bộ lọc" : undefined}
                        onAction={hasActiveFilter ? handleClearFilters : undefined}
                        className="min-h-[360px]"
                    />
                )}
            </section>
        </div>
    );
}
