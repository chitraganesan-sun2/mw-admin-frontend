import React, { useEffect, useState } from "react";
import CenterModal from "@/components/common/Modals/CenterModal";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API, PUT_API } from "@/api/request";
import moment from "moment";

interface VolunteerDetails {
  name: string;
  date_of_birth: string;
  email_address: string;
  phone_number: string;
  zip_code: string;
  high_school_status: string;
  onboarded_status: string;
  volunteer_id: string;
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
      };
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
    return <div></div>;
  }

  return (
    <CenterModal
      title="Profile Details"
      width={720}
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
    </CenterModal>
  );
};

export default ProfileDetails;
