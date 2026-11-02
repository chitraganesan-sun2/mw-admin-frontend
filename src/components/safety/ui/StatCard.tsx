import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { SEVERITY_TONE } from "../severity";

type Tone = "neutral" | "info" | "good" | "warn" | "danger";

const TONES: Record<Tone, { chipBg: string; chipFg: string }> = {
  neutral: { chipBg: "#F3F4F6", chipFg: "#4B5563" },
  info: { chipBg: "#E0F2FE", chipFg: "#0369A1" },
  good: { chipBg: SEVERITY_TONE.Safe.bg, chipFg: SEVERITY_TONE.Safe.text },
  warn: { chipBg: SEVERITY_TONE.High.bg, chipFg: SEVERITY_TONE.High.text },
  danger: { chipBg: SEVERITY_TONE.Critical.bg, chipFg: SEVERITY_TONE.Critical.text },
};

/**
 * One KPI figure. The number is always dark neutral text (readable and calm); the tone lives in the icon chip
 * and, when `emphasis` is set (work waiting for a human), in the border, so attention is drawn without colouring
 * every figure on the page.
 */
export const StatCard = ({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  emphasis = false,
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  emphasis?: boolean;
  href?: string;
  className?: string;
}) => {
  const t = TONES[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-xs font-medium leading-snug text-[#4F4F4F] sm:text-sm">{label}</span>
        {icon ? (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: t.chipBg, color: t.chipFg }}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums text-dark sm:text-[1.75rem] sm:leading-9">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-[#6B7280]">{hint}</div> : null}
    </>
  );
  const base = clsx(
    "block min-w-0 rounded-2xl border bg-white p-3.5 sm:p-4",
    emphasis ? "border-[#FED7AA] bg-[#FFFBF7]" : "border-stroke",
    className
  );
  return href ? (
    <Link
      href={href}
      className={clsx(base, "transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary")}
    >
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
};
