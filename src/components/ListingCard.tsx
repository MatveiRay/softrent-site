"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Listing } from "@/data/listings";
import { useT } from "./I18nProvider";

export default function ListingCard({
  listing,
  index,
}: {
  listing: Listing;
  index: number;
}) {
  const t = useT();
  const [imgIdx, setImgIdx] = useState(0);
  const [fav, setFav] = useState(false);

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.8,
        delay: (index % 4) * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/listing/${listing.id}`}
        className="block group"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/5">
          {listing.images.map((src, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === imgIdx ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={src}
                alt={listing.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
              />
            </div>
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

          <button
            aria-label={t("card.save")}
            onClick={stop(() => setFav(!fav))}
            className="absolute top-4 right-4 z-10 p-1.5 transition hover:scale-110"
          >
            <Heart
              size={22}
              strokeWidth={1.8}
              className={
                fav
                  ? "fill-[#d4b896] stroke-[#d4b896]"
                  : "fill-black/30 stroke-white"
              }
            />
          </button>

          {listing.images.length > 1 && (
            <>
              <button
                aria-label="←"
                onClick={stop(() =>
                  setImgIdx(
                    (imgIdx - 1 + listing.images.length) % listing.images.length
                  )
                )}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white text-[#0a0a0a] rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:scale-110 transition"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
              </button>
              <button
                aria-label="→"
                onClick={stop(() =>
                  setImgIdx((imgIdx + 1) % listing.images.length)
                )}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white text-[#0a0a0a] rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:scale-110 transition"
              >
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {listing.images.map((_, i) => (
              <button
                key={i}
                aria-label={`${i + 1}`}
                onClick={stop(() => setImgIdx(i))}
                className={`rounded-full transition-all ${
                  i === imgIdx
                    ? "w-1.5 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 px-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium tracking-tight">{listing.location}</h3>
            <div className="flex items-center gap-1 text-sm shrink-0">
              <Star size={11} className="fill-current" />
              {listing.rating}
            </div>
          </div>
          <p className="text-sm text-white/55 truncate">{listing.title.split("—")[1]?.trim() ?? listing.title}</p>
          <p className="text-sm text-white/45">{listing.dateRange}</p>
          <p className="text-sm pt-1.5">
            <span className="font-semibold text-white">${listing.price}</span>{" "}
            <span className="text-white/55">/ {t("card.night")}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
