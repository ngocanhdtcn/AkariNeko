"use client";

import { MessageCircle, Send, UsersRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageNotification } from "@/contexts/MessageNotificationContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useOnlineUsers } from "@/contexts/OnlineUsersContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
    getPublicProfilesByIds,
    type PublicProfile,
} from "@/services/authService";
import {
    getRecentMessages,
    sendMessage,
    subscribeToMessages,
    type ChatMessage,
} from "@/services/messageService";

function formatMessageTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export function MessagesPage() {
    const { resetUnreadMessageCount } = useMessageNotification();
    const { profile } = useAuth();
    const { notifyError } = useNotification();
    const { onlineUsers, onlineUserCount } = useOnlineUsers();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageText, setMessageText] = useState("");
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);
    const [senderProfiles, setSenderProfiles] = useState<
        Record<string, PublicProfile>
    >({});
    const senderProfilesRef = useRef<Record<string, PublicProfile>>({});
    const chatScrollRef = useRef<HTMLDivElement | null>(null);
    const previousMessageCountRef = useRef(0);

    function getSenderName(senderId: string) {
        if (senderId === profile?.id) {
            return profile.displayName;
        }

        return (
            onlineUsers.find((user) => user.userId === senderId)?.displayName ??
            senderProfiles[senderId]?.displayName ??
            "Akari user"
        );
    }

    function getSenderAvatarUrl(senderId: string) {
        if (senderId === profile?.id) {
            return profile.avatarUrl;
        }

        return (
            onlineUsers.find((user) => user.userId === senderId)?.avatarUrl ??
            senderProfiles[senderId]?.avatarUrl ??
            null
        );
    }

    const loadMissingSenderProfiles = useCallback(async (nextMessages: ChatMessage[]) => {
        const senderIds = nextMessages
            .map((message) => message.senderId)
            .filter((senderId) => senderId !== profile?.id);
        const missingSenderIds = Array.from(new Set(senderIds)).filter(
            (senderId) => !senderProfilesRef.current[senderId],
        );

        if (missingSenderIds.length === 0) {
            return;
        }

        try {
            const profiles = await getPublicProfilesByIds(missingSenderIds);
            setSenderProfiles((currentProfiles) => {
                const nextProfiles = { ...currentProfiles };

                profiles.forEach((senderProfile) => {
                    nextProfiles[senderProfile.id] = senderProfile;
                });

                senderProfilesRef.current = nextProfiles;

                return nextProfiles;
            });
        } catch (error) {
            console.error("Failed to load sender profiles:", error);
        }
    }, [profile?.id]);

    const loadMessages = useCallback(async () => {
        setIsLoadingMessages(true);
        setMessageError(null);

        try {
            const data = await getRecentMessages(50);
            setMessages(data);
            await loadMissingSenderProfiles(data);
        } catch (error) {
            console.error("Failed to load messages:", error);
            const fallbackMessage = "Không thể tải tin nhắn.";
            setMessageError(fallbackMessage);
            notifyError(error, fallbackMessage);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [loadMissingSenderProfiles, notifyError]);

    async function handleSendMessage() {
        const content = messageText.trim();

        if (!content || isSendingMessage) {
            return;
        }

        setIsSendingMessage(true);
        setMessageError(null);

        try {
            await sendMessage(content);
            setMessageText("");
        } catch (error) {
            console.error("Failed to send message:", error);
            const fallbackMessage = "Không thể gửi tin nhắn.";
            setMessageError(fallbackMessage);
            notifyError(error, fallbackMessage);
        } finally {
            setIsSendingMessage(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadMessages();

        const unsubscribe = subscribeToMessages((message) => {
            setMessages((currentMessages) => {
                if (currentMessages.some((item) => item.id === message.id)) {
                    return currentMessages;
                }

                return [...currentMessages, message].slice(-50);
            });
            void loadMissingSenderProfiles([message]);
        });

        return unsubscribe;
    }, [loadMessages, loadMissingSenderProfiles]);

    useEffect(() => {
        const chatScrollElement = chatScrollRef.current;

        if (!chatScrollElement || messages.length === 0 || isLoadingMessages) {
            return;
        }

        const shouldAnimate = previousMessageCountRef.current > 0;
        previousMessageCountRef.current = messages.length;

        const animationFrameId = window.requestAnimationFrame(() => {
            chatScrollElement.scrollTo({
                top: chatScrollElement.scrollHeight,
                behavior: shouldAnimate ? "smooth" : "auto",
            });
        });

        return () => window.cancelAnimationFrame(animationFrameId);
    }, [isLoadingMessages, messages.length]);

    useEffect(() => {
        void resetUnreadMessageCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="grid gap-5">
            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-6 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                            Messages
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-slate-800">
                            Akari Chat
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Chat realtime đơn giản cho các user đang đăng nhập.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
                        <UsersRound size={18} />
                        {onlineUserCount} online
                    </div>
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="overflow-hidden rounded-[32px] border border-pink-100 bg-white/85 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                    <div className="border-b border-pink-50 px-5 py-4">
                        <h2 className="text-xl font-black text-slate-800">Chat chung</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Phòng chat chung để test realtime giữa các user.
                        </p>
                    </div>

                    {messageError ? (
                        <div className="mx-5 mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
                            {messageError}
                        </div>
                    ) : null}

                    <div
                        ref={chatScrollRef}
                        className="grid h-[540px] content-start gap-3 overflow-y-auto bg-gradient-to-b from-white via-white to-pink-50/20 px-5 py-5"
                    >
                        {isLoadingMessages ? (
                            <LoadingSkeleton variant="list" rows={6} />
                        ) : messages.length > 0 ? (
                            messages.map((message) => {
                                const isOwnMessage = message.senderId === profile?.id;
                                const senderName = getSenderName(message.senderId);
                                const senderAvatarUrl = getSenderAvatarUrl(message.senderId);

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        {!isOwnMessage ? (
                                            <UserAvatar
                                                name={senderName}
                                                avatarUrl={senderAvatarUrl}
                                                className="mb-1 h-8 w-8 rounded-2xl bg-white text-xs"
                                            />
                                        ) : null}

                                        <div
                                            className={`flex max-w-[min(72%,640px)] flex-col ${isOwnMessage ? "items-end" : "items-start"
                                                }`}
                                        >
                                            {!isOwnMessage ? (
                                                <span className="mb-1 px-1 text-[11px] font-bold text-slate-400">
                                                    {senderName}
                                                </span>
                                            ) : null}

                                            <div
                                                className={`w-fit max-w-full rounded-[20px] px-3.5 py-2.5 text-sm font-semibold leading-5 shadow-sm ${isOwnMessage
                                                        ? "rounded-br-md border border-pink-200 bg-gradient-to-br from-pink-400 to-fuchsia-400 text-white shadow-[0_10px_24px_rgba(236,72,153,0.16)]"
                                                        : "rounded-bl-md border border-pink-100 bg-gradient-to-br from-white to-pink-50/80 text-slate-700 shadow-[0_10px_24px_rgba(236,72,153,0.08)]"
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap break-words">
                                                    {message.content}
                                                </p>

                                                <p
                                                    className={`mt-1 text-right text-[10px] font-bold ${isOwnMessage ? "text-white/75" : "text-slate-400"
                                                        }`}
                                                >
                                                    {formatMessageTime(message.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {isOwnMessage ? (
                                            <UserAvatar
                                                name={senderName}
                                                avatarUrl={senderAvatarUrl}
                                                className="mb-1 h-8 w-8 rounded-2xl bg-white text-xs"
                                            />
                                        ) : null}
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyState
                                icon={<MessageCircle size={24} />}
                                title="Chưa có tin nhắn"
                                description="Gửi lời chào đầu tiên để phòng chat AkariNeko bắt đầu nhộn nhịp."
                                className="min-h-[220px]"
                            />
                        )}
                    </div>

                    <div className="border-t border-pink-50 bg-white/95 p-4">
                        <div className="flex gap-3">
                            <input
                                value={messageText}
                                className="h-12 min-w-0 flex-1 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                placeholder="Nhập tin nhắn..."
                                onChange={(event) => setMessageText(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        void handleSendMessage();
                                    }
                                }}
                            />

                            <button
                                type="button"
                                disabled={!messageText.trim() || isSendingMessage}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                onClick={() => void handleSendMessage()}
                            >
                                <Send size={17} />
                                {isSendingMessage ? "Đang gửi..." : "Gửi"}
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="rounded-[32px] border border-pink-100 bg-white/85 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                    <h2 className="text-xl font-black text-slate-800">
                        Người đang online
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {onlineUserCount} user đang online.
                    </p>

                    <div className="mt-4 grid gap-3">
                        {onlineUsers.map((user) => (
                            <div
                                key={user.userId}
                                className="flex items-center gap-3 rounded-2xl border border-pink-50 bg-white px-4 py-3 shadow-sm"
                            >
                                <UserAvatar
                                    name={user.displayName}
                                    avatarUrl={user.avatarUrl}
                                />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-black text-slate-700">
                                        {user.displayName}
                                    </p>
                                    <p className="truncate text-xs font-medium text-slate-400">
                                        {user.email || "Đang hoạt động"}
                                    </p>
                                </div>

                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                            </div>
                        ))}

                        {onlineUsers.length === 0 ? (
                            <div className="rounded-2xl border border-pink-50 bg-white px-4 py-6 text-center text-sm font-medium text-slate-400">
                                Chưa có user online.
                            </div>
                        ) : null}
                    </div>
                </aside>
            </section>
        </div>
    );
}
