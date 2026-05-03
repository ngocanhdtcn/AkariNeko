import type { ParsedVocabularyItem } from "@/lib/htmlVocabularyParser";
import type { SelectedHtmlFile } from "@/types/vocabularyImport";

export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function isHtmlFile(file: File) {
  const lowerFileName = file.name.toLowerCase();

  return lowerFileName.endsWith(".html") || lowerFileName.endsWith(".htm");
}

function isDirectChildOfSelectedFolder(file: File) {
  if (!file.webkitRelativePath) {
    return true;
  }

  const pathParts = file.webkitRelativePath.split("/").filter(Boolean);

  return pathParts.length <= 2;
}

function getFileDisplayName(filePath: string, fallbackName: string) {
  const pathParts = filePath.split("/").filter(Boolean);
  const fileName =
    pathParts.length > 0 ? pathParts[pathParts.length - 1] : fallbackName;

  return stripBookDomainSuffix(fileName.replace(/\.html?$/i, ""));
}

function detectJlptLevel(fileName: string) {
  const match = fileName.match(/\bN[1-5]\b/i);

  return match ? match[0].toUpperCase() : "Unknown";
}

function normalizeImportText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[đĐ]/g, "d")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeImportKey(value: string) {
  return normalizeImportText(value).replace(/\s+/g, "");
}

function titleCaseImportToken(token: string) {
  const upperToken = token.toUpperCase();
  const knownAcronyms = new Set(["JLPT", "JTEST", "N1", "N2", "N3", "N4", "N5"]);

  if (knownAcronyms.has(upperToken)) {
    return upperToken === "JTEST" ? "JTest" : upperToken;
  }

  return `${token.charAt(0).toLocaleUpperCase("vi-VN")}${token
    .slice(1)
    .toLocaleLowerCase("vi-VN")}`;
}

function formatInferredBookName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(titleCaseImportToken)
    .join(" ");
}

function stripBookDomainSuffix(value: string) {
  return value
    .replace(/\.(?:com|net|org|vn|edu|jp)(?:\.[a-z]{2})?$/i, "")
    .trim();
}

function getBookCandidateFromFileName(fileName: string) {
  const nameWithoutExtension = fileName.replace(/\.html?$/i, "");
  const underscoreParts = nameWithoutExtension.split("_").map((part) => part.trim());
  const underscoreCandidate = underscoreParts
    .slice()
    .reverse()
    .find((part) => {
      const normalizedPart = normalizeImportText(part);

      return (
        normalizedPart &&
        !/^n[1-5]$/.test(normalizedPart) &&
        !normalizedPart.includes("chapter") &&
        !normalizedPart.includes("import")
      );
    });

  if (underscoreCandidate) {
    return stripBookDomainSuffix(underscoreCandidate);
  }

  return stripBookDomainSuffix(nameWithoutExtension);
}

function inferBookNameFromPath(filePath: string) {
  const pathParts = filePath.split("/").filter(Boolean);
  const fileName = pathParts[pathParts.length - 1] ?? filePath;
  const folderCandidates = pathParts.slice(0, -1).reverse();

  const meaningfulFolder = folderCandidates.find((folderName) => {
    const normalizedFolderName = normalizeImportText(folderName);

    return (
      normalizedFolderName &&
      !/^n[1-5]$/.test(normalizedFolderName) &&
      !normalizedFolderName.includes("chapter") &&
      normalizedFolderName !== "html" &&
      normalizedFolderName !== "import"
    );
  });

  if (meaningfulFolder) {
    return formatInferredBookName(meaningfulFolder);
  }

  const bookCandidate = getBookCandidateFromFileName(fileName)
    .replace(/\bBài\s*\d+(?:\+\d+)?\b/giu, "")
    .replace(/\bN[1-5]\b/giu, "")
    .replace(/\bchapter\b/giu, "")
    .replace(/\bchap\b/giu, "")
    .replace(/\bimport\b/giu, "")
    .replace(/\b\d+(?:\+\d+)?\b/gu, "")
    .trim();

  return formatInferredBookName(bookCandidate);
}

