/**
 * Plum Guide scraper — pulls luxury home listings from plumguide.com
 * and runs them through SoftRent's ingestion pipeline (scoring → dedupe → DB).
 *
 * CLI:
 *   npm run ingest:plumguide                              # default: 10 from /homes
 *   npm run ingest:plumguide -- --location=bali --max=8
 *   npm run ingest:plumguide -- --urls=urls.txt           # explicit URLs file
 *
 * Notes:
 *   - Respects robots: 1.5s delay between requests, custom UA.
 *   - Only fetches what Plum Guide returns. If the site blocks
 *     unauthenticated traffic, the script logs and continues to
 *     other sources gracefully.
 */

import * as cheerio from "cheerio";
import { readFileSync } from "node:fs";
import {
  ingestRaw,
  politeGet,
  sleep,
  prisma,
  type RawListing,
} from "./lib.js";

const BASE = "https://www.plumguide.com";

// -- CLI parsing -----------------------------------------------------------

function arg(name: string, fallback?: string) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
}

// -- Listing URL discovery -------------------------------------------------

async function discoverListingUrls(location?: string): Promise<string[]> {
  const url = location
    ? `${BASE}/find-a-home?location=${encodeURIComponent(location)}`
    : `${BASE}/homes`;

  console.log(`Discovering listings from ${url}`);
  try {
    const html = await politeGet(url);
    const $ = cheerio.load(html);

    // Strategy 1: __NEXT_DATA__ (Plum Guide is a Next.js app)
    const nextData = $("#__NEXT_DATA__").html();
    const fromNext: string[] = [];
    if (nextData) {
      try {
        const data = JSON.parse(nextData);
        // Walk the JSON looking for slug/url patterns
        const walk = (node: unknown): void => {
          if (!node) return;
          if (typeof node === "string") return;
          if (Array.isArray(node)) {
            node.forEach(walk);
            return;
          }
          if (typeof node === "object") {
            const obj = node as Record<string, unknown>;
            // Common patterns Plum Guide uses
            const slug = typeof obj.slug === "string" ? obj.slug : null;
            const path =
              typeof obj.url === "string"
                ? obj.url
                : typeof obj.href === "string"
                  ? obj.href
                  : null;
            if (slug && (typeof slug === "string") && /^[a-z0-9-]{8,}$/.test(slug)) {
              fromNext.push(`${BASE}/homes/${slug}`);
            }
            if (path && typeof path === "string" && path.startsWith("/homes/")) {
              fromNext.push(`${BASE}${path}`);
            }
            Object.values(obj).forEach(walk);
          }
        };
        walk(data);
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Strategy 2: raw <a href="/homes/...">
    const fromAnchors: string[] = [];
    $('a[href*="/homes/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href && /\/homes\/[a-z0-9-]+/.test(href)) {
        fromAnchors.push(href.startsWith("http") ? href : `${BASE}${href}`);
      }
    });

    const all = Array.from(new Set([...fromNext, ...fromAnchors]));
    console.log(
      `Found ${all.length} candidate URLs (next-data: ${fromNext.length}, anchors: ${fromAnchors.length})`
    );
    return all;
  } catch (err) {
    console.error(`Discovery failed: ${err}`);
    return [];
  }
}

// -- Per-listing parsing ---------------------------------------------------

