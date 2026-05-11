"use client";

import {
    BookOpen,
    Cat,
    ChevronRight,
    Flame,
    LockKeyhole,
    LogIn,
    Mail,
    Pencil,
    UserPlus,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AkariNekoWordmark } from "@/components/branding/AkariNekoWordmark";
import { useTheme } from "@/contexts/ThemeContext";
import {
    signInWithEmail,
    signUpWithEmail,
} from "@/services/authService";
import { useNotification } from "@/contexts/NotificationContext";

type AuthMode = "login" | "signup";

const missionItems = [
    {
        icon: BookOpen,
        title: "Ôn flashcard",
        description: "Ghi nhớ mỗi ngày",
        color: "from-pink-300 to-rose-400",
    },
    {
        icon: Pencil,
        title: "Làm quiz ngắn",
        description: "Kiểm tra kiến thức",
        color: "from-amber-200 to-orange-400",
    },
    {
        icon: Flame,
        title: "Giữ streak học tập",
        description: "Cố gắng mỗi ngày",
        color: "from-orange-300 to-pink-500",
    },
];

export function AuthPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authMessage, setAuthMessage] = useState<string | null>(null);
    const [hasMounted, setHasMounted] = useState(false);
    const router = useRouter();
    const { isDarkMode } = useTheme();
    const { notifyError, notifySuccess } = useNotification();

    const isSignup = mode === "signup";
    const isDarkAuth = hasMounted && isDarkMode;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasMounted(true);
    }, []);

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
                notifySuccess("Đăng ký thành công.");
                router.push("/");
                return;
            }

            await signInWithEmail({
                email,
                password,
            });

            setAuthMessage("Đăng nhập thành công.");
            notifySuccess("Đăng nhập thành công.");
            router.push("/");
        } catch (error) {
            console.error("Auth failed:", error);
            const fallbackMessage = isSignup
                ? "Không thể đăng ký. Kiểm tra email/password hoặc tài khoản đã tồn tại."
                : "Không thể đăng nhập. Kiểm tra email/password.";
            setAuthError(fallbackMessage);
            notifyError(error, fallbackMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputFrameClass = isDarkAuth
        ? "border-white/10 bg-white/10 text-white focus-within:border-pink-300/60 focus-within:ring-pink-300/20"
        : "border-pink-100 bg-white/80 text-slate-800 focus-within:border-pink-300 focus-within:ring-pink-200/50";
    const inputClass = isDarkAuth
        ? "text-white placeholder:text-slate-400"
        : "text-slate-800 placeholder:text-slate-400";
    const labelClass = isDarkAuth ? "text-slate-200" : "text-slate-600";

    return (
        <main
            data-akari-auth-theme={isDarkAuth ? "dark" : "light"}
            className={`akari-auth-page relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-6 sm:px-6 lg:py-10 ${isDarkAuth ? "bg-slate-950" : "bg-pink-50"
                }`}
            style={{
                backgroundImage: `url(${isDarkAuth
                    ? "/images/auth/login-background-dark.avif"
                    : "/images/auth/login-background-light.avif"
                    })`,
            }}
        >
            <div
                className={`absolute inset-0 ${isDarkAuth
                    ? "bg-slate-950/45"
                    : "bg-pink-50/25"
                    }`}
            />
            <div
                className={`absolute inset-0 ${isDarkAuth
                    ? "bg-[radial-gradient(circle_at_48%_28%,rgba(244,114,182,0.16),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.24))]"
                    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,247,252,0.36))]"
                    }`}
            />

            <div className="relative z-10 mx-auto grid min-h-[calc(100vh-48px)] max-w-7xl place-items-center lg:min-h-[calc(100vh-80px)]">
                <section
                    className={`grid w-full overflow-hidden rounded-[32px] border shadow-2xl backdrop-blur-2xl lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] ${isDarkAuth
                        ? "border-white/10 bg-slate-950/65 text-slate-100 shadow-slate-950/50"
                        : "border-pink-100/80 bg-white/70 text-slate-800 shadow-pink-200/45"
                        }`}
                >
                    <div
                        className={`relative overflow-hidden border-b p-6 sm:p-8 lg:min-h-[690px] lg:border-b-0 lg:border-r lg:p-10 xl:p-12 ${isDarkAuth
                            ? "border-white/10 bg-slate-950/24"
                            : "border-pink-100/80 bg-white/30"
                            }`}
                    >
                        <div
                            className={`absolute inset-0 ${isDarkAuth
                                ? "bg-[radial-gradient(circle_at_18%_10%,rgba(236,72,153,0.16),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent)]"
                                : "bg-[radial-gradient(circle_at_16%_12%,rgba(244,114,182,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.34),rgba(255,255,255,0.06))]"
                                }`}
                        />

                        <div className="relative z-10 grid min-h-[610px] content-between gap-8">
                            <div>
                                <AkariNekoWordmark
                                    size="lg"
                                    subtitle="日本語を一緒に学ぼう"
                                    className={isDarkAuth ? "[&_p]:text-pink-100/90" : "[&_p]:text-slate-600"}
                                />

                                <div className="mt-12 max-w-2xl">
                                    <h1
                                        className={`text-4xl font-black leading-tight tracking-normal sm:text-5xl xl:text-6xl ${isDarkAuth ? "text-white" : "text-slate-900"
                                            }`}
                                    >
                                        Chào mừng trở lại!
                                        <span className="ml-3 text-pink-400">✿</span>
                                    </h1>
                                    <p
                                        className={`mt-5 max-w-[440px] text-lg font-medium leading-8 sm:text-xl ${isDarkAuth ? "text-slate-100" : "text-slate-700"
                                            }`}
                                    >
                                        Hôm nay cùng AkariNeko học thêm một chút tiếng Nhật nhé.
                                        <span className="ml-2 text-pink-400">♥</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid items-end gap-6 lg:grid-cols-[minmax(240px,1fr)_300px]">
                                <div className="relative min-h-[300px]">
                                    <Image
                                        src="/stickers/akarineko/good-morning.png"
                                        alt="AkariNeko mascot"
                                        width={380}
                                        height={380}
                                        priority
                                        className="absolute bottom-0 left-0 h-[300px] w-[300px] object-contain drop-shadow-[0_24px_42px_rgba(15,23,42,0.28)]"
                                    />
                                </div>

                                <div className="grid gap-5">
                                    <div
                                        className={`rounded-[24px] border p-5 shadow-xl backdrop-blur-xl ${isDarkAuth
                                            ? "border-pink-300/45 bg-slate-950/42"
                                            : "border-pink-200/80 bg-white/68"
                                            }`}
                                    >
                                        <p className={`mb-4 text-xl font-black ${isDarkAuth ? "text-pink-100" : "text-slate-800"}`}>
                                            今日のミッション
                                            <span className="ml-2 text-pink-400">✿</span>
                                        </p>

                                        <div className="grid gap-3">
                                            {missionItems.map((item) => {
                                                const Icon = item.icon;

                                                return (
                                                    <div
                                                        key={item.title}
                                                        className={`flex items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0 ${isDarkAuth ? "border-pink-200/10" : "border-pink-100"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg shadow-pink-500/15`}
                                                        >
                                                            <Icon size={21} />
                                                        </span>
                                                        <span>
                                                            <span className={`block text-base font-black ${isDarkAuth ? "text-white" : "text-slate-800"}`}>
                                                                {item.title}
                                                            </span>
                                                            <span className={`block text-sm font-medium ${isDarkAuth ? "text-pink-100/75" : "text-slate-500"}`}>
                                                                {item.description}
                                                            </span>
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div
                                        className={`rounded-[24px] border px-6 py-4 text-center shadow-lg backdrop-blur-xl ${isDarkAuth
                                            ? "border-pink-300/25 bg-white/[0.055]"
                                            : "border-pink-100 bg-white/65"
                                            }`}
                                    >
                                        <p className={`text-base font-medium leading-8 ${isDarkAuth ? "text-pink-100" : "text-slate-700"}`}>
                                            <span className="mr-2 text-2xl text-pink-400">“</span>
                                            小さな積み重ねが、
                                            <br />
                                            大きな未来をつくります。
                                            <span className="ml-2 text-pink-400">✿</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`relative grid p-3 sm:p-4 lg:min-h-[690px] lg:p-5 xl:p-6 ${isDarkAuth ? "bg-slate-950/35" : "bg-white/42"}`}>
                        <div
                            className={`relative z-10 grid h-full w-full content-center rounded-[30px] border p-7 pt-16 shadow-2xl backdrop-blur-xl sm:p-9 sm:pt-17 lg:p-11 lg:pt-18 xl:p-12 xl:pt-18 ${isDarkAuth
                                ? "border-violet-200/18 bg-white/[0.045] shadow-slate-950/35"
                                : "border-pink-100/90 bg-white/60 shadow-pink-200/30"
                                }`}
                        >
                            <div
                                className={`absolute right-7 top-5 hidden w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold sm:flex lg:right-9 lg:top-6 ${isDarkAuth
                                    ? "border-pink-200/20 bg-white/[0.06] text-pink-100"
                                    : "border-pink-100 bg-white/70 text-slate-600"
                                    }`}
                            >
                                <Cat size={17} />
                                Học vui mỗi ngày ♡
                            </div>

                            <div className="mb-6 w-full">
                                <p className="text-lg font-black uppercase tracking-[0.18em] text-pink-400">
                                    {isSignup ? "SIGN UP" : "LOGIN"}
                                </p>
                                <h2
                                    className={`mt-4 text-[44px] font-black leading-tight sm:text-[52px] ${isDarkAuth ? "text-white" : "text-slate-900"
                                        }`}
                                >
                                    {isSignup ? "Bắt đầu với AkariNeko" : "おかえりなさい"}
                                    {!isSignup ? <span className="ml-3 text-pink-400">✿</span> : null}
                                </h2>
                                <p className={`mt-4 text-base leading-7 sm:text-lg ${isDarkAuth ? "text-slate-300" : "text-slate-600"}`}>
                                    {isSignup
                                        ? "Tạo tài khoản để lưu tiến độ học, quiz và flashcard."
                                        : "Đăng nhập để tiếp tục hành trình tiếng Nhật của bạn."}
                                </p>
                            </div>

                            <div className="grid w-full gap-5">
                                {isSignup ? (
                                    <label className="grid gap-2.5">
                                        <span className={`text-sm font-bold uppercase tracking-[0.13em] ${labelClass}`}>
                                            Display name
                                        </span>
                                        <input
                                            value={displayName}
                                            className={`h-15 rounded-2xl border px-5 text-base font-semibold outline-none transition focus:ring-4 ${isDarkAuth
                                                ? "border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus:border-pink-300/60 focus:ring-pink-300/20"
                                                : "border-pink-100 bg-white/80 text-slate-800 placeholder:text-slate-400 focus:border-pink-300 focus:ring-pink-200/50"
                                                }`}
                                            placeholder="Ví dụ: Akari"
                                            onChange={(event) => setDisplayName(event.target.value)}
                                        />
                                    </label>
                                ) : null}

                                <label className="grid gap-2.5">
                                    <span className={`text-sm font-bold uppercase tracking-[0.13em] ${labelClass}`}>
                                        Email
                                    </span>
                                    <div className={`flex h-15 items-center gap-3 rounded-2xl border px-5 transition focus-within:ring-4 ${inputFrameClass}`}>
                                        <Mail
                                            size={23}
                                            className={isDarkAuth ? "shrink-0 text-pink-100/80" : "shrink-0 text-pink-400"}
                                        />
                                        <input
                                            value={email}
                                            type="email"
                                            className={`h-full min-w-0 flex-1 bg-transparent text-base font-semibold outline-none ${inputClass}`}
                                            placeholder="Nhập email của bạn"
                                            onChange={(event) => setEmail(event.target.value)}
                                        />
                                    </div>
                                </label>

                                <label className="grid gap-2.5">
                                    <span className={`text-sm font-bold uppercase tracking-[0.13em] ${labelClass}`}>
                                        Password
                                    </span>
                                    <div className={`flex h-15 items-center gap-3 rounded-2xl border px-5 transition focus-within:ring-4 ${inputFrameClass}`}>
                                        <LockKeyhole
                                            size={23}
                                            className={isDarkAuth ? "shrink-0 text-pink-100/80" : "shrink-0 text-pink-400"}
                                        />
                                        <input
                                            value={password}
                                            type="password"
                                            className={`h-full min-w-0 flex-1 bg-transparent text-base font-semibold outline-none ${inputClass}`}
                                            placeholder="Nhập mật khẩu của bạn"
                                            onChange={(event) => setPassword(event.target.value)}
                                        />
                                    </div>
                                </label>

                                {authError ? (
                                    <div
                                        className={`rounded-2xl border px-4 py-3 text-sm font-bold ${isDarkAuth
                                            ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
                                            : "border-rose-100 bg-rose-50 text-rose-600"
                                            }`}
                                    >
                                        {authError}
                                    </div>
                                ) : null}

                                {authMessage ? (
                                    <div
                                        className={`rounded-2xl border px-4 py-3 text-sm font-bold ${isDarkAuth
                                            ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                                            : "border-emerald-100 bg-emerald-50 text-emerald-600"
                                            }`}
                                    >
                                        {authMessage}
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    disabled={isSubmitting || !email || !password}
                                    className="mt-1 flex h-15 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-500 px-6 text-base font-black text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => void handleSubmit()}
                                >
                                    {isSignup ? <UserPlus size={21} /> : <LogIn size={21} />}
                                    <span className="min-w-32 text-center">
                                        {isSubmitting
                                            ? "Đang xử lý..."
                                            : isSignup
                                                ? "Tạo tài khoản"
                                                : "Vào lớp học"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`mt-1 flex items-center justify-center gap-2 text-base font-bold transition ${isDarkAuth ? "text-pink-200 hover:text-white" : "text-pink-600 hover:text-slate-900"
                                        }`}
                                    onClick={() => {
                                        setMode(isSignup ? "login" : "signup");
                                        setAuthError(null);
                                        setAuthMessage(null);
                                    }}
                                >
                                    {isSignup
                                        ? "Đã có tài khoản? Đăng nhập"
                                        : "Chưa có tài khoản? Tạo tài khoản miễn phí"}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
