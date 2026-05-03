"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { HtmlFilePreviewGrid } from "./import/HtmlFilePreviewGrid";
import { VocabularyPreviewGrid } from "./import/VocabularyPreviewGrid";
import { ImportDropzone } from "./import/ImportDropzone";
import { ImportSummaryPanel } from "./import/ImportSummaryPanel";
import { ImportModalFooter } from "./import/ImportModalFooter";
import { ImportCompletedCard } from "./import/ImportCompletedCard";
import { ImportModalHeader } from "./import/ImportModalHeader";
import { ImportStepIndicator } from "./import/ImportStepIndicator";
import { useVocabularyImport } from "@/hooks/useVocabularyImport";
// import { importVocabularies } from "@/services/vocabularyImportService";

import type { ImportSourceType } from "@/types/vocabularyImport";

type ImportVocabularyModalProps = {
  isOpen: boolean;
  sourceType: ImportSourceType;
  onClose: () => void;
  onImportCompleted?: () => void;
};

export function ImportVocabularyModal({
  isOpen,
  sourceType,
  onClose,
  onImportCompleted,
}: ImportVocabularyModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isFolderImport,
    selectedFiles,
    importStep,
    isPreviewing,
    isImporting,
    previewRows,
    previewItems,
    parsedImportFiles,
    importResult,
    importError,
    totalFiles,
    totalSizeText,
    displayFileRows,
    parsedRowsCount,
    validFilesCount,
    metadataValidationErrors,
    hasMetadataValidationError,
    statusLabel,
    statusClassName,
    handleFileChange,
    handleMetadataChange,
    handlePreviewImport,
    handleConfirmImport,
    resetImportState,
  } = useVocabularyImport({ sourceType });

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

  function handleClose() {
    resetImportState();
    onClose();
  }

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
              onChange={(event) => {
                handleFileChange(event.target.files);

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }

                if (folderInputRef.current) {
                  folderInputRef.current.value = "";
                }
              }}
            />

            <input
              ref={folderInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                handleFileChange(event.target.files);

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }

                if (folderInputRef.current) {
                  folderInputRef.current.value = "";
                }
              }}
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

              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 rounded-[26px] border border-pink-100 bg-white p-4 shadow-sm sm:p-5">
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

                  {importError ? (
                    <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
                      {importError}
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
                  totalSizeText={totalSizeText}
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
                hasValidationError={hasMetadataValidationError}
                selectedFileCount={selectedFiles.length}
                parsedRowsCount={parsedRowsCount}
                isPreviewing={isPreviewing}
                isImporting={isImporting}
                onClose={handleClose}
                onPreviewImport={handlePreviewImport}
                onConfirmImport={async () => {
                  const isCompleted = await handleConfirmImport();

                  if (isCompleted) {
                    onImportCompleted?.();
                  }
                }}
              />
            </div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
