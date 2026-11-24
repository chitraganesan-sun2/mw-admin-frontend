import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * The in-page heading block every module uses (promoted from the Safety Monitoring header). The shell's H1
 * already names the module, so this is an H2 and only worth rendering when it adds information: a more specific
 * title, a one-line description (14px, max ~640px), and the page's actions on the right.
 */
const PageHeader = ({
  title,
  description,
  actions,
  status,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** A live indicator shown beside the actions. */
  status?: ReactNode;
  className?: string;
}) => {
  if (!title && !description && !actions && !status) return null;
  return (
    <header className={clsx("flex flex-wrap items-start justify-between gap-x-4 gap-y-3", className)}>
      <div className="min-w-0">
        {title ? <h2 className="m-0 text-xl font-semibold text-ink">{title}</h2> : null}
        {description ? <p className="m-0 mt-1 max-w-2xl text-sm text-ink-2">{description}</p> : null}
      </div>
      {actions || status ? (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {status}
          {actions}
        </div>
      ) : null}
    </header>
  );
};

export default PageHeader;
