export function normalizeJapaneseVerbAnnotation(value: string) {
  return value
    .replace(/＜\s*([^＞]+?)\s*＞/gu, "・ $1")
    .replace(/<\s*([^>]+?)\s*>/gu, "・ $1")
    .replace(/\s*・\s*/gu, "・ ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function normalizeVocabularyTextFields<T extends {
  kanji: string;
  hiragana: string;
}>(vocabulary: T): T {
  return {
    ...vocabulary,
    kanji: normalizeJapaneseVerbAnnotation(vocabulary.kanji),
    hiragana: normalizeJapaneseVerbAnnotation(vocabulary.hiragana),
  };
}
