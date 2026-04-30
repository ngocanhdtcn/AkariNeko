import { FilePlus2, FolderUp, X } from "lucide-react";

type ImportModalHeaderProps = {
    isFolderImport: boolean;
    onClose: () => void;
};

export function ImportModalHeader({
    isFolderImport,
    onClose,
}: ImportModalHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-pink-50 bg-gradient-to-r from-pink-50 to-violet-50 px-6 py-5">
            <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
                    {isFolderImport ? (
                        <FolderUp size={27} strokeWidth={2.4} />
                    ) : (
                        <FilePlus2 size={27} strokeWidth={2.4} />
                    )}
                </div>

                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                        Vocabulary Import
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-800">
                        {isFolderImport ? "Import folder HTML" : "Import file HTML"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Import từ vựng hàng loạt theo Book / Chapter và tự động bỏ qua dữ
                        liệu trùng.
                    </p>
                </div>
            </div>

            <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-500 shadow-sm transition hover:bg-pink-50 hover:text-pink-500"
                onClick={onClose}
            >
                <X size={20} />
            </button>
        </div>
    );
}