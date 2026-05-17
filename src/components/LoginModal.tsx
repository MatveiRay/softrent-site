"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X, Mail, Lock, ArrowUpRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { useT } from "./I18nProvider";
import { useLockLenis } from "./LenisProvider";

export default function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useLockLenis(open);

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

  return createPortal(
    <AnimatePresence>
      {open && (
        <div data-lenis-prevent className="fixed inset-0 z-[70]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a0a]/75 backdrop-blur-md cursor-pointer"
          />
          <div className="relative h-full w-full flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto relative w-full max-w-[440px]"
            >
              <div className="absolute -inset-8 -z-10 bg-[#d4b896]/[0.08] blur-3xl rounded-[3rem] pointer-events-none" />
              <div className="relative bg-[#141414]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_30px_80px_-10px_rgba(0,0,0,0.9)] p-8">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("search.close")}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/[0.06] flex items-center justify-center transition group"
                >
                  <X
                    size={14}
                    strokeWidth={1.8}
                    className="text-white/70 group-hover:text-white transition"
                  />
                </button>

                <p className="font-script text-[3rem] leading-none mb-3" style={{ fontFamily: "var(--font-script)" }}>
                  SoftRent
                </p>
                <p className="font-serif text-2xl text-white leading-tight mb-1">
                  {mode === "signin" ? t("login.title") : t("login.signupTitle")}
                </p>
                <p className="text-sm text-white/55 mb-7">
                  {mode === "signin" ? t("login.subtitle") : t("login.signupSubtitle")}
                </p>

                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError(null);
                    setSubmitting(true);
                    const form = new FormData(e.currentTarget);
                    const result = await signIn("credentials", {
                      email: form.get("email"),
                      password: form.get("password"),
                      redirect: false,
                    });
                    setSubmitting(false);
                    if (result?.ok) {
                      onClose();
                    } else {
                      setError(
                        t("login.error") ||
                          "Не удалось войти. Проверьте email и пароль."
                      );
                    }
                  }}
                >
                  <label className="relative block">
                    <Mail
                      size={15}
                      strokeWidth={1.7}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4b896]"
                    />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder={t("login.emailPlaceholder")}
                      className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#d4b896] transition"
                    />
                  </label>
                  <label className="relative block">
                    <Lock
                      size={15}
                      strokeWidth={1.7}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4b896]"
                    />
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={4}
                      placeholder={t("login.passwordPlaceholder")}
                      className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#d4b896] transition"
                    />
                  </label>
                  {error && (
                    <p className="text-[12px] text-red-300/85 px-1">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group w-full inline-flex items-center justify-center gap-2 bg-[#d4b896] hover:bg-[#c0a37e] disabled:opacity-60 disabled:cursor-not-allowed text-[#0a0a0a] text-[13px] font-semibold uppercase tracking-[0.18em] py-3.5 rounded-xl transition mt-2"
                  >
                    {submitting ? "..." : t("login.continue")}
                    <ArrowUpRight
                      size={14}
                      strokeWidth={2.5}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <span className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                    {t("login.or")}
                  </span>
                  <span className="flex-1 h-px bg-white/10" />
                </div>

                <div className="space-y-2">
                  <SocialButton
                    label={t("login.continueGoogle")}
                    iconPath="M22.5 12.25c0-.85-.07-1.66-.2-2.45H12.18v4.65h5.78c-.25 1.35-1 2.5-2.13 3.27v2.7h3.46c2.03-1.87 3.21-4.62 3.21-8.17z M12.18 23c2.88 0 5.3-.95 7.06-2.58l-3.46-2.7c-.96.65-2.18 1.03-3.6 1.03-2.77 0-5.12-1.87-5.96-4.39H2.66v2.78A10.65 10.65 0 0 0 12.18 23z M6.22 14.36c-.21-.65-.34-1.35-.34-2.06s.12-1.41.34-2.06V7.46H2.66a10.65 10.65 0 0 0 0 9.68l3.56-2.78z M12.18 5.96c1.56 0 2.96.54 4.07 1.59l3.05-3.05A10.66 10.66 0 0 0 12.18 1 10.66 10.66 0 0 0 2.66 7.46l3.56 2.78c.84-2.52 3.19-4.28 5.96-4.28z"
                  />
                  <SocialButton
                    label={t("login.continueApple")}
                    iconPath="M16.365 1.43c0 1.14-.41 2.09-1.21 2.96-.97 1.05-2.14 1.66-3.42 1.55-.05-.13-.07-.27-.07-.41 0-1.06.46-2.16 1.27-2.97.4-.4.92-.74 1.55-1.01.62-.27 1.21-.42 1.77-.43.07.1.11.21.11.31zM21 17.74c-.39.93-.86 1.79-1.42 2.59-.74 1.07-1.34 1.81-1.79 2.22-.71.65-1.46.99-2.27 1.01-.58 0-1.28-.16-2.09-.49-.82-.33-1.57-.49-2.27-.49-.72 0-1.49.16-2.31.49-.82.34-1.49.51-1.99.53-.78.04-1.55-.31-2.31-1.04-.49-.45-1.13-1.21-1.92-2.29-.86-1.16-1.56-2.5-2.11-4.04-.59-1.66-.88-3.27-.88-4.83 0-1.79.39-3.33 1.16-4.62a6.81 6.81 0 0 1 2.43-2.46 6.5 6.5 0 0 1 3.27-.93c.6 0 1.4.18 2.41.55 1 .37 1.65.55 1.93.55.21 0 .92-.21 2.13-.65 1.14-.4 2.1-.57 2.89-.5 2.13.17 3.74 1.01 4.81 2.53-1.91 1.16-2.86 2.78-2.84 4.86 0 1.62.59 2.97 1.76 4.04.53.5 1.13.89 1.79 1.16-.14.41-.29.81-.45 1.19z"
                  />
                </div>

                <p className="text-[11px] text-white/45 mt-6 text-center leading-relaxed">
                  {t("login.terms")}
                </p>

                <div className="mt-5 pt-5 border-t border-white/10 text-center">
                  <span className="text-sm text-white/55">
                    {mode === "signin" ? t("login.noAccount") : t("login.hasAccount")}{" "}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMode(mode === "signin" ? "signup" : "signin")
                    }
                    className="text-sm text-[#d4b896] hover:text-[#e9d0ad] underline-offset-4 underline decoration-[#d4b896]/40 hover:decoration-[#d4b896] transition"
                  >
                    {mode === "signin" ? t("login.signup") : t("login.signin")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function SocialButton({ label, iconPath }: { label: string; iconPath: string }) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 rounded-xl py-3.5 text-sm text-white transition"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-white/85"
      >
        <path d={iconPath} />
      </svg>
      {label}
    </button>
  );
}
