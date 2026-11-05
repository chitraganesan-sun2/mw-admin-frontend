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

// Badge / panel tones. Each pair (text on tint) is at least WCAG AA, and the severity is always written
// out beside its colour: the colour reinforces the word, it never carries the meaning alone.
export const SEVERITY_TONE: Record<SafetySeverity, { dot: string; bg: string; border: string; text: string }> = {
  Safe: { dot: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", text: "#047857" },
  Low: { dot: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
  Moderate: { dot: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
  High: { dot: "#F97316", bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
  Critical: { dot: "#EF4444", bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" },
};

/** The pipeline's own score bands: Safe 0-20, Low 21-40, Moderate 41-60, High 61-80, Critical 81-100. */
export const riskSeverity = (score?: number | null): SafetySeverity | null => {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (score >= 81) return "Critical";
  if (score >= 61) return "High";
  if (score >= 41) return "Moderate";
  if (score >= 21) return "Low";
  return "Safe";
};

/** Colour for a 0..100 risk score (grey while there is none). */
export const riskHex = (score?: number | null): string => {
  const band = riskSeverity(score);
  return band ? SEVERITY_COLORS[band].hex : "#9CA3AF";
};

/** High and Critical are the reports an admin should open first. */
export const needsAttention = (severity?: string | null): boolean => {
  const rank = severityRank(severity);
  return rank >= SEVERITY_ORDER.indexOf("High");
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
  PROCESSING: { label: "Analyzing", tag: "processing" },
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
