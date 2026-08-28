"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 mx-auto">
          <AlertTriangle className="h-8 w-8 text-rose-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Something Went Wrong
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          We encountered an unexpected error while loading this page. Please try again, or contact our support team if the problem persists.
        </p>

        {error.digest && (
          <p className="text-xs text-slate-400 font-mono bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition w-full sm:w-auto justify-center"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition w-full sm:w-auto justify-center"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
