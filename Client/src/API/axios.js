// src/api/axios.js
import axios from "axios";


const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";


const 
API = axios.create({
    baseURL: BASE_URL + "/api",
    withCredentials: true,
});



// REFRESH TOKEN INTERCEPTOR
API.interceptors.response.use(
    res => res,
    async err => {
        const originalRequest = err.config;

        if (err.response && err.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Call refresh endpoint, which will use the refreshToken cookie automatically
            await API.post("/auth/refresh"); // No need to extract token from response

            // Retry the original request, browser will send new accessToken cookie automatically
            return API(originalRequest);
        }
        
        return Promise.reject(err);
    }
);


export default API;