"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AppMultiSelectProps = {
  label: string;
  items: string[];
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  enableRangeSelection?: boolean;
  showAllOption?: boolean;
  allLabel?: string;
  menuAlign?: "center" | "left";
};

type RangeSelectProps = {
  label: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  menuAlign: "left" | "right";
};

function getDisplayValue(values: string[], items: string[], allLabel: string) {
  if (values.length === 0) {
    return items.length === 1 ? items[0] : allLabel;
  }

  if (values.length === 1) {
    return values[0];
  }

  return `${values.length} selected`;
}

function RangeSelect({
  label,
  items,
  value,
  onChange,
  isOpen,
  onOpenChange,
  menuAlign,
}: RangeSelectProps) {
  function handleSelect(item: string) {
    onChange(item);
    onOpenChange(false);
  }

  return (
    <div className="relative grid min-w-0 gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <button
        type="button"
        aria-expanded={isOpen}
        className={`flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-left text-sm font-bold shadow-sm outline-none transition focus-visible:ring-4 focus-visible:ring-pink-100 ${
          isOpen
            ? "border-pink-300 text-pink-500 ring-4 ring-pink-100/70"
            : "border-pink-100 text-slate-700 hover:border-pink-200 hover:bg-pink-50/50"
        }`}
        onClick={() => onOpenChange(!isOpen)}
      >
        <span className="min-w-0 whitespace-normal break-words leading-snug">
          {value || "Chọn bài"}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition ${
            isOpen ? "rotate-180 text-pink-400" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          className={`absolute top-[calc(100%+6px)] z-[140] max-h-80 w-[24rem] max-w-[calc(100vw-3rem)] overflow-y-auto rounded-xl border border-pink-100 bg-white p-1.5 shadow-[0_18px_50px_rgba(236,72,153,0.18)] ${
            menuAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          <button
            type="button"
            className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
              value === ""
                ? "bg-pink-50 text-pink-500"
                : "text-slate-600 hover:bg-violet-50 hover:text-violet-500"
            }`}
            onClick={() => handleSelect("")}
          >
            <span className="min-w-0 whitespace-normal break-words leading-snug">
              Chọn bài
            </span>
            {value === "" ? <Check size={14} className="shrink-0" /> : null}
          </button>

          {items.map((item) => {
            const isSelected = item === value;

            return (
              <button
                key={item}
                type="button"
                className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
                  isSelected
                    ? "bg-pink-50 text-pink-500"
                    : "text-slate-600 hover:bg-violet-50 hover:text-violet-500"
                }`}
                onClick={() => handleSelect(item)}
              >
                <span className="min-w-0 whitespace-normal break-words leading-snug">
                  {item}
                </span>
                {isSelected ? <Check size={14} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AppMultiSelect({
  label,
  items,
  values,
  onChange,
  disabled = false,
  isLoading = false,
  enableRangeSelection = false,
  showAllOption = true,
  allLabel = "All",
  menuAlign = "center",
}: AppMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [openRangeSelect, setOpenRangeSelect] = useState<"start" | "end" | null>(
    null,
  );
  const [menuOffset, setMenuOffset] = useState(0);
  const selectRef = useRef<HTMLDivElement | null>(null);

  function updateMenuOffset() {
    if (!selectRef.current) {
      return;
    }

    const rect = selectRef.current.getBoundingClientRect();
    const viewportPadding = 16;
    const menuWidth = Math.min(608, window.innerWidth - viewportPadding * 2);
    const centeredLeft = rect.left + rect.width / 2 - menuWidth / 2;
    const clampedLeft = Math.min(
      Math.max(centeredLeft, viewportPadding),
      window.innerWidth - viewportPadding - menuWidth,
    );

    setMenuOffset(clampedLeft - centeredLeft);
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setOpenRangeSelect(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setOpenRangeSelect(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || menuAlign !== "center") {
      return;
    }

    updateMenuOffset();
    window.addEventListener("resize", updateMenuOffset);
    window.addEventListener("scroll", updateMenuOffset, true);

    return () => {
      window.removeEventListener("resize", updateMenuOffset);
      window.removeEventListener("scroll", updateMenuOffset, true);
    };
  }, [isOpen, menuAlign]);

  function handleToggle() {
    if (disabled) {
      return;
    }

    setIsOpen((current) => {
      const nextIsOpen = !current;
      if (!nextIsOpen) {
        setOpenRangeSelect(null);
      }

      return nextIsOpen;
    });
  }

  function handleToggleItem(item: string) {
    if (values.includes(item)) {
      onChange(values.filter((value) => value !== item));
      setOpenRangeSelect(null);
      return;
    }

    onChange([...values, item]);
    setOpenRangeSelect(null);
  }

  function handleApplyRange() {
    if (!rangeStart && !rangeEnd) {
      return;
    }

    const startIndex = rangeStart
      ? items.indexOf(rangeStart)
      : items.indexOf(rangeEnd);
    const endIndex = rangeEnd
      ? items.indexOf(rangeEnd)
      : items.indexOf(rangeStart);

    if (startIndex < 0 || endIndex < 0) {
      return;
    }

    const fromIndex = Math.min(startIndex, endIndex);
    const toIndex = Math.max(startIndex, endIndex);
    onChange(items.slice(fromIndex, toIndex + 1));
    setOpenRangeSelect(null);
  }

  return (
    <div
      ref={selectRef}
      className={`relative grid min-w-[180px] gap-2 ${isOpen ? "z-[90]" : "z-40"}`}
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
        <span className="truncate">
          {getDisplayValue(values, items, allLabel)}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition ${
            isOpen ? "rotate-180 text-pink-400" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          className={`akari-select-menu absolute top-[calc(100%+8px)] z-[100] flex max-h-[26rem] w-[calc(100vw-2rem)] max-w-[38rem] flex-col overflow-visible rounded-2xl border border-pink-100 bg-white p-2 shadow-[0_18px_50px_rgba(236,72,153,0.18)] ${
            menuAlign === "left" ? "left-0" : "left-1/2 -translate-x-1/2"
          }`}
          style={menuAlign === "center" ? { marginLeft: menuOffset } : undefined}
        >
          {showAllOption ? (
            <button
              type="button"
              className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                values.length === 0
                  ? "bg-pink-50 text-pink-500"
                  : "text-slate-600 hover:bg-violet-50 hover:text-violet-500"
              }`}
              onClick={() => onChange([])}
            >
              <span className="min-w-0 whitespace-normal break-words leading-snug">
                {allLabel}
              </span>
              {values.length === 0 ? (
                <Check size={16} className="shrink-0" />
              ) : null}
            </button>
          ) : null}

          {enableRangeSelection && items.length > 1 ? (
            <div className="mb-2 grid shrink-0 gap-2 rounded-xl border border-pink-100 bg-pink-50/70 p-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <RangeSelect
                  label="Từ bài"
                  items={items}
                  value={rangeStart}
                  onChange={setRangeStart}
                  isOpen={openRangeSelect === "start"}
                  onOpenChange={(nextIsOpen) =>
                    setOpenRangeSelect(nextIsOpen ? "start" : null)
                  }
                  menuAlign="left"
                />
                <RangeSelect
                  label="Đến bài"
                  items={items}
                  value={rangeEnd}
                  onChange={setRangeEnd}
                  isOpen={openRangeSelect === "end"}
                  onOpenChange={(nextIsOpen) =>
                    setOpenRangeSelect(nextIsOpen ? "end" : null)
                  }
                  menuAlign="right"
                />
              </div>

              <button
                type="button"
                className="h-9 rounded-lg bg-pink-500 px-3 text-xs font-black text-white shadow-sm transition hover:bg-pink-600"
                onClick={handleApplyRange}
              >
                Chọn khoảng
              </button>
            </div>
          ) : null}

          <div className="min-h-0 overflow-y-auto pr-1">
            {items.map((item) => {
              const isSelected = values.includes(item);

              return (
                <button
                  key={item}
                  type="button"
                  className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                    isSelected
                      ? "bg-pink-50 text-pink-500"
                      : "text-slate-600 hover:bg-violet-50 hover:text-violet-500"
                  }`}
                  onClick={() => handleToggleItem(item)}
                >
                  <span className="min-w-0 whitespace-normal break-words leading-snug">
                    {item}
                  </span>
                  {isSelected ? <Check size={16} className="shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
