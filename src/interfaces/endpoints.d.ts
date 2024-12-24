type EndpointProps = {
  auth: {
    login: string;
  };
  onboarding: {
    updateOnboardingStatus: (id: string, type: UserType) => string;
  };
  volunteer: {
    getAllVolunteers: string;
    getVolunteerDetails: (volunteerId: string) => string;
  };
};
