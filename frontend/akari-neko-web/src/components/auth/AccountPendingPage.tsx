"use client";

import { Clock, LogOut, ShieldCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export function AccountPendingPage() {
    const { profile, isLoadingProfile, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoadingProfile && profile?.approvalStatus === "approved") {
            router.replace("/home");
        }
    }, [isLoadingProfile, profile?.approvalStatus, router]);

    if (isLoadingProfile) {
        return (
            <main className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-violet-50 px-4">
                <LoadingSkeleton variant="card" className="w-[min(92vw,420px)]" />
            </main>
        );
    }

    const isRejected = profile?.approvalStatus === "rejected";
    const Icon = isRejected ? XCircle : Clock;

    return (
        <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#fff8fb,#fffdf8_48%,#f7f2ff)] px-4 py-10 text-slate-800">
            <section className="w-full max-w-xl rounded-[30px] border border-pink-100 bg-white/90 p-8 text-center shadow-[0_18px_50px_rgba(236,72,153,0.12)]">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-pink-50 text-pink-500">
                    <Icon size={30} />
                </div>

                <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-pink-400">
                    Duyệt tài khoản
                </p>
                <h1 className="mt-3 text-3xl font-black text-slate-900">
                    {isRejected ? "Tài khoản chưa được duyệt" : "Đang chờ duyệt tài khoản"}
                </h1>
                <p className="mx-auto mt-4 max-w-md text-base font-medium leading-7 text-slate-600">
                    {isRejected
                        ? "Tài khoản này hiện không có quyền vào lớp học. Vui lòng liên hệ quản trị viên để được hỗ trợ."
                        : "Bạn đã tạo tài khoản thành công. Quản trị viên sẽ duyệt trước khi bạn có thể vào nội dung học."}
                </p>

                <div className="mt-7 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-left">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 shrink-0 text-violet-500" size={20} />
                        <div>
                            <p className="text-sm font-black text-slate-800">
                                {profile?.email ?? "Tài khoản của bạn"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Trạng thái: {profile?.approvalStatus ?? "pending"}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-black text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-500"
                    onClick={() => void logout()}
                >
                    <LogOut size={17} />
                    Đăng xuất
                </button>
            </section>
        </main>
    );
}
