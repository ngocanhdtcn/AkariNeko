import { CheckCircle2 } from "lucide-react";

type ImportSummaryPanelProps = {
    totalFiles: number;
    totalSizeText: string;
    parsedRowsCount: number;
    validFilesCount: number;
    sourceLabel: string;
    statusLabel: string;
    statusClassName: string;
    importResult?: {
        importedCount: number;
        duplicateCount: number;
        errorCount: number;
    } | null;
};

export function ImportSummaryPanel({
    totalFiles,
    totalSizeText,
    parsedRowsCount,
    validFilesCount,
    sourceLabel,
    statusLabel,
    statusClassName,
    importResult,
}: ImportSummaryPanelProps) {
    return (
        <div className="grid content-start gap-4">
            <div className="rounded-[26px] border border-pink-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-800">Import summary</h3>

                <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex justify-between border-b border-pink-50 pb-2">
                        <span className="text-slate-500">Files</span>
                        <b className="text-slate-800">{totalFiles}</b>
                    </div>

                    <div className="flex justify-between border-b border-pink-50 pb-2">
                        <span className="text-slate-500">Total size</span>
                        <b className="text-slate-800">{totalSizeText}</b>
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
                                <b className="text-rose-500">{importResult.errorCount}</b>
                            </div>
                        </>
                    ) : null}

                    <div className="flex justify-between border-b border-pink-50 pb-2">
                        <span className="text-slate-500">Status</span>
                        <b className={statusClassName}>{statusLabel}</b>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-slate-500">Source</span>
                        <b className="text-slate-800">{sourceLabel}</b>
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
                    <h3 className="font-black text-slate-800">Duplicate rule</h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                    Từ đã tồn tại trong cùng Book + Chapter sẽ được bỏ qua. Từ mới sẽ được
                    thêm và gắn vào Chapter hiện tại.
                </p>
            </div>
        </div>
    );
}