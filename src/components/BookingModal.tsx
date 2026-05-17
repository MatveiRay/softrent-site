"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Minus,
  Mail,
  User as UserIcon,
  ArrowUpRight,
  Check,
  Sparkles,
} from "lucide-react";
import { useT, useI18n } from "./I18nProvider";
import { useLockLenis } from "./LenisProvider";
import {
  saveBooking,
  generateBookingId,
  diffNights,
  type Booking,
} from "@/lib/bookings";
import type { Listing } from "@/data/listings";

type Step = "dates" | "guests" | "review" | "success";

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fade: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

function isoOf(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookingModal({
  listing,
  open,
  onClose,
}: {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<Step>("dates");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState({ adults: 2, children: 0, infants: 0 });
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useLockLenis(open);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep("dates");
      setBookingId(null);
      setCheckIn("");
      setCheckOut("");
      setGuests({ adults: 2, children: 0, infants: 0 });
      setName(session?.user?.name ?? "");
      setEmail(session?.user?.email ?? "");
    }
  }, [open, session]);

  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const nights = diffNights(checkIn, checkOut);
  const subtotal = listing.price * nights;
  const cleaning = 95;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + cleaning + serviceFee;

  const canProceedDates = nights > 0;
  const canProceedGuests = guests.adults > 0;
  const canConfirm = !!name && !!email && nights > 0;

  const confirm = () => {
    const id = generateBookingId();
    const booking: Booking = {
      id,
      listingId: listing.id,
      listingTitle: listing.title,
      location: listing.location,
      country: listing.country,
      image: listing.images[0],
      pricePerNight: listing.price,
      checkIn,
      checkOut,
      nights,
      guests,
      contactName: name,
      contactEmail: email,
      total,
      cleaning,
      serviceFee,
      createdAt: new Date().toISOString(),
    };
    saveBooking(booking);
    setBookingId(id);
    setStep("success");
  };

  const stepNumber = step === "dates" ? 1 : step === "guests" ? 2 : step === "review" ? 3 : 3;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div data-lenis-prevent className="fixed inset-0 z-[80]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md cursor-pointer"
          />
          <div className="relative h-full w-full flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            >
              <div className="absolute -inset-8 -z-10 bg-[#d4b896]/[0.08] blur-3xl rounded-[3rem] pointer-events-none" />
              <div className="relative bg-[#141414]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_30px_80px_-10px_rgba(0,0,0,0.9)] p-7 md:p-8">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/[0.06] flex items-center justify-center transition group z-10"
                >
                  <X size={14} strokeWidth={1.8} className="text-white/70 group-hover:text-white" />
                </button>

                {/* Header — listing summary */}
                <div className="flex items-center gap-3 mb-6 pr-12">
                  <div
                    className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0 border border-white/15"
                    style={{ backgroundImage: `url(${listing.images[0]})` }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#d4b896] font-medium mb-0.5">
                      {step !== "success" ? `Шаг ${stepNumber} из 3` : "Готово"}
                    </p>
                    <p className="text-sm text-white truncate font-medium">
                      {listing.title.split("—")[0].trim()}
                    </p>
                    <p className="text-[11px] text-white/55 truncate">
                      {listing.location}, {listing.country}
                    </p>
                  </div>
                </div>

                {/* Step progress dots */}
                {step !== "success" && (
                  <div className="flex gap-1.5 mb-6">
                    {[1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          n <= stepNumber ? "bg-[#d4b896]" : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {step === "dates" && (
                    <motion.div key="dates" variants={fade} initial="hidden" animate="visible" exit="exit">
                      <h3 className="font-serif text-2xl md:text-3xl text-white mb-5 leading-tight">
                        Выберите даты
                      </h3>
                      <RangeCalendar
                        lang={lang}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        onSelectIn={(d) => {
                          setCheckIn(d);
                          if (checkOut && checkOut <= d) setCheckOut("");
                        }}
                        onSelectOut={(d) => setCheckOut(d)}
                      />
                      <div className="grid grid-cols-2 gap-2 mt-5">
                        <DateChip label="Заезд" value={checkIn} placeholder="Не выбран" />
                        <DateChip label="Выезд" value={checkOut} placeholder="Не выбран" />
                      </div>
                      <FooterButton
                        disabled={!canProceedDates}
                        onClick={() => setStep("guests")}
                        label={nights > 0 ? `Дальше · ${nights} ${pluralNights(nights)}` : "Дальше"}
                      />
                    </motion.div>
                  )}

                  {step === "guests" && (
                    <motion.div key="guests" variants={fade} initial="hidden" animate="visible" exit="exit">
                      <h3 className="font-serif text-2xl md:text-3xl text-white mb-5 leading-tight">
                        Сколько вас будет?
                      </h3>
                      <GuestRow
                        label={t("search.adults")}
                        sub={t("search.adultsSub")}
                        value={guests.adults}
                        onChange={(v) => setGuests({ ...guests, adults: v })}
                        min={1}
                      />
                      <GuestRow
                        label={t("search.children")}
                        sub={t("search.childrenSub")}
                        value={guests.children}
                        onChange={(v) => setGuests({ ...guests, children: v })}
                      />
                      <GuestRow
                        label={t("search.infants")}
                        sub={t("search.infantsSub")}
                        value={guests.infants}
                        onChange={(v) => setGuests({ ...guests, infants: v })}
                      />
                      <div className="flex gap-2 mt-6">
                        <button
                          type="button"
                          onClick={() => setStep("dates")}
                          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white px-3 py-3 transition"
                        >
                          <ChevronLeft size={14} /> Назад
                        </button>
                        <FooterButton
                          disabled={!canProceedGuests}
                          onClick={() => setStep("review")}
                          label="Дальше"
                          inline
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === "review" && (
                    <motion.div key="review" variants={fade} initial="hidden" animate="visible" exit="exit">
                      <h3 className="font-serif text-2xl md:text-3xl text-white mb-5 leading-tight">
                        Подтверждение
                      </h3>

                      <div className="space-y-3 mb-6">
                        <label className="relative block">
                          <UserIcon
                            size={15}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4b896]"
                          />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Ваше имя"
                            className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#d4b896]"
                          />
                        </label>
                        <label className="relative block">
                          <Mail
                            size={15}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4b896]"
                          />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Электронная почта"
                            className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#d4b896]"
                          />
                        </label>
                      </div>

                      <div className="border border-white/10 rounded-xl p-4 mb-6 space-y-2.5 text-sm">
                        <Row label={`${formatDate(checkIn, lang)} — ${formatDate(checkOut, lang)}`} value={`${nights} ${pluralNights(nights)}`} />
                        <Row label="Гости" value={`${guests.adults + guests.children}${guests.infants ? `, ${guests.infants} мл.` : ""}`} />
                        <div className="border-t border-white/10 pt-2.5 space-y-2 text-white/70">
                          <Row label={`$${listing.price} × ${nights} ${pluralNights(nights)}`} value={`$${subtotal.toLocaleString()}`} muted />
                          <Row label="Уборка" value={`$${cleaning}`} muted />
                          <Row label="Сервисный сбор" value={`$${serviceFee}`} muted />
                        </div>
                        <div className="border-t border-white/10 pt-3 flex justify-between text-white font-semibold">
                          <span>Итого</span>
                          <span>${total.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStep("guests")}
                          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white px-3 py-3 transition"
                        >
                          <ChevronLeft size={14} /> Назад
                        </button>
                        <FooterButton
                          disabled={!canConfirm}
                          onClick={confirm}
                          label="Забронировать"
                          inline
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === "success" && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="text-center py-6"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#d4b896]/15 border-2 border-[#d4b896] flex items-center justify-center"
                      >
                        <Check size={32} strokeWidth={2.5} className="text-[#d4b896]" />
                      </motion.div>
                      <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#d4b896] font-medium mb-3">
                        <Sparkles size={12} /> Забронировано
                      </p>
                      <h3 className="font-serif text-3xl md:text-4xl text-white mb-3 leading-tight">
                        Спасибо, {name.split(" ")[0]}.
                      </h3>
                      <p className="text-base text-white/65 max-w-sm mx-auto leading-relaxed mb-6">
                        Подтверждение скоро придёт на <span className="text-white">{email}</span>. Бронь видна в вашем профиле.
                      </p>
                      <div className="inline-flex items-center gap-3 px-5 py-3 border border-[#d4b896]/30 bg-[#d4b896]/[0.05] rounded-full mb-7">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-white/50">Номер брони</span>
                        <span className="font-serif text-lg text-[#d4b896] tabular-nums">{bookingId}</span>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex items-center gap-2 bg-[#d4b896] hover:bg-[#c0a37e] text-[#0a0a0a] text-[13px] uppercase tracking-[0.18em] font-semibold px-7 py-3.5 rounded-full transition"
                        >
                          В профиль <ArrowUpRight size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function pluralNights(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "ночь";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "ночи";
  return "ночей";
}

function formatDate(iso: string, lang: "ru" | "en") {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

function DateChip({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  return (
    <div className="border border-white/15 rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">{label}</p>
      <p className={`text-sm ${value ? "text-white" : "text-white/40"}`}>
        {value ? formatDate(value, "ru") : placeholder}
      </p>
    </div>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-white/65" : "text-white"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FooterButton({
  disabled,
  onClick,
  label,
  inline = false,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  inline?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${
        inline ? "flex-1" : "w-full mt-6"
      } inline-flex items-center justify-center gap-2 bg-[#d4b896] hover:bg-[#c0a37e] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] text-[13px] uppercase tracking-[0.18em] font-semibold py-3.5 rounded-full transition`}
    >
      {label}
      <ArrowUpRight size={14} strokeWidth={2.5} />
    </button>
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
          className="w-8 h-8 rounded-full border border-white/25 flex items-center justify-center disabled:opacity-25 enabled:hover:border-white transition"
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

function RangeCalendar({
  lang,
  checkIn,
  checkOut,
  onSelectIn,
  onSelectOut,
}: {
  lang: "ru" | "en";
  checkIn: string;
  checkOut: string;
  onSelectIn: (iso: string) => void;
  onSelectOut: (iso: string) => void;
}) {
  const [view, setView] = useState(() => {
    const d = checkIn ? new Date(checkIn) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const months = lang === "ru" ? MONTHS_RU : MONTHS_EN;
  const weekdays = lang === "ru" ? WEEKDAYS_RU : WEEKDAYS_EN;
  const firstWeekday = ((view.getDay() + 6) % 7) + 1;
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const today = isoOf(new Date());

  const cells: (number | null)[] = [];
  for (let i = 1; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleClick = (iso: string) => {
    if (!checkIn || (checkIn && checkOut)) {
      onSelectIn(iso);
      onSelectOut("");
    } else {
      if (iso > checkIn) onSelectOut(iso);
      else onSelectIn(iso);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 transition"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="text-sm text-white capitalize">
          {months[view.getMonth()]} {view.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {weekdays.map((w) => (
          <div key={w} className="text-center text-[10px] uppercase text-white/40 py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="h-9" />;
          const date = new Date(view.getFullYear(), view.getMonth(), d);
          const iso = isoOf(date);
          const isPast = iso < today;
          const isIn = iso === checkIn;
          const isOut = iso === checkOut;
          const inRange =
            checkIn && checkOut && iso > checkIn && iso < checkOut;
          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => handleClick(iso)}
              className={`h-9 rounded-lg text-[13px] tabular-nums transition ${
                isIn || isOut
                  ? "bg-[#d4b896] text-[#0a0a0a] font-semibold"
                  : inRange
                    ? "bg-[#d4b896]/15 text-white"
                    : isPast
                      ? "text-white/15 cursor-not-allowed"
                      : "text-white/85 hover:bg-white/[0.07]"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
