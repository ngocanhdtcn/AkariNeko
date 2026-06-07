"use client";

import {
  Archive,
  Check,
  ChevronDown,
  CloudUpload,
  Clock,
  Download,
  Eye,
  ExternalLink,
  FileText,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  ListChecks,
  LoaderCircle,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Video,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useYouTubeVideoTitles } from "@/hooks/useYouTubeVideoTitles";
import { AppShell } from "@/components/layout/AppShell";
import type { KaiwaLesson, KaiwaLevel } from "@/data/kaiwaData";
import { getDisplayFileNameFromUrl } from "@/lib/fileLabels";
import { getYouTubeVideoId, isYouTubeUrl } from "@/lib/youtube";
import {
  createKaiwaLesson,
  getKaiwaLessons,
  updateKaiwaLessonMedia,
  type CreateKaiwaLessonPayload,
} from "@/services/kaiwaService";
import { KaiwaCard } from "./KaiwaCard";

type KaiwaSelectedLevel = KaiwaLevel | "Tất cả";

const levelOptions: KaiwaSelectedLevel[] = [
  "Tất cả",
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
];

type ViewMode = "study" | "manage";
type DeleteMode = "archive" | "delete";
const kaiwaLevelValues: KaiwaLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const KAIWA_CREATE_DRAFT_KEY = "akari:kaiwa:create-draft";
const KAIWA_SELECTED_LEVEL_KEY = "akari:kaiwa:selected-level";
const KAIWA_MAX_UPLOAD_FILE_MB = Number(
  process.env.NEXT_PUBLIC_KAIWA_MAX_UPLOAD_FILE_MB ?? 50,
);
const KAIWA_MAX_UPLOAD_FILE_BYTES = KAIWA_MAX_UPLOAD_FILE_MB * 1024 * 1024;

const createKaiwaModalSession: {
  isOpen: boolean;
  form: CreateKaiwaLessonPayload | null;
  videoFiles: File[];
  videoUrlText: string;
  pdfFiles: File[];
  audioFiles: File[];
} = {
  isOpen: false,
  form: null,
  videoFiles: [],
  videoUrlText: "",
  pdfFiles: [],
  audioFiles: [],
};

function parseVideoUrlText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resetCreateKaiwaModalSession() {
  createKaiwaModalSession.form = null;
  createKaiwaModalSession.videoFiles = [];
  createKaiwaModalSession.videoUrlText = "";
  createKaiwaModalSession.pdfFiles = [];
  createKaiwaModalSession.audioFiles = [];
  createKaiwaModalSession.isOpen = false;
}

function getKaiwaLevelOrDefault(level: string | null | undefined): KaiwaLevel {
  const normalizedLevel = level?.trim().toUpperCase();

  return kaiwaLevelValues.includes(normalizedLevel as KaiwaLevel)
    ? (normalizedLevel as KaiwaLevel)
    : "N5";
}

function getKaiwaSelectedLevelOrNull(
  level: string | null | undefined,
): KaiwaSelectedLevel | null {
  if (level === "Tất cả") {
    return level;
  }

  const normalizedLevel = level?.trim().toUpperCase();

  return kaiwaLevelValues.includes(normalizedLevel as KaiwaLevel)
    ? (normalizedLevel as KaiwaLevel)
    : null;
}

function readStoredKaiwaSelectedLevel(): KaiwaSelectedLevel | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return getKaiwaSelectedLevelOrNull(
      window.localStorage.getItem(KAIWA_SELECTED_LEVEL_KEY),
    );
  } catch {
    return null;
  }
}

