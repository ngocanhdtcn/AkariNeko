"use client";

import {
  Archive,
  BarChart3,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  CloudUpload,
  Eye,
  FileText,
  LayoutGrid,
  ListChecks,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { AppShell } from "@/components/layout/AppShell";
import type { KaiwaLesson, KaiwaLevel } from "@/data/kaiwaData";
import {
  createKaiwaLesson,
  getKaiwaLessons,
  type CreateKaiwaLessonPayload,
} from "@/services/kaiwaService";
import { KaiwaCard } from "./KaiwaCard";

const levelOptions: Array<KaiwaLevel | "Tất cả"> = [
  "Tất cả",
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
];

type ViewMode = "study" | "manage";
type DeleteMode = "archive" | "delete";

function getLessonStatus(lesson: KaiwaLesson) {
  if (lesson.locked) {
    return "Archived";
  }

  if (lesson.progress === 0) {
    return "Draft";
  }

  return "Published";
}

function getLessonImage(lesson: KaiwaLesson) {
  return lesson.thumbnailUrl ?? "/akari-assets/hero-bg.png";
}

export function KaiwaPage() {
  const [lessons, setLessons] = useState<KaiwaLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("study");
  const [selectedLevel, setSelectedLevel] =
    useState<KaiwaLevel | "Tất cả">("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<KaiwaLesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<KaiwaLesson | null>(null);

  useEffect(() => {
    let isMounted = true;

    getKaiwaLessons()
      .then((items) => {
        if (!isMounted) {
          return;
        }

        setLessons(items);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Khong the tai Kaiwa tu Supabase.",
        );
        setLessons([]);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const published = lessons.filter(
      (lesson) => getLessonStatus(lesson) === "Published",
    ).length;
    const archived = lessons.filter(
      (lesson) => getLessonStatus(lesson) === "Archived",
    ).length;

    return {
      total: lessons.length,
      completed: lessons.filter((lesson) => lesson.completed).length,
      learning: lessons.filter((lesson) => lesson.progress > 0 && !lesson.completed).length,
      average:
        Math.round(
          lessons.reduce((sum, lesson) => sum + lesson.progress, 0) /
            lessons.length,
        ) || 0,
      published,
      draft: lessons.length - published - archived,
      archived,
    };
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const matchesLevel =
        selectedLevel === "Tất cả" || lesson.level === selectedLevel;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          lesson.title,
          lesson.description,
          lesson.source,
          lesson.category,
          lesson.level,
          String(lesson.lessonNumber),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesLevel && matchesSearch;
    });
  }, [lessons, searchTerm, selectedLevel]);

  function handleLessonCreated(lesson: KaiwaLesson) {
    setLessons((current) => [lesson, ...current]);
    setIsCreateModalOpen(false);
    setViewMode("manage");
  }

  const rightPanel = (
    <aside className="grid content-start gap-4">
      <section className="akari-kaiwa-panel rounded-[28px] border border-pink-100/80 bg-white/90 p-5 shadow-[0_14px_34px_rgba(236,72,153,0.08)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
            <BarChart3 size={20} />
          </span>
          <h2 className="text-lg font-black text-slate-800">Tổng quan Kaiwa</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Tổng bài", value: stats.total, icon: BookOpenText },
            { label: "Đã hoàn thành", value: stats.completed, icon: CheckCircle2 },
            { label: "Đang học", value: stats.learning, icon: Video },
            { label: "Tiến độ chung", value: `${stats.average}%`, icon: ListChecks },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border border-pink-100 bg-white/80 p-4"
            >
              <item.icon className="mb-3 text-pink-500" size={20} />
              <p className="text-2xl font-black text-slate-800">{item.value}</p>
              <p className="text-xs font-semibold text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="akari-kaiwa-panel rounded-[28px] border border-pink-100/80 bg-white/90 p-5 shadow-[0_14px_34px_rgba(236,72,153,0.08)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-800">Bài học gần đây</h2>
          <button
            type="button"
            className="text-sm font-black text-pink-500"
            onClick={() => setViewMode("manage")}
          >
            Quản lý
          </button>
        </div>

        <div className="grid gap-3">
          {lessons.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-pink-100 bg-white/70 px-4 py-5 text-sm font-bold text-slate-500">
              {isLoading ? "Đang tải bài Kaiwa..." : "Chưa có bài Kaiwa nào."}
            </p>
          ) : null}

          {lessons.slice(0, 3).map((lesson) => (
            <Link
              key={lesson.id}
              href={`/kaiwa/${lesson.id}`}
              className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border border-pink-100 bg-white/70 p-2 transition hover:bg-pink-50/60"
            >
              <Image
                src={getLessonImage(lesson)}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-800">
                  Bài {lesson.lessonNumber} - {lesson.title}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Đã học {lesson.progress}%
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-pink-500"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );

  return (
    <AppShell rightPanel={rightPanel}>
      <section className="akari-kaiwa-hero relative overflow-hidden rounded-[30px] border border-pink-100/80 bg-gradient-to-br from-white via-pink-50/80 to-violet-50 p-5 shadow-[0_18px_48px_rgba(236,72,153,0.10)] sm:p-6">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/akari-assets/hero-bg.png"
            alt=""
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-500">
              Kaiwa Room
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              Luyện nghe hội thoại qua video và PDF
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Tìm bài theo JLPT, học với video/PDF, hoặc chuyển sang quản lý để
              sửa nội dung mà không cần rời khỏi trang Kaiwa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-pink-100 bg-white/80 p-2 text-sm font-black text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode("study")}
              className={`flex h-11 items-center justify-center gap-2 rounded-2xl px-4 transition ${
                viewMode === "study"
                  ? "bg-pink-500 text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)]"
                  : "hover:bg-pink-50"
              }`}
            >
              <LayoutGrid size={17} />
              Học
            </button>
            <button
              type="button"
              onClick={() => setViewMode("manage")}
              className={`flex h-11 items-center justify-center gap-2 rounded-2xl px-4 transition ${
                viewMode === "manage"
                  ? "bg-violet-500 text-white shadow-[0_12px_24px_rgba(139,92,246,0.22)]"
                  : "hover:bg-violet-50"
              }`}
            >
              <ListChecks size={17} />
              Quản lý
            </button>
          </div>
        </div>
      </section>

      <section className="akari-kaiwa-panel rounded-[28px] border border-pink-100/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(236,72,153,0.08)]">
        {loadError ? (
          <p className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            {loadError}
          </p>
        ) : null}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-pink-100 bg-white px-4 text-sm text-slate-500 shadow-sm focus-within:ring-4 focus-within:ring-pink-100">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm bài học, chủ đề, video hoặc PDF..."
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-10 items-center gap-2 rounded-2xl bg-pink-50 px-3 text-sm font-black text-pink-600">
              <SlidersHorizontal size={16} />
              JLPT
            </span>
            {levelOptions.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedLevel(level)}
                className={`h-10 rounded-2xl px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100 ${
                  selectedLevel === level
                    ? "bg-pink-500 text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)]"
                    : "border border-pink-100 bg-white text-slate-500 hover:bg-pink-50 hover:text-pink-600"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </section>

      {viewMode === "study" ? (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <KaiwaCard key={lesson.id} lesson={lesson} />
          ))}
          {!isLoading && filteredLessons.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-pink-100 bg-white/90 p-8 text-center md:col-span-2 2xl:col-span-3">
              <p className="text-lg font-black text-slate-800">
                Không tìm thấy bài Kaiwa nào
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Hãy kiểm tra dữ liệu trong Supabase hoặc đổi bộ lọc tìm kiếm.
              </p>
            </div>
          ) : null}
          {isLoading ? (
            <div className="rounded-[28px] border border-dashed border-pink-100 bg-white/90 p-8 text-center md:col-span-2 2xl:col-span-3">
              <p className="text-sm font-black text-pink-500">Đang tải bài Kaiwa...</p>
            </div>
          ) : null}
        </section>
      ) : (
        <KaiwaManager
          lessons={filteredLessons}
          stats={stats}
          onCreate={() => setIsCreateModalOpen(true)}
          onEdit={setEditingLesson}
          onDelete={setDeletingLesson}
        />
      )}

      <CreateKaiwaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleLessonCreated}
      />
      <EditKaiwaModal
        lesson={editingLesson}
        onClose={() => setEditingLesson(null)}
      />
      <DeleteKaiwaModal
        lesson={deletingLesson}
        onClose={() => setDeletingLesson(null)}
      />
    </AppShell>
  );
}

type KaiwaManagerProps = {
  lessons: KaiwaLesson[];
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  onCreate: () => void;
  onEdit: (lesson: KaiwaLesson) => void;
  onDelete: (lesson: KaiwaLesson) => void;
};

function KaiwaManager({
  lessons,
  stats,
  onCreate,
  onEdit,
  onDelete,
}: KaiwaManagerProps) {
  return (
    <section className="akari-kaiwa-manager overflow-hidden rounded-[30px] border border-pink-100/80 bg-white/90 shadow-[0_14px_34px_rgba(236,72,153,0.08)]">
      <div className="grid gap-4 border-b border-pink-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center sm:p-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Quản lý Kaiwa</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Thêm, sửa, ẩn hoặc xem trước bài học ngay trong Kaiwa Room.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-600"
        >
          <Plus size={18} />
          Thêm bài Kaiwa
        </button>
      </div>

      <div className="grid gap-3 border-b border-pink-100 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng bài", value: stats.total, tone: "text-pink-500 bg-pink-50" },
          { label: "Published", value: stats.published, tone: "text-emerald-500 bg-emerald-50" },
          { label: "Draft", value: stats.draft, tone: "text-amber-500 bg-amber-50" },
          { label: "Archived", value: stats.archived, tone: "text-slate-500 bg-slate-50" },
        ].map((item) => (
          <div key={item.label} className="akari-kaiwa-manager-stat rounded-[22px] border border-pink-100 bg-white/80 p-4">
            <span className={`rounded-2xl px-3 py-1 text-xs font-black ${item.tone}`}>
              {item.label}
            </span>
            <p className="mt-3 text-2xl font-black text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="akari-kaiwa-manager-table w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="akari-kaiwa-manager-head border-b border-pink-100 bg-pink-50/55 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <th className="px-5 py-4">Bài học</th>
              <th className="px-5 py-4">Level</th>
              <th className="px-5 py-4">Chủ đề</th>
              <th className="px-5 py-4">Tệp học</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Tiến độ TB</th>
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100">
            {lessons.map((lesson) => {
              const status = getLessonStatus(lesson);

              return (
                <tr key={lesson.id} className="akari-kaiwa-manager-row transition hover:bg-pink-50/35">
                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Image
                        src={getLessonImage(lesson)}
                        alt=""
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] rounded-2xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-800">
                          Bài {lesson.lessonNumber} - {lesson.title}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {lesson.source}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-xl bg-violet-50 px-3 py-1 text-sm font-black text-violet-600">
                      {lesson.level}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                    {lesson.category}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Video size={16} className="text-rose-500" />
                        Có
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FileText size={16} className="text-pink-500" />
                        Có
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-pink-500"
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-500">
                        {lesson.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/kaiwa/${lesson.id}`}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-500 transition hover:bg-pink-50 hover:text-pink-500"
                        aria-label="Xem trước"
                      >
                        <Eye size={17} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onEdit(lesson)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 transition hover:bg-violet-100"
                        aria-label="Sửa"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(lesson)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600 transition hover:bg-amber-100"
                        aria-label="Ẩn hoặc xóa"
                      >
                        <Archive size={17} />
                      </button>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-400 transition hover:bg-pink-50"
                        aria-label="Thêm tùy chọn"
                      >
                        <MoreVertical size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "Published"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : status === "Draft"
        ? "bg-amber-50 text-amber-600 border-amber-100"
        : "bg-slate-50 text-slate-500 border-slate-100";

  return (
    <span className={`rounded-xl border px-3 py-1 text-sm font-black ${className}`}>
      {status}
    </span>
  );
}

function CreateKaiwaModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (lesson: KaiwaLesson) => void;
}) {
  const [form, setForm] = useState<CreateKaiwaLessonPayload>({
    title: "",
    level: "N5",
    lessonNumber: 1,
    source: "",
    category: "",
    description: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  useBodyScrollLock(isOpen);

  function updateForm<K extends keyof CreateKaiwaLessonPayload>(
    key: K,
    value: CreateKaiwaLessonPayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
    setVideoFile(event.target.files?.[0] ?? null);
  }

  function handlePdfChange(event: ChangeEvent<HTMLInputElement>) {
    setPdfFile(event.target.files?.[0] ?? null);
  }

  function handleVideoDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files).find((item) =>
      item.type.startsWith("video/"),
    );
    setVideoFile(file ?? null);
  }

  function handlePdfDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files).find(
      (item) => item.type === "application/pdf",
    );
    setPdfFile(file ?? null);
  }

  async function handleCreate() {
    setSubmitError("");

    const title = form.title.trim();
    const source = form.source.trim();
    const category = form.category.trim();
    const description = form.description.trim();

    if (!title || !source || !category || !description || !form.lessonNumber) {
      setSubmitError("Vui long nhap day du ten bai, level, so bai, giao trinh, chu de va mo ta.");
      return;
    }

    setIsSubmitting(true);

    try {
      const lesson = await createKaiwaLesson({
        ...form,
        title,
        source,
        category,
        description,
        videoFile,
        pdfFile,
      });
      setForm({
        title: "",
        level: "N5",
        lessonNumber: 1,
        source: "",
        category: "",
        description: "",
      });
      setVideoFile(null);
      setPdfFile(null);
      onCreated(lesson);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Khong the them bai Kaiwa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-[#071126]/88 p-3 text-slate-100 backdrop-blur-md sm:p-4">
      <div className="w-full max-w-[1440px] overflow-hidden rounded-2xl border border-white/10 bg-[#08142b] shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
        <div className="relative overflow-hidden border-b border-white/10 bg-[#0b1630] px-5 py-5 sm:px-7">
          <Image
            src="/akari-assets/hero-bg.png"
            alt=""
            fill
            priority
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1430] via-[#0a1430]/88 to-[#0a1430]/20" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-slate-200 transition hover:bg-white/14"
            aria-label="Đóng modal thêm bài Kaiwa"
          >
            <X size={18} />
          </button>
          <div className="relative z-10 max-w-3xl">
            <p className="sr-only">
              Admin / Kaiwa Manager / Thêm bài mới
            </p>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Thêm bài Kaiwa mới <span aria-hidden="true">🌸</span>
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Tạo bài học mới với video lưu trên Supabase và tài liệu PDF.
            </p>
          </div>
        </div>

        <div className="grid items-stretch gap-3 p-3 lg:grid-cols-3">
          <section className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <StepHeading step="1" title="Thông tin bài học" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <KaiwaTextField
                label="Tên bài"
                required
                placeholder="Nhập tên bài học"
                value={form.title}
                onChange={(value) => updateForm("title", value)}
              />
              <KaiwaSelectField
                label="JLPT Level"
                required
                placeholder="Chọn level"
                value={form.level}
                onChange={(value) => updateForm("level", value)}
              />
              <KaiwaTextField
                label="Số bài"
                required
                placeholder="VD: 43"
                type="number"
                value={String(form.lessonNumber)}
                onChange={(value) =>
                  updateForm("lessonNumber", Number(value) || 0)
                }
              />
              <KaiwaTextField
                label="Giáo trình"
                required
                placeholder="VD: Minna no Nihongo"
                value={form.source}
                onChange={(value) => updateForm("source", value)}
              />
              <div className="sm:col-span-2">
                <KaiwaTextField
                  label="Chủ đề"
                  required
                  placeholder="VD: Công việc, du lịch, đời sống hằng ngày"
                  value={form.category}
                  onChange={(value) => updateForm("category", value)}
                />
              </div>
              <label className="grid gap-2 text-sm font-bold text-slate-200 sm:col-span-2">
                Mô tả ngắn <span className="sr-only">bắt buộc</span>
                <textarea
                  rows={3}
                  maxLength={320}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Mô tả ngắn về nội dung bài học, mục tiêu và những điểm chính mà người học sẽ đạt được."
                  className="min-h-[76px] resize-none rounded-lg border border-white/10 bg-[#0d1a33] px-4 py-3 text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-500 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/15"
                />
                <span className="text-right text-xs font-semibold text-slate-500">
                  {form.description.length} / 320
                </span>
              </label>
            </div>
          </section>

          <section className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-4">
            <StepHeading step="2" title="Video bài học" />
            <div className="mt-4">
              <div className="rounded-lg border border-white/10 bg-[#0d1a33] p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pink-500/15 text-pink-300">
                    <Save size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-200">
                      Đường dẫn Supabase được tạo tự động
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-4 text-slate-500">
                      Hệ thống sẽ lưu video theo giáo trình, trình độ và số bài. Người dùng không cần nhập đường dẫn.
                    </p>
                  </div>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Mẫu đường dẫn
                </p>
                <p className="mt-2 break-words text-xs font-semibold text-slate-200">
                  {"{Giáo trình} / {Trình độ} / Bài {Số bài} / {Tên bài Kaiwa}.mp4"}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Tên video sẽ lấy theo tên bài Kaiwa và có thể đổi lại khi chỉnh sửa bài.
                </p>
              </div>
              <label
                className="mt-4 grid min-h-[190px] cursor-pointer place-items-center rounded-lg border border-dashed border-white/20 bg-[#111f3c] p-4 text-center transition hover:border-pink-300/70 hover:bg-[#142444]"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleVideoDrop}
              >
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/*"
                  className="sr-only"
                  onChange={handleVideoChange}
                />
                <div>
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-pink-400/80 text-pink-300">
                    <CloudUpload size={23} />
                  </span>
                  <p className="mt-4 text-sm font-bold text-slate-200">
                    {videoFile ? videoFile.name : "Kéo & thả video vào đây"}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {videoFile
                      ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB - sẵn sàng tải lên Supabase`
                      : "Hỗ trợ MP4/WebM. Video sẽ được lưu theo Giáo trình / Trình độ / Số bài."}
                  </p>
                  <span
                    className="mt-4 inline-flex h-10 rounded-lg bg-pink-500 px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(236,72,153,0.24)] transition hover:bg-pink-400"
                  >
                    <span className="flex h-full items-center justify-center">
                      {videoFile ? "Đổi video" : "Chọn video"}
                    </span>
                  </span>
                </div>
              </label>
            </div>
          </section>

          <section className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-4">
            <StepHeading step="3" title="Tài liệu PDF" />
            <div className="mt-4 grid content-start gap-4">
              <label
                className="grid min-h-[180px] cursor-pointer place-items-center rounded-lg border border-dashed border-violet-400/70 bg-violet-500/8 p-4 text-center transition hover:border-violet-300 hover:bg-violet-500/12"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handlePdfDrop}
              >
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={handlePdfChange}
                />
                <div>
                  <CloudUpload className="mx-auto text-violet-300" size={34} />
                  <p className="mt-3 text-sm font-bold text-slate-200">
                    {pdfFile ? pdfFile.name : "Kéo & thả file PDF vào đây"}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {pdfFile
                      ? `${(pdfFile.size / 1024 / 1024).toFixed(1)} MB - sẵn sàng tải lên Supabase`
                      : "hoặc chọn file từ máy tính"}
                  </p>
                  <span
                    className="mt-4 inline-flex h-10 rounded-lg bg-violet-600 px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(124,58,237,0.25)] transition hover:bg-violet-500"
                  >
                    <span className="flex h-full items-center justify-center">
                      {pdfFile ? "Đổi file" : "Chọn file"}
                    </span>
                  </span>
                </div>
              </label>
              <div>
                <p className="mb-3 text-sm font-bold text-slate-300">Xem trước PDF</p>
                <div className="grid min-h-[88px] place-items-center rounded-lg border border-white/10 bg-[#101d38] text-center">
                  <FileText className="mx-auto text-slate-500" size={30} />
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {pdfFile ? pdfFile.name : "Chưa có file PDF"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-[#0a1530] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          {submitError ? (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200">
              {submitError}
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-lg bg-pink-500 px-8 text-sm font-black text-white shadow-[0_16px_32px_rgba(236,72,153,0.26)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={17} />
            {isSubmitting ? "Dang tao..." : "Tạo bài học"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHeading({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pink-500/25 text-lg font-black text-pink-300 ring-1 ring-pink-400/25">
        {step}
      </span>
      <h3 className="text-base font-black text-white">{title}</h3>
    </div>
  );
}

function KaiwaTextField({
  label,
  placeholder,
  required,
  helper,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  helper?: string;
  type?: "text" | "number";
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-300">
      <span>
        {label} {required ? <span className="text-pink-300">*</span> : null}
      </span>
      <input
        type={type}
        min={type === "number" ? 1 : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-11 rounded-lg border border-white/10 bg-[#0d1a33] px-4 text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-500 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/15"
      />
      {helper ? (
        <span className="text-xs font-semibold text-slate-500">{helper}</span>
      ) : null}
    </label>
  );
}

function KaiwaSelectField({
  label,
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: KaiwaLevel;
  onChange?: (value: KaiwaLevel) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-300">
      <span>
        {label} {required ? <span className="text-pink-300">*</span> : null}
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value as KaiwaLevel)}
        className="h-11 rounded-lg border border-white/10 bg-[#0d1a33] px-4 text-sm font-semibold text-slate-400 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-500/15"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        <option>N5</option>
        <option>N4</option>
        <option>N3</option>
        <option>N2</option>
        <option>N1</option>
      </select>
    </label>
  );
}

function EditKaiwaModal({
  lesson,
  onClose,
}: {
  lesson: KaiwaLesson | null;
  onClose: () => void;
}) {
  useBodyScrollLock(Boolean(lesson));

  if (!lesson) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-slate-900/40 px-4 py-5 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-[30px] border border-pink-100 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.26)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-500">
              Chỉnh sửa bài Kaiwa
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Bài {lesson.lessonNumber} - {lesson.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-500 transition hover:bg-pink-50"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tên bài" value={`Bài ${lesson.lessonNumber} - ${lesson.title}`} />
              <Field label="JLPT Level" value={lesson.level} />
              <Field label="Giáo trình" value={lesson.source} />
              <Field label="Chủ đề" value={lesson.category} />
            </div>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Mô tả ngắn
              <textarea
                defaultValue={lesson.description}
                rows={4}
                className="rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none focus:ring-4 focus:ring-pink-100"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <SupportList title="Từ vựng chính" items={lesson.notes.vocabulary} />
              <SupportList title="Mẫu câu chính" items={lesson.notes.patterns} />
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="rounded-[24px] border border-pink-100 bg-pink-50/60 p-4">
              <p className="mb-3 text-sm font-black text-slate-800">Video YouTube</p>
              <div className="relative aspect-video overflow-hidden rounded-[22px] bg-slate-900">
                <Image
                  src={getLessonImage(lesson)}
                  alt=""
                  fill
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-500 text-white">
                    <Video size={26} />
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-violet-200 bg-violet-50/70 p-4 text-center">
              <FileText className="mx-auto mb-3 text-violet-500" size={28} />
              <p className="text-sm font-black text-slate-800">
                Kéo thả hoặc thay thế PDF
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                bai-kaiwa-{lesson.lessonNumber}.pdf
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            className="h-12 rounded-2xl border border-pink-100 bg-white text-sm font-black text-slate-600 transition hover:bg-pink-50"
          >
            Lưu nháp
          </button>
          <button
            type="button"
            className="h-12 rounded-2xl bg-pink-500 text-sm font-black text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-600"
            onClick={onClose}
          >
            Lưu thay đổi
          </button>
          <Link
            href={`/kaiwa/${lesson.id}`}
            className="flex h-12 items-center justify-center rounded-2xl border border-pink-100 bg-white text-sm font-black text-slate-600 transition hover:bg-pink-50"
          >
            Xem trước
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <input
        defaultValue={value}
        className="h-12 rounded-2xl border border-pink-100 bg-white px-4 text-sm font-semibold text-slate-600 outline-none focus:ring-4 focus:ring-pink-100"
      />
    </label>
  );
}

function SupportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[24px] border border-pink-100 bg-white/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-black text-slate-800">{title}</h3>
        <button type="button" className="text-sm font-black text-pink-500">
          Thêm
        </button>
      </div>
      <div className="grid gap-2">
        {items.slice(0, 4).map((item) => (
          <div
            key={item}
            className="flex items-center justify-between gap-3 rounded-2xl bg-pink-50/60 px-3 py-2 text-sm font-semibold text-slate-600"
          >
            <span className="truncate">{item}</span>
            <Pencil size={15} className="shrink-0 text-pink-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DeleteKaiwaModal({
  lesson,
  onClose,
}: {
  lesson: KaiwaLesson | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<DeleteMode>("archive");
  useBodyScrollLock(Boolean(lesson));

  if (!lesson) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-slate-900/45 px-4 py-5 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[30px] border border-pink-100 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.26)]">
        <div className="mb-5 flex items-start justify-between gap-4 text-center sm:text-left">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-black text-slate-900">
              Xóa hoặc ẩn bài Kaiwa?
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Nên ẩn bài nếu muốn giữ tiến độ học và tài liệu liên quan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-slate-500 transition hover:bg-pink-50"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-[24px] border border-pink-100 bg-pink-50/50 p-3">
          <Image
            src={getLessonImage(lesson)}
            alt=""
            width={86}
            height={86}
            className="h-[86px] w-[86px] rounded-2xl object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-slate-900">
              Bài {lesson.lessonNumber} - {lesson.title}
            </p>
            <p className="text-sm font-semibold text-slate-500">
              {lesson.source} • {lesson.level}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DeleteChoice
            active={mode === "archive"}
            icon={Archive}
            title="Ẩn bài học"
            description="Chuyển sang Archived, vẫn giữ video, PDF và tiến độ."
            onClick={() => setMode("archive")}
          />
          <DeleteChoice
            active={mode === "delete"}
            icon={Trash2}
            title="Xóa vĩnh viễn"
            description="Xóa bài, tài liệu liên quan và không thể hoàn tác."
            danger
            onClick={() => setMode("delete")}
          />
        </div>

        <div className="mt-4 rounded-[22px] border border-amber-100 bg-amber-50/70 p-4 text-sm font-semibold leading-6 text-slate-600">
          Lưu ý: thao tác này ảnh hưởng đến video, PDF và dữ liệu học của người
          học liên quan.
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1.25fr]">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl border border-pink-100 bg-white text-sm font-black text-slate-600 transition hover:bg-pink-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl bg-violet-500 text-sm font-black text-white transition hover:bg-violet-600"
          >
            Ẩn bài
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl bg-rose-500 text-sm font-black text-white transition hover:bg-rose-600"
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  );
}

type DeleteChoiceProps = {
  active: boolean;
  danger?: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
};

function DeleteChoice({
  active,
  danger,
  icon: Icon,
  title,
  description,
  onClick,
}: DeleteChoiceProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition ${
        active
          ? danger
            ? "border-rose-300 bg-rose-50"
            : "border-violet-300 bg-violet-50"
          : "border-pink-100 bg-white hover:bg-pink-50/50"
      }`}
    >
      <Icon
        size={28}
        className={danger ? "mb-4 text-rose-500" : "mb-4 text-violet-500"}
      />
      <p className="font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>
    </button>
  );
}
