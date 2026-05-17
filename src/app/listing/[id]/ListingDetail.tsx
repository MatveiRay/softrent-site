"use client";

import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/data/listings";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Star, MapPin, ChevronLeft } from "lucide-react";
import { useT } from "@/components/I18nProvider";

export default function ListingDetail({ listing }: { listing: Listing }) {
  const t = useT();
  const nights = 6;
  const subtotal = listing.price * nights;
  const cleaning = 95;
  const service = Math.round(subtotal * 0.12);
  const total = subtotal + cleaning + service;

  return (
    <>
      <Nav />
      <main className="pt-28 pb-32">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition mb-8"
          >
            <ChevronLeft size={14} /> {t("detail.back")}
          </Link>

          <div className="mb-8">
            <p className="flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-[#d4b896] mb-5 font-medium">
              <span className="block w-8 h-px bg-[#d4b896]" />
              {listing.category === "tropical"
                ? t("detail.tropical")
                : t("detail.mountain")}
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.02em] max-w-5xl">
              {listing.title.split("—")[0]}
              <span className="italic text-white/75">
                {listing.title.includes("—")
                  ? "— " + listing.title.split("—")[1].trim()
                  : ""}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70 mt-6">
              <span className="flex items-center gap-1.5">
                <Star size={13} className="fill-current" />
                {listing.rating} · {listing.reviews} {t("detail.reviews")}
              </span>
              <span className="text-white/30">·</span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {listing.location}, {listing.country}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[58vh] mb-16 rounded-3xl overflow-hidden">
            <div className="col-span-4 sm:col-span-2 row-span-2 relative">
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                preload
              />
            </div>
            {listing.images.slice(1, 5).map((img, i) => (
              <div
                key={i}
                className="hidden sm:block relative col-span-1 row-span-1"
              >
                <Image
                  src={img}
                  alt={`${listing.title} ${i + 2}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-16 lg:gap-20">
            <div className="lg:col-span-2 space-y-14">
              <div className="border-b border-white/10 pb-10">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45 mb-3">
                  {t("detail.hostedBy")} {listing.host} · {t("detail.since")}{" "}
                  {listing.hostSince}
                </p>
                <h2 className="font-serif text-3xl md:text-4xl">
                  {listing.bedrooms} {t("detail.bedrooms")} · {listing.beds}{" "}
                  {t("detail.beds")} · {listing.baths} {t("detail.baths")} ·{" "}
                  {t("detail.upTo")} {listing.guests} {t("detail.guestsLow")}
                </h2>
              </div>

              <div>
                <p className="text-base md:text-lg text-white/75 leading-relaxed max-w-2xl whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              <div className="border-t border-white/10 pt-12">
                <h3 className="font-serif text-3xl md:text-4xl mb-8">
                  {t("detail.offers")}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-white/75">
                  {listing.amenities.map((a) => (
                    <li
                      key={a}
                      className="flex items-baseline gap-3 text-base"
                    >
                      <span className="text-[#d4b896]">—</span> {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/10 pt-12">
                <h3 className="font-serif text-3xl md:text-4xl mb-3">
                  {t("detail.where")}
                </h3>
                <p className="text-white/65 mb-6">
                  {listing.location}, {listing.country}
                </p>
                <div className="aspect-[16/8] rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center">
                  <p className="text-white/30 text-sm uppercase tracking-[0.3em]">
                    {t("detail.map")} · {listing.location}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28 border border-white/15 rounded-2xl p-7 bg-white/[0.03] backdrop-blur-xl">
                <p className="text-3xl font-serif mb-1">
                  <span className="font-semibold">${listing.price}</span>{" "}
                  <span className="text-white/55 text-base font-sans">
                    / {t("detail.night")}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2 mt-6">
                  <div className="border border-white/15 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">
                      {t("detail.checkIn")}
                    </p>
                    <p className="text-sm">
                      {listing.dateRange.split(" — ")[0]}
                    </p>
                  </div>
                  <div className="border border-white/15 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">
                      {t("detail.checkOut")}
                    </p>
                    <p className="text-sm">
                      {listing.dateRange.split(" — ")[1]}
                    </p>
                  </div>
                </div>
                <div className="border border-white/15 rounded-lg p-3 mt-2 mb-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">
                    {t("detail.guests")}
                  </p>
                  <p className="text-sm">{t("detail.adults2")}</p>
                </div>
                <button className="w-full bg-[#d4b896] hover:bg-[#c0a37e] text-[#0a0a0a] py-4 rounded-lg font-semibold tracking-tight transition">
                  {t("detail.reserve")}
                </button>
                <p className="text-xs text-center text-white/45 mt-4">
                  {t("detail.noCharge")}
                </p>
                <div className="border-t border-white/10 mt-6 pt-5 space-y-2.5 text-sm text-white/70">
                  <div className="flex justify-between">
                    <span className="underline-offset-4 underline decoration-white/20">
                      ${listing.price} × {nights} {t("detail.nights")}
                    </span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline-offset-4 underline decoration-white/20">
                      {t("detail.cleaning")}
                    </span>
                    <span>${cleaning}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline-offset-4 underline decoration-white/20">
                      {t("detail.serviceFee")}
                    </span>
                    <span>${service}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-white pt-3 border-t border-white/10">
                    <span>{t("detail.total")}</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
