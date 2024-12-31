import React, { useEffect, useState } from "react";
import CenterModal from "@/components/common/Modals/CenterModal";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API, PUT_API } from "@/api/request";
import moment from "moment";
import Link from "next/link";

interface VolunteerDetails {
  name: string;
  date_of_birth: string;
  email_address: string;
  phone_number: string;
  zip_code: string;
  high_school_status: string;
  onboarded_status: string;
  volunteer_id: string;
  criminal_background_check_details: any;
  sex_offender_check_details: any;
  disciplinary_check_details: any;
  health_and_safety_check_details: any;
  other_consents_details: any;
  volunteer_experience_details: any;
  document_url: string;
  video_url: string;
  photo_or_video_consent: boolean;
  acknowledgement_of_program_policies: boolean;
}

const ProfileDetails = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const volunteerId = searchParams.get("volunteer_id");
  const [hideFooter, setHideFooter] = useState(true);
  const queryClient = useQueryClient();

  const [volunteerDetails, setVolunteerDetails] = useState<VolunteerDetails>();

  const getIndividualVolunteer = async () => {
    const response = await GET_API(
      endpoints.volunteer.getVolunteerDetails(volunteerId as string)
    );
    return response.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["volunteer-details", volunteerId],
    queryFn: () => getIndividualVolunteer(),
    enabled: !!volunteerId,
  });

  useEffect(() => {
    if (data) {
      const { criminal_background_check_details, sex_offender_check_details, disciplinary_check_details, health_and_safety_check_details, other_consents_details, volunteer_experience_details } = data?.legal_and_safety_info;
      const formattedData: VolunteerDetails = {
        name: data?.volunteer_first_name + " " + data?.volunteer_last_name,
        date_of_birth: moment(data?.volunteer_birth_date).format("DD-MM-YYYY"),
        email_address: data?.volunteer_contact_details?.email,
        phone_number:
          data?.volunteer_contact_details?.contact_number?.country_code +
          " " +
          data?.volunteer_contact_details?.contact_number?.number,
        zip_code: data?.volunteer_contact_details?.zip_code,
        high_school_status: data?.volunteer_high_school_status || "-",
        onboarded_status: data?.onboarded_status,
        volunteer_id: data?.volunteer_id,
        video_url: data?.profile_video?.video_url,
        document_url: data?.profile_document?.document_url,
        criminal_background_check_details: {
          isAny: criminal_background_check_details?.convicted_of_a_felony || criminal_background_check_details?.involved_in_criminal_activity || criminal_background_check_details?.convicted_of_a_crime,
          description: criminal_background_check_details?.description
        },
        sex_offender_check_details: {
          isAny: sex_offender_check_details?.checked_for_sex_offender,
          description: sex_offender_check_details?.description
        },
        disciplinary_check_details: {
          isAny: disciplinary_check_details?.terminated_from_volunteer_position || disciplinary_check_details?.involved_in_disputes || disciplinary_check_details?.dismissed_from_institution,
          description: disciplinary_check_details?.description
        },
        health_and_safety_check_details: {
          isAny: health_and_safety_check_details?.having_health_issues,
          description: health_and_safety_check_details?.description
        },
        other_consents_details: {
          isAny: other_consents_details?.consent_to_background_checks || other_consents_details?.agree_to_follow_organization_policies || other_consents_details?.agree_to_understand_termination_of_volunteer_agreement,
          description: other_consents_details?.description,
        },
        volunteer_experience_details: {
          isAny: volunteer_experience_details?.previously_volunteered || volunteer_experience_details?.invloved_in_complaints,
          description: volunteer_experience_details?.description
        },
        photo_or_video_consent: data?.consent_and_permissions?.photo_or_video_consent,
        acknowledgement_of_program_policies: data?.consent_and_permissions?.acknowledgement_of_program_policies,
      }
      if (data.onboarded_status === "verification_pending") {
        setHideFooter(false);
      } else {
        setHideFooter(true);
      }

      setVolunteerDetails(formattedData);
    }
  }, [data]);

  useEffect(() => {
    if (volunteerId) {
      setIsOpen(true);
    }
  }, [volunteerId]);

  const profileDetails = [
    {
      title: "Name",
      value: volunteerDetails?.name || "-",
    },
    {
      title: "Date of Birth",
      value: volunteerDetails?.date_of_birth || "-",
    },
    {
      title: "Email Address",
      value: volunteerDetails?.email_address || "-",
    },
    {
      title: "Phone Number",
      value: volunteerDetails?.phone_number || "-",
    },
    {
      title: "Zip Code",
      value: volunteerDetails?.zip_code || "-",
    },
    {
      title: "Are you currently in high school or higher?",
      value: volunteerDetails?.high_school_status || "-",
    },
  ];

  const legalInformations = [
    {
      title: "Have you ever been convicted of a felony or misdemeanor, been involved in any criminal activity or legal proceedings (including pending charges or arrests), or been convicted of any crimes involving minors, abuse, or neglect?",
      value: volunteerDetails?.criminal_background_check_details,
    },
    {
      title: "Are you listed on any state or national sex offender registries?",
      value: volunteerDetails?.sex_offender_check_details,
    },
    {
      title: "Have you ever been terminated, involved in disputes over safety or ethics, or faced disciplinary action from any job, organization, or educational institution?",
      value: volunteerDetails?.disciplinary_check_details,
    },
    {
      title: "Do you have any physical or mental health conditions that may affect your ability to perform volunteer duties?",
      value: volunteerDetails?.health_and_safety_check_details,
    },
    {
      title: "Do you consent to a criminal background check, agree to follow the organization’s policies on confidentiality, behavior, and safeguarding, and understand that your volunteer role may be terminated for criminal activity or failure to adhere to these policies?",
      value: volunteerDetails?.other_consents_details,
    },
    {
      title: "Have you previously volunteered with children or vulnerable populations, and been involved in any incidents or complaints during those roles?",
      value: volunteerDetails?.volunteer_experience_details,
    },
  ]

  const consentPermissions = [
    {
      title: "Do you consent to the use of your photo or video?",
      value: volunteerDetails?.photo_or_video_consent,
    },
    {
      title: "Do you acknowledge the program policies?",
      value: volunteerDetails?.acknowledgement_of_program_policies,
    }
  ]

  const handleModalClose = () => {
    router.push("/volunteer");
    setIsOpen(false);
  };

  const handleAccept = () => {
    PUT_API(
      endpoints.onboarding.updateOnboardingStatus(
        volunteerId as string,
        "volunteer",
        "verification_completed"
      ),
      {}
    )
      .then(() => {
        handleModalClose();
        queryClient.invalidateQueries({
          queryKey: ["volunteers"],
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleReject = () => {
    PUT_API(
      endpoints.onboarding.updateOnboardingStatus(
        volunteerId as string,
        "volunteer",
        "verification_rejected"
      ),
      {}
    )
      .then(() => {
        handleModalClose();
        queryClient.invalidateQueries({
          queryKey: ["volunteers"],
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <CenterModal
      title="Profile Details"
      width={720}
      customClassName="max-h-[90vh] !rounded-2xl overflow-y-auto"
      isOpen={isOpen}
      onClose={handleModalClose}
      onAccept={handleAccept}
      onReject={handleReject}
      hideFooter={hideFooter}
    >
      <div>
        <p className="text-xl font-medium mb-5">Personal Details</p>
        <div className="grid grid-cols-2 gap-5">
          {profileDetails.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-medium">
                {item.title}
              </p>
              <p className="text-[1rem] text-gray-dark font-medium">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xl font-medium border-t my-5 pt-5">Some Legal Information</p>
        <div className="flex flex-col gap-5">
          {legalInformations.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-medium">
                {item.title}
              </p>
              <p className="text-[1rem] text-gray-dark font-medium">
                {item.value?.isAny ? 'Yes' : 'No'} {item.value?.description && `- ${item.value?.description}`}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex flex-col gap-5 border-t my-5 pt-5">
          {consentPermissions.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-medium">
                {item.title}
              </p>
              <p className="text-[1rem] text-gray-dark font-medium">
                {item.value ? 'Yes' : 'No'}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xl font-medium border-t mt-5 pt-5 mb-3">About Me</p>
        <div className="flex gap-2 underline">
          <Link href={volunteerDetails?.video_url || ""} target="_blank">See Video</Link>
          <Link href={volunteerDetails?.document_url || ""} target="_blank" rel="noopener noreferrer" >
            See Document
          </Link>
        </div>
      </div>
    </CenterModal>
  );
};

export default ProfileDetails;
