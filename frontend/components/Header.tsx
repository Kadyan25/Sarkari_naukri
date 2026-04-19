"use client";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";

export default function Header() {
  const { lang, theme, toggleLang, toggleTheme } = useApp();

  return (
    <header
      style={{
        background: "var(--ink-900)",
        borderBottom: "2px solid var(--brand-blue)",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-5xl mx-auto px-3 py-3 flex items-center justify-between gap-2">
        {/* Masthead */}
        <Link href="/" className="flex flex-col leading-tight min-w-0">
          <span
            style={{ fontFamily: "var(--font-mono)", color: "#ffffff" }}
            className="font-semibold text-sm sm:text-base tracking-tight"
          >
            सरकारी नौकरी · Sarkari Naukri
          </span>
          <span
            style={{ fontFamily: "var(--font-mono)", color: "var(--ink-400)", fontSize: "0.65rem" }}
            className="tracking-widest uppercase"
          >
            Govt Job Alerts · India
          </span>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleLang}
            aria-label="Toggle language"
            style={{
              fontFamily: "var(--font-mono)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              borderRadius: "var(--r-md)",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "4px 10px",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            className="hover:bg-white/20 transition-colors"
          >
            {lang === "hi" ? "EN" : "हिं"}
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              borderRadius: "var(--r-md)",
              border: "1px solid rgba(255,255,255,0.15)",
              width: 32,
              height: 32,
            }}
            className="flex items-center justify-center text-sm hover:bg-white/20 transition-colors"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <a
            href="https://t.me/your_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "var(--brand-blue)",
              color: "#fff",
              borderRadius: "var(--r-md)",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "6px 12px",
            }}
            className="hidden sm:inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            🔔 {lang === "hi" ? "अलर्ट पाएं" : "Get Alerts"}
          </a>
        </div>
      </div>
    </header>
  );
}
