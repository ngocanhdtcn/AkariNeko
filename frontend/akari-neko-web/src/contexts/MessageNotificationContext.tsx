"use client";

import { usePathname } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
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

    const resetUnreadMessageCount = useCallback(async () => {
        try {
            await markMessagesAsRead();
            setUnreadMessageCount(0);
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    }, []);

    const loadUnreadMessageCount = useCallback(async () => {
        try {
            const count = await getUnreadMessageCount();
            setUnreadMessageCount(count);
        } catch (error) {
            console.error("Failed to load unread message count:", error);
            setUnreadMessageCount(0);
        }
    }, []);

    useEffect(() => {
        if (!profile) {
            const timeoutId = window.setTimeout(() => {
                setUnreadMessageCount(0);
            }, 0);

            return () => window.clearTimeout(timeoutId);
        }

        if (pathname === "/messages") {
            const timeoutId = window.setTimeout(() => {
                void resetUnreadMessageCount();
            }, 0);

            return () => window.clearTimeout(timeoutId);
        }

        const timeoutId = window.setTimeout(() => {
            void loadUnreadMessageCount();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadUnreadMessageCount, pathname, profile, resetUnreadMessageCount]);

    useEffect(() => {
        if (!profile) {
            const timeoutId = window.setTimeout(() => {
                setUnreadMessageCount(0);
            }, 0);

            return () => window.clearTimeout(timeoutId);
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
    }, [pathname, profile, resetUnreadMessageCount]);

    const value = useMemo(
        () => ({
            unreadMessageCount,
            resetUnreadMessageCount,
        }),
        [resetUnreadMessageCount, unreadMessageCount],
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
