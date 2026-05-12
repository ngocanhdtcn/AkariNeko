import { supabase } from "@/lib/supabaseClient";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type GrammarExample = {
  jp: string;
  reading?: string;
  vi?: string;
};

export type GrammarPoint = {
  id: string;
  jlptLevel: JlptLevel;
  title: string;
  structure: string | null;
  meaning: string;
  explanation: string | null;
  examples: GrammarExample[];
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isBookmarked: boolean;
};

export type GrammarFilters = {
  search?: string;
  jlptLevel?: JlptLevel;
  bookmarkedOnly?: boolean;
};

export type GrammarMutation = {
  jlptLevel: JlptLevel;
  title: string;
  structure: string;
  meaning: string;
  explanation: string;
  examples: GrammarExample[];
  notes?: string | null;
};

export type GrammarPatch = Partial<GrammarMutation>;

type GrammarPointRow = {
  id: number | string;
  jlpt_level: JlptLevel;
  title: string;
  structure: string | null;
  meaning: string;
  explanation: string | null;
  examples_json: unknown;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export class GrammarNotFoundError extends Error {
  constructor() {
    super("Không tìm thấy mẫu ngữ pháp.");
    this.name = "GrammarNotFoundError";
  }
}

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

const grammarPointColumns = [
  "id",
  "jlpt_level",
  "title",
  "structure",
  "meaning",
  "explanation",
  "examples_json",
  "notes",
  "created_at",
  "updated_at",
].join(",");

async function getSessionUserId() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw toFriendlyError(error, "Không thể kiểm tra phiên đăng nhập.");
  }

  return session?.user?.id ?? null;
}

async function requireSessionUserId() {
  const userId = await getSessionUserId();

  if (!userId) {
    throw new Error("Bạn cần đăng nhập để lưu ngữ pháp.");
  }

  return userId;
}

function normalizeExamples(value: unknown): GrammarExample[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => {
      return typeof item === "object" && item !== null;
    })
    .map((item) => ({
      jp: typeof item.jp === "string" ? item.jp : "",
      reading: typeof item.reading === "string" ? item.reading : "",
      vi: typeof item.vi === "string" ? item.vi : "",
    }))
    .filter((item) => item.jp.trim() || item.reading.trim() || item.vi.trim());
}

function mapGrammarPointRow(
  row: GrammarPointRow,
  bookmarkedGrammarIds = new Set<string>(),
): GrammarPoint {
  const grammarId = String(row.id);

  return {
    id: grammarId,
    jlptLevel: row.jlpt_level,
    title: row.title,
    structure: row.structure,
    meaning: row.meaning,
    explanation: row.explanation,
    examples: normalizeExamples(row.examples_json),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isBookmarked: bookmarkedGrammarIds.has(grammarId),
  };
}

function mapGrammarMutation(payload: GrammarMutation | GrammarPatch) {
  return {
    ...(payload.jlptLevel !== undefined ? { jlpt_level: payload.jlptLevel } : {}),
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.structure !== undefined ? { structure: payload.structure } : {}),
    ...(payload.meaning !== undefined ? { meaning: payload.meaning } : {}),
    ...(payload.explanation !== undefined
      ? { explanation: payload.explanation }
      : {}),
    ...(payload.examples !== undefined ? { examples_json: payload.examples } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes || null } : {}),
  };
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%,]/g, " ");
}

async function getBookmarkedGrammarIds(userId: string) {
  const { data, error } = await supabase
    .from("grammar_bookmarks")
    .select("grammar_id")
    .eq("user_id", userId);

  if (error) {
    throw toFriendlyError(error, "Không thể tải danh sách ngữ pháp đã lưu.");
  }

  return new Set(
    ((data ?? []) as Array<{ grammar_id: number | string }>).map((row) =>
      String(row.grammar_id),
    ),
  );
}

