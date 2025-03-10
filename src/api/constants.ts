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
  learner: {
    getAllLearners: "admin/learner",
    getLearnerDetails: (learnerId: string) =>
      `admin/learner/${learnerId}`,
  },
  resources: {
      get: "admin/resource",
      getResource: (resource_id: string) => `admin/resource/${resource_id}`,
      delete: (resource_id: string) => `admin/resource/${resource_id}`,
      getResourcesByCategory: (category: string) => `resource/categories/${category}`,
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
  },
  report: {
    getReportStatus: (report_id: string) => `admin/report/${report_id}`,
    getAllReports: (report_type: string) => `admin/report/${report_type}`,
    getReport: (report_id: string) => `admin/report/${report_id}`,
    resolveReport: (report_id: string) => `admin/report/${report_id}`,
    rejectReport: (report_id: string) => `admin/report/${report_id}`,
  }
};
