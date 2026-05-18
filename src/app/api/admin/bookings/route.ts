import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  isAdminEmail,
  listPendingBookings,
  reviewAdminBooking,
} from "@/lib/admin-service";
import { AvailabilityConflictError } from "@/lib/booking-service";

async function ensureAdmin() {
  const session = await auth();
  return isAdminEmail(session?.user?.email) ? session : null;
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ bookings: await listPendingBookings() });
}

export async function PATCH(req: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const status = body.status === "CANCELED" ? "CANCELED" : "CONFIRMED";
  try {
    const booking = await reviewAdminBooking(String(body.id), status);
    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof AvailabilityConflictError) {
      return NextResponse.json(
        { error: "Selected dates are unavailable" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 400 }
    );
  }
}
