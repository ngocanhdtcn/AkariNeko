import { supabase } from "@/lib/supabaseClient";

export type ThemePreference = "system" | "light" | "sakura" | "violet";
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type UserSettings = {
    userId: string;
    theme: ThemePreference;
    soundEnabled: boolean;
    dailyGoal: number;
    preferredJlptLevel: JlptLevel;
    flashcardAutoFlip: boolean;
    quizQuestionCount: number;
    createdAt: string | null;
    updatedAt: string | null;
};

export type UserSettingsUpdate = {
    theme: ThemePreference;
    soundEnabled: boolean;
    dailyGoal: number;
    preferredJlptLevel: JlptLevel;
    flashcardAutoFlip: boolean;
    quizQuestionCount: number;
};

type UserSettingsRow = {
    user_id: string;
    theme: ThemePreference | null;
    sound_enabled: boolean | null;
    daily_goal: number | null;
    preferred_jlpt_level: JlptLevel | null;
    flashcard_auto_flip: boolean | null;
    quiz_question_count: number | null;
    created_at: string | null;
    updated_at: string | null;
};

export const defaultUserSettings: UserSettingsUpdate = {
    theme: "system",
    soundEnabled: true,
    dailyGoal: 20,
    preferredJlptLevel: "N5",
    flashcardAutoFlip: false,
    quizQuestionCount: 10,
};

function mapSettingsRow(row: UserSettingsRow): UserSettings {
    return {
        userId: row.user_id,
        theme: row.theme ?? defaultUserSettings.theme,
        soundEnabled: row.sound_enabled ?? defaultUserSettings.soundEnabled,
        dailyGoal: row.daily_goal ?? defaultUserSettings.dailyGoal,
        preferredJlptLevel:
            row.preferred_jlpt_level ?? defaultUserSettings.preferredJlptLevel,
        flashcardAutoFlip:
            row.flashcard_auto_flip ?? defaultUserSettings.flashcardAutoFlip,
        quizQuestionCount:
            row.quiz_question_count ?? defaultUserSettings.quizQuestionCount,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function toSettingsRow(userId: string, settings: UserSettingsUpdate) {
    return {
        user_id: userId,
        theme: settings.theme,
        sound_enabled: settings.soundEnabled,
        daily_goal: settings.dailyGoal,
        preferred_jlpt_level: settings.preferredJlptLevel,
        flashcard_auto_flip: settings.flashcardAutoFlip,
        quiz_question_count: settings.quizQuestionCount,
        updated_at: new Date().toISOString(),
    };
}

export function isMissingUserSettingsTableError(error: unknown) {
    if (error instanceof Error) {
        return /user_settings|relation .* does not exist|schema cache/i.test(
            error.message,
        );
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        const message = String((error as { message?: unknown }).message ?? "");

        return /user_settings|relation .* does not exist|schema cache/i.test(message);
    }

    return false;
}

export async function getUserSettings(userId: string) {
    const { data, error } = await supabase
        .from("user_settings")
        .select(
            [
                "user_id",
                "theme",
                "sound_enabled",
                "daily_goal",
                "preferred_jlpt_level",
                "flashcard_auto_flip",
                "quiz_question_count",
                "created_at",
                "updated_at",
            ].join(","),
        )
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? mapSettingsRow(data as unknown as UserSettingsRow) : null;
}

export async function upsertUserSettings(
    userId: string,
    settings: UserSettingsUpdate,
) {
    const { data, error } = await supabase
        .from("user_settings")
        .upsert(toSettingsRow(userId, settings), {
            onConflict: "user_id",
        })
        .select(
            [
                "user_id",
                "theme",
                "sound_enabled",
                "daily_goal",
                "preferred_jlpt_level",
                "flashcard_auto_flip",
                "quiz_question_count",
                "created_at",
                "updated_at",
            ].join(","),
        )
        .single();

    if (error) {
        throw error;
    }

    return mapSettingsRow(data as unknown as UserSettingsRow);
}

export async function getOrCreateUserSettings(userId: string) {
    const existingSettings = await getUserSettings(userId);

    if (existingSettings) {
        return existingSettings;
    }

    return upsertUserSettings(userId, defaultUserSettings);
}
