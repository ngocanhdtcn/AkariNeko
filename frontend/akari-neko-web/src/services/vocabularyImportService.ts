import { supabase } from "@/lib/supabaseClient";
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

export async function importVocabularies(
  payload: ImportVocabularyPayload,
): Promise<ImportVocabularyResponse> {
  const validFiles = payload.files.filter(
    (file) => file.vocabularies.length > 0,
  );

  const totalRows = countTotalRows(validFiles);

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
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
    throw batchError;
  }

  let importedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

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
      errorCount += file.vocabularies.length;
      continue;
    }

    const vocabularyRows = file.vocabularies.map((vocabulary) => ({
      book: file.book,
      level: file.level,
      chapter: file.chapter,
      kanji: vocabulary.kanji,
      hiragana: vocabulary.hiragana,
      meaning: vocabulary.meaning,
      source_file_name: file.fileName,
      import_batch_file_id: batchFile.id,
    }));

    const { data: insertedRows, error: vocabularyError } = await supabase
      .from("vocabularies")
      .upsert(vocabularyRows, {
        onConflict: "book,level,chapter,kanji,hiragana",
        ignoreDuplicates: true,
      })
      .select("id");

    if (vocabularyError) {
      errorCount += vocabularyRows.length;
      continue;
    }

    const fileImportedCount = insertedRows?.length ?? 0;
    const fileDuplicateCount = vocabularyRows.length - fileImportedCount;

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