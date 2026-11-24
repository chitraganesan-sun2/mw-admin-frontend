import dayjs from "dayjs";

// Same style as formatDisplayDate in utils/moment.ts ("29 Oct 2026"), plus the time, for tables
// where the moment matters. Kept in its own file so it has no plugin imports and is easy to test.
export const DISPLAY_DATE_TIME_FORMAT = "DD MMM YYYY, h:mm A";

// Date-time with no zone designator: "2026-11-24T05:02:33.062510" or "2026-11-24 05:02:33".
// The backend writes many timestamps as naive UTC (str(datetime.utcnow())); dayjs()/Date()
// would read these as the browser's local time, so every instant shifted by the viewer's
// UTC offset. Date-only strings ("2026-11-24") are calendar dates, not instants, and are left alone.
const NAIVE_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * Parse a backend timestamp into a Date. A string with no zone is treated as UTC; strings with an
 * offset or "Z", numbers and Dates are taken as they are. Returns null when unparseable.
 */
export const parseServerDate = (value?: string | number | Date | null): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  let d: Date;
  if (typeof value === "string") {
    const s = value.trim();
    d = NAIVE_DATE_TIME.test(s) ? new Date(`${s.replace(" ", "T")}Z`) : new Date(s);
  } else {
    d = new Date(value);
  }
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Epoch ms of a backend timestamp (naive strings read as UTC), or NaN. */
export const serverTimeMs = (value?: string | number | Date | null): number => parseServerDate(value)?.getTime() ?? NaN;

/** dayjs in the viewer's local zone for a backend timestamp; an invalid dayjs when unparseable. */
export const serverDayjs = (value?: string | number | Date | null): dayjs.Dayjs => {
  const d = parseServerDate(value);
  return d ? dayjs(d) : dayjs(NaN);
};

export const formatDisplayDateTime = (value?: string | number | Date | null): string => {
  const d = serverDayjs(value);
  return d.isValid() ? d.format(DISPLAY_DATE_TIME_FORMAT) : "-";
};
