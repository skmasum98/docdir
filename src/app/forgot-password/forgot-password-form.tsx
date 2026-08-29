"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, MessageSquare, ArrowRight, CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { requestPasswordRecoveryAction, type RecoveryRequestResult } from "@/lib/actions/auth-recovery";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [result, setResult] = useState<RecoveryRequestResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (resendCooldown > 0) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("identifier", identifier);
      formData.append("method", method);

      const res = await requestPasswordRecoveryAction(undefined, formData);
      setResult(res);

      if (res.ok) {
        setResendCooldown(60); // 60-second cooldown before resend
      } else if (res.data?.retryAfter) {
        setResendCooldown(res.data.retryAfter);
      }
    });
  }

  function handleResend() {
    if (resendCooldown > 0) return;
    handleSubmit(new Event("submit") as any);
  }

  return (
    <div className="space-y-6">
      {result && !result.ok && result.message && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900 flex items-start gap-2.5" role="alert">
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{result.message}</p>
            {result.fieldErrors?.identifier && (
              <p className="mt-0.5 text-rose-700">{result.fieldErrors.identifier}</p>
            )}
          </div>
        </div>
      )}

      {result && result.ok && result.data ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950 space-y-3" role="status">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <h3 className="text-sm font-bold">Verification Code Sent!</h3>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {result.data.method === "WHATSAPP" ? (
                <>
                  We sent a 6-digit verification code to your WhatsApp number{" "}
                  <strong>{result.data.maskedTarget}</strong>. Please check your WhatsApp messages and enter the code below.
                </>
              ) : (
                <>
                  We sent a 6-digit verification code to <strong>{result.data.maskedTarget}</strong>. 
                  Please check your inbox (and spam folder) and enter the code on the next page.
                </>
              )}
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-white/60 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-800">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Code expires in {result.data.expiresMinutes || 15} minutes</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/reset-password?identifier=${encodeURIComponent(result.data?.identifier || "")}`
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Enter Verification Code & Set New Password <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isPending}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Didn't receive it? Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setResendCooldown(0);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              ← Try different email/phone
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Method Selector */}
          <fieldset>
            <legend className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Verification Channel
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("EMAIL")}
                className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition ${
                  method === "EMAIL"
                    ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 text-indigo-950 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                aria-pressed={method === "EMAIL"}
              >
                <div className={`p-2 rounded-xl ${method === "EMAIL" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Email</p>
                  <p className="text-[10px] text-slate-500">Inbox OTP</p>
                </div>
              </button>

              {/* <button
                type="button"
                onClick={() => setMethod("WHATSAPP")}
                className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition ${
                  method === "WHATSAPP"
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 text-emerald-950 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                aria-pressed={method === "WHATSAPP"}
              >
                <div className={`p-2 rounded-xl ${method === "WHATSAPP" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">WhatsApp</p>
                  <p className="text-[10px] text-slate-500">Instant OTP</p>
                </div>
              </button> */}
            </div>
          </fieldset>

          {/* Identifier Input */}
          <div>
            <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-slate-700">
              {method === "EMAIL" ? "Account Email Address" : "Registered Phone Number"}
            </label>
            <input
              id="identifier"
              type={method === "EMAIL" ? "email" : "tel"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete={method === "EMAIL" ? "email" : "tel"}
              placeholder={method === "EMAIL" ? "doctor.name@example.com" : "e.g. 01700000000"}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-slate-400 shrink-0" />
              {method === "EMAIL"
                ? "We'll send a 6-digit password reset code to your registered email."
                : "We'll send the verification PIN via WhatsApp message."}
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || !identifier.trim()}
            className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 shadow-xs"
          >
            {isPending ? "Sending Verification Code..." : `Send ${method === "EMAIL" ? "Email" : "WhatsApp"} Code`}
          </button>

          <div className="pt-2 text-center text-xs text-slate-500">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
