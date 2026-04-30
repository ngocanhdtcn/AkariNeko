import { FilePlus2, FolderUp, UploadCloud } from "lucide-react";

type ImportDropzoneProps = {
    isFolderImport: boolean;
    selectedFileCount: number;
    onOpenFilePicker: () => void;
};

export function ImportDropzone({
    isFolderImport,
    selectedFileCount,
    onOpenFilePicker,
}: ImportDropzoneProps) {
    return (
        <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-800">
                        Chọn dữ liệu import
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Web app không xoá file gốc trên máy sau import. Nếu có file tạm trên
                        server thì backend sẽ tự xoá sau.
                    </p>
                </div>

                <button
                    type="button"
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)]"
                    onClick={onOpenFilePicker}
                >
                    <UploadCloud size={18} />
                    {isFolderImport ? "Chọn folder HTML" : "Chọn file HTML"}
                </button>
            </div>

            <button
                type="button"
                className="mt-5 w-full rounded-2xl border border-dashed border-pink-200 bg-pink-50/60 p-6 text-center transition hover:bg-pink-50"
                onClick={onOpenFilePicker}
            >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-pink-500 shadow-sm">
                    {isFolderImport ? <FolderUp size={30} /> : <FilePlus2 size={30} />}
                </div>

                <p className="mt-4 text-base font-black text-slate-800">
                    {selectedFileCount > 0
                        ? `${selectedFileCount} file HTML đã được chọn`
                        : isFolderImport
                            ? "Bấm để chọn folder HTML"
                            : "Bấm để chọn file HTML"}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                    Hỗ trợ file `.html` / `.htm`. Folder import mặc định chỉ lấy file HTML
                    trực tiếp trong folder đã chọn.
                </p>
            </button>
        </>
    );
}