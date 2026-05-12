"use client";

import { Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateCurrentProfile } from "@/services/authService";
import { AppSelect } from "@/components/ui/AppSelect";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { PageHeader } from "@/components/ui/PageHeader";
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
        const normalizedAvatarUrl = avatarUrl.trim();

        if (normalizedAvatarUrl) {
            try {
                const parsedAvatarUrl = new URL(normalizedAvatarUrl);

                if (!["http:", "https:"].includes(parsedAvatarUrl.protocol)) {
                    throw new Error("Avatar URL phải bắt đầu bằng http hoặc https.");
                }
            } catch {
                const fallbackMessage = "Avatar URL không hợp lệ.";
                setProfileError(fallbackMessage);
                return;
            }
        }

        setIsSaving(true);
        setProfileError(null);
        setProfileMessage(null);
        const previousJlptLevel = profile?.currentJlptLevel;

        try {
            await updateCurrentProfile({
                displayName: displayName.trim() || profile?.email || "Akari user",
                avatarUrl: normalizedAvatarUrl || null,
                currentJlptLevel,
            });

            if (previousJlptLevel && previousJlptLevel !== currentJlptLevel) {
                ["vocabulary", "flashcard", "quiz"].forEach(clearPersistedStudyFilters);
            }

            await refreshProfile();

            setProfileMessage("Đã cập nhật hồ sơ.");
        } catch (error) {
            console.error("Failed to update profile:", error);
            const fallbackMessage = "Không thể cập nhật hồ sơ. Vui lòng thử lại.";
            setProfileError(fallbackMessage);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="grid gap-5">
            <PageHeader
                eyebrow="Profile"
                title="Hồ sơ học tập"
                description="Quản lý tên hiển thị và cấp độ JLPT hiện tại của bạn."
                icon={<UserRound size={21} />}
            />

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
                                <AppInput
                                    value={displayName}
                                    className="w-full"
                                    placeholder="Tên hiển thị"
                                    onChange={(event) => setDisplayName(event.target.value)}
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Avatar URL
                                </span>
                                <AppInput
                                    value={avatarUrl}
                                    className="w-full"
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
                                <AppButton
                                    variant="primary"
                                    icon={<Save size={17} />}
                                    disabled={isSaving}
                                    className="h-12 px-6"
                                    onClick={() => void handleSaveProfile()}
                                >
                                    {isSaving ? "Đang lưu..." : "Lưu hồ sơ"}
                                </AppButton>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
