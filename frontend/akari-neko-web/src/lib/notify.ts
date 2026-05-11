"use client";

import { toast, type ExternalToast } from "sonner";

type NotifyPromiseMessages<T> = {
    loading: string;
    success: string | ((data: T) => string);
    error: string;
};

type SupabaseLikeError = {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
};

const TECHNICAL_ERROR_PATTERNS = [
    /duplicate key/i,
    /violates row-level security/i,
    /permission denied/i,
    /invalid input syntax/i,
    /failed to fetch/i,
    /networkerror/i,
    /jwt/i,
    /invalid login credentials/i,
    /email not confirmed/i,
    /user already registered/i,
    /password should be/i,
    /auth session missing/i,
    /refresh token/i,
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getSupabaseErrorMessage(error: SupabaseLikeError) {
    if (typeof error.message === "string" && error.message.trim()) {
        return error.message;
    }

    if (typeof error.details === "string" && error.details.trim()) {
        return error.details;
    }

    if (typeof error.hint === "string" && error.hint.trim()) {
        return error.hint;
    }

    return null;
}

function shouldHideRawError(message: string) {
    return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function getReadableErrorMessage(
    error: unknown,
    fallbackMessage: string,
) {
    let rawMessage: string | null = null;

    if (error instanceof Error && error.message.trim()) {
        rawMessage = error.message.trim();
    } else if (typeof error === "string" && error.trim()) {
        rawMessage = error.trim();
    } else if (isRecord(error)) {
        rawMessage = getSupabaseErrorMessage(error);
    }

    if (!rawMessage || shouldHideRawError(rawMessage)) {
        return fallbackMessage;
    }

    return rawMessage;
}

const defaultToastOptions = {
    duration: 3200,
} satisfies ExternalToast;

export function notifySuccess(message: string, options?: ExternalToast) {
    toast.success(message, {
        ...defaultToastOptions,
        ...options,
    });
}

export function notifyError(
    error: unknown,
    fallbackMessage: string,
    options?: ExternalToast,
) {
    toast.error(getReadableErrorMessage(error, fallbackMessage), {
        duration: 5200,
        ...options,
    });
}

export function notifyInfo(message: string, options?: ExternalToast) {
    toast.info(message, {
        ...defaultToastOptions,
        ...options,
    });
}

export function notifyLoading(message: string, options?: ExternalToast) {
    return toast.loading(message, options);
}

export function dismissNotification(id?: string | number) {
    toast.dismiss(id);
}

export function notifyPromise<T>(
    promise: Promise<T>,
    messages: NotifyPromiseMessages<T>,
) {
    toast.promise(promise, {
        loading: messages.loading,
        success: messages.success,
        error: (error) => getReadableErrorMessage(error, messages.error),
    });

    return promise;
}
