import { supabase } from "@/lib/supabaseClient";

export type VocabularyListItem = {
    id: string;
    book: string;
    level: string;
    chapter: string;
    kanji: string;
    hiragana: string;
    meaning: string;
    correctCount: number;
    wrongCount: number;
    isDifficult: boolean;
    createdAt: string;
};

export type GetVocabulariesParams = {
    page: number;
    pageSize: number;
    searchKeyword?: string;
    level?: string;
    book?: string;
    chapter?: string;
};

export type GetVocabulariesResult = {
    items: VocabularyListItem[];
    totalCount: number;
};

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

export type VocabularyFilterOptions = {
    levels: string[];
    books: string[];
    chapters: string[];
};

export class DuplicateVocabularyError extends Error {
    constructor() {
        super("Vocabulary already exists in the selected Book / Level / Chapter.");
        this.name = "DuplicateVocabularyError";
    }
}

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

export async function getVocabularies({
    page = 1,
    pageSize = 15,
    searchKeyword = "",
    level = "All",
    book = "All",
    chapter = "All",
}: Partial<GetVocabulariesParams> = {}): Promise<GetVocabulariesResult> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const normalizedSearchKeyword = searchKeyword.trim();

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
            { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to);

    if (level !== "All") {
        query = query.eq("level", level);
    }

    if (book !== "All") {
        query = query.eq("book", book);
    }

    if (chapter !== "All") {
        query = query.eq("chapter", chapter);
    }

    if (normalizedSearchKeyword.length > 0) {
        query = query.or(
            [
                `kanji.ilike.%${normalizedSearchKeyword}%`,
                `hiragana.ilike.%${normalizedSearchKeyword}%`,
                `meaning.ilike.%${normalizedSearchKeyword}%`,
                `book.ilike.%${normalizedSearchKeyword}%`,
                `chapter.ilike.%${normalizedSearchKeyword}%`,
            ].join(","),
        );
    }

    const { data, error, count } = await query;

    if (error) {
        throw error;
    }

    return {
        items: ((data ?? []) as unknown as VocabularyRow[]).map(mapVocabularyRow),
        totalCount: count ?? 0,
    };
}

export async function getVocabularyFilterOptions(): Promise<VocabularyFilterOptions> {
    const { data, error } = await supabase
        .from("vocabularies")
        .select("level, book, chapter");

    if (error) {
        throw error;
    }

    const rows = data ?? [];

    return {
        levels: Array.from(new Set(rows.map((row) => row.level).filter(Boolean))).sort(),
        books: Array.from(new Set(rows.map((row) => row.book).filter(Boolean))).sort(),
        chapters: Array.from(
            new Set(rows.map((row) => row.chapter).filter(Boolean)),
        ).sort(),
    };
}

export async function deleteVocabulary(vocabularyId: string): Promise<void> {
    const { error } = await supabase
        .from("vocabularies")
        .delete()
        .eq("id", vocabularyId);

    if (error) {
        throw error;
    }
}

export type UpdateVocabularyInput = {
    id: string;
    book: string;
    level: string;
    chapter: string;
    kanji: string;
    hiragana: string;
    meaning: string;
};

export async function updateVocabulary(input: UpdateVocabularyInput): Promise<void> {
    const { data: existingVocabulary, error: duplicateCheckError } = await supabase
        .from("vocabularies")
        .select("id")
        .eq("book", input.book.trim())
        .eq("level", input.level.trim())
        .eq("chapter", input.chapter.trim())
        .eq("kanji", input.kanji.trim())
        .eq("hiragana", input.hiragana.trim())
        .neq("id", input.id)
        .maybeSingle();

    if (duplicateCheckError) {
        throw duplicateCheckError;
    }

    if (existingVocabulary) {
        throw new DuplicateVocabularyError();
    }

    const { error } = await supabase
        .from("vocabularies")
        .update({
            book: input.book.trim(),
            level: input.level.trim(),
            chapter: input.chapter.trim(),
            kanji: input.kanji.trim(),
            hiragana: input.hiragana.trim(),
            meaning: input.meaning.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);

    if (error) {
        throw error;
    }
}

export type CreateVocabularyInput = {
    book: string;
    level: string;
    chapter: string;
    kanji: string;
    hiragana: string;
    meaning: string;
};

export async function createVocabulary(
    input: CreateVocabularyInput,
): Promise<void> {
    const { data: existingVocabulary, error: duplicateCheckError } = await supabase
        .from("vocabularies")
        .select("id")
        .eq("book", input.book.trim())
        .eq("level", input.level.trim())
        .eq("chapter", input.chapter.trim())
        .eq("kanji", input.kanji.trim())
        .eq("hiragana", input.hiragana.trim())
        .maybeSingle();

    if (duplicateCheckError) {
        throw duplicateCheckError;
    }

    if (existingVocabulary) {
        throw new DuplicateVocabularyError();
    }

    const { error } = await supabase.from("vocabularies").insert({
        book: input.book.trim(),
        level: input.level.trim(),
        chapter: input.chapter.trim(),
        kanji: input.kanji.trim(),
        hiragana: input.hiragana.trim(),
        meaning: input.meaning.trim(),
    });

    if (error) {
        throw error;
    }
}
