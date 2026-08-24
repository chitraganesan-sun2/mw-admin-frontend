interface VolunteerDetails {
    profile_image: string;
    name: string;
    gender: string;
    date_of_birth: string;
    email_address: string;
    phone_number: string;
    zip_code: string;
    country: string;
    timezone: string;
    utc_offset: string;

    education: string;
    higher_education: string;

    volunteer_experience: string;
    volunteer_work_experience: string;
    volunteer_experience_details: any;

    volunteer_subjects: { subject_id: string; subject_name: string }[];
    volunteer_academic_skills_notes: string;
    volunteer_arts_life_skills_notes: string;
    volunteer_favorite_activities: string;
    preferred_learner_age_group: string;
    support_preference: string;
    support_preference_details: string;
    volunteer_teaching_traits: string;

    parent_name: string;
    parent_email: string;
    parent_phone_number: string;

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