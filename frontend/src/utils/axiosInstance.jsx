import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

const baseURL = 'http://127.0.0.1:8000';

const axiosInstance = axios.create({
    baseURL,
});

axiosInstance.interceptors.request.use(async req => {
    let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

    if (!authTokens) {
        return req;
    }

    const user = jwtDecode(authTokens.access_token);
    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

    if (!isExpired) {
        req.headers.Authorization = `Bearer ${authTokens.access_token}`;
        return req;
    }

    // --- Token Refresh Logic ---
    try {
        const response = await axios.post(`${baseURL}/api/auth/token/refresh/`, {
            refresh: authTokens.refresh_token
        });

        localStorage.setItem('authTokens', JSON.stringify(response.data));
        req.headers.Authorization = `Bearer ${response.data.access_token}`;
        return req;

    } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem('authTokens'); 
        window.location.href = '/login';
        return Promise.reject(refreshError);
    }
});

export default axiosInstance;