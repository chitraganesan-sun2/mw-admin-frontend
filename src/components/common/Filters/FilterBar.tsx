import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * The toolbar that sits directly above a table: search and filters on the left (40px controls, 12px gaps),
 * the page's actions (export, refresh, add) right-aligned. One pattern for every list page.
 */
const FilterBar = ({
  children,
  actions,
  className,
}: {
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) => (
  <div className={clsx("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
    <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">{children}</div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

/** A labelled control inside a FilterBar (12/500 label above, as in Safety Monitoring). */
export const FilterField = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <label className={clsx("flex flex-col gap-1", className)}>
    <span className="text-xs font-medium text-ink-2">{label}</span>
    {children}
  </label>
);

export default FilterBar;
