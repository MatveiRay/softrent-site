"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useT } from "./I18nProvider";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border border-[#d4b896]/30 border-t-[#d4b896] animate-spin" />
    </div>
  ),
});

export default function ScrollSection() {
  const t = useT();

  // Globe perf: mount once seen, pause frameloop when off-screen.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.05, rootMargin: "100px" }
    );
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="scroll-stories"
      className="relative bg-[#0a0a0a] py-32 lg:py-40 overflow-hidden border-b border-white/5 scroll-mt-24"
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <p className="flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-[#d4b896] font-medium">
              <span className="block w-8 h-px bg-[#d4b896]" />
              {t("scroll.eyebrow")}
            </p>
            <h3 className="font-serif text-4xl md:text-6xl lg:text-[5rem] leading-[1.02] tracking-tight max-w-xl">
              {t("scroll.s1.title")}
            </h3>
            <p className="text-base md:text-lg text-white/70 max-w-md leading-relaxed">
              {t("scroll.s1.body")}
            </p>
            <div className="pt-5 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium mb-3">
                Двенадцать координат
              </p>
              <p className="text-[13px] text-[#d4b896]/85 leading-relaxed max-w-md">
                {t("scroll.cities")}
              </p>
            </div>
          </motion.div>

          {/* Right — interactive 3D Earth */}
          <div
            ref={wrapperRef}
            className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden bg-[#080808] border border-white/8"
          >
            {seen ? (
              <Globe active={visible} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-[#d4b896]/30 border-t-[#d4b896] animate-spin" />
              </div>
            )}
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/55 pointer-events-none">
              <span>Земля · 12 точек</span>
              <span className="text-[#d4b896]">Покрутите ⤿</span>
            </div>
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
