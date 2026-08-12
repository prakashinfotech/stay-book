import { apiClient } from './client';

export const bookingsApi = {
  createHold: (data: {
    roomTypeId: string;
    propertyId: string;
    checkin: string;
    checkout: string;
    adults: number;
    children: number;
  }) => apiClient.post('/bookings/hold', data).then((r) => r.data),

  createBooking: (data: {
    holdId: string;
    ratePlanId?: string;
    adults: number;
    children: number;
    guestDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      country: string;
      specialRequests?: string;
      arrivalTime?: string;
    };
    payment: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    };
  }) => apiClient.post('/bookings', data).then((r) => r.data),

  getMyBookings: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/bookings', { params }).then((r) => r.data),

  getById: (bookingId: string) =>
    apiClient.get(`/bookings/${bookingId}`).then((r) => r.data),

  cancel: (bookingId: string) =>
    apiClient.post(`/bookings/${bookingId}/cancel`).then((r) => r.data),
};
