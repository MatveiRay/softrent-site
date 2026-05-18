import type { Prisma } from "@prisma/client";

export type ListingSearchFilters = {
  dest?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
};

export const COUNTRY_BY_DEST: Record<string, string[]> = {
  indonesia: ["Индонезия", "Indonesia"],
  mexico: ["Мексика", "Mexico"],
  "costarica-c": ["Коста-Рика", "Costa Rica"],
  "maldives-c": ["Мальдивы", "Maldives"],
  norway: ["Норвегия", "Norway"],
  switzerland: ["Швейцария", "Switzerland"],
  japan: ["Япония", "Japan"],
  italy: ["Италия", "Italy"],
  scotland: ["Шотландия", "Scotland"],
};

export const SLUG_BY_CITY: Record<string, string> = {
  uluwatu: "casa-luz",
  sumba: "tide-house",
  tulum: "papaya",
  sayulita: "salt-cabana",
  costarica: "los-suenos",
  maafushi: "atoll",
  senja: "north-light",
  zermatt: "stein-haus",
  hokkaido: "hush",
  dolomites: "alpe",
  lofoten: "fjellhytte",
  cairngorms: "tor",
};

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: SearchParamValue) {
  const parsed = Number.parseInt(firstValue(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseListingSearchParams(
  input: Record<string, SearchParamValue>
): ListingSearchFilters {
  const dest = firstValue(input.dest)?.trim();
  const guests = parsePositiveInt(input.guests);
  const minPrice = parsePositiveInt(input.minPrice);
  const maxPrice = parsePositiveInt(input.maxPrice);
  const q = firstValue(input.q)?.trim();

  return {
    ...(dest ? { dest } : {}),
    ...(guests ? { guests } : {}),
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    ...(q ? { q } : {}),
  };
}

export function buildListingWhere(
  filters: ListingSearchFilters
): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    isPublished: true,
  };

  if (filters.dest === "tropical") {
    where.category = "TROPICAL";
  } else if (filters.dest === "mountain") {
    where.category = "MOUNTAIN";
  } else if (filters.dest && COUNTRY_BY_DEST[filters.dest]) {
    where.country = { in: COUNTRY_BY_DEST[filters.dest] };
  } else if (filters.dest && SLUG_BY_CITY[filters.dest]) {
    where.slug = SLUG_BY_CITY[filters.dest];
  }

  if (filters.guests) {
    where.guests = { gte: filters.guests };
  }

  if (filters.minPrice || filters.maxPrice) {
    where.price = {
      ...(filters.minPrice ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
    };
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { location: { contains: filters.q, mode: "insensitive" } },
      { country: { contains: filters.q, mode: "insensitive" } },
      { amenities: { has: filters.q } },
    ];
  }

  return where;
}