async function parseListing(url: string): Promise<RawListing | null> {
  try {
    const html = await politeGet(url);
    const $ = cheerio.load(html);

    // Prefer JSON-LD structured data (most reliable, Plum Guide likely has it)
    const jsonLd: Record<string, unknown>[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).contents().text());
        if (Array.isArray(parsed)) jsonLd.push(...parsed);
        else jsonLd.push(parsed);
      } catch {
        // ignore
      }
    });

    const lodging =
      jsonLd.find(
        (j) =>
          typeof j["@type"] === "string" &&
          /Lodging|Hotel|VacationRental|Accommodation/i.test(
            String(j["@type"])
          )
      ) || jsonLd[0];

    // Fallback to OpenGraph / common selectors
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogDesc = $('meta[property="og:description"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content");
    const h1 = $("h1").first().text().trim();

    const title =
      (lodging?.name as string) || ogTitle || h1 || "Untitled property";

    const description =
      (lodging?.description as string) ||
      ogDesc ||
      $('[class*="description"], [class*="Description"]')
        .first()
        .text()
        .trim()
        .slice(0, 2000);

    // Price — try JSON-LD priceRange, then text patterns
    let price = 0;
    if (lodging?.priceRange) {
      const m = String(lodging.priceRange).match(/(\d{2,5})/);
      if (m) price = parseInt(m[1], 10);
    }
    if (!price) {
      const priceText = $('[class*="price"], [class*="Price"]')
        .first()
        .text();
      const m = priceText.match(/[\$£€¥](\d[\d,]{1,5})/);
      if (m) price = parseInt(m[1].replace(/,/g, ""), 10);
    }

    // Images
    const images = new Set<string>();
    if (ogImage) images.add(ogImage);
    $('img[src*="plumguide"], img[src*="cloudfront"], img[src*="cdn"]').each(
      (_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && /^https?:\/\//.test(src)) images.add(src);
      }
    );

    // Rating / review count
    const rating =
      typeof lodging?.aggregateRating === "object" && lodging.aggregateRating
        ? Number(
            (lodging.aggregateRating as Record<string, unknown>).ratingValue
          )
        : undefined;
    const reviewCount =
      typeof lodging?.aggregateRating === "object" && lodging.aggregateRating
        ? Number(
            (lodging.aggregateRating as Record<string, unknown>).reviewCount
          )
        : undefined;

    // Address
    const address =
      typeof lodging?.address === "object" && lodging.address
        ? (lodging.address as Record<string, unknown>)
        : null;
    const location =
      (address?.addressLocality as string) ||
      $('[class*="location"], [class*="Location"]').first().text().trim() ||
      "";
    const country = (address?.addressCountry as string) || "";

    // Geo coords
    const geo =
      typeof lodging?.geo === "object" && lodging.geo
        ? (lodging.geo as Record<string, unknown>)
        : null;
    const lat = geo?.latitude ? Number(geo.latitude) : undefined;
    const lng = geo?.longitude ? Number(geo.longitude) : undefined;

    // Capacity
    const occupancy = lodging?.occupancy as Record<string, unknown> | undefined;
    const maxGuests = occupancy?.maxValue
      ? Number(occupancy.maxValue)
      : undefined;

    // Amenities — try multiple sources
    const amenities = new Set<string>();
    const amenityFeature = lodging?.amenityFeature;
    if (Array.isArray(amenityFeature)) {
      amenityFeature.forEach((a) => {
        if (typeof a === "object" && a) {
          const obj = a as Record<string, unknown>;
          if (typeof obj.name === "string") amenities.add(obj.name);
        }
      });
    }
    $('[class*="amenit"] li, [class*="Amenit"] li').each((_, el) => {
      const t = $(el).text().trim();
      if (t && t.length < 60) amenities.add(t);
    });

    // Property type from title / URL hints
    const propertyType =
      /chalet/i.test(title) || /chalet/i.test(url)
        ? "Chalet"
        : /villa/i.test(title) || /villa/i.test(url)
          ? "Villa"
          : /cabin/i.test(title) || /cabin/i.test(url)
            ? "Cabin"
            : /apartment|loft/i.test(title)
              ? "Apartment"
              : "Home";

    const sourceId = url.split("/homes/").pop()?.split(/[?#]/)[0];

    return {
      source: "PLUM_GUIDE",
      sourceUrl: url,
      sourceId: sourceId ?? undefined,
      title,
      description,
      location,
      country,
      lat,
      lng,
      pricePerNight: price || undefined,
      rating,
      reviewCount,
      propertyType,
      maxGuests,
      images: Array.from(images),
      amenities: Array.from(amenities),
    };
  } catch (err) {
    console.error(`Failed to parse ${url}: ${err}`);
    return null;
  }
}

// -- Main ------------------------------------------------------------------

async function main() {
  const location = arg("location");
  const max = parseInt(arg("max", "10")!, 10);
  const urlsFile = arg("urls");

  let urls: string[];

  if (urlsFile) {
    urls = readFileSync(urlsFile, "utf-8")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http"));
    console.log(`Loaded ${urls.length} URLs from ${urlsFile}`);
  } else {
    urls = await discoverListingUrls(location);
    if (urls.length === 0) {
      console.log("No URLs discovered. Plum Guide may be blocking the request,");
      console.log("or its HTML structure has changed. Run with --urls=file.txt");
      console.log("to ingest a hand-curated URL list instead.");
      return;
    }
  }

  urls = urls.slice(0, max);
  console.log(`\nProcessing ${urls.length} listings...\n`);

  const stats = {
    imported: 0,
    "skipped-duplicate": 0,
    "rejected-not-luxury": 0,
    failed: 0,
  };

  for (const url of urls) {
    console.log(`→ ${url}`);
    const raw = await parseListing(url);
    if (!raw) {
      stats.failed++;
      await sleep(1500);
      continue;
    }
    const result = await ingestRaw(raw);
    stats[result.status]++;
    const summary =
      result.status === "imported"
        ? `imported (score=${result.score.toFixed(1)})`
        : result.status === "rejected-not-luxury"
          ? `rejected (score=${result.score.toFixed(1)})`
          : result.status;
    console.log(`  ${summary}\n`);
    await sleep(1500);
  }

  console.log("=== Plum Guide ingest summary ===");
  console.log(stats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
