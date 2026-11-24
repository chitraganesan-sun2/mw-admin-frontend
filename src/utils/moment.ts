import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { serverDayjs } from "./displayDateTime";

dayjs.extend(customParseFormat);

// null for a missing/unparseable DOB: dayjs(undefined) is "now", so a learner with no DOB
// used to show as "Less than 1 year" old.
export const calculateAge = (dob?: string | null): number | null => {
    if (!dob) return null;
    const parsed = dayjs(dob, "DD-MM-YYYY", true).isValid()
        ? dayjs(dob, "DD-MM-YYYY", true)
        : dayjs(dob);
    if (!parsed.isValid()) return null;
    const age = dayjs().diff(parsed, "year");
    return age < 1 ? 0 : age;
};

// Profile-view label: "26 years", "1 year", "Less than 1 year", or "-" with no usable DOB.
export const formatAge = (dob?: string | null): string => {
    const age = calculateAge(dob);
    if (age === null) return "-";
    if (age === 0) return "Less than 1 year";
    return `${age} ${age === 1 ? "year" : "years"}`;
};

// One display format for dates across the admin console. Tables used three ("28 Sep
// 2026", "28th Sep, 2026", "28-Sep-2026"), two of them force-lowercased ("28th sep, 2026").
export const DISPLAY_DATE_FORMAT = "DD MMM YYYY";
// Zone-less backend timestamps are UTC (see parseServerDate); the date shown is the viewer's local one.
export const formatDisplayDate = (value?: string | number | Date | null): string => {
    const d = serverDayjs(value);
    return d.isValid() ? d.format(DISPLAY_DATE_FORMAT) : "-";
};
