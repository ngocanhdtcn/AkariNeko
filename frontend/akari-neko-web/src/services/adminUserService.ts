import { supabase } from "@/lib/supabaseClient";

export type ManagedUserProfile = {
    id: string;
    email: string;
    displayName: string;
    role: "student" | "admin";
    approvalStatus: "pending" | "approved" | "rejected";
    canAccessKaiwa: boolean;
    createdAt: string | null;
    approvedAt: string | null;
};

type ManagedUserProfileRow = {
    id: string;
    email: string | null;
    display_name: string | null;
    role: "student" | "admin" | null;
    approval_status: "pending" | "approved" | "rejected" | null;
    can_access_kaiwa: boolean | null;
    created_at: string | null;
    approved_at: string | null;
};

function mapManagedUser(row: ManagedUserProfileRow): ManagedUserProfile {
    const email = row.email ?? "unknown@email";

    return {
        id: row.id,
        email,
        displayName: row.display_name ?? email,
        role: row.role ?? "student",
        approvalStatus: row.approval_status ?? "pending",
        canAccessKaiwa: row.role === "admin" || (row.can_access_kaiwa ?? false),
        createdAt: row.created_at,
        approvedAt: row.approved_at,
    };
}

export async function getManagedUserProfiles(): Promise<ManagedUserProfile[]> {
    const { data, error } = await supabase
        .from("profiles")
        .select(
            [
                "id",
                "email",
                "display_name",
                "role",
                "approval_status",
                "can_access_kaiwa",
                "created_at",
                "approved_at",
            ].join(","),
        )
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return ((data ?? []) as unknown as ManagedUserProfileRow[]).map(mapManagedUser);
}

export async function updateManagedUserApproval({
    userId,
    approvalStatus,
}: {
    userId: string;
    approvalStatus: "approved" | "rejected" | "pending";
}): Promise<void> {
    const { error } = await supabase.rpc("set_user_approval", {
        target_user_id: userId,
        new_status: approvalStatus,
    });

    if (error) {
        throw error;
    }
}

export async function updateManagedUserKaiwaAccess({
    userId,
    canAccessKaiwa,
}: {
    userId: string;
    canAccessKaiwa: boolean;
}): Promise<void> {
    const { error } = await supabase.rpc("set_user_kaiwa_access", {
        target_user_id: userId,
        can_access: canAccessKaiwa,
    });

    if (error) {
        throw error;
    }
}
