import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Providers } from "./providers";
import { Navigation } from "@/components/navigation";
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
  const session = await auth();
  const role = session?.user?.role;

  let dbUserImage: string | null = null;
  if (session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { image: true },
    });
    dbUserImage = u?.image ?? null;
  }

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>
          <Navigation session={session} role={role} dbUserImage={dbUserImage} />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm text-slate-500">
              Doctor Directory &copy; {new Date().getFullYear()}
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
