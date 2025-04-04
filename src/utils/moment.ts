import moment from "moment";

export const calculateAge = (dob: string) => {
    const formattedDob = moment(dob, "DD-MM-YYYY", true).isValid() 
        ? dob 
        : moment(dob).format("DD-MM-YYYY");
    
    const age = moment().diff(moment(formattedDob, "DD-MM-YYYY"), 'years');
    return age < 1 ? 0 : age;
};
