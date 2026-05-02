import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/services/authService";

export type ChatMessage = {
    id: string;
    senderId: string;
    receiverId: string | null;
    content: string;
    createdAt: string;
};

type MessageRow = {
    id: string;
    sender_id: string;
    receiver_id: string | null;
    content: string;
    created_at: string;
};

function mapMessageRow(row: MessageRow): ChatMessage {
    return {
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        createdAt: row.created_at,
    };
}

export async function getRecentMessages(limitCount = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,receiver_id,content,created_at")
        .order("created_at", { ascending: false })
        .limit(limitCount);

    if (error) {
        throw error;
    }

    return ((data ?? []) as MessageRow[]).map(mapMessageRow).reverse();
}

export async function sendMessage(content: string): Promise<ChatMessage> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { data, error } = await supabase
        .from("messages")
        .insert({
            sender_id: userId,
            receiver_id: null,
            content,
        })
        .select("id,sender_id,receiver_id,content,created_at")
        .single();

    if (error) {
        throw error;
    }

    return mapMessageRow(data as MessageRow);
}

export function subscribeToMessages(onMessage: (message: ChatMessage) => void) {
    const channelName = `akari-chat-messages-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    const channel = supabase
        .channel(channelName)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
            },
            (payload) => {
                onMessage(mapMessageRow(payload.new as MessageRow));
            },
        )
        .subscribe();

    return () => {
        void supabase.removeChannel(channel);
    };
}

export async function getUnreadMessageCount(): Promise<number> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return 0;
    }

    const { data: readState, error: readStateError } = await supabase
        .from("message_reads")
        .select("last_read_at")
        .eq("user_id", userId)
        .maybeSingle();

    if (readStateError) {
        throw readStateError;
    }

    const lastReadAt = readState?.last_read_at ?? "1970-01-01T00:00:00.000Z";

    const { count, error } = await supabase
        .from("messages")
        .select("id", {
            count: "exact",
            head: true,
        })
        .neq("sender_id", userId)
        .gt("created_at", lastReadAt);

    if (error) {
        throw error;
    }

    return count ?? 0;
}

export async function markMessagesAsRead(): Promise<void> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase.from("message_reads").upsert(
        {
            user_id: userId,
            last_read_at: now,
            updated_at: now,
        },
        {
            onConflict: "user_id",
        },
    );

    if (error) {
        throw error;
    }
}