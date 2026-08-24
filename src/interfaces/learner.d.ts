
interface LearnerDetails {
    learner_personal_info: {
        learner_date_of_birth?: string;
    };
    profile_image: string;
    profile_picture_url: string;
    name: string;
    gender: string;
    date_of_birth: string;
    email: string;
    phone_number: string;
    zip_code: string;
    country: string;
    timezone: string;
    utc_offset: string;
    primary_language: string;

    current_school: string;
    grade_or_education_level: string;
    program_iep_504_plan: string;
    cultural_religious_considerations: string;
    extracurricular_activities: string;
    favorite_free_time_activities: string;
    academic_strengths: string[];

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

    learner_goals: {
        academic_skills_to_learn: {
            skill_id: string;
            skill_name: string;
        }[];
        arts_life_skills_to_learn: {
            skill_id: string;
            skill_name: string;
        }[];
        academic_goals_description: string;
        arts_life_goals_description: string;
        preferred_volunteer_qualities: string;
        other_comments_or_notes: string;
    };

    learner_special_needs: {
        type_of_developmental_disability: string;
        level_of_support_needed: string;
        assistive_device_used: string;
        communication_style: string;
        description: string;
        areas_of_support_needed: string[];
        behavioral_concerns: string;
        behavior_support_strategies: string[];
        social_interaction_styles: string[];
    };

    total_attended_hours: number;
}