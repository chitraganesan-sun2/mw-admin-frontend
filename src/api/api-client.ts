import { API_URL } from "@/definitions";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import Cookies from "js-cookie";
import { showToast } from "@/components/common/Toast";
import { clearSessionCookies } from "@/utils/session";
import { coalesceMutations } from "@/utils/inflight";

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
      message: "Something went wrong. Please try again.",
      status: error.response?.status || 500,
      data: error.response?.data,
    };

    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          apiError.message = "Please log in again.";
          // Session expired/invalid, or the token isn't an admin token — force a
          // clean re-login instead of leaving the admin console silently broken
          // (every subsequent call would just fail the same way). Guard against
          // redirect loops by skipping it if already on the login page.
          if (typeof window !== "undefined" && window.location.pathname !== "/") {
            clearSessionCookies();
            window.location.href = "/";
          }
          break;
        case 403:
          // Unlike 401, the admin's session is still valid here - they're just
          // not allowed to do this one thing. Surface it, don't force a logout.
          apiError.message = "You don't have permission to do that.";
          showToast({ type: "error", message: "You don't have permission to do that." });
          break;
        case 404:
          apiError.message = "We couldn't find that.";
          break;
        case 422:
          apiError.message = "Please check the details and try again.";
          break;
        case 500:
          apiError.message = "Something went wrong on our end. Please try again.";
          break;
        default:
          apiError.message = "Something went wrong. Please try again.";
      }
    } else if (error.request) {
      // Request made but no response received
      apiError.message = "Couldn't reach the server. Check your connection and try again.";
    }

    return Promise.reject(apiError);
  }
);

// Safety net under every UI-level double-click guard: two identical state-changing requests that
// are in flight at the same moment share one network call (see utils/inflight.ts).
const send = coalesceMutations((options: AxiosRequestConfig) => axiosInstance(options));

export const request = async (
  options: AxiosRequestConfig
): Promise<AxiosResponse | ApiError> => {
  try {
    const response = await send(options);
    return response;
  } catch (error) {
    // 401 redirect/cleanup is handled by the response interceptor above.
    return Promise.reject(error);
  }
};
