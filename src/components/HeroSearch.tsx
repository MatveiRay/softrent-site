"use client";

import {
  MapPin,
  Calendar,
  Users,
  Plus,
  Minus,
  Check,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  Globe2,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useT } from "./I18nProvider";
import { useLockLenis } from "./LenisProvider";
import type { DictKey } from "@/lib/i18n";

type FieldKey = "where" | "in" | "out" | "guests" | null;
type DestKind = "region" | "country" | "city";

type Destination = {
  id: string;
  kind: DestKind;
  label: { ru: string; en: string };
  subtitle: { ru: string; en: string };
  searchTerms: string[]; // lowercase RU + EN keywords
  image: string;
};

const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=80`;

const DESTINATIONS: Destination[] = [
  // === REGIONS ===
  {
    id: "any",
    kind: "region",
    label: { ru: "Любое направление", en: "Anywhere" },
    subtitle: { ru: "Все 12 объектов · 9 стран", en: "All 12 properties · 9 countries" },
    searchTerms: ["любое", "все", "any", "anywhere", "all"],
    image: u("1564013799919-ab600027ffc6"),
  },
  {
    id: "tropical",
    kind: "region",
    label: { ru: "Тропики", en: "Tropics" },
    subtitle: { ru: "6 вилл · океан, пальмы", en: "6 villas · ocean, palms" },
    searchTerms: ["тропики", "тропические", "tropics", "tropical", "beach"],
    image: u("1540541338287-41700207dee6"),
  },
  {
    id: "mountain",
    kind: "region",
    label: { ru: "Горы", en: "Mountains" },
    subtitle: { ru: "6 шале · снег, дерево, тишина", en: "6 chalets · snow, wood, silence" },
    searchTerms: ["горы", "шале", "mountains", "mountain", "snow"],
    image: u("1518733057094-95b53143d2a7"),
  },

  // === COUNTRIES ===
  {
    id: "indonesia",
    kind: "country",
    label: { ru: "Индонезия", en: "Indonesia" },
    subtitle: { ru: "2 виллы · Бали, Сумба", en: "2 villas · Bali, Sumba" },
    searchTerms: ["индонезия", "indonesia", "bali", "sumba", "бали", "сумба"],
    image: u("1582610116397-edb318620f90"),
  },
  {
    id: "mexico",
    kind: "country",
    label: { ru: "Мексика", en: "Mexico" },
    subtitle: { ru: "2 виллы · Тулум, Сайулита", en: "2 villas · Tulum, Sayulita" },
    searchTerms: ["мексика", "mexico", "tulum", "sayulita", "тулум", "сайулита"],
    image: u("1564013799919-ab600027ffc6"),
  },
  {
    id: "costarica-c",
    kind: "country",
    label: { ru: "Коста-Рика", en: "Costa Rica" },
    subtitle: { ru: "Финка с банановой рощей", en: "Finca with banana grove" },
    searchTerms: ["коста-рика", "коста рика", "costa rica", "rica"],
    image: u("1505691938895-1758d7feb511"),
  },
  {
    id: "maldives-c",
    kind: "country",
    label: { ru: "Мальдивы", en: "Maldives" },
    subtitle: { ru: "Сьют над водой на личном рифе", en: "Overwater suite on private reef" },
    searchTerms: ["мальдивы", "maldives", "maafushi", "atoll"],
    image: u("1540541338287-41700207dee6"),
  },
  {
    id: "norway",
    kind: "country",
    label: { ru: "Норвегия", en: "Norway" },
    subtitle: { ru: "2 шале · Сенья, Лофотены", en: "2 chalets · Senja, Lofoten" },
    searchTerms: ["норвегия", "norway", "senja", "lofoten", "сенья", "лофотены"],
    image: u("1465056836041-7f43ac27dcb5"),
  },
  {
    id: "switzerland",
    kind: "country",
    label: { ru: "Швейцария", en: "Switzerland" },
    subtitle: { ru: "Церматт · Маттерхорн", en: "Zermatt · Matterhorn" },
    searchTerms: ["швейцария", "switzerland", "zermatt", "церматт", "маттерхорн"],
    image: u("1551524559-8af4e6624178"),
  },
  {
    id: "japan",
    kind: "country",
    label: { ru: "Япония", en: "Japan" },
    subtitle: { ru: "Хоккайдо · Нисэко", en: "Hokkaido · Niseko" },
    searchTerms: ["япония", "japan", "hokkaido", "хоккайдо", "нисэко", "niseko"],
    image: u("1483728642387-6c3bdd6c93e5"),
  },
  {
    id: "italy",
    kind: "country",
    label: { ru: "Италия", en: "Italy" },
    subtitle: { ru: "Доломиты · Сасс Пордой", en: "Dolomites · Sass Pordoi" },
    searchTerms: ["италия", "italy", "dolomites", "доломиты"],
    image: u("1502786129293-79981df4e689"),
  },
  {
    id: "scotland",
    kind: "country",
    label: { ru: "Шотландия", en: "Scotland" },
    subtitle: { ru: "Кэрнгормс · пустошь", en: "Cairngorms · the moor" },
    searchTerms: ["шотландия", "scotland", "cairngorms", "кэрнгормс"],
    image: u("1486325212027-8081e485255e"),
  },

  // === CITIES / PROPERTIES ===
  {
    id: "uluwatu",
    kind: "city",
    label: { ru: "Уулувату · Casa Luz", en: "Uluwatu · Casa Luz" },
    subtitle: { ru: "Бали · вилла на утёсе", en: "Bali · cliffside villa" },
    searchTerms: ["uluwatu", "уулувату", "бали", "bali", "casa luz", "padang"],
    image: u("1582610116397-edb318620f90"),
  },
  {
    id: "sumba",
    kind: "city",
    label: { ru: "Сумба · Tide House", en: "Sumba · Tide House" },
    subtitle: { ru: "Индонезия · павильон над лагуной", en: "Indonesia · pavilion over lagoon" },
    searchTerms: ["sumba", "сумба", "tide house", "indonesia"],
    image: u("1571896349842-33c89424de2d"),
  },
  {
    id: "tulum",
    kind: "city",
    label: { ru: "Тулум · Papaya", en: "Tulum · Papaya" },
    subtitle: { ru: "Мексика · модернистская вилла", en: "Mexico · modernist villa" },
    searchTerms: ["tulum", "тулум", "papaya", "mexico", "мексика"],
    image: u("1564013799919-ab600027ffc6"),
  },
  {
    id: "sayulita",
    kind: "city",
    label: { ru: "Сайулита · Salt Cabaña", en: "Sayulita · Salt Cabaña" },
    subtitle: { ru: "Мексика · хижина из плавника", en: "Mexico · driftwood hut" },
    searchTerms: ["sayulita", "сайулита", "salt cabana", "salt cabaña", "mexico"],
    image: u("1611892440504-42a792e24d32"),
  },
  {
    id: "costarica",
    kind: "city",
    label: { ru: "Коста-Рика · Los Sueños", en: "Costa Rica · Los Sueños" },
    subtitle: { ru: "Финка с банановой рощей", en: "Finca with banana grove" },
    searchTerms: ["costa rica", "коста-рика", "коста рика", "los sueños", "los suenos"],
    image: u("1505691938895-1758d7feb511"),
  },
  {
    id: "maafushi",
    kind: "city",
    label: { ru: "Маафуши · Atoll", en: "Maafushi · Atoll" },
    subtitle: { ru: "Мальдивы · сьют над водой", en: "Maldives · overwater suite" },
    searchTerms: ["maldives", "мальдивы", "maafushi", "маафуши", "atoll"],
    image: u("1540541338287-41700207dee6"),
  },
  {
    id: "senja",
    kind: "city",
    label: { ru: "Сенья · North Light", en: "Senja · North Light" },
    subtitle: { ru: "Норвегия · стеклянный дом под сиянием", en: "Norway · glass cabin under aurora" },
    searchTerms: ["senja", "сенья", "north light", "norway", "aurora", "сияние"],
    image: u("1518733057094-95b53143d2a7"),
  },
  {
    id: "zermatt",
    kind: "city",
    label: { ru: "Церматт · Stein Haus", en: "Zermatt · Stein Haus" },
    subtitle: { ru: "Швейцария · каменное шале под Маттерхорном", en: "Switzerland · stone chalet under Matterhorn" },
    searchTerms: ["zermatt", "церматт", "stein haus", "matterhorn", "маттерхорн", "switzerland"],
    image: u("1551524559-8af4e6624178"),
  },
  {
    id: "hokkaido",
    kind: "city",
    label: { ru: "Хоккайдо · Hush", en: "Hokkaido · Hush" },
    subtitle: { ru: "Япония · лиственничная хижина и онсэн", en: "Japan · larch cabin and onsen" },
    searchTerms: ["hokkaido", "хоккайдо", "hush", "japan", "niseko", "нисэко", "onsen", "онсэн"],
    image: u("1483728642387-6c3bdd6c93e5"),
  },
  {
    id: "dolomites",
    kind: "city",
    label: { ru: "Доломиты · Alpe", en: "Dolomites · Alpe" },
    subtitle: { ru: "Италия · A-frame на южном склоне", en: "Italy · A-frame on south ridge" },
    searchTerms: ["dolomites", "доломиты", "alpe", "italy", "a-frame", "sass pordoi"],
    image: u("1502786129293-79981df4e689"),
  },
  {
    id: "lofoten",
    kind: "city",
    label: { ru: "Лофотены · Fjellhytte", en: "Lofoten · Fjellhytte" },
    subtitle: { ru: "Норвегия · чёрный дом над фьордом", en: "Norway · black house above fjord" },
    searchTerms: ["lofoten", "лофотены", "fjellhytte", "norway", "fjord", "фьорд", "reine"],
    image: u("1465056836041-7f43ac27dcb5"),
  },
  {
    id: "cairngorms",
    kind: "city",
    label: { ru: "Кэрнгормс · Tor", en: "Cairngorms · Tor" },
    subtitle: { ru: "Шотландия · гранитная башня", en: "Scotland · granite tower" },
    searchTerms: ["cairngorms", "кэрнгормс", "tor", "scotland", "moor", "пустошь", "aviemore"],
    image: u("1486325212027-8081e485255e"),
  },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const formatDate = (s: string, lang: "ru" | "en") => {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
  });
};
const guestPlural = (n: number, lang: "ru" | "en") => {
  if (lang === "en") return n === 1 ? "guest" : "guests";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "гость";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100))
    return "гостя";
  return "гостей";
};

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HeroSearch() {
  const t = useT();
  const router = useRouter();
  const [active, setActive] = useState<FieldKey>(null);
  const [destination, setDestination] = useState<Destination>(DESTINATIONS[0]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState({ adults: 2, children: 0, infants: 0 });
  const formRef = useRef<HTMLFormElement>(null);
  const [mounted, setMounted] = useState(false);
  // Determine current language from t() output (cheap heuristic)
  const lang: "ru" | "en" = t("nav.login") === "Login" ? "en" : "ru";

  useEffect(() => {
    setMounted(true);
  }, []);

  const guestSummary = () => {
    const total = guests.adults + guests.children;
    const parts: string[] = [];
    if (total > 0) parts.push(`${total} ${guestPlural(total, lang)}`);
    if (guests.infants > 0)
      parts.push(
        lang === "ru"
          ? `${guests.infants} младенц.`
          : `${guests.infants} infant${guests.infants === 1 ? "" : "s"}`
      );
    return parts.join(", ");
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto z-30">
      <motion.form
        ref={formRef}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.75, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={(e) => {
          e.preventDefault();
          setActive(null);
          const params = new URLSearchParams();
          params.set("dest", destination.id);
          if (checkIn) params.set("checkIn", checkIn);
          if (checkOut) params.set("checkOut", checkOut);
          params.set("adults", String(guests.adults));
          if (guests.children) params.set("children", String(guests.children));
          if (guests.infants) params.set("infants", String(guests.infants));
          router.push(`/search?${params.toString()}`);
        }}
      >
        <div className="flex items-stretch bg-[#0e0e0e]/75 backdrop-blur-2xl border border-white/15 rounded-full overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]">
          <Field
            icon={MapPin}
            label={t("search.where")}
            value={destination.label[lang]}
            isActive={active === "where"}
            onClick={() => setActive(active === "where" ? null : "where")}
          />
          <Divider />
          <Field
            icon={Calendar}
            label={t("search.in")}
            value={formatDate(checkIn, lang) || t("search.placeholder.in")}
            placeholder={!checkIn}
            isActive={active === "in"}
            onClick={() => setActive(active === "in" ? null : "in")}
          />
          <Divider />
          <Field
            icon={Calendar}
            label={t("search.out")}
            value={formatDate(checkOut, lang) || t("search.placeholder.out")}
            placeholder={!checkOut}
            isActive={active === "out"}
            onClick={() => setActive(active === "out" ? null : "out")}
          />
          <Divider />
          <Field
            icon={Users}
            label={t("search.guests")}
            value={guestSummary() || t("search.placeholder.guests")}
            placeholder={!guestSummary()}
            isActive={active === "guests"}
            onClick={() => setActive(active === "guests" ? null : "guests")}
          />
          <div className="p-1.5 flex items-center shrink-0">
            <button
              type="submit"
              className="group inline-flex items-center gap-2 bg-[#d4b896] hover:bg-[#c0a37e] text-[#0a0a0a] text-[12px] uppercase tracking-[0.18em] font-semibold pl-5 pr-4 py-3.5 rounded-full transition whitespace-nowrap"
            >
              {t("search.find")}
              <ArrowUpRight
                size={14}
                strokeWidth={2.5}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>
      </motion.form>

      {mounted && (
        <PortalPanel active={!!active} onClose={() => setActive(null)}>
          <AnimatePresence mode="wait">
            {active === "where" && (
              <Panel key="where" tone="wide" onClose={() => setActive(null)}>
                <PanelHeader
                  step={1}
                  totalSteps={4}
                  title={t("search.headerWhere")}
                />
                <DestinationSelector
                  lang={lang}
                  selected={destination}
                  onSelect={(d) => {
                    setDestination(d);
                    setActive("in");
                  }}
                />
              </Panel>
            )}

            {active === "in" && (
              <Panel key="in" onClose={() => setActive(null)}>
                <PanelHeader
                  step={2}
                  totalSteps={4}
                  title={t("search.headerIn")}
                />
                <MiniCalendar
                  lang={lang}
                  value={checkIn}
                  minISO={todayISO()}
                  onSelect={(d) => {
                    setCheckIn(d);
                    if (checkOut && checkOut <= d) setCheckOut("");
                    setActive("out");
                  }}
                />
                <QuickDates
                  onSelect={(d) => {
                    setCheckIn(d);
                    if (checkOut && checkOut <= d) setCheckOut("");
                    setActive("out");
                  }}
                />
              </Panel>
            )}

            {active === "out" && (
              <Panel key="out" onClose={() => setActive(null)}>
                <PanelHeader
                  step={3}
                  totalSteps={4}
                  title={t("search.headerOut")}
                />
                <MiniCalendar
                  lang={lang}
                  value={checkOut}
                  minISO={checkIn || todayISO()}
                  onSelect={(d) => {
                    setCheckOut(d);
                    setActive("guests");
                  }}
                />
                <QuickDates
                  fromISO={checkIn}
                  onSelect={(d) => {
                    setCheckOut(d);
                    setActive("guests");
                  }}
                />
              </Panel>
            )}

            {active === "guests" && (
              <Panel key="guests" onClose={() => setActive(null)}>
                <PanelHeader
                  step={4}
                  totalSteps={4}
                  title={t("search.headerGuests")}
                />
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={itemVariants}>
                    <GuestRow
                      label={t("search.adults")}
                      sub={t("search.adultsSub")}
                      value={guests.adults}
                      onChange={(v) => setGuests({ ...guests, adults: v })}
                      min={1}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <GuestRow
                      label={t("search.children")}
                      sub={t("search.childrenSub")}
                      value={guests.children}
                      onChange={(v) => setGuests({ ...guests, children: v })}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <GuestRow
                      label={t("search.infants")}
                      sub={t("search.infantsSub")}
                      value={guests.infants}
                      onChange={(v) => setGuests({ ...guests, infants: v })}
                    />
                  </motion.div>
                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => {
                      setActive(null);
                      formRef.current?.requestSubmit();
                    }}
                    className="mt-5 w-full bg-[#d4b896] hover:bg-[#c0a37e] text-[#0a0a0a] text-[13px] font-semibold uppercase tracking-[0.18em] py-3.5 rounded-full transition inline-flex items-center justify-center gap-2"
                  >
                    {t("search.find")}
                    <ArrowUpRight size={14} strokeWidth={2.5} />
                  </motion.button>
                </motion.div>
              </Panel>
            )}
          </AnimatePresence>
        </PortalPanel>
      )}
    </div>
  );
}

// === Destination selector with search filter ===

function DestinationSelector({
  lang,
  selected,
  onSelect,
}: {
  lang: "ru" | "en";
  selected: Destination;
  onSelect: (d: Destination) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter((d) => {
      if (d.label.ru.toLowerCase().includes(q)) return true;
      if (d.label.en.toLowerCase().includes(q)) return true;
      if (d.subtitle.ru.toLowerCase().includes(q)) return true;
      return d.searchTerms.some((term) => term.includes(q));
    });
  }, [query]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative mb-5"
      >
        {/* Маленькая «орбитальная» анимация в поле поиска */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none">
          {/* медленно дышащее champagne-свечение */}
          <motion.div
            className="absolute inset-0 rounded-full bg-[#d4b896]/30 blur-md"
            animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
          />
          {/* статичный глобус */}
          <Globe2
            size={18}
            strokeWidth={1.6}
            className="absolute inset-0 text-[#d4b896]"
          />
          {/* первая орбита — точка по часовой */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, ease: "linear", repeat: Infinity }}
          >
            <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#d4b896]" />
          </motion.div>
          {/* вторая орбита — точка против часовой, наклонённая */}
          <motion.div
            className="absolute inset-0"
            style={{ transform: "rotate(45deg)" }}
            animate={{ rotate: -315 }}
            transition={{ duration: 9, ease: "linear", repeat: Infinity }}
          >
            <span className="absolute top-1/2 -right-[3px] -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-white/85" />
          </motion.div>
        </div>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.searchPlaceholder")}
          className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#d4b896] transition"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.22em] text-white/35 font-medium pointer-events-none">
          {DESTINATIONS.length} {DESTINATIONS[0].label.ru === "Любое направление" ? "точек" : ""}
        </span>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-white/55 py-8 text-center"
        >
          {t("search.noResults")}
        </motion.p>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto -mx-2 px-2 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <motion.div
            key={`list-${query}`}
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {filtered.map((d) => (
              <DestCard
                key={d.id}
                d={d}
                lang={lang}
                selected={selected.id === d.id}
                onClick={() => onSelect(d)}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Each destination gets a Fluent UI 3D emoji icon (PNG) on a tinted card —
// looks like Airbnb's illustrated destination icons.
type Tone = "warm" | "cool" | "neutral";

function iconFor(id: string): { src: string; tone: Tone } {
  switch (id) {
    case "any":
      return { src: "/icons/globe.png", tone: "neutral" };
    case "tropical":
    case "indonesia":
    case "mexico":
    case "costarica-c":
    case "uluwatu":
    case "tulum":
    case "sayulita":
      return { src: "/icons/palm.png", tone: "warm" };
    case "sumba":
      return { src: "/icons/tent.png", tone: "warm" };
    case "costarica":
      return { src: "/icons/tree.png", tone: "warm" };
    case "maldives-c":
    case "maafushi":
      return { src: "/icons/wave.png", tone: "warm" };
    case "norway":
    case "senja":
      return { src: "/icons/aurora.png", tone: "cool" };
    case "mountain":
    case "switzerland":
    case "zermatt":
    case "italy":
      return { src: "/icons/mountain.png", tone: "cool" };
    case "dolomites":
      return { src: "/icons/compass.png", tone: "cool" };
    case "japan":
    case "hokkaido":
      return { src: "/icons/tree.png", tone: "cool" };
    case "scotland":
    case "cairngorms":
      return { src: "/icons/castle.png", tone: "cool" };
    case "lofoten":
      return { src: "/icons/canoe.png", tone: "cool" };
    default:
      return { src: "/icons/globe.png", tone: "neutral" };
  }
}

function DestCard({
  d,
  lang,
  selected,
  onClick,
}: {
  d: Destination;
  lang: "ru" | "en";
  selected: boolean;
  onClick: () => void;
}) {
  const { src, tone } = iconFor(d.id);

  // Subtle radial bg per tone, gives "lit-from-corner" depth
  const tintBg =
    tone === "warm"
      ? "radial-gradient(circle at 30% 25%, rgba(212,184,150,0.24) 0%, rgba(40,28,18,0.6) 60%, rgba(20,14,10,0.9) 100%)"
      : tone === "cool"
        ? "radial-gradient(circle at 30% 25%, rgba(150,180,220,0.20) 0%, rgba(20,28,40,0.6) 60%, rgba(10,14,20,0.92) 100%)"
        : "radial-gradient(circle at 30% 25%, rgba(212,184,150,0.20) 0%, rgba(25,25,25,0.65) 60%, rgba(15,15,15,0.92) 100%)";

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-3 p-2 pr-4 rounded-2xl text-left transition border ${
        selected
          ? "border-[#d4b896]/60 bg-[#d4b896]/[0.05]"
          : "border-white/10 hover:border-white/30 hover:bg-white/[0.03]"
      }`}
    >
      {/* Mini 3D-model card with Fluent emoji */}
      <div
        className="relative w-14 h-14 shrink-0 flex items-center justify-center rounded-xl border border-[#d4b896]/15 shadow-[0_8px_18px_-6px_rgba(0,0,0,0.7)] transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-2 overflow-hidden"
        style={{ background: tintBg }}
      >
        {/* Top-left highlight for depth */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.10] via-transparent to-black/30 pointer-events-none" />
        {/* 3D emoji */}
        <img
          src={src}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          className="relative w-9 h-9 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110"
        />
        {/* Bottom champagne puddle */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#d4b896]/30 blur-md rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white truncate leading-tight">
          {d.label[lang]}
        </p>
        <p className="text-[11px] text-white/55 mt-1 truncate">
          {d.subtitle[lang]}
        </p>
      </div>
      {selected && <Check size={15} className="text-[#d4b896] shrink-0" />}
    </motion.button>
  );
}

