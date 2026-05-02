import { supabase } from "@/lib/supabaseClient";

export type StudyHistoryItem = {
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

export type GetStudyHistoriesParams = {
    page: number;
    pageSize: number;
};

export type GetStudyHistoriesResult = {
    items: StudyHistoryItem[];
    totalCount: number;
};

type StudyHistoryRow = {
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

function mapStudyHistoryRow(row: StudyHistoryRow): StudyHistoryItem {
    return {
        id: row.id,
        reviewedCount: row.reviewed_count,
        rememberedCount: row.remembered_count,
        forgotCount: row.forgot_count,
        level: row.level,
        book: row.book,
        chapter: row.chapter,
        onlyDifficult: row.only_difficult,
        createdAt: row.created_at,
    };
}

export async function getStudyHistories({
    page,
    pageSize,
}: GetStudyHistoriesParams): Promise<GetStudyHistoriesResult> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
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
            { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        throw error;
    }

    return {
        items: ((data ?? []) as unknown as StudyHistoryRow[]).map(mapStudyHistoryRow),
        totalCount: count ?? 0,
    };
}

export async function deleteStudyHistory(historyId: string): Promise<void> {
    const { error } = await supabase
        .from("flashcard_study_sessions")
        .delete()
        .eq("id", historyId);

    if (error) {
        throw error;
    }
}