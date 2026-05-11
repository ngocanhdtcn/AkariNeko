import { useCallback, useEffect, useState } from "react";
import { parseVocabularyHtml } from "@/lib/htmlVocabularyParser";
import {
    buildImportGroupName,
    formatFileSize,
    mapSelectedFiles,
} from "@/lib/vocabularyImportUtils";
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

import { importVocabularies } from "@/services/vocabularyImportService";
import { getVocabularyFilterOptions } from "@/services/vocabularyService";
import { useNotification } from "@/contexts/NotificationContext";

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

type UseVocabularyImportParams = {
    sourceType: ImportSourceType;
};

export function useVocabularyImport({ sourceType }: UseVocabularyImportParams) {
    const isFolderImport = sourceType === "folder";
    const { notifyError, notifyInfo, notifySuccess } = useNotification();

    const [selectedFiles, setSelectedFiles] = useState<SelectedHtmlFile[]>([]);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStep, setImportStep] = useState<ImportStep>("select");
    const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
    const [previewItems, setPreviewItems] = useState<VocabularyPreviewItem[]>([]);
    const [parsedImportFiles, setParsedImportFiles] = useState<ParsedImportFile[]>(
        [],
    );
    const [bookOptions, setBookOptions] = useState<string[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    const loadBookOptions = useCallback(async () => {
        try {
            const options = await getVocabularyFilterOptions();
            setBookOptions(options.books);
        } catch (error) {
            console.error("Failed to load import book options:", error);
            notifyError(error, "Không thể tải danh sách book để import.");
        }
    }, [notifyError]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadBookOptions();
    }, [loadBookOptions]);

    function resetImportState() {
        setSelectedFiles([]);
        setPreviewRows([]);
        setPreviewItems([]);
        setParsedImportFiles([]);
        setImportResult(null);
        setImportError(null);
        setImportStep("select");
        setIsPreviewing(false);
        setIsImporting(false);
    }

    function resetPreviewState() {
        setPreviewRows([]);
        setPreviewItems([]);
        setParsedImportFiles([]);
        setImportResult(null);
        setImportError(null);
        setImportStep("select");

    }

    function handleFileChange(fileList: FileList | null) {
        const htmlFiles = mapSelectedFiles(fileList, isFolderImport, bookOptions);

        setSelectedFiles(htmlFiles);
        setPreviewRows([]);
        setPreviewItems([]);
        setParsedImportFiles([]);
        setImportResult(null);
        setImportError(null);
        setImportStep("select");

        if (fileList && fileList.length > 0 && htmlFiles.length === 0) {
            notifyError(
                new Error("File không đúng định dạng HTML hoặc folder không có file HTML hợp lệ."),
                "File không đúng định dạng HTML.",
            );
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

        resetPreviewState();
    }

    async function handlePreviewImport() {
        if (selectedFiles.length === 0) {
            notifyInfo("Hãy chọn file HTML trước khi preview.");
            return;
        }

        if (getMetadataValidationErrors().length > 0) {
            notifyError(
                new Error("Cần điền đủ JLPT level, book và chapter trước khi preview."),
                "Thông tin import chưa đầy đủ.",
            );
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

            if (nextParsedImportFiles.every((file) => file.vocabularies.length === 0)) {
                notifyError(
                    new Error("File rỗng hoặc không có dòng từ vựng hợp lệ."),
                    "Không có dữ liệu import hợp lệ.",
                );
            }
        } catch (error) {
            notifyError(error, "Không thể đọc file HTML. Vui lòng kiểm tra format.");
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
            notifyInfo("Hãy preview dữ liệu trước khi import.");
            return false;
        }

        if (getMetadataValidationErrors().length > 0) {
            notifyError(
                new Error("Cần kiểm tra lại JLPT level, book và chapter."),
                "Thông tin import chưa đầy đủ.",
            );
            return false;
        }

        const payload = buildImportPayload();

        if (payload.files.length === 0) {
            notifyError(
                new Error("Không có từ vựng hợp lệ để import."),
                "Không có dữ liệu import hợp lệ.",
            );
            return false;
        }

        setIsImporting(true);
        setImportError(null);

        try {
            const result = await importVocabularies(payload);

            setImportResult({
                importedCount: result.importedCount,
                duplicateCount: result.duplicateCount,
                errorCount: result.errorCount,
            });

            setImportStep("completed");
            notifySuccess(
                `Import xong: ${result.importedCount} từ mới, ${result.duplicateCount} trùng, ${result.errorCount} lỗi.`,
            );
            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Không thể import từ vựng. Vui lòng kiểm tra quyền Supabase.";

            console.warn("Failed to import vocabularies:", errorMessage);
            setImportError(
                error instanceof Error
                    ? error.message
                    : "Không thể import từ vựng. Vui lòng kiểm tra quyền Supabase.",
            );
            notifyError(error, "Không thể import từ vựng. Vui lòng kiểm tra quyền Supabase.");
            return false;
        } finally {
            setIsImporting(false);
        }
    }

    const totalFiles = selectedFiles.length;
    const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);

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

    const metadataValidationErrors = getMetadataValidationErrors();
    const hasMetadataValidationError = metadataValidationErrors.length > 0;

    const statusLabel = hasMetadataValidationError
        ? "Need check"
        : importStep === "completed"
            ? "Completed"
            : selectedFiles.length > 0
                ? "Ready"
                : "Waiting";

    const statusClassName = hasMetadataValidationError
        ? "text-amber-500"
        : importStep === "completed"
            ? "text-emerald-600"
            : selectedFiles.length > 0
                ? "text-emerald-600"
                : "text-slate-400";

    return {
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
        bookOptions,
        totalFiles,
        totalSize,
        totalSizeText: formatFileSize(totalSize),
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
    };
}
