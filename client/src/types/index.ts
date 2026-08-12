export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'CUSTOMER' | 'PARTNER' | 'ADMIN';
  emailVerified?: boolean;
  createdAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  tag: string;
  sortOrder: number;
}

export interface RatePlan {
  id: string;
  roomTypeId: string;
  planType: string;
  discountPercent: string;
  minNights: number;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  description: string | null;
  maxOccupancy: number;
  bedConfig: unknown;
  basePrice: string;
  mealPlan: string;
  cancellationPolicy: string;
  ratePlans: RatePlan[];
}

export interface Property {
  id: string;
  name: string;
  city: string;
  address: string;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  category: string;
  status: string;
  starRating: number | null;
  amenities: string[];
  description: string | null;
  bookingMode: string;
  images: PropertyImage[];
  roomTypes: RoomType[];
}

export interface SearchResult {
  id: string;
  name: string;
  city: string;
  address: string;
  category: string;
  status: string;
  star_rating: number | null;
  amenities: unknown;
  description: string | null;
  booking_mode: string;
  min_price: string | null;
  cover_image: string | null;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface BookingListItem {
  id: string;
  confirmationNumber: string;
  pin: string;
  status: BookingStatus;
  checkin: string;
  checkout: string;
  totalPrice: string;
  guestName: string;
  adults: number;
  children: number;
  createdAt: string;
  property: { id: string; name: string; city: string };
  roomType: { id: string; name: string };
}

export interface CreatedBooking {
  id: string;
  confirmationNumber: string;
  pin: string;
  status: string;
  checkin: string;
  checkout: string;
  totalPrice: string;
  guestName: string;
  guestEmail: string;
  adults: number;
  children: number;
  propertyId: string;
  roomTypeId: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  statusCode: number;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}
