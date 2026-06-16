import axios from "axios";

function resolveApiRoot() {
  if (typeof window !== "undefined" && window.__ENV__?.VITE_API_URL) {
    return window.__ENV__.VITE_API_URL;
  }
  return import.meta.env.VITE_API_URL || "http://localhost:8080";
}

const API_ROOT = resolveApiRoot();
const REQUEST_TIMEOUT_MS = 120_000;

const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response, code } = error;

    console.error("[API Error]", {
      url: config?.url,
      method: config?.method,
      status: response?.status,
      data: response?.data,
      code,
    });

    if (response?.status === 401 && !config?.url?.includes("/auth/")) {
      localStorage.removeItem("token");
      localStorage.removeItem("session");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export function getApiError(error, fallback = "Request failed") {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "Request timed out. The server took too long to respond. Please try again.";
    }
    if (error.code === "ERR_NETWORK" || !error.response) {
      return "Network error. Check your connection and ensure the backend is running.";
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.error;

    if (serverMessage) return serverMessage;

    if (status === 429) return "Too many requests. Please wait a moment and try again.";
    if (status === 401) return "Session expired. Please sign in again.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "The requested resource was not found.";
    if (status === 502 || status === 503) return "Service temporarily unavailable. Please try again shortly.";
    if (status >= 500) return "Server error. Please try again later.";
  }

  return error?.message || fallback;
}

export default api;
