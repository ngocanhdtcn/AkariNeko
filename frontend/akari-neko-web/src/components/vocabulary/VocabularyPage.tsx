"use client";

import {
  BookOpen,
  ChevronDown,
  Download,
  FilePlus2,
  FolderUp,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { recentVocabularies } from "@/data/dashboardData";
import { SoftPanel } from "../ui/SoftPanel";
import { useEffect, useRef, useState } from "react";
import { ImportVocabularyModal } from "./ImportVocabularyModal";

const jlptLevels = ["All", "N5", "N4", "N3", "N2", "N1"];

const books = [
  "All books",
  "JLPT Vocabulary",
  "Minna no Nihongo",
  "Soumatome",
  "Shinkanzen Master",
];

const chapters = [
  "All chapters",
  "Chapter 1",
  "Chapter 2",
  "Chapter 3",
  "Chapter 4",
];

function SelectBox({ label, items }: { label: string; items: string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>

      <button
        type="button"
        className="flex h-12 min-w-36 items-center justify-between gap-3 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
      >
        <span>{items[0]}</span>
        <ChevronDown size={17} className="text-slate-400" />
      </button>
    </label>
  );
}

function ImportButton({
  onSelectSource,
}: {
  onSelectSource: (sourceType: "file" | "folder") => void;
}) {
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        importMenuRef.current &&
        !importMenuRef.current.contains(event.target as Node)
      ) {
        setIsImportMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsImportMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSelectSource(sourceType: "file" | "folder") {
    onSelectSource(sourceType);
    setIsImportMenuOpen(false);
  }

  return (
    <div ref={importMenuRef} className="relative z-50">
      <button
        type="button"
        className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(236,72,153,0.22)] transition hover:brightness-105"
        onClick={() => setIsImportMenuOpen((current) => !current)}
      >
        <Upload size={18} />
        Import
        <ChevronDown
          size={16}
          className={`transition-transform ${
            isImportMenuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isImportMenuOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-3xl border border-pink-100 bg-white/95 p-2 shadow-[0_18px_50px_rgba(236,72,153,0.18)] backdrop-blur-xl">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-pink-50 hover:text-pink-500"
            onClick={() => handleSelectSource("file")}
          >
            <FilePlus2 size={18} />
            Import file HTML
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-pink-50 hover:text-pink-500"
            onClick={() => handleSelectSource("folder")}
          >
            <FolderUp size={18} />
            Import folder HTML
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function VocabularyPage() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSourceType, setImportSourceType] = useState<"file" | "folder">(
    "file",
  );

  function openImportModal(sourceType: "file" | "folder") {
    setImportSourceType(sourceType);
    setIsImportModalOpen(true);
  }

  function closeImportModal() {
    setIsImportModalOpen(false);
  }
  return (
    <>
      <div className="grid gap-4">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative overflow-visible rounded-[30px] border border-pink-100/80 bg-[linear-gradient(105deg,#fff2f7_0%,#fff9fc_45%,#eee8ff_100%)] p-6 shadow-[0_18px_50px_rgba(236,72,153,0.10)]"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-pink-200/35 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
                <BookOpen size={24} strokeWidth={2.4} />
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-pink-500">
                Vocabulary Management
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-800">
                Quản lý từ vựng tiếng Nhật
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Lọc từ vựng theo JLPT, sách, chapter và chuẩn bị import hàng
                loạt từ file HTML hoặc folder HTML.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="flex h-12 items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
              >
                <Plus size={18} />
                Thêm từ vựng
              </button>

              <ImportButton onSelectSource={openImportModal} />

              <button
                type="button"
                className="flex h-12 items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </div>
        </motion.section>

        <SoftPanel className="p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[auto_auto_auto_1fr] xl:items-end">
            <SelectBox label="JLPT Level" items={jlptLevels} />
            <SelectBox label="Book" items={books} />
            <SelectBox label="Chapter" items={chapters} />

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Search
              </span>

              <div className="flex h-12 items-center rounded-2xl border border-pink-100 bg-white px-4 shadow-sm">
                <Search size={18} className="mr-3 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm font-medium text-slate-600 outline-none placeholder:text-slate-400"
                  placeholder="Tìm Kanji, Hiragana hoặc nghĩa tiếng Việt..."
                />
              </div>
            </label>
          </div>
        </SoftPanel>

        <SoftPanel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800">
                Danh sách từ vựng
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Hiển thị dữ liệu mẫu, sau này sẽ nối API backend.
              </p>
            </div>

            <span className="rounded-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-500">
              {recentVocabularies.length} từ
            </span>
          </div>

          <div className="grid gap-3 md:hidden">
            {recentVocabularies.map((vocabulary) => (
              <div
                key={`${vocabulary.kanji}-${vocabulary.hiragana}-vocab-mobile`}
                className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-black text-slate-800">
                        {vocabulary.kanji}
                      </p>
                      <span className="rounded-xl bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-500">
                        {vocabulary.level}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {vocabulary.hiragana}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {vocabulary.meaning}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-xl border border-pink-100 bg-white px-3 py-2 text-sm font-bold text-pink-400"
                  >
                    ⋯
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[22px] border border-pink-50 md:block">
            <div className="grid grid-cols-[1fr_1fr_1.6fr_0.7fr_0.8fr_0.8fr_0.7fr] bg-gradient-to-r from-pink-50/80 to-white px-4 py-3 text-sm font-bold text-slate-500">
              <div>Kanji</div>
              <div>Hiragana</div>
              <div>Meaning</div>
              <div>Level</div>
              <div>Correct</div>
              <div>Wrong</div>
              <div>Action</div>
            </div>

            {recentVocabularies.map((vocabulary) => (
              <div
                key={`${vocabulary.kanji}-${vocabulary.hiragana}-vocab`}
                className="grid grid-cols-[1fr_1fr_1.6fr_0.7fr_0.8fr_0.8fr_0.7fr] items-center border-t border-pink-50 px-4 py-3 text-sm text-slate-600 transition hover:bg-pink-50/45"
              >
                <div className="text-base font-black text-slate-800">
                  {vocabulary.kanji}
                </div>

                <div className="font-semibold text-slate-700">
                  {vocabulary.hiragana}
                </div>

                <div>{vocabulary.meaning}</div>

                <div>
                  <span className="rounded-xl bg-pink-100 px-3 py-1 font-bold text-pink-500">
                    {vocabulary.level}
                  </span>
                </div>

                <div className="font-bold text-emerald-600">
                  {vocabulary.correctCount}
                </div>

                <div className="font-bold text-rose-500">
                  {vocabulary.wrongCount}
                </div>

                <div>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-pink-100 bg-white text-pink-400 shadow-sm transition hover:bg-pink-50"
                  >
                    ⋯
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SoftPanel>
      </div>
      <ImportVocabularyModal
        isOpen={isImportModalOpen}
        sourceType={importSourceType}
        onClose={closeImportModal}
      />
    </>
  );
}
