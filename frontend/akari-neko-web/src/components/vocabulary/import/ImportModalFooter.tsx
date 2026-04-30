import type { ImportStep } from "@/types/vocabularyImport";

type ImportModalFooterProps = {
    importStep: ImportStep;
    hasPreviewData: boolean;
    hasValidationError: boolean;
    selectedFileCount: number;
    parsedRowsCount: number;
    isPreviewing: boolean;
    isImporting: boolean;
    onClose: () => void;
    onPreviewImport: () => void;
    onConfirmImport: () => void;
};

export function ImportModalFooter({
    importStep,
    hasPreviewData,
    hasValidationError,
    selectedFileCount,
    parsedRowsCount,
    isPreviewing,
    isImporting,
    onClose,
    onPreviewImport,
    onConfirmImport,
}: ImportModalFooterProps) {
    return (
        <div className="flex flex-col-reverse gap-3 border-t border-pink-50 pt-5 sm:flex-row sm:justify-end">
            {importStep !== "completed" ? (
                <button
                    type="button"
                    className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
                    onClick={onClose}
                >
                    Cancel
                </button>
            ) : null}

            {importStep === "completed" ? (
                <button
                    type="button"
                    className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105"
                    onClick={onClose}
                >
                    Done
                </button>
            ) : hasPreviewData ? (
                <>
                    <button
                        type="button"
                        disabled={isPreviewing || isImporting}
                        className="h-12 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={onPreviewImport}
                    >
                        {isPreviewing ? "Reading HTML..." : "Preview again"}
                    </button>

                    <button
                        type="button"
                        disabled={isImporting || parsedRowsCount === 0 || hasValidationError}
                        className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={onConfirmImport}
                    >
                        {isImporting ? "Importing..." : "Confirm import"}
                    </button>
                </>
            ) : (
                <button
                    type="button"
                    disabled={selectedFileCount === 0 || isPreviewing || hasValidationError}
                    className="h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={onPreviewImport}
                >
                    {isPreviewing ? "Reading HTML..." : "Preview import"}
                </button>
            )}
        </div>
    );
}