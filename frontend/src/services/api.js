import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

// Interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 400 && error.response.data.errors) {
            // express-validator format
            error.response.data.errors.forEach(err => toast.error(err.msg));
        } else if (error.response?.status === 401) {
            // Handle unauthorized - potentially redirect to login
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
