import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/services/authService";
import type {
  ImportVocabularyPayload,
  ParsedImportFile,
} from "@/types/vocabularyImport";

export type ImportVocabularyResponse = {
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
};

function countTotalRows(files: ParsedImportFile[]) {
  return files.reduce((total, file) => total + file.vocabularies.length, 0);
}

function normalizeDuplicateKeyPart(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function buildDuplicateKey({
  book,
  level,
  chapter,
  kanji,
  hiragana,
}: {
  book: string;
  level: string;
  chapter: string;
  kanji: string;
  hiragana: string;
}) {
  return [
    book,
    level,
    chapter,
    kanji,
    hiragana,
  ].map(normalizeDuplicateKeyPart).join("|");
}

function getSupabaseErrorMessage(
  action: string,
  error: {
    message?: string;
    details?: string | null;
    hint?: string | null;
    code?: string;
  },
) {
  return [
    action,
    error.message,
    error.details ? `Details: ${error.details}` : null,
    error.hint ? `Hint: ${error.hint}` : null,
    error.code ? `Code: ${error.code}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

function throwSupabaseError(
  action: string,
  error: {
    message?: string;
    details?: string | null;
    hint?: string | null;
    code?: string;
  },
): never {
  throw new Error(getSupabaseErrorMessage(action, error));
}

export async function importVocabularies(
  payload: ImportVocabularyPayload,
): Promise<ImportVocabularyResponse> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("User is not logged in.");
  }

  const validFiles = payload.files.filter(
    (file) => file.vocabularies.length > 0,
  );

  const totalRows = countTotalRows(validFiles);

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      user_id: userId,
      source_type: payload.sourceType,
      status: "completed",
      total_files: validFiles.length,
      total_rows: totalRows,
      imported_count: 0,
      duplicate_count: 0,
      error_count: 0,
    })
    .select("id")
    .single();

  if (batchError) {
    throwSupabaseError("Cannot create import batch.", batchError);
  }

  let importedCount = 0;
  let duplicateCount = 0;
  const errorCount = 0;

  for (const file of validFiles) {
    const { data: batchFile, error: batchFileError } = await supabase
      .from("import_batch_files")
      .insert({
        batch_id: batch.id,
        file_name: file.fileName,
        file_path: file.filePath,
        book: file.book,
        level: file.level,
        chapter: file.chapter,
        total_rows: file.vocabularies.length,
        imported_count: 0,
        duplicate_count: 0,
        error_count: 0,
      })
      .select("id")
      .single();

    if (batchFileError) {
      throwSupabaseError(
        `Cannot create import batch file for "${file.fileName}".`,
        batchFileError,
      );
    }

    const vocabularyRows = file.vocabularies.map((vocabulary) => ({
      book: file.book.trim(),
      level: file.level.trim(),
      chapter: file.chapter.trim(),
      kanji: vocabulary.kanji.trim(),
      hiragana: vocabulary.hiragana.trim(),
      meaning: vocabulary.meaning.trim(),
      source_file_name: file.fileName,
      import_batch_file_id: batchFile.id,
    }));

    const { data: existingRows, error: existingRowsError } = await supabase
      .from("vocabularies")
      .select("book,level,chapter,kanji,hiragana")
      .eq("book", file.book.trim())
      .eq("level", file.level.trim())
      .eq("chapter", file.chapter.trim());

    if (existingRowsError) {
      throwSupabaseError(
        `Cannot check existing vocabularies for "${file.fileName}".`,
        existingRowsError,
      );
    }

    const existingKeys = new Set(
      (existingRows ?? []).map((row) =>
        buildDuplicateKey({
          book: row.book,
          level: row.level,
          chapter: row.chapter,
          kanji: row.kanji,
          hiragana: row.hiragana,
        }),
      ),
    );

    const newVocabularyRows = vocabularyRows.filter(
      (row) => !existingKeys.has(buildDuplicateKey(row)),
    );
    const fileDuplicateCount = vocabularyRows.length - newVocabularyRows.length;

    if (newVocabularyRows.length === 0) {
      duplicateCount += fileDuplicateCount;

      await supabase
        .from("import_batch_files")
        .update({
          imported_count: 0,
          duplicate_count: fileDuplicateCount,
          error_count: 0,
        })
        .eq("id", batchFile.id);

      continue;
    }

    const { data: insertedRows, error: vocabularyError } = await supabase
      .from("vocabularies")
      .insert(newVocabularyRows)
      .select("id");

    if (vocabularyError) {
      throwSupabaseError(
        `Cannot insert vocabularies from "${file.fileName}".`,
        vocabularyError,
      );
    }

    const fileImportedCount = insertedRows?.length ?? 0;

    importedCount += fileImportedCount;
    duplicateCount += fileDuplicateCount;

    await supabase
      .from("import_batch_files")
      .update({
        imported_count: fileImportedCount,
        duplicate_count: fileDuplicateCount,
        error_count: 0,
      })
      .eq("id", batchFile.id);
  }

  await supabase
    .from("import_batches")
    .update({
      imported_count: importedCount,
      duplicate_count: duplicateCount,
      error_count: errorCount,
    })
    .eq("id", batch.id);

  return {
    importedCount,
    duplicateCount,
    errorCount,
  };
}
