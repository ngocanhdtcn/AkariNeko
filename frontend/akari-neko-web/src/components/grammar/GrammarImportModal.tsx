"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, FilePlus2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  grammarCsvUsedColumns,
  importGrammarRows,
  parseGrammarCsv,
  type GrammarImportRow,
  type ImportResult,
} from "@/services/grammarImportService";

type GrammarImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted?: () => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Không thể import file CSV. Vui lòng thử lại.";
}

export function GrammarImportModal({
  isOpen,
  onClose,
  onImportCompleted,
}: GrammarImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [rows, setRows] = useState<GrammarImportRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useBodyScrollLock(isOpen);

  function resetState() {
    setSelectedFileName("");
    setRows([]);
    setResult(null);
    setErrorMessage(null);
    setIsParsing(false);
    setIsImporting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose() {
    if (isParsing || isImporting) {
      return;
    }

    resetState();
    onClose();
  }

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(file: File | null) {
    setResult(null);
    setErrorMessage(null);

    if (!file) {
      setSelectedFileName("");
      setRows([]);
      return;
    }

    setSelectedFileName(file.name);
    setIsParsing(true);

    try {
      const parsedRows = await parseGrammarCsv(file);
      setRows(parsedRows);

      if (parsedRows.length === 0) {
        setErrorMessage("File CSV không có dòng dữ liệu nào để import.");
      }
    } catch (error) {
      setRows([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsParsing(false);
    }
  }

  async function handleImport() {
    if (rows.length === 0) {
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const importResult = await importGrammarRows(rows);
      setResult(importResult);

      if (importResult.successCount > 0 || importResult.updatedCount > 0) {
        onImportCompleted?.();
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsImporting(false);
    }
  }

  const previewRows = rows.slice(0, 5);
  const canImport = rows.length > 0 && !isParsing && !isImporting;

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[1000] grid place-items-center overflow-hidden overscroll-none px-3 py-3 sm:px-4 sm:py-4">
          <motion.button
            type="button"
            aria-label="Đóng nền import ngữ pháp"
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex max-h-[calc(var(--akari-visual-viewport-height,100dvh)-24px)] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-pink-100 bg-white shadow-[0_28px_80px_rgba(236,72,153,0.24)] sm:max-h-[calc(var(--akari-visual-viewport-height,100dvh)-32px)]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={isParsing || isImporting}
              onChange={(event) => {
                void handleFileChange(event.target.files?.[0] ?? null);

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            />

            <div className="flex items-start justify-between gap-4 border-b border-pink-50 bg-gradient-to-r from-pink-50 to-violet-50 px-6 py-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
                  <FilePlus2 size={27} strokeWidth={2.4} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                    Grammar Import
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-800">
                    Import file CSV ngữ pháp
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Import hàng loạt vào bảng grammar_points và tự động bỏ qua
                    mẫu trùng theo Pattern + Level.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Đóng import ngữ pháp"
                disabled={isParsing || isImporting}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-500 shadow-sm transition hover:bg-pink-50 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleClose}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto overscroll-contain p-6">
              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 rounded-[26px] border border-pink-100 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">
                        Chọn dữ liệu import
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        CSV nên dùng UTF-8 để giữ nguyên tiếng Việt và tiếng Nhật.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isParsing || isImporting}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={handleOpenFilePicker}
                    >
                      <UploadCloud size={18} />
                      Chọn file CSV
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isParsing || isImporting}
                    className="mt-5 w-full rounded-2xl border border-dashed border-pink-200 bg-pink-50/60 p-6 text-center transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleOpenFilePicker}
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-pink-500 shadow-sm">
                      <FilePlus2 size={30} />
                    </div>
                    <p className="mt-4 text-base font-black text-slate-800">
                      {selectedFileName || "Bấm để chọn file CSV ngữ pháp"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Cột khuyến nghị: {grammarCsvUsedColumns.join(", ")}.
                    </p>
                  </button>

                  <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3">
                    <p className="text-sm font-black text-violet-700">
                      Mẫu CSV đúng với bảng grammar_points
                    </p>
                    <code className="mt-2 block overflow-x-auto whitespace-pre rounded-xl bg-white/80 p-3 text-xs font-bold leading-6 text-slate-600">
                      {
                        "Pattern,Meaning,Level,Structure,Explanation,ExampleJapanese,ExampleVietnamese,Notes\nものだから,Vì...,N2,普通形 + ものだから,Dùng để giải thích lý do,遅くなったものだから、連絡できませんでした。,Vì bị trễ nên tôi đã không thể liên lạc.,"
                      }
                    </code>
                  </div>

                  {errorMessage ? (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  ) : null}

                  {previewRows.length ? (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-pink-100">
                      <div className="border-b border-pink-100 bg-pink-50 px-4 py-3 text-sm font-black text-slate-700">
                        Preview {previewRows.length} / {rows.length} dòng
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-white text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            <tr>
                              <th className="px-4 py-3">Dòng</th>
                              <th className="px-4 py-3">Pattern</th>
                              <th className="px-4 py-3">Meaning</th>
                              <th className="px-4 py-3">Level</th>
                              <th className="px-4 py-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-pink-50">
                            {previewRows.map((row) => (
                              <tr key={row.rowNumber} className="text-slate-600">
                                <td className="whitespace-nowrap px-4 py-3 font-bold">
                                  {row.rowNumber}
                                </td>
                                <td className="min-w-52 px-4 py-3 font-black text-slate-800">
                                  {row.pattern || "-"}
                                </td>
                                <td className="min-w-72 px-4 py-3 font-medium">
                                  {row.meaning || "-"}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 font-black text-pink-500">
                                  {row.level || "-"}
                                </td>
                                <td className="min-w-28 px-4 py-3 font-bold text-violet-600">
                                  {row.notes || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {result?.errors.length ? (
                    <div className="mt-5 max-h-40 overflow-y-auto rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-rose-500">
                      {result.errors.slice(0, 10).map((error) => (
                        <p
                          key={`${error.rowNumber}-${error.message}`}
                          className="font-bold"
                        >
                          Dòng {error.rowNumber}: {error.message}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[26px] border border-pink-100 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800">
                    Import summary
                  </h3>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-pink-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-pink-400">
                        File
                      </p>
                      <p className="mt-1 break-words text-sm font-black text-slate-700">
                        {selectedFileName || "Chưa chọn file"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-violet-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-400">
                        Parsed rows
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-800">
                        {rows.length}
                      </p>
                    </div>

                    {result ? (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-black text-emerald-700">
                          <CheckCircle2 size={18} />
                          Import hoàn tất
                        </div>
                        <div className="mt-3 grid gap-2 text-sm font-bold text-emerald-700">
                          <span>Đã import: {result.successCount}</span>
                          <span>Đã cập nhật: {result.updatedCount}</span>
                          <span>Trùng trong file: {result.duplicateCount}</span>
                          <span>Lỗi: {result.failedCount}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col-reverse gap-3 border-t border-pink-50 bg-white px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isParsing || isImporting}
                className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={handleClose}
              >
                {result ? "Done" : "Cancel"}
              </button>

              {!result ? (
                <button
                  type="button"
                  disabled={!canImport}
                  className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={() => void handleImport()}
                >
                  {isImporting
                    ? "Đang import..."
                    : isParsing
                      ? "Đang đọc CSV..."
                      : "Confirm import"}
                </button>
              ) : null}
            </div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
