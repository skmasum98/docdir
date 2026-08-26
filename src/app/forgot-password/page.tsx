import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata = {
  title: "Recover Password | Doctor Directory",
  description: "Reset your Doctor Directory account password via Email or WhatsApp OTP verification.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Password Recovery</h1>
              <p className="text-xs text-slate-500">Verify your identity via Email or WhatsApp</p>
            </div>
          </div>

          <ForgotPasswordForm />
        </div>

        <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
          <span>Secure 256-bit encrypted authentication & credential protection</span>
        </div>
      </div>
    </main>
  );
}
