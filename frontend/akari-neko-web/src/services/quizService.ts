import { supabase } from "@/lib/supabaseClient";
import type { VocabularyListItem } from "@/services/vocabularyService";
import { getCurrentUserId } from "@/services/authService";
import {
    getDifficultVocabularyIds,
    mergeVocabulariesWithCurrentUserProgress,
    upsertVocabularyProgressReview,
} from "@/services/userVocabularyProgressService";

type VocabularyRow = {
    id: string;
    book: string;
    level: string;
    chapter: string;
    kanji: string;
    hiragana: string;
    meaning: string;
    created_at: string;
};

const QUIZ_VOCABULARY_PAGE_SIZE = 250;

function mapVocabularyRow(row: VocabularyRow): VocabularyListItem {
    return {
        id: row.id,
        book: row.book,
        level: row.level,
        chapter: row.chapter,
        kanji: row.kanji,
        hiragana: row.hiragana,
        meaning: row.meaning,
        correctCount: 0,
        wrongCount: 0,
        isDifficult: false,
        createdAt: row.created_at,
    };
}

export type GetQuizVocabulariesParams = {
    level?: string;
    book?: string;
    chapter?: string;
    chapters?: string[];
    onlyDifficult?: boolean;
    limitCount?: number;
};

export type QuizAnswerResult = "correct" | "wrong";

export async function getQuizVocabularies({
    level = "All",
    book = "All",
    chapter = "All",
    chapters,
    onlyDifficult = false,
    limitCount = QUIZ_VOCABULARY_PAGE_SIZE,
}: GetQuizVocabulariesParams): Promise<VocabularyListItem[]> {
    const rows: VocabularyRow[] = [];
    let from = 0;
    const difficultVocabularyIds = onlyDifficult
        ? await getDifficultVocabularyIds()
        : [];

    if (onlyDifficult && difficultVocabularyIds.length === 0) {
        return [];
    }

    while (rows.length < limitCount) {
        const to = Math.min(
            from + QUIZ_VOCABULARY_PAGE_SIZE - 1,
            limitCount - 1,
        );

        let query = supabase
            .from("vocabularies")
            .select(
                [
                    "id",
                    "book",
                    "level",
                    "chapter",
                    "kanji",
                    "hiragana",
                    "meaning",
                    "created_at",
                ].join(","),
            )
            .order("created_at", { ascending: false })
            .range(from, to);

        if (level !== "All") {
            query = query.eq("level", level);
        }

        if (book !== "All") {
            query = query.eq("book", book);
        }

        const selectedChapters =
            chapters?.filter((item) => item && item !== "All") ??
            (chapter !== "All" ? [chapter] : []);

        if (selectedChapters.length > 0) {
            query = query.in("chapter", selectedChapters);
        } else if (chapter !== "All") {
            query = query.eq("chapter", chapter);
        }

        if (onlyDifficult) {
            query = query.in("id", difficultVocabularyIds);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        const pageRows = (data ?? []) as unknown as VocabularyRow[];
        rows.push(...pageRows);

        if (pageRows.length < to - from + 1) {
            break;
        }

        from += QUIZ_VOCABULARY_PAGE_SIZE;
    }

    return mergeVocabulariesWithCurrentUserProgress(rows.map(mapVocabularyRow));
}

export async function reviewQuizAnswer(
    vocabulary: VocabularyListItem,
    result: QuizAnswerResult,
): Promise<void> {
    await upsertVocabularyProgressReview(vocabulary, result === "correct");
}

export type CreateQuizSessionInput = {
    questionCount: number;
    correctCount: number;
    wrongCount: number;
    scorePercent: number;
    level: string;
    book: string;
    chapter: string;
    onlyDifficult: boolean;
};

export async function createQuizSession(
    input: CreateQuizSessionInput,
): Promise<void> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { error } = await supabase.from("quiz_sessions").insert({
        user_id: userId,
        question_count: input.questionCount,
        correct_count: input.correctCount,
        wrong_count: input.wrongCount,
        score_percent: input.scorePercent,
        level: input.level === "All" ? null : input.level,
        book: input.book === "All" ? null : input.book,
        chapter: input.chapter === "All" ? null : input.chapter,
        only_difficult: input.onlyDifficult,
    });

    if (error) {
        throw error;
    }
}
