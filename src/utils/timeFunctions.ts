import moment from "moment-timezone";

type UserTimeZoneProps = {
    date: string;
    timeZone?: string;
    format?: string;
};

const localTimeZone = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || moment.tz.guess();

export const timesAgo = (date: string) => {
    if (!date) return "";
    const createdAt = moment.utc(date).local();
    const diffInMinutes = moment().diff(createdAt, "minutes");

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
    return moment.utc(date).tz(timeZone).format(format);
};

export const calculateAge = (dob: string) => {
    if (!dob) return "";
    return moment().diff(moment(dob, "DD-MM-YYYY"), "years").toString();
};

export const generateTimeSlotId = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "";
    const hash = require("crypto").createHash("sha256");
    return hash.update(`${startTime}-${endTime}`).digest("hex");
};
