/**
 * Shared ingestion library — common types, luxury scoring, normalization, dedupe.
 * Used by all source-specific scripts (Plum Guide, Inside Airbnb, etc.).
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { PrismaClient, Category, ListingSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ---- Prisma client (shared across ingest scripts) -------------------------

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
export const prisma = new PrismaClient({ adapter });

// ---- Raw input shape from any source -------------------------------------

export type RawListing = {
  source: ListingSource;
  sourceUrl?: string;
  sourceId?: string;

  title: string;
  description?: string;
  location?: string;
  country?: string;
  lat?: number;
  lng?: number;

  pricePerNight?: number; // USD
  rating?: number; // 0-5
  reviewCount?: number;
  propertyType?: string; // e.g. "Villa", "Chalet", "Cabin"

  bedrooms?: number;
  beds?: number;
  baths?: number;
  maxGuests?: number;

  images?: string[];
  amenities?: string[];
};

// ---- Luxury scoring algorithm --------------------------------------------

const LUXURY_AMENITY_KEYWORDS = [
  "infinity pool",
  "private pool",
  "pool",
  "hot tub",
  "jacuzzi",
  "sauna",
  "steam",
  "fireplace",
  "wood stove",
  "chef",
  "concierge",
  "private beach",
  "ocean view",
  "mountain view",
  "sea view",
  "fjord view",
  "lake view",
  "private garden",
  "rooftop",
  "terrace",
  "wine cellar",
  "library",
  "spa",
  "gym",
  "yoga",
  "tennis",
  "ski-in",
  "ski-out",
  "boat",
  "kayak",
  "snorkel",
  "onsen",
];

const LUXURY_PROPERTY_TYPES = [
  "villa",
  "chalet",
  "cabin",
  "treehouse",
  "estate",
  "manor",
  "riad",
  "boutique",
  "pavilion",
  "tower",
  "bungalow",
];

export type LuxuryScore = {
  total: number;
  reasons: string[];
};

/**
 * Score how "luxury" a raw listing is for SoftRent's catalogue.
 * Combines price, rating, property type and amenity prestige.
 * Returns an explainable score so admin logs show why an item passed.
 */
export function explainLuxuryScore(raw: RawListing): LuxuryScore {
  let score = 0;
  const reasons: string[] = [];

  // Price tier — most weight, since luxury costs (max 40)
  const p = raw.pricePerNight ?? 0;
  if (p >= 600) {
    score += 40;
    reasons.push("price tier: 40");
  } else if (p >= 400) {
    score += 32;
    reasons.push("price tier: 32");
  } else if (p >= 280) {
    score += 22;
    reasons.push("price tier: 22");
  } else if (p >= 180) {
    score += 12;
    reasons.push("price tier: 12");
  } else if (p >= 100) {
    score += 5;
    reasons.push("price tier: 5");
  }

  // Rating — luxury implies happy guests (max 25)
  const r = raw.rating ?? 0;
  if (r >= 4.9) {
    score += 25;
    reasons.push("rating: 25");
  } else if (r >= 4.8) {
    score += 20;
    reasons.push("rating: 20");
  } else if (r >= 4.6) {
    score += 12;
    reasons.push("rating: 12");
  } else if (r >= 4.3) {
    score += 5;
    reasons.push("rating: 5");
  }

  // Property type — villa/chalet/cabin == on-brand (max 15)
  const propType = (raw.propertyType ?? "").toLowerCase();
  if (LUXURY_PROPERTY_TYPES.some((t) => propType.includes(t))) {
    score += 15;
    reasons.push("property type: 15");
  }

  // Amenity prestige (max 20)
  const amenities = (raw.amenities ?? [])
    .map((a) => a.toLowerCase())
    .join(" | ");
  const amenityHits = LUXURY_AMENITY_KEYWORDS.filter((kw) =>
    amenities.includes(kw)
  ).length;
  const amenityScore = Math.min(20, amenityHits * 3);
  score += amenityScore;
  if (amenityScore > 0) reasons.push(`amenities: ${amenityScore}`);

  // Size — usually luxury = bigger (max 5)
  if ((raw.maxGuests ?? 0) >= 6) {
    score += 3;
    reasons.push("capacity: 3");
  }
  if ((raw.bedrooms ?? 0) >= 3) {
    score += 2;
    reasons.push("bedrooms: 2");
  }

  return { total: score, reasons };
}

export function scoreListing(raw: RawListing): number {
  return explainLuxuryScore(raw).total;
}

export const LUXURY_THRESHOLD = 50;

// ---- Category detection (tropical vs mountain) ----------------------------

const TROPICAL_KEYWORDS = [
  "beach",
  "ocean",
  "tropical",
  "palm",
  "lagoon",
  "reef",
  "snorkel",
  "infinity pool",
  "sea view",
  "island",
  "atoll",
  "bali",
  "tulum",
  "maldives",
  "phuket",
  "caribbean",
  "costa rica",
  "mexico",
];

const MOUNTAIN_KEYWORDS = [
  "mountain",
  "snow",
  "ski",
  "chalet",
  "alps",
  "alpine",
  "fjord",
  "aurora",
  "fireplace",
  "wood stove",
  "altitude",
  "valley",
  "peak",
  "ridge",
  "zermatt",
  "matterhorn",
  "dolomites",
  "norway",
  "switzerland",
  "japan",
  "hokkaido",
];

