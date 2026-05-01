"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { CreateVocabularyInput } from "@/services/vocabularyService";

const jlptLevelOptions = ["N5", "N4", "N3", "N2", "N1"];

const defaultVocabulary: CreateVocabularyInput = {
    book: "JTest",
    level: "N2",
    chapter: "",
    kanji: "",
    hiragana: "",
    meaning: "",
};

type AddVocabularyModalProps = {
    isOpen: boolean;
    isSaving: boolean;
    errorMessage?: string | null;
    onClose: () => void;
    onSave: (vocabulary: CreateVocabularyInput) => void;
};

export function AddVocabularyModal({
    isOpen,
    isSaving,
    errorMessage,
    onClose,
    onSave,
}: AddVocabularyModalProps) {
    const [vocabulary, setVocabulary] =
        useState<CreateVocabularyInput>(defaultVocabulary);

    useEffect(() => {
        if (isOpen) {
            // Reset the form draft each time the add modal opens.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setVocabulary(defaultVocabulary);
        }
    }, [isOpen]);

    function updateField(field: keyof CreateVocabularyInput, value: string) {
        setVocabulary((current) => ({
            ...current,
            [field]: value,
        }));
    }

    const canSave =
        vocabulary.book.trim() &&
        vocabulary.level.trim() &&
        vocabulary.chapter.trim() &&
        vocabulary.kanji.trim() &&
        vocabulary.hiragana.trim() &&
        vocabulary.meaning.trim();

    return (
        <AnimatePresence>
            {isOpen ? (
                <div className="fixed inset-0 z-[110] grid place-items-center px-4">
                    <motion.button
                        type="button"
                        aria-label="Close add modal overlay"
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
                        className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border border-pink-100 bg-white shadow-[0_28px_80px_rgba(236,72,153,0.24)]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-pink-50 bg-gradient-to-r from-pink-50 to-violet-50 px-6 py-5">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                                    Add vocabulary
                                </p>
                                <h2 className="mt-1 text-2xl font-black text-slate-800">
                                    Thêm từ vựng thủ công
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

                        <div className="grid gap-4 p-6">
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
                                        value={vocabulary.kanji}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        onChange={(event) =>
                                            updateField("kanji", event.target.value)
                                        }
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Hiragana
                                    </span>
                                    <input
                                        value={vocabulary.hiragana}
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
                                    value={vocabulary.meaning}
                                    rows={4}
                                    className="resize-none rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                    onChange={(event) =>
                                        updateField("meaning", event.target.value)
                                    }
                                />
                            </label>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Level
                                    </span>
                                    <select
                                        value={vocabulary.level}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        onChange={(event) =>
                                            updateField("level", event.target.value)
                                        }
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
                                        value={vocabulary.book}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        onChange={(event) =>
                                            updateField("book", event.target.value)
                                        }
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Chapter
                                    </span>
                                    <input
                                        value={vocabulary.chapter}
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
                                    disabled={isSaving || !canSave}
                                    className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                    onClick={() => onSave(vocabulary)}
                                >
                                    {isSaving ? "Saving..." : "Add word"}
                                </button>
                            </div>
                        </div>
                    </motion.section>
                </div>
            ) : null}
        </AnimatePresence>
    );
}
