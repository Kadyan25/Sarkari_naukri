import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans, Noto_Sans_Devanagari, IBM_Plex_Mono } from "next/font/google";
import { AppProvider } from "@/contexts/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || "";

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

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Sarkari Naukri 2025 | सरकारी नौकरी",
    template: "%s | Sarkari Naukri",
  },
  description:
    "सभी सरकारी नौकरियां एक जगह। HSSC, HPSC, Police, Banking, Railway भर्ती 2025. Telegram अलर्ट पाएं।",
  keywords: [
    "sarkari naukri 2025",
    "government jobs india",
    "hssc bharti 2025",
    "haryana police recruitment",
    "hssc admit card",
    "hssc result 2025",
    "hpsc jobs",
    "सरकारी नौकरी 2025",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sarkarinaukri.in"),
  openGraph: {
    siteName: "Sarkari Naukri",
    locale: "hi_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${notoSans.variable} ${notoDevanagari.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} />
        {/* Prevent dark mode flash — sets class before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sn_theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      {ADSENSE_ID && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
      <body style={{ backgroundColor: "var(--bg-page)", color: "var(--ink-900)" }} className="min-h-screen transition-colors duration-200">
        <AppProvider>
          <Header />
          <main className="max-w-5xl mx-auto px-3 py-4">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
