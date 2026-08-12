import { apiClient } from './client';

export const propertiesApi = {
  search: (params: Record<string, string | number>) =>
    apiClient.get('/search', { params }).then((r) => r.data),

  suggestions: (q: string) =>
    apiClient.get('/search/suggestions', { params: { q } }).then((r) => r.data),

  destinationCounts: () =>
    apiClient.get('/search/destinations').then((r) => r.data),

  getById: (id: string, params?: Record<string, string>) =>
    apiClient.get(`/properties/${id}`, { params }).then((r) => r.data),

  getFeatured: () =>
    apiClient.get('/properties/featured').then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/properties', data).then((r) => r.data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/properties/${id}`, data).then((r) => r.data),

  publish: (id: string) =>
    apiClient.post(`/properties/${id}/publish`).then((r) => r.data),

  addRoomType: (
    id: string,
    data: {
      name: string;
      description?: string;
      maxOccupancy: number;
      basePrice: number;
      mealPlan?: 'NONE' | 'BREAKFAST';
      cancellationPolicy?: 'FLEXIBLE' | 'NON_REFUNDABLE';
      bedConfig?: Record<string, unknown>;
    },
  ) => apiClient.post(`/properties/${id}/room-types`, data).then((r) => r.data),

  addImages: (
    id: string,
    images: { url: string; tag: string; sortOrder?: number }[],
  ) => apiClient.post(`/properties/${id}/images`, { images }).then((r) => r.data),
};
