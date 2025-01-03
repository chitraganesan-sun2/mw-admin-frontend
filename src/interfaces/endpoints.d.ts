type EndpointProps = {
  auth: {
    login: string;
  };
  onboarding: {
    updateOnboardingStatus: (
      id: string,
      type: UserType,
      status: string
    ) => string;
  };
  common: (path: CommonPath) => string;
  volunteer: {
    getAllVolunteers: string;
    getVolunteerDetails: (volunteerId: string) => string;
  };
};

type CommonPath = "skills" | "languages" | "subjects" | "media" | "categories";