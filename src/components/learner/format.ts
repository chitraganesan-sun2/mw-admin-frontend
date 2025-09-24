import moment from "moment";
import noImage from "@/assets/images/no-image.webp";

const formatDate = (date: string) =>
  moment(date, "DD-MM-YYYY", true).isValid()
    ? date
    : moment(date).format("DD-MM-YYYY");

const formatContactNumber = (contact?: { country_code?: string; number?: string }) =>
  contact?.country_code && contact?.number
    ? `${contact.country_code} ${contact.number}`
    : "-";

const formatName = (first?: string, last?: string) => `${first ?? ""} ${last ?? ""}`.trim() || "-";

export const formatLearnerData = (data: any): LearnerDetails => {
  const {
    onboarded_status,
    consent_and_permissions = {},
    additional_info = {},
    current_interests = {},
    education = {},
    learner_goals = {},
    learner_personal_info = {},
    learner_special_needs = {},
    parent_info = {},
    social_skills = {},
    total_attended_hours = 0,
    profile_picture = {},
    cookie_consent_accepted = false,
    privacy_policy_accepted = false,
    terms_and_conditions_accepted = false,
  } = data;

  const contact = learner_personal_info?.learner_contact_details || {};
  const parent_contact = parent_info?.parent_contact_number || {};

  return {
    learner_personal_info: {
      learner_date_of_birth: formatDate(learner_personal_info?.learner_date_of_birth || "") || "",
    },
    profile_image: profile_picture?.image_url || "",
    name: formatName(
      learner_personal_info?.learner_first_name,
      learner_personal_info?.learner_last_name
    ),
    gender: learner_personal_info?.learner_gender || "-",
    date_of_birth: formatDate(learner_personal_info?.learner_date_of_birth || "") || "-",
    email: contact.email || "-",
    phone_number: formatContactNumber(contact.contact_number),
    zip_code: contact.zip_code || "-",
    country: contact.country || "-",
    primary_language: learner_personal_info?.learner_primary_language || "-",

    current_school: education?.current_school || "-",
    iep_plan_key: education?.iep_plan_key || "-",
    academic_strengths: education?.academic_strengths || [],
    academic_challenges: education?.academic_challenges || [],

    parent_name: formatName(parent_info?.parent_first_name, parent_info?.parent_last_name),
    parent_email: parent_info?.parent_email || "-",
    parent_phone_number: formatContactNumber(parent_contact),
    parent_relationship: parent_info?.relationship_to_learner || "-",
    parent_address: parent_info?.parent_address || "-",

    onboarded_status: onboarded_status || "-",
    photo_or_video_consent: consent_and_permissions?.photo_or_video_consent || false,
    cookie_consent_accepted,
    privacy_policy_accepted,
    terms_and_conditions_accepted,

    additional_info: {
      cultural_consideration: additional_info?.cultural_consideration || "-",
      other_concerns_or_requests: additional_info?.other_concerns_or_requests || "-",
      what_motivates_to_learn: additional_info?.what_motivates_to_learn || "-",
    },

    current_interests: {
      extra_curricular_activities: current_interests?.extra_curricular_activities || [],
      favorite_activities: current_interests?.favorite_activities || [],
    },

    learner_goals: {
      expected_goals: learner_goals?.expected_goals || [],
      skills_to_learn: learner_goals?.skills_to_learn || [],
      preferred_volunteer_qualities: learner_goals?.preferred_volunteer_qualities || "-",
      skill_level: learner_goals?.skill_level || "-",
    },

    learner_special_needs: {
      type_of_developmental_disability: learner_special_needs?.type_of_developmental_disability || "-",
      level_of_support_needed: learner_special_needs?.level_of_support_needed || "-",
      assistive_device_used: learner_special_needs?.assistive_device_used || "-",
      communication_style: learner_special_needs?.communication_style || "-",
      description: learner_special_needs?.description || "-",
      areas_of_support_needed: learner_special_needs?.areas_of_support_needed || [],
    },

    social_skills: {
      social_interaction_styles: social_skills?.social_interaction_styles || [],
      behavioral_concerns: social_skills?.behavioral_concerns || [],
      techniques_to_calm: social_skills?.techniques_to_calm || [],
    },

    total_attended_hours,
    profile_picture_url: profile_picture?.image_url || noImage,
  };
};