"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    getCurrentProfile,
    signOut,
    type AuthProfile,
} from "@/services/authService";
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent } from "@supabase/supabase-js";

type AuthContextValue = {
    profile: AuthProfile | null;
    isLoadingProfile: boolean;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function areProfilesEqual(
    firstProfile: AuthProfile | null,
    secondProfile: AuthProfile | null,
) {
    if (firstProfile === secondProfile) {
        return true;
    }

    if (!firstProfile || !secondProfile) {
        return false;
    }

    return (
        firstProfile.id === secondProfile.id &&
        firstProfile.email === secondProfile.email &&
        firstProfile.displayName === secondProfile.displayName &&
        firstProfile.avatarUrl === secondProfile.avatarUrl &&
        firstProfile.appLevel === secondProfile.appLevel &&
        firstProfile.experiencePoint === secondProfile.experiencePoint &&
        firstProfile.currentJlptLevel === secondProfile.currentJlptLevel
    );
}

function shouldRefreshProfileForAuthEvent(event: AuthChangeEvent) {
    return (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "USER_UPDATED"
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<AuthProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    async function refreshProfile({ showLoading = true } = {}) {
        if (showLoading) {
            setIsLoadingProfile(true);
        }

        try {
            const currentProfile = await getCurrentProfile();
            setProfile((previousProfile) =>
                areProfilesEqual(previousProfile, currentProfile)
                    ? previousProfile
                    : currentProfile,
            );
        } catch (error) {
            console.error("Failed to load current profile:", error);
            setProfile(null);
        } finally {
            if (showLoading) {
                setIsLoadingProfile(false);
            }
        }
    }

    async function logout() {
        await signOut();
        setProfile(null);
        window.location.href = "/auth";
    }

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") {
                setProfile(null);
                setIsLoadingProfile(false);
                return;
            }

            if (!shouldRefreshProfileForAuthEvent(event)) {
                return;
            }

            void refreshProfile({ showLoading: event === "INITIAL_SESSION" });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = useMemo(
        () => ({
            profile,
            isLoadingProfile,
            refreshProfile,
            logout,
        }),
        [profile, isLoadingProfile],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
