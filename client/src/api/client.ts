import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = (original?.url as string | undefined)?.includes('/auth/');

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      const { refreshToken, setTokens, clear } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            { refreshToken },
          );
          setTokens(data.data.accessToken, data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return apiClient(original);
        } catch {
          clear();
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);
