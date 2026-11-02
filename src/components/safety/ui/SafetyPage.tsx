import type { ReactNode } from "react";
import { ConfigProvider } from "antd";
import type { ThemeConfig } from "antd";
import SafetyTabs from "../SafetyTabs";

// antd tokens for Safety Monitoring only (other modules keep their own look): the portal's cyan primary with
// dark text, rounder corners, calmer table headers and 40px controls that are comfortable to tap.
export const SAFETY_THEME: ThemeConfig = {
  token: {
    colorPrimary: "#09BAEE",
    colorLink: "#046A8A",
    colorLinkHover: "#09BAEE",
    colorText: "#121212",
    colorTextSecondary: "#4F4F4F",
    colorBorder: "#E0E0E0",
    borderRadius: 12,
    controlHeight: 40,
    controlHeightSM: 32,
    fontFamily: "inherit",
  },
  components: {
    Button: { primaryColor: "#121212", primaryShadow: "none", defaultShadow: "none", fontWeight: 500 },
    Table: {
      headerBg: "#F8FAFC",
      headerColor: "#374151",
      headerSplitColor: "transparent",
      rowHoverBg: "#F5FBFE",
      borderColor: "#EEF1F5",
      cellPaddingBlock: 12,
      cellPaddingInline: 12,
    },
    Pagination: { itemActiveBg: "#E0F7FE" },
    Segmented: { itemSelectedBg: "#09BAEE", itemSelectedColor: "#121212", trackBg: "#EEF1F5", itemColor: "#4F4F4F" },
    Select: { optionSelectedBg: "#E0F7FE" },
  },
};

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
  <ConfigProvider theme={SAFETY_THEME}>
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
  </ConfigProvider>
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
