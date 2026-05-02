"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    getCurrentProfile,
    signOut,
    type AuthProfile,
} from "@/services/authService";
import { supabase } from "@/lib/supabaseClient";

type AuthContextValue = {
    profile: AuthProfile | null;
    isLoadingProfile: boolean;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<AuthProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    async function refreshProfile() {
        setIsLoadingProfile(true);

        try {
            const currentProfile = await getCurrentProfile();
            setProfile(currentProfile);
        } catch (error) {
            console.error("Failed to load current profile:", error);
            setProfile(null);
        } finally {
            setIsLoadingProfile(false);
        }
    }

    async function logout() {
        await signOut();
        setProfile(null);
        window.location.href = "/auth";
    }

    useEffect(() => {
        void refreshProfile();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            void refreshProfile();
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