"use client";

import {
  CheckCircle2,
  FilePlus2,
  FolderUp,
  UploadCloud,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { parseVocabularyHtml } from "@/lib/htmlVocabularyParser";
// import { importVocabularies } from "@/services/vocabularyImportService";

import type {
  ImportPreviewRow,
  ImportSourceType,
  ImportStep,
  ImportVocabularyPayload,
  ParsedImportFile,
  SelectedHtmlFile,
  VocabularyPreviewItem,
} from "@/types/vocabularyImport";

type ImportVocabularyModalProps = {
  isOpen: boolean;
  sourceType: ImportSourceType;
  onClose: () => void;
};

type ImportResult = {
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
};

import {
  buildImportGroupName,
  formatFileSize,
  mapSelectedFiles,
} from "@/lib/vocabularyImportUtils";

export function ImportVocabularyModal({
  isOpen,
  sourceType,
  onClose,
}: ImportVocabularyModalProps) {
  const isFolderImport = sourceType === "folder";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<SelectedHtmlFile[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("select");
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [previewItems, setPreviewItems] = useState<VocabularyPreviewItem[]>([]);
  const [parsedImportFiles, setParsedImportFiles] = useState<
    ParsedImportFile[]
  >([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  function handleOpenFilePicker() {
    if (isFolderImport) {
      folderInputRef.current?.click();
      return;
    }

    fileInputRef.current?.click();
  }

  function handleFileChange(fileList: FileList | null) {
    const htmlFiles = mapSelectedFiles(fileList, isFolderImport);

    setSelectedFiles(htmlFiles);
    setPreviewRows([]);
    setPreviewItems([]);
    setParsedImportFiles([]);
    setImportStep("select");
    setImportResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  }

  async function handlePreviewImport() {
    if (selectedFiles.length === 0) {
      return;
    }

    setIsPreviewing(true);

    try {
      const parsedResults = await Promise.all(
        selectedFiles.map(async (selectedFile) => {
          const htmlText = await selectedFile.file.text();
          const parsedItems = parseVocabularyHtml(htmlText);

          return {
            selectedFile,
            parsedItems,
          };
        }),
      );

      const nextPreviewRows: ImportPreviewRow[] = parsedResults.map(
        ({ selectedFile, parsedItems }) => ({
          fileName: selectedFile.name,
          filePath: selectedFile.path,
          level: selectedFile.level,
          book: selectedFile.book,
          chapter: selectedFile.chapter,
          size: formatFileSize(selectedFile.size),
          totalRows: parsedItems.length,
          newRows: parsedItems.length,
          duplicateRows: 0,
          errorRows: parsedItems.length === 0 ? 1 : 0,
        }),
      );

      const nextParsedImportFiles: ParsedImportFile[] = parsedResults.map(
        ({ selectedFile, parsedItems }) => ({
          fileName: selectedFile.name,
          filePath: selectedFile.path,
          level: selectedFile.level,
          book: selectedFile.book,
          chapter: selectedFile.chapter,
          vocabularies: parsedItems,
        }),
      );

      const nextPreviewItems: VocabularyPreviewItem[] = parsedResults.flatMap(
        ({ selectedFile, parsedItems }) => {
          const importGroupName = buildImportGroupName(
            selectedFile.book,
            selectedFile.level,
            selectedFile.chapter,
          );

          return parsedItems.slice(0, 10).map((item) => ({
            importGroupName,
            kanji: item.kanji,
            hiragana: item.hiragana,
            meaning: item.meaning,
          }));
        },
      );

      setPreviewRows(nextPreviewRows);
      setPreviewItems(nextPreviewItems);
      setParsedImportFiles(nextParsedImportFiles);
      setImportStep("preview");
    } finally {
      setIsPreviewing(false);
    }
  }

  function buildImportPayload(): ImportVocabularyPayload {
    return {
      sourceType,
      files: parsedImportFiles.filter((file) => file.vocabularies.length > 0),
    };
  }

  async function handleConfirmImport() {
    if (parsedImportFiles.length === 0) {
      return;
    }

    const payload = buildImportPayload();

    if (payload.files.length === 0) {
      return;
    }

    setIsImporting(true);

    try {
      // TODO: Sau này thay đoạn giả lập này bằng API:
      // const result = await importVocabularies(payload);

      console.log("Import vocabulary payload:", payload);

      await new Promise((resolve) => {
        window.setTimeout(resolve, 650);
      });

      const importedCount = payload.files.reduce(
        (total, file) => total + file.vocabularies.length,
        0,
      );

      const errorCount = previewRows.reduce(
        (total, row) =>
          total + (typeof row.errorRows === "number" ? row.errorRows : 0),
        0,
      );

      setImportResult({
        importedCount,
        duplicateCount: 0,
        errorCount,
      });

      setImportStep("completed");
    } finally {
      setIsImporting(false);
    }
  }

  function handleClose() {
    setSelectedFiles([]);
    setPreviewRows([]);
    setPreviewItems([]);
    setParsedImportFiles([]);
    setImportResult(null);
    setImportStep("select");
    setIsPreviewing(false);
    setIsImporting(false);
    onClose();
  }

  const totalFiles = selectedFiles.length;
  const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);

  const displayFileRows: ImportPreviewRow[] =
    previewRows.length > 0
      ? previewRows
      : selectedFiles.map((file) => ({
          fileName: file.name,
          filePath: file.path,
          level: file.level,
          book: file.book,
          chapter: file.chapter,
          size: formatFileSize(file.size),
          totalRows: "-",
          newRows: "-",
          duplicateRows: "-",
          errorRows: "-",
        }));

  const parsedRowsCount = previewRows.reduce(
    (total, row) =>
      total + (typeof row.totalRows === "number" ? row.totalRows : 0),
    0,
  );

  const validFilesCount = parsedImportFiles.filter(
    (file) => file.vocabularies.length > 0,
  ).length;

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[100] grid place-items-center px-3 sm:px-4">
          <motion.button
            type="button"
            aria-label="Close import modal overlay"
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
            className="relative max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-pink-100 bg-white shadow-[0_28px_80px_rgba(236,72,153,0.24)]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              multiple
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files)}
            />

            <input
              ref={folderInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files)}
              {...({
                webkitdirectory: "",
                directory: "",
              } as Record<string, string>)}
            />

            <div className="flex items-start justify-between gap-4 border-b border-pink-50 bg-gradient-to-r from-pink-50 to-violet-50 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
                  {isFolderImport ? (
                    <FolderUp size={27} strokeWidth={2.4} />
                  ) : (
                    <FilePlus2 size={27} strokeWidth={2.4} />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                    Vocabulary Import
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-800">
                    {isFolderImport ? "Import folder HTML" : "Import file HTML"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Import từ vựng hàng loạt theo Book / Chapter và tự động bỏ
                    qua dữ liệu trùng.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-500 shadow-sm transition hover:bg-pink-50 hover:text-pink-500"
                onClick={handleClose}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid max-h-[calc(88vh-112px)] gap-5 overflow-y-auto p-6">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  ["Step 1", "Chọn nguồn", selectedFiles.length > 0],
                  [
                    "Step 2",
                    "Preview",
                    importStep === "preview" || importStep === "completed",
                  ],
                  [
                    "Step 3",
                    "Xác nhận",
                    importStep === "preview" || importStep === "completed",
                  ],
                  ["Step 4", "Kết quả", importStep === "completed"],
                ].map(([step, label, active]) => (
                  <div
                    key={String(step)}
                    className={`rounded-2xl border px-4 py-3 ${
                      active
                        ? "border-pink-100 bg-pink-50 text-pink-600"
                        : "border-slate-100 bg-white text-slate-400"
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em]">
                      {step}
                    </p>
                    <p className="mt-1 text-sm font-black">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-[26px] border border-pink-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">
                        Chọn dữ liệu import
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Web app không xoá file gốc trên máy sau import. Nếu có
                        file tạm trên server thì backend sẽ tự xoá sau.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)]"
                      onClick={handleOpenFilePicker}
                    >
                      <UploadCloud size={18} />
                      {isFolderImport ? "Chọn folder HTML" : "Chọn file HTML"}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="mt-5 w-full rounded-2xl border border-dashed border-pink-200 bg-pink-50/60 p-6 text-center transition hover:bg-pink-50"
                    onClick={handleOpenFilePicker}
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-pink-500 shadow-sm">
                      {isFolderImport ? (
                        <FolderUp size={30} />
                      ) : (
                        <FilePlus2 size={30} />
                      )}
                    </div>

                    <p className="mt-4 text-base font-black text-slate-800">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file HTML đã được chọn`
                        : isFolderImport
                          ? "Bấm để chọn folder HTML"
                          : "Bấm để chọn file HTML"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Hỗ trợ file `.html` / `.htm`. Folder import mặc định chỉ
                      lấy file HTML trực tiếp trong folder đã chọn.
                    </p>
                  </button>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-pink-50">
                    <div className="overflow-x-auto lg:overflow-x-visible">
                      <div className="min-w-[980px] lg:min-w-0">
                        <div className="grid grid-cols-[240px_80px_120px_160px_90px_70px_70px_110px_70px] bg-pink-50/80 px-4 py-3 text-sm font-bold text-slate-500 lg:grid-cols-[minmax(0,1.5fr)_0.5fr_0.8fr_1fr_0.6fr_0.5fr_0.5fr_0.8fr_0.5fr]">
                          <div>HTML file</div>
                          <div>Level</div>
                          <div>Book</div>
                          <div>Chapter</div>
                          <div>Size</div>
                          <div>Total</div>
                          <div>New</div>
                          <div>Duplicate</div>
                          <div>Error</div>
                        </div>

                        {displayFileRows.length > 0 ? (
                          displayFileRows.map((row) => (
                            <div
                              key={row.filePath}
                              className="grid grid-cols-[240px_80px_120px_160px_90px_70px_70px_110px_70px] border-t border-pink-50 px-4 py-3 text-sm text-slate-600 lg:grid-cols-[minmax(0,1.5fr)_0.5fr_0.8fr_1fr_0.6fr_0.5fr_0.5fr_0.8fr_0.5fr]"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-800">
                                  {row.fileName}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  {row.filePath}
                                </p>
                              </div>

                              <div>
                                <span className="rounded-xl bg-pink-100 px-2 py-1 text-xs font-bold text-pink-500">
                                  {row.level}
                                </span>
                              </div>

                              <div className="truncate font-semibold text-slate-700">
                                {row.book}
                              </div>

                              <div className="truncate">{row.chapter}</div>

                              <div>{row.size}</div>
                              <div>{row.totalRows}</div>
                              <div className="font-bold text-emerald-600">
                                {row.newRows}
                              </div>
                              <div className="font-bold text-amber-500">
                                {row.duplicateRows}
                              </div>
                              <div className="font-bold text-rose-500">
                                {row.errorRows}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="border-t border-pink-50 px-4 py-8 text-center text-sm font-medium text-slate-400">
                            Chưa chọn file HTML nào.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {previewItems.length > 0 ? (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-pink-50">
                      <div className="flex items-center justify-between bg-pink-50/80 px-4 py-3">
                        <h4 className="text-sm font-black text-slate-700">
                          Vocabulary preview
                        </h4>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-pink-500">
                          {previewItems.length} dòng xem trước
                        </span>
                      </div>

                      <div className="overflow-x-auto lg:overflow-x-visible">
                        <div className="min-w-[760px] lg:min-w-0">
                          <div className="grid grid-cols-[190px_140px_140px_290px] bg-white px-4 py-3 text-sm font-bold text-slate-500 lg:grid-cols-[1.2fr_1fr_1fr_1.8fr]">
                            <div>Import group</div>
                            <div>Kanji</div>
                            <div>Hiragana</div>
                            <div>Meaning</div>
                          </div>

                          {previewItems.map((item, index) => (
                            <div
                              key={`${item.importGroupName}-${item.kanji}-${item.hiragana}-${index}`}
                              className="grid grid-cols-[190px_140px_140px_290px] border-t border-pink-50 px-4 py-3 text-sm text-slate-600 lg:grid-cols-[1.2fr_1fr_1fr_1.8fr]"
                            >
                              <div className="truncate font-bold text-slate-800">
                                {item.importGroupName}
                              </div>

                              <div className="font-semibold text-slate-700">
                                {item.kanji}
                              </div>

                              <div>{item.hiragana}</div>

                              <div className="whitespace-normal leading-6">
                                {item.meaning}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : selectedFiles.length > 0 && previewRows.length > 0 ? (
                    <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-600">
                      Không có dữ liệu preview để hiển thị.
                    </div>
                  ) : null}

                  {importStep === "completed" && importResult ? (
                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          size={26}
                          className="mt-0.5 shrink-0 text-emerald-500"
                          strokeWidth={2.4}
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-emerald-700">
                            Import completed
                          </h4>

                          <p className="mt-1 text-sm font-medium text-emerald-600">
                            Đã xử lý xong dữ liệu import. Khi nối backend thật,
                            số duplicate và error sẽ được trả về từ server.
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                                Imported
                              </p>
                              <p className="mt-1 text-2xl font-black text-emerald-600">
                                {importResult.importedCount}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                                Duplicate
                              </p>
                              <p className="mt-1 text-2xl font-black text-amber-500">
                                {importResult.duplicateCount}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                                Error
                              </p>
                              <p className="mt-1 text-2xl font-black text-rose-500">
                                {importResult.errorCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid content-start gap-4">
                  <div className="rounded-[26px] border border-pink-100 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800">
                      Import summary
                    </h3>

                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="flex justify-between border-b border-pink-50 pb-2">
                        <span className="text-slate-500">Files</span>
                        <b className="text-slate-800">{totalFiles}</b>
                      </div>

                      <div className="flex justify-between border-b border-pink-50 pb-2">
                        <span className="text-slate-500">Total size</span>
                        <b className="text-slate-800">
                          {formatFileSize(totalSize)}
                        </b>
                      </div>

                      <div className="flex justify-between border-b border-pink-50 pb-2">
                        <span className="text-slate-500">Parsed rows</span>
                        <b className="text-emerald-600">{parsedRowsCount}</b>
                      </div>

                      <div className="flex justify-between border-b border-pink-50 pb-2">
                        <span className="text-slate-500">Valid files</span>
                        <b className="text-emerald-600">{validFilesCount}</b>
                      </div>

                      {importResult ? (
                        <>
                          <div className="flex justify-between border-b border-pink-50 pb-2">
                            <span className="text-slate-500">Imported</span>
                            <b className="text-emerald-600">
                              {importResult.importedCount}
                            </b>
                          </div>

                          <div className="flex justify-between border-b border-pink-50 pb-2">
                            <span className="text-slate-500">Duplicates</span>
                            <b className="text-amber-500">
                              {importResult.duplicateCount}
                            </b>
                          </div>

                          <div className="flex justify-between border-b border-pink-50 pb-2">
                            <span className="text-slate-500">Errors</span>
                            <b className="text-rose-500">
                              {importResult.errorCount}
                            </b>
                          </div>
                        </>
                      ) : null}

                      <div className="flex justify-between border-b border-pink-50 pb-2">
                        <span className="text-slate-500">Status</span>
                        <b
                          className={
                            importStep === "completed"
                              ? "text-emerald-600"
                              : selectedFiles.length > 0
                                ? "text-emerald-600"
                                : "text-slate-400"
                          }
                        >
                          {importStep === "completed"
                            ? "Completed"
                            : selectedFiles.length > 0
                              ? "Ready"
                              : "Waiting"}
                        </b>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">Source</span>
                        <b className="text-slate-800">
                          {isFolderImport ? "Folder" : "File"}
                        </b>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        size={24}
                        className="text-emerald-500"
                        strokeWidth={2.4}
                      />
                      <h3 className="font-black text-slate-800">
                        Duplicate rule
                      </h3>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Từ đã tồn tại trong cùng Book + Chapter sẽ được bỏ qua. Từ
                      mới sẽ được thêm và gắn vào Chapter hiện tại.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-pink-50 pt-5 sm:flex-row sm:justify-end">
                {importStep !== "completed" ? (
                  <button
                    type="button"
                    className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                ) : null}

                {importStep === "completed" ? (
                  <button
                    type="button"
                    className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105"
                    onClick={handleClose}
                  >
                    Done
                  </button>
                ) : previewRows.length > 0 && parsedImportFiles.length > 0 ? (
                  <>
                    <button
                      type="button"
                      disabled={isPreviewing || isImporting}
                      className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={handlePreviewImport}
                    >
                      {isPreviewing ? "Reading HTML..." : "Preview again"}
                    </button>

                    <button
                      type="button"
                      disabled={isImporting || parsedRowsCount === 0}
                      className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={handleConfirmImport}
                    >
                      {isImporting ? "Importing..." : "Confirm import"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={selectedFiles.length === 0 || isPreviewing}
                    className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={handlePreviewImport}
                  >
                    {isPreviewing ? "Reading HTML..." : "Preview import"}
                  </button>
                )}
              </div>
            </div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
