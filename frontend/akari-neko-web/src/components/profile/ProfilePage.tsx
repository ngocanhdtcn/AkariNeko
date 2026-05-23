"use client";

import { ImagePlus, Save, Trash2, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    allowedAvatarTypes,
    deleteCurrentUserAvatarByUrl,
    updateCurrentProfile,
    uploadCurrentUserAvatar,
    validateAvatarFile,
} from "@/services/authService";
import { AppSelect } from "@/components/ui/AppSelect";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { clearPersistedStudyFilters } from "@/hooks/useStudyFilterPersistence";

const jlptLevelOptions = ["N5", "N4", "N3", "N2", "N1"];

export function ProfilePage() {
    const { profile, refreshProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const avatarPreviewObjectUrlRef = useRef<string | null>(null);

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [currentJlptLevel, setCurrentJlptLevel] = useState("N5");
    const [isSaving, setIsSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileMessage, setProfileMessage] = useState<string | null>(null);

    function clearAvatarPreview() {
        if (avatarPreviewObjectUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
            avatarPreviewObjectUrlRef.current = null;
        }

        setAvatarPreviewUrl(null);
        setSelectedAvatarFile(null);
    }

    useEffect(() => {
        if (!profile) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayName(profile.displayName);
        setAvatarUrl(profile.avatarUrl ?? "");
        setCurrentJlptLevel(profile.currentJlptLevel || "N5");
        clearAvatarPreview();
    }, [profile]);

    useEffect(() => {
        return () => {
            if (avatarPreviewObjectUrlRef.current) {
                URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
            }
        };
    }, []);

    function handleChooseAvatar() {
        fileInputRef.current?.click();
    }

    function handleAvatarFileChange(file: File | undefined) {
        setProfileError(null);
        setProfileMessage(null);

        if (!file) {
            return;
        }

        try {
            validateAvatarFile(file);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Ảnh không hợp lệ. Vui lòng chọn ảnh khác.";
            setProfileError(message);
            return;
        }

        clearAvatarPreview();

        const objectUrl = URL.createObjectURL(file);
        avatarPreviewObjectUrlRef.current = objectUrl;
        setAvatarPreviewUrl(objectUrl);
        setSelectedAvatarFile(file);
    }

    function handleRemoveAvatar() {
        clearAvatarPreview();
        setAvatarUrl("");
        setProfileError(null);
        setProfileMessage("Ảnh đại diện sẽ được xóa khi bạn lưu hồ sơ.");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handleSaveProfile() {
        setIsSaving(true);
        setProfileError(null);
        setProfileMessage(null);
        const previousJlptLevel = profile?.currentJlptLevel;

        try {
            let nextAvatarUrl = avatarUrl.trim();
            const previousAvatarUrl = profile?.avatarUrl ?? null;

            if (selectedAvatarFile) {
                nextAvatarUrl = await uploadCurrentUserAvatar(selectedAvatarFile);
            }

            await updateCurrentProfile({
                displayName: displayName.trim() || profile?.email || "Akari user",
                avatarUrl: nextAvatarUrl || null,
                currentJlptLevel,
            });

            if (previousAvatarUrl && previousAvatarUrl !== nextAvatarUrl) {
                await deleteCurrentUserAvatarByUrl(previousAvatarUrl);
            }

            if (previousJlptLevel && previousJlptLevel !== currentJlptLevel) {
                ["vocabulary", "flashcard", "quiz"].forEach(clearPersistedStudyFilters);
            }

            setAvatarUrl(nextAvatarUrl);
            clearAvatarPreview();

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            await refreshProfile({ showLoading: false });

            setProfileMessage("Đã cập nhật hồ sơ.");
        } catch (error) {
            console.error("Failed to update profile:", error);
            const fallbackMessage =
                error instanceof Error
                    ? error.message
                    : "Không thể cập nhật hồ sơ. Vui lòng thử lại.";
            setProfileError(fallbackMessage);
        } finally {
            setIsSaving(false);
        }
    }

    const previewAvatarUrl = avatarPreviewUrl ?? avatarUrl;
    const saveButtonLabel =
        isSaving && selectedAvatarFile ? "Đang tải ảnh lên..." : isSaving ? "Đang lưu..." : "Lưu hồ sơ";

    return (
        <div className="grid gap-5">
            <PageHeader
                eyebrow="Profile"
                title="Hồ sơ học tập"
                description="Quản lý tên hiển thị, ảnh đại diện và cấp độ JLPT hiện tại của bạn."
                icon={<UserRound size={21} />}
            />

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-6 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
                    <div className="grid gap-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                Avatar
                            </span>
                            <UserAvatar
                                name={displayName}
                                avatarUrl={previewAvatarUrl}
                                className="mt-2 aspect-square w-full max-w-[320px] rounded-[32px] text-7xl"
                            />
                            <p className="mt-3 text-sm font-bold text-slate-500">
                                {profile?.email}
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={allowedAvatarTypes.join(",")}
                            className="sr-only"
                            onChange={(event) =>
                                handleAvatarFileChange(event.target.files?.[0])
                            }
                        />

                        <div className="flex flex-wrap gap-2">
                            <AppButton
                                icon={<ImagePlus size={17} />}
                                disabled={isSaving}
                                onClick={handleChooseAvatar}
                            >
                                Chọn ảnh mới
                            </AppButton>
                            <AppButton
                                variant="danger"
                                icon={<Trash2 size={17} />}
                                disabled={isSaving || (!previewAvatarUrl && !selectedAvatarFile)}
                                onClick={handleRemoveAvatar}
                            >
                                Xóa ảnh
                            </AppButton>
                        </div>

                        <p className="text-sm font-semibold text-slate-400">
                            Dung lượng tối đa 2MB. Hỗ trợ JPG, PNG, WEBP.
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
                                disabled={isSaving}
                                onChange={(event) => setDisplayName(event.target.value)}
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
                                className="akari-profile-save-button h-12 px-6"
                                onClick={() => void handleSaveProfile()}
                            >
                                {saveButtonLabel}
                            </AppButton>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
