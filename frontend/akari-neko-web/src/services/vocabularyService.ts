import { supabase } from "@/lib/supabaseClient";
import { normalizeVocabularyTextFields } from "@/lib/vocabularyTextNormalizer";
import {
    getDifficultVocabularyIds,
    getLearnedVocabularyIds,
    mergeVocabulariesWithCurrentUserProgress,
    resetVocabularyLearnedStatuses,
    setVocabularyDifficult,
    setVocabularyLearned,
} from "@/services/userVocabularyProgressService";
import {
    getStudentLockedJlptLevel,
    requireAdminContentAccess,
} from "@/services/studentAccessService";

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
    isLearned: boolean;
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
    learnedFilter?: VocabularyLearnedFilter;
    showLearned?: boolean;
};

export type VocabularyLearnedFilter = "all" | "learned" | "unlearned";

export type GetVocabulariesResult = {
    items: VocabularyListItem[];
    totalCount: number;
    hiddenLearnedCount: number;
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
const VOCABULARY_LIST_DEDUPE_FETCH_PAGE_SIZE = 1000;
const VOCABULARY_BULK_UPDATE_PAGE_SIZE = 1000;
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
        isLearned: false,
        createdAt: row.created_at,
    };
}

function normalizeVocabularyDisplayKeyPart(value: string) {
    return value.trim().toLocaleLowerCase();
}

