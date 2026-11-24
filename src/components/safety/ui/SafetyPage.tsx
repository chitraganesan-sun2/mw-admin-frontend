import type { ReactNode } from "react";
import SafetyTabs from "../SafetyTabs";

/**
 * The frame every Safety Monitoring screen sits in: the same width, padding, section tabs and page heading, so
 * moving between Reports, New analysis, Analytics, Compare and Google Drive never shifts the layout. (The
 * shell's own header already carries the module's H1, so each screen's title is an H2.)
 */
export const SafetyPage = ({
  title,
  description,
  actions,
  status,
  children,
  showTabs = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Live indicator shown beside the actions (e.g. "Monitoring active"). */
  status?: ReactNode;
  children: ReactNode;
  showTabs?: boolean;
}) => (
  <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 pb-10 sm:gap-5 sm:p-6 sm:pb-12">
    {showTabs ? <SafetyTabs /> : null}
    {title || actions || status ? (
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          {title ? <h2 className="m-0 text-xl font-semibold text-dark sm:text-2xl">{title}</h2> : null}
          {description ? <p className="m-0 mt-1 max-w-2xl text-sm text-[#4F4F4F]">{description}</p> : null}
        </div>
        {actions || status ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {status}
            {actions}
          </div>
        ) : null}
      </header>
    ) : null}
    {children}
  </div>
);

/** "Monitoring active" / "Analysing 3…" — a small live-status chip for the page header. */
export const LiveStatus = ({
  analysing,
  updatedAt,
}: {
  analysing: number;
  updatedAt?: string | null;
}) => (
  <span
    role="status"
    className="inline-flex items-center gap-2 rounded-full border border-stroke bg-white px-3 py-1.5 text-xs text-[#4F4F4F]"
  >
    <span
      className={`h-2 w-2 rounded-full ${analysing > 0 ? "bg-[#0EA5E9] motion-safe:animate-pulse" : "bg-[#10B981]"}`}
      aria-hidden
    />
    <span className="font-medium text-dark">
      {analysing > 0 ? `${analysing} ${analysing === 1 ? "analysis" : "analyses"} running` : "Monitoring active"}
    </span>
    {updatedAt ? <span className="hidden sm:inline">· updated {updatedAt}</span> : null}
  </span>
);
