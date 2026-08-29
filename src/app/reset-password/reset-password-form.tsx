"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { resetPasswordWithOtpAction } from "@/lib/actions/auth-recovery";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get("identifier") || "";

  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  function handleOtpChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtpDigits((prev) => {
      const newDigits = [...prev];
      newDigits[index] = digit;
      return newDigits;
    });

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    // Backspace: clear current and focus previous
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Arrow keys navigation
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || "";
      }
      setOtpDigits(newDigits);
      // Focus last filled input or first empty
      const lastIndex = Math.min(pastedData.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  }

  function getOtpString() {
    return otpDigits.join("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const otpString = getOtpString();
    if (otpString.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

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
      formData.append("otp", otpString);
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
        // Clear OTP on failure for security
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900 flex items-start gap-2" role="alert">
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label htmlFor="identifier" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Account Email or Phone
        </label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoComplete="username"
          placeholder="your.email@example.com"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            6-Digit Verification Code
          </label>
          <Link
            href="/forgot-password"
            className="text-[11px] font-semibold text-indigo-600 hover:underline"
          >
            Resend Code
          </Link>
        </div>
        <div className="flex gap-2 sm:gap-2.5 justify-between" dir="ltr">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={index === 0 ? handleOtpPaste : undefined}
              required
              autoComplete="one-time-code"
              aria-label={`Digit ${index + 1} of verification code`}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border-2 border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-500 text-center">
          Check your {identifier.includes("@") ? "email" : "WhatsApp"} for the 6-digit code
        </p>
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          New Password (min 8 characters)
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm pr-10 focus:border-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !identifier.trim() || getOtpString().length !== 6 || !newPassword}
        className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 shadow-xs"
      >
        {isPending ? "Resetting Password..." : "Set New Password & Finish"}
      </button>

      <div className="pt-2 text-center text-xs text-slate-500">
        <Link href="/forgot-password" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-800">
          <ArrowLeft className="h-3 w-3" />
          Back to Request Code
        </Link>
      </div>
    </form>
  );
}
