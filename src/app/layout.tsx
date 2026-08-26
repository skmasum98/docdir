import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Providers } from "./providers";
import SignOutButton from "./sign-out-button";
import { UserAvatar } from "@/components/user-avatar";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>
          <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
              <Link href="/" className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                Doctor Directory
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 text-sm">
                <Link
                  href="/search"
                  className="rounded-2xl border border-slate-200 px-3.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Find Doctors
                </Link>
                <Link
                  href="/facilities"
                  className="rounded-2xl border border-teal-200 bg-teal-50/70 px-3.5 py-1.5 font-semibold text-teal-900 hover:bg-teal-100 transition shadow-2xs"
                >
                  Hospitals & Labs
                </Link>
                {role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 font-medium text-emerald-900 hover:bg-emerald-100 transition"
                  >
                    Admin
                  </Link>
                )}
                {(role === "ADMIN" || role === "DOCTOR" || role === "FACILITY_ADMIN") && (
                  <Link
                    href="/dashboard"
                    className="rounded-2xl border border-indigo-300 bg-indigo-50 px-3.5 py-1.5 font-medium text-indigo-900 hover:bg-indigo-100 transition"
                  >
                    Dashboard
                  </Link>
                )}
                {session?.user ? (
                  <div className="flex items-center gap-3 pl-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 rounded-2xl hover:bg-slate-100/80 p-1 transition"
                      title="Your Account"
                    >
                      <UserAvatar
                        src={dbUserImage || session.user.image}
                        name={session.user.name}
                        size="sm"
                      />
                      <span className="hidden text-slate-700 font-medium text-xs sm:inline">
                        {session.user.name || session.user.email}
                      </span>
                    </Link>
                    <SignOutButton />
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-2xl border border-slate-300 px-4 py-2 font-medium text-slate-900 hover:bg-slate-50 transition"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-2xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800 transition"
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
