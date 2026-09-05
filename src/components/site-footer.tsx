import Link from "next/link";
import { Search, FlaskConical, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="min-w-0">
            <Link
              href="/"
              className="text-base font-bold tracking-tight text-slate-900"
            >
              Doctor Directory
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
              Find verified specialist doctors, hospitals &amp; diagnostic
              centers across Bangladesh. Compare test prices and book
              appointments with confidence.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              BMDC verification checked where available
            </p>
          </div>

          {/* Explore */}
          <nav aria-label="Explore">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition hover:text-slate-900"
                >
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  Find Doctors
                </Link>
              </li>
              <li>
                <Link
                  href="/facilities"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition hover:text-slate-900"
                >
                  <FlaskConical className="h-3.5 w-3.5 text-slate-400" />
                  Hospitals &amp; Labs
                </Link>
              </li>
              <li>
                <Link
                  href="/search?verified=1"
                  className="text-slate-600 transition hover:text-slate-900"
                >
                  Verified doctors
                </Link>
              </li>
            </ul>
          </nav>

          {/* Account */}
          <nav aria-label="Account">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Account
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-slate-600 transition hover:text-slate-900"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-slate-600 transition hover:text-slate-900"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-600 transition hover:text-slate-900"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Legal
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Information on this site is for guidance only and is not a
              substitute for professional medical advice.
            </p>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p><Link href="https://thewebpal.com" target="_blank">TheWebPal</Link> &copy; {year}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="transition hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>
            <Link href="/search" className="transition hover:text-slate-900">
              Doctors
            </Link>
            <Link
              href="/facilities"
              className="transition hover:text-slate-900"
            >
              Hospitals
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
