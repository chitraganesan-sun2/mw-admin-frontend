import dayjs from "dayjs";

// Same style as formatDisplayDate in utils/moment.ts ("29 Oct 2026"), plus the time, for tables
// where the moment matters. Kept in its own file so it has no plugin imports and is easy to test.
export const DISPLAY_DATE_TIME_FORMAT = "DD MMM YYYY, h:mm A";

export const formatDisplayDateTime = (value?: string | number | Date | null): string => {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format(DISPLAY_DATE_TIME_FORMAT) : "-";
};
