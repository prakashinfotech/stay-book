import { apiClient } from './client';
import { RazorpayOrder } from '../types';

export const paymentsApi = {
  createOrder: (data: { amount: number; currency?: string; holdId: string }) =>
    apiClient
      .post<{ statusCode: number; data: RazorpayOrder; message: string }>('/payments/create-order', data)
      .then((r) => r.data),
};
