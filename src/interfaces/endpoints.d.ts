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
  broadcast: {
    getRecipients: string;
    sendEmail: string;
    sendEmailWithAttachment: string;
  };
  volunteer: {
    allVolunteers: string;
    getAllVolunteers: string;
    getVolunteerDetails: (volunteerId: string) => string;
    deleteVolunteer: (volunteerId: string) => string;
  };
  learner: {
    allLearners: string;
    getAllLearners: string;
    getLearnerDetails: (learnerId: string) => string;
    deleteLearner: (learnerId: string) => string;
  };
  resources: {
    get: string;
    getResource: (resource_id: string) => string;
    delete: (resource_id: string) => string;
    getCategories: string;
    getResourcesByCategory: (category: string) => string;
  };
  post: {
    getPosts: string;
    getSinglePost: (post_id: string) => string;
    deletePost: (id: string) => string;
  };
  comment: {
    getPostComments: (post_id: string) => string;
    deleteComment: (comment_id: string) => string;
    getLocation: string;
    getLanguage: string;
  };
  report: {
    getReportStatus: (report_id: string) => string;
    getAllReports: (report_type: string) => string;
    getReport: (report_id: string) => string;
    resolveReport: (report_id: string) => string;
    rejectReport: (report_id: string) => string;
  };
  hiring: {
    getAllApplications: string;
    getApplication: (application_id: string) => string;
  };
  donations: {
    list: string;
    getReceipt: (donation_id: string) => string;
  };
};

type CommonPath = "skills" | "languages" | "subjects" | "media" | "categories";
