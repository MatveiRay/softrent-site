import test from "node:test";
import assert from "node:assert/strict";
import {
  buildListingWhere,
  parseListingSearchParams,
} from "../src/lib/listing-search";

test("parses destination, guests, price, and text filters", () => {
  assert.deepEqual(
    parseListingSearchParams({
      dest: "tropical",
      guests: "4",
      minPrice: "200",
      maxPrice: "900",
      q: "ocean",
    }),
    {
      dest: "tropical",
      guests: 4,
      minPrice: 200,
      maxPrice: 900,
      q: "ocean",
    }
  );
});

test("ignores invalid numeric filters", () => {
  assert.deepEqual(
    parseListingSearchParams({
      guests: "zero",
      minPrice: "-10",
      maxPrice: "oops",
    }),
    {}
  );
});

test("builds tropical guest-capacity filter", () => {
  assert.deepEqual(buildListingWhere({ dest: "tropical", guests: 4 }), {
    isPublished: true,
    category: "TROPICAL",
    guests: { gte: 4 },
  });
});

test("builds country and text filters", () => {
  assert.deepEqual(buildListingWhere({ dest: "norway", q: "fjord" }), {
    isPublished: true,
    country: { in: ["Норвегия", "Norway"] },
    OR: [
      { title: { contains: "fjord", mode: "insensitive" } },
      { description: { contains: "fjord", mode: "insensitive" } },
      { location: { contains: "fjord", mode: "insensitive" } },
      { country: { contains: "fjord", mode: "insensitive" } },
      { amenities: { has: "fjord" } },
    ],
  });
});
