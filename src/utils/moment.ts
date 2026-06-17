import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export const calculateAge = (dob: string) => {
    const formattedDob = dayjs(dob, "DD-MM-YYYY", true).isValid() 
        ? dob 
        : dayjs(dob).format("DD-MM-YYYY");
    
    const age = dayjs().diff(dayjs(formattedDob, "DD-MM-YYYY"), 'year');
    return age < 1 ? 0 : age;
};
