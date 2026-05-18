"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  ChevronLeft,
  Mail,
  User as UserIcon,
  Calendar,
  LogOut,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useT, useI18n } from "@/components/I18nProvider";
import { type Booking } from "@/lib/bookings";

export default function ProfileClient({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const t = useT();
  const { lang } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mounted, setMounted] = useState(false);
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    let active = true;
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((payload) => {
        if (active) setBookings(payload.bookings ?? []);
      })
      .finally(() => {
        if (active) setMounted(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <Nav />
      <main className="pt-28 pb-32 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition mb-10"
          >
            <ChevronLeft size={14} /> {t("results.backToHome")}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <p className="flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-[#d4b896] font-medium mb-6">
              <span className="block w-8 h-px bg-[#d4b896]" />
              {t("profile.eyebrow")}
            </p>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[#d4b896] text-[#0a0a0a] flex items-center justify-center text-3xl font-semibold border border-[#d4b896]/40 shadow-[0_8px_24px_-4px_rgba(212,184,150,0.45)]">
                {initial}
              </div>
              <div>
                <p className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
                  {t("profile.greeting")}{" "}
                  <span className="italic text-white/75">
                    {name || email.split("@")[0]}.
                  </span>
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left: account info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-1 space-y-3"
            >
              <InfoRow
                Icon={UserIcon}
                label={t("profile.name")}
                value={name || "—"}
              />
              <InfoRow Icon={Mail} label={t("profile.email")} value={email} />
              <InfoRow
                Icon={Calendar}
                label={t("profile.signedInSince")}
                value={new Date().toLocaleDateString(
                  lang === "ru" ? "ru-RU" : "en-US",
                  { day: "numeric", month: "long", year: "numeric" }
                )}
              />

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 border border-white/15 hover:border-white/40 rounded-xl py-3.5 text-[13px] uppercase tracking-[0.18em] font-medium text-white/85 hover:text-white transition"
              >
                <LogOut size={14} strokeWidth={1.8} />
                {t("profile.logout")}
              </button>
            </motion.div>

            {/* Right: bookings */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-medium">
                  {t("profile.bookings")}
                </p>
                {mounted && bookings.length > 0 && (
                  <span className="text-xs text-white/45 tabular-nums">
                    {bookings.length}
                  </span>
                )}
              </div>

              {!mounted ? (
                <div className="border border-white/10 rounded-3xl p-10 bg-[#0f0f0f]/40 animate-pulse h-48" />
              ) : bookings.length === 0 ? (
                <div className="border border-white/10 rounded-3xl p-10 md:p-14 bg-[#0f0f0f]/40">
                  <p className="font-serif text-3xl md:text-4xl leading-tight tracking-tight mb-4 max-w-lg">
                    {t("profile.noBookings")}
                  </p>
                  <p className="text-base text-white/60 max-w-md leading-relaxed mb-8">
                    {t("profile.noBookingsHint")}
                  </p>
                  <Link
                    href="/#collection"
                    className="inline-flex items-center gap-2 bg-[#d4b896] hover:bg-[#c0a37e] text-[#0a0a0a] text-[13px] uppercase tracking-[0.18em] font-semibold px-7 py-3.5 rounded-full transition"
                  >
                    {t("profile.openCollection")} →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function BookingCard({
  booking,
  formatDate,
}: {
  booking: Booking;
  formatDate: (iso: string) => string;
}) {
  const totalGuests = booking.guests.adults + booking.guests.children;
  return (
    <Link
      href={`/listing/${booking.listingId}`}
      className="group flex items-stretch gap-4 border border-white/10 hover:border-white/25 rounded-2xl p-4 bg-[#0f0f0f]/40 transition"
    >
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-cover bg-center border border-white/10"
        style={{ backgroundImage: `url(${booking.image})` }}
      />
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4b896] font-medium tabular-nums">
              {booking.id}
            </span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">
              {statusLabel(booking.status)}
            </span>
          </div>
          <p className="font-serif text-lg md:text-xl text-white leading-tight mb-1 truncate">
            {booking.listingTitle.split("—")[0].trim()}
          </p>
          <p className="text-xs text-white/55 flex items-center gap-1 mb-2">
            <MapPin size={11} className="inline" />
            {booking.location}, {booking.country}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/60">
          <span>{formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</span>
          <span className="text-white/30">·</span>
          <span>{booking.nights} {plural(booking.nights, ["ночь", "ночи", "ночей"])}</span>
          <span className="text-white/30">·</span>
          <span>{totalGuests} {plural(totalGuests, ["гость", "гостя", "гостей"])}</span>
          <span className="ml-auto text-[#d4b896] font-semibold tabular-nums">
            ${booking.total.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return forms[1];
  return forms[2];
}

function statusLabel(status: Booking["status"]) {
  if (status === "CONFIRMED") return "Подтверждена";
  if (status === "CANCELED") return "Отклонена";
  return "На проверке";
}

function InfoRow({
  Icon,
  label,
  value,
}: {
  Icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 border border-white/10 rounded-xl px-4 py-4 bg-[#0f0f0f]/40">
      <span className="w-9 h-9 rounded-lg bg-[#d4b896]/10 border border-[#d4b896]/15 flex items-center justify-center shrink-0">
        <Icon size={14} strokeWidth={1.7} className="text-[#d4b896]" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-medium mb-0.5">
          {label}
        </p>
        <p className="text-sm text-white truncate">{value}</p>
      </div>
    </div>
  );
}