function getVocabularyDisplayKey(
    vocabulary: Pick<VocabularyRow, "kanji" | "hiragana">,
) {
    return [
        normalizeVocabularyDisplayKeyPart(vocabulary.kanji),
        normalizeVocabularyDisplayKeyPart(vocabulary.hiragana),
    ].join("|");
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

function getVocabularyChapterLessonNumber(chapter: string) {
    const normalizedChapter = chapter.trim();
    const numericOnlyMatch = normalizedChapter.match(/^\d+$/u);

    if (numericOnlyMatch) {
        return Number(numericOnlyMatch[0]);
    }

    const lessonMatch = normalizedChapter.match(
        /^(?:bài|bai|lesson|chapter|chap)\s*(\d+)\b/iu,
    );

    return lessonMatch ? Number(lessonMatch[1]) : null;
}

function compareVocabularyChapters(firstChapter: string, secondChapter: string) {
    const firstLessonNumber = getVocabularyChapterLessonNumber(firstChapter);
    const secondLessonNumber = getVocabularyChapterLessonNumber(secondChapter);

    if (firstLessonNumber !== null && secondLessonNumber !== null) {
        if (firstLessonNumber !== secondLessonNumber) {
            return firstLessonNumber - secondLessonNumber;
        }

        return firstChapter.localeCompare(secondChapter, "vi", {
            numeric: true,
            sensitivity: "base",
        });
    }

    return firstChapter.localeCompare(secondChapter, "vi", {
        sensitivity: "base",
    });
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

async function getDedupedStudentVocabularyPage({
    page,
    pageSize,
    searchKeyword,
    effectiveLevel,
    book,
    chapter,
    chapters,
    onlyDifficult,
    difficultVocabularyIds,
    learnedVocabularyIds,
    effectiveLearnedFilter,
    hiddenLearnedCount,
}: {
    page: number;
    pageSize: number;
    searchKeyword: string;
    effectiveLevel: string;
    book: string;
    chapter: string;
    chapters?: string[];
    onlyDifficult: boolean;
    difficultVocabularyIds: string[];
    learnedVocabularyIds: string[];
    effectiveLearnedFilter: VocabularyLearnedFilter;
    hiddenLearnedCount: number;
}): Promise<GetVocabulariesResult> {
    const selectedChapters =
        chapters?.filter((item) => item && item !== "All") ??
        (chapter !== "All" ? [chapter] : []);
    const uniqueRows: VocabularyRow[] = [];
    const seenDisplayKeys = new Set<string>();
    let from = 0;

    while (true) {
        const to = from + VOCABULARY_LIST_DEDUPE_FETCH_PAGE_SIZE - 1;
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
            .order("id", { ascending: false })
            .range(from, to);

        if (effectiveLevel !== "All") {
            query = query.eq("level", effectiveLevel);
        }

        if (book !== "All") {
            query = query.eq("book", book);
        }

        if (selectedChapters.length > 0) {
            query = query.in("chapter", selectedChapters);
        } else if (chapter !== "All") {
            query = query.eq("chapter", chapter);
        }

        if (onlyDifficult) {
            query = query.in("id", difficultVocabularyIds);
        }

        if (effectiveLearnedFilter === "learned") {
            query = query.in("id", learnedVocabularyIds);
        }

        if (searchKeyword.length > 0) {
            query = query.or(
                [
                    `kanji.ilike.%${searchKeyword}%`,
                    `hiragana.ilike.%${searchKeyword}%`,
                    `meaning.ilike.%${searchKeyword}%`,
                    `book.ilike.%${searchKeyword}%`,
                    `chapter.ilike.%${searchKeyword}%`,
                ].join(","),
            );
        }

        if (effectiveLearnedFilter === "unlearned" && learnedVocabularyIds.length > 0) {
            query = query.not("id", "in", `(${learnedVocabularyIds.join(",")})`);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        const pageRows = (data ?? []) as unknown as VocabularyRow[];

        for (const row of pageRows) {
            const displayKey = getVocabularyDisplayKey(row);

            if (seenDisplayKeys.has(displayKey)) {
                continue;
            }

            seenDisplayKeys.add(displayKey);
            uniqueRows.push(row);
        }

        if (pageRows.length < VOCABULARY_LIST_DEDUPE_FETCH_PAGE_SIZE) {
            break;
        }

        from += VOCABULARY_LIST_DEDUPE_FETCH_PAGE_SIZE;
    }

    const pageStartIndex = (page - 1) * pageSize;
    const pageRows = uniqueRows.slice(pageStartIndex, pageStartIndex + pageSize);
    const items = pageRows.map(mapVocabularyRow);

    return {
        items: await mergeVocabulariesWithCurrentUserProgress(items),
        totalCount: uniqueRows.length,
        hiddenLearnedCount,
    };
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
    learnedFilter,
    showLearned = false,
}: GetVocabulariesParams): Promise<GetVocabulariesResult> {
    const lockedLevel = await getStudentLockedJlptLevel();
    const effectiveLevel = lockedLevel ?? level;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const normalizedSearchKeyword = searchKeyword.trim();
    const difficultVocabularyIds = onlyDifficult
        ? await getDifficultVocabularyIds()
        : [];
    const learnedVocabularyIds = await getLearnedVocabularyIds();
    const effectiveLearnedFilter: VocabularyLearnedFilter =
        learnedFilter ?? (showLearned ? "all" : "unlearned");

    if (
        (onlyDifficult && difficultVocabularyIds.length === 0) ||
        (effectiveLearnedFilter === "learned" && learnedVocabularyIds.length === 0)
    ) {
        return {
            items: [],
            totalCount: 0,
            hiddenLearnedCount: 0,
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
        .order("id", { ascending: false })
        .range(from, to);

    if (effectiveLevel !== "All") {
        query = query.eq("level", effectiveLevel);
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

    if (effectiveLearnedFilter === "learned") {
        query = query.in("id", learnedVocabularyIds);
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

    if (effectiveLearnedFilter === "unlearned" && learnedVocabularyIds.length > 0) {
        query = query.not("id", "in", `(${learnedVocabularyIds.join(",")})`);
    }

    let hiddenLearnedCount = 0;

    if (learnedVocabularyIds.length > 0) {
        let hiddenLearnedQuery = supabase
            .from("vocabularies")
            .select("id", { count: "exact", head: true });

        if (effectiveLevel !== "All") {
            hiddenLearnedQuery = hiddenLearnedQuery.eq("level", effectiveLevel);
        }

        if (book !== "All") {
            hiddenLearnedQuery = hiddenLearnedQuery.eq("book", book);
        }

        if (selectedChapters.length > 0) {
            hiddenLearnedQuery = hiddenLearnedQuery.in("chapter", selectedChapters);
        } else if (chapter !== "All") {
            hiddenLearnedQuery = hiddenLearnedQuery.eq("chapter", chapter);
        }

        if (onlyDifficult) {
            hiddenLearnedQuery = hiddenLearnedQuery.in("id", difficultVocabularyIds);
        }

        if (normalizedSearchKeyword.length > 0) {
            hiddenLearnedQuery = hiddenLearnedQuery.or(
                [
                    `kanji.ilike.%${normalizedSearchKeyword}%`,
                    `hiragana.ilike.%${normalizedSearchKeyword}%`,
                    `meaning.ilike.%${normalizedSearchKeyword}%`,
                    `book.ilike.%${normalizedSearchKeyword}%`,
                    `chapter.ilike.%${normalizedSearchKeyword}%`,
                ].join(","),
            );
        }

        const { count: learnedCount, error: learnedCountError } =
            await hiddenLearnedQuery.in("id", learnedVocabularyIds);

        if (learnedCountError) {
            throw learnedCountError;
        }

        hiddenLearnedCount = learnedCount ?? 0;
    }

    if (lockedLevel) {
        return getDedupedStudentVocabularyPage({
            page,
            pageSize,
            searchKeyword: normalizedSearchKeyword,
            effectiveLevel,
            book,
            chapter,
            chapters,
            onlyDifficult,
            difficultVocabularyIds,
            learnedVocabularyIds,
            effectiveLearnedFilter,
            hiddenLearnedCount,
        });
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
        hiddenLearnedCount,
    };
}

function applyVocabularyFilters<TQuery extends {
    eq: (column: string, value: string) => TQuery;
    in: (column: string, values: string[]) => TQuery;
    or: (filters: string) => TQuery;
}>(
    query: TQuery,
    {
        effectiveLevel,
        book,
        chapter,
        chapters,
        onlyDifficult,
        difficultVocabularyIds,
        searchKeyword,
    }: {
        effectiveLevel: string;
        book: string;
        chapter: string;
        chapters?: string[];
        onlyDifficult: boolean;
        difficultVocabularyIds: string[];
        searchKeyword: string;
    },
) {
    let filteredQuery = query;

    if (effectiveLevel !== "All") {
        filteredQuery = filteredQuery.eq("level", effectiveLevel);
    }

    if (book !== "All") {
        filteredQuery = filteredQuery.eq("book", book);
    }

    const selectedChapters =
        chapters?.filter((item) => item && item !== "All") ??
        (chapter !== "All" ? [chapter] : []);

    if (selectedChapters.length > 0) {
        filteredQuery = filteredQuery.in("chapter", selectedChapters);
    } else if (chapter !== "All") {
        filteredQuery = filteredQuery.eq("chapter", chapter);
    }

    if (onlyDifficult) {
        filteredQuery = filteredQuery.in("id", difficultVocabularyIds);
    }

    if (searchKeyword.length > 0) {
        filteredQuery = filteredQuery.or(
            [
                `kanji.ilike.%${searchKeyword}%`,
                `hiragana.ilike.%${searchKeyword}%`,
                `meaning.ilike.%${searchKeyword}%`,
                `book.ilike.%${searchKeyword}%`,
                `chapter.ilike.%${searchKeyword}%`,
            ].join(","),
        );
    }

    return filteredQuery;
}

async function getFilteredVocabularyIds({
    searchKeyword = "",
    level = "All",
    book = "All",
    chapter = "All",
    chapters,
    onlyDifficult = false,
}: Omit<GetVocabulariesParams, "page" | "pageSize" | "showLearned">) {
    const lockedLevel = await getStudentLockedJlptLevel();
    const effectiveLevel = lockedLevel ?? level;
    const normalizedSearchKeyword = searchKeyword.trim();
    const difficultVocabularyIds = onlyDifficult
        ? await getDifficultVocabularyIds()
        : [];

    if (onlyDifficult && difficultVocabularyIds.length === 0) {
        return [];
    }

    const vocabularyIds: string[] = [];
    let from = 0;

    while (true) {
        const to = from + VOCABULARY_BULK_UPDATE_PAGE_SIZE - 1;
        const query = applyVocabularyFilters(
            supabase
                .from("vocabularies")
                .select("id")
                .order("created_at", { ascending: false })
                .order("id", { ascending: false })
                .range(from, to),
            {
                effectiveLevel,
                book,
                chapter,
                chapters,
                onlyDifficult,
                difficultVocabularyIds,
                searchKeyword: normalizedSearchKeyword,
            },
        );

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        const pageRows = (data ?? []) as Array<{ id: string }>;
        vocabularyIds.push(...pageRows.map((row) => row.id));

        if (pageRows.length < VOCABULARY_BULK_UPDATE_PAGE_SIZE) {
            break;
        }

        from += VOCABULARY_BULK_UPDATE_PAGE_SIZE;
    }

    return vocabularyIds;
}

export type GetVocabularyFilterOptionsParams = {
    level?: string;
    book?: string;
};

export async function getVocabularyFilterOptions({
    level = "All",
    book = "All",
}: GetVocabularyFilterOptionsParams = {}): Promise<VocabularyFilterOptions> {
    const lockedLevel = await getStudentLockedJlptLevel();
    const effectiveLevel = lockedLevel ?? level;
    const allRows = await getCachedVocabularyOptionRows();
    const bookRows =
        effectiveLevel === "All"
            ? allRows
            : allRows.filter((row) => row.level === effectiveLevel);
    const chapterRows = bookRows.filter(
        (row) => book === "All" || row.book === book,
    );

    return {
        levels: sortJlptLevels(
            getUniqueStringOptions(
                lockedLevel
                    ? allRows
                        .filter((row) => row.level === lockedLevel)
                        .map((row) => row.level)
                    : allRows.map((row) => row.level),
            ),
        ),
        books: getUniqueStringOptions(bookRows.map((row) => row.book)),
        chapters: getUniqueStringOptions(chapterRows.map((row) => row.chapter)).sort(
            compareVocabularyChapters,
        ),
    };
}

export async function deleteVocabulary(vocabularyId: string): Promise<void> {
    await requireAdminContentAccess();

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
    await requireAdminContentAccess();

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
    await requireAdminContentAccess();

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
    const lockedLevel = await getStudentLockedJlptLevel();
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
        .order("id", { ascending: false })
        .limit(limitCount);

    if (lockedLevel) {
        query = query.eq("level", lockedLevel);
    }

    const { data, error } = await query;

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

export async function updateVocabularyLearned(
    vocabularyId: string,
    isLearned: boolean,
): Promise<void> {
    await setVocabularyLearned(vocabularyId, isLearned);
}

export async function resetFilteredVocabularyLearnedStatuses(
    params: Omit<GetVocabulariesParams, "page" | "pageSize" | "showLearned">,
): Promise<number> {
    const vocabularyIds = await getFilteredVocabularyIds(params);

    return resetVocabularyLearnedStatuses(vocabularyIds);
}
