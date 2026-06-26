import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const formatDate = (date: string) => {
    if (!date) return "-";
    
    // First try to parse with DD-MM-YYYY format
    const parsedDate = dayjs(date, "DD-MM-YYYY", true);
    if (parsedDate.isValid()) {
        return parsedDate.format("DD-MM-YYYY");
    }
    
    // If that fails, try parsing with other common formats
    const fallbackDate = dayjs(date);
    if (fallbackDate.isValid()) {
        return fallbackDate.format("DD-MM-YYYY");
    }
    
    // If all parsing fails, return the original string or "-"
    return date || "-";
};

export const formatVolunteerData = (data: any): VolunteerDetails => {
    const {
        legal_and_safety_info = {},
        profile_picture = {},
        profile_video = {},
        profile_document = {},
        volunteer_contact_details = {},
        consent_and_permissions = {},
        cookie_consent_accepted = false,
        privacy_policy_accepted = false,
        terms_and_conditions_accepted = false,
    } = data;

    const contact = volunteer_contact_details || {};
    const name = `${data?.volunteer_first_name || ""} ${data?.volunteer_last_name || ""}`.trim();

    return {
        profile_image: profile_picture?.image_url || "",
        name,
        gender: data?.volunteer_gender || "-",
        date_of_birth: formatDate(data?.volunteer_birth_date) || "-",
        email_address: contact.email || "-",
        phone_number: `${contact.contact_number?.country_code || ""} ${contact.contact_number?.number || ""}`.trim(),
        zip_code: contact.zip_code || "-",
        country: contact.country || "-",
        timezone: contact.timezone || "-",
        utc_offset: contact.utc_offset || "-",

        education: data?.volunteer_education || "-",
        higher_education: data?.volunteer_higher_education || "-",
        high_school_status: data?.volunteer_high_school_status || "-",
        volunteer_experience: data?.volunteer_experience || "-",
        volunteer_work_experience: data?.volunteer_work_experience || "-",
        volunteer_experience_details: legal_and_safety_info?.volunteer_experience_details || {},

        parent_name: data?.volunteer_parent_name || "-",
        parent_email: data?.volunteer_parent_email || "-",

        volunteer_id: data?.volunteer_id || "-",
        onboarded_status: data?.onboarded_status || "-",

        document_url: profile_document?.document_url || "",
        video_url: profile_video?.video_url || "",

        criminal_background_check_details: legal_and_safety_info?.criminal_background_check_details || {},
        sex_offender_check_details: legal_and_safety_info?.sex_offender_check_details || {},
        disciplinary_check_details: legal_and_safety_info?.disciplinary_check_details || {},
        health_and_safety_check_details: legal_and_safety_info?.health_and_safety_check_details || {},
        other_consents_details: legal_and_safety_info?.other_consents_details || {},

        photo_or_video_consent: consent_and_permissions?.photo_or_video_consent ?? false,
        cookie_consent_accepted,
        privacy_policy_accepted,
        terms_and_conditions_accepted,
    };
};
