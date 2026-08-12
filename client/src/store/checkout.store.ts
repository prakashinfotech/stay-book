import { create } from 'zustand';

interface PriceBreakdown {
  basePrice: number;
  nights: number;
  taxes: number;
  total: number;
}

interface RoomSelection {
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  priceBreakdown: PriceBreakdown;
  holdId: string | null;
}

interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  specialRequests?: string;
  arrivalTime?: string;
  isMainGuest: boolean;
  travelPurpose?: 'leisure' | 'work';
  addOns?: { flight: boolean; carRental: boolean; airportTaxi: boolean };
  paperlessConfirmation?: boolean;
}

interface CheckoutState {
  roomSelection: RoomSelection | null;
  guestDetails: GuestDetails | null;
  setRoomSelection: (selection: RoomSelection) => void;
  setHoldId: (holdId: string) => void;
  setGuestDetails: (details: GuestDetails) => void;
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  roomSelection: null,
  guestDetails: null,
  setRoomSelection: (selection) => set({ roomSelection: selection }),
  setHoldId: (holdId) =>
    set((state) =>
      state.roomSelection ? { roomSelection: { ...state.roomSelection, holdId } } : {},
    ),
  setGuestDetails: (details) => set({ guestDetails: details }),
  clear: () => set({ roomSelection: null, guestDetails: null }),
}));
