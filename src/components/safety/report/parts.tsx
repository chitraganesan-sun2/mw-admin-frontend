import type { ReactNode } from "react";
import clsx from "clsx";
import { Button, Result } from "antd";
import Link from "next/link";
import { SEVERITY_COLORS } from "../severity";
import { categoryLabel } from "../severity";
import { confidenceSeverity, fmtPct } from "./helpers";

/** White rounded section used by every tab. */
export function Panel({
  title,
  icon,
  extra,
  children,
  className,
}: {
  title?: string;
  icon?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("bg-white rounded-xl border border-gray-100 p-5 min-w-0", className)}>
      {(title || extra) && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {icon}
          {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
          {extra && <div className="ml-auto">{extra}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Label/value line used in the detail grids. */
export function DetailRow({ label, children, strong = true }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className={clsx("text-right text-gray-800 break-words min-w-0", strong && "font-semibold")}>{children}</span>
    </div>
  );
}

/** Horizontal 0..1 bar with a percentage label. */
export function ConfidenceBar({ value, label }: { value: number; label?: string }) {
  const color = SEVERITY_COLORS[confidenceSeverity(value)].hex;
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <div
      className="relative h-5 rounded-full bg-gray-100 overflow-hidden"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label ?? "Confidence"}
    >
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.85 }} />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
        {fmtPct(value)}
      </span>
    </div>
  );
}

/** Small rounded label; `tone` picks a colour family. */
export function Pill({
  children,
  tone = "gray",
  title,
}: {
  children: ReactNode;
  tone?: "gray" | "blue" | "red" | "amber" | "green" | "purple";
  title?: string;
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span title={title} className={clsx("inline-block px-2 py-0.5 rounded-full text-xs font-medium border", tones[tone])}>
      {children}
    </span>
  );
}

export function CategoryPills({ categories }: { categories: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {categories.map((c) => (
        <Pill key={c} tone="blue">
          {categoryLabel(c)}
        </Pill>
      ))}
    </span>
  );
}

/** Empty / "nothing matches" state inside a tab. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">{children}</div>;
}

/** Whole-page problem (report not found, load failed) with the way back. */
export function PageProblem({
  status,
  title,
  subTitle,
  onRetry,
}: {
  status: "404" | "error";
  title: string;
  subTitle: string;
  onRetry?: () => void;
}) {
  return (
    <Result
      status={status}
      title={title}
      subTitle={subTitle}
      extra={[
        onRetry && (
          <Button key="retry" onClick={onRetry}>
            Try again
          </Button>
        ),
        <Link key="back" href="/safety">
          <Button type="primary">Back to reports</Button>
        </Link>,
      ]}
    />
  );
}
