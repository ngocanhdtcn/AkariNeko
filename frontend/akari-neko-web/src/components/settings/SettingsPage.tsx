"use client";

import { Bell, BookOpen, Save, Settings, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppBadge } from "@/components/ui/AppBadge";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { AppSelect } from "@/components/ui/AppSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoftPanel } from "@/components/ui/SoftPanel";
import { useAuth } from "@/contexts/AuthContext";
import {
    defaultUserSettings,
    getOrCreateUserSettings,
    isMissingUserSettingsTableError,
    upsertUserSettings,
    type JlptLevel,
    type ThemePreference,
    type UserSettingsUpdate,
} from "@/services/settingsService";

const themeOptions: ThemePreference[] = ["system", "light", "sakura", "violet"];
const jlptLevelOptions: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const quizQuestionCountOptions = ["5", "10", "20", "30", "50"];

const themeLabels: Record<ThemePreference, string> = {
    system: "Theo hệ thống",
    light: "Sáng",
    sakura: "Sakura",
    violet: "Violet",
};

function clampDailyGoal(value: number) {
    if (!Number.isFinite(value)) {
        return defaultUserSettings.dailyGoal;
    }

    return Math.min(500, Math.max(1, Math.round(value)));
}

function SettingRow({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-3 rounded-3xl border border-pink-50 bg-white/80 p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] lg:items-center">
            <div>
                <h3 className="text-base font-black text-slate-800">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function ToggleButton({
    enabled,
    enabledLabel,
    disabledLabel,
    onToggle,
}: {
    enabled: boolean;
    enabledLabel: string;
    disabledLabel: string;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={enabled}
            className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-bold shadow-sm outline-none transition focus-visible:ring-4 focus-visible:ring-pink-100 ${
                enabled
                    ? "border-pink-200 bg-pink-50 text-pink-600"
                    : "border-slate-100 bg-white text-slate-500 hover:bg-pink-50/60"
            }`}
            onClick={onToggle}
        >
            <span>{enabled ? enabledLabel : disabledLabel}</span>
            <span
                className={`relative h-7 w-13 rounded-full p-1 transition ${
                    enabled ? "bg-pink-400" : "bg-slate-200"
                }`}
            >
                <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                />
            </span>
        </button>
    );
}

export function SettingsPage() {
    const { profile } = useAuth();
    const [settings, setSettings] =
        useState<UserSettingsUpdate>(defaultUserSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [needsMigration, setNeedsMigration] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

    const selectedThemeLabel = useMemo(
        () => themeLabels[settings.theme],
        [settings.theme],
    );

    useEffect(() => {
        const profileId = profile?.id;

        if (!profileId) {
            return;
        }

        let isMounted = true;
        const userId = profileId;

        async function loadSettings() {
            setIsLoading(true);
            setNeedsMigration(false);
            setSettingsError(null);

            try {
                const currentSettings = await getOrCreateUserSettings(userId);

                if (!isMounted) {
                    return;
                }

                setSettings({
                    theme: currentSettings.theme,
                    soundEnabled: currentSettings.soundEnabled,
                    dailyGoal: currentSettings.dailyGoal,
                    preferredJlptLevel: currentSettings.preferredJlptLevel,
                    flashcardAutoFlip: currentSettings.flashcardAutoFlip,
                    quizQuestionCount: currentSettings.quizQuestionCount,
                });
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                if (isMissingUserSettingsTableError(error)) {
                    setNeedsMigration(true);
                } else {
                    setSettingsError("Không thể tải cài đặt. Vui lòng thử lại.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadSettings();

        return () => {
            isMounted = false;
        };
    }, [profile?.id]);

    function updateSetting<Key extends keyof UserSettingsUpdate>(
        key: Key,
        value: UserSettingsUpdate[Key],
    ) {
        setSettings((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSaveSettings() {
        if (!profile?.id || isSaving) {
            return;
        }

        const nextSettings = {
            ...settings,
            dailyGoal: clampDailyGoal(settings.dailyGoal),
        };

        setIsSaving(true);
        setSettingsError(null);
        setSettingsMessage(null);

        try {
            const savedSettings = await upsertUserSettings(profile.id, nextSettings);
            setSettings({
                theme: savedSettings.theme,
                soundEnabled: savedSettings.soundEnabled,
                dailyGoal: savedSettings.dailyGoal,
                preferredJlptLevel: savedSettings.preferredJlptLevel,
                flashcardAutoFlip: savedSettings.flashcardAutoFlip,
                quizQuestionCount: savedSettings.quizQuestionCount,
            });
            setSettingsMessage("Đã lưu cài đặt học tập.");
        } catch (error) {
            if (isMissingUserSettingsTableError(error)) {
                setNeedsMigration(true);
            }

            console.error("Failed to save settings:", error);
            setSettingsError("Không thể lưu cài đặt. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="grid gap-5">
                <LoadingSkeleton variant="card" />
                <LoadingSkeleton variant="list" rows={5} />
            </div>
        );
    }

    if (needsMigration) {
        return (
            <EmptyState
                icon={<Settings size={24} />}
                title="Cần tạo bảng cài đặt"
                description="Tính năng này cần được khởi tạo trong Supabase. Vui lòng chạy SQL setup tương ứng trong Supabase SQL Editor rồi tải lại trang."
                actionLabel="Thử tải lại"
                onAction={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="grid gap-5">
            <PageHeader
                eyebrow="Settings"
                title="Cài đặt học tập"
                description="Tuỳ chỉnh trải nghiệm AkariNeko nhẹ nhàng theo thói quen học của bạn."
                icon={<Settings size={21} />}
                action={
                    <AppButton
                        variant="primary"
                        icon={<Save size={17} />}
                        disabled={isSaving}
                        className="h-12 px-5"
                        onClick={() => void handleSaveSettings()}
                    >
                        {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
                    </AppButton>
                }
            />

            <SoftPanel className="grid gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <AppBadge tone="pink">Theme: {selectedThemeLabel}</AppBadge>
                    <AppBadge tone={settings.soundEnabled ? "emerald" : "slate"}>
                        {settings.soundEnabled ? "Âm thanh bật" : "Âm thanh tắt"}
                    </AppBadge>
                    <AppBadge tone="violet">{settings.preferredJlptLevel}</AppBadge>
                </div>

                {settingsError ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
                        {settingsError}
                    </div>
                ) : null}

                {settingsMessage ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
                        {settingsMessage}
                    </div>
                ) : null}

                <SettingRow
                    title="Giao diện"
                    description="Chọn vibe màu chủ đạo cho AkariNeko. V1 chỉ lưu tuỳ chọn, chưa ép toàn app đổi theme."
                >
                    <AppSelect
                        label="Theme"
                        items={themeOptions}
                        value={settings.theme}
                        onChange={(value) =>
                            updateSetting("theme", value as ThemePreference)
                        }
                    />
                </SettingRow>

                <SettingRow
                    title="Âm thanh"
                    description="Bật/tắt âm thanh phản hồi cho các trải nghiệm học sau này."
                >
                    <ToggleButton
                        enabled={settings.soundEnabled}
                        enabledLabel="Đang bật"
                        disabledLabel="Đang tắt"
                        onToggle={() =>
                            updateSetting("soundEnabled", !settings.soundEnabled)
                        }
                    />
                </SettingRow>

                <SettingRow
                    title="Mục tiêu học mỗi ngày"
                    description="Số lượt ôn mong muốn mỗi ngày. Giá trị hợp lệ từ 1 đến 500."
                >
                    <AppInput
                        type="number"
                        min={1}
                        max={500}
                        value={settings.dailyGoal}
                        icon={<BookOpen size={17} />}
                        onChange={(event) =>
                            updateSetting(
                                "dailyGoal",
                                clampDailyGoal(Number(event.target.value)),
                            )
                        }
                    />
                </SettingRow>

                <SettingRow
                    title="JLPT ưu tiên"
                    description="Cấp độ bạn muốn AkariNeko ưu tiên khi gợi ý học."
                >
                    <AppSelect
                        label="Preferred JLPT"
                        items={jlptLevelOptions}
                        value={settings.preferredJlptLevel}
                        onChange={(value) =>
                            updateSetting("preferredJlptLevel", value as JlptLevel)
                        }
                    />
                </SettingRow>

                <SettingRow
                    title="Flashcard auto flip"
                    description="Lưu tuỳ chọn tự lật flashcard cho các bản cập nhật học tập sau."
                >
                    <ToggleButton
                        enabled={settings.flashcardAutoFlip}
                        enabledLabel="Tự lật bật"
                        disabledLabel="Tự lật tắt"
                        onToggle={() =>
                            updateSetting(
                                "flashcardAutoFlip",
                                !settings.flashcardAutoFlip,
                            )
                        }
                    />
                </SettingRow>

                <SettingRow
                    title="Số câu hỏi quiz"
                    description="Số câu mặc định bạn muốn dùng khi tạo quiz mới."
                >
                    <AppSelect
                        label="Quiz questions"
                        items={quizQuestionCountOptions}
                        value={String(settings.quizQuestionCount)}
                        onChange={(value) =>
                            updateSetting("quizQuestionCount", Number(value))
                        }
                    />
                </SettingRow>

                <div className="flex flex-col gap-3 border-t border-pink-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                        {settings.soundEnabled ? (
                            <Volume2 size={17} className="text-emerald-500" />
                        ) : (
                            <VolumeX size={17} className="text-slate-400" />
                        )}
                        Cài đặt sẽ được lưu vào Supabase cho tài khoản hiện tại.
                    </p>

                    <AppButton
                        variant="primary"
                        icon={<Bell size={17} />}
                        disabled={isSaving}
                        className="h-12"
                        onClick={() => void handleSaveSettings()}
                    >
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </AppButton>
                </div>
            </SoftPanel>
        </div>
    );
}
