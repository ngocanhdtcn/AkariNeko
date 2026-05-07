import { supabase } from "@/lib/supabaseClient";
import { normalizeVocabularyTextFields } from "@/lib/vocabularyTextNormalizer";
import {
    getDifficultVocabularyIds,
    mergeVocabulariesWithCurrentUserProgress,
    setVocabularyDifficult,
} from "@/services/userVocabularyProgressService";

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
    chapters?: string[];
    onlyDifficult?: boolean;
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
    created_at: string;
};

export type VocabularyFilterOptions = {
    levels: string[];
    books: string[];
    chapters: string[];
};

const JLPT_LEVEL_ORDER = ["N5", "N4", "N3", "N2", "N1"];
const VOCABULARY_OPTION_PAGE_SIZE = 1000;
const VOCABULARY_FILTER_OPTIONS_CACHE_TTL_MS = 60_000;
let vocabularyOptionRowsCache:
    | {
        expiresAt: number;
        promise: Promise<VocabularyOptionRow[]>;
    }
    | null = null;

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
        correctCount: 0,
        wrongCount: 0,
        isDifficult: false,
        createdAt: row.created_at,
    };
}

type VocabularyOptionRow = {
    level?: string | null;
    book?: string | null;
    chapter?: string | null;
};

function sortJlptLevels(levels: string[]) {
    return [...levels].sort((firstLevel, secondLevel) => {
        const firstIndex = JLPT_LEVEL_ORDER.indexOf(firstLevel);
        const secondIndex = JLPT_LEVEL_ORDER.indexOf(secondLevel);

        if (firstIndex !== -1 && secondIndex !== -1) {
            return firstIndex - secondIndex;
        }

        if (firstIndex !== -1) {
            return -1;
        }

        if (secondIndex !== -1) {
            return 1;
        }

        return firstLevel.localeCompare(secondLevel);
    });
}

function getUniqueStringOptions(values: Array<string | null | undefined>) {
    return Array.from(
        new Set(values.filter((value): value is string => Boolean(value))),
    ).sort();
}

export function invalidateVocabularyFilterOptionsCache() {
    vocabularyOptionRowsCache = null;
}

async function fetchAllVocabularyOptionRows(): Promise<VocabularyOptionRow[]> {
    const rows: VocabularyOptionRow[] = [];
    let from = 0;

    while (true) {
        const to = from + VOCABULARY_OPTION_PAGE_SIZE - 1;
        const query = supabase
            .from("vocabularies")
            .select("level, book, chapter")
            .range(from, to);

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        const pageRows = (data ?? []) as VocabularyOptionRow[];
        rows.push(...pageRows);

        if (pageRows.length < VOCABULARY_OPTION_PAGE_SIZE) {
            break;
        }

        from += VOCABULARY_OPTION_PAGE_SIZE;
    }

    return rows;
}

function getCachedVocabularyOptionRows(): Promise<VocabularyOptionRow[]> {
    const now = Date.now();

    if (vocabularyOptionRowsCache && vocabularyOptionRowsCache.expiresAt > now) {
        return vocabularyOptionRowsCache.promise;
    }

    vocabularyOptionRowsCache = {
        expiresAt: now + VOCABULARY_FILTER_OPTIONS_CACHE_TTL_MS,
        promise: fetchAllVocabularyOptionRows(),
    };

    return vocabularyOptionRowsCache.promise;
}

export async function getVocabularies({
    page,
    pageSize,
    searchKeyword = "",
    level = "All",
    book = "All",
    chapter = "All",
    chapters,
    onlyDifficult = false,
}: GetVocabulariesParams): Promise<GetVocabulariesResult> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const normalizedSearchKeyword = searchKeyword.trim();
    const difficultVocabularyIds = onlyDifficult
        ? await getDifficultVocabularyIds()
        : [];

    if (onlyDifficult && difficultVocabularyIds.length === 0) {
        return {
            items: [],
            totalCount: 0,
        };
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

    const items = ((data ?? []) as unknown as VocabularyRow[]).map(
        mapVocabularyRow,
    );

    return {
        items: await mergeVocabulariesWithCurrentUserProgress(items),
        totalCount: count ?? 0,
    };
}

export type GetVocabularyFilterOptionsParams = {
    level?: string;
    book?: string;
};

export async function getVocabularyFilterOptions({
    level = "All",
    book = "All",
}: GetVocabularyFilterOptionsParams = {}): Promise<VocabularyFilterOptions> {
    const allRows = await getCachedVocabularyOptionRows();
    const bookRows =
        level === "All"
            ? allRows
            : allRows.filter((row) => row.level === level);
    const chapterRows = bookRows.filter(
        (row) => book === "All" || row.book === book,
    );

    return {
        levels: sortJlptLevels(
            getUniqueStringOptions(allRows.map((row) => row.level)),
        ),
        books: getUniqueStringOptions(bookRows.map((row) => row.book)),
        chapters: getUniqueStringOptions(chapterRows.map((row) => row.chapter)),
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

    invalidateVocabularyFilterOptionsCache();
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
    const normalizedInput = normalizeVocabularyTextFields(input);

    const { data: existingVocabulary, error: duplicateCheckError } = await supabase
        .from("vocabularies")
        .select("id")
        .eq("book", normalizedInput.book.trim())
        .eq("level", normalizedInput.level.trim())
        .eq("chapter", normalizedInput.chapter.trim())
        .eq("kanji", normalizedInput.kanji.trim())
        .eq("hiragana", normalizedInput.hiragana.trim())
        .neq("id", normalizedInput.id)
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
            book: normalizedInput.book.trim(),
            level: normalizedInput.level.trim(),
            chapter: normalizedInput.chapter.trim(),
            kanji: normalizedInput.kanji.trim(),
            hiragana: normalizedInput.hiragana.trim(),
            meaning: normalizedInput.meaning.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", normalizedInput.id);

    if (error) {
        throw error;
    }

    invalidateVocabularyFilterOptionsCache();
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
    const normalizedInput = normalizeVocabularyTextFields(input);

    const { data: existingVocabulary, error: duplicateCheckError } = await supabase
        .from("vocabularies")
        .select("id")
        .eq("book", normalizedInput.book.trim())
        .eq("level", normalizedInput.level.trim())
        .eq("chapter", normalizedInput.chapter.trim())
        .eq("kanji", normalizedInput.kanji.trim())
        .eq("hiragana", normalizedInput.hiragana.trim())
        .maybeSingle();

    if (duplicateCheckError) {
        throw duplicateCheckError;
    }

    if (existingVocabulary) {
        throw new DuplicateVocabularyError();
    }

    const { error } = await supabase.from("vocabularies").insert({
        book: normalizedInput.book.trim(),
        level: normalizedInput.level.trim(),
        chapter: normalizedInput.chapter.trim(),
        kanji: normalizedInput.kanji.trim(),
        hiragana: normalizedInput.hiragana.trim(),
        meaning: normalizedInput.meaning.trim(),
    });

    if (error) {
        throw error;
    }

    invalidateVocabularyFilterOptionsCache();
}

export async function getRecentVocabularies(
    limitCount = 5,
): Promise<VocabularyListItem[]> {
    const { data, error } = await supabase
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

    if (error) {
        throw error;
    }

    const items = ((data ?? []) as unknown as VocabularyRow[]).map(mapVocabularyRow);

    return mergeVocabulariesWithCurrentUserProgress(items);
}

export async function updateVocabularyDifficulty(
    vocabularyId: string,
    isDifficult: boolean,
): Promise<void> {
    await setVocabularyDifficult(vocabularyId, isDifficult);
}
