import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  explainLuxuryScore,
  type RawListing,
} from "../scripts/ingest/lib";

test("luxury scoring explains why a premium chalet passes", () => {
  const raw: RawListing = {
    source: "SYNTHETIC",
    title: "Alpine chalet",
    pricePerNight: 900,
    rating: 4.95,
    propertyType: "Chalet",
    bedrooms: 4,
    maxGuests: 8,
    amenities: ["Sauna", "Mountain view", "Fireplace"],
  };

  const score = explainLuxuryScore(raw);
  assert.ok(score.total >= 50);
  assert.ok(score.reasons.some((reason) => reason.includes("price")));
  assert.ok(score.reasons.some((reason) => reason.includes("property type")));
});

test("synthetic dataset does not masquerade as Plum Guide", () => {
  const file = readFileSync("scripts/ingest/synthetic-luxury.ts", "utf8");
  assert.equal(file.includes('source: "PLUM_GUIDE"'), false);
  assert.equal(file.includes('source: "SYNTHETIC"'), true);
  assert.equal(file.includes("https://www.plumguide.com/homes/"), false);
});
