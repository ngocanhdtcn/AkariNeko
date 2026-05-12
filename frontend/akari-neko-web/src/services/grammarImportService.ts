import { supabase } from "@/lib/supabaseClient";
import type { GrammarExample, JlptLevel } from "@/services/grammarService";

export type GrammarImportRow = {
  rowNumber: number;
  pattern: string;
  meaning: string;
  level: string;
  usage: string;
  exampleJapanese: string;
  exampleVietnamese: string;
};

export type ImportError = {
  rowNumber: number;
  message: string;
};

export type ImportResult = {
  totalRows: number;
  successCount: number;
  failedCount: number;
  duplicateCount: number;
  errors: ImportError[];
};

type CsvRecord = Record<string, string>;

type GrammarInsertRow = {
  jlpt_level: JlptLevel;
  title: string;
  structure: string;
  meaning: string;
  explanation: string;
  examples_json: GrammarExample[];
  notes: null;
};

const jlptLevels = new Set(["N5", "N4", "N3", "N2", "N1"]);

const usedColumns = [
  "Pattern",
  "Meaning",
  "Level",
  "Usage",
  "ExampleJapanese",
  "ExampleVietnamese",
] as const;

function normalizeHeader(value: string) {
  return value.trim().replace(/^\uFEFF/, "");
}

function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let isQuoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === "\"") {
      if (isQuoted && nextChar === "\"") {
        field += "\"";
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
      continue;
    }

    if (char === "," && !isQuoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !isQuoted) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(field);
      field = "";

      if (row.some((cell) => cell.trim())) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);

  if (row.some((cell) => cell.trim())) {
    rows.push(row);
  }

  return rows;
}

function mapCsvRows(rows: string[][]): CsvRecord[] {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);

  return rows.slice(1).map((row) => {
    return headers.reduce<CsvRecord>((record, header, index) => {
      record[header] = row[index]?.trim() ?? "";
      return record;
    }, {});
  });
}

function parseUsage(usage: string) {
  const normalizedUsage = usage.trim();

  if (!normalizedUsage) {
    return {
      structure: "",
      explanation: "",
    };
  }

  const usageMatch = normalizedUsage.match(
    /Cấu\s*trúc:\s*([\s\S]*?)\s*Cách\s*dùng:\s*([\s\S]*)/i,
  );

  if (!usageMatch) {
    return {
      structure: normalizedUsage,
      explanation: "",
    };
  }

  return {
    structure: usageMatch[1].trim(),
    explanation: usageMatch[2].trim(),
  };
}

function buildExamples(row: GrammarImportRow): GrammarExample[] {
  if (!row.exampleJapanese && !row.exampleVietnamese) {
    return [];
  }

  return [
    {
      jp: row.exampleJapanese,
      reading: "",
      vi: row.exampleVietnamese,
    },
  ];
}

function normalizeDuplicateKey(title: string, jlptLevel: string) {
  return `${title.trim().replace(/\s+/g, " ").toLowerCase()}|${jlptLevel.trim().toUpperCase()}`;
}

function validateRow(row: GrammarImportRow): string | null {
  if (!row.pattern) {
    return "Pattern là bắt buộc.";
  }

  if (!row.meaning) {
    return "Meaning là bắt buộc.";
  }

  if (!row.level) {
    return "Level là bắt buộc.";
  }

  if (!jlptLevels.has(row.level.toUpperCase())) {
    return "Level phải là N5, N4, N3, N2 hoặc N1.";
  }

  return null;
}

function toInsertRow(row: GrammarImportRow): GrammarInsertRow {
  const parsedUsage = parseUsage(row.usage);

  return {
    jlpt_level: row.level.toUpperCase() as JlptLevel,
    title: row.pattern,
    structure: parsedUsage.structure || row.pattern,
    meaning: row.meaning,
    explanation: parsedUsage.explanation,
    examples_json: buildExamples(row),
    notes: null,
  };
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

export async function parseGrammarCsv(file: File): Promise<GrammarImportRow[]> {
  const csvText = await file.text();
  const csvRows = mapCsvRows(parseCsvText(csvText));

  return csvRows.map((row, index) => ({
    rowNumber: index + 2,
    pattern: row.Pattern?.trim() ?? "",
    meaning: row.Meaning?.trim() ?? "",
    level: row.Level?.trim().toUpperCase() ?? "",
    usage: row.Usage?.trim() ?? "",
    exampleJapanese: row.ExampleJapanese?.trim() ?? "",
    exampleVietnamese: row.ExampleVietnamese?.trim() ?? "",
  }));
}

export async function importGrammarRows(
  rows: GrammarImportRow[],
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  const validRows: GrammarImportRow[] = [];

  rows.forEach((row) => {
    const validationError = validateRow(row);

    if (validationError) {
      errors.push({
        rowNumber: row.rowNumber,
        message: validationError,
      });
      return;
    }

    validRows.push(row);
  });

  const result: ImportResult = {
    totalRows: rows.length,
    successCount: 0,
    failedCount: errors.length,
    duplicateCount: 0,
    errors,
  };

  if (validRows.length === 0) {
    return result;
  }

  const levels = Array.from(
    new Set(validRows.map((row) => row.level.toUpperCase() as JlptLevel)),
  );

  const { data: existingRows, error: existingRowsError } = await supabase
    .from("grammar_points")
    .select("title,jlpt_level")
    .in("jlpt_level", levels);

  if (existingRowsError) {
    throw new Error(
      getSupabaseErrorMessage(
        "Không thể kiểm tra ngữ pháp trùng.",
        existingRowsError,
      ),
    );
  }

  const existingKeys = new Set(
    (existingRows ?? []).map((row) =>
      normalizeDuplicateKey(row.title, row.jlpt_level),
    ),
  );
  const pendingKeys = new Set<string>();
  const insertRows: GrammarInsertRow[] = [];

  validRows.forEach((row) => {
    const key = normalizeDuplicateKey(row.pattern, row.level);

    if (existingKeys.has(key) || pendingKeys.has(key)) {
      result.duplicateCount += 1;
      return;
    }

    pendingKeys.add(key);
    insertRows.push(toInsertRow(row));
  });

  if (insertRows.length === 0) {
    return result;
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("grammar_points")
    .insert(insertRows)
    .select("id");

  if (insertError) {
    throw new Error(
      getSupabaseErrorMessage("Không thể import ngữ pháp.", insertError),
    );
  }

  result.successCount = insertedRows?.length ?? 0;

  return result;
}

export { usedColumns as grammarCsvUsedColumns };
