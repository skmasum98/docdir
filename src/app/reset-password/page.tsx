import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import ResetPasswordForm from "./reset-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password | Doctor Directory Bangladesh",
  description: "Enter your verification code and choose a new secure password.",
  robots: { index: false, follow: true },
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 shrink-0">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Set New Password</h1>
              <p className="text-xs text-slate-500">Enter OTP & choose a secure password</p>
            </div>
          </div>

          <Suspense fallback={<div className="py-8 text-center text-xs text-slate-400">Loading form...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>Encrypted with bcrypt & secured against brute force attempts</span>
        </div>
      </div>
    </main>
  );
}
