"use client";

import { Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { AppSelect } from "@/components/ui/AppSelect";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import type {
  GrammarExample,
  GrammarMutation,
  GrammarPoint,
  JlptLevel,
} from "@/services/grammarService";

type GrammarFormProps = {
  isOpen: boolean;
  grammar?: GrammarPoint | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: GrammarMutation) => void;
};

type GrammarFormErrors = Partial<Record<keyof GrammarMutation, string>>;

const jlptLevels: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const emptyExample: GrammarExample = { jp: "", reading: "", vi: "" };

const emptyForm: GrammarMutation = {
  jlptLevel: "N5",
  title: "",
  structure: "",
  meaning: "",
  explanation: "",
  examples: [emptyExample],
  notes: "",
};

function buildInitialForm(grammar?: GrammarPoint | null): GrammarMutation {
  if (!grammar) {
    return emptyForm;
  }

  return {
    jlptLevel: grammar.jlptLevel,
    title: grammar.title,
    structure: grammar.structure ?? "",
    meaning: grammar.meaning,
    explanation: grammar.explanation ?? "",
    examples: grammar.examples.length ? grammar.examples : [emptyExample],
    notes: grammar.notes ?? "",
  };
}

function trimExample(example: GrammarExample): GrammarExample {
  return {
    jp: example.jp.trim(),
    reading: (example.reading ?? "").trim(),
    vi: (example.vi ?? "").trim(),
  };
}

export function GrammarForm({
  isOpen,
  grammar,
  isSaving = false,
  onClose,
  onSubmit,
}: GrammarFormProps) {
  const [form, setForm] = useState<GrammarMutation>(emptyForm);
  const [errors, setErrors] = useState<GrammarFormErrors>({});
  const mode = grammar ? "edit" : "create";
  const title = mode === "edit" ? "Sửa ngữ pháp" : "Thêm ngữ pháp";

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = window.setTimeout(() => {
        setForm(buildInitialForm(grammar));
        setErrors({});
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [grammar, isOpen]);

  const examples = useMemo(() => {
    return form.examples.length ? form.examples : [emptyExample];
  }, [form.examples]);

  if (!isOpen) {
    return null;
  }

  function updateExample(
    index: number,
    key: keyof GrammarExample,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      examples: examples.map((example, exampleIndex) =>
        exampleIndex === index ? { ...example, [key]: value } : example,
      ),
    }));
  }

  function addExample() {
    setForm((current) => ({
      ...current,
      examples: [...examples, { ...emptyExample }],
    }));
  }

  function removeExample(index: number) {
    setForm((current) => {
      const nextExamples = examples.filter((_, exampleIndex) => exampleIndex !== index);

      return {
        ...current,
        examples: nextExamples.length ? nextExamples : [{ ...emptyExample }],
      };
    });
  }

  function validate(payload: GrammarMutation) {
    const nextErrors: GrammarFormErrors = {};

    if (!payload.jlptLevel) {
      nextErrors.jlptLevel = "Vui lòng chọn cấp độ JLPT.";
    }

    if (!payload.title) {
      nextErrors.title = "Vui lòng nhập tên mẫu ngữ pháp.";
    }

    if (!payload.meaning) {
      nextErrors.meaning = "Vui lòng nhập ý nghĩa.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit() {
    const payload: GrammarMutation = {
      jlptLevel: form.jlptLevel,
      title: form.title.trim(),
      structure: form.structure.trim(),
      meaning: form.meaning.trim(),
      explanation: form.explanation.trim(),
      notes: form.notes?.trim(),
      examples: examples.map(trimExample).filter((example) => {
        return example.jp || example.reading || example.vi;
      }),
    };

    if (!validate(payload)) {
      return;
    }

    onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto overscroll-contain bg-slate-900/30 px-3 py-4 backdrop-blur-sm sm:px-4">
      <div className="mx-auto w-full max-w-3xl rounded-[30px] border border-pink-100 bg-white p-4 shadow-[0_24px_80px_rgba(236,72,153,0.22)] sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-pink-50 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-500">
              Grammar
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-800">{title}</h2>
          </div>

          <button
            type="button"
            aria-label="Đóng biểu mẫu"
            disabled={isSaving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-400 shadow-sm transition hover:bg-pink-50 hover:text-pink-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
            <AppSelect
              label="JLPT"
              items={jlptLevels}
              value={form.jlptLevel}
              disabled={isSaving}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  jlptLevel: value as JlptLevel,
                }))
              }
            />

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Tên mẫu ngữ pháp
              </span>
              <AppInput
                value={form.title}
                disabled={isSaving}
                placeholder="Ví dụ: 〜ている"
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
              {errors.title ? (
                <span className="text-xs font-bold text-rose-500">
                  {errors.title}
                </span>
              ) : null}
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Cấu trúc
            </span>
            <AppInput
              value={form.structure}
              disabled={isSaving}
              placeholder="Động từ thể て + いる"
              onChange={(event) =>
                setForm((current) => ({ ...current, structure: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Ý nghĩa
            </span>
            <AppInput
              value={form.meaning}
              disabled={isSaving}
              placeholder="Diễn tả hành động đang diễn ra hoặc trạng thái tiếp diễn"
              onChange={(event) =>
                setForm((current) => ({ ...current, meaning: event.target.value }))
              }
            />
            {errors.meaning ? (
              <span className="text-xs font-bold text-rose-500">
                {errors.meaning}
              </span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Cách dùng
            </span>
            <textarea
              value={form.explanation}
              disabled={isSaving}
              className="min-h-28 rounded-2xl border border-pink-100 bg-white/85 px-4 py-3 text-sm font-semibold leading-7 text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  explanation: event.target.value,
                }))
              }
            />
          </label>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Ví dụ
              </span>
              <AppButton
                variant="soft"
                icon={<Plus size={16} />}
                disabled={isSaving}
                onClick={addExample}
              >
                Thêm ví dụ
              </AppButton>
            </div>

            {examples.map((example, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-violet-500">
                    Ví dụ {index + 1}
                  </span>
                  <button
                    type="button"
                    disabled={isSaving}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-500 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => removeExample(index)}
                  >
                    <Trash2 size={15} />
                    Xóa ví dụ
                  </button>
                </div>

                <label className="grid gap-2">
                  <span className="text-xs font-bold text-slate-400">Câu tiếng Nhật</span>
                  <AppInput
                    value={example.jp}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateExample(index, "jp", event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-slate-400">Cách đọc</span>
                  <AppInput
                    value={example.reading ?? ""}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateExample(index, "reading", event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-slate-400">Nghĩa tiếng Việt</span>
                  <AppInput
                    value={example.vi ?? ""}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateExample(index, "vi", event.target.value)
                    }
                  />
                </label>
              </div>
            ))}
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Ghi chú
            </span>
            <textarea
              value={form.notes ?? ""}
              disabled={isSaving}
              className="min-h-20 rounded-2xl border border-pink-100 bg-white/85 px-4 py-3 text-sm font-semibold leading-7 text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-pink-50 pt-4 sm:flex-row sm:justify-end">
          <AppButton variant="secondary" disabled={isSaving} onClick={onClose}>
            Hủy
          </AppButton>
          <AppButton
            variant="primary"
            disabled={isSaving}
            icon={<Save size={17} />}
            onClick={handleSubmit}
          >
            {isSaving
              ? mode === "edit"
                ? "Đang cập nhật..."
                : "Đang lưu..."
              : mode === "edit"
                ? "Cập nhật"
                : "Lưu ngữ pháp"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
