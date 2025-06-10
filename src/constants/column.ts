export interface Volunteer {
  id: string;
  name: string;
  age: number;
  location: string;
  onboarded_status: string;
  volunteer_id: string;
}

export interface Learner {
  id: string;
  name: string;
  age: number;
  location: string;
  learner_id: string;
  email: string;
  onboarded_status: string;
}

export interface Report {
  id: string;
  reportId: string;
  docId: string;
  profile_name: string;
  reason: string;
  report_time: string;
  report_status: string;
}
