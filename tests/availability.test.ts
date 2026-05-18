import test from "node:test";
import assert from "node:assert/strict";
import {
  hasRangeConflict,
  rangesOverlap,
  type DateRange,
} from "../src/lib/availability";

test("detects overlapping ranges but allows adjacent stays", () => {
  assert.equal(
    rangesOverlap("2026-06-01", "2026-06-05", "2026-06-04", "2026-06-07"),
    true
  );
  assert.equal(
    rangesOverlap("2026-06-01", "2026-06-05", "2026-06-05", "2026-06-08"),
    false
  );
});

test("detects conflicts against confirmed bookings and blocks", () => {
  const occupied: DateRange[] = [
    { startDate: "2026-06-10", endDate: "2026-06-14" },
  ];
  const blocked: DateRange[] = [
    { startDate: "2026-06-20", endDate: "2026-06-22" },
  ];

  assert.equal(
    hasRangeConflict("2026-06-12", "2026-06-15", occupied, blocked),
    true
  );
  assert.equal(
    hasRangeConflict("2026-06-18", "2026-06-21", occupied, blocked),
    true
  );
  assert.equal(
    hasRangeConflict("2026-06-15", "2026-06-18", occupied, blocked),
    false
  );
});
