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
  resources: {
      get: "resource",
      getMyResources: "resource/myresources",
      getResourcesByCategory: (category: string) => `resource/categories/${category}`,
      getCategories: "resource/categories/all",
      getResource: (resource_id: string) => `resource/${resource_id}`,
      delete: (resource_id: string) => `resource/${resource_id}`,
  },
  post: {
      getPosts: "post",
      getSinglePost: (post_id: string) => `post/${post_id}`,
      deletePost: (id: string) => `/post/${id}`,
  },  
  comment: {
    getPostComments: (post_id: string) => `comment/${post_id}`,
    deleteComment: (comment_id: string) => `comment/${comment_id}`, 
  },
};