function subscribeToStoredKaiwaSelectedLevel(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function writeStoredKaiwaSelectedLevel(level: KaiwaSelectedLevel) {
  try {
    window.localStorage.setItem(KAIWA_SELECTED_LEVEL_KEY, level);
  } catch {
    // Remembering the filter is best-effort only.
  }
}

function getEmptyCreateKaiwaForm(
  lessonNumber = 1,
  level: KaiwaLevel = "N5",
): CreateKaiwaLessonPayload {
  return {
    title: "",
    level,
    lessonNumber,
    source: "",
    category: "",
    description: "",
  };
}

function getInitialCreateKaiwaForm(lessonNumber = 1): CreateKaiwaLessonPayload {
  if (typeof window === "undefined") {
    return getEmptyCreateKaiwaForm(lessonNumber);
  }

  try {
    const savedDraft = window.localStorage.getItem(KAIWA_CREATE_DRAFT_KEY);

    if (!savedDraft) {
      return getEmptyCreateKaiwaForm(lessonNumber);
    }

    const parsedDraft = JSON.parse(savedDraft) as Partial<CreateKaiwaLessonPayload>;

    return {
      ...getEmptyCreateKaiwaForm(),
      ...parsedDraft,
      level: parsedDraft.level ?? "N5",
      lessonNumber: Number(parsedDraft.lessonNumber) || 1,
    };
  } catch {
    return getEmptyCreateKaiwaForm(lessonNumber);
  }
}

function hasCreateKaiwaFormContent(form: CreateKaiwaLessonPayload) {
  return Boolean(
    form.title.trim() ||
      form.source.trim() ||
      form.category.trim() ||
      form.description.trim() ||
      form.level !== "N5" ||
      form.lessonNumber !== 1,
  );
}

function getUniqueKaiwaSources(lessons: KaiwaLesson[]) {
  return Array.from(
    new Set(
      lessons
        .map((lesson) => lesson.source.trim())
        .filter(Boolean),
    ),
  ).sort((firstSource, secondSource) =>
    firstSource.localeCompare(secondSource, "vi", { sensitivity: "base" }),
  );
}

function getNextKaiwaLessonNumber(
  lessons: KaiwaLesson[],
  level: KaiwaLevel,
  source: string,
) {
  const normalizedSource = source.trim().toLowerCase();
  const sourceExists = lessons.some(
    (lesson) => lesson.source.trim().toLowerCase() === normalizedSource,
  );
  const scopedLessons = lessons.filter((lesson) => {
    if (lesson.level !== level) {
      return false;
    }

    if (!normalizedSource) {
      return true;
    }

    return sourceExists
      ? lesson.source.trim().toLowerCase() === normalizedSource
      : false;
  });
  const maxLessonNumber = scopedLessons.reduce(
    (maxNumber, lesson) => Math.max(maxNumber, lesson.lessonNumber),
    0,
  );

  return maxLessonNumber + 1;
}

function getLessonStatus(lesson: KaiwaLesson) {
  if (lesson.locked) {
    return "Archived";
  }

  return "Published";
}

function getLessonImage(lesson: KaiwaLesson) {
  return lesson.thumbnailUrl ?? "/akari-assets/hero-bg.png";
}

export function KaiwaPage() {
  const { profile, isLoadingProfile } = useAuth();
  const storedSelectedLevel = useSyncExternalStore(
    subscribeToStoredKaiwaSelectedLevel,
    readStoredKaiwaSelectedLevel,
    () => null,
  );
  const [lessons, setLessons] = useState<KaiwaLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("study");
  const [manualSelectedLevel, setManualSelectedLevel] =
    useState<KaiwaSelectedLevel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(createKaiwaModalSession.isOpen);
  const [createModalKey, setCreateModalKey] = useState(0);
  const [editingLesson, setEditingLesson] = useState<KaiwaLesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<KaiwaLesson | null>(null);
  const profileLevelFilter = useMemo(() => {
    const normalizedLevel = profile?.currentJlptLevel?.trim().toUpperCase();

    return kaiwaLevelValues.includes(normalizedLevel as KaiwaLevel)
      ? (normalizedLevel as KaiwaLevel)
      : null;
  }, [profile?.currentJlptLevel]);
  const selectedLevel =
    manualSelectedLevel ??
    storedSelectedLevel ??
    (!isLoadingProfile ? profileLevelFilter : null) ??
    "Tất cả";

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
            : "Không thể tải Kaiwa từ Supabase.",
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
    createKaiwaModalSession.isOpen = false;
    setIsCreateModalOpen(false);
    setViewMode("manage");
  }

  function handleLessonUpdated(updatedLesson: KaiwaLesson) {
    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === updatedLesson.id ? updatedLesson : lesson,
      ),
    );
    setEditingLesson(null);
    setViewMode("manage");
  }

  function handleSelectedLevelChange(level: KaiwaSelectedLevel) {
    setManualSelectedLevel(level);
    writeStoredKaiwaSelectedLevel(level);
  }

  function openCreateModal() {
    const defaultLevel = getKaiwaLevelOrDefault(profile?.currentJlptLevel);

    window.localStorage.removeItem(KAIWA_CREATE_DRAFT_KEY);
    createKaiwaModalSession.form = getEmptyCreateKaiwaForm(
      getNextKaiwaLessonNumber(lessons, defaultLevel, ""),
      defaultLevel,
    );
    createKaiwaModalSession.isOpen = true;
    setCreateModalKey((current) => current + 1);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    resetCreateKaiwaModalSession();
    window.localStorage.removeItem(KAIWA_CREATE_DRAFT_KEY);
    setCreateModalKey((current) => current + 1);
    setIsCreateModalOpen(false);
  }

  return (
    <AppShell>
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
                onClick={() => handleSelectedLevelChange(level)}
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
          {filteredLessons.map((lesson, index) => (
            <KaiwaCard key={lesson.id} lesson={lesson} eager={index === 0} />
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
          onCreate={openCreateModal}
          onEdit={setEditingLesson}
          onDelete={setDeletingLesson}
        />
      )}

      <CreateKaiwaModal
        key={createModalKey}
        isOpen={isCreateModalOpen}
        lessons={lessons}
        onClose={closeCreateModal}
        onCreated={handleLessonCreated}
      />
      <EditKaiwaModal
        key={editingLesson?.id ?? "no-edit"}
        lesson={editingLesson}
        onClose={() => setEditingLesson(null)}
        onUpdated={handleLessonUpdated}
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
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100">
            {lessons.map((lesson, index) => {
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
                        loading={index === 0 ? "eager" : undefined}
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
                        {lesson.videoUrls.length || (lesson.videoUrl ? 1 : 0)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FileText size={16} className="text-pink-500" />
                        {lesson.pdfUrls.length || (lesson.pdfUrl ? 1 : 0)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={status} />
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
  lessons,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  lessons: KaiwaLesson[];
  onClose: () => void;
  onCreated: (lesson: KaiwaLesson) => void;
}) {
  const [form, setForm] = useState<CreateKaiwaLessonPayload>(
    () => createKaiwaModalSession.form ?? getInitialCreateKaiwaForm(),
  );
  const [videoFiles, setVideoFiles] = useState<File[]>(
    () => createKaiwaModalSession.videoFiles,
  );
  const [videoUrlText, setVideoUrlText] = useState(
    () => createKaiwaModalSession.videoUrlText,
  );
  const [pdfFiles, setPdfFiles] = useState<File[]>(
    () => createKaiwaModalSession.pdfFiles,
  );
  const [audioFiles, setAudioFiles] = useState<File[]>(
    () => createKaiwaModalSession.audioFiles,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fileNotice, setFileNotice] = useState("");
  useBodyScrollLock(isOpen);

  const sourceOptions = useMemo(() => getUniqueKaiwaSources(lessons), [lessons]);
  const nextLessonNumber = useMemo(
    () => getNextKaiwaLessonNumber(lessons, form.level, form.source),
    [form.level, form.source, lessons],
  );
  const selectedFiles = [...videoFiles, ...pdfFiles, ...audioFiles];
  const videoUrls = parseVideoUrlText(videoUrlText);
  const videoTitlesByUrl = useYouTubeVideoTitles(videoUrls);
  const uploadSummary =
    selectedFiles.length > 0 || videoUrls.length > 0
      ? `${videoUrls.length} link YouTube, ${videoFiles.length} video, ${pdfFiles.length} PDF, ${audioFiles.length} MP3${
          selectedFiles.length > 0 ? ` - ${formatTotalSize(selectedFiles)}` : ""
        }`
      : "không có file đính kèm";

  useEffect(() => {
    createKaiwaModalSession.form = form;
  }, [form]);

  useEffect(() => {
    createKaiwaModalSession.videoFiles = videoFiles;
  }, [videoFiles]);

  useEffect(() => {
    createKaiwaModalSession.videoUrlText = videoUrlText;
  }, [videoUrlText]);

  useEffect(() => {
    createKaiwaModalSession.pdfFiles = pdfFiles;
  }, [pdfFiles]);

  useEffect(() => {
    createKaiwaModalSession.audioFiles = audioFiles;
  }, [audioFiles]);

  useEffect(() => {
    createKaiwaModalSession.isOpen = isOpen;
  }, [isOpen]);

  useEffect(() => {
    try {
      if (hasCreateKaiwaFormContent(form)) {
        window.localStorage.setItem(KAIWA_CREATE_DRAFT_KEY, JSON.stringify(form));
        return;
      }

      window.localStorage.removeItem(KAIWA_CREATE_DRAFT_KEY);
    } catch {
      // Draft persistence is best-effort only.
    }
  }, [form]);

  useEffect(() => {
    const hasSelectedFiles =
      videoFiles.length > 0 ||
      videoUrlText.trim().length > 0 ||
      pdfFiles.length > 0 ||
      audioFiles.length > 0 ||
      isSubmitting;

    if (!hasSelectedFiles) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [audioFiles.length, isSubmitting, pdfFiles.length, videoFiles.length, videoUrlText]);

  function updateForm<K extends keyof CreateKaiwaLessonPayload>(
    key: K,
    value: CreateKaiwaLessonPayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateLevel(level: KaiwaLevel) {
    setForm((current) => ({
      ...current,
      level,
      lessonNumber: getNextKaiwaLessonNumber(lessons, level, current.source),
    }));
  }

  function updateSource(source: string) {
    setForm((current) => ({
      ...current,
      source,
      lessonNumber: getNextKaiwaLessonNumber(lessons, current.level, source),
    }));
  }

  function addVideoFiles(files: File[]) {
    const acceptedFiles = files.filter((item) => item.type.startsWith("video/"));
    const rejectedCount = files.length - acceptedFiles.length;

    if (acceptedFiles.length > 0) {
      setVideoFiles((current) => [...current, ...acceptedFiles]);
    }

    if (rejectedCount > 0) {
      setFileNotice(`Đã bỏ qua ${rejectedCount} file không phải video.`);
      return;
    }

    setFileNotice(files.length > 0 && acceptedFiles.length === 0 ? "Không có video hợp lệ để thêm." : "");
  }

  function addPdfFiles(files: File[]) {
    const acceptedFiles = files.filter(
      (item) => item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf"),
    );
    const rejectedCount = files.length - acceptedFiles.length;

    if (acceptedFiles.length > 0) {
      setPdfFiles((current) => [...current, ...acceptedFiles]);
    }

    if (rejectedCount > 0) {
      setFileNotice(`Đã bỏ qua ${rejectedCount} file không phải PDF.`);
      return;
    }

    setFileNotice(files.length > 0 && acceptedFiles.length === 0 ? "Không có PDF hợp lệ để thêm." : "");
  }

  function addAudioFiles(files: File[]) {
    const acceptedFiles = files.filter(
      (item) => item.type.startsWith("audio/") || item.name.toLowerCase().endsWith(".mp3"),
    );
    const rejectedCount = files.length - acceptedFiles.length;

    if (acceptedFiles.length > 0) {
      setAudioFiles((current) => [...current, ...acceptedFiles]);
    }

    if (rejectedCount > 0) {
      setFileNotice(`Da bo qua ${rejectedCount} file khong phai audio/MP3.`);
      return;
    }

    setFileNotice(files.length > 0 && acceptedFiles.length === 0 ? "Không có MP3 hợp lệ để thêm." : "");
  }

  function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
    addVideoFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handlePdfChange(event: ChangeEvent<HTMLInputElement>) {
    addPdfFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleAudioChange(event: ChangeEvent<HTMLInputElement>) {
    addAudioFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleVideoDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    addVideoFiles(Array.from(event.dataTransfer.files));
  }

  function handlePdfDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    addPdfFiles(Array.from(event.dataTransfer.files));
  }

  function handleAudioDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    addAudioFiles(Array.from(event.dataTransfer.files));
  }

  async function handleCreate() {
    setSubmitError("");
    setFileNotice("");

    const title = form.title.trim();
    const source = form.source.trim();
    const category = form.category.trim();
    const description = form.description.trim();

    if (!title || !source || !category || !description || !form.lessonNumber) {
      setSubmitError("Vui lòng nhập đầy đủ tên bài, level, số bài, giáo trình, chủ đề và mô tả.");
      return;
    }

    const invalidVideoUrls = videoUrls.filter((url) => !isYouTubeUrl(url));

    if (invalidVideoUrls.length > 0) {
      setSubmitError(
        `Link video không hợp lệ: ${invalidVideoUrls.join(", ")}. Vui lòng dùng link YouTube dạng youtube.com/watch?v=... hoặc youtu.be/...`,
      );
      return;
    }

    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > KAIWA_MAX_UPLOAD_FILE_BYTES,
    );

    if (oversizedFiles.length > 0) {
      setSubmitError(
        `Có ${oversizedFiles.length} file vượt ${KAIWA_MAX_UPLOAD_FILE_MB} MB: ${oversizedFiles
          .map((file) => `${file.name} (${formatFileSize(file)})`)
          .join(", ")}. Hãy tăng giới hạn Supabase Storage hoặc giảm dung lượng file trước khi upload.`,
      );
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
        videoUrls,
        videoFiles,
        pdfFiles,
        audioFiles,
      });
      setForm(
        getEmptyCreateKaiwaForm(
          getNextKaiwaLessonNumber([...lessons, lesson], form.level, form.source),
        ),
      );
      setVideoFiles([]);
      setVideoUrlText("");
      setPdfFiles([]);
      setAudioFiles([]);
      resetCreateKaiwaModalSession();
      window.localStorage.removeItem(KAIWA_CREATE_DRAFT_KEY);
      onCreated(lesson);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Không thể thêm bài Kaiwa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] grid items-start justify-items-center overflow-y-auto bg-[#071126]/88 p-3 text-slate-100 backdrop-blur-md sm:p-4">
      <div className="relative w-full max-w-[1680px] overflow-hidden rounded-2xl border border-white/10 bg-[#08142b] shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
        {isSubmitting ? (
          <div className="absolute inset-0 z-50 grid place-items-center bg-[#071126]/60 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-pink-300/25 bg-[#0b1630] p-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
              <LoaderCircle className="mx-auto animate-spin text-pink-300" size={34} />
              <p className="mt-4 text-base font-black text-white">
                Đang tải file lên Supabase...
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                Đang xử lý {uploadSummary}. File lớn có thể mất vài phút, vui lòng giữ modal mở.
              </p>
            </div>
          </div>
        ) : null}
        <div className="sticky top-0 z-20 overflow-hidden border-b border-white/10 bg-[#0b1630] px-5 py-5 sm:px-7">
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
            className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#111f3c]/95 text-slate-200 shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition hover:bg-white/14"
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
            <p className="mt-3 max-w-2xl rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold leading-5 text-slate-300">
              Video/PDF đã chọn sẽ được giữ khi chỉ đổi tab. Nhấn X hoặc Hủy bỏ sẽ bỏ nội dung đang nhập.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-3 p-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:col-span-2 xl:col-span-1 xl:col-start-1">
            <StepHeading step="1" title="Thông tin bài học" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <KaiwaTextField
                label="Tên bài"
                required
                placeholder="Nhập tên bài học"
                value={form.title}
                onChange={(value) => updateForm("title", value)}
              />
              <KaiwaComboboxField
                label="JLPT Level"
                required
                placeholder="Chọn level"
                value={form.level}
                options={["N5", "N4", "N3", "N2", "N1"]}
                onChange={(value) => updateLevel(value as KaiwaLevel)}
              />
              <KaiwaTextField
                label="Số bài"
                required
                placeholder="VD: 43"
                type="number"
                value={String(form.lessonNumber)}
                helper={`Gợi ý kế tiếp: bài ${nextLessonNumber}`}
                onChange={(value) =>
                  updateForm("lessonNumber", Number(value) || 0)
                }
              />
              <KaiwaComboboxField
                label="Giáo trình"
                required
                placeholder="VD: Minna no Nihongo"
                value={form.source}
                options={sourceOptions}
                allowCustom
                emptyText="Chưa có giáo trình nào"
                helper="Chọn giáo trình có sẵn hoặc nhập giáo trình mới"
                onChange={updateSource}
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

          <section className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-4 xl:col-start-1">
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
                  multiple
                  className="sr-only"
                  onChange={handleVideoChange}
                />
                <div>
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-pink-400/80 text-pink-300">
                    <CloudUpload size={23} />
                  </span>
                  <p className="mt-4 text-sm font-bold text-slate-200">
                    {videoFiles.length > 0
                      ? `${videoFiles.length} video đã chọn`
                      : "Kéo & thả nhiều video vào đây"}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {videoFiles.length > 0
                      ? `${formatTotalSize(videoFiles)} - sẵn sàng tải lên Supabase`
                      : "Hỗ trợ MP4/WebM. Có thể chọn nhiều file cùng lúc."}
                  </p>
                  <span
                    className="mt-4 inline-flex h-10 rounded-lg bg-pink-500 px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(236,72,153,0.24)] transition hover:bg-pink-400"
                  >
                    <span className="flex h-full items-center justify-center">
                      {videoFiles.length > 0 ? "Thêm video" : "Chọn video"}
                    </span>
                  </span>
                </div>
              </label>
              <SelectedFileList
                files={videoFiles}
                emptyText="Chưa có video nào"
                icon={Video}
                tone="rose"
                onRemove={(index) =>
                  setVideoFiles((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
              <label className="mt-4 grid gap-2 text-sm font-bold text-slate-200">
                Link YouTube
                <textarea
                  rows={4}
                  value={videoUrlText}
                  onChange={(event) => setVideoUrlText(event.target.value)}
                  placeholder="Dán mỗi link YouTube trên một dòng. Ví dụ: https://youtu.be/..."
                  className="min-h-[112px] resize-none rounded-lg border border-white/10 bg-[#0d1a33] px-4 py-3 text-sm font-semibold leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/15"
                />
                <span className="text-xs font-semibold leading-5 text-slate-500">
                  Có thể dùng thay cho upload video lên Supabase. Web sẽ nhúng video trực tiếp bằng YouTube player.
                </span>
              </label>
              {videoUrls.length > 0 ? (
                <div className="mt-3 grid gap-2 rounded-lg border border-white/10 bg-[#101d38] p-2">
                  {videoUrls.map((url, index) => (
                    <div
                      key={url}
                      className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-white/[0.045] px-3 py-2"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/15 text-rose-300">
                        <Video size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-200">
                          {getUrlLabel(url, `YouTube ${index + 1}`, videoTitlesByUrl)}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {url}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-4 xl:col-start-1">
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
                  multiple
                  className="sr-only"
                  onChange={handlePdfChange}
                />
                <div>
                  <CloudUpload className="mx-auto text-violet-300" size={34} />
                  <p className="mt-3 text-sm font-bold text-slate-200">
                    {pdfFiles.length > 0
                      ? `${pdfFiles.length} PDF đã chọn`
                      : "Kéo & thả nhiều PDF vào đây"}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {pdfFiles.length > 0
                      ? `${formatTotalSize(pdfFiles)} - sẵn sàng tải lên Supabase`
                      : "hoặc chọn nhiều file từ máy tính"}
                  </p>
                  <span
                    className="mt-4 inline-flex h-10 rounded-lg bg-violet-600 px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(124,58,237,0.25)] transition hover:bg-violet-500"
                  >
                    <span className="flex h-full items-center justify-center">
                      {pdfFiles.length > 0 ? "Thêm PDF" : "Chọn PDF"}
                    </span>
                  </span>
                </div>
              </label>
              <SelectedFileList
                files={pdfFiles}
                emptyText="Chưa có PDF nào"
                icon={FileText}
                tone="violet"
                onRemove={(index) =>
                  setPdfFiles((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
            </div>
          </section>

          <section className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-4 xl:col-start-1">
            <StepHeading step="4" title="Audio nghe riêng (MP3)" />
            <div className="mt-4 grid content-start gap-4">
              <label
                className="grid min-h-[180px] cursor-pointer place-items-center rounded-lg border border-dashed border-amber-300/70 bg-amber-500/8 p-4 text-center transition hover:border-amber-200 hover:bg-amber-500/12"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleAudioDrop}
              >
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,.mp3"
                  multiple
                  className="sr-only"
                  onChange={handleAudioChange}
                />
                <div>
                  <CloudUpload className="mx-auto text-amber-200" size={34} />
                  <p className="mt-3 text-sm font-bold text-slate-200">
                    {audioFiles.length > 0
                      ? `${audioFiles.length} MP3 da chon`
                      : "Keo & tha MP3 vao day"}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {audioFiles.length > 0
                      ? `${formatTotalSize(audioFiles)} - san sang tai len Supabase`
                      : "Dùng cho đoạn nghe riêng thay cho audio nằm trong PDF."}
                  </p>
                  <span className="mt-4 inline-flex h-10 rounded-lg bg-amber-500 px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(245,158,11,0.20)] transition hover:bg-amber-400">
                    <span className="flex h-full items-center justify-center">
                      {audioFiles.length > 0 ? "Thêm MP3" : "Chọn MP3"}
                    </span>
                  </span>
                </div>
              </label>
              <SelectedFileList
                files={audioFiles}
                emptyText="Chưa có MP3 nào"
                icon={Volume2}
                tone="amber"
                onRemove={(index) =>
                  setAudioFiles((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
            </div>
          </section>

          <aside className="grid content-start gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-span-4 xl:row-start-1">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/20 text-violet-200">
                <Eye size={17} />
              </span>
              <h3 className="text-base font-black text-white">Xem trước bài học</h3>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#101d38] p-4">
              <Image
                src="/akari-assets/hero-bg.png"
                alt=""
                fill
                className="object-cover opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#101d38]/95 via-[#101d38]/72 to-[#101d38]/30" />
              <div className="relative">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-pink-500/80 px-2 py-1 text-xs font-black text-white">
                    {form.level}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs font-bold text-slate-300">
                    Bài {form.lessonNumber || 1}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Bài {form.lessonNumber || 1} - {form.title.trim() || "Tên bài Kaiwa"}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-300">
                  {form.description.trim() || "Mô tả ngắn của bài học sẽ hiển thị tại đây."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
                  <span className="rounded-lg border border-white/10 bg-white/10 px-2 py-1">
                    {videoUrls.length + videoFiles.length} video
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/10 px-2 py-1">
                    {pdfFiles.length} PDF
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/10 px-2 py-1">
                    {audioFiles.length} MP3
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#101d38] p-3">
              <p className="mb-3 text-sm font-black text-slate-200">Video bài học</p>
              <div className="grid gap-2">
                {(videoFiles.length ? videoFiles : [null]).slice(0, 3).map((file, index) => (
                  <div
                    key={file ? `${file.name}-${file.lastModified}` : "empty-video"}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-white/[0.045] px-3 py-2"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/15 text-rose-300">
                      <Video size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-200">
                        Video {index + 1}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {file ? file.name : "Chưa chọn video"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#101d38] p-3">
              <p className="mb-3 text-sm font-black text-slate-200">Tài liệu PDF</p>
              <div className="grid gap-2">
                {(pdfFiles.length ? pdfFiles : [null]).slice(0, 3).map((file, index) => (
                  <div
                    key={file ? `${file.name}-${file.lastModified}` : "empty-pdf"}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-white/[0.045] px-3 py-2"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/15 text-violet-300">
                      <FileText size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-200">
                        PDF {index + 1}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {file ? file.name : "Chưa chọn PDF"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#101d38] p-3">
              <p className="mb-3 text-sm font-black text-slate-200">Audio nghe riêng</p>
              <div className="grid gap-2">
                {(audioFiles.length ? audioFiles : [null]).slice(0, 3).map((file, index) => (
                  <div
                    key={file ? `${file.name}-${file.lastModified}` : "empty-audio"}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-white/[0.045] px-3 py-2"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/15 text-amber-200">
                      <Volume2 size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-200">
                        MP3 {index + 1}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {file ? file.name : "Chưa chọn MP3"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-[#0a1530] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          {submitError ? (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200">
              {submitError}
            </p>
          ) : isSubmitting ? (
            <p className="rounded-lg border border-pink-300/25 bg-pink-500/10 px-4 py-3 text-sm font-bold text-pink-100">
              Đang upload {uploadSummary}. Không đóng trang cho đến khi hoàn tất.
            </p>
          ) : fileNotice ? (
            <p className="rounded-lg border border-violet-300/25 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-100">
              {fileNotice}
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
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Sparkles size={17} />
            )}
            {isSubmitting ? "Đang upload..." : "Tạo bài học"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(file: File) {
  return `${(file.size / 1024 / 1024).toFixed(1)} MB`;
}

function formatTotalSize(files: File[]) {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  return `${(totalBytes / 1024 / 1024).toFixed(1)} MB`;
}

function SelectedFileList({
  files,
  emptyText,
  icon: Icon,
  tone,
  onRemove,
}: {
  files: File[];
  emptyText: string;
  icon: LucideIcon;
  tone: "rose" | "violet" | "amber";
  onRemove: (index: number) => void;
}) {
  const accentClass =
    tone === "rose"
      ? "bg-rose-500/15 text-rose-300"
      : tone === "amber"
        ? "bg-amber-500/15 text-amber-200"
      : "bg-violet-500/15 text-violet-300";

  if (files.length === 0) {
    return (
      <div className="mt-4 grid min-h-[88px] place-items-center rounded-lg border border-white/10 bg-[#101d38] text-center">
        <Icon className="mx-auto text-slate-500" size={28} />
        <p className="mt-2 text-sm font-semibold text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 max-h-[178px] overflow-y-auto rounded-lg border border-white/10 bg-[#101d38] p-2">
      <div className="grid gap-2">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-white/[0.045] px-3 py-2"
          >
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${accentClass}`}>
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-200">
                {index + 1}. {file.name}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {formatFileSize(file)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
              aria-label={`Xóa ${file.name}`}
            >
              <X size={15} />
            </button>
          </div>
        ))}
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

function KaiwaComboboxField({
  label,
  placeholder,
  required,
  helper,
  value,
  options,
  allowCustom = false,
  emptyText = "Không có lựa chọn",
  onChange,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  helper?: string;
  value: string;
  options: string[];
  allowCustom?: boolean;
  emptyText?: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldOpenUp, setShouldOpenUp] = useState(false);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const uniqueOptions = Array.from(new Set(options.filter(Boolean)));

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (fieldRef.current && !fieldRef.current.contains(event.target as Node)) {
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

  function openMenu() {
    if (fieldRef.current) {
      const rect = fieldRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setShouldOpenUp(spaceBelow < 240 && spaceAbove > spaceBelow);
    }

    setIsOpen(true);
  }

  function toggleMenu() {
    if (!isOpen) {
      openMenu();
      return;
    }

    setIsOpen(false);
  }

  function selectOption(option: string) {
    onChange(option);
    setIsOpen(false);
  }

  return (
    <div
      ref={fieldRef}
      className={`relative grid gap-2 text-sm font-bold text-slate-300 ${
        isOpen ? "z-[90]" : "z-40"
      }`}
    >
      <span>
        {label} {required ? <span className="text-pink-300">*</span> : null}
      </span>
      <div
        className={`grid h-11 grid-cols-[minmax(0,1fr)_auto] items-center overflow-hidden rounded-lg border bg-[#0d1a33] text-sm font-semibold outline-none transition ${
          isOpen
            ? "border-pink-400 ring-4 ring-pink-500/15"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        {allowCustom ? (
          <input
            value={value}
            placeholder={placeholder}
            onFocus={openMenu}
            onChange={(event) => {
              onChange(event.target.value);
              openMenu();
            }}
            className="h-full min-w-0 bg-[#0d1a33] px-4 text-slate-100 outline-none placeholder:text-slate-500 selection:bg-pink-500/35 selection:text-white"
          />
        ) : (
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={toggleMenu}
            className={`min-w-0 truncate px-4 text-left outline-none ${
              value ? "text-slate-100" : "text-slate-500"
            }`}
          >
            {value || placeholder}
          </button>
        )}
        <button
          type="button"
          aria-label={`Mở ${label}`}
          aria-expanded={isOpen}
          onClick={toggleMenu}
          className="grid h-full w-11 place-items-center text-slate-400 transition hover:text-pink-300"
        >
          <ChevronDown
            size={18}
            className={`transition ${isOpen ? "rotate-180 text-pink-300" : ""}`}
          />
        </button>
      </div>

      {isOpen ? (
        <div
          className={`akari-select-menu absolute left-0 z-[100] max-h-64 w-full overflow-x-hidden overflow-y-auto rounded-lg border border-white/10 bg-[#101d38] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.34)] ${
            shouldOpenUp ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
          }`}
        >
          {uniqueOptions.length > 0 ? (
            uniqueOptions.map((option) => {
              const isSelected = option === value;

              return (
                <button
                  key={option}
                  type="button"
                  className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
                    isSelected
                      ? "bg-pink-500/15 text-pink-200"
                      : "text-slate-300 hover:bg-violet-500/15 hover:text-violet-100"
                  }`}
                  onClick={() => selectOption(option)}
                >
                  <span className="min-w-0 truncate">{option}</span>
                  {isSelected ? <Check size={16} className="shrink-0" /> : null}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2.5 text-sm font-bold text-slate-500">
              {emptyText}
            </p>
          )}
        </div>
      ) : null}
      {helper ? (
        <span className="text-xs font-semibold text-slate-500">{helper}</span>
      ) : null}
    </div>
  );
}

function EditKaiwaModal({
  lesson,
  onClose,
  onUpdated,
}: {
  lesson: KaiwaLesson | null;
  onClose: () => void;
  onUpdated: (lesson: KaiwaLesson) => void;
}) {
  const initialVideoUrls = lesson?.videoUrls.length
    ? lesson.videoUrls
    : lesson?.videoUrl
      ? [lesson.videoUrl]
      : [];
  const initialPdfUrls = lesson?.pdfUrls.length
    ? lesson.pdfUrls
    : lesson?.pdfUrl
      ? [lesson.pdfUrl]
      : [];
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);
  const [videoUrlText, setVideoUrlText] = useState(() => initialVideoUrls.join("\n"));
  const [pdfUrlText, setPdfUrlText] = useState(() => initialPdfUrls.join("\n"));
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");
  useBodyScrollLock(Boolean(lesson));

  const videoUrls = parseVideoUrlText(videoUrlText);
  const videoTitlesByUrl = useYouTubeVideoTitles(videoUrls);

  if (!lesson) {
    return null;
  }

  const pdfUrls = parseVideoUrlText(pdfUrlText);
  const audioUrls = lesson.audioUrls.length > 0 ? lesson.audioUrls : lesson.audioUrl ? [lesson.audioUrl] : [];
  const selectedPdf = pdfUrls[selectedPdfIndex] ?? "";
  const heroImage = getLessonImage(lesson);
  const quickNotes = [
    { title: "Từ vựng chính", icon: FileText, items: lesson.notes.vocabulary, tone: "text-violet-200" },
    { title: "Mẫu câu chính", icon: Sparkles, items: lesson.notes.patterns, tone: "text-pink-200" },
    { title: "Ghi nhớ", icon: Save, items: lesson.notes.reminders, tone: "text-amber-200" },
  ];

  function addEditAudioFiles(files: File[]) {
    const acceptedFiles = files.filter(
      (item) => item.type.startsWith("audio/") || item.name.toLowerCase().endsWith(".mp3"),
    );

    if (acceptedFiles.length > 0) {
      setAudioFiles((current) => [...current, ...acceptedFiles]);
      setMediaError("");
      return;
    }

    if (files.length > 0) {
      setMediaError("Vui lòng chọn file MP3/audio hợp lệ.");
    }
  }

  function handleEditAudioChange(event: ChangeEvent<HTMLInputElement>) {
    addEditAudioFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleEditAudioDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    addEditAudioFiles(Array.from(event.dataTransfer.files));
  }

  async function handleSaveEditMedia() {
    if (!lesson) {
      return;
    }

    setMediaError("");

    const oversizedFiles = audioFiles.filter(
      (file) => file.size > KAIWA_MAX_UPLOAD_FILE_BYTES,
    );

    if (oversizedFiles.length > 0) {
      setMediaError(
        `Có ${oversizedFiles.length} file vượt ${KAIWA_MAX_UPLOAD_FILE_MB} MB: ${oversizedFiles
          .map((file) => `${file.name} (${formatFileSize(file)})`)
          .join(", ")}.`,
      );
      return;
    }

    const invalidVideoUrls = videoUrls.filter((url) => !isHttpUrl(url));
    const invalidPdfUrls = pdfUrls.filter((url) => !isHttpUrl(url));

    if (invalidVideoUrls.length > 0 || invalidPdfUrls.length > 0) {
      setMediaError(
        [
          invalidVideoUrls.length ? `Link video không hợp lệ: ${invalidVideoUrls.join(", ")}` : "",
          invalidPdfUrls.length ? `Link PDF không hợp lệ: ${invalidPdfUrls.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(". "),
      );
      return;
    }

    setIsSavingMedia(true);

    try {
      const updatedLesson = await updateKaiwaLessonMedia({
        lesson,
        videoUrls,
        pdfUrls,
        audioUrls,
        audioFiles,
      });
      setAudioFiles([]);
      onUpdated(updatedLesson);
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Không thể cập nhật media Kaiwa.",
      );
    } finally {
      setIsSavingMedia(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#020817]/92 px-3 py-4 text-slate-100 backdrop-blur-md">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-[1680px] grid-rows-[auto_minmax(0,1fr)_auto] rounded-[22px] border border-white/10 bg-[#071225] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-bold text-slate-400">
              Admin <span className="px-2 text-pink-300">›</span> Kaiwa Manager{" "}
              <span className="px-2 text-slate-500">›</span>{" "}
              <span className="text-slate-100">Chỉnh sửa bài</span>
            </p>
            <h2 className="mt-4 text-3xl font-black text-white">
              Chỉnh sửa bài Kaiwa <span className="text-pink-300">✿</span>
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Cập nhật nội dung bài học đã xuất bản.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1.95fr)_minmax(380px,0.95fr)]">
          <div className="grid content-start gap-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
              <EditPanel step="1" title="Thông tin bài học">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DarkField label="Tên bài" required value={lesson.title} />
                  <DarkField label="Mã bài / Thứ tự" required type="number" value={lesson.lessonNumber} />
                  <DarkSelect label="Giáo trình" required value={lesson.source || "Kaiwa"} options={[lesson.source || "Kaiwa", "Đồng Du", "Minna no Nihongo"]} />
                  <DarkSelect label="JLPT Level" required value={lesson.level} options={["N5", "N4", "N3", "N2", "N1"]} />
                  <DarkSelect label="Loại bài" value="Hội thoại đời sống" options={["Hội thoại đời sống", "Luyện nghe", "Shadowing"]} className="sm:col-span-2" />
                </div>
                <label className="mt-3 grid gap-2 text-xs font-bold text-slate-300">
                  Mô tả ngắn
                  <textarea
                    defaultValue={lesson.description}
                    rows={3}
                    maxLength={300}
                    className="min-h-[86px] resize-none rounded-lg border border-white/10 bg-[#0d1a33] px-3 py-3 text-sm font-semibold leading-5 text-slate-100 outline-none placeholder:text-slate-500 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/15"
                  />
                  <span className="justify-self-end text-[11px] text-slate-500">
                    {lesson.description.length}/300
                  </span>
                </label>
              </EditPanel>

              <EditPanel step="2" title="Ảnh hiển thị (Thumbnail)">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
                  <div>
                    <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-white/10 bg-slate-950">
                      <Image src={heroImage} alt="" fill className="object-cover" />
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] text-xs font-black text-slate-200 transition hover:bg-white/10"
                    >
                      <Eye size={15} />
                      Xem ảnh hiện tại
                    </button>
                  </div>
                  <label className="grid min-h-[164px] cursor-pointer place-items-center rounded-lg border border-dashed border-violet-300/50 bg-violet-500/[0.055] px-4 text-center transition hover:bg-violet-500/10">
                    <input type="file" accept="image/png,image/jpeg" className="sr-only" />
                    <span>
                      <ImageIcon className="mx-auto text-violet-300" size={38} />
                      <span className="mt-3 block text-sm font-black text-white">
                        Thay đổi ảnh
                      </span>
                      <span className="mt-2 block text-xs font-semibold leading-5 text-slate-400">
                        Kéo & thả ảnh vào đây hoặc click để chọn file
                      </span>
                      <span className="mt-3 block text-[11px] font-bold text-slate-500">
                        JPG, PNG tối đa 5MB
                      </span>
                    </span>
                  </label>
                </div>
              </EditPanel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <EditPanel step="3" title="Danh sách video bài học">
                <label className="mb-3 grid gap-2 text-sm font-bold text-slate-200">
                  Link video
                  <textarea
                    rows={4}
                    value={videoUrlText}
                    onChange={(event) => setVideoUrlText(event.target.value)}
                    placeholder="Dán mỗi link video trên một dòng"
                    className="min-h-[104px] resize-none rounded-lg border border-white/10 bg-[#0d1a33] px-3 py-2 text-sm font-semibold leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/15"
                  />
                </label>
                <div className="grid gap-2">
                  {(videoUrls.length ? videoUrls : [""]).map((url, index) => (
                    <MediaRow
                      key={url || "empty-video"}
                      index={index}
                      title={getUrlLabel(url, index === 0 ? "Hội thoại chính" : `Video ${index + 1}`, videoTitlesByUrl)}
                      subtitle={url || "Chưa gắn video"}
                      image={heroImage}
                      duration={index === 0 ? lesson.duration : "08:42"}
                      active={selectedVideoIndex === index}
                      onClick={() => setSelectedVideoIndex(index)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setVideoUrlText((current) => `${current.trimEnd()}${current.trim() ? "\n" : ""}`)}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-pink-400/50 bg-pink-500/10 text-sm font-black text-pink-200 transition hover:bg-pink-500/15"
                >
                  <Plus size={17} />
                  Thêm video
                </button>
              </EditPanel>

              <EditPanel step="4" title="Danh sách tài liệu PDF">
                <label className="mb-3 grid gap-2 text-sm font-bold text-slate-200">
                  Link PDF
                  <textarea
                    rows={4}
                    value={pdfUrlText}
                    onChange={(event) => setPdfUrlText(event.target.value)}
                    placeholder="Dán mỗi link PDF trên một dòng"
                    className="min-h-[104px] resize-none rounded-lg border border-white/10 bg-[#0d1a33] px-3 py-2 text-sm font-semibold leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15"
                  />
                </label>
                <div className="grid gap-2">
                  {(pdfUrls.length ? pdfUrls : [""]).map((url, index) => (
                    <PdfRow
                      key={url || "empty-pdf"}
                      index={index}
                      title={index === 0 ? "PDF 1 - Hội thoại" : `PDF ${index + 1} - Tài liệu`}
                      subtitle={url || "Chưa gắn PDF"}
                      active={selectedPdfIndex === index}
                      onClick={() => setSelectedPdfIndex(index)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPdfUrlText((current) => `${current.trimEnd()}${current.trim() ? "\n" : ""}`)}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-pink-400/50 bg-pink-500/10 text-sm font-black text-pink-200 transition hover:bg-pink-500/15"
                >
                  <Plus size={17} />
                  Thêm PDF
                </button>
              </EditPanel>

              <EditPanel step="5" title="Audio nghe riêng (MP3)">
                <div className="grid gap-2">
                  {(audioUrls.length ? audioUrls : [""]).map((url, index) => (
                    <AudioRow
                      key={url || "empty-audio"}
                      index={index}
                      title={index === 0 ? "MP3 1 - Audio nghe" : `MP3 ${index + 1}`}
                      subtitle={url || "Chưa gắn MP3"}
                    />
                  ))}
                </div>
                <label
                  className="mt-3 grid min-h-[112px] cursor-pointer place-items-center rounded-lg border border-dashed border-amber-300/50 bg-amber-500/[0.055] px-4 text-center transition hover:bg-amber-500/10"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleEditAudioDrop}
                >
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,.mp3"
                    multiple
                    className="sr-only"
                    onChange={handleEditAudioChange}
                  />
                  <span>
                    <Volume2 className="mx-auto text-amber-200" size={30} />
                    <span className="mt-2 block text-sm font-black text-white">
                      {audioFiles.length > 0 ? `${audioFiles.length} MP3 mới` : "Thêm MP3"}
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-400">
                      {audioFiles.length > 0 ? formatTotalSize(audioFiles) : "Kéo thả hoặc click để chọn file MP3"}
                    </span>
                  </span>
                </label>
                <SelectedFileList
                  files={audioFiles}
                  emptyText="Chưa chọn MP3 mới"
                  icon={Volume2}
                  tone="amber"
                  onRemove={(index) =>
                    setAudioFiles((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                />
                {mediaError ? (
                  <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100">
                    {mediaError}
                  </p>
                ) : null}
              </EditPanel>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.75fr)]">
              <EditPanel step="6" title="Ghi chú nhanh hiển thị dưới bài học">
                <div className="grid gap-3 md:grid-cols-3">
                  {quickNotes.map((group) => (
                    <SupportList
                      key={group.title}
                      title={group.title}
                      items={group.items}
                      icon={group.icon}
                      tone={group.tone}
                    />
                  ))}
                </div>
              </EditPanel>

              <EditPanel step="7" title="Trạng thái xuất bản">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Draft", help: "Lưu nháp" },
                    { label: "Published", help: "Đã xuất bản", active: true },
                    { label: "Archived", help: "Lưu trữ" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`rounded-lg border px-3 py-3 text-left transition ${
                        item.active
                          ? "border-pink-400/60 bg-pink-500/20 text-white"
                          : "border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-black">
                        <span className={`h-4 w-4 rounded-full border ${item.active ? "border-pink-300 bg-pink-400" : "border-slate-500"}`} />
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                        ({item.help})
                      </span>
                    </button>
                  ))}
                </div>
                <DarkField className="mt-3" label="Thứ tự hiển thị (Sort Order)" required type="number" value={lesson.lessonNumber} />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Số nhỏ hơn sẽ hiển thị trước.
                </p>
              </EditPanel>
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <section className="rounded-lg border border-white/10 bg-[#0b1831] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">
                  Xem trước bài học <span className="font-semibold text-slate-400">(Giao diện học viên)</span>
                </p>
                <Eye size={16} className="text-slate-400" />
              </div>
              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950 p-4">
                <Image src={heroImage} alt="" fill className="object-cover opacity-55" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111a34]/95 via-[#111a34]/60 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">
                      Bài {lesson.lessonNumber} - {lesson.title}
                    </h3>
                    <span className="rounded-md bg-pink-500 px-2 py-1 text-xs font-black text-white">
                      {lesson.level}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    {lesson.source || "Kaiwa"} • {lesson.category}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-300">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1">
                      <Clock size={12} />
                      {lesson.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1">
                      <Video size={12} />
                      {videoUrls.length} video
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1">
                      <FileText size={12} />
                      {pdfUrls.length} PDF
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1">
                      <Volume2 size={12} />
                      {audioUrls.length + audioFiles.length} MP3
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-white/10 bg-[#081226] p-2">
                <div className="mb-2 flex gap-2 overflow-x-auto">
                  {["Hội thoại chính", "Giải thích từ vựng", "Luyện shadowing", "Bài luyện nghe"].map((tab, index) => (
                    <button
                      key={tab}
                      type="button"
                      className={`h-9 shrink-0 rounded-lg px-3 text-xs font-black ${
                        index === 0 ? "bg-pink-500 text-white" : "bg-white/[0.045] text-slate-400"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-950">
                  <Image src={heroImage} alt="" fill className="object-cover opacity-70" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                    <div className="h-1 rounded-full bg-white/20">
                      <div className="h-full w-1/4 rounded-full bg-pink-500" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-white">
                      <span className="inline-flex items-center gap-2">
                        <Play size={16} fill="currentColor" />
                        0:45 / {lesson.duration}
                      </span>
                      <span>CC  ⚙</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {videoUrls.slice(0, 4).map((url, index) => (
                    <button
                      key={`preview-video-${url}`}
                      type="button"
                      onClick={() => setSelectedVideoIndex(index)}
                      className={`grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2 py-2 text-left ${
                        selectedVideoIndex === index ? "bg-pink-500/20 text-pink-100" : "bg-white/[0.035] text-slate-300"
                      }`}
                    >
                      <GripVertical size={14} className="text-slate-500" />
                      <Image src={heroImage} alt="" width={48} height={30} className="h-[30px] w-12 rounded object-cover" />
                      <span className="truncate text-xs font-bold">
                        {index + 1}. {getUrlLabel(url, `Video ${index + 1}`, videoTitlesByUrl)}
                      </span>
                      <span className="text-[11px] text-slate-400">{index === 0 ? lesson.duration : "08:42"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-3 rounded-lg border border-white/10 bg-[#0b1831] p-3">
              <div className="grid gap-3 md:grid-cols-[0.7fr_1fr] xl:grid-cols-[0.8fr_1fr]">
                <div>
                  <p className="mb-2 text-sm font-black text-white">Tài liệu PDF</p>
                  <div className="grid gap-2">
                    {pdfUrls.map((url, index) => (
                      <button
                        key={`preview-pdf-${url}`}
                        type="button"
                        onClick={() => setSelectedPdfIndex(index)}
                        className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg border px-2 py-2 text-left ${
                          selectedPdfIndex === index
                            ? "border-violet-300/50 bg-violet-500/20"
                            : "border-white/10 bg-white/[0.035]"
                        }`}
                      >
                        <FileText size={17} className="text-rose-300" />
                        <span className="truncate text-xs font-bold text-slate-200">
                          PDF {index + 1} - {getUrlLabel(url, "Tài liệu")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700">
                    <FileText size={16} className="text-rose-500" />
                    {selectedPdf ? getUrlLabel(selectedPdf, "PDF bài học") : "Chưa có PDF"}
                  </div>
                  <div className="grid aspect-[4/3] place-items-center rounded border border-slate-200 bg-slate-50 text-center text-slate-500">
                    <div>
                      <p className="text-lg font-black text-slate-700">
                        第{lesson.lessonNumber}課
                      </p>
                      <p className="mt-1 text-sm font-bold">{lesson.title}</p>
                      <div className="mt-4 h-16 w-44 rounded border border-slate-200 bg-white" />
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <a href={selectedPdf || undefined} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-slate-100 text-[11px] font-black text-slate-600">
                      <Link2 size={13} />
                      Xem
                    </a>
                    <a href={selectedPdf || undefined} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-slate-100 text-[11px] font-black text-slate-600">
                      <ExternalLink size={13} />
                      Mở
                    </a>
                    <a href={selectedPdf || undefined} download className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-pink-500 text-[11px] font-black text-white">
                      <Download size={13} />
                      Tải
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 rounded-lg border border-white/10 bg-[#0b1831] p-3">
              <p className="text-sm font-black text-white">Audio nghe riêng</p>
              <div className="grid gap-2">
                {[...audioUrls, ...audioFiles.map((file) => file.name)].slice(0, 5).map((item, index) => (
                  <div
                    key={`preview-audio-${item}-${index}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2 py-2"
                  >
                    <Volume2 size={17} className="text-amber-200" />
                    <span className="truncate text-xs font-bold text-slate-200">
                      MP3 {index + 1} - {getUrlLabel(item, "Audio nghe")}
                    </span>
                  </div>
                ))}
                {audioUrls.length === 0 && audioFiles.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-xs font-bold text-slate-500">
                    Chưa có MP3 riêng cho bài này.
                  </p>
                ) : null}
              </div>
            </section>

            <div className="grid gap-3 md:grid-cols-3">
              {quickNotes.map((group) => (
                <SupportList
                  key={`preview-${group.title}`}
                  title={group.title}
                  items={group.items}
                  icon={group.icon}
                  tone={group.tone}
                  compact
                />
              ))}
            </div>
          </aside>
        </div>

        <div className="grid gap-3 border-t border-white/10 bg-[#071122] px-4 py-3 sm:grid-cols-[minmax(120px,0.6fr)_minmax(140px,0.75fr)_minmax(160px,0.95fr)_minmax(140px,0.75fr)] sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-white/10 bg-white/[0.045] text-sm font-black text-slate-300 transition hover:bg-white/10"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/20 text-sm font-black text-violet-100 transition hover:bg-violet-500/25"
          >
            <Save size={16} />
            Lưu nháp
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-pink-500 text-sm font-black text-white shadow-[0_16px_32px_rgba(236,72,153,0.26)] transition hover:bg-pink-400"
            onClick={handleSaveEditMedia}
            disabled={isSavingMedia}
          >
            {isSavingMedia ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
            {isSavingMedia ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <Link
            href={`/kaiwa/${lesson.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-black text-white transition hover:bg-violet-500"
          >
            <Eye size={16} />
            Xem trước
          </Link>
        </div>
      </div>
    </div>
  );
}

function EditPanel({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1831] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-pink-500/70 text-sm font-black text-white">
          {step}
        </span>
        <h3 className="text-base font-black text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DarkField({
  label,
  value,
  required,
  type = "text",
  className = "",
}: {
  label: string;
  value: string | number;
  required?: boolean;
  type?: "text" | "number";
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-xs font-bold text-slate-300 ${className}`}>
      <span>
        {label} {required ? <span className="text-pink-300">*</span> : null}
      </span>
      <input
        type={type}
        defaultValue={value}
        min={type === "number" ? 1 : undefined}
        className="h-11 rounded-lg border border-white/10 bg-[#0d1a33] px-3 text-sm font-semibold text-slate-100 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-500/15"
      />
    </label>
  );
}

function DarkSelect({
  label,
  value,
  options,
  required,
  className = "",
}: {
  label: string;
  value: string;
  options: string[];
  required?: boolean;
  className?: string;
}) {
  const uniqueOptions = Array.from(new Set(options.filter(Boolean)));

  return (
    <label className={`grid gap-2 text-xs font-bold text-slate-300 ${className}`}>
      <span>
        {label} {required ? <span className="text-pink-300">*</span> : null}
      </span>
      <select
        defaultValue={value}
        className="h-11 rounded-lg border border-white/10 bg-[#0d1a33] px-3 text-sm font-semibold text-slate-100 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-500/15"
      >
        {uniqueOptions.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function MediaRow({
  index,
  title,
  subtitle,
  image,
  duration,
  active,
  onClick,
}: {
  index: number;
  title: string;
  subtitle: string;
  image: string;
  duration: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto_auto] items-center gap-2 rounded-lg border px-2 py-2 text-left transition ${
        active
          ? "border-pink-400/50 bg-pink-500/15"
          : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
      }`}
    >
      <GripVertical size={15} className="text-slate-500" />
      <div className="relative h-12 w-[76px] overflow-hidden rounded-md bg-slate-900">
        <Image src={image} alt="" fill className="object-cover" />
        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] font-black text-white">
          {duration}
        </span>
      </div>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-slate-100">
          {index + 1}. {title}
        </span>
        <span className="block truncate text-xs font-semibold text-slate-500">
          {subtitle}
        </span>
      </span>
      <span className="text-xs font-bold text-slate-400">Hiển thị</span>
      <span className="relative h-5 w-9 rounded-full bg-violet-500">
        <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
      </span>
      <span className="flex gap-1">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.055] text-slate-300">
          <ExternalLink size={14} />
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-300">
          <Trash2 size={14} />
        </span>
      </span>
    </button>
  );
}

function PdfRow({
  index,
  title,
  subtitle,
  active,
  onClick,
}: {
  index: number;
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
        active
          ? "border-violet-300/50 bg-violet-500/15"
          : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
      }`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-rose-400/35 bg-rose-500/10 text-rose-300">
        <FileText size={19} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-slate-100">
          {title}
        </span>
        <span className="block truncate text-xs font-semibold text-slate-500">
          {index === 0 ? "1.28 MB" : "1.65 MB"} • {subtitle}
        </span>
      </span>
      <span className="text-xs font-bold text-slate-400">Hiển thị</span>
      <span className="relative h-5 w-9 rounded-full bg-violet-500">
        <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
      </span>
      <span className="flex gap-1">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.055] text-slate-300">
          <Download size={14} />
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-300">
          <Trash2 size={14} />
        </span>
      </span>
    </button>
  );
}

function AudioRow({
  index,
  title,
  subtitle,
}: {
  index: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-left">
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-amber-300/35 bg-amber-500/10 text-amber-200">
        <Volume2 size={19} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-slate-100">
          {title}
        </span>
        <span className="block truncate text-xs font-semibold text-slate-500">
          {index + 1}. {subtitle}
        </span>
      </span>
      <span className="text-xs font-bold text-slate-400">Hiển thị</span>
      <span className="relative h-5 w-9 rounded-full bg-violet-500">
        <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
      </span>
    </div>
  );
}

function SupportList({
  title,
  items,
  icon: Icon,
  tone,
  compact,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
  tone: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className={`inline-flex items-center gap-2 text-sm font-black ${tone}`}>
          <Icon size={16} />
          {title}
        </h3>
        <button type="button" className="rounded-md bg-violet-500/15 px-2 py-1 text-xs font-black text-violet-200">
          + Thêm
        </button>
      </div>
      <ul className="space-y-1.5 text-xs font-semibold leading-5 text-slate-300">
        {(items.length ? items : ["Chưa có ghi chú"]).slice(0, compact ? 3 : 4).map((item) => (
          <li key={item} className="truncate">• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function getUrlLabel(
  url: string,
  fallback: string,
  titlesByUrl: Record<string, string> = {},
) {
  const youTubeTitle = titlesByUrl[url];

  if (youTubeTitle) {
    return youTubeTitle;
  }

  const youTubeId = getYouTubeVideoId(url);

  if (youTubeId) {
    return `YouTube ${youTubeId}`;
  }

  return getDisplayFileNameFromUrl(url, fallback);
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
