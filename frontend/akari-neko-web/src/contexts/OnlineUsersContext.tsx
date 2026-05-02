"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export type OnlineUser = {
    userId: string;
    displayName: string;
    email: string;
    onlineAt: string;
};

type OnlineUsersContextValue = {
    onlineUsers: OnlineUser[];
    onlineUserCount: number;
};

const OnlineUsersContext = createContext<OnlineUsersContextValue | null>(null);

type PresenceStateItem = {
    userId?: string;
    displayName?: string;
    email?: string;
    onlineAt?: string;
};

export function OnlineUsersProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

    useEffect(() => {
        if (!profile) {
            setOnlineUsers([]);
            return;
        }

        const channel = supabase.channel("akari-online-users", {
            config: {
                presence: {
                    key: profile.id,
                },
            },
        });

        function syncOnlineUsers() {
            const presenceState = channel.presenceState<PresenceStateItem>();
            const nextOnlineUsersMap = new Map<string, OnlineUser>();

            Object.values(presenceState).forEach((presenceItems) => {
                presenceItems.forEach((presenceItem) => {
                    if (!presenceItem.userId) {
                        return;
                    }

                    nextOnlineUsersMap.set(presenceItem.userId, {
                        userId: presenceItem.userId,
                        displayName:
                            presenceItem.displayName || presenceItem.email || "Akari user",
                        email: presenceItem.email || "",
                        onlineAt: presenceItem.onlineAt || new Date().toISOString(),
                    });
                });
            });

            setOnlineUsers(Array.from(nextOnlineUsersMap.values()));
        }

        channel.on("presence", { event: "sync" }, syncOnlineUsers);

        channel.subscribe(async (status) => {
            if (status !== "SUBSCRIBED") {
                return;
            }

            await channel.track({
                userId: profile.id,
                displayName: profile.displayName,
                email: profile.email,
                onlineAt: new Date().toISOString(),
            });
        });

        return () => {
            void channel.untrack();
            void supabase.removeChannel(channel);
        };
    }, [profile]);

    const value = useMemo(
        () => ({
            onlineUsers,
            onlineUserCount: onlineUsers.length,
        }),
        [onlineUsers],
    );

    return (
        <OnlineUsersContext.Provider value={value}>
            {children}
        </OnlineUsersContext.Provider>
    );
}

export function useOnlineUsers() {
    const context = useContext(OnlineUsersContext);

    if (!context) {
        throw new Error("useOnlineUsers must be used inside OnlineUsersProvider");
    }

    return context;
}