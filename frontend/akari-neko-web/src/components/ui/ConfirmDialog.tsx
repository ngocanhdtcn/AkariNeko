"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[30px] border border-pink-100 bg-white p-5 shadow-[0_24px_80px_rgba(236,72,153,0.22)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm">
            <AlertTriangle size={24} strokeWidth={2.4} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-500">
                  Xác nhận
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-800">
                  {title}
                </h2>
              </div>

              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-400 shadow-sm transition hover:bg-pink-50 hover:text-pink-500"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isConfirming}
            className="h-11 rounded-2xl border border-pink-100 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isConfirming}
            className="h-11 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(244,63,94,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onConfirm}
          >
            {isConfirming ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
