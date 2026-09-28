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
