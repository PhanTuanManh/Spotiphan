// frontend/src/lib/axios.ts

import axios from "axios";

// Tạo instance axios cơ bản
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

// Type cho queue request
type FailedRequest = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};

let isRefreshing = false;
let failedRequests: FailedRequest[] = [];

// Hàm thiết lập interceptors
export const setupAxiosInterceptors = (
  getToken: () => Promise<string | null>
) => {
  // Request interceptor
  axiosInstance.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedRequests.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await getToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Retry các request đã fail
            failedRequests.forEach(({ resolve }) => resolve(newToken));
            failedRequests = [];

            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          failedRequests.forEach(({ reject }) => reject(refreshError));
          failedRequests = [];
          throw refreshError;
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
