import { prisma } from "./prisma";
import { reviewPendingBooking } from "./booking-service";

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const configured = process.env.ADMIN_EMAILS?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!configured || configured.length === 0) return true;
  return configured.includes(email.toLowerCase());
}

export async function listAdminListings() {
  return prisma.listing.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function createAdminListing(input: {
  slug: string;
  title: string;
  description: string;
  location: string;
  country: string;
  category: "TROPICAL" | "MOUNTAIN";
  price: number;
  guests: number;
}) {
  return prisma.listing.create({
    data: {
      ...input,
      source: "ADMIN",
      bedrooms: 1,
      beds: 1,
      baths: 1,
      images: [],
      amenities: [],
      isPublished: false,
    },
  });
}

export async function updateAdminListing(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    location: string;
    country: string;
    category: "TROPICAL" | "MOUNTAIN";
    price: number;
    guests: number;
    isPublished: boolean;
  }>
) {
  return prisma.listing.update({
    where: { id },
    data: input,
  });
}

export async function listPendingBookings() {
  return prisma.booking.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      listing: {
        select: {
          slug: true,
          title: true,
          location: true,
          country: true,
        },
      },
    },
  });
}

export async function reviewAdminBooking(
  id: string,
  status: "CONFIRMED" | "CANCELED"
) {
  return reviewPendingBooking(id, status);
}

export async function listAvailabilityBlocks() {
  return prisma.availabilityBlock.findMany({
    orderBy: { startDate: "asc" },
    include: {
      listing: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });
}

export async function createAvailabilityBlock(input: {
  listingId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}) {
  return prisma.availabilityBlock.create({
    data: input,
  });
}

export async function deleteAvailabilityBlock(id: string) {
  return prisma.availabilityBlock.delete({
    where: { id },
  });
}

export async function listIngestRecords() {
  return prisma.ingestRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
