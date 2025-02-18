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
  resources: {
      get: string;
      getMyResources: string,
      getResourcesByCategory: (category: string) => string,
      getCategories: string,
      getResource: (resource_id: string) => string,
      delete: (resource_id: string) => string,
  };
  post: {
    getPosts: string,
    getSinglePost: (post_id: string) => string,
    deletePost: (id: string) => string,
  };
  comment: {
    getPostComments: (post_id: string) => string,
    deleteComment: (comment_id: string) => string,
  };
};

type CommonPath = "skills" | "languages" | "subjects" | "media" | "categories";