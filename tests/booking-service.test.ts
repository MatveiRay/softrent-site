import test from "node:test";
import assert from "node:assert/strict";
import {
  assertReviewTransitionAllowed,
  calculateBookingTotals,
  serializeBooking,
} from "../src/lib/booking-service";

test("calculates booking totals on the server", () => {
  assert.deepEqual(calculateBookingTotals(500, "2026-07-01", "2026-07-05"), {
    nights: 4,
    subtotal: 2000,
    cleaning: 95,
    serviceFee: 240,
    total: 2335,
  });
});

test("serializes booking status for the client", () => {
  const serialized = serializeBooking({
    publicId: "SR-ABC123",
    pricePerNight: 500,
    checkIn: new Date("2026-07-01"),
    checkOut: new Date("2026-07-05"),
    nights: 4,
    adults: 2,
    children: 1,
    infants: 0,
    contactName: "Matvei",
    contactEmail: "m@example.com",
    total: 2335,
    cleaning: 95,
    serviceFee: 240,
    createdAt: new Date("2026-05-18T10:00:00.000Z"),
    status: "PENDING",
    listing: {
      slug: "casa-luz",
      title: "Casa Luz",
      location: "Uluwatu",
      country: "Indonesia",
      images: ["hero.jpg"],
    },
  });

  assert.equal(serialized.status, "PENDING");
  assert.equal(serialized.listingId, "casa-luz");
  assert.equal(serialized.id, "SR-ABC123");
});

test("only pending bookings may be reviewed", () => {
  assert.doesNotThrow(() =>
    assertReviewTransitionAllowed("PENDING", "CONFIRMED")
  );
  assert.throws(
    () => assertReviewTransitionAllowed("CONFIRMED", "CANCELED"),
    /Only pending bookings can be reviewed/
  );
});
