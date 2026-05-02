"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import {
    runDevChecks,
    type DevCheckItem,
} from "@/services/devCheckService";

export function DevCheckPage() {
    const [checkItems, setCheckItems] = useState<DevCheckItem[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    async function handleRunChecks() {
        setIsChecking(true);

        try {
            const results = await runDevChecks();
            setCheckItems(results);
        } finally {
            setIsChecking(false);
        }
    }

    useEffect(() => {
        void handleRunChecks();
    }, []);

    const successCount = checkItems.filter(
        (item) => item.status === "success",
    ).length;

    const errorCount = checkItems.filter((item) => item.status === "error").length;

    return (
        <div className="grid gap-5">
            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-6 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                            Dev Check
                        </p>

                        <h1 className="mt-1 text-3xl font-black text-slate-800">
                            Kiểm tra kết nối hệ thống
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Dùng để kiểm tra Auth, Supabase, RLS và các bảng chính trước khi deploy.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={isChecking}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void handleRunChecks()}
                    >
                        <RefreshCcw size={16} />
                        {isChecking ? "Checking..." : "Run checks"}
                    </button>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[26px] border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm">
                    <p className="text-sm font-bold text-emerald-600">Success</p>
                    <p className="mt-2 text-3xl font-black text-emerald-700">
                        {successCount}
                    </p>
                </div>

                <div className="rounded-[26px] border border-rose-100 bg-rose-50/80 p-5 shadow-sm">
                    <p className="text-sm font-bold text-rose-500">Error</p>
                    <p className="mt-2 text-3xl font-black text-rose-600">
                        {errorCount}
                    </p>
                </div>
            </section>

            <section className="rounded-[32px] border border-pink-100 bg-white/85 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)]">
                <h2 className="text-xl font-black text-slate-800">Check results</h2>

                <div className="mt-4 grid gap-3">
                    {checkItems.length > 0 ? (
                        checkItems.map((item) => (
                            <div
                                key={item.label}
                                className={`rounded-2xl border px-4 py-3 ${item.status === "success"
                                        ? "border-emerald-100 bg-emerald-50"
                                        : "border-rose-100 bg-rose-50"
                                    }`}
                            >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <p
                                        className={`text-sm font-black ${item.status === "success"
                                                ? "text-emerald-700"
                                                : "text-rose-600"
                                            }`}
                                    >
                                        {item.label}
                                    </p>

                                    <span
                                        className={`w-fit rounded-full px-3 py-1 text-xs font-black ${item.status === "success"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-rose-100 text-rose-600"
                                            }`}
                                    >
                                        {item.status.toUpperCase()}
                                    </span>
                                </div>

                                <p className="mt-2 text-sm font-medium text-slate-600">
                                    {item.message}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-pink-50 bg-white px-4 py-6 text-center text-sm font-medium text-slate-400">
                            Chưa có kết quả kiểm tra.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}