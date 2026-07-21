"use client";

import React, { useEffect, useState } from "react";
import CenterModal from "@/components/common/Modals/CenterModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API, PUT_API } from "@/api/request";
import { Spin } from "antd";
import { formatString } from "@/utils/stringFunctions";
import { useQueryState } from "nuqs";
import Image from "next/image";
import { formatLearnerData } from "./format";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const Section = ({
  title,
  details,
  columns = 2,
}: {
  title: string;
  details: any;
  columns?: number;
}) => (
  <div>
    <p className="text-xl font-medium border-t pt-5 mb-4">{title}</p>
    <div className={`grid grid-cols-${columns} gap-4`}>
      {details.map(({ title, value, rootClassName = "" }: any, i: number) => (
        <div key={i} className={`flex flex-col gap-1 ${rootClassName}`}>
          <p className="text-sm font-medium text-gray-medium">{title}</p>
          <p className="text-[1rem] text-gray-dark font-medium">{value || "-"}</p>
        </div>
      ))}
    </div>
  </div>
);

const LearnerProfileDetails = () => {
  const [learnerId, setLearnerId] = useQueryState("learner_id");
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [hideFooter, setHideFooter] = useState(true);
  const [learnerDetails, setLearnerDetails] = useState<LearnerDetails | null>(
    null
  );
  const [isAcceptLoading, setIsAcceptLoading] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["learner-details", learnerId],
    queryFn: async () =>
      (await GET_API(endpoints.learner.getLearnerDetails(learnerId || "")))
        .data,
    enabled: !!learnerId,
  });

  useEffect(() => {
    if (data) {
      setHideFooter(data?.onboarded_status !== "verification_pending");
      setLearnerDetails(formatLearnerData(data));
    }
  }, [data]);

  useEffect(() => {
    if (learnerId) setIsOpen(true);
  }, [learnerId]);

  const handleModalClose = () => {
    setLearnerId(null);
    setIsOpen(false);
    setRejectionReason("");
  };

  const updateVerificationStatus = async (status: string, reason?: string) => {
    if (!learnerId) return;

    await PUT_API(
      endpoints.onboarding.updateOnboardingStatus(learnerId, "learner", status, reason),
      {}
    );
    handleModalClose();
    queryClient.invalidateQueries({
      queryKey: ["learners"],
    });
  };

  const handleAccept = () => {
    setIsAcceptLoading(true);
    updateVerificationStatus("verification_completed")
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsAcceptLoading(false);
      });
  };

  const handleReject = () => {
    setIsRejectLoading(true);
    updateVerificationStatus("verification_rejected", rejectionReason.trim() || undefined)
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsRejectLoading(false);
      });
  };

  const formatArray = (arr?: string[]) =>
    arr?.map(formatString).join(" | ") || "-";
  const formatSkillArray = (arr: any) =>
    arr?.map((s: any) => s?.skill_name).join(" | ") || "-";
  const getValue = (val: any) => (val && (Array.isArray(val) ? val.length > 0 : true)) ? val : "-";
  const getFormattedValue = (val?: string) => formatString(val || "") || "-";

  const personalDetails = [
    { title: "Name", value: getValue(learnerDetails?.name) },
    { title: "Gender", value: getFormattedValue(learnerDetails?.gender) },
    {
      title: "Date of Birth",
      value: learnerDetails?.learner_personal_info?.learner_date_of_birth
        ? dayjs(
            learnerDetails?.learner_personal_info?.learner_date_of_birth, "DD-MM-YYYY"
          ).isValid()
          ? dayjs(
              learnerDetails?.learner_personal_info?.learner_date_of_birth, "DD-MM-YYYY"
            ).format("DD-MMM-YYYY")
          : learnerDetails?.learner_personal_info?.learner_date_of_birth
        : "-",
    },
    { title: "Email", value: getValue(learnerDetails?.email) },
    { title: "Phone Number", value: getValue(learnerDetails?.phone_number) },
    { title: "Zip Code", value: getValue(learnerDetails?.zip_code) },
    { title: "Country", value: getFormattedValue(learnerDetails?.country) },
    { title: "Timezone", value: getValue(learnerDetails?.timezone) },
    // { title: "UTC Offset", value: getValue(learnerDetails?.utc_offset) },
    {
      title: "Primary Language",
      value: getValue(learnerDetails?.primary_language),
    },
  ];

  const sections = [
    {
      title: "Guardian Details",
      details: [
        {
          title: "Guardian Name",
          value: getValue(learnerDetails?.parent_name),
        },
        {
          title: "Guardian Email",
          value: getValue(learnerDetails?.parent_email),
        },
        {
          title: "Guardian Phone Number",
          value: getValue(learnerDetails?.parent_phone_number),
        },
        {
          title: "Guardian Relationship",
          value: getFormattedValue(learnerDetails?.parent_relationship),
        },
      ],
    },
    {
      title: "Education",
      details: [
        { title: "Current School", value: learnerDetails?.current_school },
        { title: "IEP or 504 Plan", value: learnerDetails?.iep_plan_key },
        {
          title: "Academic Strengths",
          rootClassName: "col-span-2",
          value: formatArray(learnerDetails?.academic_strengths),
        },
        {
          title: "Academic Challenges",
          rootClassName: "col-span-2",
          value: formatArray(learnerDetails?.academic_challenges),
        },
      ],
    },
    {
      title: "Learner Goals",
      columns: 1,
      details: [
        {
          title: "Skill Level",
          value: getFormattedValue(learnerDetails?.learner_goals?.skill_level),
        },
        {
          title: "Expected Goals",
          value: formatArray(learnerDetails?.learner_goals?.expected_goals),
        },
        {
          title: "Skills and Expertise to Learn from Volunteers",
          value: formatSkillArray(
            learnerDetails?.learner_goals?.skills_to_learn
          ),
        },
        {
          title: "Preferred Volunteer Qualities",
          value: getValue(
            learnerDetails?.learner_goals?.preferred_volunteer_qualities
          ),
        },
      ],
    },
    {
      title: "Learner Special Needs",
      details: [
        {
          title: "Type of Developmental Disability",
          value: getValue(
            learnerDetails?.learner_special_needs
              ?.type_of_developmental_disability
          ),
        },
        {
          title: "Level of Support Needed",
          value: getFormattedValue(
            learnerDetails?.learner_special_needs?.level_of_support_needed
          ),
        },
        {
          title: "Assistive Device Used",
          value: getValue(
            learnerDetails?.learner_special_needs?.assistive_device_used
          ),
        },
        {
          title: "Communication Style",
          value: getValue(
            learnerDetails?.learner_special_needs?.communication_style
          ),
        },
        {
          title: "Description of Abilities and Strengths",
          value: getValue(learnerDetails?.learner_special_needs?.description),
        },
        {
          title: "Areas of Support Needed",
          rootClassName: "col-span-2",
          value: formatArray(
            learnerDetails?.learner_special_needs?.areas_of_support_needed
          ),
        },
      ],
    },
    {
      title: "Current Interests",
      columns: 1,
      details: [
        {
          title: "Extra-Curricular Activities",
          value: getValue(
            learnerDetails?.current_interests?.extra_curricular_activities
          ),
        },
        {
          title: "Favorite Activities",
          value: getValue(
            learnerDetails?.current_interests?.favorite_activities
          ),
        },
      ],
    },
    {
      title: "Social Skills",
      details: [
        {
          title: "Social Interaction Styles",
          value: formatArray(
            learnerDetails?.social_skills?.social_interaction_styles
          ),
        },
        {
          title: "Behavioral Concerns",
          rootClassName: "col-span-2",
          value: formatArray(
            learnerDetails?.social_skills?.behavioral_concerns
          ),
        },
        {
          title: "Techniques to Calm",
          rootClassName: "col-span-2",
          value: formatArray(learnerDetails?.social_skills?.techniques_to_calm),
        },
      ],
    },
    {
      title: "Consent",
      details: [
        {
          title: "Photo/Video Consent",
          value: learnerDetails?.photo_or_video_consent ? "Yes" : "No",
        },
        {
          title: "Cookie Consent",
          value: learnerDetails?.cookie_consent_accepted ? "Yes" : "No",
        },
        {
          title: "Acknowledgement of Privacy Policies",
          value: learnerDetails?.privacy_policy_accepted ? "Yes" : "No",
        },
        {
          title: "Acknowledgement of Terms & Conditions",
          value: learnerDetails?.terms_and_conditions_accepted ? "Yes" : "No",
        },
      ],
    },
    {
      title: "Additional Info",
      details: [
        {
          title: "Cultural/Religious Considerations",
          value: getValue(
            learnerDetails?.additional_info?.cultural_consideration
          ),
        },
        {
          title: "Other Comments or Notes",
          value: getValue(
            learnerDetails?.additional_info?.other_concerns_or_requests
          ),
        },
        {
          title: "What Motivates you to Learn",
          value: getValue(
            learnerDetails?.additional_info?.what_motivates_to_learn
          ),
        },
      ],
    },
  ];

  return (
    <CenterModal
      title="Learner Profile Details"
      width={900}
      customClassName="max-h-[90vh] !rounded-3xl overflow-y-auto no-scrollbar"
      isOpen={isOpen}
      onClose={handleModalClose}
      onAccept={handleAccept}
      onReject={handleReject}
      hideFooter={hideFooter}
      actionLoading={isAcceptLoading || isRejectLoading}
      acceptLoading={isAcceptLoading}
      rejectLoading={isRejectLoading}
    >
      {isLoading || !learnerDetails ? (
        <div className="h-[65vh] w-full flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-6">
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
              {personalDetails.map(({ title, value }, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-medium">
                    {title}
                  </p>
                  <p className="text-[1rem] text-gray-dark font-medium">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {sections.map(({ title, details, columns }, i) =>
            details.length ? (
              <Section
                key={i}
                title={title}
                details={details}
                columns={columns}
              />
            ) : null
          )}

          {!hideFooter && (
            <div>
              <p className="text-xl font-medium border-t mt-5 pt-5 mb-4">
                Rejection Reason (optional)
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Let the applicant know why their application wasn't approved — this is included in the rejection email if provided."
                className="w-full min-h-[80px] rounded-lg border border-gray-200 p-3 text-sm text-gray-dark focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          )}
        </div>
      )}
    </CenterModal>
  );
};

export default LearnerProfileDetails;
