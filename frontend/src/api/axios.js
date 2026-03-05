import axios from 'axios';

// The base URL must point to Nginx which handles TLS termination
// Nginx is acting as an API Gateway to the public-cloud service
const API_URL = import.meta.env.VITE_API_URL || 'https://localhost';

const api = axios.create({
    baseURL: API_URL,
});

// Intercept requests and add the bearer token if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
