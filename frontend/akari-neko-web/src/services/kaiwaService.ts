import { supabase } from "@/lib/supabaseClient";
import type { KaiwaHtmlDocument, KaiwaLesson, KaiwaLevel } from "@/data/kaiwaData";
import { getCurrentProfile } from "@/services/authService";
import { requireAdminContentAccess } from "@/services/studentAccessService";

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
  audio_url: string | null;
  video_urls: unknown;
  pdf_urls: unknown;
  audio_urls: unknown;
  html_documents: unknown;
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
  videoUrls?: string[];
  videoFiles?: File[];
  pdfFiles?: File[];
  audioFiles?: File[];
  htmlDocuments?: {
    file: File;
    title: string;
    description: string;
  }[];
};

export type UpdateKaiwaLessonMediaPayload = {
  lesson: KaiwaLesson;
  videoUrls?: string[];
  pdfUrls?: string[];
  audioUrls?: string[];
  audioFiles?: File[];
  htmlDocuments?: KaiwaHtmlDocument[];
  htmlFiles?: {
    file: File;
    title: string;
    description: string;
  }[];
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
  "audio_url",
  "video_urls",
  "pdf_urls",
  "audio_urls",
  "html_documents",
  "notes",
  "is_locked",
  "is_published",
  "sort_order",
  "created_at",
  "updated_at",
].join(",");

function normalizeKaiwaLevel(level: string | null | undefined): KaiwaLevel | null {
  const normalizedLevel = level?.trim().toUpperCase();

  return ["N5", "N4", "N3", "N2", "N1"].includes(normalizedLevel ?? "")
    ? (normalizedLevel as KaiwaLevel)
    : null;
}

async function getKaiwaAccessScope() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      canAccess: false,
      lockedLevel: null,
    };
  }

  if (profile.role === "admin") {
    return {
      canAccess: true,
      lockedLevel: null,
    };
  }

  return {
    canAccess: profile.canAccessKaiwa,
    lockedLevel: normalizeKaiwaLevel(profile.currentJlptLevel) ?? "N5",
  };
}

function toFriendlyError(error: unknown, fallbackMessage: string) {
  const rawMessage =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message.trim()
      : error instanceof Error
        ? error.message.trim()
        : "";

  if (/maximum|too large|entity too large|file size|exceeded/i.test(rawMessage)) {
    return new Error(
      "File vượt giới hạn dung lượng của Supabase Storage. Hãy tăng Global file size limit/bucket limit trong Supabase hoặc nén file trước khi upload.",
    );
  }

  if (/mime type .*not supported|unsupported mime|mime.*not supported/i.test(rawMessage)) {
    return new Error(
      "Supabase Storage bucket kaiwa chưa cho phép file HTML. Hãy chạy scripts/add-kaiwa-html-documents.sql để thêm MIME text/html vào bucket.",
    );
  }

  if (
    rawMessage
  ) {
    return new Error(rawMessage);
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

function normalizeUrlList(value: unknown, fallbackUrl: string | null) {
  const urls = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (urls.length > 0) {
    return urls;
  }

  return fallbackUrl ? [fallbackUrl] : [];
}

function normalizeHtmlDocuments(value: unknown): KaiwaHtmlDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const document = item as Partial<Record<keyof KaiwaHtmlDocument, unknown>>;
      const url = typeof document.url === "string" ? document.url.trim() : "";

      if (!url) {
        return null;
      }

      const fileName =
        typeof document.fileName === "string" && document.fileName.trim()
          ? document.fileName.trim()
          : "document.html";

      return {
        id:
          typeof document.id === "string" && document.id.trim()
            ? document.id.trim()
            : crypto.randomUUID(),
        title:
          typeof document.title === "string" && document.title.trim()
            ? document.title.trim()
            : fileName,
        description:
          typeof document.description === "string" ? document.description.trim() : "",
        url,
        fileName,
      };
    })
    .filter((item): item is KaiwaHtmlDocument => Boolean(item));
}

