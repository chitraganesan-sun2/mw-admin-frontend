
interface LearnerDetails {
    profile_image: string;
    profile_picture_url: string;
    name: string;
    gender: string;
    date_of_birth: string;
    email: string;
    phone_number: string;
    zip_code: string;
    country: string;
    primary_language: string;

    current_school: string;
    iep_plan_key: string;
    academic_strengths: string[];
    academic_challenges: string[];

    parent_name: string;
    parent_email: string;
    parent_phone_number: string;
    parent_relationship: string;
    parent_address: string;

    onboarded_status: string;
    photo_or_video_consent: boolean;
    cookie_consent_accepted: boolean;
    privacy_policy_accepted: boolean;
    terms_and_conditions_accepted: boolean;

    additional_info: {
        cultural_consideration: string;
        other_concerns_or_requests: string;
        what_motivates_to_learn: string;
    };

    current_interests: {
        extra_curricular_activities: string[];
        favorite_activities: string[];
    };

    learner_goals: {
        expected_goals: string[];
        skills_to_learn: {
            skill_id: string;
            skill_name: string;
        }[];
        preferred_volunteer_qualities: string;
        skill_level: string;
    };

    learner_special_needs: {
        type_of_developmental_disability: string;
        level_of_support_needed: string;
        assistive_device_used: string;
        communication_style: string;
        description: string;
        areas_of_support_needed: string[];
    };

    social_skills: {
        social_interaction_styles: string[];
        behavioral_concerns: string[];
        techniques_to_calm: string[];
    };

    total_attended_hours: number;
}