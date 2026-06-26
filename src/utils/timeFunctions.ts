import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

type UserTimeZoneProps = {
    date: string;
    timeZone?: string;
    format?: string;
};

const localTimeZone = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || dayjs.tz.guess();

export const timesAgo = (date: string) => {
    if (!date) return "";
    const createdAt = dayjs.utc(date).local();
    const diffInMinutes = dayjs().diff(createdAt, "minute");

    if (diffInMinutes < 1) return "Just now";

    let timeString = createdAt.fromNow(true)
        .replace(/^an /, "1 ")
        .replace(/^a /, "1 ")
        .replace("minutes", "mins")
        .replace("minute", "min")
        .replace("hours", "hrs")
        .replace("hour", "hr")
        .replace("seconds", "secs")
        .replace("second", "sec");

    return `${timeString} ago`;
};

export const toUserTimeZone = ({
    date,
    timeZone = localTimeZone,
    format = "YYYY-MM-DD HH:mm:ss",
}: UserTimeZoneProps) => {
    if (!date) return "";
    return dayjs.utc(date).tz(timeZone).format(format);
};

export const calculateAge = (dob: string) => {
    if (!dob) return "";
    return dayjs().diff(dayjs(dob, "DD-MM-YYYY"), "year").toString();
};

export const generateTimeSlotId = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "";
    const hash = require("crypto").createHash("sha256");
    return hash.update(`${startTime}-${endTime}`).digest("hex");
};
