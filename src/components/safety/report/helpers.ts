// Normalising and deriving from a safety report. The detection pipeline sends findings and evidence in
// a few slightly different shapes (flat `is_negated` vs `is_negation`, nested `ml` / `filters` /
// `scoring` objects vs flat `ml_label`, upper vs lower case severities), so every screen reads them
// through toFinding() rather than touching the raw records.

import { SEVERITY_ORDER, severityRank } from "../severity";

export type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && !!s.trim()) : []);

/** "MEDIUM" / "moderate" / "critical" -> the shared SafetySeverity casing; null when unknown. */
export const normalizeSeverity = (value: unknown): SafetySeverity | null => {
  const key = String(value ?? "").trim().toLowerCase();
  if (key === "medium") return "Moderate";
  const rank = severityRank(key);
  return rank >= 0 ? SEVERITY_ORDER[rank] : null;
};

export interface FindingMl {
  topLabel?: string;
  topConfidence?: number;
  riskScore?: number;
  agreement: boolean | null;
  disagreement: boolean;
  allScores: Record<string, number>;
  matchedLabels: string[];
}

export interface ReportFinding {
  key: string;
  categories: string[];
  text: string;
  confidence: number; // 0..1
  severity: SafetySeverity | null;
  contextType: string | null;
  speaker?: string;
  timestamp?: number; // seconds into the media / sentence index; undefined when not a usable offset
  matchedText?: string;
  matchedSentences: string[];
  isJoke: boolean;
  isNegation: boolean;
  jokePenalty: number;
  negationPenalty: number;
  baseConfidence?: number;
  contextMultiplier?: number;
  mlFusedConfidence?: number;
  patternCount?: number;
  phase?: "early" | "middle" | "late";
  ml: FindingMl | null;
}

/** A transcript-only analysis stamps some items with wall-clock epoch seconds; those aren't offsets. */
export const mediaOffset = (value: unknown): number | undefined => {
  const n = num(value);
  return n !== undefined && n >= 0 && n < 1_000_000 ? n : undefined;
};

const toMl = (raw: Obj): FindingMl | null => {
  const nested = isObj(raw.ml) ? raw.ml : isObj(raw.ml_result) ? raw.ml_result : null;
  if (nested) {
    if (nested.error) return null;
    const scores: Record<string, number> = {};
    if (isObj(nested.all_scores)) {
      Object.entries(nested.all_scores).forEach(([label, score]) => {
        const n = num(score);
        if (n !== undefined) scores[label] = n;
      });
    }
    return {
      topLabel: str(nested.top_label),
      topConfidence: num(nested.top_confidence),
      riskScore: num(nested.ml_risk_score),
      agreement: typeof nested.agreement === "boolean" ? nested.agreement : null,
      disagreement: nested.disagreement_flag === true,
      allScores: scores,
      matchedLabels: strList(nested.matched_labels),
    };
  }
  // Flat form used by the stored findings.
  if (raw.ml_label == null && raw.ml_confidence == null && raw.ml_agreement == null) return null;
  return {
    topLabel: str(raw.ml_label),
    topConfidence: num(raw.ml_confidence),
    agreement: typeof raw.ml_agreement === "boolean" ? raw.ml_agreement : null,
    disagreement: raw.ml_agreement === false,
    allScores: {},
    matchedLabels: [],
    riskScore: undefined,
  };
};

const toPhase = (value: unknown): ReportFinding["phase"] => {
  const v = String(value ?? "").toLowerCase();
  return v === "early" || v === "middle" || v === "late" ? v : undefined;
};

export const toFinding = (raw: Obj, index: number): ReportFinding => {
  const filters = isObj(raw.filters) ? raw.filters : {};
  const scoring = isObj(raw.scoring) ? raw.scoring : {};
  const context = isObj(raw.context) ? raw.context : {};
  const categories = strList(raw.categories);
  const single = str(raw.category);
  if (!categories.length && single) categories.push(single);

  const isJoke = (filters.is_joke ?? raw.is_joke) === true;
  const isNegation = (filters.is_negated ?? raw.is_negated ?? raw.is_negation) === true;
  const contextType = str(raw.context_type) ?? str(context.primary) ?? null;

  return {
    key: `${index}`,
    categories,
    text: str(raw.evidence) ?? str(raw.text) ?? "",
    confidence: num(raw.confidence) ?? num(raw.max_confidence) ?? 0,
    severity: normalizeSeverity(raw.severity),
    contextType,
    speaker: str(raw.speaker),
    timestamp: mediaOffset(raw.timestamp),
    matchedText: str(raw.matched_text),
    matchedSentences: strList(raw.matched_sentences),
    isJoke,
    isNegation,
    jokePenalty: num(filters.joke_score) ?? num(raw.joke_penalty) ?? 0,
    negationPenalty: num(filters.negation_score) ?? num(raw.negation_penalty) ?? 0,
    baseConfidence: num(scoring.base_confidence) ?? num(raw.base_confidence),
    contextMultiplier: num(scoring.context_multiplier) ?? num(raw.context_multiplier),
    mlFusedConfidence: num(scoring.ml_fused_confidence),
    patternCount: num(raw.pattern_count),
    phase: toPhase(isObj(raw.temporal) ? raw.temporal.phase : undefined),
    ml: toMl(raw),
  };
};

