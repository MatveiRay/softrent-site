"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import HeroSearch from "./HeroSearch";
import { useT } from "./I18nProvider";

// Deterministic pseudo-random for stable SSR — rounded for serialization parity
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const v = x - Math.floor(x);
  return Math.round(v * 1000) / 1000;
}

function ConvergeWord({
  text,
  delay = 0,
  italic = false,
  baseSeed = 0,
}: {
  text: string;
  delay?: number;
  italic?: boolean;
  baseSeed?: number;
}) {
  const chars = Array.from(text);
  return (
    <span className={`inline-block ${italic ? "italic text-white/85" : ""}`}>
      {chars.map((c, i) => {
        const s = baseSeed + i;
        const dx = Math.round((rand(s) - 0.5) * 80);
        const dy = Math.round((rand(s + 100) - 0.5) * 60 + 40);
        const dr = Math.round((rand(s + 200) - 0.5) * 12 * 100) / 100;
        return (
          <motion.span
            key={i}
            initial={{
              opacity: 0,
              x: dx,
              y: dy,
              rotate: dr,
              filter: "blur(14px)",
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              rotate: 0,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 1.2,
              delay: delay + i * 0.035,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block"
          >
            {c === " " ? " " : c}
          </motion.span>
        );
      })}
    </span>
  );
}

export default function Hero() {
  const t = useT();
  const v1Ref = useRef<HTMLVideoElement>(null);
  const v2Ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const v1 = v1Ref.current;
    const v2 = v2Ref.current;
    if (!v1 || !v2) return;

    const FADE = 0.9;
    let switching = false;

    const watch = (
      current: HTMLVideoElement,
      other: HTMLVideoElement,
      otherIdx: number
    ) => () => {
      if (switching) return;
      if (!current.duration || isNaN(current.duration)) return;
      const remaining = current.duration - current.currentTime;
      if (remaining < FADE) {
        switching = true;
        other.currentTime = 0;
        const p = other.play();
        if (p) p.catch(() => {});
        setActive(otherIdx);
        setTimeout(() => {
          current.pause();
          current.currentTime = 0;
          switching = false;
        }, FADE * 1000);
      }
    };

    const on1 = watch(v1, v2, 1);
    const on2 = watch(v2, v1, 0);

    v1.addEventListener("timeupdate", on1);
    v2.addEventListener("timeupdate", on2);

    const start = v1.play();
    if (start) start.catch(() => {});

    return () => {
      v1.removeEventListener("timeupdate", on1);
      v2.removeEventListener("timeupdate", on2);
    };
  }, []);

  return (
    <section className="relative h-screen w-full z-10">
      {/* Клиппер для видео и оверлеев — чтобы поисковая панель ниже могла свободно вылезать за границы hero */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={v1Ref}
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[900ms] ease-linear ${
            active === 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <video
          ref={v2Ref}
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[900ms] ease-linear ${
            active === 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Очень мягкие оверлеи — видео хорошо видно. Центрирован под композицию. */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(70% 65% at 50% 55%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, transparent 80%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center gap-8 max-w-[1440px] mx-auto px-6 lg:px-10 text-center pt-24">
        <h1 key={t("hero.line1")} className="font-serif text-[3rem] sm:text-7xl md:text-[8rem] leading-[0.92] tracking-[-0.02em] max-w-5xl">
          <span className="block overflow-visible">
            <ConvergeWord text={t("hero.line1")} delay={0.3} baseSeed={0} />
          </span>
          <span className="block overflow-visible">
            <ConvergeWord
              text={t("hero.line2")}
              delay={0.55}
              italic
              baseSeed={50}
            />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-base md:text-lg text-white/80 max-w-xl leading-relaxed"
        >
          {t("hero.sub")}
        </motion.p>

        <HeroSearch />
      </div>
    </section>
  );
}
