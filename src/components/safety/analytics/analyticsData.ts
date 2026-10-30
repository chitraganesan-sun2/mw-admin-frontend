import dayjs, { Dayjs } from "dayjs";
import { SEVERITY_COLORS, SEVERITY_ORDER, STATUS_LABELS, categoryLabel, isSafetySeverity } from "../severity";

// Pure helpers that turn the analytics summary and the report history into chart-ready data.
// The summary's chart fields are typed `unknown` on purpose (the pipeline decides their shape), so
// every reader here validates what it gets and drops what it can't use instead of throwing.

export type Bucket = { label: string; count: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toCount = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

/** Chart accent for neutral series (not a severity). */
export const ACCENT = "#6366F1";
export const NEUTRAL_GREY = "#9CA3AF";

/** Same bands the pipeline uses to turn a 0..100 risk score into a severity. */
export const riskColor = (score: number): string => {
  if (score >= 80) return SEVERITY_COLORS.Critical.hex;
  if (score >= 61) return SEVERITY_COLORS.High.hex;
  if (score >= 41) return SEVERITY_COLORS.Moderate.hex;
  if (score >= 21) return SEVERITY_COLORS.Low.hex;
  return SEVERITY_COLORS.Safe.hex;
};

/** Normalises "critical" / "CRITICAL" / "Critical" to the shared severity vocabulary. */
export const normalizeSeverity = (value: unknown): SafetySeverity | null => {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;
  const found = SEVERITY_ORDER.find((s) => s.toLowerCase() === text);
  return found && isSafetySeverity(found) ? found : null;
};

const leadingNumber = (label: string): number => {
  const n = parseInt(label, 10);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
};

/** `{ "0-20": 3, "21-40": 1 }` -> ordered buckets (by the range's lower bound). */
export const toBuckets = (value: unknown): Bucket[] =>
  isRecord(value)
    ? Object.entries(value)
        .map(([label, count]) => ({ label, count: toCount(count) }))
        .sort((a, b) => leadingNumber(a.label) - leadingNumber(b.label))
    : [];

/** `{ SECRECY: 2, VIDEO_CALL: 1 }` -> labelled buckets, biggest first. */
export const toContextBuckets = (value: unknown): Bucket[] =>
  isRecord(value)
    ? Object.entries(value)
        .map(([key, count]) => ({ label: categoryLabel(key.toLowerCase()), count: toCount(count) }))
        .filter((b) => b.count > 0)
        .sort((a, b) => b.count - a.count)
    : [];

/** `[{ category, count }]` -> labelled buckets, biggest first. */
export const toCategoryBuckets = (value: unknown): Bucket[] =>
  Array.isArray(value)
    ? value
        .filter(isRecord)
        .map((item) => ({ label: categoryLabel(String(item.category ?? "")), count: toCount(item.count) }))
        .filter((b) => b.label && b.count > 0)
        .sort((a, b) => b.count - a.count)
    : [];

/** Severity counts in the shared order (case-insensitive keys). */
export const toSeverityCounts = (value: unknown): Array<{ severity: SafetySeverity; count: number }> => {
  const totals = new Map<SafetySeverity, number>();
  if (isRecord(value)) {
    Object.entries(value).forEach(([key, count]) => {
      const severity = normalizeSeverity(key);
      if (severity) totals.set(severity, (totals.get(severity) ?? 0) + toCount(count));
    });
  }
  return SEVERITY_ORDER.map((severity) => ({ severity, count: totals.get(severity) ?? 0 }));
};

export type StatusSlice = { key: string; label: string; count: number; color: string };

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: SEVERITY_COLORS.Safe.hex,
  PROCESSING: SEVERITY_COLORS.Low.hex,
  FAILED: SEVERITY_COLORS.Critical.hex,
};

export const toStatusSlices = (value: unknown): StatusSlice[] =>
  isRecord(value)
    ? Object.entries(value)
        .map(([key, count]) => {
          const upper = key.toUpperCase();
          return {
            key,
            label: STATUS_LABELS[upper]?.label ?? categoryLabel(key.toLowerCase()),
            count: toCount(count),
            color: STATUS_COLORS[upper] ?? NEUTRAL_GREY,
          };
        })
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count)
    : [];

export type MlAgreement = { agreed: number; disagreed: number; noSignal: number; total: number; rate: number | null };

/** Findings the ML classifier weighed in on, vs the rule engine. `null` while it produced no signal. */
export const toMlAgreement = (value: unknown): MlAgreement | null => {
  if (!isRecord(value)) return null;
  const total = toCount(value.total);
  if (!total) return null;
  const agreed = toCount(value.agreed);
  const disagreed = toCount(value.disagreed);
  const rate = typeof value.rate === "number" && Number.isFinite(value.rate) ? value.rate : null;
  return { agreed, disagreed, noSignal: Math.max(0, total - agreed - disagreed), total, rate };
};