export function detectCategory(raw: RawListing): Category {
  const text = [
    raw.title,
    raw.description,
    raw.location,
    raw.country,
    (raw.amenities ?? []).join(" "),
    raw.propertyType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const trop = TROPICAL_KEYWORDS.reduce(
    (n, kw) => n + (text.includes(kw) ? 1 : 0),
    0
  );
  const mount = MOUNTAIN_KEYWORDS.reduce(
    (n, kw) => n + (text.includes(kw) ? 1 : 0),
    0
  );

  // Latitude heuristic (strong signal)
  if (raw.lat != null) {
    if (Math.abs(raw.lat) <= 30) return "TROPICAL";
    if (Math.abs(raw.lat) >= 45) return "MOUNTAIN";
  }

  return trop >= mount ? "TROPICAL" : "MOUNTAIN";
}

// ---- Slug generation -----------------------------------------------------

export function generateSlug(raw: RawListing): string {
  const base = (raw.title || "listing")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  const prefix =
    raw.source === "PLUM_GUIDE"
      ? "plum"
      : raw.source === "INSIDE_AIRBNB"
        ? "ia"
        : raw.source === "SYNTHETIC"
          ? "syn"
        : "x";

  const idPart = raw.sourceId
    ? `-${String(raw.sourceId)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 8)}`
    : "";

  return `${prefix}-${base}${idPart}`
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---- Dedupe — by source URL or by lat/lng proximity ----------------------

async function findDuplicate(raw: RawListing) {
  if (raw.sourceUrl) {
    const bySource = await prisma.listing.findFirst({
      where: { sourceUrl: raw.sourceUrl },
    });
    if (bySource) return bySource;
  }
  if (raw.lat != null && raw.lng != null) {
    const byProximity = await prisma.listing.findFirst({
      where: {
        lat: { gte: raw.lat - 0.001, lte: raw.lat + 0.001 },
        lng: { gte: raw.lng - 0.001, lte: raw.lng + 0.001 },
      },
    });
    if (byProximity) return byProximity;
  }
  return null;
}

// ---- Main ingest pipeline ------------------------------------------------

export type IngestResult =
  | { status: "imported"; listingId: string; score: number }
  | { status: "skipped-duplicate"; existingId: string }
  | { status: "rejected-not-luxury"; score: number }
  | { status: "failed"; error: string };

export async function ingestRaw(raw: RawListing): Promise<IngestResult> {
  try {
    const luxury = explainLuxuryScore(raw);
    const score = luxury.total;

    // Filter: only on-brand luxury
    if (score < LUXURY_THRESHOLD) {
      await prisma.ingestRecord.create({
        data: {
          source: raw.source,
          sourceUrl: raw.sourceUrl,
          sourceId: raw.sourceId,
          status: "rejected-not-luxury",
          message: `score=${score.toFixed(1)} < threshold=${LUXURY_THRESHOLD}; ${luxury.reasons.join(", ")}`,
        },
      });
      return { status: "rejected-not-luxury", score };
    }

    // Dedupe
    const dup = await findDuplicate(raw);
    if (dup) {
      await prisma.ingestRecord.create({
        data: {
          source: raw.source,
          sourceUrl: raw.sourceUrl,
          sourceId: raw.sourceId,
          status: "skipped-duplicate",
          message: `matched existing listing ${dup.slug}; score=${score.toFixed(1)}; ${luxury.reasons.join(", ")}`,
          listingId: dup.id,
        },
      });
      return { status: "skipped-duplicate", existingId: dup.id };
    }

    // Insert
    const slug = generateSlug(raw);
    const category = detectCategory(raw);

    const listing = await prisma.listing.create({
      data: {
        slug,
        title: raw.title.slice(0, 200),
        description: (raw.description ?? "").slice(0, 5000),
        location: raw.location ?? "Unknown",
        country: raw.country ?? "Unknown",
        lat: raw.lat,
        lng: raw.lng,
        category,
        price: Math.round(raw.pricePerNight ?? 0),
        rating: raw.rating,
        reviews: raw.reviewCount ?? 0,
        bedrooms: raw.bedrooms ?? 1,
        beds: raw.beds ?? 1,
        baths: raw.baths ?? 1,
        guests: raw.maxGuests ?? 2,
        images: (raw.images ?? []).slice(0, 12),
        amenities: (raw.amenities ?? []).slice(0, 20),
        source: raw.source,
        sourceUrl: raw.sourceUrl,
        sourceId: raw.sourceId,
        luxuryScore: score,
        isPublished: true,
      },
    });

    await prisma.ingestRecord.create({
      data: {
        source: raw.source,
        sourceUrl: raw.sourceUrl,
        sourceId: raw.sourceId,
        status: "imported",
        message: `score=${score.toFixed(1)}; ${luxury.reasons.join(", ")}`,
        listingId: listing.id,
      },
    });

    return { status: "imported", listingId: listing.id, score };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.ingestRecord.create({
      data: {
        source: raw.source,
        sourceUrl: raw.sourceUrl,
        sourceId: raw.sourceId,
        status: "failed",
        message: msg,
      },
    });
    return { status: "failed", error: msg };
  }
}

// ---- Polite fetch helper --------------------------------------------------

export async function politeGet(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SoftRentBot/1.0; +academic-research)",
      Accept: "text/html,application/xhtml+xml,*/*",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
