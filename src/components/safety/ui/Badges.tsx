import clsx from "clsx";
import { FiAlertCircle, FiCheck, FiX } from "react-icons/fi";
import { SEVERITY_TONE, STATUS_LABELS, isSafetySeverity, riskSeverity } from "../severity";

// The one way a severity or an analysis status is drawn anywhere in Safety Monitoring, so a "High" and an
// "Analysing" look the same on the list, the report, the comparison and the Drive page.

export const SeverityBadge = ({ severity, className }: { severity?: string | null; className?: string }) => {
  if (!isSafetySeverity(severity)) {
    return (
      <span className="text-[#4F4F4F]" aria-label="Not rated">
        –
      </span>
    );
  }
  const tone = SEVERITY_TONE[severity];
  const strong = severity === "High" || severity === "Critical";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs",
        strong ? "font-semibold" : "font-medium",
        className
      )}
      style={{ background: tone.bg, borderColor: tone.border, color: tone.text }}
    >
      {strong ? (
        <FiAlertCircle size={12} aria-hidden />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} aria-hidden />
      )}
      {severity}
    </span>
  );
};

const STATUS_STYLE: Record<string, string> = {
  PROCESSING: "border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]",
  COMPLETED: "border-stroke bg-white text-[#374151]",
  FAILED: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
};

export const StatusBadge = ({ status, className }: { status?: string | null; className?: string }) => {
  const key = String(status ?? "").toUpperCase();
  const label = STATUS_LABELS[key]?.label ?? (status || "Unknown");
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLE[key] ?? "border-stroke bg-white text-[#4F4F4F]",
        className
      )}
    >
      {key === "PROCESSING" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-[#0EA5E9] motion-safe:animate-pulse" aria-hidden />
      ) : key === "COMPLETED" ? (
        <FiCheck size={12} className="text-[#059669]" aria-hidden />
      ) : key === "FAILED" ? (
        <FiX size={12} aria-hidden />
      ) : null}
      {label}
    </span>
  );
};

/** A 0..100 risk score as a short bar and a number, coloured by the pipeline's score bands. */
export const RiskMeter = ({
  score,
  className,
  barClassName = "w-16",
}: {
  score?: number | null;
  className?: string;
  barClassName?: string;
}) => {
  const band = riskSeverity(score);
  const tone = band ? SEVERITY_TONE[band] : null;
  const has = typeof score === "number" && Number.isFinite(score);
  return (
    <div
      className={clsx("flex items-center gap-2", className)}
      role="img"
      aria-label={has ? `Risk score ${Math.round(score as number)} out of 100` : "No risk score yet"}
    >
      <div className={clsx("h-1.5 shrink-0 overflow-hidden rounded-full bg-[#EEF1F5]", barClassName)} aria-hidden>
        {has && tone ? (
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(2, score as number))}%`, background: tone.dot }}
          />
        ) : null}
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color: tone?.text ?? "#6B7280" }} aria-hidden>
        {has ? Math.round(score as number) : "–"}
      </span>
    </div>
  );
};
