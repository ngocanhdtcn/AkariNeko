import { supabase } from "@/lib/supabaseClient";

export type VocabularyLevelStat = {
    level: string;
    count: number;
};

export type RecentImportBatch = {
    id: string;
    sourceType: string;
    totalFiles: number;
    totalRows: number;
    importedCount: number;
    duplicateCount: number;
    errorCount: number;
    createdAt: string;
};

export type RecentStudySession = {
    id: string;
    reviewedCount: number;
    rememberedCount: number;
    forgotCount: number;
    level: string | null;
    book: string | null;
    chapter: string | null;
    onlyDifficult: boolean;
    createdAt: string;
};

export type DashboardStats = {
    totalVocabularyCount: number;
    difficultVocabularyCount: number;
    levelStats: VocabularyLevelStat[];
    recentImportBatches: RecentImportBatch[];
    todayFlashcardStudyStats: TodayFlashcardStudyStats;
    recentStudySessions: RecentStudySession[];
    todayQuizStats: TodayQuizStats;
};

export type TodayQuizStats = {
    quizCount: number;
    questionCount: number;
    correctCount: number;
    wrongCount: number;
};

type QuizSessionRow = {
    question_count: number;
    correct_count: number;
    wrong_count: number;
};

function summarizeTodayQuizSessions(rows: QuizSessionRow[]): TodayQuizStats {
    return rows.reduce(
        (summary, row) => ({
            quizCount: summary.quizCount + 1,
            questionCount: summary.questionCount + row.question_count,
            correctCount: summary.correctCount + row.correct_count,
            wrongCount: summary.wrongCount + row.wrong_count,
        }),
        {
            quizCount: 0,
            questionCount: 0,
            correctCount: 0,
            wrongCount: 0,
        },
    );
}

type VocabularyLevelRow = {
    level: string;
};

type ImportBatchRow = {
    id: string;
    source_type: string;
    total_files: number;
    total_rows: number;
    imported_count: number;
    duplicate_count: number;
    error_count: number;
    created_at: string;
};

export type TodayFlashcardStudyStats = {
    reviewedCount: number;
    rememberedCount: number;
    forgotCount: number;
};

type FlashcardStudySessionRow = {
    reviewed_count: number;
    remembered_count: number;
    forgot_count: number;
};

type RecentStudySessionRow = {
    id: string;
    reviewed_count: number;
    remembered_count: number;
    forgot_count: number;
    level: string | null;
    book: string | null;
    chapter: string | null;
    only_difficult: boolean;
    created_at: string;
};

function getTodayStartIsoString() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return today.toISOString();
}

function summarizeTodayFlashcardStudySessions(
    rows: FlashcardStudySessionRow[],
): TodayFlashcardStudyStats {
    return rows.reduce(
        (summary, row) => ({
            reviewedCount: summary.reviewedCount + row.reviewed_count,
            rememberedCount: summary.rememberedCount + row.remembered_count,
            forgotCount: summary.forgotCount + row.forgot_count,
        }),
        {
            reviewedCount: 0,
            rememberedCount: 0,
            forgotCount: 0,
        },
    );
}

function countByLevel(rows: VocabularyLevelRow[]) {
    const levelCountMap = new Map<string, number>();

    rows.forEach((row) => {
        const currentCount = levelCountMap.get(row.level) ?? 0;
        levelCountMap.set(row.level, currentCount + 1);
    });

    return Array.from(levelCountMap.entries())
        .map(([level, count]) => ({
            level,
            count,
        }))
        .sort((first, second) => first.level.localeCompare(second.level));
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const [
        vocabularyCountResult,
        difficultCountResult,
        vocabularyLevelsResult,
        recentImportBatchesResult,
        todayFlashcardSessionsResult,
        recentStudySessionsResult,
        todayQuizSessionsResult,
    ] = await Promise.all([
        supabase.from("vocabularies").select("id", {
            count: "exact",
            head: true,
        }),

        supabase
            .from("vocabularies")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq("is_difficult", true),

        supabase.from("vocabularies").select("level"),

        supabase
            .from("import_batches")
            .select(
                [
                    "id",
                    "source_type",
                    "total_files",
                    "total_rows",
                    "imported_count",
                    "duplicate_count",
                    "error_count",
                    "created_at",
                ].join(","),
            )
            .order("created_at", { ascending: false })
            .limit(5),

        supabase
            .from("flashcard_study_sessions")
            .select("reviewed_count, remembered_count, forgot_count")
            .gte("created_at", getTodayStartIsoString()),

        supabase
            .from("flashcard_study_sessions")
            .select(
                [
                    "id",
                    "reviewed_count",
                    "remembered_count",
                    "forgot_count",
                    "level",
                    "book",
                    "chapter",
                    "only_difficult",
                    "created_at",
                ].join(","),
            )
            .order("created_at", { ascending: false })
            .limit(5),

        supabase
            .from("quiz_sessions")
            .select("question_count, correct_count, wrong_count")
            .gte("created_at", getTodayStartIsoString()),
    ]);

    if (vocabularyCountResult.error) {
        throw vocabularyCountResult.error;
    }

    if (difficultCountResult.error) {
        throw difficultCountResult.error;
    }

    if (vocabularyLevelsResult.error) {
        throw vocabularyLevelsResult.error;
    }

    if (recentImportBatchesResult.error) {
        throw recentImportBatchesResult.error;
    }

    if (todayFlashcardSessionsResult.error) {
        throw todayFlashcardSessionsResult.error;
    }

    if (recentStudySessionsResult.error) {
        throw recentStudySessionsResult.error;
    }

    if (todayQuizSessionsResult.error) {
        throw todayQuizSessionsResult.error;
    }

    return {
        todayQuizStats: summarizeTodayQuizSessions(
            (todayQuizSessionsResult.data ?? []) as QuizSessionRow[],
        ),

        todayFlashcardStudyStats: summarizeTodayFlashcardStudySessions(
            (todayFlashcardSessionsResult.data ?? []) as FlashcardStudySessionRow[],
        ),
        recentStudySessions: ((recentStudySessionsResult.data ??
            []) as unknown as RecentStudySessionRow[]).map((row) => ({
                id: row.id,
                reviewedCount: row.reviewed_count,
                rememberedCount: row.remembered_count,
                forgotCount: row.forgot_count,
                level: row.level,
                book: row.book,
                chapter: row.chapter,
                onlyDifficult: row.only_difficult,
                createdAt: row.created_at,
            })),
        totalVocabularyCount: vocabularyCountResult.count ?? 0,
        difficultVocabularyCount: difficultCountResult.count ?? 0,
        levelStats: countByLevel(
            (vocabularyLevelsResult.data ?? []) as VocabularyLevelRow[],
        ),
        recentImportBatches: ((recentImportBatchesResult.data ??
            []) as unknown as ImportBatchRow[]).map((row) => ({
                id: row.id,
                sourceType: row.source_type,
                totalFiles: row.total_files,
                totalRows: row.total_rows,
                importedCount: row.imported_count,
                duplicateCount: row.duplicate_count,
                errorCount: row.error_count,
                createdAt: row.created_at,
            })),
    };
}
