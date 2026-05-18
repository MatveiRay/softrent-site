/**
 * Synthetic luxury source â€” hand-curated dataset of ~30 luxury homes
 * world-wide that runs through the SAME ingestion pipeline as Plum Guide
 * and Inside Airbnb. Lets us demonstrate the full system end-to-end without
 * depending on external CDNs that block server-side traffic.
 *
 * Each entry mirrors what a real upstream parser would emit: title, price,
 * rating, amenities, location, lat/lng, propertyType. The pipeline scores
 * every one for luxury, dedupes against existing DB rows, and imports
 * the survivors with category auto-detection.
 *
 * CLI:
 *   npm run ingest:synthetic
 *   npm run ingest:synthetic -- --max=15
 */

import { ingestRaw, prisma, sleep, type RawListing } from "./lib.js";

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

function arg(name: string, fallback?: string) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
}

// Hand-curated, realistic dataset reflecting Plum Guide / Onefinestay scale.
// Mixes prices/ratings deliberately so luxury scoring filters real-world style.
const LISTINGS: RawListing[] = [
  // --- Tropical ----------------------------------------------------------
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/santorini-cliff-house",
    sourceId: "santorini-cliff",
    title: "Santorini Cliff House â€” Cave villa over Aegean",
    description:
      "A cliffside cave villa carved into Imerovigli volcanic rock. Private infinity pool faces the caldera. Two suites, plunge pool, traditional whitewashed terraces.",
    location: "Imerovigli, Santorini",
    country: "Ð“Ñ€ÐµÑ†Ð¸Ñ",
    lat: 36.43,
    lng: 25.42,
    pricePerNight: 780,
    rating: 4.96,
    reviewCount: 121,
    propertyType: "Villa",
    bedrooms: 2,
    beds: 3,
    baths: 2,
    maxGuests: 4,
    images: [u("1530541930197-ff16ac917b0e"), u("1571003123894-1f0594d2b5d9")],
    amenities: [
      "Infinity pool",
      "Sea view",
      "Private terrace",
      "Concierge",
      "Wine cellar",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/mykonos-stone-villa",
    sourceId: "mykonos-stone",
    title: "Mykonos Stone Villa â€” Cycladic estate above Elia",
    description:
      "Five-bedroom stone villa overlooking Elia Beach. Private chef on request, gym, hammam, heated infinity pool. Ten minutes to Mykonos town.",
    location: "Elia, Mykonos",
    country: "Ð“Ñ€ÐµÑ†Ð¸Ñ",
    lat: 37.42,
    lng: 25.42,
    pricePerNight: 1450,
    rating: 4.93,
    reviewCount: 87,
    propertyType: "Villa",
    bedrooms: 5,
    beds: 7,
    baths: 5,
    maxGuests: 10,
    images: [u("1564013799919-ab600027ffc6")],
    amenities: [
      "Infinity pool",
      "Sea view",
      "Private chef",
      "Sauna",
      "Gym",
      "Hammam",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/seminyak-villa-bayu",
    sourceId: "bayu",
    title: "Villa Bayu â€” Open-plan villa near Seminyak Beach",
    description:
      "Modern open-plan villa with tropical garden and private 12m pool. Five-minute walk to Seminyak Beach. Two staff included. Yoga deck on the upper floor.",
    location: "Seminyak, Bali",
    country: "Ð˜Ð½Ð´Ð¾Ð½ÐµÐ·Ð¸Ñ",
    lat: -8.69,
    lng: 115.16,
    pricePerNight: 420,
    rating: 4.88,
    reviewCount: 211,
    propertyType: "Villa",
    bedrooms: 3,
    beds: 4,
    baths: 3,
    maxGuests: 6,
    images: [u("1571003123894-1f0594d2b5d9")],
    amenities: [
      "Private pool",
      "Yoga deck",
      "Tropical garden",
      "Daily housekeeping",
      "Wi-Fi 1Gbps",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/canggu-rice-villa",
    sourceId: "canggu-rice",
    title: "Canggu Rice Villa â€” Designer house in rice paddies",
    description:
      "Cantilevered house perched over emerald rice fields in Canggu. Open-air kitchen, plunge pool, hand-carved teak details throughout.",
    location: "Canggu, Bali",
    country: "Ð˜Ð½Ð´Ð¾Ð½ÐµÐ·Ð¸Ñ",
    lat: -8.65,
    lng: 115.13,
    pricePerNight: 380,
    rating: 4.91,
    reviewCount: 174,
    propertyType: "Villa",
    bedrooms: 2,
    beds: 3,
    baths: 2,
    maxGuests: 4,
    images: [u("1582610116397-edb318620f90")],
    amenities: [
      "Plunge pool",
      "Open-air kitchen",
      "Rice field view",
      "Vinyl player",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/lanikai-treehouse",
    sourceId: "lanikai",
    title: "Lanikai Treehouse â€” Hawaiian beach retreat",
    description:
      "Octagonal teak treehouse perched in palms 60 metres from Lanikai Beach. Outdoor shower, freshwater plunge, traditional lanai.",
    location: "Lanikai, Oahu",
    country: "Ð¡Ð¨Ð",
    lat: 21.39,
    lng: -157.71,
    pricePerNight: 620,
    rating: 4.94,
    reviewCount: 88,
    propertyType: "Treehouse",
    bedrooms: 1,
    beds: 2,
    baths: 1,
    maxGuests: 2,
    images: [u("1499793983690-e29da59ef1c2")],
    amenities: ["Beachfront", "Outdoor shower", "Plunge pool", "Surfboards"],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/koh-samui-pavilion",
    sourceId: "koh-samui",
    title: "Koh Samui Pavilion â€” Five-pavilion estate",
    description:
      "Beachfront estate of five timber pavilions linked by raised walkways. Live-in butler and chef, private 25m pool, traditional Thai sala for dining.",
    location: "Bophut, Koh Samui",
    country: "Ð¢Ð°Ð¸Ð»Ð°Ð½Ð´",
    lat: 9.55,
    lng: 100.03,
    pricePerNight: 1180,
    rating: 4.97,
    reviewCount: 64,
    propertyType: "Villa",
    bedrooms: 5,
    beds: 8,
    baths: 5,
    maxGuests: 10,
    images: [u("1611892440504-42a792e24d32")],
    amenities: [
      "Beachfront",
      "Private chef",
      "Butler",
      "Infinity pool",
      "Boat charter",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/positano-cliff-suite",
    sourceId: "positano",
    title: "Positano Cliff Suite â€” Amalfi panorama",
    description:
      "One-bedroom suite carved into the cliff above the Tyrrhenian Sea. Hand-painted Vietri tiles, private terrace, lemon-tree garden.",
    location: "Positano",
    country: "Ð˜Ñ‚Ð°Ð»Ð¸Ñ",
    lat: 40.63,
    lng: 14.49,
    pricePerNight: 540,
    rating: 4.89,
    reviewCount: 142,
    propertyType: "Villa",
    bedrooms: 1,
    beds: 2,
    baths: 1,
    maxGuests: 2,
    images: [u("1565475283408-5f7f5c8f1e0e")],
    amenities: ["Sea view", "Private terrace", "Hand-painted tiles", "Wine cellar"],
  },
  // Borderline / non-luxury (should be REJECTED by scoring) ---------------
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/budget-flat-rome",
    sourceId: "rome-budget",
    title: "Trastevere Studio â€” 1-bed apartment",
    description:
      "Compact 25mÂ² studio in central Trastevere. Walk to everything. No air conditioning.",
    location: "Trastevere, Rome",
    country: "Ð˜Ñ‚Ð°Ð»Ð¸Ñ",
    lat: 41.89,
    lng: 12.47,
    pricePerNight: 95,
    rating: 4.3,
    reviewCount: 312,
    propertyType: "Apartment",
    bedrooms: 0,
    beds: 1,
    baths: 1,
    maxGuests: 2,
    images: [u("1564013799919-ab600027ffc6")],
    amenities: ["Wi-Fi", "Coffee machine"],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/lisbon-tile-house",
    sourceId: "lisbon-tile",
    title: "Lisbon Tile House â€” Restored Pombaline townhouse",
    description:
      "Five-storey townhouse in Bairro Alto restored with original azulejo tile floors. Private rooftop with Tagus river view, library, courtyard.",
    location: "Bairro Alto, Lisbon",
    country: "ÐŸÐ¾Ñ€Ñ‚ÑƒÐ³Ð°Ð»Ð¸Ñ",
    lat: 38.71,
    lng: -9.14,
    pricePerNight: 460,
    rating: 4.86,
    reviewCount: 168,
    propertyType: "Villa",
    bedrooms: 4,
    beds: 5,
    baths: 4,
    maxGuests: 8,
    images: [u("1502786129293-79981df4e689")],
    amenities: [
      "Rooftop terrace",
      "River view",
      "Library",
      "Private courtyard",
      "Daily housekeeping",
    ],
  },
  // --- Mountain ----------------------------------------------------------
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/courchevel-chalet-lys",
    sourceId: "courchevel-lys",
    title: "Chalet Lys â€” Slope-side in Courchevel 1850",
    description:
      "Seven-bedroom alpine chalet at the foot of the BellecÃ´te piste. Hammam, indoor pool, cinema, ski concierge, in-house chef and ski guide.",
    location: "Courchevel 1850",
    country: "Ð¤Ñ€Ð°Ð½Ñ†Ð¸Ñ",
    lat: 45.41,
    lng: 6.63,
    pricePerNight: 4200,
    rating: 4.98,
    reviewCount: 41,
    propertyType: "Chalet",
    bedrooms: 7,
    beds: 9,
    baths: 7,
    maxGuests: 14,
    images: [u("1551524559-8af4e6624178")],
    amenities: [
      "Ski-in / ski-out",
      "Indoor pool",
      "Hammam",
      "Cinema",
      "Private chef",
      "Ski concierge",
      "Wine cellar",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/verbier-treehouse",
    sourceId: "verbier-tree",
    title: "Verbier Treehouse â€” Swiss A-frame over the valley",
    description:
      "Modernised A-frame chalet with floor-to-ceiling glass facing the Combins. Wood-burning stove, sauna, mountain bike storage.",
    location: "Verbier",
    country: "Ð¨Ð²ÐµÐ¹Ñ†Ð°Ñ€Ð¸Ñ",
    lat: 46.1,
    lng: 7.23,
    pricePerNight: 880,
    rating: 4.92,
    reviewCount: 96,
    propertyType: "Chalet",
    bedrooms: 3,
    beds: 4,
    baths: 2,
    maxGuests: 6,
    images: [u("1502786129293-79981df4e689")],
    amenities: [
      "Wood stove",
      "Sauna",
      "Mountain view",
      "Ski-in / ski-out",
      "Boot warmer",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/chamonix-glass-chalet",
    sourceId: "chamonix-glass",
    title: "Chamonix Glass Chalet â€” Mont Blanc view",
    description:
      "Architect-designed glass and larch chalet directly facing Mont Blanc. Outdoor hot tub on heated deck, indoor climbing wall, library.",
    location: "Chamonix",
    country: "Ð¤Ñ€Ð°Ð½Ñ†Ð¸Ñ",
    lat: 45.92,
    lng: 6.87,
    pricePerNight: 950,
    rating: 4.91,
    reviewCount: 73,
    propertyType: "Chalet",
    bedrooms: 4,
    beds: 5,
    baths: 3,
    maxGuests: 8,
    images: [u("1518733057094-95b53143d2a7")],
    amenities: [
      "Hot tub",
      "Mountain view",
      "Climbing wall",
      "Library",
      "Fireplace",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/aspen-stone-lodge",
    sourceId: "aspen-stone",
    title: "Aspen Stone Lodge â€” Snowmass Mountain",
    description:
      "Stone-and-cedar lodge with mountain views from every room. Heated outdoor pool, two fireplaces, in-room massage on request.",
    location: "Snowmass, Aspen",
    country: "Ð¡Ð¨Ð",
    lat: 39.21,
    lng: -106.95,
    pricePerNight: 1850,
    rating: 4.95,
    reviewCount: 52,
    propertyType: "Chalet",
    bedrooms: 5,
    beds: 6,
    baths: 5,
    maxGuests: 10,
    images: [u("1483728642387-6c3bdd6c93e5")],
    amenities: [
      "Heated pool",
      "Fireplace",
      "Mountain view",
      "Spa treatments",
      "Ski locker",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/banff-canyon-cabin",
    sourceId: "banff",
    title: "Banff Canyon Cabin â€” River view A-frame",
    description:
      "Cedar A-frame above Bow River canyon. Outdoor hot tub overlooking water, riverside fire pit, fly-fishing equipment included.",
    location: "Banff, Alberta",
    country: "ÐšÐ°Ð½Ð°Ð´Ð°",
    lat: 51.18,
    lng: -115.57,
    pricePerNight: 540,
    rating: 4.89,
    reviewCount: 118,
    propertyType: "Cabin",
    bedrooms: 2,
    beds: 3,
    baths: 2,
    maxGuests: 4,
    images: [u("1465056836041-7f43ac27dcb5")],
    amenities: ["Hot tub", "River view", "Fire pit", "Fly-fishing gear"],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/iceland-glass-cube",
    sourceId: "iceland-glass",
    title: "Iceland Glass Cube â€” Aurora vista on the south coast",
    description:
      "All-glass cube on a black-sand farm with unimpeded north sky. Geothermal hot pool, aurora alerts via app, breakfast hamper of Icelandic produce.",
    location: "VÃ­k",
    country: "Ð˜ÑÐ»Ð°Ð½Ð´Ð¸Ñ",
    lat: 63.41,
    lng: -19.0,
    pricePerNight: 690,
    rating: 4.94,
    reviewCount: 142,
    propertyType: "Cabin",
    bedrooms: 1,
    beds: 2,
    baths: 1,
    maxGuests: 2,
    images: [u("1518733057094-95b53143d2a7")],
    amenities: [
      "Aurora alerts",
      "Geothermal pool",
      "Mountain view",
      "Breakfast hamper",
    ],
  },
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/sapporo-onsen-lodge",
    sourceId: "sapporo-onsen",
    title: "Sapporo Onsen Lodge â€” Niseko backcountry",
    description:
      "Hand-built timber lodge in the Niseko backcountry. Private outdoor onsen overlooking birch forest, daily breakfast by local chef, ski transfers.",
    location: "Niseko",
    country: "Ð¯Ð¿Ð¾Ð½Ð¸Ñ",
    lat: 42.87,
    lng: 140.7,
    pricePerNight: 620,
    rating: 4.92,
    reviewCount: 84,
    propertyType: "Cabin",
    bedrooms: 2,
    beds: 4,
    baths: 1,
    maxGuests: 4,
    images: [u("1483728642387-6c3bdd6c93e5")],
    amenities: [
      "Private onsen",
      "Powder snow",
      "Heated floors",
      "Local chef breakfast",
    ],
  },
  // Borderline mountain (should be REJECTED)
  {
    source: "SYNTHETIC",
    sourceUrl: "synthetic://homes/cheap-cabin-vermont",
    sourceId: "vermont-budget",
    title: "Vermont Hostel Bunk â€” Shared room near Stowe",
    description:
      "Affordable bunk in shared room of an old farmhouse near Stowe Mountain Resort. Bring your own sheets. Communal kitchen.",
    location: "Stowe, Vermont",
    country: "Ð¡Ð¨Ð",
    lat: 44.46,
    lng: -72.69,
    pricePerNight: 65,
    rating: 4.0,
    reviewCount: 540,
    propertyType: "Shared room",
    bedrooms: 0,
    beds: 1,
    baths: 1,
    maxGuests: 1,
    images: [u("1465056836041-7f43ac27dcb5")],
    amenities: ["Wi-Fi", "Communal kitchen"],
  },
];

async function main() {
  const max = parseInt(arg("max", String(LISTINGS.length))!, 10);
  const selected = LISTINGS.slice(0, max);

  console.log(`Running ${selected.length} candidates through ingest pipeline\n`);

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
        ? `âœ“ ${raw.title.slice(0, 60)} (score=${result.score.toFixed(1)})`
        : result.status === "rejected-not-luxury"
          ? `âœ— ${raw.title.slice(0, 60)} (score=${result.score.toFixed(1)})`
          : `Â· ${raw.title.slice(0, 60)} (${result.status})`;
    console.log(tag);
    await sleep(50);
  }

  console.log("\n=== Synthetic luxury ingest summary ===");
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


