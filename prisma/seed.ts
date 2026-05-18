/**
 * Seed the database with the 12 hand-curated SoftRent listings.
 *
 * Run with:  npm run db:seed
 *
 * Idempotent: uses upsert by slug. Safe to re-run.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { PrismaClient, Category, ListingSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { listings } from "../src/data/listings";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Seeding ${listings.length} curated listings...`);

  let imported = 0;
  let updated = 0;

  for (const l of listings) {
    const category: Category =
      l.category === "tropical" ? "TROPICAL" : "MOUNTAIN";

    const existing = await prisma.listing.findUnique({
      where: { slug: l.id },
    });

    await prisma.listing.upsert({
      where: { slug: l.id },
      update: {
        title: l.title,
        description: l.description,
        location: l.location,
        country: l.country,
        category,
        price: l.price,
        rating: l.rating,
        reviews: l.reviews,
        dateRange: l.dateRange,
        bedrooms: l.bedrooms,
        beds: l.beds,
        baths: l.baths,
        guests: l.guests,
        hostName: l.host,
        hostSince: l.hostSince,
        images: l.images,
        amenities: l.amenities,
        source: ListingSource.SEED,
        isPublished: true,
      },
      create: {
        slug: l.id,
        title: l.title,
        description: l.description,
        location: l.location,
        country: l.country,
        category,
        price: l.price,
        rating: l.rating,
        reviews: l.reviews,
        dateRange: l.dateRange,
        bedrooms: l.bedrooms,
        beds: l.beds,
        baths: l.baths,
        guests: l.guests,
        hostName: l.host,
        hostSince: l.hostSince,
        images: l.images,
        amenities: l.amenities,
        source: ListingSource.SEED,
        isPublished: true,
      },
    });

    if (existing) updated++;
    else imported++;
  }

  console.log(`✓ Imported: ${imported}, Updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