function mapKaiwaLessonRow(row: KaiwaLessonRow): KaiwaLesson {
  const videoUrls = normalizeUrlList(row.video_urls, row.video_url);
  const pdfUrls = normalizeUrlList(row.pdf_urls, row.pdf_url);
  const audioUrls = normalizeUrlList(row.audio_urls, row.audio_url);

  return {
    id: row.slug,
    level: row.jlpt_level,
    lessonNumber: row.lesson_number,
    title: row.title,
    source: row.source ?? "",
    description: row.description ?? "",
    duration: formatDuration(row.duration_seconds),
    category: row.category ?? "Hội thoại",
    locked: row.is_locked ?? false,
    videoUrl: videoUrls[0] ?? "",
    pdfUrl: pdfUrls[0] ?? "",
    audioUrl: audioUrls[0] ?? "",
    videoUrls,
    pdfUrls,
    audioUrls,
    htmlDocuments: normalizeHtmlDocuments(row.html_documents),
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

function getSafeFileName(file: File, fallbackExtension: string) {
  const extension = getFileExtension(file, fallbackExtension);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const safeBaseName = slugify(baseName) || "tep-kaiwa";

  return `${safeBaseName}-${crypto.randomUUID()}${extension}`;
}

function getDeclaredHtmlCharset(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer.slice(0, 4096));
  const asciiText = Array.from(bytes, (byte) =>
    byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : " ",
  ).join("");
  const charsetMatch =
    asciiText.match(/<meta[^>]+charset=["']?\s*([a-z0-9._-]+)/i) ??
    asciiText.match(/content=["'][^"']*charset=([a-z0-9._-]+)/i);

  return charsetMatch?.[1]?.trim().toLowerCase() || "utf-8";
}

function decodeHtmlBuffer(buffer: ArrayBuffer) {
  const declaredCharset = getDeclaredHtmlCharset(buffer);

  try {
    return new TextDecoder(declaredCharset).decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

function ensureUtf8HtmlMeta(htmlText: string) {
  const normalizedText = htmlText.replace(/^\uFEFF/, "");

  if (/<meta[^>]+charset=["']?\s*utf-?8\s*["']?[^>]*>/i.test(normalizedText)) {
    return normalizedText;
  }

  const withNormalizedCharset = normalizedText
    .replace(
      /<meta([^>]+)charset=["']?\s*[a-z0-9._-]+\s*["']?([^>]*)>/i,
      '<meta$1charset="utf-8"$2>',
    )
    .replace(
      /<meta([^>]+http-equiv=["']content-type["'][^>]*)content=["'][^"']*["']([^>]*)>/i,
      '<meta$1content="text/html; charset=utf-8"$2>',
    );

  if (/<meta[^>]+charset=["']?\s*utf-?8\s*["']?[^>]*>/i.test(withNormalizedCharset)) {
    return withNormalizedCharset;
  }

  if (/<head[^>]*>/i.test(withNormalizedCharset)) {
    return withNormalizedCharset.replace(
      /<head([^>]*)>/i,
      '<head$1><meta charset="utf-8">',
    );
  }

  if (/<html[^>]*>/i.test(withNormalizedCharset)) {
    return withNormalizedCharset.replace(
      /<html([^>]*)>/i,
      '<html$1><head><meta charset="utf-8"></head>',
    );
  }

  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${withNormalizedCharset}</body></html>`;
}

async function normalizeHtmlFileForUpload(file: File) {
  const buffer = await file.arrayBuffer();
  const htmlText = decodeHtmlBuffer(buffer);
  const normalizedHtmlText = ensureUtf8HtmlMeta(htmlText);

  return new File([normalizedHtmlText], file.name, {
    type: "text/html",
    lastModified: file.lastModified,
  });
}

async function uploadKaiwaFile(
  file: File | null | undefined,
  folder: string,
  fallbackExtension: string,
) {
  if (!file) {
    return "";
  }

  const filePath = `${folder}/${getSafeFileName(file, fallbackExtension)}`;
  const { error } = await supabase.storage
    .from(KAIWA_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw toFriendlyError(error, "Không thể tải tệp Kaiwa lên Supabase Storage.");
  }

  const { data } = supabase.storage.from(KAIWA_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function uploadKaiwaFiles(
  files: File[] | null | undefined,
  folder: string,
  fallbackExtension: string,
) {
  if (!files?.length) {
    return [];
  }

  return Promise.all(
    files.map((file) => uploadKaiwaFile(file, folder, fallbackExtension)),
  );
}

export async function getKaiwaLessons(): Promise<KaiwaLesson[]> {
  const accessScope = await getKaiwaAccessScope();

  if (!accessScope.canAccess) {
    return [];
  }

  let query = supabase
    .from("kaiwa_lessons")
    .select(kaiwaColumns)
    .order("sort_order", { ascending: true })
    .order("lesson_number", { ascending: true });

  if (accessScope.lockedLevel) {
    query = query.eq("jlpt_level", accessScope.lockedLevel);
  }

  const { data, error } = await query;

  if (error) {
    throw toFriendlyError(error, "Không thể tải danh sách Kaiwa từ Supabase.");
  }

  return ((data ?? []) as unknown as KaiwaLessonRow[]).map(mapKaiwaLessonRow);
}

export async function getKaiwaLessonById(id: string): Promise<KaiwaLesson | null> {
  const accessScope = await getKaiwaAccessScope();

  if (!accessScope.canAccess) {
    return null;
  }

  const { data, error } = await supabase
    .from("kaiwa_lessons")
    .select(kaiwaColumns)
    .eq("slug", id)
    .maybeSingle();

  if (error) {
    throw toFriendlyError(error, "Không thể tải chi tiết Kaiwa từ Supabase.");
  }

  const lesson = data ? mapKaiwaLessonRow(data as unknown as KaiwaLessonRow) : null;

  if (lesson && accessScope.lockedLevel && lesson.level !== accessScope.lockedLevel) {
    return null;
  }

  return lesson;
}

async function uploadKaiwaHtmlDocuments(
  documents: CreateKaiwaLessonPayload["htmlDocuments"],
  folder: string,
) {
  if (!documents?.length) {
    return [];
  }

  return Promise.all(
    documents.map(async (document) => {
      const htmlFile = await normalizeHtmlFileForUpload(document.file);
      const url = await uploadKaiwaFile(htmlFile, folder, ".html");

      return {
        id: crypto.randomUUID(),
        title: document.title.trim() || document.file.name,
        description: document.description.trim(),
        url,
        fileName: document.file.name,
      };
    }),
  );
}

export async function createKaiwaLesson(
  payload: CreateKaiwaLessonPayload,
): Promise<KaiwaLesson> {
  await requireAdminContentAccess();

  const baseFolder = [
    slugify(payload.source),
    payload.level.toLowerCase(),
    `bai-${payload.lessonNumber}`,
    slugify(payload.title),
  ]
    .filter(Boolean)
    .join("/");

  const [uploadedVideoUrls, pdfUrls, audioUrls, htmlDocuments] = await Promise.all([
    uploadKaiwaFiles(payload.videoFiles, `${baseFolder}/video`, ".mp4"),
    uploadKaiwaFiles(payload.pdfFiles, `${baseFolder}/pdf`, ".pdf"),
    uploadKaiwaFiles(payload.audioFiles, `${baseFolder}/audio`, ".mp3"),
    uploadKaiwaHtmlDocuments(payload.htmlDocuments, `${baseFolder}/html`),
  ]);
  const videoUrls = [
    ...(payload.videoUrls ?? []).filter((url) => url.trim().length > 0),
    ...uploadedVideoUrls,
  ];

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
      video_url: videoUrls[0] ?? "",
      pdf_url: pdfUrls[0] ?? "",
      audio_url: audioUrls[0] ?? "",
      video_urls: videoUrls,
      pdf_urls: pdfUrls,
      audio_urls: audioUrls,
      html_documents: htmlDocuments,
      notes: { vocabulary: [], patterns: [], reminders: [] },
    })
    .select(kaiwaColumns)
    .single();

  if (error) {
    throw toFriendlyError(error, "Không thể thêm bài Kaiwa vào Supabase.");
  }

  return mapKaiwaLessonRow(data as unknown as KaiwaLessonRow);
}

export async function updateKaiwaLessonMedia(
  payload: UpdateKaiwaLessonMediaPayload,
): Promise<KaiwaLesson> {
  await requireAdminContentAccess();

  const baseFolder = [
    slugify(payload.lesson.source),
    payload.lesson.level.toLowerCase(),
    `bai-${payload.lesson.lessonNumber}`,
    slugify(payload.lesson.title),
  ]
    .filter(Boolean)
    .join("/");

  const [uploadedAudioUrls, uploadedHtmlDocuments] = await Promise.all([
    uploadKaiwaFiles(payload.audioFiles, `${baseFolder}/audio`, ".mp3"),
    uploadKaiwaHtmlDocuments(payload.htmlFiles, `${baseFolder}/html`),
  ]);
  const audioUrls = [
    ...(payload.audioUrls ?? []).filter((url) => url.trim().length > 0),
    ...uploadedAudioUrls,
  ];
  const videoUrls = (payload.videoUrls ?? []).filter((url) => url.trim().length > 0);
  const pdfUrls = (payload.pdfUrls ?? []).filter((url) => url.trim().length > 0);
  const htmlDocuments = [
    ...(payload.htmlDocuments ?? []).filter((document) => document.url.trim().length > 0),
    ...uploadedHtmlDocuments,
  ];

  const { data, error } = await supabase
    .from("kaiwa_lessons")
    .update({
      video_url: videoUrls[0] ?? "",
      pdf_url: pdfUrls[0] ?? "",
      audio_url: audioUrls[0] ?? "",
      video_urls: videoUrls,
      pdf_urls: pdfUrls,
      audio_urls: audioUrls,
      html_documents: htmlDocuments,
    })
    .eq("slug", payload.lesson.id)
    .select(kaiwaColumns)
    .single();

  if (error) {
    throw toFriendlyError(error, "Không thể cập nhật media Kaiwa trong Supabase.");
  }

  return mapKaiwaLessonRow(data as unknown as KaiwaLessonRow);
}
