"use client";

import {
    CheckCircle2,
    Eye,
    EyeOff,
    RefreshCcw,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppSelect } from "@/components/ui/AppSelect";
import {
    createQuizSession,
    getQuizVocabularies,
    reviewQuizAnswer,
    type QuizAnswerResult,
} from "@/services/quizService";
import {
    getVocabularyFilterOptions,
    type VocabularyListItem,
} from "@/services/vocabularyService";

type QuizQuestion = {
    vocabulary: VocabularyListItem;
    choices: string[];
};

function shuffleArray<T>(items: T[]) {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [
            shuffled[randomIndex],
            shuffled[index],
        ];
    }

    return shuffled;
}

function buildQuizQuestions(vocabularies: VocabularyListItem[]) {
    const candidates = vocabularies.filter((item) => item.meaning.trim());

    return shuffleArray(candidates)
        .slice(0, 10)
        .map((vocabulary) => {
            const wrongChoices = shuffleArray(
                candidates
                    .filter((item) => item.id !== vocabulary.id)
                    .map((item) => item.meaning),
            ).slice(0, 3);

            return {
                vocabulary,
                choices: shuffleArray([vocabulary.meaning, ...wrongChoices]),
            };
        })
        .filter((question) => question.choices.length >= 2);
}

export function QuizPage() {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
    const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [isSavingQuizSession, setIsSavingQuizSession] = useState(false);
    const [isQuizSessionSaved, setIsQuizSessionSaved] = useState(false);
    const [quizSessionSavedMessage, setQuizSessionSavedMessage] = useState<
        string | null
    >(null);
    const isSavingQuizSessionRef = useRef(false);

    const [selectedLevel, setSelectedLevel] = useState("All");
    const [selectedBook, setSelectedBook] = useState("All");
    const [selectedChapter, setSelectedChapter] = useState("All");
    const [onlyDifficult, setOnlyDifficult] = useState(false);
    const [showHiragana, setShowHiragana] = useState(true);

    const [availableLevels, setAvailableLevels] = useState<string[]>([]);
    const [availableBooks, setAvailableBooks] = useState<string[]>([]);
    const [availableChapters, setAvailableChapters] = useState<string[]>([]);

    const currentQuestion = questions[currentQuestionIndex] ?? null;
    const isQuizCompleted =
        questions.length > 0 && currentQuestionIndex >= questions.length;

    const progressText = useMemo(() => {
        if (questions.length === 0) {
            return "0 / 0";
        }

        return `${Math.min(currentQuestionIndex + 1, questions.length)} / ${questions.length
            }`;
    }, [currentQuestionIndex, questions.length]);

    const scorePercent =
        questions.length > 0
            ? Math.round((correctCount / questions.length) * 100)
            : 0;

    const levelOptions = ["All", ...availableLevels];
    const bookOptions = ["All", ...availableBooks];
    const chapterOptions = ["All", ...availableChapters];

    const hasActiveFilter =
        selectedLevel !== "All" ||
        selectedBook !== "All" ||
        selectedChapter !== "All" ||
        onlyDifficult;

    async function loadFilterOptions(level = selectedLevel, book = selectedBook) {
        setIsLoadingFilterOptions(true);

        try {
            const options = await getVocabularyFilterOptions({
                level,
                book,
            });

            setAvailableLevels(options.levels);
            setAvailableBooks(options.books);
            setAvailableChapters(options.chapters);
        } catch (error) {
            console.error("Failed to load quiz filter options:", error);
        } finally {
            setIsLoadingFilterOptions(false);
        }
    }

    async function loadQuiz() {
        setIsLoading(true);
        setLoadError(null);

        try {
            const vocabularies = await getQuizVocabularies({
                level: selectedLevel,
                book: selectedBook,
                chapter: selectedChapter,
                onlyDifficult,
                limitCount: 60,
            });

            const nextQuestions = buildQuizQuestions(vocabularies);

            setQuestions(nextQuestions);
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setCorrectCount(0);
            setWrongCount(0);
            setIsQuizSessionSaved(false);
            setQuizSessionSavedMessage(null);
        } catch (error) {
            console.error("Failed to load quiz:", error);
            setLoadError("Không thể tải quiz.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleLevelChange(level: string) {
        setSelectedLevel(level);
        setSelectedChapter("All");
        setAvailableChapters([]);
        void loadFilterOptions(level, selectedBook);
    }

    function handleBookChange(book: string) {
        setSelectedBook(book);
        setSelectedChapter("All");
        setAvailableChapters([]);
        void loadFilterOptions(selectedLevel, book);
    }

    function handleClearFilters() {
        setSelectedLevel("All");
        setSelectedBook("All");
        setSelectedChapter("All");
        setOnlyDifficult(false);
        void loadFilterOptions("All", "All");
    }

    async function handleSelectAnswer(answer: string) {
        if (!currentQuestion || isAnswered || isSubmittingAnswer) {
            return;
        }

        const result: QuizAnswerResult =
            answer === currentQuestion.vocabulary.meaning ? "correct" : "wrong";

        setSelectedAnswer(answer);
        setIsAnswered(true);
        setIsSubmittingAnswer(true);
        setLoadError(null);

        try {
            await reviewQuizAnswer(currentQuestion.vocabulary, result);

            if (result === "correct") {
                setCorrectCount((current) => current + 1);
            } else {
                setWrongCount((current) => current + 1);
            }
        } catch (error) {
            console.error("Failed to submit quiz answer:", error);
            setLoadError("Không thể lưu kết quả trả lời.");
        } finally {
            setIsSubmittingAnswer(false);
        }
    }

    function handleNextQuestion() {
        setSelectedAnswer(null);
        setIsAnswered(false);
        setCurrentQuestionIndex((current) => current + 1);
    }

    function handleRestartQuiz() {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setCorrectCount(0);
        setWrongCount(0);
        setIsQuizSessionSaved(false);
        setQuizSessionSavedMessage(null);
    }

    useEffect(() => {
        void loadFilterOptions();
    }, []);

    useEffect(() => {
        void loadQuiz();
    }, [selectedLevel, selectedBook, selectedChapter, onlyDifficult]);

    async function handleSaveQuizSession() {
        if (
            questions.length === 0 ||
            isSavingQuizSession ||
            isQuizSessionSaved ||
            isSavingQuizSessionRef.current
        ) {
            return;
        }

        isSavingQuizSessionRef.current = true;
        setIsSavingQuizSession(true);
        setLoadError(null);

        try {
            await createQuizSession({
                questionCount: questions.length,
                correctCount,
                wrongCount,
                scorePercent,
                level: selectedLevel,
                book: selectedBook,
                chapter: selectedChapter,
                onlyDifficult,
            });

            setIsQuizSessionSaved(true);
            setQuizSessionSavedMessage("Đã lưu kết quả quiz.");
        } catch (error) {
            console.error("Failed to save quiz session:", error);
            setLoadError("Không thể lưu kết quả quiz.");
        } finally {
            isSavingQuizSessionRef.current = false;
            setIsSavingQuizSession(false);
        }
    }

    return (
        <div className="grid gap-5">
            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-6 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                            Quiz
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-slate-800">
                            Luyện chọn nghĩa đúng
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Quiz được tạo từ dữ liệu Vocabulary trong Supabase.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                        onClick={() => void loadQuiz()}
                    >
                        <RefreshCcw size={16} />
                        Reload quiz
                    </button>
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
                        {isLoading ? "Đang tải..." : `${questions.length} câu hỏi`}
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
                    <div className="grid min-h-[420px] place-items-center text-sm font-bold text-slate-400">
                        Đang tải quiz...
                    </div>
                ) : isQuizCompleted ? (
                    <div className="grid min-h-[420px] place-items-center text-center">
                        <div className="max-w-xl">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-pink-50 text-4xl">
                                🏆
                            </div>

                            <h2 className="mt-5 text-3xl font-black text-slate-800">
                                Hoàn thành Quiz
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Bạn trả lời đúng {correctCount} / {questions.length} câu.
                            </p>

                            <p className="mt-4 text-5xl font-black text-pink-500">
                                {scorePercent}%
                            </p>

                            {quizSessionSavedMessage ? (
                                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
                                    {quizSessionSavedMessage}
                                </div>
                            ) : null}

                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <button
                                    type="button"
                                    disabled={isSavingQuizSession || isQuizSessionSaved}
                                    className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                    onClick={() => void handleSaveQuizSession()}
                                >
                                    {isSavingQuizSession
                                        ? "Saving..."
                                        : isQuizSessionSaved
                                            ? "Saved"
                                            : "Save result"}
                                </button>

                                <button
                                    type="button"
                                    className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                                    onClick={handleRestartQuiz}
                                >
                                    Restart
                                </button>

                                <button
                                    type="button"
                                    className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                                    onClick={() => void loadQuiz()}
                                >
                                    New quiz
                                </button>
                            </div>
                        </div>
                    </div>
                ) : currentQuestion ? (
                    <div className="grid gap-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="rounded-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-500">
                                {progressText}
                            </span>

                            <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-500">
                                <span>{currentQuestion.vocabulary.level}</span>
                                <span>・</span>
                                <span>{currentQuestion.vocabulary.book}</span>
                                <span>・</span>
                                <span>{currentQuestion.vocabulary.chapter}</span>
                            </div>
                        </div>

                        <div className="rounded-[30px] border border-pink-100 bg-gradient-to-br from-white via-pink-50/60 to-violet-50 p-8 text-center shadow-inner">
                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                                Chọn nghĩa đúng
                            </p>

                            <p className="mt-6 text-6xl font-black text-slate-800">
                                {currentQuestion.vocabulary.kanji}
                            </p>

                            {showHiragana ? (
                                <p className="mt-4 text-2xl font-bold text-pink-500">
                                    {currentQuestion.vocabulary.hiragana}
                                </p>
                            ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {currentQuestion.choices.map((choice) => {
                                const isCorrectChoice =
                                    choice === currentQuestion.vocabulary.meaning;
                                const isSelectedChoice = selectedAnswer === choice;

                                return (
                                    <button
                                        key={choice}
                                        type="button"
                                        disabled={isAnswered || isSubmittingAnswer}
                                        className={`min-h-16 rounded-2xl border px-5 py-4 text-left text-sm font-bold shadow-sm transition disabled:cursor-not-allowed ${isAnswered && isCorrectChoice
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : isAnswered && isSelectedChoice && !isCorrectChoice
                                                ? "border-rose-200 bg-rose-50 text-rose-600"
                                                : "border-pink-100 bg-white text-slate-700 hover:bg-pink-50"
                                            }`}
                                        onClick={() => void handleSelectAnswer(choice)}
                                    >
                                        <span className="flex items-center gap-2">
                                            {isAnswered && isCorrectChoice ? (
                                                <CheckCircle2 size={18} />
                                            ) : null}

                                            {isAnswered && isSelectedChoice && !isCorrectChoice ? (
                                                <XCircle size={18} />
                                            ) : null}

                                            {choice}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-bold text-slate-500">
                                Correct: <span className="text-emerald-600">{correctCount}</span>{" "}
                                ・ Wrong: <span className="text-rose-500">{wrongCount}</span>
                            </div>

                            <button
                                type="button"
                                disabled={!isAnswered || isSubmittingAnswer}
                                className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                onClick={handleNextQuestion}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid min-h-[420px] place-items-center text-center">
                        <div>
                            <p className="text-lg font-black text-slate-700">
                                Chưa đủ dữ liệu để tạo quiz.
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Cần ít nhất vài từ vựng trong cùng bộ lọc để tạo đáp án.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
