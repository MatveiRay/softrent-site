import type { BookingStatus } from "@prisma/client";
import { prisma } from "./prisma";
import {
  assertListingAvailable,
  AvailabilityConflictError,
} from "./availability";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type BookingInput = {
  listingSlug: string;
  checkIn: string;
  checkOut: string;
  contactName: string;
  contactEmail: string;
  adults?: number;
  children?: number;
  infants?: number;
  userId?: string;
};

export type BookingWithListing = {
  publicId: string;
  pricePerNight: number;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  contactName: string;
  contactEmail: string;
  total: number;
  cleaning: number;
  serviceFee: number;
  createdAt: Date;
  status: BookingStatus;
  listing: {
    slug: string;
    title: string;
    location: string;
    country: string;
    images: string[];
  };
};

export function generatePublicId() {
  let id = "SR-";
  for (let i = 0; i < 6; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return id;
}

export function calculateBookingTotals(
  pricePerNight: number,
  checkIn: string | Date,
  checkOut: string | Date
) {
  const start = checkIn instanceof Date ? checkIn : new Date(checkIn);
  const end = checkOut instanceof Date ? checkOut : new Date(checkOut);
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  const subtotal = pricePerNight * nights;
  const cleaning = 95;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + cleaning + serviceFee;
  return { nights, subtotal, cleaning, serviceFee, total };
}

export function serializeBooking(b: BookingWithListing) {
  return {
    id: b.publicId,
    listingId: b.listing.slug,
    listingTitle: b.listing.title,
    location: b.listing.location,
    country: b.listing.country,
    image: b.listing.images[0] ?? "",
    pricePerNight: b.pricePerNight,
    checkIn: b.checkIn.toISOString().slice(0, 10),
    checkOut: b.checkOut.toISOString().slice(0, 10),
    nights: b.nights,
    guests: {
      adults: b.adults,
      children: b.children,
      infants: b.infants,
    },
    contactName: b.contactName,
    contactEmail: b.contactEmail,
    total: b.total,
    cleaning: b.cleaning,
    serviceFee: b.serviceFee,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  };
}

export function assertReviewTransitionAllowed(
  currentStatus: BookingStatus,
  nextStatus: Extract<BookingStatus, "CONFIRMED" | "CANCELED">
) {
  if (currentStatus !== "PENDING") {
    throw new Error("Only pending bookings can be reviewed");
  }
  return nextStatus;
}

export async function createPendingBooking(input: BookingInput) {
  const listing = await prisma.listing.findUnique({
    where: { slug: input.listingSlug },
  });
  if (!listing || !listing.isPublished) {
    throw new Error("Listing not found");
  }

  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);
  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime()) ||
    checkOut <= checkIn
  ) {
    throw new Error("Invalid date range");
  }

  await assertListingAvailable(listing.id, checkIn, checkOut);

  const { nights, subtotal, cleaning, serviceFee, total } =
    calculateBookingTotals(listing.price, checkIn, checkOut);

  return prisma.booking.create({
    data: {
      publicId: generatePublicId(),
      listingId: listing.id,
      userId: input.userId,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      checkIn,
      checkOut,
      nights,
      adults: Math.max(1, input.adults ?? 2),
      children: Math.max(0, input.children ?? 0),
      infants: Math.max(0, input.infants ?? 0),
      pricePerNight: listing.price,
      subtotal,
      cleaning,
      serviceFee,
      total,
      status: "PENDING",
    },
  });
}

export async function reviewPendingBooking(
  bookingId: string,
  nextStatus: Extract<BookingStatus, "CONFIRMED" | "CANCELED">
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) throw new Error("Booking not found");
  assertReviewTransitionAllowed(booking.status, nextStatus);

  if (nextStatus === "CONFIRMED") {
    await assertListingAvailable(
      booking.listingId,
      booking.checkIn,
      booking.checkOut,
      booking.id
    );
  }

  return prisma.booking.update({
    where: { id: booking.id },
    data: { status: nextStatus },
  });
}

export { AvailabilityConflictError };
