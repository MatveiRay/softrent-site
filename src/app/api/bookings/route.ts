/**
 * Bookings API
 *   POST /api/bookings — create pending booking (guest or logged-in)
 *   GET  /api/bookings — list current user's bookings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AvailabilityConflictError,
  createPendingBooking,
  serializeBooking,
} from "@/lib/booking-service";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingSlug = String(body.listingSlug ?? "");
  const checkIn = String(body.checkIn ?? "");
  const checkOut = String(body.checkOut ?? "");
  const contactName = String(body.contactName ?? "").trim();
  const contactEmail = String(body.contactEmail ?? "").trim();
  const adults = Math.max(1, Number(body.adults) || 2);
  const children = Math.max(0, Number(body.children) || 0);
  const infants = Math.max(0, Number(body.infants) || 0);

  if (!listingSlug || !checkIn || !checkOut || !contactName || !contactEmail) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const session = await auth();
  let userId: string | undefined;
  if (session?.user?.email) {
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { name: session.user.name ?? undefined },
      create: {
        email: session.user.email,
        name: session.user.name ?? undefined,
      },
    });
    userId = user.id;
  }

  try {
    const booking = await createPendingBooking({
      listingSlug,
      checkIn,
      checkOut,
      contactName,
      contactEmail,
      adults,
      children,
      infants,
      userId,
    });

    return NextResponse.json({
      publicId: booking.publicId,
      nights: booking.nights,
      total: booking.total,
      status: booking.status,
    });
  } catch (error) {
    if (error instanceof AvailabilityConflictError) {
      return NextResponse.json(
        { error: "Selected dates are unavailable" },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : "Booking failed";
    const status =
      message === "Listing not found"
        ? 404
        : message === "Invalid date range"
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ bookings: [] });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const rows = await prisma.booking.findMany({
    where: {
      OR: [
        ...(user ? [{ userId: user.id }] : []),
        { contactEmail: session.user.email },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          slug: true,
          title: true,
          location: true,
          country: true,
          images: true,
        },
      },
    },
  });

  return NextResponse.json({
    bookings: rows.map(serializeBooking),
  });
}
