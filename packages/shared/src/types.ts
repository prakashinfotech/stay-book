export type Role = 'CUSTOMER' | 'PARTNER' | 'ADMIN';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type PropertyStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED';
export type PropertyCategory = 'HOTEL' | 'APARTMENT' | 'VILLA' | 'HOSTEL' | 'OTHER';
export type MealPlan = 'NONE' | 'BREAKFAST';
export type CancellationPolicy = 'FLEXIBLE' | 'NON_REFUNDABLE';
export type RatePlanType = 'STANDARD' | 'NON_REFUNDABLE' | 'WEEKLY';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface Property {
  id: string;
  name: string;
  city: string;
  address: string;
  category: PropertyCategory;
  status: PropertyStatus;
  starRating: number | null;
  amenities: string[];
  createdAt: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  maxOccupancy: number;
  basePrice: number;
  mealPlan: MealPlan;
  cancellationPolicy: CancellationPolicy;
}

export interface Booking {
  id: string;
  confirmationNumber: string;
  pin: string;
  status: BookingStatus;
  checkin: string;
  checkout: string;
  totalPrice: number;
  guestName: string;
  guestEmail: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  statusCode?: number;
  data: T;
  message?: string;
}

export interface ApiError {
  error: { code: string; message: string; details?: Record<string, string[]> };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
