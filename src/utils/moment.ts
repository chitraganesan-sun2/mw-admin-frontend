import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

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

// One display format for dates across the admin console. Tables used three ("28 Sep
// 2026", "28th Sep, 2026", "28-Sep-2026"), two of them force-lowercased ("28th sep, 2026").
export const DISPLAY_DATE_FORMAT = "DD MMM YYYY";
export const formatDisplayDate = (value?: string | number | Date | null): string => {
    if (!value) return "-";
    const d = dayjs(value);
    return d.isValid() ? d.format(DISPLAY_DATE_FORMAT) : "-";
};
