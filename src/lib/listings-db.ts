// DB-backed listings access — server-side only (uses Prisma).
// Maps DB rows to the existing UI `Listing` shape so components don't change.

import "server-only";
import type { Listing as DbListing } from "@prisma/client";
import type { Listing as UiListing } from "@/data/listings";
import { prisma } from "./prisma";
import {
  buildListingWhere,
  type ListingSearchFilters,
} from "./listing-search";

function toUi(l: DbListing): UiListing {
  return {
    id: l.slug,
    title: l.title,
    location: l.location,
    country: l.country,
    category: l.category === "TROPICAL" ? "tropical" : "mountain",
    price: l.price,
    rating: l.rating ?? 0,
    reviews: l.reviews,
    dateRange: l.dateRange ?? "",
    images: l.images,
    description: l.description,
    host: l.hostName ?? "—",
    hostSince: l.hostSince ?? "—",
    bedrooms: l.bedrooms,
    beds: l.beds,
    baths: l.baths,
    guests: l.guests,
    amenities: l.amenities,
  };
}

/** Get all published listings, ordered by source (SEED first) and created date. */
export async function getAllListings(): Promise<UiListing[]> {
  return searchListings();
}

/** Get one listing by its URL slug (used by /listing/[id]). */
export async function getListingBySlug(
  slug: string
): Promise<UiListing | null> {
  const row = await prisma.listing.findUnique({
    where: { slug },
  });
  if (!row || !row.isPublished) return null;
  return toUi(row);
}

/** Filter listings by a destination id from the search panel. */
export async function filterListingsByDest(
  destId: string
): Promise<UiListing[]> {
  return searchListings({ dest: destId });
}

/** Search published listings using normalized filters. */
export async function searchListings(
  filters: ListingSearchFilters = {}
): Promise<UiListing[]> {
  const rows = await prisma.listing.findMany({
    where: buildListingWhere(filters),
    orderBy: [{ source: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toUi);
}

/** Slugs of all published listings — for generateStaticParams. */
export async function getAllListingSlugs(): Promise<string[]> {
  const rows = await prisma.listing.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/** DB stats for the architecture page / admin. */
export async function getListingStats() {
  const [total, tropical, mountain, bySource] = await Promise.all([
    prisma.listing.count({ where: { isPublished: true } }),
    prisma.listing.count({
      where: { isPublished: true, category: "TROPICAL" },
    }),
    prisma.listing.count({
      where: { isPublished: true, category: "MOUNTAIN" },
    }),
    prisma.listing.groupBy({
      by: ["source"],
      where: { isPublished: true },
      _count: true,
    }),
  ]);
  return { total, tropical, mountain, bySource };
}
