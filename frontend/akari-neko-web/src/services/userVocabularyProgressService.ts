import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/services/authService";
import type { VocabularyListItem } from "@/services/vocabularyService";

export type UserVocabularyProgress = {
    correctCount: number;
    wrongCount: number;
    isDifficult: boolean;
    isLearned: boolean;
};

type UserVocabularyProgressRow = {
    vocabulary_id: string;
    correct_count: number | null;
    wrong_count: number | null;
    is_difficult: boolean | null;
    is_learned?: boolean | null;
};

const DEFAULT_PROGRESS: UserVocabularyProgress = {
    correctCount: 0,
    wrongCount: 0,
    isDifficult: false,
    isLearned: false,
};
const PROGRESS_QUERY_BATCH_SIZE = 200;

export class VocabularyLearnedStorageNotReadyError extends Error {
    constructor() {
        super(
            "Database chưa có cột is_learned trong user_vocabulary_progress.",
        );
        this.name = "VocabularyLearnedStorageNotReadyError";
    }
}

function normalizeProgressRow(
    row: UserVocabularyProgressRow | null | undefined,
): UserVocabularyProgress {
    if (!row) {
        return DEFAULT_PROGRESS;
    }

    return {
        correctCount: row.correct_count ?? 0,
        wrongCount: row.wrong_count ?? 0,
        isDifficult: row.is_difficult ?? false,
        isLearned: row.is_learned ?? false,
    };
}

function getUniqueVocabularyIds(vocabularyIds: string[]) {
    return Array.from(new Set(vocabularyIds.filter(Boolean)));
}

export async function getUserVocabularyProgressMap(
    vocabularyIds: string[],
): Promise<Map<string, UserVocabularyProgress>> {
    const userId = await getCurrentUserId();
    const uniqueVocabularyIds = getUniqueVocabularyIds(vocabularyIds);

    if (!userId || uniqueVocabularyIds.length === 0) {
        return new Map();
    }

    const progressMap = new Map<string, UserVocabularyProgress>();

    for (let index = 0; index < uniqueVocabularyIds.length; index += PROGRESS_QUERY_BATCH_SIZE) {
        const vocabularyIdBatch = uniqueVocabularyIds.slice(
            index,
            index + PROGRESS_QUERY_BATCH_SIZE,
        );

        const { data, error } = await supabase
            .from("user_vocabulary_progress")
            .select("vocabulary_id,correct_count,wrong_count,is_difficult")
            .eq("user_id", userId)
            .in("vocabulary_id", vocabularyIdBatch);

        if (error) {
            throw error;
        }

        for (const row of (data ?? []) as UserVocabularyProgressRow[]) {
            progressMap.set(row.vocabulary_id, normalizeProgressRow(row));
        }
    }

    const learnedVocabularyIdSet = new Set(await getLearnedVocabularyIds());

    for (const vocabularyId of uniqueVocabularyIds) {
        if (!learnedVocabularyIdSet.has(vocabularyId)) {
            continue;
        }

        const progress = progressMap.get(vocabularyId) ?? DEFAULT_PROGRESS;
        progressMap.set(vocabularyId, {
            ...progress,
            isLearned: true,
        });
    }

    return progressMap;
}

export function mergeVocabularyWithProgress(
    vocabularies: VocabularyListItem[],
    progressMap: Map<string, UserVocabularyProgress>,
): VocabularyListItem[] {
    return vocabularies.map((vocabulary) => {
        const progress = progressMap.get(vocabulary.id) ?? DEFAULT_PROGRESS;

        return {
            ...vocabulary,
            correctCount: progress.correctCount,
            wrongCount: progress.wrongCount,
            isDifficult: progress.isDifficult,
            isLearned: progress.isLearned,
        };
    });
}

export async function mergeVocabulariesWithCurrentUserProgress(
    vocabularies: VocabularyListItem[],
): Promise<VocabularyListItem[]> {
    const progressMap = await getUserVocabularyProgressMap(
        vocabularies.map((vocabulary) => vocabulary.id),
    );

    return mergeVocabularyWithProgress(vocabularies, progressMap);
}

export async function getDifficultVocabularyIds(): Promise<string[]> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from("user_vocabulary_progress")
        .select("vocabulary_id")
        .eq("user_id", userId)
        .eq("is_difficult", true);

    if (error) {
        throw error;
    }

    return ((data ?? []) as Array<{ vocabulary_id: string }>).map(
        (row) => row.vocabulary_id,
    );
}

export async function getLearnedVocabularyIds(): Promise<string[]> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from("user_vocabulary_progress")
        .select("vocabulary_id")
        .eq("user_id", userId)
        .eq("is_learned", true);

    if (error) {
        if (isMissingLearnedColumnError(error)) {
            return [];
        }

        throw error;
    }

    return ((data ?? []) as Array<{ vocabulary_id: string }>).map(
        (row) => row.vocabulary_id,
    );
}

export async function countCurrentUserDifficultVocabularies(): Promise<number> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return 0;
    }

    const { count, error } = await supabase
        .from("user_vocabulary_progress")
        .select("id", {
            count: "exact",
            head: true,
        })
        .eq("user_id", userId)
        .eq("is_difficult", true);

    if (error) {
        throw error;
    }

    return count ?? 0;
}