export const toFindings = (rows: unknown): ReportFinding[] =>
  (Array.isArray(rows) ? rows : []).filter(isObj).map((row, i) => toFinding(row, i));

export const isNeutralContext = (context: string | null | undefined): boolean =>
  !context || context.toLowerCase() === "neutral";

// ── Formatting ───────────────────────────────────────────────────────────────

export const fmtPct = (value?: number | null, digits = 1): string =>
  typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "-";

export const fmtSeconds = (value?: number | null): string =>
  typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)}s` : "-";

/** Score colour for a 0..100 value (same bands as the pipeline's severity levels). */
export const scoreSeverity = (score?: number | null): SafetySeverity => {
  const s = typeof score === "number" ? score : 0;
  if (s >= 81) return "Critical";
  if (s >= 61) return "High";
  if (s >= 41) return "Moderate";
  if (s >= 21) return "Low";
  return "Safe";
};

/** Confidence (0..1) coloured on the same scale as a 0..100 score. */
export const confidenceSeverity = (confidence: number): SafetySeverity => scoreSeverity(confidence * 100);

// ── Filtering / sorting (shared by the Findings and Evidence tabs) ───────────

export type FlagFilter = "all" | "high_conf" | "joke" | "negation";
export type SortKey = "original" | "confidence" | "severity" | "time";

export interface FindingFilters {
  search: string;
  category: string; // "all" or a lower-case category
  severity: string; // "all" or a SafetySeverity
  flag: FlagFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: FindingFilters = { search: "", category: "all", severity: "all", flag: "all", sort: "original" };

export const HIGH_CONFIDENCE = 0.75;

export const uniqueCategories = (findings: ReportFinding[]): string[] =>
  Array.from(new Set(findings.flatMap((f) => f.categories.map((c) => c.toLowerCase())))).sort();

export const filterFindings = (findings: ReportFinding[], filters: FindingFilters): ReportFinding[] => {
  const needle = filters.search.trim().toLowerCase();
  const filtered = findings.filter((f) => {
    if (filters.category !== "all" && !f.categories.some((c) => c.toLowerCase() === filters.category)) return false;
    if (filters.severity !== "all" && f.severity !== filters.severity) return false;
    if (filters.flag === "joke" && !f.isJoke) return false;
    if (filters.flag === "negation" && !f.isNegation) return false;
    if (filters.flag === "high_conf" && f.confidence < HIGH_CONFIDENCE) return false;
    if (needle) {
      const haystack = [f.text, f.matchedText ?? "", f.speaker ?? "", ...f.matchedSentences].join(" ").toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
  if (filters.sort === "original") return filtered;
  const sorted = [...filtered];
  if (filters.sort === "confidence") sorted.sort((a, b) => b.confidence - a.confidence);
  if (filters.sort === "severity") {
    sorted.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.confidence - a.confidence);
  }
  if (filters.sort === "time") sorted.sort((a, b) => (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity));
  return sorted;
};

// ── Score calculation ────────────────────────────────────────────────────────
// The API returns the final score but not how it was reached. These are the pipeline's category weights
// and diminishing-returns factors (backend/modules/risk_scorer.py); the breakdown below is rebuilt from
// the listed findings with them, so it is an explanation of the score, not a second source of truth.

export const CATEGORY_WEIGHTS: Record<string, number> = {
  meeting: 20,
  address: 20,
  secrecy: 15,
  parent_monitoring: 15,
  school: 10,
  routine: 10,
  video_call: 10,
  manipulation: 10,
  trust_building: 5,
  relationship_building: 5,
  explicit_content: 25,
  bad_language: 8,
  personal_information: 18,
  gift_bribery: 12,
  isolation: 16,
  desensitization: 14,
  emotional_exploitation: 18,
  threats_coercion: 22,
  gaming_luring: 10,
  age_deception: 14,
};
export const DEFAULT_CATEGORY_WEIGHT = 5;
const DIMINISHING_RETURNS = [1, 0.5, 0.25, 0.125, 0.0625];

export interface ScoreRow {
  category: string;
  weight: number;
  count: number;
  avgConfidence: number;
  points: number;
}

export const buildScoreBreakdown = (findings: ReportFinding[]): { rows: ScoreRow[]; rawTotal: number } => {
  const byCategory = new Map<string, number[]>();
  findings.forEach((f) => {
    // A finding with no usable confidence counts as 0.5, as the pipeline does.
    const confidence = f.confidence > 0 ? f.confidence : 0.5;
    f.categories.forEach((category) => {
      byCategory.set(category, [...(byCategory.get(category) ?? []), confidence]);
    });
  });

  const rows: ScoreRow[] = [];
  byCategory.forEach((confidences, category) => {
    const weight = CATEGORY_WEIGHTS[category] ?? DEFAULT_CATEGORY_WEIGHT;
    const sorted = [...confidences].sort((a, b) => b - a);
    let points = 0;
    sorted.forEach((confidence, i) => {
      const last = DIMINISHING_RETURNS.length - 1;
      const factor = i <= last ? DIMINISHING_RETURNS[i] : DIMINISHING_RETURNS[last] / 2 ** (i - last);
      points += weight * confidence * factor;
    });
    rows.push({
      category,
      weight,
      count: sorted.length,
      avgConfidence: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      points,
    });
  });
  rows.sort((a, b) => b.points - a.points);
  return { rows, rawTotal: rows.reduce((sum, r) => sum + r.points, 0) };
};

// ── Stats ────────────────────────────────────────────────────────────────────

export interface ConfidenceBucket {
  range: string;
  count: number;
}

export const CONFIDENCE_RANGES = ["0-25", "25-50", "50-75", "75-100"];

export const buildConfidenceHistogram = (findings: ReportFinding[], fromStats?: unknown): ConfidenceBucket[] => {
  if (isObj(fromStats)) {
    const buckets = Object.entries(fromStats).flatMap(([range, count]) => {
      const n = num(count);
      return n === undefined ? [] : [{ range, count: n }];
    });
    if (buckets.length) return buckets;
  }
  const counts = [0, 0, 0, 0];
  findings.forEach((f) => {
    const pct = f.confidence * 100;
    counts[pct <= 25 ? 0 : pct <= 50 ? 1 : pct <= 75 ? 2 : 3] += 1;
  });
  return CONFIDENCE_RANGES.map((range, i) => ({ range, count: counts[i] }));
};

export interface MlAgreement {
  agreed: number;
  disagreed: number;
  noSignal: number;
  rate: number | null;
}

/** ML-vs-regex agreement; null when the classifier produced nothing for this report. */
export const buildMlAgreement = (findings: ReportFinding[], mlStats?: unknown): MlAgreement | null => {
  if (isObj(mlStats)) {
    const total = num(mlStats.total_with_ml) ?? 0;
    const agreed = num(mlStats.agreed) ?? 0;
    const disagreed = num(mlStats.disagreed) ?? 0;
    if (total > 0) {
      return {
        agreed,
        disagreed,
        noSignal: Math.max(0, total - agreed - disagreed),
        rate: num(mlStats.agreement_rate) ?? (agreed + disagreed > 0 ? agreed / (agreed + disagreed) : null),
      };
    }
  }
  const withMl = findings.filter((f) => f.ml);
  if (!withMl.length) return null;
  const agreed = withMl.filter((f) => f.ml?.agreement === true).length;
  const disagreed = withMl.filter((f) => f.ml?.disagreement).length;
  const noSignal = withMl.filter((f) => f.ml?.agreement == null && !f.ml?.disagreement).length;
  return { agreed, disagreed, noSignal, rate: agreed + disagreed > 0 ? agreed / (agreed + disagreed) : null };
};

export const numericRecord = (value: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (isObj(value)) {
    Object.entries(value).forEach(([k, v]) => {
      const n = num(v);
      if (n !== undefined) out[k] = n;
    });
  }
  return out;
};

/** Stats keys with their own charts/cards; whatever is left is listed in "All statistics". */
export const CHARTED_STAT_KEYS = [
  "category_breakdown",
  "categories",
  "severity_distribution",
  "context_type_distribution",
  "confidence_histogram",
  "ml_stats",
  "findings_timeline",
  "confidence_stats",
];

/** Does `needle` (a possibly truncated evidence quote) appear in `text`? Empty needles never match. */
export const textContains = (text: string, needle: string): boolean => {
  const n = needle.trim().toLowerCase();
  return n.length > 0 && text.toLowerCase().includes(n);
};

// ── Whole-report model ───────────────────────────────────────────────────────

export interface ReportModel {
  findings: ReportFinding[];
  evidence: ReportFinding[];
  timeline: SafetyTimelineSegment[];
  stats: Obj;
  /** Findings per category, most frequent first. */
  categoryCounts: { category: string; count: number }[];
}

export const buildReportModel = (report: SafetyReport): ReportModel => {
  const findings = toFindings(report.findings);
  const evidence = toFindings(report.evidence);
  const stats: Obj = isObj(report.stats) ? (report.stats as Obj) : {};

  let counts = numericRecord(stats.categories ?? stats.category_breakdown);
  if (!Object.keys(counts).length) {
    counts = {};
    findings.forEach((f) => f.categories.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1)));
  }
  const categoryCounts = Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    findings,
    evidence,
    timeline: Array.isArray(report.timeline) ? report.timeline : [],
    stats,
    categoryCounts,
  };
};
