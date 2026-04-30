import type { ImportStep } from "@/types/vocabularyImport";

type ImportStepIndicatorProps = {
    importStep: ImportStep;
    selectedFileCount: number;
};

export function ImportStepIndicator({
    importStep,
    selectedFileCount,
}: ImportStepIndicatorProps) {
    const steps = [
        ["Step 1", "Chọn nguồn", selectedFileCount > 0],
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
    ] as const;

    return (
        <div className="grid gap-3 md:grid-cols-4">
            {steps.map(([step, label, active]) => (
                <div
                    key={step}
                    className={`rounded-2xl border px-4 py-3 ${active
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
    );
}