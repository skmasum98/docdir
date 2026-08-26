"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { resetPasswordWithOtpAction } from "@/lib/actions/auth-recovery";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get("identifier") || "";
  const initialOtp = searchParams.get("otp") || "";

  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState(initialOtp);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("identifier", identifier.trim());
      formData.append("otp", otp.trim());
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const res = await resetPasswordWithOtpAction(undefined, formData);
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?resetSuccess=1");
        }, 2000);
      } else {
        setErrorMessage(res.message || "Failed to reset password.");
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h3 className="text-base font-bold text-emerald-950">Password Changed Successfully!</h3>
        <p className="text-xs text-emerald-800 leading-relaxed">
          Your credentials have been securely updated. Redirecting you to the sign in page...
        </p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Account Email / Phone
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          placeholder="your.email@example.com"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            6-Digit Verification Code (OTP)
          </label>
          <Link
            href="/forgot-password"
            className="text-[11px] font-semibold text-indigo-600 hover:underline"
          >
            Resend Code
          </Link>
        </div>
        <div className="relative">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ""))}
            required
            maxLength={8}
            placeholder="e.g. 849201"
            className="w-full font-mono text-center tracking-widest text-lg font-bold rounded-2xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          New Password (min 8 characters)
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm pr-10 focus:border-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Confirm New Password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          placeholder="••••••••"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !identifier.trim() || !otp.trim() || !newPassword}
        className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 shadow-xs"
      >
        {isPending ? "Resetting Password..." : "Set New Password & Finish"}
      </button>

      <div className="pt-2 text-center text-xs text-slate-500">
        Already remembered?{" "}
        <Link href="/login" className="font-semibold text-slate-800 hover:underline">
          Return to Sign In
        </Link>
      </div>
    </form>
  );
}
