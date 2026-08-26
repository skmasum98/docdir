"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, MessageSquare, ArrowRight, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";
import { requestPasswordRecoveryAction, type RecoveryRequestResult } from "@/lib/actions/auth-recovery";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [result, setResult] = useState<RecoveryRequestResult | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append("identifier", identifier);
      formData.append("method", method);

      const res = await requestPasswordRecoveryAction(undefined, formData);
      setResult(res);
    });
  }

  return (
    <div className="space-y-6">
      {result && !result.ok && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900 flex items-start gap-2.5">
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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <h3 className="text-sm font-bold">Verification Code Sent!</h3>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {result.data.method === "WHATSAPP" ? (
                <>
                  We prepared a WhatsApp verification code for <strong>{result.data.maskedTarget}</strong>.
                  Click below to open WhatsApp with your code pre-formatted, or check your messages.
                </>
              ) : (
                <>
                  We sent a 6-digit verification code to <strong>{result.data.maskedTarget}</strong>.
                  Check your inbox and spam folder.
                </>
              )}
            </p>

            {/* In demo/preview mode or direct verification */}
            {result.data.otp && (
              <div className="rounded-xl bg-white/90 border border-emerald-300 p-3.5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-medium text-emerald-800">
                  <span>Your 6-Digit OTP:</span>
                  <span className="text-[10px] text-slate-500">Expires in 15 min</span>
                </div>
                <div className="font-mono text-2xl font-bold tracking-widest text-emerald-900 text-center py-1">
                  {result.data.otp}
                </div>
              </div>
            )}

            {result.data.method === "WHATSAPP" && result.data.whatsappUrl && (
              <a
                href={result.data.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <MessageSquare className="h-4 w-4" /> Open WhatsApp with OTP Code <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/reset-password?identifier=${encodeURIComponent(result.data?.identifier || "")}&otp=${result.data?.otp || ""}`
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Enter Verification Code & Set New Password <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setResult(null)}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Try a different email or phone
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Verification Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("EMAIL")}
                className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition ${
                  method === "EMAIL"
                    ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 text-indigo-950 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2 rounded-xl ${method === "EMAIL" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Email</p>
                  <p className="text-[10px] text-slate-500">Inbox OTP</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("WHATSAPP")}
                className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition ${
                  method === "WHATSAPP"
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 text-emerald-950 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2 rounded-xl ${method === "WHATSAPP" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">WhatsApp</p>
                  <p className="text-[10px] text-slate-500">Instant OTP</p>
                </div>
              </button>
            </div>
          </div>

          {/* Identifier Input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {method === "EMAIL" ? "Account Email Address" : "Registered Phone or Email"}
            </label>
            <input
              type={method === "EMAIL" ? "email" : "text"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder={method === "EMAIL" ? "doctor.name@example.com" : "e.g. 01700000000 or email"}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {method === "EMAIL"
                ? "We'll send a 6-digit password reset code to your registered email address."
                : "We'll send the verification PIN directly via WhatsApp message."}
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
