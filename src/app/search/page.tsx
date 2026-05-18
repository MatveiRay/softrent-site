import { searchListings } from "@/lib/listings-db";
import SearchResults from "./SearchResults";

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
  uluwatu: { ru: "Улувату, Бали", en: "Uluwatu, Bali" },
  sumba: { ru: "Сумба", en: "Sumba" },
  tulum: { ru: "Тулум, Мексика", en: "Tulum, Mexico" },
  sayulita: { ru: "Саюлита, Мексика", en: "Sayulita, Mexico" },
  costarica: { ru: "Коста-Рика", en: "Costa Rica" },
  maafushi: { ru: "Маафуши, Мальдивы", en: "Maafushi, Maldives" },
  senja: { ru: "Сенья, Норвегия", en: "Senja, Norway" },
  zermatt: { ru: "Церматт, Швейцария", en: "Zermatt, Switzerland" },
  hokkaido: { ru: "Хоккайдо, Япония", en: "Hokkaido, Japan" },
  dolomites: { ru: "Доломиты, Италия", en: "Dolomites, Italy" },
  lofoten: { ru: "Лофотены, Норвегия", en: "Lofoten, Norway" },
  cairngorms: { ru: "Кэрнгормс, Шотландия", en: "Cairngorms, Scotland" },
};

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
  const adults = parseInt(sp.adults || "2", 10);
  const children = parseInt(sp.children || "0", 10);
  const filtered = await searchListings({
    dest,
    guests: Math.max(1, adults + children),
  });

  return (
    <SearchResults
      listings={filtered}
      dest={dest}
      destLabels={DEST_LABELS[dest] ?? DEST_LABELS.any}
      checkIn={sp.checkIn || ""}
      checkOut={sp.checkOut || ""}
      guests={{
        adults,
        children,
        infants: parseInt(sp.infants || "0", 10),
      }}
    />
  );
}
