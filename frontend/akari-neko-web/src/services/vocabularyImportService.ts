import { apiClient } from "@/lib/apiClient";
import type { ImportVocabularyPayload } from "@/types/vocabularyImport";

export type ImportVocabularyResponse = {
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
};

export async function importVocabularies(payload: ImportVocabularyPayload) {
  return apiClient<ImportVocabularyResponse>("/api/vocabularies/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}