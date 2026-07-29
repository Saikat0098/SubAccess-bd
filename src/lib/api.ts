import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('subaccess_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('subaccess_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh-token', { refreshToken });
          if (res.data && res.data.tokens) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.tokens;
            localStorage.setItem('subaccess_token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('subaccess_refresh_token', newRefreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('subaccess_token');
          localStorage.removeItem('subaccess_refresh_token');
        }
      } else {
        localStorage.removeItem('subaccess_token');
        localStorage.removeItem('subaccess_refresh_token');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
