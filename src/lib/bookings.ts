// Booking persistence layer — localStorage only (Phase 2 will swap to Prisma/Postgres).

export type Booking = {
  id: string;
  listingId: string;
  listingTitle: string;
  location: string;
  country: string;
  image: string;
  pricePerNight: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  contactName: string;
  contactEmail: string;
  total: number;
  cleaning: number;
  serviceFee: number;
  createdAt: string;
};

const KEY = "softrent-bookings";

export function getBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

export function saveBooking(b: Booking): void {
  if (typeof window === "undefined") return;
  const all = getBookings();
  all.unshift(b);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function generateBookingId(): string {
  // Short, friendly: SR-XXXXXX
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "SR-";
  for (let i = 0; i < 6; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

export function diffNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn + "T00:00:00").getTime();
  const b = new Date(checkOut + "T00:00:00").getTime();
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}
