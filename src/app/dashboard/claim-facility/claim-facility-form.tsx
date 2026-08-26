"use client";

import { useActionState, useState } from "react";
import { submitFacilityClaimAction } from "@/lib/actions/facility";
import {
  Building2,
  Phone,
  Mail,
  User,
  FileText,
  ShieldCheck,
  Upload,
  AlertCircle,
  Loader2,
  Check,
  Search,
} from "lucide-react";
import type { FormState } from "@/lib/form";

type FacilityItem = {
  id: number;
  name: string;
  type: string;
  phone: string | null;
  hotline: string | null;
  address: string | null;
  profileClaimed: boolean;
  upazila: {
    name: string;
    district: {
      name: string;
    };
  } | null;
};

type Props = {
  facilities: FacilityItem[];
  preselectedFacilityId: number | null;
  userEmail: string;
  userName: string;
  userPhone: string;
};

export default function ClaimFacilityForm({
  facilities,
  preselectedFacilityId,
  userEmail,
  userName,
  userPhone,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(preselectedFacilityId);
  const [searchQuery, setSearchQuery] = useState("");
  const [state, formAction, isPending] = useActionState<FormState | undefined, FormData>(
    submitFacilityClaimAction,
    undefined
  );

  const filteredFacilities = facilities.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.upazila?.name.toLowerCase().includes(q) ||
      f.upazila?.district?.name.toLowerCase().includes(q)
    );
  });

  const selectedFacility = facilities.find((f) => f.id === selectedId);

  return (
    <form action={formAction} className="space-y-6">
      {/* Error Message */}
      {state && !state.ok && state.message && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {/* 1. Facility Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Select Medical Institute / Hospital <span className="text-rose-500">*</span>
        </label>

        {selectedFacility ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 flex items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-lg bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800 uppercase mb-1">
                {selectedFacility.type}
              </span>
              <h4 className="text-sm font-bold text-slate-900">{selectedFacility.name}</h4>
              <p className="text-xs text-slate-600">
                {selectedFacility.upazila
                  ? `${selectedFacility.upazila.name}, ${selectedFacility.upazila.district.name}`
                  : selectedFacility.address || "Bangladesh"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Change
            </button>
            <input type="hidden" name="facilityId" value={selectedFacility.id} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospital or diagnostic center by name or city..."
                className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-inner">
              {filteredFacilities.slice(0, 30).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedId(f.id)}
                  className="w-full text-left p-3.5 hover:bg-teal-50/50 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{f.name}</span>
                    <span className="text-slate-500">
                      {f.type} · {f.upazila ? `${f.upazila.name}, ${f.upazila.district.name}` : f.address || "Bangladesh"}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                    Select
                  </span>
                </button>
              ))}

              {filteredFacilities.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No matching facilities found. Please check spelling or contact admin.
                </div>
              )}
            </div>
            {state?.fieldErrors?.facilityId && (
              <p className="text-xs font-semibold text-rose-600">{state.fieldErrors.facilityId}</p>
            )}
          </div>
        )}
      </div>

      {/* 2. Official Representative Information */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <User className="h-4 w-4 text-teal-600" />
          2. Your Representative & Authorization Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Your Designation / Official Role <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="designation"
              required
              placeholder="e.g. Managing Director, Hospital Admin, Desk Manager"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            {state?.fieldErrors?.designation && (
              <p className="text-xs text-rose-600">{state.fieldErrors.designation}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Official Contact Number / Hotline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="officialPhone"
              required
              defaultValue={userPhone || selectedFacility?.hotline || selectedFacility?.phone || ""}
              placeholder="e.g. 01711000000 or 09666787801"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            {state?.fieldErrors?.officialPhone && (
              <p className="text-xs text-rose-600">{state.fieldErrors.officialPhone}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Official Work Email
            </label>
            <input
              type="email"
              name="officialEmail"
              defaultValue={userEmail}
              placeholder="e.g. admin@popular.com.bd"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            {state?.fieldErrors?.officialEmail && (
              <p className="text-xs text-rose-600">{state.fieldErrors.officialEmail}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Trade License or DGHS Reg. Number
            </label>
            <input
              type="text"
              name="tradeLicenseNumber"
              placeholder="e.g. DGHS/LAB/2023/1234 or TRAD/DSCC/012345"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>

        {/* Verification Document URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Trade License Document Image / PDF Link
            </label>
            <input
              type="url"
              name="tradeLicenseImage"
              placeholder="https://drive.google.com/... or https://..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Authorization Letter / ID Card Link
            </label>
            <input
              type="url"
              name="authorizationLetter"
              placeholder="https://drive.google.com/... or https://..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <label className="block text-xs font-semibold text-slate-700">
            Additional Verification Notes
          </label>
          <textarea
            name="note"
            rows={3}
            placeholder="Provide any additional details or institutional email verification context..."
            className="w-full rounded-2xl border border-slate-300 p-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending || !selectedId}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-6 py-3.5 text-sm font-bold text-white shadow-xs hover:bg-teal-800 transition disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting Verification Claim...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Submit Hospital / Clinic Ownership Claim
            </>
          )}
        </button>
      </div>
    </form>
  );
}
