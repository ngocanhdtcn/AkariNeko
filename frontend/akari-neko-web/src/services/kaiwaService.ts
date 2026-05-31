import { supabase } from "@/lib/supabaseClient";
import type { KaiwaLesson, KaiwaLevel } from "@/data/kaiwaData";

const KAIWA_BUCKET = "kaiwa";

type KaiwaLessonRow = {
  id: string;
  slug: string;
  jlpt_level: KaiwaLevel;
  lesson_number: number;
  title: string;
  source: string | null;
  description: string | null;
  duration_seconds: number | null;
  category: string | null;
  video_url: string | null;
  pdf_url: string | null;
  notes: unknown;
  is_locked: boolean | null;
  is_published: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateKaiwaLessonPayload = {
  level: KaiwaLevel;
  lessonNumber: number;
  title: string;
  source: string;
  description: string;
  category: string;
  videoFile?: File | null;
  pdfFile?: File | null;
};

const kaiwaColumns = [
  "id",
  "slug",
  "jlpt_level",
  "lesson_number",
  "title",
  "source",
  "description",
  "category",
  "duration_seconds",
  "video_url",
  "pdf_url",
  "notes",
  "is_locked",
  "is_published",
  "sort_order",
  "created_at",
  "updated_at",
].join(",");

function toFriendlyError(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return new Error(error.message);
  }

  if (error instanceof Error && error.message.trim()) {
    return error;
  }

  return new Error(fallbackMessage);
}

function normalizeNotes(value: unknown): KaiwaLesson["notes"] {
  if (typeof value !== "object" || value === null) {
    return { vocabulary: [], patterns: [], reminders: [] };
  }

  const notes = value as Partial<Record<keyof KaiwaLesson["notes"], unknown>>;

  return {
    vocabulary: Array.isArray(notes.vocabulary) ? notes.vocabulary.map(String) : [],
    patterns: Array.isArray(notes.patterns) ? notes.patterns.map(String) : [],
    reminders: Array.isArray(notes.reminders) ? notes.reminders.map(String) : [],
  };
}

function mapKaiwaLessonRow(row: KaiwaLessonRow): KaiwaLesson {
  return {
    id: row.slug,
    level: row.jlpt_level,
    lessonNumber: row.lesson_number,
    title: row.title,
    source: row.source ?? "",
    description: row.description ?? "",
    duration: formatDuration(row.duration_seconds),
    category: row.category ?? "Hội thoại",
    progress: 0,
    completed: false,
    locked: row.is_locked ?? false,
    videoUrl: row.video_url ?? "",
    pdfUrl: row.pdf_url ?? "",
    notes: normalizeNotes(row.notes),
  };
}

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return "--:--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getFileExtension(file: File, fallback: string) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? `.${extension}` : fallback;
}

async function uploadKaiwaFile(
  file: File | null | undefined,
  folder: string,
  fallbackExtension: string,
) {
  if (!file) {
    return "";
  }

  const filePath = `${folder}/${crypto.randomUUID()}${getFileExtension(
    file,
    fallbackExtension,
  )}`;
  const { error } = await supabase.storage
    .from(KAIWA_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw toFriendlyError(error, "Khong the tai tep Kaiwa len Supabase Storage.");
  }

  const { data } = supabase.storage.from(KAIWA_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getKaiwaLessons(): Promise<KaiwaLesson[]> {
  const { data, error } = await supabase
    .from("kaiwa_lessons")
    .select(kaiwaColumns)
    .order("sort_order", { ascending: true })
    .order("lesson_number", { ascending: true });

  if (error) {
    throw toFriendlyError(error, "Khong the tai danh sach Kaiwa tu Supabase.");
  }

  return ((data ?? []) as unknown as KaiwaLessonRow[]).map(mapKaiwaLessonRow);
}

export async function getKaiwaLessonById(id: string): Promise<KaiwaLesson | null> {
  const { data, error } = await supabase
    .from("kaiwa_lessons")
    .select(kaiwaColumns)
    .eq("slug", id)
    .maybeSingle();

  if (error) {
    throw toFriendlyError(error, "Khong the tai chi tiet Kaiwa tu Supabase.");
  }

  return data ? mapKaiwaLessonRow(data as unknown as KaiwaLessonRow) : null;
}

export async function createKaiwaLesson(
  payload: CreateKaiwaLessonPayload,
): Promise<KaiwaLesson> {
  const baseFolder = [
    slugify(payload.source),
    payload.level.toLowerCase(),
    `bai-${payload.lessonNumber}`,
    slugify(payload.title),
  ]
    .filter(Boolean)
    .join("/");

  const [videoUrl, pdfUrl] = await Promise.all([
    uploadKaiwaFile(payload.videoFile, `${baseFolder}/video`, ".mp4"),
    uploadKaiwaFile(payload.pdfFile, `${baseFolder}/pdf`, ".pdf"),
  ]);

  const slug = `${payload.level.toLowerCase()}-bai-${payload.lessonNumber}-${slugify(
    payload.title,
  )}`;

  const { data, error } = await supabase
    .from("kaiwa_lessons")
    .insert({
      slug,
      jlpt_level: payload.level,
      lesson_number: payload.lessonNumber,
      title: payload.title,
      source: payload.source,
      description: payload.description,
      category: payload.category,
      duration_seconds: null,
      is_locked: false,
      is_published: true,
      sort_order: payload.lessonNumber,
      video_url: videoUrl,
      pdf_url: pdfUrl,
      notes: { vocabulary: [], patterns: [], reminders: [] },
    })
    .select(kaiwaColumns)
    .single();

  if (error) {
    throw toFriendlyError(error, "Khong the them bai Kaiwa vao Supabase.");
  }

  return mapKaiwaLessonRow(data as unknown as KaiwaLessonRow);
}
