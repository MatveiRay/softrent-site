"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DICT, type DictKey, type Lang } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
};

const I18nCtx = createContext<Ctx>({
  lang: "ru",
  setLang: () => {},
  t: (k) => DICT.ru[k] ?? k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    const saved = window.localStorage.getItem("softrent-lang");
    if (saved === "ru" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("softrent-lang", l);
    } catch {}
  };

  const t = (key: DictKey) => DICT[lang][key] ?? DICT.ru[key] ?? key;

  return (
    <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>
  );
}

export function useI18n() {
  return useContext(I18nCtx);
}

export function useT() {
  return useContext(I18nCtx).t;
}
