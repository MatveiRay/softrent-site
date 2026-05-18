/**
 * Inside Airbnb importer — pulls public research dataset CSV
 * (http://insideairbnb.com/get-the-data/), filters for luxury,
 * and runs everything through the same ingestion pipeline.
 *
 * Public dataset is freely available for academic research — perfect
 * source: legal, real, large, and aligns with the course theme
 * ("modeling complex systems").
 *
 * CLI:
 *   npm run ingest:airbnb -- --city=mexico-city
 *   npm run ingest:airbnb -- --csv=path/to/listings.csv
 *   npm run ingest:airbnb -- --city=tulum --max=15
 */

import { readFileSync } from "node:fs";
import {
  ingestRaw,
  prisma,
  sleep,
  type RawListing,
} from "./lib.js";

// Inside Airbnb research dataset URLs (academic-use license).
// More at: http://insideairbnb.com/get-the-data/
const CITY_CSV_URL: Record<string, string> = {
  "mexico-city":
    "https://data.insideairbnb.com/mexico/df/mexico-city/2024-09-26/visualisations/listings.csv",
  tulum:
    "https://data.insideairbnb.com/mexico/qroo/tulum/2024-12-23/visualisations/listings.csv",
  geneva:
    "https://data.insideairbnb.com/switzerland/ge/geneve/2024-12-21/visualisations/listings.csv",
  vienna:
    "https://data.insideairbnb.com/austria/vienna/vienna/2024-12-25/visualisations/listings.csv",
  lisbon:
    "https://data.insideairbnb.com/portugal/lisbon/lisbon/2024-09-23/visualisations/listings.csv",
  athens:
    "https://data.insideairbnb.com/greece/attica/athens/2024-12-30/visualisations/listings.csv",
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept:
    "text/csv,text/plain,application/octet-stream,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function arg(name: string, fallback?: string) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
}

// --- Tiny streaming-friendly CSV parser (handles quoted fields) -----------

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (field || row.length > 0) {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        }
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else {
        field += c;
      }
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = r[i] ?? ""));
    return obj;
  });
}

function parseUsd(raw: string): number {
  if (!raw) return 0;
  const m = raw.match(/[\d,.]+/);
  if (!m) return 0;
  return parseFloat(m[0].replace(/,/g, ""));
}

// --- Row → RawListing -----------------------------------------------------

function rowToRaw(row: Record<string, string>): RawListing | null {
  const price = parseUsd(row.price);
  if (!price) return null;

  const lat = parseFloat(row.latitude);
  const lng = parseFloat(row.longitude);

  return {
    source: "INSIDE_AIRBNB",
    sourceUrl: row.listing_url || undefined,
    sourceId: row.id || undefined,
    title: row.name || "Unnamed",
    description: row.description || row.neighborhood_overview || "",
    location:
      row.neighbourhood_cleansed ||
      row.neighbourhood ||
      row.city ||
      "",
    country: row.country || "",
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    pricePerNight: price,
    rating: row.review_scores_rating
      ? parseFloat(row.review_scores_rating)
      : undefined,
    reviewCount: row.number_of_reviews
      ? parseInt(row.number_of_reviews, 10)
      : undefined,
    propertyType: row.property_type || row.room_type,
    bedrooms: row.bedrooms ? parseInt(row.bedrooms, 10) : undefined,
    beds: row.beds ? parseInt(row.beds, 10) : undefined,
    baths: row.bathrooms
      ? Math.round(parseFloat(row.bathrooms))
      : undefined,
    maxGuests: row.accommodates ? parseInt(row.accommodates, 10) : undefined,
    images: row.picture_url ? [row.picture_url] : [],
    amenities: row.amenities
      ? row.amenities
          .replace(/[\[\]"\\]/g, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [],
  };
}

// --- Pre-filter cheap-and-obvious junk before scoring ---------------------

function passesPreFilter(raw: RawListing): boolean {
  if (!raw.pricePerNight || raw.pricePerNight < 150) return false; // skip budget
  if ((raw.rating ?? 0) > 0 && (raw.rating ?? 0) < 4.4) return false; // skip mid
  const t = (raw.propertyType ?? "").toLowerCase();
  if (/shared|hostel|hotel\s+room|private\s+room/.test(t)) return false;
  return true;
}

// --- Main -----------------------------------------------------------------

async function main() {
  const city = arg("city", "tulum")!;
  const max = parseInt(arg("max", "20")!, 10);
  const csvPath = arg("csv");

  let csv: string;
  if (csvPath) {
    console.log(`Reading local CSV: ${csvPath}`);
    csv = readFileSync(csvPath, "utf-8");
  } else {
    const url = CITY_CSV_URL[city];
    if (!url) {
      console.error(
        `Unknown city "${city}". Available: ${Object.keys(CITY_CSV_URL).join(", ")}`
      );
      console.error("Or pass --csv=path/to/listings.csv to read a local file.");
      return;
    }
    console.log(`Fetching ${url}`);
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) {
      console.error(`Fetch failed: ${res.status} ${res.statusText}`);
      console.error(
        "Inside Airbnb may have moved this dataset. Download the CSV"
      );
      console.error(
        "manually from http://insideairbnb.com/get-the-data/ and run:"
      );
      console.error("   npm run ingest:airbnb -- --csv=/path/to/listings.csv");
      return;
    }
    csv = await res.text();
    console.log(`Downloaded ${(csv.length / 1024).toFixed(0)} KB`);
  }

  const rows = parseCsv(csv);
  console.log(`Parsed ${rows.length} rows from CSV`);

  // Convert to RawListing + pre-filter
  const candidates = rows
    .map(rowToRaw)
    .filter((r): r is RawListing => r != null && passesPreFilter(r));
  console.log(`${candidates.length} candidates passed pre-filter`);

  // Sort by likelihood-of-luxury (highest first) and take top N
  candidates.sort(
    (a, b) =>
      (b.pricePerNight ?? 0) * (b.rating ?? 4.5) -
      (a.pricePerNight ?? 0) * (a.rating ?? 4.5)
  );
  const selected = candidates.slice(0, max);
  console.log(`Top ${selected.length} candidates selected for full scoring\n`);

  const stats = {
    imported: 0,
    "skipped-duplicate": 0,
    "rejected-not-luxury": 0,
    failed: 0,
  };

  for (const raw of selected) {
    const result = await ingestRaw(raw);
    stats[result.status]++;
    const tag =
      result.status === "imported"
        ? `✓ ${raw.title.slice(0, 60)} (score=${result.score.toFixed(1)})`
        : result.status === "rejected-not-luxury"
          ? `✗ ${raw.title.slice(0, 60)} (score=${result.score.toFixed(1)})`
          : `· ${raw.title.slice(0, 60)} (${result.status})`;
    console.log(tag);
    await sleep(50);
  }

  console.log("\n=== Inside Airbnb ingest summary ===");
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
