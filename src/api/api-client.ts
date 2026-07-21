import { API_URL } from "@/definitions";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import Cookies from "js-cookie";

// Define custom error interface
interface ApiError {
  message: string;
  status: number;
  data?: any;
}

// Create and configure axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "any",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData content type
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: "An unexpected error occurred",
      status: error.response?.status || 500,
      data: error.response?.data,
    };

    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          apiError.message = "Unauthorized access";
          // Session expired/invalid — force a clean re-login instead of
          // leaving the admin console silently broken. Guard against
          // redirect loops by skipping it if already on the login page.
          if (typeof window !== "undefined" && window.location.pathname !== "/") {
            Cookies.remove("token", { path: "/" });
            Cookies.remove("role", { path: "/" });
            Cookies.remove("onboarded_status", { path: "/" });
            Cookies.remove("learner_id", { path: "/" });
            Cookies.remove("volunteer_id", { path: "/" });
            Cookies.remove("lastActivity", { path: "/" });
            window.location.href = "/";
          }
          break;
        case 403:
          apiError.message = "Access forbidden";
          break;
        case 404:
          apiError.message = "Resource not found";
          break;
        case 422:
          apiError.message = "Validation error";
          break;
        case 500:
          apiError.message = "Internal server error";
          break;
        default:
          apiError.message = "Something went wrong";
      }
    } else if (error.request) {
      // Request made but no response received
      apiError.message = "No response from server";
    }

    return Promise.reject(apiError);
  }
);

export const request = async (
  options: AxiosRequestConfig
): Promise<AxiosResponse | ApiError> => {
  try {
    const response = await axiosInstance(options);
    return response;
  } catch (error) {
    // 401 redirect/cleanup is handled by the response interceptor above.
    return Promise.reject(error);
  }
};
