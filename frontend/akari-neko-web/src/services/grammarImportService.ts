import { supabase } from "@/lib/supabaseClient";
import type { GrammarExample, JlptLevel } from "@/services/grammarService";

export type GrammarImportRow = {
  rowNumber: number;
  pattern: string;
  meaning: string;
  level: string;
  structure: string;
  explanation: string;
  usage: string;
  exampleJapanese: string;
  exampleVietnamese: string;
  notes: string;
};

export type ImportError = {
  rowNumber: number;
  message: string;
};

export type ImportResult = {
  totalRows: number;
  successCount: number;
  updatedCount: number;
  failedCount: number;
  duplicateCount: number;
  errors: ImportError[];
};

type CsvRecord = Record<string, string>;

type ExistingGrammarRow = {
  id: number | string;
  title: string;
  jlpt_level: JlptLevel;
};

type GrammarWriteRow = {
  jlpt_level: JlptLevel;
  title: string;
  structure: string;
  meaning: string;
  explanation: string;
  examples_json: GrammarExample[];
  notes: string | null;
};

const jlptLevels = new Set(["N5", "N4", "N3", "N2", "N1"]);

const usedColumns = [
  "Pattern",
  "Meaning",
  "Level",
  "Structure",
  "Explanation",
  "ExampleJapanese",
  "ExampleVietnamese",
  "Notes",
] as const;

function normalizeHeader(value: string) {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function getCell(row: CsvRecord, header: string) {
  return row[header.toLowerCase()]?.trim() ?? "";
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
    /(?:Cấu\s*trúc|Cau\s*truc|Structure):\s*([\s\S]*?)\s*(?:Cách\s*dùng|Cach\s*dung|Explanation|Usage):\s*([\s\S]*)/i,
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
    return "Pattern is required.";
  }

  if (!row.meaning) {
    return "Meaning is required.";
  }

  if (!row.level) {
    return "Level is required.";
  }

  if (!jlptLevels.has(row.level.toUpperCase())) {
    return "Level must be N5, N4, N3, N2, or N1.";
  }

  return null;
}

function toWriteRow(row: GrammarImportRow): GrammarWriteRow {
  const parsedUsage = parseUsage(row.usage);

  return {
    jlpt_level: row.level.toUpperCase() as JlptLevel,
    title: row.pattern,
    structure: row.structure || parsedUsage.structure || row.pattern,
    meaning: row.meaning,
    explanation: row.explanation || parsedUsage.explanation,
    examples_json: buildExamples(row),
    notes: row.notes || null,
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
    pattern: getCell(row, "Pattern"),
    meaning: getCell(row, "Meaning"),
    level: getCell(row, "Level").toUpperCase(),
    structure: getCell(row, "Structure"),
    explanation: getCell(row, "Explanation"),
    usage: getCell(row, "Usage"),
    exampleJapanese: getCell(row, "ExampleJapanese"),
    exampleVietnamese: getCell(row, "ExampleVietnamese"),
    notes: getCell(row, "Notes") || getCell(row, "Note"),
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
    updatedCount: 0,
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
    .select("id,title,jlpt_level")
    .in("jlpt_level", levels);

  if (existingRowsError) {
    throw new Error(
      getSupabaseErrorMessage(
        "Cannot check existing grammar points.",
        existingRowsError,
      ),
    );
  }

  const existingByKey = new Map(
    ((existingRows ?? []) as ExistingGrammarRow[]).map((row) => [
      normalizeDuplicateKey(row.title, row.jlpt_level),
      row.id,
    ]),
  );
  const pendingKeys = new Set<string>();
  const insertRows: GrammarWriteRow[] = [];
  const updateRows: Array<{ id: number | string; payload: GrammarWriteRow }> = [];

  validRows.forEach((row) => {
    const key = normalizeDuplicateKey(row.pattern, row.level);

    if (pendingKeys.has(key)) {
      result.duplicateCount += 1;
      return;
    }

    pendingKeys.add(key);

    const existingId = existingByKey.get(key);
    const payload = toWriteRow(row);

    if (existingId !== undefined) {
      updateRows.push({ id: existingId, payload });
      return;
    }

    insertRows.push(payload);
  });

  if (insertRows.length > 0) {
    const { data: insertedRows, error: insertError } = await supabase
      .from("grammar_points")
      .insert(insertRows)
      .select("id");

    if (insertError) {
      throw new Error(
        getSupabaseErrorMessage("Cannot import grammar points.", insertError),
      );
    }

    result.successCount = insertedRows?.length ?? 0;
  }

  if (updateRows.length > 0) {
    const updateResults = await Promise.all(
      updateRows.map(({ id, payload }) =>
        supabase
          .from("grammar_points")
          .update(payload)
          .eq("id", id)
          .select("id")
          .single(),
      ),
    );

    const updateError = updateResults.find((item) => item.error)?.error;

    if (updateError) {
      throw new Error(
        getSupabaseErrorMessage("Cannot update existing grammar points.", updateError),
      );
    }

    result.updatedCount = updateResults.filter((item) => item.data).length;
  }

  return result;
}

export { usedColumns as grammarCsvUsedColumns };
