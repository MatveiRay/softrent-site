import { listings, type Listing } from "@/data/listings";
import SearchResults from "./SearchResults";

const COUNTRY_BY_DEST: Record<string, string> = {
  indonesia: "Индонезия",
  mexico: "Мексика",
  "costarica-c": "Коста-Рика",
  "maldives-c": "Мальдивы",
  norway: "Норвегия",
  switzerland: "Швейцария",
  japan: "Япония",
  italy: "Италия",
  scotland: "Шотландия",
};

const LISTING_BY_CITY: Record<string, string> = {
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

// Bilingual labels for resolved destination (used in summary chip)
export const DEST_LABELS: Record<string, { ru: string; en: string }> = {
  any: { ru: "Любое направление", en: "Anywhere" },
  tropical: { ru: "Тропики", en: "Tropics" },
  mountain: { ru: "Горы", en: "Mountains" },
  indonesia: { ru: "Индонезия", en: "Indonesia" },
  mexico: { ru: "Мексика", en: "Mexico" },
  "costarica-c": { ru: "Коста-Рика", en: "Costa Rica" },
  "maldives-c": { ru: "Мальдивы", en: "Maldives" },
  norway: { ru: "Норвегия", en: "Norway" },
  switzerland: { ru: "Швейцария", en: "Switzerland" },
  japan: { ru: "Япония", en: "Japan" },
  italy: { ru: "Италия", en: "Italy" },
  scotland: { ru: "Шотландия", en: "Scotland" },
  uluwatu: { ru: "Уулувату, Бали", en: "Uluwatu, Bali" },
  sumba: { ru: "Сумба", en: "Sumba" },
  tulum: { ru: "Тулум, Мексика", en: "Tulum, Mexico" },
  sayulita: { ru: "Сайулита, Мексика", en: "Sayulita, Mexico" },
  costarica: { ru: "Коста-Рика", en: "Costa Rica" },
  maafushi: { ru: "Маафуши, Мальдивы", en: "Maafushi, Maldives" },
  senja: { ru: "Сенья, Норвегия", en: "Senja, Norway" },
  zermatt: { ru: "Церматт, Швейцария", en: "Zermatt, Switzerland" },
  hokkaido: { ru: "Хоккайдо, Япония", en: "Hokkaido, Japan" },
  dolomites: { ru: "Доломиты, Италия", en: "Dolomites, Italy" },
  lofoten: { ru: "Лофотены, Норвегия", en: "Lofoten, Norway" },
  cairngorms: { ru: "Кэрнгормс, Шотландия", en: "Cairngorms, Scotland" },
};

function filterByDest(destId: string): Listing[] {
  if (!destId || destId === "any") return listings;
  if (destId === "tropical")
    return listings.filter((l) => l.category === "tropical");
  if (destId === "mountain")
    return listings.filter((l) => l.category === "mountain");
  if (COUNTRY_BY_DEST[destId])
    return listings.filter((l) => l.country === COUNTRY_BY_DEST[destId]);
  if (LISTING_BY_CITY[destId])
    return listings.filter((l) => l.id === LISTING_BY_CITY[destId]);
  return listings;
}

type SP = {
  dest?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
  infants?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const dest = sp.dest || "any";
  const filtered = filterByDest(dest);

  return (
    <SearchResults
      listings={filtered}
      dest={dest}
      destLabels={DEST_LABELS[dest] ?? DEST_LABELS.any}
      checkIn={sp.checkIn || ""}
      checkOut={sp.checkOut || ""}
      guests={{
        adults: parseInt(sp.adults || "2", 10),
        children: parseInt(sp.children || "0", 10),
        infants: parseInt(sp.infants || "0", 10),
      }}
    />
  );
}