function findMatchingExistingBook(filePath: string, existingBooks: string[]) {
  const normalizedPathKey = normalizeImportKey(filePath);

  return existingBooks.find((book) => {
    const normalizedBookKey = normalizeImportKey(book);

    return normalizedBookKey && normalizedPathKey.includes(normalizedBookKey);
  });
}

function detectBookName(filePath: string, existingBooks: string[]) {
  const existingBook = findMatchingExistingBook(filePath, existingBooks);

  if (existingBook) {
    return existingBook;
  }

  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes("jtest")) {
    return findMatchingExistingBook("jtest", existingBooks) ?? "JTest";
  }

  if (lowerPath.includes("minna")) {
    return (
      findMatchingExistingBook("minna no nihongo", existingBooks) ??
      "Minna no Nihongo"
    );
  }

  if (lowerPath.includes("soumatome")) {
    return findMatchingExistingBook("soumatome", existingBooks) ?? "Soumatome";
  }

  if (lowerPath.includes("shinkanzen")) {
    return (
      findMatchingExistingBook("shinkanzen master", existingBooks) ??
      "Shinkanzen Master"
    );
  }

  if (lowerPath.includes("jlpt")) {
    return findMatchingExistingBook("jlpt", existingBooks) ?? "JLPT Vocabulary";
  }

  return inferBookNameFromPath(filePath) || existingBooks[0] || "JLPT Vocabulary";
}

function detectChapterName(fileName: string) {
  const nameWithoutExtension = fileName.replace(/\.html?$/i, "");
  const firstPart = nameWithoutExtension.split("-")[0]?.trim();

  return firstPart || nameWithoutExtension;
}

export function buildImportGroupName(
  book: string,
  level: string,
  chapter: string,
) {
  return [book, level, chapter].filter(Boolean).join(" - ");
}

export function mapSelectedFiles(
  fileList: FileList | null,
  shouldIgnoreSubfolders: boolean,
  existingBooks: string[] = [],
) {
  if (!fileList) {
    return [];
  }

  const htmlFiles = Array.from(fileList)
    .filter(isHtmlFile)
    .filter((file) => {
      if (!shouldIgnoreSubfolders) {
        return true;
      }

      return isDirectChildOfSelectedFolder(file);
    });

  const uniqueFileMap = new Map<string, SelectedHtmlFile>();

  htmlFiles.forEach((file) => {
    const filePath = file.webkitRelativePath || file.name;
    const fileDisplayName = getFileDisplayName(filePath, file.name);

    if (!uniqueFileMap.has(filePath)) {
      uniqueFileMap.set(filePath, {
        file,
        name: fileDisplayName,
        size: file.size,
        path: filePath,
        level: detectJlptLevel(fileDisplayName),
        book: detectBookName(filePath, existingBooks),
        chapter: detectChapterName(fileDisplayName),
      });
    }
  });

  return Array.from(uniqueFileMap.values());
}

function normalizeVocabularyKeyPart(value: string) {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

export function buildVocabularyDuplicateKey(
  book: string,
  level: string,
  chapter: string,
  vocabulary: ParsedVocabularyItem,
) {
  return [
    normalizeVocabularyKeyPart(book),
    normalizeVocabularyKeyPart(level),
    normalizeVocabularyKeyPart(chapter),
    normalizeVocabularyKeyPart(vocabulary.kanji),
    normalizeVocabularyKeyPart(vocabulary.hiragana),
  ].join("|");
}

export function splitUniqueVocabularies(
  items: Array<{
    book: string;
    level: string;
    chapter: string;
    vocabulary: ParsedVocabularyItem;
  }>,
) {
  const uniqueMap = new Map<string, ParsedVocabularyItem>();
  const duplicateItems: ParsedVocabularyItem[] = [];

  items.forEach((item) => {
    const key = buildVocabularyDuplicateKey(
      item.book,
      item.level,
      item.chapter,
      item.vocabulary,
    );

    if (uniqueMap.has(key)) {
      duplicateItems.push(item.vocabulary);
      return;
    }

    uniqueMap.set(key, item.vocabulary);
  });

  return {
    uniqueItems: Array.from(uniqueMap.values()),
    duplicateItems,
  };
}
