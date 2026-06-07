"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    getCurrentProfile,
    signOut,
    type AuthProfile,
} from "@/services/authService";
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent } from "@supabase/supabase-js";

export const AUTH_LOGIN_HINT_KEY = "akari-login-in-progress";

type AuthContextValue = {
    profile: AuthProfile | null;
    isAuthenticated: boolean;
    isLoadingProfile: boolean;
    markAuthenticated: () => void;
    refreshProfile: (options?: { showLoading?: boolean }) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const PROFILE_LOAD_TIMEOUT_MS = 5000;
const SESSION_LOAD_TIMEOUT_MS = 3000;

function getCurrentProfileWithTimeout() {
    return Promise.race<AuthProfile | null>([
        getCurrentProfile(),
        new Promise<AuthProfile | null>((resolve) => {
            window.setTimeout(() => resolve(null), PROFILE_LOAD_TIMEOUT_MS);
        }),
    ]);
}

function getCurrentSessionWithTimeout() {
    return Promise.race([
        supabase.auth.getSession(),
        new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>>((resolve) => {
            window.setTimeout(
                () => resolve({ data: { session: null }, error: null }),
                SESSION_LOAD_TIMEOUT_MS,
            );
        }),
    ]);
}

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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [hasInitializedSession, setHasInitializedSession] = useState(false);

    const refreshProfile = useCallback(async ({ showLoading = true } = {}) => {
        if (showLoading) {
            setIsLoadingProfile(true);
        }

        try {
            const currentProfile = await getCurrentProfileWithTimeout();
            setIsAuthenticated((current) => current || Boolean(currentProfile));
            setProfile((previousProfile) =>
                areProfilesEqual(previousProfile, currentProfile)
                    ? previousProfile
                    : currentProfile,
            );
        } catch (error) {
            console.error("Failed to load current profile:", error);
            setIsAuthenticated((current) => current);
            setProfile(null);
        } finally {
            if (showLoading) {
                setIsLoadingProfile(false);
            }
        }
    }, []);

    const markAuthenticated = useCallback(() => {
        window.sessionStorage.setItem(AUTH_LOGIN_HINT_KEY, "1");
        setIsAuthenticated(true);
        setIsLoadingProfile(false);
        setHasInitializedSession(true);
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut();
            setProfile(null);
            window.location.href = "/auth";
        } catch (error) {
            console.error("Failed to sign out:", error);
            window.location.href = "/auth";
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function initializeSession() {
            try {
                const {
                    data: { session },
                } = await getCurrentSessionWithTimeout();

                if (!isMounted) {
                    return;
                }

                const hasSession = Boolean(session?.user);
                setIsAuthenticated(hasSession);
                setIsLoadingProfile(false);
                setHasInitializedSession(true);

                if (hasSession) {
                    void refreshProfile({ showLoading: false });
                }
            } catch (error) {
                console.error("Failed to initialize auth session:", error);

                if (isMounted) {
                    setIsAuthenticated(false);
                    setIsLoadingProfile(false);
                    setHasInitializedSession(true);
                }
            }
        }

        void initializeSession();

        return () => {
            isMounted = false;
        };
    }, [refreshProfile]);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT") {
                setIsAuthenticated(false);
                window.sessionStorage.removeItem(AUTH_LOGIN_HINT_KEY);
                setProfile(null);
                setIsLoadingProfile(false);
                setHasInitializedSession(true);
                return;
            }

            setIsAuthenticated(Boolean(session?.user));
            if (session?.user) {
                window.sessionStorage.setItem(AUTH_LOGIN_HINT_KEY, "1");
            }
            setIsLoadingProfile(false);
            setHasInitializedSession(true);

            if (!shouldRefreshProfileForAuthEvent(event)) {
                return;
            }

            window.setTimeout(() => {
                void refreshProfile({
                    showLoading: event !== "USER_UPDATED" && !profile,
                });
            }, 0);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [profile, refreshProfile]);

    const value = useMemo(
        () => ({
            profile,
            isAuthenticated,
            isLoadingProfile: !hasInitializedSession || isLoadingProfile,
            markAuthenticated,
            refreshProfile,
            logout,
        }),
        [
            hasInitializedSession,
            isAuthenticated,
            isLoadingProfile,
            logout,
            markAuthenticated,
            profile,
            refreshProfile,
        ],
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
