import { prisma } from "./prisma";

export type DateLike = string | Date;
export type DateRange = {
  startDate: DateLike;
  endDate: DateLike;
};

function toDate(value: DateLike) {
  return value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`);
}

export function rangesOverlap(
  startA: DateLike,
  endA: DateLike,
  startB: DateLike,
  endB: DateLike
) {
  const aStart = toDate(startA);
  const aEnd = toDate(endA);
  const bStart = toDate(startB);
  const bEnd = toDate(endB);
  return aStart < bEnd && bStart < aEnd;
}

export function hasRangeConflict(
  startDate: DateLike,
  endDate: DateLike,
  occupied: DateRange[],
  blocked: DateRange[]
) {
  return [...occupied, ...blocked].some((range) =>
    rangesOverlap(startDate, endDate, range.startDate, range.endDate)
  );
}

export class AvailabilityConflictError extends Error {
  constructor() {
    super("Selected dates are unavailable");
    this.name = "AvailabilityConflictError";
  }
}

export async function assertListingAvailable(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
) {
  const [confirmedBookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        listingId,
        status: "CONFIRMED",
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.availabilityBlock.findMany({
      where: {
        listingId,
        startDate: { lt: checkOut },
        endDate: { gt: checkIn },
      },
      select: { startDate: true, endDate: true },
    }),
  ]);

  if (
    hasRangeConflict(
      checkIn,
      checkOut,
      confirmedBookings.map((b) => ({
        startDate: b.checkIn,
        endDate: b.checkOut,
      })),
      blocks.map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
      }))
    )
  ) {
    throw new AvailabilityConflictError();
  }
}
