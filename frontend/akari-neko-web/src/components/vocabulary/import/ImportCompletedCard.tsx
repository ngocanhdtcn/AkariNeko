import { CheckCircle2 } from "lucide-react";

type ImportCompletedCardProps = {
    importedCount: number;
    duplicateCount: number;
    errorCount: number;
};

export function ImportCompletedCard({
    importedCount,
    duplicateCount,
    errorCount,
}: ImportCompletedCardProps) {
    return (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <div className="flex items-start gap-3">
                <CheckCircle2
                    size={26}
                    className="mt-0.5 shrink-0 text-emerald-500"
                    strokeWidth={2.4}
                />

                <div className="min-w-0 flex-1">
                    <h4 className="font-black text-emerald-700">Import completed</h4>

                    <p className="mt-1 text-sm font-medium text-emerald-600">
                        Đã xử lý xong dữ liệu import. Khi nối backend thật, số duplicate và
                        error sẽ được trả về từ server.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                                Imported
                            </p>
                            <p className="mt-1 text-2xl font-black text-emerald-600">
                                {importedCount}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                                Duplicate
                            </p>
                            <p className="mt-1 text-2xl font-black text-amber-500">
                                {duplicateCount}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                                Error
                            </p>
                            <p className="mt-1 text-2xl font-black text-rose-500">
                                {errorCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}