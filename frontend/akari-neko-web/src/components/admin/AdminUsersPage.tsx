"use client";

import { CheckCircle2, Eye, EyeOff, RefreshCw, ShieldAlert, UserCheck, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AppSelect } from "@/components/ui/AppSelect";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
    getManagedUserProfiles,
    updateManagedUserApproval,
    updateManagedUserJlptLevel,
    updateManagedUserKaiwaAccess,
    type ManagedUserProfile,
} from "@/services/adminUserService";

const jlptLevelOptions = ["N5", "N4", "N3", "N2", "N1"];

function formatDate(value: string | null) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function getApprovalStatusLabel(status: ManagedUserProfile["approvalStatus"]) {
    switch (status) {
        case "approved":
            return "Đã duyệt";
        case "rejected":
            return "Đã từ chối";
        case "pending":
        default:
            return "Chờ duyệt";
    }
}

function getRoleLabel(role: ManagedUserProfile["role"]) {
    switch (role) {
        case "admin":
            return "Quản trị viên";
        case "student":
        default:
            return "Học viên";
    }
}

export function AdminUsersPage() {
    const { profile, isLoadingProfile } = useAuth();
    const [users, setUsers] = useState<ManagedUserProfile[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [updatingKaiwaUserId, setUpdatingKaiwaUserId] = useState<string | null>(null);
    const [updatingLevelUserId, setUpdatingLevelUserId] = useState<string | null>(null);
    const [draftJlptLevels, setDraftJlptLevels] = useState<Record<string, string>>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        setErrorMessage(null);

        try {
            const managedUsers = await getManagedUserProfiles();
            setUsers(managedUsers);
        } catch (error) {
            console.error("Failed to load managed users:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Không thể tải danh sách tài khoản.",
            );
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        if (profile?.role === "admin") {
            void loadUsers();
        }
    }, [loadUsers, profile?.role]);

    const pendingUsers = useMemo(
        () => users.filter((user) => user.approvalStatus === "pending"),
        [users],
    );

    async function handleApproval(
        user: ManagedUserProfile,
        approvalStatus: "approved" | "rejected" | "pending",
    ) {
        setUpdatingUserId(user.id);
        setErrorMessage(null);

        try {
            await updateManagedUserApproval({
                userId: user.id,
                approvalStatus,
            });
            await loadUsers();
        } catch (error) {
            console.error("Failed to update user approval:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Không thể cập nhật trạng thái tài khoản.",
            );
        } finally {
            setUpdatingUserId(null);
        }
    }

    async function handleKaiwaAccess(user: ManagedUserProfile, canAccessKaiwa: boolean) {
        setUpdatingKaiwaUserId(user.id);
        setErrorMessage(null);

        try {
            await updateManagedUserKaiwaAccess({
                userId: user.id,
                canAccessKaiwa,
            });
            await loadUsers();
        } catch (error) {
            console.error("Failed to update user Kaiwa access:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "KhÃ´ng thá»ƒ cáº­p nháº­t quyá»n Kaiwa.",
            );
        } finally {
            setUpdatingKaiwaUserId(null);
        }
    }

    function handleJlptLevelDraftChange(user: ManagedUserProfile, currentJlptLevel: string) {
        setDraftJlptLevels((currentDrafts) => {
            if (user.currentJlptLevel === currentJlptLevel) {
                const { [user.id]: _removedLevel, ...remainingDrafts } = currentDrafts;
                void _removedLevel;
                return remainingDrafts;
            }

            return {
                ...currentDrafts,
                [user.id]: currentJlptLevel,
            };
        });
    }

    async function handleJlptLevelSave(user: ManagedUserProfile) {
        const currentJlptLevel = draftJlptLevels[user.id];

        if (!currentJlptLevel || user.currentJlptLevel === currentJlptLevel) {
            return;
        }

        setUpdatingLevelUserId(user.id);
        setErrorMessage(null);

        try {
            await updateManagedUserJlptLevel({
                userId: user.id,
                currentJlptLevel,
            });
            setUsers((currentUsers) =>
                currentUsers.map((currentUser) =>
                    currentUser.id === user.id
                        ? {
                              ...currentUser,
                              currentJlptLevel,
                          }
                        : currentUser,
                ),
            );
            setDraftJlptLevels((currentDrafts) => {
                const { [user.id]: _removedLevel, ...remainingDrafts } = currentDrafts;
                void _removedLevel;
                return remainingDrafts;
            });
        } catch (error) {
            console.error("Failed to update user JLPT level:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "KhÃ´ng thá»ƒ cáº­p nháº­t cáº¥p Ä‘á»™ JLPT.",
            );
        } finally {
            setUpdatingLevelUserId(null);
        }
    }

    if (isLoadingProfile) {
        return (
            <main className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-violet-50 px-4">
                <LoadingSkeleton variant="card" className="w-[min(92vw,420px)]" />
            </main>
        );
    }

    if (profile?.role !== "admin") {
        return (
            <AppShell>
                <section className="rounded-[28px] border border-rose-100 bg-white/95 p-8 text-center shadow-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
                        <ShieldAlert size={28} />
                    </div>
                    <h1 className="mt-4 text-2xl font-black text-slate-900">
                        Không có quyền truy cập
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                        Chỉ tài khoản quản trị viên mới có thể duyệt học viên.
                    </p>
                </section>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <section className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-pink-100 bg-white/95 p-6 shadow-sm">
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-pink-400">
                            Quản trị
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-900">
                            Duyệt tài khoản học viên
                        </h1>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                            {pendingUsers.length} tài khoản đang chờ duyệt
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={isLoadingUsers}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-black text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void loadUsers()}
                    >
                        <RefreshCw size={17} className={isLoadingUsers ? "animate-spin" : ""} />
                        Làm mới
                    </button>
                </div>

                {errorMessage ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                        {errorMessage}
                    </div>
                ) : null}

                <div className="akari-vocabulary-table overflow-hidden rounded-[28px] border border-pink-50 bg-white/70 shadow-sm">
                    {isLoadingUsers ? (
                        <div className="p-6">
                            <LoadingSkeleton variant="card" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-[1280px] p-3">
                                <div className="akari-vocabulary-table-head grid grid-cols-[1.35fr_0.85fr_0.75fr_1.05fr_0.85fr_0.9fr_1.55fr] items-center rounded-2xl bg-gradient-to-r from-pink-50/80 to-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                    <div>Học viên</div>
                                    <div>Trạng thái</div>
                                    <div>Vai trò</div>
                                    <div>Cấp độ</div>
                                    <div>Kaiwa</div>
                                    <div>Ngày tạo</div>
                                    <div className="text-right">Thao tác</div>
                                </div>

                                <div className="mt-3 grid gap-2">
                                    {users.map((user) => {
                                        const isUpdating = updatingUserId === user.id;
                                        const isUpdatingKaiwa = updatingKaiwaUserId === user.id;
                                        const isUpdatingLevel = updatingLevelUserId === user.id;
                                        const selectedJlptLevel =
                                            draftJlptLevels[user.id] ?? user.currentJlptLevel;
                                        const hasUnsavedJlptLevel =
                                            selectedJlptLevel !== user.currentJlptLevel;

                                        return (
                                            <div
                                                key={user.id}
                                                className="akari-vocabulary-table-row akari-admin-users-row grid grid-cols-[1.35fr_0.85fr_0.75fr_1.05fr_0.85fr_0.9fr_1.55fr] items-center rounded-2xl border border-pink-50/80 px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-pink-50/45"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-black text-slate-800">
                                                        {user.displayName}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="inline-flex rounded-full border border-pink-100 bg-pink-50 px-3 py-1 text-xs font-black text-pink-600">
                                                        {getApprovalStatusLabel(user.approvalStatus)}
                                                    </span>
                                                </div>

                                                <div className="font-bold text-slate-600">
                                                    {getRoleLabel(user.role)}
                                                </div>

                                                <div className="flex items-end gap-2">
                                                    <div className="w-24">
                                                        <AppSelect
                                                            label="JLPT"
                                                            items={jlptLevelOptions}
                                                            value={selectedJlptLevel}
                                                            disabled={isUpdatingLevel || user.role === "admin"}
                                                            isLoading={isUpdatingLevel}
                                                            onChange={(level) =>
                                                                handleJlptLevelDraftChange(user, level)
                                                            }
                                                        />
                                                    </div>
                                                    {hasUnsavedJlptLevel ? (
                                                        <button
                                                            type="button"
                                                            disabled={isUpdatingLevel}
                                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-3 text-xs font-black text-white shadow-sm transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-45"
                                                            onClick={() => void handleJlptLevelSave(user)}
                                                        >
                                                            <CheckCircle2 size={16} />
                                                            Lưu
                                                        </button>
                                                    ) : null}
                                                </div>

                                                <div>
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${
                                                            user.canAccessKaiwa
                                                                ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                                                                : "border-slate-100 bg-slate-50 text-slate-500"
                                                        }`}
                                                    >
                                                        {user.canAccessKaiwa ? (
                                                            <Eye size={14} />
                                                        ) : (
                                                            <EyeOff size={14} />
                                                        )}
                                                        {user.canAccessKaiwa ? "Được xem" : "Chưa mở"}
                                                    </span>
                                                </div>

                                                <div className="font-semibold text-slate-500">
                                                    {formatDate(user.createdAt)}
                                                </div>

                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isUpdatingKaiwa || user.role === "admin"}
                                                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
                                                            user.canAccessKaiwa
                                                                ? "border border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                                                                : "bg-violet-500 text-white hover:bg-violet-600"
                                                        }`}
                                                        onClick={() =>
                                                            void handleKaiwaAccess(
                                                                user,
                                                                !user.canAccessKaiwa,
                                                            )
                                                        }
                                                    >
                                                        {user.canAccessKaiwa ? (
                                                            <EyeOff size={16} />
                                                        ) : (
                                                            <Eye size={16} />
                                                        )}
                                                        {user.canAccessKaiwa ? "Tắt Kaiwa" : "Mở Kaiwa"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isUpdating || user.approvalStatus === "approved"}
                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-45"
                                                        onClick={() => void handleApproval(user, "approved")}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isUpdating || user.approvalStatus === "rejected"}
                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 text-xs font-black text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-45"
                                                        onClick={() => void handleApproval(user, "rejected")}
                                                    >
                                                        <XCircle size={16} />
                                                        Từ chối
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isUpdating || user.approvalStatus === "pending"}
                                                        className="akari-vocabulary-action inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white px-3 text-xs font-black text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                                                        onClick={() => void handleApproval(user, "pending")}
                                                    >
                                                        <UserCheck size={16} />
                                                        Chờ lại
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {users.length === 0 ? (
                                        <div className="akari-admin-users-row rounded-2xl border border-pink-50/80 px-5 py-12 text-center text-sm font-bold text-slate-500">
                                            Chưa có tài khoản nào.
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </AppShell>
    );
}
