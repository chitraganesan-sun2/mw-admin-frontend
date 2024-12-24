type UserType = "volunteer" | "learner";

export const endpoints: EndpointProps = {
  auth: {
    login: "admin/auth/sign_in",
  },
  onboarding: {
    updateOnboardingStatus: (id: string, type: UserType) =>
      `admin/onboarding/update_verification_status/${type}/${id}`,
  },
  volunteer: {
    getAllVolunteers: "admin/volunteer",
    getVolunteerDetails: (volunteerId: string) =>
      `admin/volunteer/${volunteerId}`,
  },
};
