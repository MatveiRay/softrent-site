"use client";

import { Palmtree, Mountain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "./I18nProvider";
import type { DictKey } from "@/lib/i18n";

const CATS: { id: string; key: DictKey; Icon: typeof Sparkles }[] = [
  { id: "all", key: "cat.all", Icon: Sparkles },
  { id: "tropical", key: "cat.tropical", Icon: Palmtree },
  { id: "mountain", key: "cat.mountain", Icon: Mountain },
];

export default function CategoryTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-16">
      {CATS.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className="relative flex items-center gap-2 px-6 py-3 rounded-full text-sm transition"
          >
            {isActive && (
              <motion.span
                layoutId="catpill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 bg-[#f5f3ee] rounded-full"
              />
            )}
            <span
              className={`relative flex items-center gap-2 transition ${
                isActive ? "text-[#0a0a0a]" : "text-white/70 hover:text-white"
              }`}
            >
              <cat.Icon size={15} strokeWidth={1.6} />
              {t(cat.key)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
