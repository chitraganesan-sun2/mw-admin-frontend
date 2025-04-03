import React, { useEffect, useState } from "react";
import CenterModal from "@/components/common/Modals/CenterModal";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API } from "@/api/request";
import moment from "moment";
import { Spin } from "antd";
import { formatString } from "@/utils/stringFunctions";
import { useQueryState } from "nuqs";
import Image from "next/image";

interface LearnerDetails {
  profile_image: string;
  name: string;
  gender: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  zip_code: string;
  country: string;
  primary_language: string;
  current_school: string;
  academic_strengths: string[];
  academic_challenges: string[];
  parent_name: string;
  parent_email: string;
  parent_phone_number: string;
  parent_relationship: string;
  parent_address: string;
  onboarded_status: string;
  photo_or_video_consent: boolean;
  acknowledgement_of_program_policies: boolean;
  additional_info: {
    cultural_consideration: string;
    other_concerns_or_requests: string;
    what_motivates_to_learn: string;
  };
  current_interests: {
    interests: string[];
    extra_curricular_activities: string[];
    favorite_activities: string[];
  };
  learner_goals: {
    expected_goals: string[];
    skills_and_expertise: string[];
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
    learning_styles: string[];
  };
  social_skills: {
    communication_preferences: string[];
    social_interaction_styles: string[];
    behavioral_concerns: string[];
    techniques_to_calm: string[];
  };
  total_attended_hours: number;
  profile_picture_url: string;
}

