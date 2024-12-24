export interface Volunteer {
  id: string;
  name: string;
  age: number;
  location: string;
  onboarded_status: string;
  volunteer_id: string;
}

export interface Report {
  id: string;
  profile_name: string;
  reason: string;
  report_time: string;
  review_status: string;
}
