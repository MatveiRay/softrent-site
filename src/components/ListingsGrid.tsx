"use client";

import { useState } from "react";
import type { Listing } from "@/data/listings";
import ListingCard from "./ListingCard";
import CategoryTabs from "./CategoryTabs";
import { motion } from "framer-motion";
import { useT } from "./I18nProvider";

export default function ListingsGrid({
  listings,
}: {
  listings: Listing[];
}) {
  const t = useT();
  const [cat, setCat] = useState("all");
  const filtered =
    cat === "all" ? listings : listings.filter((l) => l.category === cat);

  return (
    <section
      id="collection"
      className="relative bg-[#0a0a0a] py-32 lg:py-40 scroll-mt-24"
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 max-w-3xl"
        >
          <p className="flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-[#d4b896] mb-6 font-medium">
            <span className="block w-8 h-px bg-[#d4b896]" />
            {t("collection.eyebrow")}
          </p>
          <h2 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.02em]">
            {t("collection.title1")}{" "}
            <span className="italic text-white/80">{t("collection.title2")}</span>
          </h2>
        </motion.div>

        <CategoryTabs active={cat} onChange={setCat} />

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12"
        >
          {filtered.map((l, i) => (
            <ListingCard key={l.id} listing={l} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
