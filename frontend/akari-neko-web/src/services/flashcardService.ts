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

export type GetFlashcardVocabulariesParams = {
    level?: string;
    book?: string;
    chapter?: string;
    chapters?: string[];
    onlyDifficult?: boolean;
    limitCount?: number;
};

export async function getFlashcardVocabularies({
    level = "All",
    book = "All",
    chapter = "All",
    chapters,
    onlyDifficult = false,
    limitCount = 100,
}: GetFlashcardVocabulariesParams): Promise<VocabularyListItem[]> {
    const difficultVocabularyIds = onlyDifficult
        ? await getDifficultVocabularyIds()
        : [];

    if (onlyDifficult && difficultVocabularyIds.length === 0) {
        return [];
    }

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
        .limit(limitCount);

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

    const items = ((data ?? []) as unknown as VocabularyRow[]).map(mapVocabularyRow);

    return mergeVocabulariesWithCurrentUserProgress(items);
}

export type ReviewFlashcardResult = "remember" | "forgot";

export async function reviewFlashcard(
    vocabulary: VocabularyListItem,
    result: ReviewFlashcardResult,
): Promise<void> {
    await upsertVocabularyProgressReview(vocabulary, result === "remember");
}

export type CreateFlashcardStudySessionInput = {
    reviewedCount: number;
    rememberedCount: number;
    forgotCount: number;
    level: string;
    book: string;
    chapter: string;
    onlyDifficult: boolean;
};

export async function createFlashcardStudySession(
    input: CreateFlashcardStudySessionInput,
): Promise<void> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { error } = await supabase.from("flashcard_study_sessions").insert({
        user_id: userId,
        reviewed_count: input.reviewedCount,
        remembered_count: input.rememberedCount,
        forgot_count: input.forgotCount,
        level: input.level === "All" ? null : input.level,
        book: input.book === "All" ? null : input.book,
        chapter: input.chapter === "All" ? null : input.chapter,
        only_difficult: input.onlyDifficult,
    });

    if (error) {
        throw error;
    }
}
