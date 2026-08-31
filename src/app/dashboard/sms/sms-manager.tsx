"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Phone,
  Send,
  TrendingUp,
  Clock,
  Power,
  PowerOff,
  Copy,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  toggleSmsAction,
  sendTestSmsAction,
  initiateBkashTopupAction,

} from "@/lib/actions/sms";
import { SMS_PRICING_TIERS } from "@/lib/sms-pricing";

interface SmsStats {
  totalCredits: number;
  usedCredits: number;
  remaining: number;
  smsEnabled: boolean;
  lastTopupAt: string | null;
  autoDisableAt: string | null;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  credits: number;
  costBdt: number;
  status: string;
  description: string | null;
  bkashTrxId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function SmsManager({
  doctorId,
  doctorName,
  doctorPhone,
  stats,
  transactions,
}: {
  doctorId: number;
  doctorName: string;
  doctorPhone: string | null;
  stats: SmsStats;
  transactions: Transaction[];
}) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testPhone, setTestPhone] = useState(doctorPhone || "");
  const [showTopup, setShowTopup] = useState(false);
  const [selectedTier, setSelectedTier] = useState<{ credits: number; priceBdt: number; label: string } | null>(null);
  

  // Check bKash return URL
  useEffect(() => {
    const bkash = searchParams.get("bkash");
    // Defer setState to avoid cascading renders
    setTimeout(() => {
      if (bkash === "success") {
        const trxID = searchParams.get("trxID");
        const credits = searchParams.get("credits");
        setMessage({
          type: "success",
          text: `bKash payment successful! ${credits || ""} SMS credits added. TrxID: ${trxID}`,
        });
      } else if (bkash === "cancelled") {
        setMessage({ type: "error", text: "bKash payment was cancelled." });
      } else if (bkash === "failed") {
        const error = searchParams.get("error");
        setMessage({ type: "error", text: `bKash payment failed: ${error}` });
      } else if (bkash === "notfound") {
        setMessage({ type: "error", text: "Payment record not found. Please contact support." });
      } else if (bkash === "invalid") {
        setMessage({ type: "error", text: "Invalid payment callback." });
      }
    }, 0);
  }, [searchParams]);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  }

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleSmsAction(!stats.smsEnabled);
      if (result.success) {
        showMessage("success", result.message);
        setTimeout(() => window.location.reload(), 500);
      } else {
        showMessage("error", result.message);
      }
    });
  }

  function handleTest() {
    if (!testPhone) return;
    startTransition(async () => {
      const result = await sendTestSmsAction(testPhone);
      if (result.success) {
        showMessage("success", result.message + " (1 credit used)");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showMessage("error", result.message);
      }
    });
  }

  function handleBkashTopup() {
    if (!selectedTier) return;
    startTransition(async () => {
      const result = await initiateBkashTopupAction({
        credits: selectedTier.credits,
        costBdt: selectedTier.priceBdt,
      });
      if (result.success && result.data?.bkashURL) {
        showMessage("success", "Redirecting to bKash...");
        window.location.href = result.data.bkashURL;
      } else {
        showMessage("error", result.message);
      }
    });
  }

 

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showMessage("success", "Copied!");
  }

  const percentUsed = stats.totalCredits > 0 ? (stats.usedCredits / stats.totalCredits) * 100 : 0;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-2xl border p-3.5 text-sm flex items-start gap-2 ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-rose-200 bg-rose-50/80 text-rose-900"
          }`}
          role="alert"
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Status card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">SMS Service Status</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.smsEnabled
                ? "Active — Patients receive SMS for new bookings and queue updates"
                : stats.remaining <= 0
                ? "Disabled — Out of balance. Top up to reactivate."
                : "Disabled — Enable to send SMS to patients"}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isPending || (stats.smsEnabled === false && stats.remaining <= 0)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition shadow-sm shrink-0 ${
              stats.smsEnabled
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            } disabled:opacity-50`}
          >
            {stats.smsEnabled ? (
              <>
                <PowerOff className="h-4 w-4" />
                Disable SMS
              </>
            ) : (
              <>
                <Power className="h-4 w-4" />
                Enable SMS
              </>
            )}
          </button>
        </div>

        {stats.autoDisableAt && !stats.smsEnabled && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Auto-disabled on {new Date(stats.autoDisableAt).toLocaleString()} due to zero balance.</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-2xl bg-indigo-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700">Remaining</p>
            <p className="text-2xl font-extrabold text-indigo-900 mt-1">{stats.remaining}</p>
            <p className="text-[10px] text-indigo-600">credits</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Used</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.usedCredits}</p>
            <p className="text-[10px] text-slate-500">credits</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Total Topup</p>
            <p className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.totalCredits}</p>
            <p className="text-[10px] text-emerald-600">credits</p>
          </div>
          <div className="rounded-2xl bg-purple-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-700">Last Topup</p>
            <p className="text-sm font-bold text-purple-900 mt-1">
              {stats.lastTopupAt
                ? new Date(stats.lastTopupAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })
                : "—"}
            </p>
            <p className="text-[10px] text-purple-600">
              {stats.lastTopupAt ? new Date(stats.lastTopupAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
            </p>
          </div>
        </div>

        {stats.totalCredits > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Usage</span>
              <span className="font-semibold text-slate-900">{Math.round(percentUsed)}% used</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Test SMS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <header>
          <h2 className="text-base font-bold text-slate-900">Send Test SMS</h2>
          <p className="text-xs text-slate-500">Verify your SMS integration is working (uses 1 credit)</p>
        </header>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="01700000000"
              className="w-full rounded-2xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleTest}
            disabled={isPending || !testPhone || stats.remaining <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Send Test
          </button>
        </div>
      </section>

      {/* Top-up */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" /> Top Up Credits
            </h2>
            <p className="text-xs text-slate-500">Pay via bKash to add SMS credits to your account</p>
          </div>
          {!showTopup && (
            <button
              onClick={() => setShowTopup(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition"
            >
              <CreditCard className="h-4 w-4" />
              Buy Credits
            </button>
          )}
        </div>

        {showTopup && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Choose a package</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SMS_PRICING_TIERS.map((tier) => (
                <button
                  key={tier.credits}
                  onClick={() => setSelectedTier(tier)}
                  className={`rounded-2xl border p-3 text-center transition ${
                    selectedTier?.credits === tier.credits
                      ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">{tier.credits} SMS</p>
                  <p className="text-base font-extrabold text-indigo-700 mt-1">৳{tier.priceBdt}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">৳{(tier.priceBdt / tier.credits).toFixed(2)}/SMS</p>
                </button>
              ))}
            </div>

            {selectedTier && (
              <div className="rounded-2xl border-2 border-pink-200 bg-pink-50/50 p-4 space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-pink-900 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Pay via bKash
                  </p>
                  <ol className="text-xs text-slate-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Click &ldquo;Pay with bKash&rdquo; below</li>
                    <li>You&apos;ll be redirected to bKash payment page</li>
                    <li>Enter your bKash PIN to complete payment</li>
                    <li>You&apos;ll be redirected back here with {selectedTier.credits} credits added</li>
                  </ol>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleBkashTopup}
                    disabled={isPending}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pink-700 transition shadow-sm disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        Pay ৳{selectedTier.priceBdt} with bKash
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowTopup(false);
                      setSelectedTier(null);
                    }}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>

                
              </div>
            )}
          </div>
        )}
      </section>

      {/* Transaction history */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
        <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-2 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-600">Type</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600">Credits</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600">Amount</th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-2.5 text-slate-600">
                      {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                      <span className="text-slate-400 ml-1">
                        {new Date(tx.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          tx.type === "TOPUP"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-50 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {tx.type}
                      </span>
                      {tx.description && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{tx.description}</p>
                      )}
                    </td>
                    <td
                      className={`px-2 py-2.5 text-right font-bold ${
                        tx.credits > 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {tx.credits > 0 ? "+" : ""}
                      {tx.credits}
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold text-slate-700">
                      ৳{Math.abs(tx.costBdt).toFixed(2)}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === "FAILED"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Info banner */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <span>ℹ️</span> How SMS credits work
        </p>
        <ul className="list-disc list-inside space-y-0.5 ml-5 text-slate-700">
          <li>Each booking confirmation or queue update costs 1 SMS credit</li>
          <li>When your balance reaches 0, SMS is auto-disabled (emails continue free)</li>
          <li>Top up via bKash — credits never expire</li>
          <li>Only ৳0.50 per SMS — much cheaper than traditional SMS gateways</li>
        </ul>
      </div>
    </div>
  );
}
