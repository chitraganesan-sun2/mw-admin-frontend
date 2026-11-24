import clsx from "clsx";
import type { ReactNode } from "react";
import { FiInbox } from "react-icons/fi";

/**
 * One empty / "nothing here" block (promoted from the Safety Monitoring "No reports yet" state): an icon, a
 * title, one line saying why and what to do, and an optional action. `compact` is for inside a table or card.
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) => (
  <div
    role="status"
    className={clsx("flex flex-col items-center gap-2 text-center", compact ? "py-8" : "py-16", className)}
  >
    <span className="text-3xl text-ink-3" aria-hidden>
      {icon ?? <FiInbox />}
    </span>
    <p className="m-0 text-base font-medium text-ink">{title}</p>
    {description ? <p className="m-0 max-w-sm text-sm text-ink-2">{description}</p> : null}
    {action ? <div className="mt-1">{action}</div> : null}
  </div>
);

export default EmptyState;
