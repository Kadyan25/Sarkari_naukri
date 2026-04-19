"use client";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/lib/i18n";

export default function Header() {
  const { lang, theme, toggleLang, toggleTheme } = useApp();
  const t = useT(lang);

  return (
    <header className="bg-brand shadow-md sticky top-0 z-50 dark:bg-gray-900 dark:border-b dark:border-gray-700">
      <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-tight min-h-0 min-w-0">
          <span className="text-white font-bold text-base sm:text-lg truncate">
            {t("siteNameEn")}
          </span>
          <span className="text-blue-200 text-xs truncate dark:text-gray-400">
            {t("tagline")}
          </span>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            aria-label="Toggle language"
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white
                       px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors
                       dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
          >
            {lang === "hi" ? "EN" : "हिं"}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center bg-white/20 hover:bg-white/30 text-white
                       w-8 h-8 rounded-lg text-sm transition-colors
                       dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Telegram CTA */}
          <a
            href="https://t.me/your_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 bg-white text-brand px-3 py-1.5
                       rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors
                       dark:bg-gray-100 dark:text-brand"
          >
            🔔 {t("alertBtn")}
          </a>
        </div>
      </div>
    </header>
  );
}
