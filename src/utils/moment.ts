import moment from 'moment';

export const calculateAge = (dob: string) => {
    return moment().diff(moment(dob), 'years');
}