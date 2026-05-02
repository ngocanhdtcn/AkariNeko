"use client";

import { RotateCcw, Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
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
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);

    const [selectedLevel, setSelectedLevel] = useState("All");
    const [selectedBook, setSelectedBook] = useState("All");
    const [selectedChapter, setSelectedChapter] = useState("All");
    const [onlyDifficult, setOnlyDifficult] = useState(false);

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

    async function loadFlashcards() {
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

            setVocabularies(data);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (error) {
            console.error("Failed to load flashcards:", error);
            setLoadError("Không thể tải flashcard.");
        } finally {
            setIsLoading(false);
        }
    }

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

    function handleShuffle() {
        setVocabularies((current) => {
            const shuffled = [...current];

            for (let index = shuffled.length - 1; index > 0; index -= 1) {
                const randomIndex = Math.floor(Math.random() * (index + 1));
                [shuffled[index], shuffled[randomIndex]] = [
                    shuffled[randomIndex],
                    shuffled[index],
                ];
            }

            return shuffled;
        });

        setCurrentIndex(0);
        setIsFlipped(false);
    }

    async function loadFilterOptions() {
        try {
            const options = await getVocabularyFilterOptions();

            setAvailableLevels(options.levels);
            setAvailableBooks(options.books);
            setAvailableChapters(options.chapters);
        } catch (error) {
            console.error("Failed to load flashcard filter options:", error);
        }
    }

    useEffect(() => {
        void loadFilterOptions();
    }, []);

    useEffect(() => {
        void loadFlashcards();
    }, [selectedLevel, selectedBook, selectedChapter, onlyDifficult]);

    const levelOptions = ["All", ...availableLevels];
    const bookOptions = ["All", ...availableBooks];
    const chapterOptions = ["All", ...availableChapters];

    function handleLevelChange(level: string) {
        setSelectedLevel(level);
        setSelectedChapter("All");
    }

    function handleBookChange(book: string) {
        setSelectedBook(book);
        setSelectedChapter("All");
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

    async function handleReviewFlashcard(result: ReviewFlashcardResult) {
        if (!currentVocabulary || isReviewing) {
            return;
        }

        setIsReviewing(true);
        setLoadError(null);

        try {
            await reviewFlashcard(currentVocabulary, result);

            updateReviewedVocabularyLocally(currentVocabulary.id, result);
            handleNextCard();
        } catch (error) {
            console.error("Failed to review flashcard:", error);
            setLoadError("Không thể lưu kết quả ôn tập.");
        } finally {
            setIsReviewing(false);
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
                            Dữ liệu được lấy trực tiếp từ Supabase.
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
                            Shuffle
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="grid gap-4 xl:grid-cols-[160px_190px_190px_1fr_auto] xl:items-end">
                    <label className="grid gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            JLPT Level
                        </span>
                        <select
                            value={selectedLevel}
                            className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                            onChange={(event) => handleLevelChange(event.target.value)}
                        >
                            {levelOptions.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Book
                        </span>
                        <select
                            value={selectedBook}
                            className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                            onChange={(event) => handleBookChange(event.target.value)}
                        >
                            {bookOptions.map((book) => (
                                <option key={book} value={book}>
                                    {book}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Chapter
                        </span>
                        <select
                            value={selectedChapter}
                            className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                            onChange={(event) => setSelectedChapter(event.target.value)}
                        >
                            {chapterOptions.map((chapter) => (
                                <option key={chapter} value={chapter}>
                                    {chapter}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="rounded-2xl bg-pink-50 px-4 py-3 text-sm font-bold text-pink-500">
                        {vocabularies.length} flashcard
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
                </div>
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
                                        <p className="mt-4 text-2xl font-bold text-pink-500">
                                            {currentVocabulary.hiragana}
                                        </p>
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