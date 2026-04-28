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

  return fileName.replace(/\.html?$/i, "");
}

function detectJlptLevel(fileName: string) {
  const match = fileName.match(/\bN[1-5]\b/i);

  return match ? match[0].toUpperCase() : "Unknown";
}

function detectBookName(filePath: string) {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes("jtest")) {
    return "JTest";
  }

  if (lowerPath.includes("minna")) {
    return "Minna no Nihongo";
  }

  if (lowerPath.includes("soumatome")) {
    return "Soumatome";
  }

  if (lowerPath.includes("shinkanzen")) {
    return "Shinkanzen Master";
  }

  return "JLPT Vocabulary";
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
        book: detectBookName(filePath),
        chapter: detectChapterName(fileDisplayName),
      });
    }
  });

  return Array.from(uniqueFileMap.values());
}