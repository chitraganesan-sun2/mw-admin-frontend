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
    allVolunteers: "admin/volunteer/development/all",
    getAllVolunteers: "admin/volunteer",
    getVolunteerDetails: (volunteerId: string) =>
      `admin/volunteer/${volunteerId}`,
    deleteVolunteer: (volunteerId: string) => `admin/volunteer/${volunteerId}`,
  },
  learner: {
    allLearners: "admin/learner/development/all",
    getAllLearners: "admin/learner",
    getLearnerDetails: (learnerId: string) => `admin/learner/${learnerId}`,
    deleteLearner: (learnerId: string) => `admin/learner/${learnerId}`,
  },
  resources: {
    get: "admin/resource",
    getResource: (resource_id: string) => `admin/resource/${resource_id}`,
    delete: (resource_id: string) => `admin/resource/${resource_id}`,
    getResourcesByCategory: (category: string) =>
      `resource/categories/${category}`,
    getCategories: "resource/categories/all",
  },
  post: {
    getPosts: "admin/post",
    getSinglePost: (post_id: string) => `admin/post/${post_id}`,
    deletePost: (id: string) => `admin/post/${id}`,
  },
  comment: {
    getPostComments: (post_id: string) => `admin/comment/${post_id}`,
    deleteComment: (comment_id: string) => `admin/comment/${comment_id}`,
    getLocation: "admin/mail/get_locations",
    getLanguage: "admin/mail/get_languages",
  },
  broadcast: {
    getRecipients: "admin/mail/get_recipients",
    sendEmail: "admin/mail/send_email",
    sendEmailWithAttachment: "admin/mail/send_email_with_attachments",
  },
  report: {
    getReportStatus: (report_id: string) => `admin/report/${report_id}`,
    getAllReports: (report_type: string) => `admin/report/${report_type}`,
    getReport: (report_id: string) => `admin/report/${report_id}`,
    resolveReport: (report_id: string) => `admin/report/${report_id}`,
    rejectReport: (report_id: string) => `admin/report/${report_id}`,
  },
  hiring: {
    getAllApplications: "admin/join-us",
    getApplication: (application_id: string) => `admin/join-us/${application_id}`,
  },
  donations: {
    list: "admin/donation/list",
    getReceipt: (donation_id: string) => `admin/donation/${donation_id}`,
  },
  tutorialLinks: {
    getAll: "admin/tutorial-links/",
    create: "admin/tutorial-links/",
    update: (link_id: string) => `admin/tutorial-links/${link_id}`,
    delete: (link_id: string) => `admin/tutorial-links/${link_id}`,
  },
  listOfValues: {
    getAll: (type: string) => `admin/list-of-values/${type}/`,
    create: (type: string) => `admin/list-of-values/${type}/`,
    update: (type: string, id: string) => `admin/list-of-values/${type}/${id}`,
    delete: (type: string, id: string) => `admin/list-of-values/${type}/${id}`,
  },
};
