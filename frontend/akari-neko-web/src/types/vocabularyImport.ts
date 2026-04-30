import type { ParsedVocabularyItem } from "@/lib/htmlVocabularyParser";

export type ImportSourceType = "file" | "folder";

export type ImportStep = "select" | "preview" | "completed";

export type ImportMetadataField = "level" | "book" | "chapter";

export type SelectedHtmlFile = {
  file: File;
  name: string;
  size: number;
  path: string;
  level: string;
  book: string;
  chapter: string;
};

export type ImportPreviewRow = {
  fileName: string;
  filePath: string;
  level: string;
  book: string;
  chapter: string;
  size: string;
  totalRows: number | string;
  newRows: number | string;
  duplicateRows: number | string;
  errorRows: number | string;
};

export type VocabularyPreviewItem = {
  importGroupName: string;
  kanji: string;
  hiragana: string;
  meaning: string;
};

export type ParsedImportFile = {
  fileName: string;
  filePath: string;
  level: string;
  book: string;
  chapter: string;
  vocabularies: ParsedVocabularyItem[];
};

export type ImportVocabularyPayload = {
  sourceType: ImportSourceType;
  files: ParsedImportFile[];
};