"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AppSelectProps = {
  label: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
};

export function AppSelect({
  label,
  items,
  value,
  onChange,
  disabled = false,
  isLoading = false,
}: AppSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldOpenUp, setShouldOpenUp] = useState(false);
  const selectRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleToggle() {
    if (disabled) {
      return;
    }

    setIsOpen((current) => {
      const nextIsOpen = !current;

      if (nextIsOpen && selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        setShouldOpenUp(spaceBelow < 300 && spaceAbove > spaceBelow);
      }

      return nextIsOpen;
    });
  }

  function handleSelect(item: string) {
    onChange(item);
    setIsOpen(false);
  }

  return (
    <div
      ref={selectRef}
      className={`relative grid gap-2 ${isOpen ? "z-[90]" : "z-40"}`}
    >
      <span className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
        {isLoading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
        ) : null}
      </span>

      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          isOpen
            ? "border-pink-300 text-pink-500 ring-4 ring-pink-100/70"
            : "border-pink-100 text-slate-700 hover:border-pink-200 hover:bg-pink-50/50"
        } disabled:cursor-wait disabled:bg-slate-50 disabled:text-slate-400`}
        onClick={handleToggle}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition ${
            isOpen ? "rotate-180 text-pink-400" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          className={`akari-select-menu absolute left-0 z-[100] max-h-64 w-full min-w-28 overflow-x-hidden overflow-y-auto rounded-2xl border border-pink-100 bg-white p-2 shadow-[0_18px_50px_rgba(236,72,153,0.18)] sm:w-max ${
            shouldOpenUp
              ? "bottom-[calc(100%+8px)]"
              : "top-[calc(100%+8px)]"
          }`}
        >
          {items.map((item) => {
            const isSelected = item === value;

            return (
              <button
                key={item}
                type="button"
                className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition sm:min-w-24 ${
                  isSelected
                    ? "bg-pink-50 text-pink-500"
                    : "text-slate-600 hover:bg-violet-50 hover:text-violet-500"
                }`}
                onClick={() => handleSelect(item)}
              >
                <span className="min-w-0 truncate sm:whitespace-nowrap">{item}</span>
                {isSelected ? <Check size={16} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