// ── Report history (trend charts) ────────────────────────────────────────────

export type HistoryPoint = {
  id: number;
  filename: string;
  at: Dayjs;
  score: number;
  severity: SafetySeverity | null;
};

/** Completed reports that have a score and a usable date, oldest first. */
export const toHistoryPoints = (rows: SafetyReportRow[] | undefined): HistoryPoint[] =>
  (rows ?? [])
    .flatMap((row) => {
      if (typeof row.risk_score !== "number" || !Number.isFinite(row.risk_score) || !row.created_at) return [];
      const at = dayjs(row.created_at);
      if (!at.isValid()) return [];
      return [
        { id: row.id, filename: row.filename, at, score: row.risk_score, severity: normalizeSeverity(row.severity) },
      ];
    })
    .sort((a, b) => a.at.valueOf() - b.at.valueOf());

const shortName = (point: HistoryPoint): string => {
  const name = point.filename || `#${point.id}`;
  return name.length > 14 ? `${name.slice(0, 13)}...` : name;
};

export type TrendPoint = { label: string; full: string; score: number };

/** The 20 most recent scored reports, oldest first. */
export const buildRiskTrend = (points: HistoryPoint[]): TrendPoint[] =>
  points.slice(-20).map((p) => ({
    label: shortName(p),
    full: `#${p.id} ${p.filename || ""} (${p.at.format("D MMM, h:mm A")})`.trim(),
    score: Math.round(p.score),
  }));

export const WINDOW_DAYS = 14;

const inWindow = (points: HistoryPoint[]): HistoryPoint[] => {
  const start = dayjs().startOf("day").subtract(WINDOW_DAYS - 1, "day");
  return points.filter((p) => !p.at.isBefore(start));
};

export type DayPoint = { label: string; date: string; count: number; avg: number | null };

/** One entry per calendar day of the last 14 (zero-filled), with the day's count and average score. */
export const buildDaily = (points: HistoryPoint[]): DayPoint[] => {
  const recent = inWindow(points);
  const today = dayjs().startOf("day");
  return Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const day = today.subtract(WINDOW_DAYS - 1 - i, "day");
    const key = day.format("YYYY-MM-DD");
    const rows = recent.filter((p) => p.at.format("YYYY-MM-DD") === key);
    const avg = rows.length ? rows.reduce((sum, p) => sum + p.score, 0) / rows.length : null;
    return { label: day.format("D MMM"), date: key, count: rows.length, avg: avg === null ? null : Math.round(avg) };
  });
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type WeekdayPoint = { day: string; analyses: number; avgRisk: number };

/** Average risk per day of the week, only for days that have analyses. */
export const buildWeekday = (points: HistoryPoint[]): WeekdayPoint[] => {
  const buckets = WEEKDAYS.map((day) => ({ day, analyses: 0, total: 0 }));
  points.forEach((p) => {
    const bucket = buckets[p.at.day()];
    bucket.analyses += 1;
    bucket.total += p.score;
  });
  return buckets
    .filter((b) => b.analyses > 0)
    .map((b) => ({ day: b.day, analyses: b.analyses, avgRisk: Math.round(b.total / b.analyses) }));
};

export type SeverityGroup = { label: string; counts: Record<SafetySeverity, number> };

export const SEVERITY_GROUP_SIZE = 5;

/** Reports (oldest first) in consecutive groups of 5, counted per severity. */
export const buildSeverityTrend = (points: HistoryPoint[]): SeverityGroup[] => {
  const sorted = points.filter((p) => p.severity);
  const groups: SeverityGroup[] = [];
  for (let i = 0; i < sorted.length; i += SEVERITY_GROUP_SIZE) {
    const chunk = sorted.slice(i, i + SEVERITY_GROUP_SIZE);
    const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0])) as Record<SafetySeverity, number>;
    chunk.forEach((p) => {
      if (p.severity) counts[p.severity] += 1;
    });
    groups.push({ label: `${i + 1}-${i + chunk.length}`, counts });
  }
  return groups;
};

/** Y-axis config for a count axis: whole numbers only, no fractional ticks on small totals. */
export const countAxis = (maxValue: number) => {
  const max = Math.max(1, Math.ceil(maxValue));
  return max <= 5
    ? { min: 0, max, tickAmount: max, decimalsInFloat: 0 }
    : { min: 0, forceNiceScale: true, decimalsInFloat: 0 };
};
