import type { VocabularyPreviewItem } from "@/types/vocabularyImport";

type VocabularyPreviewGridProps = {
    items: VocabularyPreviewItem[];
};

export function VocabularyPreviewGrid({ items }: VocabularyPreviewGridProps) {
    return (
        <div className="mt-5 overflow-hidden rounded-2xl border border-pink-50">
            <div className="flex items-center justify-between gap-3 bg-pink-50/80 px-4 py-3">
                <h4 className="text-sm font-black text-slate-700">
                    Vocabulary preview
                </h4>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-pink-500">
                    {items.length} dòng xem trước
                </span>
            </div>

            <div className="grid gap-3 bg-white p-3 md:hidden">
                {items.map((item, index) => (
                    <div
                        key={`${item.importGroupName}-${item.kanji}-${item.hiragana}-${index}-mobile`}
                        className="rounded-2xl border border-pink-50 bg-white px-4 py-3 shadow-sm"
                    >
                        <p className="break-words text-xs font-black uppercase tracking-[0.1em] text-pink-400">
                            {item.importGroupName}
                        </p>

                        <div className="mt-3 flex min-w-0 items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="break-words text-2xl font-black text-slate-800">
                                    {item.kanji}
                                </p>
                                <p className="mt-1 break-words text-sm font-bold text-slate-500">
                                    {item.hiragana}
                                </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-500">
                                Preview
                            </span>
                        </div>

                        <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                            {item.meaning}
                        </p>
                    </div>
                ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-max table-auto border-collapse bg-white text-sm text-slate-600">
                    <thead>
                        <tr className="text-left text-sm font-bold text-slate-500">
                            <th className="whitespace-nowrap px-4 py-3 pr-8">Import group</th>
                            <th className="whitespace-nowrap px-4 py-3 pr-8">Kanji</th>
                            <th className="whitespace-nowrap px-4 py-3 pr-8">Hiragana</th>
                            <th className="whitespace-nowrap px-4 py-3">Meaning</th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((item, index) => (
                            <tr
                                key={`${item.importGroupName}-${item.kanji}-${item.hiragana}-${index}`}
                                className="border-t border-pink-50"
                            >
                                <td className="whitespace-nowrap px-4 py-3 pr-8 font-bold leading-6 text-slate-800">
                                    {item.importGroupName}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 pr-8 font-semibold leading-6 text-slate-700">
                                    {item.kanji}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 pr-8 leading-6">
                                    {item.hiragana}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 leading-6">
                                    {item.meaning}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
