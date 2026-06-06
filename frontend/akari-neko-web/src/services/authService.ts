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

export type PublicProfile = {
    id: string;
    displayName: string;
    avatarUrl: string | null;
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

function isInvalidRefreshTokenError(error: unknown) {
    return (
        error instanceof Error &&
        /invalid refresh token|refresh token not found/i.test(error.message)
    );
}

async function clearStoredAuthSession() {
    try {
        await supabase.auth.signOut({ scope: "local" });
    } catch {
        // Local storage cleanup below is the important part for stale refresh tokens.
    }

    if (typeof window === "undefined") {
        return;
    }

    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);

        if (key && /^sb-.+-auth-token$/.test(key)) {
            localStorage.removeItem(key);
        }
    }
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
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
        if (isInvalidRefreshTokenError(sessionError)) {
            await clearStoredAuthSession();
            return null;
        }

        throw sessionError;
    }

    const userEmail = session?.user?.email;

    if (!userEmail) {
        return null;
    }

    const user = session.user;

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
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        const { data: insertedProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
                id: user.id,
                display_name: userEmail,
                current_jlpt_level: "N5",
            })
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
            .single();

        if (insertError) {
            throw insertError;
        }

        return mapProfileRow(insertedProfile as unknown as ProfileRow, userEmail);
    }

    return mapProfileRow(data as unknown as ProfileRow, userEmail);
}

export async function getCurrentUserId(): Promise<string | null> {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        if (isInvalidRefreshTokenError(error)) {
            await clearStoredAuthSession();
            return null;
        }

        throw error;
    }

    return session?.user?.id ?? null;
}

export async function getPublicProfilesByIds(
    profileIds: string[],
): Promise<PublicProfile[]> {
    const uniqueProfileIds = Array.from(new Set(profileIds)).filter(Boolean);

    if (uniqueProfileIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", uniqueProfileIds);

    if (error) {
        throw error;
    }

    return ((data ?? []) as Array<{
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    }>).map((row) => ({
        id: row.id,
        displayName: row.display_name || "Akari user",
        avatarUrl: row.avatar_url,
    }));
}

export type UpdateProfileInput = {
    displayName: string;
    avatarUrl: string | null;
    currentJlptLevel: string;
};

const avatarFileExtensionsByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

export const allowedAvatarTypes = Object.keys(avatarFileExtensionsByType);
export const maxAvatarFileSize = 2 * 1024 * 1024;

export function validateAvatarFile(file: File): void {
    if (!allowedAvatarTypes.includes(file.type)) {
        throw new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
    }

    if (file.size > maxAvatarFileSize) {
        throw new Error("Ảnh không được vượt quá 2MB.");
    }
}

function getAvatarStoragePathFromUrl(avatarUrl: string, userId: string): string | null {
    try {
        const url = new URL(avatarUrl);
        const publicPathPrefix = "/storage/v1/object/public/avatars/";
        const publicPathStart = url.pathname.indexOf(publicPathPrefix);

        if (publicPathStart === -1) {
            return null;
        }

        const storagePath = decodeURIComponent(
            url.pathname.slice(publicPathStart + publicPathPrefix.length),
        );

        return storagePath.startsWith(`${userId}/`) ? storagePath : null;
    } catch {
        return null;
    }
}

export async function uploadCurrentUserAvatar(file: File): Promise<string> {
    validateAvatarFile(file);

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        throw new Error("Bạn cần đăng nhập để upload ảnh.");
    }

    const fileExtension = avatarFileExtensionsByType[file.type];
    const filePath = `${user.id}/avatar-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
            contentType: file.type,
        });

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return data.publicUrl;
}

export async function deleteCurrentUserAvatarByUrl(
    avatarUrl: string | null | undefined,
): Promise<void> {
    if (!avatarUrl) {
        return;
    }

    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const storagePath = getAvatarStoragePathFromUrl(avatarUrl, userId);

    if (!storagePath) {
        return;
    }

    const { error } = await supabase.storage.from("avatars").remove([storagePath]);

    if (error) {
        throw error;
    }
}

export async function updateCurrentProfile(
    input: UpdateProfileInput,
): Promise<void> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            display_name: input.displayName,
            avatar_url: input.avatarUrl,
            current_jlpt_level: input.currentJlptLevel,
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (error) {
        throw error;
    }
}
