export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELED";

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
  status: BookingStatus;
  createdAt: string;
};

export function diffNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn + "T00:00:00").getTime();
  const b = new Date(checkOut + "T00:00:00").getTime();
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}