// === Portal centered modal ===

function PortalPanel({
  active,
  onClose,
  children,
}: {
  active: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useLockLenis(active);

  useEffect(() => {
    if (!active) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      document.removeEventListener("keydown", onKey);
    };
  }, [active, onClose]);

  return createPortal(
    <AnimatePresence>
      {active && (
        <div
          id="hero-search-panel"
          data-lenis-prevent
          className="fixed inset-0 z-[60]"
        >
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a0a]/75 backdrop-blur-md cursor-pointer"
          />
          <div className="relative h-full w-full flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-[640px]">
              {children}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Field({
  icon: Icon,
  label,
  value,
  isActive,
  placeholder,
  onClick,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string;
  isActive: boolean;
  placeholder?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 group flex items-center gap-3 px-5 py-4 transition text-left min-w-0 ${
        isActive ? "bg-white/[0.09]" : "hover:bg-white/[0.06]"
      }`}
    >
      <Icon size={15} strokeWidth={1.7} className="text-[#d4b896] shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/55 leading-none mb-1.5">
          {label}
        </p>
        <p
          className={`text-[13px] truncate ${
            placeholder ? "text-white/55" : "text-white/95"
          }`}
        >
          {value}
        </p>
      </div>
    </button>
  );
}

function Divider() {
  return <span className="w-px my-3 bg-white/12 self-stretch" />;
}

function Panel({
  children,
  tone = "default",
  onClose,
}: {
  children: React.ReactNode;
  tone?: "default" | "wide";
  onClose: () => void;
}) {
  const t = useT();
  const width =
    tone === "wide"
      ? "w-full max-w-[640px]"
      : "w-full max-w-[520px] mx-auto";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(6px)" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${width} text-left`}
    >
      <div className="absolute -inset-8 -z-10 bg-[#d4b896]/[0.08] blur-3xl rounded-[3rem] pointer-events-none" />
      <div className="relative bg-[#141414]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_30px_80px_-10px_rgba(0,0,0,0.9)] p-7 md:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("search.close")}
          className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/[0.06] flex items-center justify-center transition group z-10"
        >
          <X size={14} strokeWidth={1.8} className="text-white/70 group-hover:text-white transition" />
        </button>
        {children}
      </div>
    </motion.div>
  );
}

function PanelHeader({
  step,
  totalSteps,
  title,
}: {
  step: number;
  totalSteps: number;
  title: string;
}) {
  const t = useT();
  return (
    <div className="mb-5 pr-12">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex items-center gap-2 mb-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4b896] font-medium">
          {t("search.step")} {step} {t("search.stepOf")} {totalSteps}
        </span>
        <div className="flex gap-1 ml-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-px w-6 ${
                i < step ? "bg-[#d4b896]" : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-serif text-2xl text-white leading-tight"
      >
        {title}
      </motion.p>
    </div>
  );
}

function GuestRow({
  label,
  sub,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  sub: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/10 last:border-0">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-white/55 mt-0.5">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => value > min && onChange(value - 1)}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-white/25 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed enabled:hover:border-white transition"
        >
          <Minus size={11} />
        </button>
        <span className="w-6 text-center text-sm tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-white/25 flex items-center justify-center hover:border-white transition"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function isoOf(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function MiniCalendar({
  lang,
  value,
  minISO,
  onSelect,
}: {
  lang: "ru" | "en";
  value: string;
  minISO: string;
  onSelect: (iso: string) => void;
}) {
  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const firstWeekday = ((view.getDay() + 6) % 7) + 1;
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0
  ).getDate();
  const minDate = new Date(minISO + "T00:00:00");
  const todayStr = isoOf(new Date());
  const months = lang === "ru" ? MONTHS_RU : MONTHS_EN;
  const weekdays = lang === "ru" ? WEEKDAYS_RU : WEEKDAYS_EN;

  const cells: (number | null)[] = [];
  for (let i = 1; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="mb-5"
    >
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() =>
            setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
          className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 transition"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="text-sm text-white capitalize tabular-nums">
          {months[view.getMonth()]} {view.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() =>
            setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
          className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {weekdays.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] uppercase tracking-wider text-white/40 font-medium py-1"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="h-9" />;
          const date = new Date(view.getFullYear(), view.getMonth(), d);
          const iso = isoOf(date);
          const isPast = date < minDate;
          const isSelected = iso === value;
          const isToday = iso === todayStr;
          return (
            <button
              key={iso}
              disabled={isPast}
              type="button"
              onClick={() => onSelect(iso)}
              className={`h-9 rounded-lg text-[13px] tabular-nums transition relative ${
                isSelected
                  ? "bg-[#d4b896] text-[#0a0a0a] font-semibold shadow-[0_8px_20px_-6px_rgba(212,184,150,0.5)]"
                  : isPast
                  ? "text-white/15 cursor-not-allowed"
                  : isToday
                  ? "border border-[#d4b896]/50 text-white hover:bg-white/[0.07]"
                  : "text-white/85 hover:bg-white/[0.07]"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function QuickDates({
  fromISO,
  onSelect,
}: {
  fromISO?: string;
  onSelect: (iso: string) => void;
}) {
  const t = useT();
  const base = fromISO ? new Date(fromISO + "T00:00:00") : new Date();
  const offsetFromBase = (days: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return isoOf(d);
  };
  const opts: { key: DictKey; days: number }[] = fromISO
    ? [
        { key: "search.relPlus3", days: 3 },
        { key: "search.relPlusWeek", days: 7 },
        { key: "search.relPlus2Weeks", days: 14 },
        { key: "search.relPlusMonth", days: 30 },
      ]
    : [
        { key: "search.quickToday", days: 0 },
        { key: "search.quick3", days: 3 },
        { key: "search.quickWeek", days: 7 },
        { key: "search.quickMonth", days: 30 },
      ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/45 mb-2 font-medium">
        {t("search.orQuick")}
      </p>
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-2"
      >
        {opts.map((q) => (
          <motion.button
            key={q.key}
            variants={itemVariants}
            type="button"
            onClick={() => onSelect(offsetFromBase(q.days))}
            className="px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] font-medium rounded-lg border border-white/15 hover:border-[#d4b896]/60 hover:bg-white/[0.05] transition text-left"
          >
            {t(q.key)}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
