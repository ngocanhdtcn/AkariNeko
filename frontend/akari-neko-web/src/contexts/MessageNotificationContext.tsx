"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    getUnreadMessageCount,
    markMessagesAsRead,
    subscribeToMessages,
} from "@/services/messageService";

type MessageNotificationContextValue = {
    unreadMessageCount: number;
    resetUnreadMessageCount: () => Promise<void>;
};

const MessageNotificationContext =
    createContext<MessageNotificationContextValue | null>(null);

export function MessageNotificationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { profile } = useAuth();
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    async function resetUnreadMessageCount() {
        try {
            await markMessagesAsRead();
            setUnreadMessageCount(0);
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    }

    async function loadUnreadMessageCount() {
        try {
            const count = await getUnreadMessageCount();
            setUnreadMessageCount(count);
        } catch (error) {
            console.error("Failed to load unread message count:", error);
            setUnreadMessageCount(0);
        }
    }

    useEffect(() => {
        if (!profile) {
            setUnreadMessageCount(0);
            return;
        }

        if (pathname === "/messages") {
            void resetUnreadMessageCount();
            return;
        }

        void loadUnreadMessageCount();
    }, [pathname, profile]);

    useEffect(() => {
        if (!profile) {
            setUnreadMessageCount(0);
            return;
        }

        const unsubscribe = subscribeToMessages((message) => {
            const isOwnMessage = message.senderId === profile.id;
            const isOnMessagesPage = pathname === "/messages";

            if (isOwnMessage) {
                return;
            }

            if (isOnMessagesPage) {
                void resetUnreadMessageCount();
                return;
            }

            setUnreadMessageCount((current) => current + 1);
        });

        return unsubscribe;
    }, [profile, pathname]);

    const value = useMemo(
        () => ({
            unreadMessageCount,
            resetUnreadMessageCount,
        }),
        [unreadMessageCount],
    );

    return (
        <MessageNotificationContext.Provider value={value}>
            {children}
        </MessageNotificationContext.Provider>
    );
}

export function useMessageNotification() {
    const context = useContext(MessageNotificationContext);

    if (!context) {
        throw new Error(
            "useMessageNotification must be used inside MessageNotificationProvider",
        );
    }

    return context;
}