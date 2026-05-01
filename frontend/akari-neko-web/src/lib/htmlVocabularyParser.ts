export type ParsedVocabularyItem = {
  kanji: string;
  hiragana: string;
  meaning: string;
};

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\t+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsJapanese(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(value);
}

function containsKana(value: string) {
  return /[\u3040-\u30ff]/u.test(value);
}

function containsKanji(value: string) {
  return /[\u3400-\u9fff]/u.test(value);
}

function containsVietnameseOrLatin(value: string) {
  return /[a-zA-ZÀ-ỹ]/u.test(value);
}

function isMostlyNumber(value: string) {
  return /^[0-9０-９]+[.)、．]?$/.test(value.trim());
}

function isBadUiText(value: string) {
  const text = value.toLowerCase();

  return (
    text === "×" ||
    text.includes("tìm kiếm") ||
    text.includes("search") ||
    text.includes("comment") ||
    text.includes("like") ||
    text.includes("share") ||
    text.includes("facebook") ||
    text.includes("youtube") ||
    text.includes("download") ||
    text.includes("login") ||
    text.includes("đăng nhập") ||
    text.includes("menu") ||
    text.includes("bình luận") ||
    text.includes("trang chủ") ||
    text.includes("bài viết") ||
    text.includes("jtest.net") ||
    (text.includes("jlpt") && text.includes("từ vựng"))
  );
}

function isHeaderRow(cells: string[]) {
  const joinedText = cells.join(" ").toLowerCase();

  return (
    joinedText.includes("kanji") ||
    joinedText.includes("hiragana") ||
    joinedText.includes("nghĩa") ||
    joinedText.includes("meaning") ||
    joinedText.includes("từ vựng") ||
    joinedText.includes("âm hán") ||
    joinedText.includes("hán tự")
  );
}

function cleanMeaning(value: string) {
  return normalizeText(
    value
      .replace(/^[:：\-–—]+/, "")
      .replace(/\s*[,，、]\s*/g, ", "),
  );
}

function isValidMeaning(value: string) {
  return (
    containsVietnameseOrLatin(value) &&
    !containsJapanese(value) &&
    !isBadUiText(value)
  );
}

function buildVocabularyItem(cells: string[]): ParsedVocabularyItem | null {
  const filteredCells = cells
    .map(normalizeText)
    .filter(Boolean)
    .filter((cell) => !isMostlyNumber(cell))
    .filter((cell) => !isBadUiText(cell));

  if (filteredCells.length < 2 || isHeaderRow(filteredCells)) {
    return null;
  }

  const wordCell =
    filteredCells.find((cell) => containsKanji(cell)) ??
    filteredCells.find((cell) => containsKana(cell)) ??
    "";

  if (!wordCell) {
    return null;
  }

  const wordIndex = filteredCells.indexOf(wordCell);

  const readingCell =
    filteredCells.find(
      (cell, index) =>
        index !== wordIndex &&
        containsKana(cell) &&
        cell.length <= 40,
    ) ?? "";

  const readingIndex = readingCell ? filteredCells.indexOf(readingCell) : -1;

  const meaningCell =
    filteredCells.find((cell, index) => {
      if (index === wordIndex || index === readingIndex) {
        return false;
      }

      return isValidMeaning(cell);
    }) ?? "";

  if (!meaningCell) {
    return null;
  }

  return {
    kanji: wordCell,
    hiragana: readingCell || wordCell,
    meaning: cleanMeaning(meaningCell),
  };
}

function buildVocabularyItemFromColumns(
  cells: string[],
): ParsedVocabularyItem | null {
  const [kanjiCell, hiraganaCell, meaningCell] = cells.map(normalizeText);

  if (!kanjiCell || !hiraganaCell || !meaningCell) {
    return null;
  }

  if (
    isBadUiText(kanjiCell) ||
    isBadUiText(hiraganaCell) ||
    isBadUiText(meaningCell) ||
    isHeaderRow(cells)
  ) {
    return null;
  }

  if (!containsJapanese(kanjiCell) || !containsKana(hiraganaCell)) {
    return null;
  }

  if (!isValidMeaning(meaningCell)) {
    return null;
  }

  return {
    kanji: kanjiCell,
    hiragana: hiraganaCell,
    meaning: cleanMeaning(meaningCell),
  };
}

function parseInlineVocabularyLine(line: string): ParsedVocabularyItem | null {
  const normalizedLine = normalizeText(line);

  if (
    !normalizedLine ||
    isBadUiText(normalizedLine) ||
    !containsJapanese(normalizedLine)
  ) {
    return null;
  }

  const fullPattern =
    /^\s*(?:[0-9０-９]+[.)、．]?\s*)?([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー・]+)\s+([\p{Script=Hiragana}\p{Script=Katakana}ー・]+)\s+(.+)$/u;

  const fullMatch = normalizedLine.match(fullPattern);

  if (fullMatch) {
    const [, kanji, hiragana, meaning] = fullMatch;

    if (isValidMeaning(meaning)) {
      return {
        kanji: normalizeText(kanji),
        hiragana: normalizeText(hiragana),
        meaning: cleanMeaning(meaning),
      };
    }
  }

  const noReadingPattern =
    /^\s*(?:[0-9０-９]+[.)、．]?\s*)?([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー・]+)\s+(.+)$/u;

  const noReadingMatch = normalizedLine.match(noReadingPattern);

  if (noReadingMatch) {
    const [, kanji, meaning] = noReadingMatch;

    if (isValidMeaning(meaning)) {
      return {
        kanji: normalizeText(kanji),
        hiragana: normalizeText(kanji),
        meaning: cleanMeaning(meaning),
      };
    }
  }

  return null;
}

