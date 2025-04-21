interface VolunteerDetails {
    profile_image: string;
    name: string;
    gender: string;
    date_of_birth: string;
    email_address: string;
    phone_number: string;
    zip_code: string;
    country: string;

    education: string;
    higher_education: string;
    high_school_status: string;

    volunteer_experience: string;
    volunteer_work_experience: string;
    volunteer_experience_details: any;

    parent_name: string;
    parent_email: string;

    onboarded_status: string;
    volunteer_id: string;

    criminal_background_check_details: any;
    sex_offender_check_details: any;
    disciplinary_check_details: any;
    health_and_safety_check_details: any;
    other_consents_details: any;

    document_url: string;
    video_url: string;

    photo_or_video_consent: boolean;
    cookie_consent_accepted: boolean;
    privacy_policy_accepted: boolean;
    terms_and_conditions_accepted: boolean;
}