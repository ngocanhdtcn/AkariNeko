"use client";

export type PersistedStudyFilters = {
  level: string;
  book: string;
  chapters: string[];
  onlyDifficult: boolean;
  searchKeyword?: string;
  page?: number;
};

const FILTER_STORAGE_PREFIX = "akari-neko:study-filters:";

function getStorageKey(scope: string) {
  return `${FILTER_STORAGE_PREFIX}${scope}`;
}

function normalizeFilterValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function readPersistedStudyFilters(
  scope: string,
): PersistedStudyFilters | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(scope));

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PersistedStudyFilters>;

    return {
      level: normalizeFilterValue(parsedValue.level, "All"),
      book: normalizeFilterValue(parsedValue.book, "All"),
      chapters: Array.isArray(parsedValue.chapters)
        ? parsedValue.chapters.filter(
            (chapter): chapter is string =>
              typeof chapter === "string" && chapter.trim().length > 0,
          )
        : [],
      onlyDifficult: Boolean(parsedValue.onlyDifficult),
      searchKeyword:
        typeof parsedValue.searchKeyword === "string"
          ? parsedValue.searchKeyword
          : "",
      page:
        typeof parsedValue.page === "number" &&
        Number.isFinite(parsedValue.page) &&
        parsedValue.page > 0
          ? parsedValue.page
          : 1,
    };
  } catch {
    return null;
  }
}

export function writePersistedStudyFilters(
  scope: string,
  filters: PersistedStudyFilters,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(scope), JSON.stringify(filters));
}

export function hasActiveStudyFilters(filters: PersistedStudyFilters | null) {
  if (!filters) {
    return false;
  }

  return (
    filters.level !== "All" ||
    filters.book !== "All" ||
    filters.chapters.length > 0 ||
    filters.onlyDifficult ||
    Boolean(filters.searchKeyword?.trim())
  );
}
