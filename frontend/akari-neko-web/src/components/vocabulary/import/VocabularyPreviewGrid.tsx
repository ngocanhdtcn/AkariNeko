import type { VocabularyPreviewItem } from "@/types/vocabularyImport";

type VocabularyPreviewGridProps = {
    items: VocabularyPreviewItem[];
};

export function VocabularyPreviewGrid({ items }: VocabularyPreviewGridProps) {
    return (
        <div className="mt-5 overflow-hidden rounded-2xl border border-pink-50">
            <div className="flex items-center justify-between bg-pink-50/80 px-4 py-3">
                <h4 className="text-sm font-black text-slate-700">
                    Vocabulary preview
                </h4>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-pink-500">
                    {items.length} dòng xem trước
                </span>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[1040px]">
                    <div className="grid grid-cols-[220px_160px_160px_420px] gap-x-6 bg-white px-4 py-3 text-sm font-bold text-slate-500">
                        <div>Import group</div>
                        <div>Kanji</div>
                        <div>Hiragana</div>
                        <div>Meaning</div>
                    </div>

                    {items.map((item, index) => (
                        <div
                            key={`${item.importGroupName}-${item.kanji}-${item.hiragana}-${index}`}
                            className="grid grid-cols-[220px_160px_160px_420px] gap-x-6 border-t border-pink-50 px-4 py-3 text-sm text-slate-600"
                        >
                            <div className="whitespace-nowrap font-bold text-slate-800">
                                {item.importGroupName}
                            </div>

                            <div className="whitespace-nowrap font-semibold text-slate-700">
                                {item.kanji}
                            </div>

                            <div className="whitespace-nowrap">{item.hiragana}</div>

                            <div className="whitespace-normal break-words leading-6">
                                {item.meaning}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}