import clsx from "clsx";
import type { ElementType, ReactNode } from "react";

/** The module's one card: the portal's `rounded-2xl border-stroke bg-white`, with an optional title row. */
export const Panel = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  as: Tag = "section",
  id,
  "aria-label": ariaLabel,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: ElementType;
  id?: string;
  "aria-label"?: string;
}) => {
  const headingId = id && title ? `${id}-heading` : undefined;
  return (
    <Tag
      id={id}
      aria-label={!headingId ? ariaLabel : undefined}
      aria-labelledby={headingId}
      className={clsx("min-w-0 rounded-2xl border border-stroke bg-white", className)}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            {title ? (
              <h3 id={headingId} className="m-0 text-base font-semibold text-dark">
                {title}
              </h3>
            ) : null}
            {description ? <p className="m-0 mt-0.5 text-sm text-[#4F4F4F]">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={clsx("p-4 sm:p-5", title || actions ? "pt-3 sm:pt-4" : "", bodyClassName)}>{children}</div>
    </Tag>
  );
};
