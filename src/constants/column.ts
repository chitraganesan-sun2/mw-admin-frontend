export interface Volunteer {
    id: string;
    name: string;
    age: number;
    location: string;
    requested_status: string;
  }
  
  export interface Report {
    id: string;
    profile_name: string;
    reason: string;
    report_time: string;
    review_status: string;
  }