"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import type { VocabularyListItem } from "@/services/vocabularyService";

const jlptLevelOptions = ["N5", "N4", "N3", "N2", "N1"];

type EditVocabularyModalProps = {
    vocabulary: VocabularyListItem | null;
    isSaving: boolean;
    errorMessage?: string | null;
    onClose: () => void;
    onSave: (vocabulary: VocabularyListItem) => void;
};

export function EditVocabularyModal({
    vocabulary,
    isSaving,
    errorMessage,
    onClose,
    onSave,
}: EditVocabularyModalProps) {
    const [editingVocabulary, setEditingVocabulary] =
        useState<VocabularyListItem | null>(null);

    useBodyScrollLock(Boolean(vocabulary));

    useEffect(() => {
        // Keep the editable draft in sync when a different row is selected.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditingVocabulary(vocabulary);
    }, [vocabulary]);

    if (!editingVocabulary) {
        return null;
    }

    function updateField(field: keyof VocabularyListItem, value: string) {
        setEditingVocabulary((current) =>
            current
                ? {
                    ...current,
                    [field]: value,
                }
                : current,
        );
    }

    return (
        <AnimatePresence>
            {vocabulary ? (
                <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto overscroll-contain px-4 py-4 sm:py-6">
                    <motion.button
                        type="button"
                        aria-label="Close edit modal overlay"
                        className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.section
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-pink-100 bg-white shadow-[0_28px_80px_rgba(236,72,153,0.24)] sm:max-h-[calc(100dvh-48px)]"
                    >
                        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-pink-50 bg-gradient-to-r from-pink-50 to-violet-50 px-6 py-5">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                                    Edit vocabulary
                                </p>
                                <h2 className="mt-1 text-2xl font-black text-slate-800">
                                    Sửa từ vựng
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-500 shadow-sm transition hover:bg-pink-50 hover:text-pink-500"
                                onClick={onClose}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid min-h-0 gap-4 overflow-y-auto overscroll-contain p-6">
                            {errorMessage ? (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                                    {errorMessage}
                                </div>
                            ) : null}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Kanji
                                    </span>
                                    <input
                                        value={editingVocabulary.kanji}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        onChange={(event) => updateField("kanji", event.target.value)}
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Hiragana
                                    </span>
                                    <input
                                        value={editingVocabulary.hiragana}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        onChange={(event) =>
                                            updateField("hiragana", event.target.value)
                                        }
                                    />
                                </label>
                            </div>

                            <label className="grid gap-2">
                                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Meaning
                                </span>
                                <textarea
                                    value={editingVocabulary.meaning}
                                    rows={4}
                                    className="resize-none rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                    onChange={(event) => updateField("meaning", event.target.value)}
                                />
                            </label>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Level
                                    </span>
                                    <select
                                        value={editingVocabulary.level}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        onChange={(event) => updateField("level", event.target.value)}
                                    >
                                        {jlptLevelOptions.map((level) => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Book
                                    </span>
                                    <input
                                        value={editingVocabulary.book}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        onChange={(event) => updateField("book", event.target.value)}
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Chapter
                                    </span>
                                    <input
                                        value={editingVocabulary.chapter}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        onChange={(event) =>
                                            updateField("chapter", event.target.value)
                                        }
                                    />
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-pink-50 pt-5">
                                <button
                                    type="button"
                                    className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={isSaving}
                                    className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                    onClick={() => onSave(editingVocabulary)}
                                >
                                    {isSaving ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </div>
                    </motion.section>
                </div>
            ) : null}
        </AnimatePresence>
    );
}
