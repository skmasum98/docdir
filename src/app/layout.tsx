import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Providers } from "./providers";
import SignOutButton from "./sign-out-button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doctor Directory",
  description: "Find verified doctors, hospitals and specialties near you.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = session?.user?.role;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>
          <header className="border-b border-slate-200 bg-white">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-semibold text-slate-900">
                Doctor Directory
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/search"
                  className="rounded-2xl border border-slate-300 px-4 py-2 font-medium text-slate-900 hover:bg-slate-50"
                >
                  Search
                </Link>
                {role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 font-medium text-emerald-900 hover:bg-emerald-100"
                  >
                    Admin
                  </Link>
                )}
                {(role === "ADMIN" || role === "DOCTOR") && (
                  <Link
                    href="/dashboard"
                    className="rounded-2xl border border-indigo-300 bg-indigo-50 px-4 py-2 font-medium text-indigo-900 hover:bg-indigo-100"
                  >
                    Dashboard
                  </Link>
                )}
                {session?.user ? (
                  <>
                    <span className="hidden text-slate-500 sm:inline">
                      {session.user.email}
                    </span>
                    <SignOutButton />
                  </>
                  ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-2xl border border-slate-300 px-4 py-2 font-medium text-slate-900 hover:bg-slate-50"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-2xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-500">
              Doctor Directory &copy; {new Date().getFullYear()}
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
