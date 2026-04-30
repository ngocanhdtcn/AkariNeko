"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { parseVocabularyHtml } from "@/lib/htmlVocabularyParser";
import { HtmlFilePreviewGrid } from "./import/HtmlFilePreviewGrid";
import { VocabularyPreviewGrid } from "./import/VocabularyPreviewGrid";
import { ImportDropzone } from "./import/ImportDropzone";
import { ImportSummaryPanel } from "./import/ImportSummaryPanel";
import { ImportModalFooter } from "./import/ImportModalFooter";
import { ImportCompletedCard } from "./import/ImportCompletedCard";
import { ImportModalHeader } from "./import/ImportModalHeader";
import { ImportStepIndicator } from "./import/ImportStepIndicator";
// import { importVocabularies } from "@/services/vocabularyImportService";

import type {
  ImportMetadataField,
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

type ImportValidationError = {
  filePath: string;
  fileName: string;
  message: string;
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

  function handleMetadataChange(
    filePath: string,
    field: ImportMetadataField,
    value: string,
  ) {
    setSelectedFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.path === filePath
          ? {
            ...file,
            [field]: value,
          }
          : file,
      ),
    );

    setPreviewRows([]);
    setPreviewItems([]);
    setParsedImportFiles([]);
    setImportResult(null);
    setImportStep("select");
  }

  async function handlePreviewImport() {
    if (selectedFiles.length === 0) {
      return;
    }

    if (getMetadataValidationErrors().length > 0) {
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

      const globalDuplicateMap = new Set<string>();

      const normalizedParsedResults = parsedResults.map(
        ({ selectedFile, parsedItems }) => {
          const uniqueItems: typeof parsedItems = [];
          const duplicateItems: typeof parsedItems = [];

          parsedItems.forEach((item) => {
            const duplicateKey = [
              selectedFile.book,
              selectedFile.level,
              selectedFile.chapter,
              item.kanji,
              item.hiragana,
            ]
              .join("|")
              .replace(/\s+/g, "")
              .toLowerCase();

            if (globalDuplicateMap.has(duplicateKey)) {
              duplicateItems.push(item);
              return;
            }

            globalDuplicateMap.add(duplicateKey);
            uniqueItems.push(item);
          });

          return {
            selectedFile,
            parsedItems,
            uniqueItems,
            duplicateItems,
          };
        },
      );

      const nextPreviewRows: ImportPreviewRow[] = normalizedParsedResults.map(
        ({ selectedFile, parsedItems, uniqueItems, duplicateItems }) => ({
          fileName: selectedFile.name,
          filePath: selectedFile.path,
          level: selectedFile.level,
          book: selectedFile.book,
          chapter: selectedFile.chapter,
          size: formatFileSize(selectedFile.size),
          totalRows: parsedItems.length,
          newRows: uniqueItems.length,
          duplicateRows: duplicateItems.length,
          errorRows: parsedItems.length === 0 ? 1 : 0,
        }),
      );

      const nextParsedImportFiles: ParsedImportFile[] =
        normalizedParsedResults.map(({ selectedFile, uniqueItems }) => ({
          fileName: selectedFile.name,
          filePath: selectedFile.path,
          level: selectedFile.level,
          book: selectedFile.book,
          chapter: selectedFile.chapter,
          vocabularies: uniqueItems,
        }));

      const nextPreviewItems: VocabularyPreviewItem[] =
        normalizedParsedResults.flatMap(({ selectedFile, uniqueItems }) => {
          const importGroupName = buildImportGroupName(
            selectedFile.book,
            selectedFile.level,
            selectedFile.chapter,
          );

          return uniqueItems.slice(0, 10).map((item) => ({
            importGroupName,
            kanji: item.kanji,
            hiragana: item.hiragana,
            meaning: item.meaning,
          }));
        });

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

    if (getMetadataValidationErrors().length > 0) {
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

      const duplicateCount = previewRows.reduce(
        (total, row) =>
          total + (typeof row.duplicateRows === "number" ? row.duplicateRows : 0),
        0,
      );

      setImportResult({
        importedCount,
        duplicateCount,
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

  function getMetadataValidationErrors(): ImportValidationError[] {
    return selectedFiles.flatMap((file) => {
      const errors: ImportValidationError[] = [];

      if (!file.level || file.level === "Unknown") {
        errors.push({
          filePath: file.path,
          fileName: file.name,
          message: "JLPT level chưa được chọn.",
        });
      }

      if (!file.book.trim()) {
        errors.push({
          filePath: file.path,
          fileName: file.name,
          message: "Book chưa được nhập.",
        });
      }

      if (!file.chapter.trim()) {
        errors.push({
          filePath: file.path,
          fileName: file.name,
          message: "Chapter chưa được nhập.",
        });
      }

      return errors;
    });
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

  const statusLabel =
    importStep === "completed"
      ? "Completed"
      : selectedFiles.length > 0
        ? "Ready"
        : "Waiting";

  const statusClassName =
    importStep === "completed"
      ? "text-emerald-600"
      : selectedFiles.length > 0
        ? "text-emerald-600"
        : "text-slate-400";

  const metadataValidationErrors = getMetadataValidationErrors();
  const hasMetadataValidationError = metadataValidationErrors.length > 0;

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

            <ImportModalHeader isFolderImport={isFolderImport} onClose={handleClose} />

            <div className="grid max-h-[calc(88vh-112px)] gap-5 overflow-y-auto p-6">
              <ImportStepIndicator
                importStep={importStep}
                selectedFileCount={selectedFiles.length}
              />

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-[26px] border border-pink-100 bg-white p-5 shadow-sm">
                  <ImportDropzone
                    isFolderImport={isFolderImport}
                    selectedFileCount={selectedFiles.length}
                    onOpenFilePicker={handleOpenFilePicker}
                  />

                  <HtmlFilePreviewGrid
                    rows={displayFileRows}
                    onMetadataChange={handleMetadataChange}
                  />

                  {hasMetadataValidationError ? (
                    <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-black text-amber-700">
                        Cần kiểm tra lại thông tin import
                      </p>

                      <div className="mt-2 grid gap-1">
                        {metadataValidationErrors.slice(0, 4).map((error) => (
                          <p
                            key={`${error.filePath}-${error.message}`}
                            className="text-sm font-medium text-amber-600"
                          >
                            {error.fileName}: {error.message}
                          </p>
                        ))}

                        {metadataValidationErrors.length > 4 ? (
                          <p className="text-sm font-bold text-amber-600">
                            +{metadataValidationErrors.length - 4} lỗi khác
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {previewItems.length > 0 ? (
                    <VocabularyPreviewGrid items={previewItems} />
                  ) : selectedFiles.length > 0 && previewRows.length > 0 ? (
                    <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-600">
                      Không có dữ liệu preview để hiển thị.
                    </div>
                  ) : null}

                  {importStep === "completed" && importResult ? (
                    <ImportCompletedCard
                      importedCount={importResult.importedCount}
                      duplicateCount={importResult.duplicateCount}
                      errorCount={importResult.errorCount}
                    />
                  ) : null}
                </div>

                <ImportSummaryPanel
                  totalFiles={totalFiles}
                  totalSizeText={formatFileSize(totalSize)}
                  parsedRowsCount={parsedRowsCount}
                  validFilesCount={validFilesCount}
                  sourceLabel={isFolderImport ? "Folder" : "File"}
                  statusLabel={statusLabel}
                  statusClassName={statusClassName}
                  importResult={importResult}
                />
              </div>

              <ImportModalFooter
                importStep={importStep}
                hasPreviewData={previewRows.length > 0 && parsedImportFiles.length > 0}
                selectedFileCount={selectedFiles.length}
                parsedRowsCount={parsedRowsCount}
                isPreviewing={isPreviewing}
                isImporting={isImporting}
                onClose={handleClose}
                onPreviewImport={handlePreviewImport}
                onConfirmImport={handleConfirmImport}
              />
            </div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
