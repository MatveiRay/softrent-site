"use client";

import Link from "next/link";
import { useT } from "./I18nProvider";
import type { DictKey } from "@/lib/i18n";

const SECTIONS: { titleKey: DictKey; linkKeys: DictKey[] }[] = [
  {
    titleKey: "footer.col1",
    linkKeys: ["footer.about", "footer.edition", "footer.press", "footer.careers"],
  },
  {
    titleKey: "footer.col2",
    linkKeys: ["footer.tropical", "footer.mountain", "footer.long", "footer.concierge"],
  },
  {
    titleKey: "footer.col3",
    linkKeys: ["footer.list", "footer.standards", "footer.photo", "footer.rates"],
  },
  {
    titleKey: "footer.col4",
    linkKeys: ["footer.contact", "footer.cancel", "footer.trust", "footer.access"],
  },
];

export default function Footer() {
  const t = useT();
  return (
    <footer
      id="contact"
      className="bg-[#0a0a0a] border-t border-white/10 pt-24 pb-10 scroll-mt-24"
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-6 gap-12 mb-20">
          <div className="md:col-span-2">
            <p
              className="font-script text-[3.4rem] mb-6 leading-none"
              style={{ fontFamily: "var(--font-script)" }}
            >
              SoftRent
            </p>
            <p className="text-white/55 max-w-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>
          {SECTIONS.map((s) => (
            <div key={s.titleKey}>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-5">
                {t(s.titleKey)}
              </p>
              <ul className="space-y-3">
                {s.linkKeys.map((k) => (
                  <li key={k}>
                    <Link
                      href="#"
                      className="text-sm text-white/75 hover:text-white transition"
                    >
                      {t(k)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="font-serif text-[14vw] leading-none tracking-[-0.04em] text-white/[0.06] select-none mb-12 -mx-2 truncate"
        >
          breathe&nbsp;easier
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-white/40">
          <p>{t("footer.copy")}</p>
          <p>{t("footer.crafted")}</p>
        </div>
      </div>
    </footer>
  );
}
