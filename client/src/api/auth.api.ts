import { apiClient } from './client';

export const authApi = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string; role?: string }) =>
    apiClient.post('/auth/register', data).then((r) => r.data),

  verifyOtp: (userId: string, code: string) =>
    apiClient.post('/auth/verify-otp', { userId, code }).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  resendOtp: (userId: string) =>
    apiClient.post('/auth/resend-otp', { userId }).then((r) => r.data),

  logout: () =>
    apiClient.post('/auth/logout').then((r) => r.data),
};
