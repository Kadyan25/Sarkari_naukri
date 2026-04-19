"use client";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/lib/i18n";

export default function Footer() {
  const { lang } = useApp();
  const t = useT(lang);

  return (
    <footer className="mt-12 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-5xl mx-auto px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <p className="mb-1">{t("footerCats")}</p>
        <p className="mb-1">{t("footerNote")}</p>
        <p>{t("footerCopy")} — {t("footerNote")}</p>
      </div>
    </footer>
  );
}
