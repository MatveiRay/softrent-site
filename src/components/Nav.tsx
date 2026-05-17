"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, Globe, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, useT } from "./I18nProvider";
import LoginModal from "./LoginModal";
import type { Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

function NavLink({
  index,
  label,
  href,
  hovered,
  onHover,
  onClick,
}: {
  index: number;
  label: string;
  href: string;
  hovered: boolean;
  onHover: () => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    setOffset({ x: dx * 0.18, y: dy * 0.18 });
  };
  const onLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <Link
      ref={ref}
      href={href}
      onMouseEnter={onHover}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="relative inline-flex items-baseline gap-2 py-1 transition-transform duration-300 ease-out"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <span className="text-[10px] tabular-nums text-[#d4b896] tracking-widest">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="text-[13px] uppercase tracking-[0.18em] font-medium">
        {label}
      </span>
      <span
        className={`absolute left-0 right-0 -bottom-1 h-px bg-[#d4b896] origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hovered ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </Link>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={t("nav.langChange")}
        className="relative w-10 h-10 rounded-full border border-white/15 hover:border-[#d4b896]/60 hover:bg-white/[0.04] flex items-center justify-center transition group"
      >
        <Globe
          size={16}
          strokeWidth={1.7}
          className="text-white/85 group-hover:text-[#d4b896] transition"
        />
        <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold tracking-wider bg-[#d4b896] text-[#0a0a0a] rounded-full px-1.5 py-0.5 leading-none uppercase">
          {lang}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-3 w-56 bg-[#141414]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] p-2 z-50"
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/45 px-3 py-2 font-medium">
              {t("nav.lang")}
            </p>
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.07] transition text-left"
              >
                <span className="text-sm text-white">{l.label}</span>
                {lang === l.code && (
                  <Check size={14} className="text-[#d4b896]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Nav() {
  const t = useT();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const links = [
    { key: "nav.locations" as const, href: "#collection" },
    { key: "nav.stories" as const, href: "#scroll-stories" },
    { key: "nav.concept" as const, href: "#manifesto" },
    { key: "nav.contact" as const, href: "#contact" },
  ];

  const onAnchorClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="shrink-0 leading-none flex items-baseline"
            aria-label="SoftRent"
          >
            <span
              className="font-script text-[2.85rem] md:text-[3.4rem] leading-none text-white tracking-tight"
              style={{ fontFamily: "var(--font-script)" }}
            >
              SoftRent
            </span>
          </Link>

          <nav
            className="hidden lg:flex items-center gap-10"
            onMouseLeave={() => setHoverIdx(null)}
          >
            {links.map((link, i) => (
              <div
                key={link.key}
                onMouseEnter={() => setHoverIdx(i)}
                style={{
                  color:
                    hoverIdx === null
                      ? "rgba(255,255,255,0.85)"
                      : hoverIdx === i
                      ? "#fff"
                      : "rgba(255,255,255,0.4)",
                  transition: "color 300ms ease",
                }}
              >
                <NavLink
                  index={i}
                  label={t(link.key)}
                  href={link.href}
                  hovered={hoverIdx === i}
                  onHover={() => setHoverIdx(i)}
                  onClick={(e) => onAnchorClick(e, link.href)}
                />
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setLoginOpen(true)}
              className="hidden md:inline-flex items-center text-[12px] uppercase tracking-[0.18em] font-medium text-white/85 hover:text-white relative group transition px-1 py-1"
            >
              {t("nav.login")}
              <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-[#d4b896] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </button>
            <LangSwitcher />
            <button
              aria-label={t("nav.menu")}
              className="lg:hidden p-2 hover:bg-white/10 rounded-full transition"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
