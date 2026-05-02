import { supabase } from "@/lib/supabaseClient";
import type { VocabularyListItem } from "@/services/vocabularyService";

type VocabularyRow = {
    id: string;
    book: string;
    level: string;
    chapter: string;
    kanji: string;
    hiragana: string;
    meaning: string;
    correct_count: number;
    wrong_count: number;
    is_difficult: boolean;
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
        correctCount: row.correct_count,
        wrongCount: row.wrong_count,
        isDifficult: row.is_difficult,
        createdAt: row.created_at,
    };
}

export type GetFlashcardVocabulariesParams = {
    level?: string;
    book?: string;
    chapter?: string;
    onlyDifficult?: boolean;
    limitCount?: number;
};

export async function getFlashcardVocabularies({
    level = "All",
    book = "All",
    chapter = "All",
    onlyDifficult = false,
    limitCount = 100,
}: GetFlashcardVocabulariesParams): Promise<VocabularyListItem[]> {
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
                "correct_count",
                "wrong_count",
                "is_difficult",
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

    if (chapter !== "All") {
        query = query.eq("chapter", chapter);
    }

    if (onlyDifficult) {
        query = query.eq("is_difficult", true);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return ((data ?? []) as unknown as VocabularyRow[]).map(mapVocabularyRow);
}

export type ReviewFlashcardResult = "remember" | "forgot";

export async function reviewFlashcard(
    vocabulary: VocabularyListItem,
    result: ReviewFlashcardResult,
): Promise<void> {
    const nextCorrectCount =
        result === "remember"
            ? vocabulary.correctCount + 1
            : vocabulary.correctCount;

    const nextWrongCount =
        result === "forgot" ? vocabulary.wrongCount + 1 : vocabulary.wrongCount;

    const shouldMarkDifficult =
        vocabulary.isDifficult || nextWrongCount >= nextCorrectCount + 2;

    const { error } = await supabase
        .from("vocabularies")
        .update({
            correct_count: nextCorrectCount,
            wrong_count: nextWrongCount,
            is_difficult: shouldMarkDifficult,
            updated_at: new Date().toISOString(),
        })
        .eq("id", vocabulary.id);

    if (error) {
        throw error;
    }
}