function removeNonContentElements(document: Document) {
  document
    .querySelectorAll(
      [
        "script",
        "style",
        "svg",
        "noscript",
        "header",
        "footer",
        "nav",
        "aside",
        "form",
        "button",
        "input",
        ".comment",
        ".comments",
        ".search",
        ".menu",
        ".sidebar",
        ".breadcrumb",
        ".pagination",
        ".related",
        ".share",
        ".social",
      ].join(","),
    )
    .forEach((element) => element.remove());
}

function parseJTestVocabularyItems(document: Document) {
  const wordElements = Array.from(document.querySelectorAll("[id^='word']"));

  return wordElements
    .map((wordElement) => {
      const id = wordElement.id;
      const suffix = id.replace(/^word/, "");

      if (!suffix || !/^\d+$/.test(suffix)) {
        return null;
      }

      const furiganaElement = document.getElementById(`furigana${suffix}`);
      const meaningElement = document.getElementById(`meaning${suffix}`);
      const kanji = normalizeText(wordElement.textContent ?? "");
      const hiragana = normalizeText(furiganaElement?.textContent ?? kanji);
      const meaning = cleanMeaning(meaningElement?.textContent ?? "");

      if (
        !kanji ||
        !hiragana ||
        !meaning ||
        !containsJapanese(kanji) ||
        !containsKana(hiragana) ||
        !isValidMeaning(meaning)
      ) {
        return null;
      }

      return {
        kanji,
        hiragana,
        meaning,
      };
    })
    .filter((item): item is ParsedVocabularyItem => item !== null);
}

function parseTableRows(document: Document) {
  const rows = Array.from(document.querySelectorAll("tr"));

  return rows
    .map((row) => {
      const cells = Array.from(row.children)
        .filter((child) => ["TD", "TH"].includes(child.tagName))
        .map((cell) => normalizeText(cell.textContent ?? ""))
        .filter(Boolean);

      if (cells.length >= 3) {
        return buildVocabularyItemFromColumns(cells) ?? buildVocabularyItem(cells);
      }

      return buildVocabularyItem(cells);
    })
    .filter((item): item is ParsedVocabularyItem => item !== null);
}

function parseTextElements(document: Document) {
  const elements = Array.from(
    document.querySelectorAll("article li, main li, li, article p, main p, p"),
  );

  return elements
    .map((element) => parseInlineVocabularyLine(element.textContent ?? ""))
    .filter((item): item is ParsedVocabularyItem => item !== null);
}

function parseTextLines(document: Document) {
  const body = document.body;
  const rawText = body.innerText || body.textContent || "";

  const lines = rawText
    .split(/\r?\n/)
    .map(normalizeText)
    .filter(Boolean)
    .filter((line) => !isBadUiText(line));

  const parsedItems: ParsedVocabularyItem[] = [];

  lines.forEach((line) => {
    const inlineItem = parseInlineVocabularyLine(line);

    if (inlineItem) {
      parsedItems.push(inlineItem);
    }
  });

  for (let index = 0; index < lines.length - 2; index += 1) {
    const firstLine = lines[index];
    const secondLine = lines[index + 1];
    const thirdLine = lines[index + 2];

    if (
      containsJapanese(firstLine) &&
      containsKana(secondLine) &&
      isValidMeaning(thirdLine)
    ) {
      parsedItems.push({
        kanji: firstLine,
        hiragana: secondLine,
        meaning: cleanMeaning(thirdLine),
      });
    }
  }

  return parsedItems;
}

function uniqueVocabularyItems(items: ParsedVocabularyItem[]) {
  const uniqueMap = new Map<string, ParsedVocabularyItem>();

  items.forEach((item) => {
    const key = `${item.kanji}|${item.hiragana}|${item.meaning}`;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return Array.from(uniqueMap.values());
}

export function parseVocabularyHtml(htmlText: string): ParsedVocabularyItem[] {
  const parser = new DOMParser();
  const document = parser.parseFromString(htmlText, "text/html");

  removeNonContentElements(document);

  const jTestItems = uniqueVocabularyItems(parseJTestVocabularyItems(document));

  if (jTestItems.length > 0) {
    return jTestItems;
  }

  const tableItems = uniqueVocabularyItems(parseTableRows(document));

  if (tableItems.length > 0) {
    return tableItems;
  }

  const parsedItems = [...parseTextElements(document), ...parseTextLines(document)];

  return uniqueVocabularyItems(parsedItems);
}
