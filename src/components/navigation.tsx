"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import SignOutButton from "@/app/sign-out-button";

interface NavigationProps {
  session: any;
  role?: string;
  dbUserImage: string | null;
}

export function Navigation({ session, role, dbUserImage }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
        <Link href="/" className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2 shrink-0">
          Doctor Chamber
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 text-sm">
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
              className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
            >
              Admin
            </Link>
          )}
          {session?.user && (
            <Link
              href="/dashboard"
              className="rounded-2xl border border-indigo-300 bg-indigo-50 px-3.5 py-1.5 font-semibold text-indigo-900 hover:bg-indigo-100 transition shadow-2xs"
            >
              {role === "DOCTOR"
                ? "Doctor Portal"
                : role === "FACILITY_ADMIN"
                ? "Hospital Portal"
                : "Dashboard"}
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-slate-200 bg-white animate-in slide-in-from-top duration-200">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/search"
              className="block rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Search className="inline h-4 w-4 mr-2" />
              Find Doctors
            </Link>
            <Link
              href="/facilities"
              className="block rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-3 font-semibold text-teal-900 transition shadow-2xs"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hospitals & Labs
            </Link>
            {role === "ADMIN" && (
              <Link
                href="/admin"
                className="block rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            {session?.user && (
              <Link
                href="/dashboard"
                className="block rounded-2xl border border-indigo-300 bg-indigo-50 px-4 py-3 font-semibold text-indigo-900 hover:bg-indigo-100 transition shadow-2xs"
                onClick={() => setMobileMenuOpen(false)}
              >
                {role === "DOCTOR"
                  ? "Doctor Portal"
                  : role === "FACILITY_ADMIN"
                  ? "Hospital Portal"
                  : "My Dashboard"}
              </Link>
            )}
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block flex items-center gap-3 rounded-2xl p-3 hover:bg-slate-50 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserAvatar
                    src={dbUserImage || session.user.image}
                    name={session.user.name}
                    size="md"
                  />
                  <span className="text-slate-700 font-medium">
                    {session.user.name || session.user.email}
                  </span>
                </Link>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full text-center rounded-2xl border border-slate-300 px-4 py-3 font-medium text-slate-900 hover:bg-slate-50 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
