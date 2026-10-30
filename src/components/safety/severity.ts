// Severity / status vocabulary of the safety pipeline, shared by every Safety Monitoring screen so a
// "High" looks the same on the list, the report and the charts.

export const SEVERITY_ORDER: SafetySeverity[] = ["Safe", "Low", "Moderate", "High", "Critical"];

// Hex colours (charts) and the matching antd Tag colour names (badges).
export const SEVERITY_COLORS: Record<SafetySeverity, { hex: string; tag: string }> = {
  Safe: { hex: "#10B981", tag: "green" },
  Low: { hex: "#3B82F6", tag: "blue" },
  Moderate: { hex: "#F59E0B", tag: "gold" },
  High: { hex: "#F97316", tag: "orange" },
  Critical: { hex: "#EF4444", tag: "red" },
};

/** Position in SEVERITY_ORDER (unknown / not yet analysed sorts lowest). */
export const severityRank = (severity?: string | null): number => {
  const index = SEVERITY_ORDER.findIndex((s) => s.toLowerCase() === String(severity ?? "").toLowerCase());
  return index;
};

export const isSafetySeverity = (value: unknown): value is SafetySeverity =>
  SEVERITY_ORDER.includes(value as SafetySeverity);

/** Analysis still running (or just submitted). */
export const isInFlight = (status?: string | null): boolean =>
  String(status ?? "").toUpperCase() === "PROCESSING";

export const STATUS_LABELS: Record<string, { label: string; tag: string }> = {
  PROCESSING: { label: "Analysing", tag: "processing" },
  COMPLETED: { label: "Completed", tag: "success" },
  FAILED: { label: "Failed", tag: "error" },
};

/** "secrecy" / "gift_bribery" -> "Secrecy" / "Gift bribery". */
export const categoryLabel = (category: string): string => {
  const text = category.replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : category;
};

/** 0..100 risk score to one decimal; "-" while there is none. */
export const formatRisk = (score?: number | null): string =>
  typeof score === "number" && Number.isFinite(score) ? score.toFixed(1) : "-";
