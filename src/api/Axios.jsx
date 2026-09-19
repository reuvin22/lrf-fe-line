import axios from "axios";
import environment from "../environment";

const axiosApi = axios.create({
  baseURL: `${environment.API_URL}${environment.VITE_API_BASE_URL}`,
  timeout: 0,
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

export default axiosApi;
