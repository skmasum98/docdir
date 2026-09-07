import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f172a" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Doctor Directory Bangladesh - Find Verified Doctors & Hospitals",
    template: "%s | Doctor Directory Bangladesh",
  },
  description: "Find verified specialist doctors, hospitals, and diagnostic centers across Bangladesh. Compare diagnostic test prices, check patient prep guidelines, and book appointments with confidence.",
  keywords: [
    "doctor directory Bangladesh",
    "find doctor Bangladesh",
    "specialist doctors Dhaka",
    "hospitals in Bangladesh",
    "diagnostic centers Bangladesh",
    "BMDC verified doctors",
    "appointment booking",
    "doctor appointment serial",
    "medical directory",
    "healthcare Bangladesh",
  ],
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://drchamber.info"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Doctor Directory - Find Verified Doctors & Hospitals in Bangladesh",
    description: "Search verified specialist doctors, compare hospital diagnostic test prices, check patient prep guidelines, and book appointments with confidence.",
    type: "website",
    locale: "en_BD",
    siteName: "Doctor Directory",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doctor Directory - Find Verified Doctors & Hospitals in Bangladesh",
    description: "Search verified specialist doctors, compare hospital diagnostic test prices, check patient prep guidelines, and book appointments with confidence.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  authors: [{ name: "Doctor Directory Team" }],
  creator: "Doctor Directory",
  publisher: "Doctor Directory",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NOTE: intentionally no auth()/DB calls here — keeping the root layout
  // free of dynamic data lets public pages prerender + ISR-cache for fast TTFB.
  // Navigation reads the session client-side via useSession().
  // Google Analytics 4 — override via NEXT_PUBLIC_GA_ID env if needed
  const gaId = "G-GE2QF417LX";

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>
          <Navigation />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </Providers>
        {/* Google tag (gtag.js) */}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