export async function upsertVocabularyProgressReview(
    vocabulary: VocabularyListItem,
    isCorrect: boolean,
): Promise<void> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { data, error: selectError } = await supabase
        .from("user_vocabulary_progress")
        .select("vocabulary_id,correct_count,wrong_count,is_difficult")
        .eq("user_id", userId)
        .eq("vocabulary_id", vocabulary.id)
        .maybeSingle();

    if (selectError) {
        throw selectError;
    }

    const currentProgress = normalizeProgressRow(
        data as UserVocabularyProgressRow | null,
    );
    const nextCorrectCount = isCorrect
        ? currentProgress.correctCount + 1
        : currentProgress.correctCount;
    const nextWrongCount = isCorrect
        ? currentProgress.wrongCount
        : currentProgress.wrongCount + 1;
    const nextIsDifficult = isCorrect
        ? currentProgress.isDifficult ||
        nextWrongCount >= nextCorrectCount + 2
        : true;
    const now = new Date().toISOString();

    if (data) {
        const { error } = await supabase
            .from("user_vocabulary_progress")
            .update({
                correct_count: nextCorrectCount,
                wrong_count: nextWrongCount,
                is_difficult: nextIsDifficult,
                last_reviewed_at: now,
                updated_at: now,
            })
            .eq("user_id", userId)
            .eq("vocabulary_id", vocabulary.id);

        if (error) {
            throw error;
        }

        return;
    }

    const { error } = await supabase.from("user_vocabulary_progress").insert({
        user_id: userId,
        vocabulary_id: vocabulary.id,
        correct_count: nextCorrectCount,
        wrong_count: nextWrongCount,
        is_difficult: nextIsDifficult,
        last_reviewed_at: now,
        updated_at: now,
    });

    if (error) {
        throw error;
    }
}

export async function setVocabularyDifficult(
    vocabularyId: string,
    isDifficult: boolean,
): Promise<void> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { data, error: selectError } = await supabase
        .from("user_vocabulary_progress")
        .select("vocabulary_id,correct_count,wrong_count,is_difficult")
        .eq("user_id", userId)
        .eq("vocabulary_id", vocabularyId)
        .maybeSingle();

    if (selectError) {
        throw selectError;
    }

    const now = new Date().toISOString();

    if (data) {
        const { error } = await supabase
            .from("user_vocabulary_progress")
            .update({
                is_difficult: isDifficult,
                updated_at: now,
            })
            .eq("user_id", userId)
            .eq("vocabulary_id", vocabularyId);

        if (error) {
            throw error;
        }

        return;
    }

    const { error } = await supabase.from("user_vocabulary_progress").insert({
        user_id: userId,
        vocabulary_id: vocabularyId,
        correct_count: 0,
        wrong_count: 0,
        is_difficult: isDifficult,
        updated_at: now,
    });

    if (error) {
        throw error;
    }
}

function isMissingLearnedColumnError(error: { code?: string; message?: string }) {
    return (
        error.code === "42703" ||
        Boolean(error.message?.includes("is_learned"))
    );
}

export async function setVocabularyLearned(
    vocabularyId: string,
    isLearned: boolean,
): Promise<void> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { data, error: selectError } = await supabase
        .from("user_vocabulary_progress")
        .select("vocabulary_id,correct_count,wrong_count,is_difficult")
        .eq("user_id", userId)
        .eq("vocabulary_id", vocabularyId)
        .maybeSingle();

    if (selectError) {
        throw selectError;
    }

    const now = new Date().toISOString();

    if (data) {
        const { error } = await supabase
            .from("user_vocabulary_progress")
            .update({
                is_learned: isLearned,
                updated_at: now,
            })
            .eq("user_id", userId)
            .eq("vocabulary_id", vocabularyId);

        if (error) {
            if (isMissingLearnedColumnError(error)) {
                throw new VocabularyLearnedStorageNotReadyError();
            }

            throw error;
        }

        return;
    }

    const { error } = await supabase.from("user_vocabulary_progress").insert({
        user_id: userId,
        vocabulary_id: vocabularyId,
        correct_count: 0,
        wrong_count: 0,
        is_difficult: false,
        is_learned: isLearned,
        updated_at: now,
    });

    if (error) {
        if (isMissingLearnedColumnError(error)) {
            throw new VocabularyLearnedStorageNotReadyError();
        }

        throw error;
    }
}

export async function resetVocabularyLearnedStatuses(
    vocabularyIds: string[],
): Promise<number> {
    const userId = await getCurrentUserId();
    const uniqueVocabularyIds = getUniqueVocabularyIds(vocabularyIds);

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    if (uniqueVocabularyIds.length === 0) {
        return 0;
    }

    let updatedCount = 0;
    const now = new Date().toISOString();

    for (let index = 0; index < uniqueVocabularyIds.length; index += PROGRESS_QUERY_BATCH_SIZE) {
        const vocabularyIdBatch = uniqueVocabularyIds.slice(
            index,
            index + PROGRESS_QUERY_BATCH_SIZE,
        );

        const { data: learnedRows, error: selectError } = await supabase
            .from("user_vocabulary_progress")
            .select("vocabulary_id")
            .eq("user_id", userId)
            .eq("is_learned", true)
            .in("vocabulary_id", vocabularyIdBatch);

        if (selectError) {
            if (isMissingLearnedColumnError(selectError)) {
                throw new VocabularyLearnedStorageNotReadyError();
            }

            throw selectError;
        }

        const learnedIds = ((learnedRows ?? []) as Array<{ vocabulary_id: string }>).map(
            (row) => row.vocabulary_id,
        );

        if (learnedIds.length === 0) {
            continue;
        }

        const { error } = await supabase
            .from("user_vocabulary_progress")
            .update({
                is_learned: false,
                updated_at: now,
            })
            .eq("user_id", userId)
            .eq("is_learned", true)
            .in("vocabulary_id", learnedIds);

        if (error) {
            if (isMissingLearnedColumnError(error)) {
                throw new VocabularyLearnedStorageNotReadyError();
            }

            throw error;
        }

        updatedCount += learnedIds.length;
    }

    return updatedCount;
}
