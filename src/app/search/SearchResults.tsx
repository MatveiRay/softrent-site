"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Calendar, Users, Search as SearchIcon } from "lucide-react";
import type { Listing } from "@/data/listings";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { useT, useI18n } from "@/components/I18nProvider";

function formatDate(iso: string, lang: "ru" | "en") {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

function pluralGuests(n: number, lang: "ru" | "en") {
  if (lang === "en") return n === 1 ? "guest" : "guests";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "гость";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100))
    return "гостя";
  return "гостей";
}

export default function SearchResults({
  listings,
  destLabels,
  checkIn,
  checkOut,
  guests,
}: {
  listings: Listing[];
  dest: string;
  destLabels: { ru: string; en: string };
  checkIn: string;
  checkOut: string;
  guests: { adults: number; children: number; infants: number };
}) {
  const t = useT();
  const { lang } = useI18n();

  const totalGuests = guests.adults + guests.children;
  const guestSummary =
    totalGuests > 0
      ? `${totalGuests} ${pluralGuests(totalGuests, lang)}` +
        (guests.infants > 0
          ? lang === "ru"
            ? `, ${guests.infants} младенц.`
            : `, ${guests.infants} infant${guests.infants === 1 ? "" : "s"}`
          : "")
      : t("results.who");

  const dateSummary =
    checkIn && checkOut
      ? `${formatDate(checkIn, lang)} — ${formatDate(checkOut, lang)}`
      : t("results.anyDates");

  return (
    <>
      <Nav />
      <main className="pt-28 pb-32 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition mb-10"
          >
            <ChevronLeft size={14} /> {t("results.backToHome")}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <p className="flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-[#d4b896] font-medium mb-6">
              <span className="block w-8 h-px bg-[#d4b896]" />
              {t("results.eyebrow")}
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.02em] max-w-5xl">
              {destLabels[lang]}
              <span className="italic text-white/65">.</span>
            </h1>
            <p className="text-base md:text-lg text-white/70 mt-5 max-w-xl">
              {t("results.found")}:{" "}
              <span className="text-[#d4b896] font-semibold tabular-nums">
                {listings.length}
              </span>
            </p>
          </motion.div>

          {/* Filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3 mb-14 pb-10 border-b border-white/10"
          >
            <FilterChip
              icon={MapPin}
              label={t("results.where")}
              value={destLabels[lang]}
            />
            <FilterChip
              icon={Calendar}
              label={t("results.when")}
              value={dateSummary}
            />
            <FilterChip
              icon={Users}
              label={t("results.who")}
              value={guestSummary}
            />
            <Link
              href="/"
              className="ml-auto group inline-flex items-center gap-2 bg-[#d4b896] hover:bg-[#c0a37e] text-[#0a0a0a] text-[12px] uppercase tracking-[0.18em] font-semibold pl-5 pr-4 py-3 rounded-full transition whitespace-nowrap"
            >
              <SearchIcon size={13} strokeWidth={2.5} />
              {t("results.change")}
            </Link>
          </motion.div>

          {/* Results grid OR empty state */}
          {listings.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12"
            >
              {listings.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-center py-24"
            >
              <p className="font-serif text-3xl md:text-4xl mb-3 max-w-2xl mx-auto">
                {t("results.empty.title")}
              </p>
              <p className="text-base text-white/60 max-w-md mx-auto leading-relaxed mb-8">
                {t("results.empty.hint")}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 border border-white/30 hover:border-white rounded-full px-7 py-3.5 text-sm uppercase tracking-[0.18em] font-medium transition"
              >
                {t("results.openAll")}
              </Link>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function FilterChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/12 rounded-full pl-4 pr-5 py-3">
      <Icon size={14} strokeWidth={1.7} className="text-[#d4b896] shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="text-[9px] uppercase tracking-[0.25em] text-white/45 mb-1 font-medium">
          {label}
        </span>
        <span className="text-[13px] text-white truncate max-w-[180px]">
          {value}
        </span>
      </div>
    </div>
  );
}
