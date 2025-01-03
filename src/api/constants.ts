type UserType = "volunteer" | "learner";

export const endpoints: EndpointProps = {
  auth: {
    login: "admin/auth/sign_in",
  },
  onboarding: {
    updateOnboardingStatus: (id: string, type: UserType, status: string) =>
      `admin/onboarding/update_verification_status/${type}/${id}/${status}`,
  },
  common: (path: CommonPath) => `common/${path}/`,
  volunteer: {
    getAllVolunteers: "admin/volunteer",
    getVolunteerDetails: (volunteerId: string) =>
      `admin/volunteer/${volunteerId}`,
  },
};
