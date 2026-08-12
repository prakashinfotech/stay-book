import { apiClient } from './client';

export const adminApi = {
  // Stats & Lists
  getStats: () =>
    apiClient.get('/admin/stats').then(r => r.data),

  getUsers: (params?: { role?: string; q?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/users', { params }).then(r => r.data),

  getProperties: (params?: { status?: string; q?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/properties', { params }).then(r => r.data),

  getBookings: (params?: { status?: string; q?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/bookings', { params }).then(r => r.data),

  // Property Status & Approval
  updatePropertyStatus: (propertyId: string, status: string) =>
    apiClient.patch(`/admin/properties/${propertyId}/status`, { status }).then(r => r.data),

  getPendingProperties: (params?: { q?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/properties/pending', { params }).then(r => r.data),

  approveProperty: (propertyId: string, note?: string) =>
    apiClient.post(`/admin/properties/${propertyId}/approve`, { note }).then(r => r.data),

  rejectProperty: (propertyId: string, reason: string) =>
    apiClient.post(`/admin/properties/${propertyId}/reject`, { reason }).then(r => r.data),

  // User Management
  updateUserRole: (userId: string, role: string) =>
    apiClient.patch(`/admin/users/${userId}/role`, { role }).then(r => r.data),

  deactivateUser: (userId: string) =>
    apiClient.delete(`/admin/users/${userId}`).then(r => r.data),

  restoreUser: (userId: string) =>
    apiClient.post(`/admin/users/${userId}/restore`).then(r => r.data),

  // Booking Management
  updateBookingStatus: (bookingId: string, status: string) =>
    apiClient.patch(`/admin/bookings/${bookingId}/status`, { status }).then(r => r.data),

  // KYC Management
  getAllKyc: (params?: { kycStatus?: string; q?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/kyc', { params }).then(r => r.data),

  getKycById: (kycId: string) =>
    apiClient.get(`/admin/kyc/${kycId}`).then(r => r.data),

  approveKyc: (kycId: string, note?: string) =>
    apiClient.post(`/admin/kyc/${kycId}/approve`, { note }).then(r => r.data),

  rejectKyc: (kycId: string, reason: string) =>
    apiClient.post(`/admin/kyc/${kycId}/reject`, { reason }).then(r => r.data),

  // Audit Logs
  getAuditLogs: (params?: { entityType?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/audit-logs', { params }).then(r => r.data),
};
