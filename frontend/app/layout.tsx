import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || "";

// ── next/font — zero render-blocking, auto-optimised, self-hosted ──────────
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
  preload: true,
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Haryana Sarkari Naukri 2025 | हरियाणा सरकारी नौकरी",
    template: "%s | Haryana Sarkari Naukri",
  },
  description:
    "हरियाणा की सभी सरकारी नौकरियां एक जगह। HSSC, HPSC, Police, Banking, Railway भर्ती 2025. Telegram अलर्ट पाएं।",
  keywords: [
    "haryana sarkari naukri",
    "hssc bharti 2025",
    "haryana police recruitment",
    "hssc admit card",
    "hssc result 2025",
    "hpsc jobs",
    "haryana patwari bharti",
    "सरकारी नौकरी हरियाणा",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.in"),
  openGraph: {
    siteName: "Haryana Sarkari Naukri",
    locale: "hi_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${notoSans.variable} ${notoDevanagari.variable}`}>
      <head>
        {/* DNS prefetch for API */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} />
      </head>
      {/* Google AdSense — loads after page is interactive (afterInteractive) */}
      {ADSENSE_ID && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {/* Header */}
        <header className="bg-brand shadow-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-3 py-3 flex items-center justify-between">
            <Link href="/" className="flex flex-col leading-tight min-h-0">
              <span className="text-white font-bold text-base sm:text-lg">
                Haryana Naukri
              </span>
              <span className="hindi text-blue-200 text-xs">हरियाणा सरकारी नौकरी</span>
            </Link>
            <a
              href="https://t.me/your_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white text-brand px-3 py-1.5 rounded-lg
                         text-xs font-semibold hover:bg-blue-50 transition-colors"
            >
              🔔 <span className="hindi">अलर्ट पाएं</span>
            </a>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-5xl mx-auto px-3 py-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-12 bg-white border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-3 py-6 text-center text-xs text-gray-500">
            <p className="hindi mb-1">
              हरियाणा सरकारी नौकरी — HSSC | HPSC | Police | Banking | Railway
            </p>
            <p>© 2025 HaryanaNaukri.in — All govt job data sourced from official websites.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
