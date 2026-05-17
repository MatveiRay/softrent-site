"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useT } from "./I18nProvider";
import type { DictKey } from "@/lib/i18n";

const LINE_KEYS: DictKey[] = [
  "manifesto.l1",
  "manifesto.l2",
  "manifesto.l3",
  "manifesto.l4",
  "manifesto.l5",
];

export default function Manifesto() {
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const op = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      id="manifesto"
      ref={ref}
      className="relative bg-[#0a0a0a] py-40 overflow-hidden border-y border-white/5 scroll-mt-24"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.p
          style={{ opacity: op }}
          className="flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-[#d4b896] mb-14 font-medium"
        >
          <span className="block w-8 h-px bg-[#d4b896]" />
          {t("manifesto.eyebrow")}
        </motion.p>
        <div className="space-y-3">
          {LINE_KEYS.map((key, i) => {
            const isFinal = i === LINE_KEYS.length - 1;
            return (
              <motion.p
                key={key + t(key)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.14,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`font-serif leading-[1.1] tracking-[-0.01em] max-w-5xl ${
                  isFinal
                    ? "italic text-white/75 text-2xl md:text-4xl lg:text-5xl pt-6"
                    : "text-3xl md:text-5xl lg:text-6xl"
                }`}
              >
                {t(key)}
              </motion.p>
            );
          })}
        </div>
      </div>
    </section>
  );
}
