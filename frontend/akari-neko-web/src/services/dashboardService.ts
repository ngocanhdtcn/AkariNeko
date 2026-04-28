import { apiClient } from "@/lib/apiClient";
import type { RecentVocabulary } from "@/types/dashboard";

export async function getRecentVocabularies() {
  return apiClient<RecentVocabulary[]>("/api/vocabularies/recent");
}