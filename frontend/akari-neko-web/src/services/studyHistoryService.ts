import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/services/authService";

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

export type StudyHistorySummary = {
    reviewedCount: number;
    rememberedCount: number;
    forgotCount: number;
};

export type GetStudyHistoriesParams = {
    page: number;
    pageSize: number;
    fromDate?: string | null;
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
    fromDate = null,
}: GetStudyHistoriesParams): Promise<GetStudyHistoriesResult> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const userId = await getCurrentUserId();

    if (!userId) {
        return {
            items: [],
            totalCount: 0,
        };
    }

    let query = supabase
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
        .range(from, to)
        .eq("user_id", userId);

    if (fromDate) {
        query = query.gte("created_at", fromDate);
    }

    const { data, error, count } = await query;

    if (error) {
        throw error;
    }

    return {
        items: ((data ?? []) as unknown as StudyHistoryRow[]).map(mapStudyHistoryRow),
        totalCount: count ?? 0,
    };
}

export async function deleteStudyHistory(historyId: string): Promise<void> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { error } = await supabase
        .from("flashcard_study_sessions")
        .delete()
        .eq("id", historyId)
        .eq("user_id", userId);

    if (error) {
        throw error;
    }
}

export async function getStudyHistorySummary(
    fromDate?: string | null,
): Promise<StudyHistorySummary> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return {
            reviewedCount: 0,
            rememberedCount: 0,
            forgotCount: 0,
        };
    }

    let query = supabase
        .from("flashcard_study_sessions")
        .select("reviewed_count, remembered_count, forgot_count")
        .eq("user_id", userId);

    if (fromDate) {
        query = query.gte("created_at", fromDate);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return (data ?? []).reduce(
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
