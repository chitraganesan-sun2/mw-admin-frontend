// The CSV export endpoints skip a record they cannot decrypt and report how many in the
// X-Export-Skipped-Rows response header. The header may be absent (older backend, nothing skipped).
// Header names reach the client lower-cased (axios) or as sent (fetch Headers); accept both.

type HeaderBag = Record<string, unknown> | { get?: (name: string) => unknown } | null | undefined;

export const EXPORT_SKIPPED_HEADER = "X-Export-Skipped-Rows";

/** Number of rows the export left out, or 0 when the header is missing or not a positive number. */
export function skippedRowsFromHeaders(headers: HeaderBag): number {
  if (!headers) return 0;
  let raw: unknown;
  const getter = (headers as { get?: unknown }).get;
  if (typeof getter === "function") raw = (getter as (n: string) => unknown).call(headers, EXPORT_SKIPPED_HEADER);
  if (raw === undefined || raw === null) {
    const bag = headers as Record<string, unknown>;
    raw = bag[EXPORT_SKIPPED_HEADER.toLowerCase()] ?? bag[EXPORT_SKIPPED_HEADER];
  }
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function skippedRowsMessage(count: number): string {
  return `The export is incomplete: ${count} ${count === 1 ? "record" : "records"} couldn't be read and ${count === 1 ? "was" : "were"} left out of the file.`;
}
