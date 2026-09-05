"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCheck, Info, CheckCircle2, ShieldCheck, ArrowRight, X, PhoneCall, Sparkles, Clock, FileCheck } from "lucide-react";

interface DoctorClaimBannerProps {
  doctorId: number;
  doctorName: string;
}

export function DoctorClaimBanner({ doctorId, doctorName }: DoctorClaimBannerProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="rounded-3xl border border-amber-200/90 bg-linear-to-r from-amber-50/90 via-amber-50/50 to-orange-50/60 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950">
              Are you Dr. {doctorName}?
            </h3>
            <p className="text-xs text-amber-900/80">
              Claim this profile to take ownership of your chambers, consultation fees, visiting hours, and patient bookings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white/80 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-white transition"
          >
            <Info className="h-3.5 w-3.5" />
            {showInstructions ? "Hide Guide" : "How to Claim"}
          </button>

          <Link
            href={`/dashboard/claim?doctorId=${doctorId}`}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-900 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-950 transition shadow-xs"
          >
            <span>Claim Profile</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Expandable Step-by-Step Instructions */}
      {showInstructions && (
        <div className="mt-4 pt-4 border-t border-amber-200/80 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Simple 4-Step Claim Process</span>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-amber-800 hover:text-amber-950 text-xs font-medium"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white/90 border border-amber-100 p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                  1
                </span>
                <UserCheck className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">1. Select Profile</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Click &quot;Claim Profile&quot; and sign in to your Doctor Directory account.
              </p>
            </div>

            <div className="rounded-2xl bg-white/90 border border-amber-100 p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                  2
                </span>
                <FileCheck className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">2. Provide BMDC ID</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Enter your BMDC registration number and optional ID card photo for quick verification.
              </p>
            </div>

            <div className="rounded-2xl bg-white/90 border border-amber-100 p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                  3
                </span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">3. Rapid Review</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Our verification team reviews medical credentials within 12-24 hours.
              </p>
            </div>

            <div className="rounded-2xl bg-white/90 border border-amber-100 p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                  4
                </span>
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">4. Live Management</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Update fees, edit visiting hours, publish health blogs, and link hospital chambers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-100/60 px-4 py-2.5 text-xs text-amber-950">
            <span className="font-medium">
              Need urgent claim assistance or help with verification?
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/8801924810590?text=Hello,%20I%20am%20a%20doctor%20and%20need%20assistance%20claiming%20my%20profile"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-amber-900 hover:text-amber-950"
              >
                WhatsApp Doctor Helpline →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
