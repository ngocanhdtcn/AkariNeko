"use client";

import {
    CheckCircle2,
    Eye,
    EyeOff,
    RefreshCcw,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppSelect } from "@/components/ui/AppSelect";
import { AppMultiSelect } from "@/components/ui/AppMultiSelect";
import {
    hasActiveStudyFilters,
    readPersistedStudyFilters,
    writePersistedStudyFilters,
} from "@/hooks/useStudyFilterPersistence";
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

type QuizPoolState = {
    filterKey: string;
    unseenIds: string[];
    wrongIds: string[];
    correctIds: string[];
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

function getQuizFilterKey({
    level,
    book,
    chapters,
    onlyDifficult,
}: {
    level: string;
    book: string;
    chapters: string[];
    onlyDifficult: boolean;
}) {
    return JSON.stringify({
        level,
        book,
        chapters: [...chapters].sort(),
        onlyDifficult,
    });
}

function getUniqueIds(ids: string[]) {
    return Array.from(new Set(ids));
}

function isMasteredVocabulary(vocabulary: VocabularyListItem) {
    return vocabulary.correctCount - vocabulary.wrongCount >= 5;
}

function buildQuizQuestions(
    vocabularies: VocabularyListItem[],
    poolState: QuizPoolState | null,
) {
    const candidates = vocabularies.filter((item) => item.meaning.trim());
    const candidateIds = new Set(candidates.map((item) => item.id));
    const pickedIds = new Set<string>();

    function takeByIds(ids: string[]) {
        const idSet = new Set(ids);

        return shuffleArray(
            candidates.filter((item) => idSet.has(item.id) && !pickedIds.has(item.id)),
        ).map((item) => {
            pickedIds.add(item.id);
            return item;
        });
    }

    const unseenItems = poolState
        ? takeByIds(poolState.unseenIds.filter((id) => candidateIds.has(id)))
        : [];
    const recentWrongItems = poolState
        ? takeByIds(poolState.wrongIds.filter((id) => candidateIds.has(id)))
        : [];
    const difficultItems = shuffleArray(
        candidates.filter(
            (item) =>
                !pickedIds.has(item.id) &&
                (item.isDifficult || item.wrongCount > item.correctCount),
        ),
    ).map((item) => {
        pickedIds.add(item.id);
        return item;
    });
    const correctItems = poolState
        ? takeByIds(poolState.correctIds.filter((id) => candidateIds.has(id)))
        : [];
    const remainingItems = shuffleArray(
        candidates.filter((item) => !pickedIds.has(item.id)),
    );

    return [
        ...unseenItems,
        ...recentWrongItems,
        ...difficultItems,
        ...correctItems,
        ...remainingItems,
    ]
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
    const { profile, isLoadingProfile } = useAuth();
    const [persistedFilters] = useState(() => readPersistedStudyFilters("quiz"));
    const hasPersistedFilters = hasActiveStudyFilters(persistedFilters);
    const didApplyProfileLevelRef = useRef(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [quizPool, setQuizPool] = useState<QuizPoolState | null>(null);
    const quizPoolRef = useRef<QuizPoolState | null>(null);
    const [answerResults, setAnswerResults] = useState<
        Record<string, QuizAnswerResult>
    >({});
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
    const autoNextTimeoutRef = useRef<number | null>(null);

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
    const chapterOptions = availableChapters;

    const hasActiveFilter =
        selectedLevel !== "All" ||
        selectedBook !== "All" ||
        selectedChapters.length > 0 ||
        onlyDifficult;

    async function loadFilterOptions(level = selectedLevel, book = selectedBook) {
        if (!areStudyFiltersReady) {
            return;
        }

        setIsLoadingFilterOptions(true);

        try {
            const options = await getVocabularyFilterOptions({
                level,
                book,
            });

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
            console.error("Failed to load quiz filter options:", error);
        } finally {
            setIsLoadingFilterOptions(false);
        }
    }

    async function loadQuiz() {
        if (!areStudyFiltersReady) {
            return;
        }

        setIsLoading(true);
        setLoadError(null);

        try {
            const vocabularies = await getQuizVocabularies({
                level: selectedLevel,
                book: selectedBook,
                chapters: selectedChapters,
                onlyDifficult,
            });
            const filterKey = getQuizFilterKey({
                level: selectedLevel,
                book: selectedBook,
                chapters: selectedChapters,
                onlyDifficult,
            });
            const candidates = vocabularies.filter((item) => item.meaning.trim());
            const candidateIds = candidates.map((item) => item.id);
            const candidateIdSet = new Set(candidateIds);
            const masteredCandidateIds = new Set(
                candidates
                    .filter((item) => isMasteredVocabulary(item))
                    .map((item) => item.id),
            );
            const currentPool = quizPoolRef.current;
            const knownPoolIds = new Set(
                currentPool
                    ? [
                        ...currentPool.unseenIds,
                        ...currentPool.wrongIds,
                        ...currentPool.correctIds,
                    ]
                    : [],
            );
            const newCandidateIds = candidateIds.filter((id) => !knownPoolIds.has(id));
            const newUnseenIds = newCandidateIds.filter(
                (id) => !masteredCandidateIds.has(id),
            );
            const newCorrectIds = newCandidateIds.filter((id) =>
                masteredCandidateIds.has(id),
            );
            const nextPool =
                currentPool?.filterKey === filterKey
                    ? {
                        filterKey,
                        unseenIds: [
                            ...currentPool.unseenIds.filter((id) =>
                                candidateIdSet.has(id) &&
                                !masteredCandidateIds.has(id),
                            ),
                            ...newUnseenIds,
                        ],
                        wrongIds: currentPool.wrongIds.filter((id) =>
                            candidateIdSet.has(id),
                        ),
                        correctIds: getUniqueIds(
                            [
                                ...currentPool.correctIds.filter((id) =>
                                    candidateIdSet.has(id),
                                ),
                                ...currentPool.unseenIds.filter((id) =>
                                    masteredCandidateIds.has(id),
                                ),
                                ...newCorrectIds,
                            ],
                        ),
                    }
                    : {
                        filterKey,
                        unseenIds: candidateIds.filter(
                            (id) => !masteredCandidateIds.has(id),
                        ),
                        wrongIds: [],
                        correctIds: candidateIds.filter((id) =>
                            masteredCandidateIds.has(id),
                        ),
                    };

            quizPoolRef.current = nextPool;
            setQuizPool(nextPool);

            const nextQuestions = buildQuizQuestions(vocabularies, nextPool);

            setQuestions(nextQuestions);
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setCorrectCount(0);
            setWrongCount(0);
            setAnswerResults({});
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
        setSelectedBook("All");
        setSelectedChapters([]);
        setAvailableChapters([]);
    }

    function handleBookChange(book: string) {
        setSelectedBook(book);
        setSelectedChapters([]);
        setAvailableChapters([]);
    }

    function handleClearFilters() {
        setSelectedLevel("All");
        setSelectedBook("All");
        setSelectedChapters([]);
        setOnlyDifficult(false);
    }

    function handleSelectAnswer(answer: string) {
        if (!currentQuestion || isAnswered || isSubmittingAnswer) {
            return;
        }

        if (autoNextTimeoutRef.current !== null) {
            window.clearTimeout(autoNextTimeoutRef.current);
            autoNextTimeoutRef.current = null;
        }

        const answeredQuestion = currentQuestion;
        const result: QuizAnswerResult =
            answer === answeredQuestion.vocabulary.meaning ? "correct" : "wrong";

        setSelectedAnswer(answer);
        setIsAnswered(true);
        setIsSubmittingAnswer(true);
        setLoadError(null);

        if (result === "correct") {
            setCorrectCount((current) => current + 1);
        } else {
            setWrongCount((current) => current + 1);
        }

        setAnswerResults((current) => ({
            ...current,
            [answeredQuestion.vocabulary.id]: result,
        }));

        setIsSubmittingAnswer(false);

        void reviewQuizAnswer(answeredQuestion.vocabulary, result).catch((error) => {
            console.error("Failed to submit quiz answer:", error);
            setLoadError("Không thể lưu kết quả trả lời.");
        });

        if (result === "correct") {
            autoNextTimeoutRef.current = window.setTimeout(() => {
                autoNextTimeoutRef.current = null;
                handleNextQuestion();
            }, 450);
        }
    }

    function handleNextQuestion() {
        if (autoNextTimeoutRef.current !== null) {
            window.clearTimeout(autoNextTimeoutRef.current);
            autoNextTimeoutRef.current = null;
        }

        setSelectedAnswer(null);
        setIsAnswered(false);
        setCurrentQuestionIndex((current) => current + 1);
    }

    function handleRestartQuiz() {
        if (autoNextTimeoutRef.current !== null) {
            window.clearTimeout(autoNextTimeoutRef.current);
            autoNextTimeoutRef.current = null;
        }

        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setCorrectCount(0);
        setWrongCount(0);
        setAnswerResults({});
        setIsQuizSessionSaved(false);
        setQuizSessionSavedMessage(null);
    }

    useEffect(() => {
        if (!areStudyFiltersReady) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadFilterOptions(selectedLevel, selectedBook);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [areStudyFiltersReady, selectedLevel, selectedBook]);

    useEffect(() => {
        if (!areStudyFiltersReady) {
            return;
        }

        writePersistedStudyFilters("quiz", {
            level: selectedLevel,
            book: selectedBook,
            chapters: selectedChapters,
            onlyDifficult,
        });
    }, [
        areStudyFiltersReady,
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
        if (!areStudyFiltersReady) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadQuiz();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLevel, selectedBook, selectedChapters, onlyDifficult]);

    useEffect(() => {
        return () => {
            if (autoNextTimeoutRef.current !== null) {
                window.clearTimeout(autoNextTimeoutRef.current);
            }
        };
    }, []);

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
                chapter:
                    selectedChapters.length > 0 ? selectedChapters.join(", ") : "All",
                onlyDifficult,
            });

            setIsQuizSessionSaved(true);
            setQuizSessionSavedMessage("Đã lưu kết quả quiz. Đang tạo quiz mới...");

            const answeredIds = questions.map((question) => question.vocabulary.id);
            const answeredIdSet = new Set(answeredIds);
            const wrongIds = answeredIds.filter(
                (id) => answerResults[id] === "wrong",
            );
            const correctIds = answeredIds.filter(
                (id) => answerResults[id] === "correct",
            );
            const currentPool = quizPoolRef.current;

            if (currentPool) {
                const nextPool = {
                    filterKey: currentPool.filterKey,
                    unseenIds: currentPool.unseenIds.filter(
                        (id) => !answeredIdSet.has(id),
                    ),
                    wrongIds: getUniqueIds([...wrongIds, ...currentPool.wrongIds]).filter(
                        (id) => !correctIds.includes(id),
                    ),
                    correctIds: getUniqueIds([
                        ...currentPool.correctIds.filter((id) => !wrongIds.includes(id)),
                        ...correctIds,
                    ]),
                };

                quizPoolRef.current = nextPool;
                setQuizPool(nextPool);
            }

            await loadQuiz();
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

                    <AppMultiSelect
                        label="Chapter"
                        items={chapterOptions}
                        values={selectedChapters}
                        onChange={setSelectedChapters}
                        disabled={isLoadingFilterOptions}
                        isLoading={isLoadingFilterOptions}
                    />

                    <div className="rounded-2xl bg-pink-50 px-4 py-3 text-sm font-bold text-pink-500">
                        <div>
                            {isLoading ? "Đang tải..." : `${questions.length} câu hỏi`}
                        </div>
                        {quizPool ? (
                            <div className="mt-1 text-xs text-pink-400">
                                Chưa gặp: {quizPool.unseenIds.length}
                            </div>
                        ) : null}
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
                            </div>
                        </div>
                    </div>
                ) : currentQuestion ? (
                    <div className="grid gap-5">
                        <div className="flex min-w-0 items-center justify-between gap-3">
                            <span className="shrink-0 rounded-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-500">
                                {progressText}
                            </span>

                            <div className="ml-auto flex min-w-0 items-center justify-end gap-2 text-right text-sm font-bold text-slate-500">
                                <span className="shrink-0">{currentQuestion.vocabulary.level}</span>
                                <span>・</span>
                                <span className="truncate">{currentQuestion.vocabulary.book}</span>
                                <span>・</span>
                                <span className="truncate">{currentQuestion.vocabulary.chapter}</span>
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
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-600 shadow-sm">
                                    <CheckCircle2 size={15} />
                                    Correct {correctCount}
                                </span>

                                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-rose-500 shadow-sm">
                                    <XCircle size={15} />
                                    Wrong {wrongCount}
                                </span>
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
