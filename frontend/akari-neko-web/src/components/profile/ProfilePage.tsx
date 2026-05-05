"use client";

import { Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateCurrentProfile } from "@/services/authService";
import { AppSelect } from "@/components/ui/AppSelect";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { clearPersistedStudyFilters } from "@/hooks/useStudyFilterPersistence";

const jlptLevelOptions = ["N5", "N4", "N3", "N2", "N1"];

export function ProfilePage() {
    const { profile, refreshProfile } = useAuth();

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [currentJlptLevel, setCurrentJlptLevel] = useState("N5");
    const [isSaving, setIsSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileMessage, setProfileMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!profile) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayName(profile.displayName);
        setAvatarUrl(profile.avatarUrl ?? "");
        setCurrentJlptLevel(profile.currentJlptLevel || "N5");
    }, [profile]);

    async function handleSaveProfile() {
        setIsSaving(true);
        setProfileError(null);
        setProfileMessage(null);
        const previousJlptLevel = profile?.currentJlptLevel;

        try {
            await updateCurrentProfile({
                displayName: displayName.trim() || profile?.email || "Akari user",
                avatarUrl: avatarUrl.trim() || null,
                currentJlptLevel,
            });

            if (previousJlptLevel && previousJlptLevel !== currentJlptLevel) {
                ["vocabulary", "flashcard", "quiz"].forEach(clearPersistedStudyFilters);
            }

            await refreshProfile();

            setProfileMessage("Đã cập nhật hồ sơ.");
        } catch (error) {
            console.error("Failed to update profile:", error);
            setProfileError("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="grid gap-5">
            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-6 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                            Profile
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-slate-800">
                            Hồ sơ học tập
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Quản lý tên hiển thị và cấp độ JLPT hiện tại của bạn.
                        </p>
                    </div>

                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-pink-50 text-pink-500">
                        <UserRound size={32} />
                    </div>
                </div>
            </section>

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-6 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="grid gap-5">
                    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
                        <div>
                            <UserAvatar
                                name={displayName}
                                avatarUrl={avatarUrl}
                                className="aspect-square w-full max-w-[320px] rounded-[32px] text-7xl"
                            />

                            <p className="mt-3 text-sm font-bold text-slate-500">
                                {profile?.email}
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <label className="grid gap-2">
                                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Display name
                                </span>
                                <input
                                    value={displayName}
                                    className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                    placeholder="Tên hiển thị"
                                    onChange={(event) => setDisplayName(event.target.value)}
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Avatar URL
                                </span>
                                <input
                                    value={avatarUrl}
                                    className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                    placeholder="https://..."
                                    onChange={(event) => setAvatarUrl(event.target.value)}
                                />
                            </label>

                            <AppSelect
                                label="Current JLPT level"
                                items={jlptLevelOptions}
                                value={currentJlptLevel}
                                onChange={setCurrentJlptLevel}
                            />

                            {profileError ? (
                                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
                                    {profileError}
                                </div>
                            ) : null}

                            {profileMessage ? (
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
                                    {profileMessage}
                                </div>
                            ) : null}

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                    onClick={() => void handleSaveProfile()}
                                >
                                    <Save size={17} />
                                    {isSaving ? "Saving..." : "Save profile"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
