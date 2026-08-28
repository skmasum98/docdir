import Link from "next/link";
import { Home, Search, Building2, Phone } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | Doctor Directory",
  description: "The page you are looking for could not be found. Browse verified doctors, hospitals, and diagnostic centers in Bangladesh.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl sm:text-8xl font-extrabold text-slate-200">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Page Not Found
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Sorry, we couldn&apos;t find the doctor, hospital, or diagnostic center you&apos;re looking for. The link may be broken or the page may have been moved.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
          >
            <Search className="h-4 w-4" />
            Find Doctors
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-3">Or explore:</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/facilities"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Building2 className="h-3.5 w-3.5" />
              Hospitals
            </Link>
            <a
              href="tel:+8801700000000"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Phone className="h-3.5 w-3.5" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
