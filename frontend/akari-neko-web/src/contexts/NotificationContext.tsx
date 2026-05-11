"use client";

import { Toaster } from "sonner";
import {
    dismissNotification,
    notifyError,
    notifyInfo,
    notifyLoading,
    notifyPromise,
    notifySuccess,
} from "@/lib/notify";

const notificationApi = {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyLoading,
    notifyPromise,
    dismissNotification,
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster
                richColors
                closeButton
                position="bottom-right"
                toastOptions={{
                    classNames: {
                        toast:
                            "rounded-2xl border border-pink-100 bg-pink-50/95 text-slate-700 shadow-[0_18px_42px_rgba(236,72,153,0.16)] backdrop-blur",
                        title: "text-sm font-black",
                        description: "text-sm font-semibold text-slate-500",
                        success: "border-emerald-100 bg-emerald-50/95 text-emerald-700",
                        error: "border-rose-100 bg-rose-50/95 text-rose-600",
                        info: "border-violet-100 bg-violet-50/95 text-violet-700",
                        loading: "border-pink-100 bg-pink-50/95 text-pink-600",
                        closeButton:
                            "border-pink-100 bg-white text-slate-500 hover:bg-pink-50",
                    },
                }}
                offset="calc(env(safe-area-inset-bottom) + 1.25rem)"
                mobileOffset="calc(env(safe-area-inset-bottom) + 5.25rem)"
            />
        </>
    );
}

export function useNotification() {
    return notificationApi;
}
