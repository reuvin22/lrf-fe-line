import axios from "axios";
import { toast } from "react-toastify";
import environment from "../environment";

const axiosApi = axios.create({
  baseURL: environment.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't toast for intentionally cancelled requests
    if (error.code === "ERR_CANCELED") return Promise.reject(error);

    const status = error.response?.status ?? 0;
    const url = error.config?.url ?? "";

    // Use a stable toastId so the same error doesn't spam (e.g. dashboard polling)
    const toastId = `api-err-${status}-${url}`;

    const serverMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      null;

    const fallback =
      status === 0   ? "Network error — check your connection" :
      status === 401 ? "Session expired — please reload" :
      status === 403 ? "Access denied" :
      status === 404 ? "Not found" :
      status === 422 ? "Validation error" :
      status >= 500  ? "Server error — please try again later" :
                       error.message || "Something went wrong";

    toast.error(serverMsg || fallback, { toastId });
    return Promise.reject(error);
  }
);

export default axiosApi;