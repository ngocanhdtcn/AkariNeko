"use client";

import { Cat, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import {
    signInWithEmail,
    signUpWithEmail,
} from "@/services/authService";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup";

export function AuthPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authMessage, setAuthMessage] = useState<string | null>(null);
    const router = useRouter();

    const isSignup = mode === "signup";

    async function handleSubmit() {
        setIsSubmitting(true);
        setAuthError(null);
        setAuthMessage(null);

        try {
            if (isSignup) {
                await signUpWithEmail({
                    email,
                    password,
                    displayName: displayName.trim() || email,
                });

                setAuthMessage("Đăng ký thành công. Bạn có thể vào app ngay.");
                router.push("/");
                return;
            }

            await signInWithEmail({
                email,
                password,
            });

            setAuthMessage("Đăng nhập thành công.");
            router.push("/");
        } catch (error) {
            console.error("Auth failed:", error);
            setAuthError(
                isSignup
                    ? "Không thể đăng ký. Kiểm tra email/password hoặc tài khoản đã tồn tại."
                    : "Không thể đăng nhập. Kiểm tra email/password.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 px-4 py-10">
            <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-5xl place-items-center">
                <section className="grid w-full overflow-hidden rounded-[36px] border border-pink-100 bg-white/90 shadow-[0_28px_80px_rgba(236,72,153,0.18)] lg:grid-cols-[1fr_420px]">
                    <div className="hidden bg-gradient-to-br from-pink-100 via-white to-violet-100 p-10 lg:block">
                        <div className="flex h-full flex-col justify-between">
                            <div>
                                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-pink-500 shadow-sm">
                                    <Cat size={34} />
                                </div>

                                <h1 className="mt-8 text-4xl font-black leading-tight text-slate-800">
                                    Chào mừng đến với AkariNeko
                                </h1>

                                <p className="mt-4 max-w-md text-base leading-7 text-slate-500">
                                    Đăng nhập để lưu tiến độ học, flashcard, quiz và chuẩn bị cho
                                    tính năng bạn bè / chat sau này.
                                </p>
                            </div>

                            <div className="rounded-[28px] border border-white/80 bg-white/75 p-5">
                                <p className="text-sm font-bold text-pink-500">
                                    Roadmap tiếp theo
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Sau Auth, mình sẽ gắn user_id vào dữ liệu học, rồi mới làm
                                    online status và nhắn tin realtime.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="mb-8">
                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-500">
                                {isSignup ? "Create account" : "Login"}
                            </p>

                            <h2 className="mt-2 text-3xl font-black text-slate-800">
                                {isSignup ? "Tạo tài khoản" : "Đăng nhập"}
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                {isSignup
                                    ? "Tạo tài khoản để bắt đầu đồng bộ tiến độ học."
                                    : "Đăng nhập để tiếp tục học tiếng Nhật."}
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {isSignup ? (
                                <label className="grid gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Display name
                                    </span>
                                    <input
                                        value={displayName}
                                        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                        placeholder="Ví dụ: Akari"
                                        onChange={(event) => setDisplayName(event.target.value)}
                                    />
                                </label>
                            ) : null}

                            <label className="grid gap-2">
                                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Email
                                </span>
                                <input
                                    value={email}
                                    type="email"
                                    className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                    placeholder="you@example.com"
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Password
                                </span>
                                <input
                                    value={password}
                                    type="password"
                                    className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100/70"
                                    placeholder="Ít nhất 6 ký tự"
                                    onChange={(event) => setPassword(event.target.value)}
                                />
                            </label>

                            {authError ? (
                                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
                                    {authError}
                                </div>
                            ) : null}

                            {authMessage ? (
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
                                    {authMessage}
                                </div>
                            ) : null}

                            <button
                                type="button"
                                disabled={isSubmitting || !email || !password}
                                className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                                onClick={() => void handleSubmit()}
                            >
                                {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />}
                                {isSubmitting
                                    ? "Processing..."
                                    : isSignup
                                        ? "Create account"
                                        : "Login"}
                            </button>

                            <button
                                type="button"
                                className="text-sm font-bold text-slate-500 transition hover:text-pink-500"
                                onClick={() => {
                                    setMode(isSignup ? "login" : "signup");
                                    setAuthError(null);
                                    setAuthMessage(null);
                                }}
                            >
                                {isSignup
                                    ? "Đã có tài khoản? Đăng nhập"
                                    : "Chưa có tài khoản? Tạo tài khoản"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}