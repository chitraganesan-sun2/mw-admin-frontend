import React, { useEffect, useState } from "react";
import CenterModal from "@/components/common/Modals/CenterModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API, PUT_API } from "@/api/request";
import moment from "moment";
import { Spin, Button } from "antd";
import { useQueryState } from "nuqs";
import Image from "next/image";
import { formatString } from "@/utils/stringFunctions";
import { CaretRightOutlined } from "@ant-design/icons";
import { Collapse } from "antd";
const { Panel } = Collapse;

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
  volunteer_experience: string;
  volunteer_work_experience: string;
  high_school_status: string;
  parent_name: string;
  parent_email: string;
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
  const [volunteerId, setVolunteerId] = useQueryState("volunteer_id");
  const [hideFooter, setHideFooter] = useState(true);
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isAcceptLoading, setIsAcceptLoading] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
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

  const formatDate = (date: string) => {
    if (moment(date, "DD-MM-YYYY", true).isValid()) {
      return date;
    }
    return moment(date).format("DD-MM-YYYY");
  };

  useEffect(() => {
    if (data) {
      const { criminal_background_check_details, sex_offender_check_details, disciplinary_check_details, health_and_safety_check_details, other_consents_details, volunteer_experience_details } = data?.legal_and_safety_info;
      const formattedData: VolunteerDetails = {
        // Personal Details
        profile_image: data?.profile_picture?.image_url || "",
        name: data?.volunteer_first_name + " " + data?.volunteer_last_name,
        gender: data?.volunteer_gender,
        date_of_birth: formatDate(data?.volunteer_birth_date) || "-",
        email_address: data?.volunteer_contact_details?.email,
        phone_number:
          data?.volunteer_contact_details?.contact_number?.country_code +
          " " +
          data?.volunteer_contact_details?.contact_number?.number,
        zip_code: data?.volunteer_contact_details?.zip_code,
        country: data?.volunteer_contact_details?.country,
        education: data?.volunteer_education || "-",
        higher_education: data?.volunteer_higher_education || "-",
        volunteer_work_experience: data?.volunteer_work_experience || "-",
        volunteer_experience: data?.volunteer_experience || "-",
        high_school_status: data?.volunteer_high_school_status || "-",
        // Parent/Guardian Details
        parent_name: data?.volunteer_parent_name || "-",
        parent_email: data?.volunteer_parent_email || "-",
        volunteer_id: data?.volunteer_id,
        onboarded_status: data?.onboarded_status,
        video_url: data?.profile_video?.video_url,
        document_url: data?.profile_document?.document_url,
        // Legal Information
        criminal_background_check_details: criminal_background_check_details,
        sex_offender_check_details: sex_offender_check_details,
        disciplinary_check_details: disciplinary_check_details,
        health_and_safety_check_details: health_and_safety_check_details,
        other_consents_details: other_consents_details,
        volunteer_experience_details: volunteer_experience_details,
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
      rootClassName: "col-span-2",
    },
    {
      title: "Gender",
      value: volunteerDetails?.gender || "-",
      rootClassName: "capitalize",
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
      title: "Country",
      value: formatString(volunteerDetails?.country || "") || "-",
      rootClassName: "capitalize",
    },
    {
      title: "Higher Education",
      value: volunteerDetails?.higher_education || "-",
      rootClassName: "capitalize",
    },
    {
      title: "Education",
      value: volunteerDetails?.education || "-",
    },
    {
      title: "Work Experience",
      value: volunteerDetails?.volunteer_work_experience || "-",
    },
    {
      title: "Volunteer Experience",
      value: volunteerDetails?.volunteer_experience || "-",
    },
    {
      title: "Languages I speak",
      value: data?.volunteer_languages?.map((lang: any) => lang?.language_name)?.join(" | ") || "-",
      rootClassName: "col-span-2",
    },
    // {
    //   title: "Subjects I teach",
    //   value: data?.volunteer_subjects?.map((subject: any) => subject?.subject_name)?.join(" | ") || "-",
    //   rootClassName: "col-span-2",
    // },
    {
      title: "Skills I have",
      value: data?.volunteer_skills?.map((skill: any) => skill?.skill_name)?.join(" | ") || "-",
      rootClassName: "col-span-2",
    },
    {
      title: "Why do you want to tutor with us, and what do you hope to gain from this experience? What subjects would you like to teach, and why?",
      value: data?.volunteer_description || "-",
      rootClassName: "col-span-2",
    },
  ];

  const parentDetails = [
    {
      title: "Parent/Guardian Name",
      value: volunteerDetails?.parent_name || "-",
      rootClassName: "col-span-1",
    },
    {
      title: "Parent/Guardian Email",
      value: volunteerDetails?.parent_email || "-",
      rootClassName: "col-span-1",
    },
  ]

  const legalInformations = [
    {
      title: "Criminal Background Check",
      data: [
        {
          title: "Have you ever been convicted of a felony or misdemeanor?",
          value: volunteerDetails?.criminal_background_check_details?.convicted_of_a_felony
        },
        {
          title: "Have you ever been involved in any criminal activity or legal proceedings, including pending charges or arrests?",
          value: volunteerDetails?.criminal_background_check_details?.involved_in_criminal_activity
        },
        {
          title: "Have you been convicted of any crimes involving minors, abuse, or neglect?",
          value: volunteerDetails?.criminal_background_check_details?.convicted_of_a_crime
        },
        {
          title: "Description",
          value: volunteerDetails?.criminal_background_check_details?.description
        }
      ]
    },
    {
      title: "Sex Offender Registry Check",
      data: [
        {
          title: "Are you listed on any state or national sex offender registries?",
          value: volunteerDetails?.sex_offender_check_details?.checked_for_sex_offender
        },
        {
          title: "Description",
          value: volunteerDetails?.sex_offender_check_details?.description
        }
      ]
    },
    {
      title: "Disciplinary History",
      data: [
        {
          title: "Have you ever been terminated or asked to resign from a volunteer or employment position for reasons related to misconduct or inappropriate behavior?",
          value: volunteerDetails?.disciplinary_check_details?.terminated_from_volunteer_position
        },
        {
          title: "Have you ever been involved in any disputes with employers or organizations related to safety or ethical issues?",
          value: volunteerDetails?.disciplinary_check_details?.involved_in_disputes
        },
        {
          title: "Have you ever faced dismissal, suspension, probation, or any other disciplinary or academic action from a college, university, or professional school?",
          value: volunteerDetails?.disciplinary_check_details?.dismissed_from_institution
        },
        {
          title: "Description",
          value: volunteerDetails?.disciplinary_check_details?.description
        }
      ]
    },
    {
      title: "Health and Safety Information",
      data: [
        {
          title: "Do you have any physical or mental health conditions that may affect your ability to perform volunteer duties?",
          value: volunteerDetails?.health_and_safety_check_details?.having_health_issues
        },
        {
          title: "Description",
          value: volunteerDetails?.health_and_safety_check_details?.description
        }
      ]
    },
    {
      title: "Consents",
      data: [
        {
          title: "Do you consent to a criminal background check, including child abuse registry and sex offender checks?",
          value: volunteerDetails?.other_consents_details?.consent_to_background_checks
        },
        {
          title: "Do you agree to follow the organization’s policies on confidentiality, behavior, and safeguarding procedures?",
          value: volunteerDetails?.other_consents_details?.agree_to_follow_organization_policies
        },
        {
          title: "Do you understand that your volunteer role may be terminated based on any criminal activity or failure to adhere to the organization's policies?",
          value: volunteerDetails?.other_consents_details?.agree_to_understand_termination_of_volunteer_agreement
        },
        {
          title: "Description",
          value: volunteerDetails?.other_consents_details?.description
        }
      ]
    },
    {
      title: "Previous Volunteer Experience",
      data: [
        {
          title: "Have you previously volunteered with children or vulnerable populations?",
          value: volunteerDetails?.volunteer_experience_details?.previously_volunteered
        },
        {
          title: "Have you ever been involved in any incidents or complaints during previous volunteer roles?",
          value: volunteerDetails?.volunteer_experience_details?.invloved_in_complaints
        },
        {
          title: "Description",
          value: volunteerDetails?.volunteer_experience_details?.description
        }
      ]
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
    setVolunteerId(null);
    setIsOpen(false);
  };

  const handleAccept = () => {
    setIsAcceptLoading(true);
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
      }).finally(() => {
        setIsAcceptLoading(false);
      });
  };

  const handleReject = () => {
    setIsRejectLoading(true);
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
      }).finally(() => {
        setIsRejectLoading(false);
      });
  };

  return (
    <CenterModal
      title="Volunteer Profile Details"
      width={800}
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
      {
        isLoading ?
          <div className="h-[65vh] w-full flex items-center justify-center">
            <Spin size="large" />
          </div>
          : !data ? (
            <div className="h-[65vh] w-full flex flex-col items-center justify-center gap-2">
              <p className="text-lg font-medium">Volunteer not found</p>
              <Button type="primary" onClick={handleModalClose}>Go Back</Button>
            </div>
          ) : (
            <div>
              <div>
                <p className="text-xl font-medium mb-4">Personal Details</p>
                <div className="flex mb-3">
                  <Image
                    src={volunteerDetails?.profile_image || ""}
                    alt="profile"
                    className="rounded-xl min-h-[250px] max-h-[300px] !w-auto"
                    width={100}
                    height={100}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {profileDetails.map((item, index) => (
                    <div key={index} className={`flex flex-col gap-1 ${item?.rootClassName || ''}`}>
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
                <p className="text-xl font-medium border-t mt-5 pt-5 mb-4">Parent/Guardian Details</p>
                <div className="grid grid-cols-2 gap-4">
                  {parentDetails.map((item, index) => (
                    <div key={index} className={`flex flex-col gap-1 ${item?.rootClassName || ''}`}>
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
              <div className="border-t mt-5 pt-5">
                <Collapse
                  accordion
                  expandIconPosition="end"
                  expandIcon={({ isActive }) => (
                    <CaretRightOutlined className="text-gray-medium !text-lg" rotate={isActive ? 90 : 0} />
                  )}
                  className="bg-white border-none [&_.ant-collapse-header]:!p-2 [&_.ant-collapse-content-box]:!border-none"
                >
                  <Panel
                    header={<p className="text-xl font-medium underline">Some Legal Information</p>}
                    key="1"
                    className="[&_.ant-collapse-content]:mt-4 [&_.ant-collapse-content]:border-none [&_.ant-collapse-content-box]:!py-0"
                  >
                    <div className="flex flex-col gap-5 divide-y">
                      {legalInformations.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2 pt-3">
                          <p className="text-base font-medium text-black mb-1">{`${index + 1}) ${item.title}:`}</p>
                          {
                            item?.data?.map(field =>
                            (
                              <div className={(field?.title === "Description" && !field?.value) ? 'hidden' : ''}>
                                <p className="text-sm font-medium text-gray-medium">
                                  {field.title}
                                </p>
                                <p className="text-sm text-black font-medium">
                                  {field.value ? (field?.title === "Description" ? field?.value : 'Yes') : 'No'}
                                </p>
                              </div>
                            ))
                          }
                        </div>
                      ))}
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <div>
                <div className="flex flex-col gap-5 border-t my-4 pt-5">
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
              {
                volunteerDetails?.volunteer_experience_details?.volunteer_experience &&
                <div>
                  <p className="text-xl font-medium border-t mt-5 pt-5 mb-3">About Me</p>
                  <div className="flex gap-2 underline">
                    {volunteerDetails?.video_url && <a href={volunteerDetails?.video_url} target="_blank">See Video</a>}
                    {volunteerDetails?.document_url && <a href={volunteerDetails?.document_url} target="_blank" rel="noopener noreferrer" >
                      See Document
                    </a>}
                  </div>
                </div>
              }
            </div>
          )
      }
    </CenterModal>
  );
};

export default ProfileDetails;