const LearnerProfileDetails = () => {
  const [learnerId, setLearnerId] = useQueryState("learner_id");

  const [hideFooter, setHideFooter] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [learnerDetails, setLearnerDetails] = useState<LearnerDetails>();

  const getIndividualLearner = async () => {
    const response = await GET_API(
      endpoints.learner.getLearnerDetails(learnerId as string)
    );
    return response.data;
  };

  const { data, isLoading } = useQuery({
    queryKey: ["learner-details", learnerId],
    queryFn: getIndividualLearner,
    enabled: !!learnerId,
  });

  const formatDate = (date: string) => {
    if (moment(date, "DD-MM-YYYY", true).isValid()) {
      return date;
    }
    return moment(date).format("DD-MM-YYYY");
  };

  // Format the API response into our learnerDetails object
  useEffect(() => {
    if (data) {
      const {
        onboarded_status,
        consent_and_permissions,
        additional_info,
        current_interests,
        education,
        learner_goals,
        learner_personal_info,
        learner_special_needs,
        parent_info,
        social_skills,
        total_attended_hours,
        profile_picture,
      } = data;

      const contact = learner_personal_info?.learner_contact_details;
      const formatted: LearnerDetails = {
        profile_image: profile_picture?.image_url || "",
        name: `${learner_personal_info?.learner_first_name || ""} ${learner_personal_info?.learner_last_name || ""}`.trim(),
        gender: learner_personal_info?.learner_gender || "-",
        date_of_birth: formatDate(learner_personal_info?.learner_date_of_birth || "") || "-",
        email: contact?.email || "-",
        phone_number: contact?.contact_number
          ? `${contact.contact_number.country_code} ${contact.contact_number.number}`
          : "-",
        zip_code: contact?.zip_code || "-",
        country: contact?.country || "-",
        primary_language: learner_personal_info?.learner_primary_language || "-",
        current_school: education?.current_school || "-",
        academic_strengths: education?.academic_strengths || [],
        academic_challenges: education?.academic_challenges || [],

        parent_name: parent_info
          ? `${parent_info?.parent_first_name || ""} ${parent_info?.parent_last_name || ""}`.trim()
          : "-",
        parent_email: parent_info?.parent_email || "-",
        parent_phone_number: parent_info?.parent_contact_number
          ? `${parent_info?.parent_contact_number?.country_code} ${parent_info?.parent_contact_number?.number}`
          : "-",
        parent_relationship: parent_info?.relationship_to_learner || "-",
        parent_address: parent_info?.parent_address || "-",

        onboarded_status: onboarded_status || "-",
        photo_or_video_consent: consent_and_permissions?.photo_or_video_consent || false,
        acknowledgement_of_program_policies:
          consent_and_permissions?.acknowledgement_of_program_policies || false,
        additional_info: additional_info || {
          cultural_consideration: "-",
          other_concerns_or_requests: "-",
          what_motivates_to_learn: "-",
        },
        current_interests: current_interests || {
          interests: [],
          extra_curricular_activities: [],
          favorite_activities: [],
        },
        learner_goals: learner_goals || {
          expected_goals: [],
          skills_and_expertise: [],
          preferred_volunteer_qualities: "-",
          skill_level: "-",
        },
        learner_special_needs: learner_special_needs || {
          type_of_developmental_disability: "-",
          level_of_support_needed: "-",
          assistive_device_used: "-",
          communication_style: "-",
          description: "-",
          areas_of_support_needed: [],
          learning_styles: [],
        },
        social_skills: social_skills || {
          communication_preferences: [],
          social_interaction_styles: [],
          behavioral_concerns: [],
          techniques_to_calm: [],
        },
        total_attended_hours: total_attended_hours || 0,
        profile_picture_url: profile_picture?.image_url || "",
      };

      // Show action footer if the onboarding is still pending
      setHideFooter(onboarded_status !== "verification_pending");

      setLearnerDetails(formatted);
    }
  }, [data]);

  useEffect(() => {
    if (learnerId) {
      setIsOpen(true);
    }
  }, [learnerId]);

  // Define the main sections for displaying data
  const personalDetails = [
    { title: "Name", value: learnerDetails?.name || "-" },
    { title: "Gender", value: formatString(learnerDetails?.gender || '') || "-" },
    { title: "Date of Birth", value: learnerDetails?.date_of_birth || "-" },
    { title: "Email", value: learnerDetails?.email || "-" },
    { title: "Phone Number", value: learnerDetails?.phone_number || "-" },
    { title: "Zip Code", value: learnerDetails?.zip_code || "-" },
    { title: "Country", value: formatString(learnerDetails?.country || '') || "-" },
    { title: "Primary Language", value: learnerDetails?.primary_language || "-" },
  ];

  const parentDetails = [
    { title: "Parent/Guardian Name", value: learnerDetails?.parent_name || "-" },
    { title: "Parent/Guardian Email", value: learnerDetails?.parent_email || "-" },
    { title: "Parent/Guardian Phone Number", value: learnerDetails?.parent_phone_number || "-" },
    { title: "Parent/Guardian Relationship", value: formatString(learnerDetails?.parent_relationship || '') || "-" },
    { title: "Parent/Guardian Address", value: learnerDetails?.parent_address || "-" },
  ];

  const educationDetails = [
    { title: "Current School", value: formatString(learnerDetails?.current_school || '') || "-" },
    { title: "Academic Strengths", rootClassName: "col-span-2", value: learnerDetails?.academic_strengths?.map((strength) => formatString(strength)).join(" | ") || "-" },
    { title: "Academic Challenges", rootClassName: "col-span-2", value: learnerDetails?.academic_challenges?.map((challenge) => formatString(challenge)).join(" | ") || "-" },
  ];

  const learnerGoalsDetails = [
    { title: "Skill Level", value: learnerDetails?.learner_goals?.skill_level || "-" },
    { title: "Expected Goals", value: learnerDetails?.learner_goals?.expected_goals?.map((goal) => formatString(goal)).join(" | ") || "-" },
    { title: "Skills and expertise to learn", value: learnerDetails?.learner_goals?.skills_and_expertise?.map((skills) => formatString(skills)).join(" | ") || "-" },
    { title: "Preferred Volunteer Qualities", value: learnerDetails?.learner_goals?.preferred_volunteer_qualities},
  ];

  const learnerSpecialNeedsDetails = [
    { title: "Type of Developmental Disability", value: learnerDetails?.learner_special_needs?.type_of_developmental_disability || "-" },
    { title: "Level of Support Needed", value: formatString(learnerDetails?.learner_special_needs?.level_of_support_needed || '') || "-" },
    { title: "Assistive Device Used", value: learnerDetails?.learner_special_needs?.assistive_device_used || "-" },
    { title: "Communication Style", value: learnerDetails?.learner_special_needs?.communication_style || "-" },
    { title: "Description", value: learnerDetails?.learner_special_needs?.description || "-" },
    { title: "Areas of Support Needed", rootClassName: "col-span-2", value: learnerDetails?.learner_special_needs?.areas_of_support_needed?.map((need) => formatString(need)).join(" | ") || "-" },
    { title: "Learning Styles", rootClassName: "col-span-2", value: learnerDetails?.learner_special_needs?.learning_styles?.map((style) => formatString(style)).join(" | ") || "-" },
  ];

  const currentInterestsDetails = [
    { title: "Interests", value: learnerDetails?.current_interests?.interests?.map((interest) => formatString(interest)).join(" | ") || "-" },
    { title: "Extra-Curricular Activities", value: learnerDetails?.current_interests?.extra_curricular_activities || "-" },
    { title: "Favorite Activities", value: learnerDetails?.current_interests?.favorite_activities || "-" },
  ];

  const socialSkillsDetails = [
    { title: "Communication Preferences", value: learnerDetails?.social_skills?.communication_preferences?.map((preference) => formatString(preference)).join(" | ") || "-" },
    { title: "Social Interaction Styles", value: learnerDetails?.social_skills?.social_interaction_styles?.map((style) => formatString(style)).join(" | ") || "-" },
    { title: "Behavioral Concerns", rootClassName: "col-span-2", value: learnerDetails?.social_skills?.behavioral_concerns?.map((concern) => formatString(concern)).join(" | ") || "-" },
    { title: "Techniques to Calm", rootClassName: "col-span-2", value: learnerDetails?.social_skills?.techniques_to_calm?.map((technique) => formatString(technique)).join(" | ") || "-" },
  ];

  const consentDetails = [
    {
      title: "Photo/Video Consent",
      value: learnerDetails?.photo_or_video_consent ? "Yes" : "No",
    },
    // {
    //   title: "Acknowledgement of Program Policies",
    //   value: learnerDetails?.acknowledgement_of_program_policies ? "Yes" : "No",
    // },
  ];

  const additionalInfoDetails = [
    {
      title: "Cultural Consideration",
      value: formatString(learnerDetails?.additional_info?.cultural_consideration || '') || "-",
    },
    {
      title: "Other Concerns/Requests",
      value: formatString(learnerDetails?.additional_info?.other_concerns_or_requests || '') || "-",
    },
    {
      title: "What Motivates to Learn",
      value: learnerDetails?.additional_info?.what_motivates_to_learn || "-",
    },
  ];

  const handleModalClose = () => {
    setLearnerId(null);
    setIsOpen(false);
  };

  return (
    <CenterModal
      title="Learner Profile Details"
      width={900}
      customClassName="max-h-[90vh] !rounded-3xl overflow-y-auto no-scrollbar"
      isOpen={isOpen}
      onClose={handleModalClose}
      hideFooter={hideFooter}
    >
      {isLoading || !learnerDetails ? (
        <div className="h-[65vh] w-full flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Personal Details */}
          <div>
            <p className="text-xl font-medium mb-4">Personal Details</p>
            <div className="flex mb-3">
              <Image
                src={learnerDetails?.profile_picture_url || ""}
                alt="profile"
                className="rounded-xl min-h-[250px] max-h-[300px] !w-auto"
                width={100}
                height={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {personalDetails.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className="text-[1rem] text-gray-dark font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Parent/Guardian Details */}
          <div>
            <p className="text-xl font-medium border-t pt-5 mb-4">Parent/Guardian Details</p>
            <div className="grid grid-cols-2 gap-4">
              {parentDetails.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className="text-[1rem] text-gray-dark font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education Details */}
          <div>
            <p className="text-xl font-medium border-t pt-5 mb-4">Education</p>
            <div className="grid grid-cols-2 gap-4">
              {educationDetails.map((item, index) => (
                <div key={index} className={`flex flex-col gap-1 ${item?.rootClassName || ''}`}>
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className={`text-[1rem] text-gray-dark font-medium `}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Learner Goals */}
          <div>
            <p className="text-xl font-medium border-t pt-5 mb-4">Learner Goals</p>
            <div className="grid grid-cols-1 gap-4">
              {learnerGoalsDetails.map((item, index) => (
                <div key={index} className={`flex flex-col gap-1`}>
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className={`text-[1rem] text-gray-dark font-medium `}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Learner Special Needs */}
          <div>
            <p className="text-xl font-medium border-t pt-5 mb-4">Learner Special Needs</p>
            <div className="grid grid-cols-2 gap-4">
              {learnerSpecialNeedsDetails.map((item, index) => (
                <div key={index} className={`flex flex-col gap-1 ${item?.rootClassName || ''}`}>
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className={`text-[1rem] text-gray-dark font-medium `}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Current Interests */}
          <div>
            <p className="text-xl font-medium border-t pt-5 mb-4">Current Interests</p>
            <div className="grid grid-cols-1 gap-4">
              {currentInterestsDetails?.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className={`text-[1rem] text-gray-dark font-medium `}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Social Skills */}
          <div>
            <p className="text-xl font-medium border-t pt-5 mb-4">Social Skills</p>
            <div className="grid grid-cols-2 gap-4">
              {socialSkillsDetails.map((item, index) => (
                <div key={index} className={`flex flex-col gap-1 ${item?.rootClassName || ''}`}>
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className={`text-[1rem] text-gray-dark font-medium `}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consent Details */}
          <div>
            <p className="text-xl font-medium border-t pt-5 mb-4">Consent & Permissions</p>
            <div className="grid grid-cols-2 gap-4">
              {consentDetails.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className="text-[1rem] text-gray-dark font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <p className="text-xl font-medium border-t pt-5 mb-4">Additional Information</p>
            <div className="grid grid-cols-1 gap-4">
              {additionalInfoDetails.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-medium">{item.title}</p>
                  <p className="text-[1rem] text-gray-dark font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </CenterModal>
  );
};

export default LearnerProfileDetails;
