import type {
    ImportMetadataField,
    ImportPreviewRow,
} from "@/types/vocabularyImport";

const jlptLevelOptions = ["Unknown", "N5", "N4", "N3", "N2", "N1"];

const bookOptions = [
    "JLPT Vocabulary",
    "JTest",
    "Minna no Nihongo",
    "Soumatome",
    "Shinkanzen Master",
];

type HtmlFilePreviewGridProps = {
    rows: ImportPreviewRow[];
    onMetadataChange: (
        filePath: string,
        field: ImportMetadataField,
        value: string,
    ) => void;
};

export function HtmlFilePreviewGrid({
    rows,
    onMetadataChange,
}: HtmlFilePreviewGridProps) {
    return (
        <div className="mt-5 overflow-hidden rounded-2xl border border-pink-50">
            <div className="overflow-x-auto">
                <div className="min-w-[1120px]">
                    <div className="grid grid-cols-[250px_92px_140px_170px_80px_56px_56px_90px_56px] gap-x-4 bg-pink-50/80 px-4 py-3 text-sm font-bold text-slate-500">
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

                    {rows.length > 0 ? (
                        rows.map((row) => (
                            <div
                                key={row.filePath}
                                className="grid grid-cols-[250px_92px_140px_170px_80px_56px_56px_90px_56px] gap-x-4 border-t border-pink-50 px-4 py-3 text-sm text-slate-600"
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
                                    <select
                                        value={row.level}
                                        className="h-9 w-full rounded-xl border border-pink-100 bg-white px-2 text-xs font-bold text-pink-500 outline-none transition focus:border-pink-300"
                                        onChange={(event) =>
                                            onMetadataChange(
                                                row.filePath,
                                                "level",
                                                event.target.value,
                                            )
                                        }
                                    >
                                        {jlptLevelOptions.map((level) => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <select
                                        value={row.book}
                                        className="h-9 w-full rounded-xl border border-pink-100 bg-white px-2 text-xs font-bold text-slate-600 outline-none transition focus:border-pink-300"
                                        onChange={(event) =>
                                            onMetadataChange(
                                                row.filePath,
                                                "book",
                                                event.target.value,
                                            )
                                        }
                                    >
                                        {bookOptions.map((book) => (
                                            <option key={book} value={book}>
                                                {book}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <input
                                        value={row.chapter}
                                        className="h-9 w-full rounded-xl border border-pink-100 bg-white px-2 text-xs font-semibold text-slate-600 outline-none transition focus:border-pink-300"
                                        onChange={(event) =>
                                            onMetadataChange(
                                                row.filePath,
                                                "chapter",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div>{row.size}</div>
                                <div>{row.totalRows}</div>

                                <div className="font-bold text-emerald-600">
                                    {row.newRows}
                                </div>

                                <div className="font-bold text-amber-500">
                                    {row.duplicateRows}
                                </div>

                                <div className="font-bold text-rose-500">{row.errorRows}</div>
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
    );
}