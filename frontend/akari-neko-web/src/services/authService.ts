import { supabase } from "@/lib/supabaseClient";

export type AuthProfile = {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    appLevel: number;
    experiencePoint: number;
    currentJlptLevel: string;
};

type ProfileRow = {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    app_level: number;
    experience_point: number;
    current_jlpt_level: string | null;
};

function mapProfileRow(row: ProfileRow, email: string): AuthProfile {
    return {
        id: row.id,
        email,
        displayName: row.display_name ?? email,
        avatarUrl: row.avatar_url,
        appLevel: row.app_level,
        experiencePoint: row.experience_point,
        currentJlptLevel: row.current_jlpt_level ?? "N5",
    };
}

export async function signUpWithEmail({
    email,
    password,
    displayName,
}: {
    email: string;
    password: string;
    displayName: string;
}) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        throw error;
    }

    const user = data.user;

    if (!user) {
        return null;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        display_name: displayName,
        current_jlpt_level: "N5",
    });

    if (profileError) {
        throw profileError;
    }

    return user;
}

export async function signInWithEmail({
    email,
    password,
}: {
    email: string;
    password: string;
}) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw error;
    }

    return data.user;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}

export async function getCurrentProfile(): Promise<AuthProfile | null> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user?.email) {
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select(
            [
                "id",
                "display_name",
                "avatar_url",
                "app_level",
                "experience_point",
                "current_jlpt_level",
            ].join(","),
        )
        .eq("id", user.id)
        .single();

    if (error) {
        throw error;
    }

    return mapProfileRow(data as unknown as ProfileRow, user.email);
}

export async function getCurrentUserId(): Promise<string | null> {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    return user?.id ?? null;
}