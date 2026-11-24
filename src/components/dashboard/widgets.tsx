import Link from "next/link";
import type { ReactNode } from "react";

const formatNumber = (value: number) => value.toLocaleString("en-US");
const formatMoney = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="mb-8" aria-label={title}>
    <div className="flex flex-wrap items-baseline gap-x-3 mb-3">
      <h2 className="text-lg font-semibold text-dark">{title}</h2>
      {hint ? <span className="text-sm text-ink-2">{hint}</span> : null}
    </div>
    {children}
  </section>
);

// Queues where a waiting item is a safety or wellbeing matter get the danger tone, so they don't look like routine paperwork.
const DANGER_QUEUES = new Set(["safety_high_risk", "member_reports"]);

// One queue (e.g. "Volunteer applications to review"). Colour marks work waiting, but the words
// ("All clear" / the number) carry the meaning too.
export const AttentionCard = ({ item }: { item: DashboardAttentionItem }) => {
  const waiting = item.count > 0;
  const danger = waiting && DANGER_QUEUES.has(item.key);
  return (
    <Link
      href={item.href}
      className={`block rounded-2xl p-4 sm:p-5 border transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-ink ${
        danger ? "border-error bg-error-light/40" : waiting ? "border-primary bg-white" : "border-stroke bg-white"
      }`}
    >
      <div className={`text-3xl sm:text-4xl font-semibold ${danger ? "text-error" : waiting ? "text-dark" : "text-ink-2"}`}>{formatNumber(item.count)}</div>
      <div className="mt-1 text-sm text-dark">{item.label}</div>
      <div className={`mt-3 text-xs font-medium ${danger ? "text-error" : waiting ? "text-brand-ink" : "text-success"}`}>
        {waiting ? "Review now →" : "All clear"}
      </div>
    </Link>
  );
};

export const StatCard = ({
  label,
  value,
  detail,
  href,
  compact = false,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  /** For a value that is a short phrase rather than a number ("All delivered", "-"): drawn at heading size, not display size. */
  compact?: boolean;
}) => {
  const body = (
    <>
      {/* Two lines are reserved for the label so a long one ("Careers applications, last 7 days") doesn't push its value lower than its neighbours. */}
      <div className="min-h-8 text-xs uppercase font-medium text-ink-2 tracking-wide">{label}</div>
      <div className={`mt-2 font-semibold text-dark break-words ${compact ? "text-lg leading-8 sm:text-xl" : "text-2xl sm:text-3xl"}`}>{value}</div>
      <div className="mt-1 min-h-5 text-sm text-ink-2">{detail ?? "\u00A0"}</div>
    </>
  );
  const base = "block rounded-2xl p-4 sm:p-5 bg-white border border-stroke";
  return href ? (
    <Link href={href} className={`${base} hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-ink`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
};

export const plural = (count: number, one: string, many = `${one}s`) => `${formatNumber(count)} ${count === 1 ? one : many}`;
export { formatNumber, formatMoney };