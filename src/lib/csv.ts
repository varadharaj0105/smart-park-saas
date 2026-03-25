/**
 * Shared CSV export utility.
 * No external dependencies — triggers a browser download directly.
 */

/** Escape a single cell value so commas/quotes don't break the CSV. */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if it contains a comma, newline, or double-quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Download an array of objects as a CSV file.
 * @param filename  e.g. "payments_report"  — ".csv" is appended automatically
 * @param columns   Human-readable header labels in display order
 * @param keys      Object keys matching each column (same order as columns)
 * @param rows      Array of data objects
 */
export function exportToCSV(
  filename: string,
  columns: string[],
  keys: string[],
  rows: Record<string, unknown>[]
) {
  const header = columns.map(escapeCell).join(",");
  const body = rows
    .map((row) => keys.map((k) => escapeCell(row[k])).join(","))
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
