// src/api/axios.js
import axios from "axios";


const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
// const BASE_URL = "http://localhost:4000";


const API = axios.create({
    baseURL: BASE_URL + "/api",
    withCredentials: true,
});



// REFRESH TOKEN INTERCEPTOR
API.interceptors.response.use(
    res => res,
    async err => {
        const originalRequest = err.config;

        // Only try refresh ONCE per request
        if (
            err.response &&
            err.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.endsWith("/auth/refresh")
        ) {
            originalRequest._retry = true;
            try {
                await API.post("/auth/refresh");
                return API(originalRequest);
            } catch (refreshErr) {
                // If refresh fails, do NOT retry again
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(err);
    }
);


export default API;
