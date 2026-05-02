"use client";

import { Eye, EyeOff, RotateCcw, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppSelect } from "@/components/ui/AppSelect";
import {
    createFlashcardStudySession,
    getFlashcardVocabularies,
    reviewFlashcard,
    type ReviewFlashcardResult,
} from "@/services/flashcardService";
import {
    getVocabularyFilterOptions,
    type VocabularyListItem,
} from "@/services/vocabularyService";

export function FlashcardPage() {
    const [vocabularies, setVocabularies] = useState<VocabularyListItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const flashcardsRequestIdRef = useRef(0);
    const filterOptionsRequestIdRef = useRef(0);
    const [isSavingSession, setIsSavingSession] = useState(false);
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

    const [selectedLevel, setSelectedLevel] = useState("All");
    const [selectedBook, setSelectedBook] = useState("All");
    const [selectedChapter, setSelectedChapter] = useState("All");
    const [onlyDifficult, setOnlyDifficult] = useState(false);
    const [showHiragana, setShowHiragana] = useState(true);

    const [availableLevels, setAvailableLevels] = useState<string[]>([]);
    const [availableBooks, setAvailableBooks] = useState<string[]>([]);
    const [availableChapters, setAvailableChapters] = useState<string[]>([]);

    const currentVocabulary = vocabularies[currentIndex] ?? null;

    const progressText = useMemo(() => {
        if (vocabularies.length === 0) {
            return "0 / 0";
        }

        return `${currentIndex + 1} / ${vocabularies.length}`;
    }, [currentIndex, vocabularies.length]);

    const loadFlashcards = useCallback(async () => {
        const requestId = flashcardsRequestIdRef.current + 1;
        flashcardsRequestIdRef.current = requestId;
        setIsLoading(true);
        setLoadError(null);

        try {
            const data = await getFlashcardVocabularies({
                level: selectedLevel,
                book: selectedBook,
                chapter: selectedChapter,
                onlyDifficult,
                limitCount: 100,
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
        } catch (error) {
            console.error("Failed to load flashcards:", error);
            setLoadError("Không thể tải flashcard.");
        } finally {
            if (flashcardsRequestIdRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, [selectedLevel, selectedBook, selectedChapter, onlyDifficult]);

    function handleNextCard() {
        if (vocabularies.length === 0) {
            return;
        }

        setCurrentIndex((current) => (current + 1) % vocabularies.length);
        setIsFlipped(false);
    }

    function handlePreviousCard() {
        if (vocabularies.length === 0) {
            return;
        }

        setCurrentIndex((current) =>
            current === 0 ? vocabularies.length - 1 : current - 1,
        );
        setIsFlipped(false);
    }

    function getFlashcardPriorityScore(vocabulary: VocabularyListItem) {
        const difficultScore = vocabulary.isDifficult ? 100 : 0;
        const wrongScore = vocabulary.wrongCount * 10;
        const correctPenalty = vocabulary.correctCount * 2;
        const randomScore = Math.random() * 5;

        return difficultScore + wrongScore - correctPenalty + randomScore;
    }

    function handleShuffle() {
        setVocabularies((current) =>
            [...current].sort(
                (firstVocabulary, secondVocabulary) =>
                    getFlashcardPriorityScore(secondVocabulary) -
                    getFlashcardPriorityScore(firstVocabulary),
            ),
        );

        setCurrentIndex(0);
        setIsFlipped(false);
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
        } catch (error) {
            console.error("Failed to load flashcard filter options:", error);
        } finally {
            if (filterOptionsRequestIdRef.current === requestId) {
                setIsLoadingFilterOptions(false);
            }
        }
    }, [selectedLevel, selectedBook]);

    useEffect(() => {
        void loadFilterOptions(selectedLevel, selectedBook);
    }, [selectedLevel, selectedBook, loadFilterOptions]);

    useEffect(() => {
        void loadFlashcards();
    }, [loadFlashcards]);

    const levelOptions = ["All", ...availableLevels];
    const bookOptions = ["All", ...availableBooks];
    const chapterOptions = ["All", ...availableChapters];

    function handleLevelChange(level: string) {
        setSelectedLevel(level);
        setSelectedChapter("All");
        setAvailableChapters([]);
    }

    function handleBookChange(book: string) {
        setSelectedBook(book);
        setSelectedChapter("All");
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
                        vocabulary.isDifficult || nextWrongCount >= nextCorrectCount + 2,
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

    async function handleReviewFlashcard(result: ReviewFlashcardResult) {
        if (!currentVocabulary || isReviewing) {
            return;
        }

        setIsReviewing(true);
        setLoadError(null);

        try {
            await reviewFlashcard(currentVocabulary, result);

            updateReviewedVocabularyLocally(currentVocabulary.id, result);
            setSessionSavedMessage(null);
            updateSessionStats(result);
            handleNextCard();
        } catch (error) {
            console.error("Failed to review flashcard:", error);
            setLoadError("Không thể lưu kết quả ôn tập.");
        } finally {
            setIsReviewing(false);
        }
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
        selectedBook !== "All" ||
        selectedChapter !== "All" ||
        onlyDifficult;

    function handleClearFilters() {
        setSelectedLevel("All");
        setSelectedBook("All");
        setSelectedChapter("All");
        setOnlyDifficult(false);
        void loadFilterOptions("All", "All");
    }

    async function handleSaveStudySession() {
        if (sessionStats.reviewedCount === 0 || isSavingSession) {
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
                chapter: selectedChapter,
                onlyDifficult,
            });

            setSessionSavedMessage("Đã lưu phiên học hôm nay.");
        } catch (error) {
            console.error("Failed to save flashcard study session:", error);
            setLoadError("Không thể lưu phiên học.");
        } finally {
            setIsSavingSession(false);
        }
    }

    return (
        <div className="grid gap-5">
            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-6 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                            Flashcard
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-slate-800">
                            Ôn từ vựng bằng thẻ
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Dữ liệu được lấy trực tiếp từ Supabase. Smart shuffle sẽ ưu tiên từ khó và từ
                            sai nhiều.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="h-11 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                            onClick={() => void loadFlashcards()}
                        >
                            <RotateCcw size={16} className="mr-2 inline" />
                            Reload
                        </button>

                        <button
                            type="button"
                            disabled={vocabularies.length === 0}
                            className="h-11 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                            onClick={handleShuffle}
                        >
                            <Shuffle size={16} className="mr-2 inline" />
                            Smart shuffle
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="grid gap-4 xl:grid-cols-[auto_auto_auto_1fr_auto_auto] xl:items-end">
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

                    <AppSelect
                        label="Chapter"
                        items={chapterOptions}
                        value={selectedChapter}
                        onChange={setSelectedChapter}
                        disabled={isLoadingFilterOptions}
                        isLoading={isLoadingFilterOptions}
                    />

                    <div className="rounded-2xl bg-pink-50 px-4 py-3 text-sm font-bold text-pink-500">
                        {isLoading ? "Đang tải..." : `${vocabularies.length} flashcard`}
                    </div>

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

                    <button
                        type="button"
                        className={`flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-bold shadow-sm transition ${showHiragana
                            ? "border-pink-200 bg-pink-50 text-pink-500"
                            : "border-pink-100 bg-white text-slate-600 hover:bg-pink-50"
                            }`}
                        onClick={() => setShowHiragana((current) => !current)}
                    >
                        {showHiragana ? <Eye size={17} /> : <EyeOff size={17} />}
                        Hiragana
                    </button>
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
                    <div className="grid min-h-[360px] place-items-center text-sm font-bold text-slate-400">
                        Đang tải flashcard...
                    </div>
                ) : currentVocabulary ? (
                    <div className="grid gap-5">
                        <div className="flex items-center justify-between gap-3">
                            <span className="rounded-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-500">
                                {progressText}
                            </span>

                            <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-bold text-slate-500">
                                <span>{currentVocabulary.level}</span>
                                <span>・</span>
                                <span>{currentVocabulary.book}</span>
                                <span>・</span>
                                <span>{currentVocabulary.chapter}</span>

                                <span className="ml-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
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

                        <button
                            type="button"
                            className="min-h-[360px] rounded-[30px] border border-pink-100 bg-gradient-to-br from-white via-pink-50/60 to-violet-50 p-8 text-center shadow-inner transition hover:scale-[1.005]"
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
                                        <p className="mt-4 text-3xl font-black leading-relaxed text-slate-800">
                                            {currentVocabulary.meaning}
                                        </p>
                                        <p className="mt-6 text-sm font-bold text-slate-400">
                                            Bấm lại để xem mặt trước
                                        </p>
                                    </div>
                                </div>
                            )}
                        </button>

                        <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                            <button
                                type="button"
                                className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                                onClick={handlePreviousCard}
                            >
                                Previous
                            </button>

                            <div className="flex flex-wrap justify-center gap-3">
                                <button
                                    type="button"
                                    disabled={isReviewing}
                                    className="h-12 rounded-2xl border border-rose-100 bg-rose-50 px-6 text-sm font-bold text-rose-500 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => void handleReviewFlashcard("forgot")}
                                >
                                    {isReviewing ? "Saving..." : "Forgot"}
                                </button>

                                <button
                                    type="button"
                                    disabled={isReviewing}
                                    className="h-12 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 text-sm font-bold text-emerald-600 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => void handleReviewFlashcard("remember")}
                                >
                                    {isReviewing ? "Saving..." : "Remember"}
                                </button>
                            </div>

                            <button
                                type="button"
                                className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105"
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
                                        disabled={sessionStats.reviewedCount === 0 || isSavingSession}
                                        className="h-10 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                        onClick={() => void handleSaveStudySession()}
                                    >
                                        {isSavingSession ? "Saving..." : "End session"}
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
                ) : (
                    <div className="grid min-h-[360px] place-items-center text-center">
                        <div>
                            <p className="text-lg font-black text-slate-700">
                                Chưa có dữ liệu flashcard.
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Hãy import hoặc thêm từ vựng ở trang Vocabulary trước.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