export async function getGrammarPoints(
  filters: GrammarFilters = {},
): Promise<GrammarPoint[]> {
  const sessionUserId = await getSessionUserId();
  let bookmarkedGrammarIds = new Set<string>();

  if (sessionUserId) {
    bookmarkedGrammarIds = await getBookmarkedGrammarIds(sessionUserId);
  }

  if (filters.bookmarkedOnly && !sessionUserId) {
    return [];
  }

  if (filters.bookmarkedOnly && bookmarkedGrammarIds.size === 0) {
    return [];
  }

  let query = supabase
    .from("grammar_points")
    .select(grammarPointColumns)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters.jlptLevel) {
    query = query.eq("jlpt_level", filters.jlptLevel);
  }

  const searchTerm = sanitizeSearchTerm(filters.search ?? "");

  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    query = query.or(
      [
        `title.ilike.${pattern}`,
        `structure.ilike.${pattern}`,
        `meaning.ilike.${pattern}`,
        `explanation.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (filters.bookmarkedOnly) {
    query = query.in("id", Array.from(bookmarkedGrammarIds));
  }

  const { data, error } = await query;

  if (error) {
    throw toFriendlyError(error, "Không thể tải danh sách ngữ pháp.");
  }

  return ((data ?? []) as unknown as GrammarPointRow[]).map((row) =>
    mapGrammarPointRow(row, bookmarkedGrammarIds),
  );
}

export async function getGrammarPointById(
  id: string | number,
): Promise<GrammarPoint> {
  const sessionUserId = await getSessionUserId();
  const bookmarkedGrammarIds = sessionUserId
    ? await getBookmarkedGrammarIds(sessionUserId)
    : new Set<string>();

  const { data, error } = await supabase
    .from("grammar_points")
    .select(grammarPointColumns)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw toFriendlyError(error, "Không thể tải chi tiết ngữ pháp.");
  }

  if (!data) {
    throw new GrammarNotFoundError();
  }

  return mapGrammarPointRow(data as unknown as GrammarPointRow, bookmarkedGrammarIds);
}

export async function createGrammarPoint(
  payload: GrammarMutation,
): Promise<GrammarPoint> {
  const { data, error } = await supabase
    .from("grammar_points")
    .insert(mapGrammarMutation(payload))
    .select(grammarPointColumns)
    .single();

  if (error) {
    throw toFriendlyError(error, "Không thể thêm mẫu ngữ pháp.");
  }

  return mapGrammarPointRow(data as unknown as GrammarPointRow);
}

export async function updateGrammarPoint(
  id: number | string,
  payload: GrammarPatch,
): Promise<GrammarPoint> {
  const { data, error } = await supabase
    .from("grammar_points")
    .update(mapGrammarMutation(payload))
    .eq("id", id)
    .select(grammarPointColumns)
    .single();

  if (error) {
    throw toFriendlyError(error, "Không thể cập nhật ngữ pháp.");
  }

  const sessionUserId = await getSessionUserId();
  const bookmarkedGrammarIds = sessionUserId
    ? await getBookmarkedGrammarIds(sessionUserId)
    : new Set<string>();

  return mapGrammarPointRow(data as unknown as GrammarPointRow, bookmarkedGrammarIds);
}

export async function deleteGrammarPoint(id: number | string): Promise<void> {
  const { error } = await supabase
    .from("grammar_points")
    .delete()
    .eq("id", id);

  if (error) {
    throw toFriendlyError(error, "Không thể xóa mẫu ngữ pháp.");
  }
}

export async function addGrammarBookmark(
  grammarId: string | number,
): Promise<GrammarPoint> {
  const sessionUserId = await requireSessionUserId();

  const { error } = await supabase.from("grammar_bookmarks").upsert(
    {
      user_id: sessionUserId,
      grammar_id: grammarId,
    },
    { onConflict: "user_id,grammar_id" },
  );

  if (error) {
    throw toFriendlyError(error, "Không thể lưu ngữ pháp.");
  }

  return getGrammarPointById(grammarId);
}

export async function removeGrammarBookmark(
  grammarId: string | number,
): Promise<GrammarPoint> {
  const sessionUserId = await requireSessionUserId();

  const { error } = await supabase
    .from("grammar_bookmarks")
    .delete()
    .eq("user_id", sessionUserId)
    .eq("grammar_id", grammarId);

  if (error) {
    throw toFriendlyError(error, "Không thể bỏ lưu ngữ pháp.");
  }

  return getGrammarPointById(grammarId);
}